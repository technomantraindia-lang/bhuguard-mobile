import * as companyApi from '../api/companyApi';
import * as farmerApi from '../api/farmerApi';
import * as fieldOfficerApi from '../api/fieldOfficerApi';
import type { ApiRecord } from '../utils/apiHelpers';

/** Maps Stitch screen keys to typed API fetchers (all Laravel GET routes). */
export const STITCH_API_FETCHERS: Record<string, () => Promise<ApiRecord>> = {
  // Farmer core
  plot_list: () => farmerApi.getFarmerPlots(),
  farmer_farms_list: () => farmerApi.getFarmerFarms(),
  farmer_weekly_updates_list: () => farmerApi.getFarmerWeeklyUpdates(),
  farmer_evidence_list: () => farmerApi.getFarmerEvidence(),
  farmer_service_submissions_list: () => farmerApi.getFarmerServiceSubmissions(),
  farmer_activity_log_list: () => farmerApi.getFarmerActivityLogs(),
  baseline_assessment_list: () => farmerApi.getFarmerBaselineAssessments(),
  soil_sample_list: () => farmerApi.getFarmerSoilSamples(),
  practice_list: () => farmerApi.getFarmerRegenerativePractices(),
  carbon_calculation_status: () => farmerApi.getFarmerCarbonCalculations(),
  registry_export_package: () => farmerApi.getFarmerRegistryExports(),
  farmer_dashboard_info: () => farmerApi.getFarmerDashboard(),
  farmer_verification_status: () => farmerApi.getFarmerVerificationStatus(),

  // Farmer DMRV
  production_batch_list: () => farmerApi.getFarmerBiocharBatches(),
  feedstock_collection_list: () => farmerApi.getFarmerFeedstockCollections(),
  biochar_feedstock_list: () => farmerApi.getFarmerBiocharFeedstock(),
  biochar_application_screen: () => farmerApi.getFarmerBiocharApplications(),
  tree_monitoring_log: () => farmerApi.getFarmerAgroforestryMonitoring(),
  plantation_list: () => farmerApi.getFarmerAgroforestryPlantations(),

  // Company
  company_carbon_calculations: () => companyApi.getCompanyCarbonCalculations(),
  company_registry_exports: () => companyApi.getCompanyRegistryExports(),
  company_services_list: () => companyApi.getCompanyServices(),
  company_evidence_list: () => companyApi.getCompanyEvidence(),
  company_verification_status: () => companyApi.getCompanyVerificationStatus(),
  company_dashboard_info: () => companyApi.getCompanyDashboard(),
  company_sites_list: () => companyApi.getCompanySites(),
  company_waste_records_list: () => companyApi.getCompanyWasteRecords(),
  company_industrial_carbon_list: () => companyApi.getCompanyIndustrialCarbonRecords(),
  company_biochar_records_list: () => companyApi.getCompanyBiocharRecords(),
  company_service_submissions_list: () => companyApi.getCompanyServiceSubmissions(),
  company_final_reports_list: () => companyApi.getCompanyFinalReports(),

  // Field officer
  assigned_verification_list: () => fieldOfficerApi.getVisitAssignments(),
  officer_farmers_list: () => fieldOfficerApi.getFieldOfficerFarmers(),
  evidence_review: () => fieldOfficerApi.getVisitAssignments(),
  officer_activity_logs: () => fieldOfficerApi.getActivityLogs(),
  officer_baseline_assessments: () => fieldOfficerApi.getBaselineAssessments(),
  officer_soil_samples: () => fieldOfficerApi.getSoilSamples(),
  officer_monitoring_reports: () => fieldOfficerApi.getMonitoringReports(),
  officer_feedstock_verifications: () => fieldOfficerApi.getFeedstockVerifications(),
  officer_biochar_applications: () => fieldOfficerApi.getBiocharApplications(),
  officer_inventory_tasks: () => fieldOfficerApi.getInventoryVerificationTasks(),
  officer_reports_list: () => fieldOfficerApi.getFieldOfficerReports(),
  officer_verification_reports: () => fieldOfficerApi.getVerificationReports(),
};

export const STITCH_DETAIL_FETCHERS: Record<
  string,
  (itemId: number | string) => Promise<ApiRecord>
> = {
  plot_detail: (id) => farmerApi.getFarmerPlotDetail(id),
  activity_detail: (id) => farmerApi.getFarmerActivityLogDetail(id),
  baseline_detail: (id) => farmerApi.getFarmerBaselineAssessmentDetail(id),
  soil_sample_detail: (id) => farmerApi.getFarmerSoilSampleDetail(id),
  practice_detail: (id) =>
    farmerApi.getFarmerRegenerativePractices().then((data) => {
      const items = (data.records ?? data.regenerative_practices ?? data.practices ?? []) as ApiRecord[];
      const match = items.find((i) => String(i?.id) === String(id));
      if (!match) {
        throw Object.assign(new Error('Not found'), { response: { status: 404 } });
      }
      return { regenerative_practice: match };
    }),
  carbon_calculation_detail: (id) => farmerApi.getFarmerCarbonCalculationDetail(id),
  biochar_batch_detail: (id) =>
    farmerApi.getFarmerBiocharBatches().then((data) => {
      const items = (data.batches ?? []) as ApiRecord[];
      const match = items.find((i) => String(i?.id) === String(id));
      if (!match) {
        throw Object.assign(new Error('Not found'), { response: { status: 404 } });
      }
      return { batch: match };
    }),
  verification_detail: (id) => fieldOfficerApi.getVisitAssignmentDetail(id),
  officer_farmer_detail: (id) => fieldOfficerApi.getFieldOfficerFarmerDetail(id),
  assignment_evidence_detail: (id) => fieldOfficerApi.getAssignmentEvidence(id),
  assignment_report_detail: (id) => fieldOfficerApi.getAssignmentReport(id),
  feedstock_verification_detail: (id) => fieldOfficerApi.getFeedstockVerificationDetail(id),
  biochar_application_detail: (id) => fieldOfficerApi.getBiocharApplicationDetail(id),
  officer_inventory_task_detail: (id) => fieldOfficerApi.getInventoryVerificationTaskDetail(id),
  officer_report_detail: (id) => fieldOfficerApi.getFieldOfficerReportDetail(id),
  company_site_detail: (id) => companyApi.getCompanySiteDetail(id),
  company_submission_detail: (id) => companyApi.getCompanyServiceSubmissionDetail(id),
  company_waste_detail: (id) => companyApi.getCompanyWasteRecordDetail(id),
  company_industrial_detail: (id) => companyApi.getCompanyIndustrialCarbonRecordDetail(id),
  company_biochar_detail: (id) => companyApi.getCompanyBiocharRecordDetail(id),
  company_carbon_detail: (id) => companyApi.getCompanyCarbonCalculationDetail(id),
  company_final_report_detail: (id) => companyApi.getCompanyFinalReportDetail(id),
};

/** Laravel POST routes available for Stitch form screens. */
export const STITCH_POST_ENDPOINTS: Record<string, string> = {
  add_activity_log: '/farmer/activity-logs',
  add_practice_record: '/farmer/regenerative-practices',
  add_farmer_evidence: '/farmer/evidence',
  farmer_evidence_upload: '/farmer/evidence',
  add_feedstock_collection: '/farmer/feedstock-collections',
  add_production_batch: '/farmer/biochar/batches',
  plantation_registration: '/farmer/agroforestry/plantations',
  tree_monitoring_log: '/farmer/agroforestry/monitoring',
  carbon_credit_estimator: '/farmer/carbon-estimates',
  soil_carbon_credit_calculator: '/farmer/carbon-estimates',
  biochar_application_screen: '/farmer/biochar/applications',
  export_format_selection: '/farmer/registry-exports',
  add_baseline_assessment: '/farmer/baseline-assessments',
  company_registry_export: '/company/registry-exports',
  officer_create_activity_log: '/field-officer/farmer-activity-logs',
  officer_create_baseline: '/field-officer/baseline-assessments',
  officer_create_soil_sample: '/field-officer/soil-samples',
  officer_create_monitoring_report: '/field-officer/monitoring-reports',
  officer_create_regenerative_practice: '/field-officer/regenerative-practices',
  officer_create_feedstock: '/field-officer/feedstock-collections',
  officer_create_plantation: '/field-officer/agroforestry/plantations',
  artisan_registration: '/field-officer/artisans',
  company_create_site: '/company/sites',
  company_create_submission: '/company/service-submissions',
  company_create_waste: '/company/waste-records',
  company_create_industrial: '/company/industrial-carbon-records',
  company_create_biochar: '/company/biochar-records',
  company_create_registry: '/company/registry-exports',
};
