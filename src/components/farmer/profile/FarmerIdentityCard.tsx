import { useEffect, useState } from 'react';
import { ActivityIndicator, Image, Pressable, StyleSheet, Text, View } from 'react-native';

import { useProfilePhotoDisplay } from '../../../hooks/useProfilePhotoDisplay';
import { BhuguardMaterialIcon } from '../../shared/BhuguardMaterialIcon';
import { dashboardShadow, dashboardTheme } from '../../../theme/bhuguardDashboardTheme';

interface FarmerIdentityCardProps {
  fullName: string;
  farmerId: string;
  mobile: string;
  email: string;
  verificationStatus: string;
  projectName: string;
  photoUri?: string | null;
  onPhotoPress?: () => void;
  onChangePhotoPress?: () => void;
}

export function FarmerIdentityCard({
  fullName,
  farmerId,
  mobile,
  email,
  verificationStatus,
  projectName,
  photoUri,
  onPhotoPress,
  onChangePhotoPress,
}: FarmerIdentityCardProps) {
  const isVerified = verificationStatus.toLowerCase() === 'verified';
  const [imageFailed, setImageFailed] = useState(false);
  const displayUri = useProfilePhotoDisplay(photoUri);
  const isLoadingPhoto = Boolean(photoUri) && !displayUri && !imageFailed;
  const showPhoto = Boolean(displayUri) && !imageFailed;

  useEffect(() => {
    setImageFailed(false);
  }, [displayUri]);

  return (
    <View style={[styles.card, dashboardShadow]}>
      <View style={styles.photoSection}>
        <View style={styles.avatarWrap}>
          <Pressable
            style={styles.avatarPress}
            onPress={onPhotoPress}
            accessibilityLabel="View profile photo"
          >
            {showPhoto ? (
              <Image
                key={displayUri}
                source={{ uri: displayUri! }}
                style={styles.avatarImage}
                onError={() => setImageFailed(true)}
              />
            ) : isLoadingPhoto ? (
              <View style={styles.avatarFallback}>
                <ActivityIndicator color={dashboardTheme.primaryContainer} />
              </View>
            ) : (
              <View style={styles.avatarFallback}>
                <BhuguardMaterialIcon name="person" size={28} color={dashboardTheme.primaryContainer} />
              </View>
            )}
          </Pressable>
          <Pressable
            style={styles.cameraBadge}
            onPress={onChangePhotoPress}
            accessibilityLabel="Change profile photo"
          >
            <BhuguardMaterialIcon name="photo_camera" size={14} color={dashboardTheme.onPrimary} />
          </Pressable>
        </View>

        <Pressable onPress={onChangePhotoPress}>
          <Text style={styles.changePhotoText}>Change Photo</Text>
        </Pressable>
      </View>

      <View style={styles.topRow}>
        <View style={styles.copy}>
          <Text style={styles.name}>{fullName}</Text>
          <Text style={styles.meta}>Farmer ID: {farmerId}</Text>
        </View>
        {isVerified ? (
          <View style={styles.verifiedBadge}>
            <BhuguardMaterialIcon name="verified" size={14} color={dashboardTheme.primaryContainer} filled />
            <Text style={styles.verifiedText}>Verified</Text>
          </View>
        ) : null}
      </View>

      <View style={styles.grid}>
        <InfoRow label="Mobile" value={mobile} />
        <InfoRow label="Email" value={email} />
        <InfoRow label="Verification Status" value={verificationStatus} />
        <InfoRow label="Project" value={projectName} />
      </View>
    </View>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue} numberOfLines={2}>
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: dashboardTheme.surfaceLowest,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: dashboardTheme.outlineVariant,
    padding: 16,
    gap: 14,
  },
  photoSection: {
    alignItems: 'center',
    gap: 8,
    paddingBottom: 4,
  },
  avatarWrap: {
    width: 96,
    height: 96,
    position: 'relative',
  },
  avatarPress: {
    width: '100%',
    height: '100%',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    borderRadius: 48,
    borderWidth: 2,
    borderColor: dashboardTheme.secondaryContainer,
  },
  avatarFallback: {
    width: '100%',
    height: '100%',
    borderRadius: 48,
    backgroundColor: dashboardTheme.surfaceLow,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: dashboardTheme.outlineVariant,
  },
  cameraBadge: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: dashboardTheme.primaryContainer,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: dashboardTheme.surfaceLowest,
  },
  changePhotoText: {
    fontSize: 14,
    fontWeight: '700',
    color: dashboardTheme.primaryContainer,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  copy: {
    flex: 1,
    gap: 2,
  },
  name: {
    fontSize: 18,
    lineHeight: 26,
    fontWeight: '700',
    color: dashboardTheme.headingGreen,
  },
  meta: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '600',
    color: dashboardTheme.textMuted,
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: dashboardTheme.surfaceLow,
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: dashboardTheme.secondaryContainer,
  },
  verifiedText: {
    fontSize: 11,
    fontWeight: '700',
    color: dashboardTheme.primaryContainer,
  },
  grid: {
    gap: 10,
    borderTopWidth: 1,
    borderTopColor: dashboardTheme.outlineVariant,
    paddingTop: 12,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  infoLabel: {
    fontSize: 13,
    color: dashboardTheme.textMuted,
    flex: 1,
  },
  infoValue: {
    fontSize: 13,
    fontWeight: '600',
    color: dashboardTheme.onSurface,
    flex: 1,
    textAlign: 'right',
  },
});
