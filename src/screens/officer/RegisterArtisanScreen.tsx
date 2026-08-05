import { useState } from 'react';
import { Alert, Image, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { getApiErrorMessage } from '../../api/authApi';
import { createOfficerArtisan } from '../../api/fieldOfficerApi';
import { AppButton } from '../../components/AppButton';
import { AddressSelector, type AddressValue } from '../../components/AddressSelector';
import { OfficerScreenChrome } from '../../components/officer/OfficerScreenChrome';
import { WorkingAreaSelector, type WorkingAreaEntry } from '../../components/officer/WorkingAreaSelector';
import { ScreenHeader } from '../../components/ScreenHeader';
import { BhuguardMaterialIcon } from '../../components/shared/BhuguardMaterialIcon';
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
};

const initialForm: FormState = {
  name: '',
  mobile: '',
  address: '',
};

const initialHomeAddress: AddressValue = {
  state: 'Gujarat',
  district_id: '',
  district_name: '',
  taluka_id: '',
  taluka_name: '',
  village_id: '',
  village_name: '',
  pincode: '',
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
  const [homeAddress, setHomeAddress] = useState<AddressValue>(initialHomeAddress);
  const [workingAreaEntries, setWorkingAreaEntries] = useState<WorkingAreaEntry[]>([]);

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
      ['Village', homeAddress.village_name],
      ['Taluka', homeAddress.taluka_name],
      ['District', homeAddress.district_name],
      ['State', homeAddress.state],
    ];
    const missing = required.find(([, value]) => !value.trim());

    if (missing) {
      Alert.alert('Missing information', `${missing[0]} is required.`);
      return;
    }

    if (workingAreaEntries.length === 0) {
      Alert.alert('Working area required', 'Add at least one District, Taluka, and Village to the artisan working area.');
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
    payload.append('village', homeAddress.village_name.trim());
    payload.append('taluka', homeAddress.taluka_name.trim());
    payload.append('district', homeAddress.district_name.trim());
    payload.append('state', (homeAddress.state || 'Gujarat').trim());
    // Merged across every taluka the officer added — never a silent single-taluka replace.
    // working_taluka_id is a single-taluka filter on the backend, so it is only sent when
    // the working area is confined to one taluka; otherwise villages are authorized individually.
    const uniqueDistrictIds = Array.from(new Set(workingAreaEntries.map((entry) => entry.districtId).filter((id) => id > 0)));
    const uniqueTalukaIds = Array.from(new Set(workingAreaEntries.map((entry) => entry.talukaId).filter((id) => id > 0)));
    if (uniqueTalukaIds.length === 1) {
      payload.append('working_taluka_id', String(uniqueTalukaIds[0]));
    }
    uniqueDistrictIds.forEach((id) => payload.append('working_district_ids[]', String(id)));
    uniqueTalukaIds.forEach((id) => payload.append('working_taluka_ids[]', String(id)));
    workingAreaEntries.forEach((entry) => {
      entry.villageIds.forEach((id) => payload.append('working_village_ids[]', String(id)));
    });
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

        <Text style={styles.sectionTitle}>Home address</Text>
        <Text style={styles.sectionHint}>State defaults to Gujarat. District, Taluka, and Village are dependent dropdowns.</Text>
        <AddressSelector value={homeAddress} onChange={(patch) => setHomeAddress((current) => ({ ...current, ...patch }))} />

        <Text style={styles.sectionTitle}>Working area</Text>
        <Text style={styles.sectionHint}>
          Select a district and taluka, choose one or more villages, then tap Add. Adding another taluka merges it
          into the working area — it never replaces villages you already added.
        </Text>
        <WorkingAreaSelector
          state={homeAddress.state || 'Gujarat'}
          entries={workingAreaEntries}
          onChange={setWorkingAreaEntries}
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
