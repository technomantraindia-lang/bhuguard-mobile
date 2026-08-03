import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { QAHealthSummary } from './QAHealthSummary';
import { QAModuleCard } from './QAModuleCard';

const MODULES = [
  'Mobile Environment',
  'Backend Health',
  'API Health',
  'Authentication',
  'Farmer',
  'Field Officer',
  'Artisan',
  'Artisan Pro',
  'Navigation',
  'Mapping',
  'Camera',
  'GPS',
  'Server Time',
  'Biochar Production',
  'Biochar Mixing',
  'Biochar Application',
  'Offline Sync',
  'Assets',
  'Translations',
] as const;

/**
 * Developer-only QA center. Visible only when __DEV__ or EXPO_PUBLIC_ENABLE_QA_CENTER=true.
 * Does not run Maestro from inside React Native.
 */
export function QATestCenterScreen() {
  const enabled =
    (typeof __DEV__ !== 'undefined' && __DEV__) ||
    process.env.EXPO_PUBLIC_ENABLE_QA_CENTER === 'true';

  if (!enabled) {
    return (
      <View style={styles.blocked}>
        <Text style={styles.blockedTitle}>QA Center disabled</Text>
        <Text style={styles.blockedBody}>Not available in production builds.</Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <Text style={styles.title}>Bhuguard QA Test Center</Text>
      <Text style={styles.subtitle}>
        Safe in-app diagnostics. Run full suites via Run-Bhuguard-Full-Test.bat / npm run qa:*.
      </Text>
      <QAHealthSummary />
      <View style={styles.grid}>
        {MODULES.map((name) => (
          <QAModuleCard key={name} title={name} status="UNKNOWN" />
        ))}
      </View>
      <Pressable
        style={styles.button}
        onPress={() => {
          // Intentionally no Maestro launch from RN.
        }}
        accessibilityRole="button"
        accessibilityLabel="Open latest report instructions"
      >
        <Text style={styles.buttonText}>Open report via Open-Latest-QA-Report.bat</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: 16, gap: 12, paddingBottom: 40 },
  title: { fontSize: 22, fontWeight: '800', color: '#0B2E1F' },
  subtitle: { fontSize: 13, color: '#456', lineHeight: 18 },
  grid: { gap: 8 },
  button: {
    marginTop: 8,
    backgroundColor: '#0B2E1F',
    borderRadius: 10,
    padding: 14,
  },
  buttonText: { color: '#fff', fontWeight: '700' },
  blocked: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  blockedTitle: { fontSize: 18, fontWeight: '800', marginBottom: 8 },
  blockedBody: { color: '#555', textAlign: 'center' },
});
