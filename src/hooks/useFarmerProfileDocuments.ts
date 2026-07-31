import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import { useCallback, useEffect, useState } from 'react';
import { Alert, ActionSheetIOS, Platform } from 'react-native';

import { getApiErrorMessage } from '../api/authApi';
import {
  deleteFarmerDocument,
  getFarmerDocuments,
  replaceFarmerDocument,
  uploadFarmerDocument,
} from '../api/farmerApi';
import type { ProfileDocumentStatus } from '../constants/farmerProfileDocuments';
import { extractList, pickString, type ApiRecord } from '../utils/apiHelpers';
import { resolveMediaUrl } from '../utils/mediaUrl';

export interface FarmerManagedDocument {
  id: string;
  title: string;
  documentType: string;
  status: ProfileDocumentStatus | 'rejected';
  rejectionReason: string | null;
  previewUrl: string | null;
  canReplace: boolean;
  canDelete: boolean;
}

function mapStatus(status: string): FarmerManagedDocument['status'] {
  if (status === 'verified') {
    return 'verified';
  }

  if (status === 'rejected') {
    return 'rejected';
  }

  if (status === 'uploaded') {
    return 'uploaded';
  }

  return 'pending';
}

function titleFromType(documentType: string, originalName: string): string {
  if (originalName && originalName !== '-') {
    return originalName;
  }

  return documentType
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function mapDocument(record: ApiRecord): FarmerManagedDocument | null {
  const id = pickString(record, 'id');

  if (id === '-') {
    return null;
  }

  const status = mapStatus(pickString(record, 'status'));
  const preview = pickString(record, 'preview_url', 'previewUrl');

  return {
    id,
    documentType: pickString(record, 'document_type', 'documentType'),
    title: titleFromType(
      pickString(record, 'document_type', 'documentType'),
      pickString(record, 'original_file_name', 'originalFileName', 'title'),
    ),
    status,
    rejectionReason:
      pickString(record, 'rejection_reason', 'rejectionReason') !== '-'
        ? pickString(record, 'rejection_reason', 'rejectionReason')
        : null,
    previewUrl: preview !== '-' ? resolveMediaUrl(preview) : null,
    canReplace: status === 'pending',
    canDelete: status === 'pending',
  };
}

async function pickDocumentFile(): Promise<{ uri: string; name: string; type: string } | null> {
  if (Platform.OS === 'ios') {
    return new Promise((resolve) => {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: ['Cancel', 'Take Photo', 'Choose Photo', 'Choose File'],
          cancelButtonIndex: 0,
        },
        async (index) => {
          if (index === 1) {
            resolve(await pickCameraFile());
            return;
          }

          if (index === 2) {
            resolve(await pickGalleryFile());
            return;
          }

          if (index === 3) {
            resolve(await pickAnyFile());
            return;
          }

          resolve(null);
        },
      );
    });
  }

  return new Promise((resolve) => {
    Alert.alert('Upload document', 'Choose a source', [
      { text: 'Cancel', style: 'cancel', onPress: () => resolve(null) },
      { text: 'Camera', onPress: () => void pickCameraFile().then(resolve) },
      { text: 'Gallery', onPress: () => void pickGalleryFile().then(resolve) },
      { text: 'File', onPress: () => void pickAnyFile().then(resolve) },
    ]);
  });
}

async function pickCameraFile() {
  const permission = await ImagePicker.requestCameraPermissionsAsync();

  if (!permission.granted) {
    Alert.alert('Permission required', 'Camera access is needed to capture documents.');
    return null;
  }

  const result = await ImagePicker.launchCameraAsync({
    quality: 0.8,
    allowsEditing: false,
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
  });

  if (result.canceled || !result.assets[0]) {
    return null;
  }

  const asset = result.assets[0];

  return {
    uri: asset.uri,
    name: asset.fileName || `document-${Date.now()}.jpg`,
    type: asset.mimeType || 'image/jpeg',
  };
}

async function pickGalleryFile() {
  const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();

  if (!permission.granted) {
    Alert.alert('Permission required', 'Photo library access is needed to upload documents.');
    return null;
  }

  const result = await ImagePicker.launchImageLibraryAsync({
    quality: 0.8,
    allowsEditing: false,
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
  });

  if (result.canceled || !result.assets[0]) {
    return null;
  }

  const asset = result.assets[0];

  return {
    uri: asset.uri,
    name: asset.fileName || `document-${Date.now()}.jpg`,
    type: asset.mimeType || 'image/jpeg',
  };
}

async function pickAnyFile() {
  const result = await DocumentPicker.getDocumentAsync({
    type: ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'],
    copyToCacheDirectory: true,
    multiple: false,
  });

  if (result.canceled || !result.assets?.[0]) {
    return null;
  }

  const asset = result.assets[0];

  return {
    uri: asset.uri,
    name: asset.name || `document-${Date.now()}.pdf`,
    type: asset.mimeType || 'application/pdf',
  };
}

export function useFarmerProfileDocuments() {
  const [documents, setDocuments] = useState<FarmerManagedDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const data = await getFarmerDocuments();
      const items = extractList(data as ApiRecord, ['documents'])
        .map((record) => mapDocument(record))
        .filter((item): item is FarmerManagedDocument => item !== null);

      setDocuments(items);
    } catch (err) {
      setError(getApiErrorMessage(err, 'Failed to load profile documents.'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const upload = useCallback(
    async (documentType = 'identity') => {
      const file = await pickDocumentFile();

      if (!file) {
        return false;
      }

      setUploading(true);
      setError(null);

      try {
        const formData = new FormData();
        formData.append('document_type', documentType);
        formData.append(
          'file',
          {
            uri: file.uri,
            name: file.name,
            type: file.type,
          } as unknown as Blob,
        );
        await uploadFarmerDocument(formData);
        await load();
        return true;
      } catch (err) {
        setError(getApiErrorMessage(err, 'Unable to upload document.'));
        Alert.alert('Upload failed', getApiErrorMessage(err, 'Unable to upload document.'));
        return false;
      } finally {
        setUploading(false);
      }
    },
    [load],
  );

  const replace = useCallback(
    async (documentId: string) => {
      const file = await pickDocumentFile();

      if (!file) {
        return false;
      }

      setUploading(true);
      setError(null);

      try {
        const formData = new FormData();
        formData.append(
          'file',
          {
            uri: file.uri,
            name: file.name,
            type: file.type,
          } as unknown as Blob,
        );
        await replaceFarmerDocument(documentId, formData);
        await load();
        return true;
      } catch (err) {
        setError(getApiErrorMessage(err, 'Unable to replace document.'));
        Alert.alert('Replace failed', getApiErrorMessage(err, 'Unable to replace document.'));
        return false;
      } finally {
        setUploading(false);
      }
    },
    [load],
  );

  const remove = useCallback(
    async (documentId: string) => {
      setUploading(true);
      setError(null);

      try {
        await deleteFarmerDocument(documentId);
        await load();
        return true;
      } catch (err) {
        setError(getApiErrorMessage(err, 'Unable to delete document.'));
        Alert.alert('Delete failed', getApiErrorMessage(err, 'Unable to delete document.'));
        return false;
      } finally {
        setUploading(false);
      }
    },
    [load],
  );

  return { documents, loading, uploading, error, reload: load, upload, replace, remove };
}
