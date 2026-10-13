// =============================================================================
// StoryLibrary -- the testimony-first curation surface (Layer 2)
// =============================================================================
// Darrell 2026-07-21: users "begin to become a curator" for stories that fit
// the Word -- "I have personal stories that fit better than anything I've
// heard." The AI parables shipped first (for training + the pattern); here a
// person captures their OWN story, a steward reviews it, and it is promoted
// into a lesson. Testimony-first: the default is a real, lived account, which
// carries attribution + consent; a parable is the authored alternative.
//
// The truth-label gate lives in lib/story-library.js (unit-tested, DR-0076);
// this surface only renders it. Tailwind classes only (no inline color) so the
// contrast + legibility guards cover it. Prop-driven so its behavior is
// unit-testable without the live app; live observation via reviewer-mode is the
// Tier-C gate before it is trusted (RELEASE-TIERS, DR-0104).
// =============================================================================

import React, { useState } from 'react';
import {
  STORY_KINDS, STORY_TONES, validateSubmission, canPromote,
  saveDraft, listDrafts, removeDraft, submitStory,
} from '../lib/story-library.js';

const EMPTY = { kind: 'testimony', tone: 'solemn', title: '', verse: '', body: '', source: '', consent: false, target_lesson_id: '' };

const fieldCls =
  'w-full text-sm border border-[#1A1815] px-2 py-1.5 min-h-[36px] bg-white text-[#1A1815] ' +
  'focus:outline focus:outline-2 focus:outline-[#B85838]';
const labelCls = 'block text-[0.625rem] uppercase tracking-wider text-[#5A5751] font-semibold mb-1';

export default function StoryLibrary({
  isGovernor = false,
  lessons = [],
  submissions = [],
  onReview,
  onPromote,
}) {
  const [form, setForm] = useState(EMPTY);
  const [savedTick, setSavedTick] = useState(0);
  const [notice, setNotice] = useState('');

  // Re-read on each render; savedTick bumps force a re-render after a local write.
  void savedTick;
  const drafts = listDrafts();
  const gate = validateSubmission(form);
  const isTestimony = form.kind === 'testimony';

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const doSaveDraft = () => {
    saveDraft(form);
    setSavedTick((t) => t + 1);
    setNotice('Saved to your drafts on this device.');
  };

  const doSubmit = async () => {
    if (!gate.ok) return;
    saveDraft({ ...form, status: 'submitted' });
    setSavedTick((t) => t + 1);
    const res = await submitStory(form, {});
    if (res && res.ok) setNotice('Submitted to the curation queue for a steward to review.');
    else if (res && res.skipped === 'signed-out') setNotice('Saved locally. Sign in to send it to the shared queue.');
    else setNotice('Saved locally; the shared send will retry.');
    setForm(EMPTY);
  };

  return (
    <div>
      <div className="flex items-baseline justify-between gap-2 mb-1">
        <h3 className="text-lg font-semibold text-[#1A1815]" style={{ fontFamily: '"Fraunces", serif' }}>
          Story Library
        </h3>
        <span className="text-[0.625rem] uppercase tracking-wider px-2 py-0.5 border text-[#5A6E3D] border-[#5A6E3D]">
          Testimony-first
        </span>
      </div>
      <p className="text-xs text-[#5A5751] mb-4" style={{ fontFamily: '"Fraunces", serif' }}>
        The parables in these lessons show the pattern. Now you curate: capture a story that fits the Word —
        a real one you have lived (a <strong>testimony</strong>), or one you author to teach a truth
        (a <strong>parable</strong>). We never mislabel one as the other. A steward reviews it before it joins a lesson.
      </p>

      {/* --- Capture form --- */}
      <form
        className="bg-[#FAF8F4] border border-[#E8E4DC] p-3 mb-6"
        onSubmit={(e) => { e.preventDefault(); doSubmit(); }}
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
          <div>
            <label htmlFor="sl-kind" className={labelCls}>What is it, truly?</label>
            <select id="sl-kind" className={fieldCls} value={form.kind} onChange={(e) => set('kind', e.target.value)}>
              {STORY_KINDS.map((k) => (
                <option key={k} value={k}>{k === 'testimony' ? 'Testimony (really happened)' : 'Parable (authored to teach)'}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="sl-tone" className={labelCls}>Tone</label>
            <select id="sl-tone" className={fieldCls} value={form.tone} onChange={(e) => set('tone', e.target.value)}>
              {STORY_TONES.map((t) => (
                <option key={t} value={t}>{t === 'light' ? 'Light (funny / warm)' : 'Solemn (weighty)'}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="mb-3">
          <label htmlFor="sl-title" className={labelCls}>Title</label>
          <input id="sl-title" className={fieldCls} value={form.title} onChange={(e) => set('title', e.target.value)} placeholder="A short, memorable name" />
        </div>

        <div className="mb-3">
          <label htmlFor="sl-verse" className={labelCls}>Verse it serves</label>
          <input id="sl-verse" className={fieldCls} value={form.verse} onChange={(e) => set('verse', e.target.value)} placeholder="e.g. Psalms 34:4" />
        </div>

        <div className="mb-3">
          <label htmlFor="sl-body" className={labelCls}>The story</label>
          <textarea id="sl-body" rows={6} className={fieldCls} value={form.body} onChange={(e) => set('body', e.target.value)} placeholder="Set the scene, let the tension build, and land it on the verse's truth." />
        </div>

        {isTestimony && (
          <div className="border border-[#5A6E3D] bg-white p-3 mb-3">
            <div className="mb-3">
              <label htmlFor="sl-source" className={labelCls}>Whose account is this? (attribution — required for a testimony)</label>
              <input id="sl-source" className={fieldCls} value={form.source} onChange={(e) => set('source', e.target.value)} placeholder="e.g. Told by Ada Poe, 2026" />
            </div>
            <label className="flex items-start gap-2 text-xs text-[#1A1815]" style={{ fontFamily: '"Fraunces", serif' }}>
              <input type="checkbox" className="mt-0.5" checked={!!form.consent} onChange={(e) => set('consent', e.target.checked)} />
              <span>I confirm this really happened and I consent to it being shared and taught. A testimony is never published without this.</span>
            </label>
          </div>
        )}

        {lessons.length > 0 && (
          <div className="mb-3">
            <label htmlFor="sl-lesson" className={labelCls}>Which lesson does it fit? (optional)</label>
            <select id="sl-lesson" className={fieldCls} value={form.target_lesson_id} onChange={(e) => set('target_lesson_id', e.target.value)}>
              <option value="">— Unplaced (a steward can place it) —</option>
              {lessons.map((l) => (<option key={l.id} value={l.id}>{l.title}</option>))}
            </select>
          </div>
        )}

        {!gate.ok && (form.title || form.body || form.verse) && (
          <ul className="text-[0.6875rem] text-[#B85838] mb-3 list-disc pl-5" style={{ fontFamily: '"Fraunces", serif' }}>
            {gate.errors.map((er, i) => (<li key={i}>{er}</li>))}
          </ul>
        )}

        <div className="flex flex-wrap gap-2 items-center">
          <button type="submit" disabled={!gate.ok}
            className={`text-[0.625rem] uppercase tracking-wider px-3 py-2 min-h-[36px] border focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-[#B85838] ${gate.ok ? 'border-[#5A6E3D] bg-[#5A6E3D] text-white hover:bg-[#4A5D30]' : 'border-[#E8E4DC] text-[#5A5751] cursor-not-allowed'}`}>
            Submit to the queue
          </button>
          <button type="button" onClick={doSaveDraft}
            className="text-[0.625rem] uppercase tracking-wider px-3 py-2 min-h-[36px] border border-[#1A1815] text-[#1A1815] hover:bg-[#1A1815] hover:text-white focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-[#B85838]">
            Save draft
          </button>
          {notice && <span className="text-[0.6875rem] text-[#5A6E3D]" style={{ fontFamily: '"Fraunces", serif' }}>{notice}</span>}
        </div>
      </form>

      {/* --- My drafts --- */}
      <div className="mb-6">
        <div className="text-[0.625rem] uppercase tracking-wider text-[#5A6E3D] font-semibold mb-2">
          My stories on this device · {drafts.length}
        </div>
        {drafts.length === 0 ? (
          <p className="text-xs text-[#5A5751]" style={{ fontFamily: '"Fraunces", serif' }}>Nothing yet. Capture your first story above.</p>
        ) : (
          <ul className="space-y-2">
            {drafts.map((d) => (
              <li key={d.id} className="border border-[#E8E4DC] bg-white p-2 flex items-start justify-between gap-2">
                <div>
                  <div className="text-sm text-[#1A1815] font-semibold">{d.title || '(untitled)'}</div>
                  <div className="text-[0.6875rem] text-[#5A5751]">{d.kind} · {d.tone} · {d.verse} · {d.status || 'draft'}</div>
                </div>
                <button type="button" onClick={() => { removeDraft(d.id); setSavedTick((t) => t + 1); }}
                  className="text-[0.625rem] uppercase tracking-wider px-2 py-1 min-h-[32px] border border-[#B85838] text-[#B85838] hover:bg-[#B85838] hover:text-white focus:outline focus:outline-2 focus:outline-[#B85838]">
                  Remove
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* --- Steward review queue (Governor only) --- */}
      {isGovernor && (
        <div className="border border-[#5A6E3D] bg-[#FAF8F4] p-3">
          <div className="text-[0.625rem] uppercase tracking-wider text-[#5A6E3D] font-semibold mb-2">
            Steward · curation queue · {submissions.length}
          </div>
          {submissions.length === 0 ? (
            <p className="text-xs text-[#5A5751]" style={{ fontFamily: '"Fraunces", serif' }}>No submissions to review right now.</p>
          ) : (
            <ul className="space-y-2">
              {submissions.map((s) => (
                <li key={s.id} className="border border-[#E8E4DC] bg-white p-2">
                  <div className="text-sm text-[#1A1815] font-semibold">{s.title}</div>
                  <div className="text-[0.6875rem] text-[#5A5751] mb-1">
                    {s.kind} · {s.tone} · {s.verse} · {s.status}
                    {s.kind === 'testimony' && <> · <span className="text-[#5A6E3D]">{s.source || 'NO SOURCE'}</span></>}
                  </div>
                  <p className="text-xs text-[#1A1815] mb-2" style={{ fontFamily: '"Fraunces", serif' }}>{s.body}</p>
                  <div className="flex flex-wrap gap-2">
                    <button type="button" disabled={!canPromote(s)} onClick={() => onPromote && onPromote(s)}
                      className={`text-[0.625rem] uppercase tracking-wider px-2 py-1 min-h-[32px] border focus:outline focus:outline-2 focus:outline-[#B85838] ${canPromote(s) ? 'border-[#5A6E3D] text-[#5A6E3D] hover:bg-[#5A6E3D] hover:text-white' : 'border-[#E8E4DC] text-[#5A5751] cursor-not-allowed'}`}>
                      Promote to lesson
                    </button>
                    <button type="button" onClick={() => onReview && onReview(s, 'declined')}
                      className="text-[0.625rem] uppercase tracking-wider px-2 py-1 min-h-[32px] border border-[#B85838] text-[#B85838] hover:bg-[#B85838] hover:text-white focus:outline focus:outline-2 focus:outline-[#B85838]">
                      Decline
                    </button>
                  </div>
                  {!canPromote(s) && (
                    <p className="text-[0.625rem] text-[#B85838] mt-1" style={{ fontFamily: '"Fraunces", serif' }}>
                      Not promotable yet: {validateSubmission(s).errors.join(' ')}
                    </p>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
