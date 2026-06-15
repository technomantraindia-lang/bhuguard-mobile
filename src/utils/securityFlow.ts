import type { NavigationProp, ParamListBase } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import type { SecurityFlowOrigin } from '../navigation/types';

export function formatMobileDisplay(mobile: string): string {
  const digits = mobile.replace(/\D/g, '');
  const local = digits.startsWith('91') && digits.length > 10 ? digits.slice(2) : digits;

  if (local.length === 10) {
    return `+91 ${local.slice(0, 5)} ${local.slice(5)}`;
  }

  return mobile.startsWith('+') ? mobile : `+91 ${local}`;
}

export function isWeakMpin(mpin: string): boolean {
  if (mpin.length !== 6) {
    return true;
  }

  if (/^(\d)\1{5}$/.test(mpin)) {
    return true;
  }

  const ascending = '0123456789';
  const descending = '9876543210';

  if (ascending.includes(mpin) || descending.includes(mpin)) {
    return true;
  }

  return false;
}

export function finishSecurityFlow(
  navigation: NavigationProp<ParamListBase>,
  flowOrigin: SecurityFlowOrigin | undefined,
): void {
  if (flowOrigin === 'profile') {
    (navigation as NativeStackNavigationProp<ParamListBase>).popToTop();
    return;
  }

  navigation.reset({
    index: 0,
    routes: [{ name: 'RoleSelection' }],
  });
}
