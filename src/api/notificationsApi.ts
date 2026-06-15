import { fetchApiData } from '../utils/apiHelpers';

import { postApiData } from './postHelpers';

export async function getNotifications() {
  return fetchApiData('/notifications');
}

export async function markNotificationRead(notificationId: number | string) {
  return postApiData(`/notifications/${notificationId}/mark-read`);
}

export async function markAllNotificationsRead() {
  return postApiData('/notifications/mark-all-read');
}
