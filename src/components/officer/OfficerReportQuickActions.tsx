import { Pressable, StyleSheet, Text, View } from 'react-native';

import { BhuguardMaterialIcon, type BhuguardIconName } from '../shared/BhuguardMaterialIcon';
import { officerCardShadow, officerTheme } from '../../theme/officerDashboardTheme';

interface OfficerReportQuickActionsProps {
  onCreateReport: () => void;
  onPendingReports: () => void;
  onDownloadCenter: () => void;
}

export function OfficerReportQuickActions({
  onCreateReport,
  onPendingReports,
  onDownloadCenter,
}: OfficerReportQuickActionsProps) {
  return (
    <View style={styles.grid}>
      <QuickActionCard icon="note_add" label="Create Report" onPress={onCreateReport} />
      <QuickActionCard icon="pending_actions" label="Pending Reports" onPress={onPendingReports} />
      <QuickActionCard icon="upload" label="Download Center" onPress={onDownloadCenter} />
    </View>
  );
}

function QuickActionCard({
  icon,
  label,
  onPress,
}: {
  icon: BhuguardIconName;
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable style={[styles.card, officerCardShadow]} onPress={onPress}>
      <View style={styles.iconWrap}>
        <BhuguardMaterialIcon name={icon} size={20} color={officerTheme.primaryContainer} />
      </View>
      <Text style={styles.label}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  card: {
    width: '48%',
    backgroundColor: officerTheme.surfaceLowest,
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: officerTheme.surfaceVariant,
    gap: 10,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(173, 238, 195, 0.25)',
  },
  label: {
    fontSize: 13,
    fontWeight: '700',
    color: officerTheme.onSurface,
  },
});
