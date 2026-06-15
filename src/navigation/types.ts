import type { AppLoginRole } from '../config/authRoles';
import type { NavigatorScreenParams } from '@react-navigation/native';

export type SecurityFlowOrigin = 'auth' | 'profile';

export type ForgotPasswordParams = {
  mobile?: string;
  flowOrigin?: SecurityFlowOrigin;
};

export type OtpVerificationParams = {
  mobile: string;
  purpose?: 'forgot_password' | 'forgot_mpin';
  flowOrigin?: SecurityFlowOrigin;
};

export type ResetPasswordParams = {
  mobile: string;
  flowOrigin?: SecurityFlowOrigin;
};

export type CreateMpinParams = {
  mobile?: string;
  flowOrigin?: SecurityFlowOrigin;
};

export type SecurityScreensParamList = {
  ForgotPassword: ForgotPasswordParams | undefined;
  OtpVerification: OtpVerificationParams;
  ResetPassword: ResetPasswordParams;
  CreateMpin: CreateMpinParams | undefined;
};

export type RootStackParamList = {
  Splash: undefined;
  Login: { role?: AppLoginRole };
  ForgotPassword: ForgotPasswordParams | undefined;
  OtpLogin: undefined;
  MpinLogin: { mobile?: string; name?: string };
  CreateMpin: CreateMpinParams | undefined;
  OtpVerification: OtpVerificationParams;
  ResetPassword: ResetPasswordParams;
  RoleSelection: undefined;
  FarmerApp: undefined;
  CompanyApp: undefined;
  FieldOfficerApp: undefined;
};

export type FarmerTabParamList = {
  Home: undefined;
  Farms: undefined;
  Activities: undefined;
  Reports: undefined;
  Profile: undefined;
};

export type CompanyTabParamList = {
  Home: undefined;
  Activities: undefined;
  Maps: undefined;
  Profile: undefined;
};

export type FieldOfficerTabParamList = {
  Home: undefined;
  Visits: undefined;
  Map: undefined;
  Farmers: undefined;
  Profile: undefined;
};

export type FarmerStackParamList = {
  FarmerTabs: NavigatorScreenParams<FarmerTabParamList>;
  StitchScreen: { screenKey: string; itemId?: number };
  FarmerDashboard: undefined;
  FarmerProfile: undefined;
  FarmerSettings: undefined;
  FarmerFarms: undefined;
  FarmerFarmDetail: { farmId: number };
  FarmerFarmGps: { farmId: number };
  FarmerFarmMapFullScreen: { farmId: number };
  FarmerEditFarm: { farmId: number };
  FarmBoundaryStart: { farmId: number };
  FarmBoundaryCapture: { farmId: number };
  FarmBoundaryPreview: { farmId: number };
  FarmBoundarySaveConfirm: { farmId: number };
  FarmBoundaryUploading: { farmId: number };
  FarmBoundarySuccess: { farmId: number; areaLabel: string; pointCount: number };
  FarmerAddFarm: undefined;
  FarmerWeeklyUpdates: undefined;
  FarmerWeeklyUpdateDetail: { updateId: number };
  FarmerServices: undefined;
  FarmerServiceDetail: { serviceId: number };
  FarmerActivityLogs: undefined;
  FarmerSubmitActivity: { farmId?: number } | undefined;
  FarmerBaselineAssessments: undefined;
  FarmerSoilSamples: undefined;
  FarmerVerificationStatus: undefined;
  FarmerCarbonCalculations: undefined;
  FarmerCarbonCalculationDetail: { id: number };
  FarmerFinalReports: undefined;
  FarmerFinalReportDetail: { id: number };
  FarmerNotifications: undefined;
  FarmerAddressDetails: undefined;
  FarmerProjectDetails: undefined;
  FarmerBenefits: undefined;
  FarmerSupport: undefined;
} & SecurityScreensParamList;
export type CompanyStackParamList = {
  CompanyTabs: undefined;
  StitchScreen: { screenKey: string; itemId?: number };
  CompanyDashboard: undefined;
  CompanyProfile: undefined;
  CompanySettings: undefined;
  CompanySites: undefined;
  CompanySiteDetail: { siteId: number };
  CompanyServiceSubmissions: undefined;
  CompanyServiceSubmissionDetail: { id: number };
  CompanyWasteRecords: undefined;
  CompanyWasteRecordDetail: { id: number };
  CompanyIndustrialCarbonRecords: undefined;
  CompanyIndustrialCarbonRecordDetail: { id: number };
  CompanyBiocharRecords: undefined;
  CompanyBiocharRecordDetail: { id: number };
  CompanyCarbonCalculations: undefined;
  CompanyCarbonCalculationDetail: { id: number };
  CompanyFinalReports: undefined;
  CompanyFinalReportDetail: { id: number };
  CompanyNotifications: undefined;
};

export type FieldOfficerStackParamList = {
  FieldOfficerTabs: undefined;
  StitchScreen: { screenKey: string; itemId?: number };
  FieldOfficerDashboard: undefined;
  FieldOfficerProfile: undefined;
  FieldOfficerSettings: undefined;
  FieldOfficerAssignments: undefined;
  FieldOfficerAssignmentDetail: { assignmentId: number };
  FieldOfficerVerificationReports: undefined;
  FieldOfficerVerificationReportDetail: { reportId: number };
  FieldOfficerSoilSamples: undefined;
  FieldOfficerBaselineAssessments: undefined;
  FieldOfficerActivityLogs: undefined;
  FieldOfficerMonitoringReports: undefined;
  FieldOfficerNotifications: undefined;
  VisitCheckIn: { assignmentId: number };
  VerificationChecklist: { assignmentId: number };
  VisitEvidenceUpload: { assignmentId: number };
  VisitReportReview: { assignmentId: number };
  VisitReportSuccess: { assignmentId: number };
  FarmerOnboardingStart: undefined;
  FarmerBasicDetails: undefined;
  FarmerConsent: undefined;
  FarmerAddress: undefined;
  FarmerLandDetails: undefined;
  FarmerGpsCapture: undefined;
  FarmerProofUpload: undefined;
  FarmerOnboardingReview: undefined;
  FarmerOnboardingSuccess: undefined;
  OnboardedFarmerView: undefined;
} & SecurityScreensParamList;