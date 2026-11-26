// =============================================================================
// Lesson sections -- the lesson's OWN sections, as Read paragraphs and Listen chapters (DR-1672)
// =============================================================================
// Darrell 2026-11-26, on a 55-minute lesson whose Chapters list showed one
// chapter from 0:00 to 51:14: "Where are the chapters?!!!! How can we go back or
// to a chapter without chapters?!!!!!!!!!!" And on lesson 140: "I just ended on
// chapter 6 and I can't go back to chapter 6 in that exact same lesson, even
// though while in the lesson it showed me that I ended at chapter 6 out of 12."
//
// The classic page has numbered a lesson's sections since DR-0712 with ONE plan
// (lib/lesson-format.js, lessonSectionPlan): FIRST/SECOND, "ONE —", "SEVEN.",
// I./II., SOIL n, and the house's capitalised lead clauses. The new lesson screen
// only knew a capitalised lead at the very start of a paragraph, and many long
// lessons are stored as ONE paragraph, so their whole body was one chapter and
// Read showed one paragraph. Now the lesson screen uses that same plan: every
// section the classic page counts starts its own paragraph and is a chapter.
//
// NOT ONE WORD CHANGES: only whitespace (a paragraph break before a heading the
// author already wrote, and runs of spaces read as one). Pinned in
// lesson-sections.test.js across every lesson and level.
// =============================================================================
import { lessonSectionPlan } from '../../lib/lesson-format.js';

const SPACELESS_NUMBER = /([.?!)\]"”])(?=(?:ONE|TWO|THREE|FOUR|FIVE|SIX|SEVEN|EIGHT|NINE|TEN|ELEVEN|TWELVE)\.\s+[A-Z])/g;

const NUM = 'ONE|TWO|THREE|FOUR|FIVE|SIX|SEVEN|EIGHT|NINE|TEN|ELEVEN|TWELVE';
const NUMBER_AT = new RegExp(`(^|[\\s)\\]"”.?!])(?=(?:${NUM})\\. [A-Z][A-Z])`, 'g');
const NUMBERED_LEAD = new RegExp(`^((?:${NUM})\\. [A-Z][A-Z0-9 ,'’"“”:;—–-]{2,160}?[.?!]["”]?)(?= |$)`);

// Each paragraph withSectionBreaks starts at a heading -> that heading (bounded).
const LEADS = new Map();
const remember = (para, lead) => {
  if (LEADS.size > 4000) LEADS.clear();
  LEADS.set(para, lead);
};

/** Starts a new paragraph at every section heading the lesson's plan finds. Only whitespace changes. */
export function withSectionBreaks(text) {
  if (typeof text !== 'string' || !text.trim()) return text;
  // A number stored with no space before it ("is fixed.SIX. THE OLD PRIEST") gets the space it lost.
  text = text.replace(SPACELESS_NUMBER, '$1 ');
  const heads = lessonSectionPlan(text).headings.map((h) => h.text);
  if (!heads.length) return text;
  const out = [];
  for (const raw of text.split(/\n\n+/)) {
    const para = raw.replace(/\s+/g, ' ').trim();
    if (!para) continue;
    // Find each heading in order, at a sentence start, and cut before it.
    const cuts = [];
    let from = 0;
    for (const h of heads) {
      const at = para.indexOf(h, from);
      if (at < 0) continue;
      if (at === 0 || para[at - 1] === ' ') cuts.push({ at, h });
      from = at + h.length;
    }
    // The author's spelled numbers ("FIVE. HE CANNOT DESIRE IT."), even where the plan could not
    // see a sentence start (a number glued to the reference before it): each is a section of its own.
    for (const m of para.matchAll(NUMBER_AT)) {
      const at = m.index + m[1].length;
      if (cuts.some((c) => c.at <= at && at < c.at + c.h.length)) continue;
      const lead = para.slice(at).match(NUMBERED_LEAD);
      if (lead) cuts.push({ at, h: lead[1] });
    }
    cuts.sort((a, b) => a.at - b.at);
    if (!cuts.length) {
      out.push(raw);
      continue;
    }
    if (cuts[0].at > 0) out.push(para.slice(0, cuts[0].at).trim());
    cuts.forEach((c, i) => {
      const piece = para.slice(c.at, i + 1 < cuts.length ? cuts[i + 1].at : para.length).trim();
      remember(piece, c.h);
      out.push(piece);
    });
  }
  return out.join('\n\n');
}

/** The paragraph's own lead, if it opens with one; `rest` is everything after it. */
export function sectionLeadOf(paragraph) {
  const known = LEADS.get(paragraph);
  if (known) return { lead: known, rest: paragraph.slice(known.length).replace(/^ /, '') };
  // Up to 90 capitals, colon allowed, so the opening "NOT WITH EYESERVICE:
  // FAITHFUL WORK WHEN NO ONE IS WATCHING." reads as the article's headline too.
  const m = paragraph.match(/^([A-Z][A-Z ,':-]{2,90}?\.) /);
  return m ? { lead: m[1], rest: paragraph.slice(m[0].length) } : { lead: null, rest: paragraph };
}
