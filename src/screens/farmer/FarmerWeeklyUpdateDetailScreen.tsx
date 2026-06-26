import { StyleSheet, Text, View } from 'react-native';

import type { NativeStackScreenProps } from '@react-navigation/native-stack';



import { getFarmerWeeklyUpdateDetail } from '../../api/farmerApi';

import { ApiDetailScreen } from '../../components/ApiDetailScreen';

import { EvidenceDetailActions } from '../../components/evidence/EvidenceDetailActions';

import { EvidenceImagePreview } from '../../components/evidence/EvidenceImagePreview';

import type { FarmerStackParamList } from '../../navigation/types';

import { colors } from '../../theme/colors';

import type { ApiRecord } from '../../utils/apiHelpers';

import { pickString } from '../../utils/apiHelpers';



type Props = NativeStackScreenProps<FarmerStackParamList, 'FarmerWeeklyUpdateDetail'>;



function weeklyUpdateEvidenceItems(item: ApiRecord): ApiRecord[] {

  const evidence = item.evidence;



  if (!Array.isArray(evidence)) {

    return [];

  }



  return evidence.filter((entry) => entry && typeof entry === 'object') as ApiRecord[];

}



export function FarmerWeeklyUpdateDetailScreen({ route, navigation }: Props) {

  const { updateId } = route.params;



  return (

    <ApiDetailScreen

      title="Weekly Update Detail"

      subtitle="Activity update with linked evidence"

      fetcher={() => getFarmerWeeklyUpdateDetail(updateId)}

      rootKeys={['weekly_update', 'data']}

      fields={[

        { label: 'Update Date', keys: ['update_date'] },

        { label: 'Week Number', keys: ['week_number'] },

        { label: 'Activity', keys: ['activity_done'] },

        { label: 'Crop Stage', keys: ['crop_or_stage'] },

        { label: 'Farm', nested: 'farm.farm_name' },

        { label: 'Status', keys: ['status'] },

        { label: 'Remarks', keys: ['remarks'] },

      ]}

      renderExtra={(item: ApiRecord) => {

        const evidenceItems = weeklyUpdateEvidenceItems(item);



        if (evidenceItems.length === 0) {

          return (

            <View style={styles.emptyEvidence}>

              <Text style={styles.emptyEvidenceText}>No evidence photos linked to this weekly update yet.</Text>

            </View>

          );

        }



        return (

          <View style={styles.evidenceSection}>

            <Text style={styles.evidenceTitle}>Linked Evidence</Text>

            {evidenceItems.map((evidence) => {

              const evidenceId = evidence.id as number | string;



              return (

                <View key={String(evidenceId)} style={styles.evidenceCard}>

                  <Text style={styles.evidenceLabel}>

                    {pickString(evidence, 'category', 'original_file_name')}

                  </Text>

                  <EvidenceImagePreview

                    role="farmer"

                    evidenceId={evidenceId}

                    mimeType={pickString(evidence, 'mime_type') === '-' ? null : pickString(evidence, 'mime_type')}

                    title={pickString(evidence, 'category', 'original_file_name')}

                    onOpenFullscreen={(uri, title) => navigation.navigate('FullscreenImage', { uri, title })}

                  />

                  <EvidenceDetailActions role="farmer" evidence={evidence} />

                </View>

              );

            })}

          </View>

        );

      }}

    />

  );

}



const styles = StyleSheet.create({

  evidenceSection: { gap: 16, marginTop: 8 },

  evidenceTitle: { fontSize: 16, fontWeight: '700', color: colors.text },

  evidenceCard: { gap: 10 },

  evidenceLabel: { fontSize: 13, fontWeight: '600', color: colors.textMuted },

  emptyEvidence: {

    marginTop: 8,

    padding: 12,

    borderRadius: 12,

    borderWidth: 1,

    borderColor: colors.border,

    backgroundColor: colors.card,

  },

  emptyEvidenceText: { fontSize: 13, color: colors.textMuted, lineHeight: 20 },

});


