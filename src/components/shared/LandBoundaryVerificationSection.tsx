import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';

import { StatusBadge } from '../StatusBadge';
import { dashboardTheme } from '../../theme/bhuguardDashboardTheme';
import { formatUnitLabel, mappingStatusLabel, type MappingStatus } from '../../utils/landMappingHelpers';
import type { AreaUnit } from '../../utils/boundaryGeometry';

interface LandBoundaryVerificationSectionProps {
  declaredArea: string;
  declaredUnit: AreaUnit | string;
  surveyNumber?: string;
  village?: string;
  taluka?: string;
  district?: string;
  state?: string;
  mappingStatus: MappingStatus;
  mappedAreaLabel?: string;
  onStartMapping: () => void;
  onSkipMapping?: () => void;
  error?: string | null;
}

export function LandBoundaryVerificationSection({
  declaredArea,
  declaredUnit,
  surveyNumber,
  village,
  taluka,
  district,
  state,
  mappingStatus,
  mappedAreaLabel,
  onStartMapping,
  onSkipMapping,
  error,
}: LandBoundaryVerificationSectionProps) {
  const unit = (declaredUnit as AreaUnit) || 'acre';
  const tone = mappingStatus === 'mapped' ? 'success' : mappingStatus === 'draft' ? 'warning' : 'neutral';

  const confirmSkip = () => {
    if (!onSkipMapping) {
      return;
    }

    Alert.alert(
      'Skip Farm Mapping?',
      'You can continue Farmer onboarding now and complete Farm Mapping later from Farmer Details.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Skip and Continue', onPress: onSkipMapping },
      ],
    );
  };

  return (
    <View style={styles.card}>
      <Text style={styles.title}>Land Boundary Verification</Text>
      <Text style={styles.subtitle}>
        Start mobile mapping now, or skip and complete Farm Mapping later from Farmer Details.
      </Text>

      <View style={styles.statusRow}>
        <Text style={styles.label}>Mapping status</Text>
        <StatusBadge label={mappingStatusLabel(mappingStatus)} tone={tone} />
      </View>

      <InfoRow label="Declared land area" value={declaredArea ? `${declaredArea} ${formatUnitLabel(unit)}` : '-'} />
      <InfoRow label="Survey number" value={surveyNumber} />
      <InfoRow label="Village" value={village} />
      <InfoRow label="Taluka" value={taluka} />
      <InfoRow label="District" value={district} />
      <InfoRow label="State" value={state} />
      {mappedAreaLabel ? <InfoRow label="Mapped area" value={mappedAreaLabel} /> : null}

      <Pressable style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]} onPress={onStartMapping}>
        <Text style={styles.buttonText}>
          {mappingStatus === 'mapped' ? 'Review / Re-map Land' : 'Start Mobile Mapping'}
        </Text>
      </Pressable>

      {onSkipMapping && mappingStatus !== 'mapped' ? (
        <Pressable style={({ pressed }) => [styles.skipButton, pressed && styles.buttonPressed]} onPress={confirmSkip}>
          <Text style={styles.skipButtonText}>Skip for Now</Text>
        </Pressable>
      ) : null}

      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

function InfoRow({ label, value }: { label: string; value?: string }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>{value?.trim() ? value : '-'}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: dashboardTheme.surfaceLowest,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: dashboardTheme.outlineVariant,
    padding: 14,
    gap: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: dashboardTheme.headingGreen,
  },
  subtitle: {
    fontSize: 13,
    lineHeight: 18,
    color: dashboardTheme.onSurfaceVariant,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: dashboardTheme.onSurfaceVariant,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  rowLabel: {
    fontSize: 13,
    color: dashboardTheme.onSurfaceVariant,
    flex: 1,
  },
  rowValue: {
    fontSize: 13,
    fontWeight: '600',
    color: dashboardTheme.onSurface,
    flex: 1,
    textAlign: 'right',
  },
  button: {
    marginTop: 6,
    backgroundColor: dashboardTheme.primaryContainer,
    borderRadius: 10,
    paddingVertical: 13,
    alignItems: 'center',
  },
  buttonPressed: {
    opacity: 0.92,
  },
  buttonText: {
    fontSize: 14,
    fontWeight: '700',
    color: dashboardTheme.onPrimary,
  },
  skipButton: {
    marginTop: 2,
    backgroundColor: dashboardTheme.surfaceLowest,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: dashboardTheme.outlineVariant,
    paddingVertical: 13,
    alignItems: 'center',
  },
  skipButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: dashboardTheme.onSurface,
  },
  error: {
    fontSize: 12,
    color: dashboardTheme.error,
    lineHeight: 16,
  },
});
