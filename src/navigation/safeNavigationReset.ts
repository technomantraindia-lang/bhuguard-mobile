import { InteractionManager } from 'react-native';

type ResetRoute = {
  name: string;
  params?: object;
};

/**
 * Defer stack reset until mount/unmount work finishes. Immediate reset during
 * Fabric layout (e.g. MPIN keypad unmount + dashboard mount) can crash Android
 * with IllegalViewOperationException / PreAllocateMountItem.
 */
export function safeNavigationReset(
  // Accept stack props without fighting RN's contravariant `reset` state typing.
  navigation: { reset: (state: any) => void },
  state: { index: number; routes: ResetRoute[] },
): void {
  InteractionManager.runAfterInteractions(() => {
    requestAnimationFrame(() => {
      try {
        navigation.reset(state);
      } catch (error) {
        if (__DEV__) {
          console.warn('[Bhuguard] safeNavigationReset failed:', error);
        }
      }
    });
  });
}
