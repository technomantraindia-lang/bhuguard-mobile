import { memo, type ReactNode } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { loginTheme } from './Theme';

interface GlassCardProps {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  contentStyle?: StyleProp<ViewStyle>;
}

function GlassCardComponent({ children, style, contentStyle }: GlassCardProps) {
  return (
    <View style={[styles.shadowWrap, style]}>
      <View style={styles.shell}>
        <View style={styles.glassFill} pointerEvents="none" />
        <View style={styles.reflection} pointerEvents="none" />
        <View style={[styles.content, contentStyle]}>{children}</View>
      </View>
    </View>
  );
}

export const GlassCard = memo(GlassCardComponent);

const styles = StyleSheet.create({
  shadowWrap: {
    width: '100%',
    shadowColor: loginTheme.shadow,
    shadowOpacity: 0.28,
    shadowRadius: 28,
    shadowOffset: { width: 0, height: 14 },
    elevation: 12,
  },
  shell: {
    borderRadius: 36,
    overflow: 'hidden',
    borderWidth: 1.2,
    borderColor: loginTheme.glassBorder,
    backgroundColor: loginTheme.glassFillStrong,
  },
  glassFill: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(244, 240, 223, 0.44)',
  },
  reflection: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '26%',
    backgroundColor: 'rgba(255,255,255,0.18)',
  },
  content: {
    paddingHorizontal: 18,
    paddingTop: 24,
    paddingBottom: 20,
    gap: 10,
  },
});
