import { Image, StyleSheet, Text, View } from 'react-native';

import { BhuguardMaterialIcon } from '../shared/BhuguardMaterialIcon';
import { AppButton } from '../AppButton';
import { colors } from '../../theme/colors';
import {
  formatCapturedTimestamp,
  hasGpsCapture,
  type LiveCapturedEvidence,
} from '../../utils/liveEvidenceCapture';

interface LiveEvidenceCaptureCardProps {
  evidence: LiveCapturedEvidence | null;
  capturing?: boolean;
  uploading?: boolean;
  error?: string | null;
  onOpenCamera: () => void;
  onRetake: () => void;
  onUpload?: () => void;
  uploadLabel?: string;
  showUploadButton?: boolean;
}

export function LiveEvidenceCaptureCard({
  evidence,
  capturing = false,
  uploading = false,
  error = null,
  onOpenCamera,
  onRetake,
  onUpload,
  uploadLabel = 'Upload Evidence',
  showUploadButton = false,
}: LiveEvidenceCaptureCardProps) {
  const busy = capturing || uploading;

  return (
    <View style={styles.wrap}>
      <View style={styles.card}>
        <View style={styles.headerRow}>
          <Text style={styles.emoji}>📷</Text>
          <View style={styles.headerCopy}>
            <Text style={styles.title}>Capture Live Evidence</Text>
            <Text style={styles.subtitle}>Take a real-time photo from camera</Text>
          </View>
        </View>

        {evidence ? (
          <View style={styles.previewBlock}>
            <View style={styles.previewFrame}>
              <Image source={{ uri: evidence.uri }} style={styles.previewImage} resizeMode="cover" />
            </View>
            <View style={styles.badgeRow}>
              {hasGpsCapture(evidence) ? (
                <View style={styles.badge}>
                  <BhuguardMaterialIcon name="share_location" size={14} color={colors.primary} />
                  <Text style={styles.badgeText}>GPS Captured</Text>
                </View>
              ) : (
                <View style={[styles.badge, styles.badgeMuted]}>
                  <Text style={styles.badgeTextMuted}>GPS unavailable</Text>
                </View>
              )}
              <View style={styles.badge}>
                <BhuguardMaterialIcon name="schedule" size={14} color={colors.primary} />
                <Text style={styles.badgeText}>{formatCapturedTimestamp(evidence.capturedAt)}</Text>
              </View>
            </View>
            {evidence.latitude != null && evidence.longitude != null ? (
              <Text style={styles.coords}>
                {evidence.watermark.coordinatesLabel}
                {evidence.accuracy != null ? ` · ±${evidence.accuracy.toFixed(0)}m` : ''}
              </Text>
            ) : null}
            <Text style={styles.locationMeta}>
              {[evidence.watermark.villageLabel, evidence.watermark.divisionLabel, evidence.watermark.stateLabel]
                .filter((line) => line && line !== '—')
                .join(' · ')}
            </Text>
            <Text style={styles.userMeta}>{evidence.watermark.userLabel}</Text>
          </View>
        ) : (
          <View style={styles.placeholder}>
            <BhuguardMaterialIcon name="photo_camera" size={36} color={colors.textMuted} />
            <Text style={styles.placeholderText}>No live photo captured yet</Text>
          </View>
        )}

        <View style={styles.actions}>
          {!evidence ? (
            <AppButton
              label={capturing ? 'Opening camera...' : 'Open Camera'}
              onPress={onOpenCamera}
              loading={capturing}
              disabled={busy}
            />
          ) : (
            <>
              <AppButton
                label={capturing ? 'Opening camera...' : 'Retake Photo'}
                onPress={onRetake}
                variant="secondary"
                loading={capturing}
                disabled={busy}
              />
              {showUploadButton && onUpload ? (
                <AppButton
                  label={uploadLabel}
                  onPress={onUpload}
                  loading={uploading}
                  disabled={busy}
                />
              ) : null}
            </>
          )}
        </View>
      </View>

      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 8 },
  card: {
    backgroundColor: colors.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
    gap: 16,
  },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  emoji: { fontSize: 28 },
  headerCopy: { flex: 1, gap: 2 },
  title: { fontSize: 17, fontWeight: '700', color: colors.text },
  subtitle: { fontSize: 13, color: colors.textMuted, lineHeight: 18 },
  placeholder: {
    height: 160,
    borderRadius: 12,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.background,
  },
  placeholderText: { fontSize: 13, color: colors.textMuted, fontWeight: '500' },
  previewBlock: { gap: 8 },
  previewFrame: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: colors.background,
  },
  previewImage: {
    width: '100%',
    height: '100%',
  },
  badgeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: colors.softGreen,
  },
  badgeMuted: { backgroundColor: colors.background },
  badgeText: { fontSize: 11, fontWeight: '700', color: colors.primary },
  badgeTextMuted: { fontSize: 11, fontWeight: '600', color: colors.textMuted },
  coords: { fontSize: 12, color: colors.textMuted, fontWeight: '500' },
  locationMeta: { fontSize: 12, color: colors.textMuted, fontWeight: '500' },
  userMeta: { fontSize: 12, color: colors.primary, fontWeight: '700' },
  actions: { gap: 10 },
  error: { color: colors.error, fontSize: 13, lineHeight: 18 },
});
