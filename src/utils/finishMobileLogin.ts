import { Alert } from 'react-native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { applyLanguageForCurrentUser } from '../i18n/languageSyncBridge';
import { safeNavigationReset } from '../navigation/safeNavigationReset';
import type { RootStackParamList } from '../navigation/types';
import { getAuthUser } from '../storage/authStorage';

import {
  completeMobileLogin,
  type CompleteMobileLoginOptions,
  type LoginCompletionErrorCode,
} from './completeMobileLogin';

type AuthNavigation = Pick<NativeStackNavigationProp<RootStackParamList>, 'reset' | 'navigate'>;

interface FinishLoginMessages {
  roleMismatch: string;
  unsupportedAccount: string;
  farmerProfileMissingTitle: string;
  farmerProfileMissingMessage: string;
}

export interface FinishMobileLoginOptions extends CompleteMobileLoginOptions {
  /** After OTP, require MPIN setup / biometric offer before dashboard. */
  continueSetupChain?: boolean;
}

function showLoginError(
  code: LoginCompletionErrorCode,
  message: string,
  messages: FinishLoginMessages,
): void {
  if (code === 'farmer_profile_missing') {
    Alert.alert(messages.farmerProfileMissingTitle, messages.farmerProfileMissingMessage);
    return;
  }

  if (code === 'role_mismatch') {
    Alert.alert(messages.unsupportedAccount, messages.roleMismatch);
    return;
  }

  Alert.alert(messages.unsupportedAccount, message);
}

export async function finishMobileLogin(
  navigation: AuthNavigation,
  options: FinishMobileLoginOptions,
  messages: FinishLoginMessages,
  setInlineError?: (message: string) => void,
): Promise<boolean> {
  const result = await completeMobileLogin(options);

  if (!result.ok) {
    if (
      result.code === 'admin_web_only' ||
      result.code === 'company_web_only' ||
      result.code === 'unsupported_account'
    ) {
      setInlineError?.(result.message);
      return false;
    }

    showLoginError(result.code, result.message, messages);
    return false;
  }

  await applyLanguageForCurrentUser();

  if (options.continueSetupChain) {
    const user = options.user ?? (await getAuthUser());
    const hasPattern = Boolean(user?.has_pattern);
    const patternSupported = Boolean(user?.pattern_supported || user?.pattern_setup_required || hasPattern);
    const patternSetupRequired = Boolean(user?.pattern_setup_required) || (patternSupported && !hasPattern);
    const hasMpin = Boolean(user?.has_mpin);
    const mobile = user?.mobile ?? options.user.mobile;
    const name = user?.name ?? options.user.name;
    const role = (user?.user_type ?? '').toLowerCase();
    const isFarmer = role.includes('farmer');

    if (isFarmer && patternSupported && patternSetupRequired) {
      navigation.navigate('SetPattern', { mobile, mode: 'setup' });
      return true;
    }

    if (isFarmer && patternSupported && hasPattern) {
      // Pattern already set — continue to biometric offer / dashboard chain.
      navigation.navigate('BiometricSetup', { mobile, name });
      return true;
    }

    if (!hasMpin) {
      // Keep Mobile → OTP under CreateMpin so back does not crash on an empty stack.
      navigation.navigate('CreateMpin', {
        mobile,
        mode: 'setup',
        flowOrigin: 'auth',
      });
      return true;
    }

    navigation.navigate('BiometricSetup', { mobile, name });
    return true;
  }

  safeNavigationReset(navigation, { index: 0, routes: [{ name: result.dashboardRoute }] });
  return true;
}
