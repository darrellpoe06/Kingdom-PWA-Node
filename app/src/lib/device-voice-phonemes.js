// =============================================================================
// device-voice-phonemes — Piper's own text -> phoneme-id recipe, in plain JS
// =============================================================================
// Darrell, 2026-09-25: "Can't we give everything it needs for quality without
// needing to reconnect with the nas?" The on-device voice (device-voice.js)
// runs the SAME Piper model the NAS runs. For it to sound the same, it must
// feed the model the SAME phoneme ids. This module is that recipe, copied from
// Piper itself (piper-tts 1.8.0: phonemize_espeak.py + phoneme_ids.py):
//
//   1. espeak-ng turns each CLAUSE into IPA phonemes;
//   2. the clause's terminator punctuation is kept (the model reads it as a
//      pause); after , : ; a space follows, because it is not a sentence end;
//   3. the phonemes are split into Unicode NFD codepoints;
//   4. ids = ^ _ (phoneme _)* $  — BOS, pad after every phoneme, EOS.
//
// The one piece Piper gets from espeak-ng that the browser phonemizer does not
// hand back is WHERE the clauses end, so it is re-derived here with espeak's
// own rule: . , ; : ! ? end a clause only when followed by whitespace or the
// end of the text (so "John 1:29" and "$2,450" do NOT break). Parity with
// Piper's own output is measured, not assumed: against the piper binary the
// NAS runs (2023.11.14-2), 10 of 10 test passages gave byte-identical id
// sequences, sentence by sentence. The ids are pinned in
// __tests__/device-voice.test.js (DR-0655 carries the measurement).
//
// Pure. The espeak call is injected, so this runs in a worker, a test, or Node.
// =============================================================================

const TERMINATORS = '.,;:!?';
const SENTENCE_END = '.!?';
const CLOSERS = '"\')]}”’';

/**
 * Split text into espeak-style clauses.
 * @returns {{ text:string, terminator:string, endOfSentence:boolean }[]}
 */
export function splitClauses(text) {
  const s = String(text || '').replace(/\s+/g, ' ').trim();
  const out = [];
  let start = 0;
  for (let i = 0; i < s.length; i++) {
    const ch = s[i];
    if (!TERMINATORS.includes(ch)) continue;
    // Swallow closing quotes/brackets after the mark: `heart,"` ends at the comma.
    let j = i + 1;
    while (j < s.length && CLOSERS.includes(s[j])) j++;
    if (j < s.length && s[j] !== ' ') continue; // "1:29", "2,450", "3.5" stay whole
    const body = s.slice(start, i).trim();
    if (body) out.push({ text: body, terminator: ch, endOfSentence: SENTENCE_END.includes(ch) });
    else if (out.length) {
      // "?!" or ". ." — a bare mark joins the clause before it.
      out[out.length - 1].terminator += ch;
      if (SENTENCE_END.includes(ch)) out[out.length - 1].endOfSentence = true;
    }
    start = j;
    i = j - 1;
  }
  const tail = s.slice(start).trim();
  if (tail) out.push({ text: tail, terminator: '', endOfSentence: true });
  return out;
}

/**
 * Text -> phoneme codepoints grouped by sentence, Piper's way.
 * @param {string} text
 * @param {(clause:string) => Promise<string[]>|string[]} phonemizeClause
 *        espeak-ng IPA for one clause (phonemizer.js returns an array of lines).
 * @returns {Promise<string[][]>}
 */
export async function textToPhonemeSentences(text, phonemizeClause) {
  const sentences = [];
  let current = [];
  for (const clause of splitClauses(text)) {
    const lines = await phonemizeClause(clause.text);
    let ph = (Array.isArray(lines) ? lines : [String(lines || '')]).join(' ').trim();
    ph = ph.replace(/\([^)]+\)/g, ''); // espeak (lang) switch flags, as Piper strips them
    const t = clause.terminator.slice(-1);
    ph += clause.terminator;
    if (t === ',' || t === ':' || t === ';') ph += ' ';
    current.push(...Array.from(ph.normalize('NFD')));
    if (clause.endOfSentence) {
      if (current.length) sentences.push(current);
      current = [];
    }
  }
  if (current.length) sentences.push(current);
  return sentences;
}

/**
 * Sentence PCM (Float32, -1..1) -> one 16-bit mono WAV, the way the piper
 * binary the NAS runs (2023.11.14-2) writes it: each sentence scaled so its
 * peak reaches 32767 (floor 0.01), then 0.2 s of silence after EVERY sentence
 * (its --sentence_silence default; measured: 4410 trailing zero samples at
 * 22050 Hz in the NAS binary's own output).
 * @param {Float32Array[]} sentences
 * @returns {ArrayBuffer}
 */
export function assembleWav(sentences, sampleRate = 22050, silenceSeconds = 0.2) {
  const silence = Math.round(silenceSeconds * sampleRate);
  const total = sentences.reduce((n, s) => n + s.length + silence, 0);
  const buf = new ArrayBuffer(44 + total * 2);
  const v = new DataView(buf);
  const str = (o, s) => { for (let i = 0; i < s.length; i++) v.setUint8(o + i, s.charCodeAt(i)); };
  str(0, 'RIFF'); v.setUint32(4, 36 + total * 2, true); str(8, 'WAVE');
  str(12, 'fmt '); v.setUint32(16, 16, true); v.setUint16(20, 1, true); v.setUint16(22, 1, true);
  v.setUint32(24, sampleRate, true); v.setUint32(28, sampleRate * 2, true); v.setUint16(32, 2, true); v.setUint16(34, 16, true);
  str(36, 'data'); v.setUint32(40, total * 2, true);
  let p = 44;
  for (const s of sentences) {
    let peak = 0.01;
    for (let i = 0; i < s.length; i++) { const a = Math.abs(s[i]); if (a > peak) peak = a; }
    const scale = 32767 / peak;
    for (let i = 0; i < s.length; i++) {
      v.setInt16(p, Math.max(-32768, Math.min(32767, Math.trunc(s[i] * scale))), true);
      p += 2;
    }
    p += silence * 2; // zeros already
  }
  return buf;
}

/** Piper's phonemes_to_ids: ^ _ (p _)* $ ; phonemes the model lacks are skipped. */
export function phonemesToIds(phonemes, idMap) {
  const ids = [...idMap['^'], ...idMap._];
  for (const p of phonemes) {
    const m = idMap[p];
    if (!m) continue;
    ids.push(...m, ...idMap._);
  }
  ids.push(...idMap.$);
  return ids;
}
