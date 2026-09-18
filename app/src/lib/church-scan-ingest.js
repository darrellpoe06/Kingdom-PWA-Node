// =============================================================================
// church-scan-ingest - fold a real LAN scan into the register and the assessment
// =============================================================================
// Reads the JSON that scripts/colg-network-scan.ps1 writes from a machine ON the
// church LAN, and reconciles it against the device register. Pure: no I/O, no
// React, no Supabase. The caller supplies the parsed scan.
//
// The reconciliation answers the four questions a scan exists to answer:
//   1. WHO IS HERE THAT WE NEVER RECORDED?  (unregistered hosts)
//   2. WHAT IS THE GEAR WE COULD NOT NAME?  (OUI identification of UNSURE rows)
//   3. WHAT DID WE RECORD THAT IS NOT HERE? (stale rows)
//   4. WHAT IS EACH HOST ACTUALLY SERVING?  (exposure from real open ports)
//
// PROVENANCE DISCIPLINE (DR-0076). A scan reading is 'scan-confirmed <date>'. An
// OUI vendor is 'oui-derived' - the MAKER, never the model or the role. Neither
// promotes a register row to `confirmed`; that still takes eyes-on. This module
// PROPOSES register corrections and never silently applies them.
// =============================================================================

import { describeMac } from './oui-vendors.js';
import { subnetCidr, parseIpv4 } from './church-network-topology.js';
import { extractEndpoints } from './church-network-topology.js';

// --- Port vocabulary ----------------------------------------------------------
// What an open port MEANS on a church LAN, and how much it matters. Severities are
// about EXPOSURE, and every one names why - no bare port list.
export const PORT_MEANINGS = {
  22:    { service: 'SSH',              severity: 'watch',    note: 'Remote shell. Fine on a managed host; on a camera or an appliance it is an unexpected door that usually still holds vendor defaults.' },
  23:    { service: 'Telnet',           severity: 'critical', note: 'Plaintext remote administration. Credentials cross the wire in the clear - anyone on this segment can read them. There is no safe use of telnet on this network.' },
  53:    { service: 'DNS',              severity: 'watch',    note: 'Name resolution. Expected on the gateway; anywhere else it may be an unauthorized resolver.' },
  80:    { service: 'HTTP',             severity: 'moderate', note: 'Unencrypted web. On an admin interface this means the administrator password crosses the segment in the clear on every login.' },
  81:    { service: 'HTTP (alt)',       severity: 'moderate', note: 'Secondary web service - common on cameras and DVRs.' },
  443:   { service: 'HTTPS',            severity: 'watch',    note: 'Encrypted web. Expected on managed gear.' },
  554:   { service: 'RTSP',             severity: 'high',     note: 'Live video stream. RTSP is frequently left unauthenticated - an open stream is the sanctuary and its people, viewable by anyone on the segment.' },
  1723:  { service: 'PPTP VPN',         severity: 'critical', note: 'A VPN protocol with broken cryptography, deprecated for a decade. If this is a live remote-access path it is an open door wearing a lock.' },
  3389:  { service: 'RDP',              severity: 'high',     note: 'Remote Desktop. The single most brute-forced service on Windows networks.' },
  5000:  { service: 'Synology DSM (HTTP)', severity: 'high', note: 'NAS administration over PLAINTEXT. This is the box holding member records and financial reports; its admin password should never cross the wire unencrypted.' },
  5001:  { service: 'Synology DSM (HTTPS)', severity: 'watch', note: 'NAS administration, encrypted. The correct port for DSM.' },
  8000:  { service: 'HTTP (alt)',       severity: 'moderate', note: 'Common camera / DVR / appliance web port.' },
  8080:  { service: 'HTTP proxy / alt', severity: 'moderate', note: 'Secondary web admin, often an appliance interface that was never hardened.' },
  8443:  { service: 'HTTPS (alt)',      severity: 'watch',    note: 'Encrypted alternate admin port.' },
  9000:  { service: 'HTTP (alt)',       severity: 'moderate', note: 'Frequently Portainer or a management console.' },
  11434: { service: 'Ollama API',       severity: 'high',     note: 'Local LLM API. Ollama ships with NO authentication - anyone who can reach this port can run inference, load models, and read what is loaded. It must never be reachable beyond the host that needs it.' },
  32400: { service: 'Plex',             severity: 'watch',    note: 'Media server. Worth knowing it is here: a consumer service with an internet-facing account model, running on church hardware.' },
};

export function portMeaning(port) {
  return PORT_MEANINGS[port] || { service: `TCP ${port}`, severity: 'watch', note: 'Unrecognized service - identify what is listening.' };
}

// --- Scan validation ----------------------------------------------------------
// A malformed or empty scan must fail loudly, never be folded in as "nothing found"
// (which would silently retire every real device on the register).
export function validateScan(scan) {
  const errors = [];
  if (!scan || typeof scan !== 'object') return { ok: false, errors: ['scan is not an object'] };
  if (!scan.scan || !scan.scan.scannedAt) errors.push('scan.scannedAt is missing - a reading with no timestamp has no provenance');
  if (!Array.isArray(scan.liveHosts)) errors.push('liveHosts must be an array');
  if (!Array.isArray(scan.arp)) errors.push('arp must be an array');
  if (Array.isArray(scan.liveHosts) && scan.liveHosts.length === 0) {
    errors.push('liveHosts is EMPTY - treat as a failed scan, never as "the network is gone"');
  }
  return { ok: errors.length === 0, errors };
}

// --- Reconciliation -----------------------------------------------------------

function registerIndex(devices) {
  const byIp = new Map();
  for (const d of (devices || []).filter((x) => x && x.active !== false)) {
    for (const e of extractEndpoints(d)) {
      if (!byIp.has(e.ip)) byIp.set(e.ip, []);
      byIp.get(e.ip).push(d);
    }
  }
  return byIp;
}

export function reconcileScan(scan, devices) {
  const check = validateScan(scan);
  if (!check.ok) return { ok: false, errors: check.errors };

  const scannedAt = scan.scan.scannedAt;
  const stamp = String(scannedAt).slice(0, 10);
  const byIp = registerIndex(devices);

  const arpByIp = new Map();
  for (const a of scan.arp || []) {
    if (a && a.ip) arpByIp.set(a.ip, a);
  }
  const servicesByIp = new Map();
  for (const s of scan.services || []) {
    if (s && s.ip) servicesByIp.set(s.ip, s.openPorts || []);
  }
  const bannersByIp = new Map();
  for (const b of scan.banners || []) {
    if (!b || !b.ip) continue;
    if (!bannersByIp.has(b.ip)) bannersByIp.set(b.ip, []);
    bannersByIp.get(b.ip).push(b);
  }

  const hosts = [];
  for (const ip of scan.liveHosts || []) {
    if (!parseIpv4(ip).ok) continue;
    const arp = arpByIp.get(ip) || null;
    const mac = arp ? describeMac(arp.mac) : { mac: null, vendor: null, randomized: false, confidence: 'no-arp-entry' };
    const ports = servicesByIp.get(ip) || [];
    const registered = byIp.get(ip) || [];
    hosts.push({
      ip,
      subnet: subnetCidr(ip),
      mac: mac.mac,
      vendor: mac.vendor,
      macConfidence: mac.confidence,
      openPorts: ports,
      services: ports.map((p) => ({ port: p, ...portMeaning(p) })),
      banners: bannersByIp.get(ip) || [],
      registered: registered.length > 0,
      registeredAs: registered.map((d) => ({ id: d.id, name: d.name, confirmed: d.confirmed === true })),
      provenance: `scan-confirmed ${stamp}`,
    });
  }
  hosts.sort((a, b) => {
    if (a.subnet !== b.subnet) return String(a.subnet).localeCompare(String(b.subnet));
    return (parseIpv4(a.ip).octets[3] || 0) - (parseIpv4(b.ip).octets[3] || 0);
  });

  // 1. Live but never recorded. The headline of any rescan.
  const unregistered = hosts.filter((h) => !h.registered);

  // 2. Recorded but silent. NOT "retired" - a host can be powered off, asleep, or
  //    simply refusing ICMP. It is a question, never an automatic retirement.
  const liveSet = new Set(scan.liveHosts || []);
  const silent = [];
  for (const d of (devices || []).filter((x) => x && x.active !== false)) {
    const eps = extractEndpoints(d).filter((e) => e.plane === 'lan');
    if (eps.length === 0) continue;
    if (!eps.some((e) => liveSet.has(e.ip))) {
      silent.push({
        id: d.id,
        name: d.name,
        addresses: eps.map((e) => e.ip),
        question: 'Recorded on the register but did not answer this scan. Powered off, asleep, refusing ICMP, or moved - confirm before changing its row.',
      });
    }
  }

  // 3. Identifications the OUI can now offer for rows we could not name.
  const identifications = [];
  for (const h of hosts) {
    if (!h.vendor) continue;
    for (const r of h.registeredAs) {
      identifications.push({
        deviceId: r.id,
        deviceName: r.name,
        ip: h.ip,
        vendor: h.vendor,
        mac: h.mac,
        proposal: `Record make as "${h.vendor}" (oui-derived) and MAC ${h.mac}.`,
        // The bright line: the maker is now known; the MODEL and the ROLE are not.
        stillNeedsEyesOn: true,
        provenance: 'oui-derived',
      });
    }
  }

  // 4. Exposure from what is actually listening, right now.
  const exposures = [];
  for (const h of hosts) {
    for (const s of h.services) {
      if (s.severity === 'watch') continue;
      exposures.push({
        ip: h.ip,
        subnet: h.subnet,
        vendor: h.vendor,
        port: s.port,
        service: s.service,
        severity: s.severity,
        note: s.note,
        knownAs: h.registeredAs.map((r) => r.name).join(' / ') || 'UNREGISTERED HOST',
      });
    }
  }
  const rank = { critical: 0, high: 1, moderate: 2, watch: 3 };
  exposures.sort((a, b) => rank[a.severity] - rank[b.severity]);

  return {
    ok: true,
    scannedAt,
    hosts,
    unregistered,
    silent,
    identifications,
    exposures,
    summary: {
      liveHosts: hosts.length,
      registeredHosts: hosts.filter((h) => h.registered).length,
      unregisteredHosts: unregistered.length,
      silentRows: silent.length,
      identifiable: identifications.length,
      criticalExposures: exposures.filter((e) => e.severity === 'critical').length,
      highExposures: exposures.filter((e) => e.severity === 'high').length,
      // The number that matters most on a rescan: how much of this network was
      // invisible to the register before this scan ran.
      coverage: hosts.length > 0
        ? Math.round((hosts.filter((h) => h.registered).length / hosts.length) * 100)
        : 0,
    },
  };
}
