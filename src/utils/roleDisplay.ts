/**
 * User-facing role labels. Internal role keys (e.g. `artisan`) stay unchanged.
 */
export function getRoleDisplayName(role: string | undefined | null): string {
  const normalized = String(role ?? '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '_');

  switch (normalized) {
    case 'farmer':
      return 'Farmer';
    case 'field_officer':
      return 'Field Officer';
    case 'artisan':
      return 'Artisan';
    case 'artisan_pro':
      return 'Artisan Pro';
    case 'admin':
      return 'Admin';
    case 'manager':
      return 'Manager';
    default:
      return role ? String(role).replace(/_/g, ' ') : '—';
  }
}
