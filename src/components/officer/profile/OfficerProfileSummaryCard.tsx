import { useEffect, useState } from 'react';
import { ActivityIndicator, Image, Pressable, StyleSheet, Text, View } from 'react-native';

import { useProfilePhotoDisplay } from '../../../hooks/useProfilePhotoDisplay';
import { BhuguardMaterialIcon } from '../../shared/BhuguardMaterialIcon';
import { officerCardShadow, officerTheme } from '../../../theme/officerDashboardTheme';

interface OfficerProfileSummaryCardProps {
  officerName: string;
  officerCode: string;
  roleLabel: string;
  regionLabel: string;
  statusLabel: string;
  isActive: boolean;
  photoUri?: string | null;
  onPhotoPress?: () => void;
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);

  if (parts.length === 0) {
    return 'FO';
  }

  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }

  return `${parts[0][0] ?? ''}${parts[1][0] ?? ''}`.toUpperCase();
}

export function OfficerProfileSummaryCard({
  officerName,
  officerCode,
  roleLabel,
  regionLabel,
  statusLabel,
  isActive,
  photoUri,
  onPhotoPress,
}: OfficerProfileSummaryCardProps) {
  const [imageFailed, setImageFailed] = useState(false);
  const displayUri = useProfilePhotoDisplay(photoUri, 'field-officer-profile-current.jpg');
  const isLoadingPhoto = Boolean(photoUri) && !displayUri && !imageFailed;
  const showPhoto = Boolean(displayUri) && !imageFailed;

  useEffect(() => {
    setImageFailed(false);
  }, [displayUri]);

  return (
    <View style={[styles.card, officerCardShadow]}>
      <View style={styles.decor} />

      <View style={styles.avatarBlock}>
        <View style={styles.avatarWrap}>
          <Pressable style={styles.avatar} onPress={onPhotoPress}>
            {showPhoto ? (
              <Image
                key={displayUri}
                source={{ uri: displayUri! }}
                style={styles.avatarImage}
                onError={() => setImageFailed(true)}
              />
            ) : isLoadingPhoto ? (
              <ActivityIndicator color={officerTheme.primary} />
            ) : (
              <Text style={styles.avatarText}>{getInitials(officerName)}</Text>
            )}
          </Pressable>
          <Pressable style={styles.cameraButton} onPress={onPhotoPress}>
            <BhuguardMaterialIcon name="photo_camera" size={16} color={officerTheme.onPrimary} />
          </Pressable>
        </View>

        <Text style={styles.name}>{officerName}</Text>
        <View style={styles.badgeRow}>
          <View style={styles.codeBadge}>
            <Text style={styles.codeBadgeText}>{officerCode}</Text>
          </View>
          <Text style={styles.roleText}>• {roleLabel}</Text>
        </View>
      </View>

      <View style={styles.metaGrid}>
        <View style={styles.metaItem}>
          <View style={styles.metaLabelRow}>
            <BhuguardMaterialIcon name="location_on" size={14} color={officerTheme.outline} />
            <Text style={styles.metaLabel}>Region</Text>
          </View>
          <Text style={styles.metaValue}>{regionLabel}</Text>
        </View>

        <View style={styles.metaItem}>
          <View style={styles.metaLabelRow}>
            <BhuguardMaterialIcon name="verified" size={14} color={officerTheme.outline} />
            <Text style={styles.metaLabel}>Status</Text>
          </View>
          <View style={styles.statusRow}>
            {isActive ? <View style={styles.statusDot} /> : null}
            <Text style={[styles.metaValue, isActive && styles.statusActive]}>{statusLabel}</Text>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: officerTheme.surfaceLowest,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(191, 201, 190, 0.3)',
    padding: 20,
    overflow: 'hidden',
    gap: 16,
  },
  decor: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 128,
    height: 128,
    borderBottomLeftRadius: 128,
    backgroundColor: 'rgba(0, 81, 41, 0.05)',
  },
  avatarBlock: {
    alignItems: 'center',
    gap: 8,
  },
  avatarWrap: {
    position: 'relative',
  },
  avatar: {
    width: 96,
    height: 96,
    borderRadius: 48,
    borderWidth: 4,
    borderColor: officerTheme.surface,
    backgroundColor: officerTheme.secondaryFixed,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  avatarText: {
    fontSize: 28,
    fontWeight: '700',
    color: officerTheme.primary,
  },
  cameraButton: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: officerTheme.primaryContainer,
    borderWidth: 2,
    borderColor: officerTheme.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  name: {
    fontSize: 20,
    fontWeight: '600',
    color: officerTheme.onSurface,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 4,
  },
  codeBadge: {
    backgroundColor: '#EAF7EF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
  },
  codeBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: officerTheme.primaryContainer,
  },
  roleText: {
    fontSize: 12,
    fontWeight: '600',
    color: officerTheme.onSurfaceVariant,
  },
  metaGrid: {
    flexDirection: 'row',
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(191, 201, 190, 0.3)',
    paddingTop: 16,
  },
  metaItem: {
    flex: 1,
    gap: 4,
  },
  metaLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: officerTheme.outline,
  },
  metaValue: {
    fontSize: 16,
    color: officerTheme.onSurface,
    fontWeight: '500',
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: officerTheme.primaryContainer,
  },
  statusActive: {
    color: officerTheme.primaryContainer,
    fontWeight: '600',
  },
});
