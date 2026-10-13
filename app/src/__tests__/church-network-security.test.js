// @vitest-environment node
//
// church-network-security + church-scan-ingest + oui-vendors.
// Verification Doctrine (DR-0076): proven-to-catch. The gates here guard the two
// ways this assessment could lie - by OVER-claiming (calling exposure a breach, or
// an OUI a confirmed model) and by UNDER-claiming (staying quiet about the flat
// segment carrying member and financial records). DR-0100: both are failures.
import { describe, it, expect } from 'vitest';
import {
  assessNetworkSecurity, topRemediation, severityRank, severityTone, SEVERITY_IDS,
} from '../lib/church-network-security.js';
import {
  reconcileScan, validateScan, portMeaning, PORT_MEANINGS, bannerRisks,
} from '../lib/church-scan-ingest.js';
import { describeMac, lookupVendor, normalizeMac, isRandomizedMac } from '../lib/oui-vendors.js';
import { SEED_DEVICES, makeDevice } from '../lib/church-devices.js';

describe('the assessment never over-claims', () => {
  const a = assessNetworkSecurity(SEED_DEVICES);
  it('states plainly that it is NOT intrusion evidence', () => {
    expect(a.scope.isIntrusionEvidence).toBe(false);
    expect(a.scope.statement).toMatch(/does not read traffic|No intrusion is recorded/i);
  });
  it('marks the credential finding as needing an on-LAN check rather than asserting it', () => {
    const creds = a.findings.find((f) => f.class === 'vendor-default-credentials');
    expect(creds.established).toBe(false);
    expect(creds.verify).toBeTruthy();
    expect(a.summary.needsOnLanCheck).toBeGreaterThan(0);
  });
  it('every finding carries evidence, a fix, and the decision it is measured against', () => {
    for (const f of a.findings) {
      expect(f.evidence).toBeTruthy();
      expect(f.fix).toBeTruthy();
      expect(f.governs).toBeTruthy();
      expect(SEVERITY_IDS).toContain(f.severity);
    }
  });
});

describe('the assessment never under-claims', () => {
  it('PROVEN-TO-CATCH: flat segment carrying member/financial storage beside IoT is CRITICAL', () => {
    const a = assessNetworkSecurity(SEED_DEVICES);
    const flat = a.findings.filter((f) => f.class === 'flat-segment-data-and-iot');
    expect(flat.length).toBeGreaterThan(0);
    for (const f of flat) expect(f.severity).toBe('critical');
  });
  it('PROVEN-TO-CATCH: a host bridging both segments is reported as a segmentation bypass', () => {
    const a = assessNetworkSecurity(SEED_DEVICES);
    const bridge = a.findings.find((f) => f.class === 'segmentation-bypass');
    expect(bridge).toBeTruthy();
    expect(bridge.severity).toBe('high');
    expect(bridge.title).toMatch(/livestream-main-pc/);
  });
  it('goes quiet only when the exposure is genuinely absent', () => {
    // A register with storage and NO IoT must NOT raise the flat-segment finding.
    const clean = [
      makeDevice({ id: 'nas', name: 'NAS', deviceType: 'nas', ipAddress: '192.168.5.10' }),
      makeDevice({ id: 'gw', name: 'GW', deviceType: 'network', ipAddress: '192.168.5.1', confirmed: true }),
    ];
    const a = assessNetworkSecurity(clean);
    expect(a.findings.some((f) => f.class === 'flat-segment-data-and-iot')).toBe(false);
    expect(a.findings.some((f) => f.class === 'segmentation-bypass')).toBe(false);
  });
  it('PROVEN-TO-CATCH: finding ids are unique (a duplicate React key drops a render)', () => {
    // A group row holding addresses on both segments appeared once PER SEGMENT and
    // emitted two findings with the same id. React warned and the infra-plan render
    // test caught it; this gate keeps it caught.
    const a = assessNetworkSecurity(SEED_DEVICES);
    const ids = a.findings.map((f) => f.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
  it('PROVEN-TO-CATCH: unidentified gear on BOTH segments is CRITICAL, not high', () => {
    // Gear nobody can name that already spans the firewall boundary is strictly
    // worse than the same gear sitting on one segment.
    const a = assessNetworkSecurity(SEED_DEVICES);
    const spanning = a.findings.find(
      (f) => f.class === 'unidentified-infrastructure' && /BOTH segments/.test(f.title),
    );
    expect(spanning).toBeTruthy();
    expect(spanning.severity).toBe('critical');
    expect(spanning.evidence).toMatch(/192\.168\.0\..*and.*192\.168\.1\.|192\.168\.1\..*and.*192\.168\.0\./);
  });
  it('ranks critical above high above moderate above watch', () => {
    const a = assessNetworkSecurity(SEED_DEVICES);
    const ranks = a.findings.map((f) => severityRank(f.severity));
    for (let i = 1; i < ranks.length; i += 1) expect(ranks[i]).toBeGreaterThanOrEqual(ranks[i - 1]);
    expect(severityTone('critical')).toBe('problem');
  });
  it('the remediation order puts segmentation before the bridge it depends on', () => {
    const a = assessNetworkSecurity(SEED_DEVICES);
    const steps = topRemediation(a).map((s) => s.step);
    expect(steps[0]).toMatch(/Segment the network/);
    expect(steps.some((s) => /bridge/i.test(s))).toBe(true);
  });
});

describe('OUI lookup names the maker, never the model', () => {
  it('normalizes and identifies the vendors the July scan could not name', () => {
    expect(normalizeMac('44:94:fc:11:22:33')).toBe('44-94-FC-11-22-33');
    expect(lookupVendor('44-94-FC-11-22-33')).toBe('Netgear');
    expect(lookupVendor('78-8A-20-01-02-03')).toBe('Ubiquiti');
    expect(lookupVendor('00-11-32-01-02-03')).toBe('Synology');
  });
  it('PROVEN-TO-CATCH: an unknown prefix returns null, never a guess', () => {
    expect(lookupVendor('12-34-56-78-9A-BC')).toBeNull();
    expect(describeMac('02-00-00-00-00-01').vendor).toBeNull();
  });
  it('PROVEN-TO-CATCH: a randomized MAC yields no vendor at all', () => {
    // Locally-administered bit set => the OUI is meaningless. Reading a vendor off
    // it would be fabrication.
    expect(isRandomizedMac('DA-A1-19-00-00-01')).toBe(true);
    const d = describeMac('DA-A1-19-00-00-01');
    expect(d.vendor).toBeNull();
    expect(d.confidence).toBe('randomized-mac-no-vendor');
  });
  it('an OUI hit is oui-derived, which is weaker than scan-confirmed', () => {
    expect(describeMac('44-94-FC-11-22-33').confidence).toBe('oui-derived');
  });
});

describe('scan ingest', () => {
  const scan = {
    scan: { scannedAt: '2026-09-18T12:49:00Z' },
    liveHosts: ['192.168.0.1', '192.168.0.10', '192.168.1.123'],
    arp: [
      { ip: '192.168.0.10', mac: '44-94-FC-01-02-03' },
      { ip: '192.168.1.123', mac: '00-11-32-AA-BB-CC' },
    ],
    services: [
      { ip: '192.168.0.1', openPorts: [53, 80] },
      { ip: '192.168.0.10', openPorts: [22, 23, 80] },
    ],
    banners: [],
    routes: [],
  };

  it('PROVEN-TO-CATCH: an EMPTY scan is a FAILED scan, never "the network is gone"', () => {
    // Folding an empty scan in would silently retire every real device.
    const bad = validateScan({ scan: { scannedAt: 'x' }, liveHosts: [], arp: [] });
    expect(bad.ok).toBe(false);
    expect(bad.errors.join(' ')).toMatch(/EMPTY/);
    expect(reconcileScan({ scan: { scannedAt: 'x' }, liveHosts: [], arp: [] }, SEED_DEVICES).ok).toBe(false);
  });
  it('rejects a reading with no timestamp (no provenance)', () => {
    expect(validateScan({ liveHosts: ['1.1.1.1'], arp: [] }).ok).toBe(false);
  });
  it('finds hosts that are live but absent from the register', () => {
    // Deliberately a synthetic address on a segment the register does not use.
    // This test once pinned 192.168.0.10 — a REAL host from the 2026-09-18 scan —
    // and started failing the moment that host was written into the register,
    // which is the register working, not a bug. A gate for "detects unregistered
    // hosts" must not depend on a specific device staying unregistered forever.
    const withStranger = {
      ...scan,
      liveHosts: [...scan.liveHosts, '192.168.9.99'],
      arp: [...scan.arp, { ip: '192.168.9.99', mac: '44-94-FC-01-02-03' }],
      services: [...scan.services, { ip: '192.168.9.99', openPorts: [23, 80] }],
    };
    const r = reconcileScan(withStranger, SEED_DEVICES);
    expect(r.ok).toBe(true);
    const unregisteredIps = r.unregistered.map((h) => h.ip);
    expect(unregisteredIps).toContain('192.168.9.99');
    expect(r.unregistered.find((h) => h.ip === '192.168.9.99').vendor).toBe('Netgear');
  });
  it('PROVEN-TO-CATCH: a host that IS on the register is never called unregistered', () => {
    // The other half of the same gate. Registering the 23 scan hosts must actually
    // remove them from the unregistered list, or the register grew for nothing.
    const r = reconcileScan(scan, SEED_DEVICES);
    const unregisteredIps = r.unregistered.map((h) => h.ip);
    expect(unregisteredIps).not.toContain('192.168.0.1');   // the pfSense
    expect(unregisteredIps).not.toContain('192.168.0.100'); // the RackStation
    expect(unregisteredIps).not.toContain('192.168.1.123'); // a PTZ camera
  });
  it('treats a silent register row as a QUESTION, never an automatic retirement', () => {
    const r = reconcileScan(scan, SEED_DEVICES);
    expect(r.silent.length).toBeGreaterThan(0);
    for (const s of r.silent) expect(s.question).toMatch(/confirm before changing/i);
  });
  it('PROVEN-TO-CATCH: telnet is CRITICAL and plaintext NAS admin is HIGH', () => {
    expect(portMeaning(23).severity).toBe('critical');
    expect(portMeaning(5000).severity).toBe('high');
    expect(portMeaning(11434).severity).toBe('high'); // Ollama ships unauthenticated
    expect(portMeaning(554).severity).toBe('high');   // RTSP video, often open
    const r = reconcileScan(scan, SEED_DEVICES);
    const telnet = r.exposures.find((e) => e.port === 23);
    expect(telnet).toBeTruthy();
    expect(telnet.severity).toBe('critical');
    expect(r.exposures[0].severity).toBe('critical'); // sorted worst-first
  });
  it('every known port meaning explains WHY, not just a service name', () => {
    for (const [, v] of Object.entries(PORT_MEANINGS)) {
      expect(v.note.length).toBeGreaterThan(30);
      expect(v.service).toBeTruthy();
    }
  });
  it('PROVEN-TO-CATCH: an end-of-life server banner is CRITICAL', () => {
    // Found on the real 2026-09-18 scan at 192.168.1.120. Boa development stopped
    // in 2005; it carries published unpatched vulnerabilities and ships inside
    // cheap camera/DVR firmware. A port list alone would have called this a
    // moderate "unencrypted web" and missed it entirely.
    const risks = bannerRisks([{ ip: '192.168.1.120', port: 80, server: 'Boa/0.94.13', title: '' }]);
    expect(risks).toHaveLength(1);
    expect(risks[0].severity).toBe('critical');
    expect(risks[0].title).toMatch(/end of life/i);
  });
  it('a modern banner raises nothing', () => {
    expect(bannerRisks([{ ip: '1.1.1.1', port: 80, server: 'nginx/1.27.0', title: 'Home' }])).toEqual([]);
    expect(bannerRisks([])).toEqual([]);
    expect(bannerRisks(null)).toEqual([]);
  });
  it('an untrusted TLS certificate is reported without being called a breach', () => {
    const risks = bannerRisks([{ ip: '192.168.0.125', port: 443, server: '', title: 'Could not establish trust relationship for the SSL/TLS secure channel.' }]);
    expect(risks).toHaveLength(1);
    expect(risks[0].severity).toBe('moderate');
  });
  it('banner risks reach the exposure list, ranked with the rest', () => {
    const withBanner = {
      scan: { scannedAt: '2026-09-18T13:05:00Z' },
      liveHosts: ['192.168.1.120'],
      arp: [{ ip: '192.168.1.120', mac: '00-84-E4-26-37-34' }],
      services: [{ ip: '192.168.1.120', openPorts: [80] }],
      banners: [{ ip: '192.168.1.120', port: 80, server: 'Boa/0.94.13', title: '' }],
      routes: [],
    };
    const r = reconcileScan(withBanner, SEED_DEVICES);
    expect(r.exposures[0].severity).toBe('critical');
    expect(r.exposures[0].fromBanner).toBe(true);
    expect(r.summary.criticalExposures).toBe(1);
  });
  it('reports register coverage of the live network', () => {
    const r = reconcileScan(scan, SEED_DEVICES);
    expect(r.summary.liveHosts).toBe(3);
    expect(r.summary.coverage).toBeGreaterThan(0);
    expect(r.summary.coverage).toBeLessThanOrEqual(100);
  });
  it('an OUI identification still demands eyes-on for model and role', () => {
    const r = reconcileScan(scan, SEED_DEVICES);
    for (const id of r.identifications) {
      expect(id.stillNeedsEyesOn).toBe(true);
      expect(id.provenance).toBe('oui-derived');
    }
  });
});
