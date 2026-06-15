import { useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { BhuguardLogo } from '../../components/shared/BhuguardLogo';
import { LOGO_SIZES } from '../../constants/branding';
import { RoleSelectionBackground } from '../../components/auth/RoleSelectionBackground';
import { RoleGridCard } from '../../components/auth/RoleGridCard';
import { SELECTABLE_ROLES, type SelectableRoleId } from '../../config/authRoles';
import type { RootStackParamList } from '../../navigation/types';
import { colors, spacing } from '../../theme';
import { PENDING_API_MESSAGE } from '../../utils/apiError';

type Props = NativeStackScreenProps<RootStackParamList, 'RoleSelection'>;

export function RoleSelectionScreen({ navigation }: Props) {
  const [selectedRoleId, setSelectedRoleId] = useState<SelectableRoleId | null>(null);

  const selectedRole = SELECTABLE_ROLES.find((role) => role.id === selectedRoleId);
  const canContinue = Boolean(selectedRole?.loginSupported && selectedRole.loginRole);

  const handleContinue = () => {
    if (!selectedRole) {
      return;
    }

    if (!selectedRole.loginSupported || !selectedRole.loginRole) {
      Alert.alert('Coming soon', PENDING_API_MESSAGE);
      return;
    }

    navigation.navigate('Login', { role: selectedRole.loginRole });
  };

  const rows = [
    SELECTABLE_ROLES.slice(0, 2),
    SELECTABLE_ROLES.slice(2, 4),
    SELECTABLE_ROLES.slice(4, 6),
  ];

  return (
    <View style={styles.root}>
      <RoleSelectionBackground />
      <SafeAreaView style={styles.safe}>
        <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
          <View style={styles.logoWrap}>
            <BhuguardLogo size={LOGO_SIZES.roleSelection} />
          </View>
          <Text style={styles.title}>Choose Your Role</Text>
          <Text style={styles.subtitle}>
            Select your primary operational function to configure your DMRV workspace.
          </Text>

          <View style={styles.grid}>
            {rows.map((row) => (
              <View key={row.map((role) => role.id).join('-')} style={styles.gridRow}>
                {row.map((role) => (
                  <View key={role.id} style={styles.gridCell}>
                    <RoleGridCard
                      roleId={role.id}
                      title={role.title}
                      description={role.description}
                      selected={selectedRoleId === role.id}
                      onPress={() => setSelectedRoleId(role.id)}
                    />
                  </View>
                ))}
              </View>
            ))}
          </View>

          <View style={styles.infoBanner}>
            <View style={styles.infoIcon}>
              <Text style={styles.infoIconText}>i</Text>
            </View>
            <Text style={styles.infoText}>
              Farmer first-time registration is completed only by an authorized Field Officer.
            </Text>
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <Pressable
            style={[styles.continueButton, canContinue ? styles.continueButtonActive : styles.continueButtonDisabled]}
            onPress={handleContinue}
            disabled={!canContinue}
          >
            <Text style={[styles.continueText, canContinue ? styles.continueTextActive : styles.continueTextDisabled]}>
              Continue
            </Text>
          </Pressable>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  safe: {
    flex: 1,
  },
  container: {
    paddingHorizontal: spacing.xxl,
    paddingTop: spacing.lg,
    paddingBottom: spacing.lg,
  },
  logoWrap: {
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.text,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 21,
    color: colors.textMuted,
    marginBottom: spacing.xl,
  },
  grid: {
    gap: 12,
  },
  gridRow: {
    flexDirection: 'row',
    gap: 12,
  },
  gridCell: {
    flex: 1,
  },
  infoBanner: {
    marginTop: spacing.xl,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: '#E8F5ED',
    borderRadius: 14,
    padding: 14,
  },
  infoIcon: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  infoIconText: {
    color: colors.white,
    fontSize: 11,
    fontWeight: '800',
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 19,
    color: '#3F5F4C',
  },
  footer: {
    paddingHorizontal: spacing.xxl,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xl,
  },
  continueButton: {
    minHeight: 52,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  continueButtonActive: {
    backgroundColor: colors.primary,
  },
  continueButtonDisabled: {
    backgroundColor: '#D1E7DD',
  },
  continueText: {
    fontSize: 16,
    fontWeight: '700',
  },
  continueTextActive: {
    color: colors.white,
  },
  continueTextDisabled: {
    color: '#7FA892',
  },
});
