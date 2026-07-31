import React, { type ReactNode } from "react";
import {
  StyleSheet,
  View,
  type StyleProp,
  type ViewStyle,
} from "react-native";

export interface LiquidGlassCardProps {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
}

export function LiquidGlassCard({
  children,
  style,
}: LiquidGlassCardProps) {
  return (
    <View style={[styles.shadowWrap, style]}>
      <View style={styles.cardShell}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  shadowWrap: {
    width: "100%",
    borderRadius: 28,
    backgroundColor: "#FFFFFF",
    shadowColor: "#000000",
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.12,
    shadowRadius: 20,
    elevation: 8,
  },

  cardShell: {
    width: "100%",
    borderRadius: 28,
    overflow: "hidden",
    backgroundColor: "#FFFFFF",
  },
});