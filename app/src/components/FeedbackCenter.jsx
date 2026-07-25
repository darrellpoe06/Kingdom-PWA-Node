// =============================================================================
// FeedbackCenter — the SME-review feedback form + the promote queue
// =============================================================================
// Extracted from the monolith (poe-financial-mvp-v28.jsx) as part of the
// hybrid-modular reduction (DR-0078): the feedback capture modal (area picker
// mirroring the live nav, category + rating, screenshots) and the staff-side
// promote panel that turns feedback rows into Projects / Incidents / Change
// requests. Extraction converted the surface to the enforced standard: rem
// fonts (no text-[Npx]), no device-font emoji (UiIcon where a glyph earns its
// place), no width-cap classes — this file carries NO consistency-guard
// baseline debt on purpose.
import React, { useState } from 'react';
import { Queue } from './Queue.jsx';
import { queueFreshness, QUEUE_STALE_DAYS } from '../lib/queue-freshness.js';
import { compressImageFile, isLikelyImageFile } from '../lib/image.js';
import { filesFromClipboardEvent } from '../lib/paste-input.js';
import { extractRequirementsFromThoughts } from '../lib/requirements-intake.js';
import { saveExtraction } from '../lib/use-discovery.js';
// The library count derives from the registry itself (DR-0121 — the hand-typed
// "~46" was already stale at 49 when the 2026-07-10 static-data hunt found it).
import { OPPORTUNITY_LIBRARY } from '../lib/opportunity-capacity.js';
import UiIcon from './UiIcon.jsx';

// Round 12 — Feedback form refreshed to reflect every surface we've actually
// shipped through MVP v1.5. Area dropdown now mirrors the live nav + the major
// in-tab features (Action Queue, Capacity meter, Buffer Fund, Property
// Valuation, Inventory Forecast, Tier Switcher, etc.) so testers can pin
// notes to a specific surface. Adds a category picker (Bug · Confusion · Idea
// · Praise · Copy / wording · Performance · Accessibility) so we can triage
// the SME-review feedback by type. Pre-fills the user's currently-viewed tab.
// FEEDBACK_AREAS — the "Which area?" list in the SME-review feedback form.
// It MIRRORS the app's nav tree so a reviewer can give feedback on EVERY surface,
// grouped by top-level tab with sub-tabs/sub-features indented (└). The nav itself
// is the source of truth for the STRUCTURE — when a tab or sub-tab is added there,
// add a matching entry here so this list never goes stale again. Nav locations:
//   • Top-level tabs  — the <nav> array (~line 4505 in this file)
//   • Books sub-tabs  — the Books sub-nav (~line 4533 in this file)
//   • Church sub-tabs — the Church sub-nav (~line 4544 in this file)
//   • Choir sub-tabs  — TABS in components/Choir.jsx
//   • Projects/Build  — tabs in components/Projects.jsx (Build · Decisions · Review · Loops)
// Sub-features finer than nav (e.g. Buffer Fund, the cross-reference strip) stay
// indented under their page on purpose — that granularity is what makes SME
// feedback actionable. Existing keys are STABLE (stored feedback rows reference
// them); only add, don't rename.
export const FEEDBACK_AREAS = [
  { group: 'Big Picture', items: [
    ['overview', 'Big Picture · dashboard'],
    ['action-queue', '└ Action Queue (Changes · Incidents · Projects)'],
    ['capacity-meter', '└ Family Capacity meter'],
    ['xref-strip', '└ Cross-reference strip (rooms · equipment · leases · capex · watchlist)'],
  ]},
  { group: 'Books', items: [
    ['books-entities', 'Books · Entities'],
    ['books-accounts', 'Books · Accounts (cash / credit split)'],
    ['buffer-fund', '└ Buffer Fund (slider + target)'],
    ['debts', 'Books · Debts · Snowball / Avalanche'],
    ['books-transactions', 'Books · Transactions'],
    ['books-forecast', '└ 30/60/90 forecast vs trailing actuals'],
    ['books-imported', 'Books · Imported (bank / statement import)'],
    ['books-cart', 'Books · Subscriptions / Cart'],
    ['books-1099', 'Books · 1099 tracking'],
    ['worker-ops', '└ 1099 · Worker voice (worker perspectives on operations)'],
    ['books-calendar', 'Books · Calendar (recurring · incidents · events)'],
    ['books-legal', 'Books · Legal (entity / account legal flags)'],
  ]},
  { group: 'Inbound', items: [
    ['inbound', 'Inbound · call / inquiry capture → routing'],
  ]},
  { group: 'Messages', items: [
    ['messages', 'Messages · encrypted 1:1 + group threads'],
  ]},
  { group: 'Real Estate', items: [
    ['rentals', 'Real Estate · property list + map'],
    ['rentals-edit', '└ Inline quick-edit on property rows'],
    ['rentals-valuation', '└ Property Valuation (Zillow/Realtor/Redfin lookup + save)'],
    ['rentals-lease', '└ Lease & Tenant Contact'],
    ['rentals-equipment', '└ Mechanical & Equipment inventory'],
    ['rentals-rooms', '└ Rooms & Needed Work tracker'],
    ['rentals-maint', '└ Maintenance log (urgency-banded)'],
    ['rentals-convo', '└ Tenant / vendor conversation log'],
    ['rentals-snowball', '└ 7-year mortgage payoff snowball'],
    ['rentals-evaluator', '└ Investment evaluator (cap rate · DSCR · 1%)'],
    ['rentals-tenant-issue', '└ Tenant Not Paying → issue affordance'],
  ]},
  { group: 'Moore Divahs', items: [
    ['moore', 'Moore Divahs · order board (custom orders · 3-week clock · change orders)'],
  ]},
  { group: 'Projects · Ops', items: [
    ['projects', 'Projects · Timeline + workload'],
    ['scopes', 'Projects · Scope-of-work agreements'],
    ['scope-payment', '└ Scope · materials-paid-by + payment policy'],
    ['inventory-forecast', 'Projects · Inventory & 12-month capital forecast'],
    ['savings-prompts', '└ Savings prompts per capex item'],
    ['build-board', 'Projects · PoeTech Build board (Building · Next · Gated · Shipped lanes)'],
    ['build-kpi', '└ KPI status dots + Key (legend)'],
    ['build-workflows', '└ Workflow status feed'],
    ['build-llm-health', '└ Local-LLM health card'],
    ['concerns-board', 'Projects · Concerns & Solutions board (open · in-progress · done + feedback read-through)'],
    ['perpetual-report', 'Projects · Perpetual Report (portable cross-system history + failures & fixes coverage)'],
    ['governance-decisions', 'Projects · Decisions (Governor governance queue)'],
    ['review-feed', 'Projects · Review (freshness-loop staged proposals)'],
    ['loop-health', 'Projects · Loops (loop-health keep / retire)'],
    ['itsm-taxonomy', 'ITSM taxonomy (Change · Incident · Project)'],
  ]},
  { group: 'Practice · Dev/Ops', items: [
    ['practice', 'Practice · inquiry capture & conversion'],
    ['opportunities', 'Dev/Ops · personalized options engine'],
    ['opportunities-library', `└ Curated opportunity library (${OPPORTUNITY_LIBRARY.length} entries)`],
    ['opportunities-wrap', '└ "Wrap me with the tech" handoff'],
    ['opportunities-pipeline', '└ Active pipeline'],
    ['services-portfolio', '└ PoeTech Services Portfolio'],
    ['skill-profiles', '└ Skill profiles'],
  ]},
  { group: 'Notes', items: [
    ['notes', 'Notes · thinking space (capture → prayer / voice / incident / inquiry)'],
    ['create', 'Create · creation workspace (document → image export)'],
    ['voice', 'Voice · listen to anything (choose a voice · consent-gated enrollment)'],
    ['library', 'Library · books from the corpus + in-app reader (companion deep-links)'],
    ['recipes', "Chef's Corner · recipes (Poe Family Vegan, by Chef Mario · add + paste-import)"],
    ['games', 'Games · the family games hub (Generations: Walking in the Way · life journey measured by Yahweh)'],
    ['tvtime', 'TV Time · the friend-group show tracker + discussion (track · talk · laugh together · watch it through The Way)'],
  ]},
  { group: "Study (private · circle only)", items: [
    ['study', "Darrell's Study · reflections / processing / cultural research (device-local)"],
  ]},
  { group: "Command, Control & Serve Center (steward seat)", items: [
    ['center', 'Center · the steward seat (one cockpit to see / command / control / serve)'],
    ['center-see', '└ See · Operations · Quality / Proof · KPI key (real system state)'],
    ['center-command', '└ Command · braked orchestrator · conflict loop (direct the build)'],
    ['center-control', '└ Control · projects · priorities · discussions (links to Projects)'],
    ['center-serve', '└ Serve · servant-king framing · role-scoped access'],
  ]},
  { group: 'CRM (steward · acquisition backbone)', items: [
    ['crm', 'CRM · the one shared pipeline every funnel rides (TLC · GTM · Boxcar · Real Estate)'],
  ]},
  { group: 'Relationships (steward · permission model)', items: [
    ['relationships', 'Relationships · who can do what by relationship (guardian/child · family · landlord/tenant)'],
    ['relationships-guardian', '└ Guardian & Child · set a child\'s allowed capabilities + the approval queue'],
    ['relationships-landlord', '└ Landlord & Tenant · rent roll · maintenance · rent records (no money moves) · notices · messages'],
  ]},
  { group: 'Forecast (steward · financial engineering)', items: [
    ['forecast', 'Forecast · forward cash-flow projection from real data (per business / family / consolidated)'],
    ['forecast-scenarios', '└ Scenarios · best/base/worst · add property / tier / capital purchase (editable assumptions)'],
    ['forecast-track', '└ Track · projected-vs-actual over time (forecast accuracy)'],
  ]},
  { group: 'Academy (steward/business · cohort operations)', items: [
    ['cohorts', 'Academy · cohort operations (enrollment · tuition/payment plans · weekly-track schedule · team · week-4 retro)'],
  ]},
  { group: 'TLC (steward/business · the whole TLC office)', items: [
    ['tlc', 'TLC · the unified TLC Therapy Solutions workspace (Practice · Intake · Assistant, three views of one office)'],
    ['tlc-assistant', 'Assistant · TLC referral database + admin/marketing assistant (referral network · outreach · content calendar · weekly goals · Ari path)'],
  ]},
  { group: 'Access & Usage (steward · access governance)', items: [
    ['access', 'Access & Usage · who has access (role · scope) + counts/activity + build-freshness (rollout management)'],
  ]},
  { group: "Chef's Corner — Kitchen Inventory (steward · homed in Chef's Corner)", items: [
    ['kitchen', "Kitchen Inventory · Chef Mario's inventory, in Chef's Corner (count by weight/unit · par alerts · value)"],
    ['kitchen-stock', '└ Stock · items by category / storage area · on-hand + value (derived)'],
    ['kitchen-counts', '└ Counts · physical count → variance + shrink → reconcile the ledger'],
    ['kitchen-costing', '└ Recipe Costing · plate cost from item costs · coverage · food-cost % + margin'],
  ]},
  { group: 'Church', items: [
    ['church', 'Church · service times / media / prayer / ministry'],
    ['church-conference', '└ Conference · COLG National Assembly (schedule · meals · sessions)'],
    ['church-event-center', '└ Event Center · room / event requests'],
    ['church-events', '└ Venues · community use of the two campuses (requests · calendar · responsibilities · revenue)'],
    ['church-projects', 'Church · Projects (the Love Corner project board — video wall · ministries · Assembly · infra · door · outreach)'],
    ['church-engagement', 'Church · Engagement (trivia + messages)'],
    ['church-bus', 'Church · Bus Ministry (drivers · routes · schedule · reminders · messages · meetings)'],
    ['church-program', 'Church · Order of Service (master program → per-sector derived views · timing reflow)'],
    ['church-learn', 'Church · Learn (Learning A.I. The Way class)'],
    ['church-eternal-algorithms', 'Church · Eternal Algorithms (if/then studies · self-examination → game)'],
    ['church-harvest', 'Church · Harvest Ledger (staff: no video lost — every recording fully mined)'],
    ['church-videowall', 'Church · Video Wall (sanctuary LED capital project — budget · donations · spec)'],
    ['church-devices', 'Church · Device Inventory (staff: asset register — NAS · GPU nodes · VX1000 · LED wall · network · cameras · sound + idle-GPU compute pool)'],
    ['church-infra-plan', 'Church · Infra Plan (staff: 5x3090 sovereign rig + on-prem cameras roadmap; VISION-FAIRNESS gate)'],
    ['church-observe', 'Church · Observation (staff room-photo board)'],
    ['church-pulpit', "Church · The Word — Migdal (Bishop's study — historical sermons + corpus-grounded prep)"],
    ['church-scripture', 'Church · Scripture (themed, depth-adaptive KJV library — His perspective + His love, for the soul)'],
    ['pulpit-library', '└ The Word — Migdal · Message library (watch · document · reuse)'],
    ['pulpit-prep', '└ The Word — Migdal · Prep from your corpus'],
    ['church-choir', 'Church · Choir (director hub)'],
    ['choir-week', '└ Choir · This week'],
    ['choir-songs', '└ Choir · Songs (Song Workshop)'],
    ['choir-songbook', '└ Choir · Songbook (cross-referenced)'],
    ['choir-schedule', '└ Choir · Schedule'],
    ['choir-teamdocs', '└ Choir · Team Docs'],
    ['choir-availability', '└ Choir · Availability'],
    ['choir-messages', '└ Choir · Messages'],
    ['choir-resources', '└ Choir · Resources'],
    ['choir-roster', '└ Choir · Roster'],
  ]},
  { group: 'Markets', items: [
    ['markets', 'Markets · watchlist (Stooq feed)'],
  ]},
  { group: 'About · Tiers · System', items: [
    ['about-pricing', 'About · pricing tiers + features'],
    ['about-modules', 'About · planned modules + vote'],
    ['about-markets', 'About · markets we serve'],
    ['about-community', 'About · community partnership model'],
    ['tier-gating', 'Tier gating (Foundation / PoeTech+ / Family / Premium / Business)'],
    ['tier-switcher', 'Tier switcher (header dropdown)'],
    ['admin', 'Admin · backend controls — people & access, data & loops, system & build, internal surfaces'],
  ]},
  { group: 'Cross-cutting', items: [
    ['navigation', 'Navigation · tab order · separator'],
    ['themes', 'Visual themes (Snow · Glacier · Sapphire · Rose · Midnight)'],
    ['accessibility', 'Accessibility (WCAG 2.1 AA · labels · contrast · keyboard)'],
    ['tts', 'Text-to-Speech / Read aloud'],
    ['notifications', 'Browser reminders / notifications'],
    ['storage', 'Local-first storage / load / save'],
    ['install-pwa', 'Install / PWA (Add to Home Screen · update prompt)'],
    ['network-status', 'Network status / offline banner'],
    ['auth-signin', 'Sign-in · multi-point auth · PIN gate'],
    ['mobile', 'Mobile responsiveness'],
    ['performance', 'Performance · render speed'],
    ['copy', 'Copy / wording / clarity'],
    ['other', 'Other'],
  ]},
];
export const FEEDBACK_CATEGORIES = [
  { key: 'bug',          label: 'Bug',           accent: '#B85838' },
  { key: 'confusion',    label: '❓ Confusion',     accent: '#D97706' },
  { key: 'idea',         label: 'Idea / feature',accent: '#1F6FEB' },
  { key: 'copy',         label: '✏Copy / wording',accent: '#5A5751' },
  { key: 'accessibility',label: 'Accessibility', accent: '#5A6E3D' },
  { key: 'performance',  label: 'Performance',   accent: '#D97706' },
  { key: 'praise',       label: '✨ Praise',         accent: '#5A6E3D' },
];

export function FeedbackModal({ onClose, onSubmit, currentView }) {
  const [rating, setRating] = useState('');
  // Pre-fill area from the currently-active view if it maps to an area key.
  const initialArea = (() => {
    if (currentView === 'rentals') return 'rentals';
    if (currentView === 'books') return 'books-accounts';
    if (currentView === 'debts') return 'debts';
    if (currentView === 'projects') return 'projects';
    if (currentView === 'tlc') return 'tlc';
    if (currentView === 'practice') return 'practice';
    if (currentView === 'opportunities') return 'opportunities';
    if (currentView === 'markets') return 'markets';
    if (currentView === 'church') return 'church';
    if (currentView === 'inbound') return 'inbound';
    if (currentView === 'notes') return 'notes';
    if (currentView === 'admin') return 'admin';
    if (currentView === 'about') return 'about-pricing';
    return 'overview';
  })();
  const [area, setArea] = useState(initialArea);
  const [categories, setCategories] = useState([]);
  const [whatsWorking, setWhatsWorking] = useState('');
  const [whatsNot, setWhatsNot] = useState('');
  const [whatsMissing, setWhatsMissing] = useState('');
  // 2026-06-16 — multi-image. Christina/parishioners asked to attach more than
  // one screenshot at a time ("I can only select one at a time"). `screenshots`
  // is an array of compressed JPEG data URLs; the file input is `multiple` and
  // a new pick APPENDS so several batches accumulate.
  const [screenshots, setScreenshots] = useState([]);
  const [formError, setFormError] = useState('');
  // Images still compressing. Submit WAITS on this — without it, submitting
  // while a big photo was still reading sent the feedback with screenshots:[]
  // and the image silently vanished (Darrell 2026-07-07: "couldn't upload an
  // image last time I tried into the Feedback importer").
  const [readingImages, setReadingImages] = useState(false);

  const toggleCategory = (k) => setCategories(prev => prev.includes(k) ? prev.filter(c => c !== k) : [...prev, k]);

  const onPickImage = async (fileList) => {
    const all = Array.from(fileList || []);
    // Loose gate (isLikelyImageFile): Android picks can carry a blank MIME
    // type — a real photo used to be rejected here as "not an image."
    const files = all.filter(isLikelyImageFile);
    const notImages = all.filter(f => !isLikelyImageFile(f));
    if (files.length === 0) {
      setFormError('That file is not an image — a screenshot or photo works best.');
      return;
    }
    setReadingImages(true);
    setFormError('');
    // Compress each hard: images only need to be legible and they travel in
    // the row, so keep them small. Append so multiple picks accumulate.
    // allSettled: ONE unreadable photo no longer throws away the whole batch.
    const results = await Promise.allSettled(files.map(f => compressImageFile(f, 1280, 0.6)));
    const good = [];
    const failed = [];
    results.forEach((r, i) => {
      // A decode that silently yields an empty/degenerate data URL is a
      // failure too (same guard as the receipts modal) — never attach a blank.
      if (r.status === 'fulfilled' && r.value && r.value.length >= 100) good.push(r.value);
      else failed.push(files[i].name || `image ${i + 1}`);
    });
    if (good.length > 0) setScreenshots(prev => [...prev, ...good]);
    const problems = [];
    if (failed.length) problems.push(`Could not read ${failed.join(', ')}${good.length ? ` — the other ${good.length} attached fine` : ''}. Try again, or pick a different image.`);
    if (notImages.length) problems.push(`Skipped ${notImages.map(f => f.name).join(', ')} (not an image).`);
    setFormError(problems.join(' '));
    setReadingImages(false);
  };
  const removeScreenshot = (i) => setScreenshots(prev => prev.filter((_, j) => j !== i));

  const handleSubmit = () => {
    if (readingImages) {
      setFormError('Still reading your photo — one moment, then tap Submit again.');
      return;
    }
    if (!rating && categories.length === 0 && !whatsWorking && !whatsNot && !whatsMissing && screenshots.length === 0) {
      setFormError('Pick a rating, a category, jot a note, or attach an image — anything is helpful.');
      return;
    }
    onSubmit({ rating, area, categories, whatsWorking, whatsNot, whatsMissing, screenshots });
  };

  const ratings = [
    { key: 'love', label: '✨ Love it', color: '#5A6E3D' },
    { key: 'good', label: 'Good', color: '#5A6E3D' },
    { key: 'okay', label: 'Okay', color: '#5A5751' },
    { key: 'rough', label: 'Rough', color: '#B85838' },
    { key: 'broken', label: 'Broken', color: '#B85838' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-start sm:items-center justify-center p-3 sm:p-6 print:hidden" style={{ backgroundColor: 'rgba(0, 0, 0, 0.6)' }} onClick={onClose}>
      {/* Paste-to-attach (Darrell 2026-07-24): Ctrl/Cmd+V anywhere in the form
          drops a copied screenshot straight into the same compress-and-attach
          pipeline as the file picker — paste is an equal door, not a replacement. */}
      <div className="bg-white border-2 border-[#1A1815] w-full max-h-[90vh] overflow-y-auto" style={{ maxWidth: '42rem' }} onClick={(e) => e.stopPropagation()} onPaste={(e) => { const fs = filesFromClipboardEvent(e); if (fs.length) { e.preventDefault(); onPickImage(fs); } }}>
        <div className="p-5 sm:p-6">
          <div className="flex items-baseline justify-between gap-3 mb-3">
            <div>
              <div className="text-[0.625rem] uppercase tracking-[0.3em] text-[#B85838] font-semibold mb-1">Feedback · MVP v1.5 · SME Review</div>
              <h3 className="text-xl sm:text-2xl" style={{ fontFamily: '"Fraunces", serif', fontWeight: 600, letterSpacing: '-0.02em' }}>Tell us what you think.</h3>
            </div>
            <button type="button" onClick={onClose} className="text-[0.625rem] uppercase tracking-wider text-[#5A5751] hover:text-[#1A1815]">× Close</button>
          </div>
          <p className="text-sm text-[#5A5751] mb-4" style={{ fontFamily: '"Fraunces", serif' }}>
            Anything you share helps. Skip any section — partial feedback is more useful than no feedback. Saved locally; nothing leaves your device until you choose to share it.
          </p>

          <div className="space-y-4">
            <div>
              <div className="text-[0.625rem] uppercase tracking-[0.25em] text-[#5A5751] mb-2 font-semibold">Overall feeling</div>
              <div className="grid grid-cols-5 gap-1">
                {ratings.map(r => (
                  <button key={r.key} type="button" onClick={() => setRating(r.key)} className={`p-2 text-xs border ${rating === r.key ? 'border-[#1A1815] bg-[#FAF8F4]' : 'border-[#E8E4DC] text-[#5A5751]'}`} style={rating === r.key ? { color: r.color, fontWeight: 600 } : {}}>
                    {r.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <div className="text-[0.625rem] uppercase tracking-[0.25em] text-[#5A5751] mb-1 font-semibold">Which area? (sub-features indented)</div>
              <select className="w-full p-2 border border-[#E8E4DC] text-sm bg-[#FAF8F4]" value={area} onChange={e => setArea(e.target.value)}>
                {FEEDBACK_AREAS.map(grp => (
                  <optgroup key={grp.group} label={grp.group}>
                    {grp.items.map(([k, label]) => <option key={k} value={k}>{label}</option>)}
                  </optgroup>
                ))}
              </select>
            </div>

            <div>
              <div className="text-[0.625rem] uppercase tracking-[0.25em] text-[#5A5751] mb-1 font-semibold">Category (pick any that apply)</div>
              <div className="flex flex-wrap gap-1">
                {FEEDBACK_CATEGORIES.map(c => (
                  <button key={c.key} type="button" onClick={() => toggleCategory(c.key)} className="text-xs uppercase tracking-wider px-3 py-1.5 border min-h-[36px] focus:outline focus:outline-2 focus:outline-[#B85838]" style={categories.includes(c.key) ? { backgroundColor: c.accent, color: 'white', borderColor: c.accent } : { color: c.accent, borderColor: c.accent }}>
                    {c.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <div className="text-[0.625rem] uppercase tracking-[0.25em] text-[#5A6E3D] mb-1 font-semibold">✓ What's working</div>
              <textarea className="w-full p-2 border border-[#E8E4DC] text-sm bg-[#FAF8F4]" rows="2" placeholder="What feels right? What helps you?" value={whatsWorking} onChange={e => setWhatsWorking(e.target.value)} />
            </div>

            <div>
              <div className="text-[0.625rem] uppercase tracking-[0.25em] text-[#B85838] mb-1 font-semibold">✗ What's not working / what's confusing</div>
              <textarea className="w-full p-2 border border-[#E8E4DC] text-sm bg-[#FAF8F4]" rows="2" placeholder="Bug · confusion · friction · unclear text · too much · too little · doesn't reflect reality" value={whatsNot} onChange={e => setWhatsNot(e.target.value)} />
            </div>

            <div>
              <div className="text-[0.625rem] uppercase tracking-[0.25em] text-[#B85838] mb-1 font-semibold">+ What's missing / what would help</div>
              <textarea className="w-full p-2 border border-[#E8E4DC] text-sm bg-[#FAF8F4]" rows="2" placeholder="Features you wish existed · workflows that don't fit · what would make this perfect for you" value={whatsMissing} onChange={e => setWhatsMissing(e.target.value)} />
            </div>

            <div>
              <div className="text-[0.625rem] uppercase tracking-[0.25em] text-[#5A5751] mb-1 font-semibold">Screenshots or photos (optional){screenshots.length > 0 ? ` · ${screenshots.length}` : ''}</div>
              {screenshots.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-2">
                  {screenshots.map((src, i) => (
                    <div key={i} className="relative inline-block">
                      <img src={src} alt={`Attached screenshot ${i + 1} preview`} className="max-h-32 border border-[#1A1815]" />
                      <button type="button" onClick={() => removeScreenshot(i)} aria-label={`Remove image ${i + 1}`} className="absolute -top-2 -right-2 bg-[#1A1815] text-white w-6 h-6 text-xs leading-none hover:bg-[#B85838] focus:outline focus:outline-2 focus:outline-[#B85838]">✕</button>
                    </div>
                  ))}
                </div>
              )}
              <label className="flex items-center justify-center gap-2 w-full p-2 border border-dashed border-[#1A1815] text-xs text-[#5A5751] cursor-pointer hover:bg-[#FAF8F4] focus-within:outline focus-within:outline-2 focus-within:outline-[#B85838]">
                <span>{readingImages ? 'Reading your photo…' : screenshots.length > 0 ? 'Add another image — or paste one (Ctrl+V)' : 'Attach images to show us what you mean — or copy a screenshot and paste it here (Ctrl+V)'}</span>
                <input type="file" accept="image/*" multiple className="hidden" onChange={e => { onPickImage(e.target.files); e.target.value = ''; }} />
              </label>
              {readingImages && <p className="mt-1 text-[0.625rem] text-[#5A5751]" aria-live="polite">Reading and compressing — the preview appears here when it&apos;s in.</p>}
            </div>
          </div>

          <div className="flex gap-2 mt-5 pt-4 border-t border-[#E8E4DC]">
            {formError && <div className="text-xs text-[#B85838] mb-2 px-3 py-2 bg-[#FAF8F4] border border-[#B85838] w-full" role="alert" style={{ fontFamily: '"Fraunces", serif' }}>{formError}</div>}
            <button type="button" onClick={handleSubmit} disabled={readingImages} className="bg-[#1A1815] text-[#FAF8F4] px-6 py-2.5 text-xs uppercase tracking-wider hover:bg-[#B85838] font-semibold disabled:opacity-50">{readingImages ? 'Reading photo…' : 'Submit Feedback'}</button>
            <button type="button" onClick={onClose} className="border border-[#E8E4DC] text-[#5A5751] px-6 py-2.5 text-xs uppercase tracking-wider hover:border-[#1A1815]">Cancel</button>
          </div>
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// FEEDBACK PROMOTE PANEL — Projects tab
// =============================================================================
// Wraps the QueueSpotlight pattern (one item at a time + dropdown nav)
// around the feedback log, with three promotion actions per item:
//   + Change   — creates a project tagged category='change-request' (ITIL
//                "change" model; no dedicated changes collection in v0 — the
//                v2 schema CIL section adds change_requests proper later)
//   + Incident — calls addIncident() with the feedback content as description
//   + Project  — calls addProject() with the feedback content as description
//
// Original feedback stays in the queue after any promotion (non-destructive);
// the × secondary action deletes the feedback if the user wants it removed.
// Per 2026-05-24 design ask from Darrell: reusable Queue Spotlight pattern so
// future surfaces (incidents queue, prayer requests, action queue) can adopt
// the same one-at-a-time + dropdown navigation.
// =============================================================================
function buildFeedbackDescription(f) {
  return [
    f.whatsWorking ? `✓ Working: ${f.whatsWorking}` : null,
    f.whatsNot ? `✗ Not working: ${f.whatsNot}` : null,
    f.whatsMissing ? `+ Missing: ${f.whatsMissing}` : null,
    f.rating ? `Rating: ${f.rating}` : null,
  ].filter(Boolean).join('\n\n');
}

function feedbackSummary(f, maxLen = 60) {
  const summary = (f.whatsNot || f.whatsMissing || f.whatsWorking || 'Tester note').trim();
  return summary.length > maxLen ? summary.slice(0, maxLen - 3) + '...' : summary;
}

export function FeedbackPromotePanel({ feedback = [], addProject, addIncident, deleteFeedback }) {
  if (!feedback || feedback.length === 0) return null;
  const sorted = [...feedback].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  // Staleness made legible (DR-0120 / P30): a queue is WORKED, not stored.
  // When items have waited past the threshold, the queue says so at the top —
  // an unworked queue must never look fine.
  const freshness = queueFreshness(sorted);

  const promoteToProject = (f) => {
    const name = `${f.area || 'Feedback'}: ${feedbackSummary(f)}`;
    addProject({
      name,
      description: buildFeedbackDescription(f),
      status: 'planning',
      sourceFeedbackId: f.id,
      _note: `promoted from feedback (${f.area || 'tester note'})`,
    });
    alert(`Project created: "${name}"`);
  };

  const promoteToIncident = (f) => {
    const description = `[from feedback · ${f.area || 'note'}] ${feedbackSummary(f, 120)}`;
    addIncident({
      description,
      amount: 0,
      category: 'other',
      entityId: 'e-personal',
      date: new Date().toISOString().slice(0, 10),
      contractorIds: [],
      sourceFeedbackId: f.id,
      _note: `promoted from feedback (${f.area || 'tester note'})`,
    });
    alert('Incident created. Fill in amount + entity on the incident.');
  };

  // → Requirements (DR-0121 item 10): the family's own feedback words ride the
  // SAME extraction contract as a client recording — each sentence becomes a
  // reviewable item (literal words as the receipt) in the Requirements review
  // gate (Projects → Clients), steward-confirmed before anything becomes work.
  const promoteToRequirements = async (f) => {
    const raw = [f.whatsNot, f.whatsMissing].filter(Boolean).join('\n');
    if (!raw.trim()) { alert('This item has no "not working / missing" text to extract from.'); return; }
    const parsed = extractRequirementsFromThoughts(raw, {
      source: `feedback:${f.id}`,
      extractedAt: new Date().toISOString(),
    });
    if (!parsed.items.length) { alert('No requirement-shaped sentences found in this feedback — promote it as a Project/Change instead.'); return; }
    const n = await saveExtraction(parsed);
    alert(`${n} requirement item${n === 1 ? '' : 's'} sent to the Requirements review gate (Projects → Clients)${parsed.unclear.length ? ` · ${parsed.unclear.length} sentence(s) kept aside as unclear` : ''}. Confirm each there to put it on a build board.`);
  };

  const promoteToChange = (f) => {
    // No `changes` collection yet (v2 schema CIL section adds change_requests
    // later). For v0 a "change" is a project tagged with category='change-request'
    // so it shows up alongside other projects but is filterable later.
    const name = `Change: ${f.area || 'Feedback'}: ${feedbackSummary(f)}`;
    addProject({
      name,
      description: buildFeedbackDescription(f),
      category: 'change-request',
      status: 'planning',
      sourceFeedbackId: f.id,
      _note: `promoted from feedback as change-request (${f.area || 'tester note'})`,
    });
    alert(`Change request created (tagged as 'change-request' in projects).`);
  };

  return (
    <div className="mt-8">
      {freshness.stale > 0 && (
        <div className="mb-2 border border-[#B85838] bg-[#FAF8F4] p-3 text-sm text-[#1A1815]" role="status">
          <span className="text-[#B85838] font-semibold" aria-hidden="true">▲</span>{' '}
          <span className="font-medium">{freshness.stale} of {freshness.total} item{freshness.stale > 1 ? 's have' : ' has'} waited over {QUEUE_STALE_DAYS} days</span>
          {freshness.oldestDays != null && <span className="text-[#5A5751]"> (oldest: {freshness.oldestDays} days)</span>}
          <span className="text-[#5A5751]"> — a queue is worked, not stored. Promote each to a Change / Incident / Project, or delete it.</span>
        </div>
      )}
      <Queue
        title="Feedback Log · Promote queue"
        subtitle="Focused item is in full detail at top. Browse the rest below and click any card to bring it into focus."
        emoji={<UiIcon name="chat" />}
        accent="#B85838"
        items={sorted}
        getKey={(f) => f.id}
        defaultPageSize={5}
        pageSizeOptions={[5, 25, 50]}
        renderFocus={(f) => (
          <div>
            <div className="flex items-baseline justify-between gap-2 mb-2 flex-wrap">
              <div className="text-[0.625rem] uppercase tracking-wider">
                <span className="font-semibold text-[#B85838]">{f.area || 'Note'}</span>
                {f.rating && <span className="text-[#5A5751]"> · {f.rating}</span>}
              </div>
              <span className="text-[0.5625rem] text-[#5A5751]" style={{ fontFamily: '"JetBrains Mono", monospace' }}>
                {new Date(f.createdAt).toLocaleString()}
              </span>
            </div>
            {f.whatsWorking && (
              <div className="mb-2">
                <div className="text-[0.5625rem] uppercase tracking-wider text-[#5A6E3D] font-semibold">✓ Working</div>
                <p className="text-sm" style={{ fontFamily: '"Fraunces", serif' }}>{f.whatsWorking}</p>
              </div>
            )}
            {f.whatsNot && (
              <div className="mb-2">
                <div className="text-[0.5625rem] uppercase tracking-wider text-[#B85838] font-semibold">✗ Not working</div>
                <p className="text-sm" style={{ fontFamily: '"Fraunces", serif' }}>{f.whatsNot}</p>
              </div>
            )}
            {f.whatsMissing && (
              <div className="mb-2">
                <div className="text-[0.5625rem] uppercase tracking-wider text-[#B85838] font-semibold">+ Missing</div>
                <p className="text-sm" style={{ fontFamily: '"Fraunces", serif' }}>{f.whatsMissing}</p>
              </div>
            )}
            {(() => {
              // Prefer the multi-image array; fall back to the legacy single
              // `screenshot`, then to the marker for rows synced without images.
              const imgs = Array.isArray(f.screenshots) && f.screenshots.length > 0
                ? f.screenshots
                : (f.screenshot ? [f.screenshot] : []);
              if (imgs.length > 0) {
                return (
                  <div className="mb-2">
                    <div className="text-[0.5625rem] uppercase tracking-wider text-[#5A5751] font-semibold">{imgs.length > 1 ? `${imgs.length} screenshots` : 'Screenshot'}</div>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {imgs.map((src, i) => (
                        <a key={i} href={src} target="_blank" rel="noreferrer" title="Open full size">
                          <img src={src} alt={`Feedback screenshot ${i + 1}`} className="max-h-48 border border-[#1A1815]" />
                        </a>
                      ))}
                    </div>
                  </div>
                );
              }
              if (f.hasScreenshot) {
                const n = f.screenshotCount || 1;
                return <div className="text-[0.5625rem] uppercase tracking-wider text-[#5A5751] mb-2">{n > 1 ? `${n} screenshots` : 'Screenshot'} attached (open on the submitter's device or in Supabase)</div>;
              }
              return null;
            })()}
          </div>
        )}
        renderCard={(f) => {
          const d = new Date(f.createdAt);
          const dateStr = `${d.getMonth() + 1}/${d.getDate()}`;
          return (
            <div className="flex items-baseline justify-between gap-2 flex-wrap">
              <div className="flex-1 min-w-0">
                <div className="text-[0.625rem] uppercase tracking-wider">
                  <span className="font-semibold text-[#B85838]">{f.area || 'Note'}</span>
                  {f.rating && <span className="text-[#5A5751]"> · {f.rating}</span>}
                </div>
                <div className="text-sm truncate" style={{ fontFamily: '"Fraunces", serif' }}>
                  {feedbackSummary(f, 80)}
                </div>
              </div>
              <span className="text-[0.5625rem] text-[#5A5751] shrink-0" style={{ fontFamily: '"JetBrains Mono", monospace' }}>
                {dateStr}
              </span>
            </div>
          );
        }}
        actions={[
          { label: '→ Requirements', onClick: promoteToRequirements, color: '#B85838' },
          { label: '+ Change', onClick: promoteToChange, color: '#5A6E3D' },
          { label: '+ Incident', onClick: promoteToIncident, color: '#B85838' },
          { label: '+ Project', onClick: promoteToProject, color: '#1A1815' },
          { label: '× Delete', onClick: (f) => { if (confirm('Delete this feedback? It will be removed from the queue but any projects/incidents/changes you already created from it remain.')) deleteFeedback(f.id); }, secondary: true },
        ]}
      />
    </div>
  );
}
