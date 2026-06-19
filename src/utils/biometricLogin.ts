import AsyncStorage from '@react-native-async-storage/async-storage';

const DEVICE_UUID_KEY = '@bhuguard/device_uuid';

type LocalAuthenticationModule = typeof import('expo-local-authentication');

let localAuthenticationModule: LocalAuthenticationModule | null = null;
let localAuthenticationLoadFailed = false;

async function getLocalAuthentication(): Promise<LocalAuthenticationModule | null> {
  if (localAuthenticationLoadFailed) {
    return null;
  }

  if (localAuthenticationModule) {
    return localAuthenticationModule;
  }

  try {
    localAuthenticationModule = await import('expo-local-authentication');
    return localAuthenticationModule;
  } catch (error) {
    localAuthenticationLoadFailed = true;

    if (__DEV__) {
      console.warn('[Bhuguard] Biometric module unavailable:', error);
    }

    return null;
  }
}

export async function getOrCreateDeviceUuid(): Promise<string> {
  const existing = await AsyncStorage.getItem(DEVICE_UUID_KEY);

  if (existing) {
    return existing;
  }

  const generated = `bhuguard-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  await AsyncStorage.setItem(DEVICE_UUID_KEY, generated);

  return generated;
}

export async function authenticateWithBiometrics(promptMessage: string): Promise<boolean> {
  const LocalAuthentication = await getLocalAuthentication();

  if (!LocalAuthentication) {
    return false;
  }

  const [hasHardware, isEnrolled] = await Promise.all([
    LocalAuthentication.hasHardwareAsync(),
    LocalAuthentication.isEnrolledAsync(),
  ]);

  if (!hasHardware || !isEnrolled) {
    return false;
  }

  const result = await LocalAuthentication.authenticateAsync({
    promptMessage,
    cancelLabel: 'Cancel',
  });

  return result.success;
}

export async function isBiometricHardwareAvailable(): Promise<boolean> {
  const LocalAuthentication = await getLocalAuthentication();

  if (!LocalAuthentication) {
    return false;
  }

  const [hasHardware, isEnrolled] = await Promise.all([
    LocalAuthentication.hasHardwareAsync(),
    LocalAuthentication.isEnrolledAsync(),
  ]);

  return hasHardware && isEnrolled;
}
