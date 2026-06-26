import { useEffect, useState, type ComponentType } from 'react';
import { StatusBar } from 'expo-status-bar';

import { I18nProvider } from './src/i18n/I18nContext';
import { AppNavigator } from './src/navigation/AppNavigator';
import { ThemeProvider } from './src/theme/ThemeContext';
import { registerLivePhotoWatermarkProcessor } from './src/services/livePhotoWatermarkService';
import type { LivePhotoWatermarkProcessorHandle } from './src/components/evidence/LivePhotoWatermarkProcessor';

export default function App() {
  const [WatermarkProcessor, setWatermarkProcessor] = useState<ComponentType<{
    ref: (handle: LivePhotoWatermarkProcessorHandle | null) => void;
  }> | null>(null);

  useEffect(() => {
    console.log('[Bhuguard] App mounted');
  }, []);

  useEffect(() => {
    const { LivePhotoWatermarkProcessor } =
      require('./src/components/evidence/LivePhotoWatermarkProcessor') as typeof import('./src/components/evidence/LivePhotoWatermarkProcessor');

    setWatermarkProcessor(() => LivePhotoWatermarkProcessor);
  }, []);

  return (
    <ThemeProvider>
      <I18nProvider>
        <AppNavigator />
        {WatermarkProcessor ? (
          <WatermarkProcessor
            ref={(handle: LivePhotoWatermarkProcessorHandle | null) => {
              registerLivePhotoWatermarkProcessor(handle);
            }}
          />
        ) : null}
        <StatusBar style="auto" />
      </I18nProvider>
    </ThemeProvider>
  );
}
