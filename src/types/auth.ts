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
  farmer_profile?: FarmerProfile;
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
