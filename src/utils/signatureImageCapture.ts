import * as ImagePicker from 'expo-image-picker';

import {
  exportSignatureStrokesToPngFile,
  type SignaturePoint,
} from './signatureStrokeExport';

export async function captureDrawnSignatureImage(
  strokes: SignaturePoint[][],
  width: number,
  height: number,
): Promise<string> {
  if (width <= 0 || height <= 0) {
    throw new Error('Signature pad is not ready.');
  }

  return exportSignatureStrokesToPngFile(strokes, width, height);
}

export async function pickSignatureImageFromLibrary(): Promise<string | null> {
  const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();

  if (!permission.granted) {
    throw new Error('Gallery permission is required to upload a signature image.');
  }

  const result = await ImagePicker.launchImageLibraryAsync({
    quality: 1,
    allowsEditing: true,
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
  });

  if (result.canceled || !result.assets[0]?.uri) {
    return null;
  }

  return result.assets[0].uri;
}

export async function captureSignatureImageFromCamera(): Promise<string | null> {
  const permission = await ImagePicker.requestCameraPermissionsAsync();

  if (!permission.granted) {
    throw new Error('Camera permission is required to photograph a signature.');
  }

  const result = await ImagePicker.launchCameraAsync({
    quality: 0.9,
    allowsEditing: true,
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
  });

  if (result.canceled || !result.assets[0]?.uri) {
    return null;
  }

  return result.assets[0].uri;
}

export function inferSignatureMimeType(uri: string): string {
  const normalized = uri.toLowerCase();

  if (normalized.endsWith('.png')) {
    return 'image/png';
  }

  if (normalized.endsWith('.webp')) {
    return 'image/webp';
  }

  return 'image/jpeg';
}

export function signatureFileName(role: 'farmer' | 'officer', uri: string): string {
  const extension = inferSignatureMimeType(uri).includes('png')
    ? 'png'
    : inferSignatureMimeType(uri).includes('webp')
      ? 'webp'
      : 'jpg';

  return `${role}-signature.${extension}`;
}
