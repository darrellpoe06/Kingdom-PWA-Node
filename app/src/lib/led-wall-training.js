// =============================================================================
// led-wall-training — ILLUSTRATED NovaLCT setup runbook + canonical specs for
// the COLG wall. Confirmed on-site 2026-07-01 with Darrell during the real
// install. This is the teaching/documentation the Projects-tab LED-wall record
// renders so the team can follow the actual PoeTech/COLG setup, not stock guides.
//
// IMAGE SLOTS ARE EMBED-READY (honest fallback): each step / gallery item carries
// a `slot` label + a `photo` filename (or null). The card renders the REAL image
// IF a NAS media base is configured (localStorage `poetech-church-media-base`),
// otherwise it shows the labeled slot + description. Serving is pending the NAS
// host (Caddy/Funnel currently down) + the serving/privacy decision — so today it
// renders as a complete, labeled illustrated guide the team can attach photos to,
// and it lights up with the real photos the moment the media base is set (no code
// change). Photos/screenshots from today's session are in the Dispatch uploads.
// =============================================================================

export const MEDIA_BASE_KEY = 'poetech-church-media-base';

// Resolve a slot's image URL from a base + filename; null => render the slot.
export function mediaUrl(photo, base) {
  if (!photo || !base) return null;
  const b = String(base).trim();
  if (!b) return null;
  return b.endsWith('/') ? b + photo : `${b}/${photo}`;
}

// --- The 9-step verified NovaLCT setup sequence (each with a screenshot slot) --
export const NOVALCT_SETUP_STEPS = [
  {
    n: 1, title: 'Download NovaLCT (Software category — the common miss)',
    action: 'novastar.tech -> Downloads -> the SOFTWARE category (NOT Processors — that is the common miss; the search box does not find it). Latest V5.9.1 (V5.8.1 also fine).',
    detail: 'Cache the installer on the NAS as the sovereign copy (/volume1/PoeTech/tool-cache/novastar/) so the next PC does not re-hunt.',
    slot: 'Screenshot: NovaStar downloads page with the Software category selected', photo: null,
  },
  {
    n: 2, title: 'Run the installer + the CP210x USB driver',
    action: 'Run the installer -> complete the NovaLCT Setup Wizard -> INSTALL the Silicon Labs CP210x USB-to-UART driver when prompted.',
    detail: 'The CP210x driver is REQUIRED for USB detection — if you skip it, NovaLCT will not see the VX1000 over USB.',
    slot: 'Screenshot: NovaLCT Setup Wizard + the CP210x driver dialog', photo: null,
  },
  {
    n: 3, title: 'Connect the VX1000 Pro over USB-B',
    action: 'Connect the VX1000 Pro to the control PC via USB-B. This is SEPARATE from the LED output ports (which stay wired to the cabinets) — both are connected at once.',
    detail: 'USB-B for config is more stable than Ethernet for first setup. The LED-out ports keep driving the wall meanwhile.',
    slot: 'Photo: VX1000 rear — the USB-B port + the LED output ports both connected', photo: null,
  },
  {
    n: 4, title: 'Open NovaLCT — confirm detection',
    action: 'Open NovaLCT. "Control System: 1" confirms the VX1000 is detected.',
    detail: 'A green "No screen, click here for configuration" means it is detected but NOT yet mapped — expected at this point.',
    slot: 'Screenshot: NovaLCT main window showing "Control System: 1"', photo: null,
  },
  {
    n: 5, title: 'Advanced user login',
    action: 'User (U) -> Advanced Synchronous System User Login -> password "admin".',
    detail: 'Advanced login unlocks Screen Configuration (the mapping/config tools).',
    slot: 'Screenshot: the Advanced Synchronous System User login dialog', photo: null,
  },
  {
    n: 6, title: 'Screen Configuration = 3 tabs',
    action: 'Screen Configuration opens 3 tabs, used in order: Sending Card -> Receiving Card -> Screen Connection.',
    detail: 'Sending Card = the input/output resolution; Receiving Card = per-cabinet config; Screen Connection = the port->cabinet map.',
    slot: 'Screenshot: Screen Configuration with the 3 tabs', photo: null,
  },
  {
    n: 7, title: 'Receiving Card — READBACK (do not blind-Send)',
    action: 'Receiving Card tab: if there is no vendor RCFG file, use READBACK to pull the factory config off a cabinet. Do NOT blind-Send or Smart-Set — that can overwrite a good factory config.',
    detail: 'Module read on this wall: 32W x 16H, 1/8 scan, 74HC138 decoding. Readback is the authoritative source when no RCFG file is in hand.',
    slot: 'Screenshot: Receiving Card tab — module params after Readback', photo: null,
  },
  {
    n: 8, title: 'Screen Connection — map the 8x6 grid',
    action: 'Screen Connection tab: map the 8 x 6 (8 columns x 6 rows) cabinet grid + the cabling path, then Send. (See the VERIFIED connection map below — one port per column, top-entry.)',
    detail: 'This is the step that stitches the cabinets into one screen. The exact verified map is documented separately as the canonical reference.',
    slot: 'Screenshot: Screen Connection tab — the 8x6 map', photo: null,
  },
  {
    n: 9, title: 'Sending Card — output resolution',
    action: 'Sending Card tab: set the source/output resolution to cover the wall — 2560 x 1440 (the native wall size).',
    detail: 'Feed 4K (3840x2160) into the VX1000; it scales to the 2560x1440 native wall.',
    slot: 'Screenshot: Sending Card tab — output resolution 2560x1440', photo: null,
  },
];

// --- Canonical panel / wall spec (confirmed on-site) --------------------------
export const PANEL_SPEC = {
  vendor: 'LED Nation / Miracle Indoor P1.99',
  panelModel: 'MRV412-N',
  receivingCard: 'NovaStar MRV412-N (512 x 512 px max per card)',
  cabinetPx: '320 x 240 px',
  cabinetMm: '640 x 480 mm',
  modules: 'six 320 x 160 mm modules per cabinet',
  pitchMm: 1.99,
  moduleParams: '32W x 16H, 1/8 scan, 74HC138 decoding',
  grid: '8 columns x 6 rows = 48 cabinets',
  nativePx: '2560 x 1440 px native (~16.8 ft x 9.45 ft)',
  receivingCardSize: 'Width 320 / Height 240',
  perPortLoad: 'Column = 320 x 1440 = 460,800 (~461k) px — within one gigabit port -> validates one-port-per-column wiring.',
  source: 'Feed 4K (3840 x 2160) into the VX1000; it scales to the 2560 x 1440 native wall. Set the Sending Card output to 2560 x 1440.',
  verify: 'Verify against Readback from a live cabinet — Readback is authoritative.',
};

// --- The VERIFIED Screen Connection map (canonical reference) ------------------
export const SCREEN_CONNECTION_MAP = {
  verifiedOn: '2026-07-01',
  grid: '8 columns x 6 rows',
  rule: 'Each COLUMN on its own Ethernet port, fed from the TOP and daisy-chained DOWN. Port 1 = leftmost column, Port 8 = rightmost. Eight independent vertical runs, NO crossing between columns — one data cable per column into its VX1000 port, top-entry.',
  mechanic: 'SELECT the Ethernet port FIRST, THEN draw that column top->bottom. Switching ports before each column is what keeps them separate (vs one continuous snake across the whole wall).',
  ports: [
    { port: 1, column: 'leftmost (col 1)', cards: 'receiving cards 1->6, top-to-bottom' },
    { port: 2, column: 'col 2', cards: '1->6 top-to-bottom' },
    { port: 3, column: 'col 3', cards: '1->6 top-to-bottom' },
    { port: 4, column: 'col 4', cards: '1->6 top-to-bottom' },
    { port: 5, column: 'col 5', cards: '1->6 top-to-bottom' },
    { port: 6, column: 'col 6', cards: '1->6 top-to-bottom' },
    { port: 7, column: 'col 7', cards: '1->6 top-to-bottom' },
    { port: 8, column: 'rightmost (col 8)', cards: '1->6 top-to-bottom' },
  ],
  receivingCardSizeNote: 'Receiving Card Size was left at the default 128 x 128 during the first map — CONFIRM it against the real cabinet pixel size (320 x 240) on connection.',
  save: 'Save to File + cache the config on the NAS (sovereign backup). Send to HW to activate once the VX1000 is on the powered wall.',
  slot: 'Screenshot: Darrell\'s verified Screen Connection map (the correct 8-port column map)', photo: null,
};

// --- The VERIFIED final config + the REAL apply procedure ---------------------
export const FINAL_CONFIG = {
  status: 'CONFIG COMPLETE (2026-07-01) — all 48 cabinets set to Receiving Card Size 320 x 240; the 8-port column map is intact (Port 1 = leftmost column -> Port 8 = rightmost, each receiving card 1->6 top-to-bottom).',
  verified: 'Every cabinet reads Width 320; per-port capacity ~70% (a column of 6 = 320 x 1440 = ~461k px, within one gigabit port).',
  realProcedure: 'There is NO "Apply to Entire Screen" button. The options are Apply to Entire Column / Entire Row / current Port, and their labels are TRUNCATED (only readable on hover). To set the size on all cabinets: type Width 320 / Height 240, then SELECT EACH COLUMN and click "Apply to Entire Column" — repeat for all 8 columns.',
  friction: 'Note explicitly so the next install does not hunt for a screen-wide button: there is none — it is per-column, x8.',
  remaining: 'Save (+ copy the config to the NAS as a sovereign backup). Then Send to HW once the VX1000 is connected to the powered wall; Readback first to confirm the size.',
  slot: 'Screenshot: Darrell\'s finished-config screen (all cabinets 320 x 240)', photo: null,
};

// --- Tomorrow's open ACTIVATION item ------------------------------------------
export const TOMORROW_ACTIVATION = {
  symptom: 'WALL SHOWS AS SEPARATE CABINETS, NOT ONE SCREEN.',
  cause: 'The 8 x 6 connection map has not been pushed to the hardware yet.',
  steps: [
    'After network connect + power: NovaLCT -> Screen Connection -> confirm the map is loaded (Load from File if empty).',
    'Confirm Quantity of Screens = 1.',
    'Send to HW (stitches all 48 cabinets into one screen).',
    'Save / solidify to hardware.',
    'Feed the source + scale the VX1000 layer to full 2560 x 1440.',
  ],
  status: 'Remaining ACTIVATION step. Config itself is verified COMPLETE (320 x 240, 8-port column map). Darrell back tomorrow evening.',
};

// --- Install gallery — subject-labeled slots for the on-site photos -----------
// ~19 on-site photos from today's install. Serving pending (NAS host down), so
// these are labeled slots the team attaches; they render the real photo once the
// media base is set. Subjects follow what was shot: wall, cabling, VX1000,
// control-room station, NovaLCT screens.
export const INSTALL_GALLERY = [
  { id: 'wall-front-lit', label: 'Wall front — lit (test pattern / content)', photo: null },
  { id: 'wall-back-cabling', label: 'Wall back — full power + LED-data cabling', photo: null },
  { id: 'led-lines-columns', label: 'LED data lines — one per column, top-entry', photo: null },
  { id: 'vx1000-front', label: 'NovaStar VX1000 Pro — front panel', photo: null },
  { id: 'vx1000-rear', label: 'VX1000 rear — USB-B + LED output ports', photo: null },
  { id: 'control-room-station', label: 'Control-room station — the config PC', photo: null },
  { id: 'novalct-detected', label: 'NovaLCT — Control System 1 (detected)', photo: null },
  { id: 'novalct-login', label: 'NovaLCT — Advanced user login', photo: null },
  { id: 'novalct-receiving', label: 'NovaLCT — Receiving Card tab (Readback)', photo: null },
  { id: 'novalct-connection', label: 'NovaLCT — Screen Connection 8x6 map', photo: null },
  { id: 'cp210x-driver', label: 'CP210x USB-to-UART driver dialog', photo: null },
  { id: 'sanctuary-wide', label: 'Sanctuary — wall in context', photo: null },
];
