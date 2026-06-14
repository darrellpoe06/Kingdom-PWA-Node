# Sermon / church-document importer (local tool)

Reads BG's documents from Christina's Gmail (`mrspoe06@gmail.com`) and files them
into Supabase. **Local-only**; not part of the app build. Reads secrets from
`C:\Users\dpoe\.poetech-secrets\` (never committed):
- `gmail-mrspoe06.txt`  -> `mrspoe06@gmail.com=<16-char app password>`
- `supabase-service.txt` -> Supabase `service_role` key

## Setup
    npm install

## Scripts
- `node discover.mjs`     - list recent BG emails + attachment formats (read-only)
- `node classify.mjs`     - 3-way split of all BG mail: sermon (PROCLAIM, admin) /
                            team (order-of-service, announcements / choir) / skip
- `node dryrun.mjs`       - parse PROCLAIM sermons, no writes
- `node import.mjs [N|all]` - import sermons: download .docx -> Supabase Storage
                            (bucket `sermon-documents`, private) -> match by date
                            to choir_sermons -> attach choir_sermon_documents
                            (owner/admin-only). Default N=3 (safe test).

Sermons (PROCLAIM) are owner/admin-only. Private church business (finance,
compensation, minutes, personal) is never imported. Metadata + documents only;
no email bodies are stored.
