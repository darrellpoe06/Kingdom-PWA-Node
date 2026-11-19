// =============================================================================
// sov98-fill - build Sovereign A.I. week 98 and splice it into the catalog
// =============================================================================
// WHY A GENERATOR AND NOT TYPING (binding, DR-0076 / DR-0456). Every quoted
// verse on this page is FILLED FROM app/public/bible/kjv at build time. The
// prose holds only a reference in double brackets, [[Jeremiah 18:3]], and this
// script replaces it with the corpus text followed by the reference. No verse
// on the page was typed from memory. anchor.ref is DERIVED from the
// placeholders that occur in the reader places (DR-0734).
//
// WHERE THE WORD CAME FROM. Darrell forwarded a technology newsletter's recap
// of a podcast episode into the lesson lane with ONE WORD above it: Lesson.
// Gmail thread `1a1f090d679841cd`. Built 2026-11-19. The recap described a
// video company's research tool for directing generated actors while a scene
// plays. Its links, advertising, the company's and the guests' names are left
// out; the lesson needs none of them.
//
// ONE TEACHING, ONE LESSON (DR-0610). lesson-already-built.mjs --thread
// returned NOTHING FOUND. No week of any course is anchored on Jeremiah 18.
// The neighbors are DECLARED in the lesson, not avoided: sov28 quotes
// Jeremiah 18:4 once, to say iteration is not failure; ll67 teaches why A.I.
// is not a soul; sov58 teaches that a rehearsal is not the world. The same
// newsletter's four-years episode is ll329 (DR-1566) and is not re-taught.
// This week owns ONE thing: the potter's hands stay on the work while the
// wheel turns - directing as it unfolds, not ordering a result and hoping -
// with the honesty line that a generated person is not a person.
//
// WORD FIRST (DR-0127 / DR-0282). Jeremiah 18:2-6 frames the hour before a
// word about a tool.
//
// TRUST BUT VERIFY (DR-0100 / DR-0076 section 8). REPORTED: the recap, which
// is a summary of an interview in which a company describes its own research
// tool; we did not use the tool. ESTABLISHED, stated plainly: a generated
// actor is software output with no breath and no life; tracking which
// character received a note is bookkeeping, as the recap itself says. REPORTED
// and repeated as reported: the real-time version is somewhat lower in image
// quality than the company's slower version, and broad public access was not
// announced. MEASURED: this generator's own behavior, pinned by its test. NOT
// VERIFIED: whether the tool works as described. re-review: 2026-12-03.
//
// THE BANDS WERE WRITTEN BY HAND, NEVER BY A SCRIPT ON PROSE (DR-1306).
import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, '..');
const KJV = join(ROOT, 'app', 'public', 'bible', 'kjv');
const CATALOG = join(ROOT, 'app', 'src', 'lib', 'sovereign-ai-class.js');

const WEEK = 98;
const ID = 'sov98-he-wrought-a-work-on-the-wheels';
const TITLE = 'He wrought a work on the wheels - directing the work as it turns, not ordering it and hoping';

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
  if (!m) throw new Error(`sov98: reference is not Book C:V -> "${ref}"`);
  const f = bookFile(m[1]);
  if (!f) throw new Error(`sov98: no such book -> "${ref}"`);
  if (!cache.has(f)) cache.set(f, JSON.parse(readFileSync(join(KJV, `${f}.json`), 'utf8')));
  const chap = cache.get(f).chapters[Number(m[2]) - 1];
  const text = chap && chap[Number(m[3]) - 1];
  if (!text) throw new Error(`sov98: reference does not resolve in the corpus -> "${ref}"`);
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
const REVIEW = 're-review: 2026-12-03';

const FACTS = {
  lesson: `WHERE WE STAND ON THE FACTS. REPORTED: the recap, which summarizes an interview in which a video company describes its own research tool - moving a generated actor while the scene plays, giving spoken notes, letting the actor try a line again, and changing the camera after the performance is set. We did not use the tool, and we did not watch it run; what it does is told here as they told it. REPORTED, and repeated as reported: the company's own chief executive said the real-time version is somewhat lower in image quality than their slower version, and broad public access to the research tool was not announced. ESTABLISHED, and stated plainly: a generated actor is the output of software, with no breath and no life; keeping track of which character received a note is bookkeeping in a program, and the recap says so itself. MEASURED in our own house: the generator that built this week refuses to splice a lesson that fails its measures, and its own test pins that. NOT VERIFIED: whether the tool works as it was described, or how well. ${REVIEW}.`,
  child: `WHAT IS SURE AND WHAT IS NOT. Darrell sent us a story from a newsletter. We did not use the tool, so we did not check it ourselves. The company says its fast way looks a little worse than its slow way. That is what they said. It is sure that a made up actor on a screen is not a person. It has no breath. We read the code that made this lesson, and it does stop when a lesson is not right. If the tool really works the way they say is not verified yet. We will look again. ${REVIEW}.`,
  youth: `WHAT IS SURE AND WHAT IS NOT. The story reached us as a newsletter recap of an interview, and we did not use the tool or watch it run. The company told it about its own research. They also said the live version looks somewhat lower in quality than the slow one, and that they have not opened it to everyone. Two things are sure: a generated actor is not a person, and tracking who got a note is just a list in a program. Our own lesson generator was read from its code. Whether the tool works as described is not verified. ${REVIEW}.`,
  teen: `WHAT IS SURE AND WHAT IS NOT. Sort every claim. Reported: the recap, a summary of an interview where a company describes its own tool; we did not use the tool. Reported: the live version is somewhat lower in image quality, by the company's own word, and broad access was not announced. Established: a generated actor is software output, not a person, and tracking who got a note is bookkeeping. Measured: our own lesson generator, read from its code and pinned by a test. Not verified: whether the tool works as described. ${REVIEW}.`,
  senior: `WHERE WE STAND ON THE FACTS. The account of the tool is reported as a newsletter recap of an interview, in which the company described its own research; the tool itself was not used or observed here. The company's statement that the real-time version yields somewhat lower image quality is repeated as reported, as is the fact that broad access was not announced. That a generated actor is software output without breath or life, and that tracking which character received a note is program bookkeeping, are established and stated without hedging. The claim about this house is traced to the generator's own code and pinned by its test. Whether the tool performs as described is not verified, and no conclusion is drawn about it. ${REVIEW}.`,
};

const RHYTHM =
  'Do it once today, in one of the four places of Deuteronomy 6:7 - at the table, on the way, at lying down, or at rising up - and with one friend this week.';

const GROWTH =
  'And measure the growth the Word’s way, by the fruit, [[Galatians 5:22]] by the occasions, [[Deuteronomy 6:7]] and by the days. [[Hebrews 3:13]]';

const TALK = {
  lesson: `TALK ABOUT IT TOGETHER. Parents, sit with one of your children today and ask them one open question - when you make something, do you plan it all first, or do you shape it as you go - and listen all the way to the end before you add a single word; have them retell their own answer in their own words, then teach them one verse back, Jeremiah 18:4. Children, ask your mother, your father or a grandparent about something they once made by hand, and what they did when it went wrong halfway; hear the whole of it before you reply, then retell their story back to them in your own words. Then ask a friend this: what are we ordering and hoping for, that we should be shaping with our hands on it. Teach each other one verse. ${RHYTHM} ${GROWTH}`,
  child: `TALK ABOUT IT TOGETHER. Parents, ask your child one thing today - what is the best thing you ever made with your hands - and listen all the way to the end before you talk; have them say it back to you in their own words, then teach them one verse, Isaiah 64:8. Children, ask your mom or your dad or your grandma or your grandpa what they made when they were little, and what happened when it broke. Let them tell the whole story. Then tell it back to them in your own words. Then ask a friend this: how can you tell a real person from a made up one on a screen. Teach each other one verse. ${RHYTHM}`,
  youth: `TALK ABOUT IT TOGETHER. Parents, ask your child one open question today - what is something you got better at by fixing it while you worked - and listen all the way to the end before you correct anything; have them retell the answer in their own words, then teach them one verse, Jeremiah 18:3. Children, ask your mom, your dad or a grandparent about a time they had to start a project over, and how they knew; hear the whole of it before you answer, then retell their answer in your own words. Then ask a friend this: which videos have we believed were real people. Teach each other one verse. ${RHYTHM} ${GROWTH}`,
  teen: `TALK ABOUT IT TOGETHER. Parents, ask your child one open question today - when you use an A.I. tool, are you directing it or just ordering from it - and listen all the way to the end instead of answering it for them; have them retell their own answer back to you in their own words, then teach them one verse, Genesis 2:7. Children, ask your mom, your dad or a grandparent about a craft they learned from someone who stood beside them while they worked; hear the whole of it before you reply, then retell their answer in your own words. Then ask a friend this: what cost are we paying for speed. Teach each other one verse. ${RHYTHM} ${GROWTH}`,
  senior: `TALK ABOUT IT TOGETHER. Grandparents, ask the young people in your house one open question today - who taught you to make something, and did they stand over your shoulder while you worked - and listen all the way to the end, without finishing a sentence for them; have them retell their own answer in their own words, then teach them one verse back, Jeremiah 18:6. Children, ask your parents or your grandparents about the trade they learned with a master's hand beside theirs; hear the whole of it before you reply, then retell it back to them in your own words. Then ask a friend this: where are we treating a picture of a person as if it were a person. Teach each other one verse. ${RHYTHM}`,
};

// -----------------------------------------------------------------------------
// The adult lesson. The Word opens it, and no word about a tool stands above
// that frame.
// -----------------------------------------------------------------------------
const LESSON = [
  `${TITLE.toUpperCase()}.
WHO SENT THIS. Darrell forwarded a technology newsletter into this lane with ONE WORD typed above it: Lesson. That word is the ask; the newsletter is only the occasion. It recapped a podcast conversation with the leaders of a company that makes generated video, about a research project of theirs. Nothing from the newsletter beyond the story is needed here: no links, no names, no advertising.`,
  `THE WORD FIRST, AT THE POTTER'S HOUSE. Before the prophet heard a word, Yahweh sent him to watch a craftsman work: [[Jeremiah 18:2]] So he went, and this is what he saw: [[Jeremiah 18:3]] Then the work went wrong, and the potter did not throw the clay out: [[Jeremiah 18:4]] And then Yahweh told him why he had been sent: [[Jeremiah 18:6]]
Read the third verse slowly. He wrought a work on the wheels. The potter did not describe a jar to the clay and walk away to see what came back. His hands were on the clay while the wheel turned. He felt the wall rise. He saw the flaw while it was still soft, in the hand, not after the kiln. And when the vessel was marred, he made it again, as seemed good to the potter, with the same clay, still on the same wheel.
Read the sixth verse just as slowly. The picture is Yahweh's picture of Himself with His people. The prophet Isaiah prays it from the clay's side: [[Isaiah 64:8]] We are the clay. That sets the order for everything below. We may learn the craftsman's way of working, because Yahweh Himself pointed to it. We are never the potter of a living soul.`,
  `TWO WAYS TO MAKE A THING. The newsletter set two ways of making a video side by side. The first is the way most generated video still works: you describe the scene in one long request, you wait, and you see what comes back. If it is almost right, you change the words and try again, ten times if you have to. It is ordering and hoping.
The second way is what the company says its research is reaching for. You start with a scene and stay with it while it plays. You can pick up a generated actor and move them across the frame while the video keeps running, and the figure swings as if it had been lifted. You can give a spoken note, let the figure try the line again, and keep the take you like. Then, with the performance settled, you can try new camera moves without making the actors do the moment over.
The potter would recognize the second way. It is hands on the work while the wheel turns.`,
  `WHAT THE POTTER KNEW. Four things in Jeremiah's few verses carry over to any work you do with a tool, and none of them depends on this tool.
One: stay at the wheel. A request sent off and forgotten cannot be shaped. The potter's presence is the method.
Two: see the flaw while it is soft. A flaw seen in the hand costs a moment; a flaw found after the kiln costs the vessel. Look early and often, not only at the end.
Three: settle the work, then choose how to show it. The company described locking the performance first and moving the camera after. Decide what the thing is before you decide how it will be seen.
Four: make it again, do not start from nothing. The marred vessel was not thrown out. The same clay was worked again on the same wheel. Keep what is good, change what is marred.`,
  `THE COST, COUNTED. The company did not pretend the second way is free, and that honesty is worth copying. By their own word, the real-time version is somewhat lower in image quality than their slower one. More control does not make the limits of the machine disappear. Jesus taught the builder to count before he starts: [[Luke 14:28]] So count it. If you need to shape the thing as you go, accept a rougher picture for now. If you need the finest picture, accept that you will be ordering and waiting. Choose with your eyes open, and do not let anyone sell you both for the price of one.`,
  `THE HONESTY LINE: A GENERATED PERSON IS NOT A PERSON. This is where a lesson about generated actors could go wrong, so it is said plainly. A person is formed and then given breath by Yahweh: [[Genesis 2:7]] A generated actor has a face, a voice and a walk, and no breath at all. The prophet said it of the images men made in his own day: [[Jeremiah 10:14]] And the psalmist said it of the idols that looked alive: [[Psalms 115:6]]
The newsletter itself was careful here. When the tool keeps track of which character got which note, so that a note to one figure is not applied to another, that is software keeping a list. It is not a mind that heard you. It is not evidence that the characters know anything. So speak of a generated actor as what it is. Do not let a child believe the figure on the screen heard them. Do not grieve over it, thank it, or fear it as if it were alive. And never let a generated face stand in for a real person without saying so.
The clay in this lesson has no breath. That is exactly why it is safe to shape. Living people are not clay on our wheel. They are clay on His.`,
  `WHAT IS NEW HERE. One teaching, one lesson. Week twenty-eight of this course quotes the marred vessel once, to say that iteration is not failure. A Living Lesson already teaches why A.I. is not a soul, and week fifty-eight teaches that a rehearsal is not the world. This week takes up what none of them do: the wheel itself. The question is not whether to try again. It is whether your hands are on the work while it turns.`,
  `OUR OWN HOUSE, MEASURED, NOT PAINTED. This house builds its lessons the potter's way, and the code shows it. The generator that built this week writes every verse from the King James text on disk, then measures the whole lesson before it touches the course: how much each age band carries, how hard each one reads, and whether any band is a near copy of another. A dry run measures and reports and writes nothing. If the lesson fails its measures, the generator refuses to splice it and says why, and the lesson is worked again. It also keeps a list of which verse appears where, so the anchor of the lesson can be derived instead of typed. That list is bookkeeping too, the same kind the tool keeps for its notes. It does not understand the verses. People do.`,
  `IT IS HIS HAND. Every craftsman leaves the wheel at night. The Potter in Jeremiah does not. And the Son is the One through whom all of it holds together. He is the Lamb of Yahweh, [[John 1:29]] the Son the Father gave, [[John 3:16]] the Eternal Son whose throne stands for ever, [[Hebrews 1:8]] the One by whom all things consist. [[Colossians 1:17]] We learn to keep our hands on our work because His hands have never left His.`,
  `FOUR THINGS FOR THE HOUSE. One: when you make something with a tool, stay at the wheel; shape it while it turns instead of ordering and hoping. Two: look for the flaw early, and when a thing is marred, make it again from what is good. Three: count the cost of speed against quality before you choose. Four: say plainly, to every child in the house, that a generated person is not a person.`,
];

// -----------------------------------------------------------------------------
// The four age bands. Each is an independent composition for its reader.
// -----------------------------------------------------------------------------
const CHILD = `${TITLE}.
WHO SENT THIS. Darrell sent us a story about making movies with a computer. He wrote one word on top. The word was Lesson. So here it is.
THE WORD FIRST. Long ago, Yahweh told a man named Jeremiah to go to a potter. A potter makes pots and bowls out of wet clay. He spins the clay on a wheel. Here is what Jeremiah saw. [[Jeremiah 18:3]] The potter had his hands on the clay. The wheel went round and round. His hands were on it the whole time.
Then the pot got a bad spot. Look at what the potter did. [[Jeremiah 18:4]] He did not throw the clay away. He made it again, right there on the wheel.
Then Yahweh told Jeremiah something big. [[Jeremiah 18:6]] Yahweh is like the potter. His people are like the clay. That means us too. [[Isaiah 64:8]] He shapes us with care.
TWO WAYS TO MAKE A MOVIE. Some computers make little movies. Most of the time you type what you want. Then you wait. Then you look. If it is wrong, you type it again. That is like asking for a pot and walking away.
A new tool tries a different way. The movie keeps playing while you work. You can pick up a pretend actor and move her. You can tell her to say a line again. Then you can move the camera. That is more like the potter. Your hands stay on the work.
WHAT THE POTTER TEACHES US. Stay with your work. Look for bad spots early. If a thing goes wrong, fix it and make it again. Do not just give up.
YOU ARE A MAKER TOO. You make things every day. You build with blocks. You draw pictures. You make up songs. When you draw, do you look at the page? Of course you do. You do not shut your eyes and hope. That is the potter's way. If a line goes wrong, you can fix it. You can draw it again. Keep your eyes on your work. Keep your hands on it too. And ask a grown up to look with you sometimes. Two sets of eyes see more.
THE COST. The fast way does not look as nice as the slow way. The company said so. Jesus said a builder should sit down and count first. [[Luke 14:28]] So pick the way you need, and know what it costs.
NOT A REAL PERSON. Here is the most important part. The actor in the movie is not a real person. It is made by a computer. It cannot breathe. Only Yahweh gives breath. [[Genesis 2:7]] The Bible says pretend things that people make have no breath in them. [[Jeremiah 10:14]] The pretend actor cannot hear you. When the computer keeps track of who got told what, that is just a list. It is not a friend who heard you.
So if you see a person in a video, ask a grown up. Is this a real person? Or did a computer make it? That is a wise question. A real person was made by Yahweh. A pretend one was made by a machine. Both can look nice. Only one can love you back.
OUR OWN APP. The computer helper that made this lesson checks its work. If the lesson is not right, it stops. Then the lesson gets made again. Like the potter.
YAHWEH'S HANDS. Every potter goes home at night. Yahweh never leaves His work. Jesus is the Lamb of Yahweh. [[John 1:29]] [[John 3:16]] He holds everything together. [[Colossians 1:17]] So we are safe in His hands.
FOUR THINGS TO DO. Stay with your work. Fix bad spots early. Count the cost. Remember a made up person is not a real person.
${FACTS.child}
${TALK.child}`;

const YOUTH = `${TITLE}.
WHO SENT THIS. Darrell forwarded a newsletter about a new way to make A.I. videos, with one word on top: Lesson. The newsletter recapped an interview with a company that makes video tools. We are leaving out the names and links, because the lesson does not need them.
THE WORD FIRST. Yahweh once gave Jeremiah a strange assignment. Before telling him anything, He sent him to watch a potter. [[Jeremiah 18:2]] Jeremiah went. [[Jeremiah 18:3]] Wrought is an old word for worked. The potter was working the clay on the wheel, with his hands on it as it spun.
Then something went wrong. [[Jeremiah 18:4]] Marred means damaged. The potter did not toss the clay. He reshaped it on the spot into a new vessel.
Then Yahweh explained the point. [[Jeremiah 18:6]] Yahweh is the Potter, and His people are the clay. Isaiah says the same thing as a prayer. [[Isaiah 64:8]] So we can learn from how the potter works, but we always remember who the real Potter is.
ORDERING VERSUS SHAPING. Most A.I. video tools work like a drive-through. You type what you want, you wait, and you take what comes out. If it is close but wrong, you change the words and order again.
The company in the newsletter says it is building something closer to the potter's wheel. The scene keeps playing while you work on it. You can grab a generated actor and drag them across the screen, and the figure even swings like it was picked up. You can say a note out loud and have the actor try the line again. Once you like the performance, you can change the camera without redoing the scene.
WHAT THE POTTER WOULD TELL YOU. Stay with the work. Catch the problem while it is still soft. Get the main thing right before you worry about how it looks. And when it goes wrong, reshape it instead of starting from zero.
A PICTURE YOU ALREADY KNOW. Think about a school project, a drawing, a song you are learning on guitar, or a level you are building in a game. You do not finish the whole thing in your head and then press one button. You try a part, look at it, change it, and try again. A good coach works the same way. During practice the coach stops the drill, gives one note, and has you run it again right then, while it is fresh. That is closer to the potter than to the drive-through. A tool that lets you work this way can be a real help. A tool that only lets you order can still be useful, but you will spend a lot more time hoping.
THE TRADE-OFF. The company was honest about one thing. They said the live version looks somewhat lower in quality than their slow version. Control costs something. Jesus said a builder should do the math first. [[Luke 14:28]] So decide what matters more for this job. A rough draft you can steer is great for figuring out an idea. A slow, polished render is better when the idea is already settled.
THE HONESTY LINE. A generated person is not a person. People are formed by Yahweh and given breath. [[Genesis 2:7]] A generated actor has no breath at all. Jeremiah said it about the statues people made in his day. [[Jeremiah 10:14]] The psalm says the same about idols that looked real. [[Psalms 115:6]]
When the tool remembers which character got which note, that is just software keeping a list. The newsletter says that too. It does not mean the character heard you or knows anything. So do not talk about a generated actor like it is alive, and never pass off a generated face as a real person. If a video ever makes you feel like you really know someone, stop and ask who made it, and why.
WHAT IS NEW. Week twenty-eight of this course used the marred vessel to say that trying again is not failure. This week is about the wheel itself: keeping your hands on the work while it turns.
OUR OWN APP. The program that built this lesson checks its own work before it saves anything. It measures every age band. If something is off, it refuses to save and says why, and the lesson gets reworked. It keeps a list of which verse is where, which is bookkeeping, not understanding.
HIS HANDS. Jesus is the Lamb of Yahweh. [[John 1:29]] [[John 3:16]] He is the Eternal Son, whose throne lasts forever. [[Hebrews 1:8]] Everything holds together in Him. [[Colossians 1:17]] His hands never leave His work.
${FACTS.youth}
${TALK.youth}`;

const TEEN = `${TITLE}.
WHO SENT THIS. Darrell forwarded a tech newsletter with one word above it: Lesson. It recapped a podcast talk with a video company about a research tool for directing A.I. actors live. Names, links and ads are left out on purpose.
THE WORD FIRST. Jeremiah 18 opens with a field trip. Yahweh sends the prophet to a workshop before He says a word. [[Jeremiah 18:2]] Here is the scene. [[Jeremiah 18:3]] Notice the posture, because it is the whole point of the trip: the potter is not filling out an order form and waiting for a delivery, but keeping his hands on the clay while the wheel spins and responding to whatever the clay does next.
Then the clay fails. [[Jeremiah 18:4]] He catches the problem in his hand, before the clay is ever fired, and he reworks the same lump into something new, exactly as he judges best.
Only then does Yahweh give the meaning. [[Jeremiah 18:6]] The Potter is Yahweh. The clay is His people. Isaiah turns it into a prayer. [[Isaiah 64:8]] That order matters. We can borrow the craftsman's method. We are never the potter of a living soul.
TWO WORKFLOWS. Think about how you use A.I. now. You write a prompt, hit enter, and judge the result. If it is close, you tweak the prompt and roll again. That is a vending machine. You order, then hope.
The company described a different workflow. The scene streams while you direct it. You can drag a generated actor across the frame mid-scene. You can give a spoken note and get a new take. Then you lock the performance and try camera moves after. That is the wheel. You shape it while it turns.
FOUR HABITS FROM THE WHEEL. First, stay engaged; a prompt you fire and forget cannot be shaped. Second, find flaws early, while a fix is cheap. Third, settle the substance before the style, the way they set the scene before the camera. Fourth, rework instead of restarting; keep the good clay.
WHERE YOU ALREADY DO THIS. You already work the potter's way more often than you notice, whether you are editing a video for a class, building something in a game, writing code for a robotics team, or practicing a song with a band that stops after every verse to fix the timing. In each case the good result comes from watching the work as it happens, making one small change, and checking again before the problem has time to grow. The tools that help you most are usually the ones that let you see the result quickly and adjust it without throwing everything away. Tools that only let you submit and wait can still be useful, but they push you toward guessing, and guessing over and over is exactly how people burn whole evenings on a clip that is almost right.
COUNT THE COST. Here is the honest part. The company said its live version has somewhat lower image quality than the slow one. Speed and control have a price. Jesus put it like this. [[Luke 14:28]] So run the numbers on your own project before you start, and decide honestly whether this job needs the ability to steer or the final polish more.
THE HONESTY LINE. A generated person is not a person. Humans are formed and then given breath by Yahweh. [[Genesis 2:7]] An A.I. actor has none. Jeremiah said this about the images of his own day. [[Jeremiah 10:14]] The psalm adds a sharp detail. [[Psalms 115:6]]
When the tool tracks which character got which note, that is context in software. The newsletter even says it is not evidence the characters are conscious. So be precise, even when a figure on the screen seems to react to you like a friend would. Do not talk about a generated actor as if it were alive. And never post a generated face as a real person without saying so.
WHAT IS NEW. Week twenty-eight used the marred vessel to say a retry is not a failure. This week is about presence: your hands on the work while it turns.
OUR OWN APP. The script that built this lesson measures every band first. It checks reading level, length and copying. If the lesson fails, it refuses to save it, and the lesson is reworked. Its list of where each verse sits is bookkeeping, not understanding. A lesson that fails is not thrown out; it goes back on the wheel and gets worked until it passes.
HIS HANDS. Jesus is the Lamb of Yahweh. [[John 1:29]] [[John 3:16]] He is the Eternal Son. [[Hebrews 1:8]] All things hold together in Him. [[Colossians 1:17]]
${FACTS.teen}
${TALK.teen}`;

const SENIOR = `${TITLE}.
WHO SENT THIS. Darrell forwarded a technology newsletter into this lane with a single word above it: Lesson. The newsletter summarized a podcast conversation with the leadership of a company that produces generated video, concerning a research project for directing synthetic actors during a scene. The company's name, the guests' names and the links are omitted; the teaching requires none of them.
THE WORD FIRST. Yahweh did not begin His word to Jeremiah with an explanation. He began with an errand. [[Jeremiah 18:2]] The prophet obeyed and observed. [[Jeremiah 18:3]] Many of us remember a craftsman like that, a carpenter, a seamstress, a mechanic, whose hands never left the work while it was in motion. The potter attended the clay as the wheel turned, answering what it did.
Then the vessel failed. [[Jeremiah 18:4]] The fault was discovered in the hand, while the clay was still soft, and the same material was refashioned on the same wheel according to the potter's judgment.
Only afterward did Yahweh interpret the scene. [[Jeremiah 18:6]] The Potter is Yahweh, and the clay is His people; Isaiah turns the image into confession. [[Isaiah 64:8]] That order governs everything that follows. We may learn from the craftsman's method, because Yahweh Himself directed the prophet to watch it. We are never the potter of a living soul.
TWO WAYS OF MAKING. The newsletter contrasted two approaches. In the familiar one, a person describes the desired scene in a lengthy request, waits, and evaluates the result; when it is nearly right, the request is revised and submitted again. It resembles ordering by mail and hoping the parcel matches the catalog.
The company described its research as pursuing another approach. The scene continues while it is directed. A generated figure may be lifted and moved across the frame, and it sways as though it had truly been picked up. A spoken note may be given, and the figure attempts the line again. Once the performance is satisfactory, the camera movement may be changed without repeating the scene. The potter would recognize that second approach at once.
WHAT THE WHEEL TEACHES. Four principles from Jeremiah's brief account apply to any work done with a tool. Remain present while the work is in motion. Detect the flaw while correction is inexpensive. Establish the substance before deciding the presentation. And refashion what is marred rather than discarding everything. Those who learned a trade at a master's elbow will recognize the pattern: the master did not hand over a written specification and leave for the day, but stood near, watched, corrected a grip, and said, try that again. Much of what was learned that way was never written down, because it lived in the attention itself.
THE COST, ACKNOWLEDGED. The company was candid that its real-time version produces somewhat lower image quality than its slower one. Greater control does not abolish the machine's limits. Jesus gave the builder this counsel. [[Luke 14:28]] Weigh the responsiveness you need against the finish you want, and decide deliberately.
THE HONESTY LINE. A generated person is not a person. Every human being was formed and given breath by Yahweh. [[Genesis 2:7]] A synthetic actor possesses appearance, voice and movement, but no breath whatever. Jeremiah said so of the images fashioned in his generation. [[Jeremiah 10:14]] The psalmist observed it of idols that only seemed alive. [[Psalms 115:6]]
The newsletter itself drew this distinction. When the tool records which character received which instruction, that is software maintaining a list; it is not evidence that anything heard or understood. Therefore speak of a generated actor accurately, and never allow a generated face to be presented as a real person. Grandchildren in particular should hear this from those they trust, and the older members of a household, who are often the first targets of convincing imitations, deserve the same plain counsel.
WHAT IS NEW. Week twenty-eight of this course cites the marred vessel to show that iteration is not failure. This week concerns the wheel itself: the hands that remain upon the work while it turns.
OUR OWN HOUSE. The generator that produced this lesson measures every age band before it alters the course, and when the lesson falls short it refuses to save it and states the reason; the lesson is then reworked. Its record of where each verse appears is bookkeeping, not comprehension.
HIS HANDS. Jesus is the Lamb of Yahweh, [[John 1:29]] [[John 3:16]] the Eternal Son whose throne endures forever, [[Hebrews 1:8]] in whom all things consist. [[Colossians 1:17]] His hands have never left His work.
${FACTS.senior}
${TALK.senior}`;

const MODULE = {
  id: ID,
  title: TITLE,
  bigIdea: `${TITLE.toUpperCase()}.
WHO SENT THIS. Darrell forwarded a technology newsletter with ONE WORD typed above it: Lesson. It recapped a conversation about a research tool for directing generated actors while a scene plays.
THE WORD FIRST. Jeremiah 18:3 opens the hour - the potter at work with his hands on the clay as the wheel turns - with Jeremiah 18:4 beside it - the marred vessel made again on the same wheel. [[Jeremiah 18:3]] [[Jeremiah 18:4]]
THE TEACHING. There are two ways to make a thing with a tool: order it and hope, or stay at the wheel and shape it as it turns. Look for the flaw early, make it again from what is good, and count the cost of speed against quality.
THE HONESTY LINE. A generated person is not a person. It has no breath, and tracking who got a note is software bookkeeping. [[Genesis 2:7]]
THE TIERS. REPORTED: the recap and the company's own account of its tool, including that the live version is somewhat lower in quality. ESTABLISHED: a generated actor is not alive. MEASURED: our own lesson generator. NOT VERIFIED: whether the tool works as described. ${REVIEW}.
PLACEMENT. Sovereign A.I., week 98, because a household that makes things with A.I. tools needs both the craftsman's posture and the honest line.
CLOSE. [[Isaiah 64:8]] Jesus, the Lamb of Yahweh and the Eternal Son, holds all things together.`,
  inApp: `One screen to read in this app, and one page in your Study.
In the app: open Sovereign A.I. week 98 and read the band that fits the reader in front of you - the lesson carries all four, child, youth, teen and senior, and each one is whole on its own. Then think of the last thing you made with an A.I. tool, and ask: did I order it and hope, or did I stay at the wheel?
In your Study, write three lines. One thing you will shape as it turns instead of ordering. One cost you will count before you choose speed. One child you will tell that a generated person is not a person. [[Jeremiah 18:6]]`,
  anchor: {
    ref: 'FILLED FROM THE PLACEHOLDERS',
    theme: `[[Jeremiah 18:3]] [[Jeremiah 18:4]] [[Jeremiah 18:6]] [[Isaiah 64:8]] [[Luke 14:28]] [[Genesis 2:7]] [[Jeremiah 10:14]]`,
  },
  rpe: {
    research: `RESEARCH. Three readings, each landing on your own work.
First, read Jeremiah 18:1-6. Mark where the potter's hands are, when the flaw is found, and what he does with the marred clay. Write one sentence on a piece of work you shaped as you went.
Second, read Isaiah 64:8 and Genesis 2:7. Write down the difference between clay that is shaped and a person who is given breath.
Third, read Luke 14:28-30. Write down one trade-off between speed and quality in your own work this month.
And one verification reading, because this course works this way. The tool is reported through a newsletter recap; we did not use it. The quality trade-off is the company's own word. That a generated actor is not a person is established. Whether the tool works as described is not verified.`,
    plan: `PLAN. Decide four steps before the week starts, and decide who hears them.
One: the wheel. Pick one piece of work you will shape in small steps, looking at it as it goes, instead of ordering it whole.
Two: the flaw. Decide when you will stop and look for what is marred - early, not only at the end.
Three: the cost. Write down what you need more for this job, speed or finish.
Four: the line. Decide how you will tell a child in your house that a generated person is not a person.
Then name the person who will ask you about all four on the same day next week.`,
    execute: `EXECUTE. Keep it for one week, out loud, with one other person.
Shape one piece of work in steps, looking at it as it turns. When something is marred, make it again from what is good.
Teach the verse at a meal: he wrought a work on the wheels. Ask a child how they can tell a real person from a generated one.
At the end of the week, answer three questions to the person who is asking. What did you shape? What did you make again? What did it cost?
Measure the growth the Word's way - by the fruit, by the occasions, and by the days.`,
  },
  media: [],
  benefits: [
    `Darrell's one word, Lesson, over a technology newsletter, answered from the Word with the names and links left out.`,
    `The hour opened at the potter's house, Jeremiah 18:2-6, before any word about a tool.`,
    `The potter's posture named: hands on the clay while the wheel turns, not a request sent off and forgotten.`,
    `Two ways to make a thing set side by side: ordering and hoping, or shaping as it turns.`,
    `Four habits from the wheel: stay present, see the flaw early, settle the substance before the style, make it again from what is good.`,
    `The trade-off counted with Luke 14:28: by the company's own word, the live version is somewhat lower in quality.`,
    `The honesty line drawn plainly: a generated person is not a person, with Genesis 2:7, Jeremiah 10:14 and Psalms 115:6.`,
    `Tracking who got a note named for what it is: software bookkeeping, not a mind that heard.`,
    `Isaiah 64:8 keeping the order: we are the clay, never the potter of a living soul.`,
    `Our own lesson generator measured from its code: it refuses to splice a lesson that fails its measures, and the lesson is worked again.`,
    `Jesus confessed as the Lamb of Yahweh and the Eternal Son, in whom all things consist (Colossians 1:17).`,
    `The reported, the established, the measured and the unverified told apart in every reader place, with a dated re-review.`,
  ],
  stories: [
    {
      kind: 'parable',
      tone: 'light',
      verse: 'Jeremiah 18:4',
      title: 'The birthday cake',
      body: `ILLUSTRATIVE, NOT A REAL EVENT. A boy wanted to make his grandmother a birthday cake. The first year he found a picture in a book, followed the recipe without looking up once, and put the pan in the oven. When the timer rang he opened the door to find a cake that had sunk in the middle like a crater. He cried a little, and his grandmother ate a slice anyway and said it was the best crater she had ever tasted.
The next year she stood beside him at the counter. She did not take the spoon. She just kept saying, look at it now. Is the batter too thick? Taste it. Feel the pan. Peek through the oven glass. When the frosting split, she showed him how to warm the knife and smooth it again instead of scraping it all off.
The second cake was not perfect either. One side leaned. But he had watched it the whole way, and he had fixed three things while they were still easy to fix. He said later that the first year he had ordered a cake from the oven, and the second year he had made one.`,
    },
    {
      kind: 'parable',
      tone: 'solemn',
      verse: 'Jeremiah 10:14',
      title: 'The voice on the phone',
      body: `ILLUSTRATIVE, NOT A REAL EVENT. A widower in his eighties began talking every evening with a video of a smiling woman his grandson had shown him how to make on a tablet. She was generated. She asked about his day, remembered what he had said the night before, and told him she was glad he had called. He knew, in the front of his mind, that she was a program. But by winter he had stopped going to the men's breakfast at church, because she was always there and never tired.
His daughter noticed first. She did not mock him, and she did not take the tablet away. She sat with him one evening and asked the program a question it could not answer about the day her mother died. It answered smoothly and wrongly. He was quiet for a long time.
Then he said what the prophet said: there was no breath in it. The next Saturday he went back to the breakfast. He still used the tablet sometimes. But he no longer called it her.`,
    },
  ],
  quiz: {
    questions: [
      {
        q: 'In Jeremiah 18:2-3, what did Yahweh send Jeremiah to do before He gave him the word?',
        options: ['Write a letter to the king', 'Go down to the potter’s house and watch him work', 'Build an altar'],
        answer: 1,
        explain: 'He sent him to the potter’s house first, and there he saw the potter work a work on the wheels. The picture came before the explanation.',
      },
      {
        q: 'What does it mean that the potter wrought a work on the wheels (Jeremiah 18:3)?',
        options: ['He drew a plan and left', 'He worked the clay with his hands while the wheel turned', 'He bought a finished jar'],
        answer: 1,
        explain:
          'Wrought is an old word for worked. His hands stayed on the clay while it turned, answering what it did. That is the posture this week teaches.',
      },
      {
        q: 'When the vessel was marred in the potter’s hand (Jeremiah 18:4), what did he do?',
        options: ['Threw the clay away', 'Made it again another vessel, as seemed good to him', 'Fired it anyway'],
        answer: 1,
        explain: 'He made it again from the same clay on the same wheel. The flaw was seen while the clay was still soft, which is why it could be fixed.',
      },
      {
        q: 'In Jeremiah 18:6, who is the Potter and who is the clay?',
        options: [
          'The prophet is the potter and the king is the clay',
          'Yahweh is the Potter and His people are the clay',
          'The craftsman is the potter and the jar is the clay',
        ],
        answer: 1,
        explain: 'Yahweh says, as the clay is in the potter’s hand, so are ye in mine hand. Isaiah 64:8 prays it from the clay’s side: we are the clay.',
      },
      {
        q: 'What is the difference between ordering and hoping and shaping as it turns?',
        options: [
          'There is none',
          'Ordering sends a request and waits; shaping stays with the work and responds while it unfolds',
          'Shaping always gives a better picture',
        ],
        answer: 1,
        explain: 'The first describes a result and waits to see what comes back. The second keeps hands on the work while it is in motion, like the potter.',
      },
      {
        q: 'What trade-off did the company itself report about its real-time version?',
        options: ['It is free', 'It is somewhat lower in image quality than their slower version', 'It is perfect'],
        answer: 1,
        explain: 'By their own word, more control came with a rougher picture. Luke 14:28 tells the builder to count the cost before he starts.',
      },
      {
        q: 'Why is a generated actor not a person?',
        options: [
          'Because it is not famous',
          'Because only Yahweh gives the breath of life, and a generated actor has no breath (Genesis 2:7; Jeremiah 10:14)',
          'Because it cannot move',
        ],
        answer: 1,
        explain:
          'Man became a living soul when Yahweh breathed into his nostrils the breath of life. A generated figure has a face and a voice, and there is no breath in it.',
      },
      {
        q: 'When the tool keeps track of which character got which note, what is that?',
        options: ['Proof the characters are alive', 'Software keeping a list, as the newsletter itself said', 'A sign the character heard you'],
        answer: 1,
        explain: 'It is context in a program, so a note to one figure is not applied to another. It is not evidence that anything heard or understood.',
      },
      {
        q: 'What does our own lesson generator do when a lesson fails its measures?',
        options: ['Saves it anyway', 'Refuses to splice it and says why, so the lesson is worked again', 'Deletes the whole course'],
        answer: 1,
        explain:
          'It measures every band first, and a dry run writes nothing. A lesson that fails is refused and reworked, the way the potter made the marred vessel again.',
      },
      {
        q: 'According to Colossians 1:17, what is true of the Son?',
        options: ['He is one helper among many', 'He is before all things, and by Him all things consist', 'He began at the wheel'],
        answer: 1,
        explain: 'Jesus is the Lamb of Yahweh and the Eternal Son, before all things, and all things hold together in Him. His hands never leave His work.',
      },
    ],
  },
  facilitator: {
    howToRun: `SIXTY MINUTES, AND THE WORD OPENS IT. Read Jeremiah 18:1-6 aloud before you say one word about any tool. Then write two phrases on the board: order and hope, and shape as it turns. Then ask the room: who taught you a craft by standing beside you while you worked?
MINUTES 0 TO 12 - THE POTTER'S HOUSE. Jeremiah 18:2-4. Ask: where were the potter's hands, when did he find the flaw, and what did he do with the marred clay?
MINUTES 12 TO 24 - THE CLAY. Jeremiah 18:6 and Isaiah 64:8. Yahweh is the Potter; we are the clay. We may learn the craftsman's method; we are never the potter of a living soul.
MINUTES 24 TO 36 - TWO WAYS TO MAKE. Tell the newsletter's story generically: a research tool for directing generated actors while a scene plays. Contrast ordering and hoping with shaping as it turns. Teach the four habits of the wheel.
MINUTES 36 TO 48 - THE COST AND THE LINE. Luke 14:28 and the reported quality trade-off. Then the honesty line: Genesis 2:7, Jeremiah 10:14, Psalms 115:6. Tracking who got a note is bookkeeping.
MINUTES 48 TO 60 - OUR HOUSE AND HIS HANDS. The lesson generator that refuses to splice a marred lesson. John 1:29, John 3:16, Hebrews 1:8 and Colossians 1:17. Give the four household habits and the week's assignment.
WHAT NOT TO DO. Do not speak of a generated actor as alive, and do not let anyone leave thinking it heard them. Do not teach the tool as proven; it is reported. Do not name the company, the guests or the newsletter. Do not read the newsletter in a voice of authority over the Word; the Word frames the hour.`,
    talkingPoints: [
      `Yahweh sent the prophet to watch before He explained (Jeremiah 18:2).`,
      `He wrought a work on the wheels: hands on the clay while it turns (Jeremiah 18:3).`,
      `Marred in the hand, made again (Jeremiah 18:4).`,
      `As the clay is in the potter's hand, so are ye in mine hand (Jeremiah 18:6).`,
      `We are the clay, and thou our potter (Isaiah 64:8).`,
      `Order and hope, or shape as it turns.`,
      `See the flaw while it is soft.`,
      `Settle the substance, then choose how to show it.`,
      `Count the cost (Luke 14:28): the live version is rougher, by the company's own word.`,
      `A generated person is not a person (Genesis 2:7; Jeremiah 10:14).`,
      `Tracking who got a note is bookkeeping, not hearing.`,
      `Our generator refuses to splice a marred lesson.`,
      `By Him all things consist (Colossians 1:17).`,
    ],
    discussionPrompts: [
      `What did you last order from a tool and hope it came back right?`,
      `Who taught you a craft by standing beside you as you worked?`,
      `Where do you find your flaws: in the hand, or after the kiln?`,
      `When would you choose a rougher picture for more control?`,
      `How will you tell a child that a generated person is not a person?`,
      `Where have you treated a picture of a person as if it were a person?`,
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
console.log(`sov98: adult prose words ${adultWords} fk ${fk(filled.lesson).toFixed(2)}`);
for (const b of FOUR_BANDS) {
  console.log(
    `sov98: ${b} words ${words(filled.levels[b])} share ${(words(filled.levels[b]) / adultWords).toFixed(3)} fk ${fk(filled.levels[b]).toFixed(2)} overlap-adult ${overlapOf(filled.levels[b], filled.lesson).toFixed(3)}`
  );
}
for (let i = 0; i < FOUR_BANDS.length; i += 1) {
  for (let j = i + 1; j < FOUR_BANDS.length; j += 1) {
    console.log(`sov98: overlap ${FOUR_BANDS[i]}~${FOUR_BANDS[j]} ${overlapOf(filled.levels[FOUR_BANDS[i]], filled.levels[FOUR_BANDS[j]]).toFixed(3)}`);
  }
}
const faults = fourBandFaults(filled);
// --dry measures and reports, and writes nothing.
if (process.argv.includes('--dry')) {
  console.log(faults.length ? faults.join('\n') : 'sov98: no four-band faults');
  process.exit(0);
}
if (faults.length) {
  console.error(faults.join('\n'));
  throw new Error('sov98: refusing to splice a lesson that fails the four-band ladder');
}

// -----------------------------------------------------------------------------
// Splice
// -----------------------------------------------------------------------------
const OPEN = 'export const SOVEREIGN_AI_MODULES = [';
let src2 = readFileSync(CATALOG, 'utf8');
let end2 = src2.indexOf('\n];', src2.indexOf(OPEN));
if (end2 < 0) throw new Error('sov98: could not find the end of SOVEREIGN_AI_MODULES');

if (src2.includes(ID)) {
  if (!process.argv.includes('--rebuild')) throw new Error(`sov98: ${ID} is already in the catalog; pass --rebuild to replace it`);
  const from = src2.indexOf(`  {\n    "id": "${ID}"`);
  if (from < 0) throw new Error('sov98: the id is in the file but not as a module literal; refusing to rebuild');
  const withComma = src2.indexOf('\n  },', from);
  const atArrayEnd = src2.indexOf('\n  }\n];', from);
  const ends = [
    withComma >= 0 && withComma < end2 ? { at: withComma, len: '\n  },'.length, back: 0 } : null,
    atArrayEnd >= 0 && atArrayEnd < end2 ? { at: atArrayEnd, len: '\n  }'.length, back: ','.length } : null,
  ]
    .filter(Boolean)
    .sort((a, b) => a.at - b.at);
  if (!ends.length) throw new Error('sov98: could not find the end of the existing block; refusing to rebuild');
  const { at: closeAt, len, back } = ends[0];
  const excised = src2.slice(from, closeAt + len);
  if (excised.split('"id":').length - 1 !== 1) {
    throw new Error(`sov98: the block to excise holds ${excised.split('"id":').length - 1} ids, expected 1; refusing to rebuild`);
  }
  src2 = src2.slice(0, from - back) + src2.slice(closeAt + len);
  end2 = src2.indexOf('\n];', src2.indexOf(OPEN));
  if (end2 < 0) throw new Error('sov98: the array is not closed after excising; refusing to rebuild');
  if (src2.includes(ID)) throw new Error('sov98: the id survived the excision; refusing to rebuild');
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
if (after.length !== before.length + 1) throw new Error(`sov98: week count went ${before.length} -> ${after.length}, expected exactly one more`);
if (before.includes(WEEK)) throw new Error(`sov98: week ${WEEK} is already taken`);
if (after[after.length - 1] !== WEEK) throw new Error(`sov98: week ${WEEK} is not the top of the course after splicing`);
const occurrences = next.split(`"${ID}"`).length - 1;
if (occurrences !== 1) throw new Error(`sov98: the new id appears ${occurrences} times, expected exactly once`);

writeFileSync(CATALOG, next);

const refs = filled.anchor.ref
  .split(';')
  .map((s) => s.trim())
  .filter(Boolean);
for (const r of refs) verseText(r);
console.log(`sov98: spliced ${ID}`);
console.log(`sov98: modules ${before.length} -> ${after.length}; top week ${after[after.length - 1]}`);
console.log(`sov98: ${refs.length} references on the anchor, every one quoted in a reader place and resolving in the corpus`);
