// =============================================================================
// ip-register — the schedule of intellectual property, as a real engine
// =============================================================================
// Darrell 2026-09-06: "how do I turn PoeTech into intellectual properties?" and
// then the sharper one: "What needs to happen for me to have what is considered
// a real asset?"
//
// WHAT WAS THERE. Nothing. LEGAL-PRIVACY-BOUNDARY.md scopes the Business shelf
// to track "IP — trademark filings, copyright, trade secrets, infringement
// actions", and legal-documents.js offers those three docTypes — so the app can
// shelve the PAPER once a filing exists. It could not answer the prior
// question: what do we own, is it actually protected, and is it an asset yet?
//
// WHAT THIS IS. The pure, node-testable core behind the IP register: the five
// tests that separate an ASSET from work product, the four protection lanes,
// and the honesty rules that stop the register telling us a comfortable lie.
// The register is the "Defined" test made real — the schedule an assignment
// attaches to. Without it there is nothing to assign, and nothing to sell.
//
// ── WHY THIS IS AN ENGINE AND NOT A MARKDOWN TABLE ──
// A hand-kept table drifts, and every value on it is painted. Two findings from
// the 2026-09-06 research-review are exactly the class a painted table hides,
// so they are encoded here as REFUSALS the register cannot talk past:
//
//   1. PUBLIC DISCLOSURE KILLS TRADE SECRET, AND IT IS NOT RECOVERABLE.
//      The repo is public (GitHub API, 2026-09-06: "private": false), so every
//      method published in it — the gate suite, the orchestration ladder, the
//      Composable Spine, the module template — is outside trade-secret reach.
//      A row claiming trade-secret protection over disclosed material is not a
//      row with a stale field; it is a row that would let us believe we hold a
//      right we forfeited. validateAsset REFUSES it.
//
//   2. AUTHORSHIP IS NOT A DEFAULT, BECAUSE OVERSTATING IT VOIDS THE FILING.
//      US copyright requires human authorship; purely generated material is not
//      protectable, and a knowingly inaccurate application can invalidate the
//      registration it was meant to secure. So `authorship` starts NULL and is
//      REFUSED as null — the register cannot hold a work whose authorship
//      nobody decided, and a `generated` work cannot be marked registrable.
//
// Both mirror the `privileged`-is-mandatory rule in legal-documents.js: on a
// surface whose entire value is trust, a default that saves silently produces
// rows nobody ever decided.
//
// NOT LEGAL ADVICE. The lanes below encode the SHAPE of the protections so the
// register stays honest; which ones to pursue is counsel's call, per the
// research-review's per-item owners.
//
// PURE BY DESIGN: no browser APIs, no storage, no network — testable in node,
// so the honesty rules above are PROVEN-TO-CATCH (DR-0076 §3) rather than
// asserted.
// =============================================================================

// ---------------------------------------------------------------------------
// The five tests. An item passing all five is an ASSET; anything short of that
// is work product, however good it is. Order matters: each later test is
// meaningless without the earlier ones (you cannot transfer what you do not
// own), so the register reports the FIRST failing test as the bottleneck.
// ---------------------------------------------------------------------------
export const ASSET_TESTS = [
  {
    id: 'owned',
    label: 'Owned',
    asks: 'Does a named legal entity hold title, in writing?',
    why: 'Copyright vests in the human author personally. An entity does not automatically own founder-created work — without a signed assignment there is nothing to sell.',
  },
  {
    id: 'defined',
    label: 'Defined',
    asks: 'Does it have a boundary and a fixation date?',
    why: '"PoeTech" is not an asset. "The Quality Gatekeeper acceptance-criteria engine, v1.0, fixed 2026-09-06" is.',
  },
  {
    id: 'excludable',
    label: 'Excludable',
    asks: 'Can a third party lawfully be stopped from using it?',
    why: 'No exclusion means no scarcity, and no scarcity means no value, however much work it took.',
  },
  {
    id: 'transferable',
    label: 'Transferable',
    asks: 'Can it be assigned or licensed separately from the founder?',
    why: 'An asset a buyer cannot receive without hiring you is not an asset; it is a job.',
  },
  {
    id: 'monetised',
    label: 'Monetised',
    asks: 'Is there a signed licence, sale, or attributable revenue?',
    why: 'Internally-built intangibles are generally expensed, not capitalised. The first signed licence is the asset event, more than the filing is.',
  },
];

export const TEST_IDS = ASSET_TESTS.map((t) => t.id);

// ---------------------------------------------------------------------------
// The four lanes. `survivesGeneration` records whether the protection cares who
// or what authored the underlying work — the single fact that reorders this
// list for an AI-built portfolio and puts trademark first.
// ---------------------------------------------------------------------------
export const IP_LANES = [
  {
    id: 'trademark',
    label: 'Trademark',
    protects: 'Names and marks used in commerce.',
    survivesGeneration: true,
    survivesDisclosure: true,
    blurb: 'Unaffected by who authored the code, which is why it leads for this portfolio. Rights arise from use in commerce; an intent-to-use filing stakes a priority date before launch.',
  },
  {
    id: 'copyright',
    label: 'Copyright',
    protects: 'Fixed expression — prose, doctrine, code, selection and arrangement.',
    survivesGeneration: false,
    survivesDisclosure: true,
    blurb: 'Attaches on fixation; registration is what buys standing to sue and statutory damages. Requires human authorship — generated material is disclosed and disclaimed, not claimed.',
  },
  {
    id: 'trade-secret',
    label: 'Trade secret',
    protects: 'Methods, architectures, and know-how.',
    survivesGeneration: true,
    survivesDisclosure: false,
    blurb: 'The only lane that protects METHODS. Requires secrecy plus reasonable measures to keep it. Publication forfeits it permanently — nothing already public can be pulled back.',
  },
  {
    id: 'patent',
    label: 'Patent',
    protects: 'Novel, non-obvious inventions.',
    survivesGeneration: false,
    survivesDisclosure: false,
    blurb: 'Requires a natural-person inventor. Public disclosure starts a one-year US clock and forfeits most foreign rights outright.',
  },
];

export const LANE_IDS = IP_LANES.map((l) => l.id);

export function laneById(id) {
  return IP_LANES.find((l) => l.id === id) || null;
}

export function isLaneId(id) {
  return LANE_IDS.includes(id);
}

// ---------------------------------------------------------------------------
// Authorship. Deliberately has no default: see rule 2 in the header.
// ---------------------------------------------------------------------------
export const AUTHORSHIP = [
  {
    id: 'human',
    label: 'Human-authored',
    registrable: true,
    note: 'Declarations, directives, doctrine, and the creative selection and arrangement of a corpus.',
  },
  {
    id: 'mixed',
    label: 'Human-directed, AI-expressed',
    registrable: true,
    note: 'Registrable WITH the generated portions disclosed and disclaimed. Do not overstate the human share.',
  },
  {
    id: 'generated',
    label: 'AI-generated',
    registrable: false,
    note: 'Not protectable by copyright. May still be covered by trademark or trade secret, which do not turn on authorship.',
  },
];

export const AUTHORSHIP_IDS = AUTHORSHIP.map((a) => a.id);

export function authorshipById(id) {
  return AUTHORSHIP.find((a) => a.id === id) || null;
}

// Protection status is a fact about the world, not an intention. "planned" is
// explicitly NOT protection — the register must never let a plan read as a right.
export const PROTECTION_STATUS = ['none', 'planned', 'filed', 'registered'];

export function isProtected(status) {
  return status === 'filed' || status === 'registered';
}

// ---------------------------------------------------------------------------
// The asset shape.
// ---------------------------------------------------------------------------
export function newAssetId() {
  return `ip_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export function assetShape({
  id,
  name = '',
  lane = null,
  owner = null,             // the entity holding title; null = nobody yet
  assigned = false,         // a WRITTEN assignment exists into that owner
  fixedOn = '',             // ISO date the work was fixed
  authorship = null,        // never defaults — see rule 2
  publiclyDisclosed = null, // never defaults — see rule 1
  protection = 'none',
  provenance = [],          // DR ids, file paths, commit SHAs
  licensed = false,         // a signed licence or sale exists
  notes = '',
} = {}) {
  return {
    id: id || newAssetId(),
    name: String(name || '').trim(),
    lane,
    owner: owner ? String(owner).trim() : null,
    assigned: Boolean(assigned),
    fixedOn: String(fixedOn || '').trim(),
    authorship,
    publiclyDisclosed,
    protection: PROTECTION_STATUS.includes(protection) ? protection : 'none',
    provenance: Array.isArray(provenance) ? provenance.filter(Boolean).map(String) : [],
    licensed: Boolean(licensed),
    notes: String(notes || ''),
  };
}

// ---------------------------------------------------------------------------
// validateAsset — the refusals. Each one exists because the comfortable
// alternative is a row that would let us believe we hold a right we do not.
// ---------------------------------------------------------------------------
export function validateAsset(asset) {
  if (!asset || typeof asset !== 'object') {
    return { ok: false, message: 'No asset record to check.' };
  }
  if (!asset.name) {
    return { ok: false, message: 'An asset needs a name. "The repo" is not a boundary.' };
  }
  if (!isLaneId(asset.lane)) {
    return { ok: false, message: 'Choose a protection lane — trademark, copyright, trade secret, or patent.' };
  }
  if (asset.authorship === null || asset.authorship === undefined) {
    return {
      ok: false,
      message: 'Authorship is undecided. Overstating the human share can invalidate a registration, so this cannot be left unset.',
    };
  }
  if (!AUTHORSHIP_IDS.includes(asset.authorship)) {
    return { ok: false, message: `"${asset.authorship}" is not a known authorship value.` };
  }
  if (asset.publiclyDisclosed === null || asset.publiclyDisclosed === undefined) {
    return {
      ok: false,
      message: 'Public-disclosure status is undecided. Trade secret and patent both turn on it, so it cannot be left unset.',
    };
  }

  const lane = laneById(asset.lane);

  // Rule 1 — the finding, as a refusal.
  if (asset.publiclyDisclosed && !lane.survivesDisclosure && isProtected(asset.protection)) {
    return {
      ok: false,
      message: `"${asset.name}" is publicly disclosed, so ${lane.label.toLowerCase()} protection is not available for it. Disclosure is not recoverable — record it as none.`,
    };
  }

  // Rule 2 — the finding, as a refusal.
  if (asset.authorship === 'generated' && !lane.survivesGeneration && isProtected(asset.protection)) {
    return {
      ok: false,
      message: `"${asset.name}" is AI-generated, so it is not protectable by ${lane.label.toLowerCase()}. Trademark or trade secret may still apply; this lane does not.`,
    };
  }

  // An assignment is INTO someone. Assigned-to-nobody is the exact gap that
  // leaves an entity owning nothing while the schedule says otherwise.
  if (asset.assigned && !asset.owner) {
    return { ok: false, message: 'An assignment needs an owner to assign into. Name the entity holding title.' };
  }

  return { ok: true };
}

// ---------------------------------------------------------------------------
// scoreAsset — computed, never painted. Returns each test and the FIRST one
// failing, because that is the only one worth working on next.
// ---------------------------------------------------------------------------
export function scoreAsset(asset) {
  const lane = laneById(asset?.lane);
  const disclosureKills = Boolean(asset?.publiclyDisclosed) && lane && !lane.survivesDisclosure;
  const generationKills = asset?.authorship === 'generated' && lane && !lane.survivesGeneration;

  const results = {
    owned: Boolean(asset?.owner && asset?.assigned),
    defined: Boolean(asset?.name && asset?.fixedOn),
    excludable: isProtected(asset?.protection) && !disclosureKills && !generationKills,
    transferable: Boolean(asset?.owner && asset?.assigned),
    monetised: Boolean(asset?.licensed),
  };

  const passed = TEST_IDS.filter((id) => results[id]);
  const bottleneck = TEST_IDS.find((id) => !results[id]) || null;

  return {
    results,
    passedCount: passed.length,
    total: TEST_IDS.length,
    isAsset: passed.length === TEST_IDS.length,
    bottleneck,
  };
}

export function portfolioScore(list) {
  const assets = Array.isArray(list) ? list : [];
  const scored = assets.map((a) => ({ asset: a, score: scoreAsset(a) }));
  const byTest = {};
  for (const id of TEST_IDS) byTest[id] = scored.filter((s) => s.score.results[id]).length;
  return {
    count: assets.length,
    fullAssets: scored.filter((s) => s.score.isAsset).length,
    byTest,
    scored,
  };
}

// ---------------------------------------------------------------------------
// forfeitedByDisclosure — the leak report. Names what publication has already
// cost, so it reads as a measured number rather than a worry.
// ---------------------------------------------------------------------------
export function forfeitedByDisclosure(list) {
  return (Array.isArray(list) ? list : []).filter((a) => {
    const lane = laneById(a?.lane);
    return Boolean(a?.publiclyDisclosed) && lane && !lane.survivesDisclosure;
  });
}

// unregistrableByAuthorship — the same honesty applied to the copyright lane.
export function unregistrableByAuthorship(list) {
  return (Array.isArray(list) ? list : []).filter((a) => {
    const lane = laneById(a?.lane);
    return a?.authorship === 'generated' && lane && !lane.survivesGeneration;
  });
}

export function assetsInLane(list, laneId) {
  return (Array.isArray(list) ? list : []).filter((a) => a?.lane === laneId);
}

export function laneCounts(list) {
  const counts = {};
  for (const id of LANE_IDS) counts[id] = 0;
  for (const a of Array.isArray(list) ? list : []) {
    if (isLaneId(a?.lane)) counts[a.lane] += 1;
  }
  return counts;
}

export function normalizeAssets(list) {
  if (!Array.isArray(list)) return [];
  return list.filter((a) => a && typeof a === 'object' && a.name).map((a) => assetShape(a));
}
