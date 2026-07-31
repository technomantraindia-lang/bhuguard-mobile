export type UserType = 'farmer' | 'company_user' | 'field_officer' | 'admin' | string;

export interface FarmerProfile {
  id: number;
  farmer_code: string;
}

export interface AuthUser {
  id: number;
  name: string;
  email: string | null;
  mobile: string;
  user_type: UserType;
  status: string;
  has_mpin?: boolean;
  role?: string;
  role_name?: string;
  type?: string;
  roles?: Array<string | { name?: string; role?: string }>;
  farmer_profile?: FarmerProfile & { preferred_language?: string };
  company_profile?: { id: number; company_code?: string };
  company?: { id: number; company_code?: string };
  company_id?: number;
  artisan_profile?: { id: number; artisan_code?: string; name?: string };
}

export interface LoginPasswordResult {
  token: string;
  user: AuthUser;
  user_type: UserType;
}

export interface ApiSuccessResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export interface ApiErrorResponse {
  success?: boolean;
  message?: string;
  errors?: Record<string, string[]>;
}
