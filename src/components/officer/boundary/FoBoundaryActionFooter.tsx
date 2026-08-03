import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { dashboardTheme } from '../../../theme/bhuguardDashboardTheme';

export type FoBoundaryWorkflowState =
  | 'ready'
  | 'drawing'
  | 'completed_unsaved'
  | 'editing'
  | 'saving'
  | 'saved'
  | 'save_failed';

export interface FoBoundaryActionFooterProps {
  workflowState: FoBoundaryWorkflowState;
  canStartDrawing: boolean;
  startDrawingLabel: string;
  canComplete: boolean;
  canSaveBoundary: boolean;
  canSaveChanges: boolean;
  onStartDrawing: () => void;
  onCenterGps: () => void;
  onUndoLastPoint: () => void;
  onCompleteBoundary: () => void;
  onResetBoundary: () => void;
  onEditBoundary: () => void;
  onSaveBoundary: () => void;
  onSaveChanges: () => void;
  onCancelEdit: () => void;
  onDone: () => void;
  onRetrySave: () => void;
  onCancelBack: () => void;
  onViewFarmDetails?: () => void;
}

function PrimaryButton({
  label,
  onPress,
  disabled = false,
  loading = false,
}: {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
}) {
  return (
    <Pressable
      style={({ pressed }) => [
        styles.primaryButton,
        (disabled || loading) && styles.buttonDisabled,
        pressed && !disabled && !loading && styles.pressed,
      ]}
      disabled={disabled || loading}
      onPress={onPress}
    >
      {loading ? (
        <ActivityIndicator color={dashboardTheme.onPrimary} />
      ) : (
        <Text style={styles.primaryButtonText}>{label}</Text>
      )}
    </Pressable>
  );
}

function OutlineButton({
  label,
  onPress,
  disabled = false,
}: {
  label: string;
  onPress: () => void;
  disabled?: boolean;
}) {
  return (
    <Pressable
      style={({ pressed }) => [
        styles.outlineButton,
        disabled && styles.buttonDisabled,
        pressed && !disabled && styles.pressed,
      ]}
      disabled={disabled}
      onPress={onPress}
    >
      <Text style={styles.outlineButtonText}>{label}</Text>
    </Pressable>
  );
}

export function FoBoundaryActionFooter({
  workflowState,
  canStartDrawing,
  startDrawingLabel,
  canComplete,
  canSaveBoundary,
  canSaveChanges,
  onStartDrawing,
  onCenterGps,
  onUndoLastPoint,
  onCompleteBoundary,
  onResetBoundary,
  onEditBoundary,
  onSaveBoundary,
  onSaveChanges,
  onCancelEdit,
  onDone,
  onRetrySave,
  onCancelBack,
  onViewFarmDetails,
}: FoBoundaryActionFooterProps) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.footer, { paddingBottom: insets.bottom + 32 }]}>
      {workflowState === 'ready' ? (
        <>
          <PrimaryButton
            label={startDrawingLabel}
            onPress={onStartDrawing}
            disabled={!canStartDrawing}
          />
          <OutlineButton label="Center GPS" onPress={onCenterGps} />
        </>
      ) : null}

      {workflowState === 'drawing' ? (
        <>
          <OutlineButton label="Undo Last Point" onPress={onUndoLastPoint} />
          <PrimaryButton
            label="Complete Boundary"
            onPress={onCompleteBoundary}
            disabled={!canComplete}
          />
          <OutlineButton label="Reset Boundary" onPress={onResetBoundary} />
        </>
      ) : null}

      {workflowState === 'completed_unsaved' ? (
        <>
          <PrimaryButton
            label="Save Boundary"
            onPress={onSaveBoundary}
            disabled={!canSaveBoundary}
          />
          <OutlineButton label="Edit Boundary" onPress={onEditBoundary} />
          <OutlineButton label="Reset Boundary" onPress={onResetBoundary} />
        </>
      ) : null}

      {workflowState === 'editing' ? (
        <>
          <PrimaryButton
            label="Save Changes"
            onPress={onSaveChanges}
            disabled={!canSaveChanges}
          />
          <OutlineButton label="Cancel Edit" onPress={onCancelEdit} />
          <OutlineButton label="Reset Boundary" onPress={onResetBoundary} />
        </>
      ) : null}

      {workflowState === 'saving' ? (
        <PrimaryButton label="Saving Boundary…" onPress={() => undefined} loading disabled />
      ) : null}

      {workflowState === 'saved' ? (
        <>
          <OutlineButton label="Edit Boundary" onPress={onEditBoundary} />
          {onViewFarmDetails ? (
            <OutlineButton label="View Farm Details" onPress={onViewFarmDetails} />
          ) : null}
          {/* Done sits below the other controls — it is the final exit action (Phase 10.8). */}
          <PrimaryButton label="Done" onPress={onDone} />
        </>
      ) : null}

      {workflowState === 'save_failed' ? (
        <>
          <PrimaryButton label="Retry Save" onPress={onRetrySave} disabled={!canSaveBoundary} />
          <OutlineButton label="Edit Boundary" onPress={onEditBoundary} />
          <OutlineButton label="Cancel / Back" onPress={onCancelBack} />
        </>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  footer: {
    backgroundColor: '#FFFbf5',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: dashboardTheme.outlineVariant,
    paddingHorizontal: 14,
    paddingTop: 12,
    gap: 10,
    shadowColor: '#0F172A',
    shadowOpacity: 0.08,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: -4 },
    elevation: 10,
  },
  primaryButton: {
    minHeight: 52,
    borderRadius: 12,
    backgroundColor: dashboardTheme.primaryContainer,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 14,
  },
  primaryButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: dashboardTheme.onPrimary,
  },
  outlineButton: {
    minHeight: 52,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: dashboardTheme.primary,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 14,
    backgroundColor: dashboardTheme.surfaceLowest,
  },
  outlineButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: dashboardTheme.primaryContainer,
  },
  buttonDisabled: {
    opacity: 0.45,
  },
  pressed: {
    opacity: 0.88,
  },
});
