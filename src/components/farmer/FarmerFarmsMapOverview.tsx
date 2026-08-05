import type { FarmerFarmViewModel } from '../../utils/farmMapHelpers';
import { FarmerFarmLocationsMap } from './FarmerFarmLocationsMap';

interface FarmerFarmsMapOverviewProps {
  farms: FarmerFarmViewModel[];
  farmerDisplayId?: string;
  onOpenMaps: () => void;
}

export function FarmerFarmsMapOverview({
  farms,
  farmerDisplayId = '',
  onOpenMaps,
}: FarmerFarmsMapOverviewProps) {
  return (
    <FarmerFarmLocationsMap
      farms={farms}
      farmerDisplayId={farmerDisplayId}
      onOpenMaps={onOpenMaps}
    />
  );
}
