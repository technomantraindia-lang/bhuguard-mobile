import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { ArtisanBiocharProductionScreen } from '../screens/artisan/ArtisanBiocharProductionScreen';
import { ArtisanDashboardScreen } from '../screens/artisan/ArtisanDashboardScreen';
import { ArtisanFarmLookupScreen } from '../screens/artisan/ArtisanFarmLookupScreen';
import { ArtisanProductionRecordsScreen } from '../screens/artisan/ArtisanProductionRecordsScreen';
import { ArtisanProfileScreen } from '../screens/artisan/ArtisanProfileScreen';
import type { ArtisanStackParamList } from './types';

const Stack = createNativeStackNavigator<ArtisanStackParamList>();

export function ArtisanNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }} initialRouteName="ArtisanDashboard">
      <Stack.Screen name="ArtisanDashboard" component={ArtisanDashboardScreen} />
      <Stack.Screen name="ArtisanFarmLookup" component={ArtisanFarmLookupScreen} />
      <Stack.Screen name="ArtisanBiocharProduction" component={ArtisanBiocharProductionScreen} />
      <Stack.Screen name="ArtisanProductionRecords" component={ArtisanProductionRecordsScreen} />
      <Stack.Screen name="ArtisanProfile" component={ArtisanProfileScreen} />
    </Stack.Navigator>
  );
}
