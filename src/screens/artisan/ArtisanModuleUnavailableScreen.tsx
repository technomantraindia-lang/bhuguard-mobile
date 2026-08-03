import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';

import { ScreenHeader } from '../../components/ScreenHeader';
import type { ArtisanStackParamList } from '../../navigation/types';
import { artisanTheme } from '../../theme/artisanTheme';
import { spacing } from '../../theme';

type Nav = NativeStackNavigationProp<ArtisanStackParamList, 'ArtisanModuleUnavailable'>;
type ScreenRoute = RouteProp<ArtisanStackParamList, 'ArtisanModuleUnavailable'>;

const COPY: Record<
  NonNullable<ArtisanStackParamList['ArtisanModuleUnavailable']>['module'],
  { title: string; body: string }
> = {
  wallet: {
    title: 'Wallet',
    body: 'Artisan wallet balances are not available on this API build yet. No balance is shown so amounts cannot be invented. Contact Admin after wallet endpoints are enabled on the server.',
  },
  training: {
    title: 'Biochar Training',
    body: 'Biochar Training content is not published for Artisan Pro on this API build yet. Training modules will appear here once Admin enables them — nothing is marked complete until then.',
  },
};

/**
 * Controlled unavailable state for Phase 14 modules that must not fabricate data.
 */
export function ArtisanModuleUnavailableScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<ScreenRoute>();
  const module = route.params?.module ?? 'wallet';
  const copy = COPY[module] ?? COPY.wallet;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScreenHeader title={copy.title} showBrandLogo={false} />
      <View style={styles.body}>
        <Text style={styles.eyebrow}>Unavailable</Text>
        <Text style={styles.title}>{copy.title}</Text>
        <Text style={styles.message}>{copy.body}</Text>
        <Pressable
          style={styles.button}
          onPress={() => navigation.goBack()}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <Text style={styles.buttonText}>Back to Dashboard</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: artisanTheme.creamBg },
  body: {
    flex: 1,
    padding: spacing.lg,
    gap: 12,
  },
  eyebrow: {
    fontSize: 12,
    fontWeight: '700',
    color: artisanTheme.actionGreen,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: artisanTheme.deepText,
  },
  message: {
    fontSize: 15,
    lineHeight: 22,
    color: artisanTheme.secondaryText,
  },
  button: {
    marginTop: 16,
    alignSelf: 'flex-start',
    backgroundColor: artisanTheme.primary,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  buttonText: {
    color: artisanTheme.white,
    fontWeight: '700',
    fontSize: 14,
  },
});
