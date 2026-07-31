import AsyncStorage from '@react-native-async-storage/async-storage';

const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 5 * 60 * 1000;

type LockoutState = {
  attempts: number;
  lockedUntil: number | null;
};

function lockoutKey(mobile: string): string {
  const digits = String(mobile).replace(/\D/g, '').slice(-10);
  return `@bhuguard/mpin_lockout/${digits || 'unknown'}`;
}

async function readState(mobile: string): Promise<LockoutState> {
  try {
    const raw = await AsyncStorage.getItem(lockoutKey(mobile));

    if (!raw) {
      return { attempts: 0, lockedUntil: null };
    }

    const parsed = JSON.parse(raw) as Partial<LockoutState>;
    return {
      attempts: typeof parsed.attempts === 'number' ? parsed.attempts : 0,
      lockedUntil: typeof parsed.lockedUntil === 'number' ? parsed.lockedUntil : null,
    };
  } catch {
    return { attempts: 0, lockedUntil: null };
  }
}

async function writeState(mobile: string, state: LockoutState): Promise<void> {
  await AsyncStorage.setItem(lockoutKey(mobile), JSON.stringify(state));
}

export type MpinLockoutStatus = {
  locked: boolean;
  remainingMs: number;
  attempts: number;
  remainingAttempts: number;
};

export async function getMpinLockoutStatus(mobile: string): Promise<MpinLockoutStatus> {
  const state = await readState(mobile);
  const now = Date.now();

  if (state.lockedUntil != null && state.lockedUntil > now) {
    return {
      locked: true,
      remainingMs: state.lockedUntil - now,
      attempts: state.attempts,
      remainingAttempts: 0,
    };
  }

  if (state.lockedUntil != null && state.lockedUntil <= now) {
    await writeState(mobile, { attempts: 0, lockedUntil: null });
    return {
      locked: false,
      remainingMs: 0,
      attempts: 0,
      remainingAttempts: MAX_FAILED_ATTEMPTS,
    };
  }

  return {
    locked: false,
    remainingMs: 0,
    attempts: state.attempts,
    remainingAttempts: Math.max(0, MAX_FAILED_ATTEMPTS - state.attempts),
  };
}

/** Record a failed MPIN attempt. Never stores the PIN. */
export async function recordFailedMpinAttempt(mobile: string): Promise<MpinLockoutStatus> {
  const current = await getMpinLockoutStatus(mobile);

  if (current.locked) {
    return current;
  }

  const attempts = current.attempts + 1;

  if (attempts >= MAX_FAILED_ATTEMPTS) {
    const next: LockoutState = {
      attempts,
      lockedUntil: Date.now() + LOCKOUT_DURATION_MS,
    };
    await writeState(mobile, next);
    return {
      locked: true,
      remainingMs: LOCKOUT_DURATION_MS,
      attempts,
      remainingAttempts: 0,
    };
  }

  await writeState(mobile, { attempts, lockedUntil: null });

  return {
    locked: false,
    remainingMs: 0,
    attempts,
    remainingAttempts: Math.max(0, MAX_FAILED_ATTEMPTS - attempts),
  };
}

export async function clearMpinLockout(mobile: string): Promise<void> {
  await AsyncStorage.removeItem(lockoutKey(mobile));
}

export function formatLockoutRemaining(remainingMs: number): string {
  const totalSeconds = Math.max(1, Math.ceil(remainingMs / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  if (minutes <= 0) {
    return `${seconds}s`;
  }

  return `${minutes}m ${seconds.toString().padStart(2, '0')}s`;
}

export const MPIN_LOCKOUT_MAX_ATTEMPTS = MAX_FAILED_ATTEMPTS;
