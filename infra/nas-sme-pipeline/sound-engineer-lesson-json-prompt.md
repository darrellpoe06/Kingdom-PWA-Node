You are turning the COLG sound engineer's spoken instruction (the TRANSCRIPT below)
into STRUCTURED LESSON DATA that drops straight into the PoeTech Learn engine's module
shape, to ENRICH the "Running the Board: Live Sound for the House of God" training
track. Faithful extraction only -- this is a real person's expertise.

Below is a TRANSCRIPT of the sound engineer teaching live sound for worship.

Produce a SINGLE JSON object EXACTLY in this schema (no prose, no markdown fences):

{
  "course": { "teacher": "COLG sound engineer", "title": "Running the Board: Live Sound for the House of God" },
  "modules": [
    {
      "id": "snd-xx-short-slug",
      "title": "string",
      "bigIdea": "one-sentence takeaway in his words",
      "lesson": "the teaching text -- his substance, faithful, no invented numbers",
      "levels": { "teen": "plainer/encouraging version", "senior": "deeper why + edge cases" },
      "media": [ { "type": "video", "title": "the demo this came from", "status": "pending-capture" } ],
      "settings": { "console": "if named", "channel": "if named", "values": [ "gain/EQ/level values he STATED, verbatim" ] },
      "quiz": { "questions": [ { "q": "string", "options": ["a","b","c"], "answer": 0, "explain": "string" } ] },
      "anchor": { "ref": "1 Corinthians 14:40", "theme": "decently and in order -- clarity serves the gathering" },
      "source_quote": "a direct quote anchoring the lesson (faithfulness check)",
      "confidence": "high|med|low"
    }
  ],
  "unclear": [ "gaps to confirm with the engineer" ]
}

RULES (binding):
- Capture ONLY what he says. Any setting, frequency, gain, or channel goes in "settings.values"
  ONLY if he stated it; otherwise omit it. NEVER invent a number.
- Anything ambiguous goes in "unclear" -- never guessed into a field. Set "confidence":"low"
  for anything shaky.
- "levels.teen" and "levels.senior" rephrase HIS content at two experience levels; they do
  NOT add new technique he didn't teach.
- The "anchor" should fit the topic from worship-music / order-of-service passages
  (e.g., 1 Corinthians 14:40 "decently and in order"; 1 Chronicles 15:22 / Psalm 33:3
  "skillful"; Colossians 3:23 "work heartily as for the Lord"). Reference + a plain theme
  gloss ONLY -- never a quoted Bible translation.
- SAFETY: if he describes any A.I./auto assist, the lesson must frame it as ASSISTIVE
  (it suggests; the operator decides). Never describe the A.I. changing the live mix itself.
- Output VALID JSON only. No commentary before or after.
