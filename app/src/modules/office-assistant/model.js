// =============================================================================
// office-assistant/model — the office-AGNOSTIC referral + assistant engine
// =============================================================================
// The standalone, reusable App Module (Darrell's original request: "a standalone
// App Module we can use for other offices or PoeTech App builds in the future").
// This is the generalized version of what lived hardcoded in lib/referral-ops.js:
// the SAME factories + derivations, but every office-specific value (categories,
// geographic circles, targets, templates, seeds) comes from a CONFIG instead of
// being baked in. TLC Therapy Solutions is now just the first config
// (configs/tlc.js); a new office is a new config file, never a fork.
//
// `createOfficeModel(config)` returns the config-bound pure functions the store
// (store.js) and the UI (OfficeAssistant.jsx) sit on. PURE + DETERMINISTIC
// (DR-0076): no localStorage, no Date.now — callers pass `now` (ISO).
//
// CONFIDENTIALITY / NO PHI (binding, per the office's config.noPhiNote): this
// engine holds REFERRAL SOURCES — organizations and their office contacts — never
// clients and never protected health information. That line is not crossed here.
// =============================================================================

const asStr = (v) => (typeof v === 'string' ? v : '');
const asNum = (v, d = 0) => (Number.isFinite(Number(v)) ? Number(v) : d);
const asArr = (v) => (Array.isArray(v) ? v : []);
const rid = (p, seed) => `${p}-${asStr(seed) || Math.random().toString(36).slice(2, 9)}`;

function sameDay(aIso, bIso) {
  const a = Date.parse(asStr(aIso)); const b = Date.parse(asStr(bIso));
  if (!Number.isFinite(a) || !Number.isFinite(b)) return false;
  const da = new Date(a); const db = new Date(b);
  return da.getUTCFullYear() === db.getUTCFullYear() && da.getUTCMonth() === db.getUTCMonth() && da.getUTCDate() === db.getUTCDate();
}
function withinDays(iso, nowIso, days) {
  const t = Date.parse(asStr(iso)); const n = Date.parse(asStr(nowIso));
  if (!Number.isFinite(t) || !Number.isFinite(n)) return false;
  const diff = (n - t) / 86400000;
  return diff >= 0 && diff < days;
}

// The shared merge (user rows win over seeds by id) + the seed-id convention.
export function mergeSeed(userRows, seeds) {
  const byId = new Map();
  for (const s of asArr(seeds)) if (s && s.id) byId.set(s.id, s);
  for (const u of asArr(userRows)) if (u && u.id) byId.set(u.id, u);
  return Array.from(byId.values());
}
export const isSeedId = (id) => typeof id === 'string' && id.startsWith('seed-');

// createOfficeModel — bind every factory + derivation to ONE office's config.
export function createOfficeModel(config) {
  const cfg = config || {};
  const categories = asArr(cfg.referralCategories);
  const circles = asArr(cfg.geoCircles);
  const outcomes = asArr(cfg.outcomes);
  const platforms = asArr(cfg.socialPlatforms);
  const postStatuses = asArr(cfg.postStatuses);
  const dailyRotation = cfg.dailyRotation || {};
  const weeklyTargets = cfg.weeklyTargets || {};
  const networkGoalCfg = cfg.networkGoal || { low: 0, high: 0 };
  const dailyTarget = asNum(cfg.dailyTargetContacts, 0);

  const referralCategory = (id) => categories.find((c) => c.id === asStr(id)) || null;
  const geoCircle = (name) => circles.find((c) => c.name === asStr(name)) || null;
  const outcome = (id) => outcomes.find((o) => o.id === asStr(id)) || outcomes[0] || { id: 'none', label: 'No response yet', open: true };

  const firstCategoryId = categories[0] ? categories[0].id : '';
  const firstCircleName = circles[0] ? circles[0].name : '';

  function makeOrg(partial = {}, { now = '' } = {}) {
    const p = partial || {};
    return {
      id: asStr(p.id) || rid('org'),
      organization: asStr(p.organization),
      categoryId: referralCategory(p.categoryId) ? p.categoryId : firstCategoryId,
      type: asStr(p.type),
      circle: geoCircle(p.circle) ? p.circle : firstCircleName,
      contactPerson: asStr(p.contactPerson),
      jobTitle: asStr(p.jobTitle),
      email: asStr(p.email),
      phone: asStr(p.phone),
      website: asStr(p.website),
      address: asStr(p.address),
      flyerSent: !!p.flyerSent,
      emailedOn: asStr(p.emailedOn) || null,
      calledOn: asStr(p.calledOn) || null,
      followUpOn: asStr(p.followUpOn) || null,
      outcomeId: outcome(p.outcomeId).id,
      clientsReferred: Math.max(0, asNum(p.clientsReferred, 0)),
      notes: asStr(p.notes),
      addedIso: asStr(p.addedIso) || asStr(now) || null,
    };
  }

  function makePost(partial = {}, { now = '' } = {}) {
    const p = partial || {};
    return {
      id: asStr(p.id) || rid('post'),
      theme: asStr(p.theme),
      caption: asStr(p.caption),
      platforms: asArr(p.platforms).filter((x) => platforms.includes(x)),
      hashtags: asStr(p.hashtags),
      status: postStatuses.includes(p.status) ? p.status : (postStatuses[0] || 'idea'),
      isReel: !!p.isReel,
      scheduledFor: asStr(p.scheduledFor) || null,
      createdIso: asStr(p.createdIso) || asStr(now) || null,
    };
  }

  function makeIdea(partial = {}, { now = '' } = {}) {
    const p = partial || {};
    return { id: asStr(p.id) || rid('idea'), text: asStr(p.text), createdIso: asStr(p.createdIso) || asStr(now) || null };
  }

  // A daily-schedule block (the editable work-time rows). Darrell (2026-07-14):
  // "a general schedule ... adjust work times and tasks". Time + task name + the
  // detail are all user-editable; the id is stable so an edit updates in place.
  function makeBlock(partial = {}) {
    const p = partial || {};
    return { id: asStr(p.id) || rid('block'), time: asStr(p.time), name: asStr(p.name), detail: asStr(p.detail) };
  }

  function validateOrg(partial) {
    if (!asStr(partial && partial.organization).trim()) return { ok: false, error: 'An organization name is required.' };
    if (!referralCategory(partial && partial.categoryId)) return { ok: false, error: 'Pick a category.' };
    return { ok: true };
  }

  function categoryForDay(nowIso) {
    const t = Date.parse(asStr(nowIso));
    if (!Number.isFinite(t)) return null;
    return referralCategory(dailyRotation[new Date(t).getUTCDay()]);
  }

  function orgStats(orgs) {
    const list = asArr(orgs);
    const byCategory = {}; const byCircle = {};
    for (const o of list) {
      byCategory[o.categoryId] = (byCategory[o.categoryId] || 0) + 1;
      byCircle[o.circle] = (byCircle[o.circle] || 0) + 1;
    }
    return {
      total: list.length, byCategory, byCircle,
      flyersSent: list.filter((o) => o.flyerSent).length,
      interested: list.filter((o) => outcome(o.outcomeId).good).length,
    };
  }

  function followUpsDue(orgs, nowIso) {
    const n = Date.parse(asStr(nowIso));
    return asArr(orgs).filter((o) => {
      if (!o.followUpOn) return false;
      const t = Date.parse(o.followUpOn);
      return Number.isFinite(t) && Number.isFinite(n) && t <= n && outcome(o.outcomeId).open;
    });
  }

  function dailyReport(orgs, posts, nowIso) {
    const list = asArr(orgs);
    const contactsAdded = list.filter((o) => sameDay(o.addedIso, nowIso)).length;
    return {
      contactsAdded,
      emailsSent: list.filter((o) => sameDay(o.emailedOn, nowIso)).length,
      callsMade: list.filter((o) => sameDay(o.calledOn, nowIso)).length,
      followUpsNeeded: followUpsDue(list, nowIso).length,
      postsCreated: asArr(posts).filter((p) => sameDay(p.createdIso, nowIso)).length,
      dailyTarget,
      metTarget: contactsAdded >= dailyTarget,
    };
  }

  function weeklyProgress(orgs, posts, nowIso) {
    const list = asArr(orgs); const pl = asArr(posts);
    const row = (n, t) => ({ n, min: (t && t.min) || 0, max: (t && t.max) || 0, pct: (t && t.min > 0) ? Math.min(100, Math.round((n / t.min) * 100)) : 100 });
    return {
      contacts: row(list.filter((o) => withinDays(o.addedIso, nowIso, 7)).length, weeklyTargets.contacts),
      emails: row(list.filter((o) => withinDays(o.emailedOn, nowIso, 7)).length, weeklyTargets.emails),
      calls: row(list.filter((o) => withinDays(o.calledOn, nowIso, 7)).length, weeklyTargets.calls),
      posts: row(pl.filter((p) => withinDays(p.createdIso, nowIso, 7)).length, weeklyTargets.posts),
      reels: row(pl.filter((p) => p.isReel && withinDays(p.createdIso, nowIso, 7)).length, weeklyTargets.reels),
    };
  }

  function topConvertingSources(orgs, limit = 5) {
    const list = asArr(orgs).filter((o) => asNum(o.clientsReferred, 0) > 0)
      .sort((a, b) => asNum(b.clientsReferred, 0) - asNum(a.clientsReferred, 0));
    const byCategory = {}; let totalReferred = 0;
    for (const o of asArr(orgs)) {
      const n = asNum(o.clientsReferred, 0);
      if (n > 0) { byCategory[o.categoryId] = (byCategory[o.categoryId] || 0) + n; totalReferred += n; }
    }
    return { sources: list.slice(0, limit), byCategory, totalReferred };
  }

  function networkGoal(orgs) {
    const total = asArr(orgs).length;
    const low = asNum(networkGoalCfg.low, 0);
    return { total, low, high: asNum(networkGoalCfg.high, 0), pct: low > 0 ? Math.min(100, Math.round((total / low) * 100)) : 100 };
  }

  // The seed rows, normalized through this office's factories (SEED-DATA-AS-
  // ASPIRATION): a few clearly-sample sources so the board renders real derived
  // numbers on first open. `seed-` ids so a future cloud sync filters them.
  const seedOrgs = asArr(cfg.seedOrgs).map((o) => makeOrg(o, { now: o.addedIso || '' }));
  const seedPosts = asArr(cfg.seedPosts).map((p) => makePost(p, { now: p.createdIso || '' }));
  // The default schedule the office starts with (config.dayBlocks), normalized
  // to real editable rows. `seed-block-N` ids so a future cloud sync can tell an
  // untouched default from a staff edit. Once staff edit the schedule the store
  // owns the whole list (their rows are authoritative — no seed resurrection).
  const seedSchedule = asArr(cfg.dayBlocks).map((b, i) => makeBlock({ id: `seed-block-${i + 1}`, ...b }));

  return {
    config: cfg,
    // helpers
    referralCategory, geoCircle, outcome,
    // factories
    makeOrg, makePost, makeIdea, makeBlock, validateOrg,
    // derivations
    categoryForDay, orgStats, followUpsDue, dailyReport, weeklyProgress, topConvertingSources, networkGoal,
    // seeds + merge
    seedOrgs, seedPosts, seedSchedule, mergeSeed, isSeedId,
  };
}
