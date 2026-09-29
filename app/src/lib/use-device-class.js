// use-device-class — the live device class, re-measured when the screen changes
// (DR-0678). A laptop docked to a monitor, a phone turned sideways, a Fold
// opened: the class follows the measurement, it is never fixed at boot.
import { useEffect, useState } from 'react';
import { deviceClassFromWindow, markDeviceClass } from './device-roles.js';

export function useDeviceClass(override = null) {
  const [cls, setCls] = useState(() => override || deviceClassFromWindow());
  useEffect(() => {
    if (override) { setCls(override); return undefined; }
    if (typeof window === 'undefined') return undefined;
    const update = () => setCls(markDeviceClass(window));
    update();
    window.addEventListener('resize', update);
    let mq = null;
    try { mq = window.matchMedia ? window.matchMedia('(any-pointer: fine)') : null; } catch { mq = null; }
    try { if (mq && mq.addEventListener) mq.addEventListener('change', update); } catch { /* old browser */ }
    return () => {
      window.removeEventListener('resize', update);
      try { if (mq && mq.removeEventListener) mq.removeEventListener('change', update); } catch { /* old browser */ }
    };
  }, [override]);
  return cls;
}
