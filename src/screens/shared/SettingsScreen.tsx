import { SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';

import { AppButton } from '../../components/AppButton';
import { AppCard } from '../../components/AppCard';
import { ScreenHeader } from '../../components/ScreenHeader';
import { useLogout } from '../../hooks/useLogout';
import { colors } from '../../theme/colors';

interface SettingsScreenProps {
  title: string;
  subtitle?: string;
}

export function SettingsScreen({ title, subtitle }: SettingsScreenProps) {
  const logout = useLogout();

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container}>
        <ScreenHeader title={title} subtitle={subtitle} />
        <AppCard
          title="Account"
          subtitle="Your login session is active. You can securely sign out from this device anytime."
        />
        <View style={styles.actions}>
          <AppButton label="Logout" onPress={logout} variant="danger" />
        </View>
        <Text style={styles.note}>
          More settings options will be added in upcoming releases.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  container: { padding: 20, gap: 12, paddingBottom: 24 },
  actions: { marginTop: 4 },
  note: { color: colors.textMuted, fontSize: 13, lineHeight: 18 },
});
