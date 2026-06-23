// =============================================================================
// TeachMode — thin adapter: present the youth "Learning A.I." course
// =============================================================================
// This used to BE the whole presenter, welded to the A.I. course. It is now a small
// adapter over the shared <Presenter> primitive (components/Presenter.jsx), which
// renders ANY `presentable` (lib/presentable.js). Kept as its own component so the
// standalone ?teach=1 boot (main.jsx) and any existing import stay unchanged — it
// just builds the A.I.-course presentable and hands it to Presenter.
//
// The full present mode (two screens, BroadcastChannel sync, presenter notes, timer,
// clicker support) lives in Presenter; the A.I.-course content + cohort dates come
// from church-classes.js, exactly as before.
import React, { useMemo } from 'react';
import { CLASS_META, PROPOSED_COHORT_START, buildSchedule } from '../lib/church-classes.js';
import { coursePresentable } from '../lib/presentable.js';
import Presenter from './Presenter.jsx';

export default function TeachMode({ cohortStart = PROPOSED_COHORT_START, onClose = null }) {
  const presentable = useMemo(
    () => coursePresentable({ meta: { ...CLASS_META, key: 'ai' }, schedule: buildSchedule(cohortStart) }),
    [cohortStart],
  );
  return <Presenter presentable={presentable} onClose={onClose} />;
}
