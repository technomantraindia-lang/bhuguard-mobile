import { RefreshControl, ScrollView, StyleSheet, View } from 'react-native';

import { SafeAreaView } from 'react-native-safe-area-context';

import { useNavigation } from '@react-navigation/native';

import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';

import type { CompositeNavigationProp } from '@react-navigation/native';

import type { NativeStackNavigationProp } from '@react-navigation/native-stack';



import { CompanyGlobalImpactCard } from '../../components/company/CompanyGlobalImpactCard';

import { CompanyOperationalOverview } from '../../components/company/CompanyOperationalOverview';

import { CompanyPendingApprovals } from '../../components/company/CompanyPendingApprovals';

import { CompanyTaskTracking } from '../../components/company/CompanyTaskTracking';

import { CompanyTopAppBar } from '../../components/company/CompanyTopAppBar';

import { ErrorState } from '../../components/ErrorState';

import { LoadingState } from '../../components/LoadingState';

import type { CompanyPendingApproval } from '../../hooks/useCompanyDashboardData';

import { useCompanyDashboardData } from '../../hooks/useCompanyDashboardData';

import type { CompanyStackParamList, CompanyTabParamList } from '../../navigation/types';

import { dashboardTheme } from '../../theme/bhuguardDashboardTheme';



type Nav = CompositeNavigationProp<

  BottomTabNavigationProp<CompanyTabParamList, 'Home'>,

  NativeStackNavigationProp<CompanyStackParamList>

>;



export function CompanyDashboard() {

  const navigation = useNavigation<Nav>();

  const { data, loading, error, reload } = useCompanyDashboardData();



  const handleReview = (item: CompanyPendingApproval) => {

    if (item.targetRoute === 'submission' && item.targetId) {

      navigation.navigate('CompanyServiceSubmissionDetail', { id: item.targetId });

      return;

    }



    navigation.navigate('StitchScreen', { screenKey: 'company_verification_status' });

  };



  if (loading && !data) {

    return (

      <SafeAreaView style={styles.safe}>

        <LoadingState message="Loading company dashboard..." />

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

      <CompanyTopAppBar

        onMenuPress={() => navigation.navigate('StitchScreen', { screenKey: 'company_dmrv_hub' })}

        onProfilePress={() => navigation.navigate('Profile')}

      />



      <ScrollView

        style={styles.scroll}

        contentContainerStyle={styles.container}

        showsVerticalScrollIndicator={false}

        refreshControl={

          <RefreshControl refreshing={loading} onRefresh={reload} tintColor={dashboardTheme.primary} />

        }

      >

        <CompanyGlobalImpactCard

          totalCarbonCredits={dashboard.totalCarbonCredits}

          activeProjects={dashboard.activeProjects}

          onDetailsPress={() => navigation.navigate('CompanyCarbonCalculations')}

        />



        <CompanyOperationalOverview stats={dashboard.operationalStats} />



        <CompanyPendingApprovals

          items={dashboard.pendingApprovals}

          onViewAll={() => navigation.navigate('Activities')}

          onReview={handleReview}

        />



        <CompanyTaskTracking

          progressPercent={dashboard.taskProgressPercent}

          completedCount={dashboard.tasksCompleted}

          totalCount={dashboard.tasksTotal}

        />



        <View style={styles.bottomSpacer} />

      </ScrollView>

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

    paddingTop: 16,

    paddingBottom: 8,

  },

  bottomSpacer: {

    height: 8,

  },

});


