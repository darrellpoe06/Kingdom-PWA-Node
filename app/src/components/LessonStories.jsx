// =============================================================================
// LessonStories — the stories in a lesson as options, and room for another
// perspective on the same Word (DR-0855)
// =============================================================================
// Darrell 2026-10-09: "What happened to the having two stories/parables inside
// each lesson?!!!!!!" and then the shape he wants: "As options... a drop down
// like the Word Tabs... so the ability to add another perspective to the same
// Word so all perspectives can see... make sense?"
//
// So every story is its own dropdown, closed until the reader or the teacher
// picks it, the way the Scripture tab's sections open (DR-0215: a teacher drops
// a story in to land the point; two or more per lesson). Under the lesson's own
// stories sit the perspectives other people in this space have shared on the
// same lesson, once a steward has reviewed them (curation is not auto-publish),
// and the reader's own, marked waiting. The last dropdown is where a person adds
// theirs: a true story of their own (attributed, with consent) or a parable,
// held to the same truth-label gate as the Story Library (lib/story-library.js).
//
// The heading and the line under every story say what it is in words: a
// parable is never a record, a true story carries the name of who lived it
// (DR-0811, story-truth.js). Tailwind classes only, so the contrast and
// legibility guards cover it.
// =============================================================================
import React, { useEffect, useState } from 'react';
import WordInline from './WordInline.jsx';
import ShowTheWordToggle from './ShowTheWordToggle.jsx';
import { referencesIn } from '../lib/verse-refs.js';
import { useOpenWithTheWord } from '../lib/show-the-word.js';
import { storyHeading, storyFootnote } from '../lib/story-truth.js';
// One draft road, the Thinking Space's own (DR-1181).
import { readFormDraft, writeFormDraft, clearDraft, hasWords } from '../lib/draft-autosave.js';
import {
  STORY_TONES, validateSubmission, saveDraft, submitStory,
  perspectivesForLesson, perspectiveDraftFor, fetchLessonPerspectives,
} from '../lib/story-library.js';

const fieldCls =
  'w-full text-sm border border-[#1A1815] px-2 py-1.5 min-h-[36px] bg-white text-[#1A1815] ' +
  'focus:outline focus:outline-2 focus:outline-[#B85838]';
const labelCls = 'block text-[0.625rem] uppercase tracking-wider text-[#5A5751] font-semibold mb-1';
const summaryCls =
  'cursor-pointer list-none px-3 py-2 min-h-[44px] flex items-center gap-2 text-[0.75rem] text-[#1A1815] ' +
  'focus:outline focus:outline-2 focus:outline-[#B85838]';
const serif = { fontFamily: '"Fraunces", serif' };

function StoryOption({ story, note, testId }) {
  // Show the Word opens every story with its verses, the way every fold that
  // holds the Word follows the switch (show-the-word.js); one tap still opens
  // or closes a single story on its own.
  const [open, toggle] = useOpenWithTheWord();
  return (
    <details className="border border-[#5A6E3D] bg-[#FAF8F4]" data-testid={testId} open={open}>
      <summary className={summaryCls} aria-expanded={open} onClick={(e) => { e.preventDefault(); toggle(); }}>
        <span aria-hidden="true" className="text-[#5A6E3D]">▸</span>
        <span className="uppercase tracking-[0.12em] text-[0.625rem] text-[#5A6E3D] font-semibold" data-testid="story-heading">
          {storyHeading(story)}
        </span>
      </summary>
      <div className="px-3 pb-3">
        {note && <div className="text-[0.6875rem] text-[#5A5751] mb-1">{note}</div>}
        <WordInline
          text={story.body}
          refsBelow
          alsoRefs={story.verse ? referencesIn(story.verse) : null}
          className="text-[0.8125rem] text-[#1A1815] leading-relaxed"
          style={serif}
        />
        <div className="mt-2 text-[0.6875rem] text-[#5A5751]" data-testid="story-footnote">{storyFootnote(story)}</div>
      </div>
    </details>
  );
}

export function AddPerspective({ lesson, onSubmitted }) {
  // YOUR WORDS ARE KEPT WHILE YOU WRITE THEM (DR-1181). Darrell, 2026-10-21:
  // "Where did my text and typing go?!!!!!!!!!!!!!!!!"
  //
  // This form held a title, a verse, "Who lived it" and a SIX-ROW story body in
  // React state alone. `perspectiveDraftFor` is, by its own docstring, "The
  // empty form for a new perspective" — it persists nothing. A reload, a phone
  // discarding the tab, or any remount took the whole story, and the form's own
  // copy promised "Saved on this device... nothing is lost", which was true
  // only AFTER a submit that failed to reach the queue.
  //
  // Now every keystroke is kept on this device, per lesson, by the same keeper
  // the Thinking Space has used since 2026-07-10 — one draft road, not two. The
  // consent box is deliberately NOT restored (draft-autosave NEVER_RESTORED):
  // the words come back, the attestation is made again by the person.
  const surface = `lesson-perspective:${lesson?.id || 'unknown'}`;
  const blank = perspectiveDraftFor(lesson);
  const [form, setForm] = useState(() => readFormDraft(surface, blank, undefined, blank));
  const [errors, setErrors] = useState([]);
  const [notice, setNotice] = useState('');
  const set = (k) => (e) => setForm((f) => {
    const next = { ...f, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value };
    writeFormDraft(surface, next, undefined, undefined, blank);
    return next;
  });
  const testimony = form.kind === 'testimony';

  const submit = async (e) => {
    e.preventDefault();
    const gate = validateSubmission(form);
    setErrors(gate.errors);
    if (!gate.ok) { setNotice(''); return; }
    saveDraft(form); // nothing is lost signed out
    const res = await submitStory(form);
    if (res && res.ok) {
      setNotice('Shared. It is in the review queue, and everyone in this space will see it here once a steward has reviewed it.');
      // The draft is cleared ONLY on a share that actually reached the queue.
      // A signed-out save or a failed reach leaves it exactly where it is, so
      // the next visit still has the words (DR-1181).
      clearDraft(surface);
      setForm(perspectiveDraftFor(lesson));
      if (onSubmitted) onSubmitted(res.row);
    } else if (res && res.skipped === 'signed-out') {
      setNotice('Saved on this device. Sign in and open this lesson again to share it with your space.');
    } else {
      setNotice('Saved on this device. It could not reach the shared queue just now; it is kept here and nothing is lost.');
    }
  };

  return (
    <details className="border border-[#B85838] bg-white" data-testid="add-perspective">
      <summary className={summaryCls}>
        <span aria-hidden="true" className="text-[#B85838]">+</span>
        <span className="uppercase tracking-[0.12em] text-[0.625rem] text-[#B85838] font-semibold">Add your perspective on this Word</span>
      </summary>
      <form onSubmit={submit} className="px-3 pb-3 space-y-2" noValidate>
        <p className="text-[0.75rem] text-[#1A1815]" style={serif}>
          A story from your own life that this lesson brought to mind, or a parable you would tell to land it. Call it what it truly is: a true story carries your name and your consent; a parable is a picture, not a record.
        </p>
        {/* SAY THAT THE WORDS ARE KEPT (DR-1181). A save nobody can see does
            not restore the trust a lost story took: the person who has just
            watched a page eat six rows of their own writing needs to be told,
            on the screen, that this one holds. Shown only once there is
            something to keep, so an untouched form makes no promise. */}
        {hasWords(form, blank) && (
          <p className="text-[0.6875rem] text-[#5A6E3D]" style={serif} data-testid="perspective-kept">
            Kept on this device as you write — close this, reload, come back tomorrow, and your words are still here. They reach your space only when you tap Share.
          </p>
        )}
        <fieldset className="flex flex-wrap gap-3 text-[0.75rem] text-[#1A1815]">
          <legend className={labelCls}>What it is</legend>
          <label className="inline-flex items-center gap-1 min-h-[36px]"><input type="radio" name={`lp-kind-${lesson.id}`} value="testimony" checked={form.kind === 'testimony'} onChange={set('kind')} /> A true story I lived</label>
          <label className="inline-flex items-center gap-1 min-h-[36px]"><input type="radio" name={`lp-kind-${lesson.id}`} value="parable" checked={form.kind === 'parable'} onChange={set('kind')} /> A parable</label>
        </fieldset>
        <div>
          <label className={labelCls} htmlFor={`lp-title-${lesson.id}`}>Title</label>
          <input id={`lp-title-${lesson.id}`} className={fieldCls} value={form.title} onChange={set('title')} />
        </div>
        <div>
          <label className={labelCls} htmlFor={`lp-verse-${lesson.id}`}>The verse it serves</label>
          <input id={`lp-verse-${lesson.id}`} className={fieldCls} value={form.verse} onChange={set('verse')} />
        </div>
        <div>
          <label className={labelCls} htmlFor={`lp-tone-${lesson.id}`}>Tone</label>
          <select id={`lp-tone-${lesson.id}`} className={fieldCls} value={form.tone} onChange={set('tone')}>
            {STORY_TONES.map((t) => <option key={t} value={t}>{t === 'light' ? 'Light' : 'Solemn'}</option>)}
          </select>
        </div>
        <div>
          <label className={labelCls} htmlFor={`lp-body-${lesson.id}`}>The story</label>
          <textarea id={`lp-body-${lesson.id}`} rows={6} className={fieldCls} value={form.body} onChange={set('body')} />
        </div>
        {testimony && (
          <>
            <div>
              <label className={labelCls} htmlFor={`lp-source-${lesson.id}`}>Who lived it</label>
              <input id={`lp-source-${lesson.id}`} className={fieldCls} value={form.source} onChange={set('source')} />
            </div>
            <label className="flex items-start gap-2 text-[0.75rem] text-[#1A1815] min-h-[36px]">
              <input type="checkbox" checked={!!form.consent} onChange={set('consent')} />
              <span>I lived this, or the person who did has agreed to share it, and it may be shown to my space with this name.</span>
            </label>
          </>
        )}
        {errors.length > 0 && (
          <ul role="alert" className="text-[0.75rem] text-[#B85838] list-disc pl-5" data-testid="perspective-errors">
            {errors.map((x) => <li key={x}>{x}</li>)}
          </ul>
        )}
        {notice && <div role="status" className="text-[0.75rem] text-[#5A6E3D]" data-testid="perspective-notice">{notice}</div>}
        <button type="submit" className="text-[0.625rem] uppercase tracking-wider px-3 py-2 min-h-[36px] border border-[#5A6E3D] text-[#5A6E3D] hover:bg-[#5A6E3D] hover:text-white focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-[#B85838]">
          Share this perspective
        </button>
      </form>
    </details>
  );
}

/**
 * `askForYours` — whether this block ENDS with the invitation to add your own.
 *
 * Darrell, 2026-10-10: "Asking users for their stories in the middle of our
 * lessons is a distraction.... put it at the end of the lessons." The stories
 * the lesson TEACHES are teaching — short, vivid illustrations, the way Jesus
 * taught (Matthew 13:34) — and they stay where the teaching is. The invitation
 * to write your own is not teaching; it is a task, and a task set in the middle
 * of a reading takes the reader out of it. So the ask travels to the last stage
 * and the teaching stays put. Default true, so any other caller keeps the whole
 * block; the lesson's teach stage passes false and renders AddPerspective at
 * its end.
 */
export default function LessonStories({ lesson, stories = [], loadPerspectives = fetchLessonPerspectives, askForYours = true }) {
  const [view, setView] = useState({ shared: [], mine: [] });
  const lessonId = lesson && lesson.id;

  useEffect(() => {
    let live = true;
    if (!lessonId || !loadPerspectives) return undefined;
    Promise.resolve(loadPerspectives(lessonId))
      .then((res) => { if (live) setView(perspectivesForLesson(res && res.rows, { lessonId, viewerId: res && res.viewerId })); })
      .catch(() => { /* the lesson's own stories still render */ });
    return () => { live = false; };
  }, [lessonId, loadPerspectives]);

  const own = Array.isArray(stories) ? stories : [];
  if (!lessonId) return null;
  return (
    <section className="mt-3 space-y-2" aria-label="Stories and perspectives on this Word" data-testid="lesson-stories">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="text-[0.625rem] uppercase tracking-[0.2em] text-[#5A6E3D] font-semibold">
          Stories on this Word · pick one to open
        </div>
        <ShowTheWordToggle />
      </div>
      {own.map((s, i) => <StoryOption key={`own-${i}`} story={s} testId="lesson-story" />)}
      {view.shared.map((s) => (
        <StoryOption key={`shared-${s.id}`} story={s} testId="shared-perspective" note={`Shared by ${s.sharedBy} in this space`} />
      ))}
      {view.mine.map((s) => (
        <StoryOption key={`mine-${s.id}`} story={s} testId="my-perspective" note="Your perspective, waiting for a steward's review before your space sees it" />
      ))}
      {askForYours ? (
        <AddPerspective lesson={lesson} onSubmitted={(row) => setView((v) => ({ ...v, mine: [...perspectivesForLesson([{ ...row }], { lessonId, viewerId: row && row.submitted_by }).mine, ...v.mine] }))} />
      ) : null}
    </section>
  );
}
