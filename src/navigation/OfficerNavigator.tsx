import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { CreateMpinScreen } from '../screens/auth/CreateMpinScreen';
import { ForgotPasswordScreen } from '../screens/auth/ForgotPasswordScreen';
import { OtpVerificationScreen } from '../screens/auth/OtpVerificationScreen';
import { ResetPasswordScreen } from '../screens/auth/ResetPasswordScreen';
import { OnboardingProvider } from '../context/OnboardingContext';
import { FieldOfficerActivityLogsScreen } from '../screens/officer/FieldOfficerActivityLogsScreen';
import { FieldOfficerAssignmentDetailScreen } from '../screens/officer/FieldOfficerAssignmentDetailScreen';
import { FieldOfficerAssignmentsScreen } from '../screens/officer/FieldOfficerAssignmentsScreen';
import { FieldOfficerBaselineAssessmentsScreen } from '../screens/officer/FieldOfficerBaselineAssessmentsScreen';
import { FieldOfficerMonitoringReportsScreen } from '../screens/officer/FieldOfficerMonitoringReportsScreen';
import { FieldOfficerNotificationsScreen } from '../screens/officer/FieldOfficerNotificationsScreen';
import { FieldOfficerProfileScreen } from '../screens/officer/FieldOfficerProfileScreen';
import { FieldOfficerSettingsScreen } from '../screens/officer/FieldOfficerSettingsScreen';
import { FieldOfficerSoilSamplesScreen } from '../screens/officer/FieldOfficerSoilSamplesScreen';
import { FieldOfficerVerificationReportDetailScreen } from '../screens/officer/FieldOfficerVerificationReportDetailScreen';
import { FieldOfficerVerificationReportsScreen } from '../screens/officer/FieldOfficerVerificationReportsScreen';
import { FarmerAddressScreen } from '../screens/officer/onboarding/FarmerAddressScreen';
import { FarmerConsentScreen } from '../screens/officer/onboarding/FarmerConsentScreen';
import { FarmerBasicDetailsScreen } from '../screens/officer/onboarding/FarmerBasicDetailsScreen';
import { OnboardedFarmerViewScreen } from '../screens/officer/onboarding/OnboardedFarmerViewScreen';
import { FarmerGpsCaptureScreen } from '../screens/officer/onboarding/FarmerGpsCaptureScreen';
import { FarmerLandDetailsScreen } from '../screens/officer/onboarding/FarmerLandDetailsScreen';
import { FarmerOnboardingReviewScreen } from '../screens/officer/onboarding/FarmerOnboardingReviewScreen';
import { FarmerOnboardingStartScreen } from '../screens/officer/onboarding/FarmerOnboardingStartScreen';
import { FarmerOnboardingSuccessScreen } from '../screens/officer/onboarding/FarmerOnboardingSuccessScreen';
import { FarmerProofUploadScreen } from '../screens/officer/onboarding/FarmerProofUploadScreen';
import { VerificationChecklistScreen } from '../screens/officer/VerificationChecklistScreen';
import { VisitCheckInScreen } from '../screens/officer/VisitCheckInScreen';
import { VisitEvidenceUploadScreen } from '../screens/officer/VisitEvidenceUploadScreen';
import { VisitReportReviewScreen } from '../screens/officer/VisitReportReviewScreen';
import { VisitReportSuccessScreen } from '../screens/officer/VisitReportSuccessScreen';
import { StitchScreenRoute } from '../screens/stitch/StitchScreenRoute';
import { OfficerTabNavigator } from './OfficerTabNavigator';
import type { FieldOfficerStackParamList } from './types';

const Stack = createNativeStackNavigator<FieldOfficerStackParamList>();

export function OfficerNavigator() {
  return (
    <OnboardingProvider>
      <Stack.Navigator initialRouteName="FieldOfficerTabs" screenOptions={{ headerShown: false }}>
        <Stack.Screen name="FieldOfficerTabs" component={OfficerTabNavigator} />
        <Stack.Screen name="StitchScreen" component={StitchScreenRoute} />
        <Stack.Screen name="FieldOfficerProfile" component={FieldOfficerProfileScreen} />
        <Stack.Screen name="FieldOfficerSettings" component={FieldOfficerSettingsScreen} />
        <Stack.Screen name="FieldOfficerAssignments" component={FieldOfficerAssignmentsScreen} />
        <Stack.Screen name="FieldOfficerAssignmentDetail" component={FieldOfficerAssignmentDetailScreen} />
        <Stack.Screen name="FieldOfficerVerificationReports" component={FieldOfficerVerificationReportsScreen} />
        <Stack.Screen name="FieldOfficerVerificationReportDetail" component={FieldOfficerVerificationReportDetailScreen} />
        <Stack.Screen name="FieldOfficerSoilSamples" component={FieldOfficerSoilSamplesScreen} />
        <Stack.Screen name="FieldOfficerBaselineAssessments" component={FieldOfficerBaselineAssessmentsScreen} />
        <Stack.Screen name="FieldOfficerActivityLogs" component={FieldOfficerActivityLogsScreen} />
        <Stack.Screen name="FieldOfficerMonitoringReports" component={FieldOfficerMonitoringReportsScreen} />
        <Stack.Screen name="FieldOfficerNotifications" component={FieldOfficerNotificationsScreen} />
        <Stack.Screen name="VisitCheckIn" component={VisitCheckInScreen} />
        <Stack.Screen name="VerificationChecklist" component={VerificationChecklistScreen} />
        <Stack.Screen name="VisitEvidenceUpload" component={VisitEvidenceUploadScreen} />
        <Stack.Screen name="VisitReportReview" component={VisitReportReviewScreen} />
        <Stack.Screen name="VisitReportSuccess" component={VisitReportSuccessScreen} />
        <Stack.Screen name="FarmerOnboardingStart" component={FarmerOnboardingStartScreen} />
        <Stack.Screen name="FarmerBasicDetails" component={FarmerBasicDetailsScreen} />
        <Stack.Screen name="FarmerConsent" component={FarmerConsentScreen} />
        <Stack.Screen name="FarmerAddress" component={FarmerAddressScreen} />
        <Stack.Screen name="FarmerLandDetails" component={FarmerLandDetailsScreen} />
        <Stack.Screen name="FarmerGpsCapture" component={FarmerGpsCaptureScreen} />
        <Stack.Screen name="FarmerProofUpload" component={FarmerProofUploadScreen} />
        <Stack.Screen name="FarmerOnboardingReview" component={FarmerOnboardingReviewScreen} />
        <Stack.Screen name="FarmerOnboardingSuccess" component={FarmerOnboardingSuccessScreen} />
        <Stack.Screen name="OnboardedFarmerView" component={OnboardedFarmerViewScreen} />
        <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
        <Stack.Screen name="OtpVerification" component={OtpVerificationScreen} />
        <Stack.Screen name="ResetPassword" component={ResetPasswordScreen} />
        <Stack.Screen name="CreateMpin" component={CreateMpinScreen} />
      </Stack.Navigator>
    </OnboardingProvider>
  );
}
