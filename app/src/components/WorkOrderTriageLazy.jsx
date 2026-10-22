// WorkOrderTriageLazy — the triage card, loaded on its own (DR-1213).
// The Life Hub and Big Picture live in the shell's chunk, which sits at the
// edge of the asset-size limit (asset-size-guard: 24.00 MiB, DR-0595); a
// static import carried the card and properties/cloud.js into it and pushed it
// to 24.03 MiB. Loaded lazily, the card is its own small chunk, fetched when
// the screen that shows it opens.
import React, { lazy, Suspense } from 'react';

const Card = lazy(() => import('./WorkOrderTriage.jsx'));

export default function WorkOrderTriageLazy(props) {
  return (
    <Suspense fallback={<p className="mt-4 text-[0.625rem] text-[#5A5751]" data-testid="work-order-reading">Reading the work orders…</p>}>
      <Card {...props} />
    </Suspense>
  );
}
