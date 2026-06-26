import { useCallback, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { logout } from '../../api/authApi';
import { getArtisanProfile } from '../../api/artisanApi';
import { LoadingState } from '../../components/LoadingState';
import { ScreenHeader } from '../../components/ScreenHeader';
import { navigateToLogin } from '../../navigation/navigationRef';
import type { ArtisanStackParamList } from '../../navigation/types';
import { colors, spacing } from '../../theme';
import { pickString, type ApiRecord } from '../../utils/apiHelpers';

type Nav = NativeStackNavigationProp<ArtisanStackParamList, 'ArtisanProfile'>;

export function ArtisanProfileScreen() {
  const navigation = useNavigation<Nav>();
  const [profile, setProfile] = useState<ApiRecord | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);

    try {
      const data = await getArtisanProfile();
      setProfile((data.artisan ?? data) as ApiRecord);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  const handleLogout = () => {
    Alert.alert('Logout', 'Sign out from the Artisan app?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: () => {
          void (async () => {
            await logout();
            navigateToLogin();
          })();
        },
      },
    ]);
  };

  if (loading && !profile) {
    return (
      <SafeAreaView style={styles.safe}>
        <LoadingState message="Loading profile..." />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScreenHeader title="Profile" showBrandLogo={false} />
      <View style={styles.container}>
        <Text style={styles.name}>{pickString(profile ?? {}, 'name')}</Text>
        <Text style={styles.meta}>Code: {pickString(profile ?? {}, 'artisan_code', 'artisanCode')}</Text>
        <Text style={styles.meta}>Mobile: {pickString(profile ?? {}, 'mobile')}</Text>
        <Text style={styles.meta}>Village: {pickString(profile ?? {}, 'village')}</Text>

        <Pressable style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutText}>Logout</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  container: { padding: spacing.lg, gap: spacing.sm },
  name: { fontSize: 22, fontWeight: '700', color: colors.text },
  meta: { color: colors.textMuted },
  logoutButton: {
    marginTop: spacing.xl,
    borderWidth: 1,
    borderColor: colors.danger,
    borderRadius: 12,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  logoutText: { color: colors.danger, fontWeight: '700' },
});
