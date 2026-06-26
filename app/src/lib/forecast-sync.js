// =============================================================================
// forecast-sync — cross-device sync for recorded forecast snapshots
// =============================================================================
// A forecast snapshot is the frozen record of a projection: what we predicted,
// the assumptions it rested on, and the horizon date to score it against. This
// wrapper pools those on the family instance so the projected-vs-actual history
// (the institutional memory of our forecasts) survives any one device and shows
// up everywhere the family signs in. Flat-table wholesale pattern (like
// incidents): every local field maps to a column. See schema-v2.16.
import { createTableSync } from './table-sync.js';

// The full column set for one snapshot. Mirrors snapshotFromProjection's shape.
export function forecastColumns(item) {
  return {
    slug:                    item.id,
    scope:                   item.scope || 'consolidated',
    label:                   item.label || '',
    base_date:               item.baseDate,
    horizon_months:          Number(item.horizonMonths) || 12,
    horizon_date:            item.horizonDate,
    starting_cash:           Number(item.startingCash) || 0,
    projected_end_cash:      Number(item.projectedEndCash) || 0,
    projected_lowest_cash:   item.projectedLowestCash == null ? null : Number(item.projectedLowestCash),
    projected_runway_months: item.projectedRunwayMonths == null ? null : Number(item.projectedRunwayMonths),
    net_monthly:             Number(item.netMonthly) || 0,
    assumptions:             item.assumptions || {},
  };
}

export const forecastSync = createTableSync({
  localKey: 'forecastSnapshots',
  remoteTable: 'forecast_snapshots',

  toRow(item, { tenantId, userId }) {
    return {
      instance_id: tenantId,
      created_by:  userId,
      ...forecastColumns(item),
    };
  },

  fromRow(row) {
    return {
      id:                   row.slug || `snap-remote-${row.id}`,
      remoteUuid:           row.id,
      scope:                row.scope || 'consolidated',
      label:                row.label || '',
      baseDate:             row.base_date,
      horizonMonths:        Number(row.horizon_months) || 12,
      horizonDate:          row.horizon_date,
      startingCash:         Number(row.starting_cash) || 0,
      projectedEndCash:     Number(row.projected_end_cash) || 0,
      projectedLowestCash:  row.projected_lowest_cash == null ? null : Number(row.projected_lowest_cash),
      projectedRunwayMonths: row.projected_runway_months == null ? null : Number(row.projected_runway_months),
      netMonthly:           Number(row.net_monthly) || 0,
      assumptions:          row.assumptions || {},
      createdAt:            row.created_at,
    };
  },

  idOf(item) {
    return item.id;
  },
});
