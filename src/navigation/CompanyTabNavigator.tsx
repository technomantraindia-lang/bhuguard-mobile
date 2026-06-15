import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';



import { CompanyDashboard } from '../screens/company/CompanyDashboard';

import { CompanyProfileScreen } from '../screens/company/CompanyProfileScreen';

import { CompanyActivitiesTabScreen } from '../screens/tabs/CompanyActivitiesTabScreen';

import { CompanyMapsTabScreen } from '../screens/tabs/CompanyMapsTabScreen';

import type { CompanyTabParamList } from './types';

import { CompanyBottomTabBar } from './CompanyBottomTabBar';

import { dashboardTheme } from '../theme/bhuguardDashboardTheme';



const Tab = createBottomTabNavigator<CompanyTabParamList>();



export function CompanyTabNavigator() {

  return (

    <Tab.Navigator

      tabBar={(props) => <CompanyBottomTabBar {...props} />}

      screenOptions={{

        headerShown: false,

        tabBarShowLabel: false,

        tabBarStyle: {

          backgroundColor: dashboardTheme.surfaceLowest,

          borderTopColor: dashboardTheme.outlineVariant,

        },

      }}

    >

      <Tab.Screen name="Home" component={CompanyDashboard} options={{ tabBarLabel: 'Dashboard' }} />

      <Tab.Screen name="Activities" component={CompanyActivitiesTabScreen} options={{ tabBarLabel: 'Activities' }} />

      <Tab.Screen name="Maps" component={CompanyMapsTabScreen} options={{ tabBarLabel: 'Maps' }} />

      <Tab.Screen name="Profile" component={CompanyProfileScreen} options={{ tabBarLabel: 'Profile' }} />

    </Tab.Navigator>

  );

}


