import { ImapFlow } from 'imapflow';
import { readFileSync } from 'node:fs';

const raw = readFileSync('C:/Users/dpoe/.poetech-secrets/gmail-mrspoe06.txt', 'utf8').trim();
const eq = raw.indexOf('=');
const user = raw.slice(0, eq).trim();
const pass = raw.slice(eq + 1).trim();
const SENDER = 'bg@thechurchofthelivinggod.com';

function collectAtt(node, out = []) {
  if (!node) return out;
  const fn = node.dispositionParameters?.filename || node.parameters?.name || '';
  if (fn) out.push({ filename: fn, type: node.type || '', size: node.size || 0 });
  for (const c of node.childNodes || []) collectAtt(c, out);
  return out;
}

const client = new ImapFlow({ host: 'imap.gmail.com', port: 993, secure: true, auth: { user, pass }, logger: false });
await client.connect();
console.log('Connected as', user);
const lock = await client.getMailboxLock('[Gmail]/All Mail');
try {
  const seqs = await client.search({ from: SENDER });
  console.log(`Total emails from ${SENDER}: ${seqs.length}`);
  if (seqs.length) {
    const recent = seqs.slice(-15);
    const range = recent.join(',');
    let n = 0;
    for await (const msg of client.fetch(range, { envelope: true, bodyStructure: true })) {
      n++;
      const atts = collectAtt(msg.bodyStructure);
      const d = msg.envelope.date?.toISOString?.().slice(0, 10) || '?';
      console.log(`- ${d} | ${(msg.envelope.subject || '(no subject)').slice(0, 75)}`);
      if (atts.length) atts.forEach(a => console.log(`      att: ${a.filename}  [${a.type}]  ${Math.round(a.size/1024)}KB`));
      else console.log('      (no file attachment — doc may be inline/body or a Drive link)');
    }
    console.log(`\nShowed ${n} most recent of ${seqs.length}.`);
  }
} finally { lock.release(); }
await client.logout();
