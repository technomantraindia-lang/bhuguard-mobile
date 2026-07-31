import AsyncStorage from '@react-native-async-storage/async-storage';

import {
  artisanWorkCheckOut,
  artisanWorkLiveLocation,
  type ArtisanWorkCheckOutPayload,
  type ArtisanWorkLiveLocationPayload,
} from '../api/artisanApi';
import { calculateDistanceInMeters } from '../utils/locationUtils';

const QUEUE_KEY = 'bhuguard_artisan_work_session_queue';
const COORD_DEDUPE_METERS = 5;

export type PendingArtisanWorkItem =
  | {
      id: string;
      kind: 'live_location';
      payload: ArtisanWorkLiveLocationPayload;
      createdAt: string;
    }
  | {
      id: string;
      kind: 'check_out';
      payload: ArtisanWorkCheckOutPayload;
      createdAt: string;
    };

async function readQueue(): Promise<PendingArtisanWorkItem[]> {
  const raw = await AsyncStorage.getItem(QUEUE_KEY);

  if (!raw) {
    return [];
  }

  try {
    const parsed = JSON.parse(raw) as PendingArtisanWorkItem[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

async function writeQueue(items: PendingArtisanWorkItem[]): Promise<void> {
  await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(items));
}

function coordsNear(
  a: { latitude: number; longitude: number },
  b: { latitude: number; longitude: number },
): boolean {
  const distance = calculateDistanceInMeters(a.latitude, a.longitude, b.latitude, b.longitude);
  return distance != null && distance < COORD_DEDUPE_METERS;
}

export async function enqueueArtisanLiveLocation(
  payload: ArtisanWorkLiveLocationPayload,
): Promise<void> {
  const queue = await readQueue();
  const lastLive = [...queue]
    .reverse()
    .find((entry): entry is Extract<PendingArtisanWorkItem, { kind: 'live_location' }> => entry.kind === 'live_location');

  if (
    lastLive &&
    coordsNear(lastLive.payload, payload) &&
    (lastLive.payload.activity_stage ?? null) === (payload.activity_stage ?? null)
  ) {
    return;
  }

  queue.push({
    kind: 'live_location',
    payload,
    id: `live-${Date.now()}-${queue.length}`,
    createdAt: new Date().toISOString(),
  });
  await writeQueue(queue);
}

export async function enqueueArtisanCheckOut(payload: ArtisanWorkCheckOutPayload): Promise<void> {
  const queue = await readQueue();
  const withoutPriorCheckOut: PendingArtisanWorkItem[] = queue.filter((entry) => entry.kind !== 'check_out');
  withoutPriorCheckOut.push({
    kind: 'check_out',
    payload,
    id: `check_out-${Date.now()}`,
    createdAt: new Date().toISOString(),
  });
  await writeQueue(withoutPriorCheckOut);
}

export async function enqueueArtisanWorkItem(
  item:
    | { kind: 'live_location'; payload: ArtisanWorkLiveLocationPayload }
    | { kind: 'check_out'; payload: ArtisanWorkCheckOutPayload },
): Promise<void> {
  if (item.kind === 'live_location') {
    await enqueueArtisanLiveLocation(item.payload);
    return;
  }

  await enqueueArtisanCheckOut(item.payload);
}

export async function flushArtisanWorkSessionQueue(): Promise<number> {
  const queue = await readQueue();

  if (queue.length === 0) {
    return 0;
  }

  const remaining: PendingArtisanWorkItem[] = [];
  let synced = 0;

  for (const item of queue) {
    try {
      if (item.kind === 'live_location') {
        await artisanWorkLiveLocation(item.payload);
      } else {
        await artisanWorkCheckOut(item.payload);
      }
      synced += 1;
    } catch {
      remaining.push(item);
    }
  }

  await writeQueue(remaining);
  return synced;
}

export async function pendingArtisanWorkQueueCount(): Promise<number> {
  const queue = await readQueue();
  return queue.length;
}
