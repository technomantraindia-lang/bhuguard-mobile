const SECRET_KEYS = [
  'password',
  'passwd',
  'otp',
  'pattern',
  'token',
  'access_token',
  'refresh_token',
  'authorization',
  'maptiler',
  'api_key',
  'apikey',
  'secret',
  'app_key',
  'keystore',
  'db_password',
  'database_password',
];

const SECRET_PATTERNS: RegExp[] = [
  /\bBearer\s+[A-Za-z0-9\-._~+/]+=*/gi,
  /\b(eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,})\b/g,
  /\b(QA_TEST_OTP|QA_TEST_PATTERN|APP_KEY|DB_PASSWORD)\s*=\s*\S+/gi,
];

export function maskSecrets(input: string): string {
  if (!input) {
    return input;
  }

  let output = input;
  for (const pattern of SECRET_PATTERNS) {
    output = output.replace(pattern, '[REDACTED]');
  }

  for (const key of SECRET_KEYS) {
    const re = new RegExp(`("${key}"\\s*:\\s*")([^"]*)(")`, 'gi');
    output = output.replace(re, '$1[REDACTED]$3');
    const re2 = new RegExp(`(${key}\\s*[=:]\\s*)([^\\s,;]+)`, 'gi');
    output = output.replace(re2, '$1[REDACTED]');
  }

  return output;
}

export function maskValue(label: string, value: string): string {
  const lower = label.toLowerCase();
  if (SECRET_KEYS.some((k) => lower.includes(k))) {
    return value ? '[REDACTED]' : '';
  }
  return value;
}
