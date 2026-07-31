import { SettingsScreen } from '../shared/SettingsScreen';
import { useTranslation } from '../../i18n/I18nContext';

export function ArtisanSettingsScreen() {
  const { t } = useTranslation();

  return <SettingsScreen title={t('common.settings')} subtitle={t('language.settingsSubtitle')} />;
}
