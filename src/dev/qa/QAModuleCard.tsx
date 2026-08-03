import { StyleSheet, Text, View } from 'react-native';

export function QAModuleCard({
  title,
  status,
}: {
  title: string;
  status: 'PASS' | 'PARTIAL' | 'FAIL' | 'SKIPPED' | 'UNKNOWN';
}) {
  return (
    <View style={styles.card}>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.status}>{status}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderColor: '#E2E8DF',
    borderRadius: 10,
    padding: 12,
    backgroundColor: '#fff',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: { fontSize: 14, fontWeight: '700', color: '#122', flex: 1, paddingRight: 8 },
  status: { fontSize: 12, fontWeight: '800', color: '#666' },
});
