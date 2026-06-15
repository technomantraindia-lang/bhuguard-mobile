import type { ReactNode } from 'react';
import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { getApiErrorMessage } from '../api/authApi';
import { getAuthUser } from '../storage/authStorage';
import type { AuthUser } from '../types/auth';
import { colors } from '../theme/colors';
import { useLogout } from '../hooks/useLogout';
import { AppButton } from './AppButton';
import type { DashboardMenuItem } from './DashboardMenu';
import { DashboardMenu } from './DashboardMenu';
import { LoadingState } from './LoadingState';
import { StatusBadge } from './StatusBadge';

interface RoleDashboardShellProps {
  title: string;
  profileLabel: string;
  codeLabel?: string;
  codeValue?: string;
  profileStatus?: string;
  profileDetail?: string;
  menuItems: DashboardMenuItem[];
  loadingProfile?: boolean;
  profileError?: string | null;
  onRetryProfile?: () => void;
  children?: ReactNode;
}

export function RoleDashboardShell({
  title,
  profileLabel,
  codeLabel,
  codeValue,
  profileStatus,
  profileDetail,
  menuItems,
  loadingProfile = false,
  profileError = null,
  onRetryProfile,
  children,
}: RoleDashboardShellProps) {
  const logout = useLogout();
  const [user, setUser] = useState<AuthUser | null>(null);

  useEffect(() => {
    void getAuthUser().then(setUser);
  }, []);

  if (!user) {
    return <LoadingState message="Loading session..." />;
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.header}>
          <View style={styles.headerText}>
            <Text style={styles.brand}>Bhuguard</Text>
            <Text style={styles.title}>{title}</Text>
          </View>
          <AppButton label="Logout" onPress={logout} variant="danger" style={styles.logoutBtn} />
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Signed in as</Text>
          <Text style={styles.name}>{user.name ?? '-'}</Text>
          <Text style={styles.meta}>{user.mobile || user.email || '-'}</Text>
          <StatusBadge status={user.user_type} />
          {codeLabel && codeValue && codeValue !== '-' ? (
            <Text style={styles.code}>{codeLabel}: {codeValue}</Text>
          ) : null}
        </View>

        <View style={[styles.card, styles.profileCard]}>
          <Text style={styles.cardTitle}>{profileLabel}</Text>
          {loadingProfile ? (
            <Text style={styles.meta}>Loading profile...</Text>
          ) : profileError ? (
            <>
              <Text style={styles.errorText}>{profileError}</Text>
              {onRetryProfile ? (
                <AppButton label="Retry" onPress={onRetryProfile} variant="secondary" style={styles.retryBtn} />
              ) : null}
            </>
          ) : (
            <>
              {profileStatus && profileStatus !== '-' ? <StatusBadge status={profileStatus} /> : null}
              {profileDetail ? <Text style={styles.meta}>{profileDetail}</Text> : null}
            </>
          )}
        </View>

        {children}
        <DashboardMenu items={menuItems} />
      </ScrollView>
    </SafeAreaView>
  );
}

export function useProfileLoader(loadFn: () => Promise<{ status?: string; detail?: string; code?: string }>) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string | undefined>();
  const [detail, setDetail] = useState<string | undefined>();
  const [code, setCode] = useState<string | undefined>();

  const load = async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await loadFn();
      setStatus(result.status);
      setDetail(result.detail);
      setCode(result.code);
    } catch (err) {
      setError(getApiErrorMessage(err, 'Failed to load profile.'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  return { loading, error, status, detail, code, reload: load };
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  container: { padding: 20, gap: 16 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 12,
  },
  headerText: { flex: 1 },
  brand: { color: colors.primary, fontWeight: '800', fontSize: 14 },
  title: { fontSize: 24, fontWeight: '800', color: colors.text },
  logoutBtn: { paddingVertical: 10, paddingHorizontal: 12, minWidth: 90 },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 8,
  },
  profileCard: { minHeight: 80 },
  cardTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  name: { fontSize: 20, fontWeight: '700', color: colors.text },
  meta: { fontSize: 14, color: colors.textMuted, lineHeight: 20 },
  code: { fontSize: 14, fontWeight: '600', color: colors.eco, marginTop: 4 },
  successCard: { backgroundColor: colors.successBg, borderColor: colors.successBorder },
  successTitle: { fontSize: 16, fontWeight: '700', color: colors.success },
  successBody: { fontSize: 14, color: colors.success, lineHeight: 20 },
  errorText: { color: colors.error, fontSize: 14, lineHeight: 20 },
  retryBtn: { marginTop: 8 },
});
