import AsyncStorage from '@react-native-async-storage/async-storage';

const BIOMETRIC_KEY = '@bhuguard/biometric_login_enabled';

export async function getBiometricLoginEnabled(): Promise<boolean> {
  const value = await AsyncStorage.getItem(BIOMETRIC_KEY);

  return value === '1';
}

export async function setBiometricLoginEnabled(enabled: boolean): Promise<void> {
  await AsyncStorage.setItem(BIOMETRIC_KEY, enabled ? '1' : '0');
}

// Backward-compatible aliases used by field officer profile security screen.
export const getFieldOfficerBiometricEnabled = getBiometricLoginEnabled;
export const setFieldOfficerBiometricEnabled = setBiometricLoginEnabled;
