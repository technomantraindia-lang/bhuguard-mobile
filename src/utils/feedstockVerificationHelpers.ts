import { extractList, pickString, type ApiRecord } from './apiHelpers';
import {
  defaultChecklistItems,
  type FeedstockChecklistItem,
  type FeedstockPhotoReview,
  type VerificationResult,
} from '../constants/feedstockVerificationChecklist';

export interface FeedstockVerificationViewModel {
  id: number;
  verificationCode: string;
  priority: string;
  verificationStatus: string;
  verificationStatusLabel: string;
  verificationDateLabel: string;
  farmerName: string;
  farmerCode: string;
  farmName: string;
  village: string;
  taluka: string;
  district: string;
  projectName: string;
  feedstockTypeLabel: string;
  quantityLabel: string;
  collectionDateLabel: string;
  collectionMethod: string;
  recordSubmittedLabel: string;
  gps: {
    latitude: number | null;
    longitude: number | null;
    accuracyM: number | null;
    distanceFromFarmKm: number | null;
    farmLatitude: number | null;
    farmLongitude: number | null;
  };
  photos: Array<{
    id: number;
    url: string;
    uploadedAt: string | null;
    approved: boolean | null;
    rejected: boolean | null;
  }>;
  photosCount: number;
  weightSlip: {
    available: boolean;
    url: string | null;
    uploadedLabel: string;
    farmerName: string;
    quantityMentioned: string;
    approved: boolean | null;
  };
  checklist: FeedstockChecklistItem[];
  officerRemarks: string;
  correctionNotes: string;
  requiredChanges: string;
  rejectionReason: string;
  verificationResult: VerificationResult;
}

function readChecklist(record: ApiRecord): FeedstockChecklistItem[] {
  const defaults = defaultChecklistItems();
  const items = extractList(record, ['checklist']);

  if (items.length === 0) {
    return defaults;
  }

  return defaults.map((defaultItem) => {
    const match = items.find((item) => pickString(item, 'key') === defaultItem.key);

    if (!match) {
      return defaultItem;
    }

    const result = pickString(match, 'result');

    return {
      ...defaultItem,
      label: pickString(match, 'label') !== '-' ? pickString(match, 'label') : defaultItem.label,
      result: result === 'pass' || result === 'fail' ? result : null,
      remarks: pickString(match, 'remarks') !== '-' ? pickString(match, 'remarks') : '',
    };
  });
}

function readPhotos(record: ApiRecord): FeedstockVerificationViewModel['photos'] {
  return extractList(record, ['photos']).map((photo, index) => ({
    id: Number(photo.id ?? index),
    url: pickString(photo, 'url'),
    uploadedAt: pickString(photo, 'uploaded_at') !== '-' ? pickString(photo, 'uploaded_at') : null,
    approved: typeof photo.approved === 'boolean' ? photo.approved : null,
    rejected: typeof photo.rejected === 'boolean' ? photo.rejected : null,
  })).filter((photo) => photo.url && photo.url !== '-');
}

export function mapFeedstockVerificationRecord(record: ApiRecord): FeedstockVerificationViewModel {
  const collection = (record.collection ?? {}) as ApiRecord;
  const gps = (record.gps ?? {}) as ApiRecord;
  const weightSlip = (record.weight_slip ?? {}) as ApiRecord;
  const result = pickString(record, 'verification_result');

  return {
    id: Number(record.id),
    verificationCode: pickString(record, 'verification_code'),
    priority: pickString(record, 'priority') !== '-' ? pickString(record, 'priority') : 'normal',
    verificationStatus: pickString(record, 'verification_status'),
    verificationStatusLabel:
      pickString(record, 'verification_status_label') !== '-'
        ? pickString(record, 'verification_status_label')
        : 'Pending Verification',
    verificationDateLabel:
      pickString(record, 'verification_date_label') !== '-'
        ? pickString(record, 'verification_date_label')
        : 'Today',
    farmerName: pickString(record, 'farmer_name') !== '-' ? pickString(record, 'farmer_name') : 'Farmer',
    farmerCode: pickString(record, 'farmer_code') !== '-' ? pickString(record, 'farmer_code') : '—',
    farmName: pickString(record, 'farm_name') !== '-' ? pickString(record, 'farm_name') : '—',
    village: pickString(record, 'village') !== '-' ? pickString(record, 'village') : '—',
    taluka: pickString(record, 'taluka') !== '-' ? pickString(record, 'taluka') : '—',
    district: pickString(record, 'district') !== '-' ? pickString(record, 'district') : '—',
    projectName: pickString(record, 'project_name') !== '-' ? pickString(record, 'project_name') : 'Biochar',
    feedstockTypeLabel:
      pickString(collection, 'feedstock_type_label') !== '-'
        ? pickString(collection, 'feedstock_type_label')
        : pickString(collection, 'feedstock_type'),
    quantityLabel:
      pickString(collection, 'quantity_label') !== '-'
        ? pickString(collection, 'quantity_label')
        : '—',
    collectionDateLabel:
      pickString(collection, 'collection_date_label') !== '-'
        ? pickString(collection, 'collection_date_label')
        : '—',
    collectionMethod:
      pickString(collection, 'collection_method') !== '-'
        ? pickString(collection, 'collection_method')
        : 'Manual Collection',
    recordSubmittedLabel:
      pickString(collection, 'record_submitted_label') !== '-'
        ? pickString(collection, 'record_submitted_label')
        : '—',
    gps: {
      latitude: gps.latitude != null ? Number(gps.latitude) : null,
      longitude: gps.longitude != null ? Number(gps.longitude) : null,
      accuracyM: gps.accuracy_m != null ? Number(gps.accuracy_m) : null,
      distanceFromFarmKm: gps.distance_from_farm_km != null ? Number(gps.distance_from_farm_km) : null,
      farmLatitude: gps.farm_latitude != null ? Number(gps.farm_latitude) : null,
      farmLongitude: gps.farm_longitude != null ? Number(gps.farm_longitude) : null,
    },
    photos: readPhotos(record),
    photosCount: Number(record.photos_count ?? readPhotos(record).length),
    weightSlip: {
      available: Boolean(weightSlip.available),
      url: pickString(weightSlip, 'url') !== '-' ? pickString(weightSlip, 'url') : null,
      uploadedLabel: pickString(weightSlip, 'uploaded_label') !== '-' ? pickString(weightSlip, 'uploaded_label') : '—',
      farmerName: pickString(weightSlip, 'farmer_name') !== '-' ? pickString(weightSlip, 'farmer_name') : '—',
      quantityMentioned:
        pickString(weightSlip, 'quantity_mentioned') !== '-'
          ? pickString(weightSlip, 'quantity_mentioned')
          : '—',
      approved: typeof weightSlip.approved === 'boolean' ? weightSlip.approved : null,
    },
    checklist: readChecklist(record),
    officerRemarks: pickString(record, 'officer_remarks') !== '-' ? pickString(record, 'officer_remarks') : '',
    correctionNotes: pickString(record, 'correction_notes') !== '-' ? pickString(record, 'correction_notes') : '',
    requiredChanges: pickString(record, 'required_changes') !== '-' ? pickString(record, 'required_changes') : '',
    rejectionReason: pickString(record, 'rejection_reason') !== '-' ? pickString(record, 'rejection_reason') : '',
    verificationResult:
      result === 'approved' ||
      result === 'approved_with_remarks' ||
      result === 'correction_required' ||
      result === 'rejected'
        ? result
        : null,
  };
}

export function buildVerificationPayload(input: {
  checklist: FeedstockChecklistItem[];
  photoReviews: FeedstockPhotoReview[];
  weightSlipApproved: boolean | null;
  gpsVerified: boolean | null;
  gpsFlagged: boolean;
  officerRemarks: string;
  correctionNotes: string;
  requiredChanges: string;
  rejectionReason: string;
  verificationResult: VerificationResult;
}): ApiRecord {
  return {
    checklist: input.checklist.map((item) => ({
      key: item.key,
      result: item.result,
      remarks: item.remarks.trim() || null,
    })),
    photo_reviews: input.photoReviews.map((review) => ({
      photo_id: review.photoId,
      approved: review.approved,
      rejected: review.rejected,
    })),
    weight_slip_approved: input.weightSlipApproved,
    gps_verified: input.gpsVerified,
    gps_flagged: input.gpsFlagged,
    officer_remarks: input.officerRemarks.trim() || null,
    correction_notes: input.correctionNotes.trim() || null,
    required_changes: input.requiredChanges.trim() || null,
    rejection_reason: input.rejectionReason.trim() || null,
    verification_result: input.verificationResult,
  };
}

export function statusBadgeTone(status: string): 'pending' | 'approved' | 'rejected' | 'correction' | 'neutral' {
  const normalized = status.toLowerCase();

  if (normalized.includes('reject')) {
    return 'rejected';
  }

  if (normalized.includes('correction')) {
    return 'correction';
  }

  if (normalized.includes('approv')) {
    return 'approved';
  }

  if (normalized.includes('pending')) {
    return 'pending';
  }

  return 'neutral';
}
