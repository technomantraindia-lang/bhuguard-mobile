import { StyleSheet, Text, View } from 'react-native';

import { BhuguardMaterialIcon, type BhuguardIconName } from '../shared/BhuguardMaterialIcon';
import { DashboardPressable } from '../shared/DashboardPressable';
import { farmerTheme } from '../../theme/farmerTheme';

interface FarmerHeroSummaryCardProps {
  farmerCode: string;
  fullName: string;
  mobile: string;
  location: {
    village: string;
    taluka: string;
    district: string;
    pincode: string;
  };
  projectName: string;
  landInfo: {
    hectaresLabel: string;
  } | null;
  isVerified: boolean;
  totalFarms: number;
  mappedFarms: number;
  activitiesCount: number;
  verificationStatusLabel: string;
  onProfilePress: () => void;
  onLocationPress: () => void;
  onProjectPress: () => void;
  onTotalLandPress: () => void;
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);

  if (parts.length === 0) {
    return 'FR';
  }

  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }

  return `${parts[0][0] ?? ''}${parts[1][0] ?? ''}`.toUpperCase();
}

function SectionHeader({ icon, title, showChevron }: { icon: BhuguardIconName; title: string; showChevron?: boolean }) {
  return (
    <View style={styles.sectionHeader}>
      <View style={styles.sectionHeaderLeft}>
        <View style={styles.sectionIconWrap}>
          <BhuguardMaterialIcon name={icon} size={16} color={farmerTheme.actionGreen} />
        </View>
        <Text style={styles.sectionTitle}>{title}</Text>
      </View>
      {showChevron ? (
        <BhuguardMaterialIcon name="chevron_right" size={18} color={farmerTheme.secondaryText} />
      ) : null}
    </View>
  );
}

function InfoField({ label, value }: { label: string; value: string }) {
  if (!value) {
    return <View style={styles.infoField} />;
  }

  return (
    <View style={styles.infoField}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue} numberOfLines={2}>
        {value}
      </Text>
    </View>
  );
}


function StatCell({ value, label }: { value: string; label: string }) {
  return (
    <View style={styles.statCell}>
      <Text style={styles.statValue} numberOfLines={1}>
        {value}
      </Text>
      <Text style={styles.statLabel} numberOfLines={2}>
        {label}
      </Text>
    </View>
  );
}

export function FarmerHeroSummaryCard({
  farmerCode,
  fullName,
  mobile,
  location,
  projectName,
  landInfo,
  isVerified,
  totalFarms,
  mappedFarms,
  activitiesCount,
  verificationStatusLabel,
  onProfilePress,
  onLocationPress,
  onProjectPress,
  onTotalLandPress,
}: FarmerHeroSummaryCardProps) {
  const hasLocation = Boolean(location.village || location.taluka || location.district || location.pincode);

  return (
    <View style={[styles.card, farmerTheme.cardShadow]}>
      <View style={styles.accentBar} />

      <View style={styles.header}>
        <DashboardPressable variant="button" onPress={onProfilePress} style={styles.avatar}>
          <Text style={styles.avatarText}>{getInitials(fullName)}</Text>
        </DashboardPressable>

        <View style={styles.headerCopy}>
          <DashboardPressable variant="button" onPress={onProfilePress}>
            <Text style={styles.name}>{fullName}</Text>
          </DashboardPressable>
          <View style={styles.idChip}>
            <Text style={styles.idChipLabel}>Farmer ID</Text>
            <Text style={styles.idChipValue}>{farmerCode}</Text>
          </View>
        </View>

        {isVerified ? (
          <View style={styles.verifiedBadge}>
            <BhuguardMaterialIcon name="verified" size={14} color={farmerTheme.actionGreen} filled />
            <Text style={styles.verifiedText}>Verified</Text>
          </View>
        ) : null}
      </View>

      {hasLocation ? (
        <DashboardPressable variant="button" onPress={onLocationPress} style={styles.section}>
          <SectionHeader icon="location_on" title="Location" showChevron />
          <View style={styles.infoPanel}>
            <View style={styles.infoGridRow}>
              <InfoField label="VILLAGE" value={location.village} />
              <InfoField label="TALUKA" value={location.taluka} />
            </View>
            <View style={styles.infoGridRow}>
              <InfoField label="DISTRICT" value={location.district} />
              <InfoField label="PINCODE" value={location.pincode} />
            </View>
          </View>
        </DashboardPressable>
      ) : null}

      <DashboardPressable variant="button" onPress={onProjectPress} style={styles.section}>
        <SectionHeader icon="eco" title="Project" showChevron />
        <View style={styles.infoPanel}>
          <Text style={styles.highlightValue}>{projectName}</Text>
        </View>
      </DashboardPressable>

      {mobile ? (
        <View style={styles.section}>
          <SectionHeader icon="account_circle" title="Mobile Number" />
          <View style={styles.infoPanel}>
            <Text style={styles.highlightValue}>{mobile}</Text>
          </View>
        </View>
      ) : null}

      {landInfo ? (
        <DashboardPressable variant="button" onPress={onTotalLandPress} style={styles.section}>
          <SectionHeader icon="agriculture" title="Total Land Area" showChevron />
          <View style={[styles.infoPanel, styles.landPanel]}>
            <Text style={styles.landPrimary}>{landInfo.hectaresLabel}</Text>
          </View>
        </DashboardPressable>
      ) : null}

      <View style={styles.statsWrap}>
        <View style={styles.statsRow}>
          <StatCell value={String(totalFarms)} label="Total Farms" />
          <View style={styles.statDividerV} />
          <StatCell value={String(mappedFarms)} label="Mapped Farms" />
        </View>
        <View style={styles.statDividerH} />
        <View style={styles.statsRow}>
          <StatCell value={String(activitiesCount)} label="Activities" />
          <View style={styles.statDividerV} />
          <StatCell value={verificationStatusLabel} label="Verification Status" />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 20,
    backgroundColor: farmerTheme.white,
    borderWidth: 1,
    borderColor: farmerTheme.softBorder,
    overflow: 'hidden',
  },
  accentBar: {
    height: 4,
    backgroundColor: farmerTheme.actionGreen,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 14,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: farmerTheme.lightGreenSurface,
    borderWidth: 2,
    borderColor: farmerTheme.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 18,
    fontWeight: '700',
    color: farmerTheme.actionGreen,
    letterSpacing: 0.5,
  },
  headerCopy: {
    flex: 1,
    gap: 6,
  },
  name: {
    fontSize: 20,
    lineHeight: 26,
    fontWeight: '700',
    color: farmerTheme.headingGreen,
  },
  idChip: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: farmerTheme.creamSurface,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: farmerTheme.softBorder,
  },
  idChipLabel: {
    fontSize: 10,
    lineHeight: 14,
    fontWeight: '700',
    color: farmerTheme.secondaryText,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  idChipValue: {
    fontSize: 11,
    lineHeight: 14,
    fontWeight: '700',
    color: farmerTheme.deepText,
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: farmerTheme.lightGreenSurface,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: farmerTheme.primary,
  },
  verifiedText: {
    fontSize: 11,
    fontWeight: '700',
    color: farmerTheme.actionGreen,
  },
  section: {
    paddingHorizontal: 16,
    paddingBottom: 14,
    gap: 8,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: farmerTheme.lightGreenSurface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionTitle: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '700',
    color: farmerTheme.headingGreen,
    letterSpacing: 0.2,
  },
  infoPanel: {
    backgroundColor: farmerTheme.creamSurface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: farmerTheme.softBorder,
    padding: 12,
    gap: 10,
  },
  infoGridRow: {
    flexDirection: 'row',
    gap: 12,
  },
  infoField: {
    flex: 1,
    gap: 3,
    minWidth: 0,
  },
  infoLabel: {
    fontSize: 10,
    lineHeight: 14,
    fontWeight: '700',
    color: farmerTheme.secondaryText,
    letterSpacing: 0.8,
  },
  infoValue: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '600',
    color: farmerTheme.deepText,
  },
  highlightValue: {
    fontSize: 15,
    lineHeight: 22,
    fontWeight: '600',
    color: farmerTheme.deepText,
  },
  landPanel: {
    gap: 6,
  },
  landPrimary: {
    fontSize: 24,
    lineHeight: 30,
    fontWeight: '700',
    color: farmerTheme.actionGreen,
  },
  landUnit: {
    fontSize: 16,
    fontWeight: '600',
    color: farmerTheme.primary,
  },
  landSecondaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
  },
  landSecondary: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '500',
    color: farmerTheme.secondaryText,
  },
  landDot: {
    fontSize: 13,
    color: farmerTheme.secondaryText,
  },
  statsWrap: {
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: farmerTheme.softBorder,
    backgroundColor: farmerTheme.creamSurface,
    overflow: 'hidden',
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'stretch',
  },
  statCell: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 8,
    gap: 4,
  },
  statDividerV: {
    width: 1,
    backgroundColor: farmerTheme.softBorder,
  },
  statDividerH: {
    height: 1,
    backgroundColor: farmerTheme.softBorder,
  },
  statValue: {
    fontSize: 18,
    lineHeight: 24,
    fontWeight: '700',
    color: farmerTheme.deepText,
    textAlign: 'center',
  },
  statLabel: {
    fontSize: 11,
    lineHeight: 14,
    fontWeight: '600',
    color: farmerTheme.secondaryText,
    textAlign: 'center',
  },
});
