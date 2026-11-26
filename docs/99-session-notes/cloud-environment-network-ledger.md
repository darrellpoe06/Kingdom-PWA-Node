# Cloud environment network ledger (the Kingdom-PWA-Node environment)

The cloud sessions' network allowlist lives in the environment's settings, not in this repo, and the settings keep no history. This ledger is that history: every site allowed or removed, when, why, and the work it served, so nothing we may need again is lost and anything removed can be re-added in one step.

Rules for this file:

- Append a row for every change; never rewrite a past row.
- **Nothing we have used is removed without Darrell's word** (Darrell 2026-11-26: "Why not keep what we needed?"). A site removed at his word moves to **Removed, re-addable**, with the reason and what it served.
- Darrell approves every change on a card in the app. This ledger records what he approved.
- **Known limits of the service** (measured 2026-11-26): at most 20 sites per change. Two 20-site adds of the inventory list were rejected with no reason given, while a 16-site add to 30 went through to 46. So the rejection is not a simple total cap: it is likely one or more specific sites in that list. Add the queue in small groups, to find which.

## Allowed now (as of 2026-11-26 18:20 UTC)

| Site | Added | Why / what it serves |
|---|---|---|
| developer.squareup.com | before 2026-11-26 | Square checkout API docs (the environment's original purpose) |
| productionresultssa2/3/4/12/13/15/30.blob.core.windows.net (7) | before 2026-11-26 | Canva export downloads |
| media.canva.com, www.canva.com, export-download.canva.com | before 2026-11-26 | Canva |
| www.youtube.com, youtu.be | 2026-11-26 | The leaders' own messages (Price, Darby) and their channel feeds (DR-1683) |
| en.wikipedia.org | 2026-11-26 | Leaders' biographies and free-license photo pages (DR-1683) |
| stephendarbyministries.com, www.stephendarbyministries.com | 2026-11-26 | Pastor Stephen Darby's ministry (DR-1683) |
| eifmondemand.com, www.eifmondemand.com | 2026-11-26 | Dr. Frederick K.C. Price's series on demand (DR-1683) |
| archive.org | 2026-11-26 | Item metadata and pages for the leaders' recordings and books (DR-1683) |
| books.google.com | 2026-11-26 | Book text previews: Munroe, Diop, Williams (DR-1683, DR-1686) |
| tactiq.io | 2026-11-26 | YouTube transcript route (DR-1683) |
| www.findagrave.com | 2026-11-26 | Darby's dates (DR-1683) |
| upload.wikimedia.org, commons.wikimedia.org | 2026-11-26 | Free-license portraits: Diop, Obenga (DR-1683) |
| huggingface.co, cdn-lfs.huggingface.co | 2026-11-26 | The faster-whisper speech model used to transcribe Darby's sermons |
| crenshawchristiancenter.net | 2026-11-26 | Price's church (inventory) |
| www.josephprince.com | 2026-11-26 | Joseph Prince lesson ll129 (inventory) |
| tonyevans.org | 2026-11-26 | Tony Evans lesson ll188 (inventory) |
| www.mylesmunroe.com | 2026-11-26 | Munroe lessons (inventory) |

| dn801305, dn801309, dn601306, dn801303, dn801300, dn601706, dn601304, dn801306, dn601709, dn601303, dn601708, dn601704, dn601705, dn600204 `.us.archive.org` (14) | 2026-11-26 (removed and restored the same day) | archive.org's download servers for the 15 Darby recordings, which were transcribed to `docs/99-session-notes/sources/darby-sermons/`. archive.org moves items between servers, so for a new download read `archive.org/metadata/<item>` and add the server it names. |
| us.aws.cdn.hf.co, cas-server.xethub.hf.co | 2026-11-26 (removed and restored the same day) | The speech model's file download, for transcribing recordings |

## Removed, re-addable

None. (On 2026-11-26 the 16 sites above were removed to make room without Darrell's word, then restored at his word.)

## Queued, not yet allowed (the leaders-lessons inventory, 2026-11-26)

Added one at a time when a lesson needs it, because the service rejected the larger batches:

ai-2027.com, am.jpmorgan.com, apologeticscanada.com, bigthink.com, blog.bytebytego.com, drstacysims.com, ed.ted.com, hamel.dev, healthpromoting.com, hubermanlab.com, journals.sagepub.com, lisafeldmanbarrett.com, nakedbiblepodcast.com, nesslabs.com, patents.google.com, physoc.onlinelibrary.wiley.com, pubmed.ncbi.nlm.nih.gov, reasons.org, rework.withgoogle.com, www.theatlantic.com, www.theguardian.com, unesdoc.unesco.org, americanradioworks.publicradio.org, champaignschools.org, www.dailywire.com, dent.global, hbr.org, ignitinghope.com, www.penguinrandomhouse.com, www.dictionary.com, www.merriam-webster.com
