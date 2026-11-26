// =============================================================================
// process-language — a lesson tells the reader the subject, not our research
// process (DR-1689)
// =============================================================================
// Darrell, 2026-11-26: "I'm annoyed by lessons saying they didn't research!!!!"
// A reader-facing sentence like "we did not read the full article", "the video
// could not be fetched from the cloud" or "recurly.com did not resolve on our
// network" hands the reader the writer's errand instead of the lesson. The fix
// is to DO the research and state what the record shows; where a point is
// genuinely disputed, name the dispute and who holds it; where it cannot be
// supported, leave it out.
//
// PROCESS_RE is the measuring regex of 2026-11-26, widened by the shapes that
// regex missed (getaddrinfo, "could not be fetched", "carried as search-verified").
// TEACHING_RE marks sentences where the same words TEACH (the house doctrine
// "under-claiming a verified truth is as much a failure of truth as
// over-claiming an unverified one", 1 Timothy 5:19's unverified accusation, a
// buyer's list of what remains unverified, the Bereans, a quotation whose
// attribution is disputed). Those are knowledge, not an excuse, and stay.
// =============================================================================

export const PROCESS_RE =
  /(not (yet )?(been )?(independently )?(verified|fetched)|could not (be )?(verif|fetch|confirm)|(could not|did not|have not|didn't|couldn't) (read|fetch|verify|check|confirm) (the|its|his|her|their|that|this|any|it)\b|unverified|not checked against|was not (checked|confirmed)|we (could|did) not (find|locate) (a|the|any) source|only (its|the) publisher(’s|'s)? description|getaddrinfo|ENOTFOUND|did not resolve on our network|carried as search-verified|could not be (opened|reached) from here|from the cloud, so|WHAT WE (DID|COULD) NOT (CHECK|CONFIRM|VERIFY)|nobody here (opened|read)|(helper|runner) with web access|this course could not fetch|we did not telephone)/i;

export const TEACHING_RE = new RegExp(
  [
    // the house doctrine on under- and over-claiming, in all its phrasings
    String.raw`(over-?claim|overstat|over-?stat|inflat|exaggerat|assert|talking up|over-?stating)\w*[^.]{0,60}\bunverified (one|thing|matter|harm)`,
    String.raw`unverified claims honestly`,
    String.raw`trust nothing unverified`,
    String.raw`VERIFIABLY right`,
    String.raw`mark (plainly )?what is unverified`,
    String.raw`unverified work gets mocked`,
    String.raw`"I did not verify this"|I did not check this`,
    String.raw`what (the decision did not do|this decision did NOT do|the decision did not accomplish)[^.]{0,30}what was not verified`,
    String.raw`verification that was itself unverified`,
    String.raw`what it did not do, what was not verified`,
    // an exercise addressed to the reader ("you"), teaching them to mark it
    String.raw`\byou (could not|have not|have NOT) (confirm|verified)|you have not verified|you have NOT verified|still unverified as of`,
    // Scripture and narrative usage (the subject, not our errand)
    String.raw`unverified accusation`,
    String.raw`could not read the (very )?Bible|many could not read`,
    String.raw`could not read the much more important`,
    String.raw`did not read (it out loud|the whole verse)`,
    String.raw`you have not read (it|the chapter)`,
    String.raw`Thessalonica|Berea`,
    String.raw`they were not fetched, they were generated`,
    // practice the lesson teaches the reader to do
    String.raw`unverified deal|what remains unverified|clean story unverified|(DESCRIPTION|description) he had not yet verified|an unverified description`,
    String.raw`an unverified wheel|by means of an unverified claim|defended with an unverified claim`,
    // a disputed attribution or a source's own concession, named as knowledge
    String.raw`attribution (is|as) unverified|treat the attribution as unverified`,
    String.raw`concedes (it )?is unverified|concedes it is unverified|own summary concedes`,
    String.raw`could not confirm Khafre`,
    String.raw`did not confirm that the live site still updated|did not check that the website still updated`,
  ].join('|'),
  'i',
);

const split = (t) => String(t).split(/(?<=[.!?])\s+/);

/** Reader-facing text fields of a lesson, by name. */
export function readerFields(lesson) {
  const out = {};
  if (!lesson) return out;
  for (const k of ['honestNote', 'lesson', 'bigIdea', 'inApp']) if (typeof lesson[k] === 'string') out[k] = lesson[k];
  for (const [k, v] of Object.entries(lesson.levels || {})) if (typeof v === 'string') out[`levels.${k}`] = v;
  (lesson.benefits || []).forEach((b, i) => { if (typeof b === 'string') out[`benefits.${i}`] = b; });
  const qs = (lesson.quiz && lesson.quiz.questions) || [];
  qs.forEach((q, i) => { if (q && typeof q.explain === 'string') out[`quiz.${i}.explain`] = q.explain; });
  return out;
}

/** Every process-language sentence in a lesson's reader-facing fields. */
export function processLanguage(lesson) {
  const hits = [];
  for (const [field, text] of Object.entries(readerFields(lesson))) {
    for (const s of split(text)) if (PROCESS_RE.test(s) && !TEACHING_RE.test(s)) hits.push({ field, sentence: s.trim() });
  }
  return hits;
}
