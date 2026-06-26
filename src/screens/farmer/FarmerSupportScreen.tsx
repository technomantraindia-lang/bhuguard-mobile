import { useCallback, useEffect, useState } from 'react';
import { Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { getApiErrorMessage } from '../../api/authApi';
import { getFarmerSupportInfo } from '../../api/farmerApi';
import { ErrorState } from '../../components/ErrorState';
import { LoadingState } from '../../components/LoadingState';
import { BhuguardMaterialIcon, type BhuguardIconName } from '../../components/shared/BhuguardMaterialIcon';
import { ScreenHeader } from '../../components/ScreenHeader';
import { dashboardTheme } from '../../theme/bhuguardDashboardTheme';
import { pickString, type ApiRecord } from '../../utils/apiHelpers';

const FALLBACK_SUPPORT = {
  email: 'support@bhuguard.com',
  phone: '1800000000',
  phoneDisplay: '1800-000-000',
  topics: [
    'Submitting farming activities',
    'Field officer verification visits',
    'Carbon credit eligibility',
    'Downloading reports',
  ],
};

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
  const [support, setSupport] = useState(FALLBACK_SUPPORT);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const data = await getFarmerSupportInfo();
      const root = (data.support ?? data) as ApiRecord;
      const topics = Array.isArray(root.topics)
        ? root.topics.filter((topic): topic is string => typeof topic === 'string' && topic.length > 0)
        : FALLBACK_SUPPORT.topics;

      setSupport({
        email: pickString(root, 'email') !== '-' ? pickString(root, 'email') : FALLBACK_SUPPORT.email,
        phone: pickString(root, 'phone') !== '-' ? pickString(root, 'phone') : FALLBACK_SUPPORT.phone,
        phoneDisplay:
          pickString(root, 'phone_display') !== '-'
            ? pickString(root, 'phone_display')
            : FALLBACK_SUPPORT.phoneDisplay,
        topics: topics.length > 0 ? topics : FALLBACK_SUPPORT.topics,
      });
    } catch (err) {
      setError(getApiErrorMessage(err, 'Failed to load support information.'));
      setSupport(FALLBACK_SUPPORT);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading && !error) {
    return (
      <SafeAreaView style={styles.safe}>
        <LoadingState message="Loading support information..." />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content}>
        <ScreenHeader title="Help & Support" subtitle="We are here to help with your farm operations" />

        {error ? <ErrorState message={error} onRetry={load} /> : null}

        <SupportAction
          icon="notifications"
          label="Email Support"
          value={support.email}
          onPress={() => void Linking.openURL(`mailto:${support.email}`)}
        />
        <SupportAction
          icon="support_agent"
          label="Call Support"
          value={support.phoneDisplay}
          onPress={() => void Linking.openURL(`tel:${support.phone}`)}
        />

        <View style={styles.faqCard}>
          <View style={styles.faqHeader}>
            <BhuguardMaterialIcon name="assignment" size={20} color={dashboardTheme.primaryContainer} />
            <Text style={styles.faqTitle}>Common topics</Text>
          </View>
          {support.topics.map((topic) => (
            <Text key={topic} style={styles.faqItem}>
              • {topic}
            </Text>
          ))}
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
