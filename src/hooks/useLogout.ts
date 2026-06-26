import { useCallback } from 'react';

import { logout } from '../api/authApi';
import { navigationRef } from '../navigation/navigationRef';

export function useLogout() {
  const logoutUser = useCallback(async () => {
    await logout();

    if (navigationRef.isReady()) {
      navigationRef.reset({
        index: 0,
        routes: [{ name: 'RoleSelection' }],
      });
    }
  }, []);

  return logoutUser;
}
