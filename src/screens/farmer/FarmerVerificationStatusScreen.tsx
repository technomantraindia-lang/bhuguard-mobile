import { getFarmerVerificationStatus } from '../../api/farmerApi';
import { ApiListScreen } from '../../components/ApiListScreen';
import { ListItemCard } from '../../components/ListItemCard';

export function FarmerVerificationStatusScreen() {
  return (
    <ApiListScreen
      title="Verification Status"
      subtitle="GET /farmer/verification-status"
      fetcher={getFarmerVerificationStatus}
      listKeys={['assignments']}
      emptyTitle="No verification visits"
      emptyMessage="No field officer visits are assigned yet."
      renderItem={(item) => (
        <ListItemCard
          item={item}
          titleKeys={['assignment_code', 'id']}
          statusNested="assignment_status"
          lines={[
            { label: 'Officer', nested: 'field_officer.name' },
            { label: 'Officer mobile', nested: 'field_officer.mobile' },
            { label: 'Service', nested: 'service.name' },
            { label: 'Farm', nested: 'farm.farm_name' },
            { label: 'Report status', nested: 'verification_report.admin_review_status' },
            { label: 'Remarks', nested: 'verification_report.admin_remarks' },
          ]}
        />
      )}
    />
  );
}
