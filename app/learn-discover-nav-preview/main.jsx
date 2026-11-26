// DEV-ONLY review harness (not a Vite build input, never deployed): shows what each discovery route does to the
// REAL Learn. It mounts the real ChurchLearn, sets the same one-time area hint the discovery page sets, and (in the
// new look) lets openLearnArea press Learn Studio's own controls.
//   ?look=new|classic   which Learn to mount (the new look is the default for every member)
//   ?area=lessons|browse|record|downloads|tools   the discovery tile that was tapped; omit for "Browse All Lessons"
import React from 'react';
import '../src/index.css';
import { createRoot } from 'react-dom/client';
import ChurchLearn from '../src/components/ChurchLearn.jsx';
import { THEME_CSS } from '../src/lib/theme-css.js';
import { openLearnArea } from '../src/lib/learn-discover-nav.js';

const qs = new URLSearchParams(window.location.search);
const area = qs.get('area');
const look = qs.get('look') || 'new';
try { window.sessionStorage.clear(); } catch { /* no storage */ }
try { window.localStorage.setItem('poe-learn-studio', look === 'new' ? '1' : '0'); } catch { /* no storage */ }
if (area) openLearnArea(area, { openLearn: () => {}, every: 80, tries: 60 });

function Page() {
  return (
    <div data-theme="night" style={{ minHeight: '100vh', background: 'var(--lc-paper, #fff)', color: 'var(--lc-ink)' }}>
      <style>{THEME_CSS}</style>
      <ChurchLearn learnStudioDefaultOn={look === 'new'} />
    </div>
  );
}
createRoot(document.getElementById('root')).render(<Page />);
