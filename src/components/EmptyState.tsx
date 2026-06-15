import { StyleSheet, Text, View } from 'react-native';



import { LOGO_SIZES } from '../constants/branding';

import { colors } from '../theme/colors';

import { BhuguardLogo } from './shared/BhuguardLogo';



interface EmptyStateProps {

  title?: string;

  message?: string;

}



export function EmptyState({

  title = 'No records yet',

  message = 'There is nothing to show for this module right now.',

}: EmptyStateProps) {

  return (

    <View style={styles.wrap}>

      <View style={styles.watermark} pointerEvents="none">

        <BhuguardLogo size={LOGO_SIZES.watermark} />

      </View>

      <Text style={styles.title}>{title}</Text>

      <Text style={styles.message}>{message}</Text>

    </View>

  );

}



const styles = StyleSheet.create({

  wrap: {

    padding: 24,

    alignItems: 'center',

    gap: 8,

    overflow: 'hidden',

    position: 'relative',

    minHeight: 180,

    justifyContent: 'center',

  },

  watermark: {

    ...StyleSheet.absoluteFill,

    alignItems: 'center',

    justifyContent: 'center',

    opacity: 0.1,

  },

  title: {

    fontSize: 16,

    fontWeight: '700',

    color: colors.text,

    zIndex: 1,

  },

  message: {

    fontSize: 14,

    color: colors.textMuted,

    textAlign: 'center',

    lineHeight: 20,

    zIndex: 1,

  },

});


