import { useEffect, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { getApiErrorMessage, requestForgotMpinOtp } from '../../api/authApi';
import { updateFieldOfficerProfileMpin } from '../../api/fieldOfficerApi';
import { AppButton } from '../../components/AppButton';
import { ErrorState } from '../../components/ErrorState';
import { LoadingState } from '../../components/LoadingState';
import { ProfileMpinInput } from '../../components/farmer/profile/ProfileMpinInput';
import { ProfilePhotoPreviewModal } from '../../components/farmer/profile/ProfilePhotoPreviewModal';
import { OfficerProfileAppBar } from '../../components/officer/profile/OfficerProfileAppBar';
import { BhuguardMaterialIcon } from '../../components/shared/BhuguardMaterialIcon';
import type { FieldOfficerProfileSectionKey } from '../../hooks/useFieldOfficerProfileData';
import { useFieldOfficerProfileData } from '../../hooks/useFieldOfficerProfileData';
import { useTranslation } from '../../i18n/I18nContext';
import type { FieldOfficerStackParamList } from '../../navigation/types';
import {
  getFieldOfficerBiometricEnabled,
  setFieldOfficerBiometricEnabled,
} from '../../storage/biometricPreference';
import { officerCardShadow, officerTheme } from '../../theme/officerDashboardTheme';
import { downloadFieldOfficerAppointmentLetter } from '../../utils/fieldOfficerProfileDownload';
import { authenticateWithBiometrics, isBiometricHardwareAvailable } from '../../utils/biometricLogin';

type Props = NativeStackScreenProps<FieldOfficerStackParamList, 'FieldOfficerProfileSection'>;

const SECTION_TITLE_KEYS: Record<FieldOfficerProfileSectionKey, string> = {
  personal: 'profile.personalDetails',
  work: 'profile.workInformation',
  documents: 'profile.documents',
  security: 'profile.security',
};

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.detailRow}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue}>{value === '-' ? '—' : value}</Text>
    </View>
  );
}

function governmentIdMask(lastFour: string | null): string {
  if (!lastFour) {
    return 'Not uploaded';
  }

  return `XXXX XXXX ${lastFour}`;
}

export function FieldOfficerProfileSectionScreen({ route, navigation }: Props) {
  const { section } = route.params;
  const { data, loading, error, reload } = useFieldOfficerProfileData();
  const { t } = useTranslation();
  const [mpinResetLoading, setMpinResetLoading] = useState(false);
  const [currentMpin, setCurrentMpin] = useState('');
  const [newMpin, setNewMpin] = useState('');
  const [confirmMpin, setConfirmMpin] = useState('');
  const [mpinUpdating, setMpinUpdating] = useState(false);
  const [mpinApiError, setMpinApiError] = useState<string | null>(null);
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [biometricEnabled, setBiometricEnabled] = useState(false);
  const [idPreviewOpen, setIdPreviewOpen] = useState(false);
  const [appointmentDownloading, setAppointmentDownloading] = useState(false);

  useEffect(() => {
    void (async () => {
      const [available, saved] = await Promise.all([
        isBiometricHardwareAvailable(),
        getFieldOfficerBiometricEnabled(),
      ]);

      setBiometricAvailable(available);
      setBiometricEnabled(saved);
    })();
  }, []);

  const changePassword = () => {
    const mobile = data?.mobile.replace(/\D/g, '').slice(-10) ?? '';

    navigation.navigate('ForgotPassword', {
      mobile,
      flowOrigin: 'profile',
    });
  };

  const changeMpinViaOtp = async () => {
    const mobile = data?.mobile.replace(/\D/g, '').slice(-10) ?? '';

    if (!/^\d{10}$/.test(mobile)) {
      Alert.alert('MPIN reset', 'Unable to read your registered mobile number.');
      return;
    }

    setMpinResetLoading(true);

    try {
      await requestForgotMpinOtp(mobile);
      navigation.navigate('OtpVerification', {
        mobile,
        purpose: 'forgot_mpin',
        flowOrigin: 'profile',
      });
    } catch (err) {
      Alert.alert('MPIN reset', getApiErrorMessage(err, 'Failed to send OTP for MPIN reset.'));
    } finally {
      setMpinResetLoading(false);
    }
  };

  const handleUpdateMpin = async () => {
    setMpinApiError(null);

    if (currentMpin.length !== 6) {
      setMpinApiError('Enter your current 6-digit MPIN.');
      return;
    }

    if (newMpin.length !== 6) {
      setMpinApiError('New MPIN must be 6 digits.');
      return;
    }

    if (newMpin !== confirmMpin) {
      setMpinApiError('New MPIN and confirmation must match.');
      return;
    }

    setMpinUpdating(true);

    try {
      await updateFieldOfficerProfileMpin({
        current_mpin: currentMpin,
        mpin: newMpin,
        mpin_confirmation: confirmMpin,
      });
      setCurrentMpin('');
      setNewMpin('');
      setConfirmMpin('');
      Alert.alert('MPIN updated', 'Your security PIN has been changed successfully.');
    } catch (err) {
      setMpinApiError(getApiErrorMessage(err, 'Failed to update MPIN.'));
    } finally {
      setMpinUpdating(false);
    }
  };

  const handleBiometricToggle = async (nextValue: boolean) => {
    if (!biometricAvailable) {
      Alert.alert('Biometrics unavailable', 'Set up fingerprint or face unlock on your device first.');
      return;
    }

    if (nextValue) {
      const authenticated = await authenticateWithBiometrics(t('farmerLogin.biometricOption'));

      if (!authenticated) {
        return;
      }
    }

    await setFieldOfficerBiometricEnabled(nextValue);
    setBiometricEnabled(nextValue);
  };

  const handleDownloadAppointmentLetter = async () => {
    setAppointmentDownloading(true);

    try {
      const result = await downloadFieldOfficerAppointmentLetter(
        `${data?.officerCode ?? 'appointment-letter'}.pdf`,
      );

      if (!result.success && result.message) {
        Alert.alert('Download failed', result.message);
      }
    } finally {
      setAppointmentDownloading(false);
    }
  };

  if (loading && !data) {
    return (
      <SafeAreaView style={styles.safe}>
        <LoadingState message="Loading profile section..." />
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
  const governmentId = profile.governmentId;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <OfficerProfileAppBar
        onBack={() => navigation.goBack()}
        onNotificationsPress={() => navigation.navigate('FieldOfficerNotifications')}
      />

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.pageTitle}>{t(SECTION_TITLE_KEYS[section])}</Text>

        {section === 'personal' ? (
          <View style={[styles.card, officerCardShadow]}>
            <DetailRow label="Full Name" value={profile.officerName} />
            <DetailRow label="Mobile" value={profile.mobile} />
            <DetailRow label="Email" value={profile.email} />
            <DetailRow label="Officer Code" value={profile.officerCode} />
          </View>
        ) : null}

        {section === 'work' ? (
          <View style={styles.list}>
            <View style={[styles.card, officerCardShadow]}>
              <DetailRow label="Role" value={profile.roleLabel} />
              <DetailRow label="Region" value={profile.regionLabel} />
              <DetailRow label="District" value={profile.district} />
              <DetailRow label="State" value={profile.state} />
              <DetailRow label="Assigned Area" value={profile.assignedArea} />
              <DetailRow label="Status" value={profile.statusLabel} />
            </View>

            <View style={[styles.card, officerCardShadow]}>
              <Text style={styles.sectionHeading}>Assigned Talukas</Text>
              {profile.assignedTalukas.length > 0 ? (
                profile.assignedTalukas.map((taluka) => (
                  <View key={taluka.id} style={styles.talukaRow}>
                    <BhuguardMaterialIcon name="location_on" size={16} color={officerTheme.primary} />
                    <Text style={styles.talukaName}>{taluka.name}</Text>
                  </View>
                ))
              ) : (
                <Text style={styles.emptyText}>No talukas assigned yet.</Text>
              )}
            </View>
          </View>
        ) : null}

        {section === 'documents' ? (
          <View style={styles.list}>
            <View style={[styles.card, officerCardShadow]}>
              <Text style={styles.docTitle}>Government ID</Text>
              <Text style={styles.docSubtitle}>
                {governmentId.label ?? 'Government ID'}
                {governmentId.verifiedByBhuguard ? ' • Verified by Bhuguard' : ''}
              </Text>
              <Text style={styles.docMask}>{governmentIdMask(governmentId.lastFour)}</Text>

              {governmentId.available ? (
                <Pressable style={styles.actionButton} onPress={() => setIdPreviewOpen(true)}>
                  <Text style={styles.actionButtonText}>View ID</Text>
                </Pressable>
              ) : (
                <Text style={styles.emptyText}>{t('farmerLogin.profileMissingMessage')}</Text>
              )}
            </View>

            <View style={[styles.card, officerCardShadow]}>
              <Text style={styles.docTitle}>Appointment Letter</Text>
              <Text style={styles.docSubtitle}>Official Bhuguard appointment letter</Text>

              {profile.appointmentLetter.available ? (
                <Pressable
                  style={styles.actionButton}
                  onPress={() => void handleDownloadAppointmentLetter()}
                  disabled={appointmentDownloading}
                >
                  <Text style={styles.actionButtonText}>
                    {appointmentDownloading ? 'Downloading…' : 'Download Letter'}
                  </Text>
                </Pressable>
              ) : (
                <Text style={styles.emptyText}>{t('farmerLogin.noRegistration')}</Text>
              )}
            </View>
          </View>
        ) : null}

        {section === 'security' ? (
          <View style={styles.list}>
            <View style={[styles.card, officerCardShadow]}>
              <Text style={styles.sectionHeading}>Change MPIN</Text>
              <ProfileMpinInput label="Current MPIN" value={currentMpin} onChange={setCurrentMpin} />
              <ProfileMpinInput label="New MPIN" value={newMpin} onChange={setNewMpin} />
              <ProfileMpinInput
                label="Confirm New MPIN"
                value={confirmMpin}
                onChange={setConfirmMpin}
                errorText={mpinApiError ?? undefined}
              />
              <AppButton
                label={mpinUpdating ? 'Updating MPIN…' : 'Update MPIN'}
                onPress={() => void handleUpdateMpin()}
                loading={mpinUpdating}
              />
            </View>

            <View style={[styles.card, officerCardShadow]}>
              <View style={styles.toggleRow}>
                <View style={styles.toggleCopy}>
                  <Text style={styles.toggleLabel}>Biometric Login</Text>
                  <Text style={styles.toggleHint}>
                    {biometricAvailable
                      ? 'Use fingerprint or face unlock for faster sign-in.'
                      : 'Biometrics are not available on this device.'}
                  </Text>
                </View>
                <Switch
                  value={biometricEnabled}
                  onValueChange={(value) => void handleBiometricToggle(value)}
                  disabled={!biometricAvailable}
                  trackColor={{ false: officerTheme.outlineVariant, true: officerTheme.secondaryContainer }}
                  thumbColor={biometricEnabled ? officerTheme.primaryContainer : officerTheme.surfaceLowest}
                />
              </View>
            </View>

            <AppButton label="Change Password" onPress={changePassword} />
            <AppButton
              label={mpinResetLoading ? 'Sending OTP...' : 'Reset MPIN via OTP'}
              onPress={() => void changeMpinViaOtp()}
              variant="secondary"
              loading={mpinResetLoading}
            />
          </View>
        ) : null}
      </ScrollView>

      <ProfilePhotoPreviewModal
        visible={idPreviewOpen}
        photoUri={governmentId.viewUrl}
        onClose={() => setIdPreviewOpen(false)}
        caption={governmentId.label ? `${governmentId.label} Preview` : 'Government ID Preview'}
        cacheFileName="field-officer-government-id.jpg"
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
    gap: 16,
    paddingBottom: 32,
  },
  pageTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: officerTheme.onSurface,
  },
  card: {
    backgroundColor: officerTheme.surfaceLowest,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: officerTheme.outlineVariant,
    padding: 16,
    gap: 12,
  },
  list: {
    gap: 12,
  },
  detailRow: {
    gap: 4,
    paddingBottom: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: officerTheme.outlineVariant,
  },
  detailLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: officerTheme.onSurfaceVariant,
    textTransform: 'uppercase',
  },
  detailValue: {
    fontSize: 15,
    fontWeight: '600',
    color: officerTheme.onSurface,
  },
  sectionHeading: {
    fontSize: 15,
    fontWeight: '700',
    color: officerTheme.onSurface,
  },
  talukaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 6,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: officerTheme.outlineVariant,
  },
  talukaName: {
    fontSize: 15,
    fontWeight: '600',
    color: officerTheme.onSurface,
  },
  docTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: officerTheme.onSurface,
  },
  docSubtitle: {
    fontSize: 13,
    color: officerTheme.onSurfaceVariant,
  },
  docMask: {
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 1,
    color: officerTheme.primary,
    marginTop: 4,
  },
  actionButton: {
    alignSelf: 'flex-start',
    marginTop: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: officerTheme.primaryContainer,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: officerTheme.onPrimary,
  },
  emptyText: {
    fontSize: 13,
    color: officerTheme.onSurfaceVariant,
    marginTop: 4,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  toggleCopy: {
    flex: 1,
    gap: 4,
  },
  toggleLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: officerTheme.onSurface,
  },
  toggleHint: {
    fontSize: 13,
    lineHeight: 18,
    color: officerTheme.onSurfaceVariant,
  },
});
