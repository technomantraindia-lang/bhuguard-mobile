import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { EmptyState } from '../../components/EmptyState';
import { LoadingState } from '../../components/LoadingState';
import { ScreenHeader } from '../../components/ScreenHeader';
import { AppButton } from '../../components/AppButton';
import { useFarmerFarmActivityForm } from '../../hooks/useFarmerFarmActivityForm';
import { useTranslation } from '../../i18n/I18nContext';
import type { FarmerStackParamList } from '../../navigation/types';
import { dashboardShadow, dashboardTheme } from '../../theme/bhuguardDashboardTheme';
import { formatLocalizedDate } from '../../utils/localizedDate';

type Props = NativeStackScreenProps<FarmerStackParamList, 'FarmerFarmSelection'>;

function statusColor(color: string) {
  if (color === 'red') {
    return dashboardTheme.error;
  }

  if (color === 'yellow') {
    return '#CA8A04';
  }

  if (color === 'green') {
    return dashboardTheme.primaryContainer;
  }

  return dashboardTheme.textMuted;
}

export function FarmerFarmSelectionScreen({ navigation }: Props) {
  const { t, language } = useTranslation();
  const form = useFarmerFarmActivityForm();

  if (form.loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <LoadingState message={t('farmer.farmSelection.loading')} />
      </SafeAreaView>
    );
  }

  if (form.farms.length === 0) {
    return (
      <SafeAreaView style={styles.safe}>
        <ScreenHeader
          title={t('farmer.farmSelection.title')}
          subtitle={t('farmer.farmSelection.subtitle')}
          showBack
          onBackPress={() => navigation.goBack()}
        />
        <View style={styles.emptyWrap}>
          <EmptyState
            title={t('farmer.farmSelection.emptyTitle')}
            message={t('farmer.farmSelection.emptyMessage')}
          />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScreenHeader
        title={t('farmer.farmSelection.title')}
        subtitle={t('farmer.farmSelection.subtitle')}
        showBack
        onBackPress={() => navigation.goBack()}
      />

      <FlatList
        data={form.farms}
        keyExtractor={(item) => String(item.farmId)}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <Pressable
            style={({ pressed }) => [styles.card, dashboardShadow, pressed && styles.pressed]}
            onPress={() => navigation.navigate('FarmerFarmActivity', { farmId: item.farmId })}
          >
            <Text style={styles.farmCode}>{item.farmCode !== '-' ? item.farmCode : `Farm #${item.farmId}`}</Text>
            <Text style={styles.farmerName}>{item.farmerName !== '-' ? item.farmerName : 'Farmer'}</Text>
            <Text style={styles.meta}>{[item.village, item.taluka, item.district, item.state].filter((v) => v && v !== '-').join(', ')}</Text>
            <Text style={styles.meta}>
              {t('farmer.farmSelection.area')}: {item.areaLabel}
            </Text>
            {item.ownershipType !== '-' ? (
              <Text style={styles.meta}>
                {t('farmer.farmSelection.ownership')}: {item.ownershipType}
              </Text>
            ) : null}
            <View style={styles.statusRow}>
              <Text style={styles.meta}>
                {t('farmer.farmSelection.lastFarmPhotoUploadDate')}:{' '}
                {formatLocalizedDate(item.lastFarmUpdateDate, language)}
              </Text>
              <Text style={styles.meta}>
                {t('farmer.farmSelection.nextFarmPhotoUploadDate')}:{' '}
                {formatLocalizedDate(item.nextFarmUpdateDate, language)}
              </Text>
            </View>
            <Text style={[styles.statusBadge, { color: statusColor(item.statusColor) }]}>
              {item.farmUpdateStatusLabel !== '-' ? item.farmUpdateStatusLabel : t('farmer.farmSelection.notStarted')}
            </Text>
            <AppButton
              label={t('farmer.farmSelection.selectFarm')}
              onPress={() => navigation.navigate('FarmerFarmActivity', { farmId: item.farmId })}
            />
          </Pressable>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: dashboardTheme.background },
  list: { padding: dashboardTheme.marginMobile, gap: 12, paddingBottom: 32 },
  card: {
    backgroundColor: dashboardTheme.surfaceLowest,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: dashboardTheme.outlineVariant,
    padding: 16,
    gap: 8,
  },
  farmCode: { fontSize: 18, fontWeight: '700', color: dashboardTheme.onSurface },
  farmerName: { fontSize: 15, fontWeight: '600', color: dashboardTheme.onSurface },
  meta: { fontSize: 13, color: dashboardTheme.textMuted },
  statusRow: { gap: 4, marginTop: 4 },
  statusBadge: { fontSize: 13, fontWeight: '700' },
  emptyWrap: { flex: 1, justifyContent: 'center', padding: 24 },
  pressed: { opacity: 0.94 },
});
