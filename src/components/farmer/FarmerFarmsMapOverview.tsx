import type { FarmerFarmViewModel } from '../../utils/farmMapHelpers';
import { FarmerFarmLocationsMap } from './FarmerFarmLocationsMap';

interface FarmerFarmsMapOverviewProps {
  farms: FarmerFarmViewModel[];
  farmerDisplayId?: string;
}

export function FarmerFarmsMapOverview({
  farms,
  farmerDisplayId = '',
}: FarmerFarmsMapOverviewProps) {
  return (
    <FarmerFarmLocationsMap
      farms={farms}
      farmerDisplayId={farmerDisplayId}
    />
  );
}
