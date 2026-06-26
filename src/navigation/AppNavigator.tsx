import { useEffect } from 'react';

import { RootNavigator } from './RootNavigator';

export function AppNavigator() {
  useEffect(() => {
    console.log('[Bhuguard] AppNavigator mounted');
  }, []);

  return <RootNavigator />;
}