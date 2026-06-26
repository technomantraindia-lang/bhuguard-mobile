import { useState } from 'react';
import { Alert, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
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
import { ErrorState } from '../../components/ErrorState';
import { LoadingState } from '../../components/LoadingState';
import { ProfilePhotoBottomSheet } from '../../components/farmer/profile/ProfilePhotoBottomSheet';
import { ProfilePhotoPreviewModal } from '../../components/farmer/profile/ProfilePhotoPreviewModal';
import { OfficerProfileAppBar } from '../../components/officer/profile/OfficerProfileAppBar';
import { OfficerProfileMenuRow } from '../../components/officer/profile/OfficerProfileMenuRow';
import { OfficerProfilePerformanceSection } from '../../components/officer/profile/OfficerProfilePerformanceSection';
import { OfficerProfileSummaryCard } from '../../components/officer/profile/OfficerProfileSummaryCard';
import { BhuguardMaterialIcon } from '../../components/shared/BhuguardMaterialIcon';
import { useFieldOfficerProfileData } from '../../hooks/useFieldOfficerProfileData';
import { useScrollBottomPadding } from '../../hooks/useTabBarLayout';
import { useLogout } from '../../hooks/useLogout';
import { useTranslation } from '../../i18n/I18nContext';
import type { FieldOfficerStackParamList, FieldOfficerTabParamList } from '../../navigation/types';
import { officerTheme } from '../../theme/officerDashboardTheme';
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
  const scrollBottomPadding = useScrollBottomPadding();

  const [photoSheetOpen, setPhotoSheetOpen] = useState(false);
  const [photoPreviewOpen, setPhotoPreviewOpen] = useState(false);
  const [photoUpdating, setPhotoUpdating] = useState(false);

  const openPerformance = () => navigation.navigate('FieldOfficerPerformance');

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

  if (loading && !data) {
    return (
      <SafeAreaView style={styles.safe}>
        <LoadingState message="Loading officer profile..." />
      </SafeAreaView>
    );
  }

  if (error && !data) {
    return (
      <SafeAreaView style={styles.safe}>
        <ErrorState message={error} onRetry={reload} />
      </SafeAreaView>
    );
  }

  const profile = data!;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <OfficerProfileAppBar
        onBack={() => navigation.navigate('Home')}
        onNotificationsPress={() => navigation.navigate('FieldOfficerNotifications')}
      />

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: scrollBottomPadding }]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={reload} tintColor={officerTheme.primary} />
        }
      >
        <View style={styles.pageHeader}>
          <Text style={styles.pageTitle}>{t('profile.officerTitle')}</Text>
          <Text style={styles.pageSubtitle}>{t('profile.officerSubtitle')}</Text>
        </View>

        <OfficerProfileSummaryCard
          officerName={profile.officerName}
          officerCode={profile.officerCode}
          roleLabel={profile.roleLabel}
          regionLabel={profile.regionLabel}
          statusLabel={profile.statusLabel}
          isActive={profile.isActive}
          photoUri={profile.photoUrl}
          onPhotoPress={handlePhotoPress}
        />

        {photoUpdating ? <Text style={styles.updatingText}>Updating profile photo…</Text> : null}

        <OfficerProfilePerformanceSection
          visitsCompleted={profile.performance.visitsCompleted}
          accuracyPercent={profile.performance.accuracyPercent}
          onViewFull={openPerformance}
          onVisitsPress={openPerformance}
          onAccuracyPress={openPerformance}
        />

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
            icon="support_agent"
            title={t('profile.workInformation')}
            subtitle="Region, talukas, dates"
            onPress={() => openSection('work')}
          />
          <OfficerProfileMenuRow
            icon="description"
            title={t('profile.documents')}
            subtitle="ID proof, letters"
            onPress={() => openSection('documents')}
          />
          <OfficerProfileMenuRow
            icon="lock"
            title={t('profile.security')}
            subtitle="Password, MPIN, Biometrics"
            onPress={() => openSection('security')}
          />
          <OfficerProfileMenuRow
            icon="support_agent"
            title="Help & Support"
            subtitle="Message the Bhuguard team"
            onPress={() => navigation.navigate('SupportThreads', { supportRole: 'field_officer' })}
          />
          <OfficerProfileMenuRow
            icon="description"
            title={t('common.settings')}
            subtitle={t('language.settingsSubtitle')}
            onPress={() => navigation.navigate('FieldOfficerSettings')}
          />
        </View>

        <View style={styles.dangerZone}>
          <Pressable style={styles.logoutButton} onPress={logout}>
            <BhuguardMaterialIcon name="sync" size={20} color={officerTheme.error} />
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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: officerTheme.background,
  },
  content: {
    padding: officerTheme.marginMobile,
    gap: 24,
  },
  pageHeader: {
    gap: 4,
  },
  pageTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: officerTheme.onSurface,
  },
  pageSubtitle: {
    fontSize: 16,
    lineHeight: 24,
    color: officerTheme.onSurfaceVariant,
  },
  updatingText: {
    textAlign: 'center',
    fontSize: 13,
    color: officerTheme.onSurfaceVariant,
    marginTop: -12,
  },
  menuList: {
    gap: 12,
  },
  dangerZone: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(191, 201, 190, 0.3)',
    paddingTop: 24,
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
    fontWeight: '500',
    color: officerTheme.error,
  },
});
