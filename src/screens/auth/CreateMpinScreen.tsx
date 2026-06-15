import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { getApiErrorMessage, resetMpin } from '../../api/authApi';
import { AuthBackHeader } from '../../components/auth/AuthBackHeader';
import { PinBoxInput } from '../../components/auth/PinBoxInput';
import { SecurityNoteBanner } from '../../components/auth/SecurityNoteBanner';
import type { SecurityScreensParamList } from '../../navigation/types';
import { saveMpinProfile } from '../../storage/authStorage';
import { dashboardTheme } from '../../theme/bhuguardDashboardTheme';
import { finishSecurityFlow, isWeakMpin } from '../../utils/securityFlow';

type Props = NativeStackScreenProps<SecurityScreensParamList, 'CreateMpin'>;

export function CreateMpinScreen({ navigation, route }: Props) {
  const mobile = route.params?.mobile ?? '';
  const flowOrigin = route.params?.flowOrigin;
  const [newMpin, setNewMpin] = useState('');
  const [confirmMpin, setConfirmMpin] = useState('');
  const [activeField, setActiveField] = useState<'new' | 'confirm'>('new');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const save = async () => {
    if (newMpin.length !== 6 || confirmMpin.length !== 6) {
      setError('Enter a 6-digit MPIN in both fields.');
      return;
    }

    if (isWeakMpin(newMpin)) {
      setError('Choose a stronger MPIN. Avoid simple or repeating patterns.');
      return;
    }

    if (newMpin !== confirmMpin) {
      setError('MPIN entries do not match.');
      return;
    }

    if (!/^\d{10}$/.test(mobile.replace(/\D/g, '').slice(-10))) {
      setError('Mobile number is missing. Verify OTP again.');
      return;
    }

    const normalizedMobile = mobile.replace(/\D/g, '').slice(-10);

    setLoading(true);
    setError(null);

    try {
      await resetMpin(normalizedMobile, newMpin);
      await saveMpinProfile({ mobile: normalizedMobile, name: '' });
      setSuccess('Security PIN updated successfully.');

      setTimeout(() => {
        finishSecurityFlow(navigation, flowOrigin);
      }, 600);
    } catch (err) {
      setError(getApiErrorMessage(err, 'Failed to save MPIN. Verify OTP first.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <AuthBackHeader />
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <View style={styles.header}>
            <Text style={styles.title}>Set Security PIN</Text>
            <Text style={styles.subtitle}>
              Create a 6-digit MPIN for faster and secure access to your DMRV account.
            </Text>
          </View>

          <Pressable onPress={() => setActiveField('new')}>
            <PinBoxInput
              label="New MPIN"
              value={newMpin}
              onChange={(value) => {
                setActiveField('new');
                setNewMpin(value);
                if (value.length === 6) {
                  setActiveField('confirm');
                }
              }}
              autoFocus={activeField === 'new'}
            />
          </Pressable>

          <Pressable onPress={() => setActiveField('confirm')}>
            <PinBoxInput
              label="Confirm MPIN"
              value={confirmMpin}
              onChange={(value) => {
                setActiveField('confirm');
                setConfirmMpin(value);
              }}
              autoFocus={activeField === 'confirm'}
            />
          </Pressable>

          <SecurityNoteBanner />

          {error ? <Text style={styles.error}>{error}</Text> : null}
          {success ? <Text style={styles.success}>{success}</Text> : null}

          <Pressable
            style={({ pressed }) => [styles.button, pressed && styles.buttonPressed, loading && styles.buttonDisabled]}
            onPress={save}
            disabled={loading}
          >
            <Text style={styles.buttonText}>{loading ? 'Saving…' : 'Save & Continue'}</Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: dashboardTheme.surfaceLowest,
  },
  flex: {
    flex: 1,
  },
  scroll: {
    flexGrow: 1,
    paddingHorizontal: dashboardTheme.marginMobile,
    paddingBottom: 24,
    gap: 24,
  },
  header: {
    marginTop: 8,
    gap: 10,
  },
  title: {
    fontSize: 32,
    lineHeight: 38,
    fontWeight: '700',
    color: dashboardTheme.onSurface,
  },
  subtitle: {
    fontSize: 15,
    lineHeight: 22,
    color: dashboardTheme.onSurfaceVariant,
  },
  error: {
    fontSize: 13,
    color: dashboardTheme.error,
  },
  success: {
    fontSize: 13,
    color: dashboardTheme.successGreen,
    fontWeight: '600',
  },
  button: {
    marginTop: 8,
    height: 52,
    borderRadius: 26,
    backgroundColor: dashboardTheme.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonPressed: {
    opacity: 0.92,
    transform: [{ scale: 0.98 }],
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '700',
    color: dashboardTheme.onPrimary,
  },
});
