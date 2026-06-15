import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { dashboardTheme } from '../../../theme/bhuguardDashboardTheme';
import type { BoundaryPoint } from '../../../utils/boundaryGeometry';

interface CapturedPointsBottomSheetProps {
  visible: boolean;
  points: BoundaryPoint[];
  onClose: () => void;
  onDeletePoint: (id: string) => void;
  onAddManual: () => void;
}

export function CapturedPointsBottomSheet({
  visible,
  points,
  onClose,
  onDeletePoint,
  onAddManual,
}: CapturedPointsBottomSheetProps) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Pressable style={styles.backdrop} onPress={onClose} />
        <View style={styles.sheet}>
          <Text style={styles.title}>Captured Points ({points.length})</Text>

          <ScrollView style={styles.list} showsVerticalScrollIndicator={false}>
            {points.map((point) => (
              <View key={point.id} style={styles.pointCard}>
                <View style={styles.pointHeader}>
                  <Text style={styles.pointTitle}>Point {point.pointNo}</Text>
                  <Pressable onPress={() => onDeletePoint(point.id)}>
                    <Text style={styles.deleteText}>Delete</Text>
                  </Pressable>
                </View>
                <Text style={styles.meta}>Lat: {point.latitude.toFixed(4)}</Text>
                <Text style={styles.meta}>Long: {point.longitude.toFixed(4)}</Text>
                <Text style={styles.metaSmall}>
                  {new Date(point.timestamp).toLocaleString()} · GPS ±{point.accuracy.toFixed(0)}m
                </Text>
              </View>
            ))}
          </ScrollView>

          <Pressable style={styles.addButton} onPress={onAddManual}>
            <Text style={styles.addButtonText}>Add Manual Coordinate</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end' },
  backdrop: { ...StyleSheet.absoluteFill, backgroundColor: 'rgba(0,0,0,0.35)' },
  sheet: {
    backgroundColor: dashboardTheme.surfaceLowest,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 16,
    maxHeight: '72%',
    gap: 12,
  },
  title: { fontSize: 18, fontWeight: '700', color: dashboardTheme.onSurface },
  list: { maxHeight: 360 },
  pointCard: {
    backgroundColor: dashboardTheme.background,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: dashboardTheme.outlineVariant,
    padding: 12,
    marginBottom: 8,
    gap: 4,
  },
  pointHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  pointTitle: { fontSize: 15, fontWeight: '700', color: dashboardTheme.headingGreen },
  deleteText: { fontSize: 13, fontWeight: '700', color: dashboardTheme.error },
  meta: { fontSize: 14, color: dashboardTheme.onSurface },
  metaSmall: { fontSize: 12, color: dashboardTheme.textMuted },
  addButton: {
    backgroundColor: dashboardTheme.primaryContainer,
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
  },
  addButtonText: { fontSize: 15, fontWeight: '700', color: dashboardTheme.onPrimary },
});
