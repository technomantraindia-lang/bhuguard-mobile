import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import type { FieldOfficerStackParamList } from '../../navigation/types';
import { officerTheme } from '../../theme/officerDashboardTheme';

const MAP_PREVIEW_URI =
  'https://lh3.googleusercontent.com/aida-public/AB6AXuBbvlBm6ityzuEKTJ3OHLv4IfgoyDNGIM9_cy8HRPuYl8rxce54xeMIgacJNhHEqkK_pHaVwh2-4qRKZG8pgQ3ZERL02nm9VukTD_0PWTEB7K2aMY9sW_TRdEyoY9u1EmG7Ua35MU1CbsGt7dT6Nm0JmyVkR9je8dov1AIhz7O-f_LMkIc7BmlEQjSrs_ucMr2M303qlPawDlf6dA8euR91jBaoyfdHeEfbe-TTAhm-rZPWGp3I_VD9HA';

type Props = NativeStackScreenProps<FieldOfficerStackParamList, 'OfficerGpsVerificationMap'>;

export function OfficerGpsVerificationMapScreen({ route, navigation }: Props) {
  const { latitude, longitude, distanceKm } = route.params;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()}>
          <Text style={styles.back}>Back</Text>
        </Pressable>
        <Text style={styles.title}>GPS Verification Map</Text>
      </View>
      <View style={styles.content}>
        <Image source={{ uri: MAP_PREVIEW_URI }} style={styles.map} resizeMode="cover" />
        <Text style={styles.meta}>Captured: {latitude.toFixed(4)}, {longitude.toFixed(4)}</Text>
        {distanceKm != null ? <Text style={styles.meta}>Distance from farm: {distanceKm} km</Text> : null}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: officerTheme.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
    backgroundColor: officerTheme.surfaceLowest,
    borderBottomWidth: 1,
    borderBottomColor: officerTheme.outlineVariant,
  },
  back: { color: officerTheme.primaryContainer, fontWeight: '700' },
  title: { fontSize: 18, fontWeight: '700', color: officerTheme.onSurface },
  content: { padding: 16, gap: 12 },
  map: { width: '100%', height: 360, borderRadius: 16 },
  meta: { fontSize: 14, fontWeight: '600', color: officerTheme.onSurfaceVariant },
});
