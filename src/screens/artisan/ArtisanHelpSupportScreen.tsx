import { Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { ScreenHeader } from '../../components/ScreenHeader';
import type { ArtisanStackParamList } from '../../navigation/types';
import { artisanTheme } from '../../theme/artisanTheme';
import { spacing } from '../../theme';

type Nav = NativeStackNavigationProp<ArtisanStackParamList, 'ArtisanHelpSupport'>;

const SUPPORT_EMAIL = 'support@bhuguard.com';

/**
 * Phase 14 Help & Support entry for Artisan Pro.
 * Uses a real contact path — does not invent ticket history.
 */
export function ArtisanHelpSupportScreen() {
  const navigation = useNavigation<Nav>();

  const openEmail = () => {
    void Linking.openURL(`mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent('Artisan Pro Support')}`);
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScreenHeader title="Help & Support" showBrandLogo={false} />
      <View style={styles.body}>
        <Text style={styles.title}>Need help with Artisan Pro?</Text>
        <Text style={styles.message}>
          Reach Bhuguard support for check-in, farm navigator, or biochar workflow issues. Do not share OTP,
          pattern, or password details in email.
        </Text>

        <Pressable style={styles.primary} onPress={openEmail} accessibilityRole="button">
          <Text style={styles.primaryText}>Email {SUPPORT_EMAIL}</Text>
        </Pressable>

        <Pressable
          style={styles.secondary}
          onPress={() => navigation.goBack()}
          accessibilityRole="button"
          accessibilityLabel="Back to dashboard"
        >
          <Text style={styles.secondaryText}>Back to Dashboard</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: artisanTheme.creamBg },
  body: { flex: 1, padding: spacing.lg, gap: 12 },
  title: { fontSize: 22, fontWeight: '800', color: artisanTheme.deepText },
  message: { fontSize: 15, lineHeight: 22, color: artisanTheme.secondaryText },
  primary: {
    marginTop: 8,
    backgroundColor: artisanTheme.primary,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  primaryText: { color: artisanTheme.white, fontWeight: '700', fontSize: 14 },
  secondary: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: artisanTheme.softBorder,
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: artisanTheme.white,
  },
  secondaryText: { color: artisanTheme.deepText, fontWeight: '700', fontSize: 14 },
});
