// =============================================================================
// store-signing — the store signing key, born in the browser (DR-0152 custody)
// =============================================================================
// Darrell 2026-07-23: "How can we build this into the Apps so Dev/Ops members
// can do that step and still stay secure?" The answer encoded here:
//
//   · The KEY IS BORN CLIENT-SIDE (node-forge, lazy-loaded) — the private key
//     never exists on any server of ours. Custody-first: the caller downloads
//     the .p12 + password for the Governor's vault BEFORE anything is placed.
//   · The MEMBER'S OWN GITHUB AUTHORITY is the credential: a fine-grained PAT
//     (this one repo, Secrets+Actions write, short expiry) pasted at the
//     moment, held in memory, never stored. GitHub's audit log records who
//     acted; repo roles (the Governor's grant) decide who CAN.
//   · Secrets are SEALED CLIENT-SIDE (libsodium sealed box — GitHub's own
//     required encryption) before they travel; the token and plaintext never
//     touch our functions.
//   · PROOF, not claims (DR-0076): after placing, dispatch the android lane
//     and read back its own "persistent store keystore" line as the receipt.
//
// Bright line (DR-0152): this is the STORE key (sideload lane, in-place
// updates). The PLAY keystore remains offline, Governor-custodied — never
// this flow. Pure/injectable: every network call takes fetchImpl.

export const REPO = { owner: 'darrellpoe06', repo: 'Kingdom-PWA-Node' };
export const SECRET_NAMES = ['ANDROID_STORE_KEYSTORE_B64', 'ANDROID_STORE_KEYSTORE_PASS'];
export const KEY_ALIAS = 'poetech'; // must match the lane's twa-manifest signingKey alias

export const PAT_INSTRUCTIONS = [
  'GitHub → your avatar → Settings → Developer settings → Fine-grained tokens → Generate new token.',
  `Repository access: ONLY ${REPO.owner}/${REPO.repo}.`,
  'Permissions: "Secrets" = Read and write, "Actions" = Read and write. Nothing else.',
  'Expiration: 7 days. Copy the token — it is used once here and never stored.',
];

const b64FromBytes = (binStr) => btoa(binStr);

// Generate the PKCS12 keystore in the browser. Returns { p12Base64, password }.
// RSA-2048 + 25-year self-signed cert, alias `poetech` — the same shape the
// lane's keytool fallback produces, so the workflow needs no change at all.
export async function generateStoreKeystore({ password, forgeImpl } = {}) {
  const forge = forgeImpl || (await import('node-forge')).default;
  const pass = password || forge.util.bytesToHex(forge.random.getBytesSync(24));
  const keys = forge.pki.rsa.generateKeyPair({ bits: 2048 });
  const cert = forge.pki.createCertificate();
  cert.publicKey = keys.publicKey;
  cert.serialNumber = '01' + forge.util.bytesToHex(forge.random.getBytesSync(8));
  cert.validity.notBefore = new Date();
  cert.validity.notAfter = new Date(cert.validity.notBefore.getTime() + 25 * 365 * 24 * 3600 * 1000);
  const attrs = [
    { name: 'commonName', value: 'PoeTech App Store' },
    { name: 'organizationName', value: 'PoeTech' },
    { shortName: 'C', value: 'US' },
  ];
  cert.setSubject(attrs);
  cert.setIssuer(attrs);
  cert.sign(keys.privateKey, forge.md.sha256.create());
  const p12 = forge.pkcs12.toPkcs12Asn1(keys.privateKey, [cert], pass, {
    algorithm: '3des', // the keytool/apksigner-compatible legacy PBE
    friendlyName: KEY_ALIAS,
  });
  const der = forge.asn1.toDer(p12).getBytes();
  return { p12Base64: b64FromBytes(der), password: pass };
}

// Seal a secret value for GitHub with the repo's public key (libsodium sealed
// box — the encryption GitHub's secrets API REQUIRES; plaintext never travels).
export async function sealForGithub(repoPublicKeyB64, value, { sodiumImpl } = {}) {
  const sodium = sodiumImpl || (await import('libsodium-wrappers')).default;
  await sodium.ready;
  // The message rides as a plain string (libsodium converts internally) — a
  // realm-crossed Uint8Array fails its type check under jsdom and some WebViews.
  const sealed = sodium.crypto_box_seal(
    value,
    sodium.from_base64(repoPublicKeyB64, sodium.base64_variants.ORIGINAL),
  );
  return sodium.to_base64(sealed, sodium.base64_variants.ORIGINAL);
}

const gh = (token) => ({
  Accept: 'application/vnd.github+json',
  Authorization: `Bearer ${token}`,
  'X-GitHub-Api-Version': '2022-11-28',
});

// Place one Actions secret: fetch the repo's sealing key, seal, PUT.
export async function placeGithubSecret({ name, value, token, fetchImpl, sodiumImpl }) {
  const doFetch = fetchImpl || fetch;
  const base = `https://api.github.com/repos/${REPO.owner}/${REPO.repo}/actions/secrets`;
  const keyRes = await doFetch(`${base}/public-key`, { headers: gh(token) });
  if (!keyRes.ok) return { ok: false, step: 'public-key', status: keyRes.status };
  const { key, key_id: keyId } = await keyRes.json();
  const encrypted_value = await sealForGithub(key, value, { sodiumImpl });
  const putRes = await doFetch(`${base}/${name}`, {
    method: 'PUT',
    headers: { ...gh(token), 'content-type': 'application/json' },
    body: JSON.stringify({ encrypted_value, key_id: keyId }),
  });
  if (putRes.status !== 201 && putRes.status !== 204) return { ok: false, step: 'put', status: putRes.status };
  return { ok: true, name };
}

// The whole placement: both secrets, then the proof dispatch of the android
// lane (its run log's "persistent store keystore" line is the receipt).
export async function placeStoreSigningKey({ p12Base64, password, token, fetchImpl, sodiumImpl }) {
  const results = [];
  for (const [name, value] of [
    ['ANDROID_STORE_KEYSTORE_B64', p12Base64],
    ['ANDROID_STORE_KEYSTORE_PASS', password],
  ]) {
    const r = await placeGithubSecret({ name, value, token, fetchImpl, sodiumImpl });
    results.push(r);
    if (!r.ok) return { ok: false, results };
  }
  const doFetch = fetchImpl || fetch;
  const disp = await doFetch(
    `https://api.github.com/repos/${REPO.owner}/${REPO.repo}/actions/workflows/android-package.yml/dispatches`,
    { method: 'POST', headers: { ...gh(token), 'content-type': 'application/json' }, body: JSON.stringify({ ref: 'main' }) },
  );
  return { ok: true, results, proofDispatched: disp.status === 204 };
}
