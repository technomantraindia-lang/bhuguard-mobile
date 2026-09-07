import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';

import { LOGO_SIZES } from '../../constants/branding';
import { artisanTheme } from '../../theme/artisanTheme';
import { spacing } from '../../theme';
import { BhuguardLogo } from '../shared/BhuguardLogo';
import { BhuguardMaterialIcon, type BhuguardIconName } from '../shared/BhuguardMaterialIcon';

export function ArtisanDashboardBrandBar() {
  return (
    <View style={styles.brandBar}>
      <View style={styles.brandBarLeft}>
        <BhuguardLogo size={28} animation="none" />
        <View style={styles.brandBarCopy}>
          <Text style={styles.brandBarTitle}>BHUGUARD</Text>
          <Text style={styles.brandBarTagline}>SOIL TODAY A BRIGHTER TOMORROW</Text>
        </View>
      </View>
      <Text style={styles.brandBarRight} numberOfLines={2}>
        People | Soil | Stronger Tomorrows
      </Text>
    </View>
  );
}

export function ArtisanDashboardPageHeader({
  title,
  subtitle,
  unreadCount,
  avatarLabel,
  onNotificationsPress,
  onProfilePress,
}: {
  title: string;
  subtitle: string;
  unreadCount: number;
  avatarLabel: string;
  onNotificationsPress: () => void;
  onProfilePress: () => void;
}) {
  const badgeLabel = unreadCount > 99 ? '99+' : String(unreadCount);

  return (
    <View style={styles.pageHeader}>
      <View style={styles.pageHeaderLeft}>
        <BhuguardLogo size={LOGO_SIZES.dashboardHeader} animation="none" />
        <View style={styles.pageHeaderCopy}>
          <Text style={styles.pageHeaderTitle} numberOfLines={1}>{title}</Text>
          <Text style={styles.pageHeaderSubtitle} numberOfLines={1}>{subtitle}</Text>
        </View>
      </View>
      <View style={styles.pageHeaderActions}>
        <Pressable
          style={({ pressed }) => [styles.iconButton, pressed && styles.pressed]}
          onPress={onNotificationsPress}
          accessibilityRole="button"
          accessibilityLabel={unreadCount > 0 ? `Notifications, ${unreadCount} unread` : 'Notifications'}
        >
          <BhuguardMaterialIcon name="notifications" size={22} color={artisanTheme.tertiary} />
          {unreadCount > 0 ? (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{badgeLabel}</Text>
            </View>
          ) : null}
        </Pressable>
        <Pressable
          style={({ pressed }) => [styles.avatarButton, pressed && styles.pressed]}
          onPress={onProfilePress}
          accessibilityRole="button"
          accessibilityLabel="Open profile"
        >
          <Text style={styles.avatarText}>{avatarLabel}</Text>
        </Pressable>
      </View>
    </View>
  );
}

export function ArtisanDashboardWelcomeCard({
  name,
  artisanIdLabel,
  locationSummary,
  checkInLabel,
  kilnLabel,
}: {
  name: string;
  artisanIdLabel: string;
  locationSummary: string;
  checkInLabel: string;
  kilnLabel: string;
}) {
  return (
    <View style={styles.welcomeCard}>
      <Text style={styles.welcomeEyebrow}>Welcome</Text>
      <Text style={styles.welcomeName}>{name}</Text>
      <Text style={styles.welcomeMeta}>{artisanIdLabel}</Text>
      <Text style={styles.welcomeLocation} numberOfLines={2} ellipsizeMode="tail">
        {locationSummary}
      </Text>
      <Text style={styles.welcomeMeta}>
        Check-in: {checkInLabel} · Kilns: {kilnLabel}
      </Text>
    </View>
  );
}

export function ArtisanDashboardSectionLabel({ children }: { children: string }) {
  return <Text style={styles.sectionLabel}>{children}</Text>;
}

interface ArtisanDashboardActionCardProps {
  title: string;
  description: string;
  icon: BhuguardIconName;
  accent: string;
  bubble: string;
  onPress: () => void;
  accessibilityLabel: string;
  fullWidth?: boolean;
}

export function ArtisanDashboardActionCard({
  title,
  description,
  icon,
  accent,
  bubble,
  onPress,
  accessibilityLabel,
  fullWidth = false,
}: ArtisanDashboardActionCardProps) {
  const { width } = useWindowDimensions();
  const twoColumn = width >= 340;
  const cardWidth = fullWidth || !twoColumn ? '100%' : '48%';

  return (
    <Pressable
      style={({ pressed }) => [
        styles.card,
        { width: cardWidth },
        pressed && styles.cardPressed,
      ]}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
    >
      <View style={[styles.cardAccent, { backgroundColor: accent }]} />
      <View style={[styles.iconBubble, { backgroundColor: bubble }]}>
        <BhuguardMaterialIcon name={icon} size={22} color={accent} />
      </View>
      <Text style={styles.cardTitle}>{title}</Text>
      <Text style={styles.cardDescription} numberOfLines={2}>{description}</Text>
      <View style={styles.cardFooter}>
        <Text style={[styles.cardAction, { color: accent }]}>Open</Text>
        <BhuguardMaterialIcon name="chevron_right" size={18} color={accent} />
      </View>
    </Pressable>
  );
}

export function ArtisanDashboardActionGrid({ children }: { children: ReactNode }) {
  return <View style={styles.grid}>{children}</View>;
}

export function ArtisanDashboardFooterStrip() {
  return (
    <View style={styles.footerStrip}>
      <BhuguardMaterialIcon name="eco" size={16} color={artisanTheme.actionGreen} filled />
      <Text style={styles.footerStripText}>Healthy Soils | Resilient Farmers | Greener Tomorrow</Text>
    </View>
  );
}

export const ARTISAN_DASHBOARD_CARD_ACCENTS = {
  find: {
    accent: artisanTheme.tertiary,
    bubble: 'rgba(11, 46, 31, 0.10)',
  },
  production: {
    accent: artisanTheme.primary,
    bubble: 'rgba(133, 201, 92, 0.18)',
  },
  application: {
    accent: artisanTheme.actionGreen,
    bubble: 'rgba(133, 201, 92, 0.18)',
  },
  submitted: {
    accent: artisanTheme.tealAccent,
    bubble: 'rgba(42, 157, 143, 0.14)',
  },
  support: {
    accent: artisanTheme.tertiary,
    bubble: 'rgba(11, 46, 31, 0.10)',
  },
} as const;

const styles = StyleSheet.create({
  brandBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    backgroundColor: artisanTheme.tertiary,
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
  },
  brandBarLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
    minWidth: 0,
  },
  brandBarCopy: { flex: 1, minWidth: 0 },
  brandBarTitle: {
    color: artisanTheme.white,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  brandBarTagline: {
    color: 'rgba(255,255,255,0.82)',
    fontSize: 8,
    fontWeight: '600',
    marginTop: 1,
  },
  brandBarRight: {
    color: 'rgba(255,255,255,0.88)',
    fontSize: 9,
    fontWeight: '600',
    textAlign: 'right',
    maxWidth: 118,
    lineHeight: 12,
  },
  pageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: 12,
    backgroundColor: artisanTheme.white,
    borderBottomWidth: 1,
    borderBottomColor: artisanTheme.softBorder,
  },
  pageHeaderLeft: { flexDirection: 'row', alignItems: 'center', flex: 1, minWidth: 0, marginRight: 12 },
  pageHeaderCopy: { flex: 1, minWidth: 0, marginLeft: 10 },
  pageHeaderTitle: { fontSize: 18, fontWeight: '800', color: artisanTheme.deepText },
  pageHeaderSubtitle: { fontSize: 12, color: artisanTheme.secondaryText, marginTop: 2 },
  pageHeaderActions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  iconButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: artisanTheme.cream,
    borderWidth: 1,
    borderColor: artisanTheme.softBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    position: 'absolute',
    top: 2,
    right: 2,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    paddingHorizontal: 3,
    backgroundColor: '#C62828',
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: { color: '#FFFFFF', fontSize: 9, fontWeight: '700', lineHeight: 11 },
  avatarButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: artisanTheme.actionGreen,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { color: artisanTheme.white, fontWeight: '800', fontSize: 13 },
  welcomeCard: {
    borderRadius: 22,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: artisanTheme.softBorder,
    backgroundColor: artisanTheme.cream,
    marginBottom: 16,
    ...artisanTheme.cardShadow,
  },
  welcomeEyebrow: {
    fontSize: 12,
    fontWeight: '700',
    color: artisanTheme.actionGreen,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  welcomeName: { fontSize: 24, fontWeight: '800', color: artisanTheme.deepText },
  welcomeMeta: { fontSize: 13, color: artisanTheme.secondaryText, marginTop: 4 },
  welcomeLocation: { fontSize: 13, color: artisanTheme.tertiary, marginTop: 8, fontWeight: '600', lineHeight: 18 },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '800',
    color: artisanTheme.deepText,
    marginTop: 8,
    marginBottom: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  card: {
    backgroundColor: artisanTheme.white,
    borderRadius: 20,
    paddingTop: 14,
    paddingRight: 14,
    paddingBottom: 14,
    paddingLeft: 18,
    borderWidth: 1,
    borderColor: artisanTheme.softBorder,
    overflow: 'hidden',
    marginBottom: 12,
    minHeight: 148,
    ...artisanTheme.cardShadow,
  },
  cardPressed: {
    opacity: 0.94,
    transform: [{ scale: 0.985 }],
  },
  cardAccent: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
  },
  iconBubble: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  cardTitle: { fontSize: 15, fontWeight: '800', color: artisanTheme.deepText, marginBottom: 6 },
  cardDescription: {
    fontSize: 12,
    lineHeight: 17,
    color: artisanTheme.secondaryText,
    minHeight: 34,
    marginBottom: 8,
    flex: 1,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardAction: { fontSize: 12, fontWeight: '700' },
  footerStrip: {
    marginTop: 8,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: '#EEF7EA',
    borderWidth: 1,
    borderColor: 'rgba(11, 107, 58, 0.12)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  footerStripText: {
    flex: 1,
    fontSize: 11,
    fontWeight: '700',
    color: artisanTheme.tertiary,
    textAlign: 'center',
  },
  pressed: { opacity: 0.92 },
});
