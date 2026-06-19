import type { ImagePickerAsset } from 'expo-image-picker';

import type { FileAsset } from '../context/OnboardingContext';

export const ONBOARDING_PHOTO_MAX_BYTES = 5 * 1024 * 1024;

const ALLOWED_MIME_TYPES = new Set(['image/jpeg', 'image/jpg', 'image/png', 'image/webp']);

export function isAllowedOnboardingPhotoMime(mimeType: string | null | undefined): boolean {
  if (!mimeType) {
    return true;
  }

  return ALLOWED_MIME_TYPES.has(mimeType.toLowerCase());
}

export function validateOnboardingPhotoAsset(asset: ImagePickerAsset): string | null {
  const mimeType = asset.mimeType ?? 'image/jpeg';

  if (!isAllowedOnboardingPhotoMime(mimeType)) {
    return 'Profile photo must be JPG, JPEG, PNG, or WEBP.';
  }

  if (asset.fileSize != null && asset.fileSize > ONBOARDING_PHOTO_MAX_BYTES) {
    return 'Profile photo must be 5 MB or smaller.';
  }

  return null;
}

export function fileAssetFromImagePickerAsset(asset: ImagePickerAsset): FileAsset {
  const extension = (asset.mimeType ?? 'image/jpeg').includes('png')
    ? 'png'
    : (asset.mimeType ?? '').includes('webp')
      ? 'webp'
      : 'jpg';

  return {
    uri: asset.uri,
    name: asset.fileName ?? `farmer-photo.${extension}`,
    mimeType: asset.mimeType ?? 'image/jpeg',
    size: asset.fileSize,
  };
}
