import { useEffect, useState } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';

import { getFieldOfficerProfile } from '../../api/fieldOfficerApi';
import { useProfilePhotoDisplay } from '../../hooks/useProfilePhotoDisplay';
import { getAuthUser } from '../../storage/authStorage';
import { officerCardShadow, officerTheme } from '../../theme/officerDashboardTheme';
import { pickString, type ApiRecord } from '../../utils/apiHelpers';
import { resolveMediaUrl } from '../../utils/mediaUrl';
import { BhuguardMaterialIcon } from '../shared/BhuguardMaterialIcon';
import { BrandedHeaderLogo } from '../shared/BrandedHeaderLogo';

interface OfficerReportsHeaderProps {
  onNotificationsPress: () => void;
  onProfilePress?: () => void;
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

export function OfficerReportsHeader({ onNotificationsPress, onProfilePress }: OfficerReportsHeaderProps) {
  const [displayName, setDisplayName] = useState('Officer');
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const displayUri = useProfilePhotoDisplay(photoUrl, 'officer-reports-avatar.jpg');

  useEffect(() => {
    void (async () => {
      const user = await getAuthUser();
      if (user?.name) {
        setDisplayName(user.name);
      }

      try {
        const profileData = await getFieldOfficerProfile();
        const profileUser = (profileData.user ?? profileData) as ApiRecord;
        const fieldOfficer = (profileUser.field_officer_profile ??
          profileUser.field_officer ??
          profileUser.fieldOfficer ??
          {}) as ApiRecord;
        const url = resolveMediaUrl(
          pickString(fieldOfficer, 'photo_url') !== '-' ? pickString(fieldOfficer, 'photo_url') : null,
        );
        setPhotoUrl(url);
      } catch {
        // Keep initials fallback.
      }
    })();
  }, []);

  return (
    <View style={styles.wrap}>
      <View style={styles.titleWrap}>
        <BrandedHeaderLogo />
        <View style={styles.copy}>
          <Text style={styles.title}>Reports</Text>
          <Text style={styles.subtitle}>View, submit and download verification reports</Text>
        </View>
      </View>

      <View style={styles.actions}>
        <Pressable style={[styles.iconButton, officerCardShadow]} onPress={onNotificationsPress}>
          <BhuguardMaterialIcon name="notifications" size={22} color={officerTheme.primary} />
        </Pressable>

        <Pressable style={styles.avatarButton} onPress={onProfilePress}>
          {displayUri ? (
            <Image source={{ uri: displayUri }} style={styles.avatarImage} />
          ) : (
            <View style={styles.avatarFallback}>
              <Text style={styles.avatarText}>{getInitials(displayName)}</Text>
            </View>
          )}
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: officerTheme.marginMobile,
    paddingVertical: 12,
    backgroundColor: officerTheme.surfaceLowest,
    borderBottomWidth: 1,
    borderBottomColor: officerTheme.outlineVariant,
  },
  titleWrap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingRight: 8,
    minWidth: 0,
  },
  copy: {
    flex: 1,
    minWidth: 0,
  },
  title: {
    fontSize: 18,
    lineHeight: 24,
    fontWeight: '700',
    color: officerTheme.primary,
  },
  subtitle: {
    fontSize: 11,
    lineHeight: 15,
    color: officerTheme.onSurfaceVariant,
    marginTop: 2,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: officerTheme.surfaceLowest,
  },
  avatarButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: officerTheme.primary,
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  avatarFallback: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: officerTheme.secondaryContainer,
  },
  avatarText: {
    fontSize: 11,
    fontWeight: '700',
    color: officerTheme.onSecondaryContainer,
  },
});
