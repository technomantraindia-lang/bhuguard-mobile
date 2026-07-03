import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { AuthField } from '../../components/auth/AuthField';
import { BhuguardLogo } from '../../components/shared/BhuguardLogo';
import { LOGO_SIZES } from '../../constants/branding';
import { syncApiClientBaseUrl } from '../../api/client';
import { API_BASE_URL } from '../../config/apiConfig';
import { LOCAL_API_BASE_URL } from '../../config/env';
import { useTranslation } from '../../i18n/I18nContext';
import type { RootStackParamList } from '../../navigation/types';
import {
  clearApiBaseUrlOverride,
  getApiBaseUrl,
  getApiOrigin,
  saveApiBaseUrl,
  testApiConnection,
} from '../../storage/apiConfigStorage';
import { colors, spacing } from '../../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'ApiServerSettings'>;

export function ApiServerSettingsScreen({ navigation }: Props) {
  const { t } = useTranslation();
  const [input, setInput] = useState('');
  const [testing, setTesting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [statusOk, setStatusOk] = useState<boolean | null>(null);

  const loadCurrent = useCallback(async () => {
    const current = await getApiBaseUrl();
    setInput(getApiOrigin(current));
  }, []);

  useEffect(() => {
    void loadCurrent();
  }, [loadCurrent]);

  const handleTest = async () => {
    setTesting(true);
    setStatusMessage(null);
    setStatusOk(null);

    try {
      const result = await testApiConnection(input);
      setStatusOk(result.ok);
      setStatusMessage(result.message);
    } finally {
      setTesting(false);
    }
  };

  const handleSave = async () => {
    if (!input.trim()) {
      Alert.alert(t('apiServer.title'), t('apiServer.emptyUrl'));
      return;
    }

    setSaving(true);

    try {
      const result = await testApiConnection(input);

      if (!result.ok) {
        setStatusOk(false);
        setStatusMessage(result.message);
        Alert.alert(t('apiServer.title'), t('apiServer.saveFailed'));
        return;
      }

      await saveApiBaseUrl(input);
      await syncApiClientBaseUrl();
      setStatusOk(true);
      setStatusMessage(result.message);
      Alert.alert(t('apiServer.title'), t('apiServer.saved'), [
        { text: t('common.continue'), onPress: () => navigation.goBack() },
      ]);
    } finally {
      setSaving(false);
    }
  };

  const handleUseLocalServer = () => {
    setInput(getApiOrigin(LOCAL_API_BASE_URL));
    setStatusMessage(null);
    setStatusOk(null);
  };

  const handleReset = async () => {
    await clearApiBaseUrlOverride();
    await syncApiClientBaseUrl();
    setInput(getApiOrigin(API_BASE_URL));
    setStatusMessage(null);
    setStatusOk(null);
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
          <Pressable onPress={() => navigation.goBack()} style={styles.backButton}>
            <Text style={styles.backText}>← {t('common.back')}</Text>
          </Pressable>

          <View style={styles.header}>
            <BhuguardLogo size={LOGO_SIZES.login} />
            <Text style={styles.title}>{t('apiServer.title')}</Text>
            <Text style={styles.subtitle}>{t('apiServer.subtitle')}</Text>
          </View>

          <View style={styles.helpBox}>
            <Text style={styles.helpTitle}>{t('apiServer.helpTitle')}</Text>
            <Text style={styles.helpText}>{t('apiServer.helpSteps')}</Text>
            <Text style={styles.helpExample}>{t('apiServer.example')}</Text>
          </View>

          <View style={styles.presetRow}>
            <Pressable style={styles.presetButton} onPress={handleUseLocalServer}>
              <Text style={styles.presetButtonText}>{t('apiServer.useLocalPreset')}</Text>
            </Pressable>
          </View>

          <AuthField
            label={t('apiServer.urlLabel')}
            value={input}
            onChangeText={setInput}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="url"
            placeholder="https://yourdomain.com"
            editable={!testing && !saving}
          />

          <Text style={styles.note}>{t('apiServer.urlNote')}</Text>

          {statusMessage ? (
            <Text style={[styles.status, statusOk ? styles.statusOk : styles.statusError]}>{statusMessage}</Text>
          ) : null}

          <Pressable
            style={[styles.secondaryButton, (testing || saving) && styles.buttonDisabled]}
            onPress={() => void handleTest()}
            disabled={testing || saving}
          >
            {testing ? (
              <ActivityIndicator color={colors.primary} />
            ) : (
              <Text style={styles.secondaryButtonText}>{t('apiServer.test')}</Text>
            )}
          </Pressable>

          <Pressable
            style={[styles.primaryButton, (testing || saving) && styles.buttonDisabled]}
            onPress={() => void handleSave()}
            disabled={testing || saving}
          >
            {saving ? (
              <ActivityIndicator color={colors.white} />
            ) : (
              <Text style={styles.primaryButtonText}>{t('apiServer.save')}</Text>
            )}
          </Pressable>

          <Pressable onPress={() => void handleReset()} style={styles.resetLink}>
            <Text style={styles.resetText}>{t('apiServer.reset')}</Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#F6FAF4',
  },
  flex: { flex: 1 },
  container: {
    paddingHorizontal: spacing.xxl,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xxxl,
    gap: spacing.md,
  },
  backButton: {
    alignSelf: 'flex-start',
  },
  backText: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: '600',
  },
  header: {
    alignItems: 'center',
    gap: 8,
    marginBottom: spacing.sm,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.primary,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 21,
    color: colors.textMuted,
    textAlign: 'center',
  },
  helpBox: {
    borderRadius: 14,
    backgroundColor: '#E8F5ED',
    padding: 14,
    gap: 6,
  },
  helpTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#2F4F3A',
  },
  helpText: {
    fontSize: 13,
    lineHeight: 19,
    color: '#3F5F4C',
  },
  helpExample: {
    fontSize: 12,
    lineHeight: 18,
    color: '#5A7262',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  status: {
    fontSize: 13,
    lineHeight: 19,
  },
  statusOk: {
    color: colors.primary,
  },
  statusError: {
    color: colors.error,
  },
  note: {
    fontSize: 12,
    lineHeight: 18,
    color: colors.textMuted,
    marginTop: -4,
  },
  primaryButton: {
    backgroundColor: colors.primary,
    borderRadius: 14,
    minHeight: 52,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryButton: {
    borderRadius: 14,
    minHeight: 52,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: colors.primary,
    backgroundColor: colors.white,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  primaryButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '700',
  },
  secondaryButtonText: {
    color: colors.primary,
    fontSize: 16,
    fontWeight: '700',
  },
  resetLink: {
    alignSelf: 'center',
    marginTop: 4,
  },
  resetText: {
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: '600',
  },
  presetRow: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  presetButton: {
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.primary,
    backgroundColor: '#E8F5ED',
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  presetButtonText: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: '700',
  },
});
