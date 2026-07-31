import { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import {
  useFonts,
  PlusJakartaSans_500Medium,
  PlusJakartaSans_600SemiBold,
  PlusJakartaSans_700Bold,
} from '@expo-google-fonts/plus-jakarta-sans';

import { FieldOfficerDashboard } from '../screens/officer/FieldOfficerDashboard';
import { FieldOfficerProfileScreen } from '../screens/officer/FieldOfficerProfileScreen';
import { FieldOfficerFarmersScreen } from '../screens/officer/FieldOfficerFarmersScreen';
import { MyArtisansScreen } from '../screens/officer/MyArtisansScreen';
import { OfficerMapTabScreen } from '../screens/tabs/OfficerMapTabScreen';
import { OfficerVisitsTabScreen } from '../screens/tabs/OfficerVisitsTabScreen';
import type { FieldOfficerTabParamList } from './types';
import { OfficerBottomTabBar } from './OfficerBottomTabBar';
import { officerTheme } from '../theme/officerDashboardTheme';

const Tab = createBottomTabNavigator<FieldOfficerTabParamList>();

export function OfficerTabNavigator() {
  const [fontsLoaded] = useFonts({
    PlusJakartaSans_500Medium,
    PlusJakartaSans_600SemiBold,
    PlusJakartaSans_700Bold,
  });

  useEffect(() => {
    // Fonts optional — UI falls back to system if unavailable.
  }, [fontsLoaded]);

  return (
    <View style={styles.root}>
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
        <Tab.Screen name="MyArtisans" component={MyArtisansScreen} />
        <Tab.Screen name="Profile" component={FieldOfficerProfileScreen} />
        <Tab.Screen
          name="Visits"
          component={OfficerVisitsTabScreen}
          options={{
            tabBarButton: () => null,
            tabBarItemStyle: { display: 'none' },
          }}
        />
        <Tab.Screen
          name="Map"
          component={OfficerMapTabScreen}
          options={{
            tabBarButton: () => null,
            tabBarItemStyle: { display: 'none' },
          }}
        />
      </Tab.Navigator>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: officerTheme.neutral,
  },
});
