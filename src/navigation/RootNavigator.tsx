import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { PreloaderScreen } from '../screens/auth/PreloaderScreen';
import { navigationRef } from './navigationRef';
import type { RootStackParamList } from './types';

const Stack = createNativeStackNavigator<RootStackParamList>();

export function RootNavigator() {
  return (
    <NavigationContainer ref={navigationRef}>
      <Stack.Navigator initialRouteName="Preloader" screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Preloader" component={PreloaderScreen} />
        <Stack.Screen
          name="LanguageSelection"
          getComponent={() => require('../screens/auth/LanguageSelectionScreen').LanguageSelectionScreen}
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
          getComponent={() => require('./OfficerNavigator').OfficerNavigator}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
