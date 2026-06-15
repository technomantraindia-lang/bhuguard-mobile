export type StitchRole = 'farmer' | 'company' | 'officer' | 'shared' | 'auth';
export type StitchScreenMode = 'hub' | 'list' | 'detail' | 'form' | 'info';

export interface StitchListFallback {
  apiPath: string;
  listKeys: string[];
  wrapperKey?: string;
}

export interface StitchDetailField {
  label: string;
  keys?: string[];
  nested?: string;
}

export interface StitchScreenConfig {
  title: string;
  subtitle?: string;
  mode: StitchScreenMode;
  role: StitchRole;
  apiPath?: string;
  listKeys?: string[];
  listTitleKeys?: string[];
  listSubtitleKeys?: string[];
  detailApiPath?: string;
  detailScreenKey?: string;
  detailRootKeys?: string[];
  detailTitleKeys?: string[];
  detailFields?: StitchDetailField[];
  listFallback?: StitchListFallback;
  hubChildren?: string[];
  pending?: boolean;
}

export const STITCH_REGISTRY: Record<string, StitchScreenConfig> = {
  // Farmer — plots & farms
  plot_list: { title: 'Plots', mode: 'list', role: 'farmer', apiPath: '/farmer/plots', listKeys: ['plots'], detailApiPath: '/farmer/plots/{id}', detailScreenKey: 'plot_detail', detailRootKeys: ['plot'] },
  plot_detail: { title: 'Plot Detail', mode: 'detail', role: 'farmer', detailApiPath: '/farmer/plots/{id}', detailRootKeys: ['plot'] },
  farmer_farms_list: { title: 'My Farms', mode: 'list', role: 'farmer', apiPath: '/farmer/farms', listKeys: ['farms'] },
  farmer_weekly_updates_list: { title: 'Weekly Updates', mode: 'list', role: 'farmer', apiPath: '/farmer/weekly-updates', listKeys: ['weekly_updates', 'updates'] },
  farmer_evidence_list: { title: 'Evidence Uploads', mode: 'list', role: 'farmer', apiPath: '/farmer/evidence', listKeys: ['evidence', 'evidence_uploads'] },
  farmer_service_submissions_list: { title: 'Service Submissions', mode: 'list', role: 'farmer', apiPath: '/farmer/service-submissions', listKeys: ['submissions'] },
  farmer_dashboard_info: { title: 'Dashboard Summary', mode: 'info', role: 'farmer', apiPath: '/farmer/dashboard' },
  add_new_plot: { title: 'Add New Farm', mode: 'form', role: 'farmer' },
  gps_polygon_capture: { title: 'GPS Polygon Capture', mode: 'form', role: 'farmer', pending: true },
  boundary_evidence: { title: 'Boundary Evidence', mode: 'form', role: 'farmer', pending: true },

  // Farmer — activity
  farmer_activity_log_list: { title: 'Activity Logs', mode: 'list', role: 'farmer', apiPath: '/farmer/activity-logs', listKeys: ['activity_logs'], detailApiPath: '/farmer/activity-logs/{id}', detailScreenKey: 'activity_detail', detailRootKeys: ['activity_log'] },
  add_activity_log: { title: 'Add Activity Log', mode: 'form', role: 'farmer', pending: false },
  activity_detail: { title: 'Activity Detail', mode: 'detail', role: 'farmer', detailApiPath: '/farmer/activity-logs/{id}', detailRootKeys: ['activity_log'] },

  // Farmer — baseline & soil
  baseline_assessment_list: { title: 'Baseline Assessments', mode: 'list', role: 'farmer', apiPath: '/farmer/baseline-assessments', listKeys: ['baseline_assessments', 'assessments'], detailScreenKey: 'baseline_detail' },
  add_baseline_assessment: { title: 'Add Baseline Assessment', mode: 'form', role: 'farmer', pending: true },
  baseline_detail: {
    title: 'Baseline Detail',
    mode: 'detail',
    role: 'farmer',
    listFallback: { apiPath: '/farmer/baseline-assessments', listKeys: ['baseline_assessments', 'assessments'], wrapperKey: 'baseline_assessment' },
    detailRootKeys: ['baseline_assessment'],
  },
  soil_sample_list: { title: 'Soil Samples', mode: 'list', role: 'farmer', apiPath: '/farmer/soil-samples', listKeys: ['soil_samples', 'samples'], detailScreenKey: 'soil_sample_detail' },
  add_soil_sample: { title: 'Add Soil Sample', mode: 'form', role: 'farmer', pending: true },
  soil_sample_detail: {
    title: 'Soil Sample Detail',
    mode: 'detail',
    role: 'farmer',
    listFallback: { apiPath: '/farmer/soil-samples', listKeys: ['soil_samples', 'samples'], wrapperKey: 'soil_sample' },
    detailRootKeys: ['soil_sample'],
  },
  lab_report_preview: { title: 'Lab Report Preview', mode: 'info', role: 'farmer', pending: true },

  // Farmer — practices
  practice_list: {
    title: 'Regenerative Practices',
    mode: 'list',
    role: 'farmer',
    apiPath: '/farmer/regenerative-practices',
    listKeys: ['records', 'regenerative_practices', 'practices'],
    listTitleKeys: ['practice_type_label', 'practice_type'],
    listSubtitleKeys: ['activity_date', 'crop_name'],
    detailScreenKey: 'practice_detail',
  },
  add_practice_record: { title: 'Add Practice Record', mode: 'form', role: 'farmer', pending: true },
  practice_detail: {
    title: 'Practice Detail',
    mode: 'detail',
    role: 'farmer',
    listFallback: {
      apiPath: '/farmer/regenerative-practices',
      listKeys: ['records', 'regenerative_practices', 'practices'],
      wrapperKey: 'regenerative_practice',
    },
    detailRootKeys: ['regenerative_practice', 'record'],
    detailTitleKeys: ['practice_type_label', 'practice_type'],
    detailFields: [
      { label: 'Practice type', keys: ['practice_type_label', 'practice_type'] },
      { label: 'Activity date', keys: ['activity_date'] },
      { label: 'Farm ID', keys: ['farm_id'] },
      { label: 'Plot ID', keys: ['plot_id'] },
      { label: 'Area covered', keys: ['area_covered'] },
      { label: 'Area unit', keys: ['area_unit'] },
      { label: 'Crop', keys: ['crop_name'] },
      { label: 'GPS latitude', keys: ['gps_latitude'] },
      { label: 'GPS longitude', keys: ['gps_longitude'] },
      { label: 'Recorded at', keys: ['timestamp_at'] },
      { label: 'Status', keys: ['status'] },
    ],
  },
  practice_adoption_report: { title: 'Practice Adoption Report', mode: 'info', role: 'farmer', pending: true },

  // Farmer — carbon
  carbon_calculation_status: { title: 'Carbon Calculation Status', mode: 'list', role: 'farmer', apiPath: '/farmer/carbon-calculations', listKeys: ['carbon_calculations'], detailApiPath: '/farmer/carbon-calculations/{id}', detailScreenKey: 'carbon_calculation_detail' },
  carbon_calculation_detail: { title: 'Carbon Calculation Detail', mode: 'detail', role: 'farmer', detailApiPath: '/farmer/carbon-calculations/{id}', detailRootKeys: ['carbon_calculation'] },

  // DMRV — Regenerative Agriculture
  regenerative_agriculture_dashboard: {
    title: 'Regenerative Agriculture',
    mode: 'hub',
    role: 'farmer',
    hubChildren: ['practice_list', 'add_practice_record', 'plantation_list', 'soil_carbon_credit_calculator', 'carbon_credit_estimator', 'seasonal_report', 'annual_report'],
  },
  soil_carbon_credit_calculator: { title: 'Soil Carbon Credit Calculator', mode: 'form', role: 'farmer', pending: true },
  carbon_credit_estimator: { title: 'Carbon Credit Estimator', mode: 'form', role: 'farmer', pending: true },
  carbon_estimate_success: { title: 'Estimate Submitted', mode: 'info', role: 'farmer', pending: true },
  seasonal_report: { title: 'Seasonal Report', mode: 'info', role: 'farmer', pending: true },
  annual_report: { title: 'Annual Report', mode: 'info', role: 'farmer', pending: true },

  // DMRV — Biochar
  biochar_dashboard: {
    title: 'Biochar',
    mode: 'hub',
    role: 'farmer',
    hubChildren: ['production_batch_list', 'feedstock_collection_list', 'biochar_feedstock_list', 'biochar_application_screen', 'biochar_credit_calculator', 'biochar_carbon_removal_estimate'],
  },
  production_unit_list: { title: 'Production Units', mode: 'list', role: 'farmer', pending: true },
  add_production_unit: { title: 'Add Production Unit', mode: 'form', role: 'farmer', pending: true },
  production_batch_list: { title: 'Production Batches', mode: 'list', role: 'farmer', apiPath: '/farmer/biochar/batches', listKeys: ['batches'], detailScreenKey: 'biochar_batch_detail' },
  add_production_batch: { title: 'Add Production Batch', mode: 'form', role: 'farmer', pending: true },
  biochar_batch_detail: {
    title: 'Batch Detail',
    mode: 'detail',
    role: 'farmer',
    listFallback: { apiPath: '/farmer/biochar/batches', listKeys: ['batches'], wrapperKey: 'batch' },
    detailRootKeys: ['batch'],
  },
  feedstock_collection_list: { title: 'Feedstock Collections', mode: 'list', role: 'farmer', apiPath: '/farmer/feedstock-collections', listKeys: ['feedstock_collections'] },
  biochar_feedstock_list: { title: 'Biochar Feedstock', mode: 'list', role: 'farmer', apiPath: '/farmer/biochar/feedstock', listKeys: ['feedstock', 'feedstock_collections'] },
  add_feedstock_collection: { title: 'Add Feedstock Collection', mode: 'form', role: 'farmer', pending: true },
  biochar_quality_test: { title: 'Biochar Quality Test', mode: 'form', role: 'farmer', pending: true },
  biochar_inventory: { title: 'Biochar Inventory', mode: 'list', role: 'farmer', pending: true },
  biochar_application_screen: { title: 'Biochar Application', mode: 'list', role: 'farmer', apiPath: '/farmer/biochar/applications', listKeys: ['applications'] },
  biochar_credit_calculator: { title: 'Biochar Credit Calculator', mode: 'form', role: 'farmer', pending: true },
  biochar_carbon_removal_estimate: { title: 'Carbon Removal Estimate', mode: 'info', role: 'farmer', pending: true },
  artisan_registration: { title: 'Artisan Registration', mode: 'form', role: 'farmer', pending: true },
  artisan_profile: { title: 'Artisan Profile', mode: 'detail', role: 'farmer', pending: true },
  artisan_production_sites: { title: 'Artisan Production Sites', mode: 'list', role: 'farmer', pending: true },

  // DMRV — Agroforestry
  agroforestry_dashboard: {
    title: 'Agroforestry',
    mode: 'hub',
    role: 'farmer',
    hubChildren: ['agroforestry_baseline', 'plantation_list', 'plantation_registration', 'plantation_report', 'tree_monitoring_log', 'tree_inventory_report', 'survival_report', 'carbon_stock_estimate', 'carbon_stock_report', 'agroforestry_credit_calculator'],
  },
  agroforestry_baseline: { title: 'Agroforestry Baseline', mode: 'form', role: 'farmer', pending: true },
  plantation_registration: { title: 'Plantation Registration', mode: 'form', role: 'farmer', pending: true },
  plantation_list: { title: 'Plantations', mode: 'list', role: 'farmer', apiPath: '/farmer/agroforestry/plantations', listKeys: ['plantations'] },
  plantation_report: { title: 'Plantation Report', mode: 'info', role: 'farmer', pending: true },
  tree_monitoring_log: { title: 'Tree Monitoring Log', mode: 'list', role: 'farmer', apiPath: '/farmer/agroforestry/monitoring', listKeys: ['monitoring_records'] },
  tree_inventory_report: { title: 'Tree Inventory Report', mode: 'info', role: 'farmer', pending: true },
  survival_report: { title: 'Survival Report', mode: 'info', role: 'farmer', pending: true },
  carbon_stock_estimate: { title: 'Carbon Stock Estimate', mode: 'form', role: 'farmer', pending: true },
  carbon_stock_report: { title: 'Carbon Stock Report', mode: 'info', role: 'farmer', pending: true },
  agroforestry_credit_calculator: { title: 'Agroforestry Credit Calculator', mode: 'form', role: 'farmer', pending: true },

  // Satellite & Carbon registry
  satellite_dashboard: { title: 'Satellite Monitoring', mode: 'hub', role: 'shared', hubChildren: ['satellite_ndvi_detail', 'plot_satellite_detail'], pending: true },
  satellite_ndvi_detail: { title: 'NDVI Detail', mode: 'detail', role: 'shared', pending: true },
  plot_satellite_detail: { title: 'Plot Satellite Detail', mode: 'detail', role: 'shared', pending: true },
  carbon_accounting_dashboard: { title: 'Carbon Accounting', mode: 'hub', role: 'shared', hubChildren: ['carbon_calculation_status', 'company_carbon_calculations'] },
  company_carbon_calculations: { title: 'Company Carbon Calculations', mode: 'list', role: 'company', apiPath: '/company/carbon-calculations', listKeys: ['carbon_calculations'] },
  company_services_list: { title: 'Company Services', mode: 'list', role: 'company', apiPath: '/company/services', listKeys: ['services'] },
  company_evidence_list: { title: 'Company Evidence', mode: 'list', role: 'company', apiPath: '/company/evidence', listKeys: ['evidence', 'evidence_uploads'] },
  company_verification_status: { title: 'Verification Status', mode: 'info', role: 'company', apiPath: '/company/verification-status' },
  company_dashboard_info: { title: 'Dashboard Summary', mode: 'info', role: 'company', apiPath: '/company/dashboard' },
  registry_ready_dashboard: { title: 'Registry Ready', mode: 'hub', role: 'shared', hubChildren: ['registry_export_package', 'registry_package_checklist'], pending: true },
  registry_export_package: { title: 'Registry Export Package', mode: 'list', role: 'farmer', apiPath: '/farmer/registry-exports', listKeys: ['registry_exports'] },
  registry_package_checklist: { title: 'Package Checklist', mode: 'info', role: 'shared', pending: true },
  registry_evidence_review: { title: 'Registry Evidence Review', mode: 'info', role: 'shared', pending: true },
  export_format_selection: { title: 'Export Format', mode: 'form', role: 'shared', pending: true },
  export_success: { title: 'Export Success', mode: 'info', role: 'shared', pending: true },
  registry_submission_detail: { title: 'Registry Submission', mode: 'detail', role: 'shared', pending: true },
  credit_issuance_dashboard: { title: 'Credit Issuance', mode: 'hub', role: 'company', hubChildren: ['company_carbon_calculations'], pending: true },

  // Risk / Audit / QR / AI
  risk_assessment_dashboard: { title: 'Risk Assessment', mode: 'hub', role: 'shared', pending: true },
  risk_detail: { title: 'Risk Detail', mode: 'detail', role: 'shared', pending: true },
  risk_review_action: { title: 'Risk Review Action', mode: 'form', role: 'shared', pending: true },
  audit_trail: { title: 'Audit Trail', mode: 'list', role: 'shared', pending: true },
  audit_log_detail: { title: 'Audit Log Detail', mode: 'detail', role: 'shared', pending: true },
  qr_scanner: { title: 'QR Scanner', mode: 'form', role: 'shared', pending: true },
  qr_code_detail: { title: 'QR Code Detail', mode: 'detail', role: 'shared', pending: true },
  ai_photo_verification: { title: 'AI Photo Verification', mode: 'form', role: 'shared', pending: true },
  timestamp_verification: { title: 'Timestamp Verification', mode: 'info', role: 'shared', pending: true },

  // Offline / Sync
  offline_capture: { title: 'Offline Capture', mode: 'form', role: 'shared', pending: true },
  offline_evidence_capture: { title: 'Offline Evidence', mode: 'form', role: 'shared', pending: true },
  pending_sync_queue: { title: 'Pending Sync Queue', mode: 'list', role: 'shared', pending: true },
  sync_detail: { title: 'Sync Detail', mode: 'detail', role: 'shared', pending: true },
  sync_conflict: { title: 'Sync Conflict', mode: 'info', role: 'shared', pending: true },
  sync_success: { title: 'Sync Success', mode: 'info', role: 'shared', pending: true },
  network_error: { title: 'Network Error', mode: 'info', role: 'shared', pending: true },

  // Officer — verification stitch
  assigned_verification_list: { title: 'Assigned Verifications', mode: 'list', role: 'officer', apiPath: '/field-officer/assignments', listKeys: ['assignments'], detailApiPath: '/field-officer/assignments/{id}', detailScreenKey: 'verification_detail', detailRootKeys: ['assignment'] },
  verification_dashboard: { title: 'Verification Dashboard', mode: 'hub', role: 'officer', hubChildren: ['assigned_verification_list', 'gps_verification', 'photo_verification', 'evidence_review'] },
  verification_detail: { title: 'Verification Detail', mode: 'detail', role: 'officer', detailApiPath: '/field-officer/assignments/{id}', detailRootKeys: ['assignment'] },
  gps_verification: { title: 'GPS Verification', mode: 'form', role: 'officer', pending: true },
  photo_verification: { title: 'Photo Verification', mode: 'form', role: 'officer', pending: true },
  evidence_review: { title: 'Evidence Review', mode: 'list', role: 'officer', apiPath: '/field-officer/assignments', listKeys: ['assignments'], detailScreenKey: 'assignment_evidence_detail' },
  assignment_evidence_detail: { title: 'Assignment Evidence', mode: 'detail', role: 'officer', detailApiPath: '/field-officer/assignments/{id}/evidence', detailRootKeys: ['evidence'] },
  officer_farmers_list: { title: 'Onboarded Farmers', mode: 'list', role: 'officer', apiPath: '/field-officer/farmers', listKeys: ['farmers'], detailScreenKey: 'officer_farmer_detail', detailRootKeys: ['farmer'] },
  officer_farmer_detail: { title: 'Farmer Detail', mode: 'detail', role: 'officer', detailApiPath: '/field-officer/farmers/{id}', detailRootKeys: ['farmer'] },
  officer_activity_logs: { title: 'Activity Logs', mode: 'list', role: 'officer', apiPath: '/field-officer/activity-logs', listKeys: ['activity_logs'] },
  officer_baseline_assessments: { title: 'Baseline Assessments', mode: 'list', role: 'officer', apiPath: '/field-officer/baseline-assessments', listKeys: ['baseline_assessments'] },
  officer_soil_samples: { title: 'Soil Samples', mode: 'list', role: 'officer', apiPath: '/field-officer/soil-samples', listKeys: ['soil_samples'] },
  officer_monitoring_reports: { title: 'Monitoring Reports', mode: 'list', role: 'officer', apiPath: '/field-officer/monitoring-reports', listKeys: ['monitoring_reports'] },
  field_officer_review: { title: 'Officer Review', mode: 'info', role: 'officer', pending: true },
  verification_final_decision: { title: 'Final Decision', mode: 'form', role: 'officer', pending: true },

  // Officer — onboarding stitch aliases
  select_state: { title: 'Select State', mode: 'form', role: 'officer', pending: true },
  select_district: { title: 'Select District', mode: 'form', role: 'officer', pending: true },
  select_taluka: { title: 'Select Taluka', mode: 'form', role: 'officer', pending: true },
  select_village: { title: 'Select Village', mode: 'form', role: 'officer', pending: true },
  consent_legal: { title: 'Consent & Legal', mode: 'form', role: 'officer', pending: true },
  land_registration: { title: 'Land Registration', mode: 'form', role: 'officer', pending: true },
  gps_location_capture: { title: 'GPS Location Capture', mode: 'form', role: 'officer', pending: true },
  proof_of_land_ownership_upload: { title: 'Proof of Land Ownership', mode: 'form', role: 'officer', pending: true },
  document_uploads: { title: 'Document Uploads', mode: 'form', role: 'officer', pending: true },
  onboarding_review_stitch: { title: 'Onboarding Review', mode: 'info', role: 'officer', pending: true },
  onboarding_success_stitch: { title: 'Onboarding Success', mode: 'info', role: 'officer', pending: true },

  // Shared UI demos
  empty_state_demo: { title: 'Empty State', mode: 'info', role: 'shared', pending: true },
  loading_skeleton_demo: { title: 'Loading Skeleton', mode: 'info', role: 'shared', pending: true },
  search_results: { title: 'Search Results', mode: 'list', role: 'shared', pending: true },
  filter_bottom_sheet: { title: 'Filters', mode: 'info', role: 'shared', pending: true },
  file_preview_modal: { title: 'File Preview', mode: 'info', role: 'shared', pending: true },

  // Farmer module hub
  farmer_dmrv_hub: {
    title: 'DMRV Modules',
    mode: 'hub',
    role: 'farmer',
    hubChildren: [
      'regenerative_agriculture_dashboard',
      'biochar_dashboard',
      'agroforestry_dashboard',
      'plot_list',
      'farmer_farms_list',
      'farmer_evidence_list',
      'farmer_service_submissions_list',
      'farmer_dashboard_info',
      'satellite_dashboard',
      'carbon_accounting_dashboard',
      'registry_ready_dashboard',
      'risk_assessment_dashboard',
      'audit_trail',
      'offline_capture',
    ],
  },
  officer_dmrv_hub: {
    title: 'DMRV Modules',
    mode: 'hub',
    role: 'officer',
    hubChildren: ['verification_dashboard', 'officer_farmers_list', 'officer_activity_logs', 'officer_baseline_assessments', 'officer_soil_samples', 'officer_monitoring_reports', 'risk_assessment_dashboard', 'audit_trail', 'qr_scanner', 'ai_photo_verification'],
  },
  company_dmrv_hub: {
    title: 'DMRV Modules',
    mode: 'hub',
    role: 'company',
    hubChildren: [
      'company_dashboard_info',
      'carbon_accounting_dashboard',
      'registry_ready_dashboard',
      'company_registry_exports',
      'company_services_list',
      'company_evidence_list',
      'company_verification_status',
      'credit_issuance_dashboard',
      'audit_trail',
    ],
  },
  company_registry_exports: {
    title: 'Registry Exports',
    mode: 'list',
    role: 'company',
    apiPath: '/company/registry-exports',
    listKeys: ['registry_exports'],
  },
};

export function getScreensForRole(role: StitchRole): Array<{ key: string; config: StitchScreenConfig }> {
  return Object.entries(STITCH_REGISTRY)
    .filter(([, config]) => config.role === role || config.role === 'shared')
    .map(([key, config]) => ({ key, config }));
}
