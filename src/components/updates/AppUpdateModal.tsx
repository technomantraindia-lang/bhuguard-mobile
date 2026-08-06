import { ActivityIndicator, Modal, StyleSheet, Text, View } from 'react-native';

import { AppButton } from '../AppButton';
import type { AppUpdateStatus } from '../../services/AppUpdateService';
import { colors } from '../../theme/colors';

type Props = {
  visible: boolean;
  status: AppUpdateStatus;
  unsafeToReload: boolean;
  onLater: () => void;
  onUpdateNow: () => void;
  onRestartNow: () => void;
};

export function AppUpdateModal({ visible, status, unsafeToReload, onLater, onUpdateNow, onRestartNow }: Props) {
  const downloading = status === 'downloading';
  const downloaded = status === 'downloaded';

  const title = downloading ? 'Updating Bhuguard' : 'Bhuguard Update Available';
  const body = downloading
    ? 'Please wait while the latest update is downloaded.'
    : downloaded && unsafeToReload
      ? 'The update is ready. It will be applied after your current work is saved.'
      : 'A new version of Bhuguard is ready.';

  return (
    <Modal transparent visible={visible} animationType="fade" onRequestClose={onLater}>
      <View style={styles.overlay}>
        <View style={styles.card}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.body}>{body}</Text>

          {downloading ? (
            <View style={styles.loadingRow}>
              <ActivityIndicator color={colors.primary} />
              <Text style={styles.loadingText}>Downloading update...</Text>
            </View>
          ) : null}

          <View style={styles.actions}>
            {downloaded && unsafeToReload ? (
              <>
                <AppButton label="Restart Now" onPress={onRestartNow} />
                <AppButton label="Later" onPress={onLater} variant="secondary" />
              </>
            ) : (
              <>
                <AppButton label="Update Now" onPress={onUpdateNow} loading={downloading} disabled={downloading} />
                <AppButton label="Later" onPress={onLater} variant="secondary" disabled={downloading} />
              </>
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(3, 21, 13, 0.52)',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 18,
    padding: 20,
    borderWidth: 1,
    borderColor: '#D7E9DB',
    gap: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 18,
    elevation: 6,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.primaryDark,
  },
  body: {
    fontSize: 15,
    lineHeight: 22,
    color: '#2C3E30',
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  loadingText: {
    color: colors.textMuted,
    fontSize: 14,
  },
  actions: {
    gap: 10,
    marginTop: 6,
  },
});
