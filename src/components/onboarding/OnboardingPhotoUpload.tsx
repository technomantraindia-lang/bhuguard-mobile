import { Pressable, StyleSheet, Text, View } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import Svg, { Circle, Path } from 'react-native-svg';

import type { FileAsset } from '../../context/OnboardingContext';
import { dashboardTheme } from '../../theme/bhuguardDashboardTheme';

interface OnboardingPhotoUploadProps {
  file: FileAsset | null;
  onChange: (file: FileAsset | null) => void;
}

export function OnboardingPhotoUpload({ file, onChange }: OnboardingPhotoUploadProps) {
  const pickPhoto = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permission.granted) {
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.85,
    });

    if (result.canceled || !result.assets[0]) {
      return;
    }

    const asset = result.assets[0];

    onChange({
      uri: asset.uri,
      name: asset.fileName ?? 'farmer-photo.jpg',
      mimeType: asset.mimeType ?? 'image/jpeg',
      size: asset.fileSize,
    });
  };

  const added = Boolean(file);

  return (
    <View style={styles.wrap}>
      <Pressable
        style={({ pressed }) => [
          styles.circle,
          added && styles.circleAdded,
          pressed && styles.circlePressed,
        ]}
        onPress={pickPhoto}
        accessibilityRole="button"
        accessibilityLabel="Upload farmer photo"
      >
        {added ? (
          <>
            <Svg width={32} height={32} viewBox="0 0 24 24" fill="none">
              <Circle cx={12} cy={12} r={9} stroke={dashboardTheme.primary} strokeWidth={1.8} />
              <Path
                d="M8 12l3 3 5-6"
                stroke={dashboardTheme.primary}
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </Svg>
            <Text style={styles.addedText}>Added</Text>
          </>
        ) : (
          <>
            <Svg width={32} height={32} viewBox="0 0 24 24" fill="none">
              <Path
                d="M12 16V8M9 11l3-3 3 3"
                stroke={dashboardTheme.outline}
                strokeWidth={1.8}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <Path
                d="M4 18h16M6 18l1.2-4.8A2 2 0 019.1 12h5.8a2 2 0 011.9 1.2L18 18"
                stroke={dashboardTheme.outline}
                strokeWidth={1.8}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </Svg>
            <Text style={styles.uploadText}>Upload</Text>
          </>
        )}
      </Pressable>
    </View>
  );
}

const LANGUAGE_OPTIONS = ['Gujarati', 'Hindi', 'English'] as const;

export function OnboardingLanguageChips({
  value,
  onChange,
}: {
  value: string;
  onChange: (language: string) => void;
}) {
  return (
    <View style={styles.languageWrap}>
      <Text style={styles.languageLabel}>Preferred Communication Language</Text>
      <View style={styles.languageRow}>
        {LANGUAGE_OPTIONS.map((option) => {
          const active = value === option;

          return (
            <Pressable
              key={option}
              style={[styles.languageChip, active && styles.languageChipActive]}
              onPress={() => onChange(option)}
            >
              <Text style={[styles.languageChipText, active && styles.languageChipTextActive]}>{option}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
  },
  circle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: dashboardTheme.outlineVariant,
    backgroundColor: dashboardTheme.surfaceLowest,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  circleAdded: {
    borderStyle: 'solid',
    borderColor: dashboardTheme.primary,
    backgroundColor: dashboardTheme.surfaceLow,
  },
  circlePressed: {
    opacity: 0.9,
  },
  uploadText: {
    fontSize: 11,
    color: dashboardTheme.outline,
  },
  addedText: {
    fontSize: 11,
    fontWeight: '600',
    color: dashboardTheme.primary,
  },
  languageWrap: {
    gap: 8,
    paddingTop: 4,
  },
  languageLabel: {
    fontSize: 11,
    lineHeight: 14,
    fontWeight: '500',
    color: dashboardTheme.onSurfaceVariant,
  },
  languageRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  languageChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: dashboardTheme.outlineVariant,
    backgroundColor: dashboardTheme.surfaceLowest,
  },
  languageChipActive: {
    backgroundColor: dashboardTheme.primaryContainer,
    borderColor: dashboardTheme.primaryContainer,
  },
  languageChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: dashboardTheme.onSurfaceVariant,
  },
  languageChipTextActive: {
    color: dashboardTheme.onPrimaryContainer,
  },
});
