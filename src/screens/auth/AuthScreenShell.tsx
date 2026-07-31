import type { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';

import { AppButton } from '../../components/AppButton';
import { KeyboardAwareScreen } from '../../components/layout/KeyboardAwareScreen';
import { colors, spacing, typography } from '../../theme';

interface AuthScreenShellProps {
  title: string;
  subtitle: string;
  children: ReactNode;
  showBack?: boolean;
  footer?: ReactNode;
}

export function AuthScreenShell({ title, subtitle, children, showBack = false, footer }: AuthScreenShellProps) {
  const navigation = useNavigation();

  return (
    <KeyboardAwareScreen
      edges={['top', 'bottom']}
      backgroundColor={colors.background}
      contentContainerStyle={styles.container}
      footer={footer}
    >
      <View style={styles.hero}>
        <View style={styles.logoCircle}>
          <Text style={styles.logoText}>B</Text>
        </View>
        <Text style={styles.brand}>Bhuguard</Text>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.subtitle}>{subtitle}</Text>
      </View>
      {showBack ? (
        <AppButton label="Back" variant="ghost" onPress={() => navigation.goBack()} style={styles.back} />
      ) : null}
      <View style={styles.form}>{children}</View>
    </KeyboardAwareScreen>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: spacing.xxl,
    justifyContent: 'center',
  },
  hero: { alignItems: 'center', marginBottom: spacing.xl },
  logoCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoText: { fontSize: 28, fontWeight: '800', color: colors.white },
  brand: { ...typography.brand, marginTop: spacing.md },
  title: { ...typography.h2, marginTop: spacing.sm, textAlign: 'center' },
  subtitle: { ...typography.caption, marginTop: spacing.xs, textAlign: 'center' },
  back: { alignSelf: 'flex-start', marginBottom: spacing.sm },
  form: { gap: spacing.md },
});
