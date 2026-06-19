export interface BiocharDmrvInputs {
  feedstockQuantity: string;
  biocharYield: string;
  fixedCarbonPercent: string;
}

export interface BiocharDmrvResult {
  biocharProducedKg: number;
  carbonStoredKg: number;
  estimatedCo2eTonnes: number;
  estimatedCarbonCredits: number;
}

const CO2_PER_CARBON = 3.67;

export function calculateBiocharDmrv(inputs: BiocharDmrvInputs): BiocharDmrvResult | null {
  const feedstockQuantity = Number(inputs.feedstockQuantity);
  const biocharYield = Number(inputs.biocharYield);
  const fixedCarbonPercent = Number(inputs.fixedCarbonPercent);

  if (
    !Number.isFinite(feedstockQuantity) ||
    !Number.isFinite(biocharYield) ||
    !Number.isFinite(fixedCarbonPercent) ||
    feedstockQuantity <= 0 ||
    biocharYield <= 0 ||
    biocharYield > 100 ||
    fixedCarbonPercent <= 0 ||
    fixedCarbonPercent > 100
  ) {
    return null;
  }

  const biocharProducedKg = feedstockQuantity * (biocharYield / 100);
  const carbonStoredKg = biocharProducedKg * (fixedCarbonPercent / 100);
  const estimatedCo2eTonnes = (carbonStoredKg * CO2_PER_CARBON) / 1000;

  return {
    biocharProducedKg: round(biocharProducedKg, 3),
    carbonStoredKg: round(carbonStoredKg, 3),
    estimatedCo2eTonnes: round(estimatedCo2eTonnes, 4),
    estimatedCarbonCredits: round(estimatedCo2eTonnes, 4),
  };
}

export function validateBiocharDmrvInputs(inputs: BiocharDmrvInputs): string | null {
  if (!inputs.feedstockQuantity.trim()) {
    return 'Enter feedstock quantity for biochar activity.';
  }

  if (!inputs.biocharYield.trim()) {
    return 'Enter biochar yield percentage.';
  }

  if (!inputs.fixedCarbonPercent.trim()) {
    return 'Enter fixed carbon percentage.';
  }

  if (!calculateBiocharDmrv(inputs)) {
    return 'Enter valid biochar DMRV values (yield and carbon between 1 and 100).';
  }

  return null;
}

function round(value: number, decimals: number): number {
  const factor = 10 ** decimals;

  return Math.round(value * factor) / factor;
}
