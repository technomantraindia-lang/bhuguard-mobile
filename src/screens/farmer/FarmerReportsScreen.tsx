import { useState } from 'react';
import { Alert, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type { CompositeNavigationProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { getApiErrorMessage } from '../../api/authApi';
import { ErrorState } from '../../components/ErrorState';
import { LoadingState } from '../../components/LoadingState';
import { FarmerAvailableReportCard } from '../../components/farmer/FarmerAvailableReportCard';
import { FarmerBenefitsSummaryCard } from '../../components/farmer/FarmerBenefitsSummaryCard';
import { FarmerCarbonProgressCard } from '../../components/farmer/FarmerCarbonProgressCard';
import { FarmerDownloadsCenterCard } from '../../components/farmer/FarmerDownloadsCenterCard';
import { FarmerReportDownloadModal } from '../../components/farmer/FarmerReportDownloadModal';
import { FarmerReportHistorySection } from '../../components/farmer/FarmerReportHistorySection';
import { FarmerReportsHeader } from '../../components/farmer/FarmerReportsHeader';
import { useFarmerReportsData } from '../../hooks/useFarmerReportsData';
import type { FarmerStackParamList, FarmerTabParamList } from '../../navigation/types';
import { dashboardTheme } from '../../theme/bhuguardDashboardTheme';
import type { FarmerReportItem } from '../../utils/farmerReportHelpers';
import { downloadAllFarmerReports, downloadFarmerReport } from '../../utils/reportDownload';

type Nav = CompositeNavigationProp<
  BottomTabNavigationProp<FarmerTabParamList, 'Reports'>,
  NativeStackNavigationProp<FarmerStackParamList>
>;

type DownloadModalState =
  | { visible: false }
  | { visible: true; variant: 'single'; reportTitle: string }
  | { visible: true; variant: 'bulk'; downloadCount: number };

export function FarmerReportsScreen() {
  const navigation = useNavigation<Nav>();
  const { reports, history, summary, loading, error, reload, downloadableReports, setDownloadedIds } =
    useFarmerReportsData();
  const [downloadModal, setDownloadModal] = useState<DownloadModalState>({ visible: false });
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const handleViewReport = (report: FarmerReportItem) => {
    switch (report.catalogId) {
      case 'soil':
        navigation.navigate('FarmerSoilSamples');
        return;
      case 'baseline':
        navigation.navigate('FarmerBaselineAssessments');
        return;
      case 'monitoring':
        if (report.sourceId > 0) {
          navigation.navigate('FarmerCarbonCalculationDetail', { id: report.sourceId });
          return;
        }
        navigation.navigate('FarmerCarbonCalculations');
        return;
      case 'verification':
        navigation.navigate('FarmerVerificationStatus');
        return;
      case 'activity':
        navigation.navigate('FarmerActivityLogs');
        return;
      default:
        if (report.sourceType === 'final_report' && report.sourceId > 0) {
          navigation.navigate('FarmerFinalReportDetail', { id: report.sourceId });
          return;
        }
        navigation.navigate('FarmerFinalReports');
    }
  };

  const handleDownloadReport = async (report: FarmerReportItem) => {
    setDownloadingId(report.id);

    try {
      const result = await downloadFarmerReport(report);

      if (!result.success) {
        Alert.alert('Download failed', result.message ?? 'Unable to download this report right now.');
        return;
      }

      setDownloadedIds((current) => [...new Set([...current, report.id])]);
      setDownloadModal({ visible: true, variant: 'single', reportTitle: report.title });
      await reload();
    } catch (err) {
      Alert.alert('Download failed', getApiErrorMessage(err, 'Unable to download this report right now.'));
    } finally {
      setDownloadingId(null);
    }
  };

  const handleDownloadAll = async () => {
    const targets = downloadableReports.length > 0 ? downloadableReports : reports;
    setDownloadingId('bulk');

    try {
      const result = await downloadAllFarmerReports(targets);

      if (!result.success) {
        Alert.alert('Download failed', result.message ?? 'Unable to download reports right now.');
        return;
      }

      setDownloadModal({ visible: true, variant: 'bulk', downloadCount: targets.length });
      await reload();
    } catch (err) {
      Alert.alert('Download failed', getApiErrorMessage(err, 'Unable to download reports right now.'));
    } finally {
      setDownloadingId(null);
    }
  };

  if (loading && !summary) {
    return (
      <SafeAreaView style={styles.safe}>
        <LoadingState message="Loading reports and downloads..." />
      </SafeAreaView>
    );
  }

  if (error && !summary) {
    return (
      <SafeAreaView style={styles.safe}>
        <ErrorState message={error} onRetry={reload} />
      </SafeAreaView>
    );
  }

  const reportSummary = summary!;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <FarmerReportsHeader
        onBack={() => navigation.navigate('Home')}
        onNotificationsPress={() => navigation.navigate('FarmerNotifications')}
        onProfilePress={() => navigation.navigate('Profile')}
      />

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={reload} tintColor={dashboardTheme.primary} />
        }
      >
        <Text style={styles.pageTitle}>Reports & Downloads</Text>
        <Text style={styles.subtitle}>View, track and download your farm reports.</Text>

        <FarmerCarbonProgressCard
          summary={reportSummary}
          onViewSummary={() => navigation.navigate('FarmerCarbonCalculations')}
        />

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Available Reports</Text>
        </View>

        <View style={styles.reportList}>
          {reports.map((report) => (
            <FarmerAvailableReportCard
              key={report.id}
              report={report}
              downloading={downloadingId === report.id}
              onView={() => handleViewReport(report)}
              onDownload={() => void handleDownloadReport(report)}
            />
          ))}
        </View>

        <FarmerReportHistorySection items={history} />

        <FarmerDownloadsCenterCard summary={reportSummary} onDownloadAll={() => void handleDownloadAll()} />

        <FarmerBenefitsSummaryCard
          summary={reportSummary}
          onViewDetails={() => navigation.navigate('FarmerCarbonCalculations')}
        />
      </ScrollView>

      <FarmerReportDownloadModal
        visible={downloadModal.visible}
        variant={downloadModal.visible ? downloadModal.variant : 'single'}
        reportTitle={downloadModal.visible && downloadModal.variant === 'single' ? downloadModal.reportTitle : undefined}
        downloadCount={downloadModal.visible && downloadModal.variant === 'bulk' ? downloadModal.downloadCount : 0}
        onClose={() => setDownloadModal({ visible: false })}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: dashboardTheme.background,
  },
  content: {
    paddingHorizontal: dashboardTheme.marginMobile,
    paddingBottom: 120,
    gap: 16,
  },
  pageTitle: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '700',
    color: dashboardTheme.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 1,
    textAlign: 'center',
    marginTop: 4,
  },
  subtitle: {
    fontSize: 16,
    lineHeight: 24,
    color: dashboardTheme.onSurfaceVariant,
    textAlign: 'center',
    paddingHorizontal: 8,
    marginBottom: 4,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 20,
    lineHeight: 28,
    fontWeight: '600',
    color: dashboardTheme.onSurface,
  },
  reportList: {
    gap: 12,
  },
});
