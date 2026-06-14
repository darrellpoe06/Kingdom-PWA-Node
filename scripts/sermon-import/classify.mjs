import { ImapFlow } from 'imapflow';
import { readFileSync } from 'node:fs';
const raw = readFileSync('C:/Users/dpoe/.poetech-secrets/gmail-mrspoe06.txt','utf8').trim();
const eq=raw.indexOf('='); const user=raw.slice(0,eq).trim(); const pass=raw.slice(eq+1).trim();
const SENDER='bg@thechurchofthelivinggod.com';
function atts(n,o=[]){ if(!n) return o; const f=n.dispositionParameters?.filename||n.parameters?.name||''; if(f) o.push(f); for(const c of n.childNodes||[]) atts(c,o); return o; }
function classify(subject, files){
  const hay=(subject+' '+files.join(' '));
  if(/proclaim/i.test(hay)) return 'sermon';
  if(/(order of service|announcement|calendar)/i.test(hay)) return 'team';
  return 'skip';
}
const client=new ImapFlow({host:'imap.gmail.com',port:993,secure:true,auth:{user,pass},logger:false});
await client.connect();
const lock=await client.getMailboxLock('[Gmail]/All Mail');
const cat={sermon:0,team:0,skip:0}; const skipSamples=[]; const teamSamples=[];
try{
  const seqs=await client.search({from:SENDER});
  for await (const msg of client.fetch(seqs.join(','),{envelope:true,bodyStructure:true})){
    const files=atts(msg.bodyStructure);
    const hasDoc=files.some(f=>/\.(docx?|pdf|xlsx?)$/i.test(f));
    const c=classify(msg.envelope.subject||'',files);
    cat[c]++;
    if(c==='skip' && hasDoc && skipSamples.length<14) skipSamples.push((msg.envelope.subject||'').slice(0,72));
    if(c==='team' && teamSamples.length<10) teamSamples.push((msg.envelope.subject||'').slice(0,72));
  }
}finally{ lock.release(); }
await client.logout();
console.log(`From BG total: ${cat.sermon+cat.team+cat.skip}`);
console.log(`  sermon (PROCLAIM -> ADMIN-only): ${cat.sermon}`);
console.log(`  team   (order/announce/calendar -> CHOIR team): ${cat.team}`);
console.log(`  skip   (not imported): ${cat.skip}`);
console.log('\nTEAM samples:'); teamSamples.forEach(s=>console.log('  + '+s));
console.log('\nSKIPPED-with-attachment samples (confirm these should NOT import):'); skipSamples.forEach(s=>console.log('  - '+s));
