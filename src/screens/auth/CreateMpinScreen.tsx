import { useEffect, useState } from 'react';
import {
  BackHandler,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { getApiErrorMessage, resetMpin, setupMpin } from '../../api/authApi';
import { getValidatedColdStartUser } from '../../auth/startup/AuthStartupController';
import { AuthBackHeader } from '../../components/auth/AuthBackHeader';
import { AuthFlowBackground } from '../../components/auth/AuthFlowBackground';
import { PinBoxInput } from '../../components/auth/PinBoxInput';
import { SecurityNoteBanner } from '../../components/auth/SecurityNoteBanner';
import { KeyboardSafeScrollView } from '../../components/layout/KeyboardSafeScrollView';
import { BhuguardLogo } from '../../components/shared/BhuguardLogo';
import { LOGO_SIZES } from '../../constants/branding';
import { useTranslation } from '../../i18n/I18nContext';
import { safeAuthGoBack } from '../../navigation/safeAuthBack';
import { safeNavigationReset } from '../../navigation/safeNavigationReset';
import type { RootStackParamList } from '../../navigation/types';
import { getAuthUser, saveMpinProfile } from '../../storage/authStorage';
import { authBrand } from '../../theme/authBrand';
import { finishSecurityFlow, isWeakMpin } from '../../utils/securityFlow';

type Props = NativeStackScreenProps<RootStackParamList, 'CreateMpin'>;

export function CreateMpinScreen({ navigation, route }: Props) {
  const { t } = useTranslation();
  const mobile = route.params?.mobile ?? '';
  const flowOrigin = route.params?.flowOrigin;
  const mode = route.params?.mode ?? 'reset';
  const [newMpin, setNewMpin] = useState('');
  const [confirmMpin, setConfirmMpin] = useState('');
  const [activeField, setActiveField] = useState<'new' | 'confirm'>('new');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleBack = () => {
    safeAuthGoBack(navigation, 'MobileLogin');
  };

  useEffect(() => {
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      safeAuthGoBack(navigation, 'MobileLogin');
      return true;
    });

    return () => subscription.remove();
  }, [navigation]);

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

    const normalizedMobile = mobile.replace(/\D/g, '').slice(-10);

    if (mode !== 'setup' && !/^\d{10}$/.test(normalizedMobile)) {
      setError('Mobile number is missing. Verify OTP again.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      if (mode === 'setup') {
        const user = await setupMpin(newMpin);
        const stored = getValidatedColdStartUser() ?? (await getAuthUser()) ?? user;
        await saveMpinProfile({ mobile: stored.mobile || normalizedMobile, name: stored.name || '' });
        setSuccess('Security PIN created successfully.');

        setTimeout(() => {
          safeNavigationReset(navigation, {
            index: 0,
            routes: [
              {
                name: 'BiometricSetup',
                params: { mobile: stored.mobile || normalizedMobile, name: stored.name },
              },
            ],
          });
        }, 400);
        return;
      }

      await resetMpin(normalizedMobile, newMpin);
      await saveMpinProfile({ mobile: normalizedMobile, name: '' });
      setSuccess('Security PIN updated successfully.');

      setTimeout(() => {
        finishSecurityFlow(navigation, flowOrigin);
      }, 600);
    } catch (err) {
      setError(getApiErrorMessage(err, 'Failed to save MPIN.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.root}>
      <AuthFlowBackground />
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <AuthBackHeader onBack={handleBack} />
        <KeyboardSafeScrollView contentContainerStyle={styles.scroll} extraBottomPadding={32}>
            <View style={styles.card}>
              <View style={styles.logoWrap}>
                <BhuguardLogo size={LOGO_SIZES.moduleHeader} />
              </View>

              <View style={styles.header}>
                <Text style={styles.title}>{mode === 'setup' ? t('mpinSetup.title') : 'Set Security PIN'}</Text>
                <Text style={styles.subtitle}>
                  {mode === 'setup'
                    ? t('mpinSetup.subtitle')
                    : 'Create a 6-digit MPIN for faster and secure access to your DMRV account.'}
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
                style={({ pressed }) => [
                  styles.button,
                  pressed && styles.buttonPressed,
                  loading && styles.buttonDisabled,
                ]}
                onPress={() => void save()}
                disabled={loading}
              >
                <Text style={styles.buttonText}>
                  {loading ? t('common.loading') : mode === 'setup' ? t('mpinSetup.save') : 'Save & Continue'}
                </Text>
              </Pressable>
            </View>
        </KeyboardSafeScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: authBrand.neutral,
  },
  safe: {
    flex: 1,
  },
  flex: {
    flex: 1,
  },
  scroll: {
    flexGrow: 1,
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  card: {
    backgroundColor: authBrand.card,
    borderRadius: 28,
    borderWidth: 1,
    borderColor: authBrand.cardBorder,
    paddingHorizontal: 20,
    paddingVertical: 24,
    gap: 22,
  },
  logoWrap: {
    alignItems: 'center',
  },
  header: {
    gap: 10,
  },
  title: {
    fontSize: 28,
    lineHeight: 34,
    fontWeight: '700',
    color: authBrand.tertiary,
  },
  subtitle: {
    fontSize: 15,
    lineHeight: 22,
    color: authBrand.textMuted,
  },
  error: {
    fontSize: 13,
    color: authBrand.error,
  },
  success: {
    fontSize: 13,
    color: authBrand.primary,
    fontWeight: '700',
  },
  button: {
    marginTop: 4,
    height: 54,
    borderRadius: 16,
    backgroundColor: authBrand.primary,
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
    fontWeight: '800',
    color: authBrand.onPrimary,
  },
});
