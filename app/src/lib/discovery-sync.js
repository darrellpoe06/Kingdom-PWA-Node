// =============================================================================
// discovery-sync — cross-device sync for recorded-discovery items (0093)
// =============================================================================
// The factory's step-1 data lane (DR-0114/0117): parseDiscoveryJson() output
// lands here so a steward reviews IN THE APP. Faithful transport only — the
// client's source_quote rides every row untouched, and status moves ONLY by a
// steward's hand ('extracted' → 'reviewed'/'rejected').
// =============================================================================
import { createTableSync } from './table-sync.js';

export function toDiscoveryRow(item, { tenantId, userId } = {}) {
  return {
    instance_id:      tenantId ?? null,
    created_by:       userId ?? null,
    slug:             item.id ?? null,
    kind:             item.kind,
    area:             item.area || null,
    text:             item.text || '',
    amount_text:      item.amountText || null,
    confidence:       item.confidence || null,
    source_quote:     item.sourceQuote || null,
    client_name:      item.clientName || null,
    business_name:    item.businessName || null,
    source_recording: item.sourceRecording || null,
    source_run:       item.sourceRun || null,
    extracted_at:     item.extractedAt || null,
    status:           item.status || 'extracted',
    reviewed_by:      item.reviewedBy || null,
    reviewed_at:      item.reviewedAt || null,
    imported_task_slug: item.importedTaskSlug || null,
  };
}

export function fromDiscoveryRow(row) {
  return {
    id:              row.slug ?? `di-remote-${row.id}`,
    kind:            row.kind,
    area:            row.area || null,
    text:            row.text || '',
    amountText:      row.amount_text || null,
    confidence:      row.confidence || null,
    sourceQuote:     row.source_quote || null,
    clientName:      row.client_name || null,
    businessName:    row.business_name || null,
    sourceRecording: row.source_recording || null,
    sourceRun:       row.source_run || null,
    extractedAt:     row.extracted_at || null,
    status:          row.status || 'extracted',
    reviewedBy:      row.reviewed_by || null,
    reviewedAt:      row.reviewed_at || null,
    importedTaskSlug: row.imported_task_slug || null,
    createdAt:       row.created_at,
    remoteUuid:      row.id,
  };
}

export const discoverySync = createTableSync({
  localKey: 'discoveryItems',
  remoteTable: 'discovery_items',
  toRow: toDiscoveryRow,
  fromRow: fromDiscoveryRow,
  idOf: (item) => item.id,
});
