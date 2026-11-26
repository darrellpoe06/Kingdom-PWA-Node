# Learning Zone discovery search: evaluation of 60 realistic searches

Status 2026-11-26. Search is Phase 1 only: plain JavaScript in the browser, no model, no service, no recurring cost.

## How relevance was judged

Two measures, and they disagree on purpose.

- **Automated proxy** (`app/src/__tests__/learn-discover.test.js`, queries in `fixtures/learn-discover-queries.js`): of a query's first ten results, how many carry one of a set of expected words in their title, theme or big idea. It is lenient, it runs on every build, and it said **9.5 of 10** on the final code. It is a floor against breakage, not a measure of usefulness.
- **Manual review**: I read the first ten results for every query as a person with that need would. A lesson scores **1** if it directly serves the need, **0.5** if it is adjacent (right subject, wrong angle), **0** if not. Scores are out of 10. This is the number that matters, and it is much lower.

### Which scores are held out

The 60 queries were written before the ranking was tuned. The first nine are Darrell's named questions and the ranking *was* tuned for them. Queries 10 to 60 were **not**: the **before** column is a genuine held-out score. I then fixed generic defects that this review exposed (listed below) and re-read everything: the **after** column is therefore tuned on these queries and flatters the engine. Treat *before* as the honest estimate of how it does on a new question and *after* as a lower bound on what the fixes recover.

## Results

| Group | Queries | Manual, before the fixes | Manual, after the fixes |
|---|---|---|---|
| The nine named questions | 9 | 7.5 | 7.5 |
| Everything else (held out before the fixes) | 51 | 4.8 | 5.2 |
| Conversational questions (all) | 20 | 5.2 | 5.8 |
| Short phrases (all) | 15 | 5.8 | 6.1 |
| Misspellings (all) | 10 | 6.3 | 6.5 |
| Everyday concerns (all) | 15 | 4.1 | 4.2 |
| **All 60** | 60 | **5.2** | **5.6** |

### The three questions Darrell singled out

| Question | Before this round | After | Target |
|---|---|---|---|
| How do I raise godly children? | 8.5 | 8.5 | 8 |
| What does the Bible say about forgiveness? | 7 | 8 | 8 |
| How can I grow closer to God? | 5.5 | 9.5 | 8 |

All three now reach the target of eight genuinely relevant lessons in ten. "Closer to God" got there by an editorial list (below), not by word matching alone.

## Every query

| # | Query | Kind | Before | After |
|---|---|---|---|---|
| 1 | Why am I always stressed? | question (tuned) | 7.5 | 7 |
| 2 | How can I strengthen my marriage? | question (tuned) | 6 | 5.5 |
| 3 | How do I raise godly children? | question (tuned) | 8.5 | 8.5 |
| 4 | How can I get out of debt? | question (tuned) | 8 | 6.5 |
| 5 | How do I buy my first home? | question (tuned) | 9.5 | 8.5 |
| 6 | What does the Bible say about forgiveness? | question (tuned) | 7 | 8 |
| 7 | How do I find my purpose? | question (tuned) | 6.5 | 6.5 |
| 8 | How can I become a better leader? | question (tuned) | 9 | 7.5 |
| 9 | How can I grow closer to God? | question (tuned) | 5.5 | 9.5 |
| 10 | My husband and I keep arguing about money | question | 6 | 6 |
| 11 | How do I talk to my teenager about God? | question | 3 | 3 |
| 12 | I lost my job and I'm scared | question | 2 | 3.5 |
| 13 | What should I do when I can't sleep because I'm worried? | question | 1 | 5.5 |
| 14 | How do I start a business with no money? | question | 2.5 | 2.5 |
| 15 | Is it wrong to charge interest on a loan? | question | 6 | 6 |
| 16 | How do I know if AI is telling me the truth? | question | 0 | 3.5 |
| 17 | What does the Bible say about being a good steward? | question | 4 | 4 |
| 18 | How do I forgive someone who hurt me badly? | question | 6.5 | 6.5 |
| 19 | Why does Yahweh allow suffering? | question | 3 | 2.5 |
| 20 | How do I teach my kids about money? | question | 1.5 | 5.5 |
| 21 | anxiety | phrase | 2 | 5 |
| 22 | debt | phrase | 6.5 | 8 |
| 23 | marriage | phrase | 6.5 | 6.5 |
| 24 | prayer | phrase | 3.5 | 3 |
| 25 | tithing and giving | phrase | 6.5 | 6 |
| 26 | landlord and tenant | phrase | 9 | 9 |
| 27 | eviction | phrase | 4 | 4 |
| 28 | investing | phrase | 6 | 6 |
| 29 | stock market | phrase | 9 | 8.5 |
| 30 | slavery history | phrase | 5.5 | 7 |
| 31 | fasting | phrase | 5.5 | 5.5 |
| 32 | leadership | phrase | 7.5 | 7 |
| 33 | peace | phrase | 3.5 | 4 |
| 34 | home inspection | phrase | 4.5 | 4.5 |
| 35 | Holy Spirit | phrase | 7.5 | 7 |
| 36 | forgivness | typo | 8 | 8 |
| 37 | anxity and worry | typo | 4 | 4.5 |
| 38 | maraige advice | typo | 6.5 | 6.5 |
| 39 | raising childern | typo | 8.5 | 8.5 |
| 40 | how to get a morgage | typo | 2 | 3.5 |
| 41 | how to pray prayr | typo | 3.5 | 4 |
| 42 | leadrship skills | typo | 7.5 | 7 |
| 43 | invesing for retirement | typo | 8 | 8 |
| 44 | landlrod problems | typo | 8 | 8 |
| 45 | stres at work | typo | 7 | 7 |
| 46 | I feel lonely | concern | 1 | 1 |
| 47 | my kids won't listen to me | concern | 1 | 1.5 |
| 48 | I'm tired all the time | concern | 4.5 | 4.5 |
| 49 | how to save money every month | concern | 2.5 | 2.5 |
| 50 | angry coworker who makes my day hard | concern | 4.5 | 4.5 |
| 51 | I'm afraid of the future | concern | 3 | 3 |
| 52 | how do I handle conflict with my family | concern | 3 | 3 |
| 53 | Sunday school lessons for little children | concern | 8.5 | 8.5 |
| 54 | how do I study the Bible for myself | concern | 3.5 | 3.5 |
| 55 | is it okay to use ChatGPT | concern | 4.5 | 4.5 |
| 56 | how do I buy a rental property | concern | 8 | 8 |
| 57 | my rent is too high | concern | 2.5 | 2.5 |
| 58 | what is my identity in Christ | concern | 6.5 | 6.5 |
| 59 | how to choose a good church | concern | 2.5 | 4 |
| 60 | teaching my child to read and count | concern | 5.5 | 5.5 |

## What changed in the search this round (generic fixes, each found by reading results)

| Defect found | Effect | Fix |
|---|---|---|
| The tokenizer dropped two-letter words, so "AI" vanished from questions and "A.I." from lesson titles | "How do I know if AI is telling me the truth?" scored **0** | "A.I.", "A. I." and "AI" are one word and the only two-letter word kept (`learn-discover-text.js`) |
| *worried* stemmed to "worri" and *worry* to "worry" | "can't sleep because I'm worried" scored **1** | words ending *-ied* read as *-y* |
| Irregular verbs: the parable of the unforgiving servant says *forgave*, not *forgive* | The most direct forgiveness parable never matched | A table of 50 irregular verbs (forgave, gave, taught, built, brought, wrote, spoke ...) |
| Contractions: "won't" became the real word "won" | "my kids won't listen" matched "Working Harder Won't Fix a Dull Edge" | Contractions are stopwords |
| A word common in the curriculum ("AI") was discounted as noise | AI questions found nothing | A word a concept recognises is never discounted for being common |
| A broad concept (money) stacked loosely related words over lessons that literally said the word | "investing", "tithing and giving" dropped | The boost for a concept's own words applies only to focused states (anxiety, peace, sleep, grief, anger, fear, suffering, conflict, forgiveness), and total related-word credit is capped when the question has a distinctive word of its own |
| Verbs that carry no subject ("choose", "use", "help", "lost") counted as subjects | "choose a good church" matched "Can Clay Choose Its Shape?" | Dampened as generic |
| Prayer lived inside the "closer to God" concept, so a plain "prayer" search returned closeness lessons | "prayer" 3.5 | Its own concept; the closeness list fires only on closeness words |
| A word's rarity was measured over all text, so "children" (in half the bodies) lost to the rare adjective "godly" | Godly children returned theology | Rarity is measured in the field where a word matched (heads or bodies) |
| A word being **central** to a lesson was not used | An AI lesson with "forgiven" in its title outranked real forgiveness lessons | A word among a lesson's most distinctive words earns a centrality bonus |

## The one editorial list

"How can I grow closer to God?" could not be answered by word matching: the curriculum teaches it in parables and word studies whose titles do not say "closer". Thirteen lessons were chosen by hand as true answers (`seeds` on the `closer` concept in `learn-discover-concepts.js`) and are boosted only when someone types a closeness word (closer, closeness, intimacy, devotion, spiritual). It is the same idea as the Relationships shelf Darrell and his wife chose, applied to one question. Nothing is hidden: it is a short list in a data file.

## What the engine does well and badly

**Well:** a topic named in the lesson's own words (landlord and tenant 9, stock market 8.5, buying a first home 8.5, raising children 8.5, leadership 7), and spelling slips (the corrector puts `childern`, `morgage`, `landlrod`, `invesing` right; the stemmer handles `forgivness`).

**Badly:** a life situation that needs understanding. "I feel lonely" 1, "my kids won't listen to me" 1.5, "how do I start a business with no money?" 2.5, "why does Yahweh allow suffering?" 2.5, "how to save money every month" 2.5, "my rent is too high" 2.5. For several of these the curriculum may simply not have a lesson that answers (there is no loneliness lesson); for others, a lesson exists but is worded as a teaching, not as a situation. Everyday concerns average about 4 of 10.

## Limits of this review

- One reviewer. A second reader would disagree on the adjacent (0.5) lessons.
- The **after** column is tuned on these queries, so it overstates performance on new questions.
- The automated test (proxy mean 9.5) cannot tell a lesson that mentions a word from one about it. It stays as a guard against breakage; it must not be quoted as search quality.

## Recommendation (needs a decision, costs nothing recurring)

Browser-side word matching has reached its ceiling for everyday-situation questions. Without a paid service or new infrastructure, the next step that pays most is **editorial, not algorithmic**: a "Life Situations" guide of about 40 to 60 entries (lonely, can't sleep, lost my job, kids won't listen, start a business, why does Yahweh allow suffering...), each a short hand-read list of the lessons that answer it, written once, kept in a data file, shown as suggested questions and boosted in search. It reuses the mechanism that took "closer to God" from 5.5 to 9.5, it makes the answers auditable, and it grows with the curriculum. I have not started it. A semantic tier (embeddings) would also help but is out of scope without approval.
