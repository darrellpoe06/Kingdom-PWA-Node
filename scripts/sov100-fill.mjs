// =============================================================================
// sov100-fill - build Sovereign A.I. week 100 and splice it into the catalog
// =============================================================================
// WHY A GENERATOR AND NOT TYPING (binding, DR-0076 / DR-0456 / DR-1468). Every
// quoted verse on this page is FILLED FROM app/public/bible/kjv at build time,
// through scripts/lib/kjv.mjs. The prose holds only a token, {{kjv:Genesis 6:14}},
// and this script replaces it with the corpus text followed by the reference.
// No verse on the page was typed from memory. anchor.ref is DERIVED from the
// tokens that occur in the reader places (DR-0734).
//
// WHERE THE WORD CAME FROM. Darrell forwarded a system-design newsletter on
// virtual machines and containers into the lesson lane with ONE WORD above it:
// Lesson. Gmail thread `1a2087dce8e004bd`. Built 2026-11-23. His note on the
// forward, rendered for meaning (DR-0331): keep or make pictures that carry the
// explanation and its setting. So this week carries three authored diagrams
// (app/src/components/lesson-diagrams.jsx). The newsletter's name, sponsor and
// links are left out; the lesson needs none of them.
//
// ONE TEACHING, ONE LESSON (DR-0610). lesson-already-built.mjs --thread found
// only a SOURCE match (other articles from the same kind of newsletter), no
// lesson on virtual machines, containers, hypervisors or a shared kernel. The
// neighbors are DECLARED in the lesson: sov70 teaches every household building
// the wall over against its own house (Nehemiah 3); sov47 teaches maintenance
// left undone; the infrastructure course teaches what the NAS is. Leviticus 14,
// the plague in the walls, is the spine of the inspections course and is left
// to it. This week owns ONE thing: how much is SHARED under the walls - many
// rooms in one ark on one hull, or separate houses on separate foundations -
// and choosing by what truly needs keeping apart.
//
// WORD FIRST (DR-0127 / DR-0282). Genesis 6:14 and Psalms 11:3 frame the hour
// before a word about a kernel.
//
// TRUST BUT VERIFY (DR-0100 / DR-0076 section 8). The forward is a newsletter:
// trusted for the shape of the teaching, verified before it is stated as ours.
// ESTABLISHED, stated plainly: a virtual machine runs its own kernel; a
// container is an isolated process on the host and shares the host's kernel;
// Linux builds containers from namespaces and control groups (the kernel's own
// manual pages, namespaces(7) and cgroups(7)); a Linux container needs a Linux
// kernel. REPORTED by the newsletter and repeated as reported: modern virtual
// machines run near native speed; most cloud servers run bare-metal
// hypervisors; the hybrid tools trade speed or compatibility for isolation.
// MEASURED in our own house, from infra/ in this repository: 15 compose files;
// none runs a container privileged; none mounts the container engine's control
// socket; 2 set no-new-privileges; 1 drops capabilities; 3 share the host's
// network on purpose, each with its reason written beside it; no hypervisor or
// virtual machine layer is described anywhere in infra/; at least one house
// service (the tax upload server) runs as a plain service bound to the box's
// own loopback, in no container at all. NOT VERIFIED: what is actually running
// on the home server today (this build cannot see it), and how current its
// kernel is. re-review: 2026-12-07.
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

const WEEK = 100;
const ID = 'sov100-rooms-shalt-thou-make-in-the-ark';
const TITLE = 'Rooms shalt thou make in the ark - virtual machines, containers, and the foundation they share';

// -----------------------------------------------------------------------------
// The corpus: one verse per token, read from the KJV files on disk
// -----------------------------------------------------------------------------
function verseText(ref) {
  const r = String(ref).trim();
  if (!/^(.+?)\s+(\d+):(\d+)$/.test(r)) throw new Error(`sov100: reference is not Book C:V -> "${r}"`);
  const t = kjvText(r, KJV);
  if (!t) throw new Error(`sov100: reference does not resolve in the corpus -> "${r}"`);
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
  lesson: `WHERE WE STAND ON THE FACTS. ESTABLISHED, and stated plainly: a virtual machine runs its own operating system, kernel included; a container is an isolated process on the host and shares the host's kernel; on Linux, containers are built from the kernel's own namespaces and control groups, which the kernel's manual pages document; and a Linux container needs a Linux kernel underneath it. REPORTED by the newsletter, and repeated as reported: modern virtual machines run close to native speed; most servers and clouds run bare-metal hypervisors; and the tools that blend the two give up some speed or compatibility for the stronger wall. MEASURED in our own house, from the service files in this repository: fifteen container recipes; none runs a container with full privileges; none hands a container the engine's control socket; two forbid a process from gaining new privileges; one drops network powers it does not need; three share the host's network on purpose, each with its reason written beside it; no virtual machine layer is described at all; and at least one service runs as a plain program on the box, listening only to the box itself. NOT VERIFIED: what is actually running on the home server today, which this build cannot see, and how current its kernel is. ${REVIEW}.`,
  child: `WHAT IS SURE AND WHAT IS NOT. Some things here are sure. A machine in a machine has its own floor. A box shares the floor of the big computer. Some things were told to us by the newsletter, and we did not test them. We read our own house's notes. Our boxes do not get full power. A few have extra locks. Most do not have the extra locks yet. We can not see the home computer from here. So what runs on it today is not verified. We will look again. ${REVIEW}.`,
  youth: `WHAT IS SURE AND WHAT IS NOT. Sure: a virtual machine brings its own kernel, and a container borrows the host's. Told to us by the newsletter, not tested by us: how close to full speed a virtual machine runs, and how most clouds are built. Measured in our own files: fifteen container recipes, none with full power, two with an extra lock against gaining power, one that drops powers it does not need, and three that share the host's network for a reason written down. Not verified: what runs on the home server today, and how up to date its kernel is. ${REVIEW}.`,
  teen: `WHAT IS SURE AND WHAT IS NOT. Sort every claim. Established: a virtual machine runs its own kernel; a container shares the host's; Linux builds containers from namespaces and cgroups. Reported by the newsletter: near-native speed for virtual machines, and how most clouds run. Measured in our repo: fifteen compose files, none privileged, none handed the engine's socket, two with no-new-privileges, one dropping capabilities, three on host networking with a written reason, and no virtual machine layer at all. Not verified: what is running on the home server right now, and its kernel version. ${REVIEW}.`,
  senior: `WHERE WE STAND ON THE FACTS. That a virtual machine runs its own kernel, that a container shares the host's, and that Linux assembles containers from namespaces and control groups are established and documented in the kernel's own manual pages. The newsletter's statements about near-native speed and about how most clouds are built are repeated as reported and were not tested here. What this lesson says of the house is traced to its own service files: fifteen container recipes, none with full privileges, none given the engine's control socket, two that forbid gaining new privileges, one that drops unneeded network powers, three that share the host's network for stated reasons, and no virtual machine layer described. What actually runs on the home server today, and how current its kernel is, are not verified, and no conclusion is drawn about them. ${REVIEW}.`,
};

const RHYTHM =
  'Do it once today, in one of the four places of Deuteronomy 6:7 - at the table, on the way, at lying down, or at rising up - and with one friend this week.';

const GROWTH =
  'And measure the growth the Word’s way, by the fruit, {{kjv:Galatians 5:22}} by the occasions, {{kjv:Deuteronomy 6:7}} and by the days. {{kjv:Hebrews 3:13}}';

const TALK = {
  lesson: `TALK ABOUT IT TOGETHER. Parents, sit with one of your children today and ask them one open question - what in our house do we all share, that would hurt everyone if it broke - and listen all the way to the end before you add a single word; have them retell their own answer in their own words, then teach them one verse back, Genesis 6:14. Children, ask your mother, your father or a grandparent about a time they shared a house, a room or a wall with another family, and what it took to live well that close; hear the whole of it before you reply, then retell their story back to them in your own words. Then ask a friend this: what in our work needs its own house, and what is fine as a room. Teach each other one verse. ${RHYTHM} ${GROWTH}`,
  child: `TALK ABOUT IT TOGETHER. Parents, ask your child one thing today - if our house had one big floor, what would happen if the floor broke - and listen all the way to the end before you talk; have them say it back to you in their own words, then teach them one verse, Genesis 6:14. Children, ask your mom or your dad or your grandma or your grandpa if they ever shared a room, and how they kept their things apart. Let them tell the whole story. Then tell it back to them in your own words. Then ask a friend this: what do we share that we should take care of together. Teach each other one verse. ${RHYTHM}`,
  youth: `TALK ABOUT IT TOGETHER. Parents, ask your child one open question today - which app or game would you trust to share your phone with a stranger's app - and listen all the way to the end before you fix anything; have them retell the answer in their own words, then teach them one verse, Psalms 11:3. Children, ask your mom, your dad or a grandparent about the first apartment or shared house they lived in, and what the thin walls taught them; hear the whole of it before you answer, then retell their answer in your own words. Then ask a friend this: what would we never let into the same room as our own things. Teach each other one verse. ${RHYTHM} ${GROWTH}`,
  teen: `TALK ABOUT IT TOGETHER. Parents, ask your child one open question today - when you run something you did not write, how far could it reach if it went bad - and listen all the way to the end instead of answering it for them; have them retell their own answer back to you in their own words, then teach them one verse, Proverbs 22:3. Children, ask your mom, your dad or a grandparent about a time one person's trouble spread to the whole household, and what they changed after; hear the whole of it before you reply, then retell their answer in your own words. Then ask a friend this: which of our walls are real, and which are only labels. Teach each other one verse. ${RHYTHM} ${GROWTH}`,
  senior: `TALK ABOUT IT TOGETHER. Grandparents, ask the young people in your house one open question today - what do you keep on your devices that you would not want a stranger's program to reach - and listen all the way to the end, without finishing a sentence for them; have them retell their own answer in their own words, then teach them one verse back, Psalms 11:4. Children, ask your parents or your grandparents about the houses they have lived in, which ones shared a foundation or a wall with neighbors, and what that meant in a storm; hear the whole of it before you reply, then retell it back to them in your own words. Then ask a friend this: where are we trusting a wall we have never tested. Teach each other one verse. ${RHYTHM}`,
};

// -----------------------------------------------------------------------------
// The adult lesson. The Word opens it, and no word about a kernel stands above
// that frame.
// -----------------------------------------------------------------------------
const LESSON = [
  `${TITLE.toUpperCase()}.
WHO SENT THIS. Darrell forwarded a system-design newsletter into this lane with ONE WORD typed above it: Lesson. Beside it he asked that the lesson keep or make pictures that carry the explanation and its setting, so this week comes with three diagrams. The newsletter asked a plain question: virtual machines and containers both let many jobs share one computer, so what is the real difference? Its name, its sponsor and its links are left out; the teaching needs none of them.`,
  `THE WORD FIRST, IN THE ARK. Before there was a server, Yahweh gave a builder a plan for one vessel that would carry many lives at once: {{kjv:Genesis 6:14}} Rooms shalt thou make in the ark. One hull, many rooms. The rooms kept the living things apart, each in its place, and every room rode on the same hull. If the hull held, every room was carried. If the hull had failed, no wall between the rooms would have saved anyone. That is why the same verse says the ark was pitched within and without: the hull was the one thing every room shared, so the hull was sealed on both sides.
The plan had layers too: {{kjv:Genesis 6:16}} Lower, second and third stories, one built on another, with one door set in the side.
Then David asked the question this lesson turns on: {{kjv:Psalms 11:3}} A wall between two rooms is only as good as the foundation under both of them. And David answered his own question in the next breath: {{kjv:Psalms 11:4}} The foundation we build is never the last foundation. Yahweh is on His throne, and His eyes try the children of men.`,
  `ONE SERVER, TWO WAYS TO MAKE ROOMS. Picture one server running three jobs for a household: a web service people use, a database that holds the records, and a background worker that does chores at night. Each needs its own files, its own network settings and its own share of the machine. There are two main ways to keep them apart.
The first is the VIRTUAL MACHINE. A layer of software called a hypervisor divides the real machine's processor, memory, storage and network into pretend hardware, and each virtual machine boots a whole operating system on it, kernel included. Three jobs means three operating systems on one server. Each one behaves like its own computer. That is three houses, each on its own foundation, standing on one plot of land.
The second is the CONTAINER. A container is not a separate computer. It is an ordinary process on the host that the kernel has walled in. The host's one kernel gives each container its own view of processes, network and files, limits how much processor and memory it may use, and restricts what it may touch. Three jobs means three containers, and all three stand on the same kernel. That is three rooms in one ark, on one hull.
The whole difference fits in one sentence: virtual machines run separate kernels, and containers share one. The first diagram on this page draws both side by side.`,
  `WHAT THE KERNEL IS. The kernel is the core of an operating system. It is the part that actually talks to the processor, the memory and the disks, and every program on the machine has to ask it for everything it does. Opening a file is a request to the kernel. Sending a message on the network is a request to the kernel. So the kernel is the foundation in the plainest sense: every room stands on it, and every room asks it for help many times a second.`,
  `WHAT THE SHARED FOUNDATION CHANGES. That one choice shapes almost everything else.
Starting. A container has no operating system to boot, so it usually starts in a moment. A virtual machine boots a whole system first. A container can still be slow when it must download a large image or warm up a heavy program.
Fitting. Every virtual machine carries its own system, its own memory and its own disk, even to run one small chore. Containers share the kernel, so many more of them fit on the same hardware.
Speed. Lighter is not the same as faster. The newsletter reports that modern virtual machines run close to native speed, because the processor itself helps. A web service does not answer faster just because it lives in a container.
Systems. A virtual machine can run a different operating system from its host, so Windows and Linux can sit side by side. A container cannot bring its own kernel, so a Linux container needs a Linux kernel. On a Windows or Mac computer, Linux containers usually run inside a hidden Linux virtual machine.
The land is limited, the way it was for two households in Genesis: {{kjv:Genesis 13:6}} That is the job of the control groups: they keep one room from eating the whole field, so the others can still live.`,
  `HOW FAR A PROBLEM CAN SPREAD. Say the background worker is broken into. Can the intruder reach the web service and the database on the same server?
With virtual machines, the worker has its own kernel. To reach the others, the intruder must break a second wall: the hypervisor, or a mistake in how it was set up. The foundation under the next house is not the foundation they broke.
With containers, the worker shares the host kernel with the web service and the database. A flaw in that kernel, or a careless setting, can let the intruder climb out of the room and reach every room on the hull. That is David's question in a machine: if the foundations be destroyed, the walls on top of them do not hold. The second diagram draws exactly this.
So containers need extra care. Give each container only the powers it needs, and no more. Forbid it from gaining new powers once it is running. Limit which kernel requests it may make. Map the container's own administrator to a powerless user on the host. These steps lower the risk a great deal. They do not remove the shared kernel. The wise builder sees that and plans for it: {{kjv:Proverbs 22:3}}`,
  `BOTH, TOGETHER. The two are not rivals. Some tools blend them: very small virtual machines that start almost as fast as containers; containers that each get their own small virtual machine and their own kernel; and a kernel written as an ordinary program that stands between a container and the real kernel and answers most of its requests itself. These give a stronger wall, and they cost some speed or some compatibility.
Most large systems simply stack them, the way the ark had stories: the server, then a hypervisor, then virtual machines, then containers inside each virtual machine. The virtual machines keep the strong walls between whole environments. The containers make each program easy to package and move. The third diagram draws the stack from the ground up.`,
  `CHOOSE BY WHAT NEEDS KEEPING APART. The newsletter ended where a builder should start. Neither one is better in itself. Choose a virtual machine when you need the strongest wall, a different operating system, or an old program that wants its own world. Choose containers when the programs are your own, you trust them, and you want them light, quick and easy to move. And when a stranger's code must run on your machine, give it its own foundation. Count the cost of each wall before you build it: {{kjv:Luke 14:28}} A wall you do not need is weight you carry for nothing. A wall you need and did not build is a door you left open.`,
  `THE BRIGHT LINE. Every wall in this lesson is good craftsmanship, and none of them is safety itself. A hypervisor can have a flaw. A kernel can have a flaw. The best builder still answers to this: {{kjv:Psalms 127:1}} The watchman is not useless; he is told to wake. But he does not keep the city by himself. We build the walls with Wisdom and Understanding, and we never mistake our walls for the hand that keeps us. Psalm eleven asked what the righteous can do when the foundations fail, and its answer was not a better foundation. It was Yahweh on His throne.`,
  `OUR OWN HOUSE, MEASURED, NOT PAINTED. This is not only a lesson about other people's servers. The services of this house run as containers on our own machines, so the choice is ours too. Here is what our own files show. There are fifteen container recipes in this repository. None of them runs a container with full privileges over the host. None hands a container the control socket of the container engine, which would be a key to every room. Two of the fifteen forbid a process from gaining new privileges, and one drops network powers it does not need. Three share the host's network directly, on purpose, and each says why right beside it: two need to find devices on the home network, and one is a build runner that must see the local network. Nothing in our files describes a virtual machine layer, so our containers stand on the host's one kernel. And at least one service, the tax upload server, is not in a container at all: it runs as a plain program on the box and listens only to the box itself.
So the honest picture is this: we have shut the worst doors, and most of our rooms do not yet have the extra locks. That is recorded as work, with a date to come back to it, not painted over. What actually runs on the home server today, and how current its kernel is, this build cannot see.`,
  `WHAT IS NEW HERE. One teaching, one lesson. Week seventy of this course teaches every household building the wall over against its own house. Week forty-seven teaches the wall that falls when upkeep is put off. The infrastructure course teaches what the home server is. This week takes up what none of them do: how much is shared under the walls, and how far a problem can travel when the foundation itself is shared.`,
  `IT IS HIS HAND. No foundation we pour is the last one. The Son is the One through whom all of it holds together. He is the Lamb of Yahweh, {{kjv:John 1:29}} the Son the Father gave, {{kjv:John 3:16}} the Eternal Son whose throne stands for ever, {{kjv:Hebrews 1:8}} the One by whom all things consist. {{kjv:Colossians 1:17}}`,
  `FOUR THINGS FOR THE HOUSE. One: know what your rooms share; a container shares the host's kernel, and a virtual machine brings its own. Two: give every room only the powers it needs, and lock it against gaining more. Three: give a stranger's code its own foundation, not a room on yours. Four: count the cost of each wall, then build the ones you need, and never trust a wall as if it were the Keeper.`,
];

// -----------------------------------------------------------------------------
// The four age bands. Each is an independent composition for its reader.
// -----------------------------------------------------------------------------
const CHILD = `${TITLE}.
WHO SENT THIS. Darrell sent us a story about computers. He wrote one word on top. The word was Lesson. He also asked for pictures. So this lesson has three pictures to look at.
THE WORD FIRST. Long ago, Yahweh told Noah to build a big boat. It was called the ark. Here is what Yahweh said. {{kjv:Genesis 6:14}} Rooms shalt thou make in the ark. That means make rooms in the boat. The ark had lots of rooms. The animals each had a place. But all the rooms were in one boat. They all sat on the same bottom. That bottom is called the hull.
If the hull is strong, every room is safe. If the hull breaks, every room gets wet. So Noah put pitch on the hull. Pitch is sticky stuff that keeps water out. He put it on the inside and the outside.
The ark had floors stacked up too. {{kjv:Genesis 6:16}} One floor on top of another. Three floors in all.
King David asked a big question. {{kjv:Psalms 11:3}} The foundations are the part at the very bottom. Everything stands on them. Then David gave the answer. {{kjv:Psalms 11:4}} Yahweh is on His throne. He sees everything.
ONE COMPUTER, MANY JOBS. Big computers do lots of jobs at once. One job shows a web page. One job keeps lists safe. One job does chores at night. People want to keep the jobs apart, so one job can not mess up another.
There are two ways to do it. Look at the first picture.
The first way is like building whole little houses. Each house has its own floor at the bottom. This is called a virtual machine. Virtual means pretend. It is a pretend computer inside the real one.
The second way is like rooms in one big house. Each room has its own door and its own stuff. But all the rooms sit on one floor. This is called a container. It is like the rooms in the ark.
THE BIG FLOOR. Every computer has a most important part. It is called the kernel. The kernel is like the floor. Every job stands on it. Every job asks it for help.
In the house way, each little house has its own kernel. In the room way, all the rooms share one kernel.
WHY ROOMS ARE NICE. Rooms are quick to make. You do not have to build a whole house. You can fit lots of rooms in one house. That saves space and money.
WHY HOUSES ARE NICE. A house has its own floor. If a bad guy breaks into one house, he still has to break into the next house. Look at the second picture. In rooms on one floor, if the floor breaks, every room is in trouble.
SO WE ADD LOCKS. People who use rooms add extra locks. Each room only gets the keys it needs. That helps a lot. But the rooms still share the floor.
A PICTURE YOU KNOW. Think about your school. Each kid has a locker. Your locker has your coat, your lunch and your books. Nobody else can open it. That is like a room. But all the lockers are in one hall, in one school, on one floor. If the school gets too cold, every locker is cold. If the roof leaks, every kid gets wet.
Now think about friends who live in different houses. Each house has its own roof and its own floor. If one roof leaks, the house next door is fine. That is like a virtual machine.
Lockers are easy. You get one fast, and lots of them fit in one hall. Houses take a long time to build, and they cost more. So people use lockers for most things. But some things need their own house. You would not keep a pet lion in a school locker! A lion needs its own place with strong walls. A program from a stranger is a little like that. We do not know what it will do. So we give it its own house.
SHARING THE LAND. Long ago, Abram and Lot had too many animals for one place. {{kjv:Genesis 13:6}} There was not room for everyone. So computers set rules too. Each room only gets so much. Then nobody takes it all.
BOTH AT ONCE. Look at the third picture. It is like the floors of the ark. First the computer. Then the houses. Then rooms inside the houses. Many big computers work this way.
A WISE PERSON THINKS AHEAD. {{kjv:Proverbs 22:3}} A wise builder thinks about what could go wrong. Then he gets ready. Jesus said to count the cost first. {{kjv:Luke 14:28}} So we pick houses or rooms by what needs keeping apart.
OUR OWN HOUSE. Our church app uses rooms too. They are on our own computer. We read our own notes about them. None of our rooms gets all the keys. That is good. A few rooms have the extra locks. Most do not have them yet. So we wrote that down to fix. We do not pretend it is done.
YAHWEH KEEPS US. Locks are good. Walls are good. But they are not what keeps us safe in the end. {{kjv:Psalms 127:1}} A watchman is a guard. Yahweh is the one who keeps the city.
Jesus is the Lamb of Yahweh. {{kjv:John 1:29}} {{kjv:John 3:16}} His throne lasts forever. {{kjv:Hebrews 1:8}} He holds everything together. {{kjv:Colossians 1:17}}
FOUR THINGS TO DO. Know what your rooms share. Give each room only the keys it needs. Give a stranger his own house. And thank Yahweh, who keeps us.
${FACTS.child}
${TALK.child}`;

const YOUTH = `${TITLE}.
WHO SENT THIS. Darrell forwarded a newsletter about how computers run many programs at once, with one word on top: Lesson. He also asked for pictures to help explain it, so this lesson has three diagrams. We are leaving out the newsletter's name and links, because the lesson does not need them.
THE WORD FIRST. When Yahweh told Noah how to build the ark, He gave him a detail that fits this lesson well. {{kjv:Genesis 6:14}} Rooms shalt thou make in the ark. The ark was one boat with many rooms. Each kind of animal had its own place, but every room rode on the same hull. If the hull held, everyone was carried. If it cracked, the walls between rooms would not help. That is why Noah sealed the hull with pitch on both sides.
The ark was built in layers as well. {{kjv:Genesis 6:16}} Three stories, each one sitting on the one below.
David asked the question this whole lesson is about. {{kjv:Psalms 11:3}} The foundation is what everything else stands on. A wall between two rooms is only as strong as the floor under both. Then David answered himself. {{kjv:Psalms 11:4}} Our foundations are not the final one. Yahweh is.
ONE SERVER, THREE JOBS. Imagine one computer in a closet doing three jobs: a website, a database full of records, and a worker that runs chores at night. You want each job kept apart, with its own files and its own share of memory, so one cannot wreck another. There are two main ways to do that. The first diagram shows both.
VIRTUAL MACHINES. A program called a hypervisor slices the real computer into pretend computers. Each one, a virtual machine, boots its own full operating system. So three jobs means three operating systems on one box. Think of three separate houses, each with its own foundation, on one lot.
CONTAINERS. A container is not a pretend computer. It is a normal program that the system has walled in. It gets its own view of the files, the network and the other programs, and a limit on how much memory it can use. Think of three rooms in one house. Each room has a door and its own stuff, but they all sit on one foundation.
THE KERNEL. That shared foundation has a name: the kernel. It is the core of the operating system, the part that talks to the hardware. Every program asks the kernel for help whenever it opens a file or uses the network. Virtual machines each bring their own kernel. Containers all share the host's one kernel. That one fact explains almost everything else.
THE TRADE. Containers start fast, because there is no system to boot. They are light, so many more fit on the same hardware. But lighter does not always mean faster at the actual work; the newsletter says virtual machines now run close to full speed. And a container cannot bring its own kernel, so a Linux container needs Linux underneath. On a Windows laptop, Linux containers usually run inside a hidden Linux virtual machine.
Space is limited, like it was for Abram and Lot. {{kjv:Genesis 13:6}} So the system sets limits, and one container cannot take all the memory and starve the rest.
A PICTURE YOU ALREADY KNOW. Think about an apartment building. Every family has its own door, its own key and its own kitchen. Most of the time you never see the neighbors. But the whole building shares one foundation, one roof, one set of water pipes and one furnace in the basement. If the furnace quits in January, every apartment is cold, no matter how good its own door is. And if someone gets into the basement, they can reach the pipes that run to every unit. That is a container setup.
Now picture a street of separate houses. Each one has its own furnace and its own foundation. A broken furnace at one house does not freeze the house next door, and getting into one basement does not get you into the others. That is closer to virtual machines. The houses cost more and take longer to build, and they use more land. That is the trade, and neither choice is wrong. A family that trusts its neighbors can live well in an apartment. But if you knew one neighbor was dangerous, you would want a different building.
WHEN SOMETHING GOES WRONG. Say a hacker breaks into the night worker. With virtual machines, they are stuck behind their own kernel and need a second break-in to reach the others. With containers, everything shares one kernel. If that kernel has a flaw, they may climb out and reach every room. Look at the second diagram. That is David's question in computer form.
So people who use containers add extra protection. Give each container only the powers it needs. Block it from gaining more powers later. Limit what it can ask the kernel to do. These help a lot, but they do not change the fact that the kernel is shared. A wise person sees that coming. {{kjv:Proverbs 22:3}}
USING BOTH. Big systems often stack them, like the stories in the ark: the real computer, then virtual machines, then containers inside them. The third diagram shows the stack. The virtual machines keep strong walls between big areas, and the containers make each program easy to move and update.
HOW TO CHOOSE. Use virtual machines when you need the strongest wall, or a different operating system. Use containers for programs you wrote and trust. If you have to run code from a stranger, give it its own foundation. And count the cost before you build. {{kjv:Luke 14:28}}
THE BRIGHT LINE. No wall is perfect. Kernels have bugs. Hypervisors have bugs. {{kjv:Psalms 127:1}} The guard still stays awake, but Yahweh is the one who keeps the city.
OUR OWN APP. The programs behind this app run as containers on our own computers, so this choice is ours too. We read our own files. None of our containers gets full power over the machine, which is good. Only two have the extra lock against gaining power, and one drops powers it does not need. Most do not have those locks yet. We wrote that down as work to do, instead of pretending it was done.
WHAT IS NEW. Week seventy taught each family building the wall in front of its own house. This week is about what lies under the walls, and how far trouble spreads when that is shared.
HIS HANDS. Jesus is the Lamb of Yahweh. {{kjv:John 1:29}} {{kjv:John 3:16}} He is the Eternal Son, whose throne lasts forever. {{kjv:Hebrews 1:8}} Everything holds together in Him. {{kjv:Colossians 1:17}}
${FACTS.youth}
${TALK.youth}`;

const TEEN = `${TITLE}.
WHO SENT THIS. Darrell forwarded a system-design newsletter with one word above it: Lesson. He asked for diagrams too, so there are three. The question is simple. Virtual machines and containers both run many jobs on one machine. So what is the actual difference? Names, links and ads are left out on purpose.
THE WORD FIRST. Start in Genesis, at the build spec for the ark. {{kjv:Genesis 6:14}} One hull, many rooms. Each room kept its residents apart. But every room depended on the same hull. Notice what got the extra sealing: the hull, within and without. The shared part got the most protection, because a failure there hits everyone.
The spec also had layers. {{kjv:Genesis 6:16}} Three stories, each built on the one below.
Then Psalm 11 asks the question this lesson runs on. {{kjv:Psalms 11:3}} Walls between rooms do not matter if the floor under them fails. And the next verse answers it. {{kjv:Psalms 11:4}} The last foundation is not one we pour.
THE SETUP. One server. Three workloads: an API, a database, and a background worker. Each needs its own filesystem, its own network config and its own slice of CPU and memory. You want them isolated. There are two main ways. Diagram one shows both.
VIRTUAL MACHINES. A hypervisor carves the real hardware into virtual hardware. Each virtual machine boots a full operating system, kernel and all. Type 1 hypervisors run right on the hardware; most servers use those. Type 2 run on top of a normal desktop system; developers use those for testing. Three workloads means three full operating systems. Three houses, three foundations.
CONTAINERS. A container is just a process on the host, fenced in by the kernel. On Linux the fence has four parts. Namespaces give it its own view of processes, network and mounts. Control groups cap its CPU, memory and disk use. Filesystem isolation keeps its files separate. Security controls limit its privileges. Three workloads means three fenced processes on one kernel. Three rooms, one foundation.
THE ONE DIFFERENCE. Virtual machines run separate kernels. Containers share one. The kernel is the core of the system that handles every request to the hardware. Every file read and every network packet goes through it.
WHAT THAT CHANGES. Containers start fast because nothing has to boot. They are lighter, so more fit on the same box. But lighter does not mean faster at the work; the newsletter reports that virtual machines now run near native speed. Big images can still make a container slow to start. And a container cannot bring its own kernel, so Linux containers need a Linux host. On Windows or a Mac, they run inside a hidden Linux virtual machine.
Resources are finite. {{kjv:Genesis 13:6}} Control groups are the rule that keeps one container from starving the others.
WHERE YOU ALREADY SEE THIS. You run into this trade-off more often than you think. A browser keeps each site in its own walled-off process, so one bad tab should not read another. A game server might host many matches on one machine, each walled in, all on one kernel. A robotics team might run its vision code, its motor control and its logging as separate containers on one small board, because it is quick to rebuild one without touching the rest. In each case someone made the same call: how much do these pieces trust each other, and how much do they need to share? When the pieces are your own team's code, a room is usually enough. When one piece comes from someone you have never met, the honest answer is that it needs a wall the others do not stand on. The mistake is never picking rooms. The mistake is picking rooms without knowing the floor is shared.
THE BREACH. Say the worker gets compromised. With virtual machines, the attacker is stuck behind the worker's own kernel. They need a second exploit, in the hypervisor or a bad config, to go further. With containers, the worker shares the host kernel with the API and the database. One kernel bug or one bad setting can let them escape the container and reach everything. Diagram two shows the difference. That is Psalm 11 in a server rack.
HARDENING. So containers need extra controls. Run with least privilege. Drop capabilities you do not need. Set no-new-privileges. Use a seccomp profile to limit system calls. Use AppArmor or SELinux to limit access. Use user namespaces so root inside the container is nobody outside it. These cut the risk a lot. They do not remove the shared kernel. {{kjv:Proverbs 22:3}}
WHY THE HULL GETS THE PITCH. Go back to the ark for a second, because the engineering lesson is already sitting there. The rooms did not need waterproofing against each other; the hull needed waterproofing against the flood, on the inside and on the outside, because every single room depended on it. Server security works the same way: the shared kernel deserves the most attention, the fastest patches and the tightest settings, precisely because a failure there is never contained to one workload.
HYBRIDS. Some tools mix the two. MicroVMs start almost as fast as containers. Some runtimes wrap each container in its own small virtual machine with its own kernel. Some run a kernel in user space to answer the container's calls first. You pay for that wall with some speed or compatibility. In practice most systems just stack them. Diagram three shows the stack: server, hypervisor, virtual machines, then containers inside. Cluster tools usually run their containers on virtual machine nodes.
HOW TO CHOOSE. Virtual machines for the strongest wall, a different OS, or old software. Containers for trusted services you want light and portable. Untrusted code, like code a stranger uploads, gets its own kernel. Count the cost. {{kjv:Luke 14:28}}
THE BRIGHT LINE. Every layer has bugs. Hypervisors get patched. Kernels get patched. {{kjv:Psalms 127:1}} Keep the watch, and do not confuse the watch with the Keeper.
OUR OWN STACK. The services behind this app run as containers on our own hardware, so this is our call too. In our repo there are fifteen compose files. None runs privileged. None mounts the engine's control socket. Two set no-new-privileges. One drops capabilities. Three use host networking, each with its reason in a comment. No virtual machine layer is described, so all of them share the host kernel. At least one service skips containers and runs as a plain program bound to localhost. Most of our containers lack the extra hardening. That gap is logged as work, with a date, not hidden.
WHAT IS NEW. Week seventy covered each household building its own section of the wall. This week covers what sits under the walls, and how far a breach travels when it is shared.
HIS HANDS. Jesus is the Lamb of Yahweh. {{kjv:John 1:29}} {{kjv:John 3:16}} He is the Eternal Son. {{kjv:Hebrews 1:8}} All things hold together in Him. {{kjv:Colossians 1:17}}
${FACTS.teen}
${TALK.teen}`;

const SENIOR = `${TITLE}.
WHO SENT THIS. Darrell forwarded a newsletter on the design of computer systems into this lane with a single word above it: Lesson. He asked that the lesson keep or create pictures to support the explanation and its context, and so three diagrams accompany it. The newsletter's name, its sponsor and its links are omitted; the teaching requires none of them.
THE WORD FIRST. Yahweh's instructions to Noah included a detail that serves this lesson exactly. {{kjv:Genesis 6:14}} The ark was a single vessel divided into many rooms. Each room kept its occupants in their place, yet every room depended on the one hull beneath it. It is worth noticing which part received the double sealing, within and without: the hull, the one thing all the rooms held in common.
The vessel was built in tiers as well. {{kjv:Genesis 6:16}} Three stories, each resting upon the one below.
David put the decisive question in Psalm eleven. {{kjv:Psalms 11:3}} A partition between two rooms is worth no more than the foundation under both. And he answered it at once. {{kjv:Psalms 11:4}} Whatever foundation men lay, it is not the last; Yahweh reigns and searches the hearts of men.
THE SITUATION. Consider one server performing three tasks for a household or a congregation: a website the members use, a database that keeps the records, and a background worker that runs errands overnight. Each task needs its own files, its own network arrangements and its own share of the machine, and each should be kept from interfering with the others. There are two principal ways of arranging this, and the first diagram sets them side by side.
THE VIRTUAL MACHINE. A layer of software known as a hypervisor apportions the real machine's processor, memory, storage and network into simulated hardware, and on each portion a complete operating system is started, including its own kernel. Three tasks therefore mean three operating systems on one server: three houses, each upon its own foundation, sharing a single plot of ground. Many of us remember a street of separate houses where a fire in one rarely reached the next.
THE CONTAINER. A container is not a separate computer at all. It is an ordinary program on the host which the kernel has enclosed, giving it a private view of files, network and other programs, a fixed allowance of processor and memory, and limits on what it may touch. Three tasks therefore mean three enclosed programs resting on the one kernel: three apartments in a single building, on a single foundation.
THE KERNEL. The kernel is the heart of an operating system, the portion that addresses the hardware directly. Every program must ask it for every file it opens and every message it sends. Virtual machines each bring their own; containers share the host's. Nearly every other difference follows from that one.
WHAT FOLLOWS. Containers start quickly, since there is no system to start, and many more of them fit on the same hardware. Yet lightness is not the same as speed: the newsletter reports that modern virtual machines run very near the machine's native pace. A container cannot bring a kernel of its own, so a Linux container requires a Linux host, and on Windows or Macintosh computers such containers are ordinarily run within a concealed Linux virtual machine.
The ground is always limited, as Abram and Lot discovered. {{kjv:Genesis 13:6}} The control groups enforce a fair allowance, so that one tenant cannot consume the whole field.
WHEN A TENANT IS COMPROMISED. Suppose an intruder takes control of the overnight worker. Where virtual machines are used, the intruder is confined behind that worker's own kernel and must defeat a second barrier, the hypervisor or a fault in its configuration, before going further. Where containers are used, the worker shares the host's kernel with the website and the database, and a single defect in that kernel, or a careless setting, may allow escape into every apartment in the building. The second diagram depicts the contrast. It is Psalm eleven rendered in machinery.
PRUDENT PRECAUTIONS. For that reason containers call for added safeguards: granting each only the powers it requires, forbidding it to acquire more once running, restricting the requests it may make of the kernel, and mapping its administrator to an unprivileged user on the host. These measures reduce the danger considerably; they do not abolish the shared foundation. {{kjv:Proverbs 22:3}}
COMBINING THE TWO. Several newer techniques blend the approaches, at some cost in speed or compatibility: very small virtual machines that start nearly as quickly as containers, containers each given a small virtual machine of their own, and programs that intercept a container's requests before they reach the real kernel. More commonly the two are simply stacked, as the ark was in stories: the server, the hypervisor, the virtual machines, and containers within them. The third diagram shows the arrangement.
CHOOSING WISELY. Prefer virtual machines where the strongest separation is needed, where a different operating system is required, or where an older program expects a world of its own. Prefer containers for trusted services that ought to be light and easily moved. Where a stranger's program must run, give it a foundation of its own. And reckon the cost of each wall before building it. {{kjv:Luke 14:28}}
THE BRIGHT LINE. Every wall described here is sound craftsmanship, and none of it is security in the final sense. Hypervisors and kernels alike are found to have flaws. {{kjv:Psalms 127:1}} The watchman is still told to wake; he is simply not the one who keeps the city.
OUR OWN HOUSE. The services behind this application run as containers on hardware the house owns, and so this choice belongs to us as well. Its own service files were read for this lesson: fifteen container recipes, none granted full privileges over the host, none given the engine's control socket, two forbidding the gain of new privileges, one surrendering network powers it does not need, three sharing the host's network for reasons stated beside them, and no virtual machine layer described. At least one service runs outside any container, listening only to the machine itself. Most containers lack the additional safeguards, and that has been recorded as work with a date for return, not concealed.
WHAT IS NEW. Week seventy of this course considered each household repairing the wall before its own door. This week considers what lies beneath the walls, and how far trouble travels when the foundation is shared.
HIS HANDS. Jesus is the Lamb of Yahweh, {{kjv:John 1:29}} {{kjv:John 3:16}} the Eternal Son whose throne endures forever, {{kjv:Hebrews 1:8}} in whom all things consist. {{kjv:Colossians 1:17}}
${FACTS.senior}
${TALK.senior}`;

const MODULE = {
  id: ID,
  title: TITLE,
  bigIdea: `${TITLE.toUpperCase()}.
WHO SENT THIS. Darrell forwarded a system-design newsletter with ONE WORD typed above it: Lesson, and asked for pictures that carry the explanation. It asked what really separates a virtual machine from a container.
THE WORD FIRST. Genesis 6:14 opens the hour - rooms made in one ark, on one hull sealed within and without - with Psalms 11:3 beside it - if the foundations be destroyed. {{kjv:Genesis 6:14}} {{kjv:Psalms 11:3}}
THE TEACHING. A virtual machine runs its own kernel: a separate house on its own foundation. A container shares the host's kernel: a room in one ark. That one difference decides how fast a job starts, how many fit, which systems can run, and how far a break-in can spread. Harden the rooms, give a stranger's code its own foundation, and count the cost of every wall.
THE BRIGHT LINE. No wall we build is the Keeper. {{kjv:Psalms 127:1}}
THE TIERS. ESTABLISHED: separate kernels versus one shared kernel, built on namespaces and control groups. REPORTED: the newsletter's speed and cloud claims. MEASURED: our own fifteen container recipes, none privileged, most without the extra locks yet. NOT VERIFIED: what runs on the home server today. ${REVIEW}.
PLACEMENT. Sovereign A.I., week 100, because a house that runs its own services on its own machines makes this isolation choice itself.
CLOSE. {{kjv:Psalms 11:4}} Jesus, the Lamb of Yahweh and the Eternal Son, holds all things together.`,
  inApp: `One screen to read in this app, three pictures to study, and one page in your Study.
In the app: open Sovereign A.I. week 100 and read the band that fits the reader in front of you - the lesson carries all four, child, youth, teen and senior, and each one is whole on its own. Then study the three diagrams: houses and rooms side by side, how far a break-in reaches, and the stack from the server up.
In your Study, write three lines. One thing in your life or work that shares a foundation with something else. One room that needs a lock it does not have. One stranger's program you would give its own house. {{kjv:Genesis 6:14}}`,
  anchor: {
    ref: 'FILLED FROM THE TOKENS',
    theme: `{{kjv:Genesis 6:14}} {{kjv:Psalms 11:3}} {{kjv:Psalms 11:4}} {{kjv:Genesis 6:16}} {{kjv:Genesis 13:6}} {{kjv:Proverbs 22:3}} {{kjv:Psalms 127:1}}`,
  },
  rpe: {
    research: `RESEARCH. Three readings, each landing on your own work.
First, read Genesis 6:14-16. Mark what the rooms share, and what part of the ark was sealed within and without. Write one sentence on something in your house that everyone depends on.
Second, read Psalms 11:3-4. Write down what David asked when the foundations fail, and where he looked for the answer.
Third, read Genesis 13:5-9. Write down one place where too many needs on too little ground caused strife, and what fair limits would have done.
And one verification reading, because this course works this way. That a virtual machine runs its own kernel and a container shares the host's is established. The newsletter's speed and cloud claims are reported. Our own container recipes are measured from our files. What runs on the home server today is not verified.`,
    plan: `PLAN. Decide four steps before the week starts, and decide who hears them.
One: the foundation. List three things on one of your computers or phones that share a single foundation.
Two: the locks. Pick one app, account or program that has more power than it needs, and decide how you will take that power away.
Three: the stranger. Decide where you would run a program you did not write and do not trust.
Four: the cost. Write down one wall you could build and decide honestly whether you need it.
Then name the person who will ask you about all four on the same day next week.`,
    execute: `EXECUTE. Keep it for one week, out loud, with one other person.
Take one power away from one app or program that does not need it.
Teach the verse at a meal: rooms shalt thou make in the ark. Ask a child what would happen to every room if the hull broke.
At the end of the week, answer three questions to the person who is asking. What shares your foundation? What lock did you add? What wall did you decide you did not need?
Measure the growth the Word's way - by the fruit, by the occasions, and by the days.`,
  },
  media: [
    {
      type: 'diagram',
      key: 'vm-vs-container',
      title: 'Separate houses or rooms in one ark',
      caption: 'A virtual machine boots its own kernel on a hypervisor; containers are walled-in processes that all stand on the host’s one kernel.',
    },
    {
      type: 'diagram',
      key: 'shared-kernel-reach',
      title: 'How far a break-in can reach',
      caption: 'A compromised worker in a virtual machine still faces a second wall; in a container, a kernel flaw can reach every room on the same kernel.',
    },
    {
      type: 'diagram',
      key: 'isolation-stack',
      title: 'Both, stacked like the stories of the ark',
      caption: 'Server, then hypervisor, then virtual machines, then containers inside them: strong walls between environments, light rooms within each.',
    },
  ],
  benefits: [
    `Darrell's one word, Lesson, over a system-design newsletter, answered from the Word, with the three pictures he asked for.`,
    `The hour opened in the ark, Genesis 6:14, rooms in one hull sealed within and without, before any word about a kernel.`,
    `Psalms 11:3-4 asked and answered: if the foundations be destroyed, Yahweh is still on His throne.`,
    `The one difference named plainly: a virtual machine runs its own kernel, and a container shares the host's.`,
    `What the kernel is, taught as the foundation every program asks for help.`,
    `The trade counted: starting, fitting, speed and which systems can run, with lighter told apart from faster.`,
    `Fair limits taught from Genesis 13:6: one tenant must not eat the whole field.`,
    `How far a break-in spreads, with a second wall for a virtual machine and a shared kernel for a container.`,
    `Container hardening named, with its limit stated: it lowers the risk and does not remove the shared kernel (Proverbs 22:3).`,
    `Choosing by what needs keeping apart, with a stranger's code given its own foundation and the cost counted (Luke 14:28).`,
    `Our own fifteen container recipes measured from the repository, the shut doors and the missing locks both stated.`,
    `Jesus confessed as the Lamb of Yahweh and the Eternal Son, in whom all things consist (Colossians 1:17).`,
    `The established, the reported, the measured and the unverified told apart in every reader place, with a dated re-review.`,
  ],
  stories: [
    {
      kind: 'parable',
      tone: 'light',
      verse: 'Genesis 13:6',
      title: 'The shared kitchen',
      body: `ILLUSTRATIVE, NOT A REAL EVENT. Four college friends rented one house. Each had a room with a lock, a shelf in the fridge with a name on it, and a night of the week to cook. It worked well. It was cheap, it was quick to settle into, and nobody had to buy a stove.
Then one of them left a pan on the burner and went to bed. The smoke alarm woke the whole house at two in the morning. Nobody's room was burned, but every room smelled of smoke for a week, and every one of them stood out on the lawn in the cold.
At the house meeting nobody suggested they all move into separate houses. That would have cost four times as much. They bought a timer for the stove, they agreed nobody cooks after midnight, and they put the fire extinguisher where anyone could reach it. One of them said it well: the rooms are ours, but the kitchen is everybody's, so the kitchen gets the rules.`,
    },
    {
      kind: 'parable',
      tone: 'solemn',
      verse: 'Psalms 11:3',
      title: 'The stranger’s program',
      body: `ILLUSTRATIVE, NOT A REAL EVENT. A small church ran its website, its member list and a giving page as containers on one computer in the office closet. A visitor offered to help with a program that would turn sermon notes into slides, and the volunteer who kept the computer ran it in one more container on the same machine, to save time.
The program was not what it said. It looked for a weakness in the shared kernel, found an old one that had never been patched, and climbed out of its room. By morning it had read the member list.
The pastor did not blame the volunteer in front of anyone. They patched the machine, told every member plainly what had happened, and changed one rule: anything they did not write, and anyone they did not know, runs on a separate machine with its own foundation, or not at all. The volunteer said later that the walls had been fine. It was the floor they had forgotten.`,
    },
  ],
  quiz: {
    questions: [
      {
        q: 'In Genesis 6:14, what did Yahweh tell Noah to make inside the ark?',
        options: ['A single open hall', 'Rooms, with the ark pitched within and without', 'A tower'],
        answer: 1,
        explain: 'Rooms shalt thou make in the ark. Many rooms rode on one hull, and the hull, the part every room shared, was sealed on both sides.',
      },
      {
        q: 'What question does Psalms 11:3 ask?',
        options: ['Who will build the wall', 'If the foundations be destroyed, what can the righteous do?', 'Where is the ark'],
        answer: 1,
        explain: 'A wall between rooms is only as good as the foundation under both. Psalms 11:4 answers: Yahweh is in His holy temple, on His throne.',
      },
      {
        q: 'What is the one difference between a virtual machine and a container?',
        options: [
          'Virtual machines are always faster',
          'A virtual machine runs its own kernel; containers share the host’s kernel',
          'Containers cannot use a network',
        ],
        answer: 1,
        explain: 'Separate kernels versus one shared kernel. Nearly every other difference follows from that.',
      },
      {
        q: 'What is the kernel?',
        options: ['A file you download', 'The core of the operating system that every program asks for help with the hardware', 'A kind of virus'],
        answer: 1,
        explain: 'Opening a file or sending a message on the network is a request to the kernel. It is the foundation every program stands on.',
      },
      {
        q: 'What does a hypervisor do?',
        options: [
          'It divides the real machine into virtual hardware so each virtual machine can boot its own system',
          'It speeds up the internet',
          'It deletes old files',
        ],
        answer: 0,
        explain:
          'The hypervisor carves the processor, memory, storage and network into pretend hardware. Each virtual machine then boots a whole operating system on its share.',
      },
      {
        q: 'Which kernel features does Linux build containers from?',
        options: ['Namespaces and control groups', 'Folders and shortcuts', 'Passwords only'],
        answer: 0,
        explain: 'Namespaces give each container its own view of processes, network and files; control groups limit how much processor and memory it may use.',
      },
      {
        q: 'Is a container always faster at its work than a virtual machine?',
        options: [
          'Yes, always',
          'No: it starts faster and is lighter, but the newsletter reports virtual machines now run close to native speed',
          'No, containers are always slower',
        ],
        answer: 1,
        explain: 'Lighter is not the same as faster. A web service does not answer requests faster just because it lives in a container.',
      },
      {
        q: 'If a background worker is broken into, why can a container be riskier than a virtual machine?',
        options: [
          'Containers have no passwords',
          'Containers share the host kernel, so a kernel flaw or careless setting can let the intruder reach every room',
          'Virtual machines cannot be broken into',
        ],
        answer: 1,
        explain:
          'In a virtual machine the intruder still faces a second wall. In a container, the foundation under every room is the one they are standing on.',
      },
      {
        q: 'What do our own fifteen container recipes show?',
        options: [
          'Every one is fully hardened',
          'None runs with full privileges, but most do not yet have the extra locks, and that is recorded as work',
          'They all run privileged',
        ],
        answer: 1,
        explain:
          'Measured from our files: none privileged, none given the engine’s control socket, two with no-new-privileges, one dropping capabilities. The rest is work with a date.',
      },
      {
        q: 'According to Colossians 1:17, what is true of the Son?',
        options: ['He is one foundation among many', 'He is before all things, and by Him all things consist', 'He began with the ark'],
        answer: 1,
        explain:
          'Jesus is the Lamb of Yahweh and the Eternal Son, before all things, and all things hold together in Him. No foundation we pour is the last one.',
      },
    ],
  },
  facilitator: {
    howToRun: `SIXTY MINUTES, AND THE WORD OPENS IT. Read Genesis 6:14-16 and Psalms 11:3-4 aloud before you say one word about any computer. Then draw two pictures on the board: three houses on three foundations, and one house with three rooms on one foundation. Then ask the room: what in your house does everyone share?
MINUTES 0 TO 12 - THE ARK. Genesis 6:14 and 6:16. Ask: what did the rooms share, and which part was sealed within and without?
MINUTES 12 TO 24 - THE FOUNDATION. Psalms 11:3-4. A wall is only as good as the floor under it, and the last foundation is not ours.
MINUTES 24 TO 36 - HOUSES AND ROOMS. Show the first diagram. Virtual machines run their own kernels on a hypervisor; containers share the host's kernel. Teach what a kernel is, and what the shared kernel changes: starting, fitting, speed and systems. Genesis 13:6 for fair limits.
MINUTES 36 TO 48 - THE BREAK-IN AND THE LOCKS. Show the second diagram. Walk the compromised worker through both. Name the hardening steps and their limit. Proverbs 22:3 and Luke 14:28. Show the third diagram for the stack.
MINUTES 48 TO 60 - OUR HOUSE AND HIS HANDS. Our own fifteen container recipes, the shut doors and the missing locks. Psalms 127:1 for the bright line. John 1:29, John 3:16, Hebrews 1:8 and Colossians 1:17. Give the four household habits and the week's assignment.
WHAT NOT TO DO. Do not teach either one as simply better. Do not promise that any wall makes a system safe. Do not state the newsletter's speed claims as tested; they are reported. Do not name the newsletter or its sponsor. Do not let the machinery stand over the Word; the Word frames the hour.`,
    talkingPoints: [
      `Rooms shalt thou make in the ark (Genesis 6:14).`,
      `The shared hull was pitched within and without.`,
      `Lower, second and third stories (Genesis 6:16).`,
      `If the foundations be destroyed (Psalms 11:3).`,
      `Yahweh is in His holy temple (Psalms 11:4).`,
      `Virtual machines run separate kernels; containers share one.`,
      `The kernel is the foundation every program asks for help.`,
      `Lighter is not the same as faster.`,
      `Fair limits, so one tenant does not eat the field (Genesis 13:6).`,
      `A shared kernel is a shared risk; harden the rooms (Proverbs 22:3).`,
      `Give a stranger's code its own foundation; count the cost (Luke 14:28).`,
      `Our recipes: none privileged, most without the extra locks yet.`,
      `Except Yahweh keep the city (Psalms 127:1); by Him all things consist (Colossians 1:17).`,
    ],
    discussionPrompts: [
      `What in your house does everyone depend on, like the hull?`,
      `Where have you trusted a wall without looking at the floor under it?`,
      `What program or app on your phone has more power than it needs?`,
      `Whose code would you never run on the same foundation as your own records?`,
      `Which wall would you decide you do not need, and why?`,
      `How does Psalms 11:4 change the way you think about security?`,
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
console.log(`sov100: adult prose words ${adultWords} fk ${fk(filled.lesson).toFixed(2)}`);
for (const b of FOUR_BANDS) {
  console.log(
    `sov100: ${b} words ${words(filled.levels[b])} share ${(words(filled.levels[b]) / adultWords).toFixed(3)} fk ${fk(filled.levels[b]).toFixed(2)} overlap-adult ${overlapOf(filled.levels[b], filled.lesson).toFixed(3)}`
  );
}
for (let i = 0; i < FOUR_BANDS.length; i += 1) {
  for (let j = i + 1; j < FOUR_BANDS.length; j += 1) {
    console.log(`sov100: overlap ${FOUR_BANDS[i]}~${FOUR_BANDS[j]} ${overlapOf(filled.levels[FOUR_BANDS[i]], filled.levels[FOUR_BANDS[j]]).toFixed(3)}`);
  }
}
const faults = fourBandFaults(filled);
// --dry measures and reports, and writes nothing.
if (process.argv.includes('--dry')) {
  console.log(faults.length ? faults.join('\n') : 'sov100: no four-band faults');
  process.exit(0);
}
if (faults.length) {
  console.error(faults.join('\n'));
  throw new Error('sov100: refusing to splice a lesson that fails the four-band ladder');
}

// -----------------------------------------------------------------------------
// Splice
// -----------------------------------------------------------------------------
const OPEN = 'export const SOVEREIGN_AI_MODULES = [';
let src2 = readFileSync(CATALOG, 'utf8');
let end2 = src2.indexOf('\n];', src2.indexOf(OPEN));
if (end2 < 0) throw new Error('sov100: could not find the end of SOVEREIGN_AI_MODULES');

if (src2.includes(ID)) {
  if (!process.argv.includes('--rebuild')) throw new Error(`sov100: ${ID} is already in the catalog; pass --rebuild to replace it`);
  const from = src2.indexOf(`  {\n    "id": "${ID}"`);
  if (from < 0) throw new Error('sov100: the id is in the file but not as a module literal; refusing to rebuild');
  const withComma = src2.indexOf('\n  },', from);
  const atArrayEnd = src2.indexOf('\n  }\n];', from);
  const ends = [
    withComma >= 0 && withComma < end2 ? { at: withComma, len: '\n  },'.length, back: 0 } : null,
    atArrayEnd >= 0 && atArrayEnd < end2 ? { at: atArrayEnd, len: '\n  }'.length, back: ','.length } : null,
  ]
    .filter(Boolean)
    .sort((a, b) => a.at - b.at);
  if (!ends.length) throw new Error('sov100: could not find the end of the existing block; refusing to rebuild');
  const { at: closeAt, len, back } = ends[0];
  const excised = src2.slice(from, closeAt + len);
  if (excised.split('"id":').length - 1 !== 1) {
    throw new Error(`sov100: the block to excise holds ${excised.split('"id":').length - 1} ids, expected 1; refusing to rebuild`);
  }
  src2 = src2.slice(0, from - back) + src2.slice(closeAt + len);
  end2 = src2.indexOf('\n];', src2.indexOf(OPEN));
  if (end2 < 0) throw new Error('sov100: the array is not closed after excising; refusing to rebuild');
  if (src2.includes(ID)) throw new Error('sov100: the id survived the excision; refusing to rebuild');
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
if (after.length !== before.length + 1) throw new Error(`sov100: week count went ${before.length} -> ${after.length}, expected exactly one more`);
if (before.includes(WEEK)) throw new Error(`sov100: week ${WEEK} is already taken`);
if (after[after.length - 1] !== WEEK) throw new Error(`sov100: week ${WEEK} is not the top of the course after splicing`);
const occurrences = next.split(`"${ID}"`).length - 1;
if (occurrences !== 1) throw new Error(`sov100: the new id appears ${occurrences} times, expected exactly once`);

writeFileSync(CATALOG, next);

const refs = filled.anchor.ref
  .split(';')
  .map((s) => s.trim())
  .filter(Boolean);
for (const r of refs) verseText(r);
console.log(`sov100: spliced ${ID}`);
console.log(`sov100: modules ${before.length} -> ${after.length}; top week ${after[after.length - 1]}`);
console.log(`sov100: ${refs.length} references on the anchor, every one quoted in a reader place and resolving in the corpus`);
