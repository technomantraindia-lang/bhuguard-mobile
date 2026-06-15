import { useEffect, useState } from 'react';

import { StyleSheet, Text, View } from 'react-native';

import { SafeAreaView } from 'react-native-safe-area-context';

import type { NativeStackScreenProps } from '@react-navigation/native-stack';



import { BhuguardLogo } from '../../components/shared/BhuguardLogo';

import { SplashBackground } from '../../components/auth/SplashBackground';

import { BRAND_NAME, BRAND_TAGLINE, LOGO_SIZES } from '../../constants/branding';

import type { RootStackParamList } from '../../navigation/types';

import { getAuthToken, getAuthUserType } from '../../storage/authStorage';

import { colors } from '../../theme/colors';



type Props = NativeStackScreenProps<RootStackParamList, 'Splash'>;



const SPLASH_DURATION_MS = 2800;



function getRouteByUserType(userType: string | null): keyof RootStackParamList {

  switch (userType) {

    case 'farmer':

      return 'FarmerApp';

    case 'company_user':

      return 'CompanyApp';

    case 'field_officer':

      return 'FieldOfficerApp';

    default:

      return 'RoleSelection';

  }

}



export function SplashScreen({ navigation }: Props) {

  const [loadingText, setLoadingText] = useState('Preparing your farm dashboard…');



  useEffect(() => {

    let active = true;



    const bootstrap = async () => {

      await new Promise((resolve) => setTimeout(resolve, 1200));



      if (active) {

        setLoadingText('Loading your climate data…');

      }



      await new Promise((resolve) => setTimeout(resolve, SPLASH_DURATION_MS - 1200));



      if (!active) {

        return;

      }



      const [token, userType] = await Promise.all([getAuthToken(), getAuthUserType()]);

      const route = token ? getRouteByUserType(userType) : 'Login';



      navigation.reset({

        index: 0,

        routes: [{ name: route }],

      });

    };



    void bootstrap();



    return () => {

      active = false;

    };

  }, [navigation]);



  return (

    <View style={styles.root}>

      <SplashBackground />

      <SafeAreaView style={styles.safe}>

        <View style={styles.center}>

          <BhuguardLogo size={LOGO_SIZES.splash} animation="splash" />

          <Text style={styles.brand}>{BRAND_NAME}</Text>

          <Text style={styles.tagline}>{BRAND_TAGLINE}</Text>

          <Text style={styles.loading}>{loadingText}</Text>

        </View>

      </SafeAreaView>

    </View>

  );

}



const styles = StyleSheet.create({

  root: {

    flex: 1,

    backgroundColor: '#F4FBF6',

  },

  safe: {

    flex: 1,

    paddingHorizontal: 24,

  },

  center: {

    flex: 1,

    alignItems: 'center',

    justifyContent: 'center',

    gap: 10,

    paddingTop: 24,

  },

  brand: {

    marginTop: 18,

    fontSize: 34,

    fontWeight: '800',

    color: colors.primary,

    letterSpacing: -0.5,

  },

  tagline: {

    fontSize: 15,

    fontWeight: '600',

    color: colors.textMuted,

    textAlign: 'center',

  },

  loading: {

    marginTop: 28,

    fontSize: 14,

    color: colors.textMuted,

    fontWeight: '500',

  },

});


