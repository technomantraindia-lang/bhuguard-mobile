import type { ApiRecord } from '../utils/apiHelpers';

export type ApiFormFieldType = 'text' | 'number' | 'multiline' | 'date';

export interface ApiFormField {
  name: string;
  label: string;
  type?: ApiFormFieldType;
  required?: boolean;
  placeholder?: string;
  keyboardType?: 'default' | 'numeric' | 'email-address' | 'phone-pad';
}

export interface ApiFormConfig {
  title: string;
  subtitle?: string;
  fields: ApiFormField[];
  submitLabel?: string;
  submit: (values: ApiRecord) => Promise<unknown>;
}

function textField(
  name: string,
  label: string,
  options: Partial<ApiFormField> = {},
): ApiFormField {
  return { name, label, type: 'text', ...options };
}

function numberField(
  name: string,
  label: string,
  options: Partial<ApiFormField> = {},
): ApiFormField {
  return { name, label, type: 'number', keyboardType: 'numeric', ...options };
}

function notesField(): ApiFormField {
  return { name: 'notes', label: 'Notes', type: 'multiline' };
}

function farmerIdField(): ApiFormField {
  return numberField('farmer_id', 'Farmer ID', { required: true });
}

function farmIdField(): ApiFormField {
  return numberField('farm_id', 'Farm ID');
}

function plotIdField(): ApiFormField {
  return numberField('plot_id', 'Plot ID');
}

export const STITCH_FORM_CONFIGS: Record<string, ApiFormConfig> = {
  add_production_batch: {
    title: 'Add Production Batch',
    subtitle: 'POST /farmer/biochar/batches',
    fields: [
      farmIdField(),
      textField('feedstock_type', 'Feedstock type', { required: true }),
      numberField('input_quantity', 'Input quantity', { required: true }),
      textField('input_unit', 'Input unit', { required: true }),
      numberField('output_quantity', 'Output quantity'),
      textField('output_unit', 'Output unit'),
      textField('production_date', 'Production date (YYYY-MM-DD)'),
      notesField(),
    ],
    submit: (values) => import('../api/farmerApi').then((m) => m.createFarmerBiocharBatch(values)),
  },
  plantation_registration: {
    title: 'Plantation Registration',
    subtitle: 'POST /farmer/agroforestry/plantations',
    fields: [
      farmIdField(),
      plotIdField(),
      textField('species', 'Species', { required: true }),
      numberField('tree_count', 'Tree count', { required: true }),
      textField('plantation_date', 'Plantation date (YYYY-MM-DD)'),
      numberField('area_covered', 'Area covered'),
      textField('area_unit', 'Area unit'),
      notesField(),
    ],
    submit: (values) =>
      import('../api/farmerApi').then((m) => m.createFarmerAgroforestryPlantation(values)),
  },
  add_practice_record: {
    title: 'Add Practice Record',
    subtitle: 'POST /farmer/regenerative-practices',
    fields: [
      farmIdField(),
      plotIdField(),
      textField('practice_type', 'Practice type', { required: true }),
      textField('activity_date', 'Activity date (YYYY-MM-DD)', { required: true }),
      textField('crop_name', 'Crop name'),
      numberField('area_covered', 'Area covered'),
      textField('area_unit', 'Area unit'),
      notesField(),
    ],
    submit: (values) =>
      import('../api/farmerApi').then((m) => m.createFarmerRegenerativePractice(values)),
  },
  carbon_credit_estimator: {
    title: 'Carbon Credit Estimator',
    subtitle: 'POST /farmer/carbon-estimates',
    fields: [
      textField('calculation_category', 'Category', { required: true }),
      farmIdField(),
      numberField('estimated_co2e', 'Estimated CO2e (t)'),
      numberField('estimated_carbon_credits', 'Estimated credits'),
      notesField(),
    ],
    submit: (values) => import('../api/farmerApi').then((m) => m.createFarmerCarbonEstimate(values)),
  },
  soil_carbon_credit_calculator: {
    title: 'Soil Carbon Calculator',
    subtitle: 'POST /farmer/carbon-estimates',
    fields: [
      textField('calculation_category', 'Category', {
        required: true,
        placeholder: 'soil_carbon',
      }),
      farmIdField(),
      numberField('baseline_soc', 'Baseline SOC'),
      numberField('monitoring_soc', 'Monitoring SOC'),
      numberField('soc_increase', 'SOC increase'),
      numberField('estimated_co2e', 'Estimated CO2e (t)'),
      numberField('estimated_carbon_credits', 'Estimated credits'),
    ],
    submit: (values) =>
      import('../api/farmerApi').then((m) =>
        m.createFarmerCarbonEstimate({
          calculation_category: values.calculation_category ?? 'soil_carbon',
          ...values,
        }),
      ),
  },
  biochar_application_screen: {
    title: 'Biochar Application',
    subtitle: 'POST /farmer/biochar/applications',
    fields: [
      farmIdField(),
      plotIdField(),
      numberField('application_quantity', 'Application quantity', { required: true }),
      textField('application_unit', 'Application unit', { required: true }),
      textField('application_date', 'Application date (YYYY-MM-DD)'),
      notesField(),
    ],
    submit: (values) =>
      import('../api/farmerApi').then((m) => m.createFarmerBiocharApplication(values)),
  },
  export_format_selection: {
    title: 'Registry Export',
    subtitle: 'POST /farmer/registry-exports',
    fields: [
      textField('export_format', 'Export format', { required: true, placeholder: 'verra' }),
      textField('registry_standard', 'Registry standard'),
      notesField(),
    ],
    submit: (values) =>
      import('../api/farmerApi').then((m) => m.createFarmerRegistryExport(values)),
  },
  company_registry_export: {
    title: 'Registry Export',
    subtitle: 'POST /company/registry-exports',
    fields: [
      textField('export_format', 'Export format', { required: true, placeholder: 'verra' }),
      textField('registry_standard', 'Registry standard'),
      notesField(),
    ],
    submit: (values) =>
      import('../api/companyApi').then((m) => m.createCompanyRegistryExport(values)),
  },
  tree_monitoring_log: {
    title: 'Tree Monitoring',
    subtitle: 'POST /farmer/agroforestry/monitoring',
    fields: [
      numberField('plantation_id', 'Plantation ID', { required: true }),
      textField('monitoring_date', 'Monitoring date (YYYY-MM-DD)', { required: true }),
      numberField('trees_alive', 'Trees alive'),
      numberField('trees_dead', 'Trees dead'),
      numberField('average_height_cm', 'Average height (cm)'),
      notesField(),
    ],
    submit: (values) =>
      import('../api/farmerApi').then((m) => m.createFarmerAgroforestryMonitoring(values)),
  },
  add_baseline_assessment: {
    title: 'Baseline Assessment',
    subtitle: 'POST /farmer/baseline-assessments',
    fields: [
      farmIdField(),
      textField('assessment_date', 'Assessment date (YYYY-MM-DD)', { required: true }),
      textField('crop_type', 'Crop type'),
      numberField('baseline_yield', 'Baseline yield'),
      textField('yield_unit', 'Yield unit'),
      notesField(),
    ],
    submit: (values) =>
      import('../api/farmerApi').then((m) => m.createFarmerBaselineAssessment(values)),
  },
  add_soil_sample: {
    title: 'Soil Sample',
    subtitle: 'Farmer soil samples are recorded by field officers',
    fields: [notesField()],
    submit: async () => {
      throw new Error('Soil samples are collected by your field officer.');
    },
  },
  officer_create_activity_log: {
    title: 'Log Farmer Activity',
    subtitle: 'POST /field-officer/farmer-activity-logs',
    fields: [
      farmerIdField(),
      farmIdField(),
      textField('activity_type', 'Activity type', { required: true }),
      textField('activity_date', 'Activity date (YYYY-MM-DD)', { required: true }),
      textField('description', 'Description', { type: 'multiline' }),
      notesField(),
    ],
    submit: (values) =>
      import('../api/fieldOfficerApi').then((m) => m.createOfficerActivityLog(values)),
  },
  officer_create_baseline: {
    title: 'Baseline Assessment',
    subtitle: 'POST /field-officer/baseline-assessments',
    fields: [
      farmerIdField(),
      farmIdField(),
      textField('assessment_date', 'Assessment date (YYYY-MM-DD)', { required: true }),
      textField('crop_type', 'Crop type'),
      notesField(),
    ],
    submit: (values) =>
      import('../api/fieldOfficerApi').then((m) => m.createOfficerBaselineAssessment(values)),
  },
  officer_create_soil_sample: {
    title: 'Soil Sample',
    subtitle: 'POST /field-officer/soil-samples',
    fields: [
      farmerIdField(),
      farmIdField(),
      textField('sample_date', 'Sample date (YYYY-MM-DD)', { required: true }),
      textField('sample_depth', 'Sample depth'),
      textField('lab_name', 'Lab name'),
      notesField(),
    ],
    submit: (values) =>
      import('../api/fieldOfficerApi').then((m) => m.createOfficerSoilSample(values)),
  },
  officer_create_monitoring_report: {
    title: 'Monitoring Report',
    subtitle: 'POST /field-officer/monitoring-reports',
    fields: [
      farmerIdField(),
      textField('report_date', 'Report date (YYYY-MM-DD)', { required: true }),
      textField('report_type', 'Report type', { required: true }),
      textField('summary', 'Summary', { type: 'multiline', required: true }),
      notesField(),
    ],
    submit: (values) =>
      import('../api/fieldOfficerApi').then((m) => m.createOfficerMonitoringReport(values)),
  },
  officer_create_regenerative_practice: {
    title: 'Regenerative Practice',
    subtitle: 'POST /field-officer/regenerative-practices',
    fields: [
      farmerIdField(),
      farmIdField(),
      textField('practice_type', 'Practice type', { required: true }),
      textField('activity_date', 'Activity date (YYYY-MM-DD)', { required: true }),
      notesField(),
    ],
    submit: (values) =>
      import('../api/fieldOfficerApi').then((m) => m.createOfficerRegenerativePractice(values)),
  },
  officer_create_feedstock: {
    title: 'Feedstock Collection',
    subtitle: 'POST /field-officer/feedstock-collections',
    fields: [
      farmerIdField(),
      farmIdField(),
      textField('feedstock_type', 'Feedstock type', { required: true }),
      numberField('quantity', 'Quantity', { required: true }),
      textField('quantity_unit', 'Unit', { required: true }),
      notesField(),
    ],
    submit: (values) =>
      import('../api/fieldOfficerApi').then((m) => m.createOfficerFeedstockCollection(values)),
  },
  officer_create_plantation: {
    title: 'Plantation',
    subtitle: 'POST /field-officer/agroforestry/plantations',
    fields: [
      farmerIdField(),
      farmIdField(),
      textField('species', 'Species', { required: true }),
      numberField('tree_count', 'Tree count', { required: true }),
      notesField(),
    ],
    submit: (values) =>
      import('../api/fieldOfficerApi').then((m) => m.createOfficerAgroforestryPlantation(values)),
  },
  artisan_registration: {
    title: 'Artisan Registration',
    subtitle: 'POST /field-officer/artisans',
    fields: [
      textField('name', 'Artisan name', { required: true }),
      textField('mobile', 'Mobile', { keyboardType: 'phone-pad' }),
      textField('village', 'Village'),
      textField('district', 'District'),
      notesField(),
    ],
    submit: (values) => import('../api/fieldOfficerApi').then((m) => m.createOfficerArtisan(values)),
  },
};

export const COMPANY_FORM_CONFIGS: Record<string, ApiFormConfig> = {
  company_create_site: {
    title: 'Add Site',
    subtitle: 'POST /company/sites',
    fields: [
      textField('site_name', 'Site name', { required: true }),
      textField('contact_person', 'Contact person'),
      textField('mobile', 'Mobile', { keyboardType: 'phone-pad' }),
      textField('email', 'Email', { keyboardType: 'email-address' }),
      textField('address', 'Address', { type: 'multiline' }),
      textField('city', 'City'),
      textField('district', 'District'),
      textField('state', 'State'),
      textField('pincode', 'Pincode'),
      numberField('latitude', 'Latitude'),
      numberField('longitude', 'Longitude'),
      notesField(),
    ],
    submit: (values) => import('../api/companyApi').then((m) => m.createCompanySite(values)),
  },
  company_create_submission: {
    title: 'Service Submission',
    subtitle: 'POST /company/service-submissions',
    fields: [
      numberField('company_site_id', 'Site ID (own site)', { required: true }),
      numberField('service_id', 'Service ID (Waste/Biochar/Industrial)', { required: true }),
      notesField(),
    ],
    submit: (values) =>
      import('../api/companyApi').then((m) => m.createCompanyServiceSubmission(values)),
  },
  company_create_waste: {
    title: 'Waste Record',
    subtitle: 'POST /company/waste-records',
    fields: [
      numberField('service_submission_id', 'Service submission ID', { required: true }),
      textField('waste_type', 'Waste type'),
      numberField('quantity', 'Quantity', { required: true }),
      textField('unit', 'Unit'),
      textField('processing_method', 'Processing method'),
      textField('record_date', 'Record date (YYYY-MM-DD)'),
      numberField('diverted_quantity', 'Diverted quantity'),
      notesField(),
    ],
    submit: (values) => import('../api/companyApi').then((m) => m.createCompanyWasteRecord(values)),
  },
  company_create_industrial: {
    title: 'Industrial Carbon Record',
    subtitle: 'POST /company/industrial-carbon-records',
    fields: [
      numberField('service_submission_id', 'Service submission ID', { required: true }),
      textField('emission_source', 'Fuel / energy type'),
      numberField('emission_amount', 'Consumption value', { required: true }),
      textField('unit', 'Unit'),
      textField('record_date', 'Record date (YYYY-MM-DD)'),
      numberField('reduction_amount', 'Reduction amount'),
      notesField(),
    ],
    submit: (values) =>
      import('../api/companyApi').then((m) => m.createCompanyIndustrialCarbonRecord(values)),
  },
  company_create_biochar: {
    title: 'Biochar Record',
    subtitle: 'POST /company/biochar-records',
    fields: [
      numberField('service_submission_id', 'Service submission ID', { required: true }),
      textField('feedstock', 'Feedstock type', { required: true }),
      textField('batch_number', 'Batch number'),
      textField('production_date', 'Production date (YYYY-MM-DD)'),
      numberField('production_quantity', 'Biochar quantity', { required: true }),
      textField('production_unit', 'Unit'),
      textField('application_location', 'Production location'),
      notesField(),
    ],
    submit: (values) =>
      import('../api/companyApi').then((m) => m.createCompanyBiocharRecord(values)),
  },
  company_create_registry: {
    title: 'Registry Export',
    subtitle: 'POST /company/registry-exports',
    fields: [
      textField('export_format', 'Export format', { required: true }),
      textField('registry_standard', 'Registry standard'),
      notesField(),
    ],
    submit: (values) =>
      import('../api/companyApi').then((m) => m.createCompanyRegistryExport(values)),
  },
};

export function getFormConfigForScreenKey(screenKey: string): ApiFormConfig | null {
  return STITCH_FORM_CONFIGS[screenKey] ?? COMPANY_FORM_CONFIGS[screenKey] ?? null;
}
