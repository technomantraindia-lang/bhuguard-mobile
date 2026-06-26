import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import type {
  FieldOfficerDashboardViewModel,
  OfficerDashboardActivity,
  OfficerDashboardVisit,
} from '../../hooks/useFieldOfficerDashboardData';
import {
  OfficerPremiumQuickActionCard,
  OfficerQuickActionsSectionHeader,
} from './OfficerPremiumQuickActionCard';
import { BhuguardMaterialIcon } from '../shared/BhuguardMaterialIcon';
import { officerCardShadow, officerShadow, officerTheme } from '../../theme/officerDashboardTheme';
import type { BhuguardIconName } from '../shared/BhuguardMaterialIcon';

interface OfficerDashboardSectionsProps {
  dashboard: FieldOfficerDashboardViewModel;
  onVisitPress?: (visit: OfficerDashboardVisit) => void;
  onStartVerification?: () => void;
  onUploadEvidence?: () => void;
  onOnboardFarmer?: () => void;
  onFeedstockVerification?: () => void;
  onBiocharProduction?: () => void;
  onInventoryMovement?: () => void;
  onVerificationChecklist?: () => void;
  onSeeSchedule?: () => void;
  onViewFullMap?: () => void;
  onCallFarmer?: () => void;
  onNavigate?: () => void;
  onNextVisit?: () => void;
  onReportIssue?: () => void;
}

export function OfficerGreetingSection({ greeting, officerName }: { greeting: string; officerName: string }) {
  const firstName = officerName.split(' ')[0] ?? officerName;

  return (
    <View style={styles.greetingWrap}>
      <Text style={styles.greetingTitle}>
        {greeting}, {firstName}
      </Text>
      <Text style={styles.greetingSubtitle}>Field Verification Dashboard</Text>
    </View>
  );
}

export function OfficerSummaryCard({ dashboard }: { dashboard: FieldOfficerDashboardViewModel }) {
  return (
    <View style={[styles.card, officerCardShadow]}>
      <View style={styles.summaryRow}>
        <View style={styles.summaryLeft}>
          <Text style={styles.summaryName}>{dashboard.officerName}</Text>
          <Text style={styles.summaryCode}>ID: {dashboard.officerCode}</Text>
          <View style={styles.regionPill}>
            <BhuguardMaterialIcon name="location_on" size={14} color={officerTheme.onSecondaryFixedVariant} />
            <Text style={styles.regionText}>{dashboard.regionLabel}</Text>
          </View>
        </View>

        <View style={styles.summaryRight}>
          {dashboard.isActive ? (
            <View style={styles.activeBadge}>
              <Text style={styles.activeBadgeText}>Active</Text>
            </View>
          ) : null}
          <Text style={styles.visitsTodayValue}>{String(dashboard.visitsTodayCount).padStart(2, '0')}</Text>
          <Text style={styles.visitsTodayLabel}>Visits Today</Text>
        </View>
      </View>
    </View>
  );
}

export function OfficerStatsGrid({ dashboard }: { dashboard: FieldOfficerDashboardViewModel }) {
  const stats = [
    { label: 'Assigned', value: String(dashboard.assignedVisitsCount), unit: 'Visits', color: officerTheme.primary },
    { label: 'Pending', value: String(dashboard.pendingVisitsCount), unit: 'Visits', color: officerTheme.secondary },
    { label: 'Checked In', value: String(dashboard.checkedInVisitsCount), unit: 'Visits', color: officerTheme.tertiary },
    { label: 'Completed', value: String(dashboard.completedVisitsCount), unit: 'Visits', color: officerTheme.primary },
  ];

  return (
    <View style={styles.statsGrid}>
      {stats.map((stat) => (
        <View key={stat.label} style={[styles.statCard, officerCardShadow]}>
          <Text style={styles.statLabel}>{stat.label}</Text>
          <View style={styles.statValueRow}>
            <Text style={[styles.statValue, { color: stat.color }]}>{stat.value}</Text>
            <Text style={styles.statUnit}>{stat.unit}</Text>
          </View>
        </View>
      ))}
    </View>
  );
}

export function OfficerQuickActionCards({
  onStartVerification,
  onUploadEvidence,
  onOnboardFarmer,
  onFeedstockVerification,
  onBiocharProduction,
  onInventoryMovement,
  onVerificationChecklist,
}: Required<
  Pick<
    OfficerDashboardSectionsProps,
    | 'onStartVerification'
    | 'onUploadEvidence'
    | 'onOnboardFarmer'
    | 'onFeedstockVerification'
    | 'onBiocharProduction'
    | 'onInventoryMovement'
    | 'onVerificationChecklist'
  >
>) {
  const actions: Array<{
    icon: BhuguardIconName;
    title: string;
    description: string;
    ctaLabel: string;
    onPress: () => void;
  }> = [
    {
      icon: 'photo_camera',
      title: 'Upload Evidence',
      description: 'Capture Biochar visit photos and supporting evidence',
      ctaLabel: 'Upload Now',
      onPress: onUploadEvidence,
    },
    {
      icon: 'assignment',
      title: 'Start Verification',
      description: 'Begin Biochar field verification at farmer location',
      ctaLabel: 'Launch Verifier',
      onPress: onStartVerification,
    },
    {
      icon: 'person_add',
      title: 'Onboard New Farmer',
      description: 'Register farmer details, map land and upload documents',
      ctaLabel: 'Start Onboarding',
      onPress: onOnboardFarmer,
    },
    {
      icon: 'science',
      title: 'Feedstock Verify',
      description: 'Review farmer feedstock collection records',
      ctaLabel: 'Open Verification',
      onPress: onFeedstockVerification,
    },
    {
      icon: 'eco',
      title: 'Biochar Production',
      description: 'Record kiln batch, process data and evidence',
      ctaLabel: 'Open Production',
      onPress: onBiocharProduction,
    },
    {
      icon: 'sync',
      title: 'Inventory Movement',
      description: 'Move biochar stock between storage and farm',
      ctaLabel: 'Open Movement',
      onPress: onInventoryMovement,
    },
    {
      icon: 'photo_camera',
      title: 'Upload Evidence',
      description: 'Capture field photos and geo-tags',
      ctaLabel: 'Open Camera',
      onPress: onUploadEvidence,
    },
  ];

  return (
    <View style={styles.section}>
      <OfficerQuickActionsSectionHeader />
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.quickActionsRow}>
        {actions.map((action) => (
          <OfficerPremiumQuickActionCard
            key={action.title}
            icon={action.icon}
            title={action.title}
            description={action.description}
            ctaLabel={action.ctaLabel}
            onPress={action.onPress}
          />
        ))}
      </ScrollView>
    </View>
  );
}

export function OfficerTodaysVisits({
  visits = [],
  onVisitPress,
  onSeeSchedule,
  onNewFarmer,
}: {
  visits?: OfficerDashboardVisit[];
  onVisitPress?: (visit: OfficerDashboardVisit) => void;
  onSeeSchedule?: () => void;
  onNewFarmer?: () => void;
}) {
  const safeVisits = Array.isArray(visits) ? visits : [];

  return (
    <View style={styles.section}>
      <View style={styles.sectionHeaderRow}>
        <Text style={[styles.sectionTitle, styles.sectionTitleInline]}>Today&apos;s Visits</Text>
        <View style={styles.sectionHeaderActions}>
          <Pressable
            style={({ pressed }) => [styles.newFarmerButton, pressed && styles.newFarmerButtonPressed]}
            onPress={onNewFarmer}
            accessibilityRole="button"
            accessibilityLabel="Onboard new farmer"
          >
            <BhuguardMaterialIcon name="person_add" size={14} color={officerTheme.primary} filled />
            <Text style={styles.newFarmerButtonText}>New Farmer</Text>
          </Pressable>
          <Pressable onPress={onSeeSchedule} style={({ pressed }) => pressed && styles.linkPressed}>
            <Text style={styles.linkText}>See Schedule</Text>
          </Pressable>
        </View>
      </View>

      <View style={styles.visitList}>
        {safeVisits.length === 0 ? (
          <View style={[styles.visitCard, officerCardShadow]}>
            <Text style={styles.emptyVisitTitle}>No visits scheduled today</Text>
            <Text style={styles.emptyVisitText}>Assigned farmer visits will appear here.</Text>
          </View>
        ) : (
          safeVisits.slice(0, 4).map((visit, index) => (
            <Pressable
              key={visit.id}
              style={[styles.visitCard, officerCardShadow]}
              onPress={() => onVisitPress?.(visit)}
            >
              <View style={styles.visitIconWrap}>
                <BhuguardMaterialIcon
                  name={index % 2 === 0 ? 'agriculture' : 'potted_plant'}
                  size={24}
                  color={officerTheme.primary}
                />
              </View>
              <View style={styles.visitCopy}>
                <Text style={styles.visitName}>{visit.farmerName}</Text>
                <Text style={styles.visitLocation}>{visit.location}</Text>
                <View style={styles.visitMetaRow}>
                  <View style={styles.visitTimeRow}>
                    <BhuguardMaterialIcon name="schedule" size={12} color={officerTheme.onSurfaceVariant} />
                    <Text style={styles.visitTime}>{visit.timeLabel}</Text>
                  </View>
                  <View
                    style={[
                      styles.visitStatusPill,
                      visit.statusLabel === 'Pending' && styles.visitStatusPending,
                    ]}
                  >
                    <Text style={styles.visitStatusText}>{visit.statusLabel}</Text>
                  </View>
                </View>
              </View>
              <BhuguardMaterialIcon name="chevron_right" size={22} color={officerTheme.primary} />
            </Pressable>
          ))
        )}
      </View>
    </View>
  );
}

export function OfficerVerificationPipeline({ dashboard }: { dashboard: FieldOfficerDashboardViewModel }) {
  const { pipeline } = dashboard;
  const total = Math.max(pipeline.pending + pipeline.review + pipeline.correction + pipeline.approved, 1);

  return (
    <View style={[styles.pipelineCard, officerCardShadow]}>
      <View style={styles.pipelineTitleRow}>
        <BhuguardMaterialIcon name="analytics" size={20} color={officerTheme.primary} />
        <Text style={styles.pipelineTitle}>Verification Pipeline</Text>
      </View>

      <View style={styles.pipelineGrid}>
        <PipelineStat label="Pending" value={pipeline.pending} />
        <PipelineStat label="Review" value={pipeline.review} bordered />
        <PipelineStat label="Correct" value={pipeline.correction} bordered error />
        <PipelineStat label="Approved" value={pipeline.approved} bordered success />
      </View>

      <View style={styles.pipelineBar}>
        <View style={[styles.pipelineBarSegment, { flex: pipeline.approved }]} />
        <View style={[styles.pipelineBarSegment, { flex: pipeline.review, backgroundColor: officerTheme.tertiary }]} />
        <View style={[styles.pipelineBarSegment, { flex: pipeline.correction, backgroundColor: officerTheme.error }]} />
        <View style={[styles.pipelineBarSegment, { flex: Math.max(total - pipeline.approved - pipeline.review - pipeline.correction, 0), backgroundColor: 'transparent' }]} />
      </View>
    </View>
  );
}

function PipelineStat({
  label,
  value,
  bordered,
  error,
  success,
}: {
  label: string;
  value: number;
  bordered?: boolean;
  error?: boolean;
  success?: boolean;
}) {
  return (
    <View style={[styles.pipelineStat, bordered && styles.pipelineStatBorder]}>
      <Text style={[styles.pipelineValue, error && { color: officerTheme.error }, success && { color: officerTheme.secondary }]}>
        {String(value).padStart(2, '0')}
      </Text>
      <Text style={styles.pipelineLabel}>{label}</Text>
    </View>
  );
}

export function OfficerMapCoverage({
  dashboard,
  onViewFullMap,
  onVisitPress,
}: Pick<OfficerDashboardSectionsProps, 'onViewFullMap'> & {
  dashboard: FieldOfficerDashboardViewModel;
  onVisitPress?: (assignmentId: number) => void;
}) {
  const hasGpsVisits = dashboard.mapMarkers.length > 0;

  return (
    <View style={styles.section}>
      <View style={styles.sectionHeaderRow}>
        <Text style={styles.sectionTitle}>Visit GPS Coverage</Text>
        {hasGpsVisits ? (
          <Pressable style={styles.mapButton} onPress={onViewFullMap}>
            <Text style={styles.mapButtonText}>View All</Text>
          </Pressable>
        ) : null}
      </View>

      {hasGpsVisits ? (
        <View style={styles.gpsList}>
          {dashboard.mapMarkers.slice(0, 3).map((marker) => (
            <Pressable
              key={marker.id}
              style={({ pressed }) => [styles.gpsCard, officerCardShadow, pressed && styles.mapPressed]}
              onPress={() => {
                if (marker.assignmentId) {
                  onVisitPress?.(marker.assignmentId);
                }
              }}
            >
              <View style={styles.gpsCardTop}>
                <Text style={styles.gpsFarmName}>{marker.farmName}</Text>
                <Text style={styles.gpsStatus}>{marker.statusLabel}</Text>
              </View>
              <Text style={styles.gpsLocation}>{marker.location}</Text>
              <Text style={styles.gpsCoords}>
                {marker.latitude.toFixed(5)}, {marker.longitude.toFixed(5)}
              </Text>
            </Pressable>
          ))}
        </View>
      ) : (
        <View style={[styles.mapCard, officerCardShadow]}>
          <Text style={styles.emptyMapTitle}>No GPS-enabled visits available yet.</Text>
          <Text style={styles.emptyMapMessage}>
            Assigned visits with farm or site coordinates will appear here.
          </Text>
        </View>
      )}

      <View style={styles.mapStatsChip}>
        <Text style={styles.mapStatsLabel}>Coverage Stats</Text>
        <View style={styles.mapStatsRow}>
          <View style={styles.mapStatItem}>
            <View style={[styles.mapDot, { backgroundColor: officerTheme.primary }]} />
            <Text style={styles.mapStatText}>{dashboard.coverageTotal} Total</Text>
          </View>
          <View style={styles.mapStatItem}>
            <View style={[styles.mapDot, { backgroundColor: officerTheme.secondary }]} />
            <Text style={styles.mapStatText}>{dashboard.coverageMapped} Mapped</Text>
          </View>
        </View>
      </View>
    </View>
  );
}

export function OfficerPerformanceSection({ dashboard }: { dashboard: FieldOfficerDashboardViewModel }) {
  if (dashboard.monthlyRating <= 0 && dashboard.accuracyPercent <= 0) {
    return null;
  }

  return (
    <View style={styles.performanceWrap}>
      {dashboard.monthlyRating > 0 ? (
        <View style={[styles.ratingCard, officerShadow]}>
          <View style={styles.ratingCopy}>
            <Text style={styles.ratingTitle}>Monthly Rating</Text>
            <Text style={styles.ratingSubtitle}>Based on approved verification reports.</Text>
          </View>
          <View style={styles.ratingValueWrap}>
            <Text style={styles.ratingValue}>{dashboard.monthlyRating.toFixed(1)}</Text>
            <Text style={styles.ratingStars}>★★★★☆</Text>
          </View>
        </View>
      ) : null}

      <View style={styles.performanceGrid}>
        <View style={[styles.performanceStat, officerCardShadow]}>
          <Text style={styles.performanceLabel}>Accuracy</Text>
          <Text style={styles.performanceValue}>{dashboard.accuracyPercent}%</Text>
        </View>
        <View style={[styles.performanceStat, officerCardShadow]}>
          <Text style={styles.performanceLabel}>Report Rate</Text>
          <Text style={styles.performanceValue}>{dashboard.reportRateLabel}</Text>
        </View>
      </View>
    </View>
  );
}

export function OfficerRecentActivity({ activities = [] }: { activities?: OfficerDashboardActivity[] }) {
  const safeActivities = Array.isArray(activities) ? activities : [];

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Recent Activity</Text>
      <View style={styles.activityList}>
        {safeActivities.length === 0 ? (
          <Text style={styles.emptyActivity}>No recent verification activity yet.</Text>
        ) : null}
        {safeActivities.map((activity) => (
          <View key={activity.id} style={styles.activityRow}>
            <View
              style={[
                styles.activityIcon,
                activity.tone === 'success' && styles.activityIconSuccess,
                activity.tone === 'primary' && styles.activityIconPrimary,
              ]}
            >
              <BhuguardMaterialIcon
                name={activity.tone === 'primary' ? 'upload' : 'verified'}
                size={12}
                color={activity.tone === 'primary' ? officerTheme.onPrimary : officerTheme.primary}
                filled
              />
            </View>
            <View style={styles.activityCopy}>
              <Text style={styles.activityTitle}>{activity.title}</Text>
              <Text style={styles.activitySubtitle}>{activity.subtitle}</Text>
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}

export function OfficerEmergencyActions({
  onCallFarmer,
  onNavigate,
  onNextVisit,
  onReportIssue,
}: Pick<OfficerDashboardSectionsProps, 'onCallFarmer' | 'onNavigate' | 'onNextVisit' | 'onReportIssue'>) {
  const actions = [
    { key: 'call', label: 'Call Farmer', icon: 'support_agent' as const, onPress: onCallFarmer, danger: true },
    { key: 'nav', label: 'Navigate', icon: 'share_location' as const, onPress: onNavigate },
    { key: 'next', label: 'Next Visit', icon: 'location_on' as const, onPress: onNextVisit },
    { key: 'issue', label: 'Report Issue', icon: 'pending_actions' as const, onPress: onReportIssue },
  ];

  return (
    <View style={styles.emergencyGrid}>
      {actions.map((action) => (
        <Pressable
          key={action.key}
          style={[
            styles.emergencyButton,
            action.danger ? styles.emergencyDanger : styles.emergencyDefault,
            officerCardShadow,
          ]}
          onPress={action.onPress}
        >
          <BhuguardMaterialIcon
            name={action.icon}
            size={20}
            color={action.danger ? officerTheme.onErrorContainer : officerTheme.onSurface}
          />
          <Text style={[styles.emergencyLabel, action.danger && styles.emergencyDangerLabel]}>{action.label}</Text>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  greetingWrap: { marginBottom: 16 },
  greetingTitle: {
    fontSize: 24,
    lineHeight: 32,
    fontWeight: '600',
    color: officerTheme.primary,
  },
  greetingSubtitle: {
    fontSize: 14,
    lineHeight: 20,
    color: officerTheme.onSurfaceVariant,
    marginTop: 2,
  },
  card: {
    backgroundColor: officerTheme.surfaceLowest,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(191, 201, 190, 0.2)',
    marginBottom: 16,
  },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 12 },
  summaryLeft: { flex: 1, gap: 4 },
  summaryRight: { alignItems: 'flex-end' },
  summaryName: { fontSize: 20, lineHeight: 28, fontWeight: '600', color: officerTheme.onSurface },
  summaryCode: { fontSize: 12, fontWeight: '600', color: officerTheme.onSurfaceVariant },
  regionPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(176, 241, 198, 0.3)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    marginTop: 4,
  },
  regionText: { fontSize: 12, fontWeight: '600', color: officerTheme.onSecondaryFixedVariant },
  activeBadge: {
    backgroundColor: officerTheme.primaryContainer,
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginBottom: 8,
  },
  activeBadgeText: {
    color: officerTheme.onPrimary,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  visitsTodayValue: { fontSize: 28, lineHeight: 32, fontWeight: '700', color: officerTheme.primary },
  visitsTodayLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: officerTheme.onSurfaceVariant,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 16,
  },
  statCard: {
    width: '47%',
    backgroundColor: officerTheme.surfaceLowest,
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(191, 201, 190, 0.1)',
  },
  statLabel: { fontSize: 12, fontWeight: '600', color: officerTheme.onSurfaceVariant, marginBottom: 4 },
  statValueRow: { flexDirection: 'row', alignItems: 'baseline', gap: 4 },
  statValue: { fontSize: 20, lineHeight: 28, fontWeight: '600' },
  statUnit: { fontSize: 10, color: officerTheme.outline },
  section: { marginBottom: 16 },
  sectionHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  sectionTitleInline: { marginBottom: 0, flex: 1 },
  sectionHeaderActions: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: officerTheme.onSurface,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 12,
  },
  linkText: { fontSize: 12, fontWeight: '600', color: officerTheme.primary },
  linkPressed: { opacity: 0.7 },
  newFarmerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: officerTheme.surfaceLowest,
    borderWidth: 1,
    borderColor: 'rgba(11, 107, 58, 0.2)',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  newFarmerButtonPressed: { opacity: 0.75, backgroundColor: 'rgba(173, 238, 195, 0.35)' },
  newFarmerButtonText: { fontSize: 11, fontWeight: '700', color: officerTheme.primary },
  quickActionsRow: { gap: 14, paddingRight: 8, paddingBottom: 4 },
  visitList: { gap: 12 },
  visitCard: {
    backgroundColor: officerTheme.surfaceLowest,
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(191, 201, 190, 0.1)',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  visitIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: 'rgba(173, 238, 195, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  visitCopy: { flex: 1, gap: 2 },
  visitName: { fontSize: 14, fontWeight: '600', color: officerTheme.onSurface },
  visitLocation: { fontSize: 11, color: officerTheme.onSurfaceVariant },
  visitMetaRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 },
  visitTimeRow: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  visitTime: { fontSize: 10, color: officerTheme.onSurfaceVariant },
  visitStatusPill: {
    backgroundColor: 'rgba(191, 201, 190, 0.2)',
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  visitStatusPending: { backgroundColor: 'rgba(188, 173, 50, 0.2)' },
  visitStatusText: { fontSize: 10, fontWeight: '700', color: officerTheme.onTertiaryFixedVariant, textTransform: 'uppercase' },
  emptyVisitTitle: { fontSize: 14, fontWeight: '600', color: officerTheme.onSurface },
  emptyVisitText: { fontSize: 13, color: officerTheme.onSurfaceVariant, marginTop: 4 },
  pipelineCard: {
    backgroundColor: officerTheme.surfaceContainer,
    borderRadius: 18,
    padding: 16,
    marginBottom: 16,
  },
  pipelineTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16 },
  pipelineTitle: { fontSize: 14, fontWeight: '600', color: officerTheme.onSurface },
  pipelineGrid: { flexDirection: 'row', marginBottom: 16 },
  pipelineStat: { flex: 1, alignItems: 'center', gap: 2 },
  pipelineStatBorder: { borderLeftWidth: 1, borderLeftColor: 'rgba(191, 201, 190, 0.3)' },
  pipelineValue: { fontSize: 20, fontWeight: '700', color: officerTheme.onSurface },
  pipelineLabel: { fontSize: 9, fontWeight: '700', color: officerTheme.onSurfaceVariant, textTransform: 'uppercase', textAlign: 'center' },
  pipelineBar: {
    height: 6,
    borderRadius: 999,
    overflow: 'hidden',
    backgroundColor: 'rgba(191, 201, 190, 0.2)',
    flexDirection: 'row',
  },
  pipelineBarSegment: { height: '100%', backgroundColor: officerTheme.secondary, minWidth: 4 },
  mapCard: {
    minHeight: 120,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(191, 201, 190, 0.1)',
    marginBottom: 12,
    backgroundColor: officerTheme.surface,
    padding: 16,
    justifyContent: 'center',
    gap: 6,
  },
  emptyMapTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: officerTheme.onSurface,
    textAlign: 'center',
  },
  emptyMapMessage: {
    fontSize: 13,
    lineHeight: 18,
    color: officerTheme.onSurfaceVariant,
    textAlign: 'center',
  },
  gpsList: { gap: 10, marginBottom: 12 },
  gpsCard: {
    backgroundColor: officerTheme.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: officerTheme.outlineVariant,
    padding: 12,
    gap: 4,
  },
  gpsCardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 },
  gpsFarmName: { flex: 1, fontSize: 14, fontWeight: '700', color: officerTheme.onSurface },
  gpsStatus: { fontSize: 11, fontWeight: '700', color: officerTheme.primary },
  gpsLocation: { fontSize: 12, color: officerTheme.onSurfaceVariant },
  gpsCoords: { fontSize: 12, color: officerTheme.onSurface, fontVariant: ['tabular-nums'] },
  mapPressed: { opacity: 0.92 },
  mapStatsChip: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.92)',
    borderRadius: 10,
    padding: 8,
    ...officerCardShadow,
  },
  mapStatsLabel: { fontSize: 10, color: officerTheme.onSurfaceVariant, textTransform: 'uppercase', fontWeight: '600' },
  mapStatsRow: { flexDirection: 'row', gap: 12, marginTop: 4 },
  mapStatItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  mapDot: { width: 8, height: 8, borderRadius: 4 },
  mapStatText: { fontSize: 12, fontWeight: '700', color: officerTheme.onSurface },
  mapButton: {
    backgroundColor: officerTheme.surfaceContainer,
    borderWidth: 1,
    borderColor: 'rgba(11, 107, 58, 0.2)',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  mapButtonText: { fontSize: 14, fontWeight: '500', color: officerTheme.primary },
  performanceWrap: { gap: 12, marginBottom: 16 },
  ratingCard: {
    backgroundColor: officerTheme.primaryContainer,
    borderRadius: 18,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  ratingCopy: { flex: 1, paddingRight: 12 },
  ratingTitle: { fontSize: 20, fontWeight: '600', color: officerTheme.onPrimary },
  ratingSubtitle: { fontSize: 12, color: 'rgba(255,255,255,0.8)', marginTop: 4 },
  ratingValueWrap: { alignItems: 'center' },
  ratingValue: { fontSize: 32, fontWeight: '700', color: officerTheme.onPrimary },
  ratingStars: { fontSize: 14, color: '#D8C84B', marginTop: 2 },
  performanceGrid: { flexDirection: 'row', gap: 12 },
  performanceStat: {
    flex: 1,
    backgroundColor: officerTheme.surfaceLowest,
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(191, 201, 190, 0.1)',
  },
  performanceLabel: { fontSize: 11, color: officerTheme.onSurfaceVariant },
  performanceValue: { fontSize: 20, fontWeight: '600', color: officerTheme.primary, marginTop: 4 },
  activityList: { gap: 16, paddingLeft: 4 },
  emptyActivity: {
    fontSize: 13,
    color: officerTheme.onSurfaceVariant,
    paddingVertical: 8,
  },
  activityRow: { flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
  activityIcon: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: officerTheme.surfaceVariant,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activityIconSuccess: { backgroundColor: officerTheme.secondaryContainer },
  activityIconPrimary: { backgroundColor: officerTheme.primaryContainer },
  activityCopy: { flex: 1, gap: 2 },
  activityTitle: { fontSize: 14, fontWeight: '500', color: officerTheme.onSurface },
  activitySubtitle: { fontSize: 11, color: officerTheme.onSurfaceVariant },
  emergencyGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 8 },
  emergencyButton: {
    width: '48%',
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    flexDirection: 'row',
  },
  emergencyDefault: { backgroundColor: officerTheme.surfaceContainerHigh },
  emergencyDanger: { backgroundColor: officerTheme.errorContainer },
  emergencyLabel: { fontSize: 14, fontWeight: '500', color: officerTheme.onSurface },
  emergencyDangerLabel: { color: officerTheme.onErrorContainer },
});
