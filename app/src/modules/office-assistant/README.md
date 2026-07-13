# office-assistant — the reusable office module

A standalone, config-driven module for an office's **referral network + marketing
assistant** workspace: the referral database (organizations + office contacts, the
NO-PHI boundary), the daily flow, the content calendar, weekly goals, and the
Ari-automation path — all derived from real records (DR-0061).

**One engine, many offices.** Everything office-specific is a config value, so a
new office (or a future PoeTech build) is a new config file, never a code fork.
TLC Therapy Solutions is the first config (`configs/tlc.js`); the existing
`lib/referral-ops.js` + `lib/use-referral-ops.js` are now thin bindings that ride
this module, so TLC keeps working unchanged.

## Layout

| File | What |
| --- | --- |
| `config.js` | The `OfficeConfig` contract + `defineOfficeConfig()` normalizer + `validateOfficeConfig()`. |
| `model.js` | `createOfficeModel(config)` — the office-agnostic pure engine (factories + derivations). No I/O. |
| `store.js` | `createOfficeStore(config, model)` — a per-office persistence store, namespaced by `storageKey`. |
| `configs/tlc.js` | TLC Therapy Solutions as the first config. |
| `configs/_template.js` | A copy-paste example config (also exercised by the tests to prove reuse). |
| `OfficeAssistant.jsx` | The config-driven UI *(build frontier — see below)*. |

## Add a new office

1. **Copy** `configs/_template.js` → `configs/<office>.js`. Fill in real values.
   Give it a **unique `storageKey`** (two offices must never share a namespace).
2. **Validate** — `validateOfficeConfig(...)` enforces the non-negotiables (id,
   brand, unique storageKey, at least one category + one geographic circle).
3. **Mount** a surface that renders the office's workspace from its config (once
   `OfficeAssistant.jsx` lands, that's `<OfficeAssistant config={YOUR_CONFIG} />`;
   register it in `app/src/surfaces.js` per DR-0078).

## Honest status (DR-0076)

Shipped + verified: the **engine layer** — `model.js` / `config.js` / `store.js`,
TLC riding it (its 16 existing tests unchanged + green), and a **second office
proven** to run the same engine isolated (`office-assistant-model.test.js`).

The **config-driven UI** (`OfficeAssistant.jsx`, generalized from the current
`components/TlcAssistant.jsx`) is the next increment — until it lands, TLC renders
through its existing component and a brand-new office has the engine but not yet a
mounted screen.
