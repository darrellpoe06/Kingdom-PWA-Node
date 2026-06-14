import { ImapFlow } from 'imapflow';
import { readFileSync } from 'node:fs';

const raw = readFileSync('C:/Users/dpoe/.poetech-secrets/gmail-mrspoe06.txt', 'utf8').trim();
const eq = raw.indexOf('='); const user = raw.slice(0, eq).trim(); const pass = raw.slice(eq + 1).trim();
const SENDER = 'bg@thechurchofthelivinggod.com';
const DOW = ['sunday','monday','tuesday','wednesday','thursday','friday','saturday'];

function collectAtt(node, out = []) {
  if (!node) return out;
  const fn = node.dispositionParameters?.filename || node.parameters?.name || '';
  if (fn) out.push(fn);
  for (const c of node.childNodes || []) collectAtt(c, out);
  return out;
}
function parseSermon(subject, filenames) {
  const hay = subject + ' ' + filenames.join(' ');
  if (!/proclaim/i.test(hay)) return null;            // sermon marker
  const m = subject.match(/(\d{1,2})[-/](\d{1,2})[-/](\d{2,4})/);
  if (!m) return null;
  let [_, mo, d, y] = m; mo=+mo; d=+d; y=+y; if (y<100) y+=2000;
  if (mo<1||mo>12||d<1||d>31) return null;
  const dt = new Date(Date.UTC(y, mo-1, d));
  const dow = DOW[dt.getUTCDay()];
  const serviceType = dow === 'sunday' ? 'sunday' : dow === 'wednesday' ? 'wednesday' : 'other:'+dow;
  let title = subject.replace(/.*proclaim\s*[-:•]?\s*/i, '').trim();
  return { date: `${y}-${String(mo).padStart(2,'0')}-${String(d).padStart(2,'0')}`, serviceType, title: title.slice(0,80) };
}

const client = new ImapFlow({ host:'imap.gmail.com', port:993, secure:true, auth:{user,pass}, logger:false });
await client.connect();
const lock = await client.getMailboxLock('[Gmail]/All Mail');
const out = [];
try {
  const seqs = await client.search({ from: SENDER, subject: 'PROCLAIM' });
  console.log(`Emails from BG with PROCLAIM in subject: ${seqs.length}`);
  for await (const msg of client.fetch(seqs.join(','), { envelope:true, bodyStructure:true })) {
    const files = collectAtt(msg.bodyStructure);
    const docx = files.filter(f => /\.docx?$/i.test(f));
    const p = parseSermon(msg.envelope.subject || '', files);
    if (p) out.push({ ...p, hasDocx: docx.length>0, file: docx[0] || '(none)' });
  }
} finally { lock.release(); }
await client.logout();

const dated = out.filter(o => !o.serviceType.startsWith('other'));
const sun = dated.filter(o=>o.serviceType==='sunday').length;
const wed = dated.filter(o=>o.serviceType==='wednesday').length;
const other = out.length - dated.length;
const noDoc = out.filter(o=>!o.hasDocx).length;
console.log(`Parsed sermons: ${out.length}  (Sunday ${sun} / Wednesday ${wed} / other-weekday ${other})`);
console.log(`Missing a .docx attachment: ${noDoc}`);
console.log('\nMost recent 12:');
out.sort((a,b)=>b.date.localeCompare(a.date)).slice(0,12).forEach(o=>console.log(`  ${o.date} ${o.serviceType.padEnd(9)} | ${o.title}`));
