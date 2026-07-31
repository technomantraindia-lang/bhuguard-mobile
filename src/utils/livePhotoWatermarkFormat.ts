import {
  evidenceTimestampFromIso,
  formatEvidenceStampLabel,
  parseEvidenceInstant,
  type EvidenceCaptureTimestamp,
} from './evidenceDateTime';

export interface LivePhotoWatermarkMeta {
  capturedAtLabel: string;
  latitudeLabel: string;
  longitudeLabel: string;
  accuracyLabel: string;
  villageLabel: string;
  talukaLabel: string;
  districtLabel: string;
  stateLabel: string;
}

/**
 * Format burned-in watermark timestamp in device local time.
 * Never formats a UTC ISO string as if its wall-clock digits were local.
 */
export function formatWatermarkTimestamp(iso: string): string {
  return formatEvidenceStampLabel(parseEvidenceInstant(iso));
}

export function buildLivePhotoWatermarkMeta(input: {
  capturedAt: string;
  latitude: number | null;
  longitude: number | null;
  accuracy: number | null;
  village: string;
  taluka: string;
  district: string;
  state: string;
  timestamp?: EvidenceCaptureTimestamp;
}): LivePhotoWatermarkMeta {
  const timestamp = input.timestamp ?? evidenceTimestampFromIso(input.capturedAt);

  return {
    capturedAtLabel: timestamp.stampLabel,
    latitudeLabel:
      input.latitude != null ? `Lat: ${input.latitude.toFixed(6)}` : 'Lat: —',
    longitudeLabel:
      input.longitude != null ? `Lng: ${input.longitude.toFixed(6)}` : 'Lng: —',
    accuracyLabel: input.accuracy != null ? `Accuracy: ${Math.round(input.accuracy)}m` : 'Accuracy: —',
    villageLabel: input.village && input.village !== '—' ? `Village: ${input.village}` : 'Village: —',
    talukaLabel: input.taluka && input.taluka !== '—' ? `Taluka: ${input.taluka}` : 'Taluka: —',
    districtLabel:
      input.district && input.district !== '—' ? `District: ${input.district}` : 'District: —',
    stateLabel: input.state && input.state !== '—' ? `State: ${input.state}` : 'State: —',
  };
}

export function getLivePhotoWatermarkLines(meta: LivePhotoWatermarkMeta): string[] {
  return [
    meta.capturedAtLabel,
    meta.latitudeLabel,
    meta.longitudeLabel,
    meta.accuracyLabel,
    meta.villageLabel,
    meta.talukaLabel,
    meta.districtLabel,
    meta.stateLabel,
  ];
}
