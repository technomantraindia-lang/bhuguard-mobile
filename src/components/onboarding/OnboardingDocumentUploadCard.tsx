import { Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import type { FileAsset } from '../../context/OnboardingContext';
import { dashboardTheme } from '../../theme/bhuguardDashboardTheme';

interface OnboardingDocumentUploadCardProps {
  title: string;
  file: FileAsset | null;
  onPress: () => void;
}

function UploadIcon() {
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 16V8M9 11l3-3 3 3M5 20h14"
        stroke={dashboardTheme.outline}
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function OnboardingDocumentUploadCard({ title, file, onPress }: OnboardingDocumentUploadCardProps) {
  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>{title}</Text>
      <Pressable
        style={({ pressed }) => [styles.uploadCard, pressed && styles.uploadPressed]}
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel="Upload signed consent document"
      >
        <View style={styles.iconCircle}>
          <UploadIcon />
        </View>
        {file ? (
          <>
            <Text style={styles.uploadTitle}>{file.name}</Text>
            <Text style={styles.uploadHint}>Tap to replace document</Text>
          </>
        ) : (
          <>
            <Text style={styles.uploadTitle}>Tap to upload signed document</Text>
            <Text style={styles.uploadHint}>PDF, JPG, or PNG (Max 5MB)</Text>
          </>
        )}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: 16,
  },
  title: {
    fontSize: 18,
    lineHeight: 24,
    fontWeight: '600',
    color: dashboardTheme.onSurface,
  },
  uploadCard: {
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: dashboardTheme.outlineVariant,
    borderRadius: 12,
    backgroundColor: dashboardTheme.surfaceLowest,
    paddingVertical: 32,
    paddingHorizontal: 20,
    alignItems: 'center',
    gap: 8,
  },
  uploadPressed: {
    backgroundColor: dashboardTheme.surfaceLow,
    borderColor: dashboardTheme.primary,
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: dashboardTheme.surfaceVariant,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  uploadTitle: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '500',
    color: dashboardTheme.onSurface,
    textAlign: 'center',
  },
  uploadHint: {
    fontSize: 11,
    lineHeight: 14,
    color: dashboardTheme.onSurfaceVariant,
    textAlign: 'center',
  },
});
