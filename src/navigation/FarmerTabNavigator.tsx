import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

import { FarmerDashboard } from '../screens/farmer/FarmerDashboard';
import { FarmerProfileScreen } from '../screens/farmer/FarmerProfileScreen';
import { FarmerActivitiesTabScreen } from '../screens/tabs/FarmerActivitiesTabScreen';
import { FarmerFarmsTabScreen } from '../screens/tabs/FarmerFarmsTabScreen';
import type { FarmerTabParamList } from './types';
import { FarmerBottomTabBar } from './FarmerBottomTabBar';
import { dashboardTheme } from '../theme/bhuguardDashboardTheme';

const Tab = createBottomTabNavigator<FarmerTabParamList>();

export function FarmerTabNavigator() {
  return (
    <Tab.Navigator
      tabBar={(props) => <FarmerBottomTabBar {...props} />}
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
        tabBarStyle: {
          backgroundColor: dashboardTheme.surfaceLowest,
          borderTopColor: dashboardTheme.outlineVariant,
        },
      }}
    >
      <Tab.Screen name="Home" component={FarmerDashboard} />
      <Tab.Screen name="Farms" component={FarmerFarmsTabScreen} />
      <Tab.Screen name="Activities" component={FarmerActivitiesTabScreen} />
      <Tab.Screen name="Profile" component={FarmerProfileScreen} />
    </Tab.Navigator>
  );
}
