import type { ReactNode } from 'react';
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
  removeFarmerProfilePhoto,
  updateFarmerProfileMpin,
  updateFarmerProfilePassword,
  updateFarmerProfilePhoto,
} from '../../api/farmerApi';
import { ErrorState } from '../../components/ErrorState';
import { LoadingState } from '../../components/LoadingState';
import { FarmerIdentityCard } from '../../components/farmer/profile/FarmerIdentityCard';
import { FarmerProfileHeader } from '../../components/farmer/profile/FarmerProfileHeader';
import { ProfileAccordionSection } from '../../components/farmer/profile/ProfileAccordionSection';
import { ProfileActionModal } from '../../components/farmer/profile/ProfileActionModal';
import { ProfileDocumentCard } from '../../components/farmer/profile/ProfileDocumentCard';
import { ProfileFormField } from '../../components/farmer/profile/ProfileFormField';
import { ProfileLanguageSheet } from '../../components/farmer/profile/ProfileLanguageSheet';
import { ProfileMpinInput } from '../../components/farmer/profile/ProfileMpinInput';
import { ProfilePhotoBottomSheet } from '../../components/farmer/profile/ProfilePhotoBottomSheet';
import { ProfilePhotoCropModal } from '../../components/farmer/profile/ProfilePhotoCropModal';
import { ProfilePhotoPreviewModal } from '../../components/farmer/profile/ProfilePhotoPreviewModal';
import { ProfileSecureField } from '../../components/farmer/profile/ProfileSecureField';
import { ProfileLinkRow, ProfileToggleRow } from '../../components/farmer/profile/ProfileToggleRow';
import { ProfileOptionSheet } from '../../components/farmer/profile/ProfileOptionSheet';
import { PROFILE_LANGUAGE_OPTIONS } from '../../constants/farmerProfileDocuments';
import { FARMER_GENDER_OPTIONS, genderLabel } from '../../constants/farmerGenderOptions';
import { useFarmerProfileForm } from '../../hooks/useFarmerProfileForm';
import { useFarmerProfileDocuments } from '../../hooks/useFarmerProfileDocuments';
import { useTranslation } from '../../i18n/I18nContext';
import { invalidateProfilePhotoCache } from '../../utils/profilePhotoCache';
import { useLogout } from '../../hooks/useLogout';
import type { FarmerStackParamList, FarmerTabParamList } from '../../navigation/types';
import { useAppTheme } from '../../theme/ThemeContext';
import { dashboardTheme } from '../../theme/bhuguardDashboardTheme';

type Nav = CompositeNavigationProp<
  BottomTabNavigationProp<FarmerTabParamList, 'Profile'>,
  NativeStackNavigationProp<FarmerStackParamList>
>;

type SectionId =
  | 'personal'
  | 'address'
  | 'bank'
  | 'documents'
  | 'security'
  | 'preferences'
  | 'account';

type ModalState =
  | { visible: false }
  | { visible: true; variant: 'success'; title: string; message: string }
  | { visible: true; variant: 'confirm-logout' }
  | { visible: true; variant: 'confirm-delete' };

function SectionButton({
  label,
  onPress,
  loading,
  variant = 'primary',
}: {
  label: string;
  onPress: () => void;
  loading?: boolean;
  variant?: 'primary' | 'danger' | 'outline';
}) {
  return (
    <Pressable
      style={({ pressed }) => [
        styles.sectionButton,
        variant === 'danger' && styles.sectionButtonDanger,
        variant === 'outline' && styles.sectionButtonOutline,
        pressed && styles.pressed,
      ]}
      onPress={onPress}
      disabled={loading}
    >
      <Text
        style={[
          styles.sectionButtonText,
          variant === 'danger' && styles.sectionButtonTextDanger,
          variant === 'outline' && styles.sectionButtonTextOutline,
        ]}
      >
        {loading ? 'Please wait…' : label}
      </Text>
    </Pressable>
  );
}

function SecurityCard({ title, children }: { title: string; children: ReactNode }) {
  return (
    <View style={styles.securityCard}>
      <Text style={styles.securityCardTitle}>{title}</Text>
      {children}
    </View>
  );
}

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

export function FarmerProfileScreen() {
  const navigation = useNavigation<Nav>();
  const logout = useLogout();
  const { setLanguage } = useTranslation();
  const { isDarkMode, setDarkMode } = useAppTheme();
  const { profile, loading, saving, error, reload, saveProfileFields, saveBankDetails, updateField } = useFarmerProfileForm();
  const { documents: profileDocuments } = useFarmerProfileDocuments();

  const [expanded, setExpanded] = useState<SectionId | null>('personal');
  const [modal, setModal] = useState<ModalState>({ visible: false });
  const [languageSheetOpen, setLanguageSheetOpen] = useState(false);
  const [genderSheetOpen, setGenderSheetOpen] = useState(false);

  const [photoSheetOpen, setPhotoSheetOpen] = useState(false);
  const [photoPreviewOpen, setPhotoPreviewOpen] = useState(false);
  const [cropModalOpen, setCropModalOpen] = useState(false);
  const [pendingPhotoUri, setPendingPhotoUri] = useState<string | null>(null);
  const [pendingPhotoMime, setPendingPhotoMime] = useState('image/jpeg');
  const [photoUpdating, setPhotoUpdating] = useState(false);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordUpdating, setPasswordUpdating] = useState(false);
  const [passwordApiError, setPasswordApiError] = useState<string | null>(null);

  const [currentMpin, setCurrentMpin] = useState('');
  const [newMpin, setNewMpin] = useState('');
  const [confirmMpin, setConfirmMpin] = useState('');
  const [mpinUpdating, setMpinUpdating] = useState(false);
  const [mpinApiError, setMpinApiError] = useState<string | null>(null);

  const [biometricEnabled, setBiometricEnabled] = useState(true);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

  const toggleSection = (id: SectionId) => {
    setExpanded((current) => (current === id ? null : id));
  };

  const showSuccess = (title: string, message: string) => {
    setModal({ visible: true, variant: 'success', title, message });
  };

  const handleUpdateAddress = async () => {
    if (!profile) {
      return;
    }

    const success = await saveProfileFields({
      address: profile.fullAddress,
      pincode: profile.pincode,
    });

    if (success) {
      showSuccess('Address Updated', 'Your address information has been saved successfully.');
    }
  };

  const handleUpdateBank = async () => {
    if (!profile) {
      return;
    }

    const success = await saveBankDetails({
      account_holder_name: profile.accountHolder,
      bank_name: profile.bankName,
      account_number: profile.accountNumberRaw || profile.accountNumber,
      ifsc_code: profile.ifscCode,
      branch_name: profile.branchName || null,
      account_type: profile.accountType || null,
      upi_id: profile.upiId || null,
    });

    if (success) {
      showSuccess('Bank Details Updated', 'Your bank details have been saved successfully.');
    }
  };

  const openPhotoSheet = () => {
    setPhotoSheetOpen(true);
  };

  const handlePhotoPress = () => {
    if (profile?.photoUrl) {
      setPhotoPreviewOpen(true);
      return;
    }

    openPhotoSheet();
  };

  const handleSelectPhoto = async (source: 'camera' | 'gallery') => {
    setPhotoSheetOpen(false);
    const picked = await pickProfileImage(source);

    if (!picked) {
      return;
    }

    setPendingPhotoUri(picked.uri);
    setPendingPhotoMime(picked.mimeType);
    setCropModalOpen(true);
  };

  const handleRemovePhoto = async () => {
    setPhotoSheetOpen(false);
    setPhotoUpdating(true);

    try {
      await removeFarmerProfilePhoto();
      invalidateProfilePhotoCache(profile?.photoUrl);
      updateField('photoUrl', null);
      await reload();
      showSuccess('Profile photo updated successfully', 'Your profile photo has been removed.');
    } catch (err) {
      Alert.alert('Photo update failed', getApiErrorMessage(err, 'Failed to remove profile photo.'));
    } finally {
      setPhotoUpdating(false);
    }
  };

  const handleUpdateProfilePhoto = async () => {
    if (!pendingPhotoUri) {
      return;
    }

    setPhotoUpdating(true);

    try {
      await updateFarmerProfilePhoto(buildPhotoFormData(pendingPhotoUri, pendingPhotoMime));
      invalidateProfilePhotoCache(profile?.photoUrl);
      const localUri = pendingPhotoUri;
      setCropModalOpen(false);
      setPendingPhotoUri(null);
      updateField('photoUrl', localUri);
      showSuccess('Profile photo updated successfully', 'Your farmer profile photo has been saved.');
    } catch (err) {
      Alert.alert('Photo update failed', getApiErrorMessage(err, 'Failed to update profile photo.'));
    } finally {
      setPhotoUpdating(false);
    }
  };

  const handleUpdatePassword = async () => {
    setPasswordApiError(null);

    if (!currentPassword.trim()) {
      setPasswordApiError('Current password is required.');
      return;
    }

    if (newPassword.length < 8) {
      setPasswordApiError('Use at least 8 characters for your new password.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordApiError('New password and confirm password must match.');
      return;
    }

    setPasswordUpdating(true);

    try {
      await updateFarmerProfilePassword({
        current_password: currentPassword,
        password: newPassword,
        password_confirmation: confirmPassword,
      });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      showSuccess('Password Updated', 'Your password has been updated successfully.');
    } catch (err) {
      setPasswordApiError(getApiErrorMessage(err, 'Failed to update password.'));
    } finally {
      setPasswordUpdating(false);
    }
  };

  const handleUpdateMpin = async () => {
    setMpinApiError(null);

    if (currentMpin.length !== 6) {
      setMpinApiError('Enter your current 6-digit MPIN.');
      return;
    }

    if (newMpin.length !== 6) {
      setMpinApiError('Enter a valid 6-digit new MPIN.');
      return;
    }

    if (newMpin !== confirmMpin) {
      setMpinApiError('New MPIN and confirm MPIN must match.');
      return;
    }

    setMpinUpdating(true);

    try {
      await updateFarmerProfileMpin({
        current_mpin: currentMpin,
        mpin: newMpin,
        mpin_confirmation: confirmMpin,
      });
      setCurrentMpin('');
      setNewMpin('');
      setConfirmMpin('');
      showSuccess('MPIN Updated', 'Your MPIN has been updated successfully.');
    } catch (err) {
      setMpinApiError(getApiErrorMessage(err, 'Failed to update MPIN.'));
    } finally {
      setMpinUpdating(false);
    }
  };


  const handleSavePersonal = async () => {
    if (!profile) {
      return;
    }

    const success = await saveProfileFields({
      name: profile.fullName,
      email: profile.email,
      preferred_language: profile.preferredLanguage,
      gender: profile.genderValue || undefined,
      aadhaar_number: profile.aadhaarNumber || undefined,
      pan_number: profile.panNumber ? profile.panNumber.toUpperCase() : undefined,
    });

    if (success) {
      showSuccess('Profile Updated', 'Personal information saved successfully.');
    }
  };

  if (loading && !profile) {
    return (
      <SafeAreaView style={styles.safe}>
        <LoadingState message="Loading your profile..." />
      </SafeAreaView>
    );
  }

  if (error && !profile) {
    return (
      <SafeAreaView style={styles.safe}>
        <ErrorState message={error} onRetry={reload} />
      </SafeAreaView>
    );
  }

  const data = profile!;
  const passwordMismatch = confirmPassword.length > 0 && newPassword !== confirmPassword;
  const mpinMismatch = confirmMpin.length > 0 && newMpin !== confirmMpin;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <FarmerProfileHeader
        onBack={() => navigation.navigate('Home')}
        onNotificationsPress={() => navigation.navigate('FarmerNotifications')}
      />

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={reload} tintColor={dashboardTheme.primary} />
        }
      >
        <Text style={styles.subtitle}>Manage your personal information and account security.</Text>

        <FarmerIdentityCard
          fullName={data.fullName}
          farmerId={data.farmerId}
          mobile={data.mobile}
          email={data.email}
          verificationStatus={data.verificationStatus}
          projectName={data.projectName}
          photoUri={data.photoUrl}
          onPhotoPress={handlePhotoPress}
          onChangePhotoPress={openPhotoSheet}
        />

        <ProfileAccordionSection
          title="Personal Information"
          icon="person"
          expanded={expanded === 'personal'}
          onToggle={() => toggleSection('personal')}
        >
          <ProfileFormField label="Full Name" value={data.fullName} onChangeText={(v) => updateField('fullName', v)} />
          <ProfileFormField
            label="Mobile Number"
            value={data.mobile}
            editable={false}
            keyboardType="phone-pad"
          />
          <ProfileFormField
            label="Email Address"
            value={data.email}
            onChangeText={(v) => updateField('email', v)}
            keyboardType="email-address"
          />
          <ProfileLinkRow label="Gender" onPress={() => setGenderSheetOpen(true)} />
          <Text style={styles.selectorValue}>{data.gender}</Text>
          <ProfileFormField
            label="Aadhaar Number"
            value={data.aadhaarNumber}
            onChangeText={(v) => updateField('aadhaarNumber', v.replace(/\D/g, '').slice(0, 12))}
            placeholder={data.aadhaarMasked !== '—' ? data.aadhaarMasked : 'Enter 12-digit Aadhaar'}
            keyboardType="number-pad"
          />
          <ProfileFormField
            label="PAN Number"
            value={data.panNumber}
            onChangeText={(v) => updateField('panNumber', v.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 10))}
            placeholder={data.panMasked !== '—' ? data.panMasked : 'ABCDE1234F'}
            autoCapitalize="characters"
          />
          <SectionButton label="Save Personal Info" onPress={() => void handleSavePersonal()} loading={saving} />
        </ProfileAccordionSection>

        <ProfileAccordionSection
          title="Address Information"
          icon="location_on"
          expanded={expanded === 'address'}
          onToggle={() => toggleSection('address')}
        >
          <ProfileFormField label="Village" value={data.village} onChangeText={(v) => updateField('village', v)} />
          <ProfileFormField label="Taluka" value={data.taluka} onChangeText={(v) => updateField('taluka', v)} />
          <ProfileFormField label="District" value={data.district} onChangeText={(v) => updateField('district', v)} />
          <ProfileFormField label="State" value={data.state} onChangeText={(v) => updateField('state', v)} />
          <ProfileFormField label="Pincode" value={data.pincode} onChangeText={(v) => updateField('pincode', v)} keyboardType="number-pad" />
          <ProfileFormField label="Full Address" value={data.fullAddress} onChangeText={(v) => updateField('fullAddress', v)} />
          <ProfileFormField label="GPS Location Status" value={data.gpsStatus} editable={false} />
          <SectionButton label="Update Address" onPress={() => void handleUpdateAddress()} loading={saving} />
        </ProfileAccordionSection>

        <ProfileAccordionSection
          title="Bank Details"
          icon="payments"
          expanded={expanded === 'bank'}
          onToggle={() => toggleSection('bank')}
        >
          <ProfileFormField label="Account Holder Name" value={data.accountHolder} onChangeText={(v) => updateField('accountHolder', v)} />
          <ProfileFormField label="Bank Name" value={data.bankName} onChangeText={(v) => updateField('bankName', v)} />
          <ProfileFormField
            label="Account Number"
            value={data.accountNumberRaw || data.accountNumber}
            onChangeText={(v) => {
              updateField('accountNumberRaw', v.replace(/\D/g, ''));
              updateField('accountNumber', v.replace(/\D/g, ''));
            }}
            keyboardType="number-pad"
          />
          <ProfileFormField label="IFSC Code" value={data.ifscCode} onChangeText={(v) => updateField('ifscCode', v.toUpperCase())} autoCapitalize="characters" />
          <ProfileFormField label="Branch Name" value={data.branchName} onChangeText={(v) => updateField('branchName', v)} />
          <ProfileFormField label="Account Type" value={data.accountType} onChangeText={(v) => updateField('accountType', v)} />
          <ProfileFormField label="UPI ID (optional)" value={data.upiId} onChangeText={(v) => updateField('upiId', v)} />
          <SectionButton label="Update Bank Details" onPress={() => void handleUpdateBank()} loading={saving} />
        </ProfileAccordionSection>

        <ProfileAccordionSection
          title="Documents"
          icon="assignment"
          expanded={expanded === 'documents'}
          onToggle={() => toggleSection('documents')}
        >
          {profileDocuments.map((document) => (
            <ProfileDocumentCard
              key={document.id}
              title={document.title}
              status={document.status}
              actionsEnabled={false}
            />
          ))}
        </ProfileAccordionSection>

        <ProfileAccordionSection
          title="Security Settings"
          icon="verified"
          expanded={expanded === 'security'}
          onToggle={() => toggleSection('security')}
        >
          <SecurityCard title="Change Password">
            <ProfileSecureField
              label="Current Password"
              value={currentPassword}
              onChangeText={(value) => {
                setCurrentPassword(value);
                setPasswordApiError(null);
              }}
            />
            <ProfileSecureField
              label="New Password"
              value={newPassword}
              onChangeText={(value) => {
                setNewPassword(value);
                setPasswordApiError(null);
              }}
              helperText="Use at least 8 characters"
            />
            <ProfileSecureField
              label="Confirm New Password"
              value={confirmPassword}
              onChangeText={(value) => {
                setConfirmPassword(value);
                setPasswordApiError(null);
              }}
              errorText={passwordMismatch ? 'Passwords do not match.' : undefined}
            />
            {passwordApiError ? <Text style={styles.apiErrorText}>{passwordApiError}</Text> : null}
            <SectionButton
              label="Update Password"
              onPress={() => void handleUpdatePassword()}
              loading={passwordUpdating}
              variant="outline"
            />
          </SecurityCard>

          <SecurityCard title="Change MPIN">
            <ProfileMpinInput
              label="Current MPIN"
              value={currentMpin}
              onChange={(value) => {
                setCurrentMpin(value);
                setMpinApiError(null);
              }}
            />
            <ProfileMpinInput
              label="New 6-Digit MPIN"
              value={newMpin}
              onChange={(value) => {
                setNewMpin(value);
                setMpinApiError(null);
              }}
              helperText="MPIN is used for quick secure login"
            />
            <ProfileMpinInput
              label="Confirm New MPIN"
              value={confirmMpin}
              onChange={(value) => {
                setConfirmMpin(value);
                setMpinApiError(null);
              }}
              errorText={mpinMismatch ? 'MPINs do not match.' : undefined}
            />
            {mpinApiError ? <Text style={styles.apiErrorText}>{mpinApiError}</Text> : null}
            <SectionButton
              label="Update MPIN"
              onPress={() => void handleUpdateMpin()}
              loading={mpinUpdating}
              variant="outline"
            />
          </SecurityCard>

          <ProfileToggleRow
            label="Biometric Login"
            value={biometricEnabled}
            onValueChange={setBiometricEnabled}
          />
        </ProfileAccordionSection>

        <ProfileAccordionSection
          title="App Preferences"
          icon="notifications"
          expanded={expanded === 'preferences'}
          onToggle={() => toggleSection('preferences')}
        >
          <ProfileLinkRow label="Language" onPress={() => setLanguageSheetOpen(true)} />
          <ProfileToggleRow
            label="Notification Settings"
            value={notificationsEnabled}
            onValueChange={(value) => {
              setNotificationsEnabled(value);
              if (value) {
                navigation.navigate('FarmerNotifications');
              }
            }}
          />
          <ProfileToggleRow
            label="Dark Mode"
            value={isDarkMode}
            onValueChange={(value) => {
              void setDarkMode(value);
            }}
          />
          <ProfileLinkRow
            label="Privacy Policy"
            onPress={() => navigation.navigate('FarmerLegal', { document: 'privacy' })}
          />
          <ProfileLinkRow
            label="Terms & Conditions"
            onPress={() => navigation.navigate('FarmerLegal', { document: 'terms' })}
          />
          <ProfileLinkRow
            label="Help & Support"
            onPress={() => navigation.navigate('ChatbotSupport', { supportRole: 'farmer', sourceModule: 'farmer_profile' })}
          />
        </ProfileAccordionSection>

        <ProfileAccordionSection
          title="Account Actions"
          icon="support_agent"
          expanded={expanded === 'account'}
          onToggle={() => toggleSection('account')}
        >
          <SectionButton label="Logout" onPress={() => setModal({ visible: true, variant: 'confirm-logout' })} variant="danger" />
          <SectionButton
            label="Delete Account Request"
            onPress={() => setModal({ visible: true, variant: 'confirm-delete' })}
            variant="outline"
          />
        </ProfileAccordionSection>
      </ScrollView>

      <ProfileLanguageSheet
        visible={languageSheetOpen}
        selectedLanguage={data.preferredLanguage}
        onSelect={(value) => {
          updateField('preferredLanguage', value);
          void setLanguage(value as 'en' | 'hi' | 'gu');
          void saveProfileFields({ preferred_language: value });
        }}
        onClose={() => setLanguageSheetOpen(false)}
      />

      <ProfileOptionSheet
        visible={genderSheetOpen}
        title="Select Gender"
        options={FARMER_GENDER_OPTIONS}
        selectedValue={data.genderValue}
        onSelect={(value) => {
          updateField('genderValue', value);
          updateField('gender', genderLabel(value));
        }}
        onClose={() => setGenderSheetOpen(false)}
      />

      <ProfilePhotoBottomSheet
        visible={photoSheetOpen}
        hasPhoto={Boolean(data.photoUrl)}
        onTakePhoto={() => void handleSelectPhoto('camera')}
        onChooseGallery={() => void handleSelectPhoto('gallery')}
        onRemovePhoto={() => void handleRemovePhoto()}
        onClose={() => setPhotoSheetOpen(false)}
      />

      <ProfilePhotoPreviewModal
        visible={photoPreviewOpen}
        photoUri={data.photoUrl}
        onClose={() => setPhotoPreviewOpen(false)}
      />

      <ProfilePhotoCropModal
        visible={cropModalOpen}
        photoUri={pendingPhotoUri}
        loading={photoUpdating}
        onUpdate={() => void handleUpdateProfilePhoto()}
        onClose={() => {
          if (photoUpdating) {
            return;
          }

          setCropModalOpen(false);
          setPendingPhotoUri(null);
        }}
      />

      <ProfileActionModal
        visible={modal.visible}
        variant={modal.visible ? modal.variant : 'success'}
        title={modal.visible && modal.variant === 'success' ? modal.title : modal.visible && modal.variant === 'confirm-logout' ? 'Logout' : 'Delete Account Request'}
        message={
          modal.visible && modal.variant === 'success'
            ? modal.message
            : modal.visible && modal.variant === 'confirm-logout'
              ? 'Are you sure you want to logout from your Bhuguard farmer account?'
              : 'This will submit a request to delete your account. Our team will review it within 7 working days.'
        }
        confirmLabel={modal.visible && modal.variant === 'confirm-delete' ? 'Submit Request' : 'Logout'}
        onConfirm={() => {
          if (modal.visible && modal.variant === 'confirm-logout') {
            setModal({ visible: false });
            void logout();
            return;
          }

          if (modal.visible && modal.variant === 'confirm-delete') {
            setModal({ visible: false });
            showSuccess('Request Submitted', 'Your account deletion request has been received.');
          }
        }}
        onClose={() => setModal({ visible: false })}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: dashboardTheme.background,
  },
  content: {
    paddingHorizontal: dashboardTheme.marginMobile,
    paddingBottom: 120,
    gap: 14,
  },
  subtitle: {
    fontSize: 15,
    lineHeight: 22,
    color: dashboardTheme.onSurfaceVariant,
    marginTop: 8,
    marginBottom: 4,
  },
  sectionButton: {
    backgroundColor: dashboardTheme.primaryContainer,
    borderRadius: 10,
    paddingVertical: 13,
    alignItems: 'center',
    marginTop: 4,
  },
  sectionButtonOutline: {
    backgroundColor: dashboardTheme.surfaceLowest,
    borderWidth: 1,
    borderColor: dashboardTheme.primary,
  },
  sectionButtonDanger: {
    backgroundColor: dashboardTheme.error,
  },
  sectionButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: dashboardTheme.onPrimary,
  },
  sectionButtonTextOutline: {
    color: dashboardTheme.primaryContainer,
  },
  sectionButtonTextDanger: {
    color: dashboardTheme.onPrimary,
  },
  securityCard: {
    backgroundColor: dashboardTheme.background,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: dashboardTheme.outlineVariant,
    padding: 12,
    gap: 10,
    marginBottom: 4,
  },
  securityCardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: dashboardTheme.headingGreen,
    marginBottom: 2,
  },
  apiErrorText: {
    fontSize: 12,
    lineHeight: 16,
    color: dashboardTheme.error,
    fontWeight: '600',
  },
  selectorValue: {
    fontSize: 14,
    lineHeight: 20,
    color: dashboardTheme.onSurfaceVariant,
    marginTop: -4,
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  pressed: {
    opacity: 0.92,
    transform: [{ scale: 0.98 }],
  },
});
