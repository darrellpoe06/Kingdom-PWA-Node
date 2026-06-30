// Proven-to-catch verification for the deterministic feedback auto-evaluator
// (DR-0076). Each category is asserted against a representative real-shaped note,
// severities are pinned, telemetry noise is flagged, and the "lands actionable"
// guarantee (every item gets a category + severity + a non-empty next step) is
// checked exhaustively. A classifier that silently mislabels is worse than none.
import { describe, it, expect } from 'vitest';
import { evaluateFeedback, feedbackText, SEVERITY } from '../lib/feedback-triage.js';

const ev = (text, extra = {}) => evaluateFeedback({ text, ...extra });

describe('evaluateFeedback — category + severity detection', () => {
  it('data-loss is critical', () => {
    const r = ev('I added a choir entry and it disappeared instead of saving');
    expect(r.category).toBe('data-loss');
    expect(r.severity).toBe('critical');
  });
  it('privacy / tenancy is critical', () => {
    const r = ev('This is not my information, there is a wrong name at the top');
    expect(r.category).toBe('privacy-tenancy');
    expect(r.severity).toBe('critical');
  });
  it('sign-in is critical', () => {
    const r = ev("can't login with the new version");
    expect(r.category).toBe('auth');
    expect(r.severity).toBe('critical');
  });
  it('broken / bug is high', () => {
    const r = ev('the Capital Expenditure tab is broken, please re-check the buttons');
    expect(r.category).toBe('broken');
    expect(r.severity).toBe('high');
  });
  it('accessibility is high', () => {
    const r = ev('the text is too small and the contrast is hard to read');
    expect(r.category).toBe('accessibility');
    expect(r.severity).toBe('high');
  });
  it('feature request is normal', () => {
    const r = ev('I would like to attach 3-4 screenshots at once');
    expect(r.category).toBe('feature-request');
    expect(r.severity).toBe('normal');
  });
  it('question is normal', () => {
    const r = ev('how do I open a document in Study?');
    expect(r.category).toBe('question');
  });
  it('praise is low', () => {
    const r = ev('I love the kids class, great job!');
    expect(r.category).toBe('praise');
    expect(r.severity).toBe('low');
  });
  it('telemetry events are flagged as noise, not human feedback', () => {
    const r = ev('[Learn engagement] band=engaged signal=started lesson=x');
    expect(r.category).toBe('telemetry-noise');
    expect(r.isNoise).toBe(true);
  });
  it('screenshot-only with no usable text routes to image review', () => {
    expect(evaluateFeedback({ text: '[bug]', screenshots: ['data:image/x'] }).category).toBe('needs-image-review');
    expect(evaluateFeedback({ text: '', screenshotCount: 2 }).category).toBe('needs-image-review');
  });
  it('falls back to needs-review (normal) for unclassifiable text', () => {
    const r = ev('the thing by the place');
    expect(r.category).toBe('uncategorized');
    expect(r.severity).toBe('normal');
  });
});

describe('feedbackText — recognizes the FeedbackModal shape, not just text/feedback_text', () => {
  it('prefers an explicit text/feedback_text field', () => {
    expect(feedbackText({ text: 'hi' })).toBe('hi');
    expect(feedbackText({ feedback_text: 'yo' })).toBe('yo');
  });
  it('composes the modal whatsWorking/whatsNot/whatsMissing fields (local submission)', () => {
    expect(feedbackText({ whatsNot: 'the import is broken' })).toBe('the import is broken');
    expect(feedbackText({ whatsWorking: 'love it', whatsMissing: 'dark mode' })).toBe('love it · dark mode');
  });
  it('evaluates a modal-shaped local item (was previously invisible to the board)', () => {
    const r = evaluateFeedback({ whatsNot: 'I added a choir entry and it disappeared' });
    expect(r.category).toBe('data-loss');
    expect(r.severity).toBe('critical');
  });
});

describe('routing', () => {
  it('keeps a specific user tab as the route area', () => {
    expect(ev('it is broken', { currentView: 'Church · Choir' }).routeArea).toBe('Church · Choir');
  });
  it('falls back to the category area when the tab is generic', () => {
    expect(ev("can't sign in", { currentView: 'feedback' }).routeArea).toBe('Auth / Sign-in');
  });
});

describe('"lands actionable" — every evaluation is complete', () => {
  const samples = [
    'it disappeared', 'not my data', "can't login", 'broken tab',
    'contrast too small', 'I wish it could', 'how do I?', 'love it',
    '[Learn engagement] signal=started', '', 'random words here',
  ];
  it('always yields a category, a known severity, and a non-empty next step', () => {
    for (const s of samples) {
      const r = ev(s);
      expect(r.category).toBeTruthy();
      expect(Object.keys(SEVERITY)).toContain(r.severity);
      expect(typeof r.priorityRank).toBe('number');
      expect(r.suggestedAction.length).toBeGreaterThan(0);
      expect(r.routeArea.length).toBeGreaterThan(0);
    }
  });
  it('orders severity worst-first by priorityRank', () => {
    expect(ev('it disappeared').priorityRank).toBeLessThan(ev('I wish').priorityRank);
    expect(ev('broken').priorityRank).toBeLessThan(ev('love it').priorityRank);
  });
});
