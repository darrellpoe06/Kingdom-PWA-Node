// =============================================================================
// sov99-fill - build Sovereign A.I. week 99 and splice it into the catalog
// =============================================================================
// WHY A GENERATOR AND NOT TYPING (binding, DR-0076 / DR-0456 / DR-1468). Every
// quoted verse on this page is FILLED FROM app/public/bible/kjv at build time,
// through scripts/lib/kjv.mjs (the same reader fill-verses.mjs uses). The prose
// holds only a token, {{kjv:Proverbs 6:22}}, and this script replaces it with
// the corpus text followed by the reference. No verse on the page was typed
// from memory, and none was copied from the earlier draft. anchor.ref is
// DERIVED from the tokens that occur in the reader places (DR-0734).
//
// WHERE THE WORD CAME FROM. Darrell SPOKE this teaching on 2026-09-24 at
// 4:57pm and marked it "Lesson." It was first built as sov29 under its own decision record on
// PR #1814 (branch claude/lesson-the-song-that-goes-with-you). It never
// landed: the sov29 slot and that record number went to other work, and the
// branch has no merge base with today's main. CLAUDE.md, Spoken Teachings Are
// Build Input: his spoken word is not dropped. This is the rebuild on fresh
// main, on a new week number and a new record (DR-1578). His framing leads,
// rendered for meaning (DR-0331), and is never put inside quotation marks.
//
// ONE TEACHING, ONE LESSON (DR-0610). A grep of app/src/lib and
// docs/decisions for "song that goes with you" found only DR-0662's note about
// the #1814 collision; no lesson on main teaches it. DR-0633 (the reader plays
// like a radio) is the CODE answer to the same spoken word, not a lesson.
// The lamp that burns always (Exodus 27:20; Leviticus 6:13) was a movement of
// the #1814 draft and is left out here: a week in flight teaches the ordered
// lamps, and one teaching stays one lesson.
//
// TRUST BUT VERIFY (DR-0100 / DR-0076 section 8). MEASURED, from this house's
// own code: app/src/lib/tts.js stop() cancels the shared voice only when that
// engine is speaking; app/src/components/TTSControl.jsx carries the small
// player on every tab and its Back to the voice chip. RECORDED by this house,
// not re-run for this lesson: the browser measurement that the same audio kept
// advancing about five seconds after the lesson tab was left, at three screen
// sizes. NOT VERIFIED: Darrell's own phone test of leaving a tab and of
// switching apps, other phones, and whether the home server's audio voice is
// reachable today. re-review: 2026-12-03.
//
// THE BANDS WERE WRITTEN BY HAND, NEVER BY A SCRIPT ON PROSE (DR-1306).
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { kjvText } from './lib/kjv.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, '..');
const KJV = join(ROOT, 'app', 'public', 'bible', 'kjv');
const CATALOG = join(ROOT, 'app', 'src', 'lib', 'sovereign-ai-class.js');

const WEEK = 99;
const ID = 'sov99-the-song-that-goes-with-you';
const TITLE = 'The song that goes with you - a tool built to serve keeps serving wherever the person goes';

// -----------------------------------------------------------------------------
// The corpus: one verse per token, read from the KJV files on disk
// -----------------------------------------------------------------------------
function verseText(ref) {
  const r = String(ref).trim();
  if (!/^(.+?)\s+(\d+):(\d+)$/.test(r)) throw new Error(`sov99: reference is not Book C:V -> "${r}"`);
  const t = kjvText(r, KJV);
  if (!t) throw new Error(`sov99: reference does not resolve in the corpus -> "${r}"`);
  return t;
}

const TOKEN = /\{\{kjv:([^}|]+?)\}\}/g;
const readerRefs = [];
const seenReader = new Set();

function fill(text, isReaderPlace = false) {
  return String(text).replace(TOKEN, (_, ref) => {
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
const REVIEW = 're-review: 2026-12-03';

const FACTS = {
  lesson: `WHERE WE STAND ON THE FACTS. HIS WORDS, as he spoke them on the day: the player should keep playing when he leaves a tab, moves, or does anything else, like a radio in the background. MEASURED in our own house, from our own code: the reader lives once in the frame of the app, not inside any one tab; a part of the app that is not speaking is no longer allowed to silence the voice; and a small player rides along on every tab while the Word plays, with a way back to the words. RECORDED by this house the same evening, and not run again for this lesson: in a desktop browser, the same audio kept advancing about five seconds after the lesson tab was left, at three screen sizes. NOT VERIFIED: his own test on his own phone, of leaving a tab and of switching apps; other phones; and whether the audio voice from our own server is reachable today. ${REVIEW}.`,
  child: `WHAT IS SURE AND WHAT IS NOT. Darrell said the player should keep playing when you leave a tab. We read our own app's code. The part that is quiet can not stop the voice now. A small player goes with you to every tab. Our notes say a computer test kept the sound going. We did not test it again today. We have not seen it work on his own phone. That is not verified yet. We will look again. ${REVIEW}.`,
  youth: `WHAT IS SURE AND WHAT IS NOT. Darrell's words are the start. Our own code was read for this lesson: a quiet part of the app can no longer cut off the voice, and a small player follows you to every tab. Our records say a browser test kept the audio going after the tab was left; that test was not run again for this lesson. Whether it works on his phone, and when you switch apps, is not verified yet. ${REVIEW}.`,
  teen: `WHAT IS SURE AND WHAT IS NOT. Sort every claim. His words: what he asked for, as he said it. Measured: our own code, read for this lesson - an idle part of the app can no longer cancel the shared voice, and a small player rides along on every tab. Recorded but not re-run: the browser test, where the audio kept advancing after the tab was left. Not verified: his own phone, switching apps, other devices, and whether our own audio server answers today. ${REVIEW}.`,
  senior: `WHERE WE STAND ON THE FACTS. His request is recorded as he spoke it. What this lesson says of the house is traced to its own code: the reader is mounted once in the frame of the application, an engine that is not speaking may no longer silence the voice, and a small player accompanies the listener to every tab. A browser measurement made by the house that evening, in which the same audio continued for some five seconds after the lesson tab was left, is recorded but was not repeated for this lesson. His own test on his own telephone, the behavior when switching applications, other devices, and the present reach of the house's own audio server are not verified, and no conclusion is drawn about them. ${REVIEW}.`,
};

const RHYTHM =
  'Do it once today, in one of the four places of Deuteronomy 6:7 - at the table, on the way, at lying down, or at rising up - and with one friend this week.';

const GROWTH =
  'And measure the growth the Word’s way, by the fruit, {{kjv:Galatians 5:22}} by the occasions, {{kjv:Deuteronomy 6:7}} and by the days. {{kjv:Hebrews 3:13}}';

const TALK = {
  lesson: `TALK ABOUT IT TOGETHER. Parents, sit with one of your children today and ask them one open question - what is something that keeps helping you even when you are not looking at it - and listen all the way to the end before you add a single word; have them retell their own answer in their own words, then teach them one verse back, Proverbs 6:22. Children, ask your mother, your father or a grandparent about a song they carried with them through a hard season, and where they first learned it; hear the whole of it before you reply, then retell their story back to them in your own words. Then ask a friend this: what do we build or do for people that quietly stops the moment they look away. Teach each other one verse. ${RHYTHM} ${GROWTH}`,
  child: `TALK ABOUT IT TOGETHER. Parents, ask your child one thing today - what song do you sing when you are scared - and listen all the way to the end before you talk; have them say it back to you in their own words, then teach them one verse, Exodus 33:14. Children, ask your mom or your dad or your grandma or your grandpa what song they sang when they were little. Let them tell the whole story. Then tell it back to them in your own words. Then ask a friend this: who keeps helping us even when we sleep. Teach each other one verse. ${RHYTHM}`,
  youth: `TALK ABOUT IT TOGETHER. Parents, ask your child one open question today - which app on your phone gives up on you the moment you switch away - and listen all the way to the end before you fix anything; have them retell the answer in their own words, then teach them one verse, Psalms 121:4. Children, ask your mom, your dad or a grandparent about a radio, a record or a hymn that played in their house while they worked; hear the whole of it before you answer, then retell their answer in your own words. Then ask a friend this: what could we do for someone that keeps going after we leave the room. Teach each other one verse. ${RHYTHM} ${GROWTH}`,
  teen: `TALK ABOUT IT TOGETHER. Parents, ask your child one open question today - when something you made stops working the second nobody watches it, is it serving or performing - and listen all the way to the end instead of answering it for them; have them retell their own answer back to you in their own words, then teach them one verse, Mark 10:45. Children, ask your mom, your dad or a grandparent about someone who kept serving them when no one was watching, and what it meant; hear the whole of it before you reply, then retell their answer in your own words. Then ask a friend this: what do we hold back that is in the power of our hand to give. Teach each other one verse. ${RHYTHM} ${GROWTH}`,
  senior: `TALK ABOUT IT TOGETHER. Grandparents, ask the young people in your house one open question today - what do you listen to while you work, and why that - and listen all the way to the end, without finishing a sentence for them; have them retell their own answer in their own words, then teach them one verse back, Psalms 42:8. Children, ask your parents or your grandparents about the hymns that went with them through the night seasons of their lives; hear the whole of it before you reply, then retell it back to them in your own words. Then ask a friend this: where has our service quietly stopped when the person looked away. Teach each other one verse. ${RHYTHM}`,
};

// -----------------------------------------------------------------------------
// The adult lesson. The Word opens it, and no word about an app stands above
// that frame.
// -----------------------------------------------------------------------------
const LESSON = [
  `${TITLE.toUpperCase()}.
WHO SPOKE THIS. On the twenty-fourth of September, a little before five in the evening, Darrell spoke into this lane and marked it as a lesson. He had just watched the reader in this app stop talking when he moved from one tab to another. He said that leaving a tab should not make the player stop playing. He said the player should be able to play no matter what is going on, whether he moves, leaves the tab, or does whatever else he needs to do. He said it is like a radio in the background, there for him to use any time he wants. And he said, plainly: stop trying to constrain it; give it the ability to support and do what I am asking. Then he praised the Lord and closed in the name of Jesus.
That is the whole occasion. A tool that was built to serve a person stopped serving the moment the person turned around. He did not ask for a cleverer tool. He asked for a faithful one.`,
  `THE WORD FIRST, BEFORE ANY APP. Long before any of us carried a voice in our pocket, Yahweh told His people that His words were meant to travel with them. Solomon wrote it as a father to a son, about the commandment and the law: {{kjv:Proverbs 6:21}} And then the line this lesson is named for: {{kjv:Proverbs 6:22}}
Read the three clauses slowly. When thou goest, it shall lead thee. When thou sleepest, it shall keep thee. When thou awakest, it shall talk with thee. The Word does not wait at home for you to come back and sit down in front of it. It goes. It keeps watch while you are not looking. And it is still speaking when you open your eyes.
Moses gave the same pattern to every household. The words were to be taught at every point of an ordinary day: {{kjv:Deuteronomy 6:7}} Sitting, walking, lying down, rising up. There is no hour of the day the Word is told to step aside for.`,
  `HIS PRESENCE WENT WITH THEM. When Israel left Egypt, Yahweh did not give them a map and wish them well. He went with them, and He did not take the sign of His going away when they were tired or slow: {{kjv:Exodus 13:22}} Later, after the people had sinned and Moses was afraid to go on, Yahweh gave him the promise this lesson stands on: {{kjv:Exodus 33:14}}
My presence shall go with thee. Not: my presence will wait for you at the tabernacle. Not: my presence will be available during business hours. It goes with thee. David learned that there is no place to leave it behind: {{kjv:Psalms 139:7}} {{kjv:Psalms 139:10}}
And the Keeper who goes with you does not doze off when the road is long: {{kjv:Psalms 121:4}} {{kjv:Psalms 121:8}}
Jesus made the same promise to His own, at the end of Matthew's Gospel: {{kjv:Matthew 28:20}} And the letter to the Hebrews carries it to every believer who would ever read it: {{kjv:Hebrews 13:5}} He also promised the Holy Spirit, the Comforter who abides: {{kjv:John 14:16}}`,
  `THE BRIGHT LINE. Before we say one more word about software, we draw the line that keeps this lesson honest. No tool is the presence of Yahweh. No player is a Keeper. A reader that keeps reading when you leave a tab is a small, good piece of craftsmanship; it is not the pillar of cloud, and it is not the Comforter. The Holy Spirit abides with His people for ever, and nothing we build shares that. What a tool can do is point. A faithful tool can carry the Word into the kitchen, the car and the night shift, the way a radio carried a hymn through a farmhouse. Its whole job is to serve the person and get out of the way of the Word.`,
  `THE SONG IN THE NIGHT. Scripture is full of songs that went with people into places no one would choose. The psalmist, in a season of deep trouble, still had a song that stayed: {{kjv:Psalms 42:8}} David made it his habit at every hour: {{kjv:Psalms 34:1}} And in a prison in Philippi, with their feet in the stocks, two men sang where they were: {{kjv:Acts 16:25}}
Notice the last clause. The prisoners heard them. The song did not stop because the setting changed, and people who never asked for it were served by it. Paul later told the church to let that same Word live in them so richly that it overflowed into song: {{kjv:Colossians 3:16}}
That is what Darrell was reaching for when he said a radio in the background. A song that goes with you is not a performance you stop to watch. It is company on the road.`,
  `THE SERVANT WHO KEEPS SERVING. Every tool in this house exists to serve the person using it, and the Son of man is the pattern for what serving means: {{kjv:Mark 10:45}} He did not serve only while people were watching, and He did not serve only when it was convenient for Him. Paul turns that into a rule for all of us: {{kjv:Galatians 5:13}} And he names the one measure that matters for anyone given charge of something: {{kjv:1 Corinthians 4:2}}
Faithful is the word. A faithful servant does not stop working the moment the master leaves the room. A faithful tool does not stop serving the moment the person switches tabs. When the reader in this app went quiet because some other, idle part of the app was shutting itself down, it was not being careful. It was being unfaithful in a small thing, and small things are where faithfulness is learned.`,
  `STOP CONSTRAINING IT. His sharpest words were these: stop trying to constrain it. Paul wrote from chains, and he still knew this: {{kjv:2 Timothy 2:9}} The messenger may be bound; the Word is not. The prophet said the same of Yahweh Himself: {{kjv:Isaiah 59:1}}
So when we build something that carries the Word, we owe it two kinds of honesty. The first is to remove every constraint we put there ourselves. If our own code cuts the voice off, that is our fault and our job. The second is to name the limits we did not make. A phone's operating system can still put an app to sleep, and a page's built-in voice can still fall silent when the app is put away. Those are real limits of the device, and the house built a real audio voice on its own machines so the reading has a road that does not depend on the phone's built-in voice. Naming a limit is not an excuse; it is a map of the remaining work. And the Word gives the rule that turns all of this into action: {{kjv:Proverbs 3:27}}`,
  `OUR OWN HOUSE, MEASURED, NOT PAINTED. Here is what happened in this house the same day, told by what can be shown. The reader lives once, in the frame of the app, not inside any single tab, so moving between tabs does not take it down. But several other parts of the app each held their own small speaking engine - a lesson's quiz, a study, the Bible reader - and the phone's voice is one shared thing for the whole page. When one of those parts closed, it told the shared voice to stop, even though it was not the one speaking. That was the line that silenced the reader. It was changed so that a part of the app that is not speaking may not stop the voice; only the reader's own Stop stops the reader. A small player now goes with you to every tab while the Word plays, with buttons to pause, to step back or forward a paragraph, and a way back to the words. If you scroll away from where the voice is, it offers a way back to the voice instead of yanking you there.
Our records from that evening say that, in a desktop browser, the same audio kept advancing about five seconds after the lesson tab was left, at three screen sizes. That measurement was not run again for this lesson. And the test that matters most - his own phone, leaving a tab and switching apps - is not verified here. We name it so it stays work, not an assumption.`,
  `IT IS KEPT. Every tool we build will fail somebody somewhere. Batteries die, servers go quiet, a phone decides to save power. There is one Keeper who does not fail, and we build carefully because we are not Him. Jesus is the Lamb of Yahweh: {{kjv:John 1:29}} He is the Son the Father gave: {{kjv:John 3:16}} He is the Eternal Son whose throne stands for ever: {{kjv:Hebrews 1:8}} And He is the One by whom all things consist: {{kjv:Colossians 1:17}} The song that goes with you is His Word, and the presence that goes with you is His. Our part is small and real: build the tools that carry it so they keep serving, and tell the truth about what they still cannot do.`,
  `FOUR THINGS FOR THE HOUSE. One: let the Word go with you through the whole day - going, sleeping, waking - not only when you sit down in front of it. Two: hold the bright line; no tool is the presence of Yahweh, and no player is a Keeper. Three: when you build or do something for someone, make it faithful when they look away, and remove the constraints you put there yourself. Four: name the limits you did not make, plainly, and keep them on the list until they are measured.`,
];

// -----------------------------------------------------------------------------
// The four age bands. Each is an independent composition for its reader.
// -----------------------------------------------------------------------------
const CHILD = `${TITLE}.
WHO SAID THIS. Darrell was using our app. The app was reading the Bible out loud to him. He tapped to go to a new page in the app. The voice stopped! He was sad. He said the reading should keep going, like a radio that plays while you work. He said, let it help me. So we made a lesson.
THE WORD FIRST. Long ago, King Solomon wrote to his son about Yahweh's words. He said to tie them on your heart. {{kjv:Proverbs 6:21}} Then he said this. {{kjv:Proverbs 6:22}} So the Word goes with you when you walk. It keeps you when you sleep. It talks with you when you wake up. It does not stay home. It comes along.
YAHWEH WENT WITH THEM. When Yahweh led His people out of Egypt, He did not just point the way. He went with them. In the day there was a big cloud. At night there was fire. He did not take them away. {{kjv:Exodus 13:22}} Later, Moses was scared to go on. Yahweh told him this. {{kjv:Exodus 33:14}} Yahweh never takes a nap. {{kjv:Psalms 121:4}} Jesus said He is with us every day. {{kjv:Matthew 28:20}}
ALL DAY LONG. Moses told moms and dads to talk about Yahweh's words all day. At home. On a walk. At bed time. When you get up. That is a lot of times! It means the Word is for every part of the day. It is not just for church. It is not just for when you sit down to read.
WHAT IS A RADIO. Long ago, many homes had a radio in the kitchen. Mom would cook. Dad would fix things. The radio played songs the whole time. Nobody sat and stared at it. It just kept them company. That is what Darrell meant. He wants the app to read the Bible while he does other things. He does not want it to stop when he looks at a new page.
A BIG RULE. Our app is not Yahweh. A phone is not Yahweh. A phone can help you hear the Bible. That is good. But only Yahweh goes with you everywhere. Only Yahweh keeps you while you sleep. The app just helps.
A SONG AT NIGHT. Two men named Paul and Silas were put in jail. Their feet were locked up. It was the middle of the night. What did they do? They sang! {{kjv:Acts 16:25}} The other people in the jail heard them. The song went with them, even into a jail. King David sang to Yahweh all day long too. {{kjv:Psalms 34:1}}
A HELPER WHO KEEPS HELPING. Jesus came to help people. {{kjv:Mark 10:45}} He did not stop helping when people looked away. A good helper keeps helping. A good tool keeps working. Our app's voice stopped when Darrell looked at a new page. That was not good helping.
WHAT WE FIXED. We looked inside our app. We found a quiet part of the app that told the voice to stop. It was not even the part that was talking! So we changed it. Now a quiet part can not stop the voice. Only the Stop button stops it. We also made a small player. It goes with you to every page. It has a pause button. It has a button to go back to the words.
WHAT WE DO NOT KNOW YET. A phone can still make an app go to sleep. That is the phone's rule, not ours. We built a second voice on our own computer at home, so the reading has another way to keep going. We have not checked it on Darrell's phone yet. We will.
DO GOOD WHEN YOU CAN. The Bible says this. {{kjv:Proverbs 3:27}} If you can help, help. If you can fix it, fix it.
A STORY ABOUT A HELPER. Think about a dog that guards a farm. The dog does not only bark when the farmer is home. At night, when the farmer sleeps, the dog still watches. That is a faithful dog. Yahweh is even better than that. He never sleeps at all. And He wants us to be faithful helpers too.
YOUR TURN. Is there a way you help at home? Maybe you feed the dog. Maybe you set the table. Do you keep helping when no one is looking? That is what a good helper does.
YAHWEH KEEPS US. Every tool breaks some day. Yahweh never does. Jesus is the Lamb of Yahweh. {{kjv:John 1:29}} Yahweh sent Him because He loves us. {{kjv:John 3:16}} Jesus holds everything together. {{kjv:Colossians 1:17}} So the best song to take with you is His Word.
FOUR THINGS TO DO. Take the Word with you all day. Remember the app is not Yahweh. Keep helping when no one is looking. Fix what you can fix.
${FACTS.child}
${TALK.child}`;

const YOUTH = `${TITLE}.
WHO SAID THIS. Darrell was listening to our app read a lesson out loud. When he tapped over to another tab, the voice stopped. He spoke right into the lesson lane about it. He said the player should keep playing no matter what he does - move, leave the tab, anything - like a radio in the background that is there whenever he wants it. And he said: stop trying to hold it back, let it help me. This week is about that, and about the Word that goes with you first.
THE WORD FIRST. Solomon told his son to keep Yahweh's words close: {{kjv:Proverbs 6:21}} Then he said what those words would do: {{kjv:Proverbs 6:22}} Going, sleeping, waking. The Word leads, keeps and talks. It is not something you only visit; it travels with you.
HE WENT WITH THEM. When Israel left Egypt, Yahweh went with them in a cloud by day and fire by night, and He never pulled it back: {{kjv:Exodus 13:22}} When Moses was afraid to keep going, Yahweh promised him this: {{kjv:Exodus 33:14}} The psalm says the One who keeps you never even gets sleepy: {{kjv:Psalms 121:4}} And Jesus told His followers: {{kjv:Matthew 28:20}}
ALL DAY, NOT JUST SUNDAY. Moses told every family to talk about Yahweh's words at home, on the road, at bedtime and first thing in the morning: {{kjv:Deuteronomy 6:7}} That covers almost every minute of an ordinary day. The Word is not meant for one slot on your calendar. It is meant to ride along with everything else you do. That is why a reader that stops whenever you switch tabs is working against the very thing it was built for.
WHAT A RADIO IN THE BACKGROUND MEANS. Think about how people used to listen to the radio. It sat on a shelf in the kitchen or the garage. People cooked, fixed cars, folded laundry and did homework while it played. Nobody had to stare at it for it to keep going. It was company. Darrell was describing exactly that: a voice reading the Word while he moves around the app or his day, not a screen he has to babysit.
THE LINE WE DO NOT CROSS. Our app is not the presence of Yahweh. A player is not a Keeper. It can carry the Bible into your room or your car, and that is a good thing. But only Yahweh goes everywhere with you, and only the Holy Spirit stays with you for ever. A tool's job is to point to Him and get out of the way.
SONGS THAT WENT WITH THEM. Paul and Silas were beaten and locked in a prison with their feet in stocks. At midnight they did this: {{kjv:Acts 16:25}} The song did not wait for a better room. The other prisoners heard it. David made praise a habit at all hours: {{kjv:Psalms 34:1}} That is what Darrell meant by a radio in the background - something that keeps you company on the road.
SERVING WHEN NO ONE IS WATCHING. Jesus is the pattern for every helper: {{kjv:Mark 10:45}} He did not serve only when people were looking. Paul said what Yahweh wants from anyone put in charge of something: {{kjv:1 Corinthians 4:2}} Faithful. A faithful tool keeps working when you switch away from it.
WHAT WENT WRONG IN OUR APP. Several parts of our app each had their own little talking engine - the quiz, a study, the Bible reader. But the phone's voice is one shared thing. When you left a lesson, its quiet quiz engine shut down and told the shared voice to stop, even though the quiz was not the one talking. That is what cut off the reading. We changed it so a part that is not talking cannot stop the voice. Only the reader's own Stop button stops it now. We also added a small player that follows you to every tab, with pause, back a paragraph, forward a paragraph, and a way back to the words.
LIMITS WE DID NOT MAKE. Some limits belong to the phone, not to us. A phone can still pause a page's built-in voice when you switch apps. So the house built its own audio voice on its own server, which gives the reading another road. Darrell said stop constraining it; the Bible says the Word itself is never chained: {{kjv:2 Timothy 2:9}} Our job is to remove our own limits and name the rest.
DO THE GOOD YOU CAN. {{kjv:Proverbs 3:27}} If it is in your hand to fix it, fix it. Think about something you do for your family or friends. Does it keep working when they are not watching? Or does it only work while you are being seen?
A QUESTION FOR YOU. Here is a way to test yourself. Picture a chore you do every week. Now picture doing it when your parents are out of town. Would it look the same? A tool is faithful when it keeps working after you look away, and so is a person. Jesus never needed an audience to serve. That is the kind of helper we want to be, and the kind of tools we want to build.
IT IS KEPT. Every tool fails sometime. Jesus does not. He is the Lamb of Yahweh: {{kjv:John 1:29}} He is the Son the Father gave because He loved the world: {{kjv:John 3:16}} He is the Eternal Son whose throne lasts for ever: {{kjv:Hebrews 1:8}} And He holds all things together: {{kjv:Colossians 1:17}}
FOUR THINGS. Let the Word go with you all day. Remember no app is Yahweh. Keep serving when no one is watching. Fix what is yours to fix, and be honest about the rest.
${FACTS.youth}
${TALK.youth}`;

const TEEN = `${TITLE}.
WHO SAID THIS. In September, Darrell was listening to this app read a lesson aloud and watched it go silent the moment he tapped to another tab. He spoke straight into the lesson lane: leaving a tab should not stop the player; it should keep playing whatever he does, like a radio in the background; stop trying to constrain it and let it support what he is asking. Then he prayed. That spoken word is the occasion. The question it raises is bigger than one bug: is a tool serving you if it quits the second you look away?
THE WORD FIRST. Solomon's instruction to his son was to bind Yahweh's words on the heart: {{kjv:Proverbs 6:21}} Then three clauses that describe a Word that travels: {{kjv:Proverbs 6:22}} It leads while you move, keeps while you are unconscious, and speaks when you come back. The Word is designed to go with you, not to wait for your attention.
PRESENCE THAT MOVES. Israel did not get directions and a farewell. Yahweh went with them, visibly, day and night: {{kjv:Exodus 13:22}} When Moses hesitated after the people's rebellion, the answer was not a plan but a promise: {{kjv:Exodus 33:14}} The psalmist says the Keeper has no off-hours: {{kjv:Psalms 121:4}} Jesus ends Matthew with the same commitment: {{kjv:Matthew 28:20}} And Hebrews hands it to every reader: {{kjv:Hebrews 13:5}}
ALL DAY, BY DESIGN. Moses gave the same pattern to every family. Talk about it at home. Talk on the road. Talk at bedtime. Talk at sunrise. {{kjv:Deuteronomy 6:7}} That is not a weekly slot. It is the whole day. So a reader that quits when you switch tabs works against the very design of the Word it carries.
THE BRIGHT LINE. Here is where we refuse to blur things. No tool is the presence of Yahweh. A player is not a Keeper. It can carry Scripture into a commute or a night shift, and that is worth building well. But presence that never leaves belongs to Him alone, and the Holy Spirit abiding with believers is not a feature we can ship. A good tool points and steps aside.
THE SONG IN THE NIGHT. At midnight, in stocks, after a beating, Paul and Silas did this: {{kjv:Acts 16:25}} The detail at the end matters: the prisoners heard them. A song that goes with you serves people who never asked for it. The psalmist says the same of his own darkest season: {{kjv:Psalms 42:8}} That is what a radio in the background means in Darrell's words - company, not a show you have to stop and watch.
SERVING VERSUS PERFORMING. The Son of man is the definition of service: {{kjv:Mark 10:45}} Paul turns it into a standard for anyone with responsibility: {{kjv:1 Corinthians 4:2}} Faithful means you can count on it when no one is checking. Something that only works while it is being watched is performing, not serving.
WHAT BROKE, EXACTLY. Several parts of this app each had their own speech engine: the quiz, a study, the Bible reader. The browser's voice is one shared object for the whole page. When a lesson closed, its idle quiz engine ran its shutdown and told that shared voice to cancel, even though it was not the one speaking. That one line silenced the reader. The fix: an engine that is not speaking has nothing to cancel, so it cancels nothing. Only the reader's own Stop stops the reader. A small player now rides along on every tab, with pause, a paragraph back, a paragraph forward, and a way back to the text.
NAMING THE LIMITS WE DID NOT MAKE. His words were stop trying to constrain it. Paul wrote from chains: {{kjv:2 Timothy 2:9}} The Word is not bound, so we should not bind the tool that carries it. Some limits are ours, and we removed them. Some belong to the device: a phone can still pause a page's built-in voice when you switch apps. The house built its own audio voice on its own server to give the reading a second road. Saying that plainly is not making excuses; it is keeping a true list of the work left.
DO THE GOOD IN YOUR HAND. {{kjv:Proverbs 3:27}} Pick one thing you make or do for someone else - a group project, a ride, a playlist, code. Where does it quietly stop serving when they look away? Is it in your hand to fix?
A TEST YOU CAN RUN. Here is a simple way to check yourself. Think about the last thing you did for someone. Would it have looked the same if no one saw it? Would it still work tomorrow without you there? If the answer is no, that is not shame. It is a list. Fix one item on it this week. That is how faithful people are made. That is how faithful tools are made, too. And when you find a limit that is not yours to fix, write it down with a date. Then check it on that date. An honest list is part of faithful work.
IT IS KEPT. Every tool fails eventually. Jesus is the Lamb of Yahweh: {{kjv:John 1:29}} The Son the Father gave: {{kjv:John 3:16}} The Eternal Son, whose throne is for ever: {{kjv:Hebrews 1:8}} The One by whom all things consist: {{kjv:Colossians 1:17}} We build carefully because we are not Him.
FOUR TAKEAWAYS. Carry the Word through the whole day. Hold the line: no app is Yahweh. Serve faithfully when unwatched. Remove your own constraints and name the rest honestly.
${FACTS.teen}
${TALK.teen}`;

const SENIOR = `${TITLE}.
WHO SPOKE THIS. In late September, while this application was reading a lesson aloud to him, Darrell moved to another tab and the reading fell silent. He spoke his response directly into the lesson lane and marked it a lesson: that leaving a tab should not stop the player; that it ought to continue whatever else he was doing, as a radio continues in the background of a household; and that we should stop constraining it and allow it to serve what he was asking. He closed in prayer. The occasion is small. The principle beneath it is not: a tool made to serve a person is only faithful if it continues to serve when that person turns away.
THE WORD FIRST. Solomon, instructing his son concerning the commandment and the law, wrote: {{kjv:Proverbs 6:21}} And he described what those words would do through every part of a life: {{kjv:Proverbs 6:22}} The Word of Yahweh was never meant to remain on the shelf until we return to it. It leads on the road, keeps watch through the night, and speaks again in the morning. Moses had given the same instruction to every household: {{kjv:Deuteronomy 6:7}}
THE PRESENCE THAT ACCOMPANIED THEM. When Israel went out of Egypt, Yahweh did not withdraw the visible sign of His leading, whether by day or by night: {{kjv:Exodus 13:22}} And when Moses, after the people's grievous sin, was unwilling to go forward alone, Yahweh answered him: {{kjv:Exodus 33:14}} The psalmist found that there is no place beyond that presence: {{kjv:Psalms 139:7}} {{kjv:Psalms 139:10}} And he declared that the Keeper of Israel is never inattentive: {{kjv:Psalms 121:4}} {{kjv:Psalms 121:8}} Our Lord Jesus made the same promise as He sent His disciples out: {{kjv:Matthew 28:20}} And He promised the Comforter who would abide: {{kjv:John 14:16}}
THE BRIGHT LINE. It must be said without qualification: no instrument of ours is the presence of Yahweh, and no player is a Keeper. A reader that continues speaking is a modest piece of good workmanship. It is not the pillar of cloud, and it does not share in the abiding of the Holy Spirit. Its proper office is to carry the Word to the listener and then to stand aside.
THE SONG IN THE NIGHT. The psalmist, in a season of great heaviness, could still write: {{kjv:Psalms 42:8}} And at Philippi, with their feet fast in the stocks, two servants of the Lord did not wait for better circumstances: {{kjv:Acts 16:25}} The prisoners heard them. Paul afterward urged the church to let the Word dwell in them so richly that it would overflow in song: {{kjv:Colossians 3:16}} Many in this generation remember a radio or a hymnbook in the kitchen, sounding through the work of the day. That is the picture Darrell gave.
FAITHFUL SERVICE. The Son of man is our pattern: {{kjv:Mark 10:45}} And the apostle states the single requirement laid upon every steward: {{kjv:1 Corinthians 4:2}} Faithfulness is proved precisely when no one is observing. A servant who works only under the master's eye, or a tool that serves only while it is watched, is performing rather than serving.
WHAT THE HOUSE FOUND. The reader in this application is mounted once, in the frame of the application, and not inside any one tab. Yet several other parts of the application each kept a speaking engine of their own, and the browser's voice is a single shared instrument for the whole page. When a lesson closed, its idle quiz engine instructed that shared voice to cease, though it was not the one speaking. That instruction silenced the reader. It was corrected so that an engine which is not speaking can no longer silence anything; only the reader's own Stop stops the reader. A small player now accompanies the listener to every tab, with pause, a paragraph back, a paragraph forward, and a way back to the text.
THE LIMITS WE DID NOT MAKE. Paul, writing in chains, could say: {{kjv:2 Timothy 2:9}} If the Word is not bound, we have no business binding the instrument that carries it with constraints of our own making. Those were removed. Other limits belong to the device: a telephone may still pause a page's built-in voice when the listener turns to another application. The house therefore built an audio voice upon its own machines, so that the reading has a road not dependent on the telephone. To name such a limit is not to excuse it, but to keep an honest record of the work that remains. And the Word supplies the rule: {{kjv:Proverbs 3:27}}
A WORD TO THOSE WHO HAVE SERVED LONG. Many who read this band have spent decades serving where no one applauded: at bedsides, in kitchens, on night shifts, in the long work of raising children and tending aging parents. The Word honors that hidden faithfulness, and this small engineering lesson is only a reflection of it. A tool that keeps serving after the person turns away is learning, in its own humble way, what you have practiced for a lifetime.
IT IS KEPT. Every instrument we build will fail someone at some hour. Jesus is the Lamb of Yahweh: {{kjv:John 1:29}} He is the Son whom the Father gave in love: {{kjv:John 3:16}} He is the Eternal Son, whose throne is for ever and ever: {{kjv:Hebrews 1:8}} And by Him all things consist: {{kjv:Colossians 1:17}} We build with care because we are not He.
FOUR THINGS FOR THE HOUSE. Let the Word accompany you through the whole of the day. Keep the bright line between the instrument and the presence of Yahweh. Serve faithfully when no one is watching, removing every constraint of your own making. Name plainly the limits you did not make, and keep them before you until they are measured.
${FACTS.senior}
${TALK.senior}`;

const MODULE = {
  id: ID,
  title: TITLE,
  bigIdea: `${TITLE.toUpperCase()}.
WHO SPOKE THIS. Darrell, on 2026-09-24, marking it a lesson: leaving a tab should not make the player stop; it should keep playing whatever he does, like a radio in the background; stop constraining it and let it support what he asks.
THE WORD FIRST. Proverbs 6:22 opens the hour - the Word that leads, keeps and talks with you, going, sleeping and waking - with Exodus 33:14 beside it - the presence of Yahweh that goes with His people. {{kjv:Proverbs 6:22}} {{kjv:Exodus 33:14}}
THE TEACHING. A tool built to serve keeps serving when the person looks away; that is faithfulness in a small thing. The bright line: no tool is the presence of Yahweh, and no player is a Keeper. Remove the constraints you put there yourself, and name plainly the limits you did not make.
OUR OWN HOUSE. A part of the app that is not speaking may no longer silence the reader, and a small player now goes with you to every tab.
THE TIERS. HIS WORDS, as spoken. MEASURED: our own code. RECORDED, not re-run: the browser test. NOT VERIFIED: his own phone, and switching apps. ${REVIEW}.
PLACEMENT. Sovereign A.I., week 99, because what a technology is for, and whom it serves, is the spine of this course.
CLOSE. {{kjv:Psalms 121:4}} Jesus, the Lamb of Yahweh and the Eternal Son, is with His own alway.`,
  inApp: `One thing to try in this app, and one page in your Study.
In the app: open any lesson and press Play on the Read Aloud panel. Then tap to another tab. The small player should ride along with you, with pause, a paragraph back, a paragraph forward, and a way back to the words. Try his other paths honestly - lock the screen, switch to another app, walk into another room - and write down which kept playing and which did not, on which phone. That is real data this house still needs.
In your Study, write three lines. One thing you do for someone that keeps serving when they look away. One thing that quietly stops. What is in the power of your hand to change. {{kjv:Proverbs 3:27}}`,
  anchor: {
    ref: 'FILLED FROM THE TOKENS',
    theme: `{{kjv:Proverbs 6:22}} {{kjv:Exodus 33:14}} {{kjv:Psalms 121:4}} {{kjv:Acts 16:25}} {{kjv:Mark 10:45}} {{kjv:Proverbs 3:27}}`,
  },
  rpe: {
    research: `RESEARCH. Three readings, each landing on your own house.
First, read Proverbs 6:20-23 and Deuteronomy 6:4-9. Mark every place and hour the Word is told to go with you. Write one sentence on an hour of your day where the Word is never present.
Second, read Exodus 33:12-17. Mark what Moses asked for and what Yahweh promised. Write down one thing you have been treating as if it were a presence, when it is only a tool.
Third, read Acts 16:22-34. Mark what Paul and Silas did at midnight and who heard it. Write down one way your service could keep going after you leave the room.
And one verification reading, because this course works this way. His words are recorded as spoken. Our code was read for this lesson. The browser test is recorded but was not run again. His phone test is not verified.`,
    plan: `PLAN. Decide four steps before the week starts, and decide who hears them.
One: the Word on the road. Choose one hour - driving, cooking, walking - when the Word will go with you this week.
Two: the bright line. Say out loud to someone in your house that the tool is not the presence of Yahweh.
Three: the faithful thing. Choose one thing you do for someone and make it keep serving when they look away.
Four: the honest list. Write down one limit you did not make, and the date you will check it again.
Then name the person who will ask you about all four on the same day next week.`,
    execute: `EXECUTE. Keep it for one week, out loud, with one other person.
Play a reading in this app and leave the tab, lock the screen, switch apps. Write down what kept playing, on which phone.
Teach the verse at a meal: when thou goest, it shall lead thee. Ask a child what song they would take into a dark place.
At the end of the week, answer three questions to the person who is asking. What went with you? What stopped? What did you fix?
Measure the growth the Word's way - by the fruit, by the occasions, and by the days.`,
  },
  media: [],
  benefits: [
    `Darrell's spoken teaching, that the player should keep playing like a radio in the background, kept and built, not dropped.`,
    `The hour opened by Proverbs 6:22, so the Word is seen as something that leads, keeps and talks with you through the whole day.`,
    `Exodus 33:14 laid beside it: the presence of Yahweh that goes with His people, and the pillar He did not take away.`,
    `The bright line held: no tool is the presence of Yahweh, and no player is a Keeper.`,
    `The song in the night taught from Psalms 42:8 and Acts 16:25, where the prisoners heard them.`,
    `Faithful service taught from Mark 10:45 and 1 Corinthians 4:2: serving when no one is watching, not performing while watched.`,
    `Stop constraining it, from 2 Timothy 2:9: remove the limits we made, and name plainly the ones we did not.`,
    `Our own house measured from its code: a quiet part of the app may no longer silence the voice, and a small player goes with you to every tab.`,
    `Jesus confessed as the Lamb of Yahweh and the Eternal Son, who is with His own alway (Matthew 28:20).`,
    `His words, the measured, the recorded and the unverified told apart in every reader place, with a dated re-review.`,
  ],
  stories: [
    {
      kind: 'parable',
      tone: 'light',
      verse: 'Psalms 34:1',
      title: 'The radio on the workbench',
      body: `ILLUSTRATIVE, NOT A REAL EVENT. A carpenter kept an old radio on the corner of his workbench. It was tuned to a station that read the Bible in the mornings and played hymns the rest of the day. His grandson, visiting for the summer, asked why he never turned it up or sat down to listen properly.
The old man laughed and kept sanding. He said he had not sat down to listen in thirty years, and he had still heard the whole Bible on that radio more times than he could count. It was there when he cut, when he glued, when he swept up at the end of the day.
Then one week the radio started cutting out every time the shop door opened. The grandson found a loose wire, fixed it with a bit of tape, and the music kept going through every coming and going. His grandfather said that was the best thing anyone had built in that shop all summer.`,
    },
    {
      kind: 'parable',
      tone: 'solemn',
      verse: '1 Corinthians 4:2',
      title: 'The nurse who only worked while watched',
      body: `ILLUSTRATIVE, NOT A REAL EVENT. A night nurse on a busy ward was known for how attentive she was during rounds. When the doctor walked through, every patient had fresh water, every chart was neat, and she had a kind word for everyone.
But the patients noticed something the doctors did not. After the rounds were over and the hallway went quiet, the call lights could blink for a long time before anyone came. An old man who could not reach his cup lay thirsty until morning more than once.
It came out only when his daughter sat up with him one night and watched. She did not shout. She simply wrote down the times and asked to speak with the charge nurse. Nothing the night nurse did in front of the doctor was false. It was just not the whole of her work. What is required in stewards is that a man be found faithful, and faithfulness is what happens when no one is looking.`,
    },
  ],
  quiz: {
    questions: [
      {
        q: 'In Proverbs 6:22, what three things does the Word do?',
        options: [
          'It waits, it rests, it forgets',
          'When thou goest it shall lead thee, when thou sleepest it shall keep thee, when thou awakest it shall talk with thee',
          'It only speaks when you are sitting down',
        ],
        answer: 1,
        explain:
          'The Word goes with you: it leads while you move, keeps you while you sleep, and talks with you when you wake. It does not wait at home for you to come back.',
      },
      {
        q: 'What did Yahweh promise Moses in Exodus 33:14?',
        options: ['That Moses could go on alone', 'My presence shall go with thee, and I will give thee rest', 'That he would send a map'],
        answer: 1,
        explain: 'His presence would go with them. And Exodus 13:22 says He did not take away the pillar of cloud by day or the pillar of fire by night.',
      },
      {
        q: 'What is the bright line this lesson draws?',
        options: [
          'A good enough app can replace prayer',
          'No tool is the presence of Yahweh, and no player is a Keeper',
          'Technology should never carry the Word',
        ],
        answer: 1,
        explain:
          'A faithful tool can carry the Word and point to Him. Only Yahweh goes with you everywhere, and only the Holy Spirit abides for ever (John 14:16).',
      },
      {
        q: 'What happened when Paul and Silas sang at midnight in Acts 16:25?',
        options: ['They were told to be quiet', 'The prisoners heard them', 'They waited until morning to sing'],
        answer: 1,
        explain: 'The song did not wait for a better room, and people who never asked for it were served by it. That is a song that goes with you.',
      },
      {
        q: 'What did Darrell mean by a radio in the background?',
        options: [
          'Something you must stop and watch',
          'Something that keeps serving you while you do other things',
          'Something loud enough to drown out everything else',
        ],
        answer: 1,
        explain: 'Company on the road, not a performance. The reader should keep going while you move, leave the tab, or do whatever else you need to do.',
      },
      {
        q: 'According to 1 Corinthians 4:2, what is required in stewards?',
        options: ['That they be impressive', 'That a man be found faithful', 'That they be watched at all times'],
        answer: 1,
        explain: 'Faithfulness is proved when no one is watching. A tool, or a person, that only serves while observed is performing, not serving.',
      },
      {
        q: 'What actually made the reader in this app go silent when you left a tab?',
        options: [
          'The phone ran out of battery',
          'A quiet part of the app, shutting itself down, told the one shared voice to stop even though it was not the one speaking',
          'The reader was deleted on every tab change',
        ],
        answer: 1,
        explain: 'The fix: a part of the app that is not speaking may no longer stop the voice. Only the reader’s own Stop stops the reader.',
      },
      {
        q: 'How does this lesson handle the limits the house did not make?',
        options: ['It hides them', 'It names them plainly and keeps them on the list until they are measured', 'It blames the user'],
        answer: 1,
        explain:
          'A phone can still pause a page’s built-in voice when you switch apps, so the house built its own audio voice. Naming a limit is a map of the remaining work, not an excuse.',
      },
      {
        q: 'What does Proverbs 3:27 ask of us?',
        options: [
          'To wait until someone complains',
          'Withhold not good from them to whom it is due, when it is in the power of thine hand to do it',
          'To do good only when it is easy',
        ],
        answer: 1,
        explain: 'If it is in your hand to make something keep serving, do it. That is how his words, stop constraining it, become work.',
      },
      {
        q: 'Who is the Keeper who neither slumbers nor sleeps (Psalms 121:4)?',
        options: ['The app on your phone', 'Yahweh, who keeps Israel; and Jesus, the Lamb of Yahweh, is with His own alway', 'Whoever is on duty tonight'],
        answer: 1,
        explain: 'Every tool fails somebody at some hour. We build carefully because we are not Him, and He promised: lo, I am with you alway (Matthew 28:20).',
      },
    ],
  },
  facilitator: {
    howToRun: `SIXTY MINUTES, AND THE WORD OPENS IT. Read Proverbs 6:20-22 aloud before you say one word about any app. Then read Exodus 33:14 aloud and write two phrases on the board: it goes with you, and it keeps serving. Then ask the room: what is something that kept serving you even when you were not watching it?
MINUTES 0 TO 12 - THE WORD THAT TRAVELS. Proverbs 6:20-23 and Deuteronomy 6:7. Have someone list every place and hour the Word is told to go with you.
MINUTES 12 TO 24 - THE PRESENCE THAT MOVES. Exodus 13:21-22, Exodus 33:12-17, Psalms 121, Matthew 28:20. Then draw the bright line clearly: no tool is the presence of Yahweh, and no player is a Keeper.
MINUTES 24 TO 36 - THE SONG IN THE NIGHT. Psalms 42:8 and Acts 16:22-34. Ask: who heard the song, and did they ask for it?
MINUTES 36 TO 48 - THE FAITHFUL SERVANT. Mark 10:45, Galatians 5:13, 1 Corinthians 4:2. Tell Darrell's occasion in his own framing, without quotation marks, and what the house found in its own code. Name the limits it did not make, and 2 Timothy 2:9.
MINUTES 48 TO 60 - IT IS KEPT. Proverbs 3:27, then John 1:29, John 3:16, Hebrews 1:8 and Colossians 1:17. Give the four household habits and the week's assignment.
WHAT NOT TO DO. Do not teach that an app can stand in for the presence of Yahweh, or that a player is a Keeper. Do not claim his phone test has passed; it is not verified. Do not read an engineering note in a voice of authority over the Word; the Word frames the hour.`,
    talkingPoints: [
      `When thou goest, it shall lead thee; when thou sleepest, it shall keep thee (Proverbs 6:22).`,
      `Teach them at every point of an ordinary day (Deuteronomy 6:7).`,
      `He took not away the pillar (Exodus 13:22).`,
      `My presence shall go with thee (Exodus 33:14).`,
      `No tool is the presence of Yahweh; no player is a Keeper.`,
      `At midnight they sang, and the prisoners heard them (Acts 16:25).`,
      `A radio in the background: company on the road, not a show to watch.`,
      `Not to be ministered unto, but to minister (Mark 10:45).`,
      `It is required in stewards that a man be found faithful (1 Corinthians 4:2).`,
      `The Word is not bound (2 Timothy 2:9): remove the limits we made.`,
      `Name plainly the limits we did not make, and keep them on the list.`,
      `In the house: a quiet part of the app may no longer silence the voice.`,
      `He that keepeth Israel shall neither slumber nor sleep (Psalms 121:4).`,
    ],
    discussionPrompts: [
      `What hour of your day does the Word never go with you?`,
      `What have you treated like a presence that is really only a tool?`,
      `What song went with you through a hard season?`,
      `What do you do for someone that stops the moment they look away?`,
      `Which limits in your work did you make yourself?`,
      `What is in the power of your hand to fix this week?`,
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
console.log(`sov99: adult prose words ${adultWords} fk ${fk(filled.lesson).toFixed(2)}`);
for (const b of FOUR_BANDS) {
  console.log(
    `sov99: ${b} words ${words(filled.levels[b])} share ${(words(filled.levels[b]) / adultWords).toFixed(3)} fk ${fk(filled.levels[b]).toFixed(2)} overlap-adult ${overlapOf(filled.levels[b], filled.lesson).toFixed(3)}`
  );
}
for (let i = 0; i < FOUR_BANDS.length; i += 1) {
  for (let j = i + 1; j < FOUR_BANDS.length; j += 1) {
    console.log(`sov99: overlap ${FOUR_BANDS[i]}~${FOUR_BANDS[j]} ${overlapOf(filled.levels[FOUR_BANDS[i]], filled.levels[FOUR_BANDS[j]]).toFixed(3)}`);
  }
}
const faults = fourBandFaults(filled);
// --dry measures and reports, and writes nothing.
if (process.argv.includes('--dry')) {
  console.log(faults.length ? faults.join('\n') : 'sov99: no four-band faults');
  console.log(`sov99: ${filled.anchor.ref.split(';').length} anchor references`);
  process.exit(0);
}
if (faults.length) {
  console.error(faults.join('\n'));
  throw new Error('sov99: refusing to splice a lesson that fails the four-band ladder');
}

// -----------------------------------------------------------------------------
// Splice
// -----------------------------------------------------------------------------
const OPEN = 'export const SOVEREIGN_AI_MODULES = [';
let src2 = readFileSync(CATALOG, 'utf8');
let end2 = src2.indexOf('\n];', src2.indexOf(OPEN));
if (end2 < 0) throw new Error('sov99: could not find the end of SOVEREIGN_AI_MODULES');

if (src2.includes(ID)) {
  if (!process.argv.includes('--rebuild')) throw new Error(`sov99: ${ID} is already in the catalog; pass --rebuild to replace it`);
  const from = src2.indexOf(`  {\n    "id": "${ID}"`);
  if (from < 0) throw new Error('sov99: the id is in the file but not as a module literal; refusing to rebuild');
  const withComma = src2.indexOf('\n  },', from);
  const atArrayEnd = src2.indexOf('\n  }\n];', from);
  const ends = [
    withComma >= 0 && withComma < end2 ? { at: withComma, len: '\n  },'.length, back: 0 } : null,
    atArrayEnd >= 0 && atArrayEnd < end2 ? { at: atArrayEnd, len: '\n  }'.length, back: ','.length } : null,
  ]
    .filter(Boolean)
    .sort((a, b) => a.at - b.at);
  if (!ends.length) throw new Error('sov99: could not find the end of the existing block; refusing to rebuild');
  const { at: closeAt, len, back } = ends[0];
  const excised = src2.slice(from, closeAt + len);
  if (excised.split('"id":').length - 1 !== 1) {
    throw new Error(`sov99: the block to excise holds ${excised.split('"id":').length - 1} ids, expected 1; refusing to rebuild`);
  }
  src2 = src2.slice(0, from - back) + src2.slice(closeAt + len);
  end2 = src2.indexOf('\n];', src2.indexOf(OPEN));
  if (end2 < 0) throw new Error('sov99: the array is not closed after excising; refusing to rebuild');
  if (src2.includes(ID)) throw new Error('sov99: the id survived the excision; refusing to rebuild');
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
if (after.length !== before.length + 1) throw new Error(`sov99: week count went ${before.length} -> ${after.length}, expected exactly one more`);
if (before.includes(WEEK)) throw new Error(`sov99: week ${WEEK} is already taken`);
if (after[after.length - 1] !== WEEK) throw new Error(`sov99: week ${WEEK} is not the top of the course after splicing`);
const occurrences = next.split(`"${ID}"`).length - 1;
if (occurrences !== 1) throw new Error(`sov99: the new id appears ${occurrences} times, expected exactly once`);

writeFileSync(CATALOG, next);

const refs = filled.anchor.ref
  .split(';')
  .map((s) => s.trim())
  .filter(Boolean);
for (const r of refs) verseText(r);
console.log(`sov99: spliced ${ID}`);
console.log(`sov99: modules ${before.length} -> ${after.length}; top week ${after[after.length - 1]}`);
console.log(`sov99: ${refs.length} references on the anchor, every one quoted in a reader place and resolving in the corpus`);
