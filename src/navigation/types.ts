import type { AppLoginRole } from '../config/authRoles';
import type { NavigatorScreenParams } from '@react-navigation/native';

export type SecurityFlowOrigin = 'auth' | 'profile';

export type ForgotPasswordParams = {
  mobile?: string;
  flowOrigin?: SecurityFlowOrigin;
};

export type OtpVerificationParams = {
  mobile: string;
  purpose?: 'forgot_password' | 'forgot_mpin' | 'login';
  role?: AppLoginRole;
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

export type MpinLoginParams = {
  mobile?: string;
  name?: string;
  role?: AppLoginRole;
};

export type PasswordLoginParams = {
  role: AppLoginRole;
};

export type RootStackParamList = {
  Preloader: undefined;
  LanguageSelection: undefined;
  RoleSelection: undefined;
  ApiServerSettings: undefined;
  FarmerLoginOptions: undefined;
  FieldOfficerLogin: undefined;
  PasswordLogin: PasswordLoginParams;
  FarmerOtpLogin: undefined;
  ForgotPassword: ForgotPasswordParams | undefined;
  MpinLogin: MpinLoginParams;
  CreateMpin: CreateMpinParams | undefined;
  OtpVerification: OtpVerificationParams;
  ResetPassword: ResetPasswordParams;
  FarmerApp: undefined;
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
  Evidence: undefined;
  Reports: undefined;
  Map: undefined;
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
  FarmBoundarySuccess: { farmId: number; areaLabel: string; pointCount: number; photoCount?: number; captureMethod?: 'gps' | 'camera' };
  CameraBoundaryStart: { farmId: number };
  CameraBoundaryLive: { farmId: number };
  CameraBoundaryPoints: { farmId: number };
  CameraBoundaryPreview: { farmId: number };
  CameraBoundaryUploading: { farmId: number };
  BoundaryPhotoGallery: { farmId: number };
  FarmerAddFarm: undefined;
  FarmerWeeklyUpdates: undefined;
  FarmerWeeklyUpdateDetail: { updateId: number };
  FarmerServices: undefined;
  FarmerServiceDetail: { serviceId: number };
  FarmerActivityLogs: undefined;
  FarmerSubmitActivity: { farmId?: number } | undefined;
  FarmerActivityDetail: { activityId: number };
  FarmerBaselineAssessments: undefined;
  FarmerAddBaselineAssessment: { farmId?: number } | undefined;
  FarmerFeedstockCollection: { farmId?: number } | undefined;
  FarmerBaselineAssessmentDetail: { assessmentId: number };
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
  FieldOfficerTabs: NavigatorScreenParams<FieldOfficerTabParamList> | undefined;
  StitchScreen: { screenKey: string; itemId?: number };
  FieldOfficerDashboard: undefined;
  FieldOfficerProfile: undefined;
  FieldOfficerProfileSection: { section: 'personal' | 'work' | 'documents' | 'security' };
  FieldOfficerPerformance: undefined;
  FieldOfficerSettings: undefined;
  FieldOfficerAssignments: undefined;
  FieldOfficerAssignmentDetail: { assignmentId: number };
  FieldOfficerVerificationReports: undefined;
  FieldOfficerReports: undefined;
  FieldOfficerReportDetail: { reportId: number };
  FieldOfficerReportDraft: undefined;
  FieldOfficerPendingReports: undefined;
  FieldOfficerDownloadsCenter: undefined;
  FieldOfficerDraftReportEditor: { assignmentId: number };
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
  OnboardingBoundaryStart: undefined;
  OnboardingBoundaryCapture: undefined;
  OnboardingBoundaryPreview: undefined;
  OnboardingCameraBoundaryStart: undefined;
  OnboardingCameraBoundaryLive: undefined;
  OnboardingCameraBoundaryPoints: undefined;
  OnboardingCameraBoundaryPreview: undefined;
  FarmerProofUpload: undefined;
  FarmerOnboardingReview: undefined;
  FarmerOnboardingSuccess: undefined;
  OnboardedFarmerView: undefined;
  OfficerGpsValidation: {
    latitude: number;
    longitude: number;
    accuracyM?: number;
    distanceKm?: number;
    verificationId: number;
  };
  OfficerFeedstockCorrection: {
    verificationId: number;
    initialNotes?: string;
    initialRequiredChanges?: string;
  };
  OfficerFullscreenImage: { uri: string; title?: string };
  OfficerDocumentViewer: { url: string; title?: string };
  OfficerGpsVerificationMap: { latitude: number; longitude: number; distanceKm?: number };
  FieldOfficerFeedstockVerification: { verificationId?: number; gpsVerified?: boolean } | undefined;
  FieldOfficerBiocharProduction: { farmerId?: number; gpsRecaptured?: boolean; latitude?: number; longitude?: number } | undefined;
  FieldOfficerInventoryMovement: { farmerId?: number; movementId?: number } | undefined;
} & SecurityScreensParamList;