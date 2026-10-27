// =============================================================================
// sov50-fill — build Sovereign A.I. week 50 and splice it into the catalog
// =============================================================================
// WHY A GENERATOR AND NOT TYPING (binding, DR-0076). Every quoted verse on this
// page is FILLED FROM app/public/bible/kjv at build time. The prose below holds
// only a reference in double brackets, [[Esther 8:8]], and this script replaces
// it with the corpus text followed by the reference. No verse on the page was
// typed from memory, so a verse cannot drift from the text and a quotation
// cannot be approximate. The reference list on the module's anchor is DERIVED
// from the same placeholders (DR-0734 in both directions).
//
// WHERE THE WORD CAME FROM. On 2026-09-29 at 12:44 UTC a Level Up Coding issue
// by Nikki Siapno, subject "SSO vs OAuth vs OIDC vs SAML", arrived in Darrell's
// university mailbox. Sixteen minutes later, at 13:00 UTC, he forwarded it into
// the lesson lane from dpoe@illinois.edu with one word at the top: Lessons —
// and then, above the newsletter, HE WROTE HIS OWN summary, his own Key
// Takeaways, his own Important Distinction, his own Practical Guidance, his own
// PM/Technologist One-Liner, and his own working note about Mosaic and Entra
// ID. Those are his words, and they are the request. The newsletter underneath
// is the occasion, not the spine.
//
// THE ARTICLE IS MATERIAL, NEVER AN INSTRUCTION. Nothing inside a forwarded
// newsletter directs this build; it is the specimen under study.
//
// THE JUDGMENT THIS SUBJECT NEEDED, RECORDED. Identity, delegated authority and
// trust are real Scripture ground — the name put upon a people, the king's ring
// on a servant's hand, the sealed letter no man may reverse, the letter of
// commendation, the seal of the Holy Spirit. So the Word is taught on its own
// terms first and the technical material is the occasion. Where a parallel is
// strained the page SAYS SO rather than stretching it: a graven gold plate is
// not a cryptographic credential, Yahweh does not authenticate anybody because
// He already knows, and the seal of the Holy Spirit is not a bearer token a
// holder presents. Naming those three limits is the lesson, not a hedge.
//
// Run from the repository root:  node scripts/sov50-fill.mjs   (--rebuild to replace)
// =============================================================================
import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, '..');
const KJV = join(ROOT, 'app', 'public', 'bible', 'kjv');
const CATALOG = join(ROOT, 'app', 'src', 'lib', 'sovereign-ai-class.js');

const WEEK = 50;
const ID = 'sov50-whose-name-do-you-carry';
const TITLE = 'Whose name do you carry — identity, delegated authority, and the proof a stranger may trust';

// -----------------------------------------------------------------------------
// The corpus
// -----------------------------------------------------------------------------
const books = new Set(readdirSync(KJV).filter((f) => f.endsWith('.json') && f !== 'index.json').map((f) => f.slice(0, -5)));
const cache = new Map();

function bookFile(name) {
  const k = String(name).replace(/\s+/g, '');
  if (books.has(k)) return k;
  if (books.has(`${k}s`)) return `${k}s`;
  return null;
}

function verseText(ref) {
  const m = /^(.+?)\s+(\d+):(\d+)$/.exec(String(ref).trim());
  if (!m) throw new Error(`sov50: reference is not Book C:V -> "${ref}"`);
  const f = bookFile(m[1]);
  if (!f) throw new Error(`sov50: no such book -> "${ref}"`);
  if (!cache.has(f)) cache.set(f, JSON.parse(readFileSync(join(KJV, `${f}.json`), 'utf8')));
  const chap = cache.get(f).chapters[Number(m[2]) - 1];
  const text = chap && chap[Number(m[3]) - 1];
  if (!text) throw new Error(`sov50: reference does not resolve in the corpus -> "${ref}"`);
  return text;
}

const used = [];
const seen = new Set();

function fill(text) {
  return String(text).replace(/\[\[([^\]]+)\]\]/g, (_, ref) => {
    const r = ref.trim();
    const t = verseText(r);
    if (!seen.has(r)) { seen.add(r); used.push(r); }
    return `"${t}" (${r})`;
  });
}

function fillDeep(value) {
  if (typeof value === 'string') return fill(value);
  if (Array.isArray(value)) return value.map(fillDeep);
  if (value && typeof value === 'object') {
    const out = {};
    for (const [k, v] of Object.entries(value)) out[k] = fillDeep(v);
    return out;
  }
  return value;
}

// -----------------------------------------------------------------------------
// The talk-together close, in this lesson's own words, in all three directions,
// written at each band's own level (a reader reads ONE band, DR-0795).
// -----------------------------------------------------------------------------
const RHYTHM = 'Do it once today, in one of the four places of Deuteronomy 6:7 - at the table, on the way, at bedtime, or first thing - and with one friend this week.';
const TALK = {
  lesson: `TALK ABOUT IT TOGETHER. Parents, ask your child one open question today - whose name are you carrying when you are out of my sight - and listen all the way to the end before you teach anything, have them retell the question in their own words, then teach them one verse back, Numbers 6:27. Children, ask your mom, dad or grandparent who vouched for them when they were young and nobody knew them yet, listen all the way through, then retell their answer in your own words. Friends, tell one friend this week what the evil spirit asked the exorcists in Acts 19, who are ye, ask them who actually knows them, and pray one for another, so we all get healthy together until we see that Yahweh has been right. ${RHYTHM} Measure the growth the Word's way: by the fruit, [[Galatians 5:22]] by the occasions, [[Deuteronomy 6:7]] and by the days, [[Hebrews 3:13]]`,
  child: `TALK ABOUT IT TOGETHER. Parents, ask your child one open question today - whose name do you carry when you go out the door - and listen all the way to the end, have them retell it in their own words, then teach them one verse back, Numbers 6:27. Children, ask your mom or dad or grandma or grandpa about a time somebody said yes you may trust him, listen all the way through, then retell it in your own words. Friends, tell one friend this week about the ring the king put on Joseph's hand, ask them what they think, and pray for each other, so we all get healthy together until we see that Yahweh has been right. ${RHYTHM}`,
  youth: `TALK ABOUT IT TOGETHER. Parents, ask your child one open question today - what would somebody have to show you before you let them into our house - and listen all the way to the end, have them retell the test in their own words, then teach them one verse back, Esther 8:8. Children, ask your mom, dad or grandparent whether anybody ever used their name without asking, listen all the way through, then retell their answer in your own words. Friends, tell one friend this week one thing this lesson showed you about a sealed letter that was true and wicked at the same time, ask what they see, and pray one for another, so we all get healthy together until we see that Yahweh has been right. ${RHYTHM}`,
  teen: `TALK ABOUT IT TOGETHER. Parents, ask your child one open question today - what does an app actually learn about you when you tap the button that says continue with another account - and listen all the way to the end, have them retell the trade in their own words, then teach them one verse back, Matthew 10:5. Children, ask your mom, dad or grandparent what they were trusted to do in somebody else's name, and what the bounds were, listen all the way through, then retell it in your own words. Friends, tell one friend this week one thing this lesson showed you about the difference between being authenticated and being known, ask what they see, and pray one for another, so we all get healthy together until we see that Yahweh has been right. ${RHYTHM} Measure the growth the Word's way: by the fruit, [[Galatians 5:22]] by the occasions, [[Deuteronomy 6:7]] and by the days, [[Hebrews 3:13]]`,
  senior: `TALK ABOUT IT TOGETHER. Grandparents, ask the children in your house one open question today - who would speak for you if a stranger asked whether you could be trusted - and listen all the way to the end, have them retell the answer in their own words, then teach them one verse back, Romans 16:2. Children, ask your parents or grandparents who wrote the letter, made the call, or walked them in the door the first time, listen all the way through, then retell it back to them in your own words. Friends, tell one friend this week one thing this lesson showed you about a name borne rather than claimed, ask what they see, and pray one for another, so we all get healthy together until we see that Yahweh has been right. ${RHYTHM}`,
};

// -----------------------------------------------------------------------------
// The adult lesson, in ten movements. The Word first in every one of them.
// -----------------------------------------------------------------------------
const LESSON = [

`FIRST, WHERE THIS CAME FROM, WHOSE WORDS ARE THE REQUEST, AND WHAT NOBODY HERE VERIFIED. On the twenty-ninth of September 2026, at 12:44 in the morning by universal time, a technical newsletter arrived in Darrell's university mailbox: the Level Up Coding issue by Nikki Siapno, subject line SSO vs OAuth vs OIDC vs SAML. Sixteen minutes later he forwarded it into this app from his university address with one word at the top: Lessons. And he did not simply forward it. Above the newsletter he wrote his OWN summary, his own Key Takeaways, his own table of what each technology is primarily for, his own Practical Guidance, his own one-line translation for a product manager, and his own working note that for the Mosaic and single-sign-on discussions he is in, the common modern pattern would be Microsoft Entra ID with OpenID Connect for user sign-in and OAuth 2.0 for interface access, with older enterprise applications still on SAML. THOSE ARE HIS WORDS, and they are the request this lesson answers. The newsletter is the occasion. Read the provenance before the teaching, and read the limits with it. A forwarded newsletter plus a forwarded summary is the whole source. Nobody here opened the published specifications - not the OAuth 2.0 framework document, not the OpenID Connect core document, not the SAML 2.0 standard - and nobody here stood up a directory tenant, read a vendor's contract, or tested a single sign-in flow for this page. So the mechanics below are carried AS REPORTED by that newsletter and as summarised by Darrell, and that is said here rather than implied. Two further honesties. The issue carried a sponsored segment, an advertisement about designing programming interfaces for A.I. work, which is advertising; this lesson rests not one sentence on it. And Mosaic, in his note, is a system inside his workplace that this page knows nothing about beyond the fact that he named it; nothing here is advice about it. One thing this house normally has to surface was absent, and absence is worth reporting too: neither the newsletter nor his summary capitalised any name of the adversary, so there was no typographic conflict to carry through or correct.`,

`SECOND, THE WORD FIRST: THE TWO QUESTIONS, AND THE ONE WHO NEVER HAD TO ASK EITHER. Darrell's own first takeaway is the right place to begin, because it is the distinction everything else hangs on. Authentication, he wrote, is proving who you are. Authorization is determining what you are allowed to access. The newsletter puts the same split as two questions: what needs to be proven, and who needs to trust that proof. Now go to the Word, and notice what is NOT there. Yahweh never authenticates anyone. There is no verification step in Him, because authentication is a remedy for not knowing, and He has no such lack. He names His own and He knows them: [[Isaiah 43:1]] I have called thee by thy name; thou art mine. That is identity conferred by the One with the right to confer it, and it is settled before any proof is offered. And the apostle puts the same thing as a seal that does not depend on the bearer's assertion at all: [[2 Timothy 2:19]] The Lord knoweth them that are his. Knoweth, not checks. Hold that, because it is the hinge of the whole week. All the machinery in the forwarded article - identity providers, tokens, assertions, audiences, expiries - exists because human beings do not know each other. It is a remedy for distance and for strangers. That is not a criticism of it; it is its correct dignity. And it explains why the Word is so full of this subject once you look: names put upon a people, a signet pressed into wax, a ring taken off one hand and placed on another, letters carried between cities by men who had never met the sender. Among strangers, proof has to travel. The Word worked that problem long before anybody wrote a protocol for it, and it worked it with more honesty, because it never pretended the proof was the same thing as the person.`,

`THIRD, THE NAME PUT UPON A PEOPLE: IDENTITY IS CONFERRED, WORN, AND READ BY SOMEBODY ELSE. In Scripture your identity is not a claim you make. It is a name placed on you by Yahweh, and the placing is the blessing: [[Numbers 6:27]] Then look at the one piece of the high priest's clothing that is described exactly like a seal, because the detail is not decoration. The plate on the mitre was engraved the way a signet is engraved, and what was graven on it was not Aaron's name: [[Exodus 28:36]] It was worn on the forehead, in the one place a man cannot hide and cannot read himself, and the stated purpose of wearing it was acceptance: [[Exodus 28:38]] Three things are true of that plate and all three matter here. It was ISSUED by the One with authority to issue it, not minted by the wearer. It was WORN WHERE OTHERS READ IT rather than kept where only the owner could see it. And its purpose was to make the bearer acceptable in a place he could not have entered on his own account. Now the honest limit, stated plainly rather than stretched: a graven plate of gold is not a cryptographic credential. It carried no secret, it proved nothing to a stranger who had never seen the command that made it, and nobody could verify it mathematically. Calling it a token would be a cute analogy and this house does not need one. What it genuinely is, and what is far more useful, is the Word's doctrine of borne identity: a name you did not give yourself, worn openly, for acceptance you could not have earned. The promise at the end of the Book is the same gift made permanent: [[Revelation 3:12]] And that is why a name is worth more than money in the Word's own economy: [[Proverbs 22:1]]`,

`FOURTH, DELEGATED AUTHORITY: THE RING, THE SEALED LETTER, AND WHY IT IS NOT A PASSWORD. Here the parallel is not strained at all, and it is worth saying so as plainly as the limits were said. Darrell's second movement is OAuth: an application is given access to resources on your behalf WITHOUT being given your password, and what it holds is a token that grants limited permission. The Word has that exact instrument, twice, in detail. Pharaoh set Joseph over Egypt and handed him a physical credential: [[Genesis 41:41]] [[Genesis 41:42]] The ring was the signing key of the kingdom. Whoever held it could seal a document that officials who had never met Joseph would obey, because the seal was the king's. And the very next sentence guards the thing that matters most about delegation, which is that the delegator does not stop being himself: [[Genesis 41:44]] I am Pharaoh. Real authority, really handed over, with the identity of the grantor intact. That is the difference between a delegated token and a stolen password, and Genesis states it in four words. Esther carries the same instrument further and names its force precisely: [[Esther 8:8]] Read what that sentence is actually about. Not the courier. Not the parchment. The authority rides on the king's name and the king's seal, and the receiving officials act because of the issuer, not because of the bearer. Then watch it executed: [[Esther 8:10]] Posts on horseback, riders on mules, camels and dromedaries - the transport is irrelevant to the trust, which is exactly the newsletter's point that the format is secondary and the question is what the artifact proves and who is allowed to trust it. The Word got there first, and got there with a king's ring.`,

`FIFTH, SCOPE: THE COMMISSION NAMED WHAT AND WHERE, AND ONLY THE SENDER COULD WIDEN IT. A token that can do anything is not a delegation; it is a handover. The Word is careful about this in a way most of us are not. When the Lord Jesus sent out the twelve, the authority was specific and so was the territory. The power was named: [[Matthew 10:1]] The ground was bounded, and the bound was stated before they left: [[Matthew 10:5]] The sending had a shape even in its arrangement, two by two, with the authority named again: [[Mark 6:7]] And the grant was genuinely large within its bounds, which is why scope is not the same thing as timidity: [[Luke 10:19]] Then notice who changes a scope. After the resurrection the bound in Matthew 10:5 is gone, and it is gone because the Sender widened it on the ground of an authority that was never the messengers' to begin with: [[Matthew 28:18]] [[Matthew 28:19]] All power is given unto ME, therefore go. The scope moved because the One who issued it moved it. The messengers never voted themselves more. And the Word names the opposite case too, which is the one every engineer has met: authority CLAIMED that was never granted. When the Jerusalem assembly wrote to Antioch, this is the sentence they put in the letter: [[Acts 15:24]] To whom we gave no such commandment. Men had gone out from a trusted house, carried its reputation, taught what that house never authorised, and troubled whole congregations with it. That is over-scope in one verse, written down two thousand years before anybody called it privilege escalation.`,

`SIXTH, THE FORGED LETTER: A GENUINE SEAL ON A WICKED INSTRUCTION. Now the hardest movement, and the one the forwarded article cannot reach, because it is not a protocol question at all. Jezebel wanted Naboth's vineyard, and what she did was not to break a seal. She used one: [[1 Kings 21:8]] Written in Ahab's name. Sealed with his seal. Sent to the officials of the city who knew that seal and trusted it. The instruction inside was a judicial murder dressed as a religious observance: [[1 Kings 21:9]] And the elders obeyed, exactly as the instrument intended, because the instrument was valid: [[1 Kings 21:11]] Hold that against the four checks the newsletter rightly insists upon. Validate the signature: it was genuine. Validate the issuer: it was the king's own seal. Validate the audience: the letters were addressed to precisely the elders who received them. Validate the validity window: there was nothing stale about them. Four for four - and Naboth was stoned. So state the truth plainly, because under-claiming it would be its own lie. Validation proves WHO ISSUED a thing. It can never prove that what the thing asks is righteous. That is not a defect in the protocols; it is the boundary of what any protocol can do, and pretending otherwise is how a house ends up obeying a well-formed instruction it should have refused. The Word knows this failure by name and treats it as the issuer's crime rather than the courier's: men who prophesy a lie in Yahweh's own name are answered from above the seal, not by a better seal: [[Jeremiah 29:21]] Which means the last line of defence in any system of delegated authority was never cryptographic. It is a steward willing to read the instruction and say no.`,

`SEVENTH, THE NAME WITHOUT THE RELATIONSHIP: WHERE THE WHOLE TECHNICAL FRAME RUNS OUT. There is a scene in Acts that reads like an authentication failure and is actually something deeper. Travelling exorcists in Ephesus used the correct form of words, and the text is careful to record that the form was correct: [[Acts 19:13]] We adjure you by Jesus whom Paul preacheth. Correct name, correct syntax, correct reference to a known and trusted party. And the answer they got was an identity check they could not pass: [[Acts 19:15]] Jesus I know, and Paul I know; but who are ye? Not what did you say. WHO ARE YE. And it did not go well for them: [[Acts 19:16]] The Lord Jesus taught the same thing as the final verdict, and He put it in the most unsettling terms in the Gospels, because the works were real and the name was correctly invoked: [[Matthew 7:22]] [[Matthew 7:23]] I never knew you. Here is the distinction this whole lesson exists to make, and it is worth saying slowly. A bearer token works PRECISELY BECAUSE the resource being guarded does not need to know you. That is its efficiency and that is its usefulness, and it is why systems scale. The Word's standard of identity is the exact opposite: being known. No artifact manufactures that, no identity provider federates it, and nothing in any of the four technologies Darrell summarised was ever designed to. This is where the technical frame honestly runs out, and the Word puts the last twist on it in one of the saddest sentences in Scripture - a true credential refused and a self-issued one welcomed: [[John 5:43]] If another shall come in his own name, him ye will receive.`,

`EIGHTH, THE LETTER OF COMMENDATION: THE WORD'S OWN SHARED TRUST, AND THE LIVING WITNESS BESIDE THE PAPER. Darrell's third takeaway is single sign-on, and he states the thing most people get wrong about it: it is a user experience, not a protocol, and it works because several applications trust the same identity provider. The early assemblies ran that arrangement, with ink. A believer travelling to a city where nobody knew him carried a letter from an assembly that did, and the receiving assembly acted on the strength of the issuer. Paul names the practice as ordinary: [[2 Corinthians 3:1]] He writes one himself for a sister travelling to Rome, and the letter does three things a modern assertion does - it identifies the subject, it states her standing, and it tells the recipient what to do: [[Romans 16:1]] [[Romans 16:2]] Luke records the same mechanism for Apollos: [[Acts 18:27]] Nehemiah asked a king for exactly such letters, addressed to named officials, so that he could cross territory where his face meant nothing: [[Nehemiah 2:7]] and the audience of a credential is why they worked, because he handed them to the men they were written to: [[Nehemiah 2:9]] And the Word does not hide the fact that the identical mechanism serves a wicked errand just as well. Saul of Tarsus went to the high priest for letters, and the letters were a warrant for arrest: [[Acts 9:2]] Same instrument. Opposite errand. Then look at the one refinement the Jerusalem letter adds, which modern practice calls an out-of-band confirmation and which the Word simply does: the paper did not travel alone. [[Acts 15:23]] [[Acts 15:27]] Who shall also tell you the same things by mouth. A second channel, carried by living men, saying the same thing - and that is the answer to the forged letter of the sixth movement, arriving six chapters earlier than anybody needed it. Finally, the apostle refuses to rest on paper at all, and says what actually commends a work: [[2 Corinthians 3:2]] [[2 Corinthians 3:3]] Not with ink. Not in tables of stone. That is not a security control and this page will not pretend it is one. It is the senior truth above every security control: in the end the credential is the fruit.`,

`NINTH, THE SEAL ON A PERSON, AND WHERE THE ANALOGY MUST STOP. The Word uses the word seal for something it would be easy and wrong to flatten into a token. Those who believe are sealed, and the sealing is done BY Yahweh, not presented by the believer: [[Ephesians 1:13]] [[2 Corinthians 1:22]] Stop and mark the difference, because this is the third limit this lesson names on purpose. A bearer token is held by the bearer, can be copied, can be stolen, can be replayed by whoever picks it up, and expires. The seal of the Holy Spirit is none of those things. It is not an artifact a person carries to a gate; it is Yahweh's own mark on the person, kept by Him, and what it secures is the believer rather than a request. Pressing it into service as an illustration of session management would be exactly the strained analogy this house refuses. So it is taught for what it is, and the technical material is simply set beside it and left there. And the Word closes the whole subject of names where it must close, with the one Name that is not delegated to anybody: [[Philippians 2:9]] [[Philippians 2:10]] [[Philippians 2:11]] Which is why the first question the authorities in Jerusalem asked the apostles was an identity question about authority, and why the answer named a person rather than an office: [[Acts 4:7]] [[Acts 4:10]] By what power, or by what name. And it is why the believer's own commission covers everything he does, in the Name, with nothing left outside the scope: [[Colossians 3:17]]`,

`TENTH, HIS PRACTICAL GUIDANCE, WHAT THIS HOUSE ACTUALLY DOES, AND THE CLOSE. Carried as HIS words, because they are the request and not this page's invention, here is the guidance Darrell wrote above the newsletter. Need one login across applications - single sign-on, typically using OpenID Connect or SAML. Need user authentication - OpenID Connect. Need interface access on behalf of a user - OAuth 2.0. Need both login and interface access - OpenID Connect together with OAuth 2.0. Integrating with older enterprise identity systems - SAML. Service-to-service authorization with no user involved - OAuth 2.0. And his one-line translation, which is the most useful four lines in the whole forward: single sign-on is user convenience, OAuth is permissions, OpenID Connect is identity, SAML is enterprise identity federation. His closing note about Entra ID with OpenID Connect for sign-in and OAuth for interface access, with SAML on the older applications, is HIS working note for HIS workplace discussions; this page carries it and verifies nothing about it. Now this house, measured rather than claimed. This app does hold a delegated secret of exactly the kind the week is about: the browser never calls the machine at home directly, it calls a same-origin path on our own site which forwards the request, and the bearer value that authorises that forwarding is held on the machine and synchronised by a workflow that runs over our own private network, masked in every log, never printed into a page and never pasted by hand. That is a scoped credential with a named owner and a rotation path, and it is the sixth movement's lesson built into plumbing: the value proves who is calling, and a steward still decides what the call is allowed to ask for. The course holds the neighbouring ground and this week does not repeat it - week nineteen for the servant under authority, week thirty-one for whose errand an agent carries, week forty-four for the thief who forgot his own door, week forty-five for the second witness, week forty-six for the helper that must see everything. What lands HERE is the identity seam: who you are, who vouches for you, what a token lets a holder do on your behalf, and the three places where the comparison stops. Then the close, which is the only place this subject can honestly end. The one who bears the Name for us is Jesus, the Lamb of Yahweh, [[John 1:29]] the Eternal Son of Yahweh whom the Father gave, [[John 3:16]] whose throne is for ever: [[Hebrews 1:8]] He did not come in His own name, and He is the one credential that was never forged, never stolen and never needed renewing. Scope your tokens. Validate your assertions. Refuse the well-formed instruction that is wicked. And then remember that the thing no identity provider can issue you is the one thing you will finally be asked for: that He knows you.`,

];

// -----------------------------------------------------------------------------
// The four age bands, each WRITTEN FOR ITS READER. Each opens by naming the
// lesson (title-in-narrative), and each closes with all three directions.
// -----------------------------------------------------------------------------
const CHILD = `WHOSE NAME DO YOU CARRY - identity, delegated authority, and the proof a stranger may trust. That is a big name for a lesson. Let us make it small.

WHERE IT CAME FROM. Darrell got a letter about computers in his work mail. That was on the twenty-ninth of September 2026. Sixteen minutes later he sent it to this app. On top he wrote one word. Lessons. Then he wrote his own notes about it. His own words, not the letter's words. We teach his notes first.

Here is the honest part. We only read that one letter and his notes. We did not go read the big rule books behind it. So we say so, out loud, right here. That is what honest people do.

TWO QUESTIONS, NOT ONE. The letter was about how a computer learns who you are. And how it learns what you may do. Those are two different things. Not one thing. Two.

Think of a guard at a gate. He asks, who are you? That is the first question. Then he asks, what may you do in here? That is the second question. Both. Every time.

Here is a way to feel it. Your mom knows your face. She never has to check. But a man at a front desk has never seen you. He has to check. He needs proof. Your mom does not.

YAHWEH NEVER HAS TO CHECK. Now the best part of the whole lesson. Yahweh never asks the first question. He does not need to check who you are. He already knows. He gave you your name.

Listen to what He says. [[Isaiah 43:1]] Thou art mine. That is not a guess. That is a gift.

And He knows who is His. [[2 Timothy 2:19]] Knows. Not checks. There is a big difference.

So why do we need gates and cards and passwords at all? Because WE do not know each other. We are strangers. A guard has never met you. So proof has to travel from one place to another. Yahweh needs no proof to travel. He is already there. That is the whole difference, and it is good news.

THE SHINY PLATE ON THE HAT. Long ago Yahweh picked a man named Aaron to serve Him. Aaron wore a special hat. On the front was a plate of pure gold. Words were cut into it, the way a ring is cut. [[Exodus 28:36]]

The words were not Aaron's name. The words were about Yahweh.

He wore it right on his forehead. That is the one spot you cannot hide. And you cannot read it yourself. Other people read it for you. [[Exodus 28:38]]

Three things about that plate. One. Yahweh said to make it. So Aaron did not make up his own name tag. Two. Aaron wore it where everybody could see. Three. It was so Aaron could be welcome in a holy place. He could not have gone in by himself.

Now the honest part again. That plate was not a password. It was not a secret code. A stranger far away could not test it. We will not pretend it was a code. A weak story is worse than no story.

But it does teach us a true thing, and the true thing is bigger. Your real name is GIVEN to you. You wear it. You do not make it up. And one day Yahweh will write His own name on the ones who are His. [[Revelation 3:12]]

That is why the Word says a good name is worth more than money. [[Proverbs 22:1]] More than silver. More than gold. Think about that.

THE KING'S RING. Here is a true story. A man named Joseph had been in prison for years. Then the king of Egypt made him second in the whole land. [[Genesis 41:41]] And the king gave him something very small and very strong. [[Genesis 41:42]]

A ring! Why a ring? Because that ring could press a mark into soft wax. The mark meant the king said so. Men who had never met Joseph would do what the letter said. They trusted the mark. They did not even know the man.

But look at the next thing the king said. [[Genesis 41:44]] I am Pharaoh. Did you hear that? The king did not stop being the king. He only LENT his power. Joseph could use it. Joseph did not own it.

You already know this one. Your mom can let a sitter put you to bed. The sitter is not your mom. The sitter is allowed to do bedtime. That is all she is allowed to do. She cannot sell the car.

In a queen's story the same ring shows up. [[Esther 8:8]] No man can undo it. Not because the paper is strong. Because the king's name is on it.

And how did those letters go out? On horses. On mules. On camels. [[Esther 8:10]] It did not matter one bit how they went. What mattered was whose name was on them.

THE JOBS HAD EDGES. When Jesus sent out His twelve helpers, He told them what they could do. [[Matthew 10:1]] Then He told them where to go, and where NOT to go. [[Matthew 10:5]]

So the job had edges. Like a fence around a yard.

And the job inside the fence was big. Very big. [[Luke 10:19]] So edges are not because Jesus was worried. Edges are just honest.

Later Jesus moved the fence. But look what He said first. [[Matthew 28:18]] All power is given unto HIM. So then He said, now go to everybody. [[Matthew 28:19]]

Who moved the fence? The One who made it. The helpers never gave themselves a bigger job. That is the rule.

And the Word tells us about men who DID give themselves a bigger job. They went out from a good church and said things that church never told them to say. The leaders had to write a letter about it. [[Acts 15:24]] To whom we gave no such commandment. That means, we never told them to say that.

THE BAD LETTER THAT WAS REAL. Now a sad story. It is important, so read it slowly.

A wicked queen named Jezebel wanted a man's garden. The man was named Naboth. It was his garden and he would not sell it. So she wrote letters. [[1 Kings 21:8]]

The letters were real. The seal was the real king's seal. Nothing about them was fake. Not one thing.

But the words inside were wicked. [[1 Kings 21:9]] And the men of the town did just what the letters said. [[1 Kings 21:11]] Naboth died for his garden.

So here is the lesson, and it may be the biggest one this week. A real seal tells you WHO sent the letter. A real seal does NOT tell you the letter is good. You still have to read it. And sometimes you still have to say no.

Say that again. Who sent it is one thing. Whether it is good is another thing.

WHO ARE YE? One more true story. Some men saw that Paul could help people in the name of Jesus. So they tried to say the same words. [[Acts 19:13]]

They said the words right. Every word. But an evil spirit asked them a question. [[Acts 19:15]] Jesus I know, and Paul I know; but who are ye?

Who are ye. Who ARE you. That is the question. Saying the right words is not the same as being known.

Jesus said something like it too. Some people will say, look at all the things we did in your name! And He will say, I never knew you. [[Matthew 7:23]]

So it is not enough to know ABOUT Him. He must know YOU. Those are not the same.

THE LETTER THAT SAID YES, TRUST HER. Here is a kind story. In the old days a believer would move to a new town. Nobody there knew her. So her church wrote a letter. The letter said, this is Phebe, she is one of us, help her. [[Romans 16:1]] [[Romans 16:2]]

The new church did not know Phebe. But they knew the church that sent her. So they helped her. That is trust passed from one place to another.

And one time the leaders in Jerusalem sent a letter to another town. They did something smart. They did not send the letter alone. They sent two men WITH it, to say the same thing out loud. [[Acts 15:27]]

Two ways of saying it. The paper and the men. If somebody fakes the paper, the men are still there. That is a good idea and it is very old.

THE SEAL YOU CANNOT LOSE. One last thing, and it is the sweetest. When you belong to Jesus, Yahweh puts His own mark on you. [[Ephesians 1:13]]

You do not carry that mark in a pocket. You cannot drop it. Nobody can take it. Yahweh holds it. That is not like a card at all, so we will not call it a card.

THE GOOD NEWS. Jesus is the Lamb of Yahweh. [[John 1:29]] The Father gave His Son because He loves the world. [[John 3:16]] And His throne lasts for ever and ever. [[Hebrews 1:8]]

Here is the very best part. Jesus did not come in His own name. He came in His Father's name. [[John 5:43]] He is the one name nobody can copy. Nobody can steal it. It never runs out.

So if you belong to Him, you carry His name. And He knows you.

${TALK.child}`;

const YOUTH = `WHOSE NAME DO YOU CARRY - identity, delegated authority, and the proof a stranger may trust. Four words will carry this whole week: NAME, SEAL, SCOPE, KNOWN.

WHERE THIS CAME FROM. On 2026-09-29 a technical newsletter landed in Darrell's work mail: an issue of Level Up Coding by Nikki Siapno, titled SSO vs OAuth vs OIDC vs SAML. Sixteen minutes later he forwarded it into this app with one word on top: Lessons. And he did not only forward it. He wrote his own summary above it, in his own words, with his own takeaways, his own table, his own guidance and his own one-line translation. Those notes are the request. The newsletter is only what started it.

Honest limits, said before any teaching. Nobody here read the official standards documents behind those four technologies. Nobody set up a real login system to test anything on this page. The issue carried a paid advertisement, and this lesson uses nothing from it. And one thing that is usually a problem was not one this time: neither the article nor his notes capitalised any name of the adversary, so there was nothing to correct.

TWO QUESTIONS, NOT ONE. Darrell's first note is the key to the whole thing. Authentication means proving who you are. Authorization means deciding what you are allowed to do. People collapse those two into one all the time, and collapsing them is how systems get broken into.

Picture a hotel. The front desk checks your name against a booking - that is authentication. Then it hands you a card that opens room 412 and the pool, and nothing else - that is authorization. The card does not say who you are. It says what you may open. Two objects, two jobs. If you ever lose that card, somebody can open room 412. They still cannot become you.

YAHWEH DOES NOT AUTHENTICATE. Here is the first thing the Word says that the newsletter cannot. Yahweh has no login step, because checking is a cure for not knowing, and He does not have that problem. He gives the name and He knows the person. [[Isaiah 43:1]] Called thee by thy name; thou art mine. Settled before anybody proves anything.

And the foundation rests on His knowing, not on your claim. [[2 Timothy 2:19]] Knoweth them that are his.

So all this machinery - identity providers, tokens, assertions - is for US, because we are strangers to each other. That is not an insult to it. That is its proper job and its proper dignity. And it is exactly why the Word is so full of names being put on people, rings being handed over and letters being carried city to city. Among strangers, proof has to travel.

NAME: IDENTITY IS GIVEN, AND WORN WHERE OTHERS READ IT. In the Word your identity is not something you assert. It is placed on you. [[Numbers 6:27]] They shall put my name upon the children of Israel.

The clearest picture is the gold plate on the high priest's head covering, and the Word says it was engraved the way a signet ring is engraved. [[Exodus 28:36]] It was worn on his forehead - the one place a man can neither hide nor read for himself - and the point of it was acceptance. [[Exodus 28:38]]

Three things about it, and all three matter. It was issued by the One who had the right to issue it. It was worn where other people read it. And it got the wearer accepted somewhere he could never have walked into on his own account.

Now the honest limit, because a weak comparison is worse than none. That plate was not a credential in the technical sense. It held no secret, a stranger could not test it, and nothing about it was mathematical. What it truly teaches is better than a clever comparison: a borne identity. A name you did not pick, worn openly, for acceptance you did not earn. The Word promises exactly that, permanently, at the end. [[Revelation 3:12]] Which is why it prices a name above money. [[Proverbs 22:1]]

SEAL: REAL AUTHORITY, WITHOUT HANDING OVER YOUR PASSWORD. Darrell's note on OAuth 2.0 says it exactly: it lets an application reach your resources on your behalf WITHOUT getting your password. That instrument is in Genesis. Pharaoh put Joseph over Egypt. [[Genesis 41:41]] And then handed him the actual signing device. [[Genesis 41:42]]

The ring pressed the king's mark into wax. Officials who had never met Joseph obeyed documents he sealed, because the authority rode on the king and not on the man holding it. And the very next line protects the thing that matters most. [[Genesis 41:44]] I am Pharaoh. Real power genuinely handed over, with the owner of that power unchanged.

That is a delegated token in one sentence, and it is the whole reason a token is safer than a shared password. If Joseph had simply been given Pharaoh's identity, there would be two Pharaohs and no way to tell them apart. Instead there is one king and one steward holding a scoped instrument.

Try it on something ordinary. If you lend a friend your bus pass, you have lent him a scoped thing: it gets him onto a bus and nowhere else. If you lend him the password to your account, you have lent him YOU - your messages, your photographs, your name on anything he writes. Same favour on the surface. Two completely different sizes of risk, and only one of them can be taken back cleanly.

In Esther the same instrument is described with its force spelled out. [[Esther 8:8]] The writing is trusted because of the name and the seal on it, not because of who carried it. And the carrying was done by whatever would run. [[Esther 8:10]] Horses, mules, camels, dromedaries. The transport is irrelevant to the trust - which is the newsletter's own point that the format is secondary and the real question is what the artifact proves.

SCOPE: EVERY COMMISSION HAD EDGES. A token that can do anything is not a delegation. It is a handover. The Word is careful here. When the Lord Jesus sent the twelve, the authority was named. [[Matthew 10:1]] And the territory was bounded, up front, before they left. [[Matthew 10:5]]

The grant was still large inside its edges, so scope is not the same thing as being timid. [[Luke 10:19]]

Then notice WHO moves an edge. Later that boundary is lifted, and it is lifted on an authority that was never the messengers'. [[Matthew 28:18]] All power is given unto Him - therefore go. [[Matthew 28:19]] The scope moved because the Sender moved it. The messengers never voted themselves more.

And the Word records the opposite case, which is the one every engineer meets sooner or later. The Jerusalem assembly had to write to Antioch about men who travelled on its reputation and taught what it never authorised. [[Acts 15:24]] To whom we gave no such commandment. That is over-scope, named in Scripture, long before anybody had a word for it.

THE VALID SEAL ON A WICKED ORDER. This is the movement the newsletter cannot reach, and it is the one to remember. Queen Jezebel wanted a vineyard that was not hers. She did not break a seal. She used one. [[1 Kings 21:8]] Ahab's name. Ahab's seal. Sent to the city elders who knew that seal and trusted it.

Inside was an order for a judicial killing, dressed up as a religious observance. [[1 Kings 21:9]] And the elders carried it out, because the instrument was valid. [[1 Kings 21:11]]

Now run the four checks the article teaches. Signature: genuine. Issuer: the king himself. Audience: addressed to exactly those elders. Expiry: nothing stale. Four for four, and Naboth died for his own garden.

So say it plainly. Validation proves WHO SENT a thing. It can never prove that what the thing asks is right. That is not a flaw in the protocols; it is the edge of what any protocol can do. The last defence in any system of delegated authority was never cryptography. It is a steward who will read the instruction and refuse it. And the Word answers a lie sent in Yahweh's name from above the seal, not with a better seal. [[Jeremiah 29:21]]

KNOWN: WHERE THE WHOLE COMPARISON RUNS OUT. In Ephesus some travelling men used the right words. [[Acts 19:13]] Correct name, correct form, correct reference to a trusted party. And the answer was an identity check they failed. [[Acts 19:15]] Jesus I know, and Paul I know; but who are ye?

The Lord Jesus gave the same verdict about works done in His name. [[Matthew 7:22]] [[Matthew 7:23]] I never knew you.

Here is the point of the whole week. A token works precisely BECAUSE the thing it opens does not need to know you. That is why systems can scale to millions of people. The Word's standard of identity is the reverse: being known. No token manufactures that, no identity provider federates it, and none of the four technologies was ever built to. And the saddest line on the subject is a true credential refused while a self-issued one is welcomed. [[John 5:43]]

THE LETTER THAT VOUCHED FOR YOU. Single sign-on, Darrell notes, is an EXPERIENCE rather than a protocol, and it works because several applications trust the same identity provider. The early assemblies ran that arrangement with ink. A believer travelling to a city where nobody knew him carried a letter from an assembly that did. Paul calls it ordinary practice. [[2 Corinthians 3:1]] He writes one himself for a sister going to Rome, and it does the three things a modern assertion does - names her, states her standing, tells the readers what to do. [[Romans 16:1]] [[Romans 16:2]] The same was done for Apollos. [[Acts 18:27]]

Nehemiah asked a king for exactly such letters, addressed to named officials, and then handed them to the men they were written to. [[Nehemiah 2:7]] [[Nehemiah 2:9]] That is the audience of a credential, and it is why it worked.

And the Word does not hide that the identical instrument serves a cruel errand just as well. Saul went to the high priest for letters, and the letters were an arrest warrant. [[Acts 9:2]] Same mechanism. Opposite errand.

Then the refinement that answers the forged letter above: the Jerusalem letter did not travel alone. [[Acts 15:23]] [[Acts 15:27]] Who shall also tell you the same things by mouth. Living men, saying the same thing, through a second channel. If you ever ring somebody to check that a message really came from them, you are doing Acts 15.

And the apostle refuses to lean on paper at all. [[2 Corinthians 3:2]] [[2 Corinthians 3:3]] Not with ink. In the end the credential is the fruit.

THE CLOSE. Those who believe are sealed, and the sealing is done by Yahweh rather than presented by them. [[Ephesians 1:13]] [[2 Corinthians 1:22]] Do not flatten that into a token. A token can be copied, stolen and replayed, and it expires. This cannot, because it is His mark on a person and He keeps it. That comparison stops there, on purpose.

And there is one Name that is never delegated to anybody. [[Philippians 2:9]] [[Philippians 2:10]] When the authorities demanded of the apostles by what name they had acted, the answer was a person, not an office. [[Acts 4:7]] [[Acts 4:10]] And nothing a believer does falls outside that Name. [[Colossians 3:17]]

Jesus is the Lamb of Yahweh, [[John 1:29]] the Eternal Son of Yahweh whom the Father gave, [[John 3:16]] whose throne is for ever. [[Hebrews 1:8]] He came in His Father's name, not His own. He is the one credential never forged, never stolen, never needing renewal.

${TALK.youth}`;

const TEEN = `WHOSE NAME DO YOU CARRY - identity, delegated authority, and the proof a stranger may trust. Three things, in that order: who you are, what somebody is allowed to do for you, and why a stranger believes any of it.

START SOMEWHERE CONCRETE. You have tapped a button that said continue with another account. Think about what actually happened in that second. You were sent somewhere else. You signed in there. You came back. And the site you wanted now believes something about you that it never checked itself. It took somebody else's word.

That is the whole subject. Not the acronyms - the arrangement. Somebody vouched, and a stranger accepted the vouching.

THE PROVENANCE, BECAUSE IT MATTERS WHO IS SPEAKING. On 2026-09-29 at 12:44 UTC an issue of the Level Up Coding newsletter by Nikki Siapno, subject SSO vs OAuth vs OIDC vs SAML, arrived in Darrell's university mailbox. At 13:00 he forwarded it into this app with one word at the top: Lessons. Then he wrote his own summary, his own Key Takeaways, his own table, his own Practical Guidance, his own one-line translation and his own working note about Mosaic and Microsoft Entra ID. His notes are the request. The article is the occasion.

Four limits, stated before the teaching rather than buried after it. Nobody here read the published specifications. Nobody stood up a directory tenant or ran a real sign-in flow to confirm anything. The issue carried a sponsored advertisement that this lesson rests not one sentence on. And Mosaic is a system at his workplace that this page knows nothing about. So the mechanics are carried as reported. What WAS verified to the letter is every verse below, filled from a King James corpus on this house's own disk.

PART ONE: WHY THERE ARE TWO QUESTIONS, NOT ONE. His first takeaway is the hinge of everything. Proving who you are is one problem. Deciding what you may do is a different problem.

A delivery driver with a fob that opens the lobby is the cleanest example you will ever meet. The fob does not claim he is a resident. It never did. It says one thing: this holder may open this door. If he drops it in the street, the finder can open the lobby. The finder does not become him. Nobody's identity moved.

Now hold that next to the Word, and notice what is missing there. Yahweh never authenticates anybody. There is no verification step in Him, because verification is a remedy for not knowing, and He has no such lack. He confers the name and He knows the person. [[Isaiah 43:1]] And the apostle states it as a seal that does not depend on anybody's claim. [[2 Timothy 2:19]]

Sit with that for a second, because it changes the posture. The machinery is not a poor imitation of something Yahweh does. It is a tool for a problem He does not have - the problem of strangers. That is why Scripture is saturated with this subject: names placed on people, a signet pressed into wax, a ring moved from one hand to another, letters carried between cities by men who never met the sender. Among strangers, proof has to travel. The Word worked that problem first, and worked it more honestly, because it never confused the proof with the person.

PART TWO: A NAME IS SOMETHING DONE TO YOU. We talk about identity as though it were self-expression. Scripture does not. There, identity is placed on a person by someone with the right to place it. [[Numbers 6:27]]

The object to look at is the plate on the high priest's mitre, which the text says was engraved the way a signet is engraved. [[Exodus 28:36]] Three details are worth more than the whole acronym list. It was issued, not minted by the wearer. It sat on his forehead, where he could neither hide it nor read it - other people read it for him. And it existed for acceptance in a place he had no standing to enter. [[Exodus 28:38]]

Here is where this lesson refuses a shortcut. That plate was not a cryptographic credential, and calling it one would be a cute trick that falls apart the moment you lean on it. It held no secret. A stranger a hundred miles away could not test it. Nothing about it was mathematical. A weak analogy is worse than none, so the plate is taught for what it is: the Word's doctrine of borne identity - a name you did not choose, worn openly, for acceptance you could not earn. That promise is made permanent at the end of the Book. [[Revelation 3:12]] And it is why the Word prices a name above money, which is a strange thing to read in a culture that prices everything else. [[Proverbs 22:1]]

PART THREE: WHERE THE COMPARISON IS GENUINELY STRONG. Having refused one comparison, be as plain about the one that holds. A notarised power of attorney is a real thing: it lets another person act in your financial affairs without becoming you, and it lists exactly what they may do. That is not a modern invention.

Pharaoh set Joseph over Egypt [[Genesis 41:41]] and handed him an object. [[Genesis 41:42]] Picture what the ring actually was in that world. It was the signing key of a government. Press it into wax and a document carried the king's authority to officials who had never met the man who pressed it. The trust belonged to the issuer, not the bearer.

And read the next sentence carefully, because it is the sentence this whole part turns on. [[Genesis 41:44]] I am Pharaoh. The authority really moved. The identity did not. There were not suddenly two Pharaohs. That distinction is precisely why a scoped token is safer than a shared password: a password makes a copy of you, and a token makes a tool.

Esther names the force of such a document and does not understate it. [[Esther 8:8]] Then watch it dispatched. [[Esther 8:10]] Horses, mules, camels, dromedaries - everything that would run. The method of carrying has nothing to do with the trust, which is the article's own observation that the format is secondary and the real question is what the artifact proves and who is entitled to trust it.

PART FOUR: EVERY COMMISSION HAD EDGES, AND ONLY THE SENDER MOVED THEM. Something that can do anything on your behalf is not a delegation. It is a handover with extra steps.

Watch how carefully the Lord Jesus handled this. The authority He gave the twelve was itemised. [[Matthew 10:1]] The territory was fenced, and the fence was described before they walked out of the room. [[Matthew 10:5]] The sending even had a shape - in pairs, with the authority named again. [[Mark 6:7]] And nobody should mistake a bounded grant for a small one. [[Luke 10:19]]

Then the fence moves, and notice what the record puts first. [[Matthew 28:18]] All power is given unto ME - therefore go. [[Matthew 28:19]] The One who set the bound is the One who widened it. At no point did the men vote themselves a larger commission.

The Word also preserves the ugly version, which anybody who has worked anywhere will recognise instantly. A letter had to go out from Jerusalem to Antioch about men who had travelled on that assembly's reputation and taught what it never sanctioned. [[Acts 15:24]] To whom we gave no such commandment. Nine words, and they describe a problem the industry gave a long Latin name to about three thousand years later.

PART FIVE: THE DOCUMENT THAT PASSED EVERY CHECK AND KILLED A MAN. This part is why the lesson exists, and it is the part no protocol reaches.

Jezebel wanted a vineyard belonging to a man named Naboth, who would not sell it. She did not forge anything. She used the real instrument. [[1 Kings 21:8]] The king's own name. The king's own seal. Delivered to the city officials who recognised that seal and had every reason to trust it. The content was a judicial murder arranged to look like a religious observance. [[1 Kings 21:9]] And they did it, because the document was in order. [[1 Kings 21:11]]

Now take the four checks the article rightly insists on and run them over those letters, one at a time, before you read the ending again. Signature - genuine. Issuer - the king himself, no impersonation anywhere. Audience - addressed to exactly the elders who received them. Validity window - entirely current, nothing stale. Four for four. A man was stoned for his garden.

So the conclusion has to be said without softening, because softening it would be its own kind of lie. Validation establishes WHO ISSUED a thing. It cannot establish that what the thing asks is righteous. That is not a defect in anybody's protocol; it is the boundary of what a protocol is for. And a house that forgets the boundary ends up obeying a perfectly well-formed instruction that it should have refused, with all the paperwork in order.

Scripture treats this as the sender's crime, not the courier's, and answers it from above the seal rather than with a stronger one. [[Jeremiah 29:21]] Which means the final protection in any arrangement of delegated authority was never mathematical. It is a steward willing to read the order and say no. Put that on the wall.

PART SIX: AUTHENTICATED IS NOT THE SAME AS KNOWN. There is a scene in Acts that looks like a failed login and is actually something far deeper.

Travelling exorcists in Ephesus used the correct formula, and Luke is careful to record that the formula was correct. [[Acts 19:13]] Right name, right syntax, right reference to a party everybody trusted. The reply was not an argument about wording. [[Acts 19:15]] Jesus I know, and Paul I know; but who are ye? And it went badly. [[Acts 19:16]]

The Lord Jesus delivered the same verdict in the most unsettling sentence in the Gospels, over works that were real and a name correctly invoked. [[Matthew 7:22]] [[Matthew 7:23]]

Here is the distinction the entire week is built to deliver. A bearer artifact works BECAUSE the thing it opens does not need to know you - that is its efficiency, and it is why a service can handle millions of people who are strangers to it. The Word's standard of identity is the exact opposite: being known. Nothing issues that. No provider federates it. None of the four technologies was ever designed to, and it is no criticism of them that they were not.

And then Scripture adds the turn of the knife. [[John 5:43]] A true credential refused, and a self-issued one welcomed. Think about how often that is the actual failure.

PART SEVEN: THE WORD'S OWN FEDERATED TRUST, WITH A SECOND CHANNEL. Darrell's note on single sign-on names the thing most people get wrong: it is an experience, not a protocol, and it works because several applications trust the same provider. The early assemblies ran that arrangement with ink and horses.

Paul treats it as unremarkable. [[2 Corinthians 3:1]] He writes one for a sister travelling to Rome, and it performs the three functions of a modern assertion - identify the subject, state her standing, instruct the recipient. [[Romans 16:1]] [[Romans 16:2]] The brethren did the same for Apollos. [[Acts 18:27]] Nehemiah asked a king for letters addressed to named governors and then handed them to precisely those men, which is the audience of a credential doing its job. [[Nehemiah 2:7]] [[Nehemiah 2:9]]

And the text does not pretend the mechanism is only ever good. Saul went to the high priest for letters, and those letters were a warrant for arrest. [[Acts 9:2]] Identical instrument. Opposite errand. The instrument is never the ethics.

Then comes the detail that answers part five, and it arrives six chapters before anybody needs it. The Jerusalem letter did not travel on its own. [[Acts 15:23]] [[Acts 15:27]] Men came with the paper to say the same thing out loud. A second, independent channel. Every time you phone somebody to check that an email really came from them, you are running Acts 15.

Last, the apostle declines to rest on paper at all. [[2 Corinthians 3:2]] [[2 Corinthians 3:3]] Not with ink, not in tables of stone. That is not a security control and this page will not dress it up as one. It is the senior truth above every security control: eventually the credential is the fruit.

PART EIGHT: THE SEAL THAT IS NOT A TOKEN. Scripture uses the word seal for something it would be easy and wrong to flatten. Believers are sealed, and Yahweh does the sealing - it is not produced by the believer at a gate. [[Ephesians 1:13]] [[2 Corinthians 1:22]]

Lay the two side by side and the difference is not small. A bearer token is held by whoever holds it, can be copied, can be stolen, can be replayed by a finder, and expires. His seal is none of those things. It is His mark on a person, kept by Him, and what it secures is the person rather than a request. Using it to illustrate session management would be the third strained analogy, so it is taught for what it is and the technical material is set down beside it and left alone.

The subject of names then closes where it has to. [[Philippians 2:9]] [[Philippians 2:10]] [[Philippians 2:11]] One Name, delegated to nobody. Which is why the first thing the authorities in Jerusalem demanded of the apostles was an identity question about authority, and why the answer named a person instead of an office. [[Acts 4:7]] [[Acts 4:10]] And why a believer's commission leaves nothing outside its scope. [[Colossians 3:17]]

PART NINE: HIS GUIDANCE, AND WHAT THIS HOUSE ACTUALLY RUNS. Carried as his words, not as this page's invention. One login across applications - single sign-on, usually built with OpenID Connect or SAML. User authentication - OpenID Connect. Interface access on behalf of a user - OAuth 2.0. Both - OpenID Connect together with OAuth 2.0. Older enterprise identity systems - SAML. Service-to-service with no user involved - OAuth 2.0. And his four-line translation: single sign-on is user convenience, OAuth is permissions, OpenID Connect is identity, SAML is enterprise identity federation. His closing note about Entra ID is his working note for his workplace, carried here and verified nowhere.

Now this house, measured rather than asserted. This app holds a delegated secret of exactly this kind. Your browser never calls the machine at home directly. It calls a path on our own site, which forwards the request, and the value authorising that forwarding lives on the machine and is synchronised by a workflow that runs over our own private network - masked in every log, never printed into a page, never pasted by hand. That is a scoped credential with a named owner and a rotation path. It is part five built into plumbing: the value proves who is calling, and a steward still decides what the call is allowed to ask for.

The course already holds the ground next door, and this week does not repeat it. Week nineteen is the servant under authority. Week thirty-one is whose errand an agent carries. Week forty-four is the thief who forgot his own door. Week forty-five is the second witness. Week forty-six is the helper that must see everything. What lands here is the identity seam, and the three places where the comparison honestly stops.

THE CLOSE. The one who bears the Name for us is Jesus, the Lamb of Yahweh, [[John 1:29]] the Eternal Son of Yahweh whom the Father gave, [[John 3:16]] whose throne is for ever. [[Hebrews 1:8]] He did not come in His own name. He is the one credential never forged, never stolen and never needing renewal.

So scope what you lend. Validate what arrives. Refuse the well-formed instruction that is wicked, even when every check passes - especially then. And remember the one thing no identity provider on earth can issue you, which is the one thing you will finally be asked for: that He knows you.

${TALK.teen}`;

const SENIOR = `WHOSE NAME DO YOU CARRY - identity, delegated authority, and the proof a stranger may trust. You have lived every part of this lesson already, and you lived it with paper, ink and a signature that somebody had to recognise.

HOW IT ARRIVED, AND WHAT WAS NOT CHECKED. A technical newsletter came into Darrell's university mailbox on the twenty-ninth of September 2026, concerning four different arrangements by which computers decide who somebody is and what that somebody is permitted to do. Sixteen minutes later he forwarded it into this application with a single word above it - Lessons - and then, before the article itself, he wrote his own summary, his own takeaways and his own practical guidance in his own words, which is the material this lesson is actually built from. The honest limits belong at the front rather than in a footnote: nobody here read the published standards documents behind those arrangements, nobody stood up a working system to test a single claim, and the issue carried a paid advertisement from which this lesson takes nothing whatever. What is described below as mechanism is described as that newsletter and his notes report it, and that sentence is the difference between teaching and pretending.

THE TWO QUESTIONS YOU HAVE ANSWERED ALL YOUR LIFE. His first note is the key that opens everything else. One question asks who you are. A second, entirely separate question asks what you are permitted to do. They are not the same question, and the trouble in every generation has begun when somebody answered the first and assumed he had thereby answered the second.

You watched this operate for decades without anybody calling it authentication. A teller at a bank window had to recognise your face or compare your hand against a signature card kept in a drawer, and that was the first question, answered by a human being who had met you. Whether you were entitled to sign on that particular account at all was a second and quite different matter, settled by a document in a file. A letter of introduction established who a man was. A power of attorney established what he could do. Two instruments, two purposes, and nobody confused them, because the consequences of confusing them arrived in the post.

WHAT YAHWEH DOES NOT DO, AND WHY THAT REFRAMES THE WHOLE SUBJECT. Here is the thing the newsletter is not in a position to say. Yahweh has no verification step anywhere in Him, because verification is a remedy for not knowing, and He suffers no such lack. He confers the name and He knows the person who bears it, and the knowing precedes every proof anybody might offer. [[Isaiah 43:1]] And the apostle writes the foundation of the whole matter as a seal resting on His knowledge rather than on anyone's assertion. [[2 Timothy 2:19]]

Consider what follows from that, because it is not a small thing. All this machinery of providers and tokens and assertions exists for US, on account of our being strangers to one another, which is its honest dignity rather than an accusation against it. And it explains why Scripture, once you begin looking for it, is saturated with precisely this subject: a name placed upon a people, a signet pressed into wax, a ring taken from one hand and set upon another, letters carried between distant cities by men who had never so much as seen the sender. Among strangers, proof is obliged to travel.

A NAME YOU DID NOT GIVE YOURSELF. In Scripture identity is conferred upon a person rather than announced by him. [[Numbers 6:27]] The clearest object in the whole Word is the plate of pure gold worn on the high priest's head covering, which the text describes as engraved in the manner of a signet. [[Exodus 28:36]] It rested upon his forehead, the one place a man can neither conceal nor read for himself, and the declared purpose of his wearing it was acceptance in a place where he had no standing of his own. [[Exodus 28:38]]

Three properties, every one of which you will recognise from a lifetime of being vouched for by somebody older. It was issued by the One possessing the authority to issue it, never minted by the wearer. It was worn where other people did the reading. And it existed for an acceptance that could not have been earned.

Here the lesson declines a shortcut, deliberately. That plate was not a password or a cipher; it carried no secret, and no stranger at a distance could have tested its authenticity. We will not call it a token, because a strained comparison does an injury to both sides of it. What the plate genuinely establishes is better than any clever parallel: the doctrine of a borne identity - a name you did not select, worn openly, for an acceptance you never earned. The closing promise of the Book makes exactly that permanent. [[Revelation 3:12]] And it explains why the Word prices a reputation above money, a sentence your generation repeated far more often than this one does. [[Proverbs 22:1]]

THE RING, AND THE LETTER NO MAN COULD REVERSE. Now the portion where the ancient world and the present one turn out to be the same world. Pharaoh advanced Joseph over the whole land [[Genesis 41:41]] and placed in his hand a physical instrument. [[Genesis 41:42]] That ring pressed the king's mark into wax, and officials who had never laid eyes upon Joseph obeyed whatever he sealed with it, because the authority resided in the king rather than in the man holding the ring.

Then observe what the king said immediately afterwards, because the entire subject turns upon it. [[Genesis 41:44]] I am Pharaoh. He lent his authority without surrendering it, and there were not suddenly two kings in Egypt. That is exactly the distinction between permitting an agent to act for you and handing him your own signature, and it is why a limited instrument has always been safer than a shared secret.

Esther spells out the force such a document carried, and does not understate it. [[Esther 8:8]] The weight lies in the name and the seal rather than in the courier, and the couriers were whatever beast would run. [[Esther 8:10]] Horses, mules, camels and dromedaries. The means of conveyance never once mattered to the trust, which is the newsletter's own observation arriving several thousand years late.

THE COMMISSION HAD EDGES, AND ONLY THE SENDER MOVED THEM. When the Lord Jesus sent out the twelve, He itemised what they were empowered to do [[Matthew 10:1]] and fenced the territory before they left the room. [[Matthew 10:5]] The grant was nevertheless enormous within its bounds, so nobody should mistake a limited authority for a timid one. [[Luke 10:19]] Later the fence was moved, and it was moved upon an authority that had never belonged to the messengers in the first place. [[Matthew 28:18]] All power is given unto Him, therefore go. [[Matthew 28:19]] The men never once enlarged their own commission.

And the Word writes down the abuse as faithfully as the proper use. The elders at Jerusalem were obliged to send word to Antioch concerning men who had travelled upon their reputation and taught what they had never authorised. [[Acts 15:24]] To whom we gave no such commandment. Anybody whose name has been used by somebody who was never sent knows that sentence in his bones, and knows how long the correction takes.

THE LETTER THAT WAS ENTIRELY GENUINE AND ENTIRELY WICKED. This is the portion to carry away from the week, and it must not be softened in the telling. Jezebel wanted a vineyard belonging to Naboth, who declined to sell it. She forged nothing whatever. She used the real instrument. [[1 Kings 21:8]] Written in Ahab's name, impressed with his own seal, and delivered to the elders of the city who recognised that seal and had every reason to honour it. The contents arranged a judicial killing behind the appearance of a religious observance. [[1 Kings 21:9]] And the elders performed it, precisely because the document was in order. [[1 Kings 21:11]]

Run the modern examinations over those letters before you read the ending a second time. Was the signature genuine? It was. Was the issuer correct? The king himself, with no impersonation anywhere in it. Were the proper recipients addressed? Precisely those elders and no others. Was the document current? Entirely. Four examinations, four passes, and a man was stoned to death for his own garden.

So the conclusion has to be stated plainly, because to soften it would be a species of lying. Validating a document establishes who sent it, and can never establish that what it requires is righteous. That is no flaw in the arrangements; it is simply the boundary of what any arrangement is able to accomplish. The final protection in every structure of delegated authority was never a signature and was never mathematics. It is a steward who will read the instruction he has the power to execute, and decline. Scripture answers a lie sent out in Yahweh's name from above the seal rather than with a better seal. [[Jeremiah 29:21]]

AUTHENTICATED IS NOT THE SAME THING AS KNOWN. In Ephesus certain travelling men employed the correct form of words, and the record is careful to establish that the form was correct. [[Acts 19:13]] The reply was not a dispute about wording but an inquiry about them. [[Acts 19:15]] Jesus I know, and Paul I know; but who are ye? It went very badly for them indeed. [[Acts 19:16]]

The Lord Jesus pronounced the same verdict over works that were real and a name correctly invoked. [[Matthew 7:22]] [[Matthew 7:23]]

There is the heart of the week, and it is the one provision none of these arrangements was ever constructed to supply. An instrument functions precisely because the door it opens has no need to know the person opening it, which is the whole of its usefulness. The standard Scripture applies to identity is the reverse of that: being known. And the saddest sentence on the entire subject describes a genuine credential refused while a self-appointed one is received gladly. [[John 5:43]]

THE LETTER OF INTRODUCTION, AND THE MAN WHO CAME WITH IT. You will recognise this one before the paragraph is finished. A believer removing to a city where nobody knew him carried a letter from an assembly that did, and he was received upon the standing of the senders rather than upon anything he said about himself. Paul treats the practice as perfectly ordinary. [[2 Corinthians 3:1]] He composed one for a sister travelling to Rome which named her, stated her standing and instructed the recipients what to do about her. [[Romans 16:1]] [[Romans 16:2]] The brethren wrote another for Apollos. [[Acts 18:27]] Nehemiah requested letters from a king addressed to named governors, and delivered them to exactly the men they were written to. [[Nehemiah 2:7]] [[Nehemiah 2:9]]

The identical instrument served a cruel errand just as efficiently. Saul of Tarsus applied to the high priest for letters, and what he obtained was a warrant for arrests. [[Acts 9:2]] The instrument has never been the ethics.

Then observe the detail which answers the forged letter above, and notice how beautifully ordinary it is. The Jerusalem letter did not travel by itself. [[Acts 15:23]] [[Acts 15:27]] Living men accompanied the paper in order to say the same thing aloud - a second and independent channel. Anyone who ever telephoned to confirm that a letter had genuinely been sent already understands the whole principle.

And the apostle would not finally lean upon paper at all. [[2 Corinthians 3:2]] [[2 Corinthians 3:3]] Not with ink, and not in tables of stone. Eventually the credential is the fruit, and a long life is the only place where fruit can actually be inspected.

THE SEAL THAT IS NOT AN INSTRUMENT IN ANYBODY'S POCKET. Believers are sealed, and Yahweh performs the sealing; it is not something produced by the believer at a gate. [[Ephesians 1:13]] [[2 Corinthians 1:22]] Do not permit anybody to flatten that into a card in a wallet. An instrument can be copied, stolen, replayed by whoever finds it, and allowed to expire. His seal is none of those things, being His own mark upon a person, kept by Him, and what it preserves is the person rather than a request. The comparison stops there, intentionally.

THE CLOSE. There is one Name which was never delegated to anybody at all. [[Philippians 2:9]] [[Philippians 2:10]] [[Philippians 2:11]] When the authorities at Jerusalem demanded of the apostles by what name they had acted, the answer they received was a person rather than an office. [[Acts 4:7]] [[Acts 4:10]] And nothing a believer undertakes falls outside that Name. [[Colossians 3:17]]

Jesus is the Lamb of Yahweh, [[John 1:29]] the Eternal Son of Yahweh whom the Father gave, [[John 3:16]] whose throne is for ever. [[Hebrews 1:8]] He did not come in His own name, and He is the single credential that was never forged, never stolen and never in need of renewal. So scope whatever you lend, read whatever arrives before you obey it, and rest in the one thing no institution on earth is able to issue you: that He knows you.

${TALK.senior}`;

// -----------------------------------------------------------------------------
// The module record
// -----------------------------------------------------------------------------
const MODULE = {
  id: ID,
  title: TITLE,
  bigIdea: `Darrell forwarded a Level Up Coding issue, SSO vs OAuth vs OIDC vs SAML, into the app on the twenty-ninth of September 2026 with one word above it - Lessons - and then wrote his OWN summary, takeaways and guidance above the article. Those words are the request; the newsletter is the occasion. The subject underneath the acronyms is identity, delegated authority and trust, and the Word teaches all three on its own terms. Yahweh never authenticates anybody, because checking is a remedy for not knowing and He has no such lack: He confers the name and He knows the person. The machinery exists for US, among strangers, which is why Scripture is full of a name put upon a people, a king's ring moved onto a servant's hand, a letter no man may reverse, and a traveller received because a trusted assembly vouched for him. Three limits are named rather than stretched: a graven gold plate is not a cryptographic credential, the seal of the Holy Spirit is not a bearer token anyone presents, and a validated artifact proves only WHO ISSUED it - Jezebel's letters passed signature, issuer, audience and expiry, and Naboth still died. So scope what you lend, read what arrives before you obey it, and remember that the one thing no identity provider can issue is the thing you will finally be asked for: that He knows you.`,
  inApp: `Run the week against something you actually hold. Name one credential in your life that lets a holder act for you - a card on file, a saved sign-in, a key somebody else has, a bearer value in a workflow - then answer four questions about it in order: who issued it, what exactly it is scoped to do, who is allowed to trust it, and what would still be true if the instruction it carried were wicked. The app already holds the neighbouring ground and this week points at it rather than repeating it: week nineteen for the servant under authority, week thirty-one for whose errand an agent carries, week forty-four for the thief who forgot his own door, week forty-five for the second witness, week forty-six for the helper that must see everything. What is new here is the identity seam, and the three places where the comparison with the Word honestly stops.`,
  anchor: {
    ref: '',
    theme: `Identity in Scripture is conferred, borne and read by somebody else, never asserted: Yahweh calls a person by name and the name is put upon a people, and the high priest wore an identifier graven like a signet on his forehead so that he might be accepted. Delegated authority is just as concrete - Pharaoh's ring moved onto Joseph's hand while Pharaoh remained Pharaoh, and a writing sealed with the king's ring that no man may reverse - and it always carried a scope, named by the sender and widened only by the sender, with Acts 15:24 recording authority claimed that was never granted. The sixth movement is the one no protocol reaches: Jezebel's letters were written in the king's name and sealed with his seal, the elders validated them correctly, and Naboth was stoned - so validation proves the issuer and never the righteousness of the request. Acts 19 and Matthew 7 then name the limit of the whole frame: a bearer artifact works because the gate need not know you, while the Word's standard of identity is being known. The letter of commendation is the Word's own shared trust, with living witnesses carried alongside the paper, and the seal of the Holy Spirit is Yahweh's mark on a person rather than a token in anybody's hand.`,
  },
  benefits: [
    `You will be able to separate the two questions that nearly everybody collapses into one - who are you, and what are you allowed to do - and say why collapsing them is where real breaches start. That is Darrell's own first takeaway, taught from the Word rather than from the acronyms.`,
    `You will know the one thing the Word says about identity that no protocol can supply: Yahweh does not authenticate, because verification is a remedy for not knowing and He has no such lack. That single sentence reframes the entire subject and gives the technology its correct dignity instead of either worship or suspicion.`,
    `You will carry Pharaoh's ring and Esther's sealed letter as working models of delegated authority, including the four words that keep delegation honest - I am Pharaoh - which is exactly why a scoped token is safer than a shared password.`,
    `You will have Jezebel's letters as the permanent answer to anyone who thinks validation is enough: signature genuine, issuer correct, audience exact, nothing stale, and a man murdered for his vineyard. Validation proves who issued a thing and never that what it asks is righteous.`,
    `You will know what scope is in the Word's own terms - a commission that named what and where, widened only by the Sender - and you will have Acts 15:24 for the case every builder meets, authority claimed that was never granted.`,
    `You will be able to say exactly where the comparison between Scripture and these technologies STOPS, in three named places, instead of being handed a clever analogy that falls apart under weight. A weak analogy is worse than none, and this lesson refuses all three.`,
    `You will recognise the letter of commendation as the Word's own federated trust, and the Jerusalem letter's living witnesses as an out-of-band confirmation that arrived two thousand years early.`,
    `You will leave with the distinction the whole week exists for: being authenticated is not the same as being known. Acts 19:15 asks who are ye, and Matthew 7:23 answers I never knew you - and nothing any identity provider issues can close that gap.`,
  ],
  rpe: {
    research: `List every credential in your life that lets somebody or something act on your behalf: a card stored with a merchant, a sign-in you reused to create another account, a spare key, an authorised signer, a saved token in a tool you built. Do not editorialise. Then for each one write down four facts - who issued it, what it is scoped to, who is entitled to trust it, and whether it expires. Where you cannot answer one of the four, mark it unknown rather than guessing, because unknown is the finding.`,
    plan: `For each credential decide the smallest scope that still does the one job you wanted, and write the scope down in plain words before you touch a setting. Then write the harder sentence beside it: what you would do if a perfectly valid instruction arrived through that credential asking for something wrong. Name the person who would read it and refuse it. A system with no such person has no last line of defence, whatever its cryptography.`,
    execute: `Narrow one credential this week to the scope you decided, and verify by observation that the one job still works rather than assuming it. Then do the Jerusalem thing on one important message you receive: confirm it through a second channel before acting, and notice how little that cost. Close by asking somebody who has known you a long time to tell you what your name means to them - the only credential the Word finally cares about is the one that cannot be issued.`,
  },
  media: [],
  levels: { child: CHILD, youth: YOUTH, teen: TEEN, senior: SENIOR },
  stories: [
    {
      kind: 'parable',
      tone: 'serious',
      title: 'The Signature Was Hers',
      body: `Picture a widow who gave her son authority over her accounts, properly, at a desk, with a notary watching and a form that named exactly what he could do: pay the bills, move money between her two accounts, speak to the insurer. For nine years he did precisely that and nothing more, and the arrangement was a mercy to them both. In the tenth year his business went wrong, and one Tuesday he moved money out of her savings to cover a note that was coming due, and he did it with the same form, the same signature authority and the same bank that had honoured him for nine years. Nothing about the transaction was irregular. The teller validated everything there was to validate. The issuer was genuine - his mother had signed it herself. The audience was correct; the document was addressed to that very bank. It had not expired. Every check that existed passed, and his mother lost eleven thousand dollars she had set aside for a roof. The failure was not in the paperwork and no better paperwork would have caught it. The only thing that could have stopped it was a man reading an instruction he had the power to execute and deciding not to. That is the whole sixth movement of this lesson in one family, and it is why the Word puts the last word not on the seal but on the steward.`,
    },
    {
      kind: 'parable',
      tone: 'light',
      title: 'The Boy Who Knew All The Words',
      body: `Picture a boy of twelve who had listened to his grandfather pray at every meal for as long as he could remember, and who could do the whole thing from memory - the cadence, the pauses, the exact phrase his grandfather always used before amen. One evening the family was at a cousin's house and the cousin's father asked the boy to bless the food, and he did it perfectly, every word in the right place, and an aunt leaned over afterwards and told him he prayed just like his grandfather. He glowed about it the whole ride home, and then somewhere near the edge of town he went quiet, because he had worked something out that nobody had told him. He knew every word his grandfather said to Yahweh. He had never once said anything to Yahweh himself. The words had been perfectly reproduced and the relationship had not been reproduced at all, because that is not a thing anybody can hand you. It is not a sad story. He prayed his own prayer that night, badly, in about nine words, and it was the first credential he ever actually held.`,
    },
  ],
  quiz: {
    questions: [
      {
        q: `According to the lesson, why does the Word never show Yahweh authenticating anybody?`,
        options: [
          `Because authentication is a remedy for not knowing, and He has no such lack - He confers the name and knows the person`,
          `Because identity did not matter in ancient cultures`,
          `Because the Word is silent on the subject of identity`,
          `Because authentication is a sin`,
        ],
        answer: 0,
        explain: `"I have called thee by thy name; thou art mine." (Isaiah 43:1) is identity conferred by the One with the right to confer it, settled before any proof is offered, and "The Lord knoweth them that are his" (2 Timothy 2:19) is a foundation that rests on His knowing rather than on the bearer's claim. Knoweth, not checks. That is why all the machinery - providers, tokens, assertions, audiences, expiries - is OURS: it is a remedy for being strangers to one another, which is its correct dignity rather than a criticism of it.`,
      },
      {
        q: `Pharaoh gave Joseph his ring and then said four words that keep delegation honest. What were they, and why do they matter?`,
        options: [
          `I am Pharaoh - the authority was really handed over while the identity of the grantor stayed intact, which is the difference between a delegated token and a stolen password`,
          `Keep it for ever - the ring became Joseph's own property`,
          `Tell no man - the delegation was to be kept secret`,
          `Go and reign - Joseph replaced Pharaoh entirely`,
        ],
        answer: 0,
        explain: `"And Pharaoh said unto Joseph, I am Pharaoh, and without thee shall no man lift up his hand or foot in all the land of Egypt." (Genesis 41:44) The ring was the signing key of the kingdom and officials who had never met Joseph obeyed what he sealed, because the authority rode on the king. But the king did not stop being king. Darrell's own OAuth note says the same thing in modern words: an application reaches your resources on your behalf WITHOUT being given your password.`,
      },
      {
        q: `Jezebel's letters about Naboth would have passed all four of the validation checks the newsletter teaches. What does the lesson conclude from that?`,
        options: [
          `That the checks are worthless and should not be performed`,
          `That validation proves WHO ISSUED a thing and can never prove that what it asks is righteous - so the last defence is a steward who will refuse it`,
          `That the elders of the city failed to check the signature`,
          `That the seal must have been forged after all`,
        ],
        answer: 1,
        explain: `"So she wrote letters in Ahab’s name, and sealed them with his seal, and sent the letters unto the elders and to the nobles that were in his city, dwelling with Naboth." (1 Kings 21:8) Signature genuine, issuer the king himself, audience exactly those elders, nothing stale - and the elders obeyed "as it was written in the letters which she had sent unto them" (1 Kings 21:11). The checks are necessary and none of them would have saved Naboth. That is not a defect in the protocols; it is the boundary of what any protocol can do.`,
      },
      {
        q: `What is the difference the lesson draws between being authenticated and being known?`,
        options: [
          `There is no difference; they are two words for one thing`,
          `A bearer artifact works precisely because the gate need not know you, while the Word's standard of identity is being known - and no artifact manufactures that`,
          `Being known is simply a stronger form of authentication`,
          `Authentication applies to people and being known applies to machines`,
        ],
        answer: 1,
        explain: `The exorcists in Ephesus had the correct form of words - "We adjure you by Jesus whom Paul preacheth" (Acts 19:13) - and were met with an identity check they could not pass: "Jesus I know, and Paul I know; but who are ye?" (Acts 19:15). The Lord Jesus gave the same verdict over real works correctly invoked in His name: "I never knew you: depart from me, ye that work iniquity." (Matthew 7:23) A token's efficiency IS that the resource does not need to know you. That is where the technical frame honestly runs out.`,
      },
      {
        q: `The lesson names three places where the comparison between Scripture and these technologies STOPS. Which is one of them?`,
        options: [
          `The seal of the Holy Spirit is not a bearer token anyone presents - it is Yahweh's mark on a person, kept by Him, securing the believer rather than a request`,
          `Scripture never mentions letters, seals or rings`,
          `Delegated authority is a purely modern invention`,
          `A name in Scripture is always chosen by the person who bears it`,
        ],
        answer: 0,
        explain: `All three limits are named on purpose rather than smoothed over, because a weak analogy is worse than none: a graven gold plate is not a cryptographic credential (it held no secret and no stranger could test it), Yahweh does not authenticate because He already knows, and the sealing of "that holy Spirit of promise" (Ephesians 1:13) is done BY Him and is not copied, stolen, replayed or expired the way a bearer token is.`,
      },
      {
        q: `What did the Jerusalem assembly send ALONGSIDE its letter to Antioch, and what is that an early instance of?`,
        options: [
          `A payment, as surety for the letter`,
          `Judas and Silas, to tell them the same things by mouth - a second channel, which modern practice calls an out-of-band confirmation`,
          `A copy of the letter, sealed separately`,
          `Nothing; the letter travelled alone`,
        ],
        answer: 1,
        explain: `"We have sent therefore Judas and Silas, who shall also tell you the same things by mouth." (Acts 15:27) The paper did not travel alone: living men came with it, saying the same thing through a different channel. That is the answer to the forged-letter problem of the sixth movement, arriving six chapters earlier than anybody needed it - and the same letter also records authority claimed that was never granted, "to whom we gave no such commandment" (Acts 15:24).`,
      },
      {
        q: `In the Word, who may widen the scope of a commission?`,
        options: [
          `Only the sender - the twelve were bounded before they left and the bound was lifted later on an authority that was never theirs`,
          `The messenger, once he has proved himself faithful`,
          `Anybody who holds the credential`,
          `The people being ministered to`,
        ],
        answer: 0,
        explain: `The authority was named - "he gave them power against unclean spirits, to cast them out, and to heal all manner of sickness and all manner of disease" (Matthew 10:1) - and the territory was bounded up front: "Go not into the way of the Gentiles, and into any city of the Samaritans enter ye not" (Matthew 10:5). Later that bound is gone, and the reason is stated first: "All power is given unto me in heaven and in earth." (Matthew 28:18) The scope moved because the One who issued it moved it. The messengers never voted themselves more.`,
      },
      {
        q: `What does the lesson say is the honest limit on its own account of these four technologies?`,
        options: [
          `Nothing was verified at all, so the lesson should not be trusted`,
          `Nobody here read the published specifications, stood up a directory tenant or ran a real sign-in flow - the mechanics are carried as the newsletter and Darrell's summary report them`,
          `The verses were paraphrased from memory`,
          `The newsletter's advertisement supplied the lesson's figures`,
        ],
        answer: 1,
        explain: `Provenance before teaching, and the limits with it: the source is one forwarded newsletter plus Darrell's own forwarded summary, nobody opened the OAuth 2.0, OpenID Connect or SAML 2.0 documents, nobody tested a flow, and the issue's sponsored segment is advertising the lesson rests not one sentence on. What WAS verified to the letter is the Word: every quoted verse on the page is filled from the King James corpus held on this house's own disk, never typed from memory, and pinned by its own test.`,
      },
    ],
  },
  lesson: '',
  facilitator: {
    talkingPoints: [
      `OPEN WITH THE PROVENANCE AND WHOSE WORDS THESE ARE: a Level Up Coding issue by Nikki Siapno, subject SSO vs OAuth vs OIDC vs SAML, arrived 2026-09-29 at 12:44 UTC; Darrell forwarded it at 13:00 with one word on top, Lessons, AND wrote his own summary, takeaways, table, guidance and one-liner above it. His notes are the request; the newsletter is the occasion. Then say what nobody here verified: no specification read, no tenant stood up, no flow tested, and a sponsored segment in the same issue that this lesson does not use.`,
      `THE TWO QUESTIONS ON THE BOARD BEFORE ANYTHING ELSE, in his words: authentication is proving who you are, authorization is determining what you are allowed to access. Then the hotel card: the desk checks the booking, the card opens room 412 and the pool. Two objects, two jobs. Ask the room where they have seen the two collapsed into one.`,
      `THE SENTENCE THAT REFRAMES THE WEEK: Yahweh never authenticates anybody, because checking is a remedy for not knowing and He has no such lack. [[Isaiah 43:1]] then [[2 Timothy 2:19]] Knoweth, not checks. Say out loud that this gives the technology its correct dignity - it is a remedy for being strangers - rather than either worship or suspicion.`,
      `BORNE IDENTITY, AND THE FIRST NAMED LIMIT: [[Numbers 6:27]] then the plate graven like a signet, [[Exodus 28:36]] worn on the forehead for acceptance, [[Exodus 28:38]] Three properties: issued by the One with authority, worn where others read it, for acceptance he could not earn. Then say the limit plainly - it is NOT a cryptographic credential, it held no secret, no stranger could test it - and say why naming the limit is better teaching than a clever analogy.`,
      `WHERE THE PARALLEL IS GENUINELY STRONG - say so as plainly as the limits: [[Genesis 41:42]] the ring as the kingdom's signing key, then the four words that keep delegation honest, [[Genesis 41:44]] I am Pharaoh. Then [[Esther 8:8]] and the transport that is irrelevant to the trust, [[Esther 8:10]] Tie it to his OAuth note: on your behalf, without your password.`,
      `SCOPE, AND OVER-SCOPE: [[Matthew 10:1]] what, [[Matthew 10:5]] where, [[Luke 10:19]] large inside its bounds; then who moves a bound, [[Matthew 28:18]] All power is given unto ME, therefore go. Then the case every builder meets, [[Acts 15:24]] to whom we gave no such commandment. Ask the room for one time their name was used by somebody who was never sent.`,
      `THE MOVEMENT TO CARRY AWAY - run the four checks over Jezebel's letters BEFORE reading the outcome: [[1 Kings 21:8]] signature genuine, issuer the king, audience exactly those elders, nothing stale. Then [[1 Kings 21:11]] and let the room sit in it. Validation proves WHO ISSUED a thing and never that what it asks is righteous; the last defence is a steward who will refuse. [[Jeremiah 29:21]]`,
      `AUTHENTICATED IS NOT KNOWN: [[Acts 19:13]] correct words, then [[Acts 19:15]] who are ye, then [[Matthew 7:23]] I never knew you. State the hinge: a token works BECAUSE the gate need not know you - that is its efficiency - and the Word's standard is the reverse. Close the movement on [[John 5:43]]`,
      `THE WORD'S OWN FEDERATED TRUST: [[2 Corinthians 3:1]] the practice named, [[Romans 16:2]] a real one written, [[Nehemiah 2:9]] the audience that made it work, [[Acts 9:2]] the same instrument on a cruel errand. Then the second channel, [[Acts 15:27]] who shall also tell you the same things by mouth. Finish with [[2 Corinthians 3:3]] not with ink - the credential is finally the fruit.`,
      `THE THIRD LIMIT AND THE CLOSE: [[Ephesians 1:13]] the sealing is done BY Yahweh; a token is copied, stolen, replayed and expires, and this is none of those - refuse the session-management analogy out loud. Then the Name that is not delegated, [[Philippians 2:9]] and the apostles' answer to by what name, [[Acts 4:10]] Confess Him: the Lamb of Yahweh, the Eternal Son - John 1:29, John 3:16, Hebrews 1:8. End on the one thing no provider can issue: that He knows you.`,
    ],
    howToRun: `Prayer + the anchor (5): open in prayer; read 1 Kings 21:8-11 aloud (KJV) and stop there. | Provenance and whose words these are (6): the forward, his own summary above it, and everything nobody here verified. | The two questions (7): authentication and authorization, in his words, with the hotel card. | Yahweh does not authenticate (8): Isaiah 43:1 and 2 Timothy 2:19; the technology's correct dignity. | Borne identity and the first limit (10): Numbers 6:27, the graven plate, and why we refuse to call it a token. | The ring and the sealed letter (10): Genesis 41:42-44 and Esther 8:8; where the parallel is genuinely strong. | Scope and over-scope (8): Matthew 10:1-5, Matthew 28:18, Acts 15:24. | Jezebel's valid letters (12): run the four checks before reading the outcome; let the room sit in it. | Authenticated is not known (8): Acts 19:13-16 and Matthew 7:22-23. | Letters of commendation and the second channel (6): 2 Corinthians 3, Romans 16, Acts 15:27. | Talk about it together + close (5): the seal that is not a token, and the Lamb of Yahweh.`,
    discussionPrompts: [
      `[[Isaiah 43:1]] He calls by name, and the name settles the matter before any proof is offered. Where in your life are you still trying to PROVE an identity that has already been conferred on you?`,
      `[[Genesis 41:44]] I am Pharaoh. Name one thing you have let somebody act on for you, and say honestly whether you lent authority or handed it over.`,
      `[[Matthew 10:5]] The bound was stated before they left. Pick one credential you have granted - a key, a card, an account, a saved sign-in - and say what its stated bound actually is. If you cannot say, that is the answer.`,
      `[[Acts 15:24]] To whom we gave no such commandment. When has your name, or your household's, been carried by somebody who was never sent? What did it cost, and what would have caught it?`,
      `[[1 Kings 21:11]] The elders did as it was written, because the letter was valid. Name one well-formed instruction you have obeyed that you should have refused - at work, in a family, in a church - and say what would have to be true for you to refuse the next one.`,
      `[[Acts 19:15]] Jesus I know, and Paul I know; but who are ye? Who actually knows you - not knows about you? Say the names out loud, and notice how long the list is.`,
      `[[Acts 15:27]] Who shall also tell you the same things by mouth. What is one message in your life important enough to confirm through a second channel before you act on it, and why have you not done it yet?`,
      `[[2 Corinthians 3:3]] Not with ink, but with the Spirit. If somebody had to commend you without any paper at all, what would they have to point at?`,
    ],
  },
};

// -----------------------------------------------------------------------------
// Build: fill the verses, derive the anchor, splice into the catalog.
// -----------------------------------------------------------------------------
MODULE.lesson = LESSON.join('\n\n') + '\n\n' + TALK.lesson;

const filled = fillDeep(MODULE);
filled.anchor.ref = used.join('; ');

const src = readFileSync(CATALOG, 'utf8');
const OPEN = 'export const SOVEREIGN_AI_MODULES = [';
const start = src.indexOf(OPEN);
if (start < 0) throw new Error('sov50: the modules array was not found');
let end = src.indexOf('\n];', start);
if (end < 0) throw new Error('sov50: the modules array is not closed');

let src2 = src;
let end2 = end;
if (src.includes(ID)) {
  if (!process.argv.includes('--rebuild')) throw new Error(`sov50: ${ID} is already in the catalog; pass --rebuild to replace it`);
  const from = src2.indexOf(`  {\n    "id": "${ID}"`);
  if (from < 0) throw new Error('sov50: the id is in the file but not as a module literal; refusing to rebuild');
  // The block may be the LAST element, which carries no trailing comma. Taking
  // only `\n  },` found nothing in that case and refused a legitimate rebuild,
  // so both endings are handled and whichever comes first inside the array wins.
  const withComma = src2.indexOf('\n  },', from);
  const atArrayEnd = src2.indexOf('\n  }\n];', from);
  const ends = [
    withComma >= 0 && withComma < end2 ? { at: withComma, len: '\n  },'.length, back: 0 } : null,
    atArrayEnd >= 0 && atArrayEnd < end2 ? { at: atArrayEnd, len: '\n  }'.length, back: ','.length } : null,
  ].filter(Boolean).sort((a, b) => a.at - b.at);
  if (!ends.length) throw new Error('sov50: could not find the end of the existing block; refusing to rebuild');
  const { at: closeAt, len, back } = ends[0];
  const excised = src2.slice(from, closeAt + len);
  if (excised.split('"id":').length - 1 !== 1) {
    throw new Error(`sov50: the block to excise holds ${excised.split('"id":').length - 1} ids, expected 1; refusing to rebuild`);
  }
  // When the block being removed was last, the comma that joined it to the
  // previous element goes with it, or the array is left ending `},\n];`.
  src2 = src2.slice(0, from - back) + src2.slice(closeAt + len);
  end2 = src2.indexOf('\n];', src2.indexOf(OPEN));
  if (end2 < 0) throw new Error('sov50: the array is not closed after excising; refusing to rebuild');
  if (src2.includes(ID)) throw new Error('sov50: the id survived the excision; refusing to rebuild');
}

const block = JSON.stringify(filled, null, 2).split('\n').map((l) => `  ${l}`).join('\n');
// MEASURED, not assumed (and the sov48 defect class, a comma the splice got
// wrong, is exactly why this is checked rather than copied): main's array ends
// `  }\n];` with NO trailing comma, so the comma goes BEFORE the new block.
// Appending `block,` the way an earlier fill script did produces `}\n  {` and a
// parse error, which is what happened on the first run of this one.
const tailHasComma = /\}\s*,\s*$/.test(src2.slice(0, end2));
const next = tailHasComma
  ? `${src2.slice(0, end2)}\n${block},${src2.slice(end2)}`
  : `${src2.slice(0, end2)},\n${block}${src2.slice(end2)}`;

const weeks = (text) => [...new Set([...text.matchAll(/sov(\d+)-/g)].map((m) => Number(m[1])))].sort((a, b) => a - b);
const before = weeks(src2);
const after = weeks(next);
if (after.length !== before.length + 1) throw new Error(`sov50: week count went ${before.length} -> ${after.length}, expected exactly one more`);
if (before.includes(WEEK)) throw new Error(`sov50: week ${WEEK} is already taken`);
if (before.join(',') !== [...before].sort((a, b) => a - b).join(',')) {
  throw new Error(`sov50: the weeks on disk do not ascend: ${before.join(',')}`);
}
// Week 49 is being written on a parallel branch at the same time as this one,
// so a HOLE below 50 is expected here. What must hold is that the weeks on disk
// ascend and that 50 is the new top.
if (after[after.length - 1] !== WEEK) throw new Error(`sov50: week ${WEEK} is not the top of the course after splicing`);
const occurrences = next.split(`"${ID}"`).length - 1;
if (occurrences !== 1) throw new Error(`sov50: the new id appears ${occurrences} times, expected exactly once`);

writeFileSync(CATALOG, next);

const refs = filled.anchor.ref.split(';').map((s) => s.trim()).filter(Boolean);
for (const r of refs) verseText(r);
console.log(`sov50: spliced ${ID}`);
console.log(`sov50: modules ${before.length} -> ${after.length}; weeks on disk ${after.join(',')}`);
console.log(`sov50: ${refs.length} references on the anchor, every one quoted on the page and resolving in the corpus`);
console.log(`sov50: lesson ${filled.lesson.length} chars; bands child ${filled.levels.child.length}, youth ${filled.levels.youth.length}, teen ${filled.levels.teen.length}, senior ${filled.levels.senior.length}`);
