import { ImapFlow } from 'imapflow';
import { simpleParser } from 'mailparser';
import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'node:fs';

const SUPABASE_URL = 'https://mjjlevhdufpaplypnqrv.supabase.co';
const BUCKET = 'church-team-documents';
const SENDER = 'bg@thechurchofthelivinggod.com';
const MONTHS = {january:1,february:2,march:3,april:4,may:5,june:6,july:7,august:8,september:9,october:10,november:11,december:12};
const limitArg = process.argv[2] || '3';
const LIMIT = limitArg === 'all' ? Infinity : (parseInt(limitArg, 10) || 3);

const g = readFileSync('C:/Users/dpoe/.poetech-secrets/gmail-mrspoe06.txt','utf8').trim();
const eq=g.indexOf('='); const user=g.slice(0,eq).trim(); const pass=g.slice(eq+1).trim();
const serviceKey = readFileSync('C:/Users/dpoe/.poetech-secrets/supabase-service.txt','utf8').trim();
const sb = createClient(SUPABASE_URL, serviceKey, { auth:{persistSession:false} });

function classify(hay){
  if(/order of service/i.test(hay)) return 'order-of-service';
  if(/announcement/i.test(hay)) return 'announcements';
  if(/calendar/i.test(hay)) return 'calendar';
  return null;
}
function parseDate(subject){
  let m=subject.match(/(\d{1,2})[-/](\d{1,2})[-/](\d{2,4})/);
  if(m){ let mo=+m[1],d=+m[2],y=+m[3]; if(y<100)y+=2000; if(mo>=1&&mo<=12&&d>=1&&d<=31) return `${y}-${String(mo).padStart(2,'0')}-${String(d).padStart(2,'0')}`; }
  m=subject.match(/([A-Za-z]+)\s+(\d{4})/);
  if(m && MONTHS[m[1].toLowerCase()]){ return `${m[2]}-${String(MONTHS[m[1].toLowerCase()]).padStart(2,'0')}-01`; }
  return null;
}
const safe=(s)=>String(s).replace(/[^A-Za-z0-9._ -]/g,'_').slice(0,120);

const inst=(await sb.from('instances').select('id').eq('slug','colg').single()).data.id;
const { error:bErr } = await sb.storage.createBucket(BUCKET,{public:false});
if(bErr && !/exist/i.test(bErr.message||'')) console.error('bucket:',bErr.message);

const client=new ImapFlow({host:'imap.gmail.com',port:993,secure:true,auth:{user,pass},logger:false});
await client.connect();
const lock=await client.getMailboxLock('[Gmail]/All Mail');
let imported=0, skipped=0, dupe=0;
try{
  let seqs=await client.search({from:SENDER});
  seqs = LIMIT===Infinity ? seqs : seqs.slice(-LIMIT);
  seqs=seqs.reverse();
  console.log(`Scanning ${seqs.length} BG emails for team docs (limit=${limitArg})...`);
  for(const seq of seqs){
    const msg=await client.fetchOne(seq,{source:true,envelope:true});
    const parsed=await simpleParser(msg.source);
    const subject=parsed.subject||msg.envelope?.subject||'';
    const files=(parsed.attachments||[]).filter(a=>/\.(docx?|pdf)$/i.test(a.filename||''));
    const type=classify(subject+' '+files.map(f=>f.filename).join(' '));
    if(!type || !files.length){ skipped++; continue; }
    const emailId=parsed.messageId||msg.envelope?.messageId||`seq-${seq}`;
    const { data:exist }=await sb.from('choir_team_documents').select('id').eq('instance_id',inst).eq('email_id',emailId).limit(1);
    if(exist&&exist.length){ dupe++; continue; }
    const att=files[0];
    const path=`${inst}/${safe(emailId)}/${safe(att.filename)}`;
    const { error:upErr }=await sb.storage.from(BUCKET).upload(path,att.content,{contentType:att.contentType,upsert:true});
    if(upErr){ console.log(`  ERR upload: ${upErr.message}`); skipped++; continue; }
    const { error:iErr }=await sb.from('choir_team_documents').insert({
      instance_id:inst, doc_date:parseDate(subject), doc_type:type, title:subject.slice(0,150),
      document_url:path, document_source:'email', email_id:emailId,
    });
    if(iErr){ console.log(`  ERR row: ${iErr.message}`); skipped++; continue; }
    imported++;
    if(imported<=6) console.log(`  ${type} | ${subject.slice(0,60)}`);
  }
}finally{ lock.release(); }
await client.logout();
console.log(`\nDone. imported=${imported} dupe=${dupe} skipped=${skipped}`);
