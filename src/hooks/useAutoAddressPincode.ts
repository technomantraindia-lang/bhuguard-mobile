import { useEffect } from 'react';

import type { AddressOption } from '../api/addressApi';
import { getTalukaPincode } from '../api/addressApi';
import { pickAutoPincode } from '../utils/addressPincodeHelpers';

interface UseAutoAddressPincodeOptions {
  talukaId: string;
  villageId: string;
  pincode: string;
  talukas: AddressOption[];
  villages: AddressOption[];
  onPincodeChange: (pincode: string) => void;
}

export function useAutoAddressPincode({
  talukaId,
  villageId,
  pincode,
  talukas,
  villages,
  onPincodeChange,
}: UseAutoAddressPincodeOptions): void {
  useEffect(() => {
    if (!talukaId) {
      return;
    }

    const taluka = talukas.find((item) => String(item.id) === talukaId);
    const village = villageId ? villages.find((item) => String(item.id) === villageId) : undefined;
    const resolved = pickAutoPincode(village?.pincode, taluka?.pincode);

    if (resolved && resolved !== pincode) {
      onPincodeChange(resolved);
      return;
    }

    if (pincode || resolved) {
      return;
    }

    let cancelled = false;

    void getTalukaPincode(Number(talukaId))
      .then((fetched) => {
        if (cancelled) {
          return;
        }

        const next = pickAutoPincode(fetched);

        if (next) {
          onPincodeChange(next);
        }
      })
      .catch(() => undefined);

    return () => {
      cancelled = true;
    };
  }, [talukaId, villageId, pincode, talukas, villages, onPincodeChange]);
}
