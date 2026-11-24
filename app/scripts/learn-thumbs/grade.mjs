// =============================================================================
// grade — the free correction pass between the provider's picture and the
// thumbnail. Measured cause (2026-11-24 pilot): the provider pictures were
// generated dark (mean luma 37.6/255; 11 of 20 had >65% of pixels near black),
// with letterbox bars baked into 9 of them. This pass fixes what composition
// CAN fix, before any money is spent on regeneration:
//
//   1. crop baked-in letterbox / pillarbox bars (and anything printed in them)
//   2. neutralize a global color cast (partial gray-world white balance)
//   3. set exposure from the picture's own histogram (levels + gamma to a target
//      median), with a highlight roll-off so nothing clips to flat white
//   4. vibrance: lift muted color more than already-saturated color
//   5. a per-department LOOK, so each topic carries its own personality
//
// It never touches the provider's bytes (compose keeps master.<ext> untouched);
// it returns a NEW buffer plus before/after measurements, so every claim about
// brightness is a number from the real picture (DR-0076 §4).
// =============================================================================
import { Buffer } from 'node:buffer';
import sharp from 'sharp';

// One look per department. target = median luma (0..1) the exposure aims for;
// wb = gray-world strength (0 none .. 1 full neutral); vib = vibrance; tint =
// split-tone [shadowRGB, highlightRGB] multipliers; lift = max gamma lift.
/** Bumped whenever the grade's output changes, so composed pictures are re-graded (free). */
export const GRADE_VERSION = 2;

export const LOOKS = Object.freeze({
  faith: {
    target: 0.46,
    wb: 0.35,
    vib: 0.35,
    tint: [
      [1.0, 0.99, 1.03],
      [1.04, 1.01, 0.96],
    ],
    lift: 0.42,
  }, // warm, bright, uplifting
  kids: {
    target: 0.55,
    wb: 0.55,
    vib: 0.6,
    tint: [
      [1, 1, 1.04],
      [1.02, 1.02, 1],
    ],
    lift: 0.38,
  }, // bright, colorful, joyful
  finance: {
    target: 0.48,
    wb: 0.6,
    vib: 0.3,
    tint: [
      [0.98, 1.0, 1.05],
      [1.0, 1.0, 1.0],
    ],
    lift: 0.42,
  }, // clean, modern, aspirational
  tech: {
    target: 0.42,
    wb: 0.5,
    vib: 0.45,
    tint: [
      [0.94, 1.01, 1.1],
      [1.02, 1.0, 0.98],
    ],
    lift: 0.45,
  }, // cool, dynamic, electric
  history: {
    target: 0.47,
    wb: 0.4,
    vib: 0.2,
    tint: [
      [1, 1, 1.02],
      [1.03, 1.01, 0.97],
    ],
    lift: 0.42,
  }, // documentary, natural
  default: {
    target: 0.46,
    wb: 0.45,
    vib: 0.35,
    tint: [
      [1, 1, 1],
      [1, 1, 1],
    ],
    lift: 0.42,
  },
});

const DEPT_LOOK = Object.freeze({
  'Living Lessons': 'faith',
  'The Word & The Way': 'faith',
  'The Eternal Algorithms': 'faith',
  'Serve the House': 'faith',
  'Kingdom Life & Stewardship': 'finance',
  'Stock Market': 'finance',
  'Real Estate': 'finance',
  Business: 'finance',
  'Project Management': 'finance',
  'A.I. The Way': 'tech',
  Development: 'tech',
  History: 'history',
  Mathematics: 'kids',
});
/** The look a department wears. Children's courses (Little Learners) are always `kids`. */
export function lookFor(department, courseKey = '') {
  if (/little-learners|^lil|kids|children/i.test(courseKey)) return 'kids';
  return DEPT_LOOK[department] || 'default';
}

const luma = (r, g, b) => 0.2126 * r + 0.7152 * g + 0.0722 * b;

/** Rows/columns at the frame edge whose mean luma is < `thr` (a baked-in bar). Max 30% of the frame. */
export function detectBars(data, width, height, channels = 3, thr = 10) {
  const rowMean = (y) => {
    let s = 0,
      n = 0;
    for (let x = 0; x < width; x += 8) {
      const i = (y * width + x) * channels;
      s += luma(data[i], data[i + 1], data[i + 2]);
      n++;
    }
    return s / n;
  };
  const colMean = (x) => {
    let s = 0,
      n = 0;
    for (let y = 0; y < height; y += 8) {
      const i = (y * width + x) * channels;
      s += luma(data[i], data[i + 1], data[i + 2]);
      n++;
    }
    return s / n;
  };
  const limH = Math.floor(height * 0.3),
    limW = Math.floor(width * 0.3);
  let top = 0;
  while (top < limH && rowMean(top) < thr) top++;
  let bottom = 0;
  while (bottom < limH && rowMean(height - 1 - bottom) < thr) bottom++;
  let left = 0;
  while (left < limW && colMean(left) < thr) left++;
  let right = 0;
  while (right < limW && colMean(width - 1 - right) < thr) right++;
  // A bar usually ends in a soft edge or a printed mark; take a small safety margin past it.
  const pad = (v, dim) => (v > 0 ? Math.min(Math.floor(dim * 0.3), v + Math.round(dim * 0.012)) : 0);
  return { top: pad(top, height), bottom: pad(bottom, height), left: pad(left, width), right: pad(right, width) };
}

/** Luma stats of an RGB buffer: mean, median, percentiles, share of near-black pixels, mean saturation. */
export function measure(data, channels = 3) {
  const hist = new Uint32Array(256);
  let sum = 0,
    sat = 0,
    n = 0;
  for (let i = 0; i < data.length; i += channels * 4) {
    // every 4th pixel is plenty
    const r = data[i],
      g = data[i + 1],
      b = data[i + 2];
    const l = Math.round(luma(r, g, b));
    hist[l]++;
    sum += l;
    n++;
    const mx = Math.max(r, g, b),
      mn = Math.min(r, g, b);
    sat += mx ? (mx - mn) / mx : 0;
  }
  const pct = (p) => {
    let acc = 0;
    const want = p * n;
    for (let v = 0; v < 256; v++) {
      acc += hist[v];
      if (acc >= want) return v;
    }
    return 255;
  };
  let dark = 0;
  for (let v = 0; v < 30; v++) dark += hist[v];
  return {
    mean: +(sum / n).toFixed(1),
    median: pct(0.5),
    p01: pct(0.01),
    p99: pct(0.995),
    darkShare: +(dark / n).toFixed(3),
    saturation: +(sat / n).toFixed(3),
  };
}

/**
 * Grade one picture. Returns { buffer (JPEG), width, height, crop, before, after, look }.
 * Deterministic: the same bytes + look always give the same output.
 */
export async function gradeImage(input, { look = 'default', quality = 92 } = {}) {
  const L = typeof look === 'string' ? LOOKS[look] || LOOKS.default : look;
  const lookName = typeof look === 'string' ? look : 'custom';
  const src = await sharp(input, { failOn: 'error' }).rotate().removeAlpha().raw().toBuffer({ resolveWithObject: true });
  const { width: W0, height: H0 } = src.info;
  const before = measure(src.data);

  // 1. bars
  const bars = detectBars(src.data, W0, H0);
  let cw = W0 - bars.left - bars.right,
    ch = H0 - bars.top - bars.bottom;
  // Keep 16:9 after the crop: trim the longer side, centered.
  const want = 16 / 9;
  let cx = bars.left,
    cy = bars.top;
  if (cw / ch > want) {
    const nw = Math.round(ch * want);
    cx += Math.round((cw - nw) / 2);
    cw = nw;
  } else if (cw / ch < want) {
    const nh = Math.round(cw / want);
    cy += Math.round((ch - nh) / 2);
    ch = nh;
  }
  const cropped = await sharp(src.data, { raw: { width: W0, height: H0, channels: 3 } })
    .extract({ left: cx, top: cy, width: cw, height: ch })
    .raw()
    .toBuffer();
  const d = cropped;
  const m = measure(d);

  // 2. white balance (gray-world over mid-tones, partial)
  let rs = 0,
    gs = 0,
    bs = 0,
    k = 0;
  for (let i = 0; i < d.length; i += 12) {
    const l = luma(d[i], d[i + 1], d[i + 2]);
    if (l > 20 && l < 235) {
      rs += d[i];
      gs += d[i + 1];
      bs += d[i + 2];
      k++;
    }
  }
  const avg = k ? (rs + gs + bs) / (3 * k) : 1;
  const clampG = (v) => Math.min(1.25, Math.max(0.8, v));
  // A well-exposed daylight picture (the v2 art direction) has no cast to fix:
  // gray-world on a blue-sky frame pushes the clouds pink (measured 2026-11-24).
  // White balance fades out as the picture brightens: full at mean luma <= 40, none at >= 110.
  const wbEff = L.wb * Math.min(1, Math.max(0, (110 - m.mean) / 70));
  const gain = k ? [rs, gs, bs].map((s) => clampG(Math.pow(avg / (s / k), wbEff))) : [1, 1, 1];

  // 3. exposure: levels from the histogram, then gamma toward the target median
  const lo = Math.min(m.p01, 40);
  const hi = Math.max(m.p99, 150);
  const medN = Math.min(0.95, Math.max(0.02, (m.median - lo) / (hi - lo)));
  const gamma = Math.min(1, Math.max(L.lift, Math.log(L.target) / Math.log(medN)));
  const curve = new Float32Array(256);
  for (let v = 0; v < 256; v++) {
    let x = Math.min(1, Math.max(0, (v - lo) / (hi - lo)));
    x = Math.pow(x, gamma);
    x = x + 0.12 * x * (1 - x) * (x - 0.35); // gentle contrast that keeps mid-tones open
    curve[v] = Math.min(1, Math.max(0, x)) * 255;
  }

  // 4 + 5. apply: luma ratio preserves hue; vibrance; split tone; soft highlight roll-off
  const out = Buffer.alloc(d.length);
  for (let i = 0; i < d.length; i += 3) {
    let r = d[i] * gain[0],
      g = d[i + 1] * gain[1],
      b = d[i + 2] * gain[2];
    const l0 = luma(r, g, b);
    const l1 = curve[Math.min(255, Math.round(l0))];
    const ratio = l0 > 0.5 ? l1 / l0 : 1;
    r *= ratio;
    g *= ratio;
    b *= ratio;
    if (l0 <= 0.5) {
      r = g = b = l1;
    }
    const mx = Math.max(r, g, b),
      mn = Math.min(r, g, b);
    const s = mx > 0 ? (mx - mn) / mx : 0;
    const f = 1 + L.vib * (1 - s) * (m.mean > 110 ? 0.4 : 1); // bright pictures already carry their color
    const ll = luma(r, g, b);
    r = ll + (r - ll) * f;
    g = ll + (g - ll) * f;
    b = ll + (b - ll) * f;
    const t = Math.min(1, ll / 255);
    const sh = L.tint[0],
      hl = L.tint[1];
    r *= sh[0] * (1 - t) + hl[0] * t;
    g *= sh[1] * (1 - t) + hl[1] * t;
    b *= sh[2] * (1 - t) + hl[2] * t;
    const peak = Math.max(r, g, b);
    if (peak > 235) {
      const c = 235 + 20 * (1 - Math.exp(-(peak - 235) / 20));
      const sc = c / peak;
      r *= sc;
      g *= sc;
      b *= sc;
    }
    out[i] = r < 0 ? 0 : r > 255 ? 255 : r;
    out[i + 1] = g < 0 ? 0 : g > 255 ? 255 : g;
    out[i + 2] = b < 0 ? 0 : b > 255 ? 255 : b;
  }
  // A strong shadow lift wakes JPEG noise; a light median + sharpen keeps it clean.
  const strong = gamma < 0.6;
  let pipe = sharp(out, { raw: { width: cw, height: ch, channels: 3 } });
  if (strong) pipe = pipe.median(3);
  const buffer = await pipe.sharpen({ sigma: 0.8, m1: 0.6, m2: 1.2 }).jpeg({ quality, mozjpeg: true, chromaSubsampling: '4:4:4' }).toBuffer();
  const after = measure(out);
  return {
    buffer,
    width: cw,
    height: ch,
    crop: { left: cx, top: cy, width: cw, height: ch, bars },
    before,
    after,
    look: lookName,
    params: { gain: gain.map((v) => +v.toFixed(3)), lo, hi, gamma: +gamma.toFixed(3) },
  };
}

/** Rescue verdict: can grading alone carry this picture, or does it need a new one? */
export function rescueVerdict(before, after) {
  const reasons = [];
  if (before.darkShare > 0.8) reasons.push(`${Math.round(before.darkShare * 100)}% of the original was near black: lifting it shows noise, not a subject`);
  if (after.mean < 70) reasons.push(`still dark after grading (mean luma ${after.mean})`);
  if (after.saturation < 0.18) reasons.push(`still muted after grading (saturation ${after.saturation})`);
  return { rescued: reasons.length === 0, reasons };
}
