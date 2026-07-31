import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';

import { officerShadow } from '../theme/officerDashboardTheme';
import { RoleBottomTabBar, type RoleTabConfig } from './shared/RoleBottomTabBar';

const OFFICER_TABS: RoleTabConfig[] = [
  { routeName: 'Home', labelKey: 'tabs.officer.dashboard', icon: 'assignment_turned_in', filledWhenActive: true },
  { routeName: 'Farmers', labelKey: 'tabs.officer.farmers', icon: 'group' },
  { routeName: 'MyArtisans', labelKey: 'tabs.officer.myArtisans', icon: 'badge' },
  { routeName: 'Profile', labelKey: 'tabs.officer.profile', icon: 'account_circle', filledWhenActive: true },
];

export function OfficerBottomTabBar(props: BottomTabBarProps) {
  return <RoleBottomTabBar {...props} tabs={OFFICER_TABS} shadowStyle={officerShadow} />;
}
