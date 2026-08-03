import { useCallback, useMemo, useState } from 'react';
import { Alert, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { getApiErrorMessage } from '../../api/authApi';
import { getOfficerArtisan, updateOfficerArtisanWorkingVillages } from '../../api/fieldOfficerApi';
import { AppButton } from '../../components/AppButton';
import { OfficerListState } from '../../components/officer/OfficerListState';
import { OfficerScreenChrome } from '../../components/officer/OfficerScreenChrome';
import { ScreenHeader } from '../../components/ScreenHeader';
import { WorkingAreaSelector, type WorkingAreaEntry } from '../../components/officer/WorkingAreaSelector';
import type { FieldOfficerStackParamList } from '../../navigation/types';
import { officerCardShadow, officerTheme } from '../../theme/officerDashboardTheme';
import { pickString, type ApiRecord } from '../../utils/apiHelpers';
import { formatStatusLabel } from '../../utils/statusLabels';

type Props = NativeStackScreenProps<FieldOfficerStackParamList, 'ArtisanDetail'>;

export function ArtisanDetailScreen({ route }: Props) {
  const { artisanId } = route.params;
  const [artisan, setArtisan] = useState<ApiRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingWorkingArea, setEditingWorkingArea] = useState(false);
  const [savingWorkingArea, setSavingWorkingArea] = useState(false);
  const [workingAreaEntries, setWorkingAreaEntries] = useState<WorkingAreaEntry[]>([]);

  const load = useCallback(
    async (silent = false) => {
      if (silent) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError(null);

      try {
        const data = await getOfficerArtisan(artisanId);
        setArtisan(data.artisan);
      } catch (err) {
        setError(getApiErrorMessage(err, 'Failed to load artisan details.'));
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [artisanId],
  );

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  const workingVillages = useMemo(() => {
    const list = Array.isArray(artisan?.working_villages) ? (artisan?.working_villages as ApiRecord[]) : [];
    return list
      .map((item) => pickString(item, 'name'))
      .filter((name) => name && name !== '-');
  }, [artisan]);

  const startEditWorkingArea = () => {
    // Seed one entry per taluka already on file so re-opening the editor and adding
    // more villages MERGES with the existing working area instead of replacing it.
    const villages = Array.isArray(artisan?.working_villages) ? (artisan?.working_villages as ApiRecord[]) : [];
    const byTaluka = new Map<number, WorkingAreaEntry>();

    for (const item of villages) {
      const talukaId = Number(item.taluka_id);
      const villageId = Number(item.id);
      if (!Number.isFinite(talukaId) || talukaId <= 0 || !Number.isFinite(villageId) || villageId <= 0) {
        continue;
      }

      const villageName = pickString(item, 'name');
      const existing = byTaluka.get(talukaId);

      if (existing) {
        existing.villageIds.push(villageId);
        existing.villageNames.push(villageName !== '-' ? villageName : `Village ${villageId}`);
        continue;
      }

      const districtId = Number(item.district_id);

      byTaluka.set(talukaId, {
        talukaId,
        talukaName: pickString(item, 'taluka_name') !== '-' ? pickString(item, 'taluka_name') : `Taluka ${talukaId}`,
        districtId: Number.isFinite(districtId) && districtId > 0 ? districtId : undefined,
        districtName: pickString(item, 'district_name') !== '-' ? pickString(item, 'district_name') : undefined,
        villageIds: [villageId],
        villageNames: [villageName !== '-' ? villageName : `Village ${villageId}`],
      });
    }

    setWorkingAreaEntries(Array.from(byTaluka.values()));
    setEditingWorkingArea(true);
  };

  const saveWorkingArea = async () => {
    if (workingAreaEntries.length === 0) {
      Alert.alert('Working area required', 'Add at least one taluka and village to the working area.');
      return;
    }

    const allVillageIds = workingAreaEntries.flatMap((entry) => entry.villageIds);
    // working_taluka_id is a single-taluka filter on the backend; only send it when the
    // working area is confined to one taluka so multi-taluka merges are not rejected.
    const singleTalukaId = workingAreaEntries.length === 1 ? workingAreaEntries[0].talukaId : undefined;

    setSavingWorkingArea(true);
    try {
      const data = await updateOfficerArtisanWorkingVillages(artisanId, {
        working_village_ids: allVillageIds,
        working_taluka_id: singleTalukaId,
      });
      setArtisan(data.artisan);
      setEditingWorkingArea(false);
      Alert.alert('Updated', 'Working villages saved successfully.');
    } catch (err) {
      Alert.alert('Unable to update', getApiErrorMessage(err, 'Please try again.'));
    } finally {
      setSavingWorkingArea(false);
    }
  };

  if (loading && !artisan) {
    return (
      <OfficerScreenChrome edges={['top']}>
        <OfficerListState kind="loading" message="Loading Artisan Pro details…" />
      </OfficerScreenChrome>
    );
  }

  if (error && !artisan) {
    return (
      <OfficerScreenChrome edges={['top']}>
        <OfficerListState kind="error" message={error} onRetry={() => void load()} />
      </OfficerScreenChrome>
    );
  }

  const status = pickString(artisan, 'status');
  const remark = pickString(artisan, 'admin_remark');
  const workingAreaText = workingVillages.length > 0
    ? workingVillages.join(', ')
    : pickString(artisan, 'working_area');

  return (
    <OfficerScreenChrome edges={['top']}>
      <ScreenHeader title="Artisan Details" />
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => void load(true)} tintColor={officerTheme.primary} />}
      >
        <View style={[styles.summaryCard, officerCardShadow]}>
          <Text style={styles.name}>{pickString(artisan, 'name')}</Text>
          <Text style={styles.mobile}>{pickString(artisan, 'mobile', 'phone')}</Text>
          <View style={[styles.statusPill, status === 'rejected' && styles.statusRejected]}>
            <Text style={[styles.statusText, status === 'rejected' && styles.statusRejectedText]}>{formatStatusLabel(status)}</Text>
          </View>
        </View>

        {remark !== '-' ? (
          <View style={[styles.remarkCard, officerCardShadow]}>
            <Text style={styles.remarkTitle}>Admin remark</Text>
            <Text style={styles.remarkText}>{remark}</Text>
          </View>
        ) : null}

        <View style={[styles.detailsCard, officerCardShadow]}>
          <Text style={styles.sectionTitle}>Contact and location</Text>
          <DetailRow label="Address" value={pickString(artisan, 'address')} />
          <DetailRow label="Village" value={pickString(artisan, 'village')} />
          <DetailRow label="Taluka" value={pickString(artisan, 'taluka')} />
          <DetailRow label="District" value={pickString(artisan, 'district')} />
          <DetailRow label="State" value={pickString(artisan, 'state')} />
          <DetailRow label="Working area" value={workingAreaText} />
          {workingVillages.length > 0 ? (
            <View style={styles.villageList}>
              {workingVillages.map((name) => (
                <View key={name} style={styles.villageChip}>
                  <Text style={styles.villageChipText}>{name}</Text>
                </View>
              ))}
            </View>
          ) : null}

          {!editingWorkingArea ? (
            <Pressable style={styles.editLink} onPress={startEditWorkingArea}>
              <Text style={styles.editLinkText}>Edit working villages</Text>
            </Pressable>
          ) : (
            <View style={styles.editBlock}>
              <Text style={styles.editTitle}>Update working villages</Text>
              <Text style={styles.editHint}>
                Existing talukas are pre-loaded below. Add another taluka to merge it in — saving never silently
                drops villages you already had.
              </Text>
              <WorkingAreaSelector
                state={pickString(artisan, 'state') !== '-' ? pickString(artisan, 'state') : 'Gujarat'}
                entries={workingAreaEntries}
                onChange={setWorkingAreaEntries}
              />
              <AppButton label="Save working villages" onPress={() => void saveWorkingArea()} loading={savingWorkingArea} />
              <AppButton label="Cancel" variant="secondary" onPress={() => setEditingWorkingArea(false)} disabled={savingWorkingArea} />
            </View>
          )}
        </View>
      </ScrollView>
    </OfficerScreenChrome>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.detailRow}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  content: { gap: 12, padding: officerTheme.marginMobile, paddingBottom: 48 },
  summaryCard: { backgroundColor: officerTheme.surfaceLowest, borderColor: officerTheme.outlineVariant, borderRadius: 16, borderWidth: 1, gap: 6, padding: 16 },
  name: { color: officerTheme.onSurface, fontSize: 22, fontWeight: '800' },
  mobile: { color: officerTheme.onSurfaceVariant, fontSize: 14 },
  statusPill: { alignSelf: 'flex-start', backgroundColor: officerTheme.secondaryContainer, borderRadius: 999, marginTop: 4, paddingHorizontal: 10, paddingVertical: 5 },
  statusRejected: { backgroundColor: officerTheme.errorContainer },
  statusText: { color: officerTheme.onSecondaryContainer, fontSize: 11, fontWeight: '800', textTransform: 'uppercase' },
  statusRejectedText: { color: officerTheme.onErrorContainer },
  remarkCard: { backgroundColor: officerTheme.errorContainer, borderRadius: 14, gap: 4, padding: 14 },
  remarkTitle: { color: officerTheme.onErrorContainer, fontSize: 12, fontWeight: '800', textTransform: 'uppercase' },
  remarkText: { color: officerTheme.onErrorContainer, fontSize: 14, lineHeight: 20 },
  detailsCard: { backgroundColor: officerTheme.surfaceLowest, borderColor: officerTheme.outlineVariant, borderRadius: 16, borderWidth: 1, padding: 16 },
  sectionTitle: { color: officerTheme.onSurface, fontSize: 16, fontWeight: '800', marginBottom: 8 },
  detailRow: { borderTopColor: officerTheme.outlineVariant, borderTopWidth: 1, gap: 2, paddingVertical: 10 },
  detailLabel: { color: officerTheme.onSurfaceVariant, fontSize: 11, fontWeight: '700', textTransform: 'uppercase' },
  detailValue: { color: officerTheme.onSurface, fontSize: 14 },
  villageList: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 4 },
  villageChip: { backgroundColor: officerTheme.secondaryContainer, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 5 },
  villageChipText: { color: officerTheme.onSecondaryContainer, fontSize: 12, fontWeight: '700' },
  editLink: { marginTop: 12 },
  editLinkText: { color: officerTheme.primary, fontSize: 14, fontWeight: '700' },
  editBlock: { gap: 12, marginTop: 12 },
  editTitle: { color: officerTheme.onSurface, fontSize: 15, fontWeight: '800' },
  editHint: { color: officerTheme.onSurfaceVariant, fontSize: 12, lineHeight: 17, marginTop: -6 },
});
