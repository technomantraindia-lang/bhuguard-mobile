import { useEffect } from 'react';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { STITCH_REGISTRY } from '../../config/stitchRegistry';
import {
  STITCH_LIVE_EVIDENCE_FORM_KEYS,
  STITCH_NAVIGATE_REPLACEMENTS,
} from '../../config/stitchScreenRoutes';
import { useFieldOfficerVisitsData } from '../../hooks/useFieldOfficerVisitsData';
import type { CompanyStackParamList, FieldOfficerStackParamList, FarmerStackParamList } from '../../navigation/types';
import { FarmerLiveEvidenceUploadScreen } from '../shared/FarmerLiveEvidenceUploadScreen';
import { StitchScreenView } from './StitchScreenView';

export type StitchRouteParams = {
  StitchScreen: { screenKey: string; itemId?: number };
};

type FarmerProps = NativeStackScreenProps<FarmerStackParamList, 'StitchScreen'>;
type OfficerProps = NativeStackScreenProps<FieldOfficerStackParamList, 'StitchScreen'>;
type CompanyProps = NativeStackScreenProps<CompanyStackParamList, 'StitchScreen'>;
type Props = FarmerProps | OfficerProps | CompanyProps;

function isOfficerScreenKey(screenKey: string): boolean {
  const role = STITCH_REGISTRY[screenKey]?.role;
  return role === 'officer' || role === 'shared';
}

function stitchReplace(navigation: Props['navigation'], screen: string, params?: object) {
  (navigation as { replace: (name: string, params?: object) => void }).replace(screen, params);
}

function needsAssignment(replacement: (typeof STITCH_NAVIGATE_REPLACEMENTS)[string] | undefined): boolean {
  return (
    replacement?.officer === 'VisitCheckIn' ||
    replacement?.officer === 'VisitEvidenceUpload'
  );
}

export function StitchScreenRoute({ route, navigation }: Props) {
  const { screenKey, itemId } = route.params;
  const replacement = STITCH_NAVIGATE_REPLACEMENTS[screenKey];
  const registryRole = STITCH_REGISTRY[screenKey]?.role;
  const officerContext = useFieldOfficerVisitsData();
  const isOfficer = isOfficerScreenKey(screenKey);
  const assignmentId = itemId ?? officerContext.primaryAssignmentId ?? undefined;

  useEffect(() => {
    if (!replacement) {
      return;
    }

    const context = { assignmentId };

    if (registryRole === 'farmer' && replacement.farmer) {
      stitchReplace(navigation, replacement.farmer, replacement.buildParams?.(itemId, context));
      return;
    }

    if ((registryRole === 'officer' || registryRole === 'shared') && replacement.officer) {
      if (!assignmentId && needsAssignment(replacement)) {
        return;
      }

      stitchReplace(navigation, replacement.officer, replacement.buildParams?.(itemId, context));
      return;
    }

    if (registryRole === 'company' && replacement.company) {
      stitchReplace(navigation, replacement.company, replacement.buildParams?.(itemId, context));
    }
  }, [assignmentId, itemId, navigation, registryRole, replacement, screenKey]);

  if (replacement?.farmer && registryRole === 'farmer') {
    return null;
  }

  if (replacement?.officer && (registryRole === 'officer' || registryRole === 'shared')) {
    if (!assignmentId && needsAssignment(replacement)) {
      return (
        <StitchScreenView
          screenKey={screenKey}
          itemId={itemId}
          stitchRouteName="StitchScreen"
          missingAssignmentMessage="Assign a visit before opening this verification screen."
        />
      );
    }

    return null;
  }

  if (replacement?.company && registryRole === 'company') {
    return null;
  }

  if (STITCH_LIVE_EVIDENCE_FORM_KEYS.has(screenKey)) {
    return <FarmerLiveEvidenceUploadScreen screenKey={screenKey} farmId={itemId} />;
  }

  return (
    <StitchScreenView
      screenKey={screenKey}
      itemId={itemId}
      stitchRouteName="StitchScreen"
      officerAssignmentId={isOfficer ? assignmentId : undefined}
    />
  );
}
