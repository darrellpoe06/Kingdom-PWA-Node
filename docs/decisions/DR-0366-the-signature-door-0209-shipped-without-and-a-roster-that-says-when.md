# DR-0366 — The signature door 0209 shipped without, and a roster that says when

**Date:** 2026-09-11 · **Status:** accepted · **Tier:** B · **Area:** platform · **Principles:** VERIFICATION-DOCTRINE, REALITY-TRACE, SURFACE-PREMISE-CONFLICTS, DATA-AS-EMPOWERMENT, DETERMINISTIC-FIRST, DECISION-RECORDS

## Directive, in Darrell's words (2026-09-11)

> *"PoeTech App should be able to see who is and when also the ability to change user levels... also see the email and try to get email and cellphone together if they have them... however just not allowing it to be a constraint... make sense?"*

Sent with a screenshot of Admin → **Manage access roles** open on TLC Therapy Solutions.

---

## Part 1 — A required agreement with no door to make it through

### The defect

Migration **0209** (DR-0357's church half, merged as #1531) does three things that cannot all be true at once:

1. The member intake declares `churchCovenant` **`required: true`**.
2. `church_member_patch_guard` **refuses** any patch containing an `acknowledgments` key — deliberately, because *a signature is made on a document, never typed into a cell*.
3. 0209 ships **no acknowledge function**.

So the covenant the intake requires could not be signed by any path. A person would fill in 27 of 28 answers and the 28th had no door.

### How it was found, and why it is a separate migration

The function was first written **into 0209** while that migration still sat unmerged on the branch. Between writing it and pushing, **PR #1531 auto-merged** and 0209 replayed. Verified against the live database before going further:

```
church_member_records       → exists
church_member_record_read   → exists
church_member_record_acknowledge → NULL
church_documents            → exists
```

An already-replayed migration is never re-run, so the edit would have sat in the repo looking correct while production stayed broken — the client would have called a function that does not exist. 0209 was restored **byte-for-byte** to what `main` carries, and the function moved to **0210**. (`feedback-surface-premise-conflicts`: the plan rested on a premise — "0209 is still mine to edit" — that had stopped being true.)

### What 0210 gives it

`church_member_record_acknowledge(key, signature, doc_version, attestation, agreed_at, instance)` — the church twin of 0201's household version, with one deliberate difference: **no seat test**. The household's covenant is signed by an adult with a seat; a church member's record belongs to that member, and **a person signs for themselves**.

Proven by `0210-signature-door-and-roster-smoke.sql` against the real database:

- the signature is trimmed and kept; the server stamps it
- **re-reading the same version does not re-date the signature**; a new version does
- an empty signature, a missing attestation, and an unknown document are each refused
- the acknowledgments **cell** door is still shut
- signing writes to the signer's **own** record, never another person's

---

## Part 2 — The roster knew WHO and not WHEN

### What was true before (measured live, 2026-09-11 — not read off a schema file)

`list_instance_members` returned `user_id, display_name, email, role, classification, relationship`. It answered **who**. It said nothing about **when**, and nothing about a phone.

`instance_members.joined_at` exists and is **populated on every row in the live database**. It was simply never returned.

Across all **23** accounts:

| source | populated |
| --- | --- |
| `auth.users.phone` | **0** |
| `raw_user_meta_data->>'phone'` | 3 |
| `<digits>@phone.poetech.us` email | 3 (the same three) |

So the **phone door is the only real source of a phone today**, and it is an *email* column holding a *phone number*.

### The friction Darrell was actually looking at

On the live roster for `poe-family` **and** `tlc-therapy-solutions`, the Governor appears **twice**:

| display name | email | phone |
| --- | --- | --- |
| `darrellpoe06` | darrellpoe06@gmail.com | — |
| `Darrell` | *(none)* | 15636502416 |

Two auth accounts. One man. And because the row printed `displayName || email`, the email was **hidden** the moment a display name existed — which is the "also see the email" half of the directive.

### Decisions

1. **0210 extends `list_instance_members`** with `joined_at`, `last_sign_in_at`, `created_at`, `phone`, `email_is_phone_door`. Access is **unchanged**: still owner/admin of that instance, still checked inside the function body. A member's email was already returned to their own owner/admin; a phone is the same class of fact about the same person and adds no new audience.

2. **A phone-door address is a PHONE, not a mailbox.** The email column returns **NULL** for those accounts and the digits come back as `phone`. Printing `15636502416@phone.poetech.us` in an Email column states something false about how to reach a person (DR-0076 rule 8). `signInEmailOf()` reconstructs the identity when one is genuinely needed.

3. **The person's own answer outranks anything derived.** Someone who wrote their number into their own record has told us; a number lifted out of a sign-in address is an inference, and `contactOf()` labels it as one (`they told us` / `on their account` / `the phone they sign in with`).

4. **Two doors, one person — SAID, never merged.** `likelySamePerson()` pairs the gmail and the phone door from `DECLARED_SAME_PERSON` in `admin-allowlist.js`, which mirrors the shell's own `FAMILY_EMAIL_PROFILES` (a test pins the two so they cannot drift). Nothing derivable would ever pair those rows — different email, different phone, different display name — so the **declaration** is what makes it a fact rather than a guess. A shared phone or email is `certain`; a shared **name** is only `worth checking`, and says so.

   **Merging two accounts is not done and is not offered.** It is irreversible, and it is the Governor's word to give, not a heuristic's (DR-0111's first carve-out). The roster shows one person with two doors; both rows stay exactly as the database has them, and both sign-in doors keep working.

5. **NOT A CONSTRAINT — held as a fact, not a promise.** `CONTACT_IS_NEVER_REQUIRED` states in data that a missing email or phone blocks nothing: it never hides a member, never disables a role change or an invite, never renders as an error, and never becomes a required field. The suite asserts each clause, including that the surface contains no `disabled={…contactOf…}` anywhere. The coverage line says out loud that it is *"a count, not a chase list"*.

---

## What is NOT built (DR-0329: say it)

- **No account merge**, by design (decision 4).
- **No phone for an ordinary account.** 21 of 23 accounts have no phone anywhere in the system, and nothing invents one. The honest fill path is the person's own record (`contactPhone`), which exists for church members and for nobody else yet. *re-review: 2026-10-11 — whether the household and TLC intakes should carry the same cell.*
- **No verification of a phone.** A number on a row is a number somebody typed, not a proved channel.
- **No notification wired to any of this.** Seeing a phone is not permission to text it.

## Proof

- `0210-signature-door-and-roster-smoke.sql` — 25 assertions on the real database, rolled back; on the product-forms leg of `rls-isolation.yml`.
- `app/src/__tests__/member-contact.test.js` — 29 tests, including a proven-to-catch block for the four failures this exists to prevent (a sign-in address printed as an email, an invented phone, an unknown date read as today, a declaration living in only one of its two places).
- The extended SQL was run against **real rows** before it was written into a migration; the output is the table in "the friction Darrell was actually looking at" above.
