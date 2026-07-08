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

export function formatWatermarkTimestamp(iso: string): string {
  const date = new Date(iso);
  const day = date.getDate();
  const month = date.toLocaleString('en-GB', { month: 'short' });
  const year = date.getFullYear();
  const time = date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
  });

  return `${day} ${month} ${year} ${time}`;
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
}): LivePhotoWatermarkMeta {
  return {
    capturedAtLabel: formatWatermarkTimestamp(input.capturedAt),
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
