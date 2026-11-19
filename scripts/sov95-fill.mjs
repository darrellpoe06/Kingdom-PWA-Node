// =============================================================================
// sov95-fill - build Sovereign A.I. week 95 and splice it into the catalog
// =============================================================================
// WHY A GENERATOR AND NOT TYPING (binding, DR-0076 / DR-0456). Every quoted
// verse on this page is FILLED FROM app/public/bible/kjv at build time. The
// prose holds only a reference in double brackets, [[Ezekiel 33:5]], and this
// script replaces it with the corpus text followed by the reference. No verse
// on the page was typed from memory. anchor.ref is DERIVED from the
// placeholders that occur in the reader places (DR-0734).
//
// WHERE THE WORD CAME FROM. Darrell forwarded an account security alert into
// the lesson lane with ONE WORD above it: Lesson. Gmail thread
// `1a1f08def44cc672`. Built 2026-11-18. PRIVACY (a personal account email):
// the lesson is taught generically - a household's email account, an A.I.
// assistant app granted access to a linked drive. No address, account,
// recovery address, app identity, link or date from the email is written here
// or anywhere in the lesson.
//
// ONE TEACHING, ONE LESSON (DR-0610). lesson-already-built.mjs --thread
// returned NOTHING FOUND, and no week of this course teaches app permissions
// or a consent grant (grep of the catalog for oauth, granted access, consent:
// nothing). Week 46 (the helper that must see everything) owns WHETHER to give
// an assistant wide sight; week 93 owns the porter at the gate. This week owns
// the AFTER: the alert has sounded - check, do not ignore, do not panic, and
// take back the grant you no longer use.
//
// WORD FIRST (DR-0127 / DR-0282). Ezekiel 33:4-5 - the hearer of the trumpet -
// and Nehemiah 13:4-9 - the chamber Eliashib prepared for Tobiah, cast out and
// cleansed - frame the hour before a word about an app. Neither is the anchor
// of an earlier week of this course (counted on the catalog's anchor.ref
// before writing: 0 and 0; Nehemiah 13:4-9 appears in no week at all).
//
// TRUST BUT VERIFY (DR-0100 / DR-0076 section 8). REPORTED: the alert, as
// forwarded; we did not see the account, and an alert email can itself be an
// imitation. ESTABLISHED: a grant of access is standing permission until it
// ends or is taken back; the safe way to check an alert is to open the account
// yourself, not the link in the message. MEASURED: this house's own support
// door, read from infra/supabase/migrations-auto/0114-governed-support-door.sql
// and app/src/lib/support-access.js. NOT VERIFIED: whether the household made
// this grant, and the account provider's own help page (its host is outside
// this session's network, 2026-11-18). re-review: 2026-12-02.
//
// THE BANDS WERE WRITTEN BY HAND, NEVER BY A SCRIPT ON PROSE (DR-1306).
import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, '..');
const KJV = join(ROOT, 'app', 'public', 'bible', 'kjv');
const CATALOG = join(ROOT, 'app', 'src', 'lib', 'sovereign-ai-class.js');

const WEEK = 95;
const ID = 'sov95-he-that-taketh-warning';
const TITLE = 'He that taketh warning - the alert, the gate you opened, and the chamber you take back';

// -----------------------------------------------------------------------------
// The corpus
// -----------------------------------------------------------------------------
const books = new Set(
  readdirSync(KJV)
    .filter((f) => f.endsWith('.json') && f !== 'index.json')
    .map((f) => f.slice(0, -5))
);
const cache = new Map();

function bookFile(name) {
  const k = String(name).replace(/\s+/g, '');
  if (books.has(k)) return k;
  if (books.has(`${k}s`)) return `${k}s`;
  return null;
}

function verseText(ref) {
  const m = /^(.+?)\s+(\d+):(\d+)$/.exec(String(ref).trim());
  if (!m) throw new Error(`sov95: reference is not Book C:V -> "${ref}"`);
  const f = bookFile(m[1]);
  if (!f) throw new Error(`sov95: no such book -> "${ref}"`);
  if (!cache.has(f)) cache.set(f, JSON.parse(readFileSync(join(KJV, `${f}.json`), 'utf8')));
  const chap = cache.get(f).chapters[Number(m[2]) - 1];
  const text = chap && chap[Number(m[3]) - 1];
  if (!text) throw new Error(`sov95: reference does not resolve in the corpus -> "${ref}"`);
  return text;
}

const readerRefs = [];
const seenReader = new Set();

function fill(text, isReaderPlace = false) {
  return String(text).replace(/\[\[([^\]]+)\]\]/g, (_, ref) => {
    const r = ref.trim();
    const t = verseText(r);
    if (isReaderPlace && !seenReader.has(r)) {
      seenReader.add(r);
      readerRefs.push(r);
    }
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
// The sentences every reader place must carry, so a reader who reads ONE band
// still gets the tiers, the house finding and the date (DR-0795).
// -----------------------------------------------------------------------------
const REVIEW = 're-review: 2026-12-02';

const FACTS = {
  lesson: `WHERE WE STAND ON THE FACTS. REPORTED: the alert itself, as it was forwarded - a household's email account was told that an A.I. assistant app had been granted access to a linked drive, and that if the owner did not grant it, they should check the activity and secure the account. We did not see the account, and we did not check the alert against it; an alert email can itself be an imitation, which is why the check is made by opening the account yourself. ESTABLISHED, and stated plainly: a grant of access is standing permission until it ends or someone takes it back, and the safe way to answer a security alert is to go to the account directly, never through the link in the message. MEASURED in our own house, from our own code: the support door's grant is scoped to one record, needs a written reason, ends within a day at most, logs every read and can be revoked. NOT VERIFIED: whether the household made this grant - only the household can answer that - and the account provider's own help page, which this build could not reach. ${REVIEW}.`,
  child: `WHAT IS SURE AND WHAT IS NOT. Darrell sent us the alert. We did not see the account it came from, so we did not check it ourselves. It is sure that every yes you give an app stays a yes until you take it back. It is sure that you should check an alert by opening your account yourself, not by tapping the link. We read the code of our own app to see how it gives a helper a key. We do not know if this family said yes to that app. Only they can know. That is not verified yet. We will look again. ${REVIEW}.`,
  youth: `WHAT IS SURE AND WHAT IS NOT. The alert came to us forwarded, and we did not see the account or check the alert against it. Two things are well known and sure: a yes you give an app stays a yes until it runs out or you take it back, and the safe way to answer an alert is to open the account yourself instead of tapping its link. Our own app's support door was read from our own code. Whether this household gave this grant is not verified; only the household can say. ${REVIEW}.`,
  teen: `WHAT IS SURE AND WHAT IS NOT. Sort every claim. Reported: the alert, as it was forwarded; we did not see the account and did not check the alert against it. Established: a grant is standing permission until it expires or is revoked, and you answer an alert by opening the account yourself, never through its link. Measured: our own support door, read from our own code. Not verified: whether this household made this grant, and the provider's own help page, which we could not reach. ${REVIEW}.`,
  senior: `WHERE WE STAND ON THE FACTS. The alert is reported as it was forwarded; the account itself was not seen, and the alert was not checked against it. That a grant of access remains standing permission until it expires or is withdrawn, and that an alert is properly answered by opening the account directly rather than through the message, are established and stated without hedging. Every statement about this house is traced to its own code: the support door's grant, scoped to one record, requiring a reason, expiring within a day, logging each read and revocable. Whether this household made the grant is not verified, nor was the provider's own guidance page reachable from this build, and no conclusion is drawn about either. ${REVIEW}.`,
};

const RHYTHM =
  'Do it once today, in one of the four places of Deuteronomy 6:7 - at the table, on the way, at lying down, or at rising up - and with one friend this week.';

const GROWTH =
  'And measure the growth the Word’s way, by the fruit, [[Galatians 5:22]] by the occasions, [[Deuteronomy 6:7]] and by the days. [[Hebrews 3:13]]';

const TALK = {
  lesson: `TALK ABOUT IT TOGETHER. Parents, sit with one of your children today and ask them one open question - what would you do if a message told you someone had come into your account - and listen all the way to the end before you add a single word; have them retell their own answer in their own words, then teach them one verse back, Ezekiel 33:5. Children, ask your mother, your father or a grandparent about a key they once gave someone and later took back, and why; hear the whole of it before you reply, then retell their story back to them in your own words. Then ask a friend this: which apps still hold a key to our things that we no longer use. Teach each other one verse. ${RHYTHM} ${GROWTH}`,
  child: `TALK ABOUT IT TOGETHER. Parents, ask your child one thing today - who has a key to our house - and listen all the way to the end before you talk; have them say it back to you in their own words, then teach them one verse, Nehemiah 13:8. Children, ask your mom or your dad or your grandma or your grandpa who they would give a key to, and who they would not. Let them tell the whole story. Then tell it back to them in your own words. Then ask a friend this: what should we do when a grown up gets a warning. Teach each other one verse. ${RHYTHM}`,
  youth: `TALK ABOUT IT TOGETHER. Parents, ask your child one open question today - which apps on your phone can see your photos, and do you still use them - and listen all the way to the end before you fix anything; have them retell the answer in their own words, then teach them one verse, Proverbs 14:15. Children, ask your mom, your dad or a grandparent about a warning they once ignored, and what it cost; hear the whole of it before you answer, then retell their answer in your own words. Then ask a friend this: what would we check first if we got an alert. Teach each other one verse. ${RHYTHM} ${GROWTH}`,
  teen: `TALK ABOUT IT TOGETHER. Parents, ask your child one open question today - when you tap allow, what do you think you are agreeing to - and listen all the way to the end instead of answering it for them; have them retell their own answer back to you in their own words, then teach them one verse, Psalms 112:7. Children, ask your mom, your dad or a grandparent about a time a fake message almost fooled them, and how they caught it; hear the whole of it before you reply, then retell their answer in your own words. Then ask a friend this: what chamber in our accounts is holding someone else's stuff. Teach each other one verse. ${RHYTHM} ${GROWTH}`,
  senior: `TALK ABOUT IT TOGETHER. Grandparents, ask the young people in your house one open question today - who did you last say yes to on your phone, and do you remember why - and listen all the way to the end, without finishing a sentence for them; have them retell their own answer in their own words, then teach them one verse back, Nehemiah 13:9. Children, ask your parents or your grandparents about the keys they kept, the keys they lent, and the keys they asked for back; hear the whole of it before you reply, then retell it back to them in your own words. Then ask a friend this: when an alert comes, who in our house checks it calmly. Teach each other one verse. ${RHYTHM}`,
};

// -----------------------------------------------------------------------------
// The adult lesson. The Word opens it, and no word about an app stands above
// that frame.
// -----------------------------------------------------------------------------
const LESSON = [
  `${TITLE.toUpperCase()}.
WHO SENT THIS. Darrell forwarded an account security alert into this lane with ONE WORD typed above it: Lesson. That word is the ask; the alert is only the occasion. Because the alert came from a household's own email account, this lesson tells it plainly and generically. An A.I. assistant app had been granted access to a linked drive, and the message said that if the owner had not granted it, they should check the activity and secure the account. Nothing more from the email is needed, and nothing more is written here.
One teaching, one lesson. Week forty-six of this course asks whether to give a helper wide sight at all. Week ninety-three is the porter at the gate. This week takes up what comes after both: the alert has sounded. What do you do now?`,
  `THE WORD FIRST, BEFORE ANY APP. Yahweh gave Ezekiel the office of a watchman and explained it from the people's side first: [[Ezekiel 33:2]] The watchman has one duty: [[Ezekiel 33:3]] Then the duty passes to the one who hears it: [[Ezekiel 33:4]] [[Ezekiel 33:5]]
Read those two verses slowly, because they are the whole lesson. The watchman's job is to blow. The hearer's job is to take warning. A watchman who blows and is ignored has done his part. A hearer who hears and does nothing has no one left to blame. And the promise is on the other side too: the one who takes warning delivers his soul.
An account alert is a trumpet. It does not say the sword has come. It says someone walked through a gate. Whether that someone is a friend you let in or a stranger who slipped in, the trumpet is the same. The hearer is the one who must find out.`,
  `THE CHAMBER IN THE HOUSE. Nehemiah gives the second half of the lesson, and he gives it as a story. While he was away, a man inside the house opened a room to an outsider: [[Nehemiah 13:4]] [[Nehemiah 13:5]] Nehemiah was not there to see it: [[Nehemiah 13:6]] When he came back, he understood what had been done: [[Nehemiah 13:7]] And he did one thing about it: [[Nehemiah 13:8]] Then he finished the job: [[Nehemiah 13:9]]
Look at how that grant was made. It was not a break-in. It was made from the inside, by a man who had the oversight of the chamber, for someone he was allied to. It was made while the one who watched over the whole was away. It sat in a room meant for something else. And it stayed, long after anyone remembered why.
Look also at what Nehemiah did not do. He did not burn the house down. He did not lock every door in Jerusalem. He did not pretend the room was fine. He took out one man's household stuff, he cleansed the room, and he brought back what belonged there. That is revoking access, in a sentence: remove what does not belong, clean the room, put the right things back.`,
  `EVERY GRANT IS A GATE. When you tap allow on a screen that asks for your drive, your mail, your photos or your calendar, you open a gate. It does not close when you put the phone down. It is standing permission, and it stays until it runs out or until someone takes it back. Most of those gates are opened on purpose and for good reasons. An assistant that helps you find a file needs to see your files. But a year from now, the reason may be gone and the gate may still be open, exactly like Tobiah's chamber.
The alert is the watchman telling you who walked through. It is not an accusation, and it is not proof of an attack. It is information, given to the one person who can act on it.`,
  `THREE WRONG ANSWERS AND ONE RIGHT ONE. The first wrong answer is to ignore it. It is probably nothing, you think, and you delete the message. Ezekiel has already said what that costs, and he said it about the hearer, not the watchman.
The second wrong answer is panic. You change every password at once, you lock yourself out, you tell the whole family something terrible has happened. The Word has a word for that, too: [[Psalms 112:7]] An alert is evil tidings only until you look. A heart that is fixed can look calmly.
The third wrong answer is to believe every word, including the word of the alert itself: [[Proverbs 14:15]] A message that says someone entered your account is exactly the kind of message a thief would forge, with a button that leads to a page that looks like your account and is not. The prudent man looketh well to his going. So you do not tap the link. You open your account yourself, the way you always do, and you look there.
The right answer is the one Ezekiel names. Take warning. Check whether you opened that gate.`,
  `THE CHECK, IN ORDER. First, did I grant this? Think back. Did you, or someone in your house, connect a helper to that account recently? If yes, the trumpet told you the truth about something good, and you can thank the watchman.
Second, what does it reach? A grant to read one folder is not a grant to read and change everything. Open the account's own list of apps that hold access and read what this one can do.
Third, do I still use it? If the answer is yes, keep it and note when you will look again. If the answer is no, take it back. That is Nehemiah's casting forth.
Fourth, if you did not grant it, act at once and in order. Remove the app's access. Change the password. Look at the account's recent activity. And check the recovery address, the second address the alert was also sent to. That second address is a second watchman. Make sure it is still one you control, because whoever holds the recovery address can take the whole house.`,
  `REVIEW THE CHAMBERS ON A SCHEDULE. Nehemiah found Tobiah's room because he came back and looked. Do not wait for an alert to do the same. Pick a day each season, open the list of apps that hold access to your main accounts, and walk through it like Nehemiah walking the courts. For each one ask the same three questions: who is this, what can it reach, and do we still use it. Take back what you no longer use. Then bring back the vessels: tighten the recovery address, turn on the second step at sign-in, and write down what you kept and why.
A family that does this once a season will rarely be surprised by an alert, and when one comes, the check will take minutes.`,
  `OUR OWN HOUSE, MEASURED, NOT PAINTED. This house builds the family app, and the app has its own gate for helpers. When something needs fixing, the technology team does not get standing access to anyone's records. An owner of the account gives a support helper a grant instead, and our own code says what that grant is. It reaches one record, not the whole house. It needs a written reason, or it is refused. It ends on its own: an hour unless the owner chooses otherwise, and never more than a day. Every read through it is written to the audit log, so the owner always has a receipt. And the owner can revoke it before it ends. Clinical and private health records are never offered at all.
That is the same lesson built into code: every gate has a name, a reason, a room, an end and a record. What we have measured is the code. We did not query the live database for how many grants have been made, and this lesson does not claim a number.`,
  `IT IS KEPT. Every watchman sleeps sometime, and every family misses a trumpet now and then. There is one Keeper who does not: [[Psalms 121:4]] And there is one Shepherd who kept every gate He was given. Jesus said to the Father: [[John 17:12]] He is the Lamb of Yahweh, [[John 1:29]] the Son the Father gave, [[John 3:16]] the Eternal Son whose throne stands for ever, [[Hebrews 1:8]] and the One by whom all things consist. [[Colossians 1:17]] We take warning because we are not Him. We check our gates calmly because He keeps us.`,
  `FOUR THINGS FOR THE HOUSE. One: when an alert sounds, take warning - do not ignore it and do not panic. Two: check it by opening the account yourself, never through the link in the message. Three: ask the three questions of every app that holds access - who is this, what can it reach, do we still use it - and take back what you no longer use. Four: keep the recovery address in your own hands, and walk the chambers once a season.`,
];

// -----------------------------------------------------------------------------
// The four age bands. Each is an independent composition for its reader.
// -----------------------------------------------------------------------------
const CHILD = `${TITLE}.
WHO SENT THIS. A grown up in a family got a warning on the computer. It said a helper app was let in to see some of the family's files. Darrell sent the warning to us with one word on top. The word was Lesson. So here it is.
THE WORD FIRST. Long ago, Yahweh gave a man named Ezekiel a job. He was a watchman. A watchman stands on the wall and looks out. If he sees danger, he blows a trumpet. Then the people must listen. Here is what the Bible says about a man who hears the trumpet and does nothing. [[Ezekiel 33:4]] And here is what it says about the man who listens. [[Ezekiel 33:5]] So the watchman blows. The people listen and act. That is how a town stays safe.
A ROOM GIVEN AWAY. Here is a second story. A man named Nehemiah took care of Yahweh's house. He went away on a trip. While he was gone, a priest named Eliashib gave a big room in the house to a man named Tobiah. That room was for food and gifts for Yahweh's house. Now Tobiah's things were in it. [[Nehemiah 13:7]] When Nehemiah came home, he saw it. He was sad. Then he did this. [[Nehemiah 13:8]] He took Tobiah's stuff out of the room. Then he had the room cleaned. He put the right things back. [[Nehemiah 13:9]]
A YES IS A KEY. When a grown up taps allow on a phone, it is like giving a key. The app can come in and look. Some keys are good. A helper app may need a key to find your photos. But a key stays a key. It does not go away by itself. It stays until you take it back.
THE WARNING. The warning on the computer was like the trumpet. It said, someone has a key now. It did not say a bad guy came in. It just said, look.
THREE WRONG THINGS. One wrong thing is to do nothing. That is like the man who heard the trumpet and stayed in bed. A second wrong thing is to get very scared and yell. The Bible says a good man does not have to be afraid of bad news. [[Psalms 112:7]] He can look calmly. A third wrong thing is to believe the warning too fast. Some warnings are fake. A bad guy can send a fake one, with a button that takes you to a fake page. [[Proverbs 14:15]] So a wise grown up does not tap the button. They open the account the normal way and look there.
THE RIGHT THING. The right thing is to check. Ask, did we give this key? If yes, that is fine. If no, take the key back right away. If we gave it but do not use it now, take it back too. That is what Nehemiah did with the room.
OUR OWN APP. Our family app has a way to let a helper in to fix something. We read the code to see how it works. The helper gets a key to one thing, not to everything. The grown up has to write down why. The key stops working by itself, in an hour, or in one day at most. Every time the helper looks, it gets written down. And the grown up can take the key back any time. That is a good key.
YOUR OWN KEYS. Who has a key to your house? Maybe a grandma, or a neighbor who feeds the cat. That is fine. But if a family moved away long ago and still has a key, it is time to ask for it back. Apps are the same.
A JOB FOR YOU. If you see a warning on a phone or a computer, do not tap it. Do not hide it. Go get a grown up. Say, I got a warning. Let them look. That is taking warning. You did your part.
CHECK THE ROOMS. Nehemiah did not wait for trouble. He came back and looked at the rooms. Your family can do that too. Once in a while, sit with a grown up and look at which apps can see your games, your photos, or your schoolwork. Ask, do we still use this one? If not, take its key back.
YAHWEH KEEPS US. Even a good watchman gets tired and sleeps. Yahweh never does. [[Psalms 121:4]] And Jesus kept every person His Father gave Him. [[John 17:12]] He is the Lamb of Yahweh. [[John 1:29]] [[John 3:16]] He holds everything together. [[Colossians 1:17]] So we can check our keys without being scared, because He keeps us.
FOUR THINGS TO DO. Listen to the warning. Do not be scared. Do not tap the button, go look the normal way. Take back keys you do not use.
${FACTS.child}
${TALK.child}`;

const YOUTH = `${TITLE}.
WHO SENT THIS. A household got a security alert on its email account. The alert said an A.I. assistant app had been given access to a linked drive, and that if nobody in the house had allowed it, they should check and lock the account down. Darrell forwarded the alert with one word on it: Lesson. We are keeping the household private, so this lesson tells it in general. Week forty-six of this course is about whether to let a helper see everything in the first place. This week is about what to do when the alert actually comes.
THE WORD FIRST. Yahweh made Ezekiel a watchman. A watchman's job was to watch for an enemy and blow a trumpet. [[Ezekiel 33:3]] After that, the job belonged to whoever heard it. [[Ezekiel 33:4]] [[Ezekiel 33:5]] The watchman blows. The hearer takes warning. If the hearer does nothing, that is on the hearer.
NEHEMIAH'S ROOM. Nehemiah was in charge of rebuilding Jerusalem, and at one point he had to go back to the king for a while. While he was away, the priest who managed the storerooms did a favor for a friend. [[Nehemiah 13:4]] He gave Tobiah a big room in Yahweh's house that was supposed to hold offerings. When Nehemiah came back, he saw it. [[Nehemiah 13:7]] He did not argue about it for weeks. [[Nehemiah 13:8]] Then he had the room cleaned and put the right things back in it. [[Nehemiah 13:9]]
Notice that nobody broke in. Someone on the inside opened the room, on purpose, while the person watching was away. And it stayed open long after the reason was gone.
EVERY ALLOW IS A GATE. When you tap allow on an app that wants your photos, contacts, drive or location, you open a gate. It stays open until it expires or until you close it. Many of those gates are fine. A photo editor needs your photos. But six months later you might have deleted the app's icon and forgotten it, and the permission can still be sitting there like Tobiah's furniture.
The alert is the watchman telling you who came through the gate. It is not saying you were hacked. It is saying, look.
THREE WRONG MOVES. The first is ignoring it. Delete, move on. That is the hearer in Ezekiel 33:4.
The second is panicking. Changing every password in a rush, getting locked out, scaring everyone. [[Psalms 112:7]] A steady person can look before they react.
The third is believing every word, including the alert. Fake security alerts are one of the oldest tricks there is. The button goes to a page that looks real and steals your password. [[Proverbs 14:15]] So never use the alert's link. Open the app or the site yourself, the way you normally do, and look there.
THE RIGHT MOVE. Check whether you opened the gate. Did you, or someone in your house, connect that app? What can it reach - one folder, or everything? Do you still use it? If you did not allow it, remove it right away, change your password, look at recent activity, and make sure the backup email on the account is one you still control. That backup address is like a second watchman. Whoever controls it can take over the whole account.
WALK THE ROOMS. Nehemiah found the problem because he came back and looked. You can do that without waiting for an alert. Once a season, open the list of apps that have access to your main accounts. Ask three questions about each one: who is this, what can it reach, and do I still use it. Take back what you do not use.
OUR OWN APP. Our family app has a support door, and we read our own code to see how it works. A helper never gets standing access to anyone's records. The owner grants access to one record, has to type a reason, and the grant ends on its own, usually after an hour and never after more than a day. Every read is logged, and the owner can revoke it early. Health records are never offered. That is a gate with a name, a reason, a room, an end and a record. We read the code; we did not count how many grants have been made.
WHEN IT WAS YOU. Most of the time the answer will be yes, we did that. Someone in the house connected a homework helper or a photo backup last week. That is a good outcome, not a wasted check. You learned the alert works, you learned what the app can reach, and you can write down the day you will look at it again.
FAKE ALERTS AT SCHOOL. Schools get fake messages too, like an email that says your grade portal is locked and you need to log in through a link. The same rule works. Do not use the link. Go to the portal the way you always do. If it is real, it will be there.
KEPT. Every watchman gets tired. Yahweh does not. [[Psalms 121:4]] Jesus said He kept every person the Father gave Him. [[John 17:12]] He is the Lamb of Yahweh, [[John 1:29]] [[John 3:16]] the Eternal Son, [[Hebrews 1:8]] who holds everything together. [[Colossians 1:17]] We check our gates because we are not Him, and we can do it calmly because He keeps us.
FOUR HABITS. Take the warning seriously. Stay calm. Check through the real app, never the link. Take back access you no longer use.
${FACTS.youth}
${TALK.youth}`;

const TEEN = `${TITLE}.
WHO SENT THIS. Darrell forwarded a security alert from a household's email account with one word above it: Lesson. The alert said an A.I. assistant app had been granted access to a linked drive, and told the owner to check the activity if they had not granted it. The household stays private here. This course already has a week on whether to give a helper total visibility, week forty-six, and a week on the porter at the gate, week ninety-three. This one is about the moment after: the alert is in your inbox, and you have to decide what to do with it.
THE FRAME. Ezekiel's office was the watchman's, and Yahweh spelled out both halves of the job. The watchman sees the threat and sounds the alarm. [[Ezekiel 33:3]] The responsibility then moves to everyone who heard. [[Ezekiel 33:4]] [[Ezekiel 33:5]] If you ignore the trumpet, that outcome is yours. If you respond, you are delivered. An account alert works the same way. The system did its part by telling you. Now the decision is yours.
THE INSIDE JOB. Nehemiah 13 is a case study in access. Nehemiah had to leave Jerusalem for a while, and the priest in charge of the storerooms used that window. [[Nehemiah 13:4]] [[Nehemiah 13:5]] He cleared out a room meant for offerings and gave it to Tobiah, a man who had fought the rebuilding from the start. [[Nehemiah 13:7]] Nehemiah's response was clean and proportional. [[Nehemiah 13:8]] He did not tear down the temple or lock every door in the city. He removed one grant, had the room cleaned, and restored what belonged there. [[Nehemiah 13:9]]
Three details matter. The access was granted from the inside, by someone with real authority over that room. It was granted while the person who watched over everything was away. And it stayed long after anyone could have explained it.
WHAT ALLOW MEANS. Tapping allow is not a one-time action. It is standing permission. The app keeps that access until the grant expires or until you revoke it. Most grants are reasonable when you make them. The problem is the ones you forget, which stay open with nobody watching them.
THREE BAD RESPONSES. Ignoring it is the first. That is the hearer in Ezekiel who heard the trumpet and kept walking.
Panic is the second. Resetting everything at once, locking yourself out, assuming the worst. [[Psalms 112:7]] A settled person investigates before reacting.
Believing everything is the third, and it includes the alert. Fake security alerts are a standard phishing move, with a button that leads to a convincing copy of a login page. [[Proverbs 14:15]] So you never use the alert's link. You open the account directly, through the app or a bookmark you trust, and check there.
THE AUDIT. Ask four questions in order. Did I or someone in my house grant this? What does it actually reach, one folder or the whole drive? Do I still use it? And if I did not grant it, what do I lock down first? If it was not you, remove the app, change the password, review recent activity, and confirm that the recovery email is still yours. The recovery address is a second watchman, and whoever holds it can take the whole account.
A SEASONAL SWEEP. Nehemiah found the problem because he came back and looked. Do not wait for an alert. Every few months, open the connected-apps list on your main accounts and run the same three questions on each entry: who is this, what can it reach, do I still use it. Revoke what you do not use. Then turn on two-step sign-in and tighten your recovery options.
OUR OWN CODE. Our family app has a support door, and the code defines exactly what a grant looks like. Nobody on the tech team gets standing access to anyone's data. An owner grants access to one record, must give a reason, and the grant expires on its own, after an hour by default and a day at most. Every read through it is logged to an audit trail, and the owner can revoke it early. Health records are excluded entirely. It is the same principle written into software: a name, a reason, a scope, an end date, and a receipt. We measured the code, not the live database, so we are not claiming a count of grants.
WHEN IT WAS YOU. Most alerts will turn out to be your own doing, or a parent's. That does not make the check a waste. You confirmed the alarm works, you saw exactly what the app can reach, and you can put a date on your calendar to decide whether it still earns that access.
YOUR DIGITAL CHAMBERS. Think about what you have connected over the years: a game that logs in through your main account, a quiz site that wanted your contacts, a photo app from three phones ago. Each one is a room with someone else's stuff in it. Clearing them out is not paranoia. It is housekeeping.
KEPT. Every watchman eventually sleeps. Yahweh does not. [[Psalms 121:4]] Jesus told the Father that He kept every person given to Him. [[John 17:12]] He is the Lamb of Yahweh, [[John 1:29]] the Eternal Son, [[Hebrews 1:8]] by whom all things consist. [[Colossians 1:17]] We audit our gates because we are not Him, and we do it without fear because He keeps us.
FOUR MOVES. Take warning. Stay steady. Verify through the account, never the link. Revoke what you no longer use.
${FACTS.teen}
${TALK.teen}`;

const SENIOR = `${TITLE}.
WHO SENT THIS. Darrell forwarded a security alert received on a household's email account, with a single word typed above it: Lesson. The alert reported that an artificial intelligence assistant application had been granted access to a linked storage drive, and advised the owner, should they not have authorised it, to review the activity and secure the account. Out of respect for the household's privacy, the matter is described here only in general terms. The question of whether to allow any helper unrestricted sight belongs to week forty-six of this course, and the porter at the gate to week ninety-three. This week considers what follows once the alarm has actually been raised.
THE FRAME. Ezekiel was appointed a watchman, and Yahweh set out the office from both sides. The watchman's obligation is to sound the alarm when he sees danger approach. [[Ezekiel 33:3]] Thereafter the obligation rests with those who hear it. [[Ezekiel 33:4]] [[Ezekiel 33:5]] A warning disregarded leaves the hearer accountable; a warning heeded delivers him. An account alert is precisely such a trumpet. It does not announce that harm has occurred; it announces that a gate has been passed, and it leaves the inquiry to the one who hears.
THE CHAMBER IN THE COURTS. The closing chapter of Nehemiah records a grant of access in remarkable detail. During Nehemiah's absence at the Persian court, the priest entrusted with the storerooms made room for an associate. [[Nehemiah 13:4]] [[Nehemiah 13:5]] [[Nehemiah 13:6]] The chamber had been set apart for offerings and the provision of the Levites, yet it came to house the belongings of Tobiah, a long-standing opponent of the rebuilding. On his return Nehemiah perceived what had been done. [[Nehemiah 13:7]] His remedy was measured. [[Nehemiah 13:8]] [[Nehemiah 13:9]] He neither demolished the house nor sealed every entrance to the city; he removed a single improper grant, purified the room, and restored its proper contents.
Three features deserve attention. The access was conferred from within, by one holding legitimate oversight. It was conferred while the principal steward was absent. And it persisted long after any reason for it could have been given.
A GRANT IS STANDING PERMISSION. To approve an application's request for access to one's correspondence, documents, photographs or calendar is to open a gate, and the gate remains open until the permission lapses or is withdrawn. Most such approvals are sensible when given. The difficulty lies with those forgotten, which remain in force with no one attending to them.
THREE MISTAKEN RESPONSES. Indifference is the first: the message is dismissed as probably nothing. Ezekiel has already described the consequence, and he described it of the hearer.
Alarm is the second: every password altered in haste, the owner locked out of his own accounts, the household distressed. [[Psalms 112:7]] A settled heart examines before it acts.
Credulity is the third, and it extends to the alert itself. Counterfeit security notices are among the commonest deceptions in circulation, each furnished with a button leading to a convincing imitation of the genuine page. [[Proverbs 14:15]] The prudent course is never to follow the message's link, but to open the account by one's usual means and examine it there.
THE PROPER INQUIRY. Four questions, in order. Was this access granted by me or by someone in my household? What, precisely, does it reach? Is it still in use? And if it was not granted by us, what must be secured first? Where the grant is unrecognised, remove the application's access, change the password, review recent activity, and confirm that the recovery address remains under your own control. That recovery address is a second watchman, and whoever commands it may claim the entire account.
A REGULAR INSPECTION. Nehemiah discovered the misuse because he returned and inspected. A household need not await an alert to do likewise. Once each season, open the list of applications holding access to the principal accounts and put the same three questions to each: who is this, what can it reach, and is it still in use. Withdraw what is no longer needed; then strengthen the recovery arrangements and enable a second step at sign-in. Grandparents who once kept a careful record of who held a key to the front door will recognise the discipline at once.
THIS HOUSE, EXAMINED. The family application maintains its own door for support, and its code has been read to establish what a grant there consists of. No member of the technology team holds standing access to anyone's records. An owner grants access to a single record, must record a reason, and the grant expires of its own accord, after one hour by default and never later than one day. Each read is entered in an audit log, and the owner may revoke the grant before it expires. Clinical and private health records are excluded altogether. It is the same principle expressed in software: a name, a reason, a scope, a term and a record. The code has been measured; the live database has not been queried, and no count of grants is asserted.
KEPT. Every watchman must at length sleep. Yahweh does not. [[Psalms 121:4]] Jesus said to the Father that He had kept every one entrusted to Him. [[John 17:12]] He is the Lamb of Yahweh, [[John 1:29]] [[John 3:16]] the Eternal Son whose throne endures, [[Hebrews 1:8]] by whom all things consist. [[Colossians 1:17]] We inspect our gates because we are not He, and we may do so without fear because He keeps us.
FOUR PRACTICES. Heed the warning. Remain composed. Verify through the account itself, never through the message. Withdraw every grant no longer in use, and keep the recovery address in your own hands.
${FACTS.senior}
${TALK.senior}`;

const MODULE = {
  id: ID,
  title: TITLE,
  bigIdea: `${TITLE.toUpperCase()}.
WHO SENT THIS. Darrell forwarded an account security alert with ONE WORD typed above it: Lesson. Told generically: an A.I. assistant app was granted access to a household's linked drive.
THE WORD FIRST. Ezekiel 33:5 opens the hour - the hearer of the trumpet who takes warning delivers his soul - with Nehemiah 13:8 beside it - the chamber opened to an outsider, cast out, cleansed and restored. [[Ezekiel 33:5]] [[Nehemiah 13:8]]
THE TEACHING. Every grant of access is a gate you opened. The alert is the watchman telling you who walked through. Check whether you opened it - do not ignore it, do not panic, and do not answer it through its link. Review the apps that hold access, and take back what you no longer use.
OUR OWN HOUSE. The app's support door grants one record, with a reason, for an hour by default and a day at most, logs every read, and can be revoked.
THE TIERS. REPORTED: the alert, as forwarded. ESTABLISHED: a grant stands until it ends or is revoked; check an alert through the account itself. MEASURED: our own code. NOT VERIFIED: whether the household made this grant. ${REVIEW}.
PLACEMENT. Sovereign A.I., week 95, because a household that lets an assistant into its things must also know how to take the key back.
CLOSE. [[Psalms 121:4]] Jesus, the Lamb of Yahweh and the Eternal Son, kept every one the Father gave Him.`,
  inApp: `One screen to read in this app, and one page in your Study.
In the app: open Sovereign A.I. week 95 and read the band that fits the reader in front of you - the lesson carries all four, child, youth, teen and senior, and each one is whole on its own. Then open the list of apps that hold access to your main account, by going to the account yourself, and ask of each one: who is this, what can it reach, do we still use it.
In your Study, write three lines. One app you gave access to and still use. One you will take back. One person in your house who will check the next alert with you. [[Nehemiah 13:9]]`,
  anchor: {
    ref: 'FILLED FROM THE PLACEHOLDERS',
    theme: `[[Ezekiel 33:5]] [[Nehemiah 13:8]] [[Nehemiah 13:9]] [[Psalms 112:7]] [[Proverbs 14:15]] [[Psalms 121:4]] [[John 17:12]]`,
  },
  rpe: {
    research: `RESEARCH. Three readings, each landing on your own house.
First, read Ezekiel 33:1-9. Mark what the watchman must do and what the hearer must do. Write one sentence on a warning you once ignored.
Second, read Nehemiah 13:4-9. Mark who opened the room, when, and for whom, and the three things Nehemiah did. Write down one room in your accounts holding something that does not belong.
Third, read Psalms 112:1-8 and Proverbs 14:15. Write down how a steady heart and a careful step answer the same alert.
And one verification reading, because this course works this way. The alert is reported as forwarded; we did not see the account. That a grant stands until it ends or is revoked is established. Our house was read from our own code. Whether the household made this grant is not verified.`,
    plan: `PLAN. Decide four steps before the week starts, and decide who hears them.
One: the trumpet. Decide who in your house checks an alert, and that they check it through the account, not the link.
Two: the list. Choose the day you will open the list of apps that hold access to your main accounts.
Three: the casting forth. Decide the rule: anything you do not use is taken back.
Four: the second watchman. Confirm the recovery address on each account is one you control.
Then name the person who will ask you about all four on the same day next week.`,
    execute: `EXECUTE. Keep it for one week, out loud, with one other person.
Open one account's list of apps with access. Ask the three questions of each. Take back one you do not use. Check the recovery address.
Teach the verse at a meal: he that taketh warning shall deliver his soul. Ask a child what they would do if a warning popped up.
At the end of the week, answer three questions to the person who is asking. What did you find? What did you take back? Who will check the next alert?
Measure the growth the Word's way - by the fruit, by the occasions, and by the days.`,
  },
  media: [],
  benefits: [
    `Darrell's one word, Lesson, over a household's account alert, answered from the Word and told generically so the household stays private.`,
    `The hour opened by Ezekiel 33:4-5, so an alert is heard as a trumpet and the hearer knows the next move is theirs.`,
    `Nehemiah 13:4-9 laid beside it: a chamber opened from the inside to an outsider, cast out, cleansed and restored.`,
    `Every grant of access named as a gate you opened, standing until it ends or is taken back.`,
    `Three wrong answers named - ignoring, panic, and believing every word including a forged alert - and one right one: check.`,
    `Psalms 112:7 keeping the check calm, and Proverbs 14:15 keeping it careful: open the account yourself, never the link.`,
    `A check in order: did we grant it, what does it reach, do we still use it, and what to lock down first if we did not.`,
    `The recovery address named as a second watchman, to be kept in your own hands.`,
    `A seasonal walk through the chambers: who is this, what can it reach, do we still use it.`,
    `Our own app's support door measured from its code: one record, a reason, an hour by default, a day at most, every read logged, revocable.`,
    `Jesus confessed as the One who kept every one the Father gave Him, the Lamb of Yahweh and the Eternal Son (John 17:12).`,
    `The reported, the established, the measured and the unverified told apart in every reader place, with a dated re-review.`,
  ],
  stories: [
    {
      kind: 'parable',
      tone: 'light',
      verse: 'Nehemiah 13:8',
      title: 'The key under the flowerpot',
      body: `ILLUSTRATIVE, NOT A REAL EVENT. A grandmother kept a spare key under the flowerpot by her back door. Over twenty years she had told the paperboy about it, a neighbor who watered her plants one summer, two nephews who stayed over at Christmas, and a man who once fixed her furnace.
One spring her granddaughter came to visit and asked a simple question at the kitchen table: who knows about the key? The grandmother started counting on her fingers and ran out of fingers. The paperboy was grown and gone. The neighbor had moved to another state. The furnace man she could not even name.
Nothing had ever gone wrong. That was the point her granddaughter made gently. Nothing had gone wrong yet, and nobody was watching the key. They went to the hardware store that afternoon, changed the lock, and made two new keys. One went to the granddaughter. One went to the neighbor across the street, who wrote her name and the date on a card. The grandmother laughed and said it was the first time in twenty years she knew exactly who could open her door.`,
    },
    {
      kind: 'parable',
      tone: 'solemn',
      verse: 'Ezekiel 33:4',
      title: 'The message he meant to read later',
      body: `ILLUSTRATIVE, NOT A REAL EVENT. A man who ran a small shop got a message one evening saying that a new device had signed in to his business email. He was tired. He told himself it was probably his own tablet, set the phone face down, and meant to look in the morning.
In the morning there were three more messages, and he did not read those either, because the first one had been nothing, he was sure. By the end of the week a supplier called to ask why he had changed his bank details for payment. He had not. Someone in his email had, writing as him, and the supplier had already paid.
When the bank asked him later when he first knew something was wrong, he scrolled back and found the first message, still unopened. It had told him the truth on the first night. He said afterward that the warning was never the problem. The warning had done its job. The part that failed was the man who heard it and did nothing.`,
    },
  ],
  quiz: {
    questions: [
      {
        q: 'In Ezekiel 33:3, what is the watchman’s duty when he sees the sword come?',
        options: ['To fight it alone', 'To blow the trumpet and warn the people', 'To keep quiet and wait'],
        answer: 1,
        explain: 'He blows the trumpet and warns the people. After that, Ezekiel 33:4-5 puts the next move on everyone who hears it.',
      },
      {
        q: 'According to Ezekiel 33:5, what happens to the one who takes warning?',
        options: ['Nothing changes', 'He shall deliver his soul', 'He must become a watchman'],
        answer: 1,
        explain: 'He that taketh warning shall deliver his soul. The one who hears and does nothing has his blood upon himself.',
      },
      {
        q: 'In Nehemiah 13:4-7, how did Tobiah get a chamber in the house?',
        options: ['He broke in at night', 'Eliashib, who had oversight of the chamber, prepared it for him while Nehemiah was away', 'Nehemiah gave it to him'],
        answer: 1,
        explain:
          'The grant came from the inside, by one with oversight of the room, while the one who watched over the whole was away. Many forgotten grants look exactly like that.',
      },
      {
        q: 'What did Nehemiah do when he understood what had been done (Nehemiah 13:8-9)?',
        options: [
          'He tore down the house',
          'He cast out Tobiah’s household stuff, had the chambers cleansed, and brought the right vessels back',
          'He left it alone because it was already done',
        ],
        answer: 1,
        explain: 'Remove what does not belong, clean the room, put the right things back. That is revoking access in one sentence.',
      },
      {
        q: 'What does tapping allow on an app’s request for your drive actually do?',
        options: ['It gives one look and then closes', 'It opens a gate that stays open until the grant ends or someone takes it back', 'Nothing at all'],
        answer: 1,
        explain: 'A grant is standing permission. Most are opened for good reasons, and the danger is the ones that stay open after the reason is gone.',
      },
      {
        q: 'Why should you not tap the link inside a security alert?',
        options: [
          'Because links are always broken',
          'Because a forged alert can lead to a copy of your account page; the prudent man looketh well to his going (Proverbs 14:15)',
          'Because alerts are always fake',
        ],
        answer: 1,
        explain: 'Open the account yourself, the way you always do, and look there. A real alert will be confirmed there; a forged one will not.',
      },
      {
        q: 'What does Psalms 112:7 teach about answering an alert?',
        options: [
          'Ignore bad news',
          'He shall not be afraid of evil tidings: his heart is fixed, so he can look calmly before he acts',
          'Change every password at once',
        ],
        answer: 1,
        explain: 'Panic is one of the three wrong answers. A fixed heart checks first, then acts in order.',
      },
      {
        q: 'Why is the recovery address called a second watchman?',
        options: [
          'Because it sends advertisements',
          'Because the alert goes to it too, and whoever controls it can take over the whole account',
          'Because it does not matter',
        ],
        answer: 1,
        explain: 'Keep the recovery address in your own hands, and check it whenever an alert comes that you did not expect.',
      },
      {
        q: 'What does our own app’s support door grant look like, according to its code?',
        options: [
          'Standing access to every record',
          'One record, a written reason, an hour by default and a day at most, every read logged, revocable',
          'Access to health records on request',
        ],
        answer: 1,
        explain: 'Clinical and private health records are never offered. Every gate has a name, a reason, a room, an end and a record.',
      },
      {
        q: 'In John 17:12, what did Jesus say of those the Father gave Him?',
        options: ['That He would keep them later', 'Those that thou gavest me I have kept', 'That they must keep themselves'],
        answer: 1,
        explain:
          'Every watchman sleeps sometime; He that keepeth Israel shall neither slumber nor sleep (Psalms 121:4). We check our gates calmly because He keeps us.',
      },
    ],
  },
  facilitator: {
    howToRun: `SIXTY MINUTES, AND THE WORD OPENS IT. Read Ezekiel 33:4-5 aloud before you say one word about any app. Then read Nehemiah 13:7-9 aloud and write two words on the board: take warning, and take back. Then ask the room: when did a warning come to you, and what did you do with it?
MINUTES 0 TO 12 - THE TRUMPET. Ezekiel 33:1-9. Have someone list what the watchman owes and what the hearer owes.
MINUTES 12 TO 24 - THE CHAMBER. Nehemiah 13:4-9. Ask: who opened the room, when, and why did it stay open? What three things did Nehemiah do?
MINUTES 24 TO 36 - THE ALERT. Tell the forwarded alert generically: an A.I. assistant app granted access to a linked drive. Teach the three wrong answers and the right one, with Psalms 112:7 and Proverbs 14:15. Never open an alert's link; open the account yourself.
MINUTES 36 TO 48 - THE CHECK AND THE SWEEP. Did we grant it, what does it reach, do we still use it, what to lock first. The recovery address as a second watchman. The seasonal walk through the chambers.
MINUTES 48 TO 60 - OUR HOUSE AND IT IS KEPT. The support door from our own code. Psalms 121:4, John 17:12, John 1:29, John 3:16, Hebrews 1:8 and Colossians 1:17. Give the four household habits and the week's assignment.
WHAT NOT TO DO. Do not name the household, the account, the app or any address; the lesson is taught generically on purpose. Do not teach that every alert means an attack, and do not teach that every alert can be ignored. Do not read the alert in a voice of authority over the Word; the Word frames the hour.`,
    talkingPoints: [
      `The watchman blows; the hearer takes warning (Ezekiel 33:3-5).`,
      `He that taketh warning shall deliver his soul (Ezekiel 33:5).`,
      `A chamber opened from the inside while the watcher was away (Nehemiah 13:4-7).`,
      `Cast forth, cleansed, restored (Nehemiah 13:8-9).`,
      `Every grant is a gate you opened, and it stays open until it ends or is taken back.`,
      `The alert is the watchman telling you who walked through.`,
      `Not afraid of evil tidings (Psalms 112:7).`,
      `The prudent man looketh well to his going (Proverbs 14:15): never the link.`,
      `Did we grant it, what does it reach, do we still use it.`,
      `The recovery address is a second watchman.`,
      `Walk the chambers once a season.`,
      `Our support door: one record, a reason, an end, a record of every read.`,
      `He that keepeth Israel shall neither slumber nor sleep (Psalms 121:4).`,
    ],
    discussionPrompts: [
      `What warning did you once set aside to read later?`,
      `Which app holds a key to your things that you no longer use?`,
      `Who in your house checks an alert, and how?`,
      `What would you lock down first if a grant was not yours?`,
      `Who controls the recovery address on your main account?`,
      `What chamber in your accounts holds something that does not belong?`,
    ],
  },
  lesson: [...LESSON, FACTS.lesson, TALK.lesson].join('\n\n'),
  levels: { child: CHILD, youth: YOUTH, teen: TEEN, senior: SENIOR },
};
const filled = fillDeep({ ...MODULE, anchor: { ...MODULE.anchor, ref: '' } });
readerRefs.length = 0;
seenReader.clear();
filled.bigIdea = fill(MODULE.bigIdea, true);
filled.inApp = fill(MODULE.inApp, true);
filled.lesson = fill(MODULE.lesson, true);
filled.levels = {
  child: fill(CHILD, true),
  youth: fill(YOUTH, true),
  teen: fill(TEEN, true),
  senior: fill(SENIOR, true),
};
filled.anchor.theme = fill(MODULE.anchor.theme);
filled.anchor.ref = readerRefs.join('; ');
// -----------------------------------------------------------------------------
// Refuse to splice a lesson that fails its own measures
// -----------------------------------------------------------------------------
const { fourBandFaults, fk, words, overlapOf, FOUR_BANDS } = await import('../app/src/__tests__/fixtures/four-band-ladder.js');
const adultWords = words(filled.lesson);
console.log(`sov95: adult prose words ${adultWords} fk ${fk(filled.lesson).toFixed(2)}`);
for (const b of FOUR_BANDS) {
  console.log(
    `sov95: ${b} words ${words(filled.levels[b])} share ${(words(filled.levels[b]) / adultWords).toFixed(3)} fk ${fk(filled.levels[b]).toFixed(2)} overlap-adult ${overlapOf(filled.levels[b], filled.lesson).toFixed(3)}`
  );
}
for (let i = 0; i < FOUR_BANDS.length; i += 1) {
  for (let j = i + 1; j < FOUR_BANDS.length; j += 1) {
    console.log(`sov95: overlap ${FOUR_BANDS[i]}~${FOUR_BANDS[j]} ${overlapOf(filled.levels[FOUR_BANDS[i]], filled.levels[FOUR_BANDS[j]]).toFixed(3)}`);
  }
}
const faults = fourBandFaults(filled);
// --dry measures and reports, and writes nothing.
if (process.argv.includes('--dry')) {
  console.log(faults.length ? faults.join('\n') : 'sov95: no four-band faults');
  process.exit(0);
}
if (faults.length) {
  console.error(faults.join('\n'));
  throw new Error('sov95: refusing to splice a lesson that fails the four-band ladder');
}

// -----------------------------------------------------------------------------
// Splice
// -----------------------------------------------------------------------------
const OPEN = 'export const SOVEREIGN_AI_MODULES = [';
let src2 = readFileSync(CATALOG, 'utf8');
let end2 = src2.indexOf('\n];', src2.indexOf(OPEN));
if (end2 < 0) throw new Error('sov95: could not find the end of SOVEREIGN_AI_MODULES');

if (src2.includes(ID)) {
  if (!process.argv.includes('--rebuild')) throw new Error(`sov95: ${ID} is already in the catalog; pass --rebuild to replace it`);
  const from = src2.indexOf(`  {\n    "id": "${ID}"`);
  if (from < 0) throw new Error('sov95: the id is in the file but not as a module literal; refusing to rebuild');
  const withComma = src2.indexOf('\n  },', from);
  const atArrayEnd = src2.indexOf('\n  }\n];', from);
  const ends = [
    withComma >= 0 && withComma < end2 ? { at: withComma, len: '\n  },'.length, back: 0 } : null,
    atArrayEnd >= 0 && atArrayEnd < end2 ? { at: atArrayEnd, len: '\n  }'.length, back: ','.length } : null,
  ]
    .filter(Boolean)
    .sort((a, b) => a.at - b.at);
  if (!ends.length) throw new Error('sov95: could not find the end of the existing block; refusing to rebuild');
  const { at: closeAt, len, back } = ends[0];
  const excised = src2.slice(from, closeAt + len);
  if (excised.split('"id":').length - 1 !== 1) {
    throw new Error(`sov95: the block to excise holds ${excised.split('"id":').length - 1} ids, expected 1; refusing to rebuild`);
  }
  src2 = src2.slice(0, from - back) + src2.slice(closeAt + len);
  end2 = src2.indexOf('\n];', src2.indexOf(OPEN));
  if (end2 < 0) throw new Error('sov95: the array is not closed after excising; refusing to rebuild');
  if (src2.includes(ID)) throw new Error('sov95: the id survived the excision; refusing to rebuild');
}

const block = JSON.stringify(filled, null, 2)
  .split('\n')
  .map((l) => `  ${l}`)
  .join('\n');
const tailHasComma = /\}\s*,\s*$/.test(src2.slice(0, end2));
const next = tailHasComma ? `${src2.slice(0, end2)}\n${block},${src2.slice(end2)}` : `${src2.slice(0, end2)},\n${block}${src2.slice(end2)}`;

const weeks = (text) => [...new Set([...text.matchAll(/sov(\d+)-/g)].map((m) => Number(m[1])))].sort((a, b) => a - b);
const before = weeks(src2);
const after = weeks(next);
if (after.length !== before.length + 1) throw new Error(`sov95: week count went ${before.length} -> ${after.length}, expected exactly one more`);
if (before.includes(WEEK)) throw new Error(`sov95: week ${WEEK} is already taken`);
if (after[after.length - 1] !== WEEK) throw new Error(`sov95: week ${WEEK} is not the top of the course after splicing`);
const occurrences = next.split(`"${ID}"`).length - 1;
if (occurrences !== 1) throw new Error(`sov95: the new id appears ${occurrences} times, expected exactly once`);

writeFileSync(CATALOG, next);

const refs = filled.anchor.ref
  .split(';')
  .map((s) => s.trim())
  .filter(Boolean);
for (const r of refs) verseText(r);
console.log(`sov95: spliced ${ID}`);
console.log(`sov95: modules ${before.length} -> ${after.length}; top week ${after[after.length - 1]}`);
console.log(`sov95: ${refs.length} references on the anchor, every one quoted in a reader place and resolving in the corpus`);
