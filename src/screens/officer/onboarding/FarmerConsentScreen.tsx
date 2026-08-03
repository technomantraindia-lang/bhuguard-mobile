import { useEffect, useRef, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import * as DocumentPicker from 'expo-document-picker';

import { getApiErrorMessage } from '../../../api/authApi';
import {
  sendOnboardingAgreementOtp,
  verifyOnboardingAgreementOtp,
} from '../../../api/fieldOfficerApi';
import { OnboardingConsentLayout } from '../../../components/onboarding/OnboardingConsentLayout';
import {
  OnboardingSignatureCheckbox,
  OnboardingToggleSwitch,
} from '../../../components/onboarding/OnboardingConsentControls';
import { LiveEvidenceCaptureCard } from '../../../components/evidence/LiveEvidenceCaptureCard';
import { ONBOARDING_NEXT_LABELS } from '../../../constants/onboardingSteps';
import type { FileAsset } from '../../../context/OnboardingContext';
import { useOnboarding } from '../../../context/OnboardingContext';
import { useLiveEvidenceCapture } from '../../../hooks/useLiveEvidenceCapture';
import type { FieldOfficerStackParamList } from '../../../navigation/types';
import { dashboardTheme } from '../../../theme/bhuguardDashboardTheme';
import {
  getDemoConsentOtpCode,
  isDemoConsentOtpEnabled,
  isDemoConsentOtpMatch,
} from '../../../utils/demoConsentOtp';
import { formatFarmDisplayCode, formatFarmerDisplayCode } from '../../../utils/entityId';
import { validateConsent } from '../../../utils/onboardingValidation';
import { sanitizeOnboardingApiError } from '../../../utils/assignmentErrorMessage';
import { safeNetInfoIsConnected } from '../../../utils/safeNetInfo';

type Nav = NativeStackNavigationProp<FieldOfficerStackParamList>;

function toAsset(uri: string, name: string, mimeType: string, size?: number): FileAsset {
  return { uri, name, mimeType, size };
}

function maskMobile(mobile: string): string {
  const digits = mobile.replace(/\D/g, '').slice(-10);
  if (digits.length !== 10) {
    return mobile;
  }
  return `+91 ******${digits.slice(-4)}`;
}

export function FarmerConsentScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<RouteProp<FieldOfficerStackParamList, 'FarmerConsent'>>();
  const { draft, updateDraft } = useOnboarding();
  const [error, setError] = useState<string | null>(null);
  const [otp, setOtp] = useState('');
  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [sendInfo, setSendInfo] = useState<string | null>(null);
  const [maskedMobile, setMaskedMobile] = useState(maskMobile(draft.mobile));
  const [resendAfter, setResendAfter] = useState(0);
  const verifyingRef = useRef(false);
  const evidenceCapture = useLiveEvidenceCapture({ defaultName: 'agreement-evidence.jpg', allowsEditing: false });
  const demoConsentOtpEnabled = isDemoConsentOtpEnabled();
  const demoConsentOtpCode = getDemoConsentOtpCode();

  useEffect(() => {
    if (resendAfter <= 0) {
      return;
    }
    const timer = setInterval(() => setResendAfter((value) => Math.max(0, value - 1)), 1000);
    return () => clearInterval(timer);
  }, [resendAfter]);

  const ensureOnline = async (): Promise<boolean> => {
    if (demoConsentOtpEnabled) {
      return true;
    }
    const online = await safeNetInfoIsConnected();
    if (!online) {
      setError('Internet connection is required to send and verify the Farmer Agreement OTP.');
      return false;
    }
    return true;
  };

  const addEvidence = (file: FileAsset) => {
    updateDraft({
      onboarding_evidences: [...draft.onboarding_evidences, file],
      consent_documents: [...draft.consent_documents, file],
      consent_form: draft.consent_form ?? file,
    });
  };

  const captureEvidence = async () => {
    setError(null);
    const captured = await evidenceCapture.captureEvidence();
    if (!captured) {
      return;
    }
    addEvidence(toAsset(captured.uri, captured.name, captured.type));
  };

  const uploadEvidence = async () => {
    setError(null);
    const result = await DocumentPicker.getDocumentAsync({
      type: ['image/jpeg', 'image/png'],
      copyToCacheDirectory: true,
      multiple: false,
    });
    if (result.canceled) {
      return;
    }
    const asset = result.assets[0];
    if (!asset) {
      return;
    }
    addEvidence(toAsset(asset.uri, asset.name, asset.mimeType ?? 'image/jpeg', asset.size));
  };

  const removeEvidence = (index: number) => {
    const evidences = draft.onboarding_evidences.filter((_, evidenceIndex) => evidenceIndex !== index);
    updateDraft({
      onboarding_evidences: evidences,
      consent_documents: evidences,
      consent_form: evidences[0] ?? null,
    });
  };

  const sendOtp = async () => {
    if (!draft.farmer_signature_confirmed) {
      setError('Confirm that the farmer has read the Agreement before sending OTP.');
      return;
    }
    if (!/^[6-9]\d{9}$/.test(draft.mobile.trim())) {
      setError('Enter a valid farmer mobile number before sending OTP.');
      return;
    }
    if (!(await ensureOnline())) {
      return;
    }

    setSending(true);
    setError(null);
    setSendInfo(null);
    try {
      if (demoConsentOtpEnabled) {
        try {
          const response = await sendOnboardingAgreementOtp(draft.mobile.trim());
          setMaskedMobile(response.masked_mobile || maskMobile(draft.mobile));
          setResendAfter(Number(response.resend_after_seconds ?? 60));
        } catch {
          setMaskedMobile(maskMobile(draft.mobile));
          setResendAfter(60);
        }
        setSendInfo(`Development OTP generated. Use ${demoConsentOtpCode}.`);
      } else {
        const response = await sendOnboardingAgreementOtp(draft.mobile.trim());
        setMaskedMobile(response.masked_mobile || maskMobile(draft.mobile));
        setResendAfter(Number(response.resend_after_seconds ?? 60));
        setSendInfo(response.message || null);
      }

      updateDraft({
        agreement_otp_verified: false,
        agreement_verification_token: '',
        agreement_verified_at: '',
        agreement_verified_mobile: '',
      });
    } catch (err) {
      setError(sanitizeOnboardingApiError(getApiErrorMessage(err, 'Unable to send Agreement OTP.')));
    } finally {
      setSending(false);
    }
  };

  const verifyOtp = async () => {
    if (verifyingRef.current) {
      return;
    }
    if (!/^\d{6}$/.test(otp)) {
      setError('Enter the 6-digit OTP.');
      return;
    }
    if (!(await ensureOnline())) {
      return;
    }

    verifyingRef.current = true;
    setVerifying(true);
    setError(null);
    try {
      if (isDemoConsentOtpMatch(otp)) {
        try {
          let response;
          try {
            response = await verifyOnboardingAgreementOtp(draft.mobile.trim(), otp);
          } catch {
            await sendOnboardingAgreementOtp(draft.mobile.trim());
            response = await verifyOnboardingAgreementOtp(draft.mobile.trim(), otp);
          }
          updateDraft({
            agreement_otp_verified: true,
            agreement_verification_token: response.agreement_verification_token,
            agreement_verified_at: response.verified_at,
            agreement_verified_mobile: response.masked_mobile || maskMobile(draft.mobile),
          });
          setMaskedMobile(response.masked_mobile || maskMobile(draft.mobile));
          setOtp('');
          setSendInfo(null);
          Alert.alert('Verified', 'Consent OTP verified successfully.');
          return;
        } catch (err) {
          setError(sanitizeOnboardingApiError(getApiErrorMessage(err, 'OTP verification failed.')));
          return;
        }
      }

      const response = await verifyOnboardingAgreementOtp(draft.mobile.trim(), otp);
      updateDraft({
        agreement_otp_verified: true,
        agreement_verification_token: response.agreement_verification_token,
        agreement_verified_at: response.verified_at,
        agreement_verified_mobile: response.masked_mobile || maskMobile(draft.mobile),
      });
      setMaskedMobile(response.masked_mobile || maskMobile(draft.mobile));
      setOtp('');
      setSendInfo(null);
      Alert.alert('Verified', 'Consent OTP verified successfully.');
    } catch (err) {
      setError(sanitizeOnboardingApiError(getApiErrorMessage(err, 'OTP verification failed.')));
    } finally {
      verifyingRef.current = false;
      setVerifying(false);
    }
  };

  const next = () => {
    const validationError = validateConsent(draft);
    if (validationError) {
      setError(validationError);
      return;
    }
    setError(null);

    if (route.params?.returnTo === 'OnboardingBoundaryStart') {
      navigation.navigate('OnboardingBoundaryStart', {
        farmerId: route.params.farmerId,
        farmId: route.params.farmId,
        farmerName: route.params.farmerName,
        farmerCode: route.params.farmerCode,
        farmName: route.params.farmName,
        farmCode: route.params.farmCode,
        village: route.params.village,
        mappingStatus: route.params.mappingStatus,
      });
      return;
    }

    navigation.navigate('FarmerLandDetails');
  };

  const displayError = error ?? evidenceCapture.error;
  const otpReady = /^\d{6}$/.test(otp);

  return (
    <OnboardingConsentLayout
      stepCurrent={3}
      progressLabel="Step 3: Consent & Legal"
      onNext={next}
      nextLabel={ONBOARDING_NEXT_LABELS[3]}
      footerError={displayError}
      nextDisabled={!draft.agreement_otp_verified}
    >
      <View style={styles.identityCard}>
        <Text style={styles.identityTitle}>Registration Summary</Text>
        <Text style={styles.identityLine}>
          Farmer ID: {formatFarmerDisplayCode(draft.farmer_id, draft.farmer_display_id || draft.farmer_code)}
        </Text>
        <Text style={styles.identityLine}>Farmer Name: {draft.farmer_name?.trim() || '-'}</Text>
        <Text style={styles.identityLine}>Farm ID: {formatFarmDisplayCode(draft.farm_id, draft.farm_code)}</Text>
        <Text style={styles.identityLine}>Farm Name: {draft.farm_name?.trim() || '-'}</Text>
      </View>

      <View style={styles.toggles}>
        <OnboardingToggleSwitch
          title="Data Usage Consent"
          description="Allows Bhuguard to process land and yield data for MRV calculations."
          value={draft.data_usage_consent}
          onValueChange={(value) => updateDraft({ data_usage_consent: value })}
        />
        <OnboardingToggleSwitch
          title="Carbon Rights Assignment"
          description="Transfers generated carbon credits to the project developer."
          value={draft.carbon_rights_consent}
          onValueChange={(value) => updateDraft({ carbon_rights_consent: value })}
        />
        <OnboardingToggleSwitch
          title="Project Participation Consent"
          description="Agrees to longitudinal monitoring and auditing procedures."
          value={draft.project_participation_consent}
          onValueChange={(value) => updateDraft({ project_participation_consent: value })}
        />
      </View>

      <View style={styles.divider} />

      <Text style={styles.sectionTitle}>Agreement Evidence</Text>
      <LiveEvidenceCaptureCard
        evidence={evidenceCapture.evidence}
        capturing={evidenceCapture.capturing}
        error={evidenceCapture.error}
        onOpenCamera={() => void captureEvidence()}
        onRetake={() => void captureEvidence()}
      />
      <Pressable style={styles.uploadButton} onPress={() => void captureEvidence()}>
        <Text style={styles.uploadButtonText}>Add Another Evidence</Text>
      </Pressable>
      <Pressable style={styles.uploadButton} onPress={() => void uploadEvidence()}>
        <Text style={styles.uploadButtonText}>Upload Image</Text>
      </Pressable>
      <Text style={styles.documentsLabel}>Evidence ({draft.onboarding_evidences.length})</Text>
      {draft.onboarding_evidences.map((document, index) => (
        <View key={`${document.uri}-${index}`} style={styles.documentRow}>
          <Text style={styles.documentName} numberOfLines={1}>
            {document.name}
          </Text>
          <Pressable onPress={() => removeEvidence(index)}>
            <Text style={styles.removeText}>Remove</Text>
          </Pressable>
        </View>
      ))}

      <OnboardingSignatureCheckbox
        label="Farmer Has Read Agreement"
        checked={draft.farmer_signature_confirmed}
        onToggle={() =>
          updateDraft({
            farmer_signature_confirmed: !draft.farmer_signature_confirmed,
            agreement_otp_verified: false,
            agreement_verification_token: '',
          })
        }
      />

      {draft.farmer_signature_confirmed ? (
        <View style={styles.otpCard}>
          <Text style={styles.sectionTitle}>Agreement OTP Verification</Text>
          <Text style={styles.otpHelp}>
            {draft.agreement_otp_verified
              ? `Agreement Status: OTP Verified (${draft.agreement_verified_mobile || maskedMobile})`
              : `OTP will be sent to ${maskedMobile}`}
          </Text>
          {!draft.agreement_otp_verified ? (
            <>
              <Pressable
                style={[styles.uploadButton, (sending || resendAfter > 0) && styles.disabled]}
                disabled={sending || resendAfter > 0}
                onPress={() => void sendOtp()}
              >
                <Text style={styles.uploadButtonText}>
                  {sending ? 'Sending…' : resendAfter > 0 ? `Resend OTP in ${resendAfter}s` : 'Send OTP'}
                </Text>
              </Pressable>
              {demoConsentOtpEnabled ? (
                <Text style={styles.demoHint}>Development OTP: {demoConsentOtpCode}</Text>
              ) : null}
              {sendInfo ? <Text style={styles.sendInfo}>{sendInfo}</Text> : null}
              <TextInput
                style={styles.otpInput}
                value={otp}
                onChangeText={(value) => setOtp(value.replace(/\D/g, '').slice(0, 6))}
                keyboardType="number-pad"
                maxLength={6}
                placeholder="Enter 6-digit OTP"
                placeholderTextColor={dashboardTheme.onSurfaceVariant}
              />
              <Pressable
                style={[styles.verifyButton, (verifying || !otpReady) && styles.disabled]}
                disabled={verifying || !otpReady}
                onPress={() => void verifyOtp()}
              >
                <Text style={styles.verifyButtonText}>{verifying ? 'Verifying…' : 'Verify OTP'}</Text>
              </Pressable>
            </>
          ) : (
            <Text style={styles.verified}>Agreement Status: OTP Verified</Text>
          )}
        </View>
      ) : null}
    </OnboardingConsentLayout>
  );
}

const styles = StyleSheet.create({
  identityCard: {
    backgroundColor: dashboardTheme.surfaceLow,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: dashboardTheme.outlineVariant,
    paddingHorizontal: 14,
    paddingVertical: 14,
    gap: 2,
  },
  identityTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: dashboardTheme.onSurface,
    marginBottom: 4,
  },
  identityLine: {
    fontSize: 13,
    color: dashboardTheme.onSurfaceVariant,
  },
  toggles: { gap: 16 },
  divider: { height: 1, backgroundColor: `${dashboardTheme.outlineVariant}80` },
  sectionTitle: { color: dashboardTheme.onSurface, fontWeight: '700', fontSize: 15 },
  uploadButton: {
    borderWidth: 1,
    borderColor: dashboardTheme.primary,
    borderRadius: 10,
    padding: 12,
    alignItems: 'center',
  },
  uploadButtonText: { color: dashboardTheme.primary, fontWeight: '700' },
  documentsLabel: { color: dashboardTheme.onSurface, fontWeight: '700' },
  documentRow: {
    alignItems: 'center',
    borderColor: dashboardTheme.outlineVariant,
    borderRadius: 10,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'space-between',
    padding: 12,
  },
  documentName: { color: dashboardTheme.onSurface, flex: 1 },
  removeText: { color: '#B91C1C', fontWeight: '700' },
  otpCard: { gap: 10, marginTop: 4 },
  otpHelp: { color: dashboardTheme.onSurfaceVariant, fontSize: 13 },
  demoHint: {
    color: '#92400E',
    backgroundColor: '#FEF3C7',
    borderColor: '#F59E0B',
    borderWidth: 1,
    borderRadius: 8,
    overflow: 'hidden',
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 13,
    fontWeight: '700',
  },
  sendInfo: { color: '#047857', fontSize: 13, fontWeight: '600' },
  otpInput: {
    borderWidth: 1,
    borderColor: dashboardTheme.outlineVariant,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 12,
    letterSpacing: 4,
    fontSize: 18,
    color: dashboardTheme.onSurface,
    backgroundColor: dashboardTheme.surfaceLowest,
  },
  verifyButton: {
    backgroundColor: dashboardTheme.primaryContainer,
    borderRadius: 10,
    padding: 12,
    alignItems: 'center',
  },
  verifyButtonText: { color: dashboardTheme.onPrimary, fontWeight: '700' },
  verified: { color: '#047857', fontWeight: '700' },
  disabled: { opacity: 0.6 },
});
