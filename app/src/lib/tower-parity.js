// =============================================================================
// tower-parity — the Governor's view of the tower parity loop (DR-0671)
// =============================================================================
// Darrell 2026-09-29: "The final goal is to not need any no local model... we
// need to make more workflows that produce the same outcome from claude based
// on the process being used... claude needs to create the specific algorithmic
// fixes for our workflows to work on the towers etc..."
//
// Reads what the NAS loop (infra/nas-lesson-parity) measured, from four
// Governor-only tables (migration 0240): lesson_parity, lesson_crossref,
// lesson_parity_fixes, lesson_parity_promotion. Every number shown is a stored
// measurement; nothing here computes a score. His one write is the hold on a
// promotion, through set_lesson_parity_hold().
//
// Pure except the calls, which take the Supabase client as an argument.
// =============================================================================

export const PARITY_TABLES = Object.freeze(['lesson_parity', 'lesson_crossref', 'lesson_parity_fixes', 'lesson_parity_promotion']);

// Plain words for each gap class, in the order a reader meets them.
export const GAP_LABELS = Object.freeze({
  'gate-failure': 'fails a house gate the reference passes',
  'misquoted-verse': 'a quoted verse is not the verse',
  'missing-verse-retrieval': 'missing verses the reference cites',
  'missing-movement': 'missing points the reference makes',
  'weak-structure': 'missing parts of the lesson',
  'missing-band': 'an age band is missing',
  'short-band': 'an age band is too short',
  'reading-level': 'reads at the wrong grade for its band',
  'band-order-inverted': 'a younger band reads harder than an older one',
  'quiz-count': 'fewer quiz questions',
  'quiz-errors': 'a quiz question is wrong',
  'quiz-ungrounded': 'quiz explanations do not name their verse',
  'length-short': 'shorter than the reference',
  'length-long': 'longer than the reference',
});

export const STATUS_LINES = Object.freeze({
  'reference-only': 'Claude stays the reference writer.',
  ready: 'Ready to be the primary writer. Held by you.',
  primary: 'Primary writer. Claude is kept as the reference only.',
});

const pct = (n) => (n == null || Number.isNaN(Number(n)) ? '—' : `${Math.round(Number(n) * 100)}`);
export const scoreText = pct;

/** Per-writer series, oldest first: [{key, family, model, points:[{at, score, passed}]}]. */
export function writerSeries(parityRows) {
  const by = new Map();
  for (const r of parityRows || []) {
    const key = `${r.writer_family}/${r.model_label || ''}`;
    if (!by.has(key)) by.set(key, { key, family: r.writer_family, model: r.model_label || '', points: [] });
    by.get(key).points.push({ at: r.version_created_at || r.measured_at, score: Number(r.parity_score), passed: !!r.passed, lesson: r.lesson_id });
  }
  for (const s of by.values()) s.points.sort((a, b) => String(a.at).localeCompare(String(b.at)));
  return [...by.values()].sort((a, b) => a.key.localeCompare(b.key));
}

/** Gap classes across each writer's last `window` measured versions, most frequent first. */
export function openGapClasses(parityRows, window = 10) {
  const out = new Map();
  for (const s of writerSeries(parityRows)) {
    const rows = (parityRows || []).filter((r) => `${r.writer_family}/${r.model_label || ''}` === s.key)
      .sort((a, b) => String(a.version_created_at || a.measured_at).localeCompare(String(b.version_created_at || b.measured_at)))
      .slice(-window);
    for (const r of rows) {
      for (const c of r.gap_classes || []) {
        const k = `${s.family}|${c}`;
        const cur = out.get(k) || { family: s.family, gapClass: c, label: GAP_LABELS[c] || c, count: 0, of: rows.length };
        cur.count += 1;
        out.set(k, cur);
      }
    }
  }
  return [...out.values()].sort((a, b) => b.count - a.count || a.gapClass.localeCompare(b.gapClass));
}

/** Fixes with a plain status line. */
export function fixLines(fixes) {
  const said = {
    'awaiting-writer': 'written up; waiting for the writer to be set on the NAS',
    running: 'Claude is writing it',
    pushed: 'pushed as a PR',
    failed: 'the run failed',
    'budget-stopped': 'stopped at its budget',
    merged: 'merged',
    'closed-verified': 'merged, and the gap measured closed',
  };
  return (fixes || []).map((f) => ({ ...f, label: GAP_LABELS[f.gap_class] || f.gap_class, statusLine: said[f.status] || f.status }));
}

/** The consensus of one teaching, shaped for reading. */
export function consensusView(row) {
  const c = (row && row.consensus) || {};
  const v = c.verses || {};
  const t = c.themes || {};
  const list = (xs) => (xs || []).map((x) => x.verse || x.theme);
  return {
    eligible: c.eligible || 0,
    versesAgreed: [...list(v.all), ...list(v.most)],
    versesSome: list(v.some),
    themesAgreed: [...list(t.all), ...list(t.most)],
    insights: (row && row.insights) || [],
    excluded: (row && row.excluded) || [],
    referenceVsConsensus: (row && row.reference_vs_consensus) || null,
  };
}

/** Read everything the panel shows. One failure is reported, never hidden. */
export async function fetchTowerParity({ supabase }) {
  try {
    const [p, x, f, pr] = await Promise.all([
      supabase.from('lesson_parity').select('id,teaching_row_id,lesson_id,version_id,writer,writer_family,model_label,parity_score,passed,floors,gap_classes,same_prompt,version_created_at,measured_at').order('measured_at', { ascending: false }).limit(500),
      supabase.from('lesson_crossref').select('teaching_row_id,lesson_id,versions,matrix,consensus,insights,excluded,reference_vs_consensus,measured_at').order('measured_at', { ascending: false }).limit(50),
      supabase.from('lesson_parity_fixes').select('id,gap_class,writer_family,occurrences,status,branch,pr_url,before,after,turns,elapsed_ms,detail,created_at').order('created_at', { ascending: false }).limit(50),
      supabase.from('lesson_parity_promotion').select('writer_family,model_label,tower,streak,required_n,threshold,teachings,ready,status,held,last_score,status_changed_at,updated_at'),
    ]);
    const err = [p, x, f, pr].find((r) => r && r.error);
    if (err) return { ok: false, reason: err.error.message };
    return { ok: true, reason: '', parity: p.data || [], crossref: x.data || [], fixes: f.data || [], promotions: pr.data || [] };
  } catch (e) {
    return { ok: false, reason: e?.message || 'unknown' };
  }
}

/** The Governor's brake on a promotion. */
export async function setParityHold({ supabase, family, model, hold }) {
  const { data, error } = await supabase.rpc('set_lesson_parity_hold', { p_writer_family: family, p_model_label: model || '', p_hold: !!hold });
  if (error) return { ok: false, reason: error.message };
  return { ok: true, row: data };
}
