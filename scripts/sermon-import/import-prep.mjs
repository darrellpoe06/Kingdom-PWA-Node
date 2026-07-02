// =============================================================================
// import-prep — the PRODUCER for BG's authoritative pre-service outline.
// =============================================================================
// Reads the teacher's own PREP DOCUMENT (a .docx he emails Christina before each
// service), parses it into a clean structured outline (numbered points + the
// scriptures under each) with the SAME pure parser the app uses
// (app/src/lib/prep-outline.js), and upserts it to `sermon_prep` (migration 0067)
// where The Word reads it as the AUTHORITATIVE seed — it beats the rough
// transcript parse. Also fills choir_sermons.scripture_ref (the anchor) so the
// Scripture surface lights up.
//
// DETERMINISTIC-FIRST, NO n8n, sovereign. Deterministic parse (his docs are
// already structured); no LLM, no GPU. If a future teacher's format is genuinely
// unstructured, an LLM assist can front the parse on the CUDA boxes — not needed
// for the structured case we have.
//
// SECURITY. Christina's mailbox (mrspoe06) is OWNER-AUTHORIZED aggregator sourcing
// (she + Darrell consented). Read IN PLACE via the same app-password IMAP path the
// sermon-document importer already uses; nothing is exfiltrated OUT. The points +
// scriptures are church TEACHING content and belong in the church surfaces.
//
// MULTI-TENANT / CHANNEL-AGNOSTIC. The teacher-email source is CONFIG, read from
// content_sources (platform 'gmail-teacher'): { source_key = the teacher's address,
// config.mailbox, config.secret_ref, config.match }. Another church onboards its
// teacher by adding a row — no code change. A bundled DEFAULT covers colg if the
// registry row hasn't been seeded yet.
//
// HONESTY (DR-0076). Every point is a real header BG wrote; every scripture
// literally appears in his document (the parser invents nothing). Each row is a
// DRAFT: needs_review=true, raw_text kept for a human to re-check / re-parse, and
// the parser version recorded — the human-edit learning hook (edited_by) attaches
// on a steward's correction.
//
// Usage (from the repo; secrets in C:/Users/dpoe/.poetech-secrets):
//   node import-prep.mjs               # dry-run: parse + report, write nothing
//   node import-prep.mjs --write       # upsert sermon_prep + set scripture anchors
//   node import-prep.mjs --write --limit 5      # cap emails processed this run
//   node import-prep.mjs --instance <uuid>      # one instance only
// =============================================================================
import { ImapFlow } from 'imapflow';
import { simpleParser } from 'mailparser';
import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'node:fs';
import { inflateRawSync } from 'node:zlib';
import { parsePrepOutline } from '../../app/src/lib/prep-outline.js';

const SUPABASE_URL = 'https://mjjlevhdufpaplypnqrv.supabase.co';
const SECRET_DIR = 'C:/Users/dpoe/.poetech-secrets';
const SPEAKER = 'Bishop Lloyd E. Gwin';
const DOW = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

// Bundled DEFAULT teacher-email source, used only if content_sources has no
// 'gmail-teacher' row yet (e.g. first run before the 0067 seed applied). Keeps the
// producer runnable; the registry row is the real, channel-agnostic seam.
const DEFAULT_SOURCES = {
  colg: { sender: 'bg@thechurchofthelivinggod.com', mailbox: 'mrspoe06@gmail.com', secret_ref: 'gmail-mrspoe06', match: 'proclaim' },
};

const args = process.argv.slice(2);
const WRITE = args.includes('--write');
const LIMIT = (() => { const i = args.indexOf('--limit'); return i >= 0 ? (parseInt(args[i + 1], 10) || Infinity) : Infinity; })();
const ONLY_INSTANCE = (() => { const i = args.indexOf('--instance'); return i >= 0 ? args[i + 1] : null; })();

const serviceKey = readFileSync(`${SECRET_DIR}/supabase-service.txt`, 'utf8').trim();
const sb = createClient(SUPABASE_URL, serviceKey, { auth: { persistSession: false } });

// --- minimal .docx -> text (docx is a zip; word/document.xml holds the body). No
// deps: walk local-file-header entries, inflate document.xml, strip tags. ---------
function docxText(buf) {
  let i = 0;
  while (i + 4 <= buf.length && buf.readUInt32LE(i) === 0x04034b50) {
    const method = buf.readUInt16LE(i + 8);
    const compSize = buf.readUInt32LE(i + 18);
    const nameLen = buf.readUInt16LE(i + 26);
    const extraLen = buf.readUInt16LE(i + 28);
    const name = buf.slice(i + 30, i + 30 + nameLen).toString('utf8');
    const dataStart = i + 30 + nameLen + extraLen;
    const data = buf.slice(dataStart, dataStart + compSize);
    if (name === 'word/document.xml') {
      const xml = method === 8 ? inflateRawSync(data).toString('utf8') : data.toString('utf8');
      return xml
        .replace(/<w:p[ >]/g, '\n<w:p ').replace(/<w:tab\/>/g, ' ')
        .replace(/<[^>]+>/g, '').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
        .replace(/[ \t]+\n/g, '\n').replace(/\n{3,}/g, '\n\n').trim();
    }
    i = dataStart + compSize;
  }
  return '';
}

// Service date + type from a subject like "07-01-2026 ... DOUBLE - PASTOR MCCRAY".
function parseSubjectDate(subject) {
  const m = String(subject).match(/(\d{1,2})[-/.](\d{1,2})[-/.](\d{2,4})/);
  if (!m) return null;
  let mo = +m[1]; let d = +m[2]; let y = +m[3]; if (y < 100) y += 2000;
  if (mo < 1 || mo > 12 || d < 1 || d > 31) return null;
  const dt = new Date(Date.UTC(y, mo - 1, d));
  const type = DOW[dt.getUTCDay()] === 'sunday' ? 'sunday' : 'wednesday'; // BG preaches Sun + Wed
  return { date: `${y}-${String(mo).padStart(2, '0')}-${String(d).padStart(2, '0')}`, type };
}

function readSecret(ref) {
  const raw = readFileSync(`${SECRET_DIR}/${ref}.txt`, 'utf8').trim();
  const eq = raw.indexOf('=');
  return eq >= 0 ? { user: raw.slice(0, eq).trim(), pass: raw.slice(eq + 1).trim() } : { user: null, pass: raw };
}

// Resolve the teacher-email sources for an instance: content_sources rows first
// (the real config seam), else the bundled DEFAULT by slug.
async function resolveSources(instanceId, slug) {
  const { data, error } = await sb.from('content_sources').select('source_key,config,enabled')
    .eq('instance_id', instanceId).eq('platform', 'gmail-teacher');
  if (!error && data && data.length) {
    return data.filter((r) => r.enabled !== false).map((r) => ({
      sender: r.source_key,
      mailbox: r.config?.mailbox,
      secret_ref: r.config?.secret_ref,
      match: (r.config?.match || 'proclaim'),
    }));
  }
  const def = DEFAULT_SOURCES[slug];
  return def ? [def] : [];
}

async function processInstance(inst, totals) {
  const sources = await resolveSources(inst.id, inst.slug);
  if (!sources.length) { console.log(`  (no gmail-teacher source configured for ${inst.slug})`); return; }

  for (const src of sources) {
    const { user, pass } = readSecret(src.secret_ref);
    const matchRe = new RegExp(src.match || 'proclaim', 'i');
    console.log(`\n== ${inst.slug} <- ${src.sender} (mailbox ${src.mailbox}) ==`);
    const client = new ImapFlow({ host: 'imap.gmail.com', port: 993, secure: true, auth: { user: user || src.mailbox, pass }, logger: false });
    await client.connect();
    const lock = await client.getMailboxLock('[Gmail]/All Mail');
    try {
      // Broad fetch from the teacher, newest first — classify per-message on subject
      // OR attachment filename (BG's "PROCLAIM" is often only in the filename).
      const seqs = (await client.search({ from: src.sender })).reverse();
      let processed = 0;
      for (const seq of seqs) {
        if (processed >= LIMIT) break;
        const msg = await client.fetchOne(seq, { source: true, envelope: true });
        const parsed = await simpleParser(msg.source);
        const subject = parsed.subject || '';
        const atts = parsed.attachments || [];
        const docx = atts.find((a) => /\.docx$/i.test(a.filename || ''));
        if (!docx) continue;
        const isPrep = matchRe.test(subject) || matchRe.test(docx.filename || '');
        if (!isPrep) continue;                 // skip calendars / announcements / other
        const when = parseSubjectDate(subject) || parseSubjectDate(docx.filename || '');
        if (!when) { continue; }
        processed += 1;

        const text = docxText(docx.content);
        const outline = parsePrepOutline(text, { subject });
        totals.emails += 1;

        // Match the sermon by (instance, service_date). Create a minimal row if
        // none exists yet (mirrors the doc importer) so the prep is never orphaned.
        let { data: existing } = await sb.from('choir_sermons').select('id,title,scripture_ref')
          .eq('instance_id', inst.id).eq('service_date', when.date).limit(1);
        let sermon = existing && existing[0];
        let created = false;
        if (!sermon) {
          if (!WRITE) { console.log(`  ${when.date} ${when.type} [would create sermon] pts=${outline.points.length} scr=${outline.scriptures.length}`); }
          if (WRITE) {
            const { data: ins, error: e } = await sb.from('choir_sermons').insert({
              instance_id: inst.id, service_date: when.date, service_type: when.type,
              title: outline.theme || subject.slice(0, 120), speaker: SPEAKER, source: 'email', status: 'active',
            }).select('id,title,scripture_ref').single();
            if (e) { console.log(`  ERROR create sermon ${when.date}: ${e.message}`); totals.errors += 1; continue; }
            sermon = ins; created = true;
          } else { sermon = { id: null, scripture_ref: null }; }
        }

        const summary = `${when.date} ${when.type} ${created ? '[new sermon]' : '[matched]'} pts=${outline.points.length} scr=${outline.scriptures.length} :: ${outline.theme || subject.slice(0, 48)}`;
        if (outline.points.length) totals.withPoints += 1; else totals.scripturesOnly += 1;

        if (!WRITE || !sermon.id) { console.log(`  DRY  ${summary}`); totals.dry += 1; continue; }

        const row = {
          instance_id: inst.id, sermon_id: sermon.id, service_date: when.date, service_type: when.type,
          theme: outline.theme || null, anchor: outline.anchor || null,
          points: outline.points, scriptures: outline.scriptures,
          source: 'email', source_ref: subject.slice(0, 200), needs_review: true,
          raw_text: text, version: outline.version, created_by: null,
        };
        const { error: upErr } = await sb.from('sermon_prep').upsert(row, { onConflict: 'instance_id,sermon_id' });
        if (upErr) { console.log(`  ERROR upsert prep ${when.date}: ${upErr.message}`); totals.errors += 1; continue; }
        totals.written += 1;

        // Fill the sermon's scripture anchor if it has none (lights the Scripture
        // surface); don't overwrite a steward's existing value.
        if (outline.anchor && !(sermon.scripture_ref && String(sermon.scripture_ref).trim())) {
          const { error: aErr } = await sb.from('choir_sermons').update({ scripture_ref: outline.anchor }).eq('id', sermon.id);
          if (!aErr) totals.anchors += 1;
        }
        console.log(`  WROTE ${summary}`);
      }
    } finally { lock.release(); }
    await client.logout();
  }
}

async function main() {
  const { data: insts, error } = await sb.from('instances').select('id,slug').eq('instance_type', 'church');
  if (error) { console.error('instances query failed:', error.message); process.exit(1); }
  let list = insts || [];
  if (ONLY_INSTANCE) list = list.filter((i) => i.id === ONLY_INSTANCE);
  if (!list.length) { console.error('no church instances found'); process.exit(1); }

  const totals = { emails: 0, withPoints: 0, scripturesOnly: 0, written: 0, anchors: 0, dry: 0, errors: 0 };
  console.log(`import-prep ${WRITE ? '(WRITE)' : '(dry-run)'} over ${list.length} church instance(s)`);
  for (const inst of list) await processInstance(inst, totals);

  console.log('\n===================================================');
  console.log(`prep emails parsed:      ${totals.emails}`);
  console.log(`  with numbered points:  ${totals.withPoints}`);
  console.log(`  scriptures-only:       ${totals.scripturesOnly}`);
  console.log(WRITE ? `sermon_prep rows written: ${totals.written}` : `would write (dry-run):    ${totals.dry}`);
  if (WRITE) console.log(`scripture anchors set:    ${totals.anchors}`);
  if (totals.errors) console.log(`ERRORS:                  ${totals.errors}`);
  console.log('===================================================');
}

main().catch((e) => { console.error(e); process.exit(1); });
