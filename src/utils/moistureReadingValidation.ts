export const MOISTURE_READING_MAX_EXCLUSIVE = 20;

export const MOISTURE_READING_LT20_MESSAGE = 'Moisture Reading must be less than 20.';

export const MOISTURE_READING_BACKEND_MESSAGE = 'Each Moisture Reading must be less than 20.';

/**
 * Valid moisture reading: numeric, >= 0, strictly less than 20.
 */
export function parseMoistureReadingValue(raw: string): number | null {
  const trimmed = raw.trim();

  if (!trimmed) {
    return null;
  }

  if (!/^\d+(\.\d+)?$/.test(trimmed)) {
    return null;
  }

  const value = Number(trimmed);

  if (!Number.isFinite(value)) {
    return null;
  }

  return value;
}

export function isValidMoistureReadingValue(raw: string): boolean {
  const value = parseMoistureReadingValue(raw);

  if (value === null) {
    return false;
  }

  return value >= 0 && value < MOISTURE_READING_MAX_EXCLUSIVE;
}

export function moistureReadingValidationError(raw: string): string | null {
  const trimmed = raw.trim();

  if (!trimmed) {
    return 'Moisture Reading is required.';
  }

  if (!isValidMoistureReadingValue(trimmed)) {
    return MOISTURE_READING_LT20_MESSAGE;
  }

  return null;
}

export function isMoistureReadingComplete(value: string, hasPhoto: boolean): boolean {
  return isValidMoistureReadingValue(value) && hasPhoto;
}

/**
 * Moisture step is complete when every required reading has a valid <20 value and a photo URI.
 */
export function isMoistureStepComplete(
  readings: Array<{ moistureReading?: string; photo?: { localUri?: string; uri?: string; remoteUrl?: string } | null }>,
): boolean {
  if (!Array.isArray(readings) || readings.length === 0) {
    return false;
  }

  return readings.every((reading) => {
    const hasPhoto = Boolean(reading.photo?.localUri || reading.photo?.uri || reading.photo?.remoteUrl);
    return isMoistureReadingComplete(reading.moistureReading ?? '', hasPhoto);
  });
}
