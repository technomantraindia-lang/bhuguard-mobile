import { Alert, Pressable, RefreshControl, ScrollView, Share, StyleSheet, Text, View } from 'react-native';

import { SafeAreaView } from 'react-native-safe-area-context';

import type { NativeStackScreenProps } from '@react-navigation/native-stack';



import { AppButton } from '../../components/AppButton';

import { ActivityEvidenceImagePreview } from '../../components/evidence/ActivityEvidenceImagePreview';

import { ErrorState } from '../../components/ErrorState';

import { LoadingState } from '../../components/LoadingState';

import { ScreenHeader } from '../../components/ScreenHeader';

import { useFarmerActivityDetail } from '../../hooks/useFarmerActivityDetail';

import type { FarmerStackParamList } from '../../navigation/types';

import { dashboardTheme } from '../../theme/bhuguardDashboardTheme';

import { downloadActivityEvidenceFile } from '../../utils/evidenceFileDownload';

import { buildActivityTimelineSteps } from '../../utils/farmerActivityHelpers';



type Props = NativeStackScreenProps<FarmerStackParamList, 'FarmerActivityDetail'>;



function DetailRow({ label, value }: { label: string; value: string | null | undefined }) {

  if (!value) {

    return null;

  }



  return (

    <View style={styles.detailRow}>

      <Text style={styles.detailLabel}>{label}</Text>

      <Text style={styles.detailValue}>{value}</Text>

    </View>

  );

}



export function FarmerActivityDetailScreen({ navigation, route }: Props) {

  const { activityId } = route.params;

  const { activity, loading, error, reload } = useFarmerActivityDetail(activityId);



  const handleShare = async () => {

    if (!activity) {

      return;

    }



    await Share.share({

      message: `${activity.title} (${activity.activityId})\nFarm: ${activity.farmName}\nStatus: ${activity.statusLabel}\nDate: ${activity.dateLabel}`,

    });

  };



  const handleDownloadEvidence = async () => {

    const result = await downloadActivityEvidenceFile(activityId);



    if (!result.success) {

      Alert.alert('Download failed', result.message ?? 'Unable to download activity evidence photo.');

    }

  };



  const handleOpenEvidenceUploads = () => {

    navigation.navigate('FarmerEvidenceList');

  };



  if (loading && !activity) {

    return (

      <SafeAreaView style={styles.safe}>

        <LoadingState message="Loading activity details..." />

      </SafeAreaView>

    );

  }



  if (error && !activity) {

    return (

      <SafeAreaView style={styles.safe}>

        <ErrorState message={error} onRetry={reload} />

      </SafeAreaView>

    );

  }



  const item = activity!;

  const timeline = buildActivityTimelineSteps(item.status);

  const quantityLabel =

    item.quantity !== null && item.unit ? `${item.quantity} ${item.unit}` : item.quantity !== null ? String(item.quantity) : null;



  return (

    <SafeAreaView style={styles.safe} edges={['top']}>

      <ScrollView

        contentContainerStyle={styles.content}

        refreshControl={<RefreshControl refreshing={loading} onRefresh={reload} tintColor={dashboardTheme.primary} />}

      >

        <ScreenHeader title="Activity Details" subtitle={item.activityId} />



        <View style={styles.card}>

          <Text style={styles.title}>{item.title}</Text>

          <View style={styles.statusBadge}>

            <Text style={styles.statusText}>{item.statusLabel}</Text>

          </View>



          <DetailRow label="Activity ID" value={item.activityId} />

          <DetailRow label="Farm Name" value={item.farmName} />

          <DetailRow label="Farmer Name" value={item.farmerName} />

          <DetailRow label="Project Name" value={item.projectName} />

          <DetailRow label="Activity Date" value={item.dateLabel} />

          <DetailRow label="Recorded At" value={item.recordedAtLabel} />

          <DetailRow label="Submitted By" value={item.submittedBy} />

          <DetailRow label="Quantity" value={quantityLabel} />

          <DetailRow label="Description" value={item.description} />

          <DetailRow

            label="GPS Location"

            value={item.gpsCaptured ? 'Captured with coordinates' : null}

          />

          <DetailRow label="Evidence Photos" value={item.evidencePhotoCount > 0 ? String(item.evidencePhotoCount) : null} />

          <DetailRow label="Evidence Documents" value={item.documentsCount > 0 ? String(item.documentsCount) : null} />

          <DetailRow label="Verification Remarks" value={item.remark} />

          <DetailRow label="Officer Name" value={item.fieldOfficerName} />

          <DetailRow label="Review Date" value={item.reviewDateLabel} />

        </View>



        {item.evidencePhotoCount > 0 ? (

          <View style={styles.card}>

            <Text style={styles.sectionTitle}>Activity Evidence Photo</Text>

            <ActivityEvidenceImagePreview
              activityId={activityId}
              onOpenFullscreen={(uri, title) => navigation.navigate('FullscreenImage', { uri, title })}
            />

            <AppButton label="Download Evidence Photo" variant="secondary" onPress={() => void handleDownloadEvidence()} />

          </View>

        ) : null}



        <View style={styles.card}>

          <Text style={styles.sectionTitle}>Activity Timeline</Text>

          {timeline.map((step) => (

            <View key={step.label} style={styles.timelineRow}>

              <View style={[styles.timelineDot, step.complete && styles.timelineDotComplete]} />

              <Text style={[styles.timelineLabel, step.complete && styles.timelineLabelComplete]}>{step.label}</Text>

            </View>

          ))}

        </View>



        <View style={styles.actions}>

          <Pressable style={styles.secondaryButton} onPress={() => void handleShare()}>

            <Text style={styles.secondaryButtonText}>Share Report</Text>

          </Pressable>

          <Pressable style={styles.secondaryButton} onPress={handleOpenEvidenceUploads}>

            <Text style={styles.secondaryButtonText}>View All Evidence Uploads</Text>

          </Pressable>

        </View>

      </ScrollView>

    </SafeAreaView>

  );

}



const styles = StyleSheet.create({

  safe: {

    flex: 1,

    backgroundColor: dashboardTheme.background,

  },

  content: {

    padding: 20,

    gap: 16,

    paddingBottom: 32,

  },

  card: {

    backgroundColor: dashboardTheme.surfaceLowest,

    borderRadius: 16,

    borderWidth: 1,

    borderColor: dashboardTheme.outlineVariant,

    padding: 16,

    gap: 10,

  },

  title: {

    fontSize: 22,

    lineHeight: 30,

    fontWeight: '700',

    color: dashboardTheme.onSurface,

  },

  statusBadge: {

    alignSelf: 'flex-start',

    backgroundColor: dashboardTheme.surfaceLow,

    borderRadius: 999,

    paddingHorizontal: 12,

    paddingVertical: 6,

  },

  statusText: {

    fontSize: 12,

    fontWeight: '700',

    color: dashboardTheme.primaryContainer,

  },

  detailRow: {

    gap: 2,

  },

  detailLabel: {

    fontSize: 12,

    fontWeight: '600',

    color: dashboardTheme.textMuted,

  },

  detailValue: {

    fontSize: 15,

    lineHeight: 22,

    fontWeight: '500',

    color: dashboardTheme.onSurface,

  },

  sectionTitle: {

    fontSize: 16,

    fontWeight: '700',

    color: dashboardTheme.headingGreen,

    marginBottom: 4,

  },

  timelineRow: {

    flexDirection: 'row',

    alignItems: 'center',

    gap: 10,

    paddingVertical: 4,

  },

  timelineDot: {

    width: 10,

    height: 10,

    borderRadius: 5,

    backgroundColor: dashboardTheme.outlineVariant,

  },

  timelineDotComplete: {

    backgroundColor: dashboardTheme.primaryContainer,

  },

  timelineLabel: {

    fontSize: 14,

    color: dashboardTheme.textMuted,

    fontWeight: '500',

  },

  timelineLabelComplete: {

    color: dashboardTheme.onSurface,

    fontWeight: '600',

  },

  actions: {

    gap: 10,

  },

  secondaryButton: {

    borderWidth: 1,

    borderColor: dashboardTheme.primaryContainer,

    borderRadius: 12,

    paddingVertical: 12,

    alignItems: 'center',

  },

  secondaryButtonText: {

    color: dashboardTheme.primaryContainer,

    fontSize: 15,

    fontWeight: '600',

  },

});


