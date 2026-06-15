import { ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { DashboardCard } from '../../components/DashboardCard';
import { ScreenHeader } from '../../components/ScreenHeader';
import type { CompanyStackParamList } from '../../navigation/types';
import { colors, spacing } from '../../theme';

type Nav = NativeStackNavigationProp<CompanyStackParamList>;

export function CompanyRecordsTabScreen() {
  const navigation = useNavigation<Nav>();

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container}>
        <ScreenHeader title="Records" subtitle="Environmental and carbon records" />
        <DashboardCard title="Waste Records" subtitle="Waste management data" onPress={() => navigation.navigate('CompanyWasteRecords')} />
        <DashboardCard title="Industrial Carbon" subtitle="Emission records" onPress={() => navigation.navigate('CompanyIndustrialCarbonRecords')} />
        <DashboardCard title="Biochar Records" subtitle="Biochar production" onPress={() => navigation.navigate('CompanyBiocharRecords')} />
        <DashboardCard title="Service Submissions" subtitle="Submitted services" onPress={() => navigation.navigate('CompanyServiceSubmissions')} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  container: { padding: spacing.screen, gap: spacing.md, paddingBottom: spacing.xxxl },
});
