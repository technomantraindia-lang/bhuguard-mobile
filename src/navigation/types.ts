import type { AppLoginRole } from '../config/authRoles';
import type { NavigatorScreenParams } from '@react-navigation/native';
import type { OfficerGpsCaptureResult } from '../utils/officerGpsCapture';
import type { VisitLocationVerification } from '../utils/visitGpsVerification';

export type SecurityFlowOrigin = 'auth' | 'profile';

export type ForgotPasswordParams = {
  mobile?: string;
  flowOrigin?: SecurityFlowOrigin;
};

export type OtpVerificationParams = {
  mobile: string;
  purpose?: 'forgot_password' | 'forgot_mpin' | 'forgot_pattern' | 'login';
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
  /** First-login setup uses authenticated /auth/mpin/setup. */
  mode?: 'setup' | 'reset';
};

export type BiometricSetupParams = {
  mobile?: string;
  name?: string;
};

export type SecurityScreensParamList = {
  ForgotPassword: ForgotPasswordParams | undefined;
  OtpVerification: OtpVerificationParams;
  ResetPassword: ResetPasswordParams;
  CreateMpin: CreateMpinParams | undefined;
};

export type SupportScreensParamList = {
  SupportThreads: { supportRole?: 'farmer' | 'field_officer' } | undefined;
  ChatbotSupport: { supportRole?: 'farmer' | 'field_officer'; sourceModule?: string } | undefined;
  CreateSupportThread: { supportRole: 'farmer' | 'field_officer' };
  SupportChat: { threadId: number };
};

export type MpinLoginParams = {
  mobile?: string;
  name?: string;
  role?: AppLoginRole;
  /** Unlock an already-validated cold-start session without OTP. */
  mode?: 'login' | 'unlock';
};

export type PasswordLoginParams = {
  role: AppLoginRole;
};

export type RootStackParamList = {
  Preloader: undefined;
  LanguageSelection: undefined;
  MobileLogin: undefined;
  RoleSelection: undefined;
  ApiServerSettings: undefined;
  FarmerLoginOptions: undefined;
  FieldOfficerLogin: undefined;
  PasswordLogin: PasswordLoginParams;
  FarmerOtpLogin: undefined;
  ForgotPassword: ForgotPasswordParams | undefined;
  MpinLogin: MpinLoginParams;
  CreateMpin: CreateMpinParams | undefined;
  SetPattern: { mobile?: string; mode?: 'setup' | 'reset' } | undefined;
  PatternLogin: MpinLoginParams;
  BiometricSetup: BiometricSetupParams | undefined;
  OtpVerification: OtpVerificationParams;
  ResetPassword: ResetPasswordParams;
  ArtisanLogin: undefined;
  FarmerApp: undefined;
  FieldOfficerApp: undefined;
  ArtisanApp: undefined;
  ApiHealthCheck: undefined;
};

export type FarmerTabParamList = {
  Home: undefined;
  Farms: undefined;
  Activities: undefined;
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
  Farmers: undefined;
  Visits: undefined;
  MyArtisans: undefined;
  Map: undefined;
  Profile: undefined;
};

export type ArtisanStackParamList = {
  ArtisanDashboard: undefined;
  ArtisanNotifications: undefined;
  ArtisanProfile: undefined;
  ArtisanSettings: undefined;
  ArtisanHelpSupport: undefined;
  ArtisanModuleUnavailable: { module: 'wallet' | 'training' };
  ArtisanFarmLookup:
    | {
        purpose?: 'find' | 'production' | 'mixing' | 'application' | 'navigate';
      }
    | undefined;
  ArtisanBiocharApplication:
    | {
        farmId?: number;
        farmerId?: number;
        farmerCode?: string;
        farmerName?: string;
        farmCode?: string;
        farmLabel?: string;
        farmName?: string;
        village?: string;
        taluka?: string;
        district?: string;
        state?: string;
        mixingId?: number;
        selectedBatchIds?: number[];
      }
    | undefined;
  ArtisanBiocharProduction: {
    farmId: number;
    farmerId?: number;
    farmerCode?: string;
    farmerName?: string;
    farmCode?: string;
    farmLabel?: string;
    village?: string;
    taluka?: string;
    district?: string;
    state?: string;
    latitude?: number;
    longitude?: number;
    batchId?: number;
    submissionUuid?: string;
    viewOnly?: boolean;
    gpsRecaptured?: boolean;
    /** True when opened via "Add New Biochar" — never silently resume a stale local draft. */
    forceNewBatch?: boolean;
  };
  ArtisanBiocharProductionStatus: {
    submissionUuid: string;
    farmId: number;
    farmerId?: number;
    farmerCode?: string;
    farmerName?: string;
    farmCode?: string;
    farmLabel?: string;
    village?: string;
    taluka?: string;
    district?: string;
    state?: string;
    latitude?: number;
    longitude?: number;
    batchCode?: string;
    status?: string;
    savedAt?: string;
  };
  ArtisanBiocharMixing: {
    farmId: number;
    farmerId?: number;
    farmerCode?: string;
    farmerName?: string;
    farmCode?: string;
    farmLabel?: string;
    village?: string;
    taluka?: string;
    district?: string;
    state?: string;
    recordId?: number;
  };
  ArtisanProductionRecords: { status: 'submitted' };
  FullscreenImage: { uri: string; title?: string };
  FieldOfficerFarmActivityStart: FieldOfficerStackParamList['FieldOfficerFarmActivityStart'];
  FarmVerificationActivity: FieldOfficerStackParamList['FarmVerificationActivity'];
  FarmerOnboardingStart: FieldOfficerStackParamList['FarmerOnboardingStart'];
  FarmerBasicDetails: FieldOfficerStackParamList['FarmerBasicDetails'];
  FarmerConsent: FieldOfficerStackParamList['FarmerConsent'];
  FarmerAddress: FieldOfficerStackParamList['FarmerAddress'];
  FarmerLandDetails: FieldOfficerStackParamList['FarmerLandDetails'];
  FarmerGpsCapture: FieldOfficerStackParamList['FarmerGpsCapture'];
  OnboardingBoundaryStart: FieldOfficerStackParamList['OnboardingBoundaryStart'];
  OnboardingBoundaryCapture: FieldOfficerStackParamList['OnboardingBoundaryCapture'];
  FarmBoundaryMap: FieldOfficerStackParamList['FarmBoundaryMap'];
  FarmBoundaryView: FieldOfficerStackParamList['FarmBoundaryView'];
  OnboardingBoundaryPreview: FieldOfficerStackParamList['OnboardingBoundaryPreview'];
  OnboardingCameraBoundaryStart: FieldOfficerStackParamList['OnboardingCameraBoundaryStart'];
  OnboardingCameraBoundaryLive: FieldOfficerStackParamList['OnboardingCameraBoundaryLive'];
  OnboardingCameraBoundaryPoints: FieldOfficerStackParamList['OnboardingCameraBoundaryPoints'];
  OnboardingCameraBoundaryPreview: FieldOfficerStackParamList['OnboardingCameraBoundaryPreview'];
  FarmerProofUpload: FieldOfficerStackParamList['FarmerProofUpload'];
  FarmerOnboardingReview: FieldOfficerStackParamList['FarmerOnboardingReview'];
  FarmerOnboardingSuccess: FieldOfficerStackParamList['FarmerOnboardingSuccess'];
  OnboardedFarmerView: FieldOfficerStackParamList['OnboardedFarmerView'];
  BiocharAwareness: FieldOfficerStackParamList['BiocharAwareness'];
};

export type FarmerStackParamList = {
  FarmerTabs: NavigatorScreenParams<FarmerTabParamList>;
  StitchScreen: { screenKey: string; itemId?: number };
  FarmerDashboard: undefined;
  FarmerProfile: undefined;
  FarmerSettings: undefined;
  ChangePattern: undefined;
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
  FarmerFarmSelection: undefined;
  FarmerFarmActivity: { farmId?: number; activityId?: number };
  FarmerWeeklyUpdates: undefined;
  FarmerBiocharUpdates: undefined;
  FarmerBiocharActivities: undefined;
  FarmerBiocharProduction: { batchId?: number; gpsRecaptured?: boolean; latitude?: number; longitude?: number } | undefined;
  FarmerBiocharMixing: { recordId?: number } | undefined;
  FarmerWallet: undefined;
  FarmerWeeklyUpdateDetail: { updateId: number };
  FarmerCreateWeeklyUpdate: { farmId?: number } | undefined;
  FarmerEvidenceList: undefined;
  FarmerUploadEvidence: { farmId?: number; weeklyUpdateId?: number } | undefined;
  FarmerEvidenceDetail: { evidenceId: number };
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
  FarmerSoilSampleDetail: { sampleId: number };
  FarmerVerificationStatus: undefined;
  FarmerCarbonCalculations: undefined;
  FarmerCarbonCalculationDetail: { id: number };
  FarmerFinalReports: undefined;
  FarmerFinalReportDetail: { id: number };
  FarmerReportPreview: { id: number; title?: string };
  FarmerNotifications: undefined;
  FarmerAddressDetails: undefined;
  FarmerProjectDetails: undefined;
  FarmerBenefits: undefined;
  FarmerLegal: { document: 'terms' | 'privacy' };
  FullscreenImage: { uri: string; title?: string };
} & SupportScreensParamList & SecurityScreensParamList;
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
  CompanyReportPreview: { id: number; title?: string };
  CompanyNotifications: undefined;
  CompanyCreateRecord: { formKey: string };
  CompanyEditSite: { siteId?: number };
  CompanyEvidenceList: undefined;
  CompanyEvidenceUpload: undefined;
};

export type FieldOfficerStackParamList = {
  FieldOfficerTabs: NavigatorScreenParams<FieldOfficerTabParamList> | undefined;
  StitchScreen: { screenKey: string; itemId?: number };
  FieldOfficerFarmLookup: undefined;
  FieldOfficerFarmActivityStart:
    | {
        farmerId?: number;
        farmId?: number;
        farmerCode?: string;
        farmerName?: string;
        farmCode?: string;
        lockFarmSelection?: boolean;
        overdue?: boolean;
        /** Phase 10.12: when true, completing/exiting the Farm Activity returns to Review & Submit instead of the dashboard. */
        returnToReview?: boolean;
      }
    | undefined;
  FieldOfficerCallFarmer: undefined;
  FieldOfficerNavigate: undefined;
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
  FieldOfficerReportPreview: { reportId: number; title?: string };
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
  FieldOfficerSchedule: undefined;
  VisitCheckIn: { assignmentId: number; visitContext?: import('../utils/visitCheckInHelpers').VisitCheckInRouteContext };
  FieldOfficerVisitVerification: { assignmentId?: number; farmerId?: number; farmId?: number };
  VisitLocationVerify: {
    assignmentId: number;
    capture: OfficerGpsCaptureResult;
    verification: VisitLocationVerification;
  };
  FarmVerificationChecklist: { assignmentId: number };
  FarmVerificationActivity: {
    assignmentId?: number;
    farmerId: number;
    farmId: number;
    farmCode?: string;
    farmerName?: string;
    farmerCode?: string;
    farmName?: string;
    village?: string;
    taluka?: string;
    district?: string;
    state?: string;
    /** Phase 10.12: when true, completing/exiting the Farm Activity returns to Review & Submit instead of the dashboard. */
    returnToReview?: boolean;
  };
  BiocharApplicationVerification: { applicationId?: number; assignmentId?: number };
  EvidenceVerification: { assignmentId: number };
  VerificationChecklist: { assignmentId: number };
  VisitEvidenceUpload: { assignmentId: number };
  VisitReportReview: { assignmentId: number };
  VisitReportSuccess: { assignmentId: number };
  FieldOfficerBiocharDueOverdue: { initialFilter?: 'due' | 'overdue' | 'all' } | undefined;
  FarmerOnboardingStart: undefined;
  FarmerBasicDetails: undefined;
  FarmerConsent:
    | {
        returnTo?: 'OnboardingBoundaryStart';
        farmerId?: number;
        farmId?: number;
        farmerName?: string;
        farmerCode?: string;
        farmName?: string;
        farmCode?: string;
        village?: string;
        mappingStatus?: 'pending' | 'completed';
      }
    | undefined;
  FarmerAddress: undefined;
  FarmerLandDetails: undefined;
  FarmerGpsCapture: undefined;
  OnboardingBoundaryStart:
    | {
        farmerId?: number;
        farmId?: number;
        farmerName?: string;
        farmerCode?: string;
        farmName?: string;
        farmCode?: string;
        village?: string;
        landArea?: string;
        landAreaUnit?: 'acre' | 'hectare' | 'bigha';
        mappingStatus?: 'pending' | 'completed';
      }
    | undefined;
  OnboardingBoundaryCapture: {
    farmerId: number;
    farmId: number;
    farmerName: string;
    farmerCode?: string;
    farmName?: string;
    farmCode?: string;
    village?: string;
    mappingStatus?: 'pending' | 'completed';
    declaredArea?: string;
    declaredAreaUnit?: 'acre' | 'hectare' | 'bigha';
    returnScreen?: 'OnboardingBoundaryStart';
  };
  /** In-app MapLibre Farm Boundary (primary FO mapping route). */
  FarmBoundaryMap: {
    farmerId: number;
    farmId: number;
    farmerName: string;
    farmerCode?: string;
    farmName?: string;
    farmCode?: string;
    village?: string;
    mappingStatus?: 'pending' | 'completed';
    declaredArea?: string;
    declaredAreaUnit?: 'acre' | 'hectare' | 'bigha';
    returnScreen?: 'OnboardingBoundaryStart';
  };
  /**
   * Read-only saved-boundary viewer (Phase 10.7/10.10) — selected polygon only,
   * fit bounds, no FO location marker, no editing, no other farms. "Done" always
   * pops back to the screen that opened it (Phase 10.9).
   */
  FarmBoundaryView: {
    farmerId: number;
    farmId: number;
    farmerName: string;
    farmerCode?: string;
    farmName?: string;
    farmCode?: string;
    village?: string;
    declaredArea?: string;
    declaredAreaUnit?: 'acre' | 'hectare' | 'bigha';
  };
  OnboardingBoundaryPreview:
    | {
        farmerId?: number;
        farmId?: number;
        farmerName?: string;
        farmerCode?: string;
        farmName?: string;
        farmCode?: string;
        village?: string;
        mappingStatus?: 'pending' | 'completed';
      }
    | undefined;
  OnboardingCameraBoundaryStart: undefined;
  OnboardingCameraBoundaryLive: undefined;
  OnboardingCameraBoundaryPoints: undefined;
  OnboardingCameraBoundaryPreview: undefined;
  FarmerProofUpload: undefined;
  FarmerOnboardingReview: undefined;
  FarmerOnboardingSuccess: undefined;
  OnboardedFarmerView: { farmerId?: number } | undefined;
  BiocharAwareness: { farmerId: number };
  FieldOfficerCreateVisit: { farmerId?: number } | undefined;
  OfficerGpsValidation: {
    latitude: number;
    longitude: number;
    accuracyM?: number;
    distanceKm?: number;
    verificationId?: number;
  };
  OfficerFeedstockCorrection: {
    verificationId: number;
    initialNotes?: string;
    initialRequiredChanges?: string;
    initialDueDate?: string;
  };
  OfficerFullscreenImage: { uri: string; title?: string };
  OfficerDocumentViewer: { url: string; title?: string };
  OfficerGpsVerificationMap: { latitude: number; longitude: number; distanceKm?: number };
  FieldOfficerFeedstockVerification:
    | { verificationId?: number; gpsVerified?: boolean; assignmentId?: number }
    | undefined;
  FieldOfficerBiocharProductionList:
    | {
        farmerId?: number;
        farmerCode?: string;
        farmerName?: string;
        farmId?: number;
        farmCode?: string;
        farmName?: string;
        village?: string;
        taluka?: string;
        district?: string;
        state?: string;
      }
    | undefined;
  FieldOfficerBiocharProduction: {
      farmerId?: number;
      farmerCode?: string;
      farmerName?: string;
      farmId?: number;
      farmCode?: string;
      farmName?: string;
      fieldOfficerId?: number;
      visitId?: number;
      village?: string;
      taluka?: string;
      district?: string;
      state?: string;
      gpsAccuracy?: number;
      batchId?: number;
      gpsRecaptured?: boolean;
      latitude?: number;
      longitude?: number;
    } | undefined;
  FieldOfficerBiocharMixing: {
    farmerId: number;
    farmId?: number;
    recordId?: number;
    farmerCode?: string;
    farmerName?: string;
    farmCode?: string;
    farmLabel?: string;
    village?: string;
    taluka?: string;
    district?: string;
    state?: string;
  } | undefined;
  FieldOfficerBiocharApplication: {
    farmerId?: number;
    farmId?: number;
    farmerCode?: string;
    farmerName?: string;
    farmCode?: string;
    farmName?: string;
    village?: string;
    taluka?: string;
    district?: string;
    state?: string;
    mixingId?: number;
    selectedBatchIds?: number[];
  } | undefined;
  FieldOfficerInventoryMovement: { farmerId?: number; farmId?: number; movementId?: number } | undefined;
  FieldOfficerInventoryTasks: undefined;
  FieldOfficerInventoryTaskDetail: { taskId: number };
  FieldOfficerCreateRecord: { formKey: string };
  MyArtisans: undefined;
  RegisterArtisan: undefined;
  ArtisanDetail: { artisanId: number };
  ArtisanBiocharBatches: undefined;
} & SupportScreensParamList & SecurityScreensParamList;
