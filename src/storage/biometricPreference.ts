import {
  getSecureBiometricEnabled,
  setSecureBiometricEnabled,
} from './secureAuthStorage';

export async function getBiometricLoginEnabled(): Promise<boolean> {
  return getSecureBiometricEnabled();
}

export async function setBiometricLoginEnabled(enabled: boolean): Promise<void> {
  await setSecureBiometricEnabled(enabled);
}

export const getFieldOfficerBiometricEnabled = getBiometricLoginEnabled;
export const setFieldOfficerBiometricEnabled = setBiometricLoginEnabled;
