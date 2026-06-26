import { useCallback, useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { getApiErrorMessage } from '../../api/authApi';
import { getFarmerWallet, getFarmerWalletTransactions } from '../../api/farmerApi';
import { ErrorState } from '../../components/ErrorState';
import { LoadingState } from '../../components/LoadingState';
import { ScreenHeader } from '../../components/ScreenHeader';
import type { FarmerStackParamList } from '../../navigation/types';
import { dashboardTheme } from '../../theme/bhuguardDashboardTheme';
import { extractList, pickString, type ApiRecord } from '../../utils/apiHelpers';

type Nav = NativeStackNavigationProp<FarmerStackParamList>;

export function FarmerWalletScreen() {
  const navigation = useNavigation<Nav>();
  const [wallet, setWallet] = useState<ApiRecord | null>(null);
  const [transactions, setTransactions] = useState<ApiRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    setError(null);

    try {
      const [walletData, txData] = await Promise.all([getFarmerWallet(), getFarmerWalletTransactions()]);
      setWallet((walletData.wallet as ApiRecord) ?? walletData);
      setTransactions(extractList(txData as ApiRecord, ['transactions']));
    } catch (err) {
      setError(getApiErrorMessage(err, 'Failed to load wallet.'));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  if (loading && !refreshing) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.pad}>
          <ScreenHeader title="Wallet" />
        </View>
        <LoadingState />
      </SafeAreaView>
    );
  }

  if (error && !wallet) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.pad}>
          <ScreenHeader title="Wallet" />
        </View>
        <ErrorState message={error} onRetry={() => void load()} />
      </SafeAreaView>
    );
  }

  const currency = pickString(wallet, 'currency') !== '-' ? pickString(wallet, 'currency') : 'INR';

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => void load(true)} />}
      >
        <ScreenHeader title="Wallet" />

        <View style={styles.summaryCard}>
          <Text style={styles.label}>Total amount</Text>
          <Text style={styles.amount}>
            {currency} {Number(wallet?.total_amount ?? 0).toLocaleString('en-IN')}
          </Text>
          <View style={styles.row}>
            <View style={styles.cell}>
              <Text style={styles.cellLabel}>Paid</Text>
              <Text style={styles.cellValue}>{Number(wallet?.paid_amount ?? 0).toLocaleString('en-IN')}</Text>
            </View>
            <View style={styles.cell}>
              <Text style={styles.cellLabel}>Pending</Text>
              <Text style={styles.cellValue}>{Number(wallet?.pending_amount ?? 0).toLocaleString('en-IN')}</Text>
            </View>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Transaction history</Text>
        {transactions.length === 0 ? (
          <Text style={styles.empty}>No wallet transactions available yet.</Text>
        ) : (
          transactions.map((tx) => (
            <View key={String(tx.id)} style={styles.txCard}>
              <View style={styles.txTop}>
                <Text style={styles.txAmount}>
                  {currency} {Number(tx.amount ?? 0).toLocaleString('en-IN')}
                </Text>
                <Text style={styles.txStatus}>{pickString(tx, 'status')}</Text>
              </View>
              <Text style={styles.txDesc}>{pickString(tx, 'description')}</Text>
              {pickString(tx, 'company_name') !== '-' ? (
                <Text style={styles.txMeta}>Company: {pickString(tx, 'company_name')}</Text>
              ) : null}
              <Text style={styles.txMeta}>
                {pickString(tx, 'transaction_date')} · {pickString(tx, 'type')}
              </Text>
              {pickString(tx, 'remarks') !== '-' ? <Text style={styles.txMeta}>{pickString(tx, 'remarks')}</Text> : null}
            </View>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: dashboardTheme.background },
  pad: { paddingHorizontal: 20, paddingTop: 12 },
  content: { paddingHorizontal: dashboardTheme.marginMobile, paddingBottom: 32, gap: 12 },
  summaryCard: {
    backgroundColor: dashboardTheme.surfaceLowest,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: dashboardTheme.outlineVariant,
    padding: 16,
    gap: 8,
  },
  label: { fontSize: 13, color: dashboardTheme.textMuted },
  amount: { fontSize: 28, fontWeight: '700', color: dashboardTheme.headingGreen },
  row: { flexDirection: 'row', gap: 12, marginTop: 8 },
  cell: { flex: 1, backgroundColor: dashboardTheme.surfaceLow, borderRadius: 10, padding: 10 },
  cellLabel: { fontSize: 12, color: dashboardTheme.textMuted },
  cellValue: { fontSize: 16, fontWeight: '700', color: dashboardTheme.onSurface },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: dashboardTheme.onSurface, marginTop: 8 },
  empty: { fontSize: 14, color: dashboardTheme.textMuted },
  txCard: {
    backgroundColor: dashboardTheme.surfaceLowest,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: dashboardTheme.outlineVariant,
    padding: 12,
    gap: 4,
  },
  txTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  txAmount: { fontSize: 16, fontWeight: '700', color: dashboardTheme.onSurface },
  txStatus: { fontSize: 12, fontWeight: '600', color: dashboardTheme.primaryContainer, textTransform: 'capitalize' },
  txDesc: { fontSize: 14, color: dashboardTheme.onSurfaceVariant },
  txMeta: { fontSize: 12, color: dashboardTheme.textMuted },
});
