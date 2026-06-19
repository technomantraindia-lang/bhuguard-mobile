import { StyleSheet, Text, View } from 'react-native';

import { useTranslation } from '../i18n/I18nContext';
import { navigateToApiServerSettings } from '../navigation/navigationRef';
import { colors } from '../theme/colors';
import { AppButton } from './AppButton';

interface ErrorStateProps {
  message: string;
  onRetry?: () => void;
}

function isApiReachabilityError(message: string): boolean {
  return (
    message.includes('Cannot reach API') ||
    message.includes('Cannot reach http') ||
    message.includes('No API URL configured')
  );
}

export function ErrorState({ message, onRetry }: ErrorStateProps) {
  const { t } = useTranslation();
  const showServerSettings = isApiReachabilityError(message);

  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>{t('errors.somethingWrong')}</Text>
      <Text style={styles.message}>{message}</Text>
      {onRetry ? <AppButton label={t('common.retry')} onPress={onRetry} style={styles.button} /> : null}
      {showServerSettings ? (
        <AppButton
          label={t('apiServer.openSettings')}
          onPress={navigateToApiServerSettings}
          variant="secondary"
          style={styles.button}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    gap: 10,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.error,
  },
  message: {
    fontSize: 14,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 20,
  },
  button: {
    marginTop: 8,
    alignSelf: 'stretch',
  },
});
