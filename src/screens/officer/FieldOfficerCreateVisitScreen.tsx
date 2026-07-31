import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import * as Location from 'expo-location';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { getApiErrorMessage } from '../../api/authApi';
import {
  createFieldOfficerVisit,
  getFieldOfficerFarmerDetail,
  getFieldOfficerFarmers,
} from '../../api/fieldOfficerApi';
import { AppButton } from '../../components/AppButton';
import { FormSelect } from '../../components/FormSelect';
import { NoAssignmentState } from '../../components/location/NoAssignmentState';
import { OfficerListState } from '../../components/officer/OfficerListState';
import { OfficerScreenChrome } from '../../components/officer/OfficerScreenChrome';
import { ScreenHeader } from '../../components/ScreenHeader';
import { useAssignedLocations } from '../../hooks/useAssignedLocations';
import type { FieldOfficerStackParamList } from '../../navigation/types';
import { officerCardShadow, officerTheme } from '../../theme/officerDashboardTheme';
import { extractList, pickString, type ApiRecord } from '../../utils/apiHelpers';

type Props = NativeStackScreenProps<FieldOfficerStackParamList, 'FieldOfficerCreateVisit'>;

const OUTSIDE_ZONE_MESSAGE = 'This location is outside your assigned working area.';

const PURPOSE_OPTIONS = [
  { id: 1, name: 'Field Visit', code: 'field_visit' },
  { id: 2, name: 'Farm Verification', code: 'farm_verification' },
  { id: 3, name: 'Biochar Follow-up', code: 'biochar_followup' },
  { id: 4, name: 'Inventory Check', code: 'inventory_check' },
];

function toDateInput(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function toTimeInput(date: Date): string {
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
}

function buildScheduledAt(dateStr: string, timeStr: string): string {
  const [hour = '09', minute = '00'] = timeStr.split(':');
  return `${dateStr}T${hour.padStart(2, '0')}:${minute.padStart(2, '0')}:00`;
}

export function FieldOfficerCreateVisitScreen({ route, navigation }: Props) {
  const initialFarmerId = route.params?.farmerId;
  const assigned = useAssignedLocations('field_officer');

  const [farmers, setFarmers] = useState<ApiRecord[]>([]);
  const [farms, setFarms] = useState<ApiRecord[]>([]);
  const [loadingFarmers, setLoadingFarmers] = useState(true);
  const [loadingFarms, setLoadingFarms] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [farmerId, setFarmerId] = useState(initialFarmerId ? String(initialFarmerId) : '');
  const [farmId, setFarmId] = useState('');
  const [districtId, setDistrictId] = useState('');
  const [districtName, setDistrictName] = useState('');
  const [talukaId, setTalukaId] = useState('');
  const [talukaName, setTalukaName] = useState('');
  const [villageId, setVillageId] = useState('');
  const [villageName, setVillageName] = useState('');
  const [visitDate, setVisitDate] = useState(toDateInput(new Date()));
  const [visitTime, setVisitTime] = useState('09:00');
  const [purposeCode, setPurposeCode] = useState('field_visit');
  const [purposeLabel, setPurposeLabel] = useState('Field Visit');
  const [notes, setNotes] = useState('');
  const [reminderEnabled, setReminderEnabled] = useState(true);
  const [includeGps, setIncludeGps] = useState(false);
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [accuracy, setAccuracy] = useState<number | null>(null);
  const [capturingGps, setCapturingGps] = useState(false);

  const districtOptions = useMemo(
    () => assigned.locations.districts.map((item) => ({ id: item.id, name: item.name })),
    [assigned.locations.districts],
  );

  const talukaOptions = useMemo(() => {
    const talukas = districtId
      ? assigned.locations.talukas.filter((item) => String(item.district_id ?? '') === districtId)
      : assigned.locations.talukas;
    return talukas.map((item) => ({ id: item.id, name: item.name }));
  }, [assigned.locations.talukas, districtId]);

  const villageOptions = useMemo(() => {
    const villages = talukaId
      ? assigned.locations.villages.filter((item) => String(item.taluka_id) === talukaId)
      : assigned.locations.villages;
    return villages.map((item) => ({ id: item.id, name: item.name }));
  }, [assigned.locations.villages, talukaId]);

  const farmerOptions = useMemo(
    () =>
      farmers.map((farmer) => ({
        id: Number(farmer.farmer_id ?? farmer.id),
        name: `${pickString(farmer, 'name')} (${pickString(farmer, 'farmer_code', 'id')})`,
      })),
    [farmers],
  );

  const farmOptions = useMemo(
    () =>
      farms.map((farm) => ({
        id: Number(farm.id ?? farm.farm_id),
        name: pickString(farm, 'farm_name', 'name', 'farm_code'),
      })),
    [farms],
  );

  const loadFarmers = useCallback(async () => {
    setLoadingFarmers(true);
    try {
      const data = await getFieldOfficerFarmers();
      setFarmers(extractList(data as ApiRecord, ['farmers', 'data']));
    } catch (err) {
      Alert.alert('Error', getApiErrorMessage(err, 'Failed to load farmers.'));
    } finally {
      setLoadingFarmers(false);
    }
  }, []);

  const loadFarmsForFarmer = useCallback(async (id: string) => {
    if (!id) {
      setFarms([]);
      return;
    }

    setLoadingFarms(true);
    try {
      const data = await getFieldOfficerFarmerDetail(id);
      const farmer = (data.farmer ?? data) as ApiRecord;
      setFarms(extractList(farmer, ['farms', 'data']));

      if (!districtId && pickString(farmer, 'district') !== '-') {
        const match = assigned.locations.districts.find(
          (item) => item.name.toLowerCase() === pickString(farmer, 'district').toLowerCase(),
        );
        if (match) {
          setDistrictId(String(match.id));
          setDistrictName(match.name);
        }
      }
    } catch (err) {
      const message = getApiErrorMessage(err, 'Failed to load farms.');
      Alert.alert('Error', /outside|assigned working area/i.test(message) ? OUTSIDE_ZONE_MESSAGE : message);
      setFarms([]);
    } finally {
      setLoadingFarms(false);
    }
  }, [assigned.locations.districts, districtId]);

  useEffect(() => {
    void loadFarmers();
  }, [loadFarmers]);

  useEffect(() => {
    if (farmerId) {
      void loadFarmsForFarmer(farmerId);
    }
  }, [farmerId, loadFarmsForFarmer]);

  const captureGps = async () => {
    setCapturingGps(true);
    try {
      const permission = await Location.requestForegroundPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('Permission required', 'Location access is needed to attach GPS.');
        return;
      }

      const position = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      setLatitude(position.coords.latitude);
      setLongitude(position.coords.longitude);
      setAccuracy(position.coords.accuracy ?? null);
      setIncludeGps(true);
    } catch (err) {
      Alert.alert('GPS failed', getApiErrorMessage(err, 'Unable to capture GPS.'));
    } finally {
      setCapturingGps(false);
    }
  };

  const handleCreate = async () => {
    if (!assigned.hasAssignment) {
      Alert.alert('No assignment', 'No working area has been assigned to your account. Please contact the Admin.');
      return;
    }

    if (!farmerId) {
      Alert.alert('Farmer required', 'Select a farmer for this visit.');
      return;
    }

    if (!visitDate || !visitTime) {
      Alert.alert('Schedule required', 'Enter visit date and time.');
      return;
    }

    if (!districtId || !talukaId || !villageId) {
      Alert.alert('Location required', 'Select district, taluka, and village from your assigned area.');
      return;
    }

    setSubmitting(true);

    try {
      const scheduledAt = buildScheduledAt(visitDate, visitTime);
      let reminderAt: string | undefined;
      if (reminderEnabled) {
        const reminderDate = new Date(scheduledAt);
        if (!Number.isNaN(reminderDate.getTime())) {
          reminderDate.setMinutes(reminderDate.getMinutes() - 30);
          reminderAt = reminderDate.toISOString();
        }
      }

      const payload: ApiRecord = {
        farmer_id: Number(farmerId),
        farm_id: farmId ? Number(farmId) : undefined,
        district_id: Number(districtId),
        taluka_id: Number(talukaId),
        village_id: Number(villageId),
        visit_date: visitDate,
        scheduled_at: scheduledAt,
        visit_purpose: purposeCode,
        schedule_notes: notes.trim() || undefined,
        notes: notes.trim() || undefined,
        reminder_at: reminderAt,
        latitude: includeGps ? latitude ?? undefined : undefined,
        longitude: includeGps ? longitude ?? undefined : undefined,
        accuracy: includeGps ? accuracy ?? undefined : undefined,
      };

      const result = await createFieldOfficerVisit(payload);
      const visit = (result.visit ?? result) as ApiRecord;
      const assignmentId = Number(visit.assignment_id ?? visit.id ?? result.assignment_id);

      Alert.alert('Visit scheduled', 'Your visit has been added to the calendar.', [
        {
          text: 'Open Visit',
          onPress: () => {
            if (assignmentId > 0) {
              navigation.replace('FieldOfficerAssignmentDetail', { assignmentId });
            } else {
              navigation.replace('FieldOfficerSchedule');
            }
          },
        },
        {
          text: 'Back to Schedule',
          onPress: () => navigation.navigate('FieldOfficerSchedule'),
        },
      ]);
    } catch (err) {
      const message = getApiErrorMessage(err, 'Failed to create visit.');
      Alert.alert('Error', /outside|assigned working area|not authorized/i.test(message) ? OUTSIDE_ZONE_MESSAGE : message);
    } finally {
      setSubmitting(false);
    }
  };

  if (!assigned.hasAssignment && !assigned.loading) {
    return (
      <OfficerScreenChrome edges={['top']}>
        <ScreenHeader title="Schedule Visit" showBrandLogo={false} />
        <NoAssignmentState
          message={assigned.error ?? 'No working area has been assigned to your account. Please contact the Admin.'}
          onRefresh={assigned.refresh}
          refreshing={assigned.loading}
        />
      </OfficerScreenChrome>
    );
  }

  return (
    <OfficerScreenChrome edges={['top']}>
      <ScreenHeader title="Schedule Visit" showBrandLogo={false} />
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={[styles.card, officerCardShadow]}>
          <Text style={styles.sectionTitle}>When</Text>
          <Text style={styles.label}>Date (YYYY-MM-DD)</Text>
          <TextInput
            style={styles.input}
            value={visitDate}
            onChangeText={setVisitDate}
            placeholder="2026-07-14"
            placeholderTextColor={officerTheme.outline}
            autoCapitalize="none"
          />
          <Text style={styles.label}>Time (HH:MM)</Text>
          <TextInput
            style={styles.input}
            value={visitTime}
            onChangeText={setVisitTime}
            placeholder="09:00"
            placeholderTextColor={officerTheme.outline}
            autoCapitalize="none"
          />
        </View>

        <View style={[styles.card, officerCardShadow]}>
          <Text style={styles.sectionTitle}>Assigned location</Text>
          <FormSelect
            label="District"
            placeholder="Select district"
            value={districtId}
            displayValue={districtName || undefined}
            options={districtOptions}
            loading={assigned.loading}
            onSelect={(option) => {
              setDistrictId(String(option.id));
              setDistrictName(option.name);
              setTalukaId('');
              setTalukaName('');
              setVillageId('');
              setVillageName('');
            }}
          />
          <FormSelect
            label="Taluka"
            placeholder="Select taluka"
            value={talukaId}
            displayValue={talukaName || undefined}
            options={talukaOptions}
            disabled={!districtId}
            onSelect={(option) => {
              setTalukaId(String(option.id));
              setTalukaName(option.name);
              setVillageId('');
              setVillageName('');
            }}
          />
          <FormSelect
            label="Village"
            placeholder="Select village"
            value={villageId}
            displayValue={villageName || undefined}
            options={villageOptions}
            disabled={!talukaId}
            onSelect={(option) => {
              setVillageId(String(option.id));
              setVillageName(option.name);
            }}
          />
        </View>

        <View style={[styles.card, officerCardShadow]}>
          <Text style={styles.sectionTitle}>Farmer & farm</Text>
          {loadingFarmers ? (
            <OfficerListState kind="loading" message="Loading farmers…" />
          ) : (
            <FormSelect
              label="Farmer"
              placeholder="Select farmer"
              value={farmerId}
              displayValue={
                farmerOptions.find((item) => String(item.id) === farmerId)?.name
              }
              options={farmerOptions}
              searchable
              onSelect={(option) => {
                setFarmerId(String(option.id));
                setFarmId('');
              }}
            />
          )}
          <FormSelect
            label="Farm (optional)"
            placeholder="Select farm"
            value={farmId}
            displayValue={farmOptions.find((item) => String(item.id) === farmId)?.name}
            options={farmOptions}
            loading={loadingFarms}
            disabled={!farmerId}
            onSelect={(option) => setFarmId(String(option.id))}
          />
          <FormSelect
            label="Purpose"
            placeholder="Select purpose"
            value={String(PURPOSE_OPTIONS.find((item) => item.code === purposeCode)?.id ?? '')}
            displayValue={purposeLabel}
            options={PURPOSE_OPTIONS.map((item) => ({ id: item.id, name: item.name }))}
            onSelect={(option) => {
              const match = PURPOSE_OPTIONS.find((item) => item.id === option.id);
              setPurposeCode(match?.code ?? 'field_visit');
              setPurposeLabel(option.name);
            }}
          />
          <Text style={styles.label}>Notes</Text>
          <TextInput
            style={[styles.input, styles.notes]}
            value={notes}
            onChangeText={setNotes}
            placeholder="Visit notes or instructions"
            placeholderTextColor={officerTheme.outline}
            multiline
          />
        </View>

        <View style={[styles.card, officerCardShadow]}>
          <View style={styles.switchRow}>
            <Text style={styles.switchLabel}>Reminder (30 min before)</Text>
            <Switch
              value={reminderEnabled}
              onValueChange={setReminderEnabled}
              trackColor={{ true: officerTheme.primary, false: officerTheme.outlineVariant }}
            />
          </View>
          <View style={styles.switchRow}>
            <Text style={styles.switchLabel}>Attach GPS (optional)</Text>
            <Switch
              value={includeGps}
              onValueChange={setIncludeGps}
              trackColor={{ true: officerTheme.primary, false: officerTheme.outlineVariant }}
            />
          </View>
          {includeGps ? (
            <View style={styles.gpsBlock}>
              <Text style={styles.meta}>
                {latitude != null && longitude != null
                  ? `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`
                  : 'No GPS captured yet'}
              </Text>
              <Pressable style={styles.gpsButton} onPress={() => void captureGps()} disabled={capturingGps}>
                <Text style={styles.gpsButtonText}>{capturingGps ? 'Capturing…' : 'Capture GPS'}</Text>
              </Pressable>
            </View>
          ) : null}
        </View>

        <AppButton label={submitting ? 'Scheduling…' : 'Schedule Visit'} onPress={() => void handleCreate()} loading={submitting} />
      </ScrollView>
    </OfficerScreenChrome>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: officerTheme.marginMobile,
    gap: 14,
    paddingBottom: 40,
  },
  card: {
    backgroundColor: officerTheme.surfaceLowest,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: officerTheme.outlineVariant,
    gap: 10,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: officerTheme.tertiary,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: officerTheme.onSurfaceVariant,
  },
  input: {
    borderWidth: 1,
    borderColor: officerTheme.outlineVariant,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 15,
    color: officerTheme.onSurface,
    backgroundColor: officerTheme.neutral,
  },
  notes: {
    minHeight: 88,
    textAlignVertical: 'top',
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  switchLabel: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: officerTheme.onSurface,
  },
  gpsBlock: { gap: 8 },
  meta: { fontSize: 13, color: officerTheme.onSurfaceVariant },
  gpsButton: {
    alignSelf: 'flex-start',
    backgroundColor: officerTheme.secondaryContainer,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  gpsButtonText: { fontWeight: '700', color: officerTheme.onSecondaryContainer },
});
