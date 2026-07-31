import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Animated, Pressable, StyleSheet, Text, View } from 'react-native';

import { useArtisanWorkSession } from '../../context/ArtisanWorkSessionContext';
import { BhuguardMaterialIcon } from '../shared/BhuguardMaterialIcon';
import { artisanTheme } from '../../theme/artisanTheme';
import { formatArtisanGpsTimestamp } from '../../utils/artisanGpsAccuracy';

function formatDuration(seconds: number | null | undefined): string {
  if (seconds == null || !Number.isFinite(seconds) || seconds < 0) {
    return '—';
  }

  const total = Math.floor(seconds);
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const secs = total % 60;

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }

  if (minutes > 0) {
    return `${minutes}m ${secs}s`;
  }

  return `${secs}s`;
}

function activityLabel(value: string | null | undefined): string {
  if (!value) {
    return '—';
  }

  return value
    .split('_')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

export function LiveWorkCheckinCard() {
  const {
    statusKey,
    statusLabel,
    session,
    isCheckedIn,
    submitting,
    hydrating,
    refreshGpsPreview,
    gpsPreview,
    gpsPreviewError,
    error,
    checkIn,
    checkOut,
  } = useArtisanWorkSession();

  const pulse = useRef(new Animated.Value(1)).current;
  const gpsBusyRef = useRef(false);
  const [gpsBusy, setGpsBusy] = useState(false);
  const [durationTick, setDurationTick] = useState(0);
  const isLive = statusKey === 'checked_in';
  const busy = submitting || gpsBusy;

  // Provider already hydrates on mount / throttled resume.
  // Do not re-hydrate on every focus — that caused GPS/API loops.

  useEffect(() => {
    if (!isLive) {
      pulse.setValue(1);
      return;
    }

    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1.18, duration: 700, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 1, duration: 700, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [isLive, pulse]);

  // Duration clock: update once per minute while checked in (not every second).
  useEffect(() => {
    if (!isCheckedIn || !session?.checked_in_at) {
      return;
    }

    const interval = setInterval(() => {
      setDurationTick((value) => value + 1);
    }, 60_000);

    return () => clearInterval(interval);
  }, [isCheckedIn, session?.checked_in_at]);

  const durationSeconds = useMemo(() => {
    void durationTick;

    if (session?.duration_seconds != null) {
      const base = Number(session.duration_seconds);
      if (!session?.checked_in_at) {
        return base;
      }
    }

    if (!session?.checked_in_at) {
      return null;
    }

    const started = new Date(session.checked_in_at).getTime();
    if (Number.isNaN(started)) {
      return null;
    }

    return Math.max(0, Math.floor((Date.now() - started) / 1000));
  }, [durationTick, session?.checked_in_at, session?.duration_seconds]);

  const accuracyValue =
    session?.gps_accuracy != null && Number.isFinite(Number(session.gps_accuracy))
      ? Number(session.gps_accuracy)
      : gpsPreview?.accuracyM != null && Number.isFinite(Number(gpsPreview.accuracyM))
        ? Number(gpsPreview.accuracyM)
        : null;

  const accuracy =
    accuracyValue != null ? `${accuracyValue.toFixed(1)} m` : '—';

  const lastUpdate = session?.last_location_at ?? gpsPreview?.capturedAt ?? null;
  const villageLine = session?.village_name
    ? `${session.village_name}${session.taluka_name ? ` · ${session.taluka_name}` : ''}${
        session.district_name ? ` · ${session.district_name}` : ''
      }`
    : isCheckedIn
      ? '—'
      : 'Not checked in yet';

  const onRefreshGps = useCallback(async () => {
    if (gpsBusyRef.current || submitting) {
      return;
    }

    gpsBusyRef.current = true;
    setGpsBusy(true);
    try {
      await refreshGpsPreview();
    } finally {
      gpsBusyRef.current = false;
      setGpsBusy(false);
    }
  }, [refreshGpsPreview, submitting]);

  const displayStatusLabel =
    submitting && statusKey === 'getting_location'
      ? 'Getting Location'
      : statusKey === 'getting_location' && !submitting
        ? 'Not Checked In'
        : statusLabel;

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.titleRow}>
          {isLive ? (
            <Animated.View style={[styles.pulseDot, { transform: [{ scale: pulse }] }]} />
          ) : (
            <BhuguardMaterialIcon name="share_location" size={20} color={artisanTheme.tertiary} />
          )}
          <Text style={styles.title}>Live Work Check-in</Text>
        </View>
        <View
          style={[
            styles.badge,
            statusKey === 'checked_in'
              ? styles.badgeLive
              : statusKey === 'location_stale' || statusKey === 'out_of_zone'
                ? styles.badgeWarn
                : styles.badgeIdle,
          ]}
        >
          <Text style={styles.badgeText}>{displayStatusLabel}</Text>
        </View>
      </View>

      {hydrating && !session && !gpsPreview ? (
        <View style={styles.loadingRow}>
          <ActivityIndicator color={artisanTheme.actionGreen} />
          <Text style={styles.meta}>Loading check-in status…</Text>
        </View>
      ) : (
        <View style={styles.metaBlock}>
          <Text style={styles.meta}>Village: {villageLine}</Text>
          <Text style={styles.meta}>GPS accuracy: {accuracy}</Text>
          <Text style={styles.meta}>Last update: {formatArtisanGpsTimestamp(lastUpdate)}</Text>
          <Text style={styles.meta}>Duration: {formatDuration(durationSeconds)}</Text>
          <Text style={styles.meta}>Activity: {activityLabel(session?.current_activity_type)}</Text>
          {gpsPreviewError && !isCheckedIn ? (
            <Text style={styles.warnMeta}>{gpsPreviewError}</Text>
          ) : null}
          {error && !submitting ? <Text style={styles.warnMeta}>{error}</Text> : null}
        </View>
      )}

      <View style={styles.actions}>
        {!isCheckedIn ? (
          <Pressable
            style={[styles.secondaryButton, busy && styles.buttonDisabled]}
            disabled={busy}
            onPress={() => void onRefreshGps()}
          >
            <Text style={styles.secondaryButtonText}>{gpsBusy ? 'Please wait…' : 'Refresh GPS'}</Text>
          </Pressable>
        ) : null}
        <Pressable
          style={[styles.button, busy && styles.buttonDisabled, !isCheckedIn && styles.buttonFlex]}
          disabled={busy}
          onPress={() => void (isCheckedIn ? checkOut() : checkIn())}
        >
          <Text style={styles.buttonText}>
            {submitting
              ? 'Please wait…'
              : isCheckedIn
                ? 'Check Out'
                : 'Check In'}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: artisanTheme.cream,
    borderRadius: 18,
    padding: 16,
    gap: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: artisanTheme.softBorder,
    ...artisanTheme.cardShadow,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
    minWidth: 0,
  },
  title: {
    fontSize: 16,
    fontWeight: '800',
    color: artisanTheme.tertiary,
    flexShrink: 1,
  },
  pulseDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: artisanTheme.actionGreen,
  },
  badge: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
    maxWidth: '46%',
  },
  badgeLive: { backgroundColor: 'rgba(133, 201, 92, 0.22)' },
  badgeWarn: { backgroundColor: '#FEF3C7' },
  badgeIdle: { backgroundColor: artisanTheme.cream },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: artisanTheme.deepText,
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  metaBlock: { gap: 4 },
  meta: {
    fontSize: 13,
    color: artisanTheme.secondaryText,
    lineHeight: 18,
  },
  warnMeta: {
    fontSize: 12,
    color: '#B45309',
    marginTop: 4,
    lineHeight: 17,
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
  },
  button: {
    flex: 1,
    backgroundColor: artisanTheme.actionGreen,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  buttonFlex: { flex: 1 },
  buttonDisabled: { opacity: 0.6 },
  buttonText: {
    color: artisanTheme.white,
    fontWeight: '700',
    fontSize: 15,
  },
  secondaryButton: {
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: artisanTheme.softBorder,
    backgroundColor: artisanTheme.white,
  },
  secondaryButtonText: {
    color: artisanTheme.tertiary,
    fontWeight: '700',
    fontSize: 13,
  },
});
