import { SettingsScreen } from '../shared/SettingsScreen';
import { useTranslation } from '../../i18n/I18nContext';

export function FarmerSettingsScreen() {
  const { t } = useTranslation();

  return (
    <SettingsScreen
      title={t('common.settings')}
      subtitle={t('profile.farmerTitle')}
    />
  );
}
