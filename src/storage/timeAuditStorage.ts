import AsyncStorage from '@react-native-async-storage/async-storage';

const TIME_AUDIT_KEY = 'bhuguard_time_audit_log_v1';
const MAX_ENTRIES = 100;

export interface TimeAuditRecord {
  id: string;
  recordedAt: string;
  device_utc: string;
  server_utc: string;
  clock_skew_ms: number | null;
  device_time_suspicious: boolean;
  time_sync_source: string | null;
  time_detection_at: string;
  activity_context: string;
  user_id?: number | null;
  user_role?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  accuracy_m?: number | null;
}

export async function appendTimeAuditRecord(
  record: Omit<TimeAuditRecord, 'id' | 'recordedAt'> & { id?: string; recordedAt?: string },
): Promise<void> {
  const entry: TimeAuditRecord = {
    ...record,
    id: record.id ?? `ta-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    recordedAt: record.recordedAt ?? new Date().toISOString(),
  };

  try {
    const raw = await AsyncStorage.getItem(TIME_AUDIT_KEY);
    const existing = raw ? (JSON.parse(raw) as TimeAuditRecord[]) : [];
    const next = [entry, ...(Array.isArray(existing) ? existing : [])].slice(0, MAX_ENTRIES);
    await AsyncStorage.setItem(TIME_AUDIT_KEY, JSON.stringify(next));
  } catch {
    // Audit persistence must never break submit flows.
  }
}

export async function listTimeAuditRecords(limit = 50): Promise<TimeAuditRecord[]> {
  try {
    const raw = await AsyncStorage.getItem(TIME_AUDIT_KEY);
    const existing = raw ? (JSON.parse(raw) as TimeAuditRecord[]) : [];
    return (Array.isArray(existing) ? existing : []).slice(0, limit);
  } catch {
    return [];
  }
}
