import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  Linking,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { getApiErrorMessage } from '../../api/authApi';
import {
  cancelVisit,
  getVisitCalendar,
  rescheduleVisit,
} from '../../api/fieldOfficerApi';
import { OfficerListState } from '../../components/officer/OfficerListState';
import { OfficerScreenChrome } from '../../components/officer/OfficerScreenChrome';
import { ScreenHeader } from '../../components/ScreenHeader';
import { BhuguardMaterialIcon } from '../../components/shared/BhuguardMaterialIcon';
import { useAssignedLocations } from '../../hooks/useAssignedLocations';
import type { FieldOfficerStackParamList } from '../../navigation/types';
import { officerCardShadow, officerTheme } from '../../theme/officerDashboardTheme';
import { extractList, pickString, type ApiRecord } from '../../utils/apiHelpers';
import { formatStatusLabel } from '../../utils/statusLabels';
import { ensureVisitReadyForGpsCheckIn } from '../../utils/visitWorkflowHelpers';

type Props = NativeStackScreenProps<FieldOfficerStackParamList, 'FieldOfficerSchedule'>;
type VisitFilter = 'upcoming' | 'completed' | 'cancelled' | 'all';

const OUTSIDE_ZONE_MESSAGE = 'This location is outside your assigned working area.';
const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function startOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function daysInMonth(date: Date): number {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
}

function toIsoDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function parseVisitDay(visit: ApiRecord): string | null {
  const scheduled = pickString(visit, 'scheduled_at', 'visit_date');
  if (scheduled === '-') {
    return null;
  }

  const date = new Date(scheduled);
  if (Number.isNaN(date.getTime())) {
    return scheduled.slice(0, 10);
  }

  return toIsoDate(date);
}

function formatTime(visit: ApiRecord): string {
  const raw = pickString(visit, 'scheduled_at', 'visit_date');
  if (raw === '-') {
    return '—';
  }

  const date = new Date(raw);
  if (Number.isNaN(date.getTime())) {
    return raw;
  }

  return date.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
}

function statusTone(status: string): string {
  const normalized = status.toLowerCase();
  if (normalized === 'cancelled' || normalized === 'rejected') {
    return officerTheme.error;
  }
  if (normalized === 'approved' || normalized === 'completed' || normalized === 'submitted_to_admin') {
    return officerTheme.primary;
  }
  if (normalized === 'checked_in' || normalized === 'started' || normalized === 'verification_in_progress') {
    return officerTheme.tertiary;
  }
  return officerTheme.onSurfaceVariant;
}

function isScheduledStatus(status: string): boolean {
  return ['assigned', 'accepted', 'scheduled'].includes(status.toLowerCase());
}

function isInProgressStatus(status: string): boolean {
  return ['started', 'checked_in', 'verification_in_progress'].includes(status.toLowerCase());
}

function isCompletedStatus(status: string): boolean {
  return ['completed', 'submitted_to_admin', 'approved'].includes(status.toLowerCase());
}

function isCancelledStatus(status: string): boolean {
  return ['cancelled', 'canceled', 'rejected'].includes(status.toLowerCase());
}

function visitStatusLabel(status: string): string {
  const normalized = status.toLowerCase();
  if (normalized === 'accepted' || normalized === 'assigned' || normalized === 'scheduled') {
    return 'Scheduled';
  }
  if (normalized === 'started' || normalized === 'checked_in' || normalized === 'verification_in_progress') {
    return 'In Progress';
  }
  if (isCompletedStatus(normalized)) {
    return 'Completed';
  }
  if (isCancelledStatus(normalized)) {
    return 'Cancelled';
  }
  return formatStatusLabel(status);
}

export function FieldOfficerScheduleScreen({ navigation }: Props) {
  const assigned = useAssignedLocations('field_officer');
  const abortRef = useRef<AbortController | null>(null);
  const requestIdRef = useRef(0);

  const [monthCursor, setMonthCursor] = useState(() => startOfMonth(new Date()));
  const [selectedDate, setSelectedDate] = useState(() => toIsoDate(new Date()));
  const [filter, setFilter] = useState<VisitFilter>('upcoming');
  const [visits, setVisits] = useState<ApiRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [actionBusyId, setActionBusyId] = useState<number | null>(null);
  const [rescheduleTarget, setRescheduleTarget] = useState<ApiRecord | null>(null);
  const [rescheduleDate, setRescheduleDate] = useState('');
  const [rescheduleTime, setRescheduleTime] = useState('09:00');
  const [rescheduleReason, setRescheduleReason] = useState('');
  const [cancelTarget, setCancelTarget] = useState<ApiRecord | null>(null);
  const [cancelReason, setCancelReason] = useState('');

  const monthLabel = monthCursor.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });

  const calendarCells = useMemo(() => {
    const firstDay = startOfMonth(monthCursor).getDay();
    const totalDays = daysInMonth(monthCursor);
    const cells: Array<{ key: string; day: number | null; iso: string | null }> = [];

    for (let i = 0; i < firstDay; i += 1) {
      cells.push({ key: `pad-${monthCursor.getFullYear()}-${monthCursor.getMonth()}-b${i}`, day: null, iso: null });
    }

    for (let day = 1; day <= totalDays; day += 1) {
      const iso = toIsoDate(new Date(monthCursor.getFullYear(), monthCursor.getMonth(), day));
      cells.push({ key: `day-${iso}`, day, iso });
    }

    while (cells.length % 7 !== 0) {
      cells.push({
        key: `pad-${monthCursor.getFullYear()}-${monthCursor.getMonth()}-a${cells.length}`,
        day: null,
        iso: null,
      });
    }

    return cells;
  }, [monthCursor]);

  const visitDates = useMemo(() => {
    const set = new Set<string>();
    visits.forEach((visit) => {
      const day = parseVisitDay(visit);
      if (day) {
        set.add(day);
      }
    });
    return set;
  }, [visits]);

  const selectedDayVisits = useMemo(() => {
    return visits.filter((visit) => parseVisitDay(visit) === selectedDate);
  }, [visits, selectedDate]);

  const load = useCallback(async (silent = false) => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;

    if (silent) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    setError(null);

    const from = toIsoDate(startOfMonth(monthCursor));
    const to = toIsoDate(new Date(monthCursor.getFullYear(), monthCursor.getMonth() + 1, 0));

    try {
      const data = await getVisitCalendar({
        from,
        to,
        status: filter === 'all' ? 'all' : filter,
      });

      if (controller.signal.aborted || requestId !== requestIdRef.current) {
        return;
      }

      setVisits(extractList(data as ApiRecord, ['visits', 'data']));
    } catch (err) {
      if (controller.signal.aborted || requestId !== requestIdRef.current) {
        return;
      }

      const message = getApiErrorMessage(err, 'Failed to load visit calendar.');
      setError(/outside|assigned working area/i.test(message) ? OUTSIDE_ZONE_MESSAGE : message);
      setVisits([]);
    } finally {
      if (!controller.signal.aborted && requestId === requestIdRef.current) {
        setLoading(false);
        setRefreshing(false);
      }
    }
  }, [filter, monthCursor]);

  useEffect(() => {
    void load(false);
    return () => {
      abortRef.current?.abort();
    };
  }, [load]);

  const shiftMonth = (delta: number) => {
    setMonthCursor((current) => new Date(current.getFullYear(), current.getMonth() + delta, 1));
  };

  const openMaps = (visit: ApiRecord) => {
    const lat = Number(visit.latitude);
    const lng = Number(visit.longitude);

    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      Alert.alert('No location', 'This visit does not have map coordinates yet.');
      return;
    }

    void Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${lat},${lng}`);
  };

  const handleStart = async (visit: ApiRecord) => {
    const assignmentId = Number(visit.assignment_id ?? visit.id);
    if (!assignmentId) {
      return;
    }

    setActionBusyId(assignmentId);
    try {
      // Accept (if needed) then start — required for FO self-created and admin-assigned visits.
      await ensureVisitReadyForGpsCheckIn(assignmentId);
      navigation.navigate('VisitCheckIn', { assignmentId });
      await load(true);
    } catch (err) {
      const message = getApiErrorMessage(err, 'Unable to start visit.');
      Alert.alert(
        'Error',
        /outside|assigned working area|out of zone/i.test(message) ? 'Out of Zone' : message,
      );
    } finally {
      setActionBusyId(null);
    }
  };

  const openCancel = (visit: ApiRecord) => {
    setRescheduleTarget(null);
    setCancelTarget(visit);
    setCancelReason('');
  };

  const submitCancel = async () => {
    if (!cancelTarget) {
      return;
    }

    const assignmentId = Number(cancelTarget.assignment_id ?? cancelTarget.id);
    if (!assignmentId) {
      return;
    }

    if (!cancelReason.trim()) {
      Alert.alert('Reason required', 'Please enter a cancellation reason.');
      return;
    }

    setActionBusyId(assignmentId);
    try {
      await cancelVisit(assignmentId, { cancellation_reason: cancelReason.trim() });
      setCancelTarget(null);
      await load(true);
      Alert.alert('Visit cancelled', 'The visit has been cancelled.');
    } catch (err) {
      Alert.alert('Error', getApiErrorMessage(err, 'Unable to cancel visit.'));
    } finally {
      setActionBusyId(null);
    }
  };

  const openReschedule = (visit: ApiRecord) => {
    const day = parseVisitDay(visit) ?? selectedDate;
    setCancelTarget(null);
    setRescheduleTarget(visit);
    setRescheduleDate(day);
    setRescheduleTime('09:00');
    setRescheduleReason('');
  };

  const submitReschedule = async () => {
    if (!rescheduleTarget) {
      return;
    }

    const assignmentId = Number(rescheduleTarget.assignment_id ?? rescheduleTarget.id);
    if (!assignmentId || !rescheduleDate) {
      return;
    }

    setActionBusyId(assignmentId);
    try {
      await rescheduleVisit(assignmentId, {
        scheduled_at: `${rescheduleDate}T${rescheduleTime}:00`,
        reschedule_reason: rescheduleReason.trim() || 'Rescheduled by field officer',
      });
      setRescheduleTarget(null);
      await load(true);
      Alert.alert('Visit rescheduled', 'The visit time has been updated.');
    } catch (err) {
      Alert.alert('Error', getApiErrorMessage(err, 'Unable to reschedule visit.'));
    } finally {
      setActionBusyId(null);
    }
  };

  const filters: Array<{ key: VisitFilter; label: string }> = [
    { key: 'upcoming', label: 'Upcoming' },
    { key: 'completed', label: 'Completed' },
    { key: 'cancelled', label: 'Cancelled' },
    { key: 'all', label: 'All' },
  ];

  return (
    <OfficerScreenChrome edges={['top']}>
      <ScreenHeader
        title="Visit Schedule"
        showBrandLogo={false}
        rightAction={{
          label: 'Create',
          onPress: () => navigation.navigate('FieldOfficerCreateVisit'),
        }}
      />

      {!assigned.hasAssignment && !assigned.loading ? (
        <OfficerListState
          kind="error"
          title="Outside assigned area"
          message={OUTSIDE_ZONE_MESSAGE}
          onRetry={assigned.refresh}
        />
      ) : (
        <ScrollView
          contentContainerStyle={styles.content}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => void load(true)} tintColor={officerTheme.primary} />
          }
        >
          <View style={[styles.calendarCard, officerCardShadow]}>
            <View style={styles.monthRow}>
              <Pressable onPress={() => shiftMonth(-1)} style={styles.monthNav}>
                <BhuguardMaterialIcon name="arrow_back" size={18} color={officerTheme.primary} />
              </Pressable>
              <Text style={styles.monthLabel}>{monthLabel}</Text>
              <Pressable onPress={() => shiftMonth(1)} style={styles.monthNav}>
                <BhuguardMaterialIcon name="chevron_right" size={18} color={officerTheme.primary} />
              </Pressable>
            </View>

            <View style={styles.weekRow}>
              {WEEKDAYS.map((day) => (
                <Text key={day} style={styles.weekDay}>
                  {day}
                </Text>
              ))}
            </View>

            <View style={styles.grid}>
              {calendarCells.map((cell) => {
                const selected = cell.iso === selectedDate;
                const hasVisit = cell.iso ? visitDates.has(cell.iso) : false;

                return (
                  <Pressable
                    key={cell.key}
                    style={[
                      styles.dayCell,
                      selected && styles.daySelected,
                      !cell.day && styles.dayEmpty,
                    ]}
                    disabled={!cell.day}
                    onPress={() => cell.iso && setSelectedDate(cell.iso)}
                  >
                    {cell.day ? (
                      <>
                        <Text style={[styles.dayText, selected && styles.dayTextSelected]}>{cell.day}</Text>
                        {hasVisit ? <View style={[styles.dot, selected && styles.dotSelected]} /> : null}
                      </>
                    ) : null}
                  </Pressable>
                );
              })}
            </View>
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
            {filters.map((item) => (
              <Pressable
                key={item.key}
                style={[styles.filterChip, filter === item.key && styles.filterChipActive]}
                onPress={() => setFilter(item.key)}
              >
                <Text style={[styles.filterText, filter === item.key && styles.filterTextActive]}>{item.label}</Text>
              </Pressable>
            ))}
          </ScrollView>

          <View style={styles.dayHeader}>
            <Text style={styles.sectionTitle}>Visits on {selectedDate}</Text>
            <Pressable
              style={styles.createButton}
              onPress={() => navigation.navigate('FieldOfficerCreateVisit')}
            >
              <Text style={styles.createButtonText}>Create Visit</Text>
            </Pressable>
          </View>

          {loading && visits.length === 0 ? (
            <OfficerListState kind="loading" message="Loading schedule…" />
          ) : error ? (
            <OfficerListState kind="error" message={error} onRetry={() => void load(false)} />
          ) : selectedDayVisits.length === 0 ? (
            <OfficerListState kind="empty" title="No visits" message="No visits scheduled for this date." />
          ) : (
            <View style={styles.list}>
              {selectedDayVisits.map((visit) => {
                const assignmentId = Number(visit.assignment_id ?? visit.id);
                const status = pickString(visit, 'assignment_status', 'status');
                const busy = actionBusyId === assignmentId;
                const visitCode =
                  pickString(visit, 'assignment_code') !== '-'
                    ? pickString(visit, 'assignment_code')
                    : `Visit #${assignmentId}`;

                return (
                  <View key={`visit-${assignmentId}-${pickString(visit, 'scheduled_at')}`} style={[styles.visitCard, officerCardShadow]}>
                    <View style={styles.visitTop}>
                      <View style={styles.visitCopy}>
                        <Text style={styles.visitName}>{pickString(visit, 'farmer_name') !== '-' ? pickString(visit, 'farmer_name') : `Farmer ${pickString(visit, 'farmer_id')}`}</Text>
                        <Text style={styles.visitMeta}>
                          {visitCode} • {pickString(visit, 'farm_name') !== '-' ? pickString(visit, 'farm_name') : 'Farm TBD'} • {formatTime(visit)}
                        </Text>
                        <Text style={[styles.visitStatus, { color: statusTone(status) }]}>{visitStatusLabel(status)}</Text>
                      </View>
                    </View>

                    <View style={styles.actions}>
                      <Pressable
                        style={styles.actionBtn}
                        onPress={() => navigation.navigate('FieldOfficerAssignmentDetail', { assignmentId })}
                      >
                        <Text style={styles.actionText}>View</Text>
                      </Pressable>

                      {isScheduledStatus(status) ? (
                        <>
                          <Pressable style={styles.actionBtn} onPress={() => openReschedule(visit)} disabled={busy}>
                            <Text style={styles.actionText}>Reschedule</Text>
                          </Pressable>
                          <Pressable style={styles.actionBtn} onPress={() => openCancel(visit)} disabled={busy}>
                            <Text style={styles.actionText}>Cancel</Text>
                          </Pressable>
                          <Pressable style={styles.actionBtnPrimary} onPress={() => void handleStart(visit)} disabled={busy}>
                            <Text style={styles.actionTextPrimary}>{busy ? '…' : 'Start Visit'}</Text>
                          </Pressable>
                          <Pressable style={styles.actionBtn} onPress={() => openMaps(visit)}>
                            <Text style={styles.actionText}>Maps</Text>
                          </Pressable>
                        </>
                      ) : null}

                      {isInProgressStatus(status) ? (
                        <>
                          <Pressable style={styles.actionBtnPrimary} onPress={() => void handleStart(visit)} disabled={busy}>
                            <Text style={styles.actionTextPrimary}>{busy ? '…' : 'Continue Visit'}</Text>
                          </Pressable>
                          <Pressable style={styles.actionBtn} onPress={() => openMaps(visit)}>
                            <Text style={styles.actionText}>Maps</Text>
                          </Pressable>
                          <Pressable
                            style={styles.actionBtn}
                            onPress={() => navigation.navigate('FieldOfficerAssignmentDetail', { assignmentId })}
                          >
                            <Text style={styles.actionText}>Complete Visit</Text>
                          </Pressable>
                        </>
                      ) : null}

                      {isCompletedStatus(status) ? (
                        <>
                          <Pressable style={styles.actionBtn} onPress={() => openMaps(visit)}>
                            <Text style={styles.actionText}>Maps</Text>
                          </Pressable>
                          <Pressable
                            style={styles.actionBtn}
                            onPress={() => navigation.navigate('FieldOfficerAssignmentDetail', { assignmentId })}
                          >
                            <Text style={styles.actionText}>View Activity Summary</Text>
                          </Pressable>
                        </>
                      ) : null}
                    </View>
                  </View>
                );
              })}
            </View>
          )}

          {rescheduleTarget ? (
            <View style={[styles.rescheduleCard, officerCardShadow]}>
              <Text style={styles.sectionTitle}>Reschedule visit</Text>
              <Text style={styles.label}>Date (YYYY-MM-DD)</Text>
              <TextInput
                style={styles.input}
                value={rescheduleDate}
                onChangeText={setRescheduleDate}
                placeholder="2026-07-15"
                placeholderTextColor={officerTheme.outline}
              />
              <Text style={styles.label}>Time (HH:MM)</Text>
              <TextInput
                style={styles.input}
                value={rescheduleTime}
                onChangeText={setRescheduleTime}
                placeholder="09:00"
                placeholderTextColor={officerTheme.outline}
              />
              <Text style={styles.label}>Reason</Text>
              <TextInput
                style={[styles.input, styles.notes]}
                value={rescheduleReason}
                onChangeText={setRescheduleReason}
                placeholder="Reason for reschedule"
                placeholderTextColor={officerTheme.outline}
                multiline
              />
              <View style={styles.rescheduleActions}>
                <Pressable style={styles.actionBtn} onPress={() => setRescheduleTarget(null)}>
                  <Text style={styles.actionText}>Close</Text>
                </Pressable>
                <Pressable style={styles.actionBtnPrimary} onPress={() => void submitReschedule()}>
                  <Text style={styles.actionTextPrimary}>Save</Text>
                </Pressable>
              </View>
            </View>
          ) : null}

          {cancelTarget ? (
            <View style={[styles.rescheduleCard, officerCardShadow]}>
              <Text style={styles.sectionTitle}>Cancel visit</Text>
              <Text style={styles.label}>Cancellation reason</Text>
              <TextInput
                style={[styles.input, styles.notes]}
                value={cancelReason}
                onChangeText={setCancelReason}
                placeholder="Why is this visit being cancelled?"
                placeholderTextColor={officerTheme.outline}
                multiline
              />
              <View style={styles.rescheduleActions}>
                <Pressable style={styles.actionBtn} onPress={() => setCancelTarget(null)}>
                  <Text style={styles.actionText}>Close</Text>
                </Pressable>
                <Pressable style={styles.actionBtnPrimary} onPress={() => void submitCancel()}>
                  <Text style={styles.actionTextPrimary}>Confirm Cancel</Text>
                </Pressable>
              </View>
            </View>
          ) : null}
        </ScrollView>
      )}
    </OfficerScreenChrome>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: officerTheme.marginMobile,
    gap: 14,
    paddingBottom: 40,
  },
  calendarCard: {
    backgroundColor: officerTheme.surfaceLowest,
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: officerTheme.outlineVariant,
    gap: 12,
  },
  monthRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  monthNav: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: officerTheme.surfaceLow,
  },
  monthLabel: {
    fontSize: 18,
    fontWeight: '700',
    color: officerTheme.tertiary,
  },
  weekRow: {
    flexDirection: 'row',
  },
  weekDay: {
    width: `${100 / 7}%`,
    textAlign: 'center',
    fontSize: 11,
    fontWeight: '700',
    color: officerTheme.onSurfaceVariant,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dayCell: {
    width: `${100 / 7}%`,
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    gap: 4,
  },
  dayEmpty: {
    opacity: 0,
  },
  daySelected: {
    backgroundColor: officerTheme.primary,
  },
  dayText: {
    fontSize: 14,
    fontWeight: '600',
    color: officerTheme.onSurface,
  },
  dayTextSelected: {
    color: officerTheme.onPrimary,
  },
  dot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: officerTheme.primary,
  },
  dotSelected: {
    backgroundColor: officerTheme.onPrimary,
  },
  filterRow: {
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: officerTheme.surfaceContainer,
    borderWidth: 1,
    borderColor: officerTheme.outlineVariant,
  },
  filterChipActive: {
    backgroundColor: officerTheme.secondaryContainer,
    borderColor: officerTheme.secondaryContainer,
  },
  filterText: {
    fontSize: 12,
    fontWeight: '700',
    color: officerTheme.onSurfaceVariant,
  },
  filterTextActive: {
    color: officerTheme.onSecondaryContainer,
  },
  dayHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: officerTheme.tertiary,
    flex: 1,
  },
  createButton: {
    backgroundColor: officerTheme.primary,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  createButtonText: {
    fontSize: 12,
    fontWeight: '800',
    color: officerTheme.onPrimary,
  },
  list: {
    gap: 12,
  },
  visitCard: {
    backgroundColor: officerTheme.surfaceLowest,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: officerTheme.outlineVariant,
    gap: 10,
  },
  visitTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  visitCopy: {
    flex: 1,
    gap: 2,
  },
  visitName: {
    fontSize: 16,
    fontWeight: '700',
    color: officerTheme.onSurface,
  },
  visitMeta: {
    fontSize: 13,
    color: officerTheme.onSurfaceVariant,
  },
  visitStatus: {
    marginTop: 4,
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'capitalize',
  },
  actions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  actionBtn: {
    borderWidth: 1,
    borderColor: officerTheme.outlineVariant,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  actionText: {
    fontSize: 12,
    fontWeight: '700',
    color: officerTheme.onSurface,
  },
  actionBtnPrimary: {
    backgroundColor: officerTheme.primary,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  actionTextPrimary: {
    fontSize: 12,
    fontWeight: '800',
    color: officerTheme.onPrimary,
  },
  rescheduleCard: {
    backgroundColor: officerTheme.surfaceLowest,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: officerTheme.outlineVariant,
    gap: 8,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: officerTheme.onSurfaceVariant,
  },
  input: {
    borderWidth: 1,
    borderColor: officerTheme.outlineVariant,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: officerTheme.onSurface,
    backgroundColor: officerTheme.neutral,
  },
  notes: {
    minHeight: 72,
    textAlignVertical: 'top',
  },
  rescheduleActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
    marginTop: 4,
  },
});
