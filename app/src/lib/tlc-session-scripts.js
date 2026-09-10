// =============================================================================
// tlc-session-scripts — Christina's "Training Notes for Therapists-in-Training"
// as six engine-shaped courses (DR-0343, amended 2026-09-10)
// =============================================================================
// Darrell, 2026-09-10, pasting the whole document into the channel: "Training
// Notes for Therapists-in-Training…" and then: "We have lessons etc can we make
// sure those workflows are inside the TLC Therapy Solutions App… Training etc."
// Spoken (here, pasted) teaching is build input (CLAUDE.md): it is captured
// into the surface it belongs in — the TLC training library — faithfully,
// from her words, and shipped the same session.
//
// THE SOURCE. The Drive document "Training Notes for Therapists-in-Training",
// owned by tlctherapysolutions@gmail.com (Christina Poe, LCSW), dated
// 2025-09-28: six session scripts, each with an opening, the client's goal,
// guiding questions or strategies, a role-play, an encouraging wrap-up, and
// key training notes. Every module below keeps that structure and her
// wording; the quizzes and the four strands are the app's framing so the
// scripts render, grade, and log hours through the SAME engine as every
// other course (no fork).
//
// THE WORD, VERBATIM (DR-0076; SCRIPTURE-REFERENCE-STANDARD). Her scripts cite
// Mark 1:35-38, Proverbs 31, Ephesians 4:26, Proverbs 15:1 and Colossians
// 3:23, some in a modern rendering. Each is quoted here from the app's own
// KJV corpus (app/public/bible/kjv), word for word, with the badge; her
// teaching around each verse is kept as she wrote it. Pinned by
// tlc-session-scripts.test.js against the corpus.
//
// HONEST BY DEFAULT: validated:false like every course — Christina ratifies
// each one in-app with the same Agree / Disagree (lib/tlc-course-approval.js)
// even though the words are hers; the app publishes nothing on its own word.
// Pure data: no imports, no dates, authored ids.
// =============================================================================

export const SESSION_SCRIPTS_SOURCE = Object.freeze({
  title: 'Training Notes for Therapists-in-Training',
  teacher: 'Christina Poe, LCSW',
  channel: 'TLC Therapy Solutions',
  url: 'https://docs.google.com/document/d/1GmBgxJbwxmAkBjdDksnhSUWmJjNuIXMCVQcEHfI4xQ8/edit',
  dated: '2025-09-28',
});

// The verses her scripts lean on, KJV, verbatim from the corpus.
export const SCRIPT_VERSES = Object.freeze({
  'Mark 1:35': 'And in the morning, rising up a great while before day, he went out, and departed into a solitary place, and there prayed.',
  'Mark 1:38': 'And he said unto them, Let us go into the next towns, that I may preach there also: for therefore came I forth.',
  'Proverbs 31:25': 'Strength and honour are her clothing; and she shall rejoice in time to come.',
  'Proverbs 31:26': 'She openeth her mouth with wisdom; and in her tongue is the law of kindness.',
  'Ephesians 4:26': 'Be ye angry, and sin not: let not the sun go down upon your wrath:',
  'Proverbs 15:1': 'A soft answer turneth away wrath: but grievous words stir up anger.',
  'Colossians 3:23': 'And whatsoever ye do, do it heartily, as to the Lord, and not unto men;',
  'Psalms 139:14': 'I will praise thee; for I am fearfully and wonderfully made: marvellous are thy works; and that my soul knoweth right well.',
  'Galatians 6:2': 'Bear ye one another’s burdens, and so fulfil the law of Christ.',
});
const V = (ref) => `${ref} (KJV): "${SCRIPT_VERSES[ref]}"`;

const KEY_NOTE_PREFIX = 'Key training notes for therapists-in-training: ';
const src = { teacher: SESSION_SCRIPTS_SOURCE.teacher, channel: SESSION_SCRIPTS_SOURCE.channel, url: SESSION_SCRIPTS_SOURCE.url };
const mod = (id, title, bigIdea, standard, quiz) => ({ id, title, bigIdea, levels: { standard }, quiz });
const q = (question, options, answer, explain) => ({ q: question, options, answer, explain });

export const SESSION_SCRIPT_COURSES = [
  // ---------------------------------------------------------------------------
  // 1 · "Trying to find herself" — identity work
  // ---------------------------------------------------------------------------
  {
    id: 'tl-script-finding-herself',
    field: 'Individual therapy',
    title: 'Session Script — A Client Who Is "Trying to Find Herself"',
    summary: 'How to structure a session with a client who presents with identity concerns, uncertainty about direction, and a desire for self-discovery: open, reflect the goal, explore with gentle questions, close with hope.',
    trainingHours: 1,
    origin: 'tlc-authored',
    source: src,
    sources: [{ label: SESSION_SCRIPTS_SOURCE.title, url: SESSION_SCRIPTS_SOURCE.url }],
    strands: {
      yahweh: { principle: 'A person is not their roles. Yahweh formed each one on purpose and knows them by name; helping a client reconnect with who she is helps her see what He already sees.', anchors: ['Psalms 139:14', 'Jeremiah 1:5'] },
      clinical: 'Open with "What brings you in?", reflect the stated goal back in the client’s own words, use open-ended identity questions, and close every session with affirmation and hope.',
      science: 'Reflective listening and open questions are the core skills of motivational interviewing (Miller & Rollnick, 2013); values clarification is a validated component of acceptance and commitment therapy (Hayes et al., 2012).',
      societal: 'Women who have carried every role for everyone else often present "lost" and ashamed; normalizing the search, not pathologizing it, is the first intervention.',
    },
    preTest: { questions: [
      q('A client says "I don’t know who I am anymore." The first move is…', ['Offer a diagnosis', 'Reflect back what you heard and the goal you are hearing', 'List solutions'], 1, 'Reflect and validate first; the client needs to feel heard before anything else.'),
    ] },
    modules: [
      mod('tl-script-fh-m1', 'Opening the session: "What brings you in…"', 'Begin with an open-ended prompt and let the client name it in her own words; then reflect the goal back so she knows she was heard.',
        'The therapist begins with an open-ended prompt: "What brings you in today?" A typical response: "I just feel like I don’t know who I am anymore. I’ve been doing all the things I’m supposed to do — taking care of others, working, showing up — but I feel lost inside. I want to figure out who I really am." From the start, reflect the stated goal: "So what I’m hearing is that your main goal is to reconnect with yourself — to rediscover who you are, gain clarity about what matters to you, and live more authentically. Did I capture that right?" This gives the client a sense of being heard and establishes direction for the work. In the session these notes came from, the client identified her goal as "finding myself again": confidence, her authentic voice, a daily life aligned with what feels meaningful, and letting go of expectations others placed on her.',
        { questions: [
          q('Reflecting the goal back does what?', ['Proves the therapist is right', 'Lets the client feel heard and sets direction', 'Ends the session early'], 1, 'It builds the alliance and gives the work a direction.'),
          q('The best opening line is…', ['"What is your diagnosis?"', '"What brings you in today?"', '"Let me tell you what I think"'], 1, 'Open-ended, inviting the client’s own account.'),
        ] }),
      mod('tl-script-fh-m2', 'Guiding questions to explore identity', 'Gentle, open-ended questions help the client uncover pieces of identity, passion, and purpose.',
        'Use gentle, open-ended questions: Who are you outside of your roles (mother, partner, professional, etc.)? What activities make you feel alive, joyful, or at peace? What values are most important to you right now? When in the past did you feel the most like yourself, and what was happening then? What parts of yourself do you feel you’ve had to hide or push aside? What do you want more of in your life, and what do you want less of? If you imagined your best self five years from now, what would she look like, feel like, and be doing? When a client says "I’m not even sure anymore," normalize and encourage: "It’s very common to feel that way. Sometimes we get so wrapped up in what others need from us that our own identity gets pushed aside. Let’s think about moments when you felt most like yourself." When she remembers painting in college, affirm it: "That’s a powerful memory. It sounds like creativity brings out a side of you that feels authentic and alive." When she names peace and honesty as her values: "That’s a strong foundation we can build on."',
        { questions: [
          q('"When did you feel most like yourself?" is asked to…', ['Test her memory', 'Uncover a piece of identity she can build on', 'Change the subject'], 1, 'A remembered moment of authenticity becomes a foundation.'),
          q('When the client says "I’ve lost that part of me," the therapist should…', ['Normalize it and keep exploring', 'Correct her', 'Move on to homework'], 0, 'Normalize, then guide toward a moment she felt like herself.'),
        ] }),
      mod('tl-script-fh-m3', 'Wrapping up with encouragement', 'Always close with affirmation and hope: self-discovery is a process, and the client is not alone.',
        'Close every session with hope: "You’ve already taken such an important first step by being here and naming this desire to find yourself. It shows strength and courage. This process will take time, but we’ll walk through it together. I believe you’ll rediscover the woman you’re meant to be — piece by piece, step by step." A likely response: "Thank you… it feels good to know I don’t have to figure it out alone." ' + KEY_NOTE_PREFIX + 'always reflect back what the client says to show understanding; normalize feelings of being "lost" instead of pathologizing them; use open-ended questions to gently uncover identity, values, and passions; close every session with affirmation and hope to strengthen the client’s motivation. Clients seeking identity work often feel lost, ashamed, or "behind." The therapist’s role is to normalize the process, create space for exploration, and reinforce that self-discovery is a journey they will not walk alone.',
        { questions: [
          q('The close of the session should…', ['Assign a diagnosis', 'Affirm the step taken and offer hope', 'Summarize her failures'], 1, 'Affirmation and hope strengthen motivation.'),
          q('A client feeling "behind" is met with…', ['Normalizing the process', 'A timeline', 'Silence'], 0, 'Normalize; self-discovery is a journey, not a race.'),
        ] }),
    ],
    postTest: { questions: [
      q('The structure of an identity session is…', ['Open, reflect the goal, explore with open questions, close with hope', 'Diagnose, prescribe, dismiss', 'Advice first'], 0, 'That is the four-part shape of the script.'),
      q('"What do you want more of, and less of?" belongs to…', ['The opening', 'The exploring questions', 'The wrap-up'], 1, 'It is one of the guiding questions.'),
      q('Feeling lost is treated as…', ['A disorder', 'A normal, workable place to begin', 'A reason to refer out'], 1, 'Normalize, then explore.'),
    ] },
  },

  // ---------------------------------------------------------------------------
  // 2 · Strength and learning to say "no"
  // ---------------------------------------------------------------------------
  {
    id: 'tl-script-saying-no',
    field: 'Ethics & boundaries',
    title: 'Session Script — Helping a Client Build Strength and Learn to Say "No"',
    summary: 'How to help a client develop assertiveness, set boundaries, and apply biblical principles of strength and self-worth — including the difference between boundaries with others and mutual respect in marriage.',
    trainingHours: 1,
    origin: 'tlc-authored',
    source: src,
    sources: [{ label: SESSION_SCRIPTS_SOURCE.title, url: SESSION_SCRIPTS_SOURCE.url }],
    strands: {
      yahweh: { principle: 'Jesus Himself kept boundaries: He rose early to pray alone and moved on when the crowd wanted more. A "no" spoken out of wisdom is stewardship of what Yahweh gave, not selfishness; the strong woman of Proverbs 31 is clothed with strength, not drained.', anchors: ['Mark 1:35', 'Mark 1:38', 'Proverbs 31:25', 'Proverbs 31:26'] },
      clinical: 'Reframe the goal from "saying no" to creating space for peace and balance; explore what makes refusing hard; differentiate friends and coworkers from the marriage covenant; rehearse respectful, firm language.',
      science: 'Assertiveness training has a long evidence base for reducing anxiety and improving relationships (Speed, Goldstein & Goldfried, 2018 review); behavioral rehearsal in session is the active ingredient.',
      societal: 'Caregiving women are socialized to equate refusal with selfishness; the guilt is real and is named, then reframed rather than dismissed.',
    },
    preTest: { questions: [
      q('Saying "no" to a request is…', ['Always selfish', 'Sometimes wisdom and stewardship', 'Never appropriate for a believer'], 1, 'Boundaries can be wise and biblically sound.'),
    ] },
    modules: [
      mod('tl-script-no-m1', 'Opening and the client’s goal', 'The goal is not just "saying no" — it is creating space for peace, balance, and honoring what God has for her life.',
        'The therapist opens: "What brings you in today?" The client: "I feel like I can never say no. Everyone asks me for things, and I always say yes, even when I’m exhausted. I don’t want to keep living like this." Reflect and validate: "So you’ve been carrying a heavy load because you feel pressure to always say yes to people, and now you want to build the strength to stand up for yourself. That’s a brave and important step." Then ask what standing up for herself would look like — "I’d feel free. I wouldn’t feel guilty all the time. I’d have time for myself" — and reframe positively: "So the goal here is not just about saying ‘no,’ but about creating space for peace, balance, and honoring what God has for your life."',
        { questions: [
          q('The reframed goal is…', ['Winning arguments', 'Space for peace, balance, and honoring God’s plan', 'Avoiding people'], 1, 'The reframe lifts the goal above refusal.'),
          q('Before teaching skills, the therapist first…', ['Validates the load she carries', 'Assigns homework', 'Lists her mistakes'], 0, 'Validation comes first.'),
        ] }),
      mod('tl-script-no-m2', 'Boundaries, Scripture, and the difference in marriage', 'Even Jesus set boundaries; and the way one responds to friends and coworkers is not the way one responds inside the marriage covenant.',
        'When the client says "I don’t want them to be mad at me. I feel selfish if I don’t help," normalize and reframe with Scripture: "It makes sense that you want to love and serve others. But saying ‘no’ doesn’t mean you’re being selfish. Even Jesus set boundaries — He rested, He prayed alone, and He didn’t heal every single person who asked. You are called to serve, but also to steward your energy and health." ' + V('Mark 1:35') + ' ' + V('Mark 1:38') + ' Then differentiate relationships: "The way you’ll respond to friends, coworkers, or extended family is not the same way you’ll respond to your husband, if you’re married. Marriage is a covenant relationship where respect, love, and unity come first. Standing strong in your marriage may look more like honest communication and compromise, not simply saying no." Encourage: "Strength doesn’t mean pushing everyone away. It means knowing when to say yes out of love and when to say no out of wisdom."',
        { questions: [
          q('Mark 1:35-38 is used to show…', ['Jesus never rested', 'Jesus kept boundaries — solitude and moving on', 'Boundaries are unbiblical'], 1, 'He withdrew to pray and did not stay for every request.'),
          q('In marriage, standing strong looks more like…', ['Simply saying no', 'Honest communication and compromise', 'Silence'], 1, 'The covenant relationship is treated differently.'),
        ] }),
      mod('tl-script-no-m3', 'Practicing assertive responses and the wrap-up', 'Rehearse respectful but firm language; tone and body language matter as much as words; close with strength grounded in God’s truth.',
        'Practice responses the client can use when asked for things she cannot or does not want to do: "I’d love to help, but I can’t commit to that right now." "Thank you for thinking of me, but I’ll have to pass this time." "Let me pray about it and get back to you." Note to the trainee: the goal is respectful but firm language; tone and body language matter as much as words. Wrap up: "You’ve already taken such a strong step by admitting you’re ready to stop saying yes to everything. Remember, Proverbs 31 describes a woman who is strong, wise, and discerning — not one who is drained and overextended." ' + V('Proverbs 31:25') + ' ' + V('Proverbs 31:26') + ' "Piece by piece, we’ll build your confidence to say no when needed and yes when it truly aligns with God’s will. You don’t have to do this alone." ' + KEY_NOTE_PREFIX + 'normalize the client’s guilt but reframe boundary-setting as biblically sound and healthy; teach the difference between assertiveness with others and mutual respect in marriage; encourage practice of simple, kind, but firm language for saying no; always wrap up with Scripture or faith-based encouragement to ground strength in God’s truth.',
        { questions: [
          q('A rehearsed refusal from the script is…', ['"Leave me alone."', '"Thank you for thinking of me, but I’ll have to pass this time."', '"Fine, I’ll do it."'], 1, 'Kind, simple, firm.'),
          q('Proverbs 31 is cited to picture a woman who is…', ['Drained and overextended', 'Strong, wise, and discerning', 'Silent'], 1, 'Strength and honour are her clothing.'),
        ] }),
    ],
    postTest: { questions: [
      q('The client’s guilt about refusing is…', ['Dismissed', 'Normalized, then reframed', 'Agreed with'], 1, 'Name it, then reframe it as biblically sound stewardship.'),
      q('Boundaries with a coworker and with a spouse are…', ['Identical', 'Different — covenant relationships call for communication and compromise', 'Both avoided'], 1, 'The script draws that distinction on purpose.'),
      q('Tone and body language in a refusal…', ['Do not matter', 'Matter as much as the words', 'Should be aggressive'], 1, 'The trainee note says exactly this.'),
    ] },
  },

  // ---------------------------------------------------------------------------
  // 3 · Managing anger
  // ---------------------------------------------------------------------------
  {
    id: 'tl-script-managing-anger',
    field: 'Individual therapy',
    title: 'Session Script — Helping Clients Manage Anger',
    summary: 'Guide a client who presents with frequent or intense anger to understand, process, and express it in healthier ways: find the need beneath it, teach coping strategies, role-play new communication, and ground it in Scripture for Christian clients.',
    trainingHours: 1,
    origin: 'tlc-authored',
    source: src,
    sources: [{ label: SESSION_SCRIPTS_SOURCE.title, url: SESSION_SCRIPTS_SOURCE.url }],
    strands: {
      yahweh: { principle: 'Anger itself is not sin; the Word commands "be ye angry, and sin not" and bounds it before sundown. Jesus showed anger at mistreatment. The work is expressing it in a way that honors Yahweh and harms no one.', anchors: ['Ephesians 4:26', 'Proverbs 15:1'] },
      clinical: 'Validate the anger as a signal, explore the need beneath it, teach pause-and-breathe, stepping away, naming the need, and "I" statements, then role-play the new response.',
      science: 'Anger is a fast limbic response; brief pauses and paced breathing lower arousal and restore prefrontal regulation (Gross, 1998; the process model of emotion regulation), which is why "pause before speaking" works.',
      societal: 'Clients who feel disrespected or unheard often carry that experience from real settings; the anger is treated as information about what matters, never as a character verdict.',
    },
    preTest: { questions: [
      q('According to the script, anger itself is…', ['Always sinful', 'A signal that something matters', 'A disorder'], 1, 'Anger is a signal; how it is handled is the work.'),
    ] },
    modules: [
      mod('tl-script-anger-m1', 'Opening, goal, and the need beneath the anger', 'Underneath anger is usually a desire to feel valued and heard; naming that need is the first insight.',
        'The therapist opens: "What brings you in today?" The client: "I get angry all the time. It’s like I go from 0 to 100. I yell, shut down, or say things I regret." Reflect and validate: "So you’re noticing that anger comes up quickly and feels overwhelming, and afterward you feel regret. It sounds like your goal is to learn how to manage your anger in a healthier way." Ask what handling it differently would look like — "I’d be calmer. I wouldn’t explode. I’d be able to talk without hurting people" — and encourage: "That’s a powerful goal — to be able to express yourself with strength but also peace." Explore triggers: "Are there common patterns?" When the client names feeling disrespected, ignored, or unheard, reframe: "So underneath your anger is a desire to feel valued and heard. That’s an important insight. Anger itself isn’t wrong — it’s a signal something matters to you."',
        { questions: [
          q('The reframe of anger in the script is…', ['A character flaw', 'A signal that something matters', 'Something to suppress'], 1, 'It points to the need beneath it.'),
          q('Common needs beneath anger include…', ['Respect, understanding, safety, fairness', 'Nothing in particular', 'Only control'], 0, 'The script names respect, control, safety, fairness.'),
        ] }),
      mod('tl-script-anger-m2', 'A biblical perspective and coping strategies', 'For a Christian client, Scripture reframes anger as something to be managed, not suppressed or exploded; then practical strategies are practiced together.',
        'For a Christian client: ' + V('Ephesians 4:26') + ' "That shows us anger itself isn’t a sin — it’s how we handle it that matters. Even Jesus showed anger when people were being mistreated, like when He turned over the tables in the temple. The key is expressing anger in a way that honors God and doesn’t harm others." Strategies to practice when anger is building: Pause and breathe — three to five slow breaths before speaking. Step away — remove yourself briefly if possible. Identify the need — ask, "What do I really want right now: respect, understanding, peace?" Use "I" statements — replace blame with "I feel ___ when ___." Pray or ground — for Christian clients, a short prayer: "Lord, help me respond with wisdom and peace."',
        { questions: [
          q('Ephesians 4:26 teaches that…', ['Anger is always sin', 'One may be angry and not sin, and should not let it last', 'Anger should be hidden'], 1, 'Be ye angry, and sin not.'),
          q('An "I" statement replaces…', ['Breathing', 'Blame', 'Prayer'], 1, '"I feel ___ when ___" replaces blame.'),
        ] }),
      mod('tl-script-anger-m3', 'Role-play, and the wrap-up', 'Practice the new response in session; close by reframing anger as energy that can be channeled for good.',
        'Role-play: if someone cuts the client off in conversation, instead of snapping: "I feel frustrated when I don’t get a chance to finish my thought. Can we pause so I can share?" When the client says that sounds calmer than usual, affirm: "It’s not about stuffing your feelings — it’s about expressing them in a way that builds connection instead of breaking it." Wrap up: "You’ve already taken a huge step by admitting anger is something you want to change. That shows strength, not weakness. Remember, anger is just energy — it can be channeled for good. With practice, you’ll learn to pause, choose your words, and honor both yourself and others." ' + KEY_NOTE_PREFIX + 'always validate that anger itself is not "bad" — it is a signal; explore the needs beneath the anger (respect, control, safety, fairness); teach practical coping strategies (breathing, pausing, stepping away, reframing); use role-play so the client can practice new communication skills; for Christian clients, weave in Scripture that reframes anger as something to be managed, not suppressed or exploded.',
        { questions: [
          q('Role-play is used so the client can…', ['Be corrected', 'Practice the new communication skill', 'Avoid the topic'], 1, 'Rehearsal is the point.'),
          q('The wrap-up frames anger as…', ['A weakness', 'Energy that can be channeled for good', 'A reason for shame'], 1, 'Strength, not weakness.'),
        ] }),
    ],
    postTest: { questions: [
      q('The first therapeutic stance toward anger is…', ['Validate it as a signal', 'Forbid it', 'Ignore it'], 0, 'Validate, then explore the need.'),
      q('"Pause and breathe" means…', ['Leave the relationship', 'Three to five slow breaths before speaking', 'Hold the breath'], 1, 'Slow breaths before speaking.'),
      q('For Christian clients the script adds…', ['Scripture that reframes anger as manageable', 'A ban on anger', 'Nothing'], 0, 'Ephesians 4:26 and Jesus in the temple.'),
    ] },
  },

  // ---------------------------------------------------------------------------
  // 4 · Family conflict
  // ---------------------------------------------------------------------------
  {
    id: 'tl-script-family-conflict',
    field: 'Couples & family',
    title: 'Session Script — Helping Clients Who Struggle With Family Conflict',
    summary: 'Help a client navigate ongoing conflict with family members, manage feelings of being unheard, and build healthier communication and boundaries — with a faith-based frame for Christian clients.',
    trainingHours: 1,
    origin: 'tlc-authored',
    source: src,
    sources: [{ label: SESSION_SCRIPTS_SOURCE.title, url: SESSION_SCRIPTS_SOURCE.url }],
    strands: {
      yahweh: { principle: 'A soft answer turns away wrath. Yahweh calls His people to speak truth in love and seek peace even in hard relationships — with wisdom and boundaries, never by allowing abuse.', anchors: ['Proverbs 15:1'] },
      clinical: 'Validate the exhaustion, map the interaction pattern (interrupt → defend → argue), teach "I" statements, active listening, pausing, picking battles, and boundaries; rehearse in role-play.',
      science: 'Escalation cycles are well described in family systems work (Bowen; Minuchin) and in Gottman’s research on criticism and defensiveness; a non-defensive first response measurably de-escalates.',
      societal: 'Family loyalty and hierarchy vary by culture; the aim is to be heard while honoring family, which the client, not the clinician, defines.',
    },
    preTest: { questions: [
      q('When a family member interrupts, the script suggests…', ['Interrupting back', 'A calm statement that you would like to finish', 'Leaving for good'], 1, '"I hear you, but I’d like to finish what I was saying."'),
    ] },
    modules: [
      mod('tl-script-fam-m1', 'Opening, goal, and the pattern', 'Conflict escalates when everyone protects their own point of view instead of listening; naming the pattern is the first step.',
        'The therapist opens: "What brings you in today?" The client: "I can’t get along with my family. No one listens to me, and we’re always arguing. I’m exhausted and don’t know how to fix it." Reflect and validate: "So you’re feeling unheard and frustrated because family interactions consistently lead to arguments. It sounds overwhelming, and you’re looking for ways to feel more peace and connection." Ask what healthier relationships would look like — "I’d feel respected. We could talk without fighting. I’d feel like my voice matters" — and reframe: "That’s a clear and meaningful goal: to be heard and understood while maintaining peace in the relationship." Explore the pattern: "Whenever I try to speak up, someone interrupts or dismisses me. Then I get defensive, and it turns into an argument." Normalize: "It’s understandable to feel defensive when you’re not being heard. Conflict often escalates when everyone is trying to protect their own point of view instead of listening."',
        { questions: [
          q('The pattern named in the script is…', ['Interrupt, defend, argue', 'Listen, agree, resolve', 'Silence'], 0, 'That is the escalation loop.'),
          q('Feeling defensive when unheard is…', ['Understandable', 'A disorder', 'Unusual'], 0, 'The script normalizes it.'),
        ] }),
      mod('tl-script-fam-m2', 'Healthy communication and the faith-based frame', 'Five strategies protect the client’s peace; for Christian clients, Proverbs 15:1 frames gentleness and boundaries together.',
        'Strategies: Use "I" statements — focus on how you feel rather than blaming ("I feel hurt when I’m interrupted because I want to share my perspective"). Active listening — reflect back what the other person is saying before responding. Pause and breathe — step away if emotions escalate. Pick your battles — decide which issues are worth addressing and which to let go. Set boundaries — politely but firmly set limits when conversations become disrespectful. For Christian clients: ' + V('Proverbs 15:1') + ' "God calls us to speak truth in love and to seek peace, even in difficult relationships. This doesn’t mean you allow abuse or disrespect — it means you respond with wisdom and boundaries, not just emotion."',
        { questions: [
          q('"Pick your battles" means…', ['Fight every issue', 'Decide which issues are worth addressing', 'Never speak up'], 1, 'Choose what to address and what to let go.'),
          q('Proverbs 15:1 is used to teach…', ['Allowing disrespect', 'Gentle answers with wisdom and boundaries', 'Winning'], 1, 'A soft answer, never the absence of boundaries.'),
        ] }),
      mod('tl-script-fam-m3', 'Role-play and the wrap-up', 'Practice the new response with a sibling who interrupts; close with the truth that the client can change how she responds even if the family does not change.',
        'Role-play: imagine a sibling interrupts. Instead of arguing: "I hear you, but I’d like to finish what I was saying." Or: "I feel frustrated when I’m not heard. Can we take a moment and then continue?" When the client says that feels different from her usual reaction, affirm: "Yes, it’s a new skill. With practice, it becomes more natural, and over time, family conflict can decrease even if they don’t change." Wrap up: "You’ve already taken an important step by acknowledging the difficulty and wanting to approach it differently. Family relationships can be challenging, but you can respond with wisdom, calm, and healthy boundaries. Step by step, you’ll gain confidence and see change in how you feel, even if others don’t immediately change." ' + KEY_NOTE_PREFIX + 'validate the client’s feelings of frustration and exhaustion; help the client identify patterns and triggers in family conflict; teach communication skills like "I" statements, active listening, and pausing; encourage healthy boundaries to protect mental and emotional health; use biblical principles for Christian clients to frame wisdom, gentleness, and peace.',
        { questions: [
          q('The realistic promise of the wrap-up is…', ['The family will change', 'The client’s response and feelings can change even if they don’t', 'Conflict ends forever'], 1, 'Change in the client, whatever others do.'),
          q('The rehearsed line for an interruption is…', ['"Stop talking!"', '"I hear you, but I’d like to finish what I was saying."', '"Forget it."'], 1, 'Calm and clear.'),
        ] }),
    ],
    postTest: { questions: [
      q('Active listening means…', ['Waiting to talk', 'Reflecting back what the other person said before responding', 'Agreeing'], 1, 'Reflect first.'),
      q('Boundaries in family conflict are set…', ['Aggressively', 'Politely but firmly when conversations become disrespectful', 'Never'], 1, 'Polite, firm limits.'),
      q('The faith frame for Christian clients is…', ['Tolerate abuse', 'Speak truth in love, seek peace, with wisdom and boundaries', 'Avoid family'], 1, 'Proverbs 15:1 with boundaries.'),
    ] },
  },

  // ---------------------------------------------------------------------------
  // 5 · Couples — household and parenting imbalance
  // ---------------------------------------------------------------------------
  {
    id: 'tl-script-household-imbalance',
    field: 'Couples & family',
    title: 'Session Script — Helping Couples Navigate Household and Parenting Imbalance',
    summary: 'Facilitate a couples session where one partner is overburdened at home and the other works outside and relaxes afterward: validate both, name the mental load, teach empathy and clear division of responsibilities, and set structure between sessions.',
    trainingHours: 1,
    origin: 'tlc-authored',
    source: src,
    sources: [{ label: SESSION_SCRIPTS_SOURCE.title, url: SESSION_SCRIPTS_SOURCE.url }],
    strands: {
      yahweh: { principle: 'Whatever is done in a home is done heartily as to the Lord; in marriage, serving one another with love and respect and bearing one another’s burdens strengthens the partnership Yahweh joined.', anchors: ['Colossians 3:23', 'Galatians 6:2'] },
      clinical: 'Validate each partner equally, map a typical day, teach feelings-without-blame and active listening, divide responsibilities in a written list, add gratitude and a weekly check-in.',
      science: 'The invisible "mental load" of household management is documented as a distinct, unequally distributed burden (Daminger, 2019); perceived fairness in division of labor predicts relationship satisfaction (Gottman & Silver, 1999).',
      societal: 'Household imbalance often follows inherited gender scripts; the intervention makes the work visible without shaming either partner.',
    },
    preTest: { questions: [
      q('In a couples session about chores, the therapist should…', ['Take the overburdened partner’s side', 'Validate both partners’ experiences equally', 'Assign blame'], 1, 'Both experiences are valid; the goal is understanding and balance.'),
    ] },
    modules: [
      mod('tl-script-home-m1', 'Opening both partners and the shared goal', 'Both experiences are valid; the shared goal is balance and teamwork where each feels respected, supported, and connected.',
        'The therapist opens: "Thank you both for being here. Can each of you share what brings you in today?" Partner A: "I feel like I’m doing everything at home — cleaning up, cooking, working with the kids, managing schedules — and then he comes home from work and just relaxes. I’m exhausted and resentful." Partner B: "I go to work, I’m tired too, and I just want some peace when I get home. I don’t realize how much you’re doing." Reflect and validate both: "Partner A, you’re feeling overwhelmed and unappreciated. Partner B, you’re feeling tired and want to rest, but may not fully see the work happening at home. Both of your experiences are valid, and the goal is to help you understand each other and find balance." Ask what different would look like, then reframe: "So your shared goal is to create balance and teamwork, where both partners feel respected, supported, and connected rather than frustrated or exhausted."',
        { questions: [
          q('The therapist validates…', ['Only the overburdened partner', 'Both partners equally', 'Neither'], 1, 'Equal validation keeps both engaged.'),
          q('The shared goal is reframed as…', ['Who is right', 'Balance and teamwork', 'Separate lives'], 1, 'Respect, support, connection.'),
        ] }),
      mod('tl-script-home-m2', 'Mapping the day, empathy, and clear responsibilities', 'Walk a typical day for each partner so the imbalance becomes visible; then teach feelings without blame, active listening, a clear division of tasks, gratitude, and check-ins.',
        'Walk a typical day. Partner A: up early, kids ready, cooking, cleaning, homework, activities, keeping the house in order. Partner B: work, home, emails, relax before dinner. Reflect and normalize: "It’s common for couples to fall into these routines without realizing the imbalance. Partner A carries a heavy mental and physical load, while Partner B may not notice how demanding that is." Strategies: share feelings without blame ("I feel exhausted and stressed when I handle all the household work alone" / "I hear that, and I want to understand how I can help"); active listening ("So you’re saying you feel like you’re doing most of the work at home, and it’s wearing you out"); divide responsibilities clearly with a realistic list of daily and weekly tasks decided together; recognize effort and gratitude regularly; schedule weekly ten to fifteen minute check-ins on workload, frustrations, and adjustments.',
        { questions: [
          q('Walking through a typical day serves to…', ['Embarrass a partner', 'Make the imbalance visible without blame', 'Fill time'], 1, 'Visibility, not blame.'),
          q('A weekly check-in is…', ['An hour-long argument', 'Ten to fifteen minutes on workload and adjustments', 'Unnecessary'], 1, 'Short and structured.'),
        ] }),
      mod('tl-script-home-m3', 'Role-play, the deeper dynamic, faith, homework, and the wrap-up', 'Underneath the tasks is the need to feel valued, heard, and supported; for Christian couples, serving one another as to the Lord frames the teamwork.',
        'Role-play. Partner A: "I feel overwhelmed managing the house and the kids while you come home and relax. Can we figure out a plan to share responsibilities?" Partner B: "I understand. I want to help more. Let’s list what needs to be done and divide it so we both feel supported." Reinforce: neither partner attacks the other; they express feelings, listen, and collaborate. Address the underlying dynamic: "Often, this imbalance isn’t just about tasks — it’s about feeling valued, heard, and supported." For Christian couples: ' + V('Colossians 3:23') + ' "In marriage, serving each other with love and respect strengthens the partnership. Both partners contribute according to their capacities, value each other’s work, and seek unity rather than division." Homework: a daily team-tasks chart that makes contributions visible; an evening reflection where each partner shares one thing they appreciate about the other’s efforts; a weekly check-in. Wrap up: "You’ve both taken an important step by coming in and being honest about your struggles. This imbalance is common, but with structured communication, empathy, and shared responsibility, you can reduce tension and foster teamwork." ' + KEY_NOTE_PREFIX + 'validate each partner’s feelings and experiences equally; highlight the mental and emotional load of household and childcare responsibilities; teach practical communication skills ("I" statements, active listening, collaborative problem-solving); introduce structure (task lists, check-ins, accountability) to reduce frustration; for Christian couples, reinforce teamwork, service, and gratitude as spiritual principles.',
        { questions: [
          q('The homework includes…', ['A team-tasks chart, an evening appreciation, a weekly check-in', 'A chore contract signed by a lawyer', 'Nothing'], 0, 'Three concrete practices.'),
          q('Colossians 3:23 frames household work as…', ['Beneath a working partner', 'Done heartily as to the Lord', 'Optional'], 1, 'Whatsoever ye do, do it heartily.'),
        ] }),
    ],
    postTest: { questions: [
      q('The "mental load" refers to…', ['Physical chores only', 'The invisible managing and remembering that runs a household', 'Work stress'], 1, 'The script highlights it explicitly.'),
      q('In the role-play, neither partner…', ['Speaks', 'Attacks the other', 'Listens'], 1, 'They express, listen, collaborate.'),
      q('Structure (lists, check-ins) is introduced to…', ['Control a partner', 'Reduce frustration and build accountability', 'Replace conversation'], 1, 'Structure supports teamwork.'),
    ] },
  },

  // ---------------------------------------------------------------------------
  // 6 · Healing after an unhealthy relationship
  // ---------------------------------------------------------------------------
  {
    id: 'tl-script-healing-after-relationship',
    field: 'Individual therapy',
    title: 'Session Script — Healing After an Unhealthy Relationship',
    summary: 'Help a client process a past unhealthy relationship, understand patterns, strengthen self-awareness, and set boundaries and deal-breakers for future relationships.',
    trainingHours: 1,
    origin: 'tlc-authored',
    source: src,
    sources: [{ label: SESSION_SCRIPTS_SOURCE.title, url: SESSION_SCRIPTS_SOURCE.url }],
    strands: {
      yahweh: { principle: 'A person’s worth was settled by Yahweh before any relationship: fearfully and wonderfully made. Healing restores the client’s sight of that worth so the next relationship honors it.', anchors: ['Psalms 139:14'] },
      clinical: 'Process the past before planning the future: reflect on why she stayed and what needs were met, name the missing boundaries and red flags, clarify values and self-love, discuss hard truths about dating, and set deal-breakers.',
      science: 'Trauma-informed relationship work recognizes that attachment patterns and intermittent reinforcement keep people in harmful relationships; insight plus concrete boundary rehearsal reduces repetition (Herman, 1992; Cloud & Townsend, 1992 on boundaries).',
      societal: 'Shame about "making the same mistake" is common and isolating; the script treats the pattern as learnable, not as a verdict on the client.',
    },
    preTest: { questions: [
      q('Before planning future relationships, the script says to…', ['Skip the past', 'Process the past relationship first', 'Start dating immediately'], 1, 'Process the past before jumping ahead.'),
    ] },
    modules: [
      mod('tl-script-heal-m1', 'Opening and the client’s goal', 'Noticing patterns from the last relationship and wanting to learn from them is a strong, brave step.',
        'The therapist opens: "What brings you in today?" The client: "I’m still healing from my last relationship. I want to stop making the same mistakes and know what to look for next time." Reflect and validate: "You’re noticing patterns from your last relationship and want to learn from them. That’s a strong and brave step toward healthier connections in the future." Ask what she would want future relationships to look like — "Respectful, loving, balanced… I don’t want to lose myself or feel controlled again" — and reframe: "So your goal is to heal, regain confidence, and build relationships that honor your needs and boundaries."',
        { questions: [
          q('The reframed goal is…', ['Finding a partner fast', 'Healing, confidence, and relationships that honor her needs and boundaries', 'Avoiding all relationships'], 1, 'Heal first; honor needs and boundaries.'),
          q('Wanting to learn from patterns is treated as…', ['A weakness', 'A strong and brave step', 'Denial'], 1, 'Validate the courage.'),
        ] }),
      mod('tl-script-heal-m2', 'Guiding questions to explore the past relationship', 'Six areas of reflection: the relationship itself, boundaries and self-awareness, red flags and patterns, self-love and values, hard truths about dating, and future relationships.',
        'Relationship reflection: Why did you stay? What needs were being met, even if it wasn’t healthy? How did it make you feel about yourself? Boundaries and self-awareness: What boundaries were missing or ignored? What boundaries do you want next time, and how will you enforce them? Red flags and patterns: What early red flags did you notice? Did you ignore warning signs, and why? Are there patterns from past relationships repeating? Self-love and values: How did you feel about yourself during and after? What makes you feel confident and valued? How do your values shape the type of partner you want? Hard truths about dating: What hard truths do you want to remember? How will you navigate dishonesty, manipulation, or mismatched priorities? What deal-breakers will you set? Future relationships: What kind of partner aligns with your needs and values? How will you ensure communication and respect? How will you handle conflict differently next time?',
        { questions: [
          q('"What needs were being met, even if it wasn’t healthy?" helps the client…', ['Excuse the partner', 'Understand why she stayed', 'Forget the past'], 1, 'Insight into the pull of the relationship.'),
          q('Deal-breakers belong to…', ['Hard truths about dating', 'The opening', 'Homework only'], 0, 'They are set in the hard-truths reflection.'),
        ] }),
      mod('tl-script-heal-m3', 'Practical reflection and the wrap-up', 'Healing is not only recovering from the past — it is using that experience to make wiser choices; it takes time and self-compassion.',
        'Practical reflection: "Imagine you’re meeting someone new. You notice early signs that could be red flags. How might you respond differently now?" The client: "I’d trust my gut, ask questions, and not ignore warning signs. I wouldn’t compromise my boundaries just to keep the person happy." Affirm: "Healing isn’t just about recovering from the past — it’s about using that experience to make wiser choices in the future." Wrap up: "You’ve already taken a courageous step by reflecting on the past and wanting to do better in the future. Healing is a process, and it takes time to rebuild confidence and clarity. By understanding your patterns, setting strong boundaries, and trusting yourself, you’ll attract relationships that honor your worth." ' + KEY_NOTE_PREFIX + 'focus on processing the past before jumping to future relationships; ask reflective questions to uncover patterns, needs, and missed boundaries; encourage self-love and values clarification as a guide for future relationships; discuss hard truths about dating to prepare the client for challenges; emphasize red flags, deal-breakers, and non-negotiables; reinforce that healing is a process — progress takes time and self-compassion.',
        { questions: [
          q('Healing, in the script, is…', ['Forgetting the past', 'Using the past to make wiser choices', 'Blaming oneself'], 1, 'Recovery plus wiser choices.'),
          q('Progress in healing takes…', ['One session', 'Time and self-compassion', 'A new partner'], 1, 'The last key note.'),
        ] }),
    ],
    postTest: { questions: [
      q('The order of the work is…', ['Future first, past later', 'Process the past, then plan the future', 'Neither'], 1, 'Past before future.'),
      q('Red flags are explored to…', ['Assign blame', 'Recognize patterns and set non-negotiables', 'Scare the client'], 1, 'Patterns, deal-breakers, non-negotiables.'),
      q('Self-love and values are framed as…', ['Selfish', 'A guide for future relationships', 'Irrelevant'], 1, 'They guide the partner she chooses.'),
    ] },
  },
];
