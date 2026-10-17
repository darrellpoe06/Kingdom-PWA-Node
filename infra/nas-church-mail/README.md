# nas-church-mail — the church office's emails become the app's documents (DR-1091)

Plain deterministic **Python on the NAS** (stdlib only, no LLM). Each
15-minute services-sync cycle runs one braked pass that reads the church
office's emails (`bg@thechurchofthelivinggod.com`) from the church mailbox over
IMAP, **read-only**. In each pass:

| The email is | What happens |
|---|---|
| a team document (order of service, announcements, calendar) with no row | **filed**: the file at the PC import script's own path, then its row on Choir → Team Docs |
| a team document whose row exists but whose file is not on the church server | **refilled** at the exact path the row already names |
| a PROCLAIM sermon document whose row exists but whose file is missing | **refilled** at the row's path |
| anything else | left alone |

So the files the 2026-08-19 move left on the old hosted server come back from
their **original source**, with no hosted key. Each new week's email then
lands without anyone running `scripts/sermon-import/import-team.mjs` from a PC.

## Brakes (DR-0248, deterministic class)
- **Budget:** 25 messages and 360 s per pass, inside services-sync's 480 s installer ceiling.
- **Lock:** a single-flight PID lock. A second pass skips.
- **Progress:** saved after every message (UIDVALIDITY plus the last UID), so a budget cut resumes where it stopped.
- **Repeated failure:** a message that fails 3 times is set aside with its reason. The pass exits 3, so the cycle goes red (reel + ntfy). It never loops quietly.
- **Stop-path:** set `"enabled": false` for `church-mail` in `infra/nas-loops/services.json`.

## The one step that is Darrell's
The mailbox password is a value only Darrell holds. It sits on his PC at
`C:\Users\dpoe\.poetech-secrets\gmail-mrspoe06.txt`, and the PC import
scripts already read it there. One line places it, after checking it against
Gmail. A refused value writes nothing.

```
cd C:\Users\dpoe\Kingdom-PWA-Node
Get-Content -Raw C:\Users\dpoe\.poetech-secrets\gmail-mrspoe06.txt | ssh dpoe@192.168.1.26 "bash /volume1/PoeTech/repos/Kingdom-PWA-Node/infra/nas-church-mail/place_church_mail_key.sh"
```

Until then, the reader says so each cycle and exits 0.

## Prove it
```
python3 infra/nas-church-mail/church_mail.py --selftest
python3 infra/nas-church-mail/church_mail.py --once --dry-run
```
`test_church_mail.py` runs in CI. It pins path parity against values produced by the
PC script's own JavaScript, file / refill / leave-alone, both budgets, and the
set-aside.
