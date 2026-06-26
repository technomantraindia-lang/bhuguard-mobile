import type { ReactNode } from 'react';
import { Image, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { BhuguardMaterialIcon } from '../../shared/BhuguardMaterialIcon';
import { AppButton } from '../../AppButton';
import { officerCardShadow, officerTheme } from '../../../theme/officerDashboardTheme';
import type { GpsAccuracyTier, GpsPermissionStatus, OfficerGpsCaptureResult } from '../../../utils/officerGpsCapture';
import { accuracyTierLabel, buildStaticMapPreviewUrl, classifyAccuracyTier } from '../../../utils/officerGpsCapture';
import {
  formatDistanceMeters,
  locationStatusLabel,
  type VisitGpsContext,
  type VisitLocationVerification,
} from '../../../utils/visitGpsVerification';

function SectionCard({ title, children }: { title: string; children: ReactNode }) {
  return (
    <View style={[styles.card, officerCardShadow]}>
      <Text style={styles.cardTitle}>{title}</Text>
      {children}
    </View>
  );
}

function DetailRow({ label, value, valueStyle }: { label: string; value: string; valueStyle?: object }) {
  return (
    <View style={styles.detailRow}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={[styles.detailValue, valueStyle]} numberOfLines={2}>
        {value}
      </Text>
    </View>
  );
}

function StatusPill({ label, tone }: { label: string; tone: 'success' | 'warning' | 'danger' | 'neutral' }) {
  const toneStyle =
    tone === 'success'
      ? styles.pillSuccess
      : tone === 'warning'
        ? styles.pillWarning
        : tone === 'danger'
          ? styles.pillDanger
          : styles.pillNeutral;

  return (
    <View style={[styles.pill, toneStyle]}>
      <Text style={styles.pillText}>{label}</Text>
    </View>
  );
}

function permissionLabel(status: GpsPermissionStatus): string {
  switch (status) {
    case 'granted':
      return 'Granted';
    case 'denied':
      return 'Denied';
    default:
      return 'Not requested';
  }
}

function accuracyTone(tier: GpsAccuracyTier): 'success' | 'warning' | 'danger' | 'neutral' {
  if (tier === 'good') {
    return 'success';
  }

  if (tier === 'average') {
    return 'warning';
  }

  if (tier === 'poor') {
    return 'danger';
  }

  return 'neutral';
}

function formatCoordinate(value: number | null | undefined): string {
  if (value == null || !Number.isFinite(value)) {
    return '—';
  }

  return value.toFixed(6);
}

function formatTimestamp(iso: string | null | undefined): string {
  if (!iso) {
    return '—';
  }

  const date = new Date(iso);

  if (Number.isNaN(date.getTime())) {
    return iso;
  }

  return date.toLocaleString();
}

interface VisitSummaryCardProps {
  context: VisitGpsContext;
}

export function VisitGpsSummaryCard({ context }: VisitSummaryCardProps) {
  return (
    <SectionCard title="Visit Location">
      <DetailRow label="Visit ID" value={context.visitId} />
      <DetailRow label="Farmer / Company" value={context.farmerName} />
      <DetailRow label="Farm / Site" value={context.farmName} />
      <DetailRow label="Address" value={context.address} />
      <DetailRow label="Project" value={context.projectName} />
    </SectionCard>
  );
}

export function VisitGpsTargetLocationCard({ context }: VisitSummaryCardProps) {
  const hasTarget = context.hasTargetCoordinates;

  return (
    <SectionCard title="Target Location">
      <DetailRow
        label="Target Latitude"
        value={hasTarget ? formatCoordinate(context.farmLatitude) : '—'}
      />
      <DetailRow
        label="Target Longitude"
        value={hasTarget ? formatCoordinate(context.farmLongitude) : '—'}
      />
      <DetailRow label="Allowed Radius" value={`${context.allowedRadiusMeter} m`} />
    </SectionCard>
  );
}

interface GpsStatusCardProps {
  permissionStatus: GpsPermissionStatus;
  gpsServiceEnabled: boolean | null;
  capture: OfficerGpsCaptureResult | null;
  verification: VisitLocationVerification | null;
  allowedRadiusMeter: number;
  farmLatitude: number;
  farmLongitude: number;
}

export function VisitGpsStatusCard({
  permissionStatus,
  gpsServiceEnabled,
  capture,
  verification,
  allowedRadiusMeter,
  farmLatitude,
  farmLongitude,
}: GpsStatusCardProps) {
  const verificationTone =
    verification?.locationStatus === 'verified'
      ? 'success'
      : verification?.locationStatus === 'outside_radius'
        ? 'danger'
        : 'neutral';

  return (
    <SectionCard title="GPS Status">
      <View style={styles.inlineRow}>
        <Text style={styles.detailLabel}>Permission</Text>
        <StatusPill
          label={permissionLabel(permissionStatus)}
          tone={permissionStatus === 'granted' ? 'success' : permissionStatus === 'denied' ? 'danger' : 'warning'}
        />
      </View>
      <View style={styles.inlineRow}>
        <Text style={styles.detailLabel}>GPS Service</Text>
        <StatusPill
          label={gpsServiceEnabled == null ? 'Checking…' : gpsServiceEnabled ? 'Enabled' : 'Disabled'}
          tone={gpsServiceEnabled ? 'success' : gpsServiceEnabled === false ? 'danger' : 'neutral'}
        />
      </View>
      <DetailRow label="Current Latitude" value={formatCoordinate(capture?.latitude)} />
      <DetailRow label="Current Longitude" value={formatCoordinate(capture?.longitude)} />
      <DetailRow
        label="Accuracy"
        value={capture ? `${capture.accuracyM.toFixed(1)} m (${accuracyTierLabel(capture.accuracyTier)})` : '—'}
        valueStyle={capture ? styles[`accuracy_${capture.accuracyTier}` as keyof typeof styles] : undefined}
      />
      <DetailStatusRow label="Accuracy Status" tier={capture?.accuracyTier ?? 'unknown'} />
      <DetailRow label="Timestamp" value={formatTimestamp(capture?.timestamp)} />
      <DetailRow
        label="Registered Farm"
        value={`${formatCoordinate(farmLatitude)}, ${formatCoordinate(farmLongitude)}`}
      />
      <DetailRow
        label="Distance from Farm"
        value={verification ? formatDistanceMeters(verification.distanceFromFarmMeter) : '—'}
      />
      <DetailRow label="Allowed Radius" value={`${allowedRadiusMeter} m`} />
      <View style={styles.inlineRow}>
        <Text style={styles.detailLabel}>Verification</Text>
        <StatusPill
          label={verification ? locationStatusLabel(verification.locationStatus) : 'Pending'}
          tone={verificationTone}
        />
      </View>
    </SectionCard>
  );
}

function DetailStatusRow({ label, tier }: { label: string; tier: GpsAccuracyTier }) {
  return (
    <View style={styles.inlineRow}>
      <Text style={styles.detailLabel}>{label}</Text>
      <StatusPill label={accuracyTierLabel(tier)} tone={accuracyTone(tier)} />
    </View>
  );
}

interface MapPreviewProps {
  capture: OfficerGpsCaptureResult | null;
  farmLatitude: number;
  farmLongitude: number;
}

export function VisitGpsMapPreview({ capture, farmLatitude, farmLongitude }: MapPreviewProps) {
  const mapUri =
    capture && Number.isFinite(farmLatitude) && Number.isFinite(farmLongitude)
      ? buildStaticMapPreviewUrl(capture.latitude, capture.longitude, farmLatitude, farmLongitude)
      : null;

  return (
    <SectionCard title="Map Preview">
      <Text style={styles.mapHint}>Blue marker: your location · Red marker: registered farm</Text>
      <View style={styles.mapWrap}>
        {mapUri ? (
          <Image source={{ uri: mapUri }} style={styles.mapImage} resizeMode="cover" />
        ) : (
          <View style={styles.mapPlaceholder}>
            <BhuguardMaterialIcon name="map" size={36} color={officerTheme.outline} />
            <Text style={styles.mapPlaceholderText}>Capture GPS to preview map</Text>
          </View>
        )}
      </View>
      <Text style={styles.radiusHint}>Allowed radius circle is shown on the verify screen map.</Text>
    </SectionCard>
  );
}

interface AlertBannerProps {
  message: string;
  tone?: 'warning' | 'danger' | 'success';
}

export function VisitGpsAlertBanner({ message, tone = 'warning' }: AlertBannerProps) {
  const toneStyle =
    tone === 'danger' ? styles.alertDanger : tone === 'success' ? styles.alertSuccess : styles.alertWarning;

  return (
    <View style={[styles.alertBanner, toneStyle]}>
      <DecoderIcon tone={tone} />
      <Text style={styles.alertText}>{message}</Text>
    </View>
  );
}

function DecoderIcon({ tone }: { tone: 'warning' | 'danger' | 'success' }) {
  const color =
    tone === 'danger' ? officerTheme.error : tone === 'success' ? officerTheme.primary : officerTheme.tertiary;

  return <BhuguardMaterialIcon name="share_location" size={18} color={color} />;
}

interface PoorAccuracyBannerProps {
  visible: boolean;
  onRetry: () => void;
}

export function VisitGpsPoorAccuracyBanner({ visible, onRetry }: PoorAccuracyBannerProps) {
  if (!visible) {
    return null;
  }

  return (
    <View style={styles.poorAccuracyWrap}>
      <VisitGpsAlertBanner
        tone="warning"
        message="GPS accuracy is low. Please move to an open area and refresh location."
      />
      <Pressable style={styles.retryButton} onPress={onRetry}>
        <Text style={styles.retryButtonText}>Refresh Location</Text>
      </Pressable>
    </View>
  );
}

interface PermissionDeniedCardProps {
  visible: boolean;
  onAllowPermission: () => void;
  onOpenSettings: () => void;
}

export function VisitGpsPermissionDeniedCard({
  visible,
  onAllowPermission,
  onOpenSettings,
}: PermissionDeniedCardProps) {
  if (!visible) {
    return null;
  }

  return (
    <SectionCard title="Location Permission Required">
      <VisitGpsAlertBanner
        tone="danger"
        message="Please allow location permission to verify your farm/site visit."
      />
      <AppButton label="Allow Location Permission" onPress={onAllowPermission} />
      <AppButton label="Open Device Settings" onPress={onOpenSettings} variant="secondary" />
    </SectionCard>
  );
}

interface GpsDisabledCardProps {
  visible: boolean;
  onTurnOnGps: () => void;
}

export function VisitGpsServiceDisabledCard({ visible, onTurnOnGps }: GpsDisabledCardProps) {
  if (!visible) {
    return null;
  }

  return (
    <SectionCard title="GPS Disabled">
      <VisitGpsAlertBanner tone="warning" message="Please enable location services to continue." />
      <AppButton label="Turn On GPS" onPress={onTurnOnGps} variant="secondary" />
    </SectionCard>
  );
}

interface LocationVerifyResultCardProps {
  verification: VisitLocationVerification;
  allowedRadiusMeter: number;
}

export function VisitLocationVerifyResultCard({ verification, allowedRadiusMeter }: LocationVerifyResultCardProps) {
  const verified = verification.insideVisitArea;

  return (
    <SectionCard title="Verification Result">
      {verified ? (
        <View style={[styles.resultCard, styles.resultSuccess]}>
          <Text style={styles.resultTitle}>Inside Farm Radius</Text>
          <Text style={styles.resultBody}>
            You are within the allowed {allowedRadiusMeter} m radius of the registered farm location.
          </Text>
        </View>
      ) : (
        <View style={[styles.resultCard, styles.resultDanger]}>
          <Text style={styles.resultTitle}>Outside Farm Radius</Text>
          <Text style={styles.resultBody}>You are outside the allowed farm/site radius.</Text>
        </View>
      )}
      <DetailRow label="Distance from Farm" value={formatDistanceMeters(verification.distanceFromFarmMeter)} />
      <DetailRow label="Allowed Radius" value={`${allowedRadiusMeter} m`} />
      <DetailRow label="Status" value={locationStatusLabel(verification.locationStatus)} />
    </SectionCard>
  );
}

interface DistanceVerificationCardProps {
  verification: VisitLocationVerification | null;
  allowedRadiusMeter: number;
  accuracyM: number | null;
}

export function VisitGpsDistanceVerificationCard({
  verification,
  allowedRadiusMeter,
  accuracyM,
}: DistanceVerificationCardProps) {
  const inside = verification?.insideVisitArea ?? false;
  const accuracyTier = accuracyM == null ? 'unknown' : classifyAccuracyTier(accuracyM);

  return (
    <SectionCard title="Distance Verification">
      <DetailRow
        label="Distance from Farm/Site"
        value={verification ? formatDistanceMeters(verification.distanceFromFarmMeter) : '—'}
      />
      <View style={styles.inlineRow}>
        <Text style={styles.detailLabel}>Radius Status</Text>
        <StatusPill
          label={inside ? 'Inside Farm Radius' : 'Outside Farm Radius'}
          tone={inside ? 'success' : 'warning'}
        />
      </View>
      <View style={styles.inlineRow}>
        <Text style={styles.detailLabel}>Accuracy Status</Text>
        <StatusPill label={accuracyTierLabel(accuracyTier)} tone={accuracyTone(accuracyTier)} />
      </View>
      <DetailRow label="Allowed Radius" value={`${allowedRadiusMeter} m`} />
      <Text style={styles.radiusHint}>Map preview shows your current location vs registered farm/site.</Text>
    </SectionCard>
  );
}

export function VisitGpsInsideRadiusCard() {
  return (
    <View style={[styles.resultCard, styles.resultSuccess]}>
      <Text style={styles.resultTitle}>Inside Verification Radius</Text>
      <Text style={styles.resultBody}>You are inside the allowed verification radius.</Text>
    </View>
  );
}

interface OutsideRadiusCardProps {
  verification: VisitLocationVerification | null;
  allowedRadiusMeter: number;
  accuracyM: number | null;
  overrideReason: string;
  onOverrideReasonChange: (value: string) => void;
  onRefresh: () => void;
  onRequestOverride: () => void;
  submitting: boolean;
}

export function VisitGpsOutsideRadiusCard({
  verification,
  allowedRadiusMeter,
  accuracyM,
  overrideReason,
  onOverrideReasonChange,
  onRefresh,
  onRequestOverride,
  submitting,
}: OutsideRadiusCardProps) {
  return (
    <SectionCard title="Outside Farm Radius">
      <VisitGpsAlertBanner
        tone="warning"
        message="You are outside the allowed farm/site radius."
      />
      <DetailRow
        label="Current Distance"
        value={verification ? formatDistanceMeters(verification.distanceFromFarmMeter) : '—'}
      />
      <DetailRow label="Allowed Radius" value={`${allowedRadiusMeter} m`} />
      <DetailRow label="GPS Accuracy" value={accuracyM != null ? `${accuracyM.toFixed(1)} m` : '—'} />
      <Text style={styles.inputLabel}>Reason for outside-radius check-in</Text>
      <TextInput
        value={overrideReason}
        onChangeText={onOverrideReasonChange}
        placeholder="Explain why you need to check in from this location"
        placeholderTextColor={officerTheme.outline}
        style={styles.textInput}
        multiline
      />
      <AppButton label="Refresh Location" onPress={onRefresh} variant="secondary" />
      <AppButton
        label={submitting ? 'Submitting Request…' : 'Request Outside Radius Check-in'}
        onPress={onRequestOverride}
        loading={submitting}
        disabled={overrideReason.trim().length < 8 || submitting}
      />
    </SectionCard>
  );
}

interface OverrideSectionProps {
  reason: string;
  photoUri: string | null;
  onReasonChange: (value: string) => void;
  onCapturePhoto: () => void;
}

export function VisitGpsOverrideSection({ reason, photoUri, onReasonChange, onCapturePhoto }: OverrideSectionProps) {
  return (
    <SectionCard title="Location Override">
      <Text style={styles.overrideHint}>
        Override requires a clear reason and proof photo when you are outside the registered farm radius.
      </Text>
      <Text style={styles.inputLabel}>Reason</Text>
      <TextInput
        value={reason}
        onChangeText={onReasonChange}
        placeholder="Explain why you are checking in from this location"
        placeholderTextColor={officerTheme.outline}
        style={styles.textInput}
        multiline
      />
      <AppButton label={photoUri ? 'Retake Proof Photo' : 'Capture Proof Photo'} onPress={onCapturePhoto} variant="secondary" />
      {photoUri ? <Image source={{ uri: photoUri }} style={styles.proofPreview} resizeMode="cover" /> : null}
    </SectionCard>
  );
}

interface PoorAccuracyConfirmSectionProps {
  visible: boolean;
  reason: string;
  onReasonChange: (value: string) => void;
}

export function VisitGpsPoorAccuracyConfirmSection({
  visible,
  reason,
  onReasonChange,
}: PoorAccuracyConfirmSectionProps) {
  if (!visible) {
    return null;
  }

  return (
    <SectionCard title="Low GPS Accuracy Confirmation">
      <Text style={styles.overrideHint}>
        GPS accuracy is poor. Enter a reason to proceed, or retry capture in open sky.
      </Text>
      <TextInput
        value={reason}
        onChangeText={onReasonChange}
        placeholder="Reason for proceeding with low GPS accuracy"
        placeholderTextColor={officerTheme.outline}
        style={styles.textInput}
        multiline
      />
    </SectionCard>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: officerTheme.surfaceLowest,
    borderRadius: 16,
    padding: 16,
    gap: 10,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: officerTheme.headingGreen,
    marginBottom: 4,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    alignItems: 'flex-start',
  },
  detailLabel: {
    flex: 1,
    fontSize: 13,
    color: officerTheme.outline,
  },
  detailValue: {
    flex: 1.2,
    fontSize: 13,
    color: officerTheme.onSurface,
    textAlign: 'right',
    fontWeight: '600',
  },
  inlineRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
  },
  pill: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  pillText: {
    fontSize: 12,
    fontWeight: '700',
    color: officerTheme.onSurface,
  },
  pillSuccess: { backgroundColor: '#D7F5E3' },
  pillWarning: { backgroundColor: '#FFF3CD' },
  pillDanger: { backgroundColor: officerTheme.errorContainer },
  pillNeutral: { backgroundColor: officerTheme.surfaceContainer },
  mapHint: {
    fontSize: 12,
    color: officerTheme.outline,
  },
  mapWrap: {
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: officerTheme.surfaceLow,
    minHeight: 180,
  },
  mapImage: {
    width: '100%',
    height: 180,
  },
  mapPlaceholder: {
    minHeight: 180,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  mapPlaceholderText: {
    fontSize: 13,
    color: officerTheme.outline,
  },
  radiusHint: {
    fontSize: 12,
    color: officerTheme.outline,
  },
  alertBanner: {
    borderRadius: 12,
    padding: 12,
    flexDirection: 'row',
    gap: 8,
    alignItems: 'flex-start',
  },
  alertWarning: { backgroundColor: '#FFF8E1' },
  alertDanger: { backgroundColor: officerTheme.errorContainer },
  alertSuccess: { backgroundColor: '#E8F8EE' },
  alertText: {
    flex: 1,
    fontSize: 13,
    color: officerTheme.onSurface,
    lineHeight: 18,
  },
  poorAccuracyWrap: { gap: 8 },
  retryButton: {
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: officerTheme.primary,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  retryButtonText: {
    color: officerTheme.primary,
    fontWeight: '700',
    fontSize: 13,
  },
  resultCard: {
    borderRadius: 12,
    padding: 14,
    gap: 6,
  },
  resultSuccess: {
    backgroundColor: '#E8F8EE',
    borderWidth: 1,
    borderColor: '#93E9AB',
  },
  resultDanger: {
    backgroundColor: officerTheme.errorContainer,
    borderWidth: 1,
    borderColor: '#FFB4AB',
  },
  resultTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: officerTheme.onSurface,
  },
  resultBody: {
    fontSize: 13,
    color: officerTheme.onSurfaceVariant,
    lineHeight: 18,
  },
  overrideHint: {
    fontSize: 13,
    color: officerTheme.onSurfaceVariant,
    lineHeight: 18,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: officerTheme.onSurface,
  },
  textInput: {
    borderWidth: 1,
    borderColor: officerTheme.outlineVariant,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    minHeight: 88,
    textAlignVertical: 'top',
    color: officerTheme.onSurface,
    backgroundColor: officerTheme.surfaceLowest,
  },
  proofPreview: {
    width: '100%',
    height: 180,
    borderRadius: 12,
  },
  accuracy_good: { color: officerTheme.primary },
  accuracy_average: { color: officerTheme.tertiary },
  accuracy_poor: { color: officerTheme.error },
});
