# DR-0571 — `native` is a Java keyword: the first run of the native lane, and the id suffix it corrected

- **Status:** accepted
- **Tier:** B
- **Type:** fix
- **Date:** 2026-09-23
- **Scope:** `app/native/brands.json` (ids end in `.local`); `app/src/__tests__/the-local-app-carries-the-house-address.test.js` (the Java-keyword pin, +1 check); `.github/workflows/native-shell.yml` (two comment lines); DR-0570 (amended note)
- **Principles:** VERIFICATION-DOCTRINE (DR-0076 §3 — proven-to-catch), SPEAK-ESTABLISHED-FACT (DR-0100), DR-0236 (nothing waits)
- **Grounds:** `native-shell.yml` run 1 (35804414174), dispatched the minute #1737 merged, all five brand jobs

---

## What the first run said

Every brand reached the Gradle step in under a minute — the base-`/` build, the staging, `cap add`, `cap sync`, the version pin, the SDK, and the **store keystore** (mode `store`: the same stable identity the TWA packages carry) all passed — and then Gradle refused the project at `build.gradle` line 4:

```
Namespace 'us.poetech.properties.native' is not a valid Java package name as 'native' is a Java keyword.
```

DR-0570 chose `<twa id>.native` so the two lanes' packages would be legibly paired and installable side by side. The pairing was right; the word was not. An Android application id is also the app's Java namespace, and `native` is one of Java's reserved words. The second error in the same log — *"does not specify `compileSdk`"* — is a consequence, not a cause: the template's line 5 sets `compileSdk = rootProject.ext.compileSdkVersion` and configuration had already aborted on line 4.

## The correction

The suffix is **`.local`** — `us.poetech.app.local`, `us.poetech.lovecorner.local`, `us.poetech.tlc.local`, `us.poetech.properties.local`, `us.poetech.moore.local`. Still distinct from every TWA id, still the TWA id plus one word, so DR-0570's reason for the pairing holds unchanged.

The check that would have caught it before the runner did is now in the test: every dot-separated segment of every id must be a legal Java identifier and must not be one of Java's reserved words (the full list, in the test), proven to catch on the exact id that failed.

## What this run also proved, and is recorded rather than lost

- The lane's first thirteen steps are sound on a real runner: the sovereign anon key arrives over the tailnet, the app builds at base `/` in ~30 s, staging and `cap add`/`cap sync` land the bundle in the Android project, the compile platform is on disk, and the **committed store keystore decrypts and signs** — the local apps will update in place from the first shelf.
- The Gradle wrapper downloads 8.14.3 on every job (~20 s); a cache is a later micro-upgrade, not a blocker.

## Run 2, same day: the toolchain

With `.local` in place every brand got past the namespace and Gradle failed one step later, in Capacitor's own module: `:capacitor-android:compileReleaseJavaWithJavac` — *"invalid source release: 21"*. `@capacitor/android` 8 sets `sourceCompatibility JavaVersion.VERSION_21` (`capacitor/build.gradle:66`), and the lane had copied the TWA lane's JDK 17. The workflow now sets up JDK 21, and the test reads the version out of the installed module rather than remembering it, so a Capacitor upgrade that moves the target moves the pin. The TWA lane stays on 17; Bubblewrap's project is a different project.

## Verification

- The lane is re-dispatched on this branch (a registered workflow can be dispatched on any ref) before the fix merges; the shelf result is the proof, and the next record or this PR's thread says what the run produced.
- The native test suite (30 checks) is green locally; lint clean; ledger guard whole.
