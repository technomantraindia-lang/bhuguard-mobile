import { memo, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import { useTranslation } from '../../i18n/I18nContext';
import { useServerTimeSync } from '../../hooks/useServerTimeSync';

function DeviceTimeWarningBannerComponent() {
  const { t } = useTranslation();
  const { isSuspiciousSkew, retrySync, syncing, lastSyncedServerIso, error } = useServerTimeSync({
    autoSync: false,
  });
  const [retrying, setRetrying] = useState(false);

  if (!isSuspiciousSkew) {
    return null;
  }

  const message = t('timeSync.suspiciousWarning');
  const busy = syncing || retrying;

  return (
    <View style={styles.wrap} accessibilityRole="alert" accessibilityLabel={message}>
      <Text style={styles.text}>{message}</Text>
      {lastSyncedServerIso ? (
        <Text style={styles.serverTime}>
          {t('timeSync.syncedServerTime')}: {new Date(lastSyncedServerIso).toLocaleString()}
        </Text>
      ) : null}
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <Pressable
        disabled={busy}
        onPress={() => {
          void (async () => {
            setRetrying(true);
            try {
              await retrySync();
            } finally {
              setRetrying(false);
            }
          })();
        }}
        accessibilityRole="button"
        accessibilityLabel={t('timeSync.retrySync')}
        style={styles.retryRow}
      >
        {busy ? <ActivityIndicator color="#FFFFFF" size="small" /> : null}
        <Text style={styles.retry}>{busy ? t('timeSync.retrying') : t('timeSync.retrySync')}</Text>
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
  serverTime: {
    color: '#FFD7D0',
    fontSize: 11,
    fontWeight: '500',
  },
  error: {
    color: '#FFC9C0',
    fontSize: 11,
  },
  retryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 2,
  },
  retry: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
    textDecorationLine: 'underline',
  },
});
