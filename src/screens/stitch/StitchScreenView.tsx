import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { STITCH_REGISTRY } from '../../config/stitchRegistry';
import {
  STITCH_API_FETCHERS,
  STITCH_DETAIL_FETCHERS,
  STITCH_POST_ENDPOINTS,
} from '../../config/stitchApiMap';
import { getFormConfigForScreenKey } from '../../config/stitchFormConfig';
import { ApiDetailScreen } from '../../components/ApiDetailScreen';
import { ApiListScreen } from '../../components/ApiListScreen';
import { ApiRecordFormScreen } from '../../components/ApiRecordFormScreen';
import { AppButton } from '../../components/AppButton';
import { STITCH_LIST_UPLOAD_ACTIONS } from '../../config/stitchScreenRoutes';
import { AppCard } from '../../components/AppCard';
import { DashboardCard } from '../../components/DashboardCard';
import { ListItemCard } from '../../components/ListItemCard';
import { ScreenHeader } from '../../components/ScreenHeader';
import { SectionTitle } from '../../components/SectionTitle';
import { StatusBadge } from '../../components/StatusBadge';
import { colors, spacing } from '../../theme';
import type { FieldOfficerStackParamList } from '../../navigation/types';
import { fetchApiData, fetchListItemById } from '../../utils/apiHelpers';
import { PENDING_API_MESSAGE } from '../../utils/apiError';

interface StitchScreenViewProps {
  screenKey: string;
  itemId?: number;
  stitchRouteName?: string;
  officerAssignmentId?: number;
  missingAssignmentMessage?: string;
}

const DEFAULT_LIST_KEYS = ['data', 'items', 'records', 'results'];

function resolveListFetcher(screenKey: string, apiPath?: string) {
  if (STITCH_API_FETCHERS[screenKey]) {
    return STITCH_API_FETCHERS[screenKey];
  }

  if (apiPath) {
    return () => fetchApiData(apiPath);
  }

  return null;
}

export function StitchScreenView({
  screenKey,
  itemId,
  stitchRouteName = 'StitchScreen',
  officerAssignmentId,
  missingAssignmentMessage,
}: StitchScreenViewProps) {
  const navigation = useNavigation<NativeStackNavigationProp<Record<string, object | undefined>>>();
  const config = STITCH_REGISTRY[screenKey];

  if (!config) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.pad}>
          <ScreenHeader title="Screen not found" subtitle={screenKey} />
          <Text style={styles.muted}>This Stitch screen is not registered yet.</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (missingAssignmentMessage) {
    return (
      <SafeAreaView style={styles.safe}>
        <ScrollView contentContainerStyle={styles.container}>
          <ScreenHeader title={config.title} subtitle="Assignment required" />
          <AppCard title="No active visit">
            <Text style={styles.body}>{missingAssignmentMessage}</Text>
            <AppButton
              label="Open assigned visits"
              onPress={() => navigation.navigate('FieldOfficerAssignments' as never)}
            />
          </AppCard>
        </ScrollView>
      </SafeAreaView>
    );
  }

  const listUploadAction = STITCH_LIST_UPLOAD_ACTIONS[screenKey];

  if (config.mode === 'hub') {
    return (
      <SafeAreaView style={styles.safe}>
        <ScrollView contentContainerStyle={styles.container}>
          <ScreenHeader title={config.title} subtitle={config.subtitle ?? 'Stitch module hub'} />
          <AppCard title="Bhuguard DMRV" subtitle="Premium light eco interface">
            <StatusBadge label="API linked" tone="success" />
            <Text style={styles.muted}>Tap a module below to open its screen.</Text>
          </AppCard>
          <SectionTitle title="Modules" />
          {(config.hubChildren ?? []).map((childKey) => {
            const child = STITCH_REGISTRY[childKey];

            if (!child) {
              return null;
            }

            const apiLinked = Boolean(
              STITCH_API_FETCHERS[childKey] ||
                child.apiPath ||
                STITCH_POST_ENDPOINTS[childKey] ||
                child.detailApiPath ||
                child.listFallback,
            );

            return (
              <DashboardCard
                key={childKey}
                title={child.title}
                subtitle={
                  child.pending
                    ? 'Backend API pending'
                    : apiLinked
                      ? 'API connected'
                      : child.mode
                }
                onPress={() =>
                  navigation.navigate(stitchRouteName, {
                    screenKey: childKey,
                  })
                }
              />
            );
          })}
        </ScrollView>
      </SafeAreaView>
    );
  }

  const listFetcher = resolveListFetcher(screenKey, config.apiPath);

  if (config.mode === 'list' && listFetcher && !config.pending) {
    return (
      <ApiListScreen
        title={config.title}
        subtitle={config.subtitle ?? config.apiPath}
        fetcher={listFetcher}
        listKeys={[...(config.listKeys ?? []), ...DEFAULT_LIST_KEYS]}
        headerAction={
          listUploadAction
            ? {
                label: listUploadAction.label,
                onPress: () => {
                  if (screenKey === 'evidence_review' || screenKey === 'assigned_verification_list') {
                    const assignmentId = itemId ?? officerAssignmentId;

                    if (assignmentId) {
                      (navigation as NativeStackNavigationProp<FieldOfficerStackParamList>).navigate(
                        'VisitEvidenceUpload',
                        { assignmentId },
                      );
                      return;
                    }
                  }

                  navigation.navigate(stitchRouteName, {
                    screenKey: listUploadAction.targetScreenKey,
                    itemId: itemId ?? officerAssignmentId,
                  });
                },
              }
            : undefined
        }
        onItemPress={
          config.detailApiPath || config.detailScreenKey
            ? (item) => {
                const recordId = Number(item?.id ?? 0);

                if (
                  (screenKey === 'evidence_review' || screenKey === 'assigned_verification_list') &&
                  recordId > 0
                ) {
                  (navigation as NativeStackNavigationProp<FieldOfficerStackParamList>).navigate(
                    'VisitEvidenceUpload',
                    { assignmentId: recordId },
                  );
                  return;
                }

                if (screenKey === 'officer_inventory_tasks' && recordId > 0) {
                  (navigation as NativeStackNavigationProp<FieldOfficerStackParamList>).navigate(
                    'FieldOfficerInventoryTaskDetail',
                    { taskId: recordId },
                  );
                  return;
                }

                navigation.navigate(stitchRouteName, {
                  screenKey: config.detailScreenKey ?? screenKey.replace('_list', '_detail'),
                  itemId: recordId,
                });
              }
            : undefined
        }
        renderItem={(item) => (
          <ListItemCard
            item={item}
            titleKeys={
              config.listTitleKeys ?? [
                'name',
                'title',
                'plot_name',
                'farm_name',
                'code',
                'assignment_code',
                'sample_code',
              ]
            }
            subtitleKeys={config.listSubtitleKeys}
            statusKey="status"
          />
        )}
      />
    );
  }

  if (config.mode === 'detail' && itemId && !config.pending) {
    let detailFetcher: (() => Promise<import('../../utils/apiHelpers').ApiRecord>) | null = null;

    if (STITCH_DETAIL_FETCHERS[screenKey]) {
      const id = itemId;
      detailFetcher = () => STITCH_DETAIL_FETCHERS[screenKey](id);
    } else if (config.detailApiPath) {
      detailFetcher = () => fetchApiData(config.detailApiPath!.replace('{id}', String(itemId)));
    } else if (config.listFallback) {
      detailFetcher = () =>
        fetchListItemById(
          config.listFallback!.apiPath,
          config.listFallback!.listKeys,
          itemId,
          config.listFallback!.wrapperKey,
        );
    }

    if (detailFetcher) {
      return (
        <ApiDetailScreen
          title={config.title}
          fetcher={detailFetcher}
          rootKeys={config.detailRootKeys ?? []}
          titleKeys={config.detailTitleKeys}
          fields={
            config.detailFields ?? [
              { label: 'ID', keys: ['id'] },
              { label: 'Status', keys: ['status', 'assignment_status'] },
              { label: 'Name', keys: ['name', 'title', 'plot_name', 'sample_code', 'assessment_code'] },
            ]
          }
        />
      );
    }
  }

  if (config.mode === 'info' && (STITCH_API_FETCHERS[screenKey] || config.apiPath) && !config.pending) {
    const infoFetcher = STITCH_API_FETCHERS[screenKey] ?? (() => fetchApiData(config.apiPath!));

    return (
      <ApiDetailScreen
        title={config.title}
        subtitle={config.subtitle ?? config.apiPath}
        fetcher={infoFetcher}
        rootKeys={config.detailRootKeys ?? ['dashboard', 'summary']}
        fields={[
          { label: 'Status', keys: ['status'] },
          { label: 'Total farms', keys: ['total_farms', 'farms_count'] },
          { label: 'Total plots', keys: ['total_plots', 'plots_count'] },
          { label: 'Carbon credits', keys: ['total_credits', 'credits_issued', 'carbon_credits'] },
          { label: 'Pending visits', keys: ['pending_visits', 'pending_assignments'] },
        ]}
      />
    );
  }

  const postEndpoint = STITCH_POST_ENDPOINTS[screenKey];
  const formConfig = getFormConfigForScreenKey(screenKey);

  if (config.mode === 'form' && formConfig) {
    return <ApiRecordFormScreen config={formConfig} />;
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container}>
        <ScreenHeader title={config.title} subtitle={config.subtitle ?? 'Stitch UI screen'} />
        <AppCard title={config.title}>
          <StatusBadge
            label={postEndpoint ? 'POST API ready' : config.pending ? 'Backend API pending' : 'Demo ready'}
            tone={postEndpoint ? 'success' : config.pending ? 'warning' : 'neutral'}
          />
          <Text style={styles.body}>
            {postEndpoint
              ? `Backend endpoint: ${postEndpoint}. Full form UI coming soon — API client is connected.`
              : config.pending
                ? PENDING_API_MESSAGE
                : 'This screen is visible in the mobile app.'}
          </Text>
          {config.mode === 'form' && postEndpoint ? (
            <AppButton
              label="Test API connection"
              onPress={() =>
                Alert.alert(
                  'API connected',
                  `POST ${postEndpoint}\n\nSubmit the full form from the dedicated screen when available.`,
                )
              }
            />
          ) : null}
        </AppCard>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  pad: { padding: spacing.screen },
  container: { padding: spacing.screen, gap: spacing.md, paddingBottom: spacing.xxxl },
  muted: { fontSize: 14, color: colors.textMuted, lineHeight: 20 },
  body: { fontSize: 14, color: colors.text, lineHeight: 22, marginTop: 8 },
});
