import { registerRootComponent } from 'expo';

// Load App only after the Expo runtime has initialized. Static imports can pull
// in expo-camera / expo-location before globalThis.expo is ready and crash with:
// "Cannot read property 'EventEmitter' of undefined".
registerRootComponent(require('./App').default);
