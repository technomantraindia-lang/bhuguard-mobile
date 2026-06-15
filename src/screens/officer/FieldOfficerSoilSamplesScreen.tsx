import { getSoilSamples } from '../../api/fieldOfficerApi';
import { ApiListScreen } from '../../components/ApiListScreen';
import { ListItemCard } from '../../components/ListItemCard';

export function FieldOfficerSoilSamplesScreen() {
  return (
    <ApiListScreen
      title="Soil Samples"
      subtitle="GET /field-officer/soil-samples"
      fetcher={getSoilSamples}
      listKeys={['soil_samples', 'samples']}
      emptyTitle="No soil samples"
      renderItem={(item) => (
        <ListItemCard
          item={item}
          titleKeys={['sample_code', 'id']}
          statusKey="status"
          lines={[
            { label: 'Sample Date', keys: ['sample_date', 'created_at'] },
            { label: 'Farmer', nested: 'farmer.user.name' },
            { label: 'Farm', nested: 'farm.farm_name' },
            { label: 'Lab Status', keys: ['lab_status'] },
          ]}
        />
      )}
    />
  );
}
