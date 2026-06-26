import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { ScreenHeader } from '../../components/ScreenHeader';
import type { FarmerStackParamList } from '../../navigation/types';
import { dashboardTheme } from '../../theme/bhuguardDashboardTheme';

type Props = NativeStackScreenProps<FarmerStackParamList, 'FarmerLegal'>;

const TERMS_CONTENT = `Bhuguard DMRV Platform — Terms & Conditions

By using the Bhuguard farmer mobile application you agree to participate in the Biochar service program under the terms communicated by your project partner.

You are responsible for submitting accurate farm activity updates, evidence photos, and Biochar update records. Misrepresentation may affect verification and payment eligibility.

Bhuguard and partner organizations may contact you regarding field visits, verification, and program updates.`;

const PRIVACY_CONTENT = `Bhuguard Privacy Policy

We collect farmer profile information, farm boundaries, activity logs, evidence uploads, and Biochar update records to operate the DMRV program.

Personal identifiers such as Aadhaar and bank details are stored securely and used only for program administration and payments. Masked values may be shown in the app.

You may request account support or deletion through Help & Support. Contact your field officer or Bhuguard support for data questions.`;

export function FarmerLegalScreen({ route, navigation }: Props) {
  const isPrivacy = route.params.document === 'privacy';
  const title = isPrivacy ? 'Privacy Policy' : 'Terms & Conditions';
  const body = isPrivacy ? PRIVACY_CONTENT : TERMS_CONTENT;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScreenHeader title={title} />
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.body}>{body}</Text>
        <View style={styles.noteCard}>
          <Text style={styles.noteTitle}>Data usage</Text>
          <Text style={styles.noteBody}>
            Location and photo evidence are used for verification of Biochar activities. You can manage notification
            preferences in your profile.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: dashboardTheme.background,
  },
  content: {
    padding: dashboardTheme.marginMobile,
    paddingBottom: 40,
    gap: 16,
  },
  body: {
    fontSize: 15,
    lineHeight: 24,
    color: dashboardTheme.onSurface,
  },
  noteCard: {
    backgroundColor: dashboardTheme.surfaceLowest,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: dashboardTheme.outlineVariant,
    padding: 14,
    gap: 6,
  },
  noteTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: dashboardTheme.headingGreen,
  },
  noteBody: {
    fontSize: 14,
    lineHeight: 20,
    color: dashboardTheme.onSurfaceVariant,
  },
});
