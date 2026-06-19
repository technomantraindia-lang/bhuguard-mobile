import { Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import type { FieldOfficerStackParamList } from '../../navigation/types';
import { officerTheme } from '../../theme/officerDashboardTheme';

type Props = NativeStackScreenProps<FieldOfficerStackParamList, 'OfficerDocumentViewer'>;

export function OfficerDocumentViewerScreen({ route, navigation }: Props) {
  const { url, title } = route.params;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()}>
          <Text style={styles.back}>Back</Text>
        </Pressable>
        <Text style={styles.title}>{title ?? 'Document Viewer'}</Text>
      </View>
      <View style={styles.body}>
        <Text style={styles.copy}>Open the weight slip document in your device viewer.</Text>
        <Pressable style={styles.button} onPress={() => void Linking.openURL(url)}>
          <Text style={styles.buttonText}>Open Document</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: officerTheme.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: officerTheme.outlineVariant,
    backgroundColor: officerTheme.surfaceLowest,
  },
  back: { color: officerTheme.primaryContainer, fontWeight: '700' },
  title: { fontSize: 18, fontWeight: '700', color: officerTheme.onSurface },
  body: { flex: 1, padding: 24, gap: 16, justifyContent: 'center' },
  copy: { fontSize: 15, color: officerTheme.onSurfaceVariant, textAlign: 'center' },
  button: {
    backgroundColor: officerTheme.primaryContainer,
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
  },
  buttonText: { color: officerTheme.onPrimary, fontWeight: '700' },
});
