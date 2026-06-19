import type { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { DashboardPressable } from '../../../shared/DashboardPressable';
import { BhuguardMaterialIcon } from '../../../shared/BhuguardMaterialIcon';
import { dashboardShadow, dashboardTheme } from '../../../../theme/bhuguardDashboardTheme';
import type { FarmerActivitiesSummary, FarmerActivityViewModel } from '../../../../utils/farmerActivityHelpers';
import type { FarmCarbonProgress, FarmVerificationStep } from '../../../../utils/farmDetailModel';

function SectionCard({ title, children }: { title: string; children: ReactNode }) {
  return (
    <View style={[styles.card, dashboardShadow]}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>{value}</Text>
    </View>
  );
}

function SummaryStat({ label, value }: { label: string; value: number }) {
  return (
    <View style={styles.summaryStat}>
      <Text style={styles.summaryValue}>{value}</Text>
      <Text style={styles.summaryLabel}>{label}</Text>
    </View>
  );
}

interface FarmSummaryCardProps {
  locationLabel: string;
  surveyNumber: string;
  areaLabel: string;
  cropLabel: string;
  soilLabel: string;
  irrigationLabel: string;
  statusLabel: string;
  mappedLabel: string;
  coordinatesLabel: string;
}

export function FarmSummaryCard(props: FarmSummaryCardProps) {
  return (
    <SectionCard title="Farm Summary">
      <DetailRow label="Location" value={props.locationLabel} />
      <DetailRow label="Survey Number" value={props.surveyNumber} />
      <DetailRow label="Land Area" value={props.areaLabel} />
      <DetailRow label="Crop" value={props.cropLabel} />
      <DetailRow label="Soil Type" value={props.soilLabel} />
      <DetailRow label="Irrigation" value={props.irrigationLabel} />
      <DetailRow label="Status" value={props.statusLabel} />
      <DetailRow label="Mapped" value={props.mappedLabel} />
      <DetailRow label="Coordinates" value={props.coordinatesLabel} />
    </SectionCard>
  );
}

interface FarmProjectInfoSectionProps {
  projectName: string;
  enrollmentDate: string;
  verificationLabel: string;
  carbonProgramLabel: string;
  fieldOfficerName: string;
}

export function FarmProjectInfoSection({
  projectName,
  enrollmentDate,
  verificationLabel,
  carbonProgramLabel,
  fieldOfficerName,
}: FarmProjectInfoSectionProps) {
  return (
    <SectionCard title="Project Information">
      <DetailRow label="Project" value={projectName} />
      <DetailRow label="Enrollment Date" value={enrollmentDate} />
      <DetailRow label="Verification Status" value={verificationLabel} />
      <DetailRow label="Carbon Program" value={carbonProgramLabel} />
      <DetailRow label="Field Officer" value={fieldOfficerName} />
    </SectionCard>
  );
}

interface FarmActivitySummaryCardProps {
  summary: FarmerActivitiesSummary;
  onViewActivities: () => void;
}

export function FarmActivitySummaryCard({ summary, onViewActivities }: FarmActivitySummaryCardProps) {
  return (
    <SectionCard title="Farm Activity Summary">
      <View style={styles.summaryGrid}>
        <SummaryStat label="Submitted" value={summary.submitted} />
        <SummaryStat label="Approved" value={summary.approved} />
        <SummaryStat label="Under Review" value={summary.underReview} />
        <SummaryStat label="Correction" value={summary.correctionRequired} />
      </View>

      <DashboardPressable variant="button" onPress={onViewActivities} style={styles.primaryButton}>
        <Text style={styles.primaryButtonText}>View Activities</Text>
      </DashboardPressable>
    </SectionCard>
  );
}

interface FarmCarbonProgressCardProps {
  carbonProgress: FarmCarbonProgress;
  onViewCarbonProgress: () => void;
}

export function FarmCarbonProgressCard({ carbonProgress, onViewCarbonProgress }: FarmCarbonProgressCardProps) {
  return (
    <SectionCard title="Carbon Progress">
      <View style={styles.carbonRow}>
        <View style={styles.carbonStat}>
          <Text style={styles.carbonLabel}>Estimated Carbon</Text>
          <Text style={styles.carbonValue}>{carbonProgress.estimatedLabel}</Text>
        </View>
        <View style={styles.carbonStat}>
          <Text style={styles.carbonLabel}>Target</Text>
          <Text style={styles.carbonValue}>{carbonProgress.targetLabel}</Text>
        </View>
      </View>

      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: `${carbonProgress.progressPercent}%` }]} />
      </View>
      <Text style={styles.progressCaption}>{carbonProgress.progressPercent}% of annual target</Text>

      <DashboardPressable variant="button" onPress={onViewCarbonProgress} style={styles.secondaryButton}>
        <BhuguardMaterialIcon name="co2" size={18} color={dashboardTheme.primaryContainer} />
        <Text style={styles.secondaryButtonText}>View Carbon Progress</Text>
      </DashboardPressable>
    </SectionCard>
  );
}

interface FarmVerificationTimelineProps {
  steps: FarmVerificationStep[];
}

export function FarmVerificationTimeline({ steps }: FarmVerificationTimelineProps) {
  return (
    <SectionCard title="Verification Timeline">
      <View style={styles.timeline}>
        {steps.map((step, index) => (
          <View key={step.id} style={styles.timelineItem}>
            <View style={styles.timelineRail}>
              <View style={[styles.timelineDot, step.completed && styles.timelineDotDone]} />
              {index < steps.length - 1 ? (
                <View style={[styles.timelineLine, step.completed && styles.timelineLineDone]} />
              ) : null}
            </View>
            <Text style={[styles.timelineLabel, step.completed && styles.timelineLabelDone]}>{step.label}</Text>
          </View>
        ))}
      </View>
    </SectionCard>
  );
}

interface FarmRecentActivitiesSectionProps {
  activities: FarmerActivityViewModel[];
  onActivityPress: (activityId: number) => void;
}

export function FarmRecentActivitiesSection({ activities, onActivityPress }: FarmRecentActivitiesSectionProps) {
  return (
    <SectionCard title="Recent Activities">
      <View style={styles.activityList}>
        {activities.map((activity) => (
          <DashboardPressable
            key={activity.id}
            onPress={() => onActivityPress(activity.id)}
            style={styles.activityCard}
          >
            <Text style={styles.activityEmoji}>{activity.emoji}</Text>
            <View style={styles.activityCopy}>
              <Text style={styles.activityTitle}>{activity.title}</Text>
              <Text style={styles.activityMeta}>
                {activity.dateLabel} · {activity.statusLabel}
              </Text>
            </View>
            <BhuguardMaterialIcon name="chevron_right" size={20} color={dashboardTheme.textMuted} />
          </DashboardPressable>
        ))}
      </View>
    </SectionCard>
  );
}

interface FarmDetailActionButtonsProps {
  onOpenGoogleMaps: () => void;
  onEditFarm: () => void;
  onAddActivity: () => void;
  onAddBaseline: () => void;
  onViewReports: () => void;
}

export function FarmDetailActionButtons({
  onOpenGoogleMaps,
  onEditFarm,
  onAddActivity,
  onAddBaseline,
  onViewReports,
}: FarmDetailActionButtonsProps) {
  return (
    <View style={styles.actionGrid}>
      <ActionButton label="Open in Google Maps" icon="map" onPress={onOpenGoogleMaps} variant="outline" />
      <ActionButton label="Edit Farm" icon="assignment" onPress={onEditFarm} variant="outline" />
      <ActionButton label="Add Activity" icon="add_circle" onPress={onAddActivity} variant="solid" />
      <ActionButton label="Baseline" icon="science" onPress={onAddBaseline} variant="outline" />
      <ActionButton label="View Reports" icon="analytics" onPress={onViewReports} variant="outline" />
    </View>
  );
}

function ActionButton({
  label,
  icon,
  onPress,
  variant,
}: {
  label: string;
  icon: 'map' | 'assignment' | 'add_circle' | 'analytics' | 'science';
  onPress: () => void;
  variant: 'solid' | 'outline';
}) {
  const solid = variant === 'solid';

  return (
    <DashboardPressable
      onPress={onPress}
      style={[styles.actionButton, solid ? styles.actionButtonSolid : styles.actionButtonOutline]}
    >
      <BhuguardMaterialIcon
        name={icon}
        size={18}
        color={solid ? dashboardTheme.onPrimary : dashboardTheme.primaryContainer}
      />
      <Text style={[styles.actionButtonText, solid && styles.actionButtonTextSolid]}>{label}</Text>
    </DashboardPressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: dashboardTheme.surfaceLowest,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: dashboardTheme.outlineVariant,
    padding: 16,
    gap: 12,
  },
  sectionTitle: {
    fontSize: 18,
    lineHeight: 24,
    fontWeight: '700',
    color: dashboardTheme.onSurface,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    paddingVertical: 4,
    borderBottomWidth: 1,
    borderBottomColor: dashboardTheme.outlineVariant,
  },
  rowLabel: {
    flex: 1,
    fontSize: 13,
    color: dashboardTheme.textMuted,
    fontWeight: '600',
  },
  rowValue: {
    flex: 1.1,
    fontSize: 13,
    fontWeight: '700',
    color: dashboardTheme.onSurface,
    textAlign: 'right',
  },
  summaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  summaryStat: {
    width: '48%',
    backgroundColor: dashboardTheme.surfaceLow,
    borderRadius: 12,
    padding: 12,
    gap: 2,
  },
  summaryValue: {
    fontSize: 22,
    fontWeight: '800',
    color: dashboardTheme.primaryContainer,
  },
  summaryLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: dashboardTheme.textMuted,
  },
  primaryButton: {
    backgroundColor: dashboardTheme.primaryContainer,
    borderRadius: 12,
    paddingVertical: 13,
    alignItems: 'center',
  },
  primaryButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: dashboardTheme.onPrimary,
  },
  carbonRow: {
    flexDirection: 'row',
    gap: 10,
  },
  carbonStat: {
    flex: 1,
    backgroundColor: dashboardTheme.creditsSurface,
    borderRadius: 12,
    padding: 12,
    gap: 4,
  },
  carbonLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: dashboardTheme.creditsAccent,
    textTransform: 'uppercase',
  },
  carbonValue: {
    fontSize: 16,
    fontWeight: '800',
    color: dashboardTheme.onSurface,
  },
  progressTrack: {
    height: 10,
    borderRadius: 999,
    backgroundColor: dashboardTheme.surfaceLow,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 999,
    backgroundColor: dashboardTheme.primaryContainer,
  },
  progressCaption: {
    fontSize: 12,
    fontWeight: '600',
    color: dashboardTheme.textMuted,
  },
  secondaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: dashboardTheme.outlineVariant,
    paddingVertical: 12,
    backgroundColor: dashboardTheme.surfaceLow,
  },
  secondaryButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: dashboardTheme.primaryContainer,
  },
  timeline: {
    gap: 0,
  },
  timelineItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    minHeight: 42,
  },
  timelineRail: {
    width: 18,
    alignItems: 'center',
  },
  timelineDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: dashboardTheme.outlineVariant,
    borderWidth: 2,
    borderColor: dashboardTheme.surfaceLowest,
  },
  timelineDotDone: {
    backgroundColor: dashboardTheme.primaryContainer,
  },
  timelineLine: {
    width: 2,
    flex: 1,
    minHeight: 24,
    backgroundColor: dashboardTheme.outlineVariant,
    marginTop: 2,
  },
  timelineLineDone: {
    backgroundColor: '#84D99C',
  },
  timelineLabel: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
    color: dashboardTheme.textMuted,
    fontWeight: '600',
    paddingBottom: 12,
  },
  timelineLabelDone: {
    color: dashboardTheme.onSurface,
  },
  activityList: {
    gap: 8,
  },
  activityCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: dashboardTheme.surfaceLow,
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: dashboardTheme.outlineVariant,
  },
  activityEmoji: {
    fontSize: 22,
  },
  activityCopy: {
    flex: 1,
    gap: 2,
  },
  activityTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: dashboardTheme.onSurface,
  },
  activityMeta: {
    fontSize: 12,
    color: dashboardTheme.textMuted,
    fontWeight: '600',
  },
  actionGrid: {
    gap: 10,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  actionButtonSolid: {
    backgroundColor: dashboardTheme.primaryContainer,
  },
  actionButtonOutline: {
    backgroundColor: dashboardTheme.surfaceLowest,
    borderWidth: 1,
    borderColor: dashboardTheme.outlineVariant,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: dashboardTheme.primaryContainer,
  },
  actionButtonTextSolid: {
    color: dashboardTheme.onPrimary,
  },
});
