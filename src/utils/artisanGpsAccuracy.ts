import type { BiocharEvidenceKey } from '../constants/biocharProduction';

export type ArtisanGpsActivityStage =
  | 'farm_lookup'
  | 'feedstock_check'
  | 'feedstock_image'
  | 'production_start'
  | 'process_evidence'
  | 'production_finish'
  | 'output_image'
  | 'submit';

export type ArtisanGpsAccuracyTier = 'excellent' | 'good' | 'acceptable' | 'poor' | 'unknown';

export function classifyArtisanGpsAccuracy(accuracyM: number): ArtisanGpsAccuracyTier {
  if (!Number.isFinite(accuracyM) || accuracyM <= 0) {
    return 'unknown';
  }

  if (accuracyM <= 10) {
    return 'excellent';
  }

  if (accuracyM <= 20) {
    return 'good';
  }

  if (accuracyM <= 30) {
    return 'acceptable';
  }

  return 'poor';
}

export function artisanGpsAccuracyLabel(tier: ArtisanGpsAccuracyTier): string {
  switch (tier) {
    case 'excellent':
      return 'Excellent';
    case 'good':
      return 'Good';
    case 'acceptable':
      return 'Acceptable';
    case 'poor':
      return 'Poor';
    default:
      return 'Unknown';
  }
}

export function artisanGpsAccuracyTone(tier: ArtisanGpsAccuracyTier): 'success' | 'warning' | 'danger' | 'neutral' {
  if (tier === 'excellent' || tier === 'good') {
    return 'success';
  }

  if (tier === 'acceptable') {
    return 'warning';
  }

  if (tier === 'poor') {
    return 'danger';
  }

  return 'neutral';
}

export function biocharEvidenceKeyToGpsStage(key: BiocharEvidenceKey): ArtisanGpsActivityStage | null {
  switch (key) {
    case 'feedstock_image':
      return 'feedstock_image';
    case 'moisture_image':
      return 'feedstock_check';
    case 'process_image':
    case 'process_video':
      return 'process_evidence';
    case 'batch_finish':
      return 'output_image';
    case 'operator_with_biochar':
      return 'production_finish';
    default:
      return null;
  }
}

export function formatArtisanGpsCoordinate(value: number | null | undefined, suffix: 'N' | 'E'): string {
  if (value == null || !Number.isFinite(value)) {
    return '—';
  }

  return `${value.toFixed(6)}° ${suffix}`;
}

export function formatArtisanGpsTimestamp(value: string | null | undefined): string {
  if (!value) {
    return '—';
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString();
}
