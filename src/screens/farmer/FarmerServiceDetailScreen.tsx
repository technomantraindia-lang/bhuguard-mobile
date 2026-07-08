import { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { getApiErrorMessage } from '../../api/authApi';
import {
  createFarmerServiceSubmission,
  getFarmerFarms,
  getFarmerServiceDetail,
} from '../../api/farmerApi';
import { ErrorState } from '../../components/ErrorState';
import { LoadingState } from '../../components/LoadingState';
import { ScreenHeader } from '../../components/ScreenHeader';
import { StatusBadge } from '../../components/StatusBadge';
import { FarmFormField } from '../../components/farmer/farms/FarmFormField';
import type { FarmerStackParamList } from '../../navigation/types';
import { dashboardTheme } from '../../theme/bhuguardDashboardTheme';
import { extractList, pickNestedString, pickString, type ApiRecord } from '../../utils/apiHelpers';

type Props = NativeStackScreenProps<FarmerStackParamList, 'FarmerServiceDetail'>;

function unwrapService(data: ApiRecord): ApiRecord {
  const service = data.service;

  if (service && typeof service === 'object' && !Array.isArray(service)) {
    return service as ApiRecord;
  }

  return data;
}

function stringList(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item) => String(item ?? '').trim())
    .filter((item) => item.length > 0);
}

function RequirementSection({ title, items }: { title: string; items: string[] }) {
  if (items.length === 0) {
    return null;
  }

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {items.map((item) => (
        <View key={item} style={styles.bulletRow}>
          <Text style={styles.bullet}>•</Text>
          <Text style={styles.bulletText}>{item}</Text>
        </View>
      ))}
    </View>
  );
}

function FarmPicker({
  farms,
  selectedFarmId,
  onSelect,
}: {
  farms: Array<{ id: number; label: string }>;
  selectedFarmId: number | null;
  onSelect: (id: number) => void;
}) {
  return (
    <View style={styles.fieldBlock}>
      <Text style={styles.fieldLabel}>Select farm</Text>
      <View style={styles.optionWrap}>
        {farms.length === 0 ? (
          <Text style={styles.optionEmpty}>Add a farm before enrolling in a service.</Text>
        ) : (
          farms.map((farm) => {
            const active = selectedFarmId === farm.id;

            return (
              <Pressable
                key={farm.id}
                style={[styles.optionChip, active && styles.optionChipActive]}
                onPress={() => onSelect(farm.id)}
              >
                <Text style={[styles.optionChipText, active && styles.optionChipTextActive]}>{farm.label}</Text>
              </Pressable>
            );
          })
        )}
      </View>
    </View>
  );
}

export function FarmerServiceDetailScreen({ route, navigation }: Props) {
  const { serviceId } = route.params;
  const [service, setService] = useState<ApiRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [farmOptions, setFarmOptions] = useState<Array<{ id: number; label: string }>>([]);
  const [selectedFarmId, setSelectedFarmId] = useState<number | null>(null);
  const [remarks, setRemarks] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const load = useCallback(async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    setError(null);

    try {
      const [detailData, farmsData] = await Promise.all([
        getFarmerServiceDetail(serviceId),
        getFarmerFarms(),
      ]);

      const record = unwrapService(detailData as ApiRecord);
      setService(record);

      const farms = extractList(farmsData as ApiRecord, ['farms']).map((farm) => ({
        id: Number(farm.id),
        label: pickString(farm, 'farm_name', 'name'),
      })).filter((farm) => Number.isFinite(farm.id) && farm.id > 0);

      setFarmOptions(farms);

      setSelectedFarmId((current) => current ?? farms[0]?.id ?? null);
    } catch (err) {
      setError(getApiErrorMessage(err, 'Failed to load service details.'));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [serviceId]);

  useEffect(() => {
    void load();
  }, [load]);

  const canEnroll = service?.can_enroll === true;
  const isEnrolled = service?.is_enrolled === true;
  const status = pickString(service, 'enrolment_status', 'status');
  const requirements = useMemo(() => stringList(service?.requirements), [service]);
  const evidenceRequirements = useMemo(() => stringList(service?.evidence_requirements), [service]);
  const weeklyRequirements = useMemo(() => stringList(service?.weekly_update_requirements), [service]);

  const handleEnroll = async () => {
    setSubmitError(null);

    if (!selectedFarmId) {
      setSubmitError('Select a farm to enroll.');
      return;
    }

    if (!remarks.trim()) {
      setSubmitError('Add a short description or remarks for your enrollment request.');
      return;
    }

    setSubmitting(true);

    try {
      await createFarmerServiceSubmission({
        farm_id: selectedFarmId,
        service_id: Number(serviceId),
        notes: remarks.trim(),
      });

      Alert.alert('Enrollment submitted', 'Your service enrollment request has been submitted for review.', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (err) {
      setSubmitError(getApiErrorMessage(err, 'Failed to submit enrollment.'));
    } finally {
      setSubmitting(false);
    }
  };

  if (loading && !service) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.pad}>
          <ScreenHeader title="Service Detail" />
        </View>
        <LoadingState />
      </SafeAreaView>
    );
  }

  if (error && !service) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.pad}>
          <ScreenHeader title="Service Detail" />
        </View>
        <ErrorState message={error} onRetry={() => void load()} />
      </SafeAreaView>
    );
  }

  const record = service!;
  const serviceName = pickString(record, 'name', 'service_name');
  const description = pickString(record, 'description');
  const farmName = pickNestedString(record, 'farm.farm_name');
  const enrolledAt = pickString(record, 'enrolled_at');
  const notes = pickString(record, 'notes');

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => void load(true)} tintColor={dashboardTheme.primary} />
        }
      >
        <ScreenHeader title="Service Detail" subtitle={serviceName !== '-' ? serviceName : undefined} />

        <View style={styles.card}>
          <View style={styles.titleRow}>
            <Text style={styles.title}>{serviceName !== '-' ? serviceName : 'Service'}</Text>
            {status !== '-' ? <StatusBadge status={status} /> : null}
          </View>

          {pickString(record, 'code') !== '-' ? (
            <Text style={styles.meta}>Code: {pickString(record, 'code')}</Text>
          ) : null}

          {description !== '-' ? <Text style={styles.description}>{description}</Text> : null}

          {isEnrolled && farmName !== '-' ? (
            <Text style={styles.meta}>Enrolled farm: {farmName}</Text>
          ) : null}

          {isEnrolled && enrolledAt !== '-' ? (
            <Text style={styles.meta}>Enrolled on: {enrolledAt}</Text>
          ) : null}

          {isEnrolled && notes !== '-' ? (
            <Text style={styles.meta}>Remarks: {notes}</Text>
          ) : null}
        </View>

        <RequirementSection title="Requirements" items={requirements} />
        <RequirementSection title="Evidence requirements" items={evidenceRequirements} />
        <RequirementSection title="Weekly update requirements" items={weeklyRequirements} />

        {canEnroll ? (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Submit enrollment interest</Text>
            <FarmPicker farms={farmOptions} selectedFarmId={selectedFarmId} onSelect={setSelectedFarmId} />
            <FarmFormField
              label="Project / activity description"
              value={remarks}
              onChangeText={setRemarks}
              multiline
              placeholder="Describe your interest and planned activities"
            />
            {submitError ? <Text style={styles.errorText}>{submitError}</Text> : null}
            <Pressable
              style={({ pressed }) => [styles.primaryButton, pressed && styles.pressed, submitting && styles.disabled]}
              onPress={() => void handleEnroll()}
              disabled={submitting || farmOptions.length === 0}
            >
              <Text style={styles.primaryButtonText}>{submitting ? 'Submitting…' : 'Submit enrollment'}</Text>
            </Pressable>
          </View>
        ) : null}

        {!canEnroll && isEnrolled && (pickString(record, 'code') === 'BIOCHAR' || serviceName.toLowerCase().includes('biochar')) ? (
          <View style={styles.unavailableCard}>
            <Text style={styles.unavailableText}>Biochar service is active on your account. Use Farm Activity to submit your 20-day farm updates.</Text>
          </View>
        ) : null}

        {!canEnroll && !isEnrolled ? (
          <View style={styles.unavailableCard}>
            <Text style={styles.unavailableText}>Service enrollment is not available yet.</Text>
          </View>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: dashboardTheme.background,
  },
  pad: {
    paddingHorizontal: 20,
    paddingTop: 12,
  },
  content: {
    paddingHorizontal: dashboardTheme.marginMobile,
    paddingBottom: 32,
    gap: 16,
  },
  card: {
    backgroundColor: dashboardTheme.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: dashboardTheme.outlineVariant,
    padding: 14,
    gap: 8,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  title: {
    flex: 1,
    fontSize: 18,
    fontWeight: '700',
    color: dashboardTheme.headingGreen,
  },
  description: {
    fontSize: 14,
    lineHeight: 20,
    color: dashboardTheme.onSurfaceVariant,
  },
  meta: {
    fontSize: 13,
    lineHeight: 18,
    color: dashboardTheme.onSurfaceVariant,
  },
  section: {
    gap: 6,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: dashboardTheme.headingGreen,
  },
  bulletRow: {
    flexDirection: 'row',
    gap: 8,
    paddingRight: 8,
  },
  bullet: {
    fontSize: 14,
    lineHeight: 20,
    color: dashboardTheme.primary,
  },
  bulletText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
    color: dashboardTheme.onSurface,
  },
  fieldBlock: {
    gap: 8,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: dashboardTheme.onSurfaceVariant,
  },
  optionWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  optionEmpty: {
    fontSize: 13,
    color: dashboardTheme.onSurfaceVariant,
  },
  optionChip: {
    borderWidth: 1,
    borderColor: dashboardTheme.outlineVariant,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: dashboardTheme.surfaceLowest,
  },
  optionChipActive: {
    borderColor: dashboardTheme.primary,
    backgroundColor: dashboardTheme.surfaceLow,
  },
  optionChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: dashboardTheme.onSurfaceVariant,
  },
  optionChipTextActive: {
    color: dashboardTheme.primaryContainer,
  },
  primaryButton: {
    marginTop: 4,
    backgroundColor: dashboardTheme.primaryContainer,
    borderRadius: 10,
    paddingVertical: 13,
    alignItems: 'center',
  },
  primaryButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: dashboardTheme.onPrimary,
  },
  errorText: {
    fontSize: 12,
    color: dashboardTheme.error,
    fontWeight: '600',
  },
  unavailableCard: {
    backgroundColor: dashboardTheme.creditsSurface,
    borderRadius: 10,
    padding: 12,
  },
  unavailableText: {
    fontSize: 14,
    color: dashboardTheme.onSurfaceVariant,
    textAlign: 'center',
  },
  pressed: {
    opacity: 0.92,
    transform: [{ scale: 0.98 }],
  },
  disabled: {
    opacity: 0.6,
  },
});
