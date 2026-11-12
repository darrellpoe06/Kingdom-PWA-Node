// @vitest-environment node
// =============================================================================
// learning-products — one teaching, three ways to hold it, derived from the
// live registry (DR-1447)
// =============================================================================
import { describe, it, expect } from 'vitest';
import { LEARN_CATALOG } from '../lib/learn-catalog.js';
import { productLine, catalogProductLines, derivedBookDrafts, courseSections, AWAITING_SOURCES, BOOK_PRICE_BY_FITNESS } from '../lib/learning-products.js';
import { publishableProduct } from '../lib/commerce.js';
import { PLUS_TIER } from '../lib/poetech-plus.js';

const entry = (key) => LEARN_CATALOG.find((e) => e.key === key);

describe('a PoeTech subject (Inspections, Real Estate)', () => {
  const line = productLine(entry('inspections'));
  it("its book is a booklet priced by size, in the Bookstore's own shape, publishable, a draft until the Governor says", () => {
    expect(line.measured.fitness).toBe('booklet');
    expect(line.book).toMatchObject({
      id: 'prod-course-inspections',
      recipeId: 'course-inspections',
      status: 'draft',
      priceCents: BOOK_PRICE_BY_FITNESS.booklet,
      author: 'Darrell Poe',
    });
    expect(line.book.businesses).toEqual(['poetech', 'church']);
    expect(publishableProduct(line.book).ok).toBe(true);
    expect(line.book.blurb).toMatch(/a booklet of 8 lessons, [\d,]+ words/);
  });
  it('its course opens the deeper levels with PoeTech+, and every lesson sits in a section with a measured video status', () => {
    expect(line.course.requires).toBe(PLUS_TIER);
    expect(line.course.free).toBe(false);
    expect(line.course.sections.length).toBe(line.course.lessons);
    expect(line.course.coverage.lessons).toBe(line.course.lessons);
    expect(line.course.owed.length).toBe(line.course.sections.filter((s) => s.status !== 'complete').length);
    expect(line.course.launch).toEqual({ view: 'church', churchView: 'learn', courseKey: 'inspections' });
  });
  it('its workshop is a business seat with a recommended price and its parts', () => {
    expect(line.workshop.knowledgeType).toBe('business');
    expect(line.workshop.offering).toBe(false);
    expect(line.workshop.recommendedCents).toBe(20000);
    expect(line.workshop.parts.location).toBe('city');
    expect(productLine(entry('inspections'), { location: 'metro', format: 'half-day' }).workshop.recommendedCents).toBe(15000);
  });
});

describe('a spiritual department (Living Lessons)', () => {
  const line = productLine(entry('living-lessons'));
  it('the book is a full book in volumes (a format of what is read free), the course is free, the workshop an offering', () => {
    expect(line.measured.fitness).toBe('full');
    expect(line.book.priceCents).toBe(BOOK_PRICE_BY_FITNESS.full);
    expect(line.book.businesses).toEqual(['church']);
    expect(line.book.blurb).toMatch(/in \d+ volumes/);
    expect(line.course.requires).toBe('foundation');
    expect(line.course.free).toBe(true);
    expect(line.workshop.offering).toBe(true);
    expect(line.workshop.recommendedCents).toBe(0);
  });
  it("a long course walks the Word's divisions as its sections; a short one walks lesson by lesson", () => {
    expect(line.course.sections.length).toBeLessThan(line.course.lessons);
    expect(line.course.sections.map((s) => s.key)).toContain('gospels');
    const short = courseSections([
      { id: 'x1', title: 'One' },
      { id: 'x2', title: 'Two' },
    ]);
    expect(short.map((s) => s.key)).toEqual(['x1', 'x2']);
    expect(short[0].lessons.length).toBe(1);
  });
});

describe('a chapter-sized course', () => {
  it('has no book of its own and says why', () => {
    const line = productLine(entry('word-out'));
    expect(line.measured.fitness).toBe('chapter');
    expect(line.book).toBeNull();
    expect(line.bookWhy).toMatch(/department compilation/);
    expect(line.course.id).toBe('course-word-out');
  });
});

describe('the whole registry', () => {
  const lines = catalogProductLines();
  it('every registered course has a line; drafts are only the books that exist; every book id is unique', () => {
    expect(lines.length).toBe(LEARN_CATALOG.length);
    const drafts = derivedBookDrafts(lines);
    expect(drafts.length).toBe(lines.filter((l) => l.book).length);
    expect(new Set(drafts.map((d) => d.id)).size).toBe(drafts.length);
    for (const d of drafts) expect(publishableProduct(d).ok, d.id).toBe(true);
  });
  it('a builder that throws yields an honest empty line, never a crash', () => {
    const line = productLine({
      key: 'broken',
      meta: { title: 'B', category: 'Real Estate' },
      buildScheduleRows: () => {
        throw new Error('x');
      },
    });
    expect(line.book).toBeNull();
    expect(line.course.lessons).toBe(0);
    expect(line.workshop.recommendedCents).toBe(20000);
  });
});

describe('a named source that has not reached the app', () => {
  it('is listed as awaiting, with why, so no product is painted over it', () => {
    const s = AWAITING_SOURCES.find((x) => x.id === 'src-acrobat-course-2026-11-12');
    expect(s.status).toBe('awaiting-source');
    expect(s.why).toMatch(/Acrobat/);
    expect(Object.isFrozen(AWAITING_SOURCES)).toBe(true);
  });
});
