import { useEffect, useState } from 'react';
import { ActivityIndicator, Image, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';

import { getFarmerFarmBoundary } from '../../../../api/farmerApi';
import { BoundaryFlowHeader } from '../../../../components/farmer/boundary/BoundaryFlowHeader';
import { useProfilePhotoDisplay } from '../../../../hooks/useProfilePhotoDisplay';
import type { FarmerStackParamList } from '../../../../navigation/types';
import { dashboardTheme } from '../../../../theme/bhuguardDashboardTheme';
import { pickString, type ApiRecord } from '../../../../utils/apiHelpers';
import { formatGpsAccuracy } from '../../../../utils/boundaryGeometry';
import { resolveMediaUrl } from '../../../../utils/mediaUrl';

type Props = NativeStackScreenProps<FarmerStackParamList, 'BoundaryPhotoGallery'>;

interface GalleryPoint {
  id: string;
  pointNo: number;
  latitude: number;
  longitude: number;
  timestamp: string;
  accuracy: number;
  photoUrl: string;
}

function GalleryPointPhoto({ photoUrl }: { photoUrl: string }) {
  const displayUri = useProfilePhotoDisplay(photoUrl);

  if (!displayUri) {
    return <View style={styles.photoFallback} />;
  }

  return <Image source={{ uri: displayUri }} style={styles.photo} />;
}

export function BoundaryPhotoGalleryScreen({ route }: Props) {
  const navigation = useNavigation();
  const { farmId } = route.params;
  const [loading, setLoading] = useState(true);
  const [points, setPoints] = useState<GalleryPoint[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    async function load() {
      setLoading(true);
      setError(null);

      try {
        const data = (await getFarmerFarmBoundary(farmId)) as ApiRecord;
        const boundary = (data.boundary ?? data) as ApiRecord;
        const rawPoints = Array.isArray(boundary.boundary_points) ? boundary.boundary_points : [];

        const mapped = rawPoints
          .map((item, index) => {
            if (!item || typeof item !== 'object') {
              return null;
            }

            const record = item as ApiRecord;
            const photoUrl = resolveMediaUrl(pickString(record, 'photo_url'));

            if (!photoUrl) {
              return null;
            }

            return {
              id: String(record.id ?? index),
              pointNo: Number(record.point_no ?? index + 1),
              latitude: Number(record.latitude),
              longitude: Number(record.longitude),
              timestamp: pickString(record, 'timestamp') !== '-' ? pickString(record, 'timestamp') : '—',
              accuracy: Number(record.accuracy ?? 0),
              photoUrl,
            };
          })
          .filter((point): point is GalleryPoint => point !== null);

        if (mounted) {
          setPoints(mapped);
        }
      } catch {
        if (mounted) {
          setError('Could not load boundary photos.');
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    void load();

    return () => {
      mounted = false;
    };
  }, [farmId]);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <BoundaryFlowHeader
        title="Boundary Photos"
        subtitle="Photos captured at each farm corner."
        onBack={() => navigation.goBack()}
      />

      {loading ? (
        <ActivityIndicator size="large" color={dashboardTheme.primaryContainer} style={styles.loader} />
      ) : error ? (
        <Text style={styles.error}>{error}</Text>
      ) : points.length === 0 ? (
        <Text style={styles.empty}>No boundary photos found for this farm.</Text>
      ) : (
        <ScrollView contentContainerStyle={styles.content}>
          {points.map((point) => (
            <View key={point.id} style={styles.card}>
              <Text style={styles.title}>Point {point.pointNo}</Text>
              <GalleryPointPhoto photoUrl={point.photoUrl} />
              <Text style={styles.meta}>Latitude: {point.latitude.toFixed(5)}</Text>
              <Text style={styles.meta}>Longitude: {point.longitude.toFixed(5)}</Text>
              <Text style={styles.meta}>Timestamp: {point.timestamp}</Text>
              <Text style={styles.meta}>GPS Accuracy: {formatGpsAccuracy(point.accuracy)}</Text>
            </View>
          ))}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: dashboardTheme.background },
  loader: { marginTop: 40 },
  content: { padding: dashboardTheme.marginMobile, gap: 12, paddingBottom: 40 },
  card: {
    backgroundColor: dashboardTheme.surfaceLowest,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: dashboardTheme.outlineVariant,
    gap: 8,
  },
  title: { fontSize: 16, fontWeight: '700', color: dashboardTheme.headingGreen },
  photo: { width: '100%', height: 200, borderRadius: 10, backgroundColor: dashboardTheme.surfaceLow },
  photoFallback: { width: '100%', height: 200, borderRadius: 10, backgroundColor: dashboardTheme.surfaceLow },
  meta: { fontSize: 13, color: dashboardTheme.onSurface },
  empty: { textAlign: 'center', marginTop: 40, color: dashboardTheme.textMuted, paddingHorizontal: 24 },
  error: { textAlign: 'center', marginTop: 40, color: dashboardTheme.error, paddingHorizontal: 24 },
});
