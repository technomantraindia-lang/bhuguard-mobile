import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { RoleEnvironmentalBackground } from '../shared/RoleEnvironmentalBackground';
import { officerTheme } from '../../theme/officerDashboardTheme';

interface OfficerScreenChromeProps {
  children: ReactNode;
  edges?: Array<'top' | 'right' | 'bottom' | 'left'>;
  withBackground?: boolean;
}

export function OfficerScreenChrome({
  children,
  edges = ['top', 'bottom'],
  withBackground = true,
}: OfficerScreenChromeProps) {
  return (
    <View style={styles.root}>
      {withBackground ? <RoleEnvironmentalBackground variant="auth" /> : null}
      <SafeAreaView style={styles.safe} edges={edges}>
        {children}
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: officerTheme.neutral,
  },
  safe: {
    flex: 1,
  },
});
