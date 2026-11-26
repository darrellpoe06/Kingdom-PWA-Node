// DEV-ONLY review harness for the Learning Zone discovery page (not a build
// input in vite.config.js, so it is never built or deployed).
// Open: npm run dev, then /learn-discover-preview.html
//   ?seed=1   saves three REAL in-progress places through learn-resume's own
//             recordPlace (the same writer Learn uses), so Continue Learning
//             shows genuine saved progress. Without it, Continue is absent,
//             exactly as it is for a learner who has begun nothing.
//   ?q=...    types a question into the search box
//   ?theme=night|midnight|lovecorner|heritage|cream|white|...  wraps the page in
//             that theme exactly as the shell does (the church door's own default
//             is night: red, black and gold). ?theme=none leaves it unthemed.
import React from 'react';
import '../src/index.css'; // the app's own theme tokens (--lc-*), so every theme can be reviewed
import { createRoot } from 'react-dom/client';
import LearnDiscover from '../src/components/learn-discover/LearnDiscover.jsx';
import INDEX from '../src/lib/learn-discover-index.json';
import { recordPlace, clearAllPlaces } from '../src/lib/learn-resume.js';
import { THEME_CSS, THEMES } from '../src/lib/theme-css.js'; // the shell injects exactly this, so the page is reviewed under every real theme rule

const qs = new URLSearchParams(window.location.search);
const SEED = [
  { lessonId: 'll122-does-she-feel-like-your-favorite-person-preferring-one-another-and-the-first-works', seen: 0.62 },
  { lessonId: 'fin6-usury-and-who-your-brother-is', seen: 0.35 },
  { lessonId: 'll313-children-are-a-heritage-when-the-school-closes-the-house', seen: 0.8 },
];
if (qs.get('seed') === '1') {
  clearAllPlaces();
  for (const s of SEED) {
    const L = INDEX.lessons.find((l) => l.i === s.lessonId);
    if (L) recordPlace({ courseKey: INDEX.courses[L.c].k, lessonId: L.i, stage: 1, step: 2, sentence: 6, seen: s.seen, started: true });
  }
} else if (qs.get('seed') === '0') clearAllPlaces();

function Harness() {
  const [log, setLog] = React.useState('');
  const say = (m) => setLog(m);
  React.useEffect(() => {
    const q = qs.get('q');
    if (!q) return;
    const el = document.getElementById('ld-q');
    if (!el) return;
    const set = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set;
    set.call(el, q);
    el.dispatchEvent(new Event('input', { bubbles: true }));
  }, []);
  const theme = qs.get('theme') || 'night';
  return (
    <div data-theme={theme === 'none' ? undefined : theme} style={{ minHeight: '100vh', background: ['night', 'midnight'].includes(theme) ? 'var(--lc-paper, #fff)' : ((THEMES.find((t) => t.key === theme) || {}).color || '#fff') }}>
      <style>{THEME_CSS}</style>
      <LearnDiscover
        onBrowseAll={() => say('Browse All Lessons → setChurchView("learn")')}
        onOpenLesson={(c, id) => say(`Open lesson ${id} in ${c}`)}
        onOpenArea={(a) => say(`Open Learn area "${a}"`)}
        onOpenCourse={(k) => say(`Open course ${k}`)}
      />
      <div data-testid="harness-log" style={{ position: 'fixed', left: 0, right: 0, bottom: 0, padding: '6px 10px', background: '#000', color: '#9f9', font: '12px monospace', display: log ? 'block' : 'none' }}>{log}</div>
    </div>
  );
}
createRoot(document.getElementById('root')).render(<Harness />);
