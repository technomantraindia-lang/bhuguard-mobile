import { StyleSheet, Text, View } from 'react-native';

export function QAHealthSummary() {
  return (
    <View style={styles.card}>
      <Text style={styles.label}>Overall Health Score</Text>
      <Text style={styles.value}>See test-results/latest/reports/index.html</Text>
      <Text style={styles.hint}>
        This screen does not fabricate scores. Run npm run qa:full on the host to refresh evidence.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderColor: '#D7E0D5',
    backgroundColor: '#F6F8F5',
    borderRadius: 12,
    padding: 14,
    gap: 6,
  },
  label: { fontSize: 12, fontWeight: '700', color: '#0A7A32', textTransform: 'uppercase' },
  value: { fontSize: 16, fontWeight: '800', color: '#122' },
  hint: { fontSize: 12, color: '#556', lineHeight: 17 },
});
