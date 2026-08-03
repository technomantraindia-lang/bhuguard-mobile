import * as SplashScreen from 'expo-splash-screen';

let hideRequested = false;
let hidePromise: Promise<void> | null = null;

/**
 * Hide the native Expo splash at most once per JS runtime.
 * Safe to call from Preloader and any failure/fallback path.
 */
export function hideNativeSplashOnce(): Promise<void> {
  if (hidePromise) {
    return hidePromise;
  }

  if (hideRequested) {
    return Promise.resolve();
  }

  hideRequested = true;
  hidePromise = SplashScreen.hideAsync()
    .catch(() => undefined)
    .then(() => undefined);

  return hidePromise;
}
