import { memo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { ViewAnnotation } from '@maplibre/maplibre-react-native';

import { BhuguardMaterialIcon } from '../../shared/BhuguardMaterialIcon';
import type { FarmIdentityLabelData } from '../../../utils/farmIdentityMapLabel';
import { colors } from '../../../theme/colors';

type Props = {
  label: FarmIdentityLabelData;
};

/**
 * Non-draggable read-only map label for the selected farm on View Farm Mapping.
 */
export const FarmIdentityMapLabel = memo(function FarmIdentityMapLabel({ label }: Props) {
  return (
    <ViewAnnotation
      id="farm-identity-label"
      lngLat={[label.coordinate.longitude, label.coordinate.latitude]}
      draggable={false}
      anchor="bottom"
    >
      <View collapsable={false} style={styles.card}>
        <View style={styles.headerRow}>
          <BhuguardMaterialIcon name="landscape" size={14} color={colors.primary} />
          <Text style={styles.farmName} numberOfLines={1}>
            {label.farmName}
          </Text>
        </View>
        <Text style={styles.farmId} numberOfLines={1}>
          {label.farmId}
        </Text>
        <Text style={styles.farmerLine} numberOfLines={1}>
          {label.farmerName} · {label.farmerId}
        </Text>
      </View>
    </ViewAnnotation>
  );
});

const styles = StyleSheet.create({
  card: {
    maxWidth: 220,
    minWidth: 148,
    backgroundColor: '#FFFBF3',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(24, 116, 58, 0.22)',
    paddingHorizontal: 10,
    paddingVertical: 8,
    gap: 2,
    shadowColor: '#0B1F12',
    shadowOpacity: 0.22,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 4,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  farmName: {
    flex: 1,
    color: '#14532D',
    fontSize: 13,
    fontWeight: '800',
  },
  farmId: {
    color: '#166534',
    fontSize: 12,
    fontWeight: '700',
  },
  farmerLine: {
    color: '#3F6212',
    fontSize: 11,
    fontWeight: '600',
  },
});
