import { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { getApiErrorMessage } from '../../api/authApi';
import { getFarmerEvidence, uploadFarmerEvidence } from '../../api/evidenceApi';
import { getFarmerFarms } from '../../api/farmerApi';
import { AppButton } from '../../components/AppButton';
import { LiveEvidenceCaptureCard } from '../../components/evidence/LiveEvidenceCaptureCard';
import { EvidenceCapturedPreview } from '../../components/evidence/EvidenceCapturedPreview';
import { ScreenHeader } from '../../components/ScreenHeader';
import { FARMER_UPLOAD_EVIDENCE_OPTIONS, getDefaultFarmerEvidenceCategory, getFarmerEvidenceFormTitle, type FarmerEvidenceCategoryKey } from '../../constants/evidenceCategories';
import { useLiveEvidenceCapture } from '../../hooks/useLiveEvidenceCapture';
import type { FarmerStackParamList } from '../../navigation/types';
import { dashboardTheme } from '../../theme/bhuguardDashboardTheme';
import { extractList, type ApiRecord } from '../../utils/apiHelpers';
import { appendFarmerEvidenceFields } from '../../utils/liveEvidenceCapture';
import { getFarmLocationLabel, mapFarmRecord } from '../../utils/farmMapHelpers';

interface FarmerLiveEvidenceUploadScreenProps {
  screenKey: string;
  farmId?: number;
  weeklyUpdateId?: number;
}

type Nav = NativeStackNavigationProp<FarmerStackParamList>;

interface FarmOption {
  id: number;
  name: string;
  subtitle: string;
}

export function FarmerLiveEvidenceUploadScreen({
  screenKey,
  farmId: initialFarmId,
  weeklyUpdateId,
}: FarmerLiveEvidenceUploadScreenProps) {
  const navigation = useNavigation<Nav>();
  const title = getFarmerEvidenceFormTitle(screenKey);
  const liveEvidence = useLiveEvidenceCapture({
    defaultName: 'farmer-evidence.jpg',
    allowsEditing: false,
    requireConfirm: true,
  });
  const [farms, setFarms] = useState<FarmOption[]>([]);
  const [selectedFarmId, setSelectedFarmId] = useState<number | null>(initialFarmId ?? null);
  const [category, setCategory] = useState<FarmerEvidenceCategoryKey>(getDefaultFarmerEvidenceCategory(screenKey));
  const [notes, setNotes] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadedCount, setUploadedCount] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [loadingFarms, setLoadingFarms] = useState(true);

  const loadFarms = useCallback(async () => {
    setLoadingFarms(true);

    try {
      const data = await getFarmerFarms();
      const records = extractList(data as ApiRecord, ['farms']);
      const options = records
        .map((record) => {
          const farm = mapFarmRecord(record);

          return {
            id: farm.id,
            name: farm.name,
            subtitle: getFarmLocationLabel(record),
          };
        })
        .filter((farm) => farm.id > 0);

      setFarms(options);

      if (initialFarmId && options.some((farm) => farm.id === initialFarmId)) {
        setSelectedFarmId(initialFarmId);
      } else {
        setSelectedFarmId((current) => current ?? (options.length === 1 ? options[0].id : null));
      }
    } catch (err) {
      setError(getApiErrorMessage(err, 'Failed to load farms.'));
    } finally {
      setLoadingFarms(false);
    }
  }, [initialFarmId]);

  const loadEvidenceCount = useCallback(async () => {
    try {
      const data = await getFarmerEvidence();
      const items = extractList(data as ApiRecord, ['evidence', 'evidence_uploads']);
      setUploadedCount(items.length);
    } catch {
      setUploadedCount(0);
    }
  }, []);

  useEffect(() => {
    void loadFarms();
    void loadEvidenceCount();
  }, [loadEvidenceCount, loadFarms]);

  const selectedFarm = useMemo(
    () => farms.find((farm) => farm.id === selectedFarmId) ?? null,
    [farms, selectedFarmId],
  );

  const uploadEvidence = async () => {
    if (!selectedFarmId) {
      setError('Please select a farm before uploading evidence.');
      return;
    }

    if (!liveEvidence.evidence) {
      setError('Capture a live photo before uploading.');
      return;
    }

    setUploading(true);
    setError(null);

    try {
      const formData = new FormData();
      appendFarmerEvidenceFields(formData, liveEvidence.evidence);
      formData.append('farm_id', String(selectedFarmId));
      formData.append('category', category);

      if (weeklyUpdateId) {
        formData.append('weekly_update_id', String(weeklyUpdateId));
      }

      if (notes.trim()) {
        formData.append('notes', notes.trim());
      }

      await uploadFarmerEvidence(formData);
      liveEvidence.clearEvidence();
      setNotes('');
      await loadEvidenceCount();

      Alert.alert('Evidence Uploaded Successfully', 'Your live photo evidence was saved successfully.');
    } catch (err) {
      setError(getApiErrorMessage(err, 'Evidence Upload Failed'));
    } finally {
      setUploading(false);
    }
  };

  const displayError = error ?? liveEvidence.error;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScreenHeader title={title} subtitle="Live camera evidence with GPS" />
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>Saved evidence</Text>
          <Text style={styles.summaryText}>{uploadedCount} file{uploadedCount === 1 ? '' : 's'} on server</Text>
        </View>

        <Text style={styles.label}>Select farm</Text>
        <View style={styles.farmList}>
          {loadingFarms ? (
            <Text style={styles.muted}>Loading farms...</Text>
          ) : farms.length === 0 ? (
            <Text style={styles.muted}>Add a farm before uploading evidence.</Text>
          ) : (
            farms.map((farm) => {
              const active = farm.id === selectedFarmId;

              return (
                <Pressable
                  key={farm.id}
                  style={[styles.farmChip, active && styles.farmChipActive]}
                  onPress={() => setSelectedFarmId(farm.id)}
                >
                  <Text style={[styles.farmChipTitle, active && styles.farmChipTitleActive]}>{farm.name}</Text>
                  <Text style={styles.farmChipSubtitle}>{farm.subtitle}</Text>
                </Pressable>
              );
            })
          )}
        </View>

        {selectedFarm ? (
          <Text style={styles.selectedFarm}>Uploading for: {selectedFarm.name}</Text>
        ) : null}

        <Text style={styles.label}>Evidence type</Text>
        <View style={styles.categoryRow}>
          {FARMER_UPLOAD_EVIDENCE_OPTIONS.map((opt) => {
            const active = opt.key === category;

            return (
              <Pressable
                key={opt.key}
                style={[styles.categoryChip, active && styles.categoryChipActive]}
                onPress={() => setCategory(opt.key)}
              >
                <Text style={[styles.categoryChipText, active && styles.categoryChipTextActive]}>{opt.label}</Text>
              </Pressable>
            );
          })}
        </View>

        <LiveEvidenceCaptureCard
          evidence={liveEvidence.evidence}
          pendingEvidence={liveEvidence.pendingEvidence}
          capturing={liveEvidence.capturing}
          uploading={uploading}
          error={displayError}
          onOpenCamera={() => void liveEvidence.captureEvidence()}
          onRetake={() => void liveEvidence.retakeEvidence()}
          onConfirmPending={() => liveEvidence.confirmPending()}
          onRejectPending={() => liveEvidence.rejectPending()}
          onUpload={() => void uploadEvidence()}
          uploadLabel="Upload Photo"
          showUploadButton
          hideInlinePreview
        />

        {liveEvidence.evidence || liveEvidence.pendingEvidence ? (
          <EvidenceCapturedPreview evidence={(liveEvidence.pendingEvidence ?? liveEvidence.evidence)!} />
        ) : null}

        <TextInput
          style={styles.notesInput}
          value={notes}
          onChangeText={setNotes}
          placeholder="Optional notes"
          placeholderTextColor={dashboardTheme.outline}
          multiline
        />

        <AppButton label="View all evidence" variant="secondary" onPress={() => navigation.goBack()} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: dashboardTheme.background },
  container: { padding: dashboardTheme.marginMobile, gap: 14, paddingBottom: 40 },
  summaryCard: {
    backgroundColor: dashboardTheme.surfaceLowest,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: dashboardTheme.outlineVariant,
    gap: 4,
  },
  summaryTitle: { fontSize: 15, fontWeight: '700', color: dashboardTheme.headingGreen },
  summaryText: { fontSize: 13, color: dashboardTheme.onSurfaceVariant },
  label: { fontSize: 13, fontWeight: '700', color: dashboardTheme.onSurface },
  farmList: { gap: 8 },
  muted: { fontSize: 13, color: dashboardTheme.onSurfaceVariant },
  farmChip: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: dashboardTheme.outlineVariant,
    backgroundColor: dashboardTheme.surfaceLowest,
    padding: 12,
    gap: 2,
  },
  farmChipActive: {
    borderColor: dashboardTheme.primary,
    backgroundColor: dashboardTheme.primaryContainer,
  },
  farmChipTitle: { fontSize: 14, fontWeight: '700', color: dashboardTheme.onSurface },
  farmChipTitleActive: { color: dashboardTheme.onPrimaryContainer },
  farmChipSubtitle: { fontSize: 12, color: dashboardTheme.onSurfaceVariant },
  selectedFarm: { fontSize: 12, fontWeight: '600', color: dashboardTheme.primary },
  categoryRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  categoryChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: dashboardTheme.outlineVariant,
    backgroundColor: dashboardTheme.surfaceLowest,
  },
  categoryChipActive: {
    borderColor: dashboardTheme.primary,
    backgroundColor: dashboardTheme.primaryContainer,
  },
  categoryChipText: { fontSize: 12, fontWeight: '600', color: dashboardTheme.onSurfaceVariant },
  categoryChipTextActive: { color: dashboardTheme.onPrimaryContainer },
  notesInput: {
    backgroundColor: dashboardTheme.surfaceLowest,
    borderWidth: 1,
    borderColor: dashboardTheme.outlineVariant,
    borderRadius: 12,
    padding: 12,
    minHeight: 46,
    color: dashboardTheme.onSurface,
  },
});
