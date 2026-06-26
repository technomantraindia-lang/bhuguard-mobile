import { useCallback, useEffect, useState } from 'react';

import { getApiErrorMessage } from '../api/authApi';
import { getFarmerProfileDocuments } from '../api/farmerApi';
import { FARMER_PROFILE_DOCUMENTS, type ProfileDocumentItem } from '../constants/farmerProfileDocuments';
import { extractList, pickString, type ApiRecord } from '../utils/apiHelpers';

function mapDocument(record: ApiRecord): ProfileDocumentItem | null {
  const id = pickString(record, 'id');

  if (id === '-') {
    return null;
  }

  const status = pickString(record, 'status');
  const normalizedStatus =
    status === 'verified' || status === 'uploaded' || status === 'pending' ? status : 'pending';

  return {
    id,
    title: pickString(record, 'title') !== '-' ? pickString(record, 'title') : id,
    status: normalizedStatus,
  };
}

export function useFarmerProfileDocuments() {
  const [documents, setDocuments] = useState<ProfileDocumentItem[]>(FARMER_PROFILE_DOCUMENTS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const data = await getFarmerProfileDocuments();
      const items = extractList(data as ApiRecord, ['documents'])
        .map((record) => mapDocument(record))
        .filter((item): item is ProfileDocumentItem => item !== null);

      if (items.length > 0) {
        setDocuments(items);
      }
    } catch (err) {
      setError(getApiErrorMessage(err, 'Failed to load profile documents.'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return { documents, loading, error, reload: load };
}
