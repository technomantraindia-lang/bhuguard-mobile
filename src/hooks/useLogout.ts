import { useCallback } from 'react';

import { apiClient } from '../api/client';
import { navigationRef } from '../navigation/navigationRef';
import { clearAuthSession } from '../storage/authStorage';

export function useLogout() {
  const logout = useCallback(async () => {
    try {
      await apiClient.post('/auth/logout');
    } catch {
      // Local session is always cleared even if server logout fails.
    }

    await clearAuthSession();

    if (navigationRef.isReady()) {
      navigationRef.reset({
        index: 0,
        routes: [{ name: 'RoleSelection' }],
      });
    }
  }, []);

  return logout;
}