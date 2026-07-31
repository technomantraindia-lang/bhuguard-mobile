import { Pressable, View, Text, StyleSheet } from 'react-native';

import { useNavigation } from '@react-navigation/native';

import type { NativeStackNavigationProp } from '@react-navigation/native-stack';



import { getFarmerEvidence } from '../../api/evidenceApi';

import { ApiListScreen } from '../../components/ApiListScreen';

import { AppButton } from '../../components/AppButton';

import { ListItemCard } from '../../components/ListItemCard';

import type { FarmerStackParamList } from '../../navigation/types';

import { colors } from '../../theme/colors';

import type { ApiRecord } from '../../utils/apiHelpers';

import { pickString } from '../../utils/apiHelpers';

import {

  evidenceCategoryLabel,

  evidenceHasGps,

  evidenceLinkedRecordLabel,

  evidenceVerificationLabel,

} from '../../utils/evidenceDisplayHelpers';



type Nav = NativeStackNavigationProp<FarmerStackParamList>;



function evidenceIdFromItem(item: ApiRecord): number | null {

  const id = item.id;



  if (typeof id === 'number' && id > 0) {

    return id;

  }



  if (typeof id === 'string' && id.trim()) {

    const parsed = Number(id);



    return Number.isFinite(parsed) && parsed > 0 ? parsed : null;

  }



  return null;

}



export function FarmerEvidenceListScreen() {

  const navigation = useNavigation<Nav>();



  return (

    <ApiListScreen

      title="Evidence Uploads"

      subtitle="Farmer evidence"

      fetcher={getFarmerEvidence}

      listKeys={['evidence', 'evidence_uploads']}

      refetchOnFocus

      emptyTitle="No Evidence Uploaded"

      emptyMessage="Capture photos and documents linked to your farms and activities."

      headerAction={{

        label: 'Upload Photo',

        onPress: () => navigation.navigate('FarmerUploadEvidence'),

      }}

      renderItem={(item) => {

        const record = item as ApiRecord;

        const evidenceId = evidenceIdFromItem(record);



        return (

          <View style={styles.itemWrap}>

            <Pressable

              disabled={!evidenceId}

              onPress={() => {

                if (evidenceId) {

                  navigation.navigate('FarmerEvidenceDetail', { evidenceId });

                }

              }}

            >

              <ListItemCard

                item={record}

                titleKeys={['category', 'original_file_name', 'title']}

                statusKey="verification_status"

                lines={[

                  { label: 'Category', keys: ['category'] },

                  { label: 'Farm', nested: 'farm.farm_name' },

                  { label: 'Uploaded', keys: ['uploaded_at', 'created_at'] },

                  { label: 'Notes', keys: ['notes'] },

                ]}

              />

            </Pressable>

            <View style={styles.badgeRow}>

              <Text style={styles.badge}>{evidenceCategoryLabel(record)}</Text>

              <Text style={styles.badge}>

                {evidenceHasGps(record) ? 'GPS attached' : 'No GPS'}

              </Text>

              <Text style={styles.badge}>{evidenceVerificationLabel(record)}</Text>

            </View>

            <Text style={styles.linked}>Linked: {evidenceLinkedRecordLabel(record)}</Text>

            {evidenceId ? (

              <AppButton

                label="View Photo"

                variant="secondary"

                onPress={() => navigation.navigate('FarmerEvidenceDetail', { evidenceId })}

              />

            ) : (

              <Text style={styles.missingId}>Evidence ID missing for this record.</Text>

            )}

            {pickString(record, 'evidence_code') !== '-' ? (

              <Text style={styles.code}>Code: {pickString(record, 'evidence_code')}</Text>

            ) : null}

          </View>

        );

      }}

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

  code: { fontSize: 12, color: colors.textMuted, paddingHorizontal: 4 },

  missingId: { fontSize: 12, color: colors.error, paddingHorizontal: 4 },

});


