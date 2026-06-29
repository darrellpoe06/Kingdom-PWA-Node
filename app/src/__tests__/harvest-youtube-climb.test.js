// =============================================================================
// The YouTube-transcript climb — the number Darrell watches goes past 22%.
// =============================================================================
// Darrell's live issue (2026-06-29): "Harvest was 11%, now ~22%, stuck." The
// transcript-derived harvests were gated on a Whisper-on-NAS (GPU) run that never
// happened. YouTube auto-generates captions for every service video — that IS the
// transcript. Feed it to deriveSignals and the gated harvests light NOW, no GPU.
//
// PROVEN-TO-CATCH (DR-0076): a single video must climb FROM 22% (the ceiling) past
// it once its YouTube transcript is supplied. If a future change re-gates the
// transcript-derived harvests, this video falls back to 22% and the test goes red.
//
// LIVE-VERIFIED: the same deriveSignals/buildLedger path ran against three real
// @thelovecorner transcripts pulled from YouTube auto-captions (BQC4nYa33vo,
// xsjO93qBw5I, rYEEkcT78e0 — 9.7k-11.6k words each) and climbed every video
// 22% -> 67%. This test pins the mechanism with a compact in-repo transcript so it
// stays deterministic and offline.
import { describe, it, expect } from 'vitest';
import { buildLedger, harvestMapFor } from '../lib/video-harvest.js';

// A realistic service transcript (YouTube auto-caption shape) rich enough to light
// every transcript-derived harvest.
const TRANSCRIPT = `
>> Amen, hallelujah. Turn with me to John 3:16 and to Romans 8:28. The Bible says in
Proverbs 22:6 to train up a child. Now watch this. The first thing I want you to understand
is that God is a father to the fatherless. What does it mean to be a real father today? The
second thing is that fatherhood is a responsibility. I remember when I was a young man, my
mother raised me while my father stayed away. Years ago I made a promise to God about my
family. The money comes and the money goes, but a father who stays is true wealth. Many of us
carry debt and the pressure of providing, and our children are watching. Have you ever been
blessed and not felt blessed? The point is that the father sets the tone for the whole family
and these children.
`;

// An imported COLG service row: dated + typed, NO scripture_ref, NO linked song —
// exactly what the YouTube title importer produces. This is the 22% case.
const importedService = (i) => ({
  videoId: `vid${i}`,
  title: 'ALL FATHERS MATTER',
  serviceDate: `2026-06-0${(i % 9) + 1}`,
  serviceType: i % 2 ? 'wednesday' : 'sunday',
  speaker: 'Bishop Gwin',
  scriptureRef: null,
});

describe('a video climbs past the 22% ceiling once its YouTube transcript lands', () => {
  it('22% (no transcript) -> well past 22% (transcript supplied)', () => {
    const before = buildLedger({ sermons: [importedService(1)] });
    expect(before.rows[0].coverage.pct).toBe(22); // the ceiling

    const after = buildLedger({
      sermons: [importedService(1)],
      transcripts: { vid1: { text: TRANSCRIPT } },
    });
    const pct = after.rows[0].coverage.pct;
    expect(pct).toBeGreaterThan(22);   // CEILING BROKEN
    expect(pct).toBeGreaterThanOrEqual(60); // 4 complete + 4 partial of 9 ≈ 67%
  });

  it('lights the previously-gated harvests with real, evidenced extractions', () => {
    const after = buildLedger({
      sermons: [importedService(2)],
      transcripts: { vid2: { text: TRANSCRIPT } },
    });
    const map = harvestMapFor(after.rows[0].harvests);
    // The foundation + a full scripture sweep complete off the transcript.
    expect(map.transcript.status).toBe('complete');
    expect(map.scripture.status).toBe('complete');
    // The four mined harvests light 'partial', each evidenced + backed by real refs.
    for (const k of ['lessons', 'discernment', 'testimony', 'trivia']) {
      expect(map[k].status).toBe('partial');
      expect(map[k].evidenced).toBe(true);
      expect(map[k].count).toBeGreaterThan(0);
    }
  });

  it('a corpus of transcribed videos averages well above the 22% freeze', () => {
    const sermons = Array.from({ length: 10 }, (_, i) => importedService(i));
    const transcripts = Object.fromEntries(sermons.map((s) => [s.videoId, { text: TRANSCRIPT }]));
    const after = buildLedger({ sermons, transcripts });
    expect(after.avgPct).toBeGreaterThanOrEqual(60);
    expect(after.noVideoLost).toBe(true);
    expect(after.orphans).toBe(0);
  });

  it('a video WITHOUT captions honestly stays at 22% (no painting) — the Whisper fallback case', () => {
    const sermons = [importedService(1), importedService(2)];
    // Only vid1 has a transcript; vid2 has no captions yet.
    const after = buildLedger({ sermons, transcripts: { vid1: { text: TRANSCRIPT } } });
    const byId = Object.fromEntries(after.rows.map((r) => [r.videoId, r.coverage.pct]));
    expect(byId.vid1).toBeGreaterThanOrEqual(60);
    expect(byId.vid2).toBe(22); // honest gap — flagged for the Whisper fallback
  });
});
