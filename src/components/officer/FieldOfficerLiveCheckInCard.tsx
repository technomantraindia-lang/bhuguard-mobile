import { useCallback, useEffect, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import * as Location from 'expo-location';

import { getApiErrorMessage } from '../../api/authApi';
import {
  fieldOfficerLiveCheckIn,
  fieldOfficerLiveCheckOut,
  getFieldOfficerCheckInStatus,
} from '../../api/fieldOfficerApi';
import { BhuguardMaterialIcon } from '../shared/BhuguardMaterialIcon';
import { officerCardShadow, officerTheme } from '../../theme/officerDashboardTheme';
import { pickString, type ApiRecord } from '../../utils/apiHelpers';
import { invalidateCheckInGate } from '../../utils/checkInGateEvents';

export function FieldOfficerLiveCheckInCard() {
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [status, setStatus] = useState<ApiRecord | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getFieldOfficerCheckInStatus();
      const payload = data as ApiRecord;
      setStatus((payload.check_in_status ?? payload) as ApiRecord);
    } catch {
      setStatus(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const captureGps = async () => {
    const permission = await Location.requestForegroundPermissionsAsync();
    if (!permission.granted) {
      throw new Error('Location permission is required for live check-in.');
    }

    const position = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });

    return {
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
      accuracy: position.coords.accuracy ?? undefined,
    };
  };

  const handleCheckIn = async () => {
    setSubmitting(true);
    try {
      const gps = await captureGps();
      await fieldOfficerLiveCheckIn(gps);
      await load();
      Alert.alert('Checked in', 'Your live field location has been recorded.');
    } catch (error) {
      Alert.alert('Check-in failed', getApiErrorMessage(error, 'Unable to check in.'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleCheckOut = async () => {
    setSubmitting(true);
    try {
      const gps = await captureGps();
      await fieldOfficerLiveCheckOut(gps);
      await load();
      invalidateCheckInGate();
      Alert.alert('Checked out', 'Your field session has been closed. Check in again to continue.');
    } catch (error) {
      Alert.alert('Check-out failed', getApiErrorMessage(error, 'Unable to check out.'));
    } finally {
      setSubmitting(false);
    }
  };

  const isCheckedIn = status?.is_checked_in === true;
  const checkIn = (status?.check_in ?? {}) as ApiRecord;
  const village = pickString(checkIn, 'village_name');
  const accuracy = pickString(checkIn, 'gps_accuracy');
  const lastUpdate = pickString(checkIn, 'last_location_update_at');

  return (
    <View style={[styles.card, officerCardShadow]}>
      <View style={styles.header}>
        <BhuguardMaterialIcon name="share_location" size={22} color={officerTheme.primary} />
        <Text style={styles.title}>Live Check-in</Text>
        <View style={[styles.badge, isCheckedIn ? styles.badgeIn : styles.badgeOut]}>
          <Text style={styles.badgeText}>{isCheckedIn ? 'Checked In' : 'Checked Out'}</Text>
        </View>
      </View>

      {!loading ? (
        <View style={styles.meta}>
          {village !== '-' ? <Text style={styles.metaLine}>Village: {village}</Text> : null}
          {accuracy !== '-' ? <Text style={styles.metaLine}>GPS accuracy: {accuracy} m</Text> : null}
          {lastUpdate !== '-' ? <Text style={styles.metaLine}>Last update: {lastUpdate}</Text> : null}
        </View>
      ) : (
        <Text style={styles.metaLine}>Loading check-in status...</Text>
      )}

      <Pressable
        style={[styles.button, submitting && styles.buttonDisabled]}
        onPress={() => void (isCheckedIn ? handleCheckOut() : handleCheckIn())}
        disabled={submitting}
      >
        <Text style={styles.buttonText}>
          {submitting ? 'Please wait...' : isCheckedIn ? 'Check Out' : 'Live Check-in'}
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: officerTheme.surface,
    borderRadius: 14,
    padding: 16,
    gap: 12,
    marginBottom: 16,
  },
  header: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  title: { flex: 1, fontSize: 16, fontWeight: '700', color: officerTheme.onSurface },
  badge: { borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4 },
  badgeIn: { backgroundColor: '#DCFCE7' },
  badgeOut: { backgroundColor: '#F3F4F6' },
  badgeText: { fontSize: 12, fontWeight: '700', color: officerTheme.onSurface },
  meta: { gap: 4 },
  metaLine: { fontSize: 13, color: officerTheme.onSurfaceVariant },
  button: {
    backgroundColor: officerTheme.primary,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: officerTheme.onPrimary, fontWeight: '700', fontSize: 15 },
});
