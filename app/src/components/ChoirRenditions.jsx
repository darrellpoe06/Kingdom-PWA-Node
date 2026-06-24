// =============================================================================
// ChoirRenditions — "the ways we've sung this song in the past."
// =============================================================================
// Opens inside a Songbook card: the song's RENDITIONS (every real choir_songs
// row for the title), newest first — rendition A (this date, this vamp/these
// runs/this soloist), rendition B (that date, different) — so the choir
// references + reuses its own history. Each rendition shows: the service date +
// type, a deep-linked Watch (jumps to the moment in the recording), the ad-libs
// / variations highlighted for THAT performance, the keyboardist's SME notes,
// and a rendition-level ❤ ("which way did the body love most" — a crown marks
// the most-loved version). Directors can curate ad-libs, write keyboardist
// notes, confirm/reject pipeline-detected candidates, and "Keep in arrangement"
// to graduate a loved ad-lib into the song's kept arrangement.
//
// Every value traces to a real row (Reality-trace / Verification Doctrine).
// Nothing is painted: a rendition with no ad-libs says so; a detected ad-lib is
// flagged unreviewed (never shown as confirmed); a low-confidence archive match
// flags the rendition for review. Palette + a11y mirror ChoirSongbook exactly.
// =============================================================================
import React, { useMemo, useState } from 'react';
import { youtubeEmbedUrl, youtubeTimedUrl, formatTimecode, parseTimecode } from '../lib/choir-sync.js';
import {
  buildRenditions, mostLovedRendition, AD_LIB_TYPES, visibleAdLibs,
  setAdLibReview, graduateAdLib,
} from '../lib/choir-renditions.js';

const BTN = 'text-xs uppercase tracking-wider px-3 py-2 min-h-[36px] focus:outline focus:outline-2 focus:outline-[#B85838]';
const FIELD = 'w-full p-2 border border-[#E8E4DC] text-sm bg-white focus:outline focus:outline-2 focus:outline-[#B85838]';
const LABEL = 'text-[0.5625rem] uppercase tracking-wider text-[#5A5751] block mb-1';
const SERIF = { fontFamily: '"Fraunces", serif' };

const fmtDate = (d) => {
  if (!d) return 'Undated';
  try { return new Date(d + 'T00:00:00').toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }); }
  catch { return d; }
};
const SERVICE_LABEL = { sunday: 'Sunday', wednesday: 'Wednesday', rehearsal: 'Rehearsal', both: 'Sun + Wed' };

// An ad-lib chip — type-coloured, with a time deep-link and honest review state.
function AdLibChip({ adLib, onJump }) {
  const kind = AD_LIB_TYPES[adLib.type]?.label || 'Variation';
  const detected = adLib.source === 'detected';
  const unreviewed = adLib.review === 'unreviewed';
  // unreviewed/detected reads as "candidate" (muted, ⚠); confirmed reads solid.
  const tone = unreviewed
    ? 'bg-[#FAF8F4] text-[#5A5751] border border-[#B85838]'
    : 'bg-[#F2F4EC] text-[#5A6E3D]';
  return (
    <span className={`inline-flex items-center gap-1 text-[0.5625rem] uppercase tracking-wider px-1.5 py-0.5 ${tone}`}>
      {unreviewed && <span aria-hidden="true">⚠</span>}
      <span className="font-semibold">{kind}</span>
      <span className="normal-case tracking-normal">{adLib.label}</span>
      {adLib.soloist && <span className="normal-case tracking-normal">· {adLib.soloist}</span>}
      {adLib.at != null && onJump && (
        <button type="button" onClick={() => onJump(adLib.at)} className="underline normal-case tracking-normal text-[#B85838]" aria-label={`Jump to ${formatTimecode(adLib.at)}`}>
          {formatTimecode(adLib.at)}
        </button>
      )}
      {detected && adLib.confidence != null && (
        <span className="normal-case tracking-normal text-[#5A5751]">{Math.round(adLib.confidence * 100)}%</span>
      )}
    </span>
  );
}

// Director: add a new curated ad-lib to a rendition.
function AddAdLib({ onAdd, onClose }) {
  const [type, setType] = useState('vamp');
  const [label, setLabel] = useState('');
  const [soloist, setSoloist] = useState('');
  const [at, setAt] = useState('');
  const submit = () => {
    const text = label.trim();
    if (!text) return;
    onAdd({ type, label: text, soloist: soloist.trim() || null, at: parseTimecode(at), source: 'curated', review: 'confirmed' });
    onClose();
  };
  return (
    <div className="mt-2 bg-[#FAF8F4] border border-[#5A6E3D] p-2 space-y-2">
      <div className="grid grid-cols-2 gap-2">
        <div><label className={LABEL} htmlFor="al-type">Variation</label>
          <select id="al-type" className={FIELD} value={type} onChange={(e) => setType(e.target.value)}>
            {Object.entries(AD_LIB_TYPES).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
          </select>
        </div>
        <div><label className={LABEL} htmlFor="al-at">At (mm:ss, optional)</label>
          <input id="al-at" className={FIELD} value={at} onChange={(e) => setAt(e.target.value)} placeholder="e.g. 3:40" />
        </div>
      </div>
      <div><label className={LABEL} htmlFor="al-label">What happened</label>
        <input id="al-label" className={FIELD} value={label} onChange={(e) => setLabel(e.target.value)} placeholder="e.g. Extended vamp on the tag" />
      </div>
      <div><label className={LABEL} htmlFor="al-solo">Soloist / part (optional)</label>
        <input id="al-solo" className={FIELD} value={soloist} onChange={(e) => setSoloist(e.target.value)} placeholder="e.g. Sis. M (lead)" />
      </div>
      <div className="flex gap-2">
        <button type="button" onClick={submit} className={`${BTN} bg-[#5A6E3D] text-white font-semibold`}>Add variation</button>
        <button type="button" onClick={onClose} className={`${BTN} border border-[#5A5751] text-[#5A5751]`}>Cancel</button>
      </div>
    </div>
  );
}

// One rendition — "this is how we sang it on this date."
function RenditionCard({ rendition, isMostLoved, canEdit, busy, onLove, onSaveDetail, onGraduate }) {
  const [open, setOpen] = useState(null); // 'video' | 'edit' | 'addlib' | null
  const [kbNotes, setKbNotes] = useState(rendition.keyboardistNotes || '');
  const embed = youtubeEmbedUrl(rendition.youtubeUrl);
  const watch = youtubeTimedUrl(rendition.youtubeUrl, rendition.startSeconds);

  // Curating ad-libs edits the rendition's array, then persists it whole.
  const mutateAdLibs = (next) => onSaveDetail(rendition.id, { adLibs: next });
  const addAdLib = (raw) => mutateAdLibs([...(rendition.adLibs || []), raw]);
  const reviewAdLib = (id, review) => mutateAdLibs(setAdLibReview(rendition.adLibs, id, review));
  const removeAdLib = (id) => mutateAdLibs(setAdLibReview(rendition.adLibs, id, 'rejected'));
  const graduate = (adLib) => onGraduate(rendition, adLib);

  const visible = useMemo(() => visibleAdLibs(rendition.adLibs, { includeRejected: canEdit }), [rendition.adLibs, canEdit]);

  return (
    <div className="bg-white border border-[#E8E4DC] p-2">
      <div className="flex items-baseline justify-between gap-2 flex-wrap">
        <div className="flex items-baseline gap-2 flex-wrap">
          <span className="font-semibold" style={SERIF}>{fmtDate(rendition.serviceDate)}</span>
          <span className="text-[0.5625rem] uppercase tracking-wider px-1.5 py-0.5 bg-[#E8E4DC] text-[#1A1815]">{SERVICE_LABEL[rendition.serviceType] || rendition.serviceType}</span>
          {isMostLoved && <span className="text-[0.5625rem] uppercase tracking-wider px-1.5 py-0.5 bg-[#FAF8F4] text-[#B85838]" title="Most-loved version">♥ most-loved version</span>}
          {rendition.isFuture && <span className="text-[0.5625rem] uppercase tracking-wider px-1.5 py-0.5 bg-[#F2F4EC] text-[#5A6E3D]">scheduled</span>}
          {rendition.needsSourceReview && <span className="text-[0.5625rem] uppercase tracking-wider px-1.5 py-0.5 bg-[#FAF8F4] text-[#B85838] border border-[#B85838]" title={`Archive match ${Math.round((rendition.sourceConfidence || 0) * 100)}% — confirm this is right`}>⚠ verify match</span>}
        </div>
        <button
          type="button"
          onClick={() => onLove(rendition)}
          aria-pressed={rendition.lovedByMe}
          aria-label={rendition.lovedByMe ? `Remove your love for the ${fmtDate(rendition.serviceDate)} version` : `Love the ${fmtDate(rendition.serviceDate)} version`}
          className={`${BTN} ${rendition.lovedByMe ? 'text-[#B85838]' : 'text-[#5A5751] hover:text-[#B85838]'}`}
        >
          {rendition.lovedByMe ? '♥' : '♡'} {rendition.lovesCount || 0}
        </button>
      </div>

      {/* practical line for THIS performance */}
      {(rendition.songKey || rendition.arrangement || rendition.soloist) && (
        <div className="text-[0.6875rem] text-[#5A5751] mt-0.5" style={SERIF}>
          {[rendition.songKey && `key ${rendition.songKey}`, rendition.arrangement, rendition.soloist && `solo: ${rendition.soloist}`].filter(Boolean).join(' · ')}
        </div>
      )}

      {/* ad-libs / variations — the heart of "the way we sang it" */}
      <div className="mt-1">
        {visible.length ? (
          <div className="flex items-center gap-1 flex-wrap">
            {visible.map((a) => (
              <span key={a.id} className={a.review === 'rejected' ? 'opacity-40 line-through' : ''}>
                <AdLibChip adLib={a} onJump={embed ? () => setOpen('video') : null} />
                {canEdit && (
                  <span className="inline-flex items-center gap-0.5 ml-0.5 align-middle">
                    {a.review === 'unreviewed' && (
                      <button type="button" disabled={busy} onClick={() => reviewAdLib(a.id, 'confirmed')} className="text-[0.5625rem] text-[#5A6E3D] hover:underline" aria-label="Confirm this variation">✓</button>
                    )}
                    <button type="button" disabled={busy} onClick={() => graduate(a)} className="text-[0.5625rem] text-[#B85838] hover:underline" title="Keep this in the song's arrangement">keep</button>
                    {a.review !== 'rejected' && (
                      <button type="button" disabled={busy} onClick={() => removeAdLib(a.id)} className="text-[0.5625rem] text-[#5A5751] hover:underline" aria-label="Remove this variation">✕</button>
                    )}
                  </span>
                )}
              </span>
            ))}
          </div>
        ) : (
          <p className="text-[0.6875rem] text-[#5A5751] italic" style={SERIF}>No variations recorded for this time{canEdit ? ' — add the vamps, runs, and soloist moments below.' : '.'}</p>
        )}
      </div>

      {/* keyboardist / SME notes for this rendition */}
      {rendition.keyboardistNotes && open !== 'edit' && (
        <div className="text-[0.6875rem] text-[#5A5751] mt-1 whitespace-pre-wrap" style={SERIF}>
          <span className="uppercase tracking-wider text-[0.5625rem] text-[#5A6E3D]">Keyboardist:</span> {rendition.keyboardistNotes}
        </div>
      )}

      {/* actions */}
      <div className="flex items-center gap-2 flex-wrap mt-1">
        {embed && <button type="button" onClick={() => setOpen(open === 'video' ? null : 'video')} className={`${BTN} text-[#B85838] hover:text-[#1A1815]`} aria-expanded={open === 'video'}>{open === 'video' ? '▾ Hide' : '▶ Watch this version'}</button>}
        {!embed && watch && <a href={watch} target="_blank" rel="noopener noreferrer" className={`${BTN} text-[#B85838] hover:text-[#1A1815] underline`}>▶ Watch link</a>}
        {canEdit && <button type="button" onClick={() => setOpen(open === 'addlib' ? null : 'addlib')} className={`${BTN} text-[#5A6E3D] hover:text-[#1A1815]`}>+ Add variation</button>}
        {canEdit && <button type="button" onClick={() => { setKbNotes(rendition.keyboardistNotes || ''); setOpen(open === 'edit' ? null : 'edit'); }} className={`${BTN} text-[#5A5751] hover:text-[#1A1815]`}>✎ Keyboardist notes</button>}
      </div>

      {open === 'addlib' && <AddAdLib onAdd={addAdLib} onClose={() => setOpen(null)} />}
      {open === 'edit' && (
        <div className="mt-2 bg-[#FAF8F4] border border-[#5A5751] p-2 space-y-2">
          <div><label className={LABEL} htmlFor={`kb-${rendition.id}`}>Keyboardist / SME notes for this rendition</label>
            <textarea id={`kb-${rendition.id}`} className={FIELD} rows={3} value={kbNotes} onChange={(e) => setKbNotes(e.target.value)} placeholder="Chord moves, the modulation into the vamp, the feel that time…" />
          </div>
          <div className="flex gap-2">
            <button type="button" disabled={busy} onClick={() => { onSaveDetail(rendition.id, { keyboardistNotes: kbNotes }); setOpen(null); }} className={`${BTN} bg-[#1A1815] text-white font-semibold hover:bg-[#B85838] disabled:opacity-50`}>{busy ? 'Saving…' : 'Save notes'}</button>
            <button type="button" onClick={() => setOpen(null)} className={`${BTN} border border-[#5A5751] text-[#5A5751]`}>Cancel</button>
          </div>
        </div>
      )}
      {open === 'video' && embed && (
        <div className="mt-2 aspect-video">
          <iframe src={rendition.startSeconds ? `${embed}?start=${Math.floor(rendition.startSeconds)}` : embed} title={`${rendition.title} — ${fmtDate(rendition.serviceDate)}`} className="w-full h-full border border-[#1A1815]" allow="encrypted-media; picture-in-picture" allowFullScreen loading="lazy" />
        </div>
      )}
    </div>
  );
}

// --- The "ways we've sung this" panel ---------------------------------------
export default function ChoirRenditions({ entry, rows, renditionLoves, canEdit, today, busy, onLove, onSaveDetail, onGraduate }) {
  const renditions = useMemo(
    () => buildRenditions(rows, { loves: renditionLoves, today }),
    [rows, renditionLoves, today]);
  const loved = useMemo(() => mostLovedRendition(renditions), [renditions]);

  // Graduate a loved ad-lib into the song's kept arrangement (across its rows).
  const graduate = (rendition, adLib) => {
    const existing = (entry.arrangements || [])[0] || '';
    const next = graduateAdLib(existing, adLib, rendition);
    onGraduate(entry.rowIds, next);
  };

  if (!renditions.length) {
    return <p className="text-[0.6875rem] text-[#5A5751] italic mt-2" style={SERIF}>No past performances on record yet.</p>;
  }

  return (
    <div className="mt-2 bg-[#FAF8F4] border border-[#5A6E3D] p-2">
      <div className="text-[0.625rem] uppercase tracking-[0.25em] text-[#5A6E3D] font-semibold mb-1">
        The ways we've sung this · {renditions.length} {renditions.length === 1 ? 'time' : 'times'}
      </div>
      <div className="space-y-2">
        {renditions.map((r) => (
          <RenditionCard
            key={r.id}
            rendition={r}
            isMostLoved={loved && loved.id === r.id}
            canEdit={canEdit}
            busy={busy}
            onLove={onLove}
            onSaveDetail={onSaveDetail}
            onGraduate={graduate}
          />
        ))}
      </div>
    </div>
  );
}

export { ChoirRenditions };
