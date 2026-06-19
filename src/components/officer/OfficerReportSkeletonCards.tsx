import { StyleSheet, View } from 'react-native';

import { officerCardShadow, officerTheme } from '../../theme/officerDashboardTheme';

interface OfficerReportSkeletonCardsProps {
  count?: number;
}

export function OfficerReportSkeletonCards({ count = 3 }: OfficerReportSkeletonCardsProps) {
  return (
    <View style={styles.list}>
      {Array.from({ length: count }).map((_, index) => (
        <View key={`report-skeleton-${index}`} style={[styles.card, officerCardShadow]}>
          <View style={styles.lineShort} />
          <View style={styles.lineLong} />
          <View style={styles.lineMedium} />
          <View style={styles.actions}>
            <View style={styles.actionPrimary} />
            <View style={styles.actionSecondary} />
          </View>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  list: {
    gap: 12,
  },
  card: {
    backgroundColor: officerTheme.surfaceLowest,
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: officerTheme.surfaceVariant,
    gap: 10,
  },
  lineShort: {
    width: '38%',
    height: 12,
    borderRadius: 6,
    backgroundColor: officerTheme.surfaceContainerHigh,
  },
  lineLong: {
    width: '72%',
    height: 16,
    borderRadius: 8,
    backgroundColor: officerTheme.surfaceContainer,
  },
  lineMedium: {
    width: '55%',
    height: 12,
    borderRadius: 6,
    backgroundColor: officerTheme.surfaceContainerHigh,
  },
  actions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 4,
  },
  actionPrimary: {
    flex: 1,
    height: 40,
    borderRadius: 14,
    backgroundColor: officerTheme.surfaceContainer,
  },
  actionSecondary: {
    flex: 1,
    height: 40,
    borderRadius: 14,
    backgroundColor: officerTheme.surfaceContainerHigh,
  },
});
