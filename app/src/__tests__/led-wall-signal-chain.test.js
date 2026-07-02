// LED-wall signal chain — proven-to-catch. Guards the confirmed wiring numbers
// (8 LED lines, one per column; ~510k px/line under the ~650k limit; 2 spare
// ports) and that the Projects-tab deliverables (teaching card + finish
// checklist) carry the load-bearing install facts. Paint over them and a case
// fails (DR-0076: measure/derive, don't claim).
import { describe, it, expect } from 'vitest';
import {
  WALL_GRID, VIDEO_IN, CONTROL, LED_DATA, POWER, MAP,
  ledLineMath, TEACHING_CARD, FINISH_CHECKLIST, CHAIN_DIAGRAM,
  FIRST_LIGHT, VENDOR_MESSAGE, VX1000_SOFTWARE,
  TOOL_CACHE, CONTROL_FROM_ANYWHERE,
} from '../lib/led-wall-signal-chain.js';

describe('WALL_GRID — 8 columns x 6 rows = 48', () => {
  it('records the confirmed grid + ~85k px/cabinet', () => {
    expect(WALL_GRID.columns).toBe(8);
    expect(WALL_GRID.rows).toBe(6);
    expect(WALL_GRID.columns * WALL_GRID.rows).toBe(WALL_GRID.cabinets);
    expect(WALL_GRID.cabinets).toBe(48);
    expect(WALL_GRID.pxPerCabinet).toBe(85000);
  });
});

describe('ledLineMath — one line per column, under the Gigabit limit', () => {
  const m = ledLineMath();
  it('derives 8 lines of 6 cabinets = ~510k px/line', () => {
    expect(m.lines).toBe(8);
    expect(m.cabinetsPerLine).toBe(6);
    expect(m.pxPerLine).toBe(510000);
  });
  it('each line is UNDER the ~650k per-port limit', () => {
    expect(m.underLimit).toBe(true);
    expect(m.pxPerLine).toBeLessThan(LED_DATA.portLimitPx);
  });
  it('uses 8 of 10 ports, leaving 2 spare', () => {
    expect(m.portsUsed).toBe(8);
    expect(m.sparePorts).toBe(2);
  });
  it('the data constants agree with the derivation', () => {
    expect(LED_DATA.lines).toBe(m.lines);
    expect(LED_DATA.pxPerLine).toBe(m.pxPerLine);
    expect(LED_DATA.sparePorts).toBe(m.sparePorts);
  });
});

describe('LED data is DIRECT — never through a switch', () => {
  it('states the no-switch rule and per-column path', () => {
    expect(LED_DATA.rule).toMatch(/NEVER through a network switch/i);
    expect(LED_DATA.path).toMatch(/daisy-chain/i);
    expect(LED_DATA.shieldedCat6).toBe(true);
  });
});

describe('VIDEO_IN — the owned KEQINX HDMI-over-Cat6 path replaces the NDI decoder', () => {
  it('flags it replaces the NDI decoder and is owned gear', () => {
    expect(VIDEO_IN.replacesNdiDecoder).toBe(true);
    expect(VIDEO_IN.ownedGear).toMatch(/KEQINX 1x8/);
  });
  it('the path runs source -> KEQINX -> Cat6 -> receiver -> NovaStar', () => {
    const p = VIDEO_IN.path.join(' ');
    expect(p).toMatch(/KEQINX/);
    expect(p).toMatch(/receiver/i);
    expect(p).toMatch(/VX1000 HDMI input/);
    expect(VIDEO_IN.maxRunM).toBe(70);
  });
  it('the other CAT outs feed the stage/confidence/lobby screens', () => {
    expect(VIDEO_IN.otherOutputs).toMatch(/stage TV|confidence|lobby/i);
  });
});

describe('CONTROL is network (may cross a switch), unlike LED data', () => {
  it('control rides the network through the server-room switch', () => {
    expect(CONTROL.throughSwitch).toBe(true);
    expect(CONTROL.path).toMatch(/server-room network switch/i);
  });
});

describe('TEACHING_CARD — staff/volunteer plain language', () => {
  it('names the 3 jobs + power and the one-liner', () => {
    const names = TEACHING_CARD.planes.map((p) => p.name).join(' ');
    expect(names).toMatch(/VIDEO/);
    expect(names).toMatch(/CONTROL/);
    expect(names).toMatch(/LED DATA/);
    expect(names).toMatch(/POWER/);
    expect(TEACHING_CARD.oneLiner).toMatch(/Control rides the network; pixels never do/i);
  });
});

describe('FINISH_CHECKLIST — the steps that finish the project', () => {
  it('covers 8 LED lines + 1 control + 1 video-in + power + mapping + test', () => {
    const ids = FINISH_CHECKLIST.map((c) => c.id);
    expect(ids).toEqual(expect.arrayContaining(['led-lines', 'control-line', 'video-in', 'power', 'mapping', 'test-light']));
  });
  it('the LED-lines step states the per-column, no-switch wiring', () => {
    const led = FINISH_CHECKLIST.find((c) => c.id === 'led-lines');
    expect(`${led.label} ${led.detail}`).toMatch(/per column|each column|8 LED lines/i);
    expect(led.detail).toMatch(/NO switch/i);
  });
  it('the test step uses any HDMI source', () => {
    const t = FINISH_CHECKLIST.find((c) => c.id === 'test-light');
    expect(t.detail).toMatch(/any HDMI source/i);
  });
  it('every item has a stable id, group, label, and detail', () => {
    for (const c of FINISH_CHECKLIST) {
      expect(c.id).toBeTruthy();
      expect(c.group).toBeTruthy();
      expect(c.label).toBeTruthy();
      expect(c.detail).toBeTruthy();
    }
  });
});

describe('CHAIN_DIAGRAM — renderable node/edge data', () => {
  it('chains source -> keqinx -> receiver -> vx1000, then the LED edge to the wall', () => {
    const ids = CHAIN_DIAGRAM.nodes.map((n) => n.id);
    expect(ids).toEqual(['source', 'keqinx', 'receiver', 'vx1000', 'wall']);
    expect(CHAIN_DIAGRAM.ledEdge.from).toBe('vx1000');
    expect(CHAIN_DIAGRAM.ledEdge.to).toBe('wall');
    expect(CHAIN_DIAGRAM.ledEdge.label).toMatch(/no switch/i);
  });
  it('POWER + MAP carry their finish notes', () => {
    expect(POWER.note).toMatch(/STAGGER power-on/i);
    expect(MAP.note).toMatch(/NovaLCT/);
  });
});

describe('FIRST_LIGHT — proof-of-life tonight, NovaLCT map tomorrow', () => {
  it('corrects the USB-media myth (VX1000 is not a media player)', () => {
    expect(FIRST_LIGHT.usbMyth).toMatch(/NOT a media player/i);
    expect(FIRST_LIGHT.usbMyth).toMatch(/HDMI source/i);
  });
  it('the proof-of-life expects lit-but-scrambled tiles as a WIN', () => {
    const p = FIRST_LIGHT.proofOfLife.join(' ');
    expect(p).toMatch(/scrambled|repeated|partial/i);
    expect(p).toMatch(/VLC|full-screen/i);
    expect(p).toMatch(/HDMI/);
  });
  it('the NovaLCT sequence runs connect -> receiving card -> screen connection -> save -> source', () => {
    const titles = FIRST_LIGHT.novalctSteps.map((s) => s.title).join(' ').toLowerCase();
    expect(titles).toMatch(/connect/);
    expect(titles).toMatch(/receiving-card/);
    expect(titles).toMatch(/screen connection/);
    const bodies = FIRST_LIGHT.novalctSteps.map((s) => s.body).join(' ');
    expect(bodies).toMatch(/columns = 8, rows = 6/);
    expect(bodies).toMatch(/\.rcfgx/);
  });
  it('lists what the map requires (laptop + NovaLCT + the cabinet config)', () => {
    const req = FIRST_LIGHT.mappingRequires.join(' ');
    expect(req).toMatch(/NovaLCT/);
    expect(req).toMatch(/control port/i);
    expect(req).toMatch(/PRE-LOADED|\.rcfgx|Smart Settings/);
  });
});

describe('VENDOR_MESSAGE — ready-to-send LED Nation ask', () => {
  it('asks about pre-loaded receiving cards + the config file', () => {
    const body = VENDOR_MESSAGE.body.join(' ');
    expect(VENDOR_MESSAGE.to).toMatch(/LED Nation/i);
    expect(body).toMatch(/PRE-LOADED/);
    expect(body).toMatch(/\.rcfgx|screen configuration file/i);
    expect(body).toMatch(/8 columns x 6 rows/);
  });
});

describe('VX1000_SOFTWARE — the NovaStar program stack + which machine', () => {
  it('lists NovaLCT (config), V-Can (live), VICP (optional) with the download link', () => {
    const names = VX1000_SOFTWARE.programs.map((p) => p.name);
    expect(names).toEqual(['NovaLCT', 'V-Can', 'VICP']);
    expect(VX1000_SOFTWARE.programs.find((p) => p.name === 'VICP').optional).toBe(true);
  });
  it('the download link is the CORRECTED working NovaStar page (not the dead /downloads/ root)', () => {
    expect(VX1000_SOFTWARE.downloadUrl).toBe('https://www.novastar.tech/download/download.html?catid=7');
    expect(VX1000_SOFTWARE.downloadUrl).not.toMatch(/downloads\/$/); // the old dead-end root
    expect(VX1000_SOFTWARE.downloadNav).toMatch(/Software.*NovaLCT/i);
    expect(VX1000_SOFTWARE.novalctVersion).toMatch(/V5\.9\.1/);
    expect(VX1000_SOFTWARE.downloadSearchUrl).toMatch(/novastar\.tech\/downloads\/search/);
  });
  it('every download link is OFFICIAL novastar.tech only (no third-party installers)', () => {
    for (const url of [VX1000_SOFTWARE.downloadUrl, VX1000_SOFTWARE.downloadSearchUrl]) {
      expect(url, url).toMatch(/^https:\/\/www\.novastar\.tech\//);
    }
    expect(VX1000_SOFTWARE.officialOnly).toMatch(/third-party/i);
  });
  it('NovaLCT does the mapping + RCFG import; V-Can does live switching', () => {
    const lct = VX1000_SOFTWARE.programs.find((p) => p.name === 'NovaLCT');
    const vcan = VX1000_SOFTWARE.programs.find((p) => p.name === 'V-Can');
    expect(lct.does).toMatch(/mapping/i);
    expect(lct.does).toMatch(/RCFG/);
    expect(vcan.does).toMatch(/switching|presets|layers/i);
  });
  it('first-setup steps: USB Type-B, admin login, map 8x6, RCFG, then V-Can', () => {
    const s = VX1000_SOFTWARE.steps.join(' ');
    expect(s).toMatch(/USB Type-B/);
    expect(s).toMatch(/password "admin"/);
    expect(s).toMatch(/8 x 6 = 48/);
    expect(s).toMatch(/RCFG/);
    expect(s).toMatch(/V-Can/);
  });
  it('records which software installs on which control-room machine', () => {
    const plan = VX1000_SOFTWARE.machinePlan;
    expect(plan.find((m) => m.install === 'NovaLCT').machine).toMatch(/config/i);
    expect(plan.find((m) => m.install === 'V-Can').machine).toMatch(/operator/i);
    expect(VX1000_SOFTWARE.machinePlanConfirm).toMatch(/confirm/i);
  });
});

describe('TOOL_CACHE — sovereign known-good copy on the NAS', () => {
  it('points at the NAS path + SMB + official source, files flagged to-populate', () => {
    expect(TOOL_CACHE.nasPath).toMatch(/\/volume1\/PoeTech\/tool-cache\/novastar/);
    expect(TOOL_CACHE.smbPath).toMatch(/192\.168\.1\.26/);
    expect(TOOL_CACHE.officialSource).toMatch(/novastar\.tech\/download/);
    // honest: files are not claimed present until vetted + dropped
    expect(TOOL_CACHE.contents.every((c) => c.status === 'to-populate')).toBe(true);
    const files = TOOL_CACHE.contents.map((c) => c.file).join(' ');
    expect(files).toMatch(/NovaLCT V5\.9\.1/);
    expect(files).toMatch(/manual/i);
    expect(files).toMatch(/RCFG/);
  });
  it('says how to pull from a control PC (LAN or Tailscale)', () => {
    expect(TOOL_CACHE.howToPull).toMatch(/SMB|scp/);
    expect(TOOL_CACHE.howToPull).toMatch(/Tailscale|LAN/);
  });
});

describe('CONTROL_FROM_ANYWHERE — remote control + guardrails', () => {
  it('offers the sovereign NovaLCT-over-Tailscale path and the web/VICP path', () => {
    const names = CONTROL_FROM_ANYWHERE.options.map((o) => o.name).join(' ');
    expect(names).toMatch(/NovaLCT/);
    expect(names).toMatch(/web page|VICP/i);
    const sovereign = CONTROL_FROM_ANYWHERE.options.find((o) => /sovereign/i.test(o.name));
    expect(sovereign.how).toMatch(/Tailscale/);
    expect(sovereign.how).toMatch(/no cloud/i);
  });
  it('guardrails: control port LAN/tailnet only, single operator', () => {
    const g = CONTROL_FROM_ANYWHERE.guardrails.join(' ');
    expect(g).toMatch(/never exposed to the public internet/i);
    expect(g).toMatch(/ONE operator/);
  });
});
