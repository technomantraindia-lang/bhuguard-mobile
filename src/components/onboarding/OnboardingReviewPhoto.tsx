import { Image, StyleSheet, Text, View } from 'react-native';

import type { FileAsset } from '../../context/OnboardingContext';
import { dashboardTheme } from '../../theme/bhuguardDashboardTheme';
import { resolveMediaUrl } from '../../utils/mediaUrl';

interface OnboardingReviewPhotoProps {
  file: FileAsset | null;
  remotePhotoUrl?: string | null;
  label?: string;
}

export function OnboardingReviewPhoto({
  file,
  remotePhotoUrl,
  label = 'Profile photo',
}: OnboardingReviewPhotoProps) {
  const previewUri = file?.uri ?? resolveMediaUrl(remotePhotoUrl ?? null);

  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>{label}</Text>
      {previewUri ? (
        <Image source={{ uri: previewUri }} style={styles.image} resizeMode="cover" />
      ) : (
        <View style={styles.placeholder}>
          <Text style={styles.placeholderText}>No photo selected</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: 8,
    marginTop: 4,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: dashboardTheme.onSurfaceVariant,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  image: {
    width: 88,
    height: 88,
    borderRadius: 44,
    borderWidth: 2,
    borderColor: dashboardTheme.primary,
    backgroundColor: dashboardTheme.surfaceLow,
  },
  placeholder: {
    width: 88,
    height: 88,
    borderRadius: 44,
    borderWidth: 1,
    borderColor: dashboardTheme.outlineVariant,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: dashboardTheme.surfaceLowest,
    padding: 8,
  },
  placeholderText: {
    fontSize: 10,
    textAlign: 'center',
    color: dashboardTheme.onSurfaceVariant,
  },
});
