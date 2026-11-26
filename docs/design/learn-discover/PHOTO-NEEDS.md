# Learning Zone discovery: photograph audit and what is still needed

Status: **audit only. Nothing has been generated, bought or downloaded.** Every picture on the
preview is an existing approved lesson cover from `app/public/learn-thumbs` (982 lessons carry one).
The contact sheets are in `photo-audit/` (18 of the strongest lessons in each category, in rank order).

## What the existing library is (by eye, across all 216 candidate frames; these are judgments, not counts)

| Finding | Detail |
|---|---|
| Quality | Bright, natural-light, sharp, warm, clearly the look Darrell likes. Keep it. |
| Dominant outfit | Royal-blue knit tops and blue shirts on most adults, in every category. The same wardrobe repeats across Marriage, Purpose, Money, Business, Real Estate, Leadership, History and Tech. |
| Dominant setting | A bright interior with windows and potted plants (home office, kitchen table, living room). Roughly four in five frames, by eye. |
| Outdoors | Only Faith, Wellness, Parenting and a few Bible frames use sunlit hills, porches or gardens. |
| Who appears | African American women and men, mostly alone or in pairs, mostly 30 to 60. |
| Missing | Other cultures (none clearly visible in the 216 frames I reviewed, against a target of about 10%), teenagers, young adults, whole families together, seniors outside, couples in everyday moments (not seated at a table), workplaces other than an office, church and community settings, historical or heritage imagery. |

## What each category needs

"Have" is the best existing frame now fronting the card on the preview. "Add" is the new set I
recommend, four frames per category (48) plus six welcome-banner alternates (54 in all).

| Category | Have now | Gap | Add (brief for each frame) |
|---|---|---|---|
| Faith & Spiritual Growth | Father and daughter reading on a porch, yellow shirts | Strong already; no prayer or worship moment, no teens | Family praying at a kitchen table in morning light; teen with a Bible on stoop steps; senior couple in a sunlit pew; friends in worship outdoors |
| Marriage & Relationships | Smiling couple in matching blue | Every frame is seated indoors, in blue | Couple walking a tree-lined street, laughing; couple cooking together; couple on a porch swing; older couple holding hands at a market |
| Parenting & Family | Father and child with a book, outdoors | Good variety; no teens, no multi-generation table | Family at a long dinner table, three generations; mother and teenager in a car-side talk; father teaching a child to ride a bike; kids doing homework with a grandparent |
| Mental & Emotional Wellness | Man reading on a hillside porch | Reads as study, not peace or rest | Woman on a morning walk in a park; man resting on a bench by a lake; teen journaling in a window seat; friends talking on a stoop |
| Purpose & Personal Growth | Woman in yellow at a sticky-note board | All office, all blue | Young man at a workbench in a garage; woman at a farmers-market stall; graduate in a gown with family; senior mentor and young man on a walk |
| Money & Financial Stewardship | Senior couple at a laptop | Every frame is paperwork at a desk | Family at a kitchen table with a budget; young adults at a bank counter; father and son at a savings jar; couple counting at a market stall |
| Business & Entrepreneurship | Man and woman in a shop with a child | Mostly one woman in a blue blazer | Barber or salon owner at work; food truck owner serving customers; woman in a workshop; two partners signing in a storefront |
| Real Estate & Homeownership | Couple outside a house | Interiors of agents at desks | Family receiving keys at a front door; couple inspecting a house exterior with a clipboard; contractor on a ladder; couple moving boxes in |
| Leadership & Ministry | Woman at a camera with a congregation behind | Mostly one woman at an audio desk | Pastor and elders in prayer; man leading a team huddle on a job site; woman teaching a small group; youth leader with teens |
| Bible Study & Scripture | Child with a grandmother, outdoors | Bible open at a desk, repeated | Study group around a table with open Bibles; teen with a phone Bible app; man with a worn Bible on a train; woman writing in a journal margin |
| History & Understanding Our World | Family on a balcony | The weakest set: nothing historical or communal | Elder telling a story to children on a porch; family looking at old photographs; community gathering in a town square; museum visit with a school group |
| Technology, AI & Innovation | Elders laughing at a phone | Mostly laptops in blue | Teen coding at a kitchen table; grandmother on a video call; maker at a 3D printer; father and daughter building a robot |

Welcome banner: the present hero is three generations in a flower field (existing cover
`whohe14-for-ever`). It works. Six alternates would let the banner rotate: a family at a table, a
couple outdoors, a church family, a father and children, a mother and teenage daughter, friends.

## Across all 54: the variety rules

- Representation: about 80% African American (children, teens, adults, seniors, couples, families),
  about 10% Latino, Asian, white and other, about 10% mixed groups, so the page reads as one
  community and not one casting.
- Clothing: no more than one frame in five in blue. Reds, golds, oranges, greens, patterns, work
  clothes, church clothes, casual and athletic.
- Settings: at least half outdoors or in a non-office place (kitchens, porches, shops, workshops,
  parks, markets, churches, cars, streets).
- Ages in every category: at least one child or teen and one senior, where the subject allows.
- Expression: candid, mid-conversation, mid-laugh. No posed stock smile at the lens.
- Light: natural sun, same warm grading as Learn Studio, colour-true skin tones.
- No text, logos, or real people's likenesses.

## How the 54 could be made, and what each costs

Nothing below is started. Please choose.

1. **Church tower, own GPU (recommended to try first).** `infra/learn-imagegen` is built to make
   lesson pictures on the church's own 4070 with an open model (Z-Image-Turbo). It costs nothing per
   picture, keeps everything sovereign, and rides the same three brakes as other loops. Its own
   README says the six comparison samples come first. I would ask for those samples for six of the
   frames above and have you judge faces and variety before any batch. Caveat: it is paused behind
   the tailnet key that has expired several times, and I have not run it.
2. **Free-licence stock.** I would hand-pick, check each licence, and keep a provenance line per
   image. Cost: nothing. Caveat: representation and cultural variety are hard to get in stock.
3. **Paid generation (Picsart or Canva, both connected).** Faster, credits spent per image. I will not
   use it without your explicit approval and a stated ceiling.
