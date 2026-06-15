import { Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BhuguardMaterialIcon, type BhuguardIconName } from '../../components/shared/BhuguardMaterialIcon';
import { ScreenHeader } from '../../components/ScreenHeader';
import { dashboardTheme } from '../../theme/bhuguardDashboardTheme';

const SUPPORT_EMAIL = 'support@bhuguard.com';
const SUPPORT_PHONE = '1800000000';

function SupportAction({
  icon,
  label,
  value,
  onPress,
}: {
  icon: BhuguardIconName;
  label: string;
  value: string;
  onPress: () => void;
}) {
  return (
    <Pressable style={({ pressed }) => [styles.actionCard, pressed && styles.pressed]} onPress={onPress}>
      <View style={styles.iconCircle}>
        <BhuguardMaterialIcon name={icon} size={22} color={dashboardTheme.primaryContainer} />
      </View>
      <View style={styles.copy}>
        <Text style={styles.actionLabel}>{label}</Text>
        <Text style={styles.actionValue}>{value}</Text>
      </View>
    </Pressable>
  );
}

export function FarmerSupportScreen() {
  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content}>
        <ScreenHeader title="Help & Support" subtitle="We are here to help with your farm operations" />

        <SupportAction
          icon="notifications"
          label="Email Support"
          value={SUPPORT_EMAIL}
          onPress={() => void Linking.openURL(`mailto:${SUPPORT_EMAIL}`)}
        />
        <SupportAction
          icon="support_agent"
          label="Call Support"
          value="1800-000-000"
          onPress={() => void Linking.openURL(`tel:${SUPPORT_PHONE}`)}
        />

        <View style={styles.faqCard}>
          <View style={styles.faqHeader}>
            <BhuguardMaterialIcon name="assignment" size={20} color={dashboardTheme.primaryContainer} />
            <Text style={styles.faqTitle}>Common topics</Text>
          </View>
          <Text style={styles.faqItem}>• Submitting farming activities</Text>
          <Text style={styles.faqItem}>• Field officer verification visits</Text>
          <Text style={styles.faqItem}>• Carbon credit eligibility</Text>
          <Text style={styles.faqItem}>• Downloading reports</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: dashboardTheme.background,
  },
  content: {
    padding: dashboardTheme.marginMobile,
    gap: 12,
    paddingBottom: 32,
  },
  actionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: dashboardTheme.surfaceLowest,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: dashboardTheme.outlineVariant,
    padding: 16,
  },
  pressed: {
    transform: [{ scale: 0.98 }],
    opacity: 0.95,
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: dashboardTheme.surfaceLow,
    alignItems: 'center',
    justifyContent: 'center',
  },
  copy: {
    flex: 1,
    gap: 2,
  },
  actionLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: dashboardTheme.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  actionValue: {
    fontSize: 16,
    fontWeight: '600',
    color: dashboardTheme.onSurface,
  },
  faqCard: {
    backgroundColor: dashboardTheme.surfaceLowest,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: dashboardTheme.outlineVariant,
    padding: 16,
    gap: 10,
    marginTop: 8,
  },
  faqHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  faqTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: dashboardTheme.onSurface,
  },
  faqItem: {
    fontSize: 14,
    lineHeight: 22,
    color: dashboardTheme.onSurfaceVariant,
  },
});
