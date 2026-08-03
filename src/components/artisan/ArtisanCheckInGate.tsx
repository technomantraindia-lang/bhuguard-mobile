import { ActivityIndicator, Alert, StyleSheet, Text, View } from 'react-native';
import { useEffect } from 'react';
import { BackHandler } from 'react-native';

import { AppButton } from '../AppButton';
import { useLogout } from '../../hooks/useLogout';
import { useArtisanMandatoryCheckIn } from '../../hooks/useArtisanMandatoryCheckIn';

type Props = {
  children: React.ReactNode;
};

/**
 * Blocks Artisan dashboard until an active work check-in exists.
 * Fail-closed; Logout or Retry only.
 */
export function ArtisanCheckInGate({ children }: Props) {
  const checkIn = useArtisanMandatoryCheckIn();
  const logout = useLogout();

  useEffect(() => {
    if (checkIn.phase === 'granted') {
      return;
    }
    const sub = BackHandler.addEventListener('hardwareBackPress', () => true);
    return () => sub.remove();
  }, [checkIn.phase]);

  if (checkIn.phase === 'granted') {
    return <>{children}</>;
  }

  if (checkIn.phase === 'checkingStatus') {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#0F7A45" />
        <Text style={styles.text}>Checking your check-in status…</Text>
      </View>
    );
  }

  return (
    <View style={styles.center}>
      <Text style={styles.title}>Daily Check-in Required</Text>
      <Text style={styles.text}>
        Complete your Artisan check-in before using the dashboard. Bhuguard uses high-accuracy GPS and server time.
      </Text>
      {checkIn.statusMessage || checkIn.submitError ? (
        <Text style={styles.error}>{checkIn.submitError || checkIn.statusMessage}</Text>
      ) : null}
      <AppButton
        label={checkIn.submitting ? 'Checking in…' : 'Check in now'}
        onPress={() => {
          void checkIn.submitCheckIn();
        }}
        loading={checkIn.submitting}
        disabled={checkIn.submitting}
      />
      <AppButton
        label="Retry"
        variant="secondary"
        onPress={checkIn.checkStatus}
        disabled={checkIn.submitting}
        style={styles.gap}
      />
      <AppButton
        label="Logout"
        variant="ghost"
        onPress={() => {
          Alert.alert('Log out?', 'You must check in to use the Artisan app.', [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Logout', style: 'destructive', onPress: () => void logout() },
          ]);
        }}
        disabled={checkIn.submitting}
        style={styles.gap}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    justifyContent: 'center',
    padding: 24,
    gap: 12,
    backgroundColor: '#F3F8F1',
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0B2E1F',
    textAlign: 'center',
  },
  text: {
    fontSize: 14,
    color: 'rgba(11,46,31,0.75)',
    textAlign: 'center',
    marginBottom: 8,
  },
  error: {
    color: '#B53B3B',
    textAlign: 'center',
    fontWeight: '600',
  },
  gap: {
    marginTop: 4,
  },
});
