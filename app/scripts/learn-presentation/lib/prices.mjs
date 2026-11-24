// =============================================================================
// prices — the configurable price table the estimate and the budget cap use
// =============================================================================
// Published list prices gathered 2026-11-23 (USD per image unless noted).
// Override any entry with --prices <file.json> (same shape). These are list
// prices; confirm on the provider's pricing page before a paid run.
// =============================================================================
export const DEFAULT_PRICES = Object.freeze({
  image: {
    'bfl:flux-pro-1.1-ultra': { cents: 6, label: 'FLUX 1.1 [pro] Ultra (Black Forest Labs)' },
    'openai:gpt-image-1.5:high:1536x1024': { cents: 20, label: 'OpenAI GPT Image 1.5, high, 1536x1024' },
    'openai:gpt-image-1.5:medium:1536x1024': { cents: 5, label: 'OpenAI GPT Image 1.5, medium, 1536x1024' },
    'openai:gpt-image-1-mini:high:1536x1024': { cents: 5.2, label: 'OpenAI GPT Image 1 mini, high, 1536x1024' },
    'gemini:image': { cents: 5, label: 'Google image model (Imagen-class, $0.04–0.06)' },
    'ideogram:3.0-quality': { cents: 9, label: 'Ideogram 3.0 Quality' },
    'local:comfyui': { cents: 0, label: 'Local GPU (ComfyUI on the NAS) — electricity only' },
  },
  // Per lesson, one text call. ~6k input + ~600 output tokens for an average lesson.
  text: {
    'anthropic:default': { cents: 1, label: 'Anthropic Messages API (cost-efficient model), ~1¢/lesson' },
    'local:openai-compatible': { cents: 0, label: 'Local LLM (Ollama / LM Studio)' },
  },
});

/** Generations per lesson, including rejected-in-review regenerations. */
export const DEFAULT_REGEN_FACTOR = 1.3;

export function estimate({ lessons, prices = DEFAULT_PRICES, regenFactor = DEFAULT_REGEN_FACTOR }) {
  const n = Math.max(0, lessons | 0);
  const gens = Math.ceil(n * regenFactor);
  const textCents = Object.entries(prices.text).map(([k, v]) => ({ key: k, label: v.label, cents: Math.ceil(n * 1.1 * v.cents) }));
  const imageCents = Object.entries(prices.image).map(([k, v]) => ({ key: k, label: v.label, generations: gens, cents: Math.ceil(gens * v.cents) }));
  return { lessons: n, regenFactor, generations: gens, text: textCents, image: imageCents };
}

export function priceFor(prices, kind, key) {
  const e = prices[kind] && prices[kind][key];
  return e ? e.cents : null;
}

export const dollars = (cents) => `$${(cents / 100).toFixed(2)}`;
