// =============================================================================
// service-day — the ONE weekday-from-date helper for church service labels.
// =============================================================================
// Fixes the date-label bug (Darrell 2026-07-02): a Choir card read "SUNDAY
// SERVICE · MON, JUL 13" — the weekday was asserted from the stored serviceType
// ('sunday'), not derived from the actual date (Jul 13 2026 is a Monday). The
// label must always match the real date.
//
// Root cause pattern: surfaces printed a weekday WORD baked into the service-type
// label ("Sunday service" / "Thursday rehearsal" / "Wednesday Bible study") right
// next to the formatted date — so a service scheduled on a different weekday
// (e.g. a Monday conference) contradicted itself. This helper derives the weekday
// from the DATE, so the label can never contradict it. When the type's usual
// weekday matches the date it reads exactly as before ("Sunday service" on a
// Sunday); when it doesn't, it tells the truth ("Monday service").
//
// TIMEZONE-SAFE: 'YYYY-MM-DD' is parsed to LOCAL midnight (explicit y/m/d), never
// `new Date('YYYY-MM-DD')` (which is UTC and shifts a day in US timezones). So the
// weekday matches the calendar date the user typed.
//
// PURE + import-free -> safe in Node + browser + tests.
// =============================================================================

const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const WEEKDAYS_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

// The real weekday for a 'YYYY-MM-DD' date, timezone-safe. '' for a missing/bad date.
export function weekdayName(dateStr, { short = false } = {}) {
  if (!dateStr || typeof dateStr !== 'string') return '';
  const m = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!m) return '';
  const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3])); // LOCAL midnight
  if (Number.isNaN(d.getTime())) return '';
  return (short ? WEEKDAYS_SHORT : WEEKDAYS)[d.getDay()];
}

// The KIND of gathering, independent of any weekday.
export function serviceKind(serviceType) {
  switch (serviceType) {
    case 'sunday': return 'service';
    case 'rehearsal': return 'rehearsal';
    case 'wednesday': return 'Bible study';
    case 'both': return 'service';
    case 'conference': return 'conference';
    case 'funeral': return 'funeral';
    default: return serviceType || 'service';
  }
}

// The kind as a standalone label (first letter capitalized) — for surfaces whose
// formatted date already shows the weekday, so the type tag adds the KIND only
// ("Service" / "Rehearsal" / "Bible study") and never a contradicting weekday.
export function serviceKindLabel(serviceType) {
  const k = serviceKind(serviceType);
  return k.charAt(0).toUpperCase() + k.slice(1);
}

// The canonical type label (used only as a fallback when there is no date to
// derive the weekday from). Matches the historical wording.
function canonicalTypeLabel(serviceType) {
  switch (serviceType) {
    case 'sunday': return 'Sunday service';
    case 'rehearsal': return 'Thursday rehearsal';
    case 'wednesday': return 'Wednesday Bible study';
    case 'both': return 'Service';
    case 'conference': return 'Conference';
    case 'funeral': return 'Funeral';
    default: return serviceType || 'Service';
  }
}

// Classify a streamed service by its TITLE. Conferences and funerals are the
// off-cycle streams (Darrell 2026-07-14: "labeled as conferences and funerals for
// those streams that are not on Sunday and usually Wednesday except for
// conferences"). The reliable signal is the TITLE, not the date: a Sunday message
// is often dated/uploaded on another weekday, so the weekday cannot reclassify it
// (that reclassified real Sunday sermons as Wednesday). A funeral / conference
// names itself; anything else keeps the historical default (wednesday if it says
// so, else sunday). `dateStr` is accepted for signature stability but not used to
// override a title. Pure.
const FUNERAL_RE = /\b(funeral|home[\s-]?going|homegoing|celebration of life|memorial service|in loving memory|going home celebration|repast)\b/i;
const CONFERENCE_RE = /\b(conference|convocation|holy convocation|assembly|convention|congress|summit|conclave)\b/i;
export function classifyServiceType(title, _dateStr) {
  const t = String(title || '');
  if (FUNERAL_RE.test(t)) return 'funeral';
  if (CONFERENCE_RE.test(t)) return 'conference';
  if (/wednesday|bible\s*study/i.test(t)) return 'wednesday';
  return 'sunday';
}

// The honest "<weekday> <kind>" label for a dated service card. Weekday comes from
// the DATE, so it always matches. No date -> the canonical type label.
export function serviceDayLabel(serviceType, dateStr, { short = false } = {}) {
  const wd = weekdayName(dateStr, { short });
  if (!wd) return canonicalTypeLabel(serviceType);
  return `${wd} ${serviceKind(serviceType)}`;
}
