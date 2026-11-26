// =============================================================================
// ChurchLearnWithDoor — what the shell's "learn" surface now mounts (surfaces.js)
// =============================================================================
// The shell is frozen (DR-0078), so the discovery door is mounted through the surface registry, not edited into the
// shell: surfaces.js loads THIS module for the Learn surface. It renders the existing ChurchLearn with every prop passed
// through unchanged, behind LearnDoor (which returns that same Learn for a deep link, an opt-out, or a failed load).
// The retired Eternal Algorithms route reaches the same surface with `initialDept` set, and goes straight to Learn.
// =============================================================================
import React from 'react';
import ChurchLearn from '../ChurchLearn.jsx';
import LearnDoor from './LearnDoor.jsx';

export default function ChurchLearnWithDoor(props) {
  const learn = <ChurchLearn {...props} />;
  return props.initialDept ? learn : <LearnDoor learn={learn} />;
}
