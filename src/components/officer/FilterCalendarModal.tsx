import { useEffect, useMemo, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';

import { officerTheme } from '../../theme/officerDashboardTheme';

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

type FilterCalendarModalProps = {
  visible: boolean;
  title: string;
  value: string;
  minimumDate?: string;
  maximumDate?: string;
  onClose: () => void;
  onSelect: (isoDate: string) => void;
  onClear: () => void;
};

function toIsoDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

function parseIsoDate(value?: string): Date | null {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return null;
  }

  const date = new Date(`${value}T12:00:00`);

  return Number.isNaN(date.getTime()) ? null : date;
}

function monthStartFromValue(value?: string): Date {
  const parsed = parseIsoDate(value) ?? new Date();

  return new Date(parsed.getFullYear(), parsed.getMonth(), 1);
}

export function FilterCalendarModal({
  visible,
  title,
  value,
  minimumDate,
  maximumDate,
  onClose,
  onSelect,
  onClear,
}: FilterCalendarModalProps) {
  const [monthCursor, setMonthCursor] = useState(() => monthStartFromValue(value));

  useEffect(() => {
    if (visible) {
      setMonthCursor(monthStartFromValue(value));
    }
  }, [visible, value]);

  const cells = useMemo(() => {
    const firstDay = new Date(monthCursor.getFullYear(), monthCursor.getMonth(), 1).getDay();
    const totalDays = new Date(monthCursor.getFullYear(), monthCursor.getMonth() + 1, 0).getDate();
    const next: Array<{ key: string; day: number | null; iso: string | null }> = [];

    for (let index = 0; index < firstDay; index += 1) {
      next.push({ key: `pad-b-${index}`, day: null, iso: null });
    }

    for (let day = 1; day <= totalDays; day += 1) {
      const iso = toIsoDate(new Date(monthCursor.getFullYear(), monthCursor.getMonth(), day));
      next.push({ key: iso, day, iso });
    }

    while (next.length % 7 !== 0) {
      next.push({ key: `pad-a-${next.length}`, day: null, iso: null });
    }

    return next;
  }, [monthCursor]);

  const monthLabel = monthCursor.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <Text style={styles.title}>{title}</Text>

          <View style={styles.monthRow}>
            <Pressable
              style={styles.monthNav}
              onPress={() => setMonthCursor((current) => new Date(current.getFullYear(), current.getMonth() - 1, 1))}
            >
              <Text style={styles.monthNavText}>‹</Text>
            </Pressable>
            <Text style={styles.monthLabel}>{monthLabel}</Text>
            <Pressable
              style={styles.monthNav}
              onPress={() => setMonthCursor((current) => new Date(current.getFullYear(), current.getMonth() + 1, 1))}
            >
              <Text style={styles.monthNavText}>›</Text>
            </Pressable>
          </View>

          <View style={styles.weekRow}>
            {WEEKDAYS.map((day) => (
              <Text key={day} style={styles.weekday}>
                {day}
              </Text>
            ))}
          </View>

          <View style={styles.grid}>
            {cells.map((cell) => {
              if (!cell.iso || cell.day == null) {
                return <View key={cell.key} style={styles.dayCell} />;
              }

              const disabled =
                (minimumDate != null && cell.iso < minimumDate) || (maximumDate != null && cell.iso > maximumDate);
              const selected = cell.iso === value;

              return (
                <Pressable
                  key={cell.key}
                  disabled={disabled}
                  style={[styles.dayCell, selected && styles.daySelected, disabled && styles.dayDisabled]}
                  onPress={() => {
                    onSelect(cell.iso!);
                    onClose();
                  }}
                >
                  <Text style={[styles.dayText, selected && styles.dayTextSelected, disabled && styles.dayTextDisabled]}>
                    {cell.day}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <View style={styles.actions}>
            <Pressable style={styles.clearButton} onPress={onClear}>
              <Text style={styles.clearText}>Clear date</Text>
            </Pressable>
            <Pressable style={styles.cancelButton} onPress={onClose}>
              <Text style={styles.cancelText}>Cancel</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(11, 46, 31, 0.45)',
  },
  sheet: {
    backgroundColor: officerTheme.surfaceLowest,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    gap: 12,
    padding: 16,
    paddingBottom: 28,
  },
  title: {
    color: officerTheme.onSurface,
    fontFamily: officerTheme.fontFamilyBold,
    fontSize: 17,
  },
  monthRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  monthNav: {
    alignItems: 'center',
    height: 36,
    justifyContent: 'center',
    width: 36,
  },
  monthNavText: {
    color: officerTheme.primary,
    fontSize: 28,
    lineHeight: 30,
  },
  monthLabel: {
    color: officerTheme.onSurface,
    fontFamily: officerTheme.fontFamilySemiBold,
    fontSize: 15,
  },
  weekRow: {
    flexDirection: 'row',
  },
  weekday: {
    color: officerTheme.onSurfaceVariant,
    flex: 1,
    fontSize: 11,
    fontWeight: '700',
    textAlign: 'center',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dayCell: {
    alignItems: 'center',
    height: 40,
    justifyContent: 'center',
    marginVertical: 2,
    width: `${100 / 7}%`,
  },
  daySelected: {
    backgroundColor: officerTheme.primary,
    borderRadius: 20,
  },
  dayDisabled: {
    opacity: 0.35,
  },
  dayText: {
    color: officerTheme.onSurface,
    fontSize: 14,
    fontWeight: '600',
  },
  dayTextSelected: {
    color: officerTheme.onPrimary,
  },
  dayTextDisabled: {
    color: officerTheme.onSurfaceVariant,
  },
  actions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 4,
  },
  clearButton: {
    alignItems: 'center',
    borderColor: officerTheme.outlineVariant,
    borderRadius: 10,
    borderWidth: 1,
    flex: 1,
    minHeight: 44,
    justifyContent: 'center',
  },
  clearText: {
    color: officerTheme.onSurface,
    fontFamily: officerTheme.fontFamilySemiBold,
    fontSize: 14,
  },
  cancelButton: {
    alignItems: 'center',
    backgroundColor: officerTheme.surfaceLow,
    borderRadius: 10,
    flex: 1,
    justifyContent: 'center',
    minHeight: 44,
  },
  cancelText: {
    color: officerTheme.primary,
    fontFamily: officerTheme.fontFamilySemiBold,
    fontSize: 14,
  },
});
