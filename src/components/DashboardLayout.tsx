import type { ReactNode } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import type { AuthUser } from '../types/auth';
import { useLogout } from '../hooks/useLogout';

interface DashboardLayoutProps {
  title: string;
  user: AuthUser;
  children?: ReactNode;
}

export function DashboardLayout({ title, user, children }: DashboardLayoutProps) {
  const logout = useLogout();

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>{title}</Text>
          <Pressable style={styles.logoutButton} onPress={logout}>
            <Text style={styles.logoutText}>Logout</Text>
          </Pressable>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Signed in as</Text>
          <Text style={styles.label}>Name</Text>
          <Text style={styles.value}>{user.name}</Text>
          <Text style={styles.label}>Mobile / Email</Text>
          <Text style={styles.value}>{user.mobile || user.email || '-'}</Text>
          <Text style={styles.label}>User type</Text>
          <Text style={styles.value}>{user.user_type}</Text>
        </View>

        <View style={[styles.card, styles.successCard]}>
          <Text style={styles.successTitle}>API login connected successfully</Text>
          <Text style={styles.successBody}>
            Bearer token is stored in AsyncStorage and attached automatically to API requests.
          </Text>
        </View>

        {children}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f4f6f8',
  },
  container: {
    padding: 20,
    gap: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  logoutButton: {
    backgroundColor: '#dc2626',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
  },
  logoutText: {
    color: '#fff',
    fontWeight: '600',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    gap: 6,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
    color: '#374151',
  },
  label: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 4,
  },
  value: {
    fontSize: 16,
    color: '#111827',
    fontWeight: '500',
  },
  successCard: {
    backgroundColor: '#ecfdf5',
    borderColor: '#a7f3d0',
  },
  successTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#065f46',
  },
  successBody: {
    fontSize: 14,
    color: '#047857',
    lineHeight: 20,
  },
});
