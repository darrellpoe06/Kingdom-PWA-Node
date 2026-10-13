import { describe, it, expect } from 'vitest';
import {
  makeProvider, validateProvider, isDispatchable, providersForCapability,
  summarizeProviders, SEED_PROVIDERS,
} from '../lib/llm-providers.js';

describe('provider register — validation & honesty gate', () => {
  it('every SEED provider is valid', () => {
    const bad = SEED_PROVIDERS.filter((p) => !validateProvider(p).ok);
    expect(bad.map((b) => b.id)).toEqual([]);
  });
  it('catches an unknown kind and an unknown capability', () => {
    // makeProvider normalizes (drops unknown caps); validateProvider is the gate.
    // Set fields directly to exercise the gate rather than the normalizer.
    const badCap = makeProvider({ name: 'x', kind: 'local', ollamaModel: 'm' });
    badCap.capabilities = ['nope'];
    expect(validateProvider(badCap).ok).toBe(false);
    const badKind = makeProvider({ name: 'x' });
    badKind.kind = 'weird';
    expect(validateProvider(badKind).ok).toBe(false);
  });
  it('a local provider must name an ollamaModel', () => {
    expect(validateProvider(makeProvider({ name: 'x', kind: 'local' })).ok).toBe(false);
  });
  it('HONESTY: cannot be "available" while keyRequired and key absent', () => {
    const p = makeProvider({
      name: 'v', kind: 'vendor', apiId: 'a', keyEnv: 'K', keyRequired: true,
      keyPresent: false, status: 'available', capabilities: ['reasoning'],
    });
    expect(validateProvider(p).ok).toBe(false);
  });
});

describe('dispatchability & routing order', () => {
  it('isDispatchable: available local yes; keyless vendor no; keyed vendor yes; unconfigured no', () => {
    expect(isDispatchable(makeProvider({ name: 'l', kind: 'local', ollamaModel: 'm', status: 'available' }))).toBe(true);
    expect(isDispatchable(makeProvider({ name: 'v', kind: 'vendor', keyEnv: 'K', keyRequired: true, keyPresent: false, status: 'available' }))).toBe(false);
    expect(isDispatchable(makeProvider({ name: 'v', kind: 'vendor', keyEnv: 'K', keyRequired: true, keyPresent: true, status: 'available' }))).toBe(true);
    expect(isDispatchable(makeProvider({ name: 'l', kind: 'local', ollamaModel: 'm', status: 'unconfigured' }))).toBe(false);
  });
  it('providersForCapability puts sovereign/free-local first', () => {
    const list = [
      makeProvider({ id: 'v', name: 'v', kind: 'vendor', keyEnv: 'K', keyRequired: true, keyPresent: true, status: 'available', costTier: 'high', capabilities: ['code-review'] }),
      makeProvider({ id: 'l', name: 'l', kind: 'local', ollamaModel: 'm', status: 'available', costTier: 'free-local', capabilities: ['code-review'] }),
    ];
    const ranked = providersForCapability(list, 'code-review', { dispatchableOnly: true });
    expect(ranked.map((p) => p.id)).toEqual(['l', 'v']);
  });
  it('summarizeProviders reports honest counts on the seed', () => {
    const s = summarizeProviders(SEED_PROVIDERS);
    expect(s.total).toBe(8);
    expect(s.local).toBe(5); // 4 qwen/embed + Flux (unconfigured)
    expect(s.vendor).toBe(3);
    // only the 3 verified-available RIGHT-box local models dispatch today
    // (LEFT qwen + Flux are unconfigured; vendors keyless)
    expect(s.dispatchable).toBe(3);
  });
  it('a local diffusion provider validates with a model but no ollamaModel (Flux)', () => {
    const flux = SEED_PROVIDERS.find((p) => p.id === 'local-flux-tlcmedia');
    expect(flux.runtime).toBe('comfyui');
    expect(validateProvider(flux).ok).toBe(true);
    expect(isDispatchable(flux)).toBe(false); // unconfigured until stood up
  });
});
