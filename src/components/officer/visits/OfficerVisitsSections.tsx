import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import type { OfficerDashboardActivity } from '../../../hooks/useFieldOfficerDashboardData';
import type {
  OfficerAssignedVisit,
  OfficerVisitsSummary,
  VisitFilterKey,
} from '../../../hooks/useFieldOfficerVisitsData';
import { officerCardShadow, officerShadow, officerTheme } from '../../../theme/officerDashboardTheme';
import {
  OfficerCompactQuickActionCard,
  OfficerQuickActionsSectionHeader,
} from '../OfficerPremiumQuickActionCard';
import { BhuguardMaterialIcon } from '../../shared/BhuguardMaterialIcon';
import type { BhuguardIconName } from '../../shared/BhuguardMaterialIcon';

export const VISIT_FILTER_OPTIONS: Array<{ key: VisitFilterKey; label: string }> = [
  { key: 'all', label: 'All' },
  { key: 'today', label: 'Today' },
  { key: 'pending', label: 'Pending' },
  { key: 'completed', label: 'Completed' },
  { key: 'high_priority', label: 'High Priority' },
  { key: 'rescheduled', label: 'Rescheduled' },
];

interface OfficerVisitsSubtitleProps {
  subtitle: string;
}

export function OfficerVisitsSubtitle({ subtitle }: OfficerVisitsSubtitleProps) {
  return <Text style={styles.subtitle}>{subtitle}</Text>;
}

export function OfficerVisitsSummaryCards({
  summary,
  onFilterPress,
}: {
  summary: OfficerVisitsSummary;
  onFilterPress?: (filter: VisitFilterKey) => void;
}) {
  const cards: Array<{ label: string; value: number; color: string; filter: VisitFilterKey }> = [
    { label: 'Assigned Today', value: summary.assignedToday, color: officerTheme.primary, filter: 'today' },
    { label: 'Pending Verification', value: summary.pendingVerification, color: officerTheme.tertiary, filter: 'pending' },
    { label: 'Completed', value: summary.completed, color: officerTheme.secondary, filter: 'completed' },
    { label: 'High Priority', value: summary.highPriority, color: officerTheme.error, filter: 'high_priority' },
  ];

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.summaryRow}>
      {cards.map((card) => (
        <Pressable
          key={card.label}
          style={[styles.summaryCard, officerCardShadow]}
          onPress={() => onFilterPress?.(card.filter)}
        >
          <Text style={styles.summaryLabel}>{card.label}</Text>
          <Text style={[styles.summaryValue, { color: card.color }]}>{card.value}</Text>
        </Pressable>
      ))}
    </ScrollView>
  );
}

interface OfficerVisitsSearchFilterProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  filter: VisitFilterKey;
  onFilterChange: (key: VisitFilterKey) => void;
}

export function OfficerVisitsSearchFilter({
  searchQuery,
  onSearchChange,
  filter,
  onFilterChange,
}: OfficerVisitsSearchFilterProps) {
  return (
    <View style={styles.searchFilterWrap}>
      <View style={styles.searchBar}>
        <BhuguardMaterialIcon name="search" size={18} color={officerTheme.onSurfaceVariant} />
        <TextInput
          style={styles.searchInput}
          value={searchQuery}
          onChangeText={onSearchChange}
          placeholder="Search farmer, farm, village..."
          placeholderTextColor={officerTheme.outline}
          autoCapitalize="none"
          autoCorrect={false}
        />
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
        {VISIT_FILTER_OPTIONS.map((option) => {
          const active = option.key === filter;

          return (
            <Pressable
              key={option.key}
              style={[styles.chip, active && styles.chipActive]}
              onPress={() => onFilterChange(option.key)}
            >
              <Text style={[styles.chipText, active && styles.chipTextActive]}>{option.label}</Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

function VisitStatusBadge({ visit }: { visit: OfficerAssignedVisit }) {
  const isHigh = visit.isHighPriority && visit.priority === 'high';
  const isPending = visit.statusLabel === 'Pending' || visit.isPending;
  const isScheduled = visit.statusLabel === 'Scheduled' || visit.isScheduled;
  const isCompleted = visit.statusLabel === 'Completed' || visit.isCompleted;

  return (
    <View
      style={[
        styles.statusBadge,
        isHigh && styles.statusHigh,
        isPending && !isHigh && styles.statusPending,
        isScheduled && styles.statusScheduled,
        isCompleted && styles.statusCompleted,
      ]}
    >
      <Text style={styles.statusBadgeText}>
        {isHigh ? 'High Priority' : visit.statusLabel}
      </Text>
    </View>
  );
}

interface OfficerVisitCardsProps {
  visits: OfficerAssignedVisit[];
  onOpenVisit: (visit: OfficerAssignedVisit) => void;
  onNavigate: (visit: OfficerAssignedVisit) => void;
}

export function OfficerVisitCards({ visits = [], onOpenVisit, onNavigate }: OfficerVisitCardsProps) {
  const safeVisits = Array.isArray(visits) ? visits : [];

  if (safeVisits.length === 0) {
    return (
      <View style={[styles.emptyCard, officerCardShadow]}>
        <Text style={styles.emptyTitle}>No visits match your filters</Text>
        <Text style={styles.emptyText}>Try another filter or search term.</Text>
      </View>
    );
  }

  return (
    <View style={styles.visitList}>
      {safeVisits.map((visit) => (
        <View key={visit.id} style={[styles.visitCard, officerCardShadow]}>
          <View style={styles.visitCardTop}>
            <View style={styles.visitIconWrap}>
              <BhuguardMaterialIcon
                name={visit.type === 'company' ? 'co2' : 'agriculture'}
                size={22}
                color={officerTheme.primary}
              />
            </View>
            <View style={styles.visitHeaderCopy}>
              {visit.priority === 'high' ? (
                <View style={styles.priorityRow}>
                  <BhuguardMaterialIcon name="hourglass_empty" size={12} color={officerTheme.error} />
                  <Text style={styles.priorityText}>High Priority</Text>
                </View>
              ) : null}

              {visit.type === 'farmer' ? (
                <>
                  <Text style={styles.visitPrimaryLabel}>Farmer: {visit.farmerName}</Text>
                  <Text style={styles.visitSecondaryLabel}>Farm: {visit.farmName}</Text>
                  {visit.farmCode ? (
                    <Text style={styles.visitMeta}>Farm ID: {visit.farmCode}</Text>
                  ) : null}
                </>
              ) : (
                <>
                  <Text style={styles.visitPrimaryLabel}>Company: {visit.companyName}</Text>
                  <Text style={styles.visitSecondaryLabel}>Site: {visit.siteName}</Text>
                </>
              )}

              <Text style={styles.visitMeta}>Project: {visit.project}</Text>
            </View>
            <VisitStatusBadge visit={visit} />
          </View>

          <View style={styles.visitDetailsGrid}>
            <DetailRow icon="location_on" label="Location" value={visit.location} />
            <DetailRow icon="schedule" label="Visit Date" value={visit.visitDateLabel} />
            <DetailRow icon="event_note" label="Visit Time" value={visit.visitTimeLabel} />
            {visit.distanceKm != null ? (
              <DetailRow icon="share_location" label="Distance" value={`${visit.distanceKm} km`} />
            ) : null}
            <DetailRow icon="fact_check" label="Verification Status" value={visit.statusLabel} />
          </View>

          <View style={styles.visitActions}>
            <Pressable style={styles.primaryButton} onPress={() => onOpenVisit(visit)}>
              <BhuguardMaterialIcon name="assignment" size={16} color={officerTheme.onPrimary} filled />
              <Text style={styles.primaryButtonText}>Open Visit</Text>
            </Pressable>
            <Pressable style={styles.secondaryButton} onPress={() => onNavigate(visit)}>
              <BhuguardMaterialIcon name="share_location" size={16} color={officerTheme.primary} />
              <Text style={styles.secondaryButtonText}>Navigate</Text>
            </Pressable>
          </View>
        </View>
      ))}
    </View>
  );
}

function DetailRow({
  icon,
  label,
  value,
}: {
  icon: 'location_on' | 'schedule' | 'event_note' | 'share_location' | 'fact_check';
  label: string;
  value: string;
}) {
  return (
    <View style={styles.detailRow}>
      <BhuguardMaterialIcon name={icon} size={14} color={officerTheme.onSurfaceVariant} />
      <Text style={styles.detailLabel}>{label}:</Text>
      <Text style={styles.detailValue} numberOfLines={1}>
        {value}
      </Text>
    </View>
  );
}

interface OfficerVisitsQuickActionsProps {
  onGpsCheckIn: () => void;
  onVerificationChecklist: () => void;
  onFeedstockVerification: () => void;
  onBiocharProduction: () => void;
  onInventoryMovement: () => void;
  onUploadEvidence: () => void;
  onReportsQueue: () => void;
}

export function OfficerVisitsQuickActions({
  onGpsCheckIn,
  onVerificationChecklist,
  onFeedstockVerification,
  onBiocharProduction,
  onInventoryMovement,
  onUploadEvidence,
  onReportsQueue,
}: OfficerVisitsQuickActionsProps) {
  const actions: Array<{ key: string; label: string; icon: BhuguardIconName; onPress: () => void }> = [
    { key: 'gps', label: 'GPS Check-In', icon: 'share_location', onPress: onGpsCheckIn },
    { key: 'checklist', label: 'Verification Checklist', icon: 'fact_check', onPress: onVerificationChecklist },
    { key: 'feedstock', label: 'Feedstock Verify', icon: 'science', onPress: onFeedstockVerification },
    { key: 'biochar', label: 'Biochar Production', icon: 'eco', onPress: onBiocharProduction },
    { key: 'inventory', label: 'Inventory Movement', icon: 'sync', onPress: onInventoryMovement },
    { key: 'evidence', label: 'Upload Evidence', icon: 'photo_camera', onPress: onUploadEvidence },
    { key: 'reports', label: 'Reports Queue', icon: 'pending_actions', onPress: onReportsQueue },
  ];

  return (
    <View style={styles.section}>
      <OfficerQuickActionsSectionHeader
        title="Quick Officer Actions"
        subtitle="Run visit verification, biochar workflows, and evidence capture."
      />
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.quickActionsRow}>
        {actions.map((action) => (
          <OfficerCompactQuickActionCard
            key={action.key}
            icon={action.icon}
            label={action.label}
            onPress={action.onPress}
          />
        ))}
      </ScrollView>
    </View>
  );
}

export function OfficerVisitsRecentActivity({
  activities = [],
  onActivityPress,
}: {
  activities?: OfficerDashboardActivity[];
  onActivityPress?: (activity: OfficerDashboardActivity) => void;
}) {
  const safeActivities = Array.isArray(activities) ? activities : [];

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Recent Activity</Text>
      <View style={styles.activityList}>
        {safeActivities.map((activity) => (
          <Pressable
            key={activity.id}
            style={styles.activityRow}
            onPress={() => onActivityPress?.(activity)}
          >
            <View
              style={[
                styles.activityIcon,
                activity.tone === 'success' && styles.activityIconSuccess,
                activity.tone === 'primary' && styles.activityIconPrimary,
              ]}
            >
              <BhuguardMaterialIcon
                name={
                  activity.title.includes('GPS')
                    ? 'share_location'
                    : activity.title.includes('Evidence')
                      ? 'upload'
                      : activity.title.includes('Report')
                        ? 'assignment_turned_in'
                        : 'fact_check'
                }
                size={12}
                color={activity.tone === 'primary' ? officerTheme.onPrimary : officerTheme.primary}
                filled
              />
            </View>
            <View style={styles.activityCopy}>
              <Text style={styles.activityTitle}>{activity.title}</Text>
              <Text style={styles.activitySubtitle}>{activity.subtitle}</Text>
            </View>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

interface OfficerVisitsMapCardProps {
  summary: OfficerVisitsSummary;
  onOpenFullMap: () => void;
}

export function OfficerVisitsMapCard({ summary, onOpenFullMap }: OfficerVisitsMapCardProps) {
  return (
    <View style={[styles.mapCard, officerCardShadow]}>
      <View style={styles.mapPlaceholder}>
        <View style={styles.mapGradient} />
        <View style={styles.mapPins}>
          <View style={[styles.mapPin, { top: '22%', left: '18%' }]} />
          <View style={[styles.mapPin, styles.mapPinWarning, { top: '48%', left: '52%' }]} />
          <View style={[styles.mapPin, styles.mapPinAlert, { top: '32%', left: '72%' }]} />
        </View>
      </View>

      <View style={styles.mapOverlay}>
        <View style={styles.mapStatsChip}>
          <View style={styles.mapTitleRow}>
            <BhuguardMaterialIcon name="map" size={16} color={officerTheme.primary} />
            <Text style={styles.mapTitle}>Today&apos;s Visit Route</Text>
          </View>
          <View style={styles.mapStatsRow}>
            <MapStat label="Total Visits" value={summary.totalVisits} />
            <MapStat label="Completed" value={summary.routeCompleted} color={officerTheme.secondary} />
            <MapStat label="Pending" value={summary.routePending} color={officerTheme.tertiary} />
          </View>
        </View>

        <Pressable style={styles.mapButton} onPress={onOpenFullMap}>
          <Text style={styles.mapButtonText}>Open Full Map</Text>
        </Pressable>
      </View>
    </View>
  );
}

function MapStat({ label, value, color }: { label: string; value: number; color?: string }) {
  return (
    <View style={styles.mapStatItem}>
      <Text style={[styles.mapStatValue, color ? { color } : null]}>{value}</Text>
      <Text style={styles.mapStatLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  subtitle: {
    fontSize: 14,
    lineHeight: 20,
    color: officerTheme.onSurfaceVariant,
    marginBottom: 16,
  },
  summaryRow: {
    gap: 10,
    paddingRight: 8,
    marginBottom: 16,
  },
  summaryCard: {
    width: 132,
    backgroundColor: officerTheme.surfaceLowest,
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(191, 201, 190, 0.15)',
    gap: 4,
  },
  summaryLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: officerTheme.onSurfaceVariant,
    lineHeight: 15,
  },
  summaryValue: {
    fontSize: 24,
    fontWeight: '700',
    lineHeight: 28,
  },
  searchFilterWrap: {
    gap: 12,
    marginBottom: 16,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: officerTheme.surfaceLowest,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: officerTheme.outlineVariant,
    paddingHorizontal: 12,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 15,
    color: officerTheme.onSurface,
  },
  chipRow: {
    gap: 8,
    paddingRight: 8,
  },
  chip: {
    borderWidth: 1,
    borderColor: officerTheme.outlineVariant,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: officerTheme.surfaceLowest,
  },
  chipActive: {
    backgroundColor: 'rgba(173, 238, 195, 0.35)',
    borderColor: officerTheme.primary,
  },
  chipText: {
    fontSize: 13,
    fontWeight: '600',
    color: officerTheme.onSurfaceVariant,
  },
  chipTextActive: {
    color: officerTheme.primary,
  },
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: officerTheme.onSurface,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 12,
  },
  visitList: {
    gap: 14,
    marginBottom: 16,
  },
  visitCard: {
    backgroundColor: officerTheme.surfaceLowest,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(191, 201, 190, 0.12)',
    gap: 12,
  },
  visitCardTop: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'flex-start',
  },
  visitIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: 'rgba(173, 238, 195, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  visitHeaderCopy: {
    flex: 1,
    gap: 2,
    paddingRight: 4,
  },
  priorityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 2,
  },
  priorityText: {
    fontSize: 10,
    fontWeight: '700',
    color: officerTheme.error,
    textTransform: 'uppercase',
  },
  visitPrimaryLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: officerTheme.onSurface,
  },
  visitSecondaryLabel: {
    fontSize: 13,
    color: officerTheme.onSurface,
  },
  visitMeta: {
    fontSize: 12,
    color: officerTheme.onSurfaceVariant,
    lineHeight: 16,
  },
  statusBadge: {
    alignSelf: 'flex-start',
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: 'rgba(191, 201, 190, 0.25)',
  },
  statusHigh: {
    backgroundColor: 'rgba(255, 218, 214, 0.9)',
  },
  statusPending: {
    backgroundColor: 'rgba(188, 173, 50, 0.2)',
  },
  statusScheduled: {
    backgroundColor: 'rgba(173, 238, 195, 0.35)',
  },
  statusCompleted: {
    backgroundColor: 'rgba(44, 106, 72, 0.15)',
  },
  statusBadgeText: {
    fontSize: 9,
    fontWeight: '700',
    color: officerTheme.onTertiaryFixedVariant,
    textTransform: 'uppercase',
    maxWidth: 72,
    textAlign: 'center',
  },
  visitDetailsGrid: {
    gap: 6,
    paddingTop: 4,
    borderTopWidth: 1,
    borderTopColor: 'rgba(191, 201, 190, 0.2)',
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  detailLabel: {
    fontSize: 12,
    color: officerTheme.onSurfaceVariant,
    fontWeight: '500',
  },
  detailValue: {
    flex: 1,
    fontSize: 12,
    color: officerTheme.onSurface,
    fontWeight: '600',
  },
  visitActions: {
    flexDirection: 'row',
    gap: 10,
  },
  primaryButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: officerTheme.primaryContainer,
    borderRadius: 10,
    paddingVertical: 11,
  },
  primaryButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: officerTheme.onPrimary,
  },
  secondaryButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: 'rgba(173, 238, 195, 0.25)',
    borderRadius: 10,
    paddingVertical: 11,
    borderWidth: 1,
    borderColor: 'rgba(11, 107, 58, 0.15)',
  },
  secondaryButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: officerTheme.primary,
  },
  emptyCard: {
    backgroundColor: officerTheme.surfaceLowest,
    borderRadius: 14,
    padding: 16,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: officerTheme.onSurface,
  },
  emptyText: {
    fontSize: 13,
    color: officerTheme.onSurfaceVariant,
    marginTop: 4,
  },
  quickActionsRow: {
    gap: 12,
    paddingRight: 8,
    paddingBottom: 4,
  },
  activityList: {
    gap: 14,
    paddingLeft: 4,
  },
  activityRow: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'flex-start',
  },
  activityIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: officerTheme.surfaceVariant,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activityIconSuccess: {
    backgroundColor: officerTheme.secondaryContainer,
  },
  activityIconPrimary: {
    backgroundColor: officerTheme.primaryContainer,
  },
  activityCopy: {
    flex: 1,
    gap: 2,
  },
  activityTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: officerTheme.onSurface,
  },
  activitySubtitle: {
    fontSize: 11,
    color: officerTheme.onSurfaceVariant,
  },
  mapCard: {
    minHeight: 180,
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(191, 201, 190, 0.12)',
    marginBottom: 16,
    backgroundColor: officerTheme.secondaryContainer,
  },
  mapPlaceholder: {
    ...StyleSheet.absoluteFill,
    backgroundColor: '#D8E8D0',
  },
  mapGradient: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  mapPins: {
    ...StyleSheet.absoluteFill,
  },
  mapPin: {
    position: 'absolute',
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: officerTheme.primary,
    borderWidth: 2,
    borderColor: officerTheme.surfaceLowest,
  },
  mapPinWarning: {
    backgroundColor: officerTheme.tertiary,
  },
  mapPinAlert: {
    backgroundColor: officerTheme.error,
  },
  mapOverlay: {
    flex: 1,
    minHeight: 180,
    padding: 12,
    justifyContent: 'space-between',
  },
  mapStatsChip: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.94)',
    borderRadius: 12,
    padding: 10,
    gap: 8,
    ...officerCardShadow,
  },
  mapTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  mapTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: officerTheme.onSurface,
  },
  mapStatsRow: {
    flexDirection: 'row',
    gap: 14,
  },
  mapStatItem: {
    gap: 2,
  },
  mapStatValue: {
    fontSize: 16,
    fontWeight: '700',
    color: officerTheme.primary,
  },
  mapStatLabel: {
    fontSize: 9,
    fontWeight: '600',
    color: officerTheme.onSurfaceVariant,
    textTransform: 'uppercase',
  },
  mapButton: {
    alignSelf: 'center',
    backgroundColor: 'rgba(255,255,255,0.94)',
    borderWidth: 1,
    borderColor: 'rgba(11, 107, 58, 0.2)',
    borderRadius: 999,
    paddingHorizontal: 18,
    paddingVertical: 9,
    ...officerShadow,
  },
  mapButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: officerTheme.primary,
  },
});
