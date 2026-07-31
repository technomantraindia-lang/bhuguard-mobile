export const DEMO_LOGIN_OTP = '123456';

export const DEMO_LOGIN_USERS = {
  farmer: '9876543210',
  fieldOfficer: '9876543211',
  artisan: '9876543212',
  company: '9876543213',
} as const;

export function isDemoLoginEnabled(): boolean {
  return process.env.EXPO_PUBLIC_ENABLE_DEMO_LOGIN === 'true';
}
