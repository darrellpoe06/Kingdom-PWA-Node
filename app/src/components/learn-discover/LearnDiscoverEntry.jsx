// =============================================================================
// LearnDiscoverEntry — the one piece the shell mounts in place of Learn's front door
// =============================================================================
// Church Homepage -> The Word / Learning Zone -> THIS (discovery) -> the existing Learn, unchanged.
// The shell passes the existing Learn as `renderLearn`; this component never renders a second Learn, never edits one, and
// opens it through the same doors Learn already has (learn-open.js, learn-landing.js, Learn Studio's own controls).
// A link that already names a course or lesson (?course= / ?lesson=) goes straight to Learn, as it does today.
// Not mounted anywhere yet: see docs/design/learn-discover/INTEGRATION.md for the shell's few lines.
// =============================================================================
import React, { useCallback, useState } from 'react';
import LearnDiscover from './LearnDiscover.jsx';
import { openLearnArea, openLearnCourse } from '../../lib/learn-discover-nav.js';
import { requestOpenLesson } from '../../lib/learn-open.js';

function hasDeepLink(search) {
  try {
    const q = new URLSearchParams(search || '');
    return !!(q.get('lesson') || q.get('course'));
  } catch {
    return false;
  }
}

export default function LearnDiscoverEntry({ renderLearn, search = typeof window !== 'undefined' ? window.location.search : '', ...rest }) {
  const [mode, setMode] = useState(() => (hasDeepLink(search) ? 'learn' : 'discover'));
  const toLearn = useCallback(() => setMode('learn'), []);
  if (mode === 'learn')
    return (
      <>
        <div className="ld-back-bar" style={{ padding: '6px 10px' }}>
          <button type="button" className="ld-link focus-visible:outline focus-visible:outline-2" onClick={() => setMode('discover')} data-testid="ld-back">
            ← Learning Zone home
          </button>
        </div>
        {renderLearn()}
      </>
    );
  return (
    <LearnDiscover
      {...rest}
      onBrowseAll={toLearn}
      onOpenArea={(area) => openLearnArea(area, { openLearn: toLearn })}
      onOpenCourse={(key) => openLearnCourse(key, { openLearn: toLearn })}
      onOpenLesson={(courseKey, lessonId) => {
        requestOpenLesson({ lessonId, courseKey }); // Learn takes the request when it mounts
        toLearn();
      }}
    />
  );
}
