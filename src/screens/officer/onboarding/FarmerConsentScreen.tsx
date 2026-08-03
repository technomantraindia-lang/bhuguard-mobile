import { useEffect, useMemo, useRef, useState } from 'react';
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
import type { FileAsset, OnboardingDraft } from '../../../context/OnboardingContext';
import { useOnboarding } from '../../../context/OnboardingContext';
import { useLiveEvidenceCapture } from '../../../hooks/useLiveEvidenceCapture';
import type { FieldOfficerStackParamList } from '../../../navigation/types';
import { dashboardTheme } from '../../../theme/bhuguardDashboardTheme';
import {
  getDemoConsentOtpCode,
  isDemoConsentOtpEnabled,
  isDemoConsentOtpMatch,
} from '../../../utils/demoConsentOtp';
import { formatFarmDisplayCode, formatFarmerDisplayCode, isValidEntityId } from '../../../utils/entityId';
import { validateConsent } from '../../../utils/onboardingValidation';
import { sanitizeOnboardingApiError } from '../../../utils/assignmentErrorMessage';
import { safeNetInfoIsConnected } from '../../../utils/safeNetInfo';

type Nav = NativeStackNavigationProp<FieldOfficerStackParamList>;

type EligibilityItem = {
  key: string;
  label: string;
  ok: boolean;
};

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

function isUsableEvidenceFile(file: FileAsset | null | undefined): boolean {
  return Boolean(file?.uri?.trim() && file?.name?.trim());
}

function countAgreementEvidence(draft: OnboardingDraft): number {
  const seen = new Set<string>();
  let count = 0;

  for (const file of [...draft.onboarding_evidences, ...draft.consent_documents, draft.consent_form]) {
    if (!isUsableEvidenceFile(file) || !file) {
      continue;
    }
    const key = `${file.uri}::${file.name}`;
    if (seen.has(key)) {
      continue;
    }
    seen.add(key);
    count += 1;
  }

  return count;
}

function buildConsentEligibility(draft: OnboardingDraft): EligibilityItem[] {
  const evidenceCount = countAgreementEvidence(draft);

  return [
    {
      key: 'data_usage',
      label: 'Data Usage Consent',
      ok: draft.data_usage_consent === true,
    },
    {
      key: 'carbon_rights',
      label: 'Carbon Rights Consent',
      ok: draft.carbon_rights_consent === true,
    },
    {
      key: 'project_participation',
      label: 'Project Participation Consent',
      ok: draft.project_participation_consent === true,
    },
    {
      key: 'has_read',
      label: 'Farmer Has Read Agreement',
      ok: draft.farmer_signature_confirmed === true,
    },
    {
      key: 'otp',
      label: 'Agreement OTP verified',
      ok: draft.agreement_otp_verified === true && Boolean(draft.agreement_verification_token.trim()),
    },
    {
      key: 'evidence',
      label: 'Agreement evidence added',
      ok: evidenceCount >= 1,
    },
    {
      key: 'farmer_name',
      label: 'Farmer Name present',
      ok: Boolean(draft.farmer_name?.trim()),
    },
    {
      key: 'farm_name',
      label: 'Farm Name present',
      ok: Boolean(draft.farm_name?.trim()),
    },
  ];
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
  const hydratedIdsRef = useRef(false);
  const evidenceCapture = useLiveEvidenceCapture({ defaultName: 'agreement-evidence.jpg', allowsEditing: false });
  const demoConsentOtpEnabled = isDemoConsentOtpEnabled();
  const demoConsentOtpCode = getDemoConsentOtpCode();

  // Refresh Farmer/Farm IDs from navigation params after land/farm creation (never blocks Continue).
  useEffect(() => {
    if (hydratedIdsRef.current) {
      return;
    }

    const params = route.params;
    if (!params) {
      return;
    }

    const patch: Partial<OnboardingDraft> = {};

    if (isValidEntityId(params.farmerId) && !isValidEntityId(draft.farmer_id)) {
      patch.farmer_id = Number(params.farmerId);
    }
    if (isValidEntityId(params.farmId) && !isValidEntityId(draft.farm_id)) {
      patch.farm_id = Number(params.farmId);
    }
    if (params.farmerName?.trim() && !draft.farmer_name.trim()) {
      patch.farmer_name = params.farmerName.trim();
    }
    if (params.farmName?.trim() && !draft.farm_name.trim()) {
      patch.farm_name = params.farmName.trim();
    }
    if (params.farmerCode?.trim() && !draft.farmer_code.trim()) {
      patch.farmer_code = params.farmerCode.trim();
    }
    if (params.farmCode?.trim() && !draft.farm_code.trim()) {
      patch.farm_code = params.farmCode.trim();
    }

    if (Object.keys(patch).length > 0) {
      updateDraft(patch);
    }

    hydratedIdsRef.current = true;
  }, [draft.farm_code, draft.farm_id, draft.farm_name, draft.farmer_code, draft.farmer_id, draft.farmer_name, route.params, updateDraft]);

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

  const eligibility = useMemo(() => buildConsentEligibility(draft), [draft]);
  const canContinue = eligibility.every((item) => item.ok);
  const consentValidationError = validateConsent(draft);

  const next = () => {
    if (!canContinue) {
      const missing = eligibility.filter((item) => !item.ok).map((item) => item.label);
      setError(missing.length ? `Complete: ${missing.join(', ')}.` : 'Complete all consent requirements.');
      return;
    }

    // Keep validateConsent as the authoritative consent-step gate (no MPIN/password).
    if (consentValidationError) {
      setError(consentValidationError);
      return;
    }
    setError(null);

    if (route.params?.returnTo === 'OnboardingBoundaryStart') {
      navigation.navigate('OnboardingBoundaryStart', {
        farmerId: route.params.farmerId ?? draft.farmer_id ?? undefined,
        farmId: route.params.farmId ?? draft.farm_id ?? undefined,
        farmerName: route.params.farmerName ?? draft.farmer_name,
        farmerCode: route.params.farmerCode ?? draft.farmer_code,
        farmName: route.params.farmName ?? draft.farm_name,
        farmCode: route.params.farmCode ?? draft.farm_code,
        village: route.params.village,
        mappingStatus: route.params.mappingStatus,
      });
      return;
    }

    navigation.navigate('FarmerOnboardingReview');
  };

  const displayError = error ?? evidenceCapture.error;
  const otpReady = /^\d{6}$/.test(otp);
  const evidenceCount = countAgreementEvidence(draft);

  const farmerName = draft.farmer_name?.trim() || '—';
  const farmName = draft.farm_name?.trim() || '—';
  const farmerIdLabel = formatFarmerDisplayCode(
    draft.farmer_id,
    draft.farmer_display_id || draft.farmer_code,
  );
  const farmIdLabel = formatFarmDisplayCode(draft.farm_id, draft.farm_code);
  const idsPresent = isValidEntityId(draft.farmer_id) && isValidEntityId(draft.farm_id);

  const devSummary =
    typeof __DEV__ !== 'undefined' && __DEV__ ? (
      <View style={styles.devSummary} accessibilityLabel="Consent eligibility checklist">
        <Text style={styles.devSummaryTitle}>Eligibility (dev)</Text>
        {eligibility.map((item) => (
          <Text key={item.key} style={item.ok ? styles.devOk : styles.devMissing}>
            {item.ok ? '✅' : '❌'} {item.label}
          </Text>
        ))}
        <Text style={idsPresent ? styles.devOk : styles.devHint}>
          {idsPresent ? '✅' : 'ℹ️'} Farmer/Farm IDs {idsPresent ? 'present' : 'optional until land/farm create'}
          {` (${farmerIdLabel} / ${farmIdLabel})`}
        </Text>
        <Text style={evidenceCapture.gpsCaptured ? styles.devOk : styles.devHint}>
          {evidenceCapture.gpsCaptured ? '✅' : 'ℹ️'} Live evidence GPS
          {evidenceCapture.gpsCaptured ? ' on capture card' : ' (not required for Continue; draft land GPS separate)'}
        </Text>
      </View>
    ) : null;

  return (
    <OnboardingConsentLayout
      stepCurrent={5}
      progressLabel="Step 5: Consent & Legal"
      onNext={next}
      nextLabel={ONBOARDING_NEXT_LABELS[5]}
      footerError={displayError}
      aboveNext={devSummary}
      nextDisabled={!canContinue || verifying || sending}
    >
      <View style={styles.identityCard}>
        <Text style={styles.identityTitle}>Registration Summary</Text>
        <Text style={styles.identityLine}>Farmer ID: {farmerIdLabel}</Text>
        <Text style={styles.identityLine}>Farmer Name: {farmerName}</Text>
        <Text style={styles.identityLine}>Farm ID: {farmIdLabel}</Text>
        <Text style={styles.identityLine}>Farm Name: {farmName}</Text>
        {!draft.farmer_name.trim() || !draft.farm_name.trim() ? (
          <Text style={styles.identityWarning}>
            Farmer Name and Farm Name are required before Final Review.
          </Text>
        ) : null}
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
        onRetryGeocode={() => void evidenceCapture.retryGeocode()}
      />
      <Pressable style={styles.uploadButton} onPress={() => void captureEvidence()}>
        <Text style={styles.uploadButtonText}>Add Another Evidence</Text>
      </Pressable>
      <Pressable style={styles.uploadButton} onPress={() => void uploadEvidence()}>
        <Text style={styles.uploadButtonText}>Upload Image</Text>
      </Pressable>
      <Text style={styles.documentsLabel}>Evidence ({evidenceCount})</Text>
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
        onToggle={() => {
          const nextChecked = !draft.farmer_signature_confirmed;
          if (nextChecked) {
            // Checking must not wipe an already-verified OTP.
            updateDraft({ farmer_signature_confirmed: true });
            return;
          }
          updateDraft({
            farmer_signature_confirmed: false,
            agreement_otp_verified: false,
            agreement_verification_token: '',
            agreement_verified_at: '',
            agreement_verified_mobile: '',
          });
        }}
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
  identityWarning: {
    fontSize: 13,
    fontWeight: '600',
    color: '#B91C1C',
    marginTop: 4,
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
  devSummary: {
    borderWidth: 1,
    borderColor: dashboardTheme.outlineVariant,
    borderRadius: 10,
    backgroundColor: dashboardTheme.surfaceLow,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 2,
  },
  devSummaryTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: dashboardTheme.onSurface,
    marginBottom: 4,
  },
  devOk: {
    fontSize: 12,
    color: '#047857',
    fontWeight: '600',
  },
  devMissing: {
    fontSize: 12,
    color: '#B91C1C',
    fontWeight: '700',
  },
  devHint: {
    fontSize: 12,
    color: dashboardTheme.onSurfaceVariant,
    fontWeight: '600',
    marginTop: 2,
  },
});
