import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors } from '../theme/colors';
import { AppButton } from './AppButton';
import { AppCard } from './AppCard';

interface FilePickerCardProps {
  title: string;
  subtitle?: string;
  fileName?: string;
  fileSize?: string;
  pickLabel: string;
  onPick: () => void;
  onRemove?: () => void;
}

export function FilePickerCard({
  title,
  subtitle,
  fileName,
  fileSize,
  pickLabel,
  onPick,
  onRemove,
}: FilePickerCardProps) {
  return (
    <View style={styles.wrap}>
      <AppCard
        title={title}
        subtitle={fileName ? `${fileName}${fileSize ? ` · ${fileSize}` : ''}` : subtitle}
      />
      <AppButton label={pickLabel} onPress={onPick} variant="secondary" />
      {fileName && onRemove ? (
        <Pressable onPress={onRemove}>
          <Text style={styles.remove}>Remove file</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 8 },
  remove: { color: colors.error, fontWeight: '600', textAlign: 'center', paddingVertical: 4 },
});
