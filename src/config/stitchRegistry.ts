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
  add_farmer_evidence: { title: 'Capture Evidence', mode: 'form', role: 'farmer', pending: false },
  farmer_evidence_upload: { title: 'Capture Evidence', mode: 'form', role: 'farmer', pending: false },
  farmer_service_submissions_list: { title: 'Service Submissions', mode: 'list', role: 'farmer', apiPath: '/farmer/service-submissions', listKeys: ['submissions'] },
  farmer_dashboard_info: { title: 'Dashboard Summary', mode: 'info', role: 'farmer', apiPath: '/farmer/dashboard' },
  add_new_plot: { title: 'Add New Farm', mode: 'form', role: 'farmer' },
  gps_polygon_capture: { title: 'GPS Polygon Capture', mode: 'form', role: 'farmer', pending: true },
  boundary_evidence: { title: 'Boundary Evidence', mode: 'form', role: 'farmer', pending: false },

  // Farmer — activity
  farmer_activity_log_list: { title: 'Activity Logs', mode: 'list', role: 'farmer', apiPath: '/farmer/activity-logs', listKeys: ['activity_logs'], detailApiPath: '/farmer/activity-logs/{id}', detailScreenKey: 'activity_detail', detailRootKeys: ['activity_log'] },
  add_activity_log: { title: 'Add Activity Log', mode: 'form', role: 'farmer', pending: false },
  activity_detail: { title: 'Activity Detail', mode: 'detail', role: 'farmer', detailApiPath: '/farmer/activity-logs/{id}', detailRootKeys: ['activity_log'] },

  // Farmer — baseline & soil
  baseline_assessment_list: { title: 'Baseline Assessments', mode: 'list', role: 'farmer', apiPath: '/farmer/baseline-assessments', listKeys: ['baseline_assessments', 'assessments'], detailScreenKey: 'baseline_detail' },
  add_baseline_assessment: { title: 'Add Baseline Assessment', mode: 'form', role: 'farmer', pending: false },
  baseline_detail: {
    title: 'Baseline Detail',
    mode: 'detail',
    role: 'farmer',
    listFallback: { apiPath: '/farmer/baseline-assessments', listKeys: ['baseline_assessments', 'assessments'], wrapperKey: 'baseline_assessment' },
    detailRootKeys: ['baseline_assessment'],
  },
  soil_sample_list: { title: 'Soil Samples', mode: 'list', role: 'farmer', apiPath: '/farmer/soil-samples', listKeys: ['soil_samples', 'samples'], detailScreenKey: 'soil_sample_detail' },
  add_soil_sample: { title: 'Add Soil Sample', mode: 'form', role: 'farmer', pending: false },
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
  add_practice_record: { title: 'Add Practice Record', mode: 'form', role: 'farmer', pending: false },
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
  soil_carbon_credit_calculator: { title: 'Soil Carbon Credit Calculator', mode: 'form', role: 'farmer', pending: false },
  carbon_credit_estimator: { title: 'Carbon Credit Estimator', mode: 'form', role: 'farmer', pending: false },
  carbon_estimate_success: { title: 'Estimate Submitted', mode: 'info', role: 'farmer', pending: false, apiPath: '/farmer/carbon-calculations' },
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
  add_production_batch: { title: 'Add Production Batch', mode: 'form', role: 'farmer', pending: false },
  biochar_batch_detail: {
    title: 'Batch Detail',
    mode: 'detail',
    role: 'farmer',
    listFallback: { apiPath: '/farmer/biochar/batches', listKeys: ['batches'], wrapperKey: 'batch' },
    detailRootKeys: ['batch'],
  },
  feedstock_collection_list: { title: 'Feedstock Collections', mode: 'list', role: 'farmer', apiPath: '/farmer/feedstock-collections', listKeys: ['feedstock_collections'] },
  biochar_feedstock_list: { title: 'Biochar Feedstock', mode: 'list', role: 'farmer', apiPath: '/farmer/biochar/feedstock', listKeys: ['feedstock', 'feedstock_collections'] },
  add_feedstock_collection: { title: 'Feedstock Collection', mode: 'form', role: 'farmer' },
  feedstock_verification: { title: 'Feedstock Verification', mode: 'form', role: 'officer' },
  officer_biochar_production: { title: 'Biochar Production', mode: 'form', role: 'officer' },
  biochar_quality_test: { title: 'Biochar Quality Test', mode: 'form', role: 'farmer', pending: true },
  biochar_inventory: { title: 'Biochar Inventory', mode: 'list', role: 'farmer', pending: true },
  biochar_application_screen: { title: 'Biochar Application', mode: 'list', role: 'farmer', apiPath: '/farmer/biochar/applications', listKeys: ['applications'] },
  biochar_credit_calculator: { title: 'Biochar Credit Calculator', mode: 'form', role: 'farmer', pending: true },
  biochar_carbon_removal_estimate: { title: 'Carbon Removal Estimate', mode: 'info', role: 'farmer', pending: true },
  artisan_registration: { title: 'Artisan Registration', mode: 'form', role: 'officer', pending: false },
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
  plantation_registration: { title: 'Plantation Registration', mode: 'form', role: 'farmer', pending: false },
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
  registry_ready_dashboard: { title: 'Registry Ready', mode: 'hub', role: 'shared', hubChildren: ['registry_export_package', 'export_format_selection'], pending: false },
  registry_export_package: { title: 'Registry Export Package', mode: 'list', role: 'farmer', apiPath: '/farmer/registry-exports', listKeys: ['registry_exports'] },
  registry_package_checklist: { title: 'Package Checklist', mode: 'info', role: 'shared', pending: true },
  registry_evidence_review: { title: 'Registry Evidence Review', mode: 'info', role: 'shared', pending: true },
  export_format_selection: { title: 'Export Format', mode: 'form', role: 'shared', pending: false },
  export_success: { title: 'Export Success', mode: 'info', role: 'shared', pending: false, apiPath: '/farmer/registry-exports' },
  registry_submission_detail: { title: 'Registry Submission', mode: 'detail', role: 'shared', pending: true },
  credit_issuance_dashboard: { title: 'Credit Issuance', mode: 'hub', role: 'company', hubChildren: ['company_carbon_calculations', 'company_final_reports_list'], pending: false },

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
  offline_evidence_capture: { title: 'Offline Evidence', mode: 'form', role: 'shared', pending: false },
  pending_sync_queue: { title: 'Pending Sync Queue', mode: 'list', role: 'shared', pending: true },
  sync_detail: { title: 'Sync Detail', mode: 'detail', role: 'shared', pending: true },
  sync_conflict: { title: 'Sync Conflict', mode: 'info', role: 'shared', pending: true },
  sync_success: { title: 'Sync Success', mode: 'info', role: 'shared', pending: true },
  network_error: { title: 'Network Error', mode: 'info', role: 'shared', pending: true },

  // Officer — verification stitch
  assigned_verification_list: { title: 'Assigned Verifications', mode: 'list', role: 'officer', apiPath: '/field-officer/assignments', listKeys: ['assignments'], detailApiPath: '/field-officer/assignments/{id}', detailScreenKey: 'verification_detail', detailRootKeys: ['assignment'] },
  verification_dashboard: { title: 'Verification Dashboard', mode: 'hub', role: 'officer', hubChildren: ['assigned_verification_list', 'gps_verification', 'photo_verification', 'evidence_review'] },
  verification_detail: { title: 'Verification Detail', mode: 'detail', role: 'officer', detailApiPath: '/field-officer/assignments/{id}', detailRootKeys: ['assignment'] },
  gps_verification: { title: 'GPS Verification', mode: 'form', role: 'officer', pending: false },
  photo_verification: { title: 'Photo Verification', mode: 'form', role: 'officer', pending: false },
  monitoring_evidence_upload: { title: 'Monitoring Evidence', mode: 'form', role: 'officer', pending: false },
  audit_evidence_upload: { title: 'Audit Evidence', mode: 'form', role: 'officer', pending: false },
  evidence_review: { title: 'Evidence Review', mode: 'list', role: 'officer', apiPath: '/field-officer/assignments', listKeys: ['assignments'], detailScreenKey: 'assignment_evidence_detail' },
  assignment_evidence_detail: { title: 'Assignment Evidence', mode: 'detail', role: 'officer', detailApiPath: '/field-officer/assignments/{id}/evidence', detailRootKeys: ['evidence'] },
  officer_farmers_list: { title: 'Onboarded Farmers', mode: 'list', role: 'officer', apiPath: '/field-officer/farmers', listKeys: ['farmers'], detailScreenKey: 'officer_farmer_detail', detailRootKeys: ['farmer'] },
  officer_farmer_detail: { title: 'Farmer Detail', mode: 'detail', role: 'officer', detailApiPath: '/field-officer/farmers/{id}', detailRootKeys: ['farmer'] },
  officer_activity_logs: { title: 'Activity Logs', mode: 'list', role: 'officer', apiPath: '/field-officer/activity-logs', listKeys: ['activity_logs'] },
  officer_baseline_assessments: { title: 'Baseline Assessments', mode: 'list', role: 'officer', apiPath: '/field-officer/baseline-assessments', listKeys: ['baseline_assessments'] },
  officer_soil_samples: { title: 'Soil Samples', mode: 'list', role: 'officer', apiPath: '/field-officer/soil-samples', listKeys: ['soil_samples'] },
  officer_monitoring_reports: { title: 'Monitoring Reports', mode: 'list', role: 'officer', apiPath: '/field-officer/monitoring-reports', listKeys: ['monitoring_reports'] },
  officer_inventory_tasks: { title: 'Inventory Tasks', mode: 'list', role: 'officer', apiPath: '/field-officer/inventory-tasks', listKeys: ['inventory_tasks', 'tasks'], detailScreenKey: 'officer_inventory_task_detail' },
  officer_inventory_task_detail: { title: 'Inventory Task', mode: 'detail', role: 'officer', detailApiPath: '/field-officer/inventory-tasks/{id}', detailRootKeys: ['inventory_task'] },
  officer_feedstock_verifications: { title: 'Feedstock Verifications', mode: 'list', role: 'officer', apiPath: '/field-officer/feedstock-verifications', listKeys: ['feedstock_verifications', 'verifications'], detailScreenKey: 'feedstock_verification_detail' },
  feedstock_verification_detail: { title: 'Feedstock Verification', mode: 'detail', role: 'officer', detailApiPath: '/field-officer/feedstock-verifications/{id}', detailRootKeys: ['feedstock_verification'] },
  officer_biochar_applications: { title: 'Biochar Applications', mode: 'list', role: 'officer', apiPath: '/field-officer/biochar/applications', listKeys: ['applications'], detailScreenKey: 'biochar_application_detail' },
  biochar_application_detail: { title: 'Biochar Application', mode: 'detail', role: 'officer', detailApiPath: '/field-officer/biochar/applications/{id}', detailRootKeys: ['biochar_application'] },
  officer_create_activity_log: { title: 'Log Activity', mode: 'form', role: 'officer', pending: false },
  officer_create_baseline: { title: 'Baseline Assessment', mode: 'form', role: 'officer', pending: false },
  officer_create_soil_sample: { title: 'Soil Sample', mode: 'form', role: 'officer', pending: false },
  officer_create_monitoring_report: { title: 'Monitoring Report', mode: 'form', role: 'officer', pending: false },
  officer_create_regenerative_practice: { title: 'Regenerative Practice', mode: 'form', role: 'officer', pending: false },
  officer_create_feedstock: { title: 'Feedstock Collection', mode: 'form', role: 'officer', pending: false },
  officer_create_plantation: { title: 'Plantation', mode: 'form', role: 'officer', pending: false },
  company_sites_list: { title: 'Company Sites', mode: 'list', role: 'company', apiPath: '/company/sites', listKeys: ['sites'], detailScreenKey: 'company_site_detail' },
  company_site_detail: { title: 'Site Detail', mode: 'detail', role: 'company', detailApiPath: '/company/sites/{id}', detailRootKeys: ['site'] },
  company_service_submissions_list: { title: 'Service Submissions', mode: 'list', role: 'company', apiPath: '/company/service-submissions', listKeys: ['submissions'], detailScreenKey: 'company_submission_detail' },
  company_submission_detail: { title: 'Submission Detail', mode: 'detail', role: 'company', detailApiPath: '/company/service-submissions/{id}', detailRootKeys: ['submission'] },
  company_waste_records_list: { title: 'Waste Records', mode: 'list', role: 'company', apiPath: '/company/waste-records', listKeys: ['waste_records'], detailScreenKey: 'company_waste_detail' },
  company_waste_detail: { title: 'Waste Record', mode: 'detail', role: 'company', detailApiPath: '/company/waste-records/{id}', detailRootKeys: ['waste_record'] },
  company_industrial_carbon_list: { title: 'Industrial Carbon', mode: 'list', role: 'company', apiPath: '/company/industrial-carbon-records', listKeys: ['industrial_carbon_records'], detailScreenKey: 'company_industrial_detail' },
  company_industrial_detail: { title: 'Industrial Carbon Record', mode: 'detail', role: 'company', detailApiPath: '/company/industrial-carbon-records/{id}', detailRootKeys: ['industrial_carbon_record'] },
  company_biochar_records_list: { title: 'Biochar Records', mode: 'list', role: 'company', apiPath: '/company/biochar-records', listKeys: ['biochar_records'], detailScreenKey: 'company_biochar_detail' },
  company_biochar_detail: { title: 'Biochar Record', mode: 'detail', role: 'company', detailApiPath: '/company/biochar-records/{id}', detailRootKeys: ['biochar_record'] },
  company_final_reports_list: { title: 'Final Reports', mode: 'list', role: 'company', apiPath: '/company/final-reports', listKeys: ['final_reports'], detailScreenKey: 'company_final_report_detail' },
  company_final_report_detail: { title: 'Final Report', mode: 'detail', role: 'company', detailApiPath: '/company/final-reports/{id}', detailRootKeys: ['final_report'] },
  company_create_site: { title: 'Add Site', mode: 'form', role: 'company', pending: false },
  company_create_submission: { title: 'Service Submission', mode: 'form', role: 'company', pending: false },
  company_create_waste: { title: 'Waste Record', mode: 'form', role: 'company', pending: false },
  company_create_industrial: { title: 'Industrial Carbon', mode: 'form', role: 'company', pending: false },
  company_create_biochar: { title: 'Biochar Record', mode: 'form', role: 'company', pending: false },
  company_create_registry: { title: 'Registry Export', mode: 'form', role: 'company', pending: false },
  company_registry_export: { title: 'Registry Export', mode: 'form', role: 'company', pending: false },
  field_officer_review: { title: 'Officer Review', mode: 'info', role: 'officer', pending: true },
  verification_final_decision: { title: 'Final Decision', mode: 'form', role: 'officer', pending: true },

  // Officer — onboarding stitch aliases
  select_state: { title: 'Select State', mode: 'form', role: 'officer', pending: true },
  select_district: { title: 'Select District', mode: 'form', role: 'officer', pending: true },
  select_taluka: { title: 'Select Taluka', mode: 'form', role: 'officer', pending: true },
  select_village: { title: 'Select Village', mode: 'form', role: 'officer', pending: true },
  consent_legal: { title: 'Consent & Legal', mode: 'form', role: 'officer', pending: false },
  land_registration: { title: 'Land Registration', mode: 'form', role: 'officer', pending: false },
  gps_location_capture: { title: 'GPS Location Capture', mode: 'form', role: 'officer', pending: false },
  proof_of_land_ownership_upload: { title: 'Proof of Land Ownership', mode: 'form', role: 'officer', pending: false },
  document_uploads: { title: 'Document Uploads', mode: 'form', role: 'officer', pending: false },
  onboarding_review_stitch: { title: 'Onboarding Review', mode: 'info', role: 'officer', pending: false },
  onboarding_success_stitch: { title: 'Onboarding Success', mode: 'info', role: 'officer', pending: false },

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
      'add_farmer_evidence',
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
    hubChildren: ['verification_dashboard', 'officer_farmers_list', 'officer_activity_logs', 'officer_baseline_assessments', 'officer_soil_samples', 'officer_monitoring_reports', 'officer_inventory_tasks', 'officer_feedstock_verifications', 'officer_biochar_applications', 'officer_create_activity_log', 'officer_create_baseline', 'officer_create_soil_sample', 'officer_create_monitoring_report', 'photo_verification', 'gps_verification'],
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
      'company_sites_list',
      'company_service_submissions_list',
      'company_waste_records_list',
      'company_industrial_carbon_list',
      'company_biochar_records_list',
      'company_create_site',
      'company_create_submission',
      'company_create_waste',
      'company_create_industrial',
      'company_create_biochar',
      'company_create_registry',
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
