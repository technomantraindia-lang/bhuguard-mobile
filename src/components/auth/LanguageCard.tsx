import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { AppLanguage } from '../../i18n/types';
import { colors } from '../../theme/colors';

interface LanguageCardProps {
  title: string;
  nativeTitle: string;
  selected?: boolean;
  onPress: () => void;
}

export function LanguageCard({ title, nativeTitle, selected = false, onPress }: LanguageCardProps) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.card, selected && styles.cardSelected]}
      accessibilityRole="button"
    >
      <Text style={[styles.nativeTitle, selected && styles.titleSelected]}>{nativeTitle}</Text>
      <Text style={styles.title}>{title}</Text>
    </Pressable>
  );
}

interface LanguageCardOption {
  language: AppLanguage;
  title: string;
  nativeTitle: string;
}

interface LanguageCardListProps {
  options: LanguageCardOption[];
  selectedLanguage?: AppLanguage | null;
  onSelect: (language: AppLanguage) => void;
}

export function LanguageCardList({ options, selectedLanguage, onSelect }: LanguageCardListProps) {
  return (
    <View style={styles.list}>
      {options.map((option) => (
        <LanguageCard
          key={option.language}
          title={option.title}
          nativeTitle={option.nativeTitle}
          selected={selectedLanguage === option.language}
          onPress={() => onSelect(option.language)}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  list: {
    gap: 14,
  },
  card: {
    minHeight: 88,
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: '#D8E8D0',
    backgroundColor: colors.white,
    paddingHorizontal: 20,
    paddingVertical: 18,
    justifyContent: 'center',
    gap: 4,
  },
  cardSelected: {
    borderColor: colors.primary,
    backgroundColor: '#F3FBF6',
  },
  nativeTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.text,
  },
  titleSelected: {
    color: colors.primary,
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textMuted,
  },
});
