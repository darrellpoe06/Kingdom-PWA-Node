# 2026-11-19 — Installer-class exposure review (Drupal SA-CORE-2026-017 → our stack)

**Trigger:** Darrell 2026-11-19: Drupal's leftover `install.php` lets a stranger reinstall and take over a site; Nate deletes it from the web root at work. "Check our apps for these … fixing it." Then: "We should not be using n8n!!!"
**Decision record:** [DR-1607](../decisions/DR-1607-no-road-leaves-its-mount-and-n8n-road-closed.md)

## 1. The world issue (research, sourced)

- **SA-CORE-2026-017 / CVE-2026-132165 (Critical, 18/25), published 2026-11-18.** Drupal's `core/install.php` ships in every copy of core and stays on the site after install. Under some conditions an unauthenticated visitor can use it to try a reinstall, which can lead to takeover or code execution. Fixed in 11.4.13, 11.3.22 and 10.6.22. Mitigation: block `/core/install.php`, the `/install.php` redirect and any path with extra components at the web server (403/404), and keep `settings.php` unwritable. 11.2.x and earlier, 10.5.x and earlier, and 8/9 are end-of-life and get no fix. Sources: [The Hacker News](https://thehackernews.com/2026/11/drupal-patches-critical-installer-flaw.html), [Pantheon release note](https://docs.pantheon.io/release-notes/2026/11/drupal-core-security-release), [OSV DRUPAL-CORE-2026-017](https://osv.dev/vulnerability/DRUPAL-CORE-2026-017).
- **Same class in n8n, already in 2026:** CVE-2026-21858 ("Ni8mare", CVSS 10.0), an unauthenticated takeover through public form and webhook endpoints, fixed in n8n 1.121.0. It chains with CVE-2025-68613, CVE-2025-68668, CVE-2026-21877 and CVE-2026-25049. Sources: [The Hacker News](https://thehackernews.com/2026/01/critical-n8n-vulnerability-cvss-100.html), [Rapid7](https://www.rapid7.com/blog/post/etr-ni8mare-n8scape-flaws-multiple-critical-vulnerabilities-affecting-n8n/), [The Register](https://www.theregister.com/2026/02/05/n8n_security_woes_roll_on/).

**The class to look for:** a setup, install or first-run surface that is still reachable from the public internet after the system is live.

## 2. SHOULD / ARE / GAPS / CLOSE (DR-0219)

**SHOULD.** n8n is retired (DR-0617, "No n8n!!!"). The Funnel root to n8n is LEGACY and shrinks to zero (`infra/nas-transport/RECORDED-STATE.md` row `/`, DR-0218). Each sovereign road reaches only its own mount. `infra/n8n/docker-compose.yml:62-64` itself says to re-enable auth "if the n8n editor is ever exposed beyond Tailscale".

**ARE (measured in the repo, 2026-11-19):**

| # | Check | Result |
|---|---|---|
| 1 | PHP / Drupal / WordPress / composer files | **None.** `git ls-files` finds no `.php`, `.module`, `settings.php` or `composer.*`. The direct Drupal issue does not apply. |
| 2 | Installer scripts in a web root (`app/public`, `dist`) | **None.** The 25+ `infra/*/install.sh` are NAS-side, run by services-sync, and never served. |
| 3 | `/setup/*` routes on our own services | Camera `/setup/wyze` and `/setup/ring` need the family bearer or owner; the selftest proves 401 without it (`cams_forwarder.py:5169-5170`). **OK.** |
| 4 | `/n8n/*` Pages road | **OPEN.** `upstreamPrefix: ''` forwarded ANY path to the Funnel root, which is n8n: `/n8n/setup`, `/n8n/signin`, `/n8n/rest/*`, `/n8n/form/*`. App callers in `app/src`: **zero**. |
| 5 | Every other road (`/sb`, `/taxes`, `/cams` …) | **OPEN through traversal.** `new URL(FUNNEL + '/sb/%2e%2e/rest/owner/setup').pathname === '/rest/owner/setup'` (measured in node). A request could climb out of its mount onto the n8n root. |
| 6 | Funnel root itself (`poetech.tail5a2f35.ts.net/`) | **OPEN (NAS-side).** The whole n8n app is public on the Funnel hostname, with `image: n8nio/n8n:latest` (patch level unknown), `N8N_SECURE_COOKIE=false` and `N8N_BLOCK_ENV_ACCESS_IN_NODE=false`, all justified as "Tailscale only". |
| 7 | Live version / `/setup` state | **NOT MEASURED.** The sandbox has no route to the Funnel or poetech.us (curl → 000). It must be measured from a runner over the tailnet (DR-1159). |

**Is n8n still used?** The app does not call it. On the NAS it still runs. The `n8n-is-gone` HELD ledger still names: the wf18 bearer-rotation control (`nas-rotate-bearer.yml` and its guard script), the NAS health-check probe of `:5678`, and `infra/n8n`, whose compose also runs the live ntfy and Ollama containers.

## 3. CLOSE

- **Shipped (DR-1607):** gaps 4 and 5. `/n8n/*` now answers a signed 410 and forwards nothing. Every road refuses dot segments, encoded dot segments and smuggled separators before fetching. `no-road-leaves-its-mount.test.js` is proven-to-catch: with the guard disabled, 8 cases fail.
- **Open, NAS-side (gap 6/7): retire the n8n container and the Funnel root.** This stops a running service and changes the public transport (Tier C, DR-0107 uptime rule), so it is sequenced, not blind:
  1. Measure from a runner: n8n version, and whether `GET /rest/settings` reports `showSetupOnFirstLoad` (an unclaimed owner = installer-open).
  2. `docker stop n8n` (ntfy and Ollama keep running; they are separate containers in the same compose).
  3. Remove the Funnel `/` handler. Every sovereign `--set-path` mount stays.
  4. Delete the RECORDED-STATE `/` row, the HELD entries, `infra/n8n`'s n8n service and `app/functions/n8n` in one merge.
  `re-review: 2026-11-26`
