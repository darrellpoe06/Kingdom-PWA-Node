// =============================================================================
// The Word is never sold — the access model, proven on the real catalog
// =============================================================================
// Darrell 2026-09-19: "should we separate certain courses for the paid
// versions? If so... which one!!!!!!"
//
// This file is the surface proof (DR-0076 §6) that the answer holds on the
// catalog as it actually stands, not on a diagram: every course is classified,
// the Word's own departments are free, the reading is free in every tier, and
// NOTHING in the app reads the enforcement flag to lock a lesson.
//
// The last one matters most. A model like this is one careless import away from
// becoming a paywall, and the app currently promises the reader "nothing is
// locked". So the grep-for-callers assertion is not decoration -- it is the
// brake, and it fails the build the moment a component starts gating on it.
import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { LEARN_CATALOG } from '../lib/learn-catalog.js';
import { courseDepartment } from '../lib/learn-organize.js';
import {
  accessTier, sellableFor, lessonTextIsFree, summarize,
  FORMATION_DEPARTMENTS, SELLABLE_ACCOMPANIMENT, ACCESS_ENFORCEMENT,
} from '../lib/learn-access-tiers.js';

const PAIRS = LEARN_CATALOG.map((c) => ({ key: c.key, department: courseDepartment(c) }));

describe('every course is classified, from the department the registry already declares', () => {
  it('measures a real catalog, not an empty list', () => {
    expect(PAIRS.length).toBeGreaterThan(30);
    expect(new Set(PAIRS.map((p) => p.department)).size).toBeGreaterThan(5);
  });

  it('leaves no course unclassified — coverage is total, by derivation', () => {
    const missing = PAIRS.filter((p) => !['formation', 'vocational'].includes(accessTier(p.department)));
    expect(missing).toEqual([]);
  });

  it('defaults an unknown or missing department to FREE, never to paid', () => {
    // The direction of the default is the whole safety property: a course that
    // mounts before its department is declared must fall open, not shut.
    expect(accessTier(null)).toBe('formation');
    expect(accessTier('')).toBe('formation');
    expect(accessTier('   ')).toBe('formation');
  });
});

describe('the Word is never sold', () => {
  it('puts the Living Lessons and Little Learners in formation, by name', () => {
    // Pinned by name rather than by department alone: these two are the bright
    // line -- the Word itself, and the children Darrell built the bands for.
    for (const key of ['living-lessons', 'little-learners']) {
      const pair = PAIRS.find((p) => p.key === key);
      expect(pair, `${key} is not in the catalog`).toBeTruthy();
      expect(accessTier(pair.department), `${key} must never be vocational`).toBe('formation');
      expect(sellableFor(pair.department), `nothing may be sold beside ${key}`).toEqual([]);
    }
  });

  it('classifies every formation department as formation and sells nothing beside it', () => {
    for (const d of FORMATION_DEPARTMENTS) {
      expect(accessTier(d)).toBe('formation');
      expect(sellableFor(d)).toEqual([]);
    }
  });

  it('keeps the READING free in every tier, including vocational', () => {
    expect(lessonTextIsFree()).toBe(true);
    const voc = PAIRS.filter((p) => accessTier(p.department) === 'vocational');
    expect(voc.length, 'no vocational course to check').toBeGreaterThan(0);
    for (const p of voc) {
      // Only accompaniment is ever sellable -- never a lesson, never a band.
      for (const item of sellableFor(p.department)) {
        expect(SELLABLE_ACCOMPANIMENT).toContain(item);
        expect(item).not.toMatch(/lesson|reading|text|band|scripture|word/i);
      }
    }
  });
});

describe('it ships INACTIVE, and cannot quietly stop being inactive', () => {
  it('enforcement is off', () => {
    expect(ACCESS_ENFORCEMENT).toBe(false);
    expect(summarize(PAIRS).enforcement).toBe(false);
  });

  it('no component or lib imports the model to gate content', () => {
    // The brake. Turning this into money is Darrell's decision and a Tier C
    // gate; until he makes it, an import from a rendering surface fails here.
    const roots = ['src/components', 'src/lib'];
    const offenders = [];
    const walk = (dir) => {
      for (const name of readdirSync(dir)) {
        const p = join(dir, name);
        if (statSync(p).isDirectory()) { walk(p); continue; }
        if (!/\.(js|jsx)$/.test(name)) continue;
        if (name === 'learn-access-tiers.js') continue;
        const s = readFileSync(p, 'utf8');
        if (/from '\.{1,2}\/.*learn-access-tiers/.test(s)) offenders.push(p);
      }
    };
    for (const r of roots) walk(join(process.cwd(), r));
    expect(offenders, 'a surface started reading the access model — that is a paywall, and it needs a decision first').toEqual([]);
  });

  it('the reader-facing promise it protects is still on the page', () => {
    // If this copy ever goes, the model's premise went with it and this file
    // should be re-read rather than trusted.
    const learn = readFileSync(join(process.cwd(), 'src/components/ChurchLearn.jsx'), 'utf8');
    expect(learn).toContain('nothing is locked');
  });
});

describe('the split it recommends, stated as numbers', () => {
  it('reports the real division so the decision is made on evidence', () => {
    const s = summarize(PAIRS);
    console.log('FORMATION (free, nothing sold beside it):',
      s.formation.map((p) => p.key).join(', '));
    console.log('VOCATIONAL (reading still free; accompaniment may be priced):',
      s.vocational.map((p) => p.key).join(', '));
    console.log('counts', JSON.stringify(s.counts), 'enforcement', s.enforcement);
    expect(s.counts.formation + s.counts.vocational).toBe(PAIRS.length);
    expect(s.counts.formation).toBeGreaterThan(0);
    expect(s.counts.vocational).toBeGreaterThan(0);
  });
});
