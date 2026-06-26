import AsyncStorage from '@react-native-async-storage/async-storage';



import {

  requestOutsideRadiusCheckIn,

  submitVisitCheckIn,

} from '../api/checkInApi';

import type { ApiRecord } from '../utils/apiHelpers';



const QUEUE_KEY = 'bhuguard_visit_gps_checkin_queue';



export interface PendingGpsCheckin {

  id: string;

  assignmentId: number;

  payload: ApiRecord;

  overridePhotoUri?: string;

  forceOverride?: boolean;

  createdAt: string;

}



async function readQueue(): Promise<PendingGpsCheckin[]> {

  const raw = await AsyncStorage.getItem(QUEUE_KEY);



  if (!raw) {

    return [];

  }



  try {

    const parsed = JSON.parse(raw) as PendingGpsCheckin[];



    return Array.isArray(parsed) ? parsed : [];

  } catch {

    return [];

  }

}



async function writeQueue(items: PendingGpsCheckin[]): Promise<void> {

  await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(items));

}



export async function enqueueGpsCheckin(item: Omit<PendingGpsCheckin, 'id' | 'createdAt'>): Promise<void> {

  const queue = await readQueue();



  queue.push({

    ...item,

    id: `${item.assignmentId}-${Date.now()}`,

    createdAt: new Date().toISOString(),

  });



  await writeQueue(queue);

}



export async function syncPendingGpsCheckins(): Promise<number> {

  const queue = await readQueue();



  if (queue.length === 0) {

    return 0;

  }



  const remaining: PendingGpsCheckin[] = [];

  let synced = 0;



  for (const item of queue) {

    try {

      const payload = item.payload;

      const basePayload = {

        latitude: Number(payload.latitude),

        longitude: Number(payload.longitude),

        accuracy: Number(payload.accuracy),

        captured_at: String(payload.captured_at ?? payload.gps_captured_at ?? new Date().toISOString()),

        distance_from_target: Number(payload.distance_from_target ?? payload.distance_from_farm_meter ?? 0),

        allowed_radius: Number(payload.allowed_radius ?? payload.allowed_radius_meter ?? 100),

      };



      if (item.forceOverride || payload.checkin_status === 'outside_radius_pending') {

        await requestOutsideRadiusCheckIn(

          item.assignmentId,

          {

            ...basePayload,

            outside_radius_reason: String(

              payload.outside_radius_reason ?? payload.override_reason ?? 'Offline sync request',

            ),

          },

          item.overridePhotoUri,

        );

      } else {

        await submitVisitCheckIn(item.assignmentId, basePayload);

      }



      synced += 1;

    } catch {

      remaining.push(item);

    }

  }



  await writeQueue(remaining);



  return synced;

}



export async function pendingGpsCheckinCount(): Promise<number> {

  const queue = await readQueue();



  return queue.length;

}

