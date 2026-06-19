import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useNavigation } from '@react-navigation/native';



import { BrandedHeaderLogo } from './shared/BrandedHeaderLogo';

import { colors } from '../theme/colors';



interface ScreenHeaderProps {

  title: string;

  subtitle?: string;

  showBack?: boolean;

  showBrandLogo?: boolean;

  rightAction?: { label: string; onPress: () => void };

}



export function ScreenHeader({

  title,

  subtitle,

  showBack = true,

  showBrandLogo = true,

  rightAction,

}: ScreenHeaderProps) {

  const navigation = useNavigation();



  return (

    <View style={styles.wrap}>

      <View style={styles.row}>

        {showBack && navigation.canGoBack() ? (

          <Pressable onPress={() => navigation.goBack()} style={styles.backBtn}>

            <Text style={styles.backText}>← Back</Text>

          </Pressable>

        ) : (

          <View style={styles.backPlaceholder} />

        )}

        {rightAction ? (

          <Pressable onPress={rightAction.onPress}>

            <Text style={styles.rightText}>{rightAction.label}</Text>

          </Pressable>

        ) : null}

      </View>

      <View style={styles.titleRow}>

        {showBrandLogo ? <BrandedHeaderLogo /> : null}

        <View style={styles.titleCopy}>

          <Text style={styles.title}>{title}</Text>

          {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}

        </View>

      </View>

    </View>

  );

}



const styles = StyleSheet.create({

  wrap: {

    gap: 4,

    marginBottom: 8,

  },

  row: {

    flexDirection: 'row',

    alignItems: 'center',

    justifyContent: 'space-between',

    minHeight: 28,

  },

  backBtn: {

    paddingVertical: 4,

  },

  backText: {

    color: colors.primary,

    fontWeight: '600',

    fontSize: 15,

  },

  backPlaceholder: {

    width: 1,

  },

  rightText: {

    color: colors.error,

    fontWeight: '600',

  },

  titleRow: {

    flexDirection: 'row',

    alignItems: 'center',

  },

  titleCopy: {

    flex: 1,

    gap: 2,

  },

  title: {

    fontSize: 24,

    fontWeight: '800',

    color: colors.text,

  },

  subtitle: {

    fontSize: 14,

    color: colors.textMuted,

  },

});


