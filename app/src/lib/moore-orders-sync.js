// =============================================================================
// moore-orders-sync — cross-device sync for Moore Divahs custom orders
// =============================================================================
// Mirrors crm-sync / board-tasks-sync: the pure model is lib/moore-divahs.js;
// this is the persistence adapter (toRow / fromRow) over createTableSync for
// the custom_orders table (0083). An order Shay updates at a class shows on
// the home laptop live, scoped by the same instance-membership RLS as every
// other domain row. NO payment data rides this adapter — pay_method/paid_at
// are records of how she collected (owner's hand), never processing.
// =============================================================================
import { createTableSync } from './table-sync.js';
import { newOrder, normalizeOrderStage, normalizeChannel, normalizeProductType } from './moore-divahs.js';

// Pure mappers — exported so a test can pin the round-trip without a live DB.
export function toOrderRow(item, { tenantId, userId } = {}) {
  return {
    instance_id:          tenantId ?? null,
    created_by:           userId ?? null,
    slug:                 item.id ?? null,
    stage:                normalizeOrderStage(item.stage),
    customer_name:        item.customerName ?? '',
    contact_value:        item.contactValue || null,
    channel:              normalizeChannel(item.channel),
    product_type:         normalizeProductType(item.productType),
    description:          item.description || null,
    inspo_notes:          item.inspoNotes || null,
    size_or_measurements: item.sizeOrMeasurements || null,
    fabric:               item.fabric || null,
    bulk_lines:           Array.isArray(item.bulkLines) ? item.bulkLines : [],
    quote_cents:          item.quoteCents == null ? 0 : item.quoteCents,
    paid_at:              item.paidAt || null,
    pay_method:           item.payMethod || null,
    turnaround_days:      item.turnaroundDays == null ? 21 : item.turnaroundDays,
    materials_cents:      item.materialsCents == null ? 0 : item.materialsCents,
    delivery:             item.delivery === 'pickup' ? 'pickup' : 'ship',
    delivered_at:         item.deliveredAt || null,
    follow_up:            item.followUp ?? {},
    change_orders:        Array.isArray(item.changeOrders) ? item.changeOrders : [],
    policy_accepted:      item.policyAccepted === true,
    seed:                 item.seed === true,
    history:              Array.isArray(item.history) ? item.history : [],
  };
}

// Re-hydrate a row into the engine's canonical order shape so the surface and
// the pure helpers see one consistent object regardless of origin.
export function fromOrderRow(row) {
  return { ...newOrder({
    id:                 row.slug ?? `mo-remote-${row.id}`,
    stage:              row.stage,
    customerName:       row.customer_name,
    contactValue:       row.contact_value,
    channel:            row.channel,
    productType:        row.product_type,
    description:        row.description,
    inspoNotes:         row.inspo_notes,
    sizeOrMeasurements: row.size_or_measurements,
    fabric:             row.fabric,
    bulkLines:          Array.isArray(row.bulk_lines) ? row.bulk_lines : [],
    quoteCents:         row.quote_cents,
    paidAt:             row.paid_at,
    payMethod:          row.pay_method,
    turnaroundDays:     row.turnaround_days,
    materialsCents:     row.materials_cents,
    delivery:           row.delivery,
    deliveredAt:        row.delivered_at,
    followUp:           row.follow_up,
    changeOrders:       Array.isArray(row.change_orders) ? row.change_orders : [],
    policyAccepted:     row.policy_accepted === true,
    seed:               row.seed === true,
    history:            Array.isArray(row.history) ? row.history : [],
    createdAt:          row.created_at,
    updatedAt:          row.updated_at,
  }), remoteUuid: row.id }; // remoteUuid = the DB uuid, needed to target updates/deletes
}

export const mooreOrdersSync = createTableSync({
  localKey: 'mooreOrders',
  remoteTable: 'custom_orders',
  toRow: toOrderRow,
  fromRow: fromOrderRow,
  idOf: (item) => item.id,
});
