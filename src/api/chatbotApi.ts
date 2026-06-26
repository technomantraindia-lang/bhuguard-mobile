import { postApiData } from './postHelpers';
import type { ApiRecord } from '../utils/apiHelpers';

export interface ChatbotAskPayload {
  message: string;
  thread_id?: number | null;
  language?: string;
  source_module?: string | null;
}

export interface ChatbotRequestAgentPayload {
  thread_id?: number | null;
  message?: string | null;
  source_module?: string | null;
}

export interface ChatbotRequestCallPayload {
  thread_id?: number | null;
  phone: string;
  reason: string;
  urgency?: 'normal' | 'urgent';
  source_module?: string | null;
}

export async function askChatbot(payload: ChatbotAskPayload): Promise<ApiRecord> {
  return postApiData('/support/chatbot/ask', payload as unknown as ApiRecord);
}

export async function requestSupportAgent(payload: ChatbotRequestAgentPayload): Promise<ApiRecord> {
  return postApiData('/support/request-agent', payload as unknown as ApiRecord);
}

export async function requestSupportCall(payload: ChatbotRequestCallPayload): Promise<ApiRecord> {
  return postApiData('/support/request-call', payload as unknown as ApiRecord);
}
