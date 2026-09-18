// =============================================================================
// oui-vendors — MAC vendor prefixes for the gear on the Love Corner estate
// =============================================================================
// A MAC address's first three octets are the IEEE OUI: the manufacturer. This is
// what finally identifies the devices the 2026-07-08 scan had to leave UNSURE -
// the Netgear units, the possible UniFi APs, the cameras, the printers.
//
// DELIBERATELY SMALL AND CURATED. A full IEEE registry is ~35k entries and a heavy
// dependency for a question this narrow; this table carries only prefixes relevant
// to a church AV/IT estate, and every entry is one asserted with confidence.
//
// THE HONEST RULE (DR-0076): an OUI identifies the MANUFACTURER, never the MODEL,
// and never the device's ROLE. A Ubiquiti OUI says "this is Ubiquiti gear" - it
// does NOT say "this is an access point." So a lookup here yields provenance
// 'oui-derived', which is strictly weaker than 'scan-confirmed', and an unknown
// prefix returns null rather than a guess. Nothing in this file may promote a
// device row to `confirmed`.
// =============================================================================

// prefix (AA-BB-CC, upper case) -> vendor
export const OUI_TABLE = {
  // --- Netgear ---
  '00-09-5B': 'Netgear', '00-0F-B5': 'Netgear', '00-14-6C': 'Netgear',
  '00-1B-2F': 'Netgear', '00-1E-2A': 'Netgear', '00-1F-33': 'Netgear',
  '00-22-3F': 'Netgear', '00-24-B2': 'Netgear', '00-26-F2': 'Netgear',
  '04-A1-51': 'Netgear', '08-02-8E': 'Netgear', '08-BD-43': 'Netgear',
  '20-4E-7F': 'Netgear', '28-C6-8E': 'Netgear', '2C-30-33': 'Netgear',
  '30-46-9A': 'Netgear', '44-94-FC': 'Netgear', '6C-B0-CE': 'Netgear',
  '84-1B-5E': 'Netgear', '9C-3D-CF': 'Netgear', 'A0-04-60': 'Netgear',
  'A0-40-A0': 'Netgear', 'B0-7F-B9': 'Netgear', 'B0-B9-8A': 'Netgear',
  'C0-3F-0E': 'Netgear', 'C4-04-15': 'Netgear', 'CC-40-D0': 'Netgear',
  'DC-EF-09': 'Netgear', 'E0-46-9A': 'Netgear', 'E0-91-F5': 'Netgear',
  'E4-F4-C6': 'Netgear', 'F8-73-94': 'Netgear',

  // --- Ubiquiti (UniFi) ---
  '00-15-6D': 'Ubiquiti', '00-27-22': 'Ubiquiti', '04-18-D6': 'Ubiquiti',
  '18-E8-29': 'Ubiquiti', '24-A4-3C': 'Ubiquiti', '44-D9-E7': 'Ubiquiti',
  '68-72-51': 'Ubiquiti', '74-83-C2': 'Ubiquiti', '74-AC-B9': 'Ubiquiti',
  '78-8A-20': 'Ubiquiti', '80-2A-A8': 'Ubiquiti', '9C-05-D6': 'Ubiquiti',
  'AC-8B-A9': 'Ubiquiti', 'B4-FB-E4': 'Ubiquiti', 'DC-9F-DB': 'Ubiquiti',
  'E0-63-DA': 'Ubiquiti', 'F0-9F-C2': 'Ubiquiti', 'FC-EC-DA': 'Ubiquiti',

  // --- Synology ---
  '00-11-32': 'Synology', '90-09-D0': 'Synology',

  // --- Yamaha (audio consoles) ---
  '00-A0-DE': 'Yamaha',

  // --- Blackmagic Design (ATEM) ---
  '7C-2E-0D': 'Blackmagic Design',

  // --- Amazon (Echo / Alexa / Fire) ---
  '00-FC-8B': 'Amazon', '34-D2-70': 'Amazon', '38-F7-3D': 'Amazon',
  '40-B4-CD': 'Amazon', '44-65-0D': 'Amazon', '50-DC-E7': 'Amazon',
  '50-F5-DA': 'Amazon', '68-37-E9': 'Amazon', '6C-56-97': 'Amazon',
  '74-C2-46': 'Amazon', '74-D6-37': 'Amazon', '84-D6-D0': 'Amazon',
  '8C-85-80': 'Amazon', 'A0-02-DC': 'Amazon', 'AC-63-BE': 'Amazon',
  'B4-7C-9C': 'Amazon', 'CC-F7-35': 'Amazon', 'F0-27-2D': 'Amazon',
  'FC-65-DE': 'Amazon',

  // --- Sonos ---
  '00-0E-58': 'Sonos', '34-7E-5C': 'Sonos', '48-A6-B8': 'Sonos',
  '5C-AA-FD': 'Sonos', '78-28-CA': 'Sonos', '94-9F-3E': 'Sonos',
  'B8-E9-37': 'Sonos', 'C4-38-75': 'Sonos',

  // --- Google / Nest / Chromecast ---
  '00-1A-11': 'Google', '3C-5A-B4': 'Google', '48-D6-D5': 'Google',
  '54-60-09': 'Google', '6C-AD-F8': 'Google', 'DA-A1-19': 'Google',
  'F4-F5-D8': 'Google',

  // --- Roku ---
  '00-0D-4B': 'Roku', 'AC-3A-7A': 'Roku', 'B0-A7-37': 'Roku',
  'CC-6D-A0': 'Roku', 'D8-31-34': 'Roku',

  // --- Wyze (the supplementary cams in DR-0050) ---
  '2C-AA-8E': 'Wyze', '7C-78-B2': 'Wyze', 'A4-DA-22': 'Wyze', 'D0-3F-27': 'Wyze',

  // --- IP camera vendors ---
  '44-19-B6': 'Hikvision', '4C-BD-8F': 'Hikvision', '54-C4-15': 'Hikvision',
  '58-03-FB': 'Hikvision', 'BC-AD-28': 'Hikvision', 'C0-56-E3': 'Hikvision',
  'E0-CA-3C': 'Hikvision',
  '14-A7-8B': 'Dahua', '3C-EF-8C': 'Dahua', '4C-11-BF': 'Dahua',
  '9C-14-63': 'Dahua', 'E0-50-8B': 'Dahua',
  '00-40-8C': 'Axis', 'AC-CC-8E': 'Axis', 'B8-A4-4F': 'Axis',

  // --- Printers / MFP ---
  '00-17-A4': 'Hewlett-Packard', '00-1B-78': 'Hewlett-Packard',
  '00-21-5A': 'Hewlett-Packard', '00-30-C1': 'Hewlett-Packard',
  '2C-41-38': 'Hewlett-Packard', '3C-D9-2B': 'Hewlett-Packard',
  '70-5A-0F': 'Hewlett-Packard', '9C-8E-99': 'Hewlett-Packard',
  'B4-B5-2F': 'Hewlett-Packard',
  '00-00-85': 'Canon', '00-1E-8F': 'Canon', '2C-9E-FC': 'Canon', '88-87-17': 'Canon',
  '00-1B-A9': 'Brother', '00-1E-6B': 'Brother', '00-80-77': 'Brother',
  '30-05-5C': 'Brother', '3C-2A-F4': 'Brother',

  // --- Network / compute silicon ---
  '00-E0-4C': 'Realtek', '52-54-00': 'QEMU / virtual',
  '00-1B-21': 'Intel', '3C-97-0E': 'Intel', '8C-16-45': 'Intel',
  '94-65-9C': 'Intel', 'A0-A8-CD': 'Intel',
  'B8-27-EB': 'Raspberry Pi', 'DC-A6-32': 'Raspberry Pi',
  'E4-5F-01': 'Raspberry Pi', '28-CD-C1': 'Raspberry Pi',
  '14-CC-20': 'TP-Link', '50-C7-BF': 'TP-Link', '60-E3-27': 'TP-Link',
  'A0-F3-C1': 'TP-Link', 'EC-08-6B': 'TP-Link',

  // --- DERIVED FROM THIS ESTATE'S OWN CONFIRMED DEVICES ---------------------
  // These two were not read from a registry - they were established from the COLG
  // network itself on the 2026-09-18 scan, which is STRONGER evidence than a table
  // lookup for this estate specifically:
  //   DC-ED-84 is carried by all three scan-confirmed PTZOptics stage cameras
  //            (192.168.1.123 / .126 / .127), each serving 80 + 554 + 22.
  //   10-DA-43 is carried by both endpoints the register already records as the
  //            Netgear pair (192.168.0.136 / .137), whose vendor was read as
  //            Netgear on the 2026-07-08 scan.
  // Both still name the MAKER only - model and role remain needs-eyes-on.
  'DC-ED-84': 'PTZOptics',
  '10-DA-43': 'Netgear',

  // --- Apple (the iMac and any AirPlay endpoint) ---
  '00-03-93': 'Apple', '00-0A-27': 'Apple', '00-16-CB': 'Apple',
  '3C-07-54': 'Apple', '68-A8-6D': 'Apple', 'AC-BC-32': 'Apple',
  'F0-18-98': 'Apple', '7C-D1-C3': 'Apple', 'D0-81-7A': 'Apple',
  '9C-F3-87': 'Apple', 'A4-83-E7': 'Apple', 'F4-5C-89': 'Apple',
};

export function normalizeMac(mac) {
  if (typeof mac !== 'string') return null;
  const hex = mac.replace(/[^0-9a-fA-F]/g, '').toUpperCase();
  if (hex.length !== 12) return null;
  return hex.match(/.{2}/g).join('-');
}

export function ouiPrefix(mac) {
  const n = normalizeMac(mac);
  return n ? n.slice(0, 8) : null;
}

// lookupVendor — the manufacturer, or null. NEVER a model, NEVER a role.
export function lookupVendor(mac) {
  const prefix = ouiPrefix(mac);
  if (!prefix) return null;
  return OUI_TABLE[prefix] || null;
}

// A locally-administered MAC (the 2nd-least-significant bit of octet 1) is a
// RANDOMIZED address - modern phones and some IoT rotate it. Its OUI is
// meaningless, and reading a vendor from it would be a fabrication.
export function isRandomizedMac(mac) {
  const n = normalizeMac(mac);
  if (!n) return false;
  const first = parseInt(n.slice(0, 2), 16);
  return (first & 0x02) === 0x02;
}

export function describeMac(mac) {
  const normalized = normalizeMac(mac);
  if (!normalized) return { mac: null, vendor: null, randomized: false, confidence: 'invalid' };
  if (isRandomizedMac(mac)) {
    return { mac: normalized, vendor: null, randomized: true, confidence: 'randomized-mac-no-vendor' };
  }
  const vendor = lookupVendor(mac);
  return {
    mac: normalized,
    vendor,
    randomized: false,
    // 'oui-derived' is strictly weaker than 'scan-confirmed': it names the maker,
    // not the machine. Eyes-on is still what confirms a model or a role.
    confidence: vendor ? 'oui-derived' : 'unknown-oui',
  };
}
