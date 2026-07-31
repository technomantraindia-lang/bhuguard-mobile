import { useEffect, useMemo, useState } from 'react';
import { Alert, Image, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { getApiErrorMessage } from '../../api/authApi';
import { createOfficerArtisan } from '../../api/fieldOfficerApi';
import { AppButton } from '../../components/AppButton';
import { FormMultiSelect } from '../../components/FormMultiSelect';
import { FormSelect } from '../../components/FormSelect';
import { OfficerScreenChrome } from '../../components/officer/OfficerScreenChrome';
import { ScreenHeader } from '../../components/ScreenHeader';
import { BhuguardMaterialIcon } from '../../components/shared/BhuguardMaterialIcon';
import { useAddressCascade } from '../../hooks/useAddressCascade';
import type { FieldOfficerStackParamList } from '../../navigation/types';
import { officerTheme } from '../../theme/officerDashboardTheme';

type Nav = NativeStackNavigationProp<FieldOfficerStackParamList, 'RegisterArtisan'>;

type UploadFile = {
  uri: string;
  name: string;
  mimeType: string;
};

type FormState = {
  name: string;
  mobile: string;
  address: string;
  village: string;
  taluka: string;
  district: string;
  state: string;
};

const initialForm: FormState = {
  name: '',
  mobile: '',
  address: '',
  village: '',
  taluka: '',
  district: '',
  state: 'Gujarat',
};

function appendFile(formData: FormData, key: string, file: UploadFile | null): void {
  if (!file) {
    return;
  }

  formData.append(key, { uri: file.uri, name: file.name, type: file.mimeType } as unknown as Blob);
}

export function RegisterArtisanScreen() {
  const navigation = useNavigation<Nav>();
  const [form, setForm] = useState<FormState>(initialForm);
  const [profilePhoto, setProfilePhoto] = useState<UploadFile | null>(null);
  const [identityDocument, setIdentityDocument] = useState<UploadFile | null>(null);
  const [trainingCertificate, setTrainingCertificate] = useState<UploadFile | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [workingDistrictId, setWorkingDistrictId] = useState('');
  const [workingDistrictName, setWorkingDistrictName] = useState('');
  const [workingTalukaId, setWorkingTalukaId] = useState('');
  const [workingTalukaName, setWorkingTalukaName] = useState('');
  const [workingVillageIds, setWorkingVillageIds] = useState<number[]>([]);

  const address = useAddressCascade(form.state || 'Gujarat');

  useEffect(() => {
    if (workingDistrictId) {
      void address.loadTalukas(Number(workingDistrictId));
    }
  }, [workingDistrictId]);

  useEffect(() => {
    if (workingTalukaId) {
      void address.loadVillages(Number(workingTalukaId));
    }
  }, [workingTalukaId]);

  const villageOptions = useMemo(
    () => address.villages.map((item) => ({ id: item.id, name: item.name })),
    [address.villages],
  );

  const update = (key: keyof FormState, value: string) => setForm((current) => ({ ...current, [key]: value }));

  const chooseProfilePhoto = async (source: 'camera' | 'gallery') => {
    const permission = source === 'camera'
      ? await ImagePicker.requestCameraPermissionsAsync()
      : await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permission.granted) {
      Alert.alert('Permission required', `Please allow ${source} access to add a profile photo.`);
      return;
    }

    const result = source === 'camera'
      ? await ImagePicker.launchCameraAsync({ allowsEditing: true, aspect: [1, 1], mediaTypes: ['images'], quality: 0.85 })
      : await ImagePicker.launchImageLibraryAsync({ allowsEditing: true, aspect: [1, 1], mediaTypes: ['images'], quality: 0.85 });

    if (result.canceled || !result.assets[0]?.uri) {
      return;
    }

    const asset = result.assets[0];
    setProfilePhoto({
      uri: asset.uri,
      name: asset.fileName ?? 'artisan-profile.jpg',
      mimeType: asset.mimeType ?? 'image/jpeg',
    });
  };

  const selectProfilePhoto = () => {
    Alert.alert('Profile photo', 'Choose a source for the Artisan Pro profile photo.', [
      { text: 'Take photo', onPress: () => void chooseProfilePhoto('camera') },
      { text: 'Choose from gallery', onPress: () => void chooseProfilePhoto('gallery') },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const chooseDocument = async (kind: 'identity' | 'training') => {
    const result = await DocumentPicker.getDocumentAsync({ copyToCacheDirectory: true });
    const asset = result.assets?.[0];

    if (result.canceled || !asset?.uri) {
      return;
    }

    const file = {
      uri: asset.uri,
      name: asset.name ?? `${kind}-document`,
      mimeType: asset.mimeType ?? 'application/octet-stream',
    };

    if (kind === 'identity') {
      setIdentityDocument(file);
    } else {
      setTrainingCertificate(file);
    }
  };

  const submit = async () => {
    const required = [
      ['Name', form.name],
      ['Mobile number', form.mobile],
      ['Address', form.address],
      ['Village', form.village],
      ['Taluka', form.taluka],
      ['District', form.district],
      ['State', form.state],
    ];
    const missing = required.find(([, value]) => !value.trim());

    if (missing) {
      Alert.alert('Missing information', `${missing[0]} is required.`);
      return;
    }

    if (!workingTalukaId) {
      Alert.alert('Working area required', 'Select a taluka for the artisan working area.');
      return;
    }

    if (workingVillageIds.length === 0) {
      Alert.alert('Working villages required', 'Select one or more villages for the working area.');
      return;
    }

    if (!profilePhoto || !identityDocument) {
      Alert.alert('Documents required', 'Add both a profile photo and identity document before submitting.');
      return;
    }

    const payload = new FormData();
    payload.append('name', form.name.trim());
    payload.append('mobile', form.mobile.trim());
    payload.append('address', form.address.trim());
    payload.append('village', form.village.trim());
    payload.append('taluka', form.taluka.trim());
    payload.append('district', form.district.trim());
    payload.append('state', form.state.trim());
    payload.append('working_taluka_id', workingTalukaId);
    workingVillageIds.forEach((id) => payload.append('working_village_ids[]', String(id)));
    appendFile(payload, 'profile_photo', profilePhoto);
    appendFile(payload, 'identity_document', identityDocument);
    appendFile(payload, 'training_certificate', trainingCertificate);

    setSubmitting(true);
    try {
      const response = await createOfficerArtisan(payload);
      const artisanId = Number(response.artisan?.id ?? response.artisan?.artisan_id);
      Alert.alert('Artisan Pro registered', 'The Artisan Pro has been submitted for approval.', [
        {
          text: 'View artisan',
          onPress: () => {
            if (Number.isFinite(artisanId) && artisanId > 0) {
              navigation.replace('ArtisanDetail', { artisanId });
              return;
            }

            navigation.replace('MyArtisans');
          },
        },
      ]);
    } catch (err) {
      Alert.alert('Unable to register artisan', getApiErrorMessage(err, 'Please try again.'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <OfficerScreenChrome edges={['top']}>
      <ScreenHeader title="Register Artisan Pro" />
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={styles.intro}>Register an Artisan Pro from your assigned working area. Submissions are sent for approval.</Text>

        <Text style={styles.sectionTitle}>Profile photo</Text>
        <Pressable style={styles.photoUpload} onPress={selectProfilePhoto}>
          {profilePhoto ? (
            <Image source={{ uri: profilePhoto.uri }} style={styles.photo} />
          ) : (
            <BhuguardMaterialIcon name="photo_camera" size={28} color={officerTheme.primary} />
          )}
          <Text style={styles.uploadText}>{profilePhoto ? 'Change profile photo' : 'Capture or upload profile photo'}</Text>
        </Pressable>

        <Text style={styles.sectionTitle}>Artisan Pro details</Text>
        <Field label="Full name" value={form.name} onChangeText={(value) => update('name', value)} />
        <Field label="Mobile number" value={form.mobile} onChangeText={(value) => update('mobile', value)} keyboardType="phone-pad" />
        <Field label="Address" value={form.address} onChangeText={(value) => update('address', value)} multiline />
        <Field label="Village" value={form.village} onChangeText={(value) => update('village', value)} />
        <Field label="Taluka" value={form.taluka} onChangeText={(value) => update('taluka', value)} />
        <Field label="District" value={form.district} onChangeText={(value) => update('district', value)} />
        <Field label="State" value={form.state} onChangeText={(value) => update('state', value)} />

        <Text style={styles.sectionTitle}>Working area</Text>
        <Text style={styles.sectionHint}>Select a taluka, then choose one or more villages where this artisan will work.</Text>
        <FormSelect
          label="Working district"
          placeholder="Select district"
          value={workingDistrictId}
          displayValue={workingDistrictName || undefined}
          options={address.districts}
          loading={address.loadingDistricts}
          error={address.error}
          onSelect={(option) => {
            setWorkingDistrictId(String(option.id));
            setWorkingDistrictName(option.name);
            setWorkingTalukaId('');
            setWorkingTalukaName('');
            setWorkingVillageIds([]);
          }}
        />
        <FormSelect
          label="Working taluka"
          placeholder="Select taluka"
          value={workingTalukaId}
          displayValue={workingTalukaName || undefined}
          options={address.talukas}
          loading={address.loadingTalukas}
          disabled={!workingDistrictId}
          onSelect={(option) => {
            setWorkingTalukaId(String(option.id));
            setWorkingTalukaName(option.name);
            setWorkingVillageIds([]);
          }}
        />
        <FormMultiSelect
          label="Working villages"
          placeholder={workingTalukaId ? 'Select one or more villages' : 'Select a taluka first'}
          values={workingVillageIds}
          options={villageOptions}
          loading={address.loadingVillages}
          disabled={!workingTalukaId}
          onChange={setWorkingVillageIds}
        />

        <Text style={styles.sectionTitle}>Documents</Text>
        <DocumentUpload label="Identity document" file={identityDocument} required onPress={() => void chooseDocument('identity')} />
        <DocumentUpload label="Training certificate" file={trainingCertificate} onPress={() => void chooseDocument('training')} />

        <AppButton label="Submit Artisan Pro Registration" onPress={() => void submit()} loading={submitting} style={styles.submitButton} />
      </ScrollView>
    </OfficerScreenChrome>
  );
}

function Field({
  label,
  value,
  onChangeText,
  keyboardType,
  multiline = false,
}: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  keyboardType?: 'default' | 'phone-pad';
  multiline?: boolean;
}) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        keyboardType={keyboardType}
        multiline={multiline}
        style={[styles.input, multiline && styles.textarea]}
        placeholder={label}
        placeholderTextColor={officerTheme.onSurfaceVariant}
      />
    </View>
  );
}

function DocumentUpload({ label, file, required = false, onPress }: { label: string; file: UploadFile | null; required?: boolean; onPress: () => void }) {
  return (
    <Pressable style={styles.documentUpload} onPress={onPress}>
      <BhuguardMaterialIcon name="upload" size={22} color={officerTheme.primary} />
      <View style={styles.documentCopy}>
        <Text style={styles.documentLabel}>{label}{required ? ' *' : ''}</Text>
        <Text style={styles.documentName} numberOfLines={1}>{file?.name ?? 'Tap to upload'}</Text>
      </View>
      <BhuguardMaterialIcon name="chevron_right" size={20} color={officerTheme.primary} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  content: { gap: 12, padding: officerTheme.marginMobile, paddingBottom: 48 },
  intro: { color: officerTheme.onSurfaceVariant, fontSize: 14, lineHeight: 20 },
  sectionTitle: { color: officerTheme.onSurface, fontSize: 16, fontWeight: '800', marginTop: 8 },
  sectionHint: { color: officerTheme.onSurfaceVariant, fontSize: 13, lineHeight: 18, marginTop: -4 },
  photoUpload: { alignItems: 'center', backgroundColor: officerTheme.surfaceLowest, borderColor: officerTheme.outlineVariant, borderRadius: 16, borderStyle: 'dashed', borderWidth: 1, gap: 8, justifyContent: 'center', minHeight: 132, padding: 12 },
  photo: { borderRadius: 44, height: 88, width: 88 },
  uploadText: { color: officerTheme.primary, fontSize: 13, fontWeight: '700' },
  field: { gap: 6 },
  label: { color: officerTheme.onSurface, fontSize: 13, fontWeight: '700' },
  input: { backgroundColor: officerTheme.surfaceLowest, borderColor: officerTheme.outlineVariant, borderRadius: 10, borderWidth: 1, color: officerTheme.onSurface, fontSize: 15, minHeight: 48, paddingHorizontal: 12 },
  textarea: { minHeight: 84, paddingTop: 12, textAlignVertical: 'top' },
  documentUpload: { alignItems: 'center', backgroundColor: officerTheme.surfaceLowest, borderColor: officerTheme.outlineVariant, borderRadius: 12, borderWidth: 1, flexDirection: 'row', gap: 10, padding: 12 },
  documentCopy: { flex: 1, gap: 2 },
  documentLabel: { color: officerTheme.onSurface, fontSize: 14, fontWeight: '700' },
  documentName: { color: officerTheme.onSurfaceVariant, fontSize: 12 },
  submitButton: { marginTop: 12 },
});
