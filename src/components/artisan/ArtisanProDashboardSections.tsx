import { Image, Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';

import { officerCardShadow, officerTheme } from '../../theme/officerDashboardTheme';
import { BhuguardMaterialIcon, type BhuguardIconName } from '../shared/BhuguardMaterialIcon';
import { useProfilePhotoDisplay } from '../../hooks/useProfilePhotoDisplay';

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

export function artisanProGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) {
    return 'Good Morning';
  }
  if (hour < 17) {
    return 'Good Afternoon';
  }
  return 'Good Evening';
}

export function ArtisanProGreetingHeader({
  name,
  photoUrl,
  unreadCount = 0,
  onNotificationsPress,
  onProfilePress,
}: {
  name: string;
  photoUrl?: string | null;
  unreadCount?: number;
  onNotificationsPress: () => void;
  onProfilePress: () => void;
}) {
  const firstName = name.trim().split(/\s+/)[0] || name;
  const displayUri = useProfilePhotoDisplay(photoUrl, 'artisan-pro-dashboard-avatar.jpg');
  const badgeLabel = unreadCount > 99 ? '99+' : String(unreadCount);

  return (
    <View style={styles.greetingRow}>
      <View style={styles.greetingCopy}>
        <Text style={styles.greetingTitle} numberOfLines={2}>
          {artisanProGreeting()}, {firstName}
        </Text>
        <Text style={styles.greetingSubtitle}>Artisan Pro Dashboard</Text>
      </View>
      <View style={styles.greetingActions}>
        <Pressable
          style={({ pressed }) => [styles.avatar, pressed && styles.pressed]}
          onPress={onProfilePress}
          accessibilityRole="button"
          accessibilityLabel="Open profile"
        >
          {displayUri ? (
            <Image source={{ uri: displayUri }} style={styles.avatarImage} />
          ) : (
            <Text style={styles.avatarText}>{initialsFromName(name)}</Text>
          )}
        </Pressable>
        <Pressable
          style={({ pressed }) => [styles.iconButton, pressed && styles.pressed]}
          onPress={onNotificationsPress}
          accessibilityRole="button"
          accessibilityLabel={unreadCount > 0 ? `Notifications, ${unreadCount} unread` : 'Notifications'}
        >
          <BhuguardMaterialIcon name="notifications" size={22} color={officerTheme.primary} />
          {unreadCount > 0 ? (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{badgeLabel}</Text>
            </View>
          ) : null}
        </Pressable>
      </View>
    </View>
  );
}

export function ArtisanProFarmerOnboardingCard({ onPress }: { onPress: () => void }) {
  return (
    <FieldToolCard
      title="Farmer Onboarding"
      subtitle="Register a Farmer, add Farm details, documents, mapping and consent."
      icon="person_add"
      onPress={onPress}
      accessibilityLabel="Farmer Onboarding"
    />
  );
}

type BiocharOperationCardProps = {
  title: string;
  subtitle: string;
  icon: BhuguardIconName;
  variant: 'primary' | 'secondary';
  onPress: () => void;
};

function BiocharOperationCard({ title, subtitle, icon, variant, onPress }: BiocharOperationCardProps) {
  const isPrimary = variant === 'primary';

  return (
    <Pressable
      style={({ pressed }) => [
        isPrimary ? styles.biocharPrimaryCard : styles.biocharSecondaryCard,
        officerCardShadow,
        pressed && styles.pressedScale,
      ]}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={title}
    >
      <View style={[styles.biocharIconWrap, isPrimary ? styles.biocharIconWrapPrimary : styles.biocharIconWrapSecondary]}>
        <BhuguardMaterialIcon
          name={icon}
          size={26}
          color={isPrimary ? '#FFFFFF' : officerTheme.primary}
          filled
        />
      </View>
      <View style={styles.biocharCopy}>
        <Text style={isPrimary ? styles.biocharPrimaryTitle : styles.biocharSecondaryTitle}>{title}</Text>
        <Text style={isPrimary ? styles.biocharPrimarySubtitle : styles.biocharSecondarySubtitle}>{subtitle}</Text>
      </View>
      <BhuguardMaterialIcon
        name="arrow_forward"
        size={22}
        color={isPrimary ? '#FFFFFF' : officerTheme.primary}
      />
    </Pressable>
  );
}

export function ArtisanProBiocharOperationsSection({
  onProduction,
  onMixing,
  onApplication,
}: {
  onProduction: () => void;
  onMixing: () => void;
  onApplication: () => void;
}) {
  return (
    <View style={styles.section}>
      <View style={styles.sectionIntro}>
        <Text style={styles.sectionTitle}>Biochar Operations</Text>
        <Text style={styles.sectionSubtitle}>
          Manage your production, mixing and application activities.
        </Text>
      </View>
      <BiocharOperationCard
        title="Biochar Production"
        subtitle="Start or continue a Biochar production batch."
        icon="eco"
        variant="primary"
        onPress={onProduction}
      />
      <BiocharOperationCard
        title="Biochar Mixing"
        subtitle="Manage completed production batches and Biochar mixing."
        icon="science"
        variant="secondary"
        onPress={onMixing}
      />
      <BiocharOperationCard
        title="Biochar Application"
        subtitle="Apply completed Biochar mixtures to the selected farm."
        icon="agriculture"
        variant="secondary"
        onPress={onApplication}
      />
    </View>
  );
}

function FieldToolCard({
  title,
  subtitle,
  icon,
  onPress,
  accessibilityLabel,
}: {
  title: string;
  subtitle: string;
  icon: BhuguardIconName;
  onPress: () => void;
  accessibilityLabel: string;
}) {
  return (
    <Pressable
      style={({ pressed }) => [styles.fieldToolCard, officerCardShadow, pressed && styles.pressedScale]}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
    >
      <View style={styles.fieldToolIconWrap}>
        <BhuguardMaterialIcon name={icon} size={22} color={officerTheme.primary} filled />
      </View>
      <View style={styles.fieldToolCopy}>
        <Text style={styles.fieldToolTitle}>{title}</Text>
        <Text style={styles.fieldToolSubtitle}>{subtitle}</Text>
      </View>
      <BhuguardMaterialIcon name="chevron_right" size={22} color={officerTheme.primary} />
    </Pressable>
  );
}

export function ArtisanProFieldToolsSection({
  onFarmerOnboarding,
  onFarmFinder,
  onFarmerFinder,
  onFarmActivities,
}: {
  onFarmerOnboarding: () => void;
  onFarmFinder: () => void;
  onFarmerFinder: () => void;
  onFarmActivities?: () => void;
}) {
  return (
    <View style={styles.section}>
      <View style={styles.sectionIntro}>
        <Text style={styles.sectionTitle}>Field Tools</Text>
        <Text style={styles.sectionSubtitle}>Onboard farmers and locate authorized farms in your working area.</Text>
      </View>
      <FieldToolCard
        title="Farmer Onboarding"
        subtitle="Register a Farmer, add Farm details, documents, mapping and consent."
        icon="person_add"
        onPress={onFarmerOnboarding}
        accessibilityLabel="Farmer Onboarding"
      />
      <FieldToolCard
        title="Farm Finder"
        subtitle="Find farms within your authorized working area."
        icon="search"
        onPress={onFarmFinder}
        accessibilityLabel="Farm Finder"
      />
      <FieldToolCard
        title="Farmer Finder"
        subtitle="Find Farmers available within your working area."
        icon="group"
        onPress={onFarmerFinder}
        accessibilityLabel="Farmer Finder"
      />
      {onFarmActivities ? (
        <Pressable
          style={({ pressed }) => [styles.fieldToolLink, pressed && styles.pressed]}
          onPress={onFarmActivities}
          accessibilityRole="button"
          accessibilityLabel="Farm Activities"
        >
          <BhuguardMaterialIcon name="assignment" size={18} color={officerTheme.primary} />
          <Text style={styles.fieldToolLinkText}>Farm Activities</Text>
          <BhuguardMaterialIcon name="chevron_right" size={18} color={officerTheme.primary} />
        </Pressable>
      ) : null}
    </View>
  );
}

type MetricTone = 'default' | 'warning' | 'danger' | 'success';

export function ArtisanProWorkOverview({
  metrics,
}: {
  metrics: Array<{ label: string; value: number; tone?: MetricTone }>;
}) {
  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <BhuguardMaterialIcon name="eco" size={20} color={officerTheme.primary} filled />
        <Text style={styles.sectionTitle}>My Work Overview</Text>
      </View>
      <View style={styles.metricGrid}>
        {metrics.map((metric) => {
          const tone = {
            default: { bg: officerTheme.surface, border: officerTheme.outlineVariant, value: officerTheme.onSurface },
            warning: { bg: '#FFFBEB', border: '#CA8A04', value: '#A16207' },
            danger: { bg: '#FEF2F2', border: officerTheme.error, value: '#B91C1C' },
            success: { bg: '#ECFDF5', border: '#059669', value: '#047857' },
          }[metric.tone ?? 'default'];

          return (
            <View
              key={metric.label}
              style={[styles.metricCard, officerCardShadow, { backgroundColor: tone.bg, borderColor: tone.border }]}
            >
              <Text style={[styles.metricValue, { color: tone.value }]}>{metric.value}</Text>
              <Text style={styles.metricLabel}>{metric.label}</Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

export function ArtisanProQuickActions({
  actions,
}: {
  actions: Array<{ title: string; icon: BhuguardIconName; onPress: () => void }>;
}) {
  const { width } = useWindowDimensions();
  const fourColumn = width >= 392;

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Quick Actions</Text>
      <View style={styles.quickGrid}>
        {actions.map((action) => (
          <Pressable
            key={action.title}
            style={({ pressed }) => [
              styles.quickCard,
              officerCardShadow,
              fourColumn ? styles.quickCardFour : styles.quickCardTwo,
              pressed && styles.pressedScale,
            ]}
            onPress={action.onPress}
            accessibilityRole="button"
            accessibilityLabel={action.title}
          >
            <View style={styles.quickIconWrap}>
              <BhuguardMaterialIcon name={action.icon} size={22} color={officerTheme.primaryContainer} filled />
            </View>
            <Text style={styles.quickLabel}>{action.title}</Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  greetingRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
    paddingBottom: 4,
  },
  greetingCopy: { flex: 1, minWidth: 0 },
  greetingTitle: {
    fontSize: 28,
    lineHeight: 34,
    fontWeight: '700',
    color: officerTheme.primary,
  },
  greetingSubtitle: {
    marginTop: 4,
    fontSize: 16,
    lineHeight: 22,
    fontWeight: '600',
    color: officerTheme.onSurfaceVariant,
  },
  greetingActions: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingTop: 4 },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: officerTheme.secondaryFixed,
    borderWidth: 2,
    borderColor: officerTheme.primary,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarImage: { width: '100%', height: '100%' },
  avatarText: { color: officerTheme.primary, fontSize: 13, fontWeight: '800' },
  iconButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: officerTheme.surfaceLow,
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
  section: { gap: 12 },
  sectionIntro: { gap: 4 },
  sectionSubtitle: {
    fontSize: 14,
    lineHeight: 20,
    color: officerTheme.onSurfaceVariant,
    fontWeight: '500',
  },
  biocharPrimaryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: officerTheme.primary,
    borderRadius: 22,
    paddingHorizontal: 16,
    paddingVertical: 18,
    gap: 14,
    minHeight: 96,
  },
  biocharSecondaryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3FAF4',
    borderRadius: 22,
    paddingHorizontal: 16,
    paddingVertical: 18,
    gap: 14,
    borderWidth: 1,
    borderColor: 'rgba(11, 107, 58, 0.16)',
    minHeight: 96,
  },
  biocharIconWrap: {
    width: 52,
    height: 52,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  biocharIconWrapPrimary: {
    backgroundColor: 'rgba(255,255,255,0.16)',
  },
  biocharIconWrapSecondary: {
    backgroundColor: officerTheme.surface,
  },
  biocharCopy: { flex: 1, gap: 4, minWidth: 0 },
  biocharPrimaryTitle: { color: '#FFFFFF', fontSize: 19, fontWeight: '800', lineHeight: 24 },
  biocharPrimarySubtitle: { color: 'rgba(255,255,255,0.9)', fontSize: 13, lineHeight: 18 },
  biocharSecondaryTitle: { color: officerTheme.primary, fontSize: 19, fontWeight: '800', lineHeight: 24 },
  biocharSecondarySubtitle: { color: officerTheme.onSurfaceVariant, fontSize: 13, lineHeight: 18 },
  fieldToolCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: officerTheme.surface,
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 14,
    gap: 12,
    borderWidth: 1,
    borderColor: officerTheme.outlineVariant,
    minHeight: 84,
  },
  fieldToolIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#EAF7EF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  fieldToolCopy: { flex: 1, gap: 3, minWidth: 0 },
  fieldToolTitle: { color: officerTheme.primary, fontSize: 17, fontWeight: '800' },
  fieldToolSubtitle: { color: officerTheme.onSurfaceVariant, fontSize: 12, lineHeight: 17 },
  fieldToolLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 4,
    paddingVertical: 6,
  },
  fieldToolLinkText: {
    flex: 1,
    color: officerTheme.primary,
    fontSize: 14,
    fontWeight: '700',
  },
  heroCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: officerTheme.primary,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 16,
    gap: 12,
  },
  heroIconWrap: {
    width: 46,
    height: 46,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroCopy: { flex: 1, gap: 3, minWidth: 0 },
  heroTitle: { color: '#FFFFFF', fontSize: 18, fontWeight: '800' },
  heroSubtitle: { color: '#FFFFFF', fontSize: 12, lineHeight: 17, opacity: 0.94 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  sectionTitle: {
    fontSize: 22,
    lineHeight: 28,
    fontWeight: '700',
    color: officerTheme.primary,
  },
  metricGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  metricCard: {
    width: '48%',
    flexGrow: 1,
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderWidth: 1,
    gap: 4,
    minHeight: 78,
  },
  metricValue: { fontSize: 26, lineHeight: 32, fontWeight: '800' },
  metricLabel: { fontSize: 14, lineHeight: 18, color: officerTheme.onSurfaceVariant, fontWeight: '600' },
  quickGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  quickCard: {
    backgroundColor: officerTheme.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(11, 107, 58, 0.14)',
    padding: 12,
    gap: 10,
    minHeight: 108,
  },
  quickCardTwo: { width: '48%', flexGrow: 1 },
  quickCardFour: { width: '23%', flexGrow: 1 },
  quickIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#EAF7EF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickLabel: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '700',
    color: officerTheme.primary,
  },
  pressed: { opacity: 0.85, transform: [{ scale: 0.96 }] },
  pressedScale: { opacity: 0.92, transform: [{ scale: 0.99 }] },
});
