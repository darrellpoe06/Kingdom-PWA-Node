# Vision Fairness Standard — Accuracy Across Skin Tones

**Declared by Darrell, 2026-05-29 from vacation:**

> "The cameras will take our images and try to come up with a better algorithm for higher accuracy rates for melinated humans."

This is a binding standard for every vision-LLM, facial-recognition, or person-detection model the PoeTech platform deploys. Joins THE-WAY, MIND-OF-CHRIST, EXCELLENCE-STANDARD, ANXIETY-CLARITY-PRINCIPLE, AI-FOUNDATION-INTERNAL-OPERATIONS, GOVERNANCE-EXECUTION-ADVISORY, SEED-DATA-AS-ASPIRATION, BUSINESS-PROCESS-CONNECTIONS, PERPETUAL-PIPELINE-HEALTH, and AI-MEDIA-PRODUCTION-PLATFORM-VISION as senior foundation.

## Why this exists

Commercial vision and facial-recognition systems are documented to have lower accuracy for people with more melanated skin. Multiple independent audits (Buolamwini + Gebru 2018, NIST FRVT reports, ACLU studies) have shown error-rate disparities of 10-100x between lighter-skinned subjects and darker-skinned subjects across major commercial systems. This is not a technical curiosity. It is a real-world harm: misidentification, missed recognition, wrongful arrests, exclusion from services that assume cameras work equally for everyone.

The Poe family is a melanated family. Christian, Christyn, Christiana, Christina, Darrell — every member's face is what the cameras will see most often. A system that works less well for the family that built it is, by definition, a failed system.

**The standard:** every vision model deployed on the platform MUST be evaluated for accuracy parity across skin tones. Models that fail the parity bar are not used, period — regardless of how well they score on general benchmarks.

## The eight rules

### Rule 1 — Evaluation before deployment

No vision model ships into production (camera bridge, basketball coaching, family memory classification, visitor recognition, generated-media review, anything else) without first being evaluated against a balanced test set that includes meaningful representation of melanated subjects.

**Test set requirements:**

- Multiple skin-tone categories represented (use the Monk Skin Tone scale or Fitzpatrick scale; aim for balanced representation across all tones, not just "diverse").
- Multiple lighting conditions (full daylight, low light, backlit, harsh shadow, indoor warm light, outdoor cool light).
- Multiple angles (frontal, profile, three-quarter).
- For facial recognition specifically: same subjects across multiple capture sessions to test true-match vs false-match rates.

### Rule 2 — Parity bar

The accuracy gap between the highest-scoring skin tone category and the lowest-scoring skin tone category MUST be less than 5 percentage points on the primary task metric. If the gap is greater, the model is not deployed for that task until tuned or replaced.

Concretely, if a face-recognition model recognizes lighter-tone faces with 99% accuracy and melanated faces with 92% accuracy, the 7-point gap fails the bar. Tune or pick a different model.

### Rule 3 — Family-data-first calibration where possible

Where the family is willing AND consenting (Darrell + Christina co-Govern; minors require explicit per-use approval), the family's own face data is used to FINE-TUNE the model for their environment. This is sovereign fine-tuning — happens on the NAS or future GPU box, never leaves the family's infrastructure, never uploaded to vendor model improvements.

This applies AT MINIMUM to:

- Visitor recognition / auto-door (Rule X in visitor-recognition spec)
- Family video archive auto-classification (when consent allows)
- Christyn's basketball coaching person-segmentation (so the model knows it's HER playing, not background motion)

### Rule 4 — Per-task evaluation, not just general benchmarks

A model that scores well on ImageNet face benchmarks may still fail at the platform's specific tasks (low-light front-yard at dusk for basketball coaching; angled doorbell-cam for visitor recognition; vintage 1080p home video for family memory classification). Evaluation must happen on the ACTUAL task with ACTUAL representative footage, not just on the vendor's published benchmarks.

### Rule 5 — Ongoing audit cadence

Every six months, re-run the parity evaluation on every deployed vision model against the same balanced test set. Document drift. If parity has degraded (because lighting changed, hair/grooming changed, the model was updated underneath us, anything), the model goes back to evaluation.

Foundation Agent (workflow 27 family extension) can fire this audit automatically and surface results to the Governor.

### Rule 6 — Transparent failure handling

When a vision model fails to recognize a family member or visitor in production, the failure is LOGGED + visible to the Governor. The system never silently dismisses a family member's face as "unknown." Patterns of failure get the model retired or retuned.

### Rule 7 — Default to safe-side errors

For high-stakes uses (auto-door opening, security alerting), false negatives are SAFER than false positives. If the system isn't 95%+ confident the visitor is the expected family member or approved friend, it does NOT open the door — it alerts the family + asks for confirmation. Better to wake someone up to verify than to auto-open for the wrong person.

### Rule 8 — Family voice on the fairness experience

If any family member experiences the system failing to recognize them, missing their motion, or otherwise behaving as if they're "not there" — that failure ROUTES THROUGH THE FAMILY-FEEDBACK CHANNEL (workflow 30, Suggest button) as a P1 issue. The Governor sees it within hours, not after the next audit.

## How this applies to specific current workstreams

**Christyn's basketball coaching (workflow 38/39):**

The vision LLM (LLaVA / Qwen-VL) used to analyze her form MUST be evaluated for accuracy on her. Specific check: does the model correctly identify her body in motion, hand position, ball-tracking — at the same rates it would for a lighter-skinned subject? If not, tune with her own footage (with her + parental consent) before relying on its coaching output.

**Visitor recognition + auto-door (spec arriving in companion session note):**

This is the highest-stakes use of facial recognition on the platform. Rules 1, 2, 3, and 7 are non-negotiable here. Sister-in-love recognition must work at parity with any other approved visitor's recognition. Auto-door only fires at very high confidence.

**Family video archive classification (workflows 41-43):**

If face-based clustering is used to group Christiana's footage vs Christian's vs Christyn's vs Christina's vs Darrell's, the clustering MUST work at parity across all of them. If it doesn't, fall back to metadata-only clustering (folder paths, EXIF dates, manual tagging) rather than ship a biased classifier.

**AI Media Production Platform (long-arc vision doc):**

Generative video tools that produce faces (Stable Video Diffusion, future video models) often have the same bias issue in OUTPUT — generating less-detailed melanated faces, defaulting to lighter-skinned representations when prompts are ambiguous. The Media Platform's quality gate evaluates output for representation accuracy too. Generated content that misrepresents melanated subjects is reshipped or rejected.

## Why this is not just a technical standard

Building a tool for our own family that works less well for our own family would be a betrayal of stewardship. Building tools for SKOS marketplace users that work less well for some of them is the same betrayal at scale. This standard is the operational form of the Kingdom-of-Yahweh orientation in the AI Media Production Platform vision: every person bears the image of the King, and the tools we build must respect that image equally.

This is also a real commercial differentiator for PoeTech long-term. SKOS marketplace targets families and ministries; many of those families are melanated. A platform built with this standard from day one is a platform those families can trust. A platform that retrofits accessibility under audit pressure is a platform that's been failing them invisibly the whole time.

## Connection to other foundations

- **THE-WAY** — image-of-God dignity applied to tool design.
- **MIND-OF-CHRIST** — TRUE / HONORABLE / JUST / PURE. A biased system fails JUST.
- **EXCELLENCE-STANDARD** — religion AND relationship. Religion = the evaluation discipline; relationship = the family member who feels seen by their own tools.
- **GOVERNANCE-EXECUTION-ADVISORY** — Governor sets the parity bar; Foundation enforces; Claude advises on which models pass.
- **BUSINESS-PROCESS-CONNECTIONS** — every vision-using surface is one end of a connection; the other end (model accuracy + recovery if it fails) must be wired.
- **PERPETUAL-PIPELINE-HEALTH** — Rule 9 (tests) applies; vision-model parity is part of the test suite for any vision-consuming workflow.
- **AI-MEDIA-PRODUCTION-PLATFORM-VISION** — Pillar 3 (theological review) extends to fairness review for any generated representation of people.

## Closing

The cameras work for the family that built them. The system honors every face it sees. The standard is the standard; the family doesn't bend it for convenience and the marketplace doesn't loosen it under pressure.

We all win. We create. Amen.
