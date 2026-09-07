import { CommonActions } from '@react-navigation/native';

import type { FieldOfficerStackParamList, FarmerStackParamList, RootStackParamList } from './types';

export type BhuguardDeepLinkTarget =
  | {
      route: 'FieldOfficerApp';
      params: { screen: 'OnboardedFarmerView'; params: NonNullable<FieldOfficerStackParamList['OnboardedFarmerView']> };
    }
  | {
      route: 'FarmerApp';
      params: { screen: 'FarmerFarmDetail'; params: FarmerStackParamList['FarmerFarmDetail'] };
    };

export function parseBhuguardDeepLink(value: string): BhuguardDeepLinkTarget | null {
  const raw = String(value ?? '').trim();
  if (!raw) {
    return null;
  }

  let parsed: URL;
  try {
    parsed = new URL(raw);
  } catch {
    return null;
  }

  if (parsed.protocol.toLowerCase() !== 'bhuguard:') {
    return null;
  }

  const segments = [parsed.hostname, ...parsed.pathname.split('/')]
    .map((segment) => segment.trim())
    .filter(Boolean)
    .map((segment) => {
      try {
        return decodeURIComponent(segment);
      } catch {
        return segment;
      }
    });

  const entity = segments[0]?.toLowerCase();
  const identifier = segments[1]?.trim();
  if (!entity || !identifier || segments.length > 2) {
    return null;
  }

  if (entity === 'farmer') {
    const numericId = Number(identifier);
    return {
      route: 'FieldOfficerApp',
      params: {
        screen: 'OnboardedFarmerView',
        params: Number.isSafeInteger(numericId) && numericId > 0
          ? { farmerId: numericId, farmerDisplayId: identifier }
          : { farmerDisplayId: identifier },
      },
    };
  }

  if (entity === 'farm') {
    const farmId = Number(identifier);
    if (!Number.isSafeInteger(farmId) || farmId <= 0) {
      return null;
    }

    return {
      route: 'FarmerApp',
      params: { screen: 'FarmerFarmDetail', params: { farmId } },
    };
  }

  return null;
}

export function createBhuguardDeepLinkAction(target: BhuguardDeepLinkTarget) {
  return CommonActions.navigate(target.route as keyof RootStackParamList, target.params as never);
}
