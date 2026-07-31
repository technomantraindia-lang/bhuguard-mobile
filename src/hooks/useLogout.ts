import { useCallback, useRef } from 'react';
import { InteractionManager } from 'react-native';

import { logout } from '../api/authApi';
import { navigateToLogin } from '../navigation/navigationRef';
import { beginLogout, endLogout } from '../utils/logoutGuard';

export function useLogout() {
  const loggingOutRef = useRef(false);

  const logoutUser = useCallback(async () => {
    if (loggingOutRef.current) {
      return;
    }

    loggingOutRef.current = true;
    beginLogout();

    try {
      await logout();
    } catch (error) {
      if (__DEV__) {
        console.warn('[Bhuguard] Logout failed while clearing session:', error);
      }
    } finally {
      // One deferred reset only — stacked CommonActions.reset calls race Fabric
      // PreAllocateMountItem and crash with IllegalViewOperationException.
      InteractionManager.runAfterInteractions(() => {
        requestAnimationFrame(() => {
          try {
            navigateToLogin();
          } catch (error) {
            if (__DEV__) {
              console.warn('[Bhuguard] Logout navigation failed:', error);
            }
          } finally {
            endLogout();
            loggingOutRef.current = false;
          }
        });
      });
    }
  }, []);

  return logoutUser;
}
