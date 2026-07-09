# client-discovery-json-prompt — recorded discovery → requirements.json

**The handoff contract for the client-business factory's recorded-discovery
lane (DR-0117 / DR-0114 step 1).** A prospective client's imported voice notes
— or the transcript of a full conversation they had with our LLM (or a vendor
LLM) — are the DISCOVERY. Darrell does not need to schedule a call: the
recording is the client talking, this prompt extracts what they said, a steward
reviews the extraction, and the MVP is built from the reviewed requirements.
Revisions after delivery ride the app's Feedback tab; a live conversation
happens only when that isn't enough.

Consumer: `app/src/lib/client-engagements.js` → `parseDiscoveryJson()`.
Sibling contracts: `choir-knowledge-json-prompt` family (same faithfulness
rules; same source_quote discipline).

## The prompt (paste above the transcript)

You are extracting business requirements from a recorded conversation with a
prospective client of PoeTech (a platform that builds branded business systems
for small businesses). The transcript below is the client describing their
business in their own words.

Return ONLY valid JSON in exactly this shape:

```json
{
  "client": { "name": "…", "business": "…" },
  "requirements": [
    { "area": "orders|classes|inventory|money|front-door|other",
      "requirement": "one buildable requirement, stated plainly",
      "confidence": "high|med|low",
      "source_quote": "the client's exact words this came from" }
  ],
  "pricing": [
    { "item": "what they charge for", "amount_text": "their words for the amount", "source_quote": "…" }
  ],
  "policies": [
    { "policy": "a rule they run their business by", "source_quote": "…" }
  ],
  "channels": ["where their customers come from"],
  "pain_points": [
    { "pain": "what is costing them time/money/orders today", "source_quote": "…" }
  ],
  "unclear": ["anything a steward must ask the client before building"]
}
```

## Faithfulness rules (binding — Verification Doctrine)

1. **Their words are senior.** Every requirement, price, policy, and pain point
   carries a `source_quote` — the client's actual words from the transcript.
   No quote, no claim.
2. **Never invent.** A thing the client did not say is not in the output. A
   field you cannot fill stays out (the parser nulls it); do NOT guess a price,
   a policy, or a channel to make the JSON look complete.
3. **Uncertainty goes to `unclear`, not into a requirement.** If the client was
   ambiguous ("maybe shipping? I don't know"), that is an `unclear` entry a
   steward asks about — never a low-confidence requirement dressed as fact.
4. **Confidence is about transcription/attribution**, not your opinion of the
   business: `high` = they said it plainly; `med` = said once, in passing;
   `low` = implied or partially audible.
5. **Nothing here is a commitment.** Extraction does not quote a build price
   and does not promise features — the build quote is the governor's hand and
   work starts only after the deposit clears (`client-engagements.js` gate).

## The lane around this prompt

recording imported (voice note / LLM conversation) → transcribed (Whisper on
the NAS, the existing SME-pipeline rails) → THIS PROMPT extracts
requirements.json → `parseDiscoveryJson()` imports every item as
`status='extracted'` → a steward reviews (confirm / fix / archive) → the MVP
spec reads REVIEWED requirements only → quote + deposit gate → build.
