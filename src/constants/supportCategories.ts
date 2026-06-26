export type SupportRole = 'farmer' | 'field_officer';

export const FARMER_SUPPORT_CATEGORIES = [
  'Farm',
  'Service',
  'Weekly Update',
  'Evidence Upload',
  'Report',
  'Payment/General',
  'Technical Issue',
] as const;

export const FIELD_OFFICER_SUPPORT_CATEGORIES = [
  'Assigned Visit',
  'GPS Check-in',
  'Checklist',
  'Evidence Upload',
  'Report Submit',
  'Technical Issue',
  'General',
] as const;

export const SUPPORT_PRIORITIES = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
] as const;

export function supportCategoriesForRole(role: SupportRole): readonly string[] {
  return role === 'field_officer' ? FIELD_OFFICER_SUPPORT_CATEGORIES : FARMER_SUPPORT_CATEGORIES;
}

export function supportStatusLabel(status: string): string {
  switch (status) {
    case 'open':
      return 'Open';
    case 'pending':
      return 'Pending';
    case 'resolved':
      return 'Resolved';
    case 'closed':
      return 'Closed';
    default:
      return status.replace(/_/g, ' ');
  }
}

export function supportStatusColor(status: string): string {
  switch (status) {
    case 'open':
      return '#005129';
    case 'pending':
      return '#695f00';
    case 'resolved':
      return '#0d5132';
    case 'closed':
      return '#6f7a70';
    default:
      return '#3f4940';
  }
}

export function formatSupportTimestamp(value?: string | null): string {
  if (!value) {
    return '—';
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString();
}

export function formatRelativeSupportTime(value?: string | null): string {
  if (!value) {
    return 'Just now';
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  const diffMs = Date.now() - date.getTime();
  const minutes = Math.floor(diffMs / 60000);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (minutes < 1) {
    return 'Just now';
  }

  if (minutes < 60) {
    return `${minutes}m ago`;
  }

  if (hours < 24) {
    return `${hours}h ago`;
  }

  if (days < 7) {
    return `${days}d ago`;
  }

  return date.toLocaleDateString();
}

export function supportPriorityColor(priority: string): string {
  switch (priority) {
    case 'high':
      return '#B91C1C';
    case 'medium':
      return '#CA8A04';
    case 'low':
    default:
      return '#6F7A70';
  }
}

export function supportPriorityLabel(priority: string): string {
  switch (priority) {
    case 'high':
      return 'High';
    case 'medium':
      return 'Medium';
    case 'low':
      return 'Low';
    default:
      return priority;
  }
}
