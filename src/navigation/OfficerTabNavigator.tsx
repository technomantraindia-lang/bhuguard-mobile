import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

import { FieldOfficerDashboard } from '../screens/officer/FieldOfficerDashboard';
import { FieldOfficerProfileScreen } from '../screens/officer/FieldOfficerProfileScreen';
import { FieldOfficerFarmersScreen } from '../screens/officer/FieldOfficerFarmersScreen';
import { OfficerMapTabScreen } from '../screens/tabs/OfficerMapTabScreen';
import { OfficerReportsTabScreen } from '../screens/tabs/OfficerReportsTabScreen';
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
        lazy: true,
        tabBarStyle: {
          backgroundColor: officerTheme.surfaceLowest,
          borderTopColor: officerTheme.outlineVariant,
        },
      }}
    >
      <Tab.Screen name="Home" component={FieldOfficerDashboard} />
      <Tab.Screen name="Farmers" component={FieldOfficerFarmersScreen} />
      <Tab.Screen name="Visits" component={OfficerVisitsTabScreen} />
      <Tab.Screen name="Reports" component={OfficerReportsTabScreen} />
      <Tab.Screen name="Profile" component={FieldOfficerProfileScreen} />
      <Tab.Screen
        name="Map"
        component={OfficerMapTabScreen}
        options={{
          tabBarButton: () => null,
          tabBarItemStyle: { display: 'none' },
        }}
      />
    </Tab.Navigator>
  );
}
