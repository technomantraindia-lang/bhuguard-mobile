import { getOrCreateSecureDeviceUuid } from '../storage/secureAuthStorage';

type LocalAuthenticationModule = {
  hasHardwareAsync: () => Promise<boolean>;
  isEnrolledAsync: () => Promise<boolean>;
  authenticateAsync: (options: {
    promptMessage: string;
    cancelLabel?: string;
    disableDeviceFallback?: boolean;
  }) => Promise<{ success: boolean }>;
};

let localAuthenticationModule: LocalAuthenticationModule | null | undefined;
let localAuthenticationLoadFailed = false;
let biometricPromptInFlight: Promise<boolean> | null = null;

/**
 * Never import expo-local-authentication at module scope — its JS entry calls
 * requireNativeModule and RedBoxes when the native module is missing from the APK.
 */
function resolveLocalAuthentication(): LocalAuthenticationModule | null {
  if (localAuthenticationLoadFailed) {
    return null;
  }

  if (localAuthenticationModule !== undefined) {
    return localAuthenticationModule;
  }

  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { requireOptionalNativeModule } = require('expo-modules-core') as {
      requireOptionalNativeModule: (name: string) => unknown;
    };

    if (requireOptionalNativeModule('ExpoLocalAuthentication') == null) {
      localAuthenticationLoadFailed = true;
      localAuthenticationModule = null;

      if (__DEV__) {
        console.warn(
          '[Bhuguard] ExpoLocalAuthentication native module missing. Biometrics disabled until you rebuild the dev client (`npm run build:dev-client`).',
        );
      }

      return null;
    }

    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const loaded = require('expo-local-authentication') as LocalAuthenticationModule;
    localAuthenticationModule = loaded;
    return loaded;
  } catch (error) {
    localAuthenticationLoadFailed = true;
    localAuthenticationModule = null;

    if (__DEV__) {
      console.warn('[Bhuguard] expo-local-authentication unavailable:', error);
    }

    return null;
  }
}

export function isNativeBiometricModuleAvailable(): boolean {
  return resolveLocalAuthentication() != null;
}

export async function getOrCreateDeviceUuid(): Promise<string> {
  return getOrCreateSecureDeviceUuid();
}

export async function authenticateWithBiometrics(promptMessage: string): Promise<boolean> {
  if (biometricPromptInFlight) {
    return biometricPromptInFlight;
  }

  biometricPromptInFlight = (async () => {
    const LocalAuthentication = resolveLocalAuthentication();

    if (!LocalAuthentication) {
      return false;
    }

    try {
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
        disableDeviceFallback: true,
      });

      return result.success;
    } catch (error) {
      if (__DEV__) {
        console.warn('[Bhuguard] Biometric authenticate failed:', error);
      }

      return false;
    }
  })();

  try {
    return await biometricPromptInFlight;
  } finally {
    biometricPromptInFlight = null;
  }
}

export async function isBiometricHardwareAvailable(): Promise<boolean> {
  const LocalAuthentication = resolveLocalAuthentication();

  if (!LocalAuthentication) {
    return false;
  }

  try {
    const [hasHardware, isEnrolled] = await Promise.all([
      LocalAuthentication.hasHardwareAsync(),
      LocalAuthentication.isEnrolledAsync(),
    ]);

    return hasHardware && isEnrolled;
  } catch {
    return false;
  }
}
