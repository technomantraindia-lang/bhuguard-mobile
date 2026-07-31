export type EvidenceCaptureSource = 'live_camera' | 'gallery_exif' | 'gallery_selected';

export interface EvidenceCaptureTimestamp {
  /** Canonical instant as ISO 8601 UTC, e.g. 2026-07-14T08:56:47.000Z */
  capturedAtUtc: string;
  /** Local wall-clock ISO with offset, e.g. 2026-07-14T14:26:47.000+05:30 */
  capturedAtLocal: string;
  /** IANA timezone, e.g. Asia/Kolkata */
  timezone: string;
  /** UTC offset in minutes at capture, e.g. 330 */
  utcOffsetMinutes: number;
  epochMilliseconds: number;
  captureSource: EvidenceCaptureSource;
  /** Burned-in stamp label: "14 Jul 2026 2:26:47 PM" */
  stampLabel: string;
  /** UI badge label using device locale */
  badgeLabel: string;
}

const INDIA_FALLBACK_TIMEZONE = 'Asia/Kolkata';

const MONTHS_EN = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'] as const;

export function detectDeviceTimezone(): string {
  try {
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

    if (timezone && timezone.trim()) {
      return timezone;
    }
  } catch {
    // Fall through to India deployment fallback.
  }

  return INDIA_FALLBACK_TIMEZONE;
}

export function getUtcOffsetMinutes(date: Date = new Date()): number {
  return -date.getTimezoneOffset();
}

function pad2(value: number): string {
  return String(value).padStart(2, '0');
}

function pad3(value: number): string {
  return String(value).padStart(3, '0');
}

function formatOffsetIso(offsetMinutes: number): string {
  const sign = offsetMinutes >= 0 ? '+' : '-';
  const absolute = Math.abs(offsetMinutes);
  const hours = pad2(Math.floor(absolute / 60));
  const minutes = pad2(absolute % 60);

  return `${sign}${hours}:${minutes}`;
}

/**
 * Format a Date as local wall-clock ISO with explicit offset.
 * Never strips "Z" and re-parses as local.
 */
export function toLocalOffsetIso(date: Date, offsetMinutes: number = getUtcOffsetMinutes(date)): string {
  const local = new Date(date.getTime() + offsetMinutes * 60_000);
  const year = local.getUTCFullYear();
  const month = pad2(local.getUTCMonth() + 1);
  const day = pad2(local.getUTCDate());
  const hours = pad2(local.getUTCHours());
  const minutes = pad2(local.getUTCMinutes());
  const seconds = pad2(local.getUTCSeconds());
  const millis = pad3(local.getUTCMilliseconds());

  return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}.${millis}${formatOffsetIso(offsetMinutes)}`;
}

/**
 * Burned-in stamp format: DD MMM YYYY h:mm:ss A (device local).
 * Always formats from epoch milliseconds in local/device timezone parts.
 */
export function formatEvidenceStampLabel(epochMilliseconds: number): string {
  const date = new Date(epochMilliseconds);
  const day = date.getDate();
  const month = MONTHS_EN[date.getMonth()] ?? 'Jan';
  const year = date.getFullYear();
  let hours = date.getHours();
  const minutes = pad2(date.getMinutes());
  const seconds = pad2(date.getSeconds());
  const meridiem = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;

  if (hours === 0) {
    hours = 12;
  }

  return `${day} ${month} ${year} ${hours}:${minutes}:${seconds} ${meridiem}`;
}

export function formatEvidenceBadgeLabel(epochMilliseconds: number): string {
  return new Date(epochMilliseconds).toLocaleString();
}

/**
 * Parse an ISO / date string into epoch ms without treating a UTC string as naive local.
 */
export function parseEvidenceInstant(value: string | number | Date): number {
  if (value instanceof Date) {
    return value.getTime();
  }

  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }

  const raw = String(value).trim();

  if (!raw) {
    return Date.now();
  }

  // "YYYY-MM-DD HH:mm:ss" without timezone — treat as local wall clock.
  const naiveMatch = raw.match(
    /^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2})(?::(\d{2}))?(?:\.(\d{1,3}))?$/,
  );

  if (naiveMatch) {
    const year = Number(naiveMatch[1]);
    const month = Number(naiveMatch[2]) - 1;
    const day = Number(naiveMatch[3]);
    const hour = Number(naiveMatch[4]);
    const minute = Number(naiveMatch[5]);
    const second = Number(naiveMatch[6] ?? 0);
    const millis = Number((naiveMatch[7] ?? '0').padEnd(3, '0'));
    return new Date(year, month, day, hour, minute, second, millis).getTime();
  }

  const parsed = Date.parse(raw);

  if (Number.isNaN(parsed)) {
    return Date.now();
  }

  return parsed;
}

export function createEvidenceCaptureTimestamp(params?: {
  epochMilliseconds?: number;
  timezone?: string;
  captureSource?: EvidenceCaptureSource;
}): EvidenceCaptureTimestamp {
  const epochMilliseconds = params?.epochMilliseconds ?? Date.now();
  const date = new Date(epochMilliseconds);
  const timezone = params?.timezone ?? detectDeviceTimezone();
  const utcOffsetMinutes = getUtcOffsetMinutes(date);

  return {
    capturedAtUtc: date.toISOString(),
    capturedAtLocal: toLocalOffsetIso(date, utcOffsetMinutes),
    timezone,
    utcOffsetMinutes,
    epochMilliseconds,
    captureSource: params?.captureSource ?? 'live_camera',
    stampLabel: formatEvidenceStampLabel(epochMilliseconds),
    badgeLabel: formatEvidenceBadgeLabel(epochMilliseconds),
  };
}

export function evidenceTimestampFromIso(
  iso: string,
  options?: {
    timezone?: string;
    utcOffsetMinutes?: number;
    captureSource?: EvidenceCaptureSource;
  },
): EvidenceCaptureTimestamp {
  const epochMilliseconds = parseEvidenceInstant(iso);
  const date = new Date(epochMilliseconds);
  const timezone = options?.timezone ?? detectDeviceTimezone();
  const utcOffsetMinutes = options?.utcOffsetMinutes ?? getUtcOffsetMinutes(date);

  return {
    capturedAtUtc: date.toISOString(),
    capturedAtLocal: toLocalOffsetIso(date, utcOffsetMinutes),
    timezone,
    utcOffsetMinutes,
    epochMilliseconds,
    captureSource: options?.captureSource ?? 'live_camera',
    stampLabel: formatEvidenceStampLabel(epochMilliseconds),
    badgeLabel: formatEvidenceBadgeLabel(epochMilliseconds),
  };
}
