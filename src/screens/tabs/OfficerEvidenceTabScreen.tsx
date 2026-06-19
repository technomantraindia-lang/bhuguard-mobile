import { Alert, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type { CompositeNavigationProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { BhuguardMaterialIcon } from '../../components/shared/BhuguardMaterialIcon';
import { useFieldOfficerVisitsData } from '../../hooks/useFieldOfficerVisitsData';
import type { FieldOfficerStackParamList, FieldOfficerTabParamList } from '../../navigation/types';
import { officerCardShadow, officerTheme } from '../../theme/officerDashboardTheme';

type Nav = CompositeNavigationProp<
  BottomTabNavigationProp<FieldOfficerTabParamList, 'Evidence'>,
  NativeStackNavigationProp<FieldOfficerStackParamList>
>;

export function OfficerEvidenceTabScreen() {
  const navigation = useNavigation<Nav>();
  const { data, loading, reload, primaryAssignmentId } = useFieldOfficerVisitsData();

  const openUpload = () => {
    const assignmentId = primaryAssignmentId ?? data?.visits[0]?.assignmentId;
    if (!assignmentId) {
      Alert.alert('No active visit', 'Assign a visit before uploading evidence.');
      return;
    }

    navigation.navigate('VisitEvidenceUpload', { assignmentId });
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.container}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={reload} tintColor={officerTheme.primary} />
        }
      >
        <Text style={styles.title}>Evidence Upload</Text>
        <Text style={styles.subtitle}>Capture geo-tagged photos and field proof for verification visits.</Text>

        <Pressable style={[styles.heroCard, officerCardShadow]} onPress={openUpload}>
          <View style={styles.heroIcon}>
            <BhuguardMaterialIcon name="photo_camera" size={32} color={officerTheme.primary} />
          </View>
          <Text style={styles.heroTitle}>Upload Visit Evidence</Text>
          <Text style={styles.heroText}>Capture live camera photos with GPS for your active assignment.</Text>
        </Pressable>

        <View style={styles.grid}>
          <ActionTile
            label="GPS Check-In"
            icon="share_location"
            onPress={() => {
              const assignmentId = primaryAssignmentId ?? data?.visits[0]?.assignmentId;
              if (assignmentId) {
                navigation.navigate('VisitCheckIn', { assignmentId });
              }
            }}
          />
          <ActionTile
            label="Verification Checklist"
            icon="fact_check"
            onPress={() => {
              const assignmentId = primaryAssignmentId ?? data?.visits[0]?.assignmentId;
              if (assignmentId) {
                navigation.navigate('VerificationChecklist', { assignmentId });
              }
            }}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function ActionTile({
  label,
  icon,
  onPress,
}: {
  label: string;
  icon: 'share_location' | 'fact_check';
  onPress: () => void;
}) {
  return (
    <Pressable style={[styles.tile, officerCardShadow]} onPress={onPress}>
      <BhuguardMaterialIcon name={icon} size={22} color={officerTheme.primary} />
      <Text style={styles.tileLabel}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: officerTheme.background,
  },
  container: {
    padding: officerTheme.marginMobile,
    gap: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
    color: officerTheme.primary,
  },
  subtitle: {
    fontSize: 14,
    color: officerTheme.onSurfaceVariant,
    marginTop: -8,
  },
  heroCard: {
    backgroundColor: officerTheme.surfaceLowest,
    borderRadius: 18,
    padding: 20,
    gap: 8,
    borderWidth: 1,
    borderColor: 'rgba(191, 201, 190, 0.15)',
  },
  heroIcon: {
    width: 56,
    height: 56,
    borderRadius: 14,
    backgroundColor: 'rgba(173, 238, 195, 0.35)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  heroTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: officerTheme.onSurface,
  },
  heroText: {
    fontSize: 13,
    color: officerTheme.onSurfaceVariant,
    lineHeight: 18,
  },
  grid: {
    flexDirection: 'row',
    gap: 12,
  },
  tile: {
    flex: 1,
    backgroundColor: officerTheme.surfaceLowest,
    borderRadius: 14,
    padding: 14,
    gap: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(191, 201, 190, 0.12)',
  },
  tileLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: officerTheme.onSurface,
    textAlign: 'center',
  },
});
