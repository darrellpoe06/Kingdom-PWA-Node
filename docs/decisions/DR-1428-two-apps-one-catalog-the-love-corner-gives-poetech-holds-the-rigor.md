# DR-1428: Two apps, one catalog: the Love Corner gives freely, PoeTech+ holds the rigorous levels

**Date:** 2026-11-11
**Status:** Accepted (rule and routing live; nothing is locked until a real way to pay exists)
**Tier:** C (real money). This change only builds the rule; nothing is charged yet.
**Type:** decision
**Area:**
- `app/src/lib/learn-access-tiers.js` (`lessonAccess`, `SPIRITUAL_DEPARTMENTS`)
- `lib/lesson-links.js` (`lessonDoorFor`)
- `lib/learn-catalog.js` (`isPoeTechLessonLink`)
- `ChurchLearn.jsx`, `EternalAlgorithmsStudy.jsx`, and the shell's brand lines

**Sent in by:** Darrell, 2026-11-11:
- Holding an L301 link that said "The Love Corner" and opened PoeTech, he asked why lesson links go to PoeTech and not the Love Corner.
- He then decided, in substance: every spiritual lesson is free in the Love Corner App, and the other subjects advertise PoeTech's learning content and space. PoeTech holds the higher-level content, while the child level of every subject stays in the Love Corner. The more rigorous levels move to PoeTech: a premium account and experience, with more nuanced lessons and a path to in-person workshops when available. The first lesson of each course is free inside the Love Corner App. PoeTech is for curators of A.I. technology, business-development creators, and project managers of real projects and products, for the best hands-on knowledge available.
- Earlier the same evening he gave the price: other subjects and higher levels cost PoeTech+ ($39).

**Supersedes in part:** DR-0536 (formation and vocational; "the reading stays free")
**Pairs with:** DR-0290, DR-0444, DR-0349, DR-0731, DR-0184 (PoeTech+ is the $39 tier), RELEASE-TIERS

## Context

A lesson link used to take the address of whatever page the sharer had open. One lesson therefore opened in either app, depending on who sent it, while the message always named the Love Corner.

DR-0536 had kept every lesson free to read and called Mathematics and A.I. never priced. Its reason was this: "A child who cannot pay must never meet a locked lesson."

## What was measured

- **Pricing.** No course was tied to a tier, and `ACCESS_ENFORCEMENT` was false. The app has **no checkout of any kind**; searching `lib/` and `components/` for a payment flow finds none.
- **Departments.** Every course already declares a department, so where a lesson opens and what it costs can come from that department.
- **Brand.** A signed-out visitor on any public church link wears the Love Corner brand (`wearsChurchBrand`, DR-0290). So a business lesson opening in PoeTech would have shown the church's welcome.

## Decision

- **The spiritual departments are free at every level, on both apps.** They are Living Lessons, The Word & The Way, Kingdom Life & Stewardship, Serve the House and The Eternal Algorithms. Their links open in the **Love Corner** (`/lovecorner/app/`).
- **Every other department is a PoeTech subject.** That includes Business, A.I., Real Estate, Stock Market, Project Management, Development, Mathematics and History. Their links open in **PoeTech** (`/poetech-app/`), and the share message says PoeTech.
- **Who reads free (`lessonAccess`).**
  - The child level of every lesson in every subject is free, which keeps DR-0536's line that no child meets a lock.
  - The first lesson of every course is free at every level.
  - Every other level of a PoeTech subject needs **PoeTech+** (`poetech-plus`).
  - A department that isn't declared stays free.
- **The brand follows the lesson.** A signed-out visitor on a PoeTech-subject link sees PoeTech, without the church's welcome card. The open link itself, and its suppression of sign-in pop-ups, is unchanged. A course the registry doesn't know keeps the church brand, so no link already sent changes for the worse.
- **Nothing is locked yet.** `ACCESS_ENFORCEMENT` stays false until a real way to pay exists. A lock with no way through it would only shut people out. Turning it on is the Tier C step, with checkout as its first requirement.

## Verification

- **`learn-access-tiers.test.js`, 15 cases.**
  - Spiritual lessons are free at every level.
  - In a business course, the child level is free, the first lesson is free, and the four rigorous levels need PoeTech+.
  - Mathematics and A.I. are PoeTech subjects, and their child level is still free.
  - **Proven to catch:** an undeclared department stays free.
  - Enforcement is off, and the original brake still fails if any component or lib imports the model.
- **`a-lesson-link-opens-in-its-own-app.test.js`, 14 cases.**
  - L301 shared from inside PoeTech opens in the Love Corner, and a business lesson shared from the Love Corner opens in PoeTech.
  - The Love Corner list equals the spiritual list.
  - **Proven to catch:** without its course, a link falls back to the sharer's page (the bug Darrell held); without the PoeTech check, the church brand covers a business lesson.
  - The shell captures the check once, at boot, and uses it only for the brand and the welcome cards.
- **Other suites.** The 11 link, share and catalog suites pass (135 tests). The shell holds 5,185 lines.

**The showcase is built.** `components/PoeTechShowcase.jsx` appears only in the Love Corner app, only on a PoeTech-subject course. It says the child level and the whole first lesson are free there, and it links to the same course in PoeTech. It claims no lock; three cases cover it, including a render on the Love Corner path.

**Waiting on Darrell (DR-0089: a value only he holds):** the PoeTech+ checkout needs a payment account in his name. Workshops wait for real dates. `re-review: 2026-11-25`.
