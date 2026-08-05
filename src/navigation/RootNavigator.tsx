import { useEffect, type ComponentType } from 'react';
import { Platform, Text, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { PreloaderScreen } from '../screens/auth/PreloaderScreen';
import { navigationRef } from './navigationRef';
import type { RootStackParamList } from './types';

const Stack = createNativeStackNavigator<RootStackParamList>();

/** Android Fabric can crash on animated stack replace/reset (IllegalViewOperationException). */
const androidSafeAnimation = Platform.OS === 'android' ? ('none' as const) : undefined;

export function RootNavigator() {
  useEffect(() => {
    console.log('[Bhuguard] RootNavigator mounted');
  }, []);

  return (
    <NavigationContainer ref={navigationRef}>
      <Stack.Navigator
        initialRouteName="Preloader"
        screenOptions={{
          headerShown: false,
          ...(androidSafeAnimation ? { animation: androidSafeAnimation } : null),
        }}
      >
        <Stack.Screen name="Preloader" component={PreloaderScreen} />
        <Stack.Screen
          name="LanguageSelection"
          getComponent={() => require('../screens/auth/LanguageSelectionScreen').LanguageSelectionScreen}
        />
        <Stack.Screen
          name="MobileLogin"
          getComponent={() => require('../screens/auth/MobileLoginScreen').MobileLoginScreen}
        />
        <Stack.Screen
          name="RoleSelection"
          getComponent={() => require('../screens/auth/RoleSelectionScreen').RoleSelectionScreen}
        />
        <Stack.Screen
          name="ApiServerSettings"
          getComponent={() => require('../screens/auth/ApiServerSettingsScreen').ApiServerSettingsScreen}
        />
        <Stack.Screen
          name="FarmerLoginOptions"
          getComponent={() => require('../screens/auth/FarmerLoginOptionsScreen').FarmerLoginOptionsScreen}
        />
        <Stack.Screen
          name="FieldOfficerLogin"
          getComponent={() => require('../screens/auth/FieldOfficerLoginScreen').FieldOfficerLoginScreen}
        />
        <Stack.Screen
          name="ArtisanLogin"
          initialParams={{ role: 'artisan' }}
          getComponent={() => require('../screens/artisan/ArtisanLoginScreen').ArtisanLoginScreen}
        />
        <Stack.Screen
          name="ArtisanProLogin"
          initialParams={{ role: 'artisan_pro' }}
          getComponent={() => require('../screens/artisan/ArtisanLoginScreen').ArtisanLoginScreen}
        />
        <Stack.Screen
          name="PasswordLogin"
          getComponent={() => require('../screens/auth/PasswordLoginScreen').PasswordLoginScreen}
        />
        <Stack.Screen
          name="FarmerOtpLogin"
          getComponent={() => require('../screens/auth/FarmerOtpLoginScreen').FarmerOtpLoginScreen}
        />
        <Stack.Screen
          name="ForgotPassword"
          getComponent={() => require('../screens/auth/ForgotPasswordScreen').ForgotPasswordScreen}
        />
        <Stack.Screen
          name="MpinLogin"
          getComponent={() => require('../screens/auth/MpinLoginScreen').MpinLoginScreen}
        />
        <Stack.Screen
          name="CreateMpin"
          getComponent={() => require('../screens/auth/CreateMpinScreen').CreateMpinScreen}
        />
        <Stack.Screen
          name="SetPattern"
          getComponent={() => require('../screens/auth/SetPatternScreen').SetPatternScreen}
        />
        <Stack.Screen
          name="PatternLogin"
          getComponent={() => require('../screens/auth/PatternLoginScreen').PatternLoginScreen}
        />
        <Stack.Screen
          name="BiometricSetup"
          getComponent={() => require('../screens/auth/BiometricSetupScreen').BiometricSetupScreen}
        />
        <Stack.Screen
          name="OtpVerification"
          getComponent={() => require('../screens/auth/OtpVerificationScreen').OtpVerificationScreen}
        />
        <Stack.Screen
          name="ResetPassword"
          getComponent={() => require('../screens/auth/ResetPasswordScreen').ResetPasswordScreen}
        />
        <Stack.Screen
          name="FarmerApp"
          getComponent={() => require('./FarmerNavigator').FarmerNavigator}
        />
        <Stack.Screen
          name="FieldOfficerApp"
          getComponent={() => {
            try {
              const mod = require('./OfficerNavigator') as {
                OfficerNavigator?: ComponentType;
              };
              if (typeof mod?.OfficerNavigator !== 'function') {
                throw new Error('OfficerNavigator failed to load.');
              }
              return mod.OfficerNavigator;
            } catch (error) {
              console.error('[Bhuguard] OfficerNavigator load failed', error);
              return function OfficerNavigatorFallback() {
                return (
                  <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 }}>
                    <Text style={{ fontWeight: '700', fontSize: 18, marginBottom: 8 }}>
                      Field Officer app could not load
                    </Text>
                    <Text style={{ textAlign: 'center', color: '#555' }}>
                      Restart Metro with a cleared cache, then reopen the app. If the map screen still
                      fails, rebuild the Android dev client so MapLibre native modules are included.
                    </Text>
                  </View>
                );
              };
            }
          }}
        />
        <Stack.Screen
          name="ArtisanApp"
          getComponent={() => {
            try {
              const mod = require('./ArtisanNavigator') as {
                ArtisanNavigator?: ComponentType;
              };
              if (typeof mod?.ArtisanNavigator !== 'function') {
                throw new Error('ArtisanNavigator failed to load.');
              }
              return mod.ArtisanNavigator;
            } catch (error) {
              console.error('[Bhuguard] ArtisanNavigator load failed', error);
              return function ArtisanNavigatorFallback() {
                return (
                  <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 }}>
                    <Text style={{ fontWeight: '700', fontSize: 18, marginBottom: 8 }}>
                      Artisan Pro app could not load
                    </Text>
                    <Text style={{ textAlign: 'center', color: '#555' }}>
                      Restart the app. If this continues, rebuild the development client so NetInfo and
                      SQLite native modules are included.
                    </Text>
                  </View>
                );
              };
            }
          }}
        />
        <Stack.Screen
          name="ArtisanProApp"
          getComponent={() => {
            try {
              const mod = require('./ArtisanProNavigator') as {
                ArtisanProNavigator?: ComponentType;
              };
              if (typeof mod?.ArtisanProNavigator !== 'function') {
                throw new Error('ArtisanProNavigator failed to load.');
              }
              return mod.ArtisanProNavigator;
            } catch (error) {
              console.error('[Bhuguard] ArtisanProNavigator load failed', error);
              return function ArtisanProNavigatorFallback() {
                return (
                  <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 }}>
                    <Text style={{ fontWeight: '700', fontSize: 18, marginBottom: 8 }}>
                      Artisan Pro app could not load
                    </Text>
                    <Text style={{ textAlign: 'center', color: '#555' }}>
                      Restart the app. If this continues, rebuild the development client so NetInfo and
                      SQLite native modules are included.
                    </Text>
                  </View>
                );
              };
            }
          }}
        />
        {__DEV__ ? (
          <Stack.Screen
            name="ApiHealthCheck"
            getComponent={() => require('../screens/dev/ApiHealthCheckScreen').ApiHealthCheckScreen}
          />
        ) : null}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
