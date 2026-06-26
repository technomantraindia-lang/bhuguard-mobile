import { Linking } from 'react-native';

import type { ApiRecord } from './apiHelpers';
import { pickNestedString, pickString } from './apiHelpers';
import { getCategoryLabel } from '../constants/evidenceCategories';

export function evidenceHasGps(item: ApiRecord): boolean {
  const latitude = item.latitude ?? item.gps_latitude;
  const longitude = item.longitude ?? item.gps_longitude;

  return latitude != null && longitude != null;
}

export function evidenceVerificationLabel(item: ApiRecord): string {
  const status = pickString(item, 'verification_status', 'status');

  return status === '-' ? 'Pending review' : status.replace(/_/g, ' ');
}

export function evidenceCategoryLabel(item: ApiRecord): string {
  const category = pickString(item, 'category', 'evidence_category');

  return category === '-' ? 'Evidence' : getCategoryLabel(category);
}

export function evidenceLinkedRecordLabel(item: ApiRecord): string {
  const farm = pickNestedString(item, 'farm.farm_name');
  const site = pickString(item, 'site_name');
  const submission = pickString(item, 'submission_code');

  if (farm !== '-') {
    return farm;
  }

  if (site !== '-') {
    return site;
  }

  if (submission !== '-') {
    return submission;
  }

  return '—';
}

export async function openEvidenceUrl(item: ApiRecord): Promise<void> {
  const url = pickString(item, 'url');

  if (url === '-') {
    throw new Error('Download link is not available for this evidence.');
  }

  await Linking.openURL(url);
}
