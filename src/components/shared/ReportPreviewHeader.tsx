import { StyleSheet, Text, View } from 'react-native';

import { LOGO_SIZES } from '../../constants/branding';
import { useNavigateToFarmerReports } from '../../hooks/useBrandedNavigation';
import { BhuguardLogo } from './BhuguardLogo';

export function ReportPreviewHeader() {
  const goReports = useNavigateToFarmerReports();

  return (
    <View style={styles.wrap}>
      <BhuguardLogo size={LOGO_SIZES.moduleHeader} onPress={goReports} accessibilityLabel="Open reports" />
      <Text style={styles.title}>Bhuguard Verification Report</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 8,
    marginBottom: 8,
  },
  title: {
    flex: 1,
    fontSize: 16,
    fontWeight: '700',
    color: '#004A20',
  },
});
