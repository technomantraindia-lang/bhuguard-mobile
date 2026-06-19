import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import type { FieldOfficerStackParamList } from '../../navigation/types';
import { officerTheme } from '../../theme/officerDashboardTheme';

type Props = NativeStackScreenProps<FieldOfficerStackParamList, 'OfficerFullscreenImage'>;

export function OfficerFullscreenImageScreen({ route, navigation }: Props) {
  const { uri, title } = route.params;

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()}>
          <Text style={styles.close}>Close</Text>
        </Pressable>
        <Text style={styles.title}>{title ?? 'Evidence Photo'}</Text>
      </View>
      <Image source={{ uri }} style={styles.image} resizeMode="contain" />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#000' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  close: { color: '#fff', fontWeight: '700', fontSize: 16 },
  title: { color: '#fff', fontWeight: '600', fontSize: 16 },
  image: { flex: 1, width: '100%' },
});
