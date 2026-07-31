import type { AuthUser } from '../../types/auth';

let coldStartLanguageShown = false;
let sessionValidatedThisColdStart: AuthUser | null = null;
let unlockCompletedThisColdStart = false;

export function markColdStartLanguageShown(): void {
  coldStartLanguageShown = true;
}

export function wasColdStartLanguageShown(): boolean {
  return coldStartLanguageShown;
}

export function getValidatedColdStartUser(): AuthUser | null {
  return sessionValidatedThisColdStart;
}

export function setValidatedColdStartUser(user: AuthUser | null): void {
  sessionValidatedThisColdStart = user;
}

export function markUnlockCompleted(): void {
  unlockCompletedThisColdStart = true;
}

export function wasUnlockCompleted(): boolean {
  return unlockCompletedThisColdStart;
}

export function clearColdStartSessionGate(): void {
  sessionValidatedThisColdStart = null;
  unlockCompletedThisColdStart = false;
}
