export function normalizePincode(value?: string | null): string {
  return String(value ?? '').replace(/\D/g, '').slice(0, 6);
}

export function pickAutoPincode(...candidates: Array<string | null | undefined>): string {
  for (const candidate of candidates) {
    const normalized = normalizePincode(candidate);

    if (/^\d{6}$/.test(normalized)) {
      return normalized;
    }
  }

  return '';
}

export function isValidPincode(value?: string | null): boolean {
  return /^\d{6}$/.test(normalizePincode(value));
}
