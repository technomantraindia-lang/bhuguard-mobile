import { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';

import { getApiErrorMessage } from '../api/authApi';
import type { ApiFormConfig, ApiFormField } from '../config/stitchFormConfig';
import { colors, spacing } from '../theme';
import type { ApiRecord } from '../utils/apiHelpers';
import { AppButton } from './AppButton';
import { ScreenHeader } from './ScreenHeader';

interface ApiRecordFormScreenProps {
  config: ApiFormConfig;
}

function buildInitialValues(fields: ApiFormField[]): ApiRecord {
  return Object.fromEntries(fields.map((field) => [field.name, '']));
}

function parseFieldValue(field: ApiFormField, raw: string): unknown {
  if (field.type === 'number') {
    if (!raw.trim()) {
      return undefined;
    }

    const parsed = Number(raw);

    return Number.isFinite(parsed) ? parsed : raw;
  }

  return raw.trim() || undefined;
}

export function ApiRecordFormScreen({ config }: ApiRecordFormScreenProps) {
  const navigation = useNavigation();
  const [values, setValues] = useState<ApiRecord>(() => buildInitialValues(config.fields));
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const updateValue = (name: string, value: string) => {
    setValues((current) => ({ ...current, [name]: value }));
    setError(null);
  };

  const handleSubmit = async () => {
    for (const field of config.fields) {
      if (!field.required) {
        continue;
      }

      const raw = String(values[field.name] ?? '').trim();

      if (!raw) {
        setError(`${field.label} is required.`);
        return;
      }
    }

    setSubmitting(true);
    setError(null);

    try {
      const payload: ApiRecord = {};

      for (const field of config.fields) {
        const parsed = parseFieldValue(field, String(values[field.name] ?? ''));

        if (parsed !== undefined) {
          payload[field.name] = parsed;
        }
      }

      await config.submit(payload);
      Alert.alert('Saved', `${config.title} submitted successfully.`, [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (caught) {
      setError(getApiErrorMessage(caught, 'Unable to submit form.'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
          <ScreenHeader title={config.title} subtitle={config.subtitle} />

          {config.fields.map((field) => (
            <View key={field.name} style={styles.field}>
              <Text style={styles.label}>
                {field.label}
                {field.required ? ' *' : ''}
              </Text>
              <TextInput
                value={String(values[field.name] ?? '')}
                onChangeText={(text) => updateValue(field.name, text)}
                placeholder={field.placeholder}
                keyboardType={field.keyboardType ?? (field.type === 'number' ? 'numeric' : 'default')}
                multiline={field.type === 'multiline'}
                numberOfLines={field.type === 'multiline' ? 4 : 1}
                style={[styles.input, field.type === 'multiline' && styles.multiline]}
                editable={!submitting}
              />
            </View>
          ))}

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <AppButton
            label={submitting ? 'Submitting…' : config.submitLabel ?? 'Submit'}
            onPress={() => void handleSubmit()}
            disabled={submitting}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  flex: { flex: 1 },
  container: { padding: spacing.screen, gap: spacing.md, paddingBottom: spacing.xxxl },
  field: { gap: 6 },
  label: { fontSize: 13, fontWeight: '600', color: colors.text },
  input: {
    borderWidth: 1,
    borderColor: '#D8E8D0',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    backgroundColor: colors.white,
    color: colors.text,
  },
  multiline: { minHeight: 96, textAlignVertical: 'top' },
  error: { color: colors.error, fontSize: 14, lineHeight: 20 },
});
