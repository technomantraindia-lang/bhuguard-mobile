import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  FAB_ABOVE_TAB_BAR_GAP,
  getFabBottomOffset,
  getScrollBottomPadding,
  getTabBarHeight,
  TAB_BAR_EXTRA_SCROLL_PADDING,
} from '../theme/layoutMetrics';

export function useTabBarHeight(): number {
  const insets = useSafeAreaInsets();

  return getTabBarHeight(insets.bottom);
}

export function useScrollBottomPadding(extra = TAB_BAR_EXTRA_SCROLL_PADDING): number {
  const insets = useSafeAreaInsets();

  return getScrollBottomPadding(insets.bottom, extra);
}

export function useFabBottomOffset(): number {
  const insets = useSafeAreaInsets();

  return getFabBottomOffset(insets.bottom);
}

export function useFabBottomOffsetWithGap(gap = FAB_ABOVE_TAB_BAR_GAP): number {
  const insets = useSafeAreaInsets();

  return getTabBarHeight(insets.bottom) + gap;
}
