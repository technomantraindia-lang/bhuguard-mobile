import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { CreateMpinScreen } from '../screens/auth/CreateMpinScreen';
import { ForgotPasswordScreen } from '../screens/auth/ForgotPasswordScreen';
import { OtpVerificationScreen } from '../screens/auth/OtpVerificationScreen';
import { ResetPasswordScreen } from '../screens/auth/ResetPasswordScreen';
import { BoundaryCaptureProvider } from '../context/BoundaryCaptureContext';
import { OnboardingProvider } from '../context/OnboardingContext';
import { FieldOfficerActivityLogsScreen } from '../screens/officer/FieldOfficerActivityLogsScreen';
import { FieldOfficerAssignmentDetailScreen } from '../screens/officer/FieldOfficerAssignmentDetailScreen';
import { FieldOfficerAssignmentsScreen } from '../screens/officer/FieldOfficerAssignmentsScreen';
import { FieldOfficerBaselineAssessmentsScreen } from '../screens/officer/FieldOfficerBaselineAssessmentsScreen';
import { FieldOfficerMonitoringReportsScreen } from '../screens/officer/FieldOfficerMonitoringReportsScreen';
import { FieldOfficerNotificationsScreen } from '../screens/officer/FieldOfficerNotificationsScreen';
import { FieldOfficerPerformanceScreen } from '../screens/officer/FieldOfficerPerformanceScreen';
import { FieldOfficerProfileScreen } from '../screens/officer/FieldOfficerProfileScreen';
import { FieldOfficerProfileSectionScreen } from '../screens/officer/FieldOfficerProfileSectionScreen';
import { FieldOfficerSettingsScreen } from '../screens/officer/FieldOfficerSettingsScreen';
import { FieldOfficerSoilSamplesScreen } from '../screens/officer/FieldOfficerSoilSamplesScreen';
import { FieldOfficerBiocharMixingScreen } from '../screens/officer/FieldOfficerBiocharMixingScreen';
import { FieldOfficerBiocharProductionListScreen } from '../screens/officer/FieldOfficerBiocharProductionListScreen';
import { FieldOfficerBiocharProductionScreen } from '../screens/officer/FieldOfficerBiocharProductionScreen';
import { FieldOfficerCreateVisitScreen } from '../screens/officer/FieldOfficerCreateVisitScreen';
import { FieldOfficerInventoryMovementScreen } from '../screens/officer/FieldOfficerInventoryMovementScreen';
import { FieldOfficerInventoryTasksScreen } from '../screens/officer/FieldOfficerInventoryTasksScreen';
import { FieldOfficerInventoryTaskDetailScreen } from '../screens/officer/FieldOfficerInventoryTaskDetailScreen';
import { FieldOfficerCreateRecordScreen } from '../screens/officer/FieldOfficerCreateRecordScreen';
import { FieldOfficerFeedstockVerificationScreen } from '../screens/officer/FieldOfficerFeedstockVerificationScreen';
import { FieldOfficerVerificationReportDetailScreen } from '../screens/officer/FieldOfficerVerificationReportDetailScreen';
import { OfficerDocumentViewerScreen } from '../screens/officer/OfficerDocumentViewerScreen';
import { OfficerFeedstockCorrectionScreen } from '../screens/officer/OfficerFeedstockCorrectionScreen';
import { OfficerFullscreenImageScreen } from '../screens/officer/OfficerFullscreenImageScreen';
import { OfficerGpsValidationScreen } from '../screens/officer/OfficerGpsValidationScreen';
import { OfficerGpsVerificationMapScreen } from '../screens/officer/OfficerGpsVerificationMapScreen';
import { FieldOfficerReportDetailScreen } from '../screens/officer/FieldOfficerReportDetailScreen';
import { FieldOfficerReportPreviewScreen } from '../screens/reports/ReportsCenterScreen';
import { FieldOfficerReportDraftScreen } from '../screens/officer/FieldOfficerReportDraftScreen';
import { FieldOfficerPendingReportsScreen } from '../screens/officer/FieldOfficerPendingReportsScreen';
import { FieldOfficerDownloadsCenterScreen } from '../screens/officer/FieldOfficerDownloadsCenterScreen';
import { VisitReportReviewScreen } from '../screens/officer/VisitReportReviewScreen';
import { FieldOfficerReportsScreen } from '../screens/officer/FieldOfficerReportsScreen';
import { FieldOfficerVerificationReportsScreen } from '../screens/officer/FieldOfficerVerificationReportsScreen';
import { FarmerAddressScreen } from '../screens/officer/onboarding/FarmerAddressScreen';
import { FarmerBasicDetailsScreen } from '../screens/officer/onboarding/FarmerBasicDetailsScreen';
import { BiocharAwarenessScreen } from '../screens/officer/onboarding/BiocharAwarenessScreen';
import { OnboardedFarmerViewScreen } from '../screens/officer/onboarding/OnboardedFarmerViewScreen';
import { FarmerLandDetailsScreen } from '../screens/officer/onboarding/FarmerLandDetailsScreen';
import { OnboardingBoundaryPreviewScreen } from '../screens/officer/onboarding/OnboardingBoundaryPreviewScreen';
import { OnboardingBoundaryStartScreen } from '../screens/officer/onboarding/OnboardingBoundaryStartScreen';
import { FarmerOnboardingReviewScreen } from '../screens/officer/onboarding/FarmerOnboardingReviewScreen';
import { FarmerOnboardingStartScreen } from '../screens/officer/onboarding/FarmerOnboardingStartScreen';
import { FarmerOnboardingSuccessScreen } from '../screens/officer/onboarding/FarmerOnboardingSuccessScreen';
import { VerificationChecklistScreen } from '../screens/officer/VerificationChecklistScreen';
import { VisitReportSuccessScreen } from '../screens/officer/VisitReportSuccessScreen';
import { CreateSupportThreadScreen } from '../screens/shared/CreateSupportThreadScreen';
import { SupportChatScreenRoute } from '../screens/shared/SupportChatScreenRoute';
import { FarmerChatbotSupportRoute, OfficerChatbotSupportRoute } from '../screens/shared/ChatbotSupportScreenRoute';
import { OfficerSupportThreadsRoute } from '../screens/shared/SupportThreadsScreenRoute';
import { StitchScreenRoute } from '../screens/stitch/StitchScreenRoute';
import { OfficerTabNavigator } from './OfficerTabNavigator';
import type { FieldOfficerStackParamList } from './types';

const Stack = createNativeStackNavigator<FieldOfficerStackParamList>();

export function OfficerNavigator() {
  return (
    <OnboardingProvider>
      <BoundaryCaptureProvider>
      <Stack.Navigator initialRouteName="FieldOfficerTabs" screenOptions={{ headerShown: false }}>
        <Stack.Screen name="FieldOfficerTabs" component={OfficerTabNavigator} />
        <Stack.Screen name="StitchScreen" component={StitchScreenRoute} />
        <Stack.Screen name="FieldOfficerProfile" component={FieldOfficerProfileScreen} />
        <Stack.Screen name="FieldOfficerProfileSection" component={FieldOfficerProfileSectionScreen} />
        <Stack.Screen name="FieldOfficerPerformance" component={FieldOfficerPerformanceScreen} />
        <Stack.Screen name="FieldOfficerSettings" component={FieldOfficerSettingsScreen} />
        <Stack.Screen name="FieldOfficerAssignments" component={FieldOfficerAssignmentsScreen} />
        <Stack.Screen name="FieldOfficerAssignmentDetail" component={FieldOfficerAssignmentDetailScreen} />
        <Stack.Screen name="FieldOfficerReports" component={FieldOfficerReportsScreen} />
        <Stack.Screen name="FieldOfficerVerificationReports" component={FieldOfficerVerificationReportsScreen} />
        <Stack.Screen name="FieldOfficerReportDetail" component={FieldOfficerReportDetailScreen} />
        <Stack.Screen name="FieldOfficerReportPreview" component={FieldOfficerReportPreviewScreen} />
        <Stack.Screen name="FieldOfficerReportDraft" component={FieldOfficerReportDraftScreen} />
        <Stack.Screen name="FieldOfficerPendingReports" component={FieldOfficerPendingReportsScreen} />
        <Stack.Screen name="FieldOfficerDownloadsCenter" component={FieldOfficerDownloadsCenterScreen} />
        <Stack.Screen name="FieldOfficerDraftReportEditor" component={VisitReportReviewScreen} />
        <Stack.Screen name="FieldOfficerFeedstockVerification" component={FieldOfficerFeedstockVerificationScreen} />
        <Stack.Screen name="FieldOfficerBiocharProductionList" component={FieldOfficerBiocharProductionListScreen} />
        <Stack.Screen name="FieldOfficerBiocharProduction" component={FieldOfficerBiocharProductionScreen} />
        <Stack.Screen name="FieldOfficerBiocharMixing" component={FieldOfficerBiocharMixingScreen} />
        <Stack.Screen name="FieldOfficerCreateVisit" component={FieldOfficerCreateVisitScreen} />
        <Stack.Screen name="FieldOfficerInventoryMovement" component={FieldOfficerInventoryMovementScreen} />
        <Stack.Screen name="FieldOfficerInventoryTasks" component={FieldOfficerInventoryTasksScreen} />
        <Stack.Screen name="FieldOfficerInventoryTaskDetail" component={FieldOfficerInventoryTaskDetailScreen} />
        <Stack.Screen name="FieldOfficerCreateRecord" component={FieldOfficerCreateRecordScreen} />
        <Stack.Screen name="OfficerFullscreenImage" component={OfficerFullscreenImageScreen} />
        <Stack.Screen name="OfficerDocumentViewer" component={OfficerDocumentViewerScreen} />
        <Stack.Screen name="OfficerGpsVerificationMap" component={OfficerGpsVerificationMapScreen} />
        <Stack.Screen name="OfficerGpsValidation" component={OfficerGpsValidationScreen} />
        <Stack.Screen name="OfficerFeedstockCorrection" component={OfficerFeedstockCorrectionScreen} />
        <Stack.Screen name="FieldOfficerVerificationReportDetail" component={FieldOfficerVerificationReportDetailScreen} />
        <Stack.Screen name="FieldOfficerSoilSamples" component={FieldOfficerSoilSamplesScreen} />
        <Stack.Screen name="FieldOfficerBaselineAssessments" component={FieldOfficerBaselineAssessmentsScreen} />
        <Stack.Screen name="FieldOfficerActivityLogs" component={FieldOfficerActivityLogsScreen} />
        <Stack.Screen name="FieldOfficerMonitoringReports" component={FieldOfficerMonitoringReportsScreen} />
        <Stack.Screen name="FieldOfficerNotifications" component={FieldOfficerNotificationsScreen} />
        <Stack.Screen
          name="FieldOfficerVisitVerification"
          getComponent={() =>
            require('../screens/officer/FieldOfficerVisitVerificationScreen').FieldOfficerVisitVerificationScreen
          }
        />
        <Stack.Screen
          name="VisitCheckIn"
          getComponent={() => require('../screens/officer/VisitCheckInScreen').VisitCheckInScreen}
        />
        <Stack.Screen
          name="VisitLocationVerify"
          getComponent={() => require('../screens/officer/VisitLocationVerifyScreen').VisitLocationVerifyScreen}
        />
        <Stack.Screen
          name="FarmVerificationChecklist"
          getComponent={() => require('../screens/officer/FarmVerificationChecklistScreen').FarmVerificationChecklistScreen}
        />
        <Stack.Screen
          name="BiocharApplicationVerification"
          getComponent={() => require('../screens/officer/BiocharApplicationVerificationScreen').BiocharApplicationVerificationScreen}
        />
        <Stack.Screen
          name="EvidenceVerification"
          getComponent={() => require('../screens/officer/EvidenceVerificationScreen').EvidenceVerificationScreen}
        />
        <Stack.Screen name="VerificationChecklist" component={VerificationChecklistScreen} />
        <Stack.Screen
          name="VisitEvidenceUpload"
          getComponent={() => require('../screens/officer/VisitEvidenceUploadScreen').VisitEvidenceUploadScreen}
        />
        <Stack.Screen name="VisitReportReview" component={VisitReportReviewScreen} />
        <Stack.Screen name="VisitReportSuccess" component={VisitReportSuccessScreen} />
        <Stack.Screen name="FarmerOnboardingStart" component={FarmerOnboardingStartScreen} />
        <Stack.Screen name="FarmerBasicDetails" component={FarmerBasicDetailsScreen} />
        <Stack.Screen
          name="FarmerConsent"
          getComponent={() => require('../screens/officer/onboarding/FarmerConsentScreen').FarmerConsentScreen}
        />
        <Stack.Screen name="FarmerAddress" component={FarmerAddressScreen} />
        <Stack.Screen name="FarmerLandDetails" component={FarmerLandDetailsScreen} />
        <Stack.Screen name="OnboardingBoundaryStart" component={OnboardingBoundaryStartScreen} />
        <Stack.Screen
          name="OnboardingBoundaryCapture"
          getComponent={() => require('../screens/officer/onboarding/OnboardingBoundaryCaptureScreen').OnboardingBoundaryCaptureScreen}
        />
        <Stack.Screen name="OnboardingBoundaryPreview" component={OnboardingBoundaryPreviewScreen} />
        <Stack.Screen
          name="OnboardingCameraBoundaryStart"
          getComponent={() => require('../screens/farmer/boundary/camera/CameraBoundaryStartScreen').CameraBoundaryStartScreen}
        />
        <Stack.Screen
          name="OnboardingCameraBoundaryLive"
          getComponent={() => require('../screens/farmer/boundary/camera/CameraBoundaryLiveScreen').CameraBoundaryLiveScreen}
        />
        <Stack.Screen
          name="OnboardingCameraBoundaryPoints"
          getComponent={() => require('../screens/farmer/boundary/camera/CameraBoundaryPointsScreen').CameraBoundaryPointsScreen}
        />
        <Stack.Screen name="OnboardingCameraBoundaryPreview" component={OnboardingBoundaryPreviewScreen} />
        <Stack.Screen
          name="FarmerGpsCapture"
          getComponent={() => require('../screens/officer/onboarding/FarmerGpsCaptureScreen').FarmerGpsCaptureScreen}
        />
        <Stack.Screen
          name="FarmerProofUpload"
          getComponent={() => require('../screens/officer/onboarding/FarmerProofUploadScreen').FarmerProofUploadScreen}
        />
        <Stack.Screen name="FarmerOnboardingReview" component={FarmerOnboardingReviewScreen} />
        <Stack.Screen name="FarmerOnboardingSuccess" component={FarmerOnboardingSuccessScreen} />
        <Stack.Screen name="OnboardedFarmerView" component={OnboardedFarmerViewScreen} />
        <Stack.Screen name="BiocharAwareness" component={BiocharAwarenessScreen} />
        <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
        <Stack.Screen name="OtpVerification" component={OtpVerificationScreen} />
        <Stack.Screen name="ResetPassword" component={ResetPasswordScreen} />
        <Stack.Screen name="CreateMpin" component={CreateMpinScreen} />
        <Stack.Screen
          name="SupportThreads"
          component={OfficerSupportThreadsRoute}
          initialParams={{ supportRole: 'field_officer' }}
        />
        <Stack.Screen name="ChatbotSupport" component={OfficerChatbotSupportRoute} />
        <Stack.Screen name="CreateSupportThread" component={CreateSupportThreadScreen} />
        <Stack.Screen name="SupportChat" component={SupportChatScreenRoute} />
      </Stack.Navigator>
      </BoundaryCaptureProvider>
    </OnboardingProvider>
  );
}
