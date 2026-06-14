import { ImapFlow } from 'imapflow';
import { simpleParser } from 'mailparser';
import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'node:fs';

const SUPABASE_URL = 'https://mjjlevhdufpaplypnqrv.supabase.co';
const BUCKET = 'sermon-documents';
const SENDER = 'bg@thechurchofthelivinggod.com';
const SPEAKER = 'Bishop Lloyd E. Gwin';
const DOW = ['sunday','monday','tuesday','wednesday','thursday','friday','saturday'];
const limitArg = process.argv[2] || '3';
const LIMIT = limitArg === 'all' ? Infinity : (parseInt(limitArg, 10) || 3);

const gmailRaw = readFileSync('C:/Users/dpoe/.poetech-secrets/gmail-mrspoe06.txt', 'utf8').trim();
const eq = gmailRaw.indexOf('='); const user = gmailRaw.slice(0, eq).trim(); const pass = gmailRaw.slice(eq + 1).trim();
const serviceKey = readFileSync('C:/Users/dpoe/.poetech-secrets/supabase-service.txt', 'utf8').trim();
const sb = createClient(SUPABASE_URL, serviceKey, { auth: { persistSession: false } });

function parseSermon(subject) {
  const m = subject.match(/(\d{1,2})[-/](\d{1,2})[-/](\d{2,4})/);
  if (!m) return null;
  let mo = +m[1], d = +m[2], y = +m[3]; if (y < 100) y += 2000;
  if (mo < 1 || mo > 12 || d < 1 || d > 31) return null;
  const dt = new Date(Date.UTC(y, mo - 1, d));
  const serviceType = DOW[dt.getUTCDay()] === 'sunday' ? 'sunday' : 'wednesday'; // BG preaches Sun + Wed
  let title = subject.replace(/.*proclaim\s*[-:•]?\s*/i, '').trim().slice(0, 120);
  return { date: `${y}-${String(mo).padStart(2,'0')}-${String(d).padStart(2,'0')}`, serviceType, title };
}
const safe = (s) => String(s).replace(/[^A-Za-z0-9._ -]/g, '_').slice(0, 120);

const { data: inst, error: instErr } = await sb.from('instances').select('id').eq('slug', 'colg').single();
if (instErr || !inst) { console.error('No colg instance:', instErr); process.exit(1); }
const INSTANCE = inst.id;
// Ensure private bucket.
const { error: bErr } = await sb.storage.createBucket(BUCKET, { public: false });
if (bErr && !/exist/i.test(bErr.message || '')) { console.error('bucket:', bErr.message); }

const client = new ImapFlow({ host: 'imap.gmail.com', port: 993, secure: true, auth: { user, pass }, logger: false });
await client.connect();
const lock = await client.getMailboxLock('[Gmail]/All Mail');
let imported = 0, matched = 0, created = 0, skipped = 0;
try {
  const seqs = (await client.search({ from: SENDER, subject: 'PROCLAIM' })).slice(-LIMIT === -Infinity ? 0 : -LIMIT).reverse();
  console.log(`Processing ${seqs.length} PROCLAIM emails (limit=${limitArg})...`);
  for (const seq of seqs) {
    const msg = await client.fetchOne(seq, { source: true, envelope: true });
    const parsed = await simpleParser(msg.source);
    const subject = parsed.subject || msg.envelope?.subject || '';
    const p = parseSermon(subject);
    if (!p) { skipped++; continue; }
    const docx = (parsed.attachments || []).find(a => /proclaim/i.test(a.filename || '') && /\.docx?$/i.test(a.filename || ''))
      || (parsed.attachments || []).find(a => /\.docx?$/i.test(a.filename || ''));
    if (!docx) { console.log(`  skip (no docx): ${p.date}`); skipped++; continue; }
    // match or create sermon
    let { data: existing } = await sb.from('choir_sermons').select('id,title')
      .eq('instance_id', INSTANCE).eq('service_date', p.date).limit(1);
    let sermonId;
    if (existing && existing.length) { sermonId = existing[0].id; matched++; }
    else {
      const { data: ins, error: e } = await sb.from('choir_sermons').insert({
        instance_id: INSTANCE, service_date: p.date, service_type: p.serviceType,
        title: p.title || safe(docx.filename).replace(/\.docx?$/i,''), speaker: SPEAKER, source: 'email', status: 'active',
      }).select('id').single();
      if (e) { console.log(`  ERROR create ${p.date}: ${e.message}`); skipped++; continue; }
      sermonId = ins.id; created++;
    }
    // upload doc
    const path = `${INSTANCE}/${sermonId}/${safe(docx.filename)}`;
    const { error: upErr } = await sb.storage.from(BUCKET).upload(path, docx.content, { contentType: docx.contentType, upsert: true });
    if (upErr) { console.log(`  ERROR upload ${p.date}: ${upErr.message}`); skipped++; continue; }
    await sb.from('choir_sermon_documents').delete().eq('sermon_id', sermonId);
    const { error: dErr } = await sb.from('choir_sermon_documents').insert({
      instance_id: INSTANCE, sermon_id: sermonId, document_url: path, document_source: 'email',
    });
    if (dErr) { console.log(`  ERROR doc-row ${p.date}: ${dErr.message}`); skipped++; continue; }
    imported++;
    console.log(`  ${p.date} ${p.serviceType} ${existing&&existing.length?'[matched]':'[new]'} ${p.title.slice(0,50)}`);
  }
} finally { lock.release(); }
await client.logout();
console.log(`\nDone. imported=${imported} (matched ${matched} / created ${created}) skipped=${skipped}`);
