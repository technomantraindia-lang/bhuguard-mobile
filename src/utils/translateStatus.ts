type TranslateFn = (key: string, params?: Record<string, string>) => string;

const STATUS_ALIASES: Record<string, string> = {
  draft: 'status.draft',
  submitted: 'status.submitted',
  submitted_for_review: 'status.submitted',
  approved: 'status.approved',
  approved_with_remark: 'status.approvedWithRemark',
  rejected: 'status.rejected',
  pending: 'status.pending',
  pending_review: 'status.pendingReview',
  correction_required: 'status.correctionRequired',
  completed: 'status.completed',
  in_progress: 'status.inProgress',
  scheduled: 'status.scheduled',
  overdue: 'farmer.status.overdue',
  due_soon: 'farmer.status.due_soon',
  not_started: 'farmer.status.not_started',
  not_scheduled: 'farmer.status.not_scheduled',
  active: 'status.active',
  upcoming: 'status.upcoming',
};

export function translateStatus(status: string | null | undefined, t: TranslateFn): string {
  if (!status || status === '-') {
    return t('status.unknown');
  }

  const normalized = status.trim().toLowerCase().replace(/\s+/g, '_');
  const key = STATUS_ALIASES[normalized];

  if (key) {
    const translated = t(key);

    if (translated !== key) {
      return translated;
    }
  }

  return status.replace(/_/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase());
}
