// =============================================================================
// voice-road-home — the reading voice's route must TERMINATE, not just exist
// =============================================================================
// Darrell, 2026-09-20, on a Fire TV with a lesson open: "No sounds yet for the
// tts... but it does click and do what it should."
//
// The clicking was the truth of it. The control worked; there was nothing
// anywhere that could produce audio for that device. Fire OS's Silk may carry
// no speechSynthesis voice at all, so the browser stand-in has nothing to speak
// with, and the app's answer to exactly that is to route the System voice to
// the church's OWN studio instead (DR-0382 / DR-0394) — device-independent by
// construction. But the road to that studio did not exist: the same-origin
// Pages Function forwarded /voice/* to the Funnel, and the Funnel had no
// /voice mount at all.
//
// That is the third time this repository has built a client hop to a Funnel
// route that terminated at nothing — /nas-photos (DR-0268, silent for five
// weeks), /taxes (DR-0330, silent for seven) and now this one. The difference
// is that this one never shipped that way: funnel-actuation-guard refused it in
// the same session it was written. These assertions hold the pieces that guard
// cannot see.
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const repo = (rel) => readFileSync(fileURLToPath(new URL('../../../' + rel, import.meta.url)), 'utf8');

const SERVER = repo('infra/voice-studio/server.py');
const INSTALL = repo('infra/voice-studio/install.sh');
const MANIFEST = JSON.parse(repo('infra/nas-loops/services.json'));

describe('the studio answers whatever the mount hands it', () => {
  // Whether a Tailscale path mount strips its prefix before forwarding is a
  // property of the binary running on the NAS, and nothing here can read that
  // machine. The tax server met the identical uncertainty and settled it by
  // answering to both spellings; guessing would put the whole feature on a
  // coin flip nobody can inspect.
  it('serves /speak AND /voice/speak', () => {
    expect(SERVER).toContain('@app.post("/speak")');
    expect(SERVER).toContain('@app.post("/voice/speak")');
  });

  it('serves /health AND /voice/health, so the installer can probe either', () => {
    expect(SERVER).toContain('@app.get("/health")');
    expect(SERVER).toContain('@app.get("/voice/health")');
  });

  it('both aliases decorate ONE handler — two handlers would drift', () => {
    // Stacked decorators on a single def. If someone ever copies the body to
    // add the prefixed route, the clone path and the built-in-speaker choice
    // start diverging between the two spellings and only one gets fixed.
    const speakDefs = SERVER.match(/^async def speak\(/gm) || [];
    expect(speakDefs.length, 'the speak handler is defined more than once').toBe(1);
    const healthDefs = SERVER.match(/^def health\(/gm) || [];
    expect(healthDefs.length, 'the health handler is defined more than once').toBe(1);
  });
});

describe('the mount is made only against a studio that answered', () => {
  it('probes /health before mounting anything', () => {
    expect(INSTALL).toMatch(/curl[^\n]*\/health/);
    expect(INSTALL).toContain('--set-path /voice');
  });

  // PROVEN-TO-CATCH. This is the assertion that matters, and it is about a
  // failure that is WORSE than the one being fixed. A path mounted at a host
  // that is not answering does not fail the reader — it hangs them, and it
  // reads as fully actuated to every check in this repository including the
  // guard that just went green. The installer must refuse that.
  it('a cycle with no answering studio mounts NOTHING and still exits 0', () => {
    const noBackend = INSTALL.slice(INSTALL.indexOf('if [ -z "$BACKEND" ]'));
    expect(noBackend, 'the empty-backend branch is gone').toBeTruthy();
    const beforeExit = noBackend.slice(0, noBackend.indexOf('exit 0'));
    expect(beforeExit, 'it mounts before checking it found a backend').not.toContain('--set-path');
    expect(beforeExit).toContain('NOTHING MOUNTED');
    // exit 0, not 1: a dark GPU box is a normal state, not a broken NAS. A
    // non-zero exit here would fail the whole services-sync cycle and take the
    // photo server, the tax archive and Supabase's repair pass down with it.
    expect(noBackend).toContain('exit 0');
  });

  // PROVEN-TO-CATCH a premise I shipped wrong and then verified. This file was
  // first written offering tlcmediadpt by MagicDNS, its tailnet name and its
  // measured address as mount targets, on the assumption that a Funnel path
  // can point anywhere the node can reach. Tailscale refuses a non-local
  // target outright -- "only localhost or 127.0.0.1 proxies are currently
  // supported", tailscale/tailscale#8751, open since 2023-07-31 -- so those
  // mounts would have failed on every cycle while the actuation guard stayed
  // green, because the row and the installer both existed. One search would
  // have said so before the code rode on it.
  it('never offers a mount target tailscale will refuse', () => {
    const setPath = INSTALL.match(/--set-path \/voice "?\$?\{?[A-Za-z_]*\}?"?/g) || [];
    expect(setPath.length, 'the mount line is gone').toBeGreaterThan(0);
    const candidates = (INSTALL.match(/^CANDIDATES=.*$/m) || [''])[0];
    expect(candidates, 'the candidate list is gone').toContain('127.0.0.1');
    // Any http:// target in the candidate list that is not loopback cannot be
    // mounted, so offering one can only ever produce a silent per-cycle failure.
    const hosts = (candidates.match(/https?:\/\/[^\s"']+/g) || []);
    const remote = hosts.filter((h) => !/^https?:\/\/(127\.0\.0\.1|localhost)\b/.test(h));
    expect(remote, `tailscale cannot proxy to these: ${remote.join(', ')}`).toEqual([]);
  });

  it('uses funnel, never serve — serve is tailnet-only and REPLACES the public exposure', () => {
    expect(INSTALL).toMatch(/funnel --bg --set-path \/voice/);
    expect(INSTALL).not.toMatch(/\bserve --bg\b/);
  });

  it('is idempotent — an existing /voice mount is left alone', () => {
    expect(INSTALL).toContain('funnel status');
    expect(INSTALL).toContain('already mounted on the funnel');
  });
});

describe('something actually RUNS the installer', () => {
  // The /taxes defect was not a missing installer. tax_upload_server.py had a
  // README telling a person to run it. What it lacked was a manifest entry, so
  // nothing on the NAS ever did. An installer nobody calls is a document.
  it('voice-transport is registered in the self-deploy manifest and enabled', () => {
    const entry = MANIFEST.services.find((s) => s.name === 'voice-transport');
    expect(entry, 'voice-transport is not in infra/nas-loops/services.json').toBeTruthy();
    expect(entry.install).toBe('infra/voice-studio/install.sh');
    expect(entry.enabled).toBe(true);
  });

  it('and the app really does call the route this mounts', () => {
    const fn = repo('app/functions/voice/[[path]].js');
    expect(fn).toContain("upstreamPrefix: '/voice'");
    expect(repo('app/src/lib/voice-service.js')).toContain("SOVEREIGN_VOICE_PATH = '/voice'");
  });
});

describe('configuration stopped being a question — every surface asks the studio', () => {
  // Making /voice same-origin turned isVoiceServiceReady() into a constant
  // `true`, and three surfaces were still treating it as a variable. None of
  // them threw; each simply started saying something that could not be false.
  // That is the quietest way for a screen to lie, and it is DR-0440's own
  // defect class — the comment naming it sits in voice-service.js, twenty
  // lines from the function that caused it.
  const STUDIO = repo('app/src/components/VoiceStudio.jsx');
  const TEACHER = repo('app/src/components/LessonTeacher.jsx');
  const HOOK = repo('app/src/lib/use-read-aloud.js');

  it('the studio panel reports health, not configuration', () => {
    expect(STUDIO).toMatch(/const studioLine = studioHealth === 'down'/);
    // The retired line told a steward to set VITE_VOICE_SERVICE_URL. Beyond
    // being unreachable it was wrong advice: the studio serves plain HTTP on
    // :8770 and an HTTPS page refuses that as mixed content, so no value in
    // that variable could have worked from poetech.us.
    expect(STUDIO, 'the unreachable VITE_VOICE_SERVICE_URL instruction is back')
      .not.toMatch(/pointed at it \(VITE_VOICE_SERVICE_URL\)/);
  });

  it('the studio panel derives readiness from the probe, not a parameter default', () => {
    // A default parameter cannot see studioHealth, which is why this was wrong
    // by construction rather than by oversight.
    expect(STUDIO).not.toMatch(/sovereignVoiceReady = isVoiceServiceReady\(\)/);
    expect(STUDIO).toMatch(/isVoiceServiceReady\(\) && studioHealth !== 'down'/);
  });

  it('the teacher asks before claiming a REAL cloned voice', () => {
    // voiceReady decides whether the lesson introduces the teacher as speaking
    // in their own voice or as a labelled stand-in. Claiming the real one over
    // a dark studio is the specific dishonesty here.
    expect(TEACHER).toMatch(/const studioHealth = await probeVoiceService\(\)/);
    expect(TEACHER).toMatch(/voiceReady: isVoiceServiceReady\(\) && studioHealth !== 'down'/);
  });

  it('the reader keeps its own honest derivation', () => {
    expect(HOOK).toMatch(/isVoiceServiceReady\(\) && studioHealth !== 'down'/);
  });
});

describe('arming the studio cannot report a confident wrong answer', () => {
  // The workflow is the other half of this route and nothing gated it. Its
  // first version carried two numbers that would each have produced a clean,
  // specific, WRONG verdict on the very first real run — the worst kind of
  // failure, because a wrong diagnosis gets acted on and a crash does not.
  const ARM = repo('.github/workflows/arm-voice-studio.yml');

  it('the job ceiling fits a COLD build, which is what a first run is', () => {
    // compose declares `build: ../voice-studio` over a multi-gigabyte CUDA
    // base plus a pip install of TTS and its tree. Nothing about that fits in
    // 25 minutes on a residential line, and a run killed mid-build leaves a
    // half-populated layer cache and reports nothing usable.
    const m = ARM.match(/timeout-minutes:\s*(\d+)/);
    expect(m, 'the arm job declares no timeout at all').toBeTruthy();
    expect(Number(m[1]), 'the ceiling is back below a cold build').toBeGreaterThanOrEqual(60);
  });

  it('the FIRST speak is given room for the model download; only the WARM one judges', () => {
    // XTTS-v2's weights (~1.8 GB) download on the first synthesis. At the
    // original 180-second ceiling that call times out, and the verify step
    // then announced "NO AUDIO — the model has no speaker bank": a precise
    // diagnosis of a download in progress. Two attempts, and the conclusion
    // belongs to the second.
    const first = ARM.match(/curl -s -m (\d+) -X POST[^\n]*first speak/);
    const warm = ARM.match(/curl -s -m (\d+) -X POST[^\n]*warm speak/);
    expect(first, 'the two-attempt speak verification is gone').toBeTruthy();
    expect(warm).toBeTruthy();
    expect(Number(first[1]), 'the first speak cannot outlast a model download').toBeGreaterThanOrEqual(600);
    expect(Number(warm[1])).toBeLessThan(Number(first[1]));
  });

  it('a real synthesis is still what counts as armed — /health is not enough', () => {
    // server.py loads the model lazily so /health answers cold. A workflow
    // that stopped at a 200 would call a studio armed that cannot speak.
    expect(ARM).toMatch(/\/speak/);
    expect(ARM).toMatch(/test -s \/tmp\/v\.wav/);
  });

  it('the probe stays read-only and default-off', () => {
    // Arming pulls gigabytes. A dispatch that has not asked for it must not.
    expect(ARM).toMatch(/arm[\s\S]{0,200}default: 'false'/);
    expect(ARM).toMatch(/if: \$\{\{ github\.event\.inputs\.arm == 'true' \}\}/);
  });

  it('and it mounts the road home instead of leaving the reader to wait a cycle', () => {
    // services-sync would mount /voice within fifteen minutes on its own. That
    // is correct and it is also fifteen minutes of a reader pressing a button
    // that does nothing, when the mount can be asked for the moment the studio
    // answers. The installer is idempotent and refuses a dark backend, so
    // doing it here is safe and no-ops if the cycle got there first.
    expect(ARM).toMatch(/infra\/voice-studio\/install\.sh/);
  });
});
