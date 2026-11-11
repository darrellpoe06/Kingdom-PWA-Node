// =============================================================================
// RecordMark — one of the record's pictures, from the app's own artwork only
// =============================================================================
// See lib/record-marks.js (DR-1416). Decorative: the words beside a mark carry
// its meaning, so it is hidden from a screen reader and draws nothing at all
// if its picture cannot load. Sized in em, so Big Print scales it.
// =============================================================================
import React, { useState } from 'react';
import { recordMarkSrc } from '../lib/record-marks.js';

export default function RecordMark({ name, size = 1, className = '', style = null }) {
  const [failed, setFailed] = useState(false);
  const src = recordMarkSrc(name);
  if (!src || failed) return null;
  return (
    <img
      src={src}
      alt=""
      aria-hidden="true"
      draggable="false"
      data-testid={`record-mark-${name}`}
      className={className}
      style={{ width: `${size}em`, height: `${size}em`, display: 'inline-block', verticalAlign: '-0.125em', ...(style || {}) }}
      onError={() => setFailed(true)}
    />
  );
}
