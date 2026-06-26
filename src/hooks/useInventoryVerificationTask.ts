import { useCallback, useEffect, useState } from 'react';

import { getApiErrorMessage } from '../api/authApi';
import { getInventoryVerificationTaskDetail } from '../api/fieldOfficerApi';
import {
  mapInventoryVerificationTask,
  type InventoryVerificationViewModel,
} from '../utils/inventoryVerificationHelpers';
import type { ApiRecord } from '../utils/apiHelpers';

export function useInventoryVerificationTask(taskId: number) {
  const [task, setTask] = useState<InventoryVerificationViewModel | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const applyTaskRecord = useCallback((record: ApiRecord) => {
    setTask(mapInventoryVerificationTask(record));
  }, []);

  const reload = useCallback(async () => {
    setLoading(true);

    try {
      const data = await getInventoryVerificationTaskDetail(taskId);
      applyTaskRecord((data.inventory_task ?? data) as ApiRecord);
      setError(null);
    } catch (caught) {
      setError(getApiErrorMessage(caught));
    } finally {
      setLoading(false);
    }
  }, [applyTaskRecord, taskId]);

  useEffect(() => {
    void reload();
  }, [reload]);

  return {
    task,
    loading,
    error,
    submitting,
    setSubmitting,
    reload,
    applyTaskRecord,
  };
}
