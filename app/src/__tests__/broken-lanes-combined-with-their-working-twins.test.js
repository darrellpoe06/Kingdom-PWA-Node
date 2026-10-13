// =============================================================================
// Four red lanes, each carried to the route that works (DR-0621, DR-0622).
// =============================================================================
// Measured 2026-09-24 by the live flow proof (run 36072180867): four dispatch
// tools read broken on their last hand-run. Each root cause was read from its
// failing run, and each lane now joins its working twin rather than being
// retired. These pins hold the combination so a later edit cannot quietly
// restore the red route.
// =============================================================================
import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(__dirname, '../../..');
const read = (rel) => fs.readFileSync(path.join(ROOT, rel), 'utf8');

describe('source-transcript: a bot challenge hands the link to the NAS route (run 35673574195)', () => {
  const runner = read('.github/workflows/source-transcript.yml');
  const nas = read('.github/workflows/source-transcript-nas.yml');
  it('the challenge sets refused and ends the runner step green, instead of exit 1', () => {
    expect(runner).toMatch(/echo "refused=true" >> "\$GITHUB_OUTPUT"\n\s+exit 0/);
  });
  it('the same run calls the NAS route with the video id it read from the link', () => {
    expect(runner).toMatch(/uses: \.\/\.github\/workflows\/source-transcript-nas\.yml/);
    expect(runner).toMatch(/if: needs\.transcript\.outputs\.refused == 'true'/);
    expect(runner).toMatch(/video_id: \$\{\{ needs\.transcript\.outputs\.video_id \}\}/);
    expect(nas).toMatch(/workflow_call:/);
  });
  it('reads the id from the link shapes people send', () => {
    const m = /sed -nE '(s#[^']+#p)'/.exec(runner);
    expect(m).not.toBe(null);
    const re = /.*(youtu\.be\/|[?&]v=|\/shorts\/|\/live\/|\/embed\/)([A-Za-z0-9_-]{11}).*/;
    for (const url of ['https://youtu.be/18pppZ3egOg', 'https://www.youtube.com/watch?v=18pppZ3egOg&t=30', 'https://youtube.com/shorts/18pppZ3egOg']) {
      expect(re.exec(url)[2]).toBe('18pppZ3egOg');
    }
  });
  it('a transcript already on main word for word is a success, not a failed empty commit', () => {
    expect(runner).toMatch(/already on main, word for word/);
    expect(nas).toMatch(/already on main, word for word/);
  });
});

describe('transcript-backfill: a dispatch runs the NAS trickle under its own budget (run 29162978378)', () => {
  const wf = read('.github/workflows/transcript-backfill.yml');
  it('without proxy secrets the NAS route runs, by the trickle rider itself', () => {
    expect(wf).toMatch(/if: needs\.route\.outputs\.proxy != 'true'/);
    expect(wf).toMatch(/transcript_trickle_install\.sh/);
  });
  it('proven to catch: a hand dispatch can never ask the NAS for more than 8 (the runner lane asked 50)', () => {
    expect(wf).toMatch(/if \[ "\$MAX" -gt 8 \]; then MAX=8; fi/);
  });
  it('the runner lane runs only with residential proxy secrets', () => {
    expect(wf).toMatch(/runner:\n\s+needs: route\n\s+if: needs\.route\.outputs\.proxy == 'true'/);
  });
});

describe('nas-agent-arm: the consumer serves the database the app reads (run 31860587442)', () => {
  const wf = read('.github/workflows/nas-agent-arm.yml');
  const consumer = read('infra/nas-agent/agent_consumer.py');
  it('the lane carries no credential and never overwrites agent.env', () => {
    expect(wf).not.toMatch(/secrets\.SUPABASE_DB_URL/);
    expect(wf).not.toMatch(/cat > \/volume1\/docker\/poetech\/agent\.env/);
  });
  it('the proof is the consumer naming the sovereign database, or the run is red', () => {
    expect(wf).toMatch(/grep -q "serving the sovereign database"/);
    expect(consumer).toMatch(/serving the \{\} database/);
  });
  it('the consumer follows the repoint record before any placed URL', () => {
    const iArmed = consumer.indexOf('if os.path.exists(armed_path):');
    const iUrl = consumer.indexOf('url = env.get("AGENT_DB_URL", "")');
    expect(iArmed).toBeGreaterThan(-1);
    expect(iUrl).toBeGreaterThan(iArmed);
  });
});
