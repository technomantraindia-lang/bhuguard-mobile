/** Shared layout metrics for Farmer + Field Officer mobile shells. */

export const SCREEN_HORIZONTAL_PADDING = 16;

export const TAB_BAR_TOP_PADDING = 6;

export const TAB_BAR_CONTENT_HEIGHT = 58;

export const TAB_BAR_MIN_BOTTOM_INSET = 8;

export const TAB_BAR_EXTRA_SCROLL_PADDING = 16;

export const FAB_ABOVE_TAB_BAR_GAP = 12;

export const HEADER_MIN_HEIGHT = 56;

export const BUTTON_HEIGHT = 48;

export const CARD_RADIUS = 14;

export const ICON_SIZE_SM = 20;

export const ICON_SIZE_MD = 22;

export const ICON_SIZE_LG = 24;

export function getTabBarHeight(bottomInset: number): number {
  return TAB_BAR_CONTENT_HEIGHT + TAB_BAR_TOP_PADDING + Math.max(bottomInset, TAB_BAR_MIN_BOTTOM_INSET);
}

export function getScrollBottomPadding(bottomInset: number, extra = TAB_BAR_EXTRA_SCROLL_PADDING): number {
  return getTabBarHeight(bottomInset) + extra;
}

export function getFabBottomOffset(bottomInset: number): number {
  return getTabBarHeight(bottomInset) + FAB_ABOVE_TAB_BAR_GAP;
}
