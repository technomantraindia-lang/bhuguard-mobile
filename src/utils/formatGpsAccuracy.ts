export type GpsAccuracyStatus = 'good' | 'fair' | 'poor' | 'very_poor' | 'unavailable';

export interface GpsAccuracyFormat {
  /** Full UI label, e.g. "GPS Accuracy: ±4.8 m · Good" */
  label: string;
  /** Value portion, e.g. "±4.8 m · Good" or "Not available" */
  valueText: string;
  status: GpsAccuracyStatus;
}

/**
 * Formats device GPS horizontal accuracy for display.
 * Classification is for Field Officer location quality only — not polygon accuracy.
 */
export function formatGpsAccuracy(accuracyMeters: number | null | undefined): GpsAccuracyFormat {
  if (accuracyMeters === null || accuracyMeters === undefined || !Number.isFinite(accuracyMeters) || accuracyMeters < 0) {
    return {
      label: 'GPS Accuracy: Not available',
      valueText: 'Not available',
      status: 'unavailable',
    };
  }

  const meters = accuracyMeters;
  let status: GpsAccuracyStatus;
  let statusLabel: string;

  if (meters <= 5) {
    status = 'good';
    statusLabel = 'Good';
  } else if (meters <= 10) {
    status = 'fair';
    statusLabel = 'Fair';
  } else if (meters <= 20) {
    status = 'poor';
    statusLabel = 'Poor';
  } else {
    status = 'very_poor';
    statusLabel = 'Very Poor';
  }

  const valueText = `±${meters.toFixed(1)} m · ${statusLabel}`;

  return {
    label: `GPS Accuracy: ${valueText}`,
    valueText,
    status,
  };
}
