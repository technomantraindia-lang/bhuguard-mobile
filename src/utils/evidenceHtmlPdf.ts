import { Alert } from 'react-native';

import type { ApiRecord } from './apiHelpers';
import { pickNestedString, pickString } from './apiHelpers';
import {
  evidenceCategoryLabel,
  evidenceHasGps,
  evidenceLinkedRecordLabel,
  evidenceVerificationLabel,
} from './evidenceDisplayHelpers';
import {
  fetchEvidenceFileBuffer,
  fetchEvidencePdfBuffer,
  saveEvidencePdfAndShare,
  type EvidenceDownloadRole,
} from './evidenceFileDownload';
import { buildEvidencePdfBytes } from './evidencePdfGenerator';

export interface EvidenceHtmlPdfResult {
  success: boolean;
  fileUri?: string;
  fileName?: string;
  message?: string;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function formatDate(value: string): string {
  if (!value || value === '-') {
    return '-';
  }

  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  return parsed.toLocaleString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function gpsLabel(evidence: ApiRecord): string {
  const latitude = pickString(evidence, 'latitude', 'gps_latitude');
  const longitude = pickString(evidence, 'longitude', 'gps_longitude');
  const accuracy = pickString(evidence, 'gps_accuracy');

  if (latitude !== '-' && longitude !== '-') {
    return `${latitude}, ${longitude}${accuracy !== '-' ? ` (+/-${accuracy}m)` : ''}`;
  }

  return evidenceHasGps(evidence) ? 'GPS attached' : 'Not available';
}

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';

  for (let index = 0; index < bytes.length; index += 1) {
    binary += String.fromCharCode(bytes[index]);
  }

  if (typeof globalThis.btoa === 'function') {
    return globalThis.btoa(binary);
  }

  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
  let result = '';
  let offset = 0;

  while (offset < binary.length) {
    const a = binary.charCodeAt(offset++);
    const b = offset < binary.length ? binary.charCodeAt(offset++) : 0;
    const c = offset < binary.length ? binary.charCodeAt(offset++) : 0;
    const bitmap = (a << 16) | (b << 8) | c;

    result +=
      chars.charAt((bitmap >> 18) & 63) +
      chars.charAt((bitmap >> 12) & 63) +
      chars.charAt(offset - 2 < binary.length ? (bitmap >> 6) & 63 : 64) +
      chars.charAt(offset - 1 < binary.length ? bitmap & 63 : 64);
  }

  return result;
}

function imageMimeFromBuffer(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);

  if (bytes.length > 3 && bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e) {
    return 'image/png';
  }

  if (bytes.length > 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
    return 'image/jpeg';
  }

  return 'image/jpeg';
}

function detailRow(label: string, value: string): string {
  return `
    <div class="row">
      <div class="label">${escapeHtml(label)}</div>
      <div class="value">${escapeHtml(value)}</div>
    </div>
  `;
}

export function buildEvidenceHtml(evidence: ApiRecord, imageDataUri?: string | null): string {
  const generatedAt = new Date().toLocaleString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const weeklyUpdate = pickNestedString(evidence, 'weekly_update.update_code');
  const notes = pickString(evidence, 'notes');

  const rows = [
    detailRow('Category', evidenceCategoryLabel(evidence)),
    detailRow('Evidence Code', pickString(evidence, 'evidence_code', 'id')),
    detailRow('Verification', evidenceVerificationLabel(evidence)),
    detailRow('Linked Record', evidenceLinkedRecordLabel(evidence)),
    detailRow('Farm', pickNestedString(evidence, 'farm.farm_name')),
    ...(weeklyUpdate !== '-' ? [detailRow('Weekly Update', weeklyUpdate)] : []),
    detailRow('File Name', pickString(evidence, 'original_file_name')),
    detailRow('Captured At', formatDate(pickString(evidence, 'captured_at'))),
    detailRow('Uploaded At', formatDate(pickString(evidence, 'uploaded_at', 'created_at'))),
    detailRow('GPS', gpsLabel(evidence)),
    ...(notes !== '-' ? [detailRow('Notes', notes)] : []),
    detailRow('Generated At', generatedAt),
  ].join('');

  const imageBlock = imageDataUri
    ? `<div class="photo-block">
        <div class="photo-title">Evidence Photo</div>
        <img src="${imageDataUri}" alt="Evidence photo" />
      </div>`
    : `<div class="photo-missing">Evidence photo is not available for this record.</div>`;

  return `<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <style>
      @page { margin: 24px; }
      body {
        font-family: Arial, Helvetica, sans-serif;
        color: #111111;
        margin: 0;
        padding: 0;
        background: #ffffff;
      }
      .header {
        border-bottom: 2px solid #1b5e20;
        padding-bottom: 12px;
        margin-bottom: 18px;
      }
      .brand {
        font-size: 11px;
        letter-spacing: 0.08em;
        color: #4b5563;
        text-transform: uppercase;
      }
      h1 {
        margin: 6px 0 0;
        font-size: 24px;
        color: #1b5e20;
      }
      .row {
        margin-bottom: 10px;
        page-break-inside: avoid;
      }
      .label {
        font-size: 11px;
        font-weight: 700;
        color: #6b7280;
        text-transform: uppercase;
        margin-bottom: 2px;
      }
      .value {
        font-size: 14px;
        line-height: 1.45;
        color: #111111;
      }
      .photo-block {
        margin-top: 22px;
        page-break-inside: avoid;
      }
      .photo-title {
        font-size: 13px;
        font-weight: 700;
        color: #1b5e20;
        margin-bottom: 10px;
      }
      img {
        width: 100%;
        max-height: 520px;
        object-fit: contain;
        border: 1px solid #d1d5db;
        border-radius: 8px;
        background: #f9fafb;
      }
      .photo-missing {
        margin-top: 18px;
        padding: 12px;
        border: 1px dashed #d1d5db;
        color: #6b7280;
        font-size: 13px;
      }
      .footer {
        margin-top: 24px;
        font-size: 11px;
        color: #6b7280;
        line-height: 1.5;
      }
    </style>
  </head>
  <body>
    <div class="header">
      <div class="brand">Bhuguard - Digital MRV for Climate Action</div>
      <h1>Evidence Upload Report</h1>
    </div>
    ${rows}
    ${imageBlock}
    <div class="footer">
      This document is generated by Bhuguard for carbon monitoring, verification and MRV compliance.
      Document ID: ${escapeHtml(pickString(evidence, 'evidence_code', 'id'))}
    </div>
  </body>
</html>`;
}

export function evidencePdfFileName(evidence: ApiRecord): string {
  const code = pickString(evidence, 'evidence_code', 'id').replace(/[^\w-]+/g, '-');

  return `bhuguard-evidence-${code || 'report'}.pdf`;
}

async function printHtmlToPdf(html: string): Promise<{ uri: string }> {
  const Print = await import('expo-print');

  return Print.printToFileAsync({
    html,
    base64: false,
  });
}

async function sharePdfFile(uri: string, fileName: string): Promise<void> {
  const Sharing = await import('expo-sharing');
  const canShare = await Sharing.isAvailableAsync();

  if (canShare) {
    await Sharing.shareAsync(uri, {
      mimeType: 'application/pdf',
      UTI: 'com.adobe.pdf',
      dialogTitle: fileName,
    });

    return;
  }

  Alert.alert('PDF ready', `${fileName} saved on your device.`);
}

export async function exportEvidenceHtmlPdf(
  role: EvidenceDownloadRole,
  evidence: ApiRecord,
): Promise<EvidenceHtmlPdfResult> {
  if (role === 'farmer') {
    return {
      success: false,
      message: 'Farmers cannot download evidence PDF exports.',
    };
  }

  const evidenceId = evidence.id as number | string;
  const fileName = evidencePdfFileName(evidence);

  try {
    const fileResult = await fetchEvidenceFileBuffer(role, evidenceId);
    let imageDataUri: string | null = null;

    if (fileResult.success && fileResult.buffer) {
      const mime = imageMimeFromBuffer(fileResult.buffer);
      const base64 = arrayBufferToBase64(fileResult.buffer);
      imageDataUri = `data:${mime};base64,${base64}`;
    }

    const html = buildEvidenceHtml(evidence, imageDataUri);

    try {
      const { uri } = await printHtmlToPdf(html);

      await sharePdfFile(uri, fileName);

      return {
        success: true,
        fileUri: uri,
        fileName,
        message: `${fileName} generated successfully.`,
      };
    } catch (printError) {
      if (__DEV__) {
        console.warn('[Bhuguard Evidence] HTML PDF failed, using fallback:', printError);
      }

      const serverPdf = await fetchEvidencePdfBuffer(role, evidenceId);

      if (serverPdf.success && serverPdf.buffer) {
        const result = await saveEvidencePdfAndShare(new Uint8Array(serverPdf.buffer), fileName);

        return {
          success: result.success,
          fileUri: result.fileUri,
          fileName: result.fileName,
          message: result.message,
        };
      }

      const localPdf = buildEvidencePdfBytes(evidence);
      const result = await saveEvidencePdfAndShare(localPdf, fileName);

      return {
        success: result.success,
        fileUri: result.fileUri,
        fileName: result.fileName,
        message: result.message,
      };
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to generate evidence PDF.';

    return {
      success: false,
      message,
    };
  }
}
