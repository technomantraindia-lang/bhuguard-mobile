import { useState } from 'react';
import { Alert, Image, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type { CompositeNavigationProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import * as ImagePicker from 'expo-image-picker';

import { getApiErrorMessage } from '../../api/authApi';
import {
  removeFieldOfficerProfilePhoto,
  updateFieldOfficerProfilePhoto,
} from '../../api/fieldOfficerApi';
import { ProfilePhotoBottomSheet } from '../../components/farmer/profile/ProfilePhotoBottomSheet';
import { ProfilePhotoPreviewModal } from '../../components/farmer/profile/ProfilePhotoPreviewModal';
import { OfficerListState } from '../../components/officer/OfficerListState';
import { OfficerScreenChrome } from '../../components/officer/OfficerScreenChrome';
import { OfficerProfileMenuRow } from '../../components/officer/profile/OfficerProfileMenuRow';
import { BhuguardMaterialIcon } from '../../components/shared/BhuguardMaterialIcon';
import { BrandedHeaderLogo } from '../../components/shared/BrandedHeaderLogo';
import { useAssignedLocations } from '../../hooks/useAssignedLocations';
import { useFieldOfficerProfileData } from '../../hooks/useFieldOfficerProfileData';
import { useLogout } from '../../hooks/useLogout';
import { useProfilePhotoDisplay } from '../../hooks/useProfilePhotoDisplay';
import { useScrollBottomPadding } from '../../hooks/useTabBarLayout';
import { useTranslation } from '../../i18n/I18nContext';
import type { FieldOfficerStackParamList, FieldOfficerTabParamList } from '../../navigation/types';
import { officerCardShadow, officerTheme } from '../../theme/officerDashboardTheme';
import { invalidateProfilePhotoCache } from '../../utils/profilePhotoCache';

type Nav = CompositeNavigationProp<
  BottomTabNavigationProp<FieldOfficerTabParamList, 'Profile'>,
  NativeStackNavigationProp<FieldOfficerStackParamList>
>;

async function pickProfileImage(source: 'camera' | 'gallery'): Promise<{ uri: string; mimeType: string } | null> {
  if (source === 'camera') {
    const permission = await ImagePicker.requestCameraPermissionsAsync();

    if (!permission.granted) {
      Alert.alert('Permission required', 'Camera access is needed to take a profile photo.');
      return null;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.85,
    });

    if (result.canceled || !result.assets?.[0]?.uri) {
      return null;
    }

    const asset = result.assets[0];

    return {
      uri: asset.uri,
      mimeType: asset.mimeType ?? 'image/jpeg',
    };
  }

  const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();

  if (!permission.granted) {
    Alert.alert('Permission required', 'Gallery access is needed to choose a profile photo.');
    return null;
  }

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    allowsEditing: true,
    aspect: [1, 1],
    quality: 0.85,
  });

  if (result.canceled || !result.assets?.[0]?.uri) {
    return null;
  }

  const asset = result.assets[0];

  return {
    uri: asset.uri,
    mimeType: asset.mimeType ?? 'image/jpeg',
  };
}

function buildPhotoFormData(uri: string, mimeType = 'image/jpeg'): FormData {
  const extension = mimeType.includes('png') ? 'png' : mimeType.includes('webp') ? 'webp' : 'jpg';
  const formData = new FormData();

  formData.append('photo', {
    uri,
    name: `profile.${extension}`,
    type: mimeType,
  } as unknown as Blob);

  return formData;
}

export function FieldOfficerProfileScreen() {
  const navigation = useNavigation<Nav>();
  const logout = useLogout();
  const { t } = useTranslation();
  const { data, loading, error, reload, updatePhotoUrl } = useFieldOfficerProfileData();
  const photoDisplayUri = useProfilePhotoDisplay(data?.photoUrl, 'officer-profile-avatar.jpg');
  const assigned = useAssignedLocations('field_officer');
  const scrollBottomPadding = useScrollBottomPadding();

  const [photoSheetOpen, setPhotoSheetOpen] = useState(false);
  const [photoPreviewOpen, setPhotoPreviewOpen] = useState(false);
  const [photoUpdating, setPhotoUpdating] = useState(false);

  const openSection = (section: 'personal' | 'work' | 'documents' | 'security') => {
    navigation.navigate('FieldOfficerProfileSection', { section });
  };

  const handlePhotoPress = () => {
    if (data?.photoUrl) {
      setPhotoPreviewOpen(true);
      return;
    }

    setPhotoSheetOpen(true);
  };

  const handleSelectPhoto = async (source: 'camera' | 'gallery') => {
    setPhotoSheetOpen(false);
    const picked = await pickProfileImage(source);

    if (!picked) {
      return;
    }

    setPhotoUpdating(true);

    try {
      await updateFieldOfficerProfilePhoto(buildPhotoFormData(picked.uri, picked.mimeType));
      invalidateProfilePhotoCache(data?.photoUrl);
      updatePhotoUrl(picked.uri);
      await reload();
      Alert.alert('Profile photo updated', 'Your profile photo has been saved.');
    } catch (err) {
      Alert.alert('Photo update failed', getApiErrorMessage(err, 'Failed to update profile photo.'));
    } finally {
      setPhotoUpdating(false);
    }
  };

  const handleRemovePhoto = async () => {
    setPhotoSheetOpen(false);
    setPhotoUpdating(true);

    try {
      await removeFieldOfficerProfilePhoto();
      invalidateProfilePhotoCache(data?.photoUrl);
      updatePhotoUrl(null);
      await reload();
      Alert.alert('Profile photo removed', 'Your profile photo has been removed.');
    } catch (err) {
      Alert.alert('Photo update failed', getApiErrorMessage(err, 'Failed to remove profile photo.'));
    } finally {
      setPhotoUpdating(false);
    }
  };

  const confirmLogout = () => {
    Alert.alert('Log out?', 'You will need to sign in again to continue field work.', [
      { text: 'Stay signed in', style: 'cancel' },
      { text: 'Log out', style: 'destructive', onPress: () => void logout() },
    ]);
  };

  if (loading && !data) {
    return (
      <OfficerScreenChrome edges={['top']}>
        <OfficerListState kind="loading" message="Loading officer profile…" />
      </OfficerScreenChrome>
    );
  }

  if (error && !data) {
    return (
      <OfficerScreenChrome edges={['top']}>
        <OfficerListState kind="error" message={error} onRetry={reload} />
      </OfficerScreenChrome>
    );
  }

  const profile = data!;
  const initials = profile.officerName
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('') || 'FO';

  const assignedAreas = [
    ...assigned.locations.districts.map((item) => item.name),
    ...assigned.locations.talukas.map((item) => item.name),
  ].filter((value, index, list) => list.indexOf(value) === index);

  return (
    <OfficerScreenChrome edges={['top']}>
      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: scrollBottomPadding }]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={loading || assigned.loading}
            onRefresh={() => {
              void reload();
              void assigned.refresh();
            }}
            tintColor={officerTheme.primary}
          />
        }
      >
        <View style={styles.logoHeader}>
          <BrandedHeaderLogo onPress={() => navigation.navigate('Home')} />
          <Text style={styles.pageTitle}>{t('profile.officerTitle')}</Text>
          <Text style={styles.pageSubtitle}>{t('profile.officerSubtitle')}</Text>
        </View>

        <View style={[styles.heroCard, officerCardShadow]}>
          <Pressable style={styles.avatar} onPress={handlePhotoPress}>
            {photoDisplayUri ? (
              <Image source={{ uri: photoDisplayUri }} style={styles.avatarImage} />
            ) : (
              <Text style={styles.avatarText}>{initials}</Text>
            )}
          </Pressable>
          <Text style={styles.name}>{profile.officerName}</Text>
          <Text style={styles.officerId}>Officer ID: {profile.officerCode}</Text>
          <View style={styles.statusPill}>
            <Text style={styles.statusText}>{profile.statusLabel}</Text>
          </View>
          <Text style={styles.contact}>{profile.mobile !== '-' ? profile.mobile : 'No mobile'}</Text>
          <Text style={styles.contact}>{profile.email !== '-' ? profile.email : 'No email'}</Text>
          {photoUpdating ? <Text style={styles.updatingText}>Updating profile photo…</Text> : null}
        </View>

        <View style={[styles.card, officerCardShadow]}>
          <Text style={styles.cardTitle}>Assigned working areas</Text>
          {assigned.error ? (
            <Text style={styles.areaError}>{assigned.error}</Text>
          ) : assignedAreas.length === 0 ? (
            <Text style={styles.areaEmpty}>No allocated locations yet.</Text>
          ) : (
            <View style={styles.areaWrap}>
              {assignedAreas.map((area) => (
                <View key={area} style={styles.areaChip}>
                  <Text style={styles.areaChipText}>{area}</Text>
                </View>
              ))}
            </View>
          )}
          {assigned.locations.villages.length > 0 ? (
            <Text style={styles.villageCount}>
              {assigned.locations.villages.length} village
              {assigned.locations.villages.length === 1 ? '' : 's'} in zone
            </Text>
          ) : null}
        </View>

        <View style={styles.statsRow}>
          <View style={[styles.statCard, officerCardShadow]}>
            <Text style={styles.statValue}>{profile.performance.visitsCompleted}</Text>
            <Text style={styles.statLabel}>Visits done</Text>
          </View>
          <View style={[styles.statCard, officerCardShadow]}>
            <Text style={styles.statValue}>{profile.performance.pending}</Text>
            <Text style={styles.statLabel}>Pending</Text>
          </View>
          <View style={[styles.statCard, officerCardShadow]}>
            <Text style={styles.statValue}>{profile.performance.accuracyPercent}%</Text>
            <Text style={styles.statLabel}>Accuracy</Text>
          </View>
        </View>

        <View style={styles.menuList}>
          <OfficerProfileMenuRow
            icon="person"
            iconBackground={officerTheme.secondaryContainer}
            iconColor={officerTheme.onSecondaryContainer}
            title={t('profile.personalDetails')}
            subtitle="Contact info, address"
            onPress={() => openSection('personal')}
          />
          <OfficerProfileMenuRow
            icon="lock"
            title={t('profile.security')}
            subtitle="Password, MPIN, Biometrics"
            onPress={() => openSection('security')}
          />
          <OfficerProfileMenuRow
            icon="description"
            title={t('common.settings')}
            subtitle={t('language.settingsSubtitle')}
            onPress={() => navigation.navigate('FieldOfficerSettings')}
          />
          <OfficerProfileMenuRow
            icon="support_agent"
            title="Help & Support"
            subtitle="Message the Bhuguard team"
            onPress={() => navigation.navigate('SupportThreads', { supportRole: 'field_officer' })}
          />
        </View>

        <View style={styles.dangerZone}>
          <Pressable
            style={styles.logoutButton}
            onPress={confirmLogout}
            accessibilityRole="button"
            accessibilityLabel={t('common.logout')}
          >
            <BhuguardMaterialIcon name="lock" size={20} color={officerTheme.error} />
            <Text style={styles.logoutText}>{t('common.logout')}</Text>
          </Pressable>
        </View>
      </ScrollView>

      <ProfilePhotoBottomSheet
        visible={photoSheetOpen}
        hasPhoto={Boolean(profile.photoUrl)}
        onTakePhoto={() => void handleSelectPhoto('camera')}
        onChooseGallery={() => void handleSelectPhoto('gallery')}
        onRemovePhoto={() => void handleRemovePhoto()}
        onClose={() => setPhotoSheetOpen(false)}
      />

      <ProfilePhotoPreviewModal
        visible={photoPreviewOpen}
        photoUri={profile.photoUrl}
        onClose={() => setPhotoPreviewOpen(false)}
        cacheFileName="field-officer-profile-current.jpg"
      />
    </OfficerScreenChrome>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: officerTheme.marginMobile,
    gap: 18,
  },
  logoHeader: {
    alignItems: 'center',
    gap: 6,
    paddingTop: 8,
  },
  pageTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: officerTheme.tertiary,
  },
  pageSubtitle: {
    fontSize: 14,
    color: officerTheme.onSurfaceVariant,
    textAlign: 'center',
  },
  heroCard: {
    backgroundColor: officerTheme.surfaceLowest,
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: officerTheme.outlineVariant,
    gap: 6,
  },
  avatar: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: officerTheme.secondaryContainer,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: officerTheme.primary,
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  avatarText: {
    fontSize: 28,
    fontWeight: '800',
    color: officerTheme.onSecondaryContainer,
  },
  name: {
    fontSize: 22,
    fontWeight: '700',
    color: officerTheme.onSurface,
  },
  officerId: {
    fontSize: 13,
    fontWeight: '700',
    color: officerTheme.onSurfaceVariant,
  },
  statusPill: {
    marginTop: 4,
    backgroundColor: 'rgba(133, 201, 92, 0.2)',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '800',
    color: officerTheme.tertiary,
    textTransform: 'uppercase',
  },
  contact: {
    fontSize: 13,
    color: officerTheme.onSurfaceVariant,
  },
  updatingText: {
    fontSize: 12,
    color: officerTheme.onSurfaceVariant,
  },
  card: {
    backgroundColor: officerTheme.surfaceLowest,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: officerTheme.outlineVariant,
    gap: 10,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: officerTheme.tertiary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  areaWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  areaChip: {
    backgroundColor: officerTheme.neutral,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: officerTheme.outlineVariant,
  },
  areaChipText: {
    fontSize: 12,
    fontWeight: '700',
    color: officerTheme.onSurface,
  },
  areaEmpty: {
    fontSize: 13,
    color: officerTheme.onSurfaceVariant,
  },
  areaError: {
    fontSize: 13,
    color: officerTheme.error,
  },
  villageCount: {
    fontSize: 12,
    color: officerTheme.onSurfaceVariant,
    fontWeight: '600',
  },
  statsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  statCard: {
    flex: 1,
    backgroundColor: officerTheme.surfaceLowest,
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: officerTheme.outlineVariant,
    alignItems: 'center',
    gap: 2,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '800',
    color: officerTheme.primary,
  },
  statLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: officerTheme.onSurfaceVariant,
  },
  menuList: {
    gap: 12,
  },
  dangerZone: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(191, 201, 190, 0.3)',
    paddingTop: 18,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
  },
  logoutText: {
    fontSize: 14,
    fontWeight: '600',
    color: officerTheme.error,
  },
});
