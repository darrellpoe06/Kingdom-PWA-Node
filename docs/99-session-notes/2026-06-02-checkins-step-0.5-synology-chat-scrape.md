# 2026-06-02 -- Step 0.5 Synology Chat UI scrape added to the four daily check-ins

## Why (the miss that triggered this)

The 2:00pm afternoon check-in reported "wf08 last fired May 29 -- quiet stretch -- 0 family voices."
That was WRONG. Darrell had actually posted four @nas messages in #PoeTech-PWA between
12:21pm and 1:36pm CDT that same day.

Root cause: the check-ins' Step 0 reads n8n executions ONLY
(`http://192.168.1.26:5678/workflow/b99N4hlBrsJTaxn9/executions` for wf08, etc.). Because
wf08's capture bind mount is broken, n8n executions stay SILENT even while Synology Chat IS
receiving messages. So the n8n-executions scan is blind to live family voices.

Verified workaround: the Synology Chat browser UI does surface the posts. Searching
`from:dpoe` in Synology Chat (`https://192.168.1.26:5001/?launchApp=SYNO.SDS.Chat.Application`)
instantly returned all of Darrell's posts for the day.

## The fix

Added a **STEP 0.5 (Synology Chat UI scrape)** block, immediately after Step 0, to the four
family-voice check-in prompts. The block:

1. Grabs an MCP tab (`tabs_context_mcp`, `createIfEmpty: true`).
2. Navigates to `https://192.168.1.26:5001/?launchApp=SYNO.SDS.Chat.Application`.
3. Waits 4s, clicks the search bar, types `from:dpoe` (rotates through cpoe / christiana /
   christian / christyn), presses Return.
4. Reads the results panel for any message dated TODAY; captures timestamp + sender + text.
5. FALLBACK when the auth'd cookie / query-string filter blocks the search bar: use
   `mcp__Claude_in_Chrome__find` with query
   "most recent message from dpoe in PoeTech-PWA channel today" (the find tool worked when
   JS-context queries were blocked).
6. Any family-voice message dated today takes PRIORITY and is surfaced at the very top of the
   proactive update. The prompt now forbids reporting "0 family voices" / "quiet stretch"
   unless BOTH Step 0 and Step 0.5 came back empty.

Cadence was NOT changed. Nothing else in the prompts was changed.

## Files updated (the live prompt store)

The scheduled tasks are file-based; the runner reads each task's `filePath` SKILL.md at fire
time. Step 0.5 was inserted into:

| Task ID                     | Cron        | SKILL.md                                                          |
|-----------------------------|-------------|------------------------------------------------------------------|
| `poetech-daily-app-review`  | `0 7 * * *` | `C:\Users\dpoe\Claude\Scheduled\poetech-daily-app-review\SKILL.md`  |
| `poetech-midmorning-checkin`| `0 11 * * *`| `C:\Users\dpoe\Claude\Scheduled\poetech-midmorning-checkin\SKILL.md`|
| `poetech-afternoon-checkin` | `0 14 * * *`| `C:\Users\dpoe\Claude\Scheduled\poetech-afternoon-checkin\SKILL.md` |
| `poetech-endofday-checkin`  | `0 17 * * *`| `C:\Users\dpoe\Claude\Scheduled\poetech-endofday-checkin\SKILL.md`  |

Store of record:
`C:\Users\dpoe\AppData\Roaming\Claude\local-agent-mode-sessions\fbc038c6-aa86-4614-805f-5cb564c7c603\c3bc5726-cc11-46b8-ae30-46ea74edec89\scheduled-tasks.json`

## Deviation from the request (surfaced, not silently changed)

The request named "five `poetech-*-checkin`" tasks. In reality the store holds five poetech
tasks but only FOUR are family-voice check-ins with a Step 0 scan + a SendUserMessage. The
fifth, `poetech-hourly-snapshot` (`0 * * * *`), is silent durability infrastructure: it has no
Step 0, does not scan for family voices, and explicitly sends NO chat message (its output is a
session-snapshot file). A chat-UI scrape there would have no consumer, so Step 0.5 was NOT
added to it. If real-time family-voice awareness is wanted on the hourly cadence too, that is a
separate decision -- flag it and it can be added.

Also note: `mcp__scheduled-tasks__list_scheduled_tasks` returned empty in the editing session
-- the live runner (`local_ditto_c3bc5726...`) reads prompts from the `filePath` SKILL.md
files directly, so editing those files is the authoritative update. `update_scheduled_task`
was not used because it would only touch a disconnected/empty store.
