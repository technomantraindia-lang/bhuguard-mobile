import { StyleSheet, Text, View } from 'react-native';

import { DEMO_LOGIN_OTP, DEMO_LOGIN_USERS, isDemoLoginEnabled } from '../../config/demoLogin';

export function DemoLoginHint() {
  if (!isDemoLoginEnabled()) {
    return null;
  }

  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>Demo access enabled</Text>
      <Text style={styles.line}>Farmer: {DEMO_LOGIN_USERS.farmer}</Text>
      <Text style={styles.line}>Field Officer: {DEMO_LOGIN_USERS.fieldOfficer}</Text>
      <Text style={styles.line}>Artisan: {DEMO_LOGIN_USERS.artisan}</Text>
      <Text style={styles.line}>Company: {DEMO_LOGIN_USERS.company}</Text>
      <Text style={styles.line}>OTP: {DEMO_LOGIN_OTP}</Text>
      <Text style={styles.line}>MPIN: {DEMO_LOGIN_OTP}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginTop: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.92)',
    borderWidth: 1,
    borderColor: 'rgba(11, 46, 31, 0.1)',
    gap: 2,
    alignSelf: 'stretch',
  },
  title: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0B2E1F',
    marginBottom: 4,
    textAlign: 'center',
  },
  line: {
    fontSize: 11,
    lineHeight: 16,
    color: 'rgba(11, 46, 31, 0.72)',
    textAlign: 'center',
  },
});
