// @vitest-environment node
// =============================================================================
// Every catalog quotes the verse it names -- all 42, not two
// =============================================================================
// THE GAP, MEASURED 2026-10-15 ON origin/main 5ef382f39. This repository already
// owned an instrument that resolves a reference and compares the quotation to
// THAT verse (scripts/quoted-verse-is-the-verse.mjs), and a gate that commits it
// to zero with no baseline. The gate scanned TWO catalogs: Living Lessons and
// Little Learners. There are 42.
//
// Pointed at all 42, the same scanner -- unchanged, not one line of it -- reported
// 403 faults in 13 catalogs that nothing had ever read:
//
//   215  our span lowercases a capital the verse carries ("let there be light")
//   100  the words are the verse's but the order or punctuation is not
//    57  a word SHOUTED inside the quotation marks that His text does not shout
//    17  a paraphrase inside quotation marks ("so the one who reads it may run"
//         standing in for "that he may run that readeth it")
//    11  the straight apostrophe, where the corpus carries U+2019 -- ten plain
//         spans and one elided, which is the one the fixer's first cut skipped
//     4  a reference that does not resolve
//
// (The first five classes are counted as the classifier first split them, before
// the apostrophe repairs; 215 + 100 + 57 + 17 overlaps the apostrophe column by
// the one elided span, which was read as an order-or-punctuation fault until the
// elision was judged piece by piece. 403 is the total either way.)
//
// Living Lessons itself measured 43,054 spans and ZERO faults, so the gate was
// never wrong about what it watched -- it was pointed at a tenth of the surface.
//
// WHAT IS PINNED, AND WHY IT IS A PIN AND NOT A CEILING. Each catalog is pinned
// to its MEASURED number, in both directions. A new fault is red, which is the
// point. A FIXED fault is also red, with a message saying to lower the number,
// because a ceiling nobody lowers stops describing the building -- and this whole
// file exists because a number nobody re-read ("two catalogs") stopped being
// true. 30 catalogs are pinned at zero; 12 carry their debt in the open where it
// can be worked down, which is DR-0621: the flag is where the work starts.
//
// WORKED DOWN ONCE ALREADY (DR-1031, 2026-10-15): 403 -> 247. 186 capitals the
// writers had lowered are restored by fix-quote-case.mjs, now pointed at the
// derived QUOTED_SOURCES instead of its own two-file list, restricted to RAISING
// (its first cut also proposed 33 edits the other way -- our opening capital
// lowered to match a word mid-verse -- which is a house-style call about His
// words and is NOT decided here), and validating every fix against the EXACTLY
// cited verse. 145 of those closed gated faults; succession-class.js reached
// zero. What remains is 99 order-or-punctuation, 70 of the open capital
// question, 57 shouted, 17 paraphrases and 4 unresolvable.
//
// THE ONE CLASS CLOSED OUTRIGHT IS THE APOSTROPHE, because the corpus settles it
// rather than a human: 1,997 apostrophes in app/public/bible/kjv and every one of
// them U+2019, zero ASCII. So a straight apostrophe inside a span quoted as
// Scripture is never the text, there is nothing to weigh, and the ten sites are
// repaired in this change by scripts/fix-quote-apostrophe.mjs. That class is
// committed at zero across all 42 catalogs below, not baselined.
//
// WHY IT RECURRED THREE LESSONS RUNNING. ll242, ll243 and ll244 each shipped a
// straight apostrophe inside a quotation, the third after I had written down
// beforehand that it was the risk -- and the re-review that asked whether this
// needed a new authoring-time guard has its answer: it did not. The guard existed.
// It was looking at two files. scripts/quoted-sources.mjs now derives the file
// list by walking the tree, and the first test below reads the catalog exports
// back off disk, so a catalog written tomorrow is gated the day it lands and
// nobody has to remember.
import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { quotedTexts } from '../../../scripts/quotation-integrity.mjs';
import { scanQuotedVerses, describeFault, SPAN_WITH_REFERENCE, verseText } from '../../../scripts/quoted-verse-is-the-verse.mjs';
import { CATALOGS, everyCatalogExport } from '../../../scripts/quoted-sources.mjs';

import { AI_LEGAL_BLUEPRINT_MODULES as M_ai_legal_blueprint_class } from '../lib/ai-legal-blueprint-class.js';
import { APPRAISAL_MODULES as M_appraisal_course } from '../lib/appraisal-course.js';
import { BANKING_MODULES as M_banking_course } from '../lib/banking-course.js';
import { BONDS_MODULES as M_bonds_course } from '../lib/bonds-course.js';
import { BROADCAST_MODULES as M_broadcast_class } from '../lib/broadcast-class.js';
import { BUSINESS_RESEARCH_MODULES as M_business_research_course } from '../lib/business-research-course.js';
import { BUYING_TERMS_MODULES as M_buying_terms_course } from '../lib/buying-terms-course.js';
import { CAR_RESEARCH_MODULES as M_car_research_course } from '../lib/car-research-course.js';
import { MODULES as M_church_classes } from '../lib/church-classes.js';
import { CHURCH_OFFICES_MODULES as M_church_offices_course } from '../lib/church-offices-course.js';
import { DATASYSTEMS_MODULES as M_datasystems_course } from '../lib/datasystems-course.js';
import { DEVELOPMENT_MODULES as M_development_class } from '../lib/development-class.js';
import { ECON_MODULES as M_economics_class } from '../lib/economics-class.js';
import { EVICTIONS_MODULES as M_evictions_course } from '../lib/evictions-course.js';
import { FINANCING_DEBT_MODULES as M_financing_debt_course } from '../lib/financing-debt-course.js';
import { HISTORICAL_RESEARCH_MODULES as M_historical_research_course } from '../lib/historical-research-course.js';
import { HISTORY_MODULES as M_history_course } from '../lib/history-course.js';
import { INFRA_MODULES as M_infrastructure_class } from '../lib/infrastructure-class.js';
import { INSPECTIONS_MODULES as M_inspections_course } from '../lib/inspections-course.js';
import { INSURANCE_RISK_MODULES as M_insurance_risk_course } from '../lib/insurance-risk-course.js';
import { INVESTING_MODULES as M_investing_course } from '../lib/investing-course.js';
import { LEASING_TENANTS_MODULES as M_leasing_tenants_course } from '../lib/leasing-tenants-course.js';
import { LEGACY_PROVISIONS_MODULES as M_legacy_provisions_course } from '../lib/legacy-provisions-course.js';
import { LITTLE_LEARNERS_MODULES as M_little_learners_class } from '../lib/little-learners-class.js';
import { LIVING_LESSONS_MODULES as M_living_lessons_class } from '../lib/living-lessons-class.js';
import { MADE_IN_TIME_MODULES as M_made_in_time_course } from '../lib/made-in-time-course.js';
import { MAINTENANCE_TRADES_MODULES as M_maintenance_trades_course } from '../lib/maintenance-trades-course.js';
import { MANAGEMENT_STEWARDSHIP_MODULES as M_management_stewardship_course } from '../lib/management-stewardship-course.js';
import { MATHEMATICS_MODULES as M_mathematics_class } from '../lib/mathematics-class.js';
import { PARTNERSHIPS_MODULES as M_partnerships_course } from '../lib/partnerships-course.js';
import { PROJECT_MANAGEMENT_MODULES as M_project_management_course } from '../lib/project-management-course.js';
import { PROPERTY_PRINCIPLE_MODULES as M_property_principle_course } from '../lib/property-principle-course.js';
import { PV_MODULES as M_prophetic_voices } from '../lib/prophetic-voices.js';
import { RTO_BUSINESS_MODULES as M_rent_to_own_business_class } from '../lib/rent-to-own-business-class.js';
import { SOFTWARE_PM_MODULES as M_software_project_management_course } from '../lib/software-project-management-course.js';
import { SOUND_BOARD_MODULES as M_sound_board_class } from '../lib/sound-board-class.js';
import { SOVEREIGN_AI_MODULES as M_sovereign_ai_class } from '../lib/sovereign-ai-class.js';
import { STOCKS_MODULES as M_stocks_course } from '../lib/stocks-course.js';
import { SUCCESSION_MODULES as M_succession_class } from '../lib/succession-class.js';
import { TAXES_RECORDS_MODULES as M_taxes_records_course } from '../lib/taxes-records-course.js';
import { WHO_HE_IS_MODULES as M_who_he_is_course } from '../lib/who-he-is-course.js';
import { WORD_OUT_MODULES as M_word_out_course } from '../lib/word-out-course.js';
import { WORLD_MARKET_MODULES as M_world_market_course } from '../lib/world-market-course.js';

const MODULES_BY_FILE = {
  'ai-legal-blueprint-class.js': M_ai_legal_blueprint_class,
  'appraisal-course.js': M_appraisal_course,
  'banking-course.js': M_banking_course,
  'bonds-course.js': M_bonds_course,
  'broadcast-class.js': M_broadcast_class,
  'business-research-course.js': M_business_research_course,
  'buying-terms-course.js': M_buying_terms_course,
  'car-research-course.js': M_car_research_course,
  'church-classes.js': M_church_classes,
  'church-offices-course.js': M_church_offices_course,
  'datasystems-course.js': M_datasystems_course,
  'development-class.js': M_development_class,
  'economics-class.js': M_economics_class,
  'evictions-course.js': M_evictions_course,
  'financing-debt-course.js': M_financing_debt_course,
  'historical-research-course.js': M_historical_research_course,
  'history-course.js': M_history_course,
  'infrastructure-class.js': M_infrastructure_class,
  'inspections-course.js': M_inspections_course,
  'insurance-risk-course.js': M_insurance_risk_course,
  'investing-course.js': M_investing_course,
  'leasing-tenants-course.js': M_leasing_tenants_course,
  'legacy-provisions-course.js': M_legacy_provisions_course,
  'little-learners-class.js': M_little_learners_class,
  'living-lessons-class.js': M_living_lessons_class,
  'made-in-time-course.js': M_made_in_time_course,
  'maintenance-trades-course.js': M_maintenance_trades_course,
  'management-stewardship-course.js': M_management_stewardship_course,
  'mathematics-class.js': M_mathematics_class,
  'partnerships-course.js': M_partnerships_course,
  'project-management-course.js': M_project_management_course,
  'property-principle-course.js': M_property_principle_course,
  'prophetic-voices.js': M_prophetic_voices,
  'rent-to-own-business-class.js': M_rent_to_own_business_class,
  'software-project-management-course.js': M_software_project_management_course,
  'sound-board-class.js': M_sound_board_class,
  'sovereign-ai-class.js': M_sovereign_ai_class,
  'stocks-course.js': M_stocks_course,
  'succession-class.js': M_succession_class,
  'taxes-records-course.js': M_taxes_records_course,
  'who-he-is-course.js': M_who_he_is_course,
  'word-out-course.js': M_word_out_course,
  'world-market-course.js': M_world_market_course,
};

// Measured, not chosen. See the header.
// LOWERED 2026-10-15 by DR-1031: 186 capitals the writers had lowered are
// restored, closing 145 gated faults. succession-class.js reaches ZERO and
// leaves this list entirely; every other number is the pin it measured after.
const PINNED = {
  'broadcast-class.js': 4,
  'business-research-course.js': 1,
  'buying-terms-course.js': 4,
  'datasystems-course.js': 1,
  'economics-class.js': 13,
  // Untouched at 36, and it is the ONE catalog whose whole debt is the open
  // question: every fault here is our capital on a word sitting mid-verse
  // ("Searched the scriptures daily" for Acts 17:11's "and searched the
  // scriptures daily"), which DR-1031 declines to decide. See its record.
  'historical-research-course.js': 36,
  'infrastructure-class.js': 3,
  'legacy-provisions-course.js': 1,
  'made-in-time-course.js': 152,
  'prophetic-voices.js': 5,
  'sound-board-class.js': 3,
  // 36 -> 25 by DR-1030's apostrophes, 25 -> 24 by DR-1031's capitals.
  'sovereign-ai-class.js': 24,
};

const KJV_DIR = join(dirname(fileURLToPath(import.meta.url)), '..', '..', 'public', 'bible', 'kjv');
const CURLY = '\u2019';

describe('the gate knows every catalog there is', () => {
  it('the list it scans IS the list on disk -- in both directions', () => {
    // THE STRUCTURAL CLOSE. A hand-kept list is what failed: it said two for as
    // long as it existed. everyCatalogExport() reads the export lines off disk,
    // so a new course makes this red until it is gated.
    const listed = CATALOGS.map(([f, n]) => `${f}:${n}`).sort();
    expect(everyCatalogExport()).toEqual(listed);
  });

  it('and every catalog it lists is actually imported and non-empty here', () => {
    // A list that names a catalog the file never imports would scan undefined
    // and pass. Each one is a real array of real lessons.
    expect(Object.keys(MODULES_BY_FILE).sort()).toEqual(CATALOGS.map(([f]) => f).sort());
    for (const [file, modules] of Object.entries(MODULES_BY_FILE)) {
      expect(Array.isArray(modules), `${file} did not export an array`).toBe(true);
      expect(modules.length, `${file} exported an empty catalog`).toBeGreaterThan(0);
    }
  });

  it('scans a real corpus, so a pass means something', () => {
    // Anti-theater (DR-0076 section 3): if an import broke or quotedTexts stopped
    // returning fields, every pin below would pass on nothing at all.
    let spans = 0;
    let lessons = 0;
    for (const modules of Object.values(MODULES_BY_FILE)) {
      spans += scanQuotedVerses(modules, quotedTexts).spans;
      lessons += modules.length;
    }
    expect(lessons).toBeGreaterThan(600);
    expect(spans).toBeGreaterThan(50_000);
  });
});

describe('THE WHOLE SURFACE -- measured, pinned, and open about its debt', () => {
  for (const [file] of CATALOGS) {
    const pin = PINNED[file] || 0;
    it(`${file} holds exactly ${pin} quotation fault(s)`, () => {
      const scan = scanQuotedVerses(MODULES_BY_FILE[file], quotedTexts);
      if (scan.faults.length === pin) {
        expect(scan.faults.length).toBe(pin);
        return;
      }
      // Both directions are red, and the message says which way and what to do.
      const verdict = scan.faults.length > pin
        ? `${file}: ${scan.faults.length} faults, pinned at ${pin} -- a NEW fault entered this catalog`
        : `${file}: ${scan.faults.length} faults, pinned at ${pin} -- faults were FIXED; lower the pin in PINNED to ${scan.faults.length} so the ledger stays true`;
      expect(
        scan.faults.slice(0, 12).map(describeFault).join('\n'),
        verdict,
      ).toBe(`(expected exactly ${pin})`);
    });
  }
});

describe('the apostrophe is closed outright, because the corpus settles it', () => {
  it('the corpus carries U+2019 and never an ASCII apostrophe -- 1997 to 0', () => {
    // The rule below is only legitimate because of this measurement. If a future
    // corpus import ever introduced a straight apostrophe, this fails FIRST and
    // the rule is revisited rather than silently misapplied.
    let curly = 0;
    let straight = 0;
    for (const f of readdirSync(KJV_DIR)) {
      if (!f.endsWith('.json') || f === 'index.json') continue;
      const bk = JSON.parse(readFileSync(join(KJV_DIR, f), 'utf8'));
      for (const chap of bk.chapters || []) {
        for (const v of chap || []) {
          if (typeof v !== 'string') continue;
          curly += v.split(CURLY).length - 1;
          straight += v.split("'").length - 1;
        }
      }
    }
    expect(curly).toBe(1997);
    expect(straight).toBe(0);
  });

  it('no cited quotation in ANY catalog carries a straight apostrophe', () => {
    // Committed at ZERO across all 42, not baselined: "the LORD's" is not what
    // Psalm 24:1 says. Our own prose is untouched by this -- a contraction in our
    // voice may be written either way; only text inside quotation marks that
    // carry a reference is judged.
    const bad = [];
    for (const [file] of CATALOGS) {
      for (const m of MODULES_BY_FILE[file]) {
        for (const [where, text] of quotedTexts(m)) {
          for (const s of String(text).matchAll(SPAN_WITH_REFERENCE)) {
            if (s[1].includes("'")) bad.push(`${file} ${m.id} :: ${where} :: "${s[1].slice(0, 70)}"`);
          }
        }
      }
    }
    expect(bad).toEqual([]);
  });
});

describe('PROVEN-TO-CATCH -- a gate is only worth its green if it goes red', () => {
  // Verbatim John 3:16 cited to the wrong verse: a real fault shape.
  const MISCITED = 'He says "For God so loved the world, that he gave his only begotten Son" (John 3:17)';
  const bend = (file, patch) => {
    const modules = MODULES_BY_FILE[file];
    const bent = [{ ...modules[0], ...patch }, ...modules.slice(1)];
    return scanQuotedVerses(bent, quotedTexts).faults;
  };

  it('a NEW fault in a catalog pinned at zero is reported', () => {
    // banking-course.js measured 234 spans and zero faults.
    expect(scanQuotedVerses(MODULES_BY_FILE['banking-course.js'], quotedTexts).faults).toEqual([]);
    const faults = bend('banking-course.js', { lesson: MISCITED });
    expect(faults.map((f) => f.kind)).toContain('not-the-verse');
  });

  it('a NEW fault in a catalog that already carries debt is reported too', () => {
    // The pin is exact, so one more on top of 25 is still red -- debt does not
    // buy room for the next fault.
    const before = scanQuotedVerses(MODULES_BY_FILE['sovereign-ai-class.js'], quotedTexts).faults.length;
    const after = bend('sovereign-ai-class.js', { bigIdea: MISCITED }).length;
    expect(after).toBeGreaterThan(before);
  });

  it('and a straight apostrophe inside a quotation is caught by the zero rule', () => {
    // The exact class that shipped three lessons running, asserted rather than
    // described: the span is verbatim Psalm 24:1 except for one character.
    const real = verseText('Psalms', 24, '1');
    expect(real).toContain(`The earth is the LORD${CURLY}s`);
    const straight = 'He says "The earth is the LORD\'s, and the fulness thereof" (Psalms 24:1)';
    const hits = [...straight.matchAll(SPAN_WITH_REFERENCE)].filter((s) => s[1].includes("'"));
    expect(hits.length).toBe(1);
    // And the scanner itself calls it what it is, with no apostrophe folding.
    const faults = bend('banking-course.js', { lesson: straight });
    expect(faults.map((f) => f.kind)).toContain('not-the-verse');
  });
});
