import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { BoundaryCaptureProvider } from '../context/BoundaryCaptureContext';

import { CreateMpinScreen } from '../screens/auth/CreateMpinScreen';
import { ForgotPasswordScreen } from '../screens/auth/ForgotPasswordScreen';
import { OtpVerificationScreen } from '../screens/auth/OtpVerificationScreen';
import { ResetPasswordScreen } from '../screens/auth/ResetPasswordScreen';
import { FarmerAddressDetailsScreen } from '../screens/farmer/FarmerAddressDetailsScreen';
import { FarmerBenefitsScreen } from '../screens/farmer/FarmerBenefitsScreen';
import { FarmerBaselineAssessmentsScreen } from '../screens/farmer/FarmerBaselineAssessmentsScreen';
import { FarmerCarbonCalculationDetailScreen } from '../screens/farmer/FarmerCarbonCalculationDetailScreen';
import { FarmerCarbonCalculationsScreen } from '../screens/farmer/FarmerCarbonCalculationsScreen';
import { FarmerAddFarmScreen } from '../screens/farmer/FarmerAddFarmScreen';
import { FarmerEditFarmScreen } from '../screens/farmer/FarmerEditFarmScreen';
import { FarmerFarmGpsScreen } from '../screens/farmer/FarmerFarmGpsScreen';
import { FarmerFarmMapFullScreen } from '../screens/farmer/FarmerFarmMapFullScreen';
import { FarmerSubmitActivityScreen } from '../screens/farmer/FarmerSubmitActivityScreen';
import { FarmerFarmDetailScreen } from '../screens/farmer/FarmerFarmDetailScreen';
import { FarmBoundaryCaptureScreen } from '../screens/farmer/boundary/FarmBoundaryCaptureScreen';
import { FarmBoundaryPreviewScreen } from '../screens/farmer/boundary/FarmBoundaryPreviewScreen';
import { FarmBoundarySaveConfirmScreen } from '../screens/farmer/boundary/FarmBoundarySaveConfirmScreen';
import { FarmBoundaryStartScreen } from '../screens/farmer/boundary/FarmBoundaryStartScreen';
import { FarmBoundarySuccessScreen } from '../screens/farmer/boundary/FarmBoundarySuccessScreen';
import { FarmBoundaryUploadingScreen } from '../screens/farmer/boundary/FarmBoundaryUploadingScreen';
import { FarmerFarmsScreen } from '../screens/farmer/FarmerFarmsScreen';
import { FarmerFinalReportDetailScreen } from '../screens/farmer/FarmerFinalReportDetailScreen';
import { FarmerFinalReportsScreen } from '../screens/farmer/FarmerFinalReportsScreen';
import { FarmerNotificationsScreen } from '../screens/farmer/FarmerNotificationsScreen';
import { FarmerActivityLogsScreen } from '../screens/farmer/FarmerActivityLogsScreen';
import { FarmerProfileScreen } from '../screens/farmer/FarmerProfileScreen';
import { FarmerProjectDetailsScreen } from '../screens/farmer/FarmerProjectDetailsScreen';
import { FarmerSupportScreen } from '../screens/farmer/FarmerSupportScreen';
import { FarmerServiceDetailScreen } from '../screens/farmer/FarmerServiceDetailScreen';
import { FarmerServicesScreen } from '../screens/farmer/FarmerServicesScreen';
import { FarmerSettingsScreen } from '../screens/farmer/FarmerSettingsScreen';
import { FarmerSoilSamplesScreen } from '../screens/farmer/FarmerSoilSamplesScreen';
import { FarmerVerificationStatusScreen } from '../screens/farmer/FarmerVerificationStatusScreen';
import { FarmerWeeklyUpdateDetailScreen } from '../screens/farmer/FarmerWeeklyUpdateDetailScreen';
import { FarmerWeeklyUpdatesScreen } from '../screens/farmer/FarmerWeeklyUpdatesScreen';
import { StitchScreenRoute } from '../screens/stitch/StitchScreenRoute';
import { FarmerTabNavigator } from './FarmerTabNavigator';
import type { FarmerStackParamList } from './types';

const Stack = createNativeStackNavigator<FarmerStackParamList>();

export function FarmerNavigator() {
  return (
    <BoundaryCaptureProvider>
      <Stack.Navigator
        initialRouteName="FarmerTabs"
        screenOptions={{ headerShown: false, animation: 'slide_from_right' }}
      >
      <Stack.Screen name="FarmerTabs" component={FarmerTabNavigator} />
      <Stack.Screen name="StitchScreen" component={StitchScreenRoute} />
      <Stack.Screen name="FarmerProfile" component={FarmerProfileScreen} />
      <Stack.Screen name="FarmerSettings" component={FarmerSettingsScreen} />
      <Stack.Screen name="FarmerFarms" component={FarmerFarmsScreen} />
      <Stack.Screen name="FarmerFarmDetail" component={FarmerFarmDetailScreen} />
      <Stack.Screen name="FarmBoundaryStart" component={FarmBoundaryStartScreen} />
      <Stack.Screen name="FarmBoundaryCapture" component={FarmBoundaryCaptureScreen} />
      <Stack.Screen name="FarmBoundaryPreview" component={FarmBoundaryPreviewScreen} />
      <Stack.Screen name="FarmBoundarySaveConfirm" component={FarmBoundarySaveConfirmScreen} />
      <Stack.Screen name="FarmBoundaryUploading" component={FarmBoundaryUploadingScreen} />
      <Stack.Screen name="FarmBoundarySuccess" component={FarmBoundarySuccessScreen} />
      <Stack.Screen name="FarmerFarmGps" component={FarmerFarmGpsScreen} />
      <Stack.Screen name="FarmerFarmMapFullScreen" component={FarmerFarmMapFullScreen} />
      <Stack.Screen name="FarmerEditFarm" component={FarmerEditFarmScreen} />
      <Stack.Screen name="FarmerAddFarm" component={FarmerAddFarmScreen} />
      <Stack.Screen name="FarmerSubmitActivity" component={FarmerSubmitActivityScreen} />
      <Stack.Screen name="FarmerWeeklyUpdates" component={FarmerWeeklyUpdatesScreen} />
      <Stack.Screen name="FarmerWeeklyUpdateDetail" component={FarmerWeeklyUpdateDetailScreen} />
      <Stack.Screen name="FarmerServices" component={FarmerServicesScreen} />
      <Stack.Screen name="FarmerServiceDetail" component={FarmerServiceDetailScreen} />
      <Stack.Screen name="FarmerActivityLogs" component={FarmerActivityLogsScreen} />
      <Stack.Screen name="FarmerBaselineAssessments" component={FarmerBaselineAssessmentsScreen} />
      <Stack.Screen name="FarmerSoilSamples" component={FarmerSoilSamplesScreen} />
      <Stack.Screen name="FarmerVerificationStatus" component={FarmerVerificationStatusScreen} />
      <Stack.Screen name="FarmerCarbonCalculations" component={FarmerCarbonCalculationsScreen} />
      <Stack.Screen name="FarmerCarbonCalculationDetail" component={FarmerCarbonCalculationDetailScreen} />
      <Stack.Screen name="FarmerFinalReports" component={FarmerFinalReportsScreen} />
      <Stack.Screen name="FarmerFinalReportDetail" component={FarmerFinalReportDetailScreen} />
      <Stack.Screen name="FarmerNotifications" component={FarmerNotificationsScreen} />
      <Stack.Screen name="FarmerAddressDetails" component={FarmerAddressDetailsScreen} />
      <Stack.Screen name="FarmerProjectDetails" component={FarmerProjectDetailsScreen} />
      <Stack.Screen name="FarmerBenefits" component={FarmerBenefitsScreen} />
      <Stack.Screen name="FarmerSupport" component={FarmerSupportScreen} />
      <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
      <Stack.Screen name="OtpVerification" component={OtpVerificationScreen} />
      <Stack.Screen name="ResetPassword" component={ResetPasswordScreen} />
      <Stack.Screen name="CreateMpin" component={CreateMpinScreen} />
      </Stack.Navigator>
    </BoundaryCaptureProvider>
  );
}
