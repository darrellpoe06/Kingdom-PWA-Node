// =============================================================================
// build-manifests — every build-time manifest, held ONCE (DR-1214)
// =============================================================================
// The build reads the repo's ledgers (the decision records, the governance
// queue, the reviews, the quality proof, the test census, the lessons, the
// interconnect graph) and hands them to the app. It used to hand each one in
// through a Vite `define` per name, and `define` pastes the whole JSON at EVERY
// place the name is written: the 2.41 MB decision ledger was pasted six times
// into the shell's chunk alone (measured 2026-10-22: 14.5 MB of its 24 MB), so
// every new decision record grew the chunk six times over until it crossed the
// 24 MiB asset limit (DR-0595) and the deploy would have been refused.
//
// Now each manifest's JSON is written here exactly once, into a global, and
// this module rides in its own chunk (vite.config.js manualChunks). The names
// the app has always read (`__DR_LEDGER__` and the rest) are defined in the
// build as a reference to that global, a few bytes each. Every file that reads
// one imports this module first, so ESM runs it before that file's own body,
// whichever entry (the PoeTech app, Poe Properties, TLC, Moore, Love Corner)
// loaded it.
//
// In the tests there is no build: the `*_DATA__` names do not exist, each
// assignment below throws and is skipped, and a test sets the global it needs
// itself, exactly as before.
try { globalThis.__PT_GOVERNANCE_QUEUE = __GOVERNANCE_QUEUE_DATA__; } catch { /* no build: the test sets it */ }
try { globalThis.__PT_DR_LEDGER = __DR_LEDGER_DATA__; } catch { /* no build: the test sets it */ }
try { globalThis.__PT_DR_PRINCIPLES = __DR_PRINCIPLES_DATA__; } catch { /* no build: the test sets it */ }
try { globalThis.__PT_QUALITY_PROOF = __QUALITY_PROOF_DATA__; } catch { /* no build: the test sets it */ }
try { globalThis.__PT_INTERCONNECT_LOOPS = __INTERCONNECT_LOOPS_DATA__; } catch { /* no build: the test sets it */ }
try { globalThis.__PT_CONFLICT_LOOP = __CONFLICT_LOOP_DATA__; } catch { /* no build: the test sets it */ }
try { globalThis.__PT_UIUX_REVIEWS = __UIUX_REVIEWS_DATA__; } catch { /* no build: the test sets it */ }
try { globalThis.__PT_TEST_CENSUS = __TEST_CENSUS_DATA__; } catch { /* no build: the test sets it */ }
try { globalThis.__PT_LESSONS_PRINCIPLES = __LESSONS_PRINCIPLES_DATA__; } catch { /* no build: the test sets it */ }
