// =============================================================================
// word-out-course — "Getting the Word Out: the latest message, everywhere"
// =============================================================================
// Darrell 2026-07-23, from the church office desk (the staff member fighting
// the old Weebly page's hand-edited month buttons and stale featured video):
// "create a course in the Love Corner App for the staff... How to add the
// latest YouTube videos to the site... and how we can make it better so they
// can build what they want."
//
// AUDIENCE (COMMUNITY-FIRST): the church's own staff — faithful, busy, often
// tech-shy. The course teaches the ONE upload that puts the newest message
// everywhere automatically, how to find and share any message, the one-time
// fix that retires the old site's monthly hand-work, what to do when a page
// looks stale, and HOW TO ASK FOR WHAT THEY WANT BUILT (the request rail) —
// so the platform grows from their voice. Plain words, warm, honest
// (ANXIETY-CLARITY: what / when / why / how on every module).
// Scripture is cited by reference with a theme, never quoted from memory
// (DR-0076 / SCRIPTURE-REFERENCE-STANDARD).

import { progressSummaryFor, exportCurriculumMarkdownFor } from './church-classes.js';

export const WORD_OUT_META = {
  key: 'word-out',
  title: 'Getting the Word Out: the latest message, everywhere',
  audience: 'Church of the Living God staff and volunteers who post the messages — and anyone who shares them',
  tagline: 'One upload puts the newest message at the top of the app, in The Word archive, and in front of the Body — automatically. Learn the one habit, retire the busywork, and ask for what you want built.',
  cadenceDays: 7,
  weeks: 5, // keep in step with WORD_OUT_MODULES.length (asserted in the test)
  handsOnLabel: 'Try it now',
  unit: {
    noun: 'lesson', nounPlural: 'lessons', cap: 'Lesson', selfPaced: true,
    sessionLabel: 'How to learn it (alone, or with a teammate showing you)',
    countNoun: 'lesson',
  },
  footer: '_Built for the staff who carry the broadcast — so the Word reaches the Body without busywork. The app is a live view of the church\'s own channel; what you upload once, everyone receives (Isaiah 55:11; Mark 16:15). Where a page can lag a few minutes, this course says so honestly — never guessing._',
};

export const WORD_OUT_SESSION_FLOW = [
  { minutes: 2, name: 'Pray + read the anchor — the message is the mission' },
  { minutes: 6, name: 'The big idea, in plain words' },
  { minutes: 8, name: 'Try it now — with the real page open' },
  { minutes: 4, name: 'Check yourself + carry it into your role' },
];
export const WORD_OUT_SESSION_MINUTES = WORD_OUT_SESSION_FLOW.reduce((t, s) => t + s.minutes, 0);

export const WORD_OUT_MODULES = [
  {
    id: 'wo1-one-upload-everywhere',
    title: 'One upload, everywhere — the whole system in one habit',
    bigIdea: 'When a service is streamed or a video is uploaded to the church\'s own YouTube channel (@TheLoveCorner), the Love Corner app takes it from there BY ITSELF: the newest message plays at the top of the Church page, appears in the recent-streams strip, and joins The Word archive with its date. Nobody edits a page, nobody moves a video to the top, nobody makes a month button. The one habit that runs the whole broadcast: get the video onto the channel. That is the entire job.',
    inApp: 'Open the Love Corner app → Church. Look at the video playing at the top — that is the channel\'s newest item, placed there automatically. Now open The Word tab: the same newest message sits at the top of the archive with everything older beneath it, by month, searchable. Nothing you see was placed by hand.',
    anchor: {
      ref: 'Isaiah 55:11; Mark 16:15',
      theme: 'The Word that goes out does not return void — and the charge is to carry the gospel to everyone. The system exists so the message goes OUT, every time, without a single manual step standing between the pulpit and the people.',
    },
    benefits: [
      'The Sunday-night page-editing session disappears — upload once and the work is done.',
      'You know, with confidence, where the newest message will appear and when.',
      'Anyone on staff can carry the broadcast — the habit is one step, not a checklist.',
      'The archive builds itself — every message remembered, dated, and findable forever.',
    ],
    levels: {
      teen: 'Here is the whole system in one sentence: put the video on the church\'s YouTube channel, and the app does everything else. The newest video automatically plays at the top of the Church page, and it automatically files itself into The Word tab with all the older messages. Nobody drags anything to the top. Nobody makes buttons for each month. If you can upload to YouTube — or if the livestream just ends and YouTube saves it, which counts too — you have already done the entire job.',
      senior: 'The app reads the church channel\'s public uploads feed through its own same-origin relay, so the Church page\'s player and The Word archive are LIVE VIEWS of the channel — newest first, always current within a few minutes, no API key, no vendor login, no page edits. A finished livestream becomes the channel\'s newest upload automatically, so streaming a service IS publishing it. The old workflow (swap the featured embed, add a month button, re-publish the page) is retired: those were hand-drawn copies of what the channel already knows, and hand-drawn copies go stale. The channel is the single source of truth; every surface derives from it.',
    },
    quiz: {
      questions: [
        {
          q: 'What do you have to do inside the app after a new message is uploaded to the church YouTube channel?',
          options: [
            'Move the new video to the top of the Church page and add a month button',
            'Nothing — the app shows the newest message at the top and files it in The Word automatically',
            'Email the video file to the app team so they can add it',
          ],
          answer: 1,
          explain: 'The app reads the channel itself. Once the video is on the channel, every surface updates on its own — that is the whole design.',
        },
        {
          q: 'A livestream just ended. Is the message "uploaded"?',
          options: [
            'No — someone must export and re-upload it',
            'Yes — YouTube keeps the finished stream on the channel as its newest video, and the app picks it up from there',
            'Only if the stream was under one hour',
          ],
          answer: 1,
          explain: 'A finished stream becomes the channel\'s newest upload automatically — streaming the service IS publishing it.',
        },
      ],
    },
  },
  {
    id: 'wo2-find-and-share',
    title: 'The Word tab — find any message, share any message',
    bigIdea: 'The Word tab is the church\'s whole preaching archive as a living library: newest at the top, every older message grouped by month, filters for Sunday and Wednesday services, a search box, and a date jump. Every message has WATCH right there. Sharing is the same everywhere: open the message and share the page link — whoever taps it lands in the app, on that message, no account needed to watch.',
    inApp: 'Open The Word tab. Use the month buttons to jump to a message from last year. Then use Search to find a message by a word from its title. Then tap WATCH on the newest one. You just did everything the old site\'s month buttons did — plus search, which the old site never had.',
    anchor: {
      ref: 'Deuteronomy 6:6-7; Psalm 145:4',
      theme: 'The words are to be kept and taught — one generation commends His works to another. An archive that any member can search is that commendation made practical: nothing preached is lost, and anyone can find the word they need again.',
    },
    benefits: [
      'You can put your hands on ANY message in seconds — for a member, a shut-in, or a question from the pulpit.',
      'Sharing is one link that works on any phone — no "which site was that on?"',
      'Sunday/Wednesday filters and date jump replace scrolling through years by hand.',
      'The library is the same on every device — the app, a browser, an installed phone app.',
    ],
    levels: {
      teen: 'The Word tab is like the church\'s own streaming library. Newest sermon at the top. Scroll down and everything is grouped by month. Want something specific? The search box finds messages by title. Want just Sunday services? There is a filter for that. When somebody asks "where can I watch last week\'s message?", you open the app, tap The Word, and it is the first thing there — send them the link and they land right on it.',
      senior: 'The archive view supports: newest-first ordering, month grouping with jump navigation, free-text search across titles, service-day filters (Sunday/Wednesday/all), and a date field for going straight to a known week. It reads from the same channel-derived library the Church page uses, so it is complete and current without curation. Every entry deep-links — the URL carries the view, so a shared link opens the recipient directly into the archive on any device, installed app or browser, signed in or not (watching requires no account; member features do).',
    },
    quiz: {
      questions: [
        {
          q: 'A member asks for a message preached sometime in December last year. Fastest path?',
          options: [
            'Scroll the whole archive from the top',
            'The Word tab → jump to that month (or type a date) → WATCH',
            'Ask them to search YouTube themselves',
          ],
          answer: 1,
          explain: 'Month jump and the date field exist exactly for this — seconds, not scrolling.',
        },
      ],
    },
  },
  {
    id: 'wo3-retire-the-old-site',
    title: 'The old website — one last edit, then no more monthly busywork',
    bigIdea: 'The old Weebly page shows whatever video was pasted into it — so it goes stale the moment a new message lands, and someone has to hand-edit it every month. There is ONE honest fix if the old page must stay up during the transition: replace the pasted single video with the channel\'s uploads-playlist embed. That one edit makes the OLD page also show the newest message forever, with no more monthly edits. And the real destination is simpler still: the Love Corner app IS the church\'s site — point people there.',
    inApp: 'On the old site\'s editor, delete the featured single-video element. Add an "Embed Code" element in its place and paste: <iframe width="560" height="315" src="https://www.youtube.com/embed/videoseries?list=UU821pJh7YR5llBNnWUJj-ZA&rel=0" title="The Love Corner - latest messages" frameborder="0" allowfullscreen></iframe> — then Publish once. That embed always plays the channel\'s newest video first. The month buttons can simply be removed: The Word tab already does their job better.',
    anchor: {
      ref: 'Ecclesiastes 3:1; 1 Corinthians 14:40',
      theme: 'There is a season for every purpose, and the house is served in order. The old page served its season faithfully; ordering the transition — one last edit, then rest — honors both the work that was and the better way that is.',
    },
    benefits: [
      'The monthly edit-and-publish ritual ends — for good.',
      'If the old page must stay up a while, it stays CURRENT by itself.',
      'One clear answer for "where do I send people?" — the app link.',
      'The person who carried the old site is released from busywork into ministry.',
    ],
    levels: {
      teen: 'The old website only shows what somebody pasted into it — that is why it is always behind. Two moves: (1) if the old page needs to stay up for now, swap the pasted video for the special "playlist embed" (the code is in this lesson) — after that, the old page always plays the newest message by itself; (2) going forward, just send people to the Love Corner app instead — it already does everything the old site did, automatically, plus search and more.',
      senior: 'The legacy page\'s staleness is structural: a static embed pins one video id, so currency requires manual replacement. The uploads-playlist embed (videoseries?list=UU…, where the UU id is the channel id with UC swapped for UU) delegates ordering to YouTube — newest first, no maintenance — which makes it the correct terminal state for a legacy page kept up during transition. The month-button archive duplicates what The Word tab derives automatically and can be removed rather than maintained. The strategic direction is consolidation: the app is the church\'s primary web presence (it is installable, searchable, and live), and the legacy page\'s remaining job is to redirect attention there.',
    },
    quiz: {
      questions: [
        {
          q: 'What makes the old page stop going stale?',
          options: [
            'Editing it faster each month',
            'Replacing the pasted single video with the channel\'s uploads-playlist embed — one edit, current forever',
            'Uploading videos twice, once to YouTube and once to Weebly',
          ],
          answer: 1,
          explain: 'The playlist embed follows the channel by itself. One edit retires the monthly ritual.',
        },
      ],
    },
  },
  {
    id: 'wo4-when-it-looks-stale',
    title: 'When a page looks behind — what is true, what to do',
    bigIdea: 'Honesty about timing: after an upload, the app\'s pages follow within a few minutes (the channel feed is checked freshly, with a short cache so the whole church is not hammering YouTube). If a page you are looking at seems behind: give it a few minutes, then reopen the tab (or pull down to refresh on a phone). If it is STILL behind after that, that is worth reporting — and reporting is a feature, not a bother: the Feedback button files it straight to the builders with your words attached.',
    inApp: 'Open the Church page and note the top video. If it ever seems behind the channel: wait a few minutes, reopen the tab, and check again. Still behind? Tap FEEDBACK (bottom-left), say which page and which video you expected, and send. That report lands in the build queue the same day — you are not bothering anyone; you are steering the system.',
    anchor: {
      ref: 'Proverbs 27:23; Zechariah 4:10',
      theme: 'Know the state of your flocks — and do not despise the day of small things. Watching the surfaces honestly, and reporting the small stale thing, is how the whole system stays trustworthy.',
    },
    benefits: [
      'You know the honest timing — minutes, not instants — so a short lag never feels like a breakage.',
      'You know the two-step self-fix: wait briefly, reopen the tab.',
      'You know reporting is welcomed and reaches real builders with receipts.',
      'The church stops living with quiet breakage because everyone assumes someone else will say something.',
    ],
    levels: {
      teen: 'The app checks the church channel every few minutes — so right after an upload, give it a moment. If a page still looks behind: close that tab and open it again (or pull down to refresh). Still wrong? Hit the orange FEEDBACK button and type what you expected to see. That message goes straight to the people who build the app. Saying something is HELPING, not complaining.',
      senior: 'The channel relay caches for roughly ten minutes to keep the whole congregation\'s traffic to one fetch per window — so worst-case staleness after an upload is about that long, plus whatever the open page mounted earlier (a long-resumed installed app can hold an old frame until the view remounts; reopening the tab forces it). Anything beyond that window after a refresh is a genuine defect: file it through Feedback with the page name and the expected video, and it enters the triage queue with your words as the receipt. The platform\'s standing rule is that surfaces state honest timing rather than pretending to be instant.',
    },
    quiz: {
      questions: [
        {
          q: 'You uploaded a message two minutes ago and the Church page still shows last week\'s. What is true?',
          options: [
            'The system is broken and someone must fix the page',
            'Normal — the app follows within a few minutes; wait briefly and reopen the tab',
            'The video must be uploaded again',
          ],
          answer: 1,
          explain: 'The feed refreshes on a short cycle. A few minutes of lag is honest design, not breakage — and after that, reopening the tab shows the newest.',
        },
      ],
    },
  },
  {
    id: 'wo5-ask-for-what-you-want',
    title: 'Build what you want — your voice is the blueprint',
    bigIdea: 'This platform grows from the people who use it — that is the covenant. If the staff wants something (a page changed, a new surface, "can it also do…"), you do not need a meeting or a phone call: SAY IT INTO THE APP. The Feedback button carries wants as well as problems; your words become a requirement in the build queue, get reviewed, and come back as real shipped work — often within days. The old way was living with whatever the website did. The new way is the website doing what YOU say.',
    inApp: 'Think of one thing you wish this app did for your role — anything. Tap FEEDBACK, write it in your own words ("I want…", "it should…"), and send. Your words are kept exactly as you said them, become a requirement with your name on it, and you will see the result in the app when it ships. That loop — spoken want to shipped work — is the whole point of having our own platform.',
    anchor: {
      ref: 'Exodus 35:21; Nehemiah 2:18',
      theme: 'The work of the house was built by everyone whose heart stirred them to bring something — and the people strengthened their hands for the good work. The platform is the church\'s house of tools; every staff voice that speaks into it is bringing material for the building.',
    },
    benefits: [
      'You stop adapting yourself to software — the software adapts to the house.',
      'Your exact words travel to the builders — nothing lost in relay.',
      'You see your asks become real features, which makes asking worth it.',
      'The church owns its tools: what gets built is decided by the Body that uses them.',
    ],
    levels: {
      teen: 'Ever used an app and thought "why can\'t it just…"? Here, that thought is a superpower. Tap Feedback, type what you want in normal words, send. Your idea goes on the builders\' board with your name and your exact words. Real example: the staff wanted the newest sermon to show up automatically — somebody said so, and now the whole system does it. Your want could be next.',
      senior: 'The request rail is first-class infrastructure, not a suggestion box: a submission is preserved verbatim, classified into requirements, reviewed by a steward, and enters the same build queue that every shipped feature moves through, with decision records for what was chosen and why. The platform\'s governing rules bind the builders to close each request visibly — shipped, or answered with a reason and a revisit date — so asks do not vanish into silence. For the church this is the practical meaning of sovereignty: the roadmap is set by the house\'s own voice, not a vendor\'s.',
    },
    quiz: {
      questions: [
        {
          q: 'You wish the app did something it does not do today. What is the right move?',
          options: [
            'Live with it — software is what it is',
            'Tap Feedback and say the want in your own words — it becomes a tracked requirement for the builders',
            'Wait until you happen to see Darrell in person',
          ],
          answer: 1,
          explain: 'Wants are build input. The rail keeps your exact words, tracks the request, and the builders must close it visibly — shipped or answered.',
        },
      ],
    },
  },
];

export const WORD_OUT_INTEREST_TAG = '[Word Out interest]';
export const WORD_OUT_HELPER_TAG = '[Word Out helper]';

export function buildWordOutSchedule() {
  return WORD_OUT_MODULES.map((m, i) => ({ ...m, week: i + 1, date: null, weekday: null }));
}

export function wordOutProgressSummary(progress = {}) {
  return progressSummaryFor(WORD_OUT_MODULES, progress);
}

export function exportWordOutCurriculumMarkdown() {
  return exportCurriculumMarkdownFor(
    { meta: WORD_OUT_META, sessionFlow: WORD_OUT_SESSION_FLOW, modules: WORD_OUT_MODULES },
    null,
  );
}

// Tutor course-meta — the per-lesson solo guide is a warm, patient coach for
// tech-shy church staff: plain words, zero jargon-shaming, Scripture by
// reference only (never quoted from memory), honest about timing (minutes,
// not instants), and always pointing the learner to try the REAL page.
export const WORD_OUT_TUTOR_META = {
  title: WORD_OUT_META.title,
  intro: 'You are a warm, patient coach for church staff learning "Getting the Word Out" — how the newest message reaches every surface automatically, and how to ask for what they want built.',
  posture: 'Teach plainly and kindly for a tech-shy learner: one upload to the church\'s own YouTube channel puts the newest message at the top of the Church page and into The Word archive automatically — no page edits, no month buttons. Be honest about timing (the app follows within a few minutes, and a reopened tab shows the newest; never claim instant). For the legacy Weebly page, the one-time fix is the uploads-playlist embed; the destination is the app itself. Encourage them to use Feedback for wants as well as problems — their words become tracked requirements the builders must close visibly. Cite Scripture by reference with a theme; never quote a translation from memory, never invent a verse. You can be wrong — tell them to verify on the real page, and to report what stays wrong.',
};
