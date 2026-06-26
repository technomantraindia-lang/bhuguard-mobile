import { fetchApiData } from '../utils/apiHelpers';
import { postApiData } from './postHelpers';
import type { ApiRecord } from '../utils/apiHelpers';

export interface CreateSupportThreadPayload {
  subject: string;
  category: string;
  priority: 'low' | 'medium' | 'high';
  message: string;
}

export interface SendSupportMessagePayload {
  message: string;
}

export async function getSupportThreads(): Promise<ApiRecord> {
  return fetchApiData('/support/threads');
}

export async function createSupportThread(payload: CreateSupportThreadPayload): Promise<ApiRecord> {
  return postApiData('/support/threads', payload as unknown as ApiRecord);
}

export async function getSupportThreadDetail(threadId: number | string): Promise<ApiRecord> {
  return fetchApiData(`/support/threads/${threadId}`);
}

export async function sendSupportMessage(
  threadId: number | string,
  payload: SendSupportMessagePayload,
): Promise<ApiRecord> {
  return postApiData(`/support/threads/${threadId}/messages`, payload as unknown as ApiRecord);
}

export async function closeSupportThread(threadId: number | string): Promise<ApiRecord> {
  return postApiData(`/support/threads/${threadId}/close`, {});
}
