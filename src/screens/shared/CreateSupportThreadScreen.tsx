import { useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { getApiErrorMessage } from '../../api/authApi';
import { createSupportThread } from '../../api/supportApi';
import { ScreenHeader } from '../../components/ScreenHeader';
import { SupportHeroBanner } from '../../components/support/SupportHeroBanner';
import type { FarmerStackParamList, FieldOfficerStackParamList } from '../../navigation/types';
import {
  SUPPORT_PRIORITIES,
  supportCategoriesForRole,
} from '../../constants/supportCategories';
import { dashboardShadow, dashboardTheme } from '../../theme/bhuguardDashboardTheme';

type Props =
  | NativeStackScreenProps<FarmerStackParamList, 'CreateSupportThread'>
  | NativeStackScreenProps<FieldOfficerStackParamList, 'CreateSupportThread'>;

export function CreateSupportThreadScreen({ navigation, route }: Props) {
  const rootNavigation = useNavigation<any>();
  const supportRole = route.params.supportRole;
  const categories = supportCategoriesForRole(supportRole);

  const [subject, setSubject] = useState('');
  const [category, setCategory] = useState(categories[0] ?? '');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!subject.trim() || !message.trim()) {
      setError('Subject and message are required.');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const data = await createSupportThread({
        subject: subject.trim(),
        category,
        priority,
        message: message.trim(),
      });

      const threadId = Number((data.thread as { id?: number })?.id ?? data.id);

      Alert.alert('Support query created', 'Our team will respond in this thread.', [
        {
          text: 'Open Chat',
          onPress: () => {
            if (threadId) {
              rootNavigation.navigate('SupportChat', { threadId });
              return;
            }

            navigation.goBack();
          },
        },
      ]);
    } catch (err) {
      setError(getApiErrorMessage(err, 'Failed to create support query.'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScreenHeader title="New Support Query" subtitle="Describe your issue" />

      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <SupportHeroBanner title="Create Support Query" subtitle="Share details so our team can help you faster." />

        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Subject</Text>
          <TextInput
            style={styles.input}
            value={subject}
            onChangeText={setSubject}
            placeholder="Brief summary of your issue"
            placeholderTextColor={dashboardTheme.outline}
          />
        </View>

        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Category</Text>
          <View style={styles.chipWrap}>
          {categories.map((item) => {
            const active = category === item;

            return (
              <Pressable
                key={item}
                style={[styles.chip, active && styles.chipActive]}
                onPress={() => setCategory(item)}
              >
                <Text style={[styles.chipText, active && styles.chipTextActive]}>{item}</Text>
              </Pressable>
            );
          })}
          </View>
        </View>

        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Priority</Text>
          <View style={styles.chipWrap}>
          {SUPPORT_PRIORITIES.map((item) => {
            const active = priority === item.value;

            return (
              <Pressable
                key={item.value}
                style={[styles.chip, active && styles.chipActive]}
                onPress={() => setPriority(item.value)}
              >
                <Text style={[styles.chipText, active && styles.chipTextActive]}>{item.label}</Text>
              </Pressable>
            );
          })}
          </View>
        </View>

        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Message</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={message}
            onChangeText={setMessage}
            placeholder="Explain your issue in detail..."
            placeholderTextColor={dashboardTheme.outline}
            multiline
            textAlignVertical="top"
          />
        </View>

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        <Pressable
          style={[styles.submitButton, submitting && styles.submitButtonDisabled]}
          onPress={() => void handleSubmit()}
          disabled={submitting}
        >
          <Text style={styles.submitButtonText}>{submitting ? 'Submitting...' : 'Submit Query'}</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: dashboardTheme.background },
  content: { gap: 12, padding: 16, paddingBottom: 32 },
  sectionCard: {
    backgroundColor: '#fff',
    borderColor: 'rgba(191, 201, 190, 0.35)',
    borderRadius: 18,
    borderWidth: 1,
    gap: 10,
    padding: 14,
    ...dashboardShadow,
  },
  sectionTitle: { color: dashboardTheme.headingGreen, fontSize: 14, fontWeight: '700' },
  input: {
    backgroundColor: '#F9FAFB',
    borderColor: dashboardTheme.outlineVariant,
    borderRadius: 12,
    borderWidth: 1,
    color: dashboardTheme.onSurface,
    minHeight: 44,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  textArea: { minHeight: 120 },
  chipWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 4 },
  chip: {
    backgroundColor: '#fff',
    borderColor: dashboardTheme.outlineVariant,
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  chipActive: { backgroundColor: dashboardTheme.primary, borderColor: dashboardTheme.primary },
  chipText: { color: dashboardTheme.onSurface, fontSize: 13 },
  chipTextActive: { color: '#fff', fontWeight: '700' },
  submitButton: {
    alignItems: 'center',
    backgroundColor: dashboardTheme.primary,
    borderRadius: 999,
    marginTop: 4,
    paddingVertical: 15,
    ...dashboardShadow,
  },
  submitButtonDisabled: { opacity: 0.7 },
  submitButtonText: { color: '#fff', fontWeight: '700' },
  errorText: { color: dashboardTheme.error, fontSize: 13, marginTop: 8 },
});
