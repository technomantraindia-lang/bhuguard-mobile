import { Alert, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { FARMER_UPCOMING_SERVICE_MESSAGE } from '../../constants/farmerActivityServices';
import { AppButton } from '../../components/AppButton';
import { FarmerActivityServiceCard } from '../../components/farmer/activities/FarmerActivityServiceCard';
import { LoadingState } from '../../components/LoadingState';
import { ScreenContainer } from '../../components/shared/ScreenContainer';
import { ScreenHeader } from '../../components/ScreenHeader';
import { useFarmerServicesScreenData } from '../../hooks/useFarmerServicesScreenData';
import type { FarmerStackParamList } from '../../navigation/types';
import { dashboardTheme } from '../../theme/bhuguardDashboardTheme';
import type { FarmerActivityServiceItem } from '../../constants/farmerActivityServices';

export function FarmerServicesScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<FarmerStackParamList>>();
  const insets = useSafeAreaInsets();
  const { services, loading, refreshing, error, reload, refresh } = useFarmerServicesScreenData();

  const openChatSupport = () => {
    navigation.navigate('ChatbotSupport', { supportRole: 'farmer', sourceModule: 'farmer_services' });
  };

  const handleServicePress = (service: FarmerActivityServiceItem) => {
    if (service.code === 'BIOCHAR') {
      return;
    }

    Alert.alert('Coming soon', FARMER_UPCOMING_SERVICE_MESSAGE);
  };

  if (loading && services.length === 0) {
    return (
      <ScreenContainer>
        <View style={styles.headerPad}>
          <ScreenHeader title="Services" subtitle="Your enrolled Bhuguard services" />
        </View>
        <LoadingState message="Loading services..." />
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer>
      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: 24 + insets.bottom }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={dashboardTheme.primary} />
        }
      >
        <ScreenHeader
          title="Services"
          subtitle="Your enrolled Bhuguard services"
          rightAction={{ label: 'Help', onPress: openChatSupport }}
        />

        <Text style={styles.helperText}>
          Biochar is active on your account. Farm Activity updates are submitted separately every 20 days.
        </Text>

        {error ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{error}</Text>
            <AppButton label="Retry" onPress={reload} />
          </View>
        ) : null}

        <View style={styles.list}>
          {services.map((service) => (
            <FarmerActivityServiceCard
              key={service.code}
              service={service.code === 'BIOCHAR' ? { ...service, canOpen: false, statusLabel: 'Active' } : service}
              displayOnly={service.code === 'BIOCHAR'}
              onPress={() => handleServicePress(service)}
            />
          ))}
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  headerPad: { paddingHorizontal: 20, paddingTop: 12 },
  content: {
    paddingHorizontal: 20,
    paddingTop: 12,
    gap: 16,
  },
  helperText: {
    fontSize: 14,
    lineHeight: 20,
    color: dashboardTheme.textMuted,
  },
  list: { gap: 12 },
  errorBox: {
    gap: 10,
    backgroundColor: '#FEF2F2',
    borderRadius: 12,
    padding: 12,
  },
  errorText: {
    color: '#B91C1C',
    fontSize: 13,
    lineHeight: 18,
  },
});
