import { useRef, useState } from 'react';
import { Alert, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import type { FileAsset } from '../../context/OnboardingContext';
import { dashboardTheme } from '../../theme/bhuguardDashboardTheme';
import { capturePlainPhoto } from '../../utils/liveEvidenceCapture';
import { fileAssetFromImagePickerAsset, validateOnboardingPhotoAsset } from '../../utils/onboardingPhoto';

interface OnboardingPhotoUploadProps {
  file: FileAsset | null;
  onChange: (file: FileAsset | null) => void;
}

const PERMISSION_MESSAGE = 'Please allow camera permission to capture farmer photo.';

function CameraBadgeIcon() {
  return (
    <Svg width={14} height={14} viewBox="0 0 24 24" fill="none">
      <Path
        d="M4 7h3l2-2h6l2 2h3a2 2 0 012 2v9a2 2 0 01-2 2H4a2 2 0 01-2-2V9a2 2 0 012-2z"
        stroke={dashboardTheme.onPrimary}
        strokeWidth={1.8}
        strokeLinejoin="round"
      />
      <Path
        d="M12 17a4 4 0 100-8 4 4 0 000 8z"
        stroke={dashboardTheme.onPrimary}
        strokeWidth={1.8}
      />
    </Svg>
  );
}

function UploadPlaceholderIcon() {
  return (
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
      <Text style={styles.uploadText}>Capture</Text>
    </>
  );
}

export function OnboardingPhotoUpload({ file, onChange }: OnboardingPhotoUploadProps) {
  const [error, setError] = useState<string | null>(null);
  const [capturing, setCapturing] = useState(false);
  // Holds a just-captured photo pending farmer OK/Retry confirmation — never
  // auto-saved to the draft until explicitly confirmed (Phase 10.1).
  const [pendingUri, setPendingUri] = useState<string | null>(null);
  const pendingAssetRef = useRef<{
    uri: string;
    fileName?: string;
    mimeType?: string;
    fileSize?: number;
    width: number;
    height: number;
  } | null>(null);

  const openCamera = async () => {
    setCapturing(true);
    setError(null);

    try {
      const result = await capturePlainPhoto({
        defaultName: 'farmer-photo.jpg',
        allowsEditing: true,
      });

      if (!result.ok) {
        if (!result.cancelled && result.error) {
          if (result.error.includes('permission')) {
            Alert.alert('Permission required', PERMISSION_MESSAGE);
          } else {
            setError(result.error);
          }
        }

        return;
      }

      const assetLike = {
        uri: result.photo.uri,
        fileName: result.photo.name,
        mimeType: result.photo.type,
        fileSize: undefined,
        width: 0,
        height: 0,
      };

      const validationError = validateOnboardingPhotoAsset(assetLike);

      if (validationError) {
        setError(validationError);
        return;
      }

      pendingAssetRef.current = assetLike;
      setPendingUri(result.photo.uri);
    } finally {
      setCapturing(false);
    }
  };

  const confirmPending = () => {
    if (!pendingAssetRef.current) {
      return;
    }
    onChange(fileAssetFromImagePickerAsset(pendingAssetRef.current));
    pendingAssetRef.current = null;
    setPendingUri(null);
  };

  const retryPending = () => {
    pendingAssetRef.current = null;
    setPendingUri(null);
    void openCamera();
  };

  const hasPhoto = Boolean(file?.uri);

  if (pendingUri) {
    return (
      <View style={styles.wrap}>
        <View style={[styles.circle, styles.circleWithPhoto]}>
          <Image source={{ uri: pendingUri }} style={styles.previewImage} resizeMode="cover" />
        </View>
        <Text style={styles.helperText}>Use this photo?</Text>
        <View style={styles.confirmRow}>
          <Pressable
            style={[styles.confirmButton, styles.retryButton]}
            onPress={retryPending}
            accessibilityRole="button"
            accessibilityLabel="Retake photo"
          >
            <Text style={styles.retryButtonText}>Retry</Text>
          </Pressable>
          <Pressable
            style={[styles.confirmButton, styles.okButton]}
            onPress={confirmPending}
            accessibilityRole="button"
            accessibilityLabel="Confirm photo"
          >
            <Text style={styles.okButtonText}>OK</Text>
          </Pressable>
        </View>
        {error ? <Text style={styles.errorText}>{error}</Text> : null}
      </View>
    );
  }

  return (
    <View style={styles.wrap}>
      <Pressable
        style={({ pressed }) => [
          styles.circle,
          hasPhoto && styles.circleWithPhoto,
          pressed && styles.circlePressed,
        ]}
        onPress={() => void openCamera()}
        disabled={capturing}
        accessibilityRole="button"
        accessibilityLabel={hasPhoto ? 'Retake farmer photo' : 'Capture farmer photo'}
      >
        {hasPhoto ? (
          <>
            <Image source={{ uri: file!.uri }} style={styles.previewImage} resizeMode="cover" />
            <View style={styles.editBadge}>
              <CameraBadgeIcon />
            </View>
          </>
        ) : (
          <UploadPlaceholderIcon />
        )}
      </Pressable>

      <Text style={styles.helperText}>
        {capturing ? 'Opening camera...' : hasPhoto ? 'Retake Photo' : 'Capture farmer photo'}
      </Text>
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
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
    gap: 8,
  },
  circle: {
    width: 112,
    height: 112,
    borderRadius: 56,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: dashboardTheme.outlineVariant,
    backgroundColor: dashboardTheme.surfaceLowest,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  circleWithPhoto: {
    borderStyle: 'solid',
    borderColor: dashboardTheme.primary,
    backgroundColor: dashboardTheme.surfaceLow,
  },
  circlePressed: {
    opacity: 0.9,
  },
  previewImage: {
    width: '100%',
    height: '100%',
  },
  editBadge: {
    position: 'absolute',
    right: 4,
    bottom: 4,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: dashboardTheme.primaryContainer,
    borderWidth: 2,
    borderColor: dashboardTheme.surfaceLowest,
    alignItems: 'center',
    justifyContent: 'center',
  },
  uploadText: {
    fontSize: 11,
    color: dashboardTheme.outline,
    marginTop: 4,
  },
  helperText: {
    fontSize: 12,
    fontWeight: '600',
    color: dashboardTheme.primary,
  },
  confirmRow: {
    flexDirection: 'row',
    gap: 10,
  },
  confirmButton: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
  },
  retryButton: {
    borderColor: dashboardTheme.outlineVariant,
    backgroundColor: dashboardTheme.surfaceLowest,
  },
  retryButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: dashboardTheme.onSurfaceVariant,
  },
  okButton: {
    borderColor: dashboardTheme.primary,
    backgroundColor: dashboardTheme.primary,
  },
  okButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: dashboardTheme.onPrimary,
  },
  errorText: {
    fontSize: 12,
    lineHeight: 16,
    color: dashboardTheme.error,
    textAlign: 'center',
    paddingHorizontal: 12,
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
