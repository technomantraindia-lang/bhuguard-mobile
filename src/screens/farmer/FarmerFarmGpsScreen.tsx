import { useEffect, useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import * as Location from 'expo-location';

import { getApiErrorMessage } from '../../api/authApi';
import { updateFarmerFarm } from '../../api/farmerApi';
import { AppButton } from '../../components/AppButton';
import { FarmerFarmsHeader } from '../../components/farmer/FarmerFarmsHeader';
import { BhuguardMaterialIcon } from '../../components/shared/BhuguardMaterialIcon';
import type { FarmerStackParamList } from '../../navigation/types';
import { dashboardShadow, dashboardTheme } from '../../theme/bhuguardDashboardTheme';
import { buildStaticMapUrl, openGoogleMaps } from '../../utils/farmMapHelpers';

type Props = NativeStackScreenProps<FarmerStackParamList, 'FarmerFarmGps'>;

export function FarmerFarmGpsScreen({ navigation, route }: Props) {
  const { farmId } = route.params;
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [accuracy, setAccuracy] = useState<number | null>(null);
  const [capturing, setCapturing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const captureLocation = async () => {
    setCapturing(true);
    setError(null);

    try {
      const permission = await Location.requestForegroundPermissionsAsync();

      if (!permission.granted) {
        setError('Location permission is required to map your farm boundary.');
        return;
      }

      const position = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      setLatitude(position.coords.latitude);
      setLongitude(position.coords.longitude);
      setAccuracy(position.coords.accuracy ?? null);
    } catch (err) {
      setError(getApiErrorMessage(err, 'Failed to capture GPS location.'));
    } finally {
      setCapturing(false);
    }
  };

  useEffect(() => {
    void captureLocation();
  }, []);

  const saveLocation = async () => {
    if (latitude === null || longitude === null) {
      setError('Capture GPS coordinates before saving.');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      await updateFarmerFarm(farmId, {
        gps_latitude: latitude,
        gps_longitude: longitude,
      });
      navigation.goBack();
    } catch (err) {
      setError(getApiErrorMessage(err, 'Failed to save farm GPS location.'));
    } finally {
      setSaving(false);
    }
  };

  const coordinates =
    latitude !== null && longitude !== null ? [{ latitude, longitude }] : [];
  const mapUrl = buildStaticMapUrl(coordinates, 640, 220);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <FarmerFarmsHeader
        showBack
        onBack={() => navigation.goBack()}
        onNotificationsPress={() => navigation.navigate('FarmerNotifications')}
      />

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Map Farm GPS</Text>
        <Text style={styles.subtitle}>
          Capture the exact farm location so land size and boundaries can be verified on Google Maps.
        </Text>

        <View style={[styles.mapCard, dashboardShadow]}>
          {mapUrl ? (
            <Image source={{ uri: mapUrl }} style={styles.mapImage} resizeMode="cover" />
          ) : (
            <View style={styles.mapPlaceholder}>
              <BhuguardMaterialIcon name="location_on" size={32} color={dashboardTheme.outline} />
              <Text style={styles.mapPlaceholderText}>Waiting for GPS capture…</Text>
            </View>
          )}
        </View>

        <View style={styles.coordsCard}>
          <Text style={styles.coordsLabel}>Latitude</Text>
          <Text style={styles.coordsValue}>{latitude ?? '—'}</Text>
          <Text style={styles.coordsLabel}>Longitude</Text>
          <Text style={styles.coordsValue}>{longitude ?? '—'}</Text>
          <Text style={styles.coordsLabel}>Accuracy</Text>
          <Text style={styles.coordsValue}>{accuracy ? `${accuracy.toFixed(1)} m` : '—'}</Text>
        </View>

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <AppButton label="Capture Current Location" onPress={captureLocation} loading={capturing} variant="secondary" />

        {latitude !== null && longitude !== null ? (
          <Pressable
            style={styles.mapsLink}
            onPress={() => openGoogleMaps({ latitude, longitude }, `Farm ${farmId}`)}
          >
            <Text style={styles.mapsLinkText}>Preview in Google Maps</Text>
          </Pressable>
        ) : null}

        <AppButton label="Save Farm Location" onPress={saveLocation} loading={saving} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: dashboardTheme.background,
  },
  content: {
    padding: dashboardTheme.marginMobile,
    gap: 16,
    paddingBottom: 32,
  },
  title: {
    fontSize: 24,
    lineHeight: 32,
    fontWeight: '700',
    color: dashboardTheme.onSurface,
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 20,
    color: dashboardTheme.onSurfaceVariant,
  },
  mapCard: {
    height: 220,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: dashboardTheme.outlineVariant,
  },
  mapImage: {
    width: '100%',
    height: '100%',
  },
  mapPlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: dashboardTheme.surfaceContainerLow,
  },
  mapPlaceholderText: {
    fontSize: 13,
    color: dashboardTheme.textMuted,
  },
  coordsCard: {
    backgroundColor: dashboardTheme.surfaceLowest,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: dashboardTheme.outlineVariant,
    padding: 16,
    gap: 4,
  },
  coordsLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: dashboardTheme.textMuted,
    marginTop: 4,
  },
  coordsValue: {
    fontSize: 15,
    fontWeight: '600',
    color: dashboardTheme.onSurface,
  },
  error: {
    fontSize: 13,
    color: dashboardTheme.error,
  },
  mapsLink: {
    alignSelf: 'center',
    paddingVertical: 8,
  },
  mapsLinkText: {
    fontSize: 14,
    fontWeight: '600',
    color: dashboardTheme.primaryContainer,
  },
});
