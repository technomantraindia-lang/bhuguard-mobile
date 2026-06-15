import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';



import { FieldOfficerDashboard } from '../screens/officer/FieldOfficerDashboard';

import { FieldOfficerProfileScreen } from '../screens/officer/FieldOfficerProfileScreen';

import { OfficerFarmersTabScreen } from '../screens/tabs/OfficerFarmersTabScreen';

import { OfficerMapTabScreen } from '../screens/tabs/OfficerMapTabScreen';

import { OfficerVisitsTabScreen } from '../screens/tabs/OfficerVisitsTabScreen';

import type { FieldOfficerTabParamList } from './types';

import { OfficerBottomTabBar } from './OfficerBottomTabBar';

import { officerTheme } from '../theme/officerDashboardTheme';



const Tab = createBottomTabNavigator<FieldOfficerTabParamList>();



export function OfficerTabNavigator() {

  return (

    <Tab.Navigator

      tabBar={(props) => <OfficerBottomTabBar {...props} />}

      screenOptions={{

        headerShown: false,

        tabBarShowLabel: false,

        tabBarStyle: {

          backgroundColor: officerTheme.surfaceLowest,

          borderTopColor: officerTheme.outlineVariant,

        },

      }}

    >

      <Tab.Screen name="Home" component={FieldOfficerDashboard} options={{ tabBarLabel: 'Tasks' }} />

      <Tab.Screen name="Map" component={OfficerMapTabScreen} options={{ tabBarLabel: 'Map' }} />

      <Tab.Screen name="Farmers" component={OfficerFarmersTabScreen} options={{ tabBarLabel: 'Farmers' }} />

      <Tab.Screen name="Profile" component={FieldOfficerProfileScreen} options={{ tabBarLabel: 'Profile' }} />

      <Tab.Screen

        name="Visits"

        component={OfficerVisitsTabScreen}

        options={{

          tabBarButton: () => null,

          tabBarItemStyle: { display: 'none' },

        }}

      />

    </Tab.Navigator>

  );

}


