import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { BoundaryCaptureProvider } from '../context/BoundaryCaptureContext';

import { CreateMpinScreen } from '../screens/auth/CreateMpinScreen';
import { ForgotPasswordScreen } from '../screens/auth/ForgotPasswordScreen';
import { OtpVerificationScreen } from '../screens/auth/OtpVerificationScreen';
import { ResetPasswordScreen } from '../screens/auth/ResetPasswordScreen';
import { FarmerAddressDetailsScreen } from '../screens/farmer/FarmerAddressDetailsScreen';
import { FarmerBenefitsScreen } from '../screens/farmer/FarmerBenefitsScreen';
import { FarmerAddBaselineAssessmentScreen } from '../screens/farmer/FarmerAddBaselineAssessmentScreen';
import { FarmerBaselineAssessmentDetailScreen } from '../screens/farmer/FarmerBaselineAssessmentDetailScreen';
import { FarmerBaselineAssessmentsScreen } from '../screens/farmer/FarmerBaselineAssessmentsScreen';
import { FarmerCarbonCalculationDetailScreen } from '../screens/farmer/FarmerCarbonCalculationDetailScreen';
import { FarmerCarbonCalculationsScreen } from '../screens/farmer/FarmerCarbonCalculationsScreen';
import { FarmerAddFarmScreen } from '../screens/farmer/FarmerAddFarmScreen';
import { FarmerFarmActivityScreen } from '../screens/farmer/FarmerFarmActivityScreen';
import { FarmerFarmSelectionScreen } from '../screens/farmer/FarmerFarmSelectionScreen';
import { FarmerEditFarmScreen } from '../screens/farmer/FarmerEditFarmScreen';
import { FarmerFarmMapFullScreen } from '../screens/farmer/FarmerFarmMapFullScreen';
import { FarmerSubmitActivityScreen } from '../screens/farmer/FarmerSubmitActivityScreen';
import { FarmerFarmDetailScreen } from '../screens/farmer/FarmerFarmDetailScreen';
import { FarmBoundarySaveConfirmScreen } from '../screens/farmer/boundary/FarmBoundarySaveConfirmScreen';
import { FarmBoundarySuccessScreen } from '../screens/farmer/boundary/FarmBoundarySuccessScreen';
import { FarmBoundaryUploadingScreen } from '../screens/farmer/boundary/FarmBoundaryUploadingScreen';
import { FarmerFarmsScreen } from '../screens/farmer/FarmerFarmsScreen';
import { FarmerFeedstockCollectionScreen } from '../screens/farmer/FarmerFeedstockCollectionScreen';
import { FarmerFinalReportDetailScreen } from '../screens/farmer/FarmerFinalReportDetailScreen';
import { FarmerReportPreviewScreen } from '../screens/reports/ReportsCenterScreen';
import { FarmerFinalReportsScreen } from '../screens/farmer/FarmerFinalReportsScreen';
import { FarmerNotificationsScreen } from '../screens/farmer/FarmerNotificationsScreen';
import { FarmerActivityLogsScreen } from '../screens/farmer/FarmerActivityLogsScreen';
import { FarmerProjectDetailsScreen } from '../screens/farmer/FarmerProjectDetailsScreen';
import { CreateSupportThreadScreen } from '../screens/shared/CreateSupportThreadScreen';
import { SupportChatScreenRoute } from '../screens/shared/SupportChatScreenRoute';
import { FarmerChatbotSupportRoute } from '../screens/shared/ChatbotSupportScreenRoute';
import { FarmerSupportThreadsRoute } from '../screens/shared/SupportThreadsScreenRoute';
import { FarmerServiceDetailScreen } from '../screens/farmer/FarmerServiceDetailScreen';
import { FarmerBiocharMixingScreen } from '../screens/farmer/FarmerBiocharMixingScreen';
import { FarmerBiocharActivitiesScreen } from '../screens/farmer/FarmerBiocharActivitiesScreen';
import { FarmerBiocharProductionScreen } from '../screens/farmer/FarmerBiocharProductionScreen';
import { FarmerBiocharUpdatesScreen } from '../screens/farmer/FarmerBiocharUpdatesScreen';
import { FarmerLegalScreen } from '../screens/farmer/FarmerLegalScreen';
import { FarmerServicesScreen } from '../screens/farmer/FarmerServicesScreen';
import { FarmerWalletScreen } from '../screens/farmer/FarmerWalletScreen';
import { FarmerSettingsScreen } from '../screens/farmer/FarmerSettingsScreen';
import { FarmerSoilSamplesScreen } from '../screens/farmer/FarmerSoilSamplesScreen';
import { FarmerSoilSampleDetailScreen } from '../screens/farmer/FarmerSoilSampleDetailScreen';
import { FarmerVerificationStatusScreen } from '../screens/farmer/FarmerVerificationStatusScreen';
import { FarmerWeeklyUpdateDetailScreen } from '../screens/farmer/FarmerWeeklyUpdateDetailScreen';
import { FarmerWeeklyUpdatesScreen } from '../screens/farmer/FarmerWeeklyUpdatesScreen';
import { FarmerCreateWeeklyUpdateScreen } from '../screens/farmer/FarmerCreateWeeklyUpdateScreen';
import { FarmerEvidenceListScreen } from '../screens/farmer/FarmerEvidenceListScreen';
import { FarmerEvidenceDetailScreen } from '../screens/farmer/FarmerEvidenceDetailScreen';
import { FarmerUploadEvidenceScreen } from '../screens/farmer/FarmerUploadEvidenceScreen';
import { FullscreenImageScreen } from '../screens/shared/FullscreenImageScreen';
import { StitchScreenRoute } from '../screens/stitch/StitchScreenRoute';
import { FarmerTabNavigator } from './FarmerTabNavigator';
import type { FarmerStackParamList } from './types';
import { RoleAppLayout } from '../components/shared/AuthenticatedAppShell';

const Stack = createNativeStackNavigator<FarmerStackParamList>();

if (__DEV__) {
  console.log('[FARMER WALLET ROUTE]', {
    FarmerWalletScreen,
    isValid: typeof FarmerWalletScreen === 'function',
  });
}

export function FarmerNavigator() {
  return (
    <BoundaryCaptureProvider>
      <Stack.Navigator
        id="FarmerRootStack"
        initialRouteName="FarmerTabs"
        layout={({ children }) => <RoleAppLayout>{children}</RoleAppLayout>}
        screenOptions={{ headerShown: false, animation: 'slide_from_right' }}
      >
        <Stack.Screen name="FarmerTabs" component={FarmerTabNavigator} />
        <Stack.Screen name="StitchScreen" component={StitchScreenRoute} />
        <Stack.Screen
          name="FarmerProfile"
          getComponent={() => require('../screens/farmer/FarmerProfileScreen').FarmerProfileScreen}
        />
        <Stack.Screen name="FarmerSettings" component={FarmerSettingsScreen} />
        <Stack.Screen
          name="ChangePattern"
          getComponent={() => require('../screens/auth/ChangePatternScreen').ChangePatternScreen}
        />
        <Stack.Screen name="FarmerFarms" component={FarmerFarmsScreen} />
        <Stack.Screen name="FarmerFarmDetail" component={FarmerFarmDetailScreen} />
        <Stack.Screen
          name="FarmBoundaryStart"
          getComponent={() => require('../screens/farmer/boundary/FarmBoundaryStartScreen').FarmBoundaryStartScreen}
        />
        <Stack.Screen
          name="FarmerFarmBoundaryView"
          getComponent={() =>
            require('../screens/farmer/boundary/FarmerFarmBoundaryViewScreen').FarmerFarmBoundaryViewScreen
          }
        />
        <Stack.Screen
          name="FarmBoundaryCapture"
          getComponent={() => require('../screens/farmer/boundary/FarmBoundaryCaptureScreen').FarmBoundaryCaptureScreen}
        />
        <Stack.Screen
          name="FarmBoundaryPreview"
          getComponent={() => require('../screens/farmer/boundary/FarmBoundaryPreviewScreen').FarmBoundaryPreviewScreen}
        />
        <Stack.Screen name="FarmBoundarySaveConfirm" component={FarmBoundarySaveConfirmScreen} />
        <Stack.Screen name="FarmBoundaryUploading" component={FarmBoundaryUploadingScreen} />
        <Stack.Screen name="FarmBoundarySuccess" component={FarmBoundarySuccessScreen} />
        <Stack.Screen
          name="CameraBoundaryStart"
          getComponent={() =>
            require('../screens/farmer/boundary/camera/CameraBoundaryStartScreen').CameraBoundaryStartScreen
          }
        />
        <Stack.Screen
          name="CameraBoundaryLive"
          getComponent={() =>
            require('../screens/farmer/boundary/camera/CameraBoundaryLiveScreen').CameraBoundaryLiveScreen
          }
        />
        <Stack.Screen
          name="CameraBoundaryPoints"
          getComponent={() =>
            require('../screens/farmer/boundary/camera/CameraBoundaryPointsScreen').CameraBoundaryPointsScreen
          }
        />
        <Stack.Screen
          name="CameraBoundaryPreview"
          getComponent={() =>
            require('../screens/farmer/boundary/camera/CameraBoundaryPreviewScreen').CameraBoundaryPreviewScreen
          }
        />
        <Stack.Screen
          name="CameraBoundaryUploading"
          getComponent={() =>
            require('../screens/farmer/boundary/camera/CameraBoundaryUploadingScreen').CameraBoundaryUploadingScreen
          }
        />
        <Stack.Screen
          name="BoundaryPhotoGallery"
          getComponent={() =>
            require('../screens/farmer/boundary/camera/BoundaryPhotoGalleryScreen').BoundaryPhotoGalleryScreen
          }
        />
        <Stack.Screen
          name="FarmerFarmGps"
          getComponent={() => require('../screens/farmer/FarmerFarmGpsScreen').FarmerFarmGpsScreen}
        />
        <Stack.Screen name="FarmerFarmMapFullScreen" component={FarmerFarmMapFullScreen} />
        <Stack.Screen name="FarmerEditFarm" component={FarmerEditFarmScreen} />
        <Stack.Screen name="FarmerFarmSelection" component={FarmerFarmSelectionScreen} />
        <Stack.Screen name="FarmerFarmActivity" component={FarmerFarmActivityScreen} />
        <Stack.Screen name="FarmerAddFarm" component={FarmerAddFarmScreen} />
        <Stack.Screen name="FarmerSubmitActivity" component={FarmerSubmitActivityScreen} />
        <Stack.Screen
          name="FarmerActivityDetail"
          getComponent={() => require('../screens/farmer/FarmerActivityDetailScreen').FarmerActivityDetailScreen}
        />
        <Stack.Screen name="FarmerWeeklyUpdates" component={FarmerWeeklyUpdatesScreen} />
        <Stack.Screen name="FarmerWeeklyUpdateDetail" component={FarmerWeeklyUpdateDetailScreen} />
        <Stack.Screen name="FarmerCreateWeeklyUpdate" component={FarmerCreateWeeklyUpdateScreen} />
        <Stack.Screen name="FarmerBiocharUpdates" component={FarmerBiocharUpdatesScreen} />
        <Stack.Screen name="FarmerBiocharActivities" component={FarmerBiocharActivitiesScreen} />
        <Stack.Screen name="FarmerBiocharProduction" component={FarmerBiocharProductionScreen} />
        <Stack.Screen name="FarmerBiocharMixing" component={FarmerBiocharMixingScreen} />
        <Stack.Screen
          name="FarmerWallet"
          getComponent={() => require('../screens/farmer/FarmerWalletScreen').FarmerWalletScreen}
        />
        <Stack.Screen name="FarmerLegal" component={FarmerLegalScreen} />
        <Stack.Screen name="FarmerEvidenceList" component={FarmerEvidenceListScreen} />
        <Stack.Screen name="FarmerUploadEvidence" component={FarmerUploadEvidenceScreen} />
        <Stack.Screen name="FarmerEvidenceDetail" component={FarmerEvidenceDetailScreen} />
        <Stack.Screen name="FullscreenImage" component={FullscreenImageScreen} />
        <Stack.Screen name="FarmerServices" component={FarmerServicesScreen} />
        <Stack.Screen name="FarmerServiceDetail" component={FarmerServiceDetailScreen} />
        <Stack.Screen name="FarmerActivityLogs" component={FarmerActivityLogsScreen} />
        <Stack.Screen name="FarmerBaselineAssessments" component={FarmerBaselineAssessmentsScreen} />
        <Stack.Screen name="FarmerAddBaselineAssessment" component={FarmerAddBaselineAssessmentScreen} />
        <Stack.Screen name="FarmerBaselineAssessmentDetail" component={FarmerBaselineAssessmentDetailScreen} />
        <Stack.Screen name="FarmerSoilSamples" component={FarmerSoilSamplesScreen} />
        <Stack.Screen name="FarmerSoilSampleDetail" component={FarmerSoilSampleDetailScreen} />
        <Stack.Screen name="FarmerVerificationStatus" component={FarmerVerificationStatusScreen} />
        <Stack.Screen name="FarmerCarbonCalculations" component={FarmerCarbonCalculationsScreen} />
        <Stack.Screen name="FarmerCarbonCalculationDetail" component={FarmerCarbonCalculationDetailScreen} />
        <Stack.Screen name="FarmerFinalReports" component={FarmerFinalReportsScreen} />
        <Stack.Screen name="FarmerFeedstockCollection" component={FarmerFeedstockCollectionScreen} />
        <Stack.Screen name="FarmerFinalReportDetail" component={FarmerFinalReportDetailScreen} />
        <Stack.Screen name="FarmerReportPreview" component={FarmerReportPreviewScreen} />
        <Stack.Screen name="FarmerNotifications" component={FarmerNotificationsScreen} />
        <Stack.Screen name="FarmerAddressDetails" component={FarmerAddressDetailsScreen} />
        <Stack.Screen name="FarmerProjectDetails" component={FarmerProjectDetailsScreen} />
        <Stack.Screen name="FarmerBenefits" component={FarmerBenefitsScreen} />
        <Stack.Screen
          name="SupportThreads"
          component={FarmerSupportThreadsRoute}
          initialParams={{ supportRole: 'farmer' }}
        />
        <Stack.Screen name="ChatbotSupport" component={FarmerChatbotSupportRoute} />
        <Stack.Screen name="CreateSupportThread" component={CreateSupportThreadScreen} />
        <Stack.Screen name="SupportChat" component={SupportChatScreenRoute} />
        <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
        <Stack.Screen name="OtpVerification" component={OtpVerificationScreen} />
        <Stack.Screen name="ResetPassword" component={ResetPasswordScreen} />
        <Stack.Screen name="CreateMpin" component={CreateMpinScreen} />
      </Stack.Navigator>
    </BoundaryCaptureProvider>
  );
}
