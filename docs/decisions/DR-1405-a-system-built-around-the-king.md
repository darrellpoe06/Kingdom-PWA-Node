# DR-1405: The King brings the balance, and a system built around Him serves it — a lesson never sets a system against Him

**Date:** 2026-11-10
**Status:** Accepted
**Tier:** A (wording in one lesson; content only)
**Type:** lesson correction
**Area:** Rent-to-Own business course, rto8 (`app/src/lib/rent-to-own-business-class.js`)
**Sent in by:** Darrell, 2026-11-10, reading rto8: "You want balance - and THE KING IS THE ONE WHO BRINGS THE BALANCE. Not a system. Not a schedule.... why can't a system be built to support this?!"
**Pairs with:** DR-1403 (L298: the systems you use daily program you, so let the King’s way be the system underneath), DR-0098 (teach the Word), DR-0075

## Context

rto8 names balance last and gives it to the King, which is right. Then it added "Not a system. Not a schedule. Him." That sets a system against the King, as if building one were opposed to trusting Him. The same day, L298 taught the opposite: the systems we repeat program us, so the King’s way is meant to be the system under every other one.

## What was measured

Every place the catalog contrasts a system with the King or the Way was searched. Three were found, and only rto8 is a correction:

- **rto8.** The adult text said "Not a system. Not a schedule." Two bands repeated the contrast: "not a schedule" and "rather than any system".
- **A Living Lesson.** Its "the Way is not a system. It has a name" means the Way is a Person (John 14:6). It is kept.
- **The taxes course.** Delia’s glove-box envelope "was not a system" describes an envelope. It is kept.

## Impact

The lesson keeps Him as the source of balance and stops teaching readers that structure and faith are rivals. That matches what the platform itself is: systems built to serve His way.

## Decision

The adult text now reads: the King is the One who brings the balance. A system or a schedule cannot bring it on its own. One built around Him can carry it: a set time each day in His Word, work and rest kept in His order, and the same faithful steps repeated until they hold. In that way the system serves what He gives instead of standing in for Him. The two bands say the same in their own register. The child and youth bands already said only "The King brings balance" and are unchanged.

## Verification

`rent-to-own-business-course.test.js` gains a case. It requires the new sentence in rto8, and it refuses "Not a system. Not a schedule.", "not a schedule," and "rather than any system" in any rto8 band. It passes against the corrected lesson, along with the course's other 31 tests.
