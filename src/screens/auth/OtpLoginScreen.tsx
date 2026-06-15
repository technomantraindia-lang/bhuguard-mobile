import { useState } from 'react';
import { StyleSheet, Text } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { AppButton } from '../../components/AppButton';
import { AppInput } from '../../components/AppInput';
import { StatusBadge } from '../../components/StatusBadge';
import type { RootStackParamList } from '../../navigation/types';
import { colors } from '../../theme';
import { AuthScreenShell } from './AuthScreenShell';

type Nav = NativeStackNavigationProp<RootStackParamList>;

export function OtpLoginScreen() {
  const navigation = useNavigation<Nav>();
  const [mobile, setMobile] = useState('');

  return (
    <AuthScreenShell
      title="OTP Login"
      subtitle="Self-registration OTP is disabled on backend"
      showBack
      footer={
        <AppButton label="Use password instead" variant="ghost" onPress={() => navigation.navigate('RoleSelection')} />
      }
    >
      <StatusBadge label="Use password or MPIN login" tone="warning" />
      <Text style={styles.note}>
        Farmer self-registration OTP is blocked on the API. Use password login, MPIN login, or forgot password OTP reset.
      </Text>
      <AppInput label="Mobile number" value={mobile} onChangeText={setMobile} keyboardType="phone-pad" placeholder="10-digit mobile" />
      <AppButton label="Forgot password OTP" variant="secondary" onPress={() => navigation.navigate('ForgotPassword')} />
      <AppButton
        label="MPIN login"
        variant="ghost"
        onPress={() =>
          navigation.navigate('MpinLogin', {
            mobile: /^\d{10}$/.test(mobile.trim()) ? mobile.trim() : undefined,
          })
        }
      />
    </AuthScreenShell>
  );
}

const styles = StyleSheet.create({
  note: { fontSize: 13, color: colors.textMuted, lineHeight: 18 },
});
