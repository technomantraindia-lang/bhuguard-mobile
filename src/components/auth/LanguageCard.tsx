import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { AppLanguage } from '../../i18n/types';
import { authBrand } from '../../theme/authBrand';

interface LanguageCardProps {
  title: string;
  glyph: string;
  selected?: boolean;
  onPress: () => void;
}

export function LanguageCard({ title, glyph, selected = false, onPress }: LanguageCardProps) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        selected && styles.cardSelected,
        pressed && styles.cardPressed,
      ]}
      accessibilityRole="button"
      accessibilityState={{ selected }}
    >
      <View style={[styles.glyphWrap, selected && styles.glyphWrapSelected]}>
        <Text style={[styles.glyph, selected && styles.glyphSelected]}>{glyph}</Text>
      </View>
      <Text style={[styles.title, selected && styles.titleSelected]} numberOfLines={1}>
        {title}
      </Text>
      <Text style={[styles.chevron, selected && styles.chevronSelected]}>›</Text>
    </Pressable>
  );
}

interface LanguageCardOption {
  language: AppLanguage;
  title: string;
  glyph: string;
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
          glyph={option.glyph}
          selected={selectedLanguage === option.language}
          onPress={() => onSelect(option.language)}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  list: {
    width: '100%',
    gap: 14,
  },
  card: {
    minHeight: 64,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 252, 245, 0.92)',
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    shadowColor: '#0B2E1F',
    shadowOpacity: 0.12,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.65)',
  },
  cardSelected: {
    backgroundColor: 'rgba(11, 46, 31, 0.94)',
    borderColor: authBrand.accent,
  },
  cardPressed: {
    transform: [{ scale: 0.985 }],
  },
  glyphWrap: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(133, 201, 92, 0.18)',
  },
  glyphWrapSelected: {
    backgroundColor: 'rgba(133, 201, 92, 0.28)',
  },
  glyph: {
    fontSize: 20,
    fontWeight: '800',
    color: authBrand.tertiary,
  },
  glyphSelected: {
    color: authBrand.white,
  },
  title: {
    flex: 1,
    fontSize: 18,
    fontWeight: '700',
    color: authBrand.tertiary,
  },
  titleSelected: {
    color: authBrand.white,
  },
  chevron: {
    fontSize: 28,
    fontWeight: '300',
    color: 'rgba(11, 46, 31, 0.45)',
    marginTop: -2,
  },
  chevronSelected: {
    color: 'rgba(255,255,255,0.75)',
  },
});
