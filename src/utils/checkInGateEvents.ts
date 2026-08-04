type CheckInGateListener = () => void;

const listeners = new Set<CheckInGateListener>();

/**
 * Notify mandatory check-in gates that the active session may have ended
 * (e.g. dashboard checkout). Gates re-verify with the server and re-block if needed.
 */
export function invalidateCheckInGate(): void {
  listeners.forEach((listener) => {
    try {
      listener();
    } catch {
      // Ignore listener failures so one bad subscriber cannot block others.
    }
  });
}

export function subscribeCheckInGateInvalidation(listener: CheckInGateListener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
