import React, { useCallback, useEffect, useState, type ErrorInfo, type ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';

import AnimatedLogoSplash from './src/components/AnimatedLogoSplash';
import { I18nProvider } from './src/i18n/I18nContext';
import { NotificationProvider } from './src/context/NotificationContext';
import { AppUpdateProvider } from './src/context/AppUpdateContext';
import { AppNavigator } from './src/navigation/AppNavigator';
import { registerLivePhotoWatermarkProcessor } from './src/services/livePhotoWatermarkService';
import { syncServerTime } from './src/services/serverTimeSync';
import type { LivePhotoWatermarkProcessorHandle } from './src/components/evidence/LivePhotoWatermarkProcessor';
import { ThemeProvider } from './src/theme/ThemeContext';

interface AppErrorBoundaryState {
  error: Error | null;
}

class AppErrorBoundary extends React.Component<{ children: ReactNode }, AppErrorBoundaryState> {
  state: AppErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): AppErrorBoundaryState {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[Bhuguard] App crashed on launch:', error, info.componentStack);
  }

  render() {
    if (this.state.error) {
      return (
        <View style={styles.errorWrap}>
          <Text style={styles.errorTitle}>Bhuguard could not start</Text>
          <Text style={styles.errorBody}>Please restart the app. If this continues, reinstall the latest APK.</Text>
          <Text style={styles.errorDetail}>{this.state.error.message}</Text>
        </View>
      );
    }

    return this.props.children;
  }
}

/** Defer native view-shot processor until after first paint. */
function LivePhotoWatermarkHost() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setReady(true), 0);
    return () => clearTimeout(timer);
  }, []);

  if (!ready) {
    return null;
  }

  const { LivePhotoWatermarkProcessor } =
    require('./src/components/evidence/LivePhotoWatermarkProcessor') as typeof import('./src/components/evidence/LivePhotoWatermarkProcessor');

  return (
    <LivePhotoWatermarkProcessor
      ref={(handle: LivePhotoWatermarkProcessorHandle | null) => {
        registerLivePhotoWatermarkProcessor(handle);
      }}
    />
  );
}

export default function App() {
  const [showAnimatedSplash, setShowAnimatedSplash] = useState(true);

  const handleAnimatedSplashFinish = useCallback(() => {
    setShowAnimatedSplash(false);
  }, []);

  useEffect(() => {
    void syncServerTime();
  }, []);

  return (
    <AppErrorBoundary>
      <SafeAreaProvider>
        <ThemeProvider>
          <I18nProvider>
            <NotificationProvider>
              <AppUpdateProvider>
                {showAnimatedSplash ? (
                  <AnimatedLogoSplash onFinish={handleAnimatedSplashFinish} />
                ) : (
                  <>
                    <AppNavigator />
                    <LivePhotoWatermarkHost />
                  </>
                )}
                <StatusBar style="auto" />
              </AppUpdateProvider>
            </NotificationProvider>
          </I18nProvider>
        </ThemeProvider>
      </SafeAreaProvider>
    </AppErrorBoundary>
  );
}

const styles = StyleSheet.create({
  errorWrap: {
    flex: 1,
    justifyContent: 'center',
    padding: 24,
    backgroundColor: '#F9F9FF',
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#141B2B',
    marginBottom: 8,
  },
  errorBody: {
    fontSize: 15,
    lineHeight: 22,
    color: '#3F4940',
    marginBottom: 12,
  },
  errorDetail: {
    fontSize: 12,
    color: '#6F7A70',
  },
});
