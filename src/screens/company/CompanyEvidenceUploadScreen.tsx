import { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { getCompanyEvidence, getCompanyServiceSubmissions } from '../../api/companyApi';
import { ErrorState } from '../../components/ErrorState';
import { EvidenceUploadForm } from '../../components/evidence/EvidenceUploadForm';
import { LoadingState } from '../../components/LoadingState';
import { ScreenHeader } from '../../components/ScreenHeader';
import { AppButton } from '../../components/AppButton';
import {
  COMPANY_EVIDENCE_CATEGORY_OPTIONS,
  type CompanyEvidenceCategoryKey,
} from '../../constants/evidenceCategories';
import { useEvidenceUpload } from '../../hooks/useEvidenceUpload';
import type { CompanyStackParamList } from '../../navigation/types';
import { dashboardTheme } from '../../theme/bhuguardDashboardTheme';
import { extractList, pickString, type ApiRecord } from '../../utils/apiHelpers';
import { isApiNotFound } from '../../utils/apiError';
import type { LiveCapturedEvidence } from '../../utils/liveEvidenceCapture';

type Nav = NativeStackNavigationProp<CompanyStackParamList>;

interface SubmissionOption {
  id: number;
  label: string;
  subtitle: string;
}

export function CompanyEvidenceUploadScreen() {
  const navigation = useNavigation<Nav>();
  const [submissions, setSubmissions] = useState<SubmissionOption[]>([]);
  const [selectedSubmissionId, setSelectedSubmissionId] = useState<number | null>(null);
  const [category, setCategory] = useState<CompanyEvidenceCategoryKey>('document');
  const [remarks, setRemarks] = useState('');
  const [loadingSubmissions, setLoadingSubmissions] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [endpointMissing, setEndpointMissing] = useState(false);

  const evidenceUpload = useEvidenceUpload({
    role: 'company_user',
    onSuccess: () => {
      Alert.alert('Evidence uploaded', 'Your evidence file was saved successfully.');
    },
  });

  const loadSubmissions = useCallback(async () => {
    setLoadingSubmissions(true);
    setLoadError(null);

    try {
      const data = await getCompanyServiceSubmissions();
      const records = extractList(data as ApiRecord, ['service_submissions', 'submissions']);
      const options = records
        .map((record) => ({
          id: Number(record.id),
          label:
            pickString(record, 'submission_code') !== '-'
              ? pickString(record, 'submission_code')
              : `Submission ${pickString(record, 'id')}`,
          subtitle: `${pickString(record, 'service.name', 'service_name')} • ${pickString(record, 'company_site.site_name', 'site_name')}`,
        }))
        .filter((item) => item.id > 0);

      setSubmissions(options);
      setSelectedSubmissionId((current) => current ?? (options.length === 1 ? options[0].id : null));
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : 'Failed to load service submissions.');
    } finally {
      setLoadingSubmissions(false);
    }
  }, []);

  useEffect(() => {
    void loadSubmissions();
    void evidenceUpload.refreshList().catch(() => undefined);

    getCompanyEvidence()
      .then(() => setEndpointMissing(false))
      .catch((err) => {
        if (isApiNotFound(err)) {
          setEndpointMissing(true);
        }
      });
  }, [loadSubmissions]);

  const selectedSubmission = useMemo(
    () => submissions.find((item) => item.id === selectedSubmissionId) ?? null,
    [submissions, selectedSubmissionId],
  );

  const handleSubmit = async (file: LiveCapturedEvidence | { uri: string; name: string; type: string }) => {
    if (endpointMissing) {
      evidenceUpload.setError('Evidence upload API is not available yet.');
      return;
    }

    if (!selectedSubmissionId) {
      evidenceUpload.setError('Select a service submission before uploading evidence.');
      return;
    }

    const saved = await evidenceUpload.submitEvidence(file, {
      evidence_category: category,
      company_service_submission_id: selectedSubmissionId,
      service_submission_id: selectedSubmissionId,
      remarks,
      notes: remarks,
    });

    if (saved) {
      setRemarks('');
    }
  };

  if (loadingSubmissions && submissions.length === 0 && !loadError) {
    return (
      <SafeAreaView style={styles.safe}>
        <LoadingState message="Loading submissions..." />
      </SafeAreaView>
    );
  }

  if (loadError && submissions.length === 0) {
    return (
      <SafeAreaView style={styles.safe}>
        <ErrorState message={loadError} onRetry={loadSubmissions} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScreenHeader title="Upload Evidence" subtitle="Company evidence upload" />
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>Saved evidence</Text>
          <Text style={styles.summaryText}>
            {evidenceUpload.uploadedCount} file{evidenceUpload.uploadedCount === 1 ? '' : 's'} on server
          </Text>
        </View>

        <EvidenceUploadForm
          categories={COMPANY_EVIDENCE_CATEGORY_OPTIONS}
          selectedCategory={category}
          onCategoryChange={(value) => setCategory(value as CompanyEvidenceCategoryKey)}
          remarks={remarks}
          onRemarksChange={setRemarks}
          uploading={evidenceUpload.uploading}
          error={endpointMissing ? 'Evidence upload API is not available yet.' : evidenceUpload.error}
          onSubmit={handleSubmit}
          relationSection={
            <>
              <Text style={styles.label}>Service submission</Text>
              <View style={styles.list}>
                {submissions.length === 0 ? (
                  <Text style={styles.muted}>Create a service submission before uploading evidence.</Text>
                ) : (
                  submissions.map((item) => {
                    const active = item.id === selectedSubmissionId;

                    return (
                      <Pressable
                        key={item.id}
                        style={[styles.chip, active && styles.chipActive]}
                        onPress={() => setSelectedSubmissionId(item.id)}
                      >
                        <Text style={[styles.chipTitle, active && styles.chipTitleActive]}>{item.label}</Text>
                        <Text style={styles.chipSubtitle}>{item.subtitle}</Text>
                      </Pressable>
                    );
                  })
                )}
              </View>
              {selectedSubmission ? (
                <Text style={styles.selected}>Uploading for: {selectedSubmission.label}</Text>
              ) : null}
            </>
          }
          showWeightSlipFields={category === 'weight_slip'}
        />

        <AppButton
          label="View all evidence"
          variant="secondary"
          onPress={() => navigation.navigate('CompanyEvidenceList')}
        />
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
  list: { gap: 8 },
  muted: { fontSize: 13, color: dashboardTheme.onSurfaceVariant },
  chip: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: dashboardTheme.outlineVariant,
    backgroundColor: dashboardTheme.surfaceLowest,
    padding: 12,
    gap: 2,
  },
  chipActive: { borderColor: dashboardTheme.primary, backgroundColor: dashboardTheme.primaryContainer },
  chipTitle: { fontSize: 14, fontWeight: '700', color: dashboardTheme.onSurface },
  chipTitleActive: { color: dashboardTheme.onPrimaryContainer },
  chipSubtitle: { fontSize: 12, color: dashboardTheme.onSurfaceVariant },
  selected: { fontSize: 12, fontWeight: '600', color: dashboardTheme.primary },
});
