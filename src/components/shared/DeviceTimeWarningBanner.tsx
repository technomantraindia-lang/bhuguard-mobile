import { memo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useTranslation } from '../../i18n/I18nContext';
import { useServerTimeSync } from '../../hooks/useServerTimeSync';

function DeviceTimeWarningBannerComponent() {
  const { t, language } = useTranslation();
  const { isSuspiciousSkew, retrySync } = useServerTimeSync({ autoSync: false });
  const [, bump] = useState(0);

  if (!isSuspiciousSkew) {
    return null;
  }

  const message =
    language === 'hi'
      ? t('timeSync.suspiciousWarningHi')
      : t('timeSync.suspiciousWarning');

  return (
    <View style={styles.wrap} accessibilityRole="alert" accessibilityLabel={message}>
      <Text style={styles.text}>{message}</Text>
      <Pressable
        onPress={() => {
          void (async () => {
            await retrySync();
            bump((n) => n + 1);
          })();
        }}
        accessibilityRole="button"
        accessibilityLabel={t('timeSync.retrySync')}
      >
        <Text style={styles.retry}>{t('timeSync.retrySync')}</Text>
      </Pressable>
    </View>
  );
}

export const DeviceTimeWarningBanner = memo(DeviceTimeWarningBannerComponent);

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: '#7A1212',
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 4,
  },
  text: {
    color: '#FFE8E4',
    fontSize: 12,
    fontWeight: '600',
  },
  retry: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
    textDecorationLine: 'underline',
  },
});
