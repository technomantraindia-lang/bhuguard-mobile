import { Image, StyleSheet, Text, View } from 'react-native';

import type { OfficerMapMarker } from '../../hooks/useFieldOfficerDashboardData';
import { officerShadow, officerTheme } from '../../theme/officerDashboardTheme';

const MAP_IMAGE_URI =
  'https://lh3.googleusercontent.com/aida-public/AB6AXuBbvlBm6ityzuEKTJ3OHLv4IfgoyDNGIM9_cy8HRPuYl8rxce54xeMIgacJNhHEqkK_pHaVwh2-4qRKZG8pgQ3ZERL02nm9VukTD_0PWTEB7K2aMY9sW_TRdEyoY9u1EmG7Ua35MU1CbsGt7dT6Nm0JmyVkR9je8dov1AIhz7O-f_LMkIc7BmlEQjSrs_ucMr2M303qlPawDlf6dA8euR91jBaoyfdHeEfbe-TTAhm-rZPWGp3I_VD9HA';

interface OfficerFieldMapOverviewProps {
  markers: OfficerMapMarker[];
}

function markerColor(tone: OfficerMapMarker['tone']): string {
  switch (tone) {
    case 'alert':
      return officerTheme.error;
    case 'warning':
      return officerTheme.error;
    default:
      return officerTheme.primary;
  }
}

export function OfficerFieldMapOverview({ markers = [] }: OfficerFieldMapOverviewProps) {
  const safeMarkers = Array.isArray(markers) ? markers : [];
  const displayMarkers =
    safeMarkers.length > 0
      ? safeMarkers
      : [
          { id: 'marker-1', label: '1', tone: 'primary' as const, top: 33, left: 25 },
          { id: 'marker-2', label: '!', tone: 'alert' as const, top: 75, left: 67 },
        ];

  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>Field Map Overview</Text>
      <View style={styles.mapCard}>
        <Image source={{ uri: MAP_IMAGE_URI }} style={styles.mapImage} resizeMode="cover" />

        {displayMarkers.slice(0, 3).map((marker) => (
          <View
            key={marker.id}
            style={[
              styles.marker,
              {
                top: `${marker.top}%`,
                left: `${marker.left}%`,
                backgroundColor: markerColor(marker.tone),
              },
              marker.tone === 'alert' && styles.markerAlert,
            ]}
          >
            <Text style={styles.markerText}>{marker.label}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginBottom: 32,
  },
  title: {
    fontSize: 18,
    lineHeight: 24,
    fontWeight: '600',
    color: officerTheme.onSurface,
    marginBottom: 16,
  },
  mapCard: {
    height: 192,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: officerTheme.outlineVariant,
    ...officerShadow,
    position: 'relative',
  },
  mapImage: {
    width: '100%',
    height: '100%',
  },
  marker: {
    position: 'absolute',
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: officerTheme.onPrimary,
    ...officerShadow,
  },
  markerAlert: {
    shadowColor: officerTheme.error,
    shadowOpacity: 0.35,
  },
  markerText: {
    color: officerTheme.onPrimary,
    fontSize: 10,
    lineHeight: 12,
    fontWeight: '500',
  },
});
