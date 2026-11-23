// =============================================================================
// sov101-fill - build Sovereign A.I. week 101 and splice it into the catalog
// =============================================================================
// WHY A GENERATOR AND NOT TYPING (binding, DR-0076 / DR-0456 / DR-1468). Every
// quoted verse on this page is FILLED FROM app/public/bible/kjv at build time,
// through scripts/lib/kjv.mjs. The prose holds only a token,
// {{kjv:1 Corinthians 5:6}}, and this script replaces it with the corpus text
// followed by the reference. No verse on the page was typed from memory.
// anchor.ref is DERIVED from the tokens that occur in the reader places
// (DR-0734).
//
// WHERE THE WORD CAME FROM. Darrell forwarded a university technology-services
// security notice into the lesson lane with ONE WORD above it: Lesson. Gmail
// thread `1a208f5960ac285d`. Built 2026-11-23. His note on the forward,
// rendered for meaning (DR-0331): also fix our own systems, so our technology
// stacks are protected. That fix is made as its own change, apart from this
// lesson; this branch edits no workflow and no infra file. The notice's
// contact details, footer and links are left out; the lesson needs none.
//
// ONE TEACHING, ONE LESSON (DR-0610). lesson-already-built.mjs --thread found
// nothing, and --subject found only term matches (other records that say
// "update" and "java"). No lesson teaches a flaw in a shared runtime that hides
// inside other things. The neighbors are DECLARED in the lesson: sov100 (rooms
// in the ark) teaches what containers SHARE under the walls, the host kernel;
// this week teaches what each room CARRIES inside it, its own copy of a
// runtime, and why each image is rebuilt. sov47 teaches upkeep put off. A
// sibling forward from the same morning (thread 1a208fb97b576d51) on an outage
// and business continuity is built separately; outage and continuity are left
// to it.
//
// WORD FIRST (DR-0127 / DR-0282). 1 Corinthians 5:6 and Exodus 12:19 frame the
// hour before a word about a runtime.
//
// TRUST BUT VERIFY (DR-0100 / DR-0076 section 8). The forward is ONE
// institutional notice: trusted for the shape of the work, verified before it
// is stated as ours. REPORTED by the notice, and repeated as the notice states
// it: the flaw's name and CVE number; that it could let an unauthenticated
// attacker run code through specially crafted Base64 data; the affected builds;
// the three steps; and the temporary startup option. ESTABLISHED, stated
// plainly: a Java program runs on a Java runtime; an application, a container
// image or an appliance can carry its own copy of that runtime; a running
// program keeps the code it started with until it is restarted; a container
// keeps the runtime its image was built with until the image is rebuilt.
// MEASURED in our own house, from this repository: 15 compose files under
// infra/; none names a Java image; a search of infra/ for java, jdk, jre,
// temurin, openjdk and corretto finds only the word JavaScript; Java appears
// in this house only on GitHub's short-lived build runners, where
// .github/workflows/android-package.yml asks setup-java for Temurin 17 (two
// jobs) and .github/workflows/native-shell.yml for Temurin 21 (one job).
// REPORTED by the action's own documentation, not tested here: asked only for
// a major version it may use a copy cached on the runner, which can lag the
// newest release, unless check-latest is set; that is the separate stack fix. NOT VERIFIED: whether
// any third-party image on the home server carries a Java runtime deep inside
// it (only a search inside each image on the box can say); and the CVE number,
// affected builds and startup option against each vendor's own advisory.
// re-review: 2026-12-07.
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

const WEEK = 101;
const ID = 'sov101-a-little-leaven-leaveneth-the-whole-lump';
const TITLE = 'A little leaven leaveneth the whole lump - a flaw in a shared runtime, and the watchman who finds every place it lives';

// -----------------------------------------------------------------------------
// The corpus: one verse per token, read from the KJV files on disk
// -----------------------------------------------------------------------------
function verseText(ref) {
  const r = String(ref).trim();
  if (!/^(.+?)\s+(\d+):(\d+)$/.test(r)) throw new Error(`sov101: reference is not Book C:V -> "${r}"`);
  const t = kjvText(r, KJV);
  if (!t) throw new Error(`sov101: reference does not resolve in the corpus -> "${r}"`);
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
const REVIEW = 're-review: 2026-12-07';

const FACTS = {
  lesson: `WHERE WE STAND ON THE FACTS. REPORTED by one institutional security notice, and repeated as the notice states it: the flaw's name, Java4Shell, and its number, CVE-2026-114938; that it could let an attacker who has not signed in run code on an affected Java application through specially crafted Base64 data; that unpatched Java 17, 21, 25 and 27 builds are affected, with certain Oracle Java 8 Performance Pack and GraalVM builds; the three steps; and the temporary startup option. Trust it, and verify it: the vendor's own advisory is the word on which builds are affected, and this lesson has not yet checked each one. ESTABLISHED, and stated plainly: a Java program runs on a Java runtime; an application, a container image or an appliance can carry its own copy of that runtime; a running program keeps the code it started with until it is restarted; and a container keeps the runtime its image was built with until the image is rebuilt. MEASURED in our own house, from the files in this repository: fifteen container recipes for the home server, and none of them names a Java image; a search of those folders for every common name of a Java runtime finds only the word JavaScript; Java appears in this house only on short-lived build machines that package the Android app, one asking for Temurin 17 and one for Temurin 21. REPORTED by the setup tool's own documentation, not tested here: asked only for a major version, it may use a copy already cached on the build machine, which can lag the newest release, unless it is told to check for the latest. MEASURED: all three build steps now tell it to, a change made apart from this lesson. NOT VERIFIED: whether any image we did not build carries a Java runtime deep inside it, which only a search inside each image on the home server can answer. ${REVIEW}.`,
  child: `WHAT IS SURE AND WHAT IS NOT. One school sent a warning. We did not test the warning ourselves. So we say it was told to us. Some things are sure. A program can carry its own copy of Java inside it. A fix does not work until the program starts again. We looked at our own notes. Our home computer does not use Java in any box we wrote down. Java is used on a few helper computers that build our phone app. Those are made new each time. We have not looked inside every box on the home computer yet. So that part is not verified. We will look again. ${REVIEW}.`,
  youth: `WHAT IS SURE AND WHAT IS NOT. Told to us by one school's warning, and not tested by us: the flaw's name, Java4Shell, its number, which Java versions are hit, and the startup setting that blunts it. Sure: a program can carry its own copy of Java; a fix does nothing to a program until it restarts; and a container keeps its old Java until its image is rebuilt. Measured in our own files: fifteen container recipes, and not one names a Java image. Java shows up only on short-lived machines that build our Android app, asking for Temurin 17 and Temurin 21. Not verified: whether any image we did not build hides a copy of Java deep inside. ${REVIEW}.`,
  teen: `WHAT IS SURE AND WHAT IS NOT. Sort every claim. Reported by one institutional notice: the name Java4Shell, the number CVE-2026-114938, crafted Base64 data as the way in, the affected builds, and the temporary startup flag. Check those against the vendor's own advisory before you trust them. Established: apps, images and appliances can bundle their own runtime; a patch on disk does not change a running process; a container keeps its runtime until it is rebuilt. Measured in our repo: fifteen compose files, none naming a Java image, and Java only on short-lived build runners asking for Temurin 17 and 21. Not verified: whether any third-party image bundles Java inside it. ${REVIEW}.`,
  senior: `WHERE WE STAND ON THE FACTS. The flaw's name, its number, the means of attack through crafted Base64 data, the list of affected builds and the temporary startup option are reported by a single institutional notice and repeated as it states them; each vendor's own advisory remains the authority, and this lesson has not yet checked them one by one. That an application, a container image or an appliance can carry its own Java runtime, that a running program keeps its old code until it is restarted, and that a container keeps its old runtime until its image is rebuilt, are established. What this lesson says of the house is traced to its own files: fifteen container recipes for the home server, none of which names a Java image, and Java used only on short-lived build machines that package the Android app, one requesting Temurin 17 and one Temurin 21. Whether any image the house did not build carries a Java runtime inside it is not verified, and no conclusion is drawn about it. ${REVIEW}.`,
};

const RHYTHM =
  'Do it once today, in one of the four places of Deuteronomy 6:7 - at the table, on the way, at lying down, or at rising up - and with one friend this week.';

const GROWTH =
  'And measure the growth the Word’s way, by the fruit, {{kjv:Galatians 5:22}} by the occasions, {{kjv:Deuteronomy 6:7}} and by the days. {{kjv:Hebrews 3:13}}';

const TALK = {
  lesson: `TALK ABOUT IT TOGETHER. Parents, sit with one of your children today and ask them one open question - if something bad were hidden inside something good in our house, how would we ever find it - and listen all the way to the end before you add a single word; have them retell their own answer in their own words, then teach them one verse back, 1 Corinthians 5:6. Children, ask your mother, your father or a grandparent about a time a warning came for something in the house, a recall or a notice, and how they found every place it was hiding; hear the whole of it before you reply, then retell their story back to them in your own words. Then ask a friend this: what do we run that carries something inside it we have never looked at. Teach each other one verse. ${RHYTHM} ${GROWTH}`,
  child: `TALK ABOUT IT TOGETHER. Parents, ask your child one thing today - if one bad bit was mixed into a whole cake, how could we tell - and listen all the way to the end before you talk; have them say it back to you in their own words, then teach them one verse, 1 Corinthians 5:6. Children, ask your mom or your dad or your grandma or your grandpa if they ever had to look all over the house for one thing. Let them tell the whole story. Then tell it back to them in your own words. Then ask a friend this: what do we have that has something inside it we can not see. Teach each other one verse. ${RHYTHM}`,
  youth: `TALK ABOUT IT TOGETHER. Parents, ask your child one open question today - when your phone says an update is waiting, what keeps you from pressing restart - and listen all the way to the end before you fix anything; have them retell the answer in their own words, then teach them one verse, Matthew 9:17. Children, ask your mom, your dad or a grandparent about a time they fixed something but it did not work until they turned it off and on again; hear the whole of it before you answer, then retell their answer in your own words. Then ask a friend this: which of our apps might carry a part we never chose. Teach each other one verse. ${RHYTHM} ${GROWTH}`,
  teen: `TALK ABOUT IT TOGETHER. Parents, ask your child one open question today - if a warning went out about a part inside a hundred apps, how would you find out which of yours have it - and listen all the way to the end instead of answering it for them; have them retell their own answer back to you in their own words, then teach them one verse, Zephaniah 1:12. Children, ask your mom, your dad or a grandparent about a time a warning reached them and they had to decide who else needed to hear it; hear the whole of it before you reply, then retell their answer in your own words. Then ask a friend this: what is the first door we would guard if we could not fix everything at once. Teach each other one verse. ${RHYTHM} ${GROWTH}`,
  senior: `TALK ABOUT IT TOGETHER. Grandparents, ask the young people in your house one open question today - when a warning comes about something you cannot see, whose job is it to look - and listen all the way to the end, without finishing a sentence for them; have them retell their own answer in their own words, then teach them one verse back, Ezekiel 33:6. Children, ask your parents or your grandparents about a recall or a notice they once received, how they found every place the bad part had gone, and who they told; hear the whole of it before you reply, then retell it back to them in your own words. Then ask a friend this: which of our warnings have we read and not yet acted on. Teach each other one verse. ${RHYTHM}`,
};

// -----------------------------------------------------------------------------
// The adult lesson. The Word opens it, and no word about a runtime stands above
// that frame.
// -----------------------------------------------------------------------------
const LESSON = [
  `${TITLE.toUpperCase()}.
WHO SENT THIS. Darrell forwarded a university's technology security notice into this lane with ONE WORD typed above it: Lesson. Beside it he asked that we also fix our own systems, so our own stacks are protected. The notice warned about a flaw in the Java runtime and told the people who keep computers to find it, patch it and restart. Its contact details and its links are left out; the teaching needs none of them.`,
  `THE WORD FIRST, IN THE LUMP. Before there was a computer, Paul wrote to a church about something small that does not stay small: {{kjv:1 Corinthians 5:6}} Leaven is yeast, the bit of old dough kept back and worked into the new. Once it is in, it is not in one place. It is in every part of the loaf. You cannot pick it out with your fingers, because it is no longer a lump of its own. It is inside everything it touched.
So when Yahweh gave Israel the Passover, He did not say to throw out the bag of leaven and call it done. He said to search the whole house: {{kjv:Exodus 12:19}} Not in the kitchen only. Not where they kept it on purpose. Found nowhere in the house, whether the house belonged to the stranger or to one born in the land. The command was about every place, because leaven hides inside other things.
And Yahweh said He would search that way Himself: {{kjv:Zephaniah 1:12}} Candles, carried into the corners, because the dark corners are where the settled and the careless keep what they did not want to look at.`,
  `WHAT THE NOTICE SAID. Here is the notice, as it states it. A flaw in the Java runtime, which it calls Java4Shell and numbers CVE-2026-114938, could let an attacker who has not signed in run their own code on an affected Java application, by sending specially crafted Base64 data. Base64 is a common way of writing any kind of data as plain letters and numbers so it can travel in a web request or a message, which means many programs read it from strangers all day. The notice lists unpatched Java 17, 21, 25 and 27 builds as affected, along with certain Oracle Java 8 Performance Pack and GraalVM builds, and it sends every reader to their own vendor's advisory to check exactly which builds. Then it gives three steps: find the affected runtimes, patch and restart, and mitigate for a while if the patch must wait.`,
  `WHAT A RUNTIME IS, AND WHERE IT HIDES. A Java program is not run by the computer directly. It is run by the Java runtime, a program whose whole job is to run other programs. So a flaw in the runtime is a flaw in every Java program standing on it, the way a flaw in the yeast is a flaw in every loaf.
The notice named the hard part in one line: Java may be installed directly, or it may be bundled with applications, containers and appliances. That is the leaven in the lump.
Installed directly means someone put Java on the machine on purpose. That copy is the easy one to find.
Bundled with an application means the program brought its own copy of Java inside its own folder, so it does not depend on what the machine has. Updating the machine's Java does nothing to that copy.
Inside a container means the image the container was built from carries its own Java. Week one hundred of this course taught that containers share the host's kernel, the floor under every room. What a container does not share is what it carries in its own room. Each image packs its own runtime, so each image has its own copy of the flaw, and each one must be rebuilt.
Inside an appliance means a box from a vendor, a camera recorder, a door system, a printer or a time clock, running Java you never installed and may never see. Only that vendor can ship its fix.
One flaw, four kinds of hiding place. The people who only update the copy they installed have taken the leaven out of the bag and left it in the bread.`,
  `FIRST, FIND EVERY PLACE IT LIVES. The notice says to identify the affected runtimes, including those bundled with applications and containers, and to run that runtime's own java -version command to read its vendor and its full version. Notice the word that: that runtime's own command, in that runtime's own folder. Asking the machine which Java it has only tells you about the copy on its path, not the copy hidden inside an application. Then compare what you read against the vendor's advisory, and use a search tool that can look across every machine at once.
This is the oldest work a keeper does: {{kjv:Proverbs 27:23}} You cannot protect what you have not counted. An honest list of what runs, where it runs, and what it carries inside, is the candle carried into the corners.`,
  `PUT THE OPEN WALL FIRST. The notice says to update as soon as possible, prioritizing internet-facing services. When Nehemiah's wall was half built and the enemy was near, he did not spread his people evenly. He put them where the wall was low and where it could be seen: {{kjv:Nehemiah 4:13}} A program that any stranger on the internet can send data to is the low place in the wall. Fix that one first, then work inward.`,
  `THEN PATCH, AND RESTART. Apply the Java vendor's update, from whichever vendor built your runtime. For bundled Java, get the application vendor's update; do not swap the runtime inside someone else's product by hand unless that vendor says you may. And then restart. A patch written to the disk does not reach a program that is already running; it keeps the old code it loaded when it started, until it is stopped and started again. For containers, the notice says to rebuild and redeploy them. Restarting an old container only starts the old image again, with the old runtime still inside.
Jesus said it in a sentence that fits this exactly: {{kjv:Matthew 9:17}} New wine goes into new bottles. A fixed runtime goes into a rebuilt image, and the old image is retired, so both are kept sound.`,
  `WHEN THE PATCH MUST WAIT, GUARD THE WALL. Sometimes the fix is not ready, or the program cannot be stopped today. For that, the notice gives a temporary step: add a startup option, -XX:-UseBASE64Intrinsics, to the Java program where it is supported, and restart. As the notice presents it, this turns off a built-in shortcut the runtime uses for Base64, the path the flaw rides on. That is a guard on the wall, not a rebuilt wall. It is how Nehemiah's builders worked while the danger was near: {{kjv:Nehemiah 4:17}} One hand on the work, one hand on the guard, until the work is done. So a mitigation is written down with the day it was added and the day it will be removed, and it is removed when the real patch lands.`,
  `THE WATCHMAN WHO READS THE WARNING. A notice like this is a trumpet. Once you have read it, you are part of the watch: {{kjv:Ezekiel 33:6}} That verse is heavy, and it is meant to be. The watchman is not blamed for the sword. He is answerable for the silence. So the one who reads the notice passes it to whoever keeps each affected system, and does the three steps on what is theirs, and if there are signs a system was already broken into, tells the people whose job is to respond, as the notice also says.`,
  `THE BRIGHT LINE. Every step in this lesson is good stewardship, and none of them is safety itself. The next flaw is already written somewhere, in some runtime, waiting to be found. The best keeper still answers to this: {{kjv:Psalms 127:1}} The watchman is told to wake, and he does. But he does not keep the city by himself. We search with Knowledge, choose the order with Wisdom, and keep at it with Understanding, and we never mistake our patching for the hand that keeps us.`,
  `OUR OWN HOUSE, MEASURED, NOT PAINTED. Darrell asked that our own stack be protected, so here is what our own files show. The home server's services are written down as fifteen container recipes in this repository. None of them names a Java image; they are Node, .NET, Go, Python and Postgres programs and a few others, by what each project publishes about itself. A search of those folders for every common name of a Java runtime finds only the word JavaScript, which is a different language. Java does appear in this house in one place: the short-lived build machines that package our Android app. One build asks for Temurin 17, and another asks for Temurin 21. Those machines are made fresh for each build and thrown away after. But the setup tool's own documentation says that, asked only for a major version, it may use a copy already cached on the machine, which can lag the newest release. So a fresh machine is not the same as a fresh runtime. A separate change tells the setup step to check for the latest build every time, so a fixed release is taken as soon as it is published.
That is the honest picture, and it has an edge. The recipes name the images; they do not show what is packed inside an image someone else built. Whether any of those images carries a Java runtime deep inside is exactly the hidden-leaven question, and it is answered only by searching inside each image on the home server itself, which this build cannot see. The work of protecting the stack is being done as its own change, apart from this lesson, and this question is part of it, with a date to come back to it.`,
  `WHAT IS NEW HERE. One teaching, one lesson. Week one hundred of this course teaches what containers share under their walls, one kernel, and how far trouble travels on a shared floor. Week forty-seven teaches the wall that falls when upkeep is put off. This week takes up what neither does: a flaw in a part that many programs carry inside them, and the watchman's work of finding every copy, fixing it, restarting it, and guarding the wall while the fix is on its way.`,
  `IT IS HIS HAND. Paul did not end his word about leaven with a cleaning rule. He ended it with a Person: {{kjv:1 Corinthians 5:7}} The search for leaven pointed past itself to the Lamb whose sacrifice makes the house new. He is the Lamb of Yahweh, {{kjv:John 1:29}} the Son the Father gave, {{kjv:John 3:16}} the Eternal Son whose throne stands for ever, {{kjv:Hebrews 1:8}} the One by whom all things consist. {{kjv:Colossians 1:17}}`,
  `FOUR THINGS FOR THE HOUSE. One: count what you run, and what each thing carries inside it, before the warning comes. Two: when a warning comes, read each runtime's own version, and put the doors the internet can reach first. Three: patch, then restart, and rebuild every image, because a fix on the disk is not a fix in the running program. Four: if the patch must wait, guard the wall with a written, dated mitigation, pass the warning to everyone who keeps a system, and never trust the work as if it were the Keeper.`,
];

// -----------------------------------------------------------------------------
// The four age bands. Each is an independent composition for its reader.
// -----------------------------------------------------------------------------
const CHILD = `${TITLE}.
WHO SENT THIS. Darrell sent us a warning from a school. The warning was about computers. He wrote one word on top. The word was Lesson. He also asked us to check our own computers, to keep them safe.
THE WORD FIRST. Have you ever helped make bread? You put in a little bit of yeast. Long ago people called it leaven. Paul wrote about it in the Bible. {{kjv:1 Corinthians 5:6}} A lump is a ball of dough. Just a little leaven goes into the whole lump. Then it is in every part. You can not pick it out with your fingers. It is mixed in.
Yahweh told His people to look for old leaven in the whole house. Not just in one spot. {{kjv:Exodus 12:19}} That means look in every room. Look in every corner. Leave none of it in the house.
Yahweh said He would look that way too. {{kjv:Zephaniah 1:12}} Candles were the lights they had long ago. You take a light into the dark corners. Then you can see what is hiding there.
THE WARNING. The warning was about Java. Java is a helper program. It runs lots of other programs. Many games and tools need it. The warning said Java had a weak spot. A bad guy could send a special message. Then he could make the computer do what he wants. The warning gave the bad spot a name. It called it Java4Shell.
WHERE IT HIDES. Here is the tricky part. Java is not in just one place. Some people put Java on the computer on purpose. That one is easy to find. But some programs bring their own Java inside them. Some boxes carry their own Java too. A box like that is called a container. Some machines from the store have Java hidden inside, like a camera box or a time clock. So Java can be in lots of places. It is like leaven mixed into the whole lump.
A PICTURE YOU KNOW. Think about a box of crayons. Say one red crayon was bad. It made marks that would not wash off. You would throw away the red crayon in the box. But wait. Some red crayons are in your desk at school. One is in your backpack. One is in the car. One is in a coloring kit at grandma's house. If you only clean out the box, the bad crayons are still around. You have to look everywhere a crayon could be.
That is what the warning said. Look everywhere Java could be.
It is like a game of hide and seek. You do not stop after you find the first friend. You keep going. You look under the bed. You look behind the door. You look in the closet. The game is not over until you find every one.
STEP ONE, LOOK EVERYWHERE. First you count what you have. The Bible says to know your sheep. {{kjv:Proverbs 27:23}} A good shepherd counts every sheep. A good helper counts every place Java lives. You ask each Java what kind it is. Each one can tell you its number.
STEP TWO, FRONT DOOR FIRST. Nehemiah was building a wall. Some spots were low and easy to climb. He put guards there first. {{kjv:Nehemiah 4:13}} Some programs talk to the whole world on the internet. That is like the low spot in the wall. We fix those first.
STEP THREE, FIX IT AND START AGAIN. Next you put on the fix. The fix comes from the people who made the Java. Then you turn the program off and on again. Why? A program that is running still has the old Java in it. It only gets the new one when it starts again. For a container, you build a new box. Jesus said something like this. {{kjv:Matthew 9:17}} New wine goes in new bottles. A new fix goes in a new box.
STEP FOUR, GUARD IT WHILE YOU WAIT. Sometimes the fix is not ready yet. Then you add a guard. The warning told how to turn off the part the bad guy uses. It is like putting a chair in front of a door with a broken lock. The builders of the wall did this too. {{kjv:Nehemiah 4:17}} One hand did the work. The other hand held a sword. When the real fix comes, you take the chair away.
TELL OTHERS. A watchman is a guard who watches for danger. If he sees danger, he must blow a horn. {{kjv:Ezekiel 33:6}} That is a serious verse. It means if you know about danger, tell the people who need to know. Do not keep it to yourself.
OUR OWN HOUSE. Darrell asked us to check our own computers. So we read our own notes. Our home computer has fifteen kinds of boxes written down. None of them is a Java box. Java is used on a few helper computers. They build our phone app. Those helpers are made new every time. Then they are thrown away. But a helper can still use an older Java it already had. So now we tell the helpers to check for the newest Java every time. But we have not looked inside every box on the home computer. Some boxes were made by other people. So we wrote that down to check. We do not pretend it is done.
YAHWEH KEEPS US. Fixing things is good. Looking everywhere is good. But that is not what keeps us safe in the end. {{kjv:Psalms 127:1}} A watchman is a guard. Yahweh is the one who keeps the city.
JESUS IS THE LAMB. Paul did not stop at the leaven. He talked about Jesus next. {{kjv:1 Corinthians 5:7}} Jesus makes us new. Jesus is the Lamb of Yahweh. {{kjv:John 1:29}} {{kjv:John 3:16}} His throne lasts forever. {{kjv:Hebrews 1:8}} He holds everything together. {{kjv:Colossians 1:17}}
FOUR THINGS TO DO. Count what you have. Look in every corner. Fix it and start it again. And tell the people who need to know. Then thank Yahweh, who keeps us.
${FACTS.child}
${TALK.child}`;

const YOUTH = `${TITLE}.
WHO SENT THIS. Darrell forwarded a security warning from a university's tech office, with one word on top: Lesson. He also asked that we fix our own systems so our own tech stays protected. The warning was about a weak spot in Java, and it told the people who run computers what to do.
THE WORD FIRST. Paul wrote to a church about something small that spreads: {{kjv:1 Corinthians 5:6}} Leaven is yeast. Once you knead it into dough, it is not sitting in one spot anymore. It is through the whole thing. You cannot scoop it back out.
That is why, at the Passover, Yahweh did not just say to throw out the jar of leaven. He said to search the whole house: {{kjv:Exodus 12:19}} Every room. Every shelf. And He said He searches that way Himself: {{kjv:Zephaniah 1:12}} With a light, into the corners nobody wanted to check.
WHAT THE WARNING SAID. The warning called the flaw Java4Shell. It is in the Java runtime. An attacker who never logged in could send a Java app some specially built Base64 data. Then the attacker could run their own code on it. Base64 is a way of turning any data into plain letters and numbers so it can travel in a message. Lots of apps read Base64 from strangers all day, so that is a wide-open path. The warning listed which Java versions were affected and said to check the maker's own advisory for the exact builds.
WHAT A RUNTIME IS. Java programs do not run on the computer by themselves. They run on the Java runtime, a program whose job is to run other programs. So if the runtime has a flaw, every Java program on top of it has the flaw too.
WHERE IT HIDES. Here is the part most people miss. The warning said Java can be installed directly, or bundled with apps, containers and appliances. Installed directly is the copy someone put there on purpose. Bundled with an app means the app brought its own Java in its own folder. Updating the computer's Java does nothing to that copy. A container carries its own Java inside its image. Our course's week one hundred taught that containers share the host's kernel; they do not share what each one packed. An appliance is a box from a company, like a camera recorder or a door system, with Java inside you never installed. That is leaven worked into the whole lump.
A PICTURE YOU KNOW. Think about a phone charger cable that gets recalled because it can overheat. You throw out the one by your bed. Done? Not yet. There is one in the car, one in your backpack, one at a friend's house, and one that came in the box with your headphones. The recall is about the cable, wherever it is. A Java warning works the same way.
STEP ONE, FIND EVERY COPY. The warning says to run each runtime's own version command, in its own folder, to see who made it and its exact version, then compare that against the maker's advisory. Asking the computer which Java it has only tells you about one copy. The Word put it simply long ago: {{kjv:Proverbs 27:23}} You cannot protect what you never counted.
STEP TWO, THE OPEN WALL FIRST. The warning says to start with anything the internet can reach. Nehemiah did the same while his wall was going up: {{kjv:Nehemiah 4:13}} He guarded the low spots first. An app strangers can send data to is the low spot.
STEP THREE, PATCH AND RESTART. Install the fix from whoever made your Java. For Java bundled in an app, get the app maker's update. Then restart, because a running program keeps its old code until it starts again. For containers, the warning says rebuild and redeploy. Restarting an old container just runs the old image with the old Java. Jesus said it this way: {{kjv:Matthew 9:17}} New fix, new image.
STEP FOUR, GUARD WHILE YOU WAIT. If the fix is not ready, the warning gives a startup setting that turns off the shortcut the flaw uses, and then you restart. That is a guard, not a repair. Nehemiah's builders worked like that: {{kjv:Nehemiah 4:17}} One hand building, one hand guarding. Write down when you added the guard, and take it off when the real fix lands.
YOUR OWN PHONE. You already live this. Your phone gets an update. It says it will finish when you restart. You put it off. For days the update just sits there. The whole time, your phone is still running the old code. The fix is on the phone, but it is not in the phone yet. Apps work the same way. A game you play can carry its own pieces inside it, and only the game's maker can fix those pieces. So when a game or an app asks to update, that is the maker sending the fix for what it carries. Let it update. Then close it all the way and open it again. That is this whole lesson in your pocket: find it, fix it, restart it. And if a grown-up in your house runs the family computer or the router, tell them when you hear about a warning. Sometimes the one who hears it first is the youngest one in the house.
PASS IT ON. Once you have read a warning, you are part of the watch: {{kjv:Ezekiel 33:6}} The watchman is not blamed for the danger. He is blamed for staying quiet. So pass the warning to whoever runs each system, and if something looks broken into, tell the people whose job it is.
OUR OWN HOUSE. Darrell asked us to check our own setup, so we read our own files. The home server has fifteen container recipes, and not one names a Java image. Java shows up only on short-lived machines that build our Android app, one asking for Temurin 17 and one for Temurin 21. Those are built fresh each time and thrown away, but they can still grab a slightly older copy of Java that was already sitting on the machine. So the setup now checks for the newest build every time. What we have not checked is whether any image someone else built hides Java deep inside. That takes a search on the home server itself, and it is part of the work being done to protect our stack.
THE BRIGHT LINE. Patching is good work. It is still not what keeps us safe. {{kjv:Psalms 127:1}} The watchman wakes and does his job, and Yahweh keeps the city.
IT IS HIS HAND. Paul's word about leaven ended with a Person: {{kjv:1 Corinthians 5:7}} Jesus is the Lamb of Yahweh, {{kjv:John 1:29}} the Son the Father gave, {{kjv:John 3:16}} the Eternal Son whose throne lasts forever, {{kjv:Hebrews 1:8}} the One who holds all things together. {{kjv:Colossians 1:17}}
FOUR THINGS. Count what you run and what it carries inside. Fix the doors the internet can reach first. Patch, restart, and rebuild every image. Guard the wall while you wait, and pass the warning on.
${FACTS.youth}
${TALK.youth}`;

const TEEN = `${TITLE}.
WHO SENT THIS. Darrell forwarded a university technology office's security notice with one word above it: Lesson. Beside it he asked that we fix our own systems too, so our own stack stays protected. The notice was about a flaw in the Java runtime. It told the people who keep computers to find it, patch it, restart, and guard the wall if the patch had to wait.
THE WORD FIRST. Paul named a pattern every builder should know: {{kjv:1 Corinthians 5:6}} Leaven is yeast. Once it is worked into the dough, it is not an ingredient you can point to. It is part of every bite.
So at the Passover, Yahweh did not say to toss the leaven jar. He said to search the house: {{kjv:Exodus 12:19}} Notice who is covered: the stranger and the native born alike. Notice what is required: none found, anywhere. And Yahweh said He searches the same way: {{kjv:Zephaniah 1:12}} The settled and careless are the ones who never carry the light into the corners.
WHAT THE NOTICE REPORTED. The notice calls the flaw Java4Shell and numbers it CVE-2026-114938. As it states it, an unauthenticated attacker could run code on an affected Java application. The way in is specially crafted Base64 data. Base64 turns any bytes into plain text so they can ride inside a request or a message. So a huge number of programs read it from strangers. The notice lists unpatched Java 17, 21, 25 and 27 builds, plus certain Oracle Java 8 Performance Pack and GraalVM builds, and says the vendor's advisory has the final list.
WHY THE RUNTIME MATTERS. A Java program does not run straight on the machine. It runs on the Java runtime. So a flaw in the runtime is a flaw in every program standing on it.
FOUR PLACES IT HIDES. The notice said Java may be installed directly or bundled with applications, containers and appliances. Installed directly is the copy on purpose, the easy one. Bundled means an app ships its own Java in its own folder, and updating the system's Java never touches it. A container image packs its own runtime. Week one hundred taught that containers share the host kernel; each one still carries its own runtime, so each image has its own copy of the flaw. An appliance is a vendor's box, a door controller or a recorder, with Java you never installed and only the vendor can fix. That is the leaven through the whole lump.
WHY THIS ONE IS HARD. Most fixes are simple. One app, one update. This one is not. One part sits inside many things. So the hard work is not the patch. The hard work is the search. Think of your own laptop. You may have Java you never chose. A game launcher might carry it. A school tool might carry it. A coding app might carry it. Each one has its own copy. Each copy needs its own fix. Some fixes come from the app's maker, not from Java's. So you wait on them, and you guard the door while you wait. That is why the notice gave three steps and not one. Find. Fix and restart. Guard if you must wait. And keep a list as you go. Write down each copy you found, who made it, its version, and what you did. The list is how you know you are done. It is also how the next warning goes faster.
A CASE YOU ALREADY KNOW. A school sends a notice that a peanut-based snack bar was mislabeled. The cafeteria pulls the box from the shelf. But the same bar is in a party bag in one classroom, in the coach's travel kit, in three lunch boxes and in the vending machine. The notice is about the snack, not the shelf. Patching works the same way.
STEP ONE, FIND EVERY COPY. Run that runtime's own java -version, from its own folder, to read its vendor and full version, then compare against the vendor advisory. The command on your path only tells you about one copy. Use a tool that searches every machine. The Word called this knowing your flock: {{kjv:Proverbs 27:23}} No inventory, no defense.
STEP TWO, EXPOSED FIRST. The notice says to start with internet-facing services. Nehemiah set his people where the wall was low and visible: {{kjv:Nehemiah 4:13}} A service any stranger can send Base64 to is your low wall.
STEP THREE, PATCH AND RESTART. Apply your Java vendor's update. For bundled Java, get the application vendor's update instead of swapping their runtime by hand. Then restart, because a running process keeps the code it loaded until it restarts. For containers, rebuild and redeploy. Restarting an old container just reruns the old image. Jesus put the rule in one line: {{kjv:Matthew 9:17}} New runtime, new image.
STEP FOUR, MITIGATE WHILE YOU WAIT. If the patch must wait, the notice gives a startup flag, -XX:-UseBASE64Intrinsics, that turns off the runtime's built-in Base64 shortcut where it is supported; then restart. That is a guard, not a repair. Nehemiah's builders worked armed: {{kjv:Nehemiah 4:17}} Log the mitigation with the date it went on and the date it comes off, and remove it when the patch lands.
SOUND THE TRUMPET. Reading the notice puts you on the watch: {{kjv:Ezekiel 33:6}} The watchman answers for silence, not for the sword. Pass it to whoever owns each system, and report any sign of a break-in to the people whose job is response.
OUR OWN HOUSE. Darrell asked that our stack be protected, so we measured our own files. Fifteen compose files define the home server's containers, and none names a Java image. A search of infra for every common Java runtime name finds only the word JavaScript. Java runs only on short-lived build runners that package our Android app, one asking for Temurin 17 and one for Temurin 21. Those runners are built fresh and thrown away. Still, asked only for a major version, the setup step can use a cached copy that lags the newest release. A separate change makes it check for the latest build every time. The gap we name plainly: a compose file shows the image name, not what a third-party image bundles inside. Only a search on the home server itself can answer that, and it is part of the work being done to protect the stack.
THE BRIGHT LINE. Patching is good stewardship, and it is not the Keeper. {{kjv:Psalms 127:1}} The watchman wakes and works. Yahweh keeps the city.
IT IS HIS HAND. Paul's warning about leaven ends with a Person: {{kjv:1 Corinthians 5:7}} Jesus is the Lamb of Yahweh, {{kjv:John 1:29}} the Son the Father gave, {{kjv:John 3:16}} the Eternal Son whose throne stands forever, {{kjv:Hebrews 1:8}} the One in whom all things hold together. {{kjv:Colossians 1:17}}
FOUR THINGS. Count what you run and what it carries. Fix the exposed doors first. Patch, restart, and rebuild every image. Mitigate with a dated guard while you wait, and pass the warning on.
${FACTS.teen}
${TALK.teen}`;

const SENIOR = `${TITLE}.
WHO SENT THIS. Darrell forwarded a security notice from a university's technology office, with the single word Lesson written above it, and asked beside it that our own systems be put in order as well, so that the technology this house depends on is protected. The notice concerned a flaw in the Java runtime and set out what those who keep computers ought to do about it.
THE WORD FIRST. The apostle Paul was correcting a congregation that had grown proud while it tolerated a wrong among them. He reached for an image every household of his day understood: {{kjv:1 Corinthians 5:6}} Leaven, the portion of old fermented dough kept back and worked into the new, does not remain where it was placed. It passes through the whole batch, and once it has, no hand can separate it again.
That is the reason the Passover command was so thorough. Yahweh did not instruct Israel merely to discard the leaven they kept on purpose; He required that the household be searched until none remained in it: {{kjv:Exodus 12:19}} The requirement reached every dwelling and every person, the stranger as well as the native born. And through the prophet He described His own searching in the same terms: {{kjv:Zephaniah 1:12}} The lamp is carried into the places that the settled and the complacent have preferred not to examine.
WHAT THE NOTICE REPORTED. As the notice itself states it, a flaw which it names Java4Shell, and numbers CVE-2026-114938, could allow an attacker who has never signed in to run code of his own choosing on an affected Java application, by sending it specially prepared Base64 data. Base64 is a long-established way of writing any kind of information as ordinary letters and numerals so that it can travel inside a message or a web request. A great many programs therefore accept it from strangers continually. The notice lists unpatched builds of Java 17, 21, 25 and 27 as affected, together with certain Oracle Java 8 Performance Pack and GraalVM builds, and it directs every reader to the advisory of the company that supplied their own runtime for the definitive list.
WHAT A RUNTIME IS. A program written in Java is not executed by the computer directly; it is executed by the Java runtime, a program whose whole purpose is to run other programs. A defect in the runtime is therefore a defect in every Java program that depends on it.
WHERE IT HIDES. The notice put the difficulty in a single sentence: Java may be installed directly, or it may be bundled with applications, containers and appliances. A copy installed directly is the one somebody chose to put on the machine, and it is the easiest to find. An application may carry its own private copy within its own folder, and updating the machine's Java does nothing whatever to it. A container image carries a runtime of its own as well; the previous week of this course explained that containers share the host's kernel, but each still carries its own runtime, and so each image holds its own copy of the flaw. An appliance may run Java too: a recorder, a door controller or a time clock bought from a supplier. Its owner never installed that Java and may never see it, and only the supplier can correct it. Here is the leaven worked through the whole lump.
AN ILLUSTRATION FROM ORDINARY LIFE. When a manufacturer recalls a medication, a careful household does not stop at the bottle in the bathroom cabinet. It checks the pill organizer on the kitchen table, the travel bag, the bedside drawer, the car's glove box, and the supply kept for a parent who visits. The recall concerns the medicine wherever it has gone, and a runtime warning concerns the runtime wherever it has been carried.
FIRST, FIND EVERY COPY. The notice advises running each runtime's own version command, from that runtime's own folder, to learn its vendor and full version, and comparing the result against the vendor's advisory, with the help of a tool that can search every machine at once. Asking a computer which Java it has reveals only the copy on its default path. The principle is as old as husbandry: {{kjv:Proverbs 27:23}} What has not been counted cannot be guarded.
SECOND, GUARD THE EXPOSED PLACES FIRST. The notice gives priority to services the internet can reach. When Nehemiah's wall stood half finished under threat, he did not distribute his people evenly along it, but stationed them where it was low and exposed: {{kjv:Nehemiah 4:13}} A service that any stranger may send Base64 to is precisely such a place.
THIRD, PATCH AND RESTART. Apply the update supplied by whichever company built the runtime. For bundled Java, obtain the update from the maker of the application rather than replacing the runtime inside another's product by hand. Then restart the program, because a running program retains the code it loaded at its start until it is stopped and started again. For containers, the notice says to rebuild and redeploy, since restarting an old container merely runs the old image with its old runtime. Jesus' own saying fits the case exactly: {{kjv:Matthew 9:17}} A corrected runtime belongs in a freshly built image.
FOURTH, MITIGATE WHILE THE PATCH WAITS. Where a patch cannot yet be applied, the notice offers a temporary startup option, -XX:-UseBASE64Intrinsics, which disables the runtime's built-in shortcut for Base64 where that option is supported, followed by a restart. This is a guard upon the wall and not its repair, after the manner of Nehemiah's builders: {{kjv:Nehemiah 4:17}} Such a measure should be recorded with the date it was applied and the date it is to be withdrawn, and withdrawn when the true correction arrives.
THE DUTY OF THE ONE WHO HAS BEEN WARNED. To have read the notice is to have joined the watch: {{kjv:Ezekiel 33:6}} The watchman is not held answerable for the sword, but for his silence. The warning is therefore to be passed to whoever keeps each affected system, and any sign that a system has already been entered is to be reported to those responsible for responding.
OUR OWN HOUSE. Because Darrell asked that our own systems be protected, the house's own files were examined. The home server's services are defined by fifteen container recipes in this repository, and none of them names a Java image; a search of those folders for every common name of a Java runtime finds nothing but the word JavaScript. Java is used in this house only on short-lived build machines that package the Android app, one requesting Temurin 17 and one Temurin 21. Each is created fresh for a build and discarded afterward. Yet, by the setup tool's own documentation, a machine asked only for a major version may use a copy already cached on it, which can lag the newest release. A separate change now directs it to check for the latest build every time. What remains unanswered is whether any image prepared by others carries a Java runtime within it. Only a search conducted on the home server itself can settle that. It belongs to the separate work now under way to protect the house's systems.
THE BRIGHT LINE. All of this is faithful stewardship, and none of it is our security in the end. {{kjv:Psalms 127:1}} The watchman is right to wake and to work, and it is Yahweh who keeps the city.
IT IS HIS HAND. Paul did not close his word about leaven with a rule of housekeeping but with a Person: {{kjv:1 Corinthians 5:7}} Jesus is the Lamb of Yahweh, {{kjv:John 1:29}} the Son whom the Father gave, {{kjv:John 3:16}} the Eternal Son whose throne endures for ever, {{kjv:Hebrews 1:8}} and the One in whom all things consist. {{kjv:Colossians 1:17}}
FOUR THINGS FOR THE HOUSE. Know what you run and what each thing carries within it. Attend first to what the world can reach. Patch, restart, and rebuild every image. And where the remedy must wait, set a dated guard, pass the warning on, and never mistake the work for the Keeper.
${FACTS.senior}
${TALK.senior}`;

const MODULE = {
  id: ID,
  title: TITLE,
  bigIdea: `${TITLE.toUpperCase()}.
WHO SENT THIS. Darrell forwarded a university's technology security notice with ONE WORD typed above it: Lesson, and asked that our own systems be fixed too, so our own stack is protected. It warned of a flaw in the Java runtime that hides inside other things.
THE WORD FIRST. 1 Corinthians 5:6 opens the hour - a little leaven through the whole lump - with Exodus 12:19 beside it - no leaven found in your houses, every room searched. {{kjv:1 Corinthians 5:6}} {{kjv:Exodus 12:19}}
THE TEACHING. A flaw in a shared runtime is in every program that stands on it, and the runtime hides: installed directly, bundled inside applications, packed inside container images, and built into appliances. The watchman's work is four steps: find every copy by reading each runtime's own version; fix the doors the internet can reach first; patch, restart and rebuild every image; and when the patch must wait, guard the wall with a dated mitigation. Then pass the warning on.
THE BRIGHT LINE. No patch is the Keeper. {{kjv:Psalms 127:1}}
THE TIERS. REPORTED by one institutional notice: the flaw's name and number, the affected builds and the temporary startup option. ESTABLISHED: bundled runtimes, restart and rebuild. MEASURED: our fifteen container recipes name no Java image; Java runs only on short-lived build runners. NOT VERIFIED: whether any third-party image hides Java inside. ${REVIEW}.
PLACEMENT. Sovereign A.I., week 101, because a house that runs its own services on its own machines keeps its own watch.
CLOSE. {{kjv:1 Corinthians 5:7}} Jesus, the Lamb of Yahweh and the Eternal Son, makes the house new.`,
  inApp: `One screen to read in this app, and one page in your Study.
In the app: open Sovereign A.I. week 101 and read the band that fits the reader in front of you - the lesson carries all four, child, youth, teen and senior, and each one is whole on its own.
In your Study, write three lines. One thing you run that carries something inside it you have never looked at. One door the whole internet can reach. One warning you have read and not yet passed on. {{kjv:1 Corinthians 5:6}}`,
  anchor: {
    ref: 'FILLED FROM THE TOKENS',
    theme: `{{kjv:1 Corinthians 5:6}} {{kjv:Exodus 12:19}} {{kjv:Zephaniah 1:12}} {{kjv:Proverbs 27:23}} {{kjv:Matthew 9:17}} {{kjv:Nehemiah 4:17}} {{kjv:Ezekiel 33:6}}`,
  },
  rpe: {
    research: `RESEARCH. Three readings, each landing on your own work.
First, read 1 Corinthians 5:6-8. Mark what a little leaven does to the whole lump, and where Paul's word ends: with Christ our passover. Write one sentence on something small in your life that has spread through everything.
Second, read Exodus 12:15-20. Write down who the search covered, and how much leaven was allowed to remain.
Third, read Nehemiah 4:13-18. Write down where Nehemiah put his people first, and how the builders worked while the danger was near.
And one verification reading, because this course works this way. The flaw's name, number, affected builds and startup option are reported by one notice and are checked against the vendor's own advisory. That runtimes hide inside applications, images and appliances is established. Our own container recipes are measured from our files. Whether any third-party image hides Java inside is not verified.`,
    plan: `PLAN. Decide four steps before the week starts, and decide who hears them.
One: the count. List the programs, apps and devices you depend on, and for three of them, find out what they carry inside.
Two: the open wall. Name the one thing you run that the whole internet can reach.
Three: the restart. Find one update you installed and never restarted for, and decide when you will.
Four: the trumpet. Name one person who keeps a system you depend on, and decide how you will pass a warning to them.
Then name the person who will ask you about all four on the same day next week.`,
    execute: `EXECUTE. Keep it for one week, out loud, with one other person.
Restart the device or program you have been putting off, and check that the update took.
Teach the verse at a meal: a little leaven leaveneth the whole lump. Ask a child where a hidden thing could be in your house.
At the end of the week, answer three questions to the person who is asking. What did you count? What did you restart? Who did you warn?
Measure the growth the Word's way - by the fruit, by the occasions, and by the days.`,
  },
  media: [],
  benefits: [
    `Darrell's one word, Lesson, over a security notice, answered from the Word, with his ask that our own stack be protected carried into the lesson as a measured finding.`,
    `The hour opened in the lump, 1 Corinthians 5:6, before any word about a runtime.`,
    `Exodus 12:19: the whole house searched, every room, the stranger's and the native's alike.`,
    `What a runtime is, taught as the yeast every program rises on.`,
    `The four hiding places named: installed directly, bundled in applications, packed in container images, built into appliances.`,
    `Find every copy: read each runtime's own version, not the one on the path (Proverbs 27:23).`,
    `The open wall first: internet-facing services before the rest (Nehemiah 4:13).`,
    `Patch, restart and rebuild: a fix on the disk is not a fix in the running program (Matthew 9:17).`,
    `A dated mitigation while the patch waits, a guard and not a repair (Nehemiah 4:17).`,
    `The watchman answers for silence: pass the warning on (Ezekiel 33:6).`,
    `Our own fifteen container recipes measured from the repository, and the honest gap inside third-party images named.`,
    `Jesus confessed as our passover, the Lamb of Yahweh and the Eternal Son (1 Corinthians 5:7).`,
    `The reported, the established, the measured and the unverified told apart in every reader place, with a dated re-review.`,
  ],
  stories: [
    {
      kind: 'parable',
      tone: 'light',
      verse: 'Exodus 12:19',
      title: 'The flour recall',
      body: `ILLUSTRATIVE, NOT A REAL EVENT. A grandmother heard on the radio that a brand of flour was being recalled. She went straight to the pantry, found the bag, and set it by the door to go back to the store. Done, she said.
Her grandson, who was staying the week, asked a question she had not thought of. Grandma, what did you bake with it? They stood in the kitchen and counted. There were cookies in the tin. There was a pie crust in the freezer. There was a jar of her own pancake mix, made from that very bag. There was a loaf she had given to the neighbor on Sunday.
They spent the afternoon finding every place the flour had gone. They walked next door with a fresh loaf and an apology. By supper the house was clear, and the grandmother laughed and said the bag was the easy part. It was everything the bag had turned into that took the afternoon.`,
    },
    {
      kind: 'parable',
      tone: 'solemn',
      verse: 'Ezekiel 33:6',
      title: 'The time clock in the back room',
      body: `ILLUSTRATIVE, NOT A REAL EVENT. A small manufacturer received a warning about a flaw in a runtime that many programs use. The office manager, who also kept the computers, updated the runtime on the office server that same afternoon, restarted it, and marked the warning done.
She did not know that the time clock in the back room, the one every worker badged into, ran its own copy of that runtime inside it, and that the vendor had put it on the internet so the owner could read the hours from home. The vendor had shipped a fix. Nobody had applied it, because nobody knew the clock was a computer.
Weeks later a stranger used that clock as a way in. The manager told the owner everything, plainly. Then she did what she had skipped: she walked every room with a list, wrote down every device that ran anything, and asked each vendor what it carried inside. She said afterward that she had read the warning, and that reading it had made the clock hers to find.`,
    },
  ],
  quiz: {
    questions: [
      {
        q: 'What does 1 Corinthians 5:6 say a little leaven does?',
        options: ['It stays in one corner of the dough', 'It leaveneth the whole lump', 'It makes the bread smaller'],
        answer: 1,
        explain:
          'Once leaven is worked into dough it is through every part of it. A flaw in a shared runtime is the same: it is in every program that stands on it.',
      },
      {
        q: 'In Exodus 12:19, how much leaven could be found in the houses during the seven days?',
        options: ['Only a little, kept in a jar', 'None at all, in any house', 'Whatever the stranger kept'],
        answer: 1,
        explain:
          'No leaven found in your houses, for the stranger and the one born in the land alike. The search covered every room, not only the obvious place.',
      },
      {
        q: 'What is a Java runtime?',
        options: ['A kind of coffee', 'The program that runs Java programs, so a flaw in it is in every program on it', 'A website'],
        answer: 1,
        explain: 'Java programs do not run straight on the computer. They run on the Java runtime, so the runtime is the yeast every one of them rises on.',
      },
      {
        q: 'According to the notice, where can Java hide besides being installed directly?',
        options: ['Nowhere else', 'Bundled with applications, containers and appliances', 'Only on phones'],
        answer: 1,
        explain:
          'An application can carry its own copy, a container image packs its own, and an appliance runs one you never installed. Updating the system copy fixes none of those.',
      },
      {
        q: 'Why does the notice say to run that runtime’s own java -version?',
        options: [
          'Because the copy on the path only tells you about one copy, and each hidden copy has its own vendor and version',
          'Because it installs the patch',
          'Because it deletes Java',
        ],
        answer: 0,
        explain:
          'Each runtime reports its own vendor and full version. You compare that against the vendor’s advisory, one copy at a time, with a search tool to find them all.',
      },
      {
        q: 'Which services does the notice say to fix first?',
        options: ['The oldest ones', 'Internet-facing services', 'The ones nobody uses'],
        answer: 1,
        explain: 'Like Nehemiah setting people at the low places of the wall (Nehemiah 4:13), the services any stranger can send data to are fixed first.',
      },
      {
        q: 'Why must a program be restarted after the patch is applied?',
        options: [
          'Restarting is only a habit',
          'A running program keeps the old code it loaded until it is stopped and started again',
          'The patch deletes the program',
        ],
        answer: 1,
        explain:
          'A fix on the disk does not reach a program already running. And for a container, restarting reruns the old image, so the image is rebuilt and redeployed.',
      },
      {
        q: 'What does Matthew 9:17 teach that fits a container image?',
        options: ['New wine goes into new bottles', 'Old bottles are always better', 'Wine should not be stored'],
        answer: 0,
        explain: 'A fixed runtime goes into a rebuilt image, and the old image is retired, so both are kept sound.',
      },
      {
        q: 'What is a temporary mitigation, like the startup option in the notice?',
        options: [
          'A permanent fix',
          'A guard on the wall while the patch waits, recorded with a date and removed when the patch lands',
          'A way to ignore the warning',
        ],
        answer: 1,
        explain: 'Nehemiah’s builders worked with one hand and held a weapon with the other (Nehemiah 4:17). A mitigation guards; it does not repair.',
      },
      {
        q: 'According to Ezekiel 33:6, what is the watchman answerable for?',
        options: ['For the sword coming', 'For seeing the sword and not blowing the trumpet', 'For building the wall alone'],
        answer: 1,
        explain:
          'The watchman is not blamed for the danger but for the silence. Whoever reads a warning passes it to everyone who keeps an affected system, and Yahweh, not the watchman, keeps the city.',
      },
    ],
  },
  facilitator: {
    howToRun: `SIXTY MINUTES, AND THE WORD OPENS IT. Read 1 Corinthians 5:6-7 and Exodus 12:19 aloud before you say one word about any computer. Then hold up a loaf of bread and ask the room: where is the yeast in this loaf?
MINUTES 0 TO 12 - THE LUMP. 1 Corinthians 5:6 and Exodus 12:19. Ask: why did Yahweh require the whole house to be searched, and not just the leaven jar thrown out? Zephaniah 1:12 for the candles.
MINUTES 12 TO 24 - THE NOTICE AND THE RUNTIME. What the notice reported, as reported. What a runtime is. The four hiding places: installed, bundled, in an image, in an appliance.
MINUTES 24 TO 40 - THE FOUR STEPS. Find every copy (Proverbs 27:23). The open wall first (Nehemiah 4:13). Patch, restart, rebuild (Matthew 9:17). Mitigate with a dated guard while the patch waits (Nehemiah 4:17).
MINUTES 40 TO 50 - THE TRUMPET AND OUR HOUSE. Ezekiel 33:6: the one who reads the warning passes it on. Then our own files: fifteen container recipes, no Java image named, Java only on short-lived build runners, and the open question inside third-party images.
MINUTES 50 TO 60 - HIS HAND. Psalms 127:1 for the bright line. 1 Corinthians 5:7, John 1:29, John 3:16, Hebrews 1:8 and Colossians 1:17. Give the four household habits and the week's assignment.
WHAT NOT TO DO. Do not state the notice's details as tested; they are reported by one notice and checked against each vendor's advisory. Do not tell anyone to swap the runtime inside a vendor's product by hand. Do not teach the startup option as a fix; it is a temporary guard. Do not name the university or its contacts. Do not teach outage or business continuity here; that is another lesson. Do not let the machinery stand over the Word; the Word frames the hour.`,
    talkingPoints: [
      `A little leaven leaveneth the whole lump (1 Corinthians 5:6).`,
      `No leaven found in your houses, for the stranger and the native alike (Exodus 12:19).`,
      `I will search Jerusalem with candles (Zephaniah 1:12).`,
      `A flaw in the runtime is in every program on it.`,
      `Installed, bundled, in an image, in an appliance.`,
      `Read each runtime's own version; know the state of thy flocks (Proverbs 27:23).`,
      `The low places of the wall first (Nehemiah 4:13).`,
      `Patch, restart, rebuild: new wine into new bottles (Matthew 9:17).`,
      `A dated guard while the patch waits (Nehemiah 4:17).`,
      `The watchman answers for silence (Ezekiel 33:6).`,
      `Our recipes name no Java image; the inside of others' images is still to be searched.`,
      `Except Yahweh keep the city (Psalms 127:1); Christ our passover (1 Corinthians 5:7).`,
    ],
    discussionPrompts: [
      `What in your life carries something inside it that you have never looked at?`,
      `When have you fixed the obvious copy and missed the hidden one?`,
      `Which of your devices or programs can the whole internet reach?`,
      `What update have you installed and never restarted for?`,
      `Whose warning have you read and not yet passed on?`,
      `How does 1 Corinthians 5:7 change what the search for leaven means?`,
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
console.log(`sov101: adult prose words ${adultWords} fk ${fk(filled.lesson).toFixed(2)}`);
for (const b of FOUR_BANDS) {
  console.log(
    `sov101: ${b} words ${words(filled.levels[b])} share ${(words(filled.levels[b]) / adultWords).toFixed(3)} fk ${fk(filled.levels[b]).toFixed(2)} overlap-adult ${overlapOf(filled.levels[b], filled.lesson).toFixed(3)}`
  );
}
for (let i = 0; i < FOUR_BANDS.length; i += 1) {
  for (let j = i + 1; j < FOUR_BANDS.length; j += 1) {
    console.log(`sov101: overlap ${FOUR_BANDS[i]}~${FOUR_BANDS[j]} ${overlapOf(filled.levels[FOUR_BANDS[i]], filled.levels[FOUR_BANDS[j]]).toFixed(3)}`);
  }
}
const faults = fourBandFaults(filled);
// --dry measures and reports, and writes nothing.
if (process.argv.includes('--dry')) {
  console.log(faults.length ? faults.join('\n') : 'sov101: no four-band faults');
  process.exit(0);
}
if (faults.length) {
  console.error(faults.join('\n'));
  throw new Error('sov101: refusing to splice a lesson that fails the four-band ladder');
}

// -----------------------------------------------------------------------------
// Splice
// -----------------------------------------------------------------------------
const OPEN = 'export const SOVEREIGN_AI_MODULES = [';
let src2 = readFileSync(CATALOG, 'utf8');
let end2 = src2.indexOf('\n];', src2.indexOf(OPEN));
if (end2 < 0) throw new Error('sov101: could not find the end of SOVEREIGN_AI_MODULES');

if (src2.includes(ID)) {
  if (!process.argv.includes('--rebuild')) throw new Error(`sov101: ${ID} is already in the catalog; pass --rebuild to replace it`);
  const from = src2.indexOf(`  {\n    "id": "${ID}"`);
  if (from < 0) throw new Error('sov101: the id is in the file but not as a module literal; refusing to rebuild');
  const withComma = src2.indexOf('\n  },', from);
  const atArrayEnd = src2.indexOf('\n  }\n];', from);
  const ends = [
    withComma >= 0 && withComma < end2 ? { at: withComma, len: '\n  },'.length, back: 0 } : null,
    atArrayEnd >= 0 && atArrayEnd < end2 ? { at: atArrayEnd, len: '\n  }'.length, back: ','.length } : null,
  ]
    .filter(Boolean)
    .sort((a, b) => a.at - b.at);
  if (!ends.length) throw new Error('sov101: could not find the end of the existing block; refusing to rebuild');
  const { at: closeAt, len, back } = ends[0];
  const excised = src2.slice(from, closeAt + len);
  if (excised.split('"id":').length - 1 !== 1) {
    throw new Error(`sov101: the block to excise holds ${excised.split('"id":').length - 1} ids, expected 1; refusing to rebuild`);
  }
  src2 = src2.slice(0, from - back) + src2.slice(closeAt + len);
  end2 = src2.indexOf('\n];', src2.indexOf(OPEN));
  if (end2 < 0) throw new Error('sov101: the array is not closed after excising; refusing to rebuild');
  if (src2.includes(ID)) throw new Error('sov101: the id survived the excision; refusing to rebuild');
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
if (after.length !== before.length + 1) throw new Error(`sov101: week count went ${before.length} -> ${after.length}, expected exactly one more`);
if (before.includes(WEEK)) throw new Error(`sov101: week ${WEEK} is already taken`);
if (after[after.length - 1] !== WEEK) throw new Error(`sov101: week ${WEEK} is not the top of the course after splicing`);
const occurrences = next.split(`"${ID}"`).length - 1;
if (occurrences !== 1) throw new Error(`sov101: the new id appears ${occurrences} times, expected exactly once`);

writeFileSync(CATALOG, next);

const refs = filled.anchor.ref
  .split(';')
  .map((s) => s.trim())
  .filter(Boolean);
for (const r of refs) verseText(r);
console.log(`sov101: spliced ${ID}`);
console.log(`sov101: modules ${before.length} -> ${after.length}; top week ${after[after.length - 1]}`);
console.log(`sov101: ${refs.length} references on the anchor, every one quoted in a reader place and resolving in the corpus`);
