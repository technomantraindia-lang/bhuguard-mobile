import { RefreshControl, ScrollView, StyleSheet, View } from 'react-native';

import { SafeAreaView } from 'react-native-safe-area-context';

import { useNavigation } from '@react-navigation/native';

import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';

import type { CompositeNavigationProp } from '@react-navigation/native';

import type { NativeStackNavigationProp } from '@react-navigation/native-stack';



import { ErrorState } from '../../components/ErrorState';

import { LoadingState } from '../../components/LoadingState';

import { OfficerActiveDutyCard } from '../../components/officer/OfficerActiveDutyCard';

import { OfficerDashboardHeader } from '../../components/officer/OfficerDashboardHeader';

import { OfficerFieldMapOverview } from '../../components/officer/OfficerFieldMapOverview';

import { OfficerQuickActions } from '../../components/officer/OfficerQuickActions';

import { OfficerTaskQueue } from '../../components/officer/OfficerTaskQueue';

import type { OfficerDashboardTask } from '../../hooks/useFieldOfficerDashboardData';

import { useFieldOfficerDashboardData } from '../../hooks/useFieldOfficerDashboardData';

import type { FieldOfficerStackParamList, FieldOfficerTabParamList } from '../../navigation/types';

import { officerTheme } from '../../theme/officerDashboardTheme';



type Nav = CompositeNavigationProp<

  BottomTabNavigationProp<FieldOfficerTabParamList, 'Home'>,

  NativeStackNavigationProp<FieldOfficerStackParamList>

>;



export function FieldOfficerDashboard() {

  const navigation = useNavigation<Nav>();

  const { data, loading, error, reload } = useFieldOfficerDashboardData();



  const handleTaskPress = (task: OfficerDashboardTask) => {

    if (task.assignmentId) {

      navigation.navigate('FieldOfficerAssignmentDetail', { assignmentId: task.assignmentId });

      return;

    }



    if (task.id.startsWith('farmer-')) {

      navigation.navigate('StitchScreen', { screenKey: 'officer_farmers_list' });

      return;

    }



    if (task.id.startsWith('soil-')) {

      navigation.navigate('FieldOfficerSoilSamples');

    }

  };



  if (loading && !data) {

    return (

      <SafeAreaView style={styles.safe}>

        <LoadingState message="Loading field duty dashboard..." />

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

      <OfficerDashboardHeader officerName={dashboard.officerName} onSyncPress={reload} />



      <ScrollView

        style={styles.scroll}

        contentContainerStyle={styles.container}

        showsVerticalScrollIndicator={false}

        refreshControl={

          <RefreshControl refreshing={loading} onRefresh={reload} tintColor={officerTheme.primary} />

        }

      >

        <OfficerActiveDutyCard

          assignedFarmersCount={dashboard.assignedFarmersCount}

          pendingVerificationsCount={dashboard.pendingVerificationsCount}

          urgentPendingCount={dashboard.urgentPendingCount}

        />



        <OfficerQuickActions

          actions={[

            {

              key: 'onboard',

              label: 'Onboard Farmer',

              icon: 'person_add',

              onPress: () => navigation.navigate('FarmerOnboardingStart'),

            },

            {

              key: 'qr',

              label: 'Scan QR',

              icon: 'qr_code_scanner',

              onPress: () => navigation.navigate('StitchScreen', { screenKey: 'qr_scanner' }),

            },

            {

              key: 'map',

              label: 'Map View',

              icon: 'map',

              onPress: () => navigation.navigate('Map'),

            },

            {

              key: 'offline',

              label: 'Offline Logs',

              icon: 'cloud_off',

              onPress: () => navigation.navigate('FieldOfficerActivityLogs'),

            },

          ]}

        />



        <OfficerTaskQueue tasks={dashboard.tasks} onTaskPress={handleTaskPress} />



        <OfficerFieldMapOverview markers={dashboard.mapMarkers} />



        <View style={styles.bottomSpacer} />

      </ScrollView>

    </SafeAreaView>

  );

}



const styles = StyleSheet.create({

  safe: {

    flex: 1,

    backgroundColor: officerTheme.background,

  },

  scroll: {

    flex: 1,

  },

  container: {

    paddingHorizontal: officerTheme.marginMobile,

    paddingTop: 16,

    paddingBottom: 8,

    gap: 0,

  },

  bottomSpacer: {

    height: 8,

  },

});


