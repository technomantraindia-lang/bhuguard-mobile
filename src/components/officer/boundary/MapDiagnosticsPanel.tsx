import { StyleSheet, Text, View } from 'react-native';

import type { MapDiagnosticsSnapshot } from '../../../utils/mapDiagnostics';

interface MapDiagnosticsPanelProps {
  diagnostics: MapDiagnosticsSnapshot;
}

function yesNo(value: boolean): string {
  return value ? 'Yes' : 'No';
}

export function MapDiagnosticsPanel({ diagnostics }: MapDiagnosticsPanelProps) {
  if (!__DEV__) {
    return null;
  }

  return (
    <View style={styles.panel}>
      <Text style={styles.title}>Map Diagnostics (dev)</Text>
      <Text style={styles.row}>Native maps flag: {yesNo(diagnostics.nativeMapsFlag)}</Text>
      <Text style={styles.row}>API key present: {yesNo(diagnostics.apiKeyPresent)}</Text>
      <Text style={styles.row}>Location permission: {diagnostics.locationPermission}</Text>
      <Text style={styles.row}>Native runtime: {yesNo(diagnostics.nativeRuntimeDetected)}</Text>
      <Text style={styles.row}>Native provider: {yesNo(diagnostics.nativeProviderAvailable)}</Text>
      <Text style={styles.row}>Platform: {diagnostics.platform}</Text>
      {diagnostics.errorMessage ? (
        <Text style={styles.error}>{diagnostics.errorMessage}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  panel: {
    marginTop: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    backgroundColor: '#F9FAFB',
    padding: 12,
    gap: 4,
  },
  title: { fontSize: 12, fontWeight: '700', color: '#374151', marginBottom: 4 },
  row: { fontSize: 11, color: '#4B5563' },
  error: { fontSize: 11, color: '#B91C1C', marginTop: 4, fontWeight: '600' },
});
