#!/usr/bin/env node
// =============================================================================
// mint-vapid — generate the VAPID pair, with nobody's hands on the private key
// =============================================================================
// Darrell, 2026-09-08: "Connectbot?"
//
// The honest answer, and why this file exists. ConnectBot reaches the NAS; the
// VAPID keys live in Cloudflare. But the premise underneath the question — that
// the keys need Darrell's hands ANYWHERE — was wrong, and DR-0108 says a stated
// "must-be-by-hand" is a premise to challenge, not a place to stop. DR-0249
// already drew the line: "credentials only he holds" is smaller than "his hands
// must type it." The repository ALREADY holds `CLOUDFLARE_API_TOKEN` and
// `CLOUDFLARE_ACCOUNT_ID` as Actions secrets — the deploy uses them on every
// merge. So the key pair can be minted on a runner and installed on the Pages
// project without the private half ever being displayed, pasted, copied into a
// chat, or typed on a phone. It is generated and consumed inside one job.
//
// The generator is OUR OWN `generateVapidKeys` (webpush-crypto.js, Web Crypto
// P-256, no npm dependency) — the same function the suite already proves signs
// a VAPID JWT that verifies against its own public key.
//
// Usage:  node scripts/mint-vapid.mjs <out.json>
// Writes {"VAPID_SUBJECT","VAPID_PUBLIC_KEY","VAPID_PRIVATE_KEY"} — the shape
// `wrangler pages secret bulk` consumes — and prints ONLY the public half.
import { writeFileSync } from 'node:fs';
import { generateVapidKeys } from '../app/src/lib/webpush-crypto.js';

const out = process.argv[2];
const subject = process.env.VAPID_SUBJECT || 'mailto:info@thechurchofthelivinggod.com';

if (!out) {
  console.error('usage: node scripts/mint-vapid.mjs <out.json>');
  process.exit(2);
}
// RFC 8292 §2.1 — the subject identifies who to contact about a bad sender.
if (!/^(mailto:|https:)/.test(subject)) {
  console.error(`VAPID subject must be a mailto: or https: URI (RFC 8292 §2.1); got: ${subject}`);
  process.exit(2);
}

const { publicKey, privateKey } = await generateVapidKeys();

// A last check before anything is installed: an 87-character base64url string
// beginning 'B' is the uncompressed P-256 point the browser requires. A pair
// that fails this would install cleanly and then refuse every subscription.
if (!/^[A-Za-z0-9_-]{86,88}$/.test(publicKey) || publicKey.charAt(0) !== 'B') {
  console.error('generated public key is not a 65-byte uncompressed P-256 point — refusing to install it');
  process.exit(1);
}
if (!privateKey || privateKey.length < 40) {
  console.error('generated private key looks wrong — refusing to install it');
  process.exit(1);
}

writeFileSync(out, `${JSON.stringify({
  VAPID_SUBJECT: subject,
  VAPID_PUBLIC_KEY: publicKey,
  VAPID_PRIVATE_KEY: privateKey,
}, null, 2)}\n`, { mode: 0o600 });

// The public half is public by design and is the one thing worth reporting.
// The private half is never printed — not to the log, not to the summary.
console.log(`::add-mask::${privateKey}`);
console.log(`public_key=${publicKey}`);
console.log(`subject=${subject}`);
