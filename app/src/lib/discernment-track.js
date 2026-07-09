// =============================================================================
// discernment-track — the REUSABLE "World Issues / Discernment" lesson engine
// =============================================================================
// A pattern that takes a charged, real-world claim and teaches stakeholders HOW
// to think it through — media literacy + biblical discernment — rather than
// telling them WHAT to conclude. It rides the SAME shared Learn engine as every
// other PoeTech course (church-classes.js generic helpers, learn-framework.js
// schema + age-adaptive branching + quiz, the self-driving tutor): an "issue" is
// authored structured data; buildDiscernmentModule() PROJECTS that issue into the
// standard Learn module shape, so it renders today through ChurchLearn with no
// fork. The structured issue is ALSO carried on the module (module.issue) so the
// dedicated five-stage renderer can show the labeled stages, and so the
// safeguards below can machine-check it (DR-0076 — verification over claims).
//
// THE FIVE STAGES (the transferable pattern, identical for ANY issue):
//   1. THE CLAIM        — the claim(s) AS MADE, source attributed, explicitly
//                         LABELED (allegation / claim / opinion / call-to-action),
//                         never presented as a settled verdict.
//   2. VERIFIABLE vs INTERPRETATION — documented fact (checkable against primary
//                         sources, each with an as-of date) separated from
//                         interpretation / inference / opinion.
//   3. PERSPECTIVES     — the multiple good-faith perspectives, each STEELMANNED
//                         (the evenhandedness standard), >= 2 sides.
//   4. THE BELIEVER'S LENS — Darrell's 4D framework (deep source -> plain ->
//                         benefits) + truth-AND-grace + NO condemnation of any
//                         person + how Scripture engages injustice + biblical
//                         stewardship / economic-empowerment, WITHOUT demonizing
//                         any individual.
//   5. REFLECTION + SKILL — discussion prompts + the TRANSFERABLE discernment
//                         skill (check sources, righteous engagement over outrage,
//                         coping with a divisive world).
//
// BINDING SAFEGUARDS (enforced as machine checks — auditIssue, proven-to-catch):
//   • Every claim is LABELED and ATTRIBUTED; none asserted as a verdict.
//   • Every "verifiable" fact carries >= 1 source WITH an as-of date.
//   • >= 2 perspectives, each steelmanned (evenhanded).
//   • When the subject is a NAMED real public figure, the lesson may NOT be
//     one-sided persuasion: a call-to-action (e.g. "boycott") is carried only as
//     the creator's labeled position, never as the lesson's own directive, and the
//     lesson voice (bigIdea / skill / lens) contains no first/second-person
//     directive to boycott or condemn the named person. A grace-note (no
//     condemnation) is required.
//   • Age-appropriate: a child-level rendering exists and is screened (kids use
//     the app). Content-appropriateness over a contested adult topic = treat the
//     skill, not the outrage.
// =============================================================================

// ---------------------------------------------------------------------------
// Vocabulary — the claim labels. A claim is NEVER unlabeled (Stage 1 binding).
// ---------------------------------------------------------------------------
export const CLAIM_LABELS = [
  { id: 'allegation', label: 'Allegation', hint: 'A serious assertion made AGAINST someone that no court has yet judged — distinct from an adjudicated finding, which IS a verdict and is said plainly.' },
  { id: 'claim', label: 'Claim', hint: 'A factual assertion put forward — to be checked against sources, not assumed true.' },
  { id: 'opinion', label: 'Opinion', hint: 'A value judgment or interpretation — reasonable people can hold different ones.' },
  { id: 'call-to-action', label: 'Call to action', hint: 'A request to DO something (boycott, support, vote). A position, not a fact.' },
];
export const CLAIM_LABEL_IDS = CLAIM_LABELS.map((l) => l.id);

// Documentation status for a Stage-2 item — how well-established it is.
export const FACT_STATUS = [
  { id: 'documented', label: 'Documented', hint: 'Checkable against primary / reputable sources.' },
  { id: 'partly-documented', label: 'Partly documented', hint: 'Some pieces verified; others contested or incomplete.' },
  { id: 'disputed', label: 'Disputed', hint: 'Real, multi-sided disagreement over the facts themselves.' },
];
export const FACT_STATUS_IDS = FACT_STATUS.map((s) => s.id);

// Phrases that, in the LESSON'S OWN VOICE (not a labeled creator quote), would
// turn a discernment lesson into one-sided persuasion against a named person.
// DELIBERATELY directive/imperative-shaped, NOT bare nouns: a discernment lesson
// MUST be able to neutrally discuss a "boycott" (e.g. "the creator calls for a
// boycott; others build instead") — what it may not do is ADOPT the directive
// ("you should boycott", "boycott him"). Catching the directive, not the noun, is
// the point (a too-blunt rule that flags neutral discussion is itself a failure).
const DIRECTIVE_PERSUASION = [
  'you should boycott', 'we should boycott', 'go boycott', 'boycott him',
  'boycott her', 'boycott them', 'boycott tesla', 'boycott his',
  'cancel him', 'cancel her', 'cancel them', 'we must stop him', 'we must stop her',
  'do not buy', "don't buy", 'refuse to buy',
  'he is a racist', 'she is a racist', 'they are racist', 'he is evil', 'is a nazi',
];

// A minimal screen for child-level text. Not a content filter for the world — a
// floor so a kid-facing rendering of a charged topic stays age-appropriate.
const CHILD_UNSAFE = [
  'racist', 'nazi', 'hitler', 'genocide', 'kill', 'sex', 'slur', 'damn', 'hell ',
];

const isNonEmptyStr = (v) => typeof v === 'string' && v.trim().length > 0;
const arr = (v) => (Array.isArray(v) ? v : []);

// ---------------------------------------------------------------------------
// normalizeIssue — fill defaults so a lean issue still renders + audits cleanly.
// Pure; never mutates the input.
// ---------------------------------------------------------------------------
export function normalizeIssue(issue) {
  const i = issue && typeof issue === 'object' ? issue : {};
  const subject = i.subject && typeof i.subject === 'object' ? i.subject : {};
  const source = i.source && typeof i.source === 'object' ? i.source : {};
  const lens = i.lens && typeof i.lens === 'object' ? i.lens : {};
  const reflection = i.reflection && typeof i.reflection === 'object' ? i.reflection : {};
  return {
    id: i.id || 'issue',
    title: i.title || 'A claim — how to think it through',
    skill: i.skill || '',
    subject: {
      name: subject.name || '',
      kind: subject.kind || 'topic',
      // A named real public figure triggers the strictest persuasion safeguard.
      isNamedRealPerson: !!subject.isNamedRealPerson,
    },
    source: {
      creator: source.creator || '',
      medium: source.medium || 'source',
      title: source.title || '',
      url: source.url || '',
      asOf: source.asOf || '',
      note: source.note || '',
    },
    claims: arr(i.claims).map((c, idx) => ({
      id: c?.id || `claim-${idx}`,
      text: c?.text || '',
      label: c?.label || '',
      attribution: c?.attribution || '',
      note: c?.note || '',
    })),
    verifiable: arr(i.verifiable).map((v, idx) => ({
      id: v?.id || `fact-${idx}`,
      statement: v?.statement || '',
      status: v?.status || '',
      sources: arr(v?.sources).map((s) => ({
        title: s?.title || '',
        publisher: s?.publisher || '',
        url: s?.url || '',
        asOf: s?.asOf || '',
      })),
      note: v?.note || '',
    })),
    interpretation: arr(i.interpretation).map((n, idx) => ({
      id: n?.id || `interp-${idx}`,
      statement: n?.statement || '',
      restsOn: arr(n?.restsOn),
      note: n?.note || '',
    })),
    perspectives: arr(i.perspectives).map((p, idx) => ({
      id: p?.id || `view-${idx}`,
      label: p?.label || '',
      steelman: p?.steelman || '',
      heldBy: p?.heldBy || '',
      note: p?.note || '',
    })),
    lens: {
      fourD: {
        deepSource: lens.fourD?.deepSource || '',
        scripture: lens.fourD?.scripture || '',
      },
      threeD: lens.threeD || '',
      benefits: arr(lens.benefits),
      // Accountability — stated plainly, never implied (Darrell 2026-07-08:
      // "Accountability is not being clearly stated"). Carries the two-courts
      // doctrine: man's court is not the court of record — dismissed evidence,
      // settled suits, and government-permitted wrongs all enter the eternal
      // court (Ecclesiastes 12:14; Luke 12:2-3; Hebrews 4:13), and the impact
      // on lives DURING life is seen and weighed (James 5:4).
      accountability: {
        statement: lens.accountability?.statement || '',
        scripture: lens.accountability?.scripture || '',
      },
      graceNote: lens.graceNote || '',
      stewardship: lens.stewardship || '',
      anchor: {
        ref: lens.anchor?.ref || '',
        theme: lens.anchor?.theme || '',
      },
    },
    reflection: {
      prompts: arr(reflection.prompts),
      skill: reflection.skill || i.skill || '',
      practice: reflection.practice || '',
    },
    levels: i.levels && typeof i.levels === 'object' ? i.levels : {},
    quiz: i.quiz && typeof i.quiz === 'object' ? i.quiz : null,
  };
}

// ---------------------------------------------------------------------------
// SAFEGUARDS — each is a pure linter returning an array of violations:
//   { code, severity: 'error'|'warn', message }
// 'error' severity FAILS the gate (auditIssue.ok === false). These are written so
// a deliberately-broken issue is CAUGHT (proven-to-catch tests), per DR-0076 —
// a gate that always passes is itself a lie.
// ---------------------------------------------------------------------------

// Stage 1 — every claim labeled (valid label) AND attributed; none asserted bare.
export function lintClaimsLabeled(issue) {
  const i = normalizeIssue(issue);
  const out = [];
  if (!i.claims.length) {
    out.push({ code: 'claims/none', severity: 'error', message: 'Stage 1 requires at least one claim, stated as a claim.' });
  }
  i.claims.forEach((c) => {
    if (!isNonEmptyStr(c.text)) out.push({ code: 'claims/empty', severity: 'error', message: `Claim "${c.id}" has no text.` });
    if (!CLAIM_LABEL_IDS.includes(c.label)) {
      out.push({ code: 'claims/unlabeled', severity: 'error', message: `Claim "${c.id}" is not labeled (allegation/claim/opinion/call-to-action). A claim is never presented as a verdict.` });
    }
    if (!isNonEmptyStr(c.attribution)) {
      out.push({ code: 'claims/unattributed', severity: 'error', message: `Claim "${c.id}" has no source attribution.` });
    }
  });
  return out;
}

// Stage 2 — every documented fact carries >= 1 source WITH an as-of date; and
// interpretation entries are NOT smuggled in as documented fact.
export function lintSourcesCited(issue) {
  const i = normalizeIssue(issue);
  const out = [];
  if (!i.verifiable.length) {
    out.push({ code: 'facts/none', severity: 'error', message: 'Stage 2 requires at least one verifiable item with a source.' });
  }
  i.verifiable.forEach((v) => {
    if (!isNonEmptyStr(v.statement)) out.push({ code: 'facts/empty', severity: 'error', message: `Verifiable item "${v.id}" has no statement.` });
    if (!FACT_STATUS_IDS.includes(v.status)) {
      out.push({ code: 'facts/no-status', severity: 'error', message: `Verifiable item "${v.id}" has no documentation status.` });
    }
    if (!v.sources.length) {
      out.push({ code: 'facts/no-source', severity: 'error', message: `Verifiable item "${v.id}" has no source — a fact stated without a source does not ship.` });
    }
    v.sources.forEach((s, idx) => {
      if (!isNonEmptyStr(s.title)) out.push({ code: 'facts/source-untitled', severity: 'error', message: `Verifiable item "${v.id}" source #${idx + 1} has no title.` });
      if (!isNonEmptyStr(s.asOf)) out.push({ code: 'facts/source-no-asof', severity: 'error', message: `Verifiable item "${v.id}" source #${idx + 1} has no as-of date.` });
    });
  });
  i.interpretation.forEach((n) => {
    if (!isNonEmptyStr(n.statement)) out.push({ code: 'interp/empty', severity: 'warn', message: `Interpretation "${n.id}" has no statement.` });
  });
  if (!i.interpretation.length) {
    out.push({ code: 'interp/none', severity: 'warn', message: 'No interpretation items — the lesson should model separating inference from fact.' });
  }
  return out;
}

// Stage 3 — at least two perspectives, each genuinely steelmanned.
export function lintEvenhanded(issue) {
  const i = normalizeIssue(issue);
  const out = [];
  const withSteelman = i.perspectives.filter((p) => isNonEmptyStr(p.steelman) && isNonEmptyStr(p.label));
  if (withSteelman.length < 2) {
    out.push({ code: 'perspectives/too-few', severity: 'error', message: `Evenhandedness requires >= 2 steelmanned perspectives; found ${withSteelman.length}.` });
  }
  i.perspectives.forEach((p) => {
    if (!isNonEmptyStr(p.steelman)) out.push({ code: 'perspectives/no-steelman', severity: 'error', message: `Perspective "${p.id}" is listed without a steelman (its strongest good-faith case).` });
  });
  return out;
}

// Stage 4 binding — when the subject is a NAMED real public figure, the lesson
// must not be one-sided persuasion against them:
//   • a grace-note (no condemnation of the person) is required,
//   • any call-to-action lives ONLY as a labeled creator position,
//   • the lesson's OWN voice carries no directive to boycott / condemn the person.
export function lintNoOneSidedPersuasion(issue) {
  const i = normalizeIssue(issue);
  const out = [];
  if (!i.subject.isNamedRealPerson) return out; // safeguard targets named-person lessons

  if (!isNonEmptyStr(i.lens.graceNote)) {
    out.push({ code: 'persuasion/no-grace', severity: 'error', message: 'A named-person lesson must carry a grace-note (truth-and-grace, no condemnation of the person).' });
  }
  // Accountability must be STATED, not implied: any named-person lesson with
  // documented harm carries an explicit accountability statement — what the
  // Word requires of the wrongdoer and of us, on both courts (man's and the
  // eternal court where every dismissed or hidden thing is still evidence).
  const hasDocumented = i.verifiable.some((v) => v.status === 'documented');
  if (hasDocumented && !isNonEmptyStr(i.lens.accountability?.statement)) {
    out.push({ code: 'accountability/missing', severity: 'error', message: 'A named-person lesson with documented harm must state accountability plainly (lens.accountability): what the Word requires of the wrongdoer (confession, restitution, fruits of repentance) and of us — never left implied.' });
  }
  if (i.perspectives.filter((p) => isNonEmptyStr(p.steelman)).length < 2) {
    out.push({ code: 'persuasion/one-sided', severity: 'error', message: 'A named-person lesson must present multiple steelmanned perspectives, not one side.' });
  }
  // Any call-to-action must be carried as a labeled claim (the creator's position),
  // never floated unlabeled.
  i.claims.forEach((c) => {
    if (c.label === 'call-to-action' && !isNonEmptyStr(c.attribution)) {
      out.push({ code: 'persuasion/cta-unattributed', severity: 'error', message: `Call-to-action "${c.id}" must be attributed to whoever is making it, not stated as the lesson's own directive.` });
    }
  });
  // The lesson's OWN voice (the platform-published copy) must not direct the reader
  // to boycott / condemn the named person. (Labeled creator claims are exempt —
  // those are reported, not asserted.)
  const ownVoice = [
    i.skill, i.title,
    i.lens.threeD, i.lens.fourD.deepSource, i.lens.graceNote, i.lens.stewardship, i.lens.accountability?.statement || '',
    i.reflection.skill, i.reflection.practice,
    ...i.reflection.prompts,
    ...i.lens.benefits,
  ].filter(isNonEmptyStr).join(' \n ').toLowerCase();
  DIRECTIVE_PERSUASION.forEach((phrase) => {
    if (ownVoice.includes(phrase)) {
      out.push({ code: 'persuasion/directive', severity: 'error', message: `The lesson's own voice contains a persuasive directive ("${phrase}"). The lesson speaks the Word's verdict on documented deeds plainly, but it never campaigns against a person or pronounces on a soul.` });
    }
  });
  return out;
}

// Age-appropriateness — a child rendering exists and is screened.
export function lintAgeAppropriate(issue) {
  const i = normalizeIssue(issue);
  const out = [];
  const child = i.levels?.child;
  if (!isNonEmptyStr(child)) {
    out.push({ code: 'age/no-child', severity: 'error', message: 'No child-level rendering — kids use the app; a charged topic needs an age-appropriate version.' });
    return out;
  }
  const low = child.toLowerCase();
  CHILD_UNSAFE.forEach((term) => {
    if (low.includes(term)) {
      out.push({ code: 'age/child-unsafe', severity: 'error', message: `Child-level text contains an age-inappropriate term ("${term.trim()}"). Teach the skill (check before you believe), not the charged content.` });
    }
  });
  return out;
}

export const ISSUE_LINTERS = [
  lintClaimsLabeled, lintSourcesCited, lintEvenhanded, lintNoOneSidedPersuasion, lintAgeAppropriate,
];

// auditIssue — run every safeguard. ok === true only when NO error-severity
// violation exists. The single gate the course test asserts on.
export function auditIssue(issue) {
  const violations = ISSUE_LINTERS.flatMap((fn) => fn(issue));
  const errors = violations.filter((v) => v.severity === 'error');
  return { ok: errors.length === 0, violations, errors, warnings: violations.filter((v) => v.severity === 'warn') };
}

export function auditAllIssues(issues) {
  return arr(issues).map((i) => ({ id: i?.id || 'issue', ...auditIssue(i) }));
}

// ---------------------------------------------------------------------------
// PROJECTION — turn a structured issue into the standard Learn module shape so it
// rides ChurchLearn unchanged. The structured issue is carried on `module.issue`
// for the dedicated five-stage renderer; everything else is the normal module
// schema (bigIdea / benefits / levels / quiz / anchor / lesson / facilitator).
// ---------------------------------------------------------------------------

// The facilitator-layer deep lesson (4D source) — woven from the five stages so a
// facilitator (or the print-out) has the whole walk-through in prose. The learner
// sees the structured stages; this is the teaching narrative behind them.
function buildLessonProse(i) {
  const parts = [];
  parts.push(
    `This lesson speaks the documented truth plainly and teaches HOW to weigh the rest — checking sources, hearing every side, and letting the Word say what it says about justice and accountability. What is proven is named; what is unproven is labeled; the verdict on a soul is left to God.`,
  );
  if (i.source.creator) {
    parts.push(
      `THE SOURCE. The claims here come from ${i.source.creator}'s ${i.source.medium}${i.source.title ? ` ("${i.source.title}")` : ''}${i.source.asOf ? `, as of ${i.source.asOf}` : ''}. We treat it as ONE creator's argument — sourced and labeled — not as truth to repeat.`,
    );
  }
  if (i.claims.length) {
    parts.push(`STAGE 1 — THE CLAIM. ${i.claims.map((c) => `[${c.label}] ${c.text}`).join(' ')} Each is labeled and attributed; documented parts are named as documented, and unproven parts stay labeled unproven.`);
  }
  if (i.verifiable.length || i.interpretation.length) {
    const facts = i.verifiable.map((v) => `${v.statement} (${v.status}; see ${v.sources.map((s) => `${s.title}${s.asOf ? `, as of ${s.asOf}` : ''}`).join('; ')})`).join(' ');
    const interp = i.interpretation.map((n) => n.statement).join(' ');
    parts.push(`STAGE 2 — VERIFIABLE vs INTERPRETATION. Documented: ${facts} Interpretation drawn from it: ${interp} The skill is to keep these two apart.`);
  }
  if (i.perspectives.length) {
    parts.push(`STAGE 3 — PERSPECTIVES. ${i.perspectives.map((p) => `${p.label}: ${p.steelman}`).join(' ')} We state each at its strongest before we weigh any of them.`);
  }
  if (i.lens.fourD.deepSource || i.lens.threeD) {
    parts.push(`STAGE 4 — THE BELIEVER'S LENS. ${i.lens.fourD.deepSource} ${i.lens.threeD} ${i.lens.accountability?.statement ? `ACCOUNTABILITY — WHAT THE WORD REQUIRES. ${i.lens.accountability.statement}` : ''} ${i.lens.stewardship} ${i.lens.graceNote}`.replace(/\s+/g, ' ').trim());
  }
  if (i.reflection.skill) {
    parts.push(`STAGE 5 — REFLECTION + SKILL. ${i.reflection.skill}`);
  }
  return parts.join(' ').replace(/\s+/g, ' ').trim();
}

export function buildDiscernmentModule(issue) {
  const i = normalizeIssue(issue);
  const handsOn = i.reflection.practice
    || 'Pick one claim from this lesson. Find the primary source yourself. Then write one sentence: what is documented, and what is someone\'s interpretation?';
  return {
    id: i.id,
    title: i.title,
    bigIdea: i.skill
      || 'Take one charged claim and learn to think it through — separate documented fact from interpretation, hear every side fairly, and weigh it in the light of Scripture.',
    benefits: i.lens.benefits,
    inApp: handsOn,
    anchor: {
      ref: i.lens.anchor.ref || '1 Thessalonians 5:21',
      theme: i.lens.anchor.theme || 'Test everything; hold on to what is good.',
    },
    levels: i.levels,
    quiz: i.quiz || undefined,
    lesson: buildLessonProse(i),
    facilitator: {
      talkingPoints: [
        'We speak what is documented plainly, label what is unproven, and leave the verdict on a soul to God — proven harm is never muted as "balance."',
        'Stage 1: every claim is LABELED (allegation / claim / opinion / call-to-action) and attributed to its source. We never repeat a contested allegation as settled fact.',
        'Stage 2: separate DOCUMENTED fact (checkable against primary sources, with dates) from INTERPRETATION. Model checking a source live.',
        'Stage 3: steelman every side — state each perspective at its strongest before weighing any.',
        'Stage 4: the believer\'s lens — the Word\'s justice spoken plainly, and ACCOUNTABILITY stated, never implied: man\'s court is not the court of record (dismissed evidence and permitted wrongs still enter the eternal court, Ecclesiastes 12:14), the wrongdoer owes confession + restitution + fruits of repentance, and NO condemnation of any person made in God\'s image.',
        'Stage 5: name the transferable skill — check sources, choose righteous engagement over outrage, and keep your peace in a divisive world.',
      ],
      howToRun: [
        'Read the claim (5): state the claim AS MADE, with its source and label. Ask: is this fact, allegation, or opinion?',
        'Check it (10): take one piece and look for the primary source together; mark what is documented vs interpreted.',
        'Hear every side (10): steelman each perspective; can the room state the OTHER side fairly?',
        'The believer\'s lens (10): how does Scripture engage injustice with truth AND grace, without demonizing a person? Where does stewardship/empowerment fit?',
        'Reflect + the skill (5): name the one discernment skill you carry out the door, and one outrage you can trade for righteous engagement.',
      ].join(' | '),
      discussionPrompts: i.reflection.prompts.length ? i.reflection.prompts : [
        'Which part of this was documented fact, and which was someone\'s interpretation? How could you tell?',
        'Can you state the side you DISAGREE with, at its strongest, fairly?',
        'How do we hold both truth and grace — naming a real wrong without condemning a person?',
      ],
    },
    // The structured issue — carried so the dedicated five-stage renderer can show
    // the labeled stages, and so the audit can machine-check it before it ships.
    issue: i,
  };
}

// ---------------------------------------------------------------------------
// Course-level helpers — thin wrappers so a World-Issues course behaves exactly
// like every other Learn course (self-paced, no cohort clock).
// ---------------------------------------------------------------------------
export function buildDiscernmentModules(issues) {
  return arr(issues).map(buildDiscernmentModule);
}

// Self-paced schedule: one row per issue, lesson number, NO painted date.
export function buildDiscernmentSchedule(issues) {
  return buildDiscernmentModules(issues).map((m, idx) => ({ ...m, week: idx + 1, date: null, weekday: null }));
}

export function discernmentProgressSummary(issues, progress = {}) {
  const modules = buildDiscernmentModules(issues);
  const done = modules.filter((m) => !!progress[m.id]).length;
  return { done, total: modules.length, pct: modules.length ? Math.round((done / modules.length) * 100) : 0 };
}
