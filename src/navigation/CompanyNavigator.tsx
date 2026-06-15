import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { CompanyBiocharRecordDetailScreen } from '../screens/company/CompanyBiocharRecordDetailScreen';
import { CompanyBiocharRecordsScreen } from '../screens/company/CompanyBiocharRecordsScreen';
import { CompanyCarbonCalculationDetailScreen } from '../screens/company/CompanyCarbonCalculationDetailScreen';
import { CompanyCarbonCalculationsScreen } from '../screens/company/CompanyCarbonCalculationsScreen';
import { CompanyFinalReportDetailScreen } from '../screens/company/CompanyFinalReportDetailScreen';
import { CompanyFinalReportsScreen } from '../screens/company/CompanyFinalReportsScreen';
import { CompanyIndustrialCarbonRecordDetailScreen } from '../screens/company/CompanyIndustrialCarbonRecordDetailScreen';
import { CompanyIndustrialCarbonRecordsScreen } from '../screens/company/CompanyIndustrialCarbonRecordsScreen';
import { CompanyNotificationsScreen } from '../screens/company/CompanyNotificationsScreen';
import { CompanyProfileScreen } from '../screens/company/CompanyProfileScreen';
import { CompanyServiceSubmissionDetailScreen } from '../screens/company/CompanyServiceSubmissionDetailScreen';
import { CompanyServiceSubmissionsScreen } from '../screens/company/CompanyServiceSubmissionsScreen';
import { CompanySettingsScreen } from '../screens/company/CompanySettingsScreen';
import { CompanySiteDetailScreen } from '../screens/company/CompanySiteDetailScreen';
import { CompanySitesScreen } from '../screens/company/CompanySitesScreen';
import { CompanyWasteRecordDetailScreen } from '../screens/company/CompanyWasteRecordDetailScreen';
import { CompanyWasteRecordsScreen } from '../screens/company/CompanyWasteRecordsScreen';
import { StitchScreenRoute } from '../screens/stitch/StitchScreenRoute';
import { CompanyTabNavigator } from './CompanyTabNavigator';
import type { CompanyStackParamList } from './types';

const Stack = createNativeStackNavigator<CompanyStackParamList>();

export function CompanyNavigator() {
  return (
    <Stack.Navigator initialRouteName="CompanyTabs" screenOptions={{ headerShown: false }}>
      <Stack.Screen name="CompanyTabs" component={CompanyTabNavigator} />
      <Stack.Screen name="StitchScreen" component={StitchScreenRoute} />
      <Stack.Screen name="CompanyProfile" component={CompanyProfileScreen} />
      <Stack.Screen name="CompanySettings" component={CompanySettingsScreen} />
      <Stack.Screen name="CompanySites" component={CompanySitesScreen} />
      <Stack.Screen name="CompanySiteDetail" component={CompanySiteDetailScreen} />
      <Stack.Screen name="CompanyServiceSubmissions" component={CompanyServiceSubmissionsScreen} />
      <Stack.Screen name="CompanyServiceSubmissionDetail" component={CompanyServiceSubmissionDetailScreen} />
      <Stack.Screen name="CompanyWasteRecords" component={CompanyWasteRecordsScreen} />
      <Stack.Screen name="CompanyWasteRecordDetail" component={CompanyWasteRecordDetailScreen} />
      <Stack.Screen name="CompanyIndustrialCarbonRecords" component={CompanyIndustrialCarbonRecordsScreen} />
      <Stack.Screen name="CompanyIndustrialCarbonRecordDetail" component={CompanyIndustrialCarbonRecordDetailScreen} />
      <Stack.Screen name="CompanyBiocharRecords" component={CompanyBiocharRecordsScreen} />
      <Stack.Screen name="CompanyBiocharRecordDetail" component={CompanyBiocharRecordDetailScreen} />
      <Stack.Screen name="CompanyCarbonCalculations" component={CompanyCarbonCalculationsScreen} />
      <Stack.Screen name="CompanyCarbonCalculationDetail" component={CompanyCarbonCalculationDetailScreen} />
      <Stack.Screen name="CompanyFinalReports" component={CompanyFinalReportsScreen} />
      <Stack.Screen name="CompanyFinalReportDetail" component={CompanyFinalReportDetailScreen} />
      <Stack.Screen name="CompanyNotifications" component={CompanyNotificationsScreen} />
    </Stack.Navigator>
  );
}
