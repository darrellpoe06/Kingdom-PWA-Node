# 2026-11-25 — TLC Theological Institute redesign (owner-device preview)

**What:** The approved Institute design (red / black / white / gold) built as a new top for the Institute, shown only on the owner personas' devices (or `?instituteStudio=1`; `?instituteStudio=0` turns it off). Public visitors still see the classic Institute, unchanged.

## What changed
- `app/src/components/institute/InstituteStudio.jsx` (new): welcome banner with Senior Bishop Lloyd E. Gwin (Founder & Chancellor, TLC Theological Institute), the motto, Explore Programs / Enroll Today, six-point feature strip, student dashboard, Continue Learning, Next Up for You, photographic program cards, six doors (Course Catalog, Enrollment, My Certificates, My Progress, Announcements, Resources).
- `app/src/lib/institute-studio.js` (new): the flag, plus pure functions for every number shown.
- `app/src/components/ChurchInstitute.jsx`: mounts the studio in place of the old banner when the flag is on; adds a Resources section (studio only) and a "back to the classic Institute" switch. Every existing section, the Office desk, the enrollment / roll / attendance / credential calls, and the disclosure are unchanged.
- `app/src/poe-financial-mvp-v28.jsx`: passes `studioDefaultOn` (same owner-persona rule as the Learn studio) and the student's name.
- `app/src/index.css`: `.is-*` styles built on the `--lc-*` theme tokens, so light, night and midnight all work. The brand reds in the banner stay fixed, as on the existing banner.

## Where every number comes from (nothing invented)
- Enrolled / Completed / Certificates: the student's own `institute_enrollments` and `institute_credentials` rows plus the `institute_completion` RPC (RLS is the wall).
- Progress %: required courses passed ÷ required, from the same RPC. With no enrollment it reads "Shown once you are enrolled in a program".
- Continue Learning: this device's saved lesson places (`learn-resume`), filtered to Institute courses.
- Next Up: the first required course the student still has to pass; otherwise the first Institute course not yet begun.

## Assets
- The photo is the existing `public/lovecorner/bishop-lloyd-e-gwin-*.jpg`, measured against the supplied original: a straight resize (mean pixel difference about 2/255). It is cropped by CSS only and never retouched.
- Program photos are existing `public/learn-thumbs` artwork. Nothing was generated or bought.
- Watch / Read / Listen / Study is not touched; the cards link into Learn as before.

## Verified
- 66 tests across the Institute, Love Corner home and church-tab suites, including 13 new studio tests.
- Lint is clean on the changed files.
- Real-browser render at 390 / 820 / 1280 px in night and light themes: no sideways scroll, no page errors, all images load.
- The full suite was stopped at 994 of 2,124 files with 0 failures, to save time. CI runs the whole suite.
