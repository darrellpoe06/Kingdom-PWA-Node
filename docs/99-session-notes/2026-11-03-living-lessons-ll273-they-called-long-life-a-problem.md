# 2026-11-03 — L273: They Called Long Life a Problem

**Module id:** `ll273-they-called-long-life-a-problem`
**Decision record:** `docs/decisions/DR-1299-they-called-long-life-a-problem-ll273.md`
**Course:** Living Lessons from the Word (devotional; Word-first, non-denominational)
**Intake:** Gmail lesson-intake lane (DR-0312), thread `1a0aab01a0b1746e`

## What was asked, and how the thread was chosen

Find the **oldest genuinely-unbuilt lesson send**, judged by the body and never by the subject. Fifty-nine threads matched the lane's query. Narrowing by date left eight threads older than 2026-10-06 and only two older than 2026-09-20 — the two oldest sends in the lane, both forwarded on 2026-09-16 within 41 seconds of one another.

| thread | sent (UTC) | subject | body's intake word | verdict |
|---|---|---|---|---|
| `1a0aaaf7d6952b4b` | 14:46:57 | `FW: ☕ Cheat codes` | `Lessons.` / `Research first.` | **SHIPPED → DR-1272**, skipped |
| `1a0aab01a0b1746e` | **14:47:38** | `FW: ☕️ Problematic age gap` | `Lessons.` / `Ignore ads of course unless they are related to the lessons.` | **built as L273** |
| `1a0d92de3dba5e7e` | 2026-09-26 | `FW: LAST CALL FOR ENROLLMENT...` | id `unknown` | newer; left in the queue |
| `1a0e8b3432c5c9de` | — | `FW: AI Agents Can Think. Now They Can Pay.` | — | **SHIPPED → DR-1243** |
| `1a0ed322abd61be3` | — | `Fw: SSO vs OAuth vs OIDC vs SAML` | — | **SHIPPED → DR-1242** |
| `1a0f23b12bf2ca45` | — | `Fw: OpenAI DevDay...` | — | **SHIPPED → DR-1246, DR-1285** |
| `1a10bf98e21775dd` | — | `Fw: What Trump's AI czar means for you` | — | **SHIPPED → DR-1273, DR-1288** |
| `1a10c8ffd4dc1cac` | — | `FW: ...public-sector AI webinar series` | — | **SHIPPED → DR-1274** |
| `1a112074ff298629` | — | `FW: The ghost of assets past` | — | **SHIPPED → DR-1278** |

The three clearance probes on the chosen thread, all three clear:

1. `node scripts/lesson-row-shipped-sweep.mjs 1a0aab01a0b1746e` → `unknown`, exit 0.
2. The DR-1288 subject probe, `--subject "FW: Problematic age gap"` → `problematic -> 0 record(s), worth 0`; nothing at or above the 0.2 bar.
3. `get_thread` with `METADATA_ONLY` → `labelIds: ["UNREAD","CATEGORY_PERSONAL","INBOX"]`; **no `Label_22`.**

## The one item that carried a teaching

The issue held a Federal Reserve rate decision, a run of world headlines, a Canadian investment pitch, a cybersecurity share note and a trivia game, and none of those carry a teaching. One does. Under a section heading reading `OLD NEWS`, beneath a title calling it a `problematic age gap`, the digest reported that Japan has passed a hundred thousand people over a hundred for the first time in its history — and then wrote that **the surge of centenarians is straining the country's resources.** A nation reached the one outcome every earlier generation prayed for and the write-up filed it as a problem. The framing is the teaching; the arithmetic is not.

## What could not be read, and what was done about it

Every link in the forwarded mail is a Morning Brew tracking redirect inside a `urldefense.com` wrapper. Two roads were tried and both refused, in their own words:

- `WebFetch` → `getaddrinfo ENOTFOUND links.morningbrew.com`
- `curl` → `HTTP/1.1 403 Forbidden`, then `curl: (56) CONNECT tunnel failed, response 403`

So the only readable text was the forwarded body. Every figure is carried as the digest's own claim, said in the lesson **and in all four bands** to be unchecked, and the teaching rests on the framing rather than on any number. `links.morningbrew.com` would have to be allowed in the session's network settings for a later build to read the article itself. `re-review: 2026-12-01`.

## Measurements worth keeping

- **The department's anchors are dense.** 269 lessons on `origin/main` already use **706 distinct anchor chapters**. Measured SPENT: Leviticus 19, Proverbs 16/17/20/23, Psalms 127/128/92, Ephesians 6, Exodus 20, Mark 7, Matthew 15, 1 Timothy 5, Job 12, Deuteronomy 28/32, Titus 2, Malachi 4, Ruth 4, Isaiah 46, Psalms 90, Genesis 1/9, Luke 2, Joel 2, Proverbs 31, 1 Samuel 2, John 19/1, Hebrews 1. Measured FREE and used as the whole spine: **Zechariah 8** (free at verse level for 8:3-8:6), **Job 5, Psalms 71, Psalms 113, Deuteronomy 5, 1 Kings 12, 2 Chronicles 10, Numbers 8, Numbers 11, Genesis 47, Genesis 48, Luke 13, Ezekiel 22, Isaiah 3, Lamentations 5, Judges 2, 1 Samuel 12.**
- **Bands:** shares 0.65 / 0.73 / 0.93 / 1.04 against floors 0.50 / 0.60 / 0.60 / 0.60. Reading ladder 0.6 / 4.0 / 4.6 / 7.3 (adult 5.4), child under the 5.0 new-lesson ceiling. Differentiation worst pair 0.13 against a 0.50 ceiling.
- **Verses:** 221 referenced quoted spans across every string of the module, 0 verbatim faults against `app/public/bible/kjv`. Twenty numbered movements, contiguous from 1.
- **Tests:** 41, all green; **proven to catch seven ways**, each break made on the live strings, run, and restored byte-identical (`cmp` clean every time): the Zechariah 8:4 quote altered at all 6 sites (4 failed), the Isaiah 3:5 span capitalised at all 5 sites (3 failed), the youth band`s `unchecked` turned to `confirmed` (names youth and only youth), the senior friend line stripped (names senior and only senior while the pooled check stays green), the child band`s daughter of Abraham turned back into a category, `Yahweh` substituted into a quotation, and `Proverbs 16:31` (spent in 19 lessons) added to the anchor.

## Two check scopes narrowed on purpose

The adversary-capitalisation check and the doubled-word check scan **our authored voice only**, outside double quotes. The corpus's Luke 13:16 reads *"whom satan hath bound"* in lowercase already, so the quotation agrees with CLAUDE.md rather than needing an exception, and Job 5:26 genuinely reads *"cometh in in his season"*. The bright line is that a quotation is never altered; scoping the checks to our own voice is what lets both rules stay strict where they belong.

## What a standing gate caught

`the-plain-meaning-comes-first` is a shrink-only ratchet, and it earned its keep here. It failed on `ll273...senior: actuarial`: the senior band used *actuarial science* without giving its plain meaning first, which would have pushed the recorded debt from 65 to 66. The sentence was rewritten — the image *comes off a farm rather than out of an insurer’s table of costs* — rather than the baseline being widened. Debt back at 65, and the senior band’s grade moved 7.4 to 7.3.

## Left open

- The Gmail thread was **not** labelled `Lesson-Captured` by this session — `label_thread` needs approval here, so the thread id was reported to the coordinator for tagging after the push.
- The digest's figures stay unverified until the source host is reachable. `re-review: 2026-12-01`.
