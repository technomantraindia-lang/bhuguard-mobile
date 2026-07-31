import { memo, type ReactNode } from 'react';
import { StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { loginTheme } from './Theme';

interface LoginFeatureRowProps {
  farmerFirst: string;
  secureTrusted: string;
  betterTogether: string;
}

function LeafIcon({ size }: { size: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M5 19c8-1 12-6 14-14-7 1-13 5-14 14z"
        stroke={loginTheme.cream}
        strokeWidth={1.7}
        strokeLinejoin="round"
      />
      <Path
        d="M5 19c2-4 5-7 9-9"
        stroke={loginTheme.cream}
        strokeWidth={1.7}
        strokeLinecap="round"
      />
    </Svg>
  );
}

function ShieldCheckIcon({ size }: { size: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 2L4 5v6.1c0 5 3.4 9.7 8 11 4.6-1.3 8-6 8-11V5l-8-3z"
        stroke={loginTheme.cream}
        strokeWidth={1.7}
        strokeLinejoin="round"
      />
      <Path
        d="M9 12l2 2 4-4"
        stroke={loginTheme.cream}
        strokeWidth={1.7}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function CommunityIcon({ size }: { size: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M16 11a3 3 0 100-6 3 3 0 000 6zM8 11a3 3 0 100-6 3 3 0 000 6z"
        stroke={loginTheme.cream}
        strokeWidth={1.7}
      />
      <Path
        d="M3.5 19c.6-2.6 2.7-4 4.5-4s3.9 1.4 4.5 4M11.5 19c.6-2.6 2.7-4 4.5-4s3.9 1.4 4.5 4"
        stroke={loginTheme.cream}
        strokeWidth={1.7}
        strokeLinecap="round"
      />
    </Svg>
  );
}

function FeatureItem({
  icon,
  label,
  compact,
}: {
  icon: ReactNode;
  label: string;
  compact: boolean;
}) {
  return (
    <View style={styles.item}>
      <View style={[styles.badge, compact && styles.badgeCompact]}>{icon}</View>
      <Text
        style={[styles.label, compact && styles.labelCompact]}
        allowFontScaling={false}
      >
        {label}
      </Text>
    </View>
  );
}

function LoginFeatureRowComponent({
  farmerFirst,
  secureTrusted,
  betterTogether,
}: LoginFeatureRowProps) {
  const { width } = useWindowDimensions();
  const compact = width < 380;
  const iconSize = compact ? 15 : 17;

  return (
    <View style={styles.row}>
      <FeatureItem
        icon={<LeafIcon size={iconSize} />}
        label={farmerFirst}
        compact={compact}
      />
      <View style={styles.divider} />
      <FeatureItem
        icon={<ShieldCheckIcon size={iconSize} />}
        label={secureTrusted}
        compact={compact}
      />
      <View style={styles.divider} />
      <FeatureItem
        icon={<CommunityIcon size={iconSize} />}
        label={betterTogether}
        compact={compact}
      />
    </View>
  );
}

export const LoginFeatureRow = memo(LoginFeatureRowComponent);

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    width: '100%',
    marginTop: 4,
    paddingTop: 8,
    overflow: 'visible',
  },
  item: {
    flex: 1,
    minWidth: 0,
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 2,
  },
  badge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: loginTheme.deepGreen,
    borderWidth: 1.5,
    borderColor: loginTheme.secondaryYellow,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeCompact: {
    width: 34,
    height: 34,
    borderRadius: 17,
  },
  label: {
    width: '100%',
    fontSize: 11,
    fontWeight: '600',
    color: loginTheme.darkText,
    textAlign: 'center',
    lineHeight: 15,
    fontFamily: loginTheme.fonts.medium,
  },
  labelCompact: {
    fontSize: 10,
    lineHeight: 13,
  },
  divider: {
    width: StyleSheet.hairlineWidth + 0.5,
    alignSelf: 'stretch',
    minHeight: 48,
    backgroundColor: 'rgba(11, 46, 31, 0.18)',
    marginHorizontal: 2,
    marginTop: 2,
    marginBottom: 2,
  },
});
