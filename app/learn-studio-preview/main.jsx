// DEV-ONLY approval harness for the Learn redesign (not a build input in
// vite.config.js, so it is never built or deployed). Mounts LearnStudio over
// the REAL catalog (learnInventory: 13 departments, 51 courses, 994 lessons)
// with the pilot's review records, so the owner judges the real thing.
// Open: npm run dev, then /learn-studio-preview.html (?lesson=<id> opens a cover).
import React, { useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import LearnStudio from '../src/components/learn-studio/LearnStudio.jsx';
import { presentationIndex } from '../src/lib/learn-presentation/presentation.js';

const ROOT = import.meta.env.BASE_URL.replace(/\/$/, '');
const BASE = `${ROOT}/learn-studio-preview/assets`;
// Exported paths are root-relative; the dev server serves under the app's base.
const rebase = (s) => (typeof s === 'string' ? s.replace(/(^|, )\/learn-studio-preview\//g, `$1${ROOT}/learn-studio-preview/`) : s);
const rebaseImage = (im) => im && { ...im, src: rebase(im.src), srcSet: im.srcSet && { avif: rebase(im.srcSet.avif), webp: rebase(im.srcSet.webp) } };
// The four hero slides, in order (a review choice, not data the lesson owns).
const HERO = ['ea-gh-obedience-blessing', 'lil2-count-the-days-one-to-seven', 'buy2-two-sets-of-weights-in-one-bag', 'll332-give-me-this-mountain'];

function Preview() {
  const [data, setData] = useState(null);
  const [err, setErr] = useState('');
  useEffect(() => {
    Promise.all([
      fetch(`${BASE}/records.json`).then((r) => r.json()),
      // A shared preview page carries the catalog SNAPSHOT (no lesson text; see
      // catalogSnapshot); a developer's machine reads the live catalog.
      fetch(`${BASE}/catalog.json`)
        .then((r) => (r.ok ? r.json() : null))
        .catch(() => null)
        .then(
          (snap) =>
            snap ||
            import('../src/lib/learn-presentation/integrity.js').then(({ learnInventory }) =>
              learnInventory().map((c) => ({ key: c.key, meta: { ...(c.meta || {}), key: c.key }, schedule: c.lessons }))
            )
        ),
      fetch(`${BASE}/topics.json`)
        .then((r) => (r.ok ? r.json() : {}))
        .catch(() => ({})),
    ])
      .then(([rec, courses, topics]) => setData({ rec, courses, topics }))
      .catch((e) => setErr(String(e)));
  }, []);
  const index = useMemo(() => {
    if (!data) return null;
    const records = data.rec.records.map((r0) => {
      const r = { ...r0, image: rebaseImage(r0.image) };
      return HERO.includes(r.lessonId) ? { ...r, featured: true, featuredOrder: HERO.indexOf(r.lessonId) + 1 } : r;
    });
    return presentationIndex(records);
  }, [data]);
  if (err) return <p style={{ color: '#fff', padding: 16 }}>Preview assets missing ({err}). Run the compose step into learn-studio-preview/assets first.</p>;
  const courses = data && data.courses;
  if (!index) return <p style={{ color: '#fff', padding: 16 }}>Loading Learn…</p>;
  const lesson = new URLSearchParams(window.location.search).get('lesson');
  const log = (what) => (l) => console.info(`[preview] ${what}`, l && l.id); // the real app hands these to ChurchLearn's reader
  return (
    <LearnStudio
      courses={courses}
      index={index}
      preview
      topicCovers={Object.fromEntries(Object.entries(data.topics).map(([k, v]) => [k, { ...v, image: rebaseImage(v.image) }]))}
      initialLesson={lesson}
      onRead={log('read')}
      onListen={log('listen')}
      onVersion={log('version')}
      onExit={log('all courses')}
    />
  );
}

createRoot(document.getElementById('root')).render(<Preview />);
