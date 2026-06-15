import { useCallback, useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { getApiErrorMessage, requestForgotMpinOtp } from '../../api/authApi';
import { getFieldOfficerProfile } from '../../api/fieldOfficerApi';
import { ProfileManageLayout } from '../../components/profile/ProfileManageLayout';
import { useLogout } from '../../hooks/useLogout';
import type { FieldOfficerStackParamList } from '../../navigation/types';
import { dashboardTheme } from '../../theme/bhuguardDashboardTheme';
import { isNetworkError, NETWORK_ERROR_MESSAGE } from '../../utils/apiError';
import { pickString, type ApiRecord } from '../../utils/apiHelpers';

type Navigation = NativeStackNavigationProp<FieldOfficerStackParamList>;

function ProfileDetailRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.detailRow}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue}>{value || '—'}</Text>
    </View>
  );
}

export function FieldOfficerProfileScreen() {
  const navigation = useNavigation<Navigation>();
  const logout = useLogout();
  const [data, setData] = useState<ApiRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mpinLoading, setMpinLoading] = useState(false);
  const fetcherRef = useRef(getFieldOfficerProfile);
  fetcherRef.current = getFieldOfficerProfile;

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await fetcherRef.current();
      setData(result);
    } catch (err) {
      if (isNetworkError(err)) {
        setError(NETWORK_ERROR_MESSAGE);
      } else {
        setError(getApiErrorMessage(err, 'Failed to load profile.'));
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const user = (data?.user ?? data ?? {}) as ApiRecord;
  const officer = (user.field_officer_profile ?? user.field_officer ?? user) as ApiRecord;
  const mobile = pickString(user, 'mobile').replace(/\D/g, '').slice(-10);

  const changePassword = () => {
    navigation.navigate('ForgotPassword', {
      mobile,
      flowOrigin: 'profile',
    });
  };

  const changeMpin = async () => {
    if (!/^\d{10}$/.test(mobile)) {
      setError('Unable to read your registered mobile number.');
      return;
    }

    setMpinLoading(true);

    try {
      await requestForgotMpinOtp(mobile);
      navigation.navigate('OtpVerification', {
        mobile,
        purpose: 'forgot_mpin',
        flowOrigin: 'profile',
      });
    } catch (err) {
      setError(getApiErrorMessage(err, 'Failed to send OTP for MPIN reset.'));
    } finally {
      setMpinLoading(false);
    }
  };

  return (
    <ProfileManageLayout
      title="Manage Your Profile"
      subtitle="Update your personal details and security settings for your DMRV account."
      loading={loading}
      error={error}
      onRetry={load}
      steps={[
        {
          id: 'personal-info',
          label: 'Personal Info',
          icon: 'person',
          onPress: () => undefined,
        },
        {
          id: 'change-password',
          label: 'Change Password',
          icon: 'lock',
          onPress: changePassword,
        },
        {
          id: 'security-pin',
          label: 'Security PIN',
          icon: 'pin',
          onPress: changeMpin,
          loading: mpinLoading,
        },
      ]}
      profileDetails={
        <>
          <ProfileDetailRow label="Name" value={pickString(user, 'name')} />
          <ProfileDetailRow
            label="Officer Code"
            value={pickString(officer, 'officer_code', 'field_officer_code')}
          />
          <ProfileDetailRow label="Mobile" value={pickString(user, 'mobile')} />
          <ProfileDetailRow label="Email" value={pickString(user, 'email')} />
          <ProfileDetailRow label="Zone" value={pickString(officer, 'zone', 'district')} />
          <ProfileDetailRow label="Assigned Area" value={pickString(officer, 'assigned_area')} />
          <ProfileDetailRow label="Status" value={pickString(user, 'status')} />
        </>
      }
      footerAction={{
        label: 'Logout',
        onPress: logout,
        variant: 'danger',
      }}
    />
  );
}

const styles = StyleSheet.create({
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    paddingVertical: 6,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: dashboardTheme.outlineVariant,
  },
  detailLabel: {
    fontSize: 13,
    color: dashboardTheme.onSurfaceVariant,
    flex: 1,
  },
  detailValue: {
    fontSize: 13,
    fontWeight: '600',
    color: dashboardTheme.onSurface,
    flex: 1,
    textAlign: 'right',
  },
});
