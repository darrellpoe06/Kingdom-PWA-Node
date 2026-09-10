// =============================================================================
// tlc-roster-cards — the PURE half of the live roster (DR-0343)
// =============================================================================
// The card FORMAT the seven seed therapists use in lib/tlc-practice.js, the
// merge of live rows over that seed, and the card a packet becomes. No React,
// no network, no Supabase — so node tests and the door's no-leak pin can read
// it. The hook and the RPC seam live in tlc-roster.js.
import { SPECIALTIES, POPULATIONS, applicantName, normalizePacket } from './tlc-onboarding.js';

export const ROSTER_ROLE_DEFAULT = 'Specialist';
export const ROSTER_FALLBACK_URL = 'https://tlctherapysolutions.me/find-your-therapist-flexible-career-opportunities-african-american-women-men-multicultural-illinois-communities';

const norm = (s) => String(s || '').trim().toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();

// Pure: a live row → the card shape TLC_TEAM uses. No photo → no card image
// (the surfaces already render an empty frame gracefully).
export function rosterCard(row) {
  if (!row || !row.name) return null;
  return {
    id: row.id || null,
    name: String(row.name).trim(),
    role: String(row.role || ROSTER_ROLE_DEFAULT).trim() || ROSTER_ROLE_DEFAULT,
    specialty: String(row.specialty || '').trim(),
    url: String(row.url || '').trim() || ROSTER_FALLBACK_URL,
    photo: row.photo || null,
    live: true,
  };
}

// Pure: seed cards + live cards, live winning on a same-name collision, seed
// order kept, live rows appended in their own order.
export function mergeRoster(seed, live) {
  const liveCards = (Array.isArray(live) ? live : []).map(rosterCard).filter(Boolean);
  const byName = new Map(liveCards.map((c) => [norm(c.name), c]));
  const out = [];
  const used = new Set();
  for (const s of Array.isArray(seed) ? seed : []) {
    const hit = byName.get(norm(s.name));
    if (hit) { out.push({ ...s, ...hit }); used.add(norm(s.name)); } else out.push({ ...s, live: false });
  }
  for (const c of liveCards) if (!used.has(norm(c.name))) out.push(c);
  return out;
}

// Pure: the card a packet becomes — what Christina previews before approving.
// The specialty line is the form's own specialty labels (populations when no
// specialty was chosen), joined the way the seed cards are.
export function rosterCardFromPacket(view) {
  if (!view || !view.packet) return null;
  const p = normalizePacket(view.packet);
  const specs = (p.specialties || []).map((id) => (SPECIALTIES.find((o) => o.id === id) || {}).label).filter(Boolean);
  const pops = (p.populationsPreferred || []).map((id) => (POPULATIONS.find((o) => o.id === id) || {}).label).filter(Boolean);
  const line = (specs.length ? specs : pops).slice(0, 3).join(' · ');
  const name = applicantName(p) || view.email || '';
  const lic = String(p.licenseType || '').trim();
  return {
    name: lic && lic !== 'Other' && !/pre-licensed/i.test(lic) && !/psychologist/i.test(lic) ? `${name}, ${lic}` : name,
    role: ROSTER_ROLE_DEFAULT,
    specialty: line,
    url: '',
    photo: view.headshot_thumb || null,
    bio: String(p.bio || '').trim(),
  };
}

