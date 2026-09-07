import { useCallback, useState } from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { getApiErrorMessage } from '../../api/authApi';
import { getOfficerArtisans } from '../../api/fieldOfficerApi';
import { OfficerListState } from '../../components/officer/OfficerListState';
import { OfficerScreenChrome } from '../../components/officer/OfficerScreenChrome';
import { ScreenHeader } from '../../components/ScreenHeader';
import { BhuguardMaterialIcon } from '../../components/shared/BhuguardMaterialIcon';
import type { FieldOfficerStackParamList } from '../../navigation/types';
import { officerCardShadow, officerTheme } from '../../theme/officerDashboardTheme';
import { pickString, type ApiRecord } from '../../utils/apiHelpers';
import { formatArtisanDisplayId } from '../../utils/displayIds';
import { formatStatusLabel } from '../../utils/statusLabels';

type Nav = NativeStackNavigationProp<FieldOfficerStackParamList, 'MyArtisans'>;
type ArtisanFilter = 'all' | 'pending_approval' | 'active' | 'rejected';

const filters: Array<{ key: ArtisanFilter; label: string }> = [
  { key: 'all', label: 'All' },
  { key: 'pending_approval', label: 'Pending' },
  { key: 'active', label: 'Approved' },
  { key: 'rejected', label: 'Rejected' },
];

export function MyArtisansScreen() {
  const navigation = useNavigation<Nav>();
  const [artisans, setArtisans] = useState<ApiRecord[]>([]);
  const [search, setSearch] = useState('');
  const [appliedSearch, setAppliedSearch] = useState('');
  const [filter, setFilter] = useState<ArtisanFilter>('all');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(
    async (silent = false) => {
      if (silent) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError(null);

      try {
        const data = await getOfficerArtisans({
          search: appliedSearch.trim() || undefined,
          status: filter === 'all' ? undefined : filter,
          per_page: 50,
        });
        setArtisans(data.artisans ?? []);
      } catch (err) {
        setError(getApiErrorMessage(err, 'Failed to load artisans.'));
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [appliedSearch, filter],
  );

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  return (
    <OfficerScreenChrome edges={['top']}>
      <ScreenHeader
        title="My Artisan Pros"
        showBrandLogo
        rightAction={{ label: 'Register', onPress: () => navigation.navigate('RegisterArtisan') }}
      />

      {loading && artisans.length === 0 ? (
        <OfficerListState kind="loading" message="Loading Artisan Pros…" />
      ) : error && artisans.length === 0 ? (
        <OfficerListState kind="error" message={error} onRetry={() => void load()} />
      ) : (
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => void load(true)} tintColor={officerTheme.primary} />
          }
        >
          <View style={styles.searchRow}>
            <BhuguardMaterialIcon name="search" size={20} color={officerTheme.onSurfaceVariant} />
            <TextInput
              value={search}
              onChangeText={setSearch}
              onSubmitEditing={() => setAppliedSearch(search)}
              placeholder="Search by name, mobile, or area"
              placeholderTextColor={officerTheme.onSurfaceVariant}
              style={styles.searchInput}
              returnKeyType="search"
            />
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
            {filters.map((item) => (
              <Pressable
                key={item.key}
                style={[styles.filterChip, filter === item.key && styles.filterChipSelected]}
                onPress={() => setFilter(item.key)}
              >
                <Text style={[styles.filterLabel, filter === item.key && styles.filterLabelSelected]}>{item.label}</Text>
              </Pressable>
            ))}
          </ScrollView>

          <Pressable style={[styles.registerCard, officerCardShadow]} onPress={() => navigation.navigate('RegisterArtisan')}>
            <View style={styles.registerIcon}>
              <BhuguardMaterialIcon name="person_add" size={22} color={officerTheme.primary} filled />
            </View>
            <View style={styles.registerCopy}>
              <Text style={styles.registerTitle}>Register New Artisan</Text>
              <Text style={styles.registerSubtitle}>Add an artisan from your working area</Text>
            </View>
            <BhuguardMaterialIcon name="chevron_right" size={20} color={officerTheme.primary} />
          </Pressable>

          {artisans.length === 0 ? (
            <OfficerListState kind="empty" title="No Artisan Pros found" message="Registered Artisan Pros will appear here." />
          ) : (
            artisans.map((artisan) => {
              const id = Number(artisan.id ?? artisan.artisan_id);
              const status = pickString(artisan, 'status');
              const location = [pickString(artisan, 'village'), pickString(artisan, 'taluka')]
                .filter((value) => value !== '-')
                .join(' • ');

              return (
                <Pressable
                  key={String(id)}
                  style={[styles.card, officerCardShadow]}
                  onPress={() => navigation.navigate('ArtisanDetail', { artisanId: id })}
                >
                  <View style={styles.cardHeader}>
                    <View style={styles.avatar}>
                      <Text style={styles.avatarText}>{pickString(artisan, 'name').slice(0, 1).toUpperCase()}</Text>
                    </View>
                    <View style={styles.cardCopy}>
                      <Text style={styles.name}>{pickString(artisan, 'name')}</Text>
                      <Text style={styles.artisanId}>{formatArtisanDisplayId(artisan)}</Text>
                      <Text style={styles.mobile}>{pickString(artisan, 'mobile', 'phone')}</Text>
                    </View>
                    <View style={[styles.statusPill, status === 'rejected' && styles.statusRejected]}>
                      <Text style={[styles.statusText, status === 'rejected' && styles.statusRejectedText]}>
                        {formatStatusLabel(status)}
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.meta}>{location || 'Location not provided'}</Text>
                  <Text style={styles.meta}>
                    Working area:{' '}
                    {(() => {
                      const scopeLabels = Array.isArray(artisan.working_taluka_scopes)
                        ? (artisan.working_taluka_scopes as ApiRecord[])
                            .map((item) => pickString(item, 'label', 'name'))
                            .filter((name) => name && name !== '-')
                        : [];
                      const villageLabels = Array.isArray(artisan.working_villages)
                        ? (artisan.working_villages as ApiRecord[])
                            .map((item) => pickString(item, 'name'))
                            .filter((name) => name && name !== '-')
                        : [];
                      const combined = [...scopeLabels, ...villageLabels];
                      return combined.length > 0 ? combined.join(', ') : pickString(artisan, 'working_area');
                    })()}
                  </Text>
                </Pressable>
              );
            })
          )}
        </ScrollView>
      )}
    </OfficerScreenChrome>
  );
}

const styles = StyleSheet.create({
  content: { padding: officerTheme.marginMobile, gap: 12, paddingBottom: 120 },
  searchRow: {
    alignItems: 'center',
    backgroundColor: officerTheme.surfaceLowest,
    borderColor: officerTheme.outlineVariant,
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 12,
  },
  searchInput: { color: officerTheme.onSurface, flex: 1, fontSize: 14, minHeight: 46 },
  filterRow: { gap: 8 },
  filterChip: { borderColor: officerTheme.outlineVariant, borderRadius: 999, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 8 },
  filterChipSelected: { backgroundColor: officerTheme.primary, borderColor: officerTheme.primary },
  filterLabel: { color: officerTheme.onSurfaceVariant, fontSize: 12, fontWeight: '700' },
  filterLabelSelected: { color: officerTheme.onPrimary },
  registerCard: {
    alignItems: 'center',
    backgroundColor: officerTheme.surfaceLowest,
    borderColor: officerTheme.outlineVariant,
    borderRadius: 16,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 12,
    padding: 14,
  },
  registerIcon: { alignItems: 'center', backgroundColor: 'rgba(133, 201, 92, 0.18)', borderRadius: 12, height: 42, justifyContent: 'center', width: 42 },
  registerCopy: { flex: 1, gap: 2 },
  registerTitle: { color: officerTheme.onSurface, fontSize: 15, fontWeight: '700' },
  registerSubtitle: { color: officerTheme.onSurfaceVariant, fontSize: 12 },
  card: { backgroundColor: officerTheme.surfaceLowest, borderColor: officerTheme.outlineVariant, borderRadius: 16, borderWidth: 1, gap: 8, padding: 14 },
  cardHeader: { alignItems: 'center', flexDirection: 'row', gap: 10 },
  avatar: { alignItems: 'center', backgroundColor: officerTheme.secondaryContainer, borderRadius: 22, height: 44, justifyContent: 'center', width: 44 },
  avatarText: { color: officerTheme.onSecondaryContainer, fontSize: 16, fontWeight: '800' },
  cardCopy: { flex: 1, gap: 2 },
  name: { color: officerTheme.onSurface, fontSize: 16, fontWeight: '700' },
  artisanId: { color: officerTheme.onSurfaceVariant, fontSize: 11, fontWeight: '700' },
  mobile: { color: officerTheme.onSurfaceVariant, fontSize: 12 },
  statusPill: { backgroundColor: officerTheme.secondaryContainer, borderRadius: 999, paddingHorizontal: 8, paddingVertical: 4 },
  statusRejected: { backgroundColor: officerTheme.errorContainer },
  statusText: { color: officerTheme.onSecondaryContainer, fontSize: 10, fontWeight: '800', textTransform: 'uppercase' },
  statusRejectedText: { color: officerTheme.onErrorContainer },
  meta: { color: officerTheme.onSurfaceVariant, fontSize: 12 },
});
