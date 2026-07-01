# Consent + Provenance -- Christian (COLG choir keyboardist) as a choir SME source

**SME:** Christian, the keyboardist for The Church of the Living God (COLG) choir.

**What this is:** Christian records videos explaining and teaching the CHOIR section --
how he plays songs, keys, arrangements, technique on the keys, and how he leads/cues
the choir. These are an authorized **knowledge source** for the COLG choir. The local
pipeline on this NAS transcribes them and extracts structured choir knowledge that
enriches the choir songs in the app.

**Consent basis:** Christian is the recorded SME, voluntarily making explainer videos
for the COLG choir. Attested by Darrell, 2026-06-24. *(Darrell to confirm the exact
wording / any limits Christian wants on use.)*

**Scope (binding):**
- Owner/choir only. Extracted knowledge surfaces inside the Choir section, governed by
  the existing choir RLS (`user_in_choir` reads; director/owner writes). Never public.
- Faithful extraction only -- his stated musical detail (keys, arrangements, technique)
  is captured as-is; the pipeline does NOT invent keys/chords he did not say.
- His expertise is attributed to him when it surfaces (sourced to "Christian,
  keyboardist"), honoring the work as his.
- Sovereign + local: videos and transcripts stay on the NAS. Nothing is uploaded to an
  external cloud or used to train any third-party model (DATA-AS-EMPOWERMENT).

**Data handling:** raw videos live in this intake folder; per-run outputs (transcript,
knowledge.md, knowledge.json, source.json) live under `output/choir-keyboardist/`. All
on the NAS. Exportable and deletable on request.
