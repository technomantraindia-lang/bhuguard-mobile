import { useEffect, useMemo, useState } from 'react';

import { cacheAuthenticatedImage, isLocalImageUri } from '../utils/profilePhotoCache';

function normalizePhotoUrl(photoUrl: string | null | undefined): string | null {
  if (!photoUrl) {
    return null;
  }

  return isLocalImageUri(photoUrl) ? photoUrl : photoUrl.split('?')[0] ?? photoUrl;
}

export function useProfilePhotoDisplay(
  photoUrl: string | null | undefined,
  cacheFileName = 'farmer-profile-current.jpg',
): string | null {
  const stablePhotoUrl = useMemo(() => normalizePhotoUrl(photoUrl), [photoUrl]);
  const [displayUri, setDisplayUri] = useState<string | null>(() => {
    if (stablePhotoUrl && isLocalImageUri(stablePhotoUrl)) {
      return stablePhotoUrl;
    }

    return null;
  });

  useEffect(() => {
    let cancelled = false;

    async function resolvePhoto() {
      if (!stablePhotoUrl) {
        setDisplayUri(null);
        return;
      }

      if (isLocalImageUri(stablePhotoUrl)) {
        setDisplayUri(stablePhotoUrl);
        return;
      }

      setDisplayUri(null);
      const cachedUri = await cacheAuthenticatedImage(stablePhotoUrl, cacheFileName);

      if (!cancelled) {
        setDisplayUri(cachedUri);
      }
    }

    void resolvePhoto();

    return () => {
      cancelled = true;
    };
  }, [cacheFileName, stablePhotoUrl]);

  return displayUri;
}
