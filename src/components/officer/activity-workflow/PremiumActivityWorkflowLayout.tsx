import { type ReactNode } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { getLinearGradient } from '../../../utils/nativeGlass';
import { PremiumActivityFooter } from './PremiumActivityFooter';
import { PremiumActivityHeader } from './PremiumActivityHeader';
import { PremiumActivityProgressCard } from './PremiumActivityProgressCard';
import type { ActivityWorkflowStepMeta } from './premiumActivityWorkflowTheme';
import { premiumWorkflowTheme } from './premiumActivityWorkflowTheme';

interface PremiumActivityWorkflowLayoutProps {
  title: string;
  subtitle: string;
  progressLabel?: string;
  steps: ActivityWorkflowStepMeta[];
  currentStep: number;
  completedCount?: number;
  progressPercent?: number;
  error?: string | null;
  loading?: boolean;
  viewOnly?: boolean;
  primaryLabel: string;
  showPrevious?: boolean;
  primaryDisabled?: boolean;
  loadingLabel?: string;
  onBack: () => void;
  onPrevious?: () => void;
  onPrimary: () => void;
  onStepPress?: (index: number) => void;
  children: ReactNode;
}

/** Legacy single-card layout kept for compatibility; Farm Activity uses the multi-section screen directly. */
export function PremiumActivityWorkflowLayout({
  title,
  subtitle,
  progressLabel,
  steps,
  currentStep,
  completedCount,
  progressPercent,
  loading = false,
  viewOnly = false,
  primaryLabel,
  showPrevious = false,
  primaryDisabled = false,
  loadingLabel,
  onBack,
  onPrevious,
  onPrimary,
  onStepPress,
  children,
}: PremiumActivityWorkflowLayoutProps) {
  const insets = useSafeAreaInsets();
  const LinearGradient = getLinearGradient();
  const gradientColors = premiumWorkflowTheme.gradient;
  const resolvedCompleted = completedCount ?? currentStep;
  const resolvedPercent =
    progressPercent ?? Math.round(((resolvedCompleted) / Math.max(steps.length, 1)) * 100);

  return (
    <View style={styles.root}>
      {LinearGradient ? (
        <LinearGradient colors={[...gradientColors]} style={StyleSheet.absoluteFill} />
      ) : (
        <View style={[StyleSheet.absoluteFill, { backgroundColor: gradientColors[0] ?? '#06291D' }]} />
      )}

      <PremiumActivityHeader title={title} subtitle={subtitle} onBack={onBack} />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 130 }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <PremiumActivityProgressCard
          steps={steps}
          currentStep={currentStep}
          completedCount={resolvedCompleted}
          progressPercent={resolvedPercent}
          progressLabel={progressLabel}
          onStepPress={onStepPress}
        />
        {children}
      </ScrollView>

      <PremiumActivityFooter
        showPrevious={showPrevious && !viewOnly}
        onPrevious={onPrevious}
        primaryLabel={primaryLabel}
        onPrimary={onPrimary}
        primaryDisabled={primaryDisabled || viewOnly}
        loading={loading}
        loadingLabel={loadingLabel}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { flex: 1 },
  content: {
    paddingHorizontal: 16,
    paddingTop: 16,
    gap: 16,
    maxWidth: 720,
    width: '100%',
    alignSelf: 'center',
  },
});
