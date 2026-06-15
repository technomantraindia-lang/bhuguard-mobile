import AsyncStorage from '@react-native-async-storage/async-storage';

const DOWNLOADED_REPORTS_KEY = 'bhuguard_downloaded_reports';

export async function getDownloadedReportIds(): Promise<string[]> {
  const raw = await AsyncStorage.getItem(DOWNLOADED_REPORTS_KEY);

  if (!raw) {
    return [];
  }

  try {
    const parsed = JSON.parse(raw) as string[];

    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export async function markReportDownloaded(reportKey: string): Promise<void> {
  const existing = await getDownloadedReportIds();

  if (existing.includes(reportKey)) {
    return;
  }

  await AsyncStorage.setItem(DOWNLOADED_REPORTS_KEY, JSON.stringify([...existing, reportKey]));
}
