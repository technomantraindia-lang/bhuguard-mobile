import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { getEvidenceDetail } from '../../api/evidenceApi';
import { ApiDetailScreen } from '../../components/ApiDetailScreen';
import { EvidenceDetailActions } from '../../components/evidence/EvidenceDetailActions';
import { EvidenceImagePreview } from '../../components/evidence/EvidenceImagePreview';
import type { FarmerStackParamList } from '../../navigation/types';
import type { ApiRecord } from '../../utils/apiHelpers';
import { pickString } from '../../utils/apiHelpers';

type Props = NativeStackScreenProps<FarmerStackParamList, 'FarmerEvidenceDetail'>;

export function FarmerEvidenceDetailScreen({ route, navigation }: Props) {
  const { evidenceId } = route.params;

  return (
    <ApiDetailScreen
      title="Evidence Detail"
      subtitle="View photo and evidence details"
      fetcher={() => getEvidenceDetail('farmer', evidenceId)}
      rootKeys={['evidence']}
      titleKeys={['category', 'original_file_name', 'evidence_code']}
      statusKeys={['verification_status']}
      fields={[
        { label: 'Evidence Code', keys: ['evidence_code'] },
        { label: 'Category', keys: ['category'] },
        { label: 'Farm', nested: 'farm.farm_name' },
        { label: 'Weekly Update', nested: 'weekly_update.update_code' },
        { label: 'Captured At', keys: ['captured_at'] },
        { label: 'Uploaded At', keys: ['uploaded_at', 'created_at'] },
        { label: 'Latitude', keys: ['latitude'] },
        { label: 'Longitude', keys: ['longitude'] },
        { label: 'GPS Accuracy', keys: ['gps_accuracy'] },
        { label: 'File Name', keys: ['original_file_name'] },
        { label: 'Notes', keys: ['notes'] },
      ]}
      renderExtra={(item: ApiRecord) => (
        <>
          <EvidenceImagePreview
            role="farmer"
            evidenceId={evidenceId}
            mimeType={pickString(item, 'mime_type') === '-' ? null : pickString(item, 'mime_type')}
            title={pickString(item, 'original_file_name', 'evidence_code')}
            onOpenFullscreen={(uri, title) => navigation.navigate('FullscreenImage', { uri, title })}
          />
          <EvidenceDetailActions role="farmer" evidence={item} />
        </>
      )}
    />
  );
}
