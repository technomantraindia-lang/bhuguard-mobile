export function isActiveFarmActivityBlockMessage(message: string | null | undefined): boolean {
  const raw = String(message ?? '').trim();

  if (!raw) {
    return false;
  }

  return (
    /active farm activity already exists/i.test(raw) ||
    /complete or resume it before starting/i.test(raw) ||
    /existing active activity/i.test(raw)
  );
}

export function sanitizeFarmActivityError(message: string | null | undefined, fallback: string): string {
  const raw = String(message ?? '').trim();

  if (!raw || isActiveFarmActivityBlockMessage(raw)) {
    return fallback;
  }

  return raw;
}
