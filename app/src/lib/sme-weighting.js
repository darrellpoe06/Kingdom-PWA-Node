// =============================================================================
// sme-weighting — who knows which tab, so their feedback is prioritized
// =============================================================================
// Darrell 2026-07-05: "I would like to see who likes which tabs so their
// feedback will be prioritized because they would be considered SMEs (subject
// matter experts) — everyone will eventually have their issue so we might as
// well fix it fast."
//
// The signal we already have WITHOUT a new migration: attributed feedback rows
// carry a submitter name + the tab/area they were about. A person who keeps
// engaging an area is that area's subject-matter expert; their issue there is
// the leading edge of everyone's, so we surface them and PRIORITIZE their
// feedback on that area.
//
// PRIVACY (DATA-AS-EMPOWERMENT): only submitters who CHOSE to be credited count
// toward SME standing. Anonymous feedback (the default) is fully counted as
// feedback but never attributed to a person — an anonymous submitter is never
// named as an SME. That's the whole point of the toggle.
//
// Pure, deterministic, node-testable (DR-0076). No I/O, no LLM.
// =============================================================================

// The tab/area a feedback item is about, from whichever shape it arrives in.
export function itemTab(item = {}) {
  return String(item.currentView || item.which_tab || item.area || '').trim() || 'overview';
}

// The attributed submitter name, or null if this item is anonymous / unnamed.
// Anonymous = the submitter kept the default (or is_confidential), or the name
// was scrubbed to 'Anonymous' by feedback-sync. Those never earn SME standing.
export function attributedName(item = {}) {
  if (item.isAnonymous === true) return null;
  if (item.isConfidential === true || item.is_confidential === true) return null;
  const n = String(item.displayName || item.display_name || '').trim();
  if (!n || n.toLowerCase() === 'anonymous') return null;
  return n;
}

// computeTabExperts(items) → { [tab]: [{ name, count, lastAt }] } ranked by
// engagement (most feedback on that tab first, then most recent). Only
// attributed items count. This is the "who likes / knows which tabs" map.
export function computeTabExperts(items = []) {
  const byTab = {};
  for (const item of Array.isArray(items) ? items : []) {
    const name = attributedName(item);
    if (!name) continue;
    const tab = itemTab(item);
    const at = item.createdAt || item.submittedAt || item.submitted_at || null;
    byTab[tab] = byTab[tab] || {};
    const rec = byTab[tab][name] || { name, count: 0, lastAt: null };
    rec.count += 1;
    if (at && (!rec.lastAt || String(at) > String(rec.lastAt))) rec.lastAt = at;
    byTab[tab][name] = rec;
  }
  const out = {};
  for (const [tab, people] of Object.entries(byTab)) {
    out[tab] = Object.values(people).sort(
      (a, b) => (b.count - a.count) || (String(b.lastAt || '').localeCompare(String(a.lastAt || ''))) || a.name.localeCompare(b.name)
    );
  }
  return out;
}

// The submitter's rank among a tab's experts (0 = top expert), or null if they
// are not an attributed expert for that tab.
export function expertRankFor(name, tab, experts = {}) {
  if (!name) return null;
  const list = experts[tab] || [];
  const i = list.findIndex((e) => e.name === name);
  return i < 0 ? null : i;
}

// smeSignal(item, experts) → how much to prioritize this item because its
// submitter is a known expert for its tab. Combine with feedback-triage's
// priorityRank (0 = worst/most-urgent): an SME's note gets pulled UP.
//   { isSME, tabRank, weight }
//   weight: 0 (not an SME) .. up to 3 (the tab's #1 expert). Higher = prioritize.
export function smeSignal(item = {}, experts = {}) {
  const name = attributedName(item);
  const tab = itemTab(item);
  const rank = expertRankFor(name, tab, experts);
  if (rank === null) return { isSME: false, tabRank: null, weight: 0 };
  // Top expert = 3, 2nd = 2, 3rd = 1, deeper = still an SME but weight 1.
  const weight = rank === 0 ? 3 : rank === 1 ? 2 : 1;
  return { isSME: true, tabRank: rank, weight };
}

// Sort a list of feedback items so SME-authored notes on their own areas rise,
// then by the triage priorityRank (if present), then most-recent. STABLE and
// non-mutating (returns a new array). `triageOf` maps an item → its evaluation
// (e.g. evaluateFeedback) so we don't couple this module to the triage rules.
export function prioritizeBySme(items = [], experts = {}, triageOf = () => ({ priorityRank: 2 })) {
  const scored = (Array.isArray(items) ? items : []).map((item, i) => {
    const sme = smeSignal(item, experts);
    const tri = triageOf(item) || {};
    const priorityRank = Number.isFinite(tri.priorityRank) ? tri.priorityRank : 2;
    return { item, i, weight: sme.weight, isSME: sme.isSME, priorityRank, at: item.createdAt || item.submittedAt || '' };
  });
  scored.sort((a, b) =>
    (b.weight - a.weight) ||            // SME weight first (higher = prioritize)
    (a.priorityRank - b.priorityRank) || // then triage severity (0 = worst first)
    (String(b.at).localeCompare(String(a.at))) || // then most recent
    (a.i - b.i)                          // stable
  );
  return scored.map((s) => ({ ...s.item, sme: { isSME: s.isSME, weight: s.weight } }));
}
