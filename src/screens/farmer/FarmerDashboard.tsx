import { RefreshControl, ScrollView, StyleSheet, View } from 'react-native';

import { SafeAreaView } from 'react-native-safe-area-context';

import { useNavigation } from '@react-navigation/native';

import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';

import type { CompositeNavigationProp } from '@react-navigation/native';

import type { NativeStackNavigationProp } from '@react-navigation/native-stack';



import { ErrorState } from '../../components/ErrorState';

import { LoadingState } from '../../components/LoadingState';

import { FarmerActivitiesFab } from '../../components/farmer/activities/FarmerActivitiesFab';

import { FarmerDashboardHeader } from '../../components/farmer/FarmerDashboardHeader';

import { FarmerHeroSummaryCard } from '../../components/farmer/FarmerHeroSummaryCard';

import { FarmerQuickAccessSection } from '../../components/farmer/FarmerQuickAccessSection';

import { FarmerQuickStatsGrid } from '../../components/farmer/FarmerQuickStatsGrid';

import { FarmerRecentActivitiesSection } from '../../components/farmer/FarmerRecentActivitiesSection';

import { FarmerVerificationSummaryCard } from '../../components/farmer/FarmerVerificationSummaryCard';

import { useFarmerDashboardData } from '../../hooks/useFarmerDashboardData';

import type { FarmerStackParamList, FarmerTabParamList } from '../../navigation/types';

import { dashboardTheme } from '../../theme/bhuguardDashboardTheme';



type Nav = CompositeNavigationProp<

  BottomTabNavigationProp<FarmerTabParamList, 'Home'>,

  NativeStackNavigationProp<FarmerStackParamList>

>;



export function FarmerDashboard() {

  const navigation = useNavigation<Nav>();

  const { data, loading, error, reload } = useFarmerDashboardData();



  const openProfile = () => navigation.navigate('Profile');

  const openNotifications = () => navigation.navigate('FarmerNotifications');

  const openFarms = () => navigation.navigate('Farms');

  const openActivities = () => navigation.navigate('Activities');

  const openReports = () => navigation.navigate('Reports');

  const openSubmitActivity = () => navigation.navigate('FarmerSubmitActivity');

  const openBaselineAssessment = () => navigation.navigate('FarmerAddBaselineAssessment');

  const openAddressDetails = () => navigation.navigate('FarmerAddressDetails');

  const openProjectDetails = () => navigation.navigate('FarmerProjectDetails');

  const openCarbonProgress = () => navigation.navigate('FarmerCarbonCalculations');

  const openBenefits = () => navigation.navigate('FarmerBenefits');

  const openSupport = () => navigation.navigate('FarmerSupport');

  const openVerificationStatus = () => navigation.navigate('FarmerVerificationStatus');

  const openActivityDetail = (activityId: number) => navigation.navigate('FarmerActivityDetail', { activityId });



  if (loading && !data) {

    return (

      <SafeAreaView style={styles.safe}>

        <LoadingState message="Loading your dashboard..." />

      </SafeAreaView>

    );

  }



  if (error && !data) {

    return (

      <SafeAreaView style={styles.safe}>

        <ErrorState message={error} onRetry={reload} />

      </SafeAreaView>

    );

  }



  const dashboard = data!;



  return (

    <SafeAreaView style={styles.safe} edges={['top']}>

      <FarmerDashboardHeader

        firstName={dashboard.firstName}

        onNotificationsPress={openNotifications}

        onProfilePress={openProfile}

      />



      <ScrollView

        style={styles.scroll}

        contentContainerStyle={styles.container}

        showsVerticalScrollIndicator={false}

        refreshControl={

          <RefreshControl refreshing={loading} onRefresh={reload} tintColor={dashboardTheme.primary} />

        }

      >

        <FarmerHeroSummaryCard

          farmerCode={dashboard.farmerCode}

          fullName={dashboard.fullName}

          mobile={dashboard.mobile}

          location={dashboard.location}

          projectName={dashboard.projectName}

          landInfo={dashboard.landInfo}

          isVerified={dashboard.isVerified}

          totalFarms={dashboard.totalFarmsCount}

          mappedFarms={dashboard.mappedFarmsCount}

          activitiesCount={dashboard.activitiesSubmittedCount}

          verificationStatusLabel={dashboard.verificationStatusLabel}

          onProfilePress={openProfile}

          onLocationPress={openAddressDetails}

          onProjectPress={openProjectDetails}

          onTotalLandPress={openFarms}

        />



        <FarmerQuickStatsGrid

          totalFarms={dashboard.totalFarmsCount}

          activitiesSubmitted={dashboard.activitiesSubmittedCount}

          estimatedCarbon={dashboard.estimatedCarbonLabel}

          creditsEligible={dashboard.creditsEligibleLabel}

          pendingActivities={dashboard.pendingActivitiesCount}

          approvedActivities={dashboard.approvedActivitiesCount}

          lastVerificationDate={dashboard.lastVerificationDate}

          onTotalFarmsPress={openFarms}

          onActivitiesPress={openActivities}

          onCarbonPress={openCarbonProgress}

          onCreditsPress={openBenefits}

          onPendingPress={openActivities}

          onApprovedPress={openActivities}

          onVerificationPress={openVerificationStatus}

        />



        <FarmerQuickAccessSection

          onViewFarms={openFarms}

          onSubmitActivity={openSubmitActivity}

          onBaselineAssessment={openBaselineAssessment}

          onVerificationStatus={openVerificationStatus}

          onCarbonProgress={openCarbonProgress}

          onReports={openReports}

          onBenefits={openBenefits}

          onSupport={openSupport}

        />



        <FarmerRecentActivitiesSection

          activities={dashboard.recentActivities}

          onActivityPress={openActivityDetail}

          onViewAllPress={openActivities}

        />



        <FarmerVerificationSummaryCard

          lastVisitLabel={dashboard.verificationSummary.lastVisitLabel}

          fieldOfficerName={dashboard.verificationSummary.fieldOfficerName}

          statusLabel={dashboard.verificationSummary.statusLabel}

          onPress={openVerificationStatus}

        />



        <View style={styles.bottomSpacer} />

      </ScrollView>



      <FarmerActivitiesFab onPress={openSubmitActivity} />

    </SafeAreaView>

  );

}



const styles = StyleSheet.create({

  safe: {

    flex: 1,

    backgroundColor: dashboardTheme.background,

  },

  scroll: {

    flex: 1,

  },

  container: {

    paddingHorizontal: dashboardTheme.marginMobile,

    paddingTop: 12,

    paddingBottom: 8,

    gap: 24,

  },

  bottomSpacer: {

    height: 96,

  },

});


