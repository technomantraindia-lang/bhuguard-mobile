import { fetchApiData } from '../utils/apiHelpers';

import { postApiData } from './postHelpers';

export async function getNotifications(params?: {
  status?: 'read' | 'unread' | 'all';
  page?: number;
  per_page?: number;
  since?: string;
}) {
  const query = new URLSearchParams();

  if (params?.status) {
    query.set('status', params.status);
  }
  if (params?.page) {
    query.set('page', String(params.page));
  }
  if (params?.per_page) {
    query.set('per_page', String(params.per_page));
  }
  if (params?.since) {
    query.set('since', params.since);
  }

  const suffix = query.toString() ? `?${query.toString()}` : '';
  return fetchApiData(`/notifications${suffix}`);
}

export async function getUnreadNotificationCount() {
  return fetchApiData('/notifications/unread-count');
}

export async function getNotification(notificationId: number | string) {
  return fetchApiData(`/notifications/${notificationId}`);
}

export async function markNotificationRead(notificationId: number | string) {
  return postApiData(`/notifications/${notificationId}/mark-read`);
}

export async function markAllNotificationsRead() {
  return postApiData('/notifications/mark-all-read');
}
