// =============================================================================
// public-shelf-rules — what a truthful listing card looks like (PURE)
// =============================================================================
// Extracted from public-shelf-witness.mjs for the same reason boot-markers.mjs
// was extracted from boot-check.mjs (#2120): the witness imports
// `playwright-core` at module scope, so a test cannot load it at all. The
// rules are the part worth proving, and they are pure — no browser, no
// network, no clock.
//
// WHY THESE THREE RULES. On 2026-10-11 Darrell found three faults on his own
// public shelf, from his phone, while every pipeline check was green:
//
//   "0.5 Bedroom or 1-Bedroom?!!!!!?????!!!!!"
//   "None say co-living!!!!!!!!!!!!!!!!!!!!!!"
//   "Why don't we show the same photos for both listings??????!!!!!!!!!"
//
// All three came from one NULL column read as though it had been written.
// Nothing in the system reads the page a stranger sees, so nothing could have
// caught them. These rules are that reading, written down.
//
// They are deliberately ABOUT ANY DOOR, never about a named one. Pinning
// "Bed B must say X" would break the day a door is renamed -- and a rename is
// exactly what broke the old room_label photo match. A rule that survives his
// renaming is an instrument; a snapshot is not.
// =============================================================================

/**
 * The whole judgement, as a pure function over what was rendered. No browser,
 * no network — so the rules are unit-tested without a live site.
 *
 * @param {{title:string, size:string, sharedLine:string, photos:string}[]} cards
 * @returns {{findings:string[], checked:number}}
 */
export function judgeShelf(cards) {
  const findings = [];
  const list = Array.isArray(cards) ? cards : [];

  if (!list.length) {
    // UNKNOWN IS NOT PASS. An empty shelf is indistinguishable from a broken
    // one, and a broken storefront is the worst outcome of the two.
    findings.push('the shelf rendered NO cards at all — either nothing is advertised or the page is broken, and these must never read the same');
    return { findings, checked: 0 };
  }

  for (const c of list) {
    const title = String(c.title || '');
    const size = String(c.size || '');
    const shared = String(c.sharedLine || '');
    const photos = String(c.photos || '');
    const where = title.slice(0, 60) || '(untitled card)';

    // THE LEVEL LABELS 0278 COMPOSES, MATCHED EXACTLY -- not a loose word
    // test. `/\bbed\b/` matches "1-bed", because the hyphen is a word
    // boundary, so a legitimate one-bedroom apartment read as a bed-level
    // door and the witness raised a false alarm on it. A guard that cries
    // wolf is deleted within a day (P46), so the match is anchored to the
    // two phrases the database actually builds.
    const isBed = /\bBed in a shared\b/i.test(title);
    const isRoom = /\bPrivate room in a shared\b/i.test(title);
    const saysShared = isBed || isRoom || /\bshared home\b/i.test(shared);
    const bedroomCount = size.match(/(\d+(?:\.\d+)?)\s*bed\b/i);

    // 1. A shared home must not also claim a bedroom count.
    if (saysShared && bedroomCount) {
      findings.push(`"${where}" says it is shared AND claims "${bedroomCount[0]}" — a bed in a shared room is not a ${bedroomCount[1]}-bedroom place`);
    }

    // 2. A bed or a room must say there are housemates.
    if ((isBed || isRoom) && !/housemates/i.test(shared)) {
      findings.push(`"${where}" is a bed or a room and never says there are housemates — the DR-0952 omission`);
    }

    // 3. Photographs, or an honest absence.
    const hasPhotos = /see all \d+ photos?/i.test(photos);
    const saysNone = /photographs coming/i.test(photos);
    if (!hasPhotos && !saysNone) {
      findings.push(`"${where}" shows neither photographs nor an honest "photographs coming"`);
    }
  }
  return { findings, checked: list.length };
}

/** What the witness prints, whether it passes or fails. Pure. */
export function report(result, base) {
  const head = `## Public shelf witness\n\nBase: \`${base}\`\nCards read: ${result.checked}\n`;
  if (!result.findings.length) return `${head}\nEvery advertised card tells the truth about what it is.\n`;
  return `${head}\n**${result.findings.length} finding(s):**\n\n${result.findings.map((f) => `- ${f}`).join('\n')}\n`;
}

/**
 * THE READING A BROWSER CANNOT TAKE (DR-0973).
 *
 * A DOM-only witness cannot catch the 2026-10-11 fault: the card read
 * "1-bed multi-family in Champaign, Illinois", which is character for
 * character what a genuine one-bedroom reads. The fact that made it wrong —
 * that the door is a bed in a shared room — is not on the page.
 *
 * So this compares TWO readings of the same door:
 *   - `level`: derived from what the door is CALLED (rentals.unit +
 *     display_name), independently of `rentable_level`, which is the column
 *     that was NULL on every door and broke three surfaces at once.
 *   - `label`: what public_vacancies() tells the shelf to print.
 *
 * A door called a bed that the shelf advertises with a bedroom count is the
 * disagreement, and it is the founding incident exactly.
 *
 * @param {{level:string, label:string, photos:number}[]} rows
 * @returns {{findings:string[], warnings:string[], checked:number}}
 */
export function judgeDoorsAgainstShelf(rows) {
  const findings = [];
  const warnings = [];
  const list = Array.isArray(rows) ? rows : [];
  let checked = 0;

  for (const r of list) {
    const level = String(r && r.level || '').toLowerCase();
    if (level !== 'bed' && level !== 'room') continue; // a whole unit counts its bedrooms honestly
    checked += 1;
    const label = String(r && r.label || '');
    const photos = Number(r && r.photos) || 0;

    if (/\d+(?:\.\d+)?-bed/i.test(label)) {
      findings.push(`a door CALLED a ${level} is advertised as "${label}" — a bedroom count on a shared door is the 2026-10-11 fault`);
    }
    if (!/shared/i.test(label)) {
      findings.push(`a door CALLED a ${level} is advertised as "${label}" — it never says it is shared`);
    }
    if (photos === 0) {
      // A warning, not a finding: a door nobody has photographed and whose
      // apartment has none either is honest, just empty.
      warnings.push(`a door CALLED a ${level} is offered no photographs at all (own or borrowed) — check the sibling borrow`);
    }
  }
  return { findings, warnings, checked };
}

/** Parse the pipe-separated rows live-sql.sh prints. Pure. */
export function parseDoorRows(text) {
  return String(text || '')
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => /^(bed|room|unit)\|/.test(l))
    .map((l) => {
      const [level, label, photos] = l.split('|');
      return { level, label, photos: Number(photos) || 0 };
    });
}
