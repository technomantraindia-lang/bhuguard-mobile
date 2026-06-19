import { useCallback, useState, type ReactNode } from 'react';
import {
  Alert,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import {
  acceptVisit,
  getVisitAssignmentDetail,
  startVerification,
  startVisit,
} from '../../api/fieldOfficerApi';
import { getApiErrorMessage } from '../../api/authApi';
import { EmptyState } from '../../components/EmptyState';
import { ErrorState } from '../../components/ErrorState';
import { LoadingState } from '../../components/LoadingState';
import { BhuguardMaterialIcon } from '../../components/shared/BhuguardMaterialIcon';
import { VisitVerificationProgressStepper } from '../../components/officer/VisitVerificationProgressStepper';
import type { FieldOfficerStackParamList } from '../../navigation/types';
import { officerCardShadow, officerTheme } from '../../theme/officerDashboardTheme';
import { isVisitChecklistCompleted, countVisitEvidenceUploads } from '../../utils/visitChecklistHelpers';
import { buildVisitDetailModel } from '../../utils/visitDetailModel';
import { resolveVisitVerificationProgress, unwrapAssignmentRecord } from '../../utils/visitWorkflowHelpers';

type Props = NativeStackScreenProps<FieldOfficerStackParamList, 'FieldOfficerAssignmentDetail'>;

export function FieldOfficerAssignmentDetailScreen({ route, navigation }: Props) {
  const { assignmentId } = route.params;
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [assignment, setAssignment] = useState<Record<string, unknown> | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const data = await getVisitAssignmentDetail(assignmentId);
      const root = data as Record<string, unknown>;
      const record = (root.assignment ?? root.data ?? root) as Record<string, unknown>;
      setAssignment(record);
    } catch (err) {
      setError(getApiErrorMessage(err, 'Failed to load assignment.'));
    } finally {
      setLoading(false);
    }
  }, [assignmentId]);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  const runAction = async (action: () => Promise<unknown>, onSuccess?: () => void) => {
    setActionLoading(true);
    setError(null);

    try {
      await action();
      await load();
      onSuccess?.();
    } catch (err) {
      setError(getApiErrorMessage(err, 'Action failed.'));
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <LoadingState message="Loading visit details..." />
      </SafeAreaView>
    );
  }

  if (error && !assignment) {
    return (
      <SafeAreaView style={styles.safe}>
        <ErrorState message={error} onRetry={load} />
      </SafeAreaView>
    );
  }

  if (!assignment) {
    return (
      <SafeAreaView style={styles.safe}>
        <EmptyState title="No assignment data" message="This assignment could not be loaded." />
      </SafeAreaView>
    );
  }

  const detail = buildVisitDetailModel(assignment, assignmentId);
  const progress = resolveVisitVerificationProgress(unwrapAssignmentRecord(assignment));
  const checklistCompleted = isVisitChecklistCompleted(assignment);
  const evidenceUploadsCount = countVisitEvidenceUploads(assignment);

  const openChecklist = () => {
    navigation.navigate('VerificationChecklist', { assignmentId });
  };

  const openVerificationFlow = () => {
    if (detail.canStartVerification) {
      void runAction(async () => {
        await startVerification(assignmentId);
        navigation.navigate('VerificationChecklist', { assignmentId });
      });
      return;
    }

    if (!checklistCompleted) {
      navigation.navigate('VerificationChecklist', { assignmentId });
      return;
    }

    if (evidenceUploadsCount > 0) {
      navigation.navigate('VisitReportReview', { assignmentId });
      return;
    }

    navigation.navigate('VisitEvidenceUpload', { assignmentId });
  };

  const handleStartCheckIn = () => {
    if (detail.canStartVisit) {
      void runAction(() => startVisit(assignmentId));
      return;
    }

    if (detail.canCheckIn) {
      navigation.navigate('VisitCheckIn', { assignmentId });
      return;
    }

    if (detail.showVerificationActions) {
      openVerificationFlow();
    }
  };

  const callFarmer = () => {
    if (detail.farmerPhone) {
      void Linking.openURL(`tel:${detail.farmerPhone}`);
      return;
    }

    Alert.alert('No phone number', 'Farmer contact is not available for this visit.');
  };

  const showStartCheckIn =
    detail.canStartVisit || detail.canCheckIn || detail.showVerificationActions;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.appBar}>
        <Pressable style={styles.iconButton} onPress={() => navigation.goBack()}>
          <View style={styles.backIcon}>
            <BhuguardMaterialIcon name="arrow_forward" size={22} color={officerTheme.primary} />
          </View>
        </Pressable>
        <Text style={styles.appBarTitle}>Bhuguard Field</Text>
        <Pressable
          style={styles.iconButton}
          onPress={() => navigation.navigate('FieldOfficerNotifications')}
        >
          <BhuguardMaterialIcon name="notifications" size={22} color={officerTheme.primary} />
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.pageTitleBlock}>
          <Text style={styles.pageTitle}>Visit Detail</Text>
          <Text style={styles.pageSubtitle}>{detail.assignmentCode}</Text>
        </View>

        <VisitVerificationProgressStepper
          currentStep={progress.currentStep}
          completedSteps={progress.completedSteps}
        />

        <View style={[styles.card, officerCardShadow]}>
          <View style={styles.summaryTopRow}>
            <View
              style={[
                styles.statusBadge,
                detail.statusBadge === 'Pending' && styles.statusBadgePending,
                detail.statusBadge === 'Completed' && styles.statusBadgeCompleted,
              ]}
            >
              <Text style={styles.statusBadgeText}>{detail.statusBadge}</Text>
            </View>
            <View style={styles.priorityRow}>
              <BhuguardMaterialIcon name="trending_up" size={16} color={officerTheme.onSurfaceVariant} />
              <Text style={styles.priorityText}>{detail.priorityLabel}</Text>
            </View>
          </View>

          <View style={styles.summaryGrid}>
            <SummaryField label="Project" value={detail.projectName} />
            <SummaryField label="Scheduled" value={detail.scheduledLabel} />
          </View>

          <View style={styles.summaryDivider} />
          <Text style={styles.fieldLabel}>Visit Type</Text>
          <View style={styles.visitTypeRow}>
            <BhuguardMaterialIcon name="assignment_turned_in" size={20} color={officerTheme.primary} />
            <Text style={styles.visitTypeText}>{detail.visitTypeLabel}</Text>
          </View>
        </View>

        <DetailCard title="Farmer Details" icon="person">
          <View style={styles.farmerHeaderRow}>
            <View style={styles.farmerCopy}>
              <Text style={styles.farmerName}>{detail.farmerName}</Text>
              <Text style={styles.farmerMeta}>ID: {detail.farmerId}</Text>
            </View>
            <Pressable style={styles.callButton} onPress={callFarmer}>
              <BhuguardMaterialIcon name="support_agent" size={20} color={officerTheme.primary} />
            </Pressable>
          </View>
          <View style={styles.locationRow}>
            <BhuguardMaterialIcon name="location_on" size={18} color={officerTheme.onSurfaceVariant} />
            <View style={styles.locationCopy}>
              <Text style={styles.locationText}>{detail.farmerLocation}</Text>
              {detail.farmerPhone ? (
                <Text style={styles.phoneText}>{detail.farmerPhone}</Text>
              ) : null}
            </View>
          </View>
        </DetailCard>

        <DetailCard title="Farm Details" icon="eco">
          <View style={styles.farmNameBlock}>
            <Text style={styles.fieldLabel}>Farm Name</Text>
            <Text style={styles.fieldValue}>{detail.farmName}</Text>
            <Text style={styles.farmMeta}>ID: {detail.farmId}</Text>
          </View>
          <View style={styles.summaryGrid}>
            <SummaryField label="Area" value={detail.farmArea} />
            <SummaryField label="Crop" value={detail.cropType} />
          </View>
          <View style={styles.serviceFocusBox}>
            <Text style={styles.fieldLabel}>Service Focus</Text>
            <Text style={styles.serviceFocusText}>{detail.serviceFocus}</Text>
          </View>
        </DetailCard>

        <DetailCard title="Verification Checklist" icon="fact_check">
          {detail.checklistPreview.map((item) => (
            <View key={item.key} style={styles.checklistRow}>
              <View style={[styles.checkbox, item.checked && styles.checkboxChecked]}>
                {item.checked ? (
                  <BhuguardMaterialIcon name="verified" size={14} color={officerTheme.onPrimary} filled />
                ) : null}
              </View>
              <Text style={styles.checklistLabel}>{item.label}</Text>
            </View>
          ))}
          <Pressable style={styles.viewAllButton} onPress={openChecklist}>
            <Text style={styles.viewAllText}>
              View all {detail.checklistTotalCount} items
            </Text>
            <BhuguardMaterialIcon name="chevron_right" size={18} color={officerTheme.primary} />
          </Pressable>
        </DetailCard>

        {error ? <Text style={styles.error}>{error}</Text> : null}
        <View style={styles.scrollSpacer} />
      </ScrollView>

      <View style={styles.stickyActions}>
        {detail.canAcceptVisit ? (
          <Pressable
            style={[styles.primaryAction, actionLoading && styles.actionDisabled]}
            onPress={() => runAction(() => acceptVisit(assignmentId))}
            disabled={actionLoading}
          >
            <BhuguardMaterialIcon name="verified" size={20} color={officerTheme.onPrimary} filled />
            <Text style={styles.primaryActionText}>Accept Visit</Text>
          </Pressable>
        ) : null}

        {showStartCheckIn ? (
          <Pressable
            style={[styles.secondaryAction, actionLoading && styles.actionDisabled]}
            onPress={handleStartCheckIn}
            disabled={actionLoading}
          >
            <BhuguardMaterialIcon name="arrow_forward" size={20} color={officerTheme.primary} />
            <Text style={styles.secondaryActionText}>
              {detail.canCheckIn
                ? 'Start Check-in'
                : detail.showVerificationActions
                  ? checklistCompleted
                    ? evidenceUploadsCount > 0
                      ? 'Review Report'
                      : 'Upload Evidence'
                    : 'Open Checklist'
                  : 'Start Check-in'}
            </Text>
          </Pressable>
        ) : null}
      </View>
    </SafeAreaView>
  );
}

function DetailCard({
  title,
  icon,
  children,
}: {
  title: string;
  icon: 'person' | 'eco' | 'fact_check';
  children: ReactNode;
}) {
  return (
    <View style={[styles.card, officerCardShadow]}>
      <View style={styles.cardTitleRow}>
        <BhuguardMaterialIcon name={icon} size={20} color={officerTheme.secondary} />
        <Text style={styles.cardTitle}>{title}</Text>
      </View>
      <View style={styles.cardDivider} />
      {children}
    </View>
  );
}

function SummaryField({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.summaryField}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <Text style={styles.fieldValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: officerTheme.background,
  },
  appBar: {
    height: officerTheme.headerHeight,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: officerTheme.marginMobile,
    backgroundColor: officerTheme.surface,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(191, 201, 190, 0.35)',
  },
  iconButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
  },
  backIcon: {
    transform: [{ rotate: '180deg' }],
  },
  appBarTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: officerTheme.primary,
  },
  scrollContent: {
    paddingHorizontal: officerTheme.marginMobile,
    paddingTop: 8,
    gap: 16,
  },
  pageTitleBlock: {
    paddingTop: 8,
    paddingBottom: 4,
    gap: 4,
  },
  pageTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: officerTheme.onSurface,
  },
  pageSubtitle: {
    fontSize: 14,
    color: officerTheme.onSurfaceVariant,
  },
  card: {
    backgroundColor: officerTheme.surfaceLowest,
    borderRadius: 24,
    padding: officerTheme.marginMobile,
    borderWidth: 1,
    borderColor: 'rgba(191, 201, 190, 0.2)',
    gap: 12,
  },
  summaryTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  statusBadge: {
    backgroundColor: 'rgba(246, 229, 101, 0.3)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
  },
  statusBadgePending: {
    backgroundColor: 'rgba(246, 229, 101, 0.3)',
  },
  statusBadgeCompleted: {
    backgroundColor: 'rgba(173, 238, 195, 0.45)',
  },
  statusBadgeText: {
    fontSize: 14,
    fontWeight: '500',
    color: officerTheme.onTertiaryFixedVariant,
  },
  priorityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  priorityText: {
    fontSize: 14,
    fontWeight: '500',
    color: officerTheme.onSurfaceVariant,
  },
  summaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  summaryField: {
    width: '47%',
    gap: 2,
  },
  summaryDivider: {
    height: 1,
    backgroundColor: 'rgba(191, 201, 190, 0.2)',
    marginTop: 4,
    paddingTop: 4,
  },
  visitTypeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  visitTypeText: {
    fontSize: 14,
    fontWeight: '500',
    color: officerTheme.onSurface,
  },
  fieldLabel: {
    fontSize: 12,
    color: officerTheme.onSurfaceVariant,
  },
  fieldValue: {
    fontSize: 14,
    fontWeight: '500',
    color: officerTheme.onSurface,
  },
  cardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingBottom: 4,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: officerTheme.onSurface,
  },
  cardDivider: {
    height: 1,
    backgroundColor: 'rgba(191, 201, 190, 0.2)',
    marginBottom: 4,
  },
  farmerHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  farmerCopy: {
    flex: 1,
    gap: 2,
  },
  farmerName: {
    fontSize: 18,
    fontWeight: '500',
    color: officerTheme.onSurface,
  },
  farmerMeta: {
    fontSize: 12,
    color: officerTheme.onSurfaceVariant,
  },
  callButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#EAF7EF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginTop: 4,
  },
  locationCopy: {
    flex: 1,
    gap: 2,
  },
  locationText: {
    fontSize: 14,
    color: officerTheme.onSurfaceVariant,
    lineHeight: 20,
  },
  phoneText: {
    fontSize: 12,
    color: officerTheme.onSurfaceVariant,
  },
  farmNameBlock: {
    gap: 2,
    marginBottom: 4,
  },
  farmMeta: {
    fontSize: 10,
    color: officerTheme.onSurfaceVariant,
    marginTop: 2,
  },
  serviceFocusBox: {
    backgroundColor: officerTheme.surfaceLow,
    borderRadius: 8,
    padding: 8,
    gap: 2,
    marginTop: 4,
  },
  serviceFocusText: {
    fontSize: 14,
    fontWeight: '500',
    color: officerTheme.primary,
  },
  checklistRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 2,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: officerTheme.outlineVariant,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: officerTheme.primaryContainer,
    borderColor: officerTheme.primaryContainer,
  },
  checklistLabel: {
    flex: 1,
    fontSize: 14,
    color: officerTheme.onSurface,
  },
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 10,
    marginTop: 4,
    borderRadius: 8,
  },
  viewAllText: {
    fontSize: 14,
    fontWeight: '500',
    color: officerTheme.primary,
  },
  error: {
    color: officerTheme.error,
    fontSize: 13,
    textAlign: 'center',
  },
  scrollSpacer: {
    height: 140,
  },
  stickyActions: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: officerTheme.marginMobile,
    paddingTop: 24,
    paddingBottom: 20,
    gap: 12,
    backgroundColor: officerTheme.background,
    borderTopWidth: 1,
    borderTopColor: 'rgba(191, 201, 190, 0.15)',
  },
  primaryAction: {
    height: 48,
    borderRadius: 12,
    backgroundColor: officerTheme.primaryContainer,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: 'rgba(11, 107, 58, 0.2)',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 3,
  },
  primaryActionText: {
    fontSize: 14,
    fontWeight: '500',
    color: officerTheme.onPrimary,
  },
  secondaryAction: {
    height: 48,
    borderRadius: 12,
    backgroundColor: officerTheme.surfaceLowest,
    borderWidth: 1,
    borderColor: officerTheme.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  secondaryActionText: {
    fontSize: 14,
    fontWeight: '500',
    color: officerTheme.primary,
  },
  actionDisabled: {
    opacity: 0.65,
  },
});
