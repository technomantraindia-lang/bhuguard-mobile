import { QA_THRESHOLDS } from '../config/thresholds.config';

export function resolveTimeouts(overrides?: {
  timeoutMs?: number;
  stallTimeoutMs?: number;
}): { timeoutMs: number; stallTimeoutMs: number } {
  return {
    timeoutMs: overrides?.timeoutMs ?? QA_THRESHOLDS.commandDefaultTimeoutMs,
    stallTimeoutMs: overrides?.stallTimeoutMs ?? QA_THRESHOLDS.stallTimeoutMs,
  };
}

export function describeTimeout(result: { timedOut: boolean; stalled: boolean }): string {
  if (result.stalled) {
    return 'Command stalled (no output for stall timeout) and was stopped safely.';
  }
  if (result.timedOut) {
    return 'Command exceeded hard timeout and was stopped safely.';
  }
  return '';
}
