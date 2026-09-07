import { useEffect, useRef, type ReactNode } from 'react';
import { Animated, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import {
  ARTISAN_DASHBOARD_CARD_ACCENTS,
  ArtisanDashboardActionCard,
  ArtisanDashboardActionGrid,
  ArtisanDashboardFooterStrip,
  ArtisanDashboardPageHeader,
  ArtisanDashboardSectionLabel,
  ArtisanDashboardWelcomeCard,
} from './ArtisanReferenceDashboard';
import { BhuguardMaterialIcon } from '../shared/BhuguardMaterialIcon';
import type { ArtisanStackParamList } from '../../navigation/types';
import { artisanTheme } from '../../theme/artisanTheme';
import { spacing } from '../../theme';
import { pickString, type ApiRecord } from '../../utils/apiHelpers';
import type { IncompleteBiocharProductionDraftSummary } from '../../storage/biocharProductionDraftStorage';

type Nav = NativeStackNavigationProp<ArtisanStackParamList>;

function asRecord(value: unknown): ApiRecord {
  return value && typeof value === 'object' && !Array.isArray(value) ? (value as ApiRecord) : {};
}

function initialsFromName(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) {
    return 'AP';
  }
  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }
  return `${parts[0][0] ?? ''}${parts[1][0] ?? ''}`.toUpperCase();
}

interface ArtisanProDashboardViewProps {
  artisanName: string;
  artisanCode: string;
  locationSummary: string;
  unreadCount: number;
  dashboard: ApiRecord;
  error: string | null;
  emptyNotice: boolean;
  hasAssignment: boolean;
  refreshing?: boolean;
  pendingSyncCount: number;
  syncFailedCount: number;
  incompleteDraft: IncompleteBiocharProductionDraftSummary | null;
  onRefresh: () => void;
  onRetry: () => void;
  onResumeDraft: () => void;
  onOpenProduction: () => void;
  onOpenMixing: () => void;
  onOpenApplication: () => void;
  onOpenFarmNavigator: () => void;
  onOpenFindFarmerFarm: () => void;
  onOpenWallet: () => void;
  onOpenTraining: () => void;
  onOpenHelpSupport: () => void;
  onOpenFarmerOnboarding: () => void;
  onOpenFarmActivity: () => void;
  onOpenSubmittedProduction: () => void;
  onOpenSubmittedMixing: () => void;
  onOpenSubmittedApplication?: () => void;
}

function NoticeCard({
  title,
  body,
  action,
}: {
  title: string;
  body?: string;
  action?: ReactNode;
}) {
  return (
    <View style={styles.noticeCard}>
      <Text style={styles.noticeTitle}>{title}</Text>
      {body ? <Text style={styles.noticeBody}>{body}</Text> : null}
      {action}
    </View>
  );
}

export function ArtisanProDashboardView({
  artisanName,
  artisanCode,
  locationSummary,
  unreadCount,
  dashboard,
  error,
  emptyNotice,
  hasAssignment,
  refreshing = false,
  pendingSyncCount,
  syncFailedCount,
  incompleteDraft,
  onRefresh,
  onRetry,
  onResumeDraft,
  onOpenProduction,
  onOpenMixing,
  onOpenApplication,
  onOpenFarmNavigator,
  onOpenFindFarmerFarm,
  onOpenWallet,
  onOpenTraining,
  onOpenHelpSupport,
  onOpenFarmerOnboarding,
  onOpenFarmActivity,
  onOpenSubmittedProduction,
  onOpenSubmittedMixing,
  onOpenSubmittedApplication,
}: ArtisanProDashboardViewProps) {
  const navigation = useNavigation<Nav>();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const translateAnim = useRef(new Animated.Value(8)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 260,
        useNativeDriver: true,
      }),
      Animated.timing(translateAnim, {
        toValue: 0,
        duration: 260,
        useNativeDriver: true,
      }),
    ]).start();
  }, [fadeAnim, translateAnim]);

  const liveCheckin = asRecord(dashboard.live_checkin);
  const checkInLabel =
    pickString(liveCheckin, 'status_label') !== '-'
      ? pickString(liveCheckin, 'status_label')
      : 'Not available';
  const kilnCount = Number(dashboard.assigned_kiln_count ?? 0);
  const kilnLabel = kilnCount > 0 ? `${kilnCount} assigned` : 'No kiln assigned';
  const artisanIdLabel = `Artisan Pro ID: ${artisanCode !== '—' && artisanCode !== 'Loading…' ? artisanCode : '—'}`;
  const accents = ARTISAN_DASHBOARD_CARD_ACCENTS;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ArtisanDashboardPageHeader
        title="Artisan Dashboard"
        subtitle="Biochar Operations"
        unreadCount={unreadCount}
        avatarLabel={initialsFromName(artisanName)}
        onNotificationsPress={() => navigation.navigate('ArtisanNotifications')}
        onProfilePress={() => navigation.navigate('ArtisanProfile')}
      />

      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={artisanTheme.tertiary} />
        }
      >
        <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: translateAnim }], gap: 0 }}>
          {error ? (
            <NoticeCard
              title={error}
              action={
                <Pressable style={styles.noticeRetry} onPress={onRetry} accessibilityRole="button">
                  <Text style={styles.noticeRetryText}>Retry</Text>
                </Pressable>
              }
            />
          ) : null}

          {incompleteDraft && (incompleteDraft.farmId || incompleteDraft.farmerId) ? (
            <Pressable
              style={styles.resumeCard}
              onPress={onResumeDraft}
              accessibilityRole="button"
              accessibilityLabel="Continue Active Process"
            >
              <View style={styles.resumeIconBubble}>
                <BhuguardMaterialIcon name="eco" size={22} color={artisanTheme.white} />
              </View>
              <View style={styles.resumeCopy}>
                <Text style={styles.resumeTitle}>Continue Active Process</Text>
                <Text style={styles.resumeBody}>
                  {incompleteDraft.batchCode?.trim()
                    ? `Batch ${incompleteDraft.batchCode} is unfinished. Tap to resume the exact last step.`
                    : 'You have an unfinished Biochar Production batch. Tap to resume.'}
                </Text>
              </View>
              <BhuguardMaterialIcon name="chevron_right" size={20} color={artisanTheme.white} />
            </Pressable>
          ) : null}

          {pendingSyncCount + syncFailedCount > 0 ? (
            <View style={styles.syncBanner}>
              <Text style={styles.syncBannerText}>
                {pendingSyncCount > 0 ? `${pendingSyncCount} pending sync` : ''}
                {pendingSyncCount > 0 && syncFailedCount > 0 ? ' · ' : ''}
                {syncFailedCount > 0 ? `${syncFailedCount} sync failed` : ''}
              </Text>
            </View>
          ) : null}

          {emptyNotice && !error ? (
            <NoticeCard
              title="No dashboard data available"
              body="Showing empty values. You can still open Artisan Pro modules below."
              action={
                <Pressable style={styles.noticeRetry} onPress={onRetry} accessibilityRole="button">
                  <Text style={styles.noticeRetryText}>Retry</Text>
                </Pressable>
              }
            />
          ) : null}

          <ArtisanDashboardWelcomeCard
            name={artisanName}
            artisanIdLabel={artisanIdLabel}
            locationSummary={locationSummary}
            checkInLabel={checkInLabel}
            kilnLabel={kilnLabel}
          />

          {!hasAssignment ? (
            <NoticeCard
              title="No active working area assigned"
              body="Field operations are blocked until Admin assigns District / Taluka / Village. Help & Logout remain available."
            />
          ) : null}

          <ArtisanDashboardSectionLabel>Primary actions</ArtisanDashboardSectionLabel>
          <ArtisanDashboardActionGrid>
            <ArtisanDashboardActionCard
              title="Biochar Production"
              description="Create and manage Biochar Production batches"
              icon="eco"
              accent={accents.production.accent}
              bubble={accents.production.bubble}
              onPress={onOpenProduction}
              accessibilityLabel="Open biochar production"
            />
            <ArtisanDashboardActionCard
              title="Biochar Mixing"
              description="Create a mixing record for a farm"
              icon="science"
              accent={accents.production.accent}
              bubble={accents.production.bubble}
              onPress={onOpenMixing}
              accessibilityLabel="Open biochar mixing"
            />
            <ArtisanDashboardActionCard
              title="Biochar Application"
              description="Apply mixed biochar to an assigned farm"
              icon="agriculture"
              accent={accents.application.accent}
              bubble={accents.application.bubble}
              onPress={onOpenApplication}
              accessibilityLabel="Open biochar application"
            />
            <ArtisanDashboardActionCard
              title="Farm Navigator"
              description="Search Farm ID / Farmer Name and navigate"
              icon="near_me"
              accent={accents.find.accent}
              bubble={accents.find.bubble}
              onPress={onOpenFarmNavigator}
              accessibilityLabel="Open farm navigator"
            />
          </ArtisanDashboardActionGrid>

          <ArtisanDashboardSectionLabel>Secondary</ArtisanDashboardSectionLabel>
          <ArtisanDashboardActionGrid>
            <ArtisanDashboardActionCard
              title="Wallet"
              description="Coming soon — no fabricated balances"
              icon="account_balance_wallet"
              accent={accents.submitted.accent}
              bubble={accents.submitted.bubble}
              onPress={onOpenWallet}
              accessibilityLabel="Open artisan wallet"
            />
            <ArtisanDashboardActionCard
              title="Biochar Training"
              description="Coming soon — no fake progress"
              icon="school"
              accent={accents.production.accent}
              bubble={accents.production.bubble}
              onPress={onOpenTraining}
              accessibilityLabel="Open biochar training"
            />
            <ArtisanDashboardActionCard
              title="Help & Support"
              description="Contact Bhuguard support"
              icon="support_agent"
              accent={accents.support.accent}
              bubble={accents.support.bubble}
              onPress={onOpenHelpSupport}
              accessibilityLabel="Open help and support"
            />
            <ArtisanDashboardActionCard
              title="Find Farmer / Farm"
              description="Search farms in your assigned area"
              icon="search"
              accent={accents.find.accent}
              bubble={accents.find.bubble}
              onPress={onOpenFindFarmerFarm}
              accessibilityLabel="Find farmer or farm"
            />
          </ArtisanDashboardActionGrid>

          <ArtisanDashboardSectionLabel>Field work</ArtisanDashboardSectionLabel>
          <ArtisanDashboardActionGrid>
            <ArtisanDashboardActionCard
              title="Farmer Onboarding"
              description="Register and complete farmer onboarding"
              icon="person_add"
              accent={accents.find.accent}
              bubble={accents.find.bubble}
              onPress={onOpenFarmerOnboarding}
              accessibilityLabel="Open farmer onboarding"
            />
            <ArtisanDashboardActionCard
              title="Farm Activity"
              description="Record farm visit, activity and mapping details"
              icon="agriculture"
              accent={accents.application.accent}
              bubble={accents.application.bubble}
              onPress={onOpenFarmActivity}
              accessibilityLabel="Open farm activity"
            />
            <ArtisanDashboardActionCard
              title="Submitted Production"
              description="Review submitted production records"
              icon="fact_check"
              accent={accents.submitted.accent}
              bubble={accents.submitted.bubble}
              onPress={onOpenSubmittedProduction}
              accessibilityLabel="Open submitted production records"
            />
            <ArtisanDashboardActionCard
              title="Submitted Mixing"
              description="Review submitted mixing records"
              icon="fact_check"
              accent={accents.submitted.accent}
              bubble={accents.submitted.bubble}
              onPress={onOpenSubmittedMixing}
              accessibilityLabel="Open submitted mixing records"
            />
            {onOpenSubmittedApplication ? (
              <ArtisanDashboardActionCard
                title="Submitted Application"
                description="Review submitted application records"
                icon="fact_check"
                accent={accents.submitted.accent}
                bubble={accents.submitted.bubble}
                onPress={onOpenSubmittedApplication}
                accessibilityLabel="Open submitted application records"
              />
            ) : null}
          </ArtisanDashboardActionGrid>

          <ArtisanDashboardFooterStrip />
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: artisanTheme.creamBg },
  container: { padding: spacing.lg, paddingBottom: 40, gap: 0 },
  noticeCard: {
    borderRadius: 16,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: artisanTheme.softBorder,
    backgroundColor: artisanTheme.white,
    marginBottom: 12,
  },
  noticeTitle: { fontSize: 14, fontWeight: '800', color: artisanTheme.deepText, marginBottom: 4 },
  noticeBody: { fontSize: 12, lineHeight: 17, color: artisanTheme.secondaryText },
  noticeRetry: {
    alignSelf: 'flex-start',
    marginTop: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: artisanTheme.actionGreen,
  },
  noticeRetryText: { color: artisanTheme.white, fontWeight: '700', fontSize: 12 },
  resumeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderRadius: 16,
    padding: spacing.md,
    backgroundColor: artisanTheme.actionGreen,
    marginBottom: 12,
    ...artisanTheme.cardShadow,
  },
  resumeIconBubble: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  resumeCopy: { flex: 1 },
  resumeTitle: { fontSize: 14, fontWeight: '800', color: artisanTheme.white },
  resumeBody: { fontSize: 12, color: 'rgba(255,255,255,0.9)', marginTop: 2, lineHeight: 16 },
  syncBanner: {
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#F59E0B',
    marginBottom: 12,
  },
  syncBannerText: { fontSize: 12, fontWeight: '700', color: '#92400E' },
});
