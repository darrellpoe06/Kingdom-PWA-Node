// data-liberation.js — GET YOUR DATA BACK. The guided, vendor-by-vendor path a
// user follows to pull their own photos, mail and files out of a cloud vendor
// and onto hardware they own.
//
// Darrell, 2026-08-11: "I would like PoeTech App to have this ability for our
// users... easy to do process to help our users through the process of getting
// their data from Google Amazon photo... etc... all of the vendors possible."
//
// WHY THIS IS A PRODUCT AND NOT A HELP ARTICLE (DATA-AS-EMPOWERMENT): the
// vendors all offer an export. What none of them offer is the part that keeps
// you safe — proof that what landed is WHOLE before you delete the originals.
// Every vendor's flow ends at "here is a zip." The user is left to decide, with
// no evidence, whether it is safe to free the space they are paying for. That
// gap is where families lose twenty years of photographs.
//
// THE RULE THIS MODULE EXISTS TO ENFORCE (DR-0238 §3 / DR-0076):
//   Nothing is deleted from a vendor until the copy on owned hardware has been
//   verified whole. `canDelete()` is the only function that says yes, and it
//   says no by default.
//
// GROUNDED IN A REAL RUN, NOT IMAGINED (DR-0061 reality-trace): every Google
// fact below was read off Darrell's own account on 2026-08-11 — his live
// Takeout order and his archived Takeout mail going back to 2019. Facts we
// verified carry `verified` with their evidence. Facts we did NOT verify are
// marked `confirmOnPage: true` and the UI must tell the user to read it off the
// vendor's own screen rather than trusting a number we typed. Under-claiming
// and over-claiming are both failures of truth (DR-0100).
//
// THE PARTIAL-EXPORT TRAP (the hard-won one — DR-0076 §3): a vendor "your
// archive is ready" email does NOT mean the archive is complete. Darrell's real
// mail proves it twice:
//   2019-02-10 "unable to export your archive to Box due to an internal error"
//   2021-12-16 "we were unable to create a copy of all your files"
// A partial archive unzips cleanly, indexes cleanly, and passes a byte-integrity
// check — because every byte that ARRIVED is intact. Integrity is not
// completeness. So every vendor carries a `completenessCheck`: a count the user
// compares against the vendor's own screen BEFORE deleting. Bytes-intact plus
// count-matches is the bar; bytes-intact alone is the trap.

export const STAGE = {
  NOT_STARTED: 'not-started',
  REQUESTED: 'requested',
  BUILDING: 'building',
  READY: 'ready',
  LANDED: 'landed',
  VERIFIED: 'verified',
  DELETED: 'deleted',
};

// Ordered, so progress is comparable and a stage can never silently skip ahead.
export const STAGE_ORDER = [
  STAGE.NOT_STARTED, STAGE.REQUESTED, STAGE.BUILDING,
  STAGE.READY, STAGE.LANDED, STAGE.VERIFIED, STAGE.DELETED,
];

export const stageIndex = (stage) => {
  const i = STAGE_ORDER.indexOf(stage);
  return i < 0 ? 0 : i;
};

export const VENDORS = [
  {
    id: 'google-photos',
    name: 'Google Photos',
    group: 'Google',
    icon: '🖼',
    holds: 'Photos and videos, their albums, and the date each was taken',
    // VERIFIED 2026-08-11 against Darrell's live order + his 2019/2021 archive mail.
    requestUrl: 'https://takeout.google.com/settings/takeout/custom/photos',
    manageUrl: 'https://takeout.google.com/settings/takeout/downloads',
    settings: [
      'Transfer to: Send download link via email',
      'Frequency: Export once',
      'File type: .zip',
      'File size: 50 GB',
    ],
    // The single most expensive mistake, and it is not obvious from the UI.
    warnings: [
      'Do NOT choose "Add to Drive" if you are over quota — the delivery fails.',
      'Download links expire. Get the parts down before the window closes.',
      'A big library is split across several files; you need EVERY part.',
    ],
    // The defect that makes a naive unzip worthless. Verified in this repo's
    // own tooling (infra/nas-photos-archive) against real Takeout structure.
    gotcha: 'When you unzip what Google sends, every photo looks like it was taken today instead of the day you took it. Twenty years of pictures end up jumbled into one day. Our tool puts the real dates back.',
    gotchaTechnical: 'Takeout stamps extracted files with the export date; the true photoTakenTime lives only in a sidecar .json beside each file. photos_archive.py restores it to mtime and files by year.',
    expiryDays: 7,
    verified: {
      at: '2026-08-11',
      how: "Darrell's live order (Photos-only deep link opened at '1 of 1 selected'; the page states 'You will have one week to download your files') and his 2019-02-10 archive mail ('available for you to download until February 17, 2019' — a 7-day window).",
    },
    completenessCheck: {
      where: 'https://photos.google.com',
      compare: 'the total item count Google shows',
      against: 'the item count in your archive index',
      note: 'These should be close. A large shortfall means a part is missing or the export was partial — do not delete.',
    },
    ownedTool: 'infra/nas-photos-archive/photos_archive.py',
  },
  {
    id: 'google-mail',
    name: 'Gmail',
    group: 'Google',
    icon: '✉',
    holds: 'Every message, its labels, and its attachments',
    requestUrl: 'https://takeout.google.com/settings/takeout/custom/gmail',
    manageUrl: 'https://takeout.google.com/settings/takeout/downloads',
    settings: [
      'Transfer to: Send download link via email',
      'Frequency: Export once',
      'File type: .zip',
      'File size: 50 GB',
    ],
    warnings: [
      'Order Mail SEPARATELY from Photos — mail finishes far sooner, and one failed part will not cost you both.',
      'Download links expire. Get the parts down before the window closes.',
    ],
    gotcha: 'Your mail arrives as one huge file that almost nothing can open. It is safe, but you cannot read it until it is unpacked. Our tool unpacks it and makes it searchable.',
    gotchaTechnical: 'A single large .mbox; mail_archive.py indexes it to JSONL, extracts attachments by year, and gives --find search.',
    expiryDays: 7,
    verified: {
      at: '2026-08-11',
      how: "Same Takeout flow as Photos, ordered on Darrell's account the same day; expiry confirmed by his 2019-02-10 archive mail.",
    },
    completenessCheck: {
      where: 'Gmail — the message total on the All Mail label',
      compare: 'the message count Gmail shows',
      against: 'the messages count in your archive stats',
      note: 'Tens of thousands is normal for an old account. A count near zero means the wrong file was indexed.',
    },
    ownedTool: 'infra/nas-mail-archive/mail_archive.py',
  },
  {
    id: 'google-drive',
    name: 'Google Drive',
    group: 'Google',
    icon: '📄',
    holds: 'Documents, spreadsheets, PDFs and folders you own',
    requestUrl: 'https://takeout.google.com/settings/takeout/custom/drive',
    manageUrl: 'https://takeout.google.com/settings/takeout/downloads',
    settings: [
      'Transfer to: Send download link via email',
      'Frequency: Export once',
      'File type: .zip',
    ],
    warnings: [
      'Files SHARED WITH YOU are not yours to export and do not count against your storage.',
      'Google-native docs convert on export — a Doc becomes .docx, a Sheet becomes .xlsx.',
    ],
    gotcha: 'Your files here are probably much smaller than you think. It is worth checking the size before you set aside a whole weekend for it.',
    expiryDays: 7,
    verified: {
      at: '2026-08-11',
      how: "Measured on Darrell's account: every video, zip and binary he owns totalled about 3 MB, largest video 2.7 MB, single page with no continuation token. The one large item nearby was owned by another account and did not touch his quota.",
    },
    completenessCheck: {
      where: 'https://drive.google.com — Storage',
      compare: 'the size Drive reports for your files',
      against: 'the total size of the landed archive',
      note: 'Shared-with-you files are excluded from both sides.',
    },
  },
  {
    id: 'amazon-photos',
    name: 'Amazon Photos',
    group: 'Amazon',
    icon: '📷',
    holds: 'Photos and videos backed up from your phone or Prime storage',
    requestUrl: 'https://www.amazon.com/photos',
    manageUrl: 'https://www.amazon.com/gp/privacycentral/dsar/preview.html',
    settings: [
      'Select the folders or albums you want',
      'Use the download action — the browser zips the selection',
    ],
    warnings: [
      'There is no single "export everything" button like Takeout. Selection-based download in batches is the normal path.',
      'Very large selections can fail partway — work album by album and confirm each.',
    ],
    gotcha: 'Amazon only gives you what you tick. If you forget an album, nothing warns you it is missing. Go album by album and check each one off.',
    confirmOnPage: true,
    verified: null,
    completenessCheck: {
      where: 'Amazon Photos — the item count per album',
      compare: "each album's item count",
      against: 'the files that landed for that album',
      note: 'Check album by album. This is the vendor where a silent shortfall is most likely.',
    },
  },
  {
    id: 'apple-icloud',
    name: 'Apple iCloud',
    group: 'Apple',
    icon: '',
    holds: 'iCloud Photos, iCloud Drive, contacts, calendars and more',
    requestUrl: 'https://privacy.apple.com',
    manageUrl: 'https://privacy.apple.com',
    settings: [
      'Request a copy of your data',
      'Choose the categories you want',
      'Choose a part size for the download',
    ],
    warnings: [
      'Apple can take several days to prepare a copy.',
      'Live Photos come down as a still plus a separate video file — both belong to the same moment.',
    ],
    gotcha: 'Some photos live only on your phone and never went to Apple. What Apple sends you is what Apple has, which may not be everything on your phone.',
    confirmOnPage: true,
    verified: null,
    completenessCheck: {
      where: 'Photos app — the library item count',
      compare: 'the item count Apple shows',
      against: 'the files that landed',
      note: 'Count the still and its paired video as one moment, not two.',
    },
  },
  {
    id: 'microsoft-onedrive',
    name: 'Microsoft OneDrive',
    group: 'Microsoft',
    icon: '☁',
    holds: 'Files, photos and anything synced from Windows',
    requestUrl: 'https://onedrive.live.com',
    manageUrl: 'https://account.microsoft.com/privacy',
    settings: ['Select folders and download — the browser zips the selection'],
    warnings: ['Files marked online-only must download before they can be copied off.'],
    gotcha: 'Some files look like they are on your computer but are really still online. If you copy them you can end up with empty files. Open a few to be sure they are real.',
    gotchaTechnical: 'Files On-Demand placeholders copy as stubs; a landed folder far smaller than reported size is placeholders.',
    confirmOnPage: true,
    verified: null,
    completenessCheck: {
      where: 'OneDrive — folder item counts',
      compare: 'the item and size totals',
      against: 'what landed on your own hardware',
      note: 'A placeholder is tiny. A folder whose landed size is far below the reported size is placeholders, not files.',
    },
  },
  {
    id: 'meta-facebook',
    name: 'Facebook / Instagram',
    group: 'Meta',
    icon: '👥',
    holds: 'Posts, photos, videos, messages and your friend list',
    requestUrl: 'https://accountscenter.facebook.com/info_and_permissions',
    manageUrl: 'https://accountscenter.facebook.com/info_and_permissions',
    settings: [
      'Download your information',
      'Choose format: HTML to read it, JSON to process it',
      'Choose the highest media quality',
    ],
    warnings: ['The default media quality is REDUCED — choose high quality or your photos come back degraded.'],
    gotcha: 'Unless you choose the highest quality, they send smaller, blurrier copies of your photos. If you then delete the originals, the blurry ones are all you have left.',
    confirmOnPage: true,
    verified: null,
    completenessCheck: {
      where: 'Your profile — photos and posts',
      compare: 'roughly what you know you posted',
      against: 'what appears in the export',
      note: 'Check the media quality of a few files before trusting the set.',
    },
  },
  {
    id: 'dropbox',
    name: 'Dropbox',
    group: 'Dropbox',
    icon: '📦',
    holds: 'Everything in your Dropbox folder',
    requestUrl: 'https://www.dropbox.com/home',
    manageUrl: 'https://www.dropbox.com/account',
    settings: ['Select folders and download as a zip, or use the desktop app to sync a full local copy'],
    warnings: ['Selective Sync may mean your local folder does not contain everything the account holds.'],
    gotcha: 'The Dropbox folder on your computer may not have everything. Some folders can be left out without telling you. Check the website list against your own.',
    confirmOnPage: true,
    verified: null,
    completenessCheck: {
      where: 'Dropbox on the web',
      compare: 'the folder list on the web',
      against: 'the folder list that landed',
      note: 'The web view is the truth; your synced folder may be a subset.',
    },
  },
  {
    id: 'ring',
    name: 'Ring',
    group: 'Amazon',
    icon: '🔔',
    holds: 'Doorbell and camera recordings, and your account data',
    requestUrl: 'https://account.ring.com',
    manageUrl: 'https://account.ring.com',
    settings: ['Request your personal data from account settings'],
    warnings: ['Recordings expire on their own schedule — old events may already be gone before you ask.'],
    gotcha: 'Ring only keeps recordings for a limited time. Anything older than that is already gone, and asking for a copy cannot bring it back.',
    expiryDays: 30,
    verified: {
      at: '2026-08-11',
      how: "Darrell's own Ring mail, 2025-11-08: 'Your personal data is now ready to download and will be available for 30 days.'",
    },
    completenessCheck: {
      where: 'Ring app — event history',
      compare: 'the events you can still see',
      against: 'the recordings in the export',
      note: 'Anything past the retention window is already unrecoverable, not missing from the export.',
    },
  },
];

// PLAIN LANGUAGE (Darrell 2026-08-11: "user friendly... we have elderly users...
// or will"). Every word a user reads comes from here, so the vocabulary is
// reviewed in one place instead of scattered through JSX.
//
// The rule: no jargon, ever. Not "Takeout", not "archive", not "byte
// integrity", not "export". A person who has never heard those words must be
// able to follow this. We say "your copy", "getting it ready", "check
// everything arrived". Where a vendor's own button says something different,
// the UI quotes the vendor's word in the instruction — because that is the word
// on the screen they are looking at — but never in our own voice.
export const PLAIN_STAGE = {
  [STAGE.NOT_STARTED]: {
    title: 'Ask for your copy',
    you: 'You have not asked for your copy yet.',
    step: 1,
  },
  [STAGE.REQUESTED]: {
    title: 'They are getting it ready',
    you: 'You asked for your copy. Now they have to gather it.',
    step: 2,
  },
  [STAGE.BUILDING]: {
    title: 'They are getting it ready',
    you: 'They are still gathering your things. This can take a few days.',
    step: 2,
  },
  [STAGE.READY]: {
    title: 'Your copy is ready — save it',
    you: 'It is ready. Save it to your computer before the link stops working.',
    step: 3,
  },
  [STAGE.LANDED]: {
    title: 'Make sure everything arrived',
    you: 'You have the files. Now we check that nothing is missing.',
    step: 4,
  },
  [STAGE.VERIFIED]: {
    title: 'Everything is there',
    you: 'Your copy is complete. Now it is safe to free up space.',
    step: 5,
  },
  [STAGE.DELETED]: {
    title: 'All done',
    you: 'You have your own copy, and the space has been freed.',
    step: 5,
  },
};

export const TOTAL_STEPS = 5;

export const plainStage = (stage) => PLAIN_STAGE[stage] || PLAIN_STAGE[STAGE.NOT_STARTED];

export const getVendor = (id) => VENDORS.find((v) => v.id === id) || null;

export const vendorsByGroup = () => {
  const out = new Map();
  for (const v of VENDORS) {
    if (!out.has(v.group)) out.set(v.group, []);
    out.get(v.group).push(v);
  }
  return out;
};

/**
 * THE GATE. The only function that authorizes deleting from a vendor.
 *
 * Says NO by default and for every unknown state. Two independent conditions
 * must BOTH hold, because they catch different failures:
 *   bytesVerified    — what landed is intact (catches a truncated transfer)
 *   completenessConfirmed — the count matches the vendor (catches a PARTIAL
 *                           export, which is byte-perfect and still missing
 *                           half your library)
 */
export const canDelete = (progress) => {
  const p = progress && typeof progress === 'object' ? progress : {};
  const reasons = [];
  if (stageIndex(p.stage) < stageIndex(STAGE.VERIFIED)) {
    reasons.push('The copy has not been verified yet.');
  }
  if (p.bytesVerified !== true) {
    reasons.push('No byte-integrity proof that what landed is intact.');
  }
  if (p.completenessConfirmed !== true) {
    reasons.push('Item count has not been checked against the vendor — a partial export looks perfectly intact.');
  }
  return { allowed: reasons.length === 0, reasons };
};

/** Human-readable next action for a vendor at a given stage. Never dead-ends. */
export const nextStep = (vendorId, progress) => {
  const vendor = getVendor(vendorId);
  if (!vendor) return null;
  const stage = (progress && progress.stage) || STAGE.NOT_STARTED;
  switch (stage) {
    case STAGE.NOT_STARTED:
      return { action: 'Request your export', url: vendor.requestUrl, detail: vendor.settings.join(' · ') };
    case STAGE.REQUESTED:
    case STAGE.BUILDING:
      return { action: 'Wait for the vendor to finish building it', url: vendor.manageUrl,
        detail: 'They will email you. This can take hours or days for a large library.' };
    case STAGE.READY:
      return { action: 'Download every part', url: vendor.manageUrl,
        detail: vendor.expiryDays
          ? `The link expires in about ${vendor.expiryDays} days. Download all parts before then.`
          : 'Download all parts, then check the vendor page for the expiry window.' };
    case STAGE.LANDED:
      return { action: 'Make sure everything arrived', url: null,
        detail: `Two things to check: open a few of the files to be sure they work, and compare ${vendor.completenessCheck.compare} with how many you received.` };
    case STAGE.VERIFIED: {
      const gate = canDelete(progress);
      return gate.allowed
        ? { action: 'Safe to free the space at the vendor', url: vendor.manageUrl,
            detail: 'Your copy is verified whole. Delete, then empty the vendor trash — space usually frees only after that.' }
        : { action: 'Finish verifying before deleting', url: null, detail: gate.reasons.join(' ') };
    }
    case STAGE.DELETED:
      return { action: 'Done — your copy is the one you own', url: null,
        detail: 'Keep it somewhere with a second copy. One copy is not a backup.' };
    default:
      return { action: 'Request your export', url: vendor.requestUrl, detail: vendor.settings.join(' · ') };
  }
};

// --- Device-local persistence (local-first; sync is the courier) -------------
// A vendor takes DAYS to build an export. A flow measured in days cannot live
// in React state — closing the tab would silently reset someone to step 1 and
// they would re-request an export they already had waiting.

function safeStorage() {
  try {
    if (typeof localStorage === 'undefined') return null;
    return localStorage;
  } catch { return null; }
}

const KEY = 'poetech-data-liberation-v1';

export function loadProgress() {
  const ls = safeStorage();
  if (!ls) return {};
  try {
    const raw = ls.getItem(KEY);
    const parsed = raw ? JSON.parse(raw) : {};
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {};
  } catch { return {}; }
}

export function saveProgress(progressById) {
  const ls = safeStorage();
  if (!ls) return { skipped: 'no-storage' };
  try {
    const safe = progressById && typeof progressById === 'object' && !Array.isArray(progressById)
      ? progressById : {};
    ls.setItem(KEY, JSON.stringify(safe));
    return { saved: true };
  } catch (e) { return { skipped: 'write-error', error: e }; }
}

/**
 * ATTESTATION, NOT JUST A FLAG — the thing syncing makes necessary.
 *
 * On one device the two ticks are self-evidently yours. The moment progress
 * syncs across a household they stop being yours: a parent ticks "I checked the
 * count" on a laptop, and a teenager opens the phone to a screen that simply
 * says deleting is safe. They would be deleting on someone else's word without
 * knowing it, and the safety check would have quietly become a rubber stamp
 * carried between devices.
 *
 * So a confirmation records WHO and WHEN, and the surface says so. Sync then
 * preserves the value (nobody redoes work already done) without ever hiding
 * whose judgment it rests on. Unticking clears the attribution — a stale name
 * against a fresh claim would be worse than none.
 */
export const attest = (progress, key, value, who) => {
  const base = progress && typeof progress === 'object' ? progress : {};
  if (value !== true) {
    const cleared = { ...base, [key]: false };
    delete cleared[`${key}By`];
    delete cleared[`${key}At`];
    return cleared;
  }
  return {
    ...base,
    [key]: true,
    [`${key}By`]: (who && who.name) || 'someone on this account',
    [`${key}At`]: (who && who.at) || null,
  };
};

/** Who vouched for a confirmation, in plain words. Empty when nobody has. */
export const attestedBy = (progress, key) => {
  const p = progress && typeof progress === 'object' ? progress : {};
  if (p[key] !== true) return '';
  const who = p[`${key}By`];
  return who ? `Checked by ${who}` : '';
};

/**
 * EXPORTABLE ALWAYS (DATA-AS-EMPOWERMENT commitment 3: "Every data record is
 * exportable in standard formats. The family can leave the platform at any time
 * and take their data with them.")
 *
 * A feature whose entire purpose is helping people escape vendor lock-in would
 * be self-refuting if PoeTech held this record hostage. So the same right we
 * are teaching users to exercise against Google applies to us: plain JSON, one
 * tap, no account required to read it. If we ever stop earning this surface,
 * the user leaves with everything it knew.
 */
export const exportProgress = (progressById) => {
  const map = progressById && typeof progressById === 'object' && !Array.isArray(progressById)
    ? progressById : {};
  return {
    exportedAt: null,          // stamped by the caller; this module stays pure
    format: 'poetech-data-liberation-v1',
    services: VENDORS
      .filter((v) => map[v.id] && map[v.id].stage && map[v.id].stage !== STAGE.NOT_STARTED)
      .map((v) => ({
        service: v.name,
        vendorId: v.id,
        stage: map[v.id].stage,
        checkedFilesOpen: map[v.id].bytesVerified === true,
        checkedCountMatches: map[v.id].completenessConfirmed === true,
        checkedBy: map[v.id].bytesVerifiedBy || map[v.id].completenessConfirmedBy || null,
      })),
  };
};

/** Overall progress across whatever the user has started. Counts only real state. */
export const summarize = (progressById) => {
  const map = progressById && typeof progressById === 'object' ? progressById : {};
  let started = 0; let verified = 0; let freed = 0;
  for (const vendor of VENDORS) {
    const p = map[vendor.id];
    if (!p || !p.stage || p.stage === STAGE.NOT_STARTED) continue;
    started += 1;
    if (stageIndex(p.stage) >= stageIndex(STAGE.VERIFIED)) verified += 1;
    if (p.stage === STAGE.DELETED) freed += 1;
  }
  return { total: VENDORS.length, started, verified, freed };
};
