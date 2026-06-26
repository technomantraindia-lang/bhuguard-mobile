import { Alert } from 'react-native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import type { RootStackParamList } from '../navigation/types';

import {
  completeMobileLogin,
  type CompleteMobileLoginOptions,
  type LoginCompletionErrorCode,
} from './completeMobileLogin';

type AuthNavigation = Pick<NativeStackNavigationProp<RootStackParamList>, 'reset'>;

interface FinishLoginMessages {
  roleMismatch: string;
  unsupportedAccount: string;
  farmerProfileMissingTitle: string;
  farmerProfileMissingMessage: string;
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
  options: CompleteMobileLoginOptions,
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

  navigation.reset({ index: 0, routes: [{ name: result.dashboardRoute }] });
  return true;
}
