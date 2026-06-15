import { useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { dashboardTheme } from '../../../theme/bhuguardDashboardTheme';
import { isCoordinateValid } from '../../../utils/boundaryGeometry';

interface AddManualCoordinateModalProps {
  visible: boolean;
  onAdd: (payload: { latitude: number; longitude: number; label?: string; notes?: string }) => void;
  onClose: () => void;
}

export function AddManualCoordinateModal({ visible, onAdd, onClose }: AddManualCoordinateModalProps) {
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  const [label, setLabel] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleAdd = () => {
    if (!latitude.trim() || !longitude.trim()) {
      setError('Latitude and longitude are required.');
      return;
    }

    if (!isCoordinateValid(latitude, longitude)) {
      setError('Enter valid coordinate values.');
      return;
    }

    onAdd({
      latitude: Number(latitude),
      longitude: Number(longitude),
      label: label.trim() || undefined,
      notes: notes.trim() || undefined,
    });
    setLatitude('');
    setLongitude('');
    setLabel('');
    setNotes('');
    setError(null);
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.card}>
          <Text style={styles.title}>Add Manual Coordinate</Text>

          <Field label="Latitude" value={latitude} onChangeText={setLatitude} keyboardType="decimal-pad" />
          <Field label="Longitude" value={longitude} onChangeText={setLongitude} keyboardType="decimal-pad" />
          <Field label="Point Label" value={label} onChangeText={setLabel} />
          <Field label="Notes" value={notes} onChangeText={setNotes} multiline />

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <Pressable style={styles.primaryButton} onPress={handleAdd}>
            <Text style={styles.primaryButtonText}>Add Point</Text>
          </Pressable>
          <Pressable style={styles.cancelButton} onPress={onClose}>
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

function Field({
  label,
  value,
  onChangeText,
  keyboardType,
  multiline,
}: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  keyboardType?: 'decimal-pad' | 'default';
  multiline?: boolean;
}) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        style={[styles.input, multiline && styles.inputMultiline]}
        keyboardType={keyboardType}
        multiline={multiline}
        placeholderTextColor={dashboardTheme.textMuted}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    padding: 20,
  },
  card: {
    backgroundColor: dashboardTheme.surfaceLowest,
    borderRadius: 16,
    padding: 16,
    gap: 10,
  },
  title: { fontSize: 18, fontWeight: '700', color: dashboardTheme.onSurface },
  field: { gap: 6 },
  label: { fontSize: 13, fontWeight: '600', color: dashboardTheme.onSurfaceVariant },
  input: {
    borderWidth: 1,
    borderColor: dashboardTheme.outlineVariant,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 11,
    fontSize: 15,
    color: dashboardTheme.onSurface,
    backgroundColor: dashboardTheme.background,
  },
  inputMultiline: { minHeight: 72, textAlignVertical: 'top' },
  error: { fontSize: 12, color: dashboardTheme.error, fontWeight: '600' },
  primaryButton: {
    backgroundColor: dashboardTheme.primaryContainer,
    borderRadius: 10,
    paddingVertical: 13,
    alignItems: 'center',
    marginTop: 4,
  },
  primaryButtonText: { fontSize: 15, fontWeight: '700', color: dashboardTheme.onPrimary },
  cancelButton: { alignItems: 'center', paddingVertical: 10 },
  cancelButtonText: { fontSize: 15, fontWeight: '700', color: dashboardTheme.primaryContainer },
});
