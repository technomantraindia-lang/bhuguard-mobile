import { StyleSheet, Text, View } from 'react-native';



import { BhuguardMaterialIcon, type BhuguardIconName } from '../shared/BhuguardMaterialIcon';

import { DashboardPressable } from '../shared/DashboardPressable';

import { dashboardShadow, dashboardTheme } from '../../theme/bhuguardDashboardTheme';



interface FarmerQuickAccessSectionProps {

  onViewFarms: () => void;

  onSubmitActivity: () => void;
  onBaselineAssessment: () => void;
  onVerificationStatus: () => void;

  onCarbonProgress: () => void;

  onReports: () => void;

  onBenefits: () => void;

  onSupport: () => void;

}



interface QuickAccessRowProps {

  icon: BhuguardIconName;

  label: string;

  buttonLabel: string;

  onPress: () => void;

}



function QuickAccessRow({ icon, label, buttonLabel, onPress }: QuickAccessRowProps) {

  return (

    <DashboardPressable onPress={onPress} style={[styles.rowCard, dashboardShadow]}>

      <View style={styles.rowLeft}>

        <View style={styles.iconCircle}>

          <BhuguardMaterialIcon name={icon} size={20} color={dashboardTheme.primaryContainer} />

        </View>

        <Text style={styles.rowLabel}>{label}</Text>

      </View>

      <DashboardPressable variant="button" onPress={onPress} style={styles.outlineButton}>

        <Text style={styles.outlineButtonText}>{buttonLabel}</Text>

      </DashboardPressable>

    </DashboardPressable>

  );

}



export function FarmerQuickAccessSection({

  onViewFarms,

  onSubmitActivity,

  onBaselineAssessment,

  onVerificationStatus,

  onCarbonProgress,

  onReports,

  onBenefits,

  onSupport,

}: FarmerQuickAccessSectionProps) {

  return (

    <View style={styles.wrap}>

      <Text style={styles.sectionTitle}>Quick Access</Text>



      <QuickAccessRow icon="map" label="My Farms" buttonLabel="View Farms" onPress={onViewFarms} />



      <DashboardPressable onPress={onSubmitActivity} style={[styles.highlightCard, dashboardShadow]}>

        <View style={styles.rowLeft}>

          <View style={styles.highlightIconCircle}>

            <BhuguardMaterialIcon name="upload" size={20} color={dashboardTheme.onPrimary} />

          </View>

          <View>

            <Text style={styles.highlightTitle}>Submit Activity</Text>

            <Text style={styles.highlightSubtitle}>Log your recent work</Text>

          </View>

        </View>

        <DashboardPressable variant="button" onPress={onSubmitActivity} style={styles.submitButton}>

          <Text style={styles.submitButtonText}>Submit</Text>

        </DashboardPressable>

      </DashboardPressable>



      <QuickAccessRow
        icon="science"
        label="Baseline Assessment"
        buttonLabel="Add Baseline"
        onPress={onBaselineAssessment}
      />



      <QuickAccessRow

        icon="fact_check"

        label="Verification Status"

        buttonLabel="View Status"

        onPress={onVerificationStatus}

      />

      <QuickAccessRow icon="co2" label="Carbon Progress" buttonLabel="View Progress" onPress={onCarbonProgress} />

      <QuickAccessRow icon="analytics" label="Reports & Downloads" buttonLabel="Open Reports" onPress={onReports} />

      <QuickAccessRow icon="payments" label="My Benefits" buttonLabel="View Benefits" onPress={onBenefits} />

      <QuickAccessRow icon="support_agent" label="Help & Support" buttonLabel="Get Help" onPress={onSupport} />

    </View>

  );

}



const styles = StyleSheet.create({

  wrap: {

    gap: 12,

  },

  sectionTitle: {

    fontSize: 20,

    lineHeight: 28,

    fontWeight: '600',

    color: dashboardTheme.onSurface,

    paddingHorizontal: 4,

  },

  rowCard: {

    flexDirection: 'row',

    alignItems: 'center',

    justifyContent: 'space-between',

    backgroundColor: dashboardTheme.surfaceLowest,

    borderRadius: 20,

    borderWidth: 1,

    borderColor: dashboardTheme.outlineVariant,

    padding: 12,

  },

  rowLeft: {

    flexDirection: 'row',

    alignItems: 'center',

    gap: 12,

    flex: 1,

  },

  iconCircle: {

    width: 40,

    height: 40,

    borderRadius: 20,

    backgroundColor: dashboardTheme.surfaceLow,

    alignItems: 'center',

    justifyContent: 'center',

  },

  rowLabel: {

    fontSize: 14,

    lineHeight: 20,

    fontWeight: '500',

    color: dashboardTheme.onSurface,

  },

  outlineButton: {

    backgroundColor: dashboardTheme.surfaceLow,

    paddingHorizontal: 16,

    paddingVertical: 8,

    borderRadius: 8,

  },

  outlineButtonText: {

    fontSize: 12,

    lineHeight: 16,

    fontWeight: '600',

    color: dashboardTheme.primaryContainer,

  },

  highlightCard: {

    flexDirection: 'row',

    alignItems: 'center',

    justifyContent: 'space-between',

    backgroundColor: dashboardTheme.primaryContainer,

    borderRadius: 20,

    padding: 12,

    gap: 8,

  },

  highlightIconCircle: {

    width: 40,

    height: 40,

    borderRadius: 20,

    backgroundColor: 'rgba(255,255,255,0.2)',

    alignItems: 'center',

    justifyContent: 'center',

  },

  highlightTitle: {

    fontSize: 14,

    lineHeight: 20,

    fontWeight: '500',

    color: dashboardTheme.onPrimary,

  },

  highlightSubtitle: {

    fontSize: 12,

    lineHeight: 16,

    color: 'rgba(255,255,255,0.8)',

  },

  submitButton: {

    backgroundColor: dashboardTheme.surfaceLowest,

    paddingHorizontal: 16,

    paddingVertical: 8,

    borderRadius: 8,

  },

  submitButtonText: {

    fontSize: 12,

    lineHeight: 16,

    fontWeight: '600',

    color: dashboardTheme.primaryContainer,

  },

});


