import { StyleSheet, Text, View } from 'react-native';



import { BhuguardMaterialIcon } from '../shared/BhuguardMaterialIcon';

import { colors } from '../../theme/colors';

import {

  formatCapturedTimestamp,

  hasGpsCapture,

  type LiveCapturedEvidence,

} from '../../utils/liveEvidenceCapture';

import { EvidenceStampedImageFrame } from './EvidenceStampedImageFrame';



interface EvidenceCapturedPreviewProps {

  evidence: LiveCapturedEvidence;

  onOpenPreview?: (uri: string) => void;

}



export function EvidenceCapturedPreview({ evidence, onOpenPreview }: EvidenceCapturedPreviewProps) {

  return (

    <View style={styles.wrap}>

      <Text style={styles.title}>Captured evidence preview</Text>

      <EvidenceStampedImageFrame

        uri={evidence.previewUri}

        onPress={onOpenPreview ? () => onOpenPreview(evidence.previewUri) : undefined}

      />

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

          {evidence.watermark.latitudeLabel} · {evidence.watermark.longitudeLabel}

          {evidence.accuracy != null ? ` · ${evidence.watermark.accuracyLabel}` : ''}

        </Text>

      ) : null}

      <Text style={styles.locationMeta}>

        {[

          evidence.watermark.villageLabel,

          evidence.watermark.talukaLabel,

          evidence.watermark.districtLabel,

          evidence.watermark.stateLabel,

        ]

          .filter((line) => line && !line.endsWith('—'))

          .join(' · ')}

      </Text>

    </View>

  );

}



const styles = StyleSheet.create({

  wrap: {

    gap: 10,

    backgroundColor: colors.card,

    borderRadius: 16,

    borderWidth: 1,

    borderColor: colors.border,

    padding: 16,

  },

  title: { fontSize: 15, fontWeight: '700', color: colors.text },

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

});


