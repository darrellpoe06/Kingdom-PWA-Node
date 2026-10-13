// =============================================================================
// BusinessDoor — ONE generic door entry for any registered business (?biz=<slug>)
// =============================================================================
// cf-registry (DR-0114): the boot resolves the URL to a registry row and
// renders the door engine with that row. Moore Divahs is row #1; ?moore=1
// resolves here too (her printed QRs never break). An unknown slug gets an
// honest "no business here" card — never a blank page, never a fake door.
// =============================================================================
import React from 'react';
import { resolveBusinessSlug, getBusiness } from '../lib/business-registry.js';
import MooreDoor from './MooreDoor.jsx';

const SERIF = { fontFamily: '"Fraunces", serif' };

export default function BusinessDoor() {
  const slug = resolveBusinessSlug(new URLSearchParams(window.location.search));
  const business = getBusiness(slug);
  if (!business) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#FAF8F4] p-6 text-center">
        <div className="max-w-sm rounded-2xl border border-[#E8E2D8] bg-white p-5">
          <h1 className="text-xl font-bold text-[#1A1815]" style={SERIF}>No business at this address yet</h1>
          <p className="mt-2 text-sm text-[#5A5751]">
            This door isn&rsquo;t registered. If you were sent a link, ask the business for their current one —
            or see the platform at <a className="font-semibold underline" href="/poetech-app/">poetech.us</a>.
          </p>
        </div>
      </div>
    );
  }
  // The door engine renders the row. Today the engine is the Moore-born door
  // component; interior sections become per-row config as client #2 lands.
  return <MooreDoor business={business} />;
}
