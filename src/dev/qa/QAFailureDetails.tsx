import { StyleSheet, Text, View } from 'react-native';

export function QAFailureDetails({ message }: { message: string }) {
  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>Failure details</Text>
      <Text style={styles.body}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 6 },
  title: { fontWeight: '800', color: '#B00020' },
  body: { color: '#333', lineHeight: 18 },
});
