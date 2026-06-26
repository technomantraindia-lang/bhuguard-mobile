import { Alert, View, Text, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { getCompanyEvidence } from '../../api/evidenceApi';
import { ApiListScreen } from '../../components/ApiListScreen';
import { AppButton } from '../../components/AppButton';
import { ListItemCard } from '../../components/ListItemCard';
import type { CompanyStackParamList } from '../../navigation/types';
import { colors } from '../../theme/colors';
import type { ApiRecord } from '../../utils/apiHelpers';
import {
  evidenceCategoryLabel,
  evidenceHasGps,
  evidenceLinkedRecordLabel,
  evidenceVerificationLabel,
  openEvidenceUrl,
} from '../../utils/evidenceDisplayHelpers';

type Nav = NativeStackNavigationProp<CompanyStackParamList>;

export function CompanyEvidenceListScreen() {
  const navigation = useNavigation<Nav>();

  return (
    <ApiListScreen
      title="Company Evidence"
      subtitle="Company evidence uploads"
      fetcher={getCompanyEvidence}
      listKeys={['evidence', 'evidence_uploads']}
      emptyTitle="No evidence uploaded yet"
      emptyMessage="Upload photos, documents, weight slips and bills linked to your service submissions."
      headerAction={{
        label: 'Upload Evidence',
        onPress: () => navigation.navigate('CompanyEvidenceUpload'),
      }}
      renderItem={(item) => (
        <View style={styles.itemWrap}>
          <ListItemCard
            item={item}
            titleKeys={['category', 'original_file_name', 'title']}
            statusKey="verification_status"
            lines={[
              { label: 'Site', keys: ['site_name'] },
              { label: 'Submission', keys: ['submission_code'] },
              { label: 'Uploaded', keys: ['uploaded_at', 'created_at'] },
              { label: 'Notes', keys: ['notes'] },
            ]}
          />
          <View style={styles.badgeRow}>
            <Text style={styles.badge}>{evidenceCategoryLabel(item as ApiRecord)}</Text>
            <Text style={styles.badge}>
              {evidenceHasGps(item as ApiRecord) ? 'GPS attached' : 'No GPS'}
            </Text>
            <Text style={styles.badge}>{evidenceVerificationLabel(item as ApiRecord)}</Text>
          </View>
          <Text style={styles.linked}>Linked: {evidenceLinkedRecordLabel(item as ApiRecord)}</Text>
          {(item as ApiRecord).url ? (
            <AppButton
              label="View / Download"
              variant="secondary"
              onPress={() => {
                void openEvidenceUrl(item as ApiRecord).catch((err) => {
                  Alert.alert('Unable to open evidence', err instanceof Error ? err.message : 'Try again.');
                });
              }}
            />
          ) : null}
        </View>
      )}
    />
  );
}

const styles = StyleSheet.create({
  itemWrap: { gap: 8 },
  badgeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, paddingHorizontal: 4 },
  badge: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.primary,
    backgroundColor: colors.softGreen,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    overflow: 'hidden',
  },
  linked: { fontSize: 12, color: colors.textMuted, paddingHorizontal: 4 },
});
