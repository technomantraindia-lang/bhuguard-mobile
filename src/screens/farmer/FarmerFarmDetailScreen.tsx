import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { ErrorState } from '../../components/ErrorState';
import { LoadingState } from '../../components/LoadingState';
import { FarmDetailBottomNav } from '../../components/farmer/farms/detail/FarmDetailBottomNav';
import { FarmDetailHeader } from '../../components/farmer/farms/detail/FarmDetailHeader';
import { FarmDetailHeroCard } from '../../components/farmer/farms/detail/FarmDetailHeroCard';
import { FarmSatelliteMapSection } from '../../components/farmer/farms/detail/FarmSatelliteMapSection';
import {
  FarmActivitySummaryCard,
  FarmDetailActionButtons,
  FarmProjectInfoSection,
  FarmRecentActivitiesSection,
  FarmSummaryCard,
  FarmVerificationTimeline,
} from '../../components/farmer/farms/detail/FarmDetailSections';
import { useFarmDetailData } from '../../hooks/useFarmDetailData';
import type { FarmerStackParamList } from '../../navigation/types';
import { dashboardTheme } from '../../theme/bhuguardDashboardTheme';
import { openGoogleMaps } from '../../utils/farmMapHelpers';

type Props = NativeStackScreenProps<FarmerStackParamList, 'FarmerFarmDetail'>;

export function FarmerFarmDetailScreen({ navigation, route }: Props) {
  const { farmId } = route.params;
  const { detail, farmRecord, loading, error, reload } = useFarmDetailData(farmId);

  if (loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <LoadingState message="Loading farm details..." />
      </SafeAreaView>
    );
  }

  if (error || !detail || !farmRecord) {
    return (
      <SafeAreaView style={styles.safe}>
        <ErrorState message={error ?? 'Farm not found.'} onRetry={reload} />
      </SafeAreaView>
    );
  }

  const openMaps = () => {
    void openGoogleMaps(detail.centerCoordinates, detail.farmName);
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <FarmDetailHeader
        farmName={detail.farmName}
        onBack={() => navigation.goBack()}
        onNotificationsPress={() => navigation.navigate('FarmerNotifications')}
        onEditPress={() => navigation.navigate('FarmerEditFarm', { farmId })}
      />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <FarmDetailHeroCard
          farmName={detail.farmName}
          farmCode={detail.farmCode}
          farmerName={detail.farm.farmerName}
          statusLabel={detail.statusLabel}
          verificationLabel={detail.verificationLabel}
          projectName={detail.projectName}
          areaLabel={detail.areaLabel}
        />

        <FarmSatelliteMapSection
          farmRecord={farmRecord}
          areaLabel={detail.areaLabel}
          center={detail.centerCoordinates}
          polygonCoordinatesLabel={detail.polygonCoordinatesLabel}
          onOpenGoogleMaps={openMaps}
          onOpenFullScreen={() => navigation.navigate('FarmerFarmMapFullScreen', { farmId })}
          onRefresh={() => void reload()}
          onEditBoundary={() => navigation.navigate('FarmBoundaryStart', { farmId })}
          onCaptureBoundaryWithCamera={() => navigation.navigate('CameraBoundaryStart', { farmId })}
          onViewBoundaryPhotos={() => navigation.navigate('BoundaryPhotoGallery', { farmId })}
          onRecaptureBoundary={() => navigation.navigate('CameraBoundaryStart', { farmId })}
        />

        <FarmSummaryCard
          locationLabel={detail.locationLabel}
          surveyNumber={detail.surveyNumber}
          areaLabel={detail.areaLabel}
          cropLabel={detail.cropLabel}
          soilLabel={detail.soilLabel}
          irrigationLabel={detail.irrigationLabel}
          statusLabel={detail.statusLabel}
          mappedLabel={detail.mappedLabel}
          coordinatesLabel={detail.coordinatesLabel}
        />

        <FarmProjectInfoSection
          projectName={detail.projectName}
          enrollmentDate={detail.enrollmentDate}
          verificationLabel={detail.verificationLabel}
          carbonProgramLabel={detail.carbonProgramLabel}
          fieldOfficerName={detail.fieldOfficerName}
        />

        <FarmActivitySummaryCard
          summary={detail.activitySummary}
          onViewActivities={() => navigation.navigate('FarmerActivityLogs')}
        />

        <FarmVerificationTimeline steps={detail.verificationSteps} />

        <FarmRecentActivitiesSection
          activities={detail.recentActivities}
          onActivityPress={(activityId) =>
            navigation.navigate('FarmerActivityDetail', { activityId })
          }
        />

        <FarmDetailActionButtons
          onOpenGoogleMaps={openMaps}
          onEditFarm={() => navigation.navigate('FarmerEditFarm', { farmId })}
          onAddActivity={() => navigation.navigate('FarmerFarmActivity', { farmId })}
          onBiocharUpdates={() => navigation.navigate('FarmerBiocharUpdates')}
        />
      </ScrollView>

      <FarmDetailBottomNav />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: dashboardTheme.background,
  },
  content: {
    padding: dashboardTheme.marginMobile,
    gap: 16,
    paddingBottom: 24,
  },
});
