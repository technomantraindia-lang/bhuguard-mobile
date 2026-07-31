import { registerRootComponent } from 'expo';
import * as SplashScreen from 'expo-splash-screen';
import { enableScreens, enableFreeze } from 'react-native-screens';

// RN 0.82+ forces Fabric. Native screen pre-allocation can crash Android with
// IllegalViewOperationException / PreAllocateMountItem during auth stack resets.
enableScreens(false);
enableFreeze(false);

void SplashScreen.preventAutoHideAsync().catch(() => undefined);

// Do NOT import react-native-reanimated / worklets here.
// The installed development APK may not include matching native Worklets;
// splash uses React Native Animated instead.

// Load App only after the Expo runtime has initialized. Static imports can pull
// in expo-camera / expo-location before globalThis.expo is ready and crash with:
// "Cannot read property 'EventEmitter' of undefined".
registerRootComponent(require('./App').default);
