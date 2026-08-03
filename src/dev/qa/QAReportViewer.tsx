import { StyleSheet, Text, View } from 'react-native';

export function QAReportViewer() {
  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>Latest report</Text>
      <Text style={styles.body}>
        Open `test-results/latest/reports/index.html` on the host machine via Open-Latest-QA-Report.bat.
        In-app browsing of local HTML reports is not supported on device builds.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 6 },
  title: { fontWeight: '800', color: '#0B2E1F' },
  body: { color: '#333', lineHeight: 18 },
});
