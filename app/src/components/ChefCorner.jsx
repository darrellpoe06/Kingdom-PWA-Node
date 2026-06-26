// =============================================================================
// ChefCorner — the Chef's Corner recipe surface
// =============================================================================
// Intuitive, one-click, all-ages (the standard): clean recipe cards, a readable
// detail view with sectioned ingredients + sectioned, ordered steps, a serving
// scaler, and an easy Add Recipe form with a paste-import (the user pastes a
// recipe in plain text; the app structures it — no JSON shown anywhere).
//
// Data: the three canonical Poe Family recipes (version-controlled content) ∪ the
// cloud-synced recipes the family adds (the `recipes` prop, from the persisted
// backend). Deduped by id so applying the cloud seed never doubles a recipe.
//
// Built on shared primitives (SectionTitle, TextSizeControl, UiIcon) and the pure
// engine (lib/chefs-corner.js). No device-font emoji; no fixed-px text — every
// size is rem so the global large-print control scales it (consistency-guard).
// =============================================================================
import React, { useState, useMemo } from 'react';
import { SectionTitle } from './shared.jsx';
import UiIcon from './UiIcon.jsx';
import TextSizeControl from './TextSizeControl.jsx';
import {
  COLLECTIONS, DEFAULT_COLLECTION, makeRecipe, parseRecipeText,
  servingsBaseOf, ingredientCount, stepCount,
} from '../lib/chefs-corner.js';
import { describeIngredient } from '../lib/recipe-units.js';
import { importRecipeFromImage } from '../lib/recipe-photo-import.js';
import { POE_FAMILY_RECIPES } from '../lib/chefs-corner-recipes.js';

const ACCENT = '#B85838';
const INK = '#1A1815';
const MUTE = '#5A5751';
const LINE = '#E8E4DC';
const CREAM = '#FAF8F4';
const serif = { fontFamily: '"Fraunces", serif' };

export default function ChefCorner({
  recipes = [],
  addRecipe,
  updateRecipe,
  deleteRecipe,
  currentUserPersona = null,
}) {
  const [mode, setMode] = useState('browse'); // 'browse' | 'detail' | 'add'
  const [selectedId, setSelectedId] = useState(null);
  const [query, setQuery] = useState('');

  // Canonical content ∪ cloud-synced additions, deduped by id (canonical wins).
  const allRecipes = useMemo(() => {
    const byId = new Map();
    for (const r of recipes) byId.set(r.id, makeRecipe(r));
    for (const r of POE_FAMILY_RECIPES) byId.set(r.id, r); // canonical is authoritative
    return Array.from(byId.values());
  }, [recipes]);

  // ids that come from the canonical content file are read-only (never stripped,
  // never edited away). Cloud-added recipes are editable/deletable.
  const canonicalIds = useMemo(() => new Set(POE_FAMILY_RECIPES.map((r) => r.id)), []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return allRecipes;
    return allRecipes.filter((r) => {
      const hay = [
        r.title, r.chef, ...(r.tags || []),
        ...(r.ingredientSections || []).flatMap((s) => [s.title, ...s.items]),
      ].filter(Boolean).join(' ').toLowerCase();
      return hay.includes(q);
    });
  }, [allRecipes, query]);

  const selected = allRecipes.find((r) => r.id === selectedId) || null;

  const openDetail = (id) => { setSelectedId(id); setMode('detail'); };
  const backToBrowse = () => { setMode('browse'); setSelectedId(null); };

  const collection = COLLECTIONS[DEFAULT_COLLECTION];

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <SectionTitle eyebrow="Chef's Corner">{collection.name}</SectionTitle>
        <TextSizeControl variant="panel" />
      </div>

      {mode === 'browse' && (
        <BrowseView
          collection={collection}
          recipes={filtered}
          total={allRecipes.length}
          query={query}
          setQuery={setQuery}
          onOpen={openDetail}
          onAdd={() => setMode('add')}
        />
      )}

      {mode === 'detail' && selected && (
        <DetailView
          recipe={selected}
          editable={!canonicalIds.has(selected.id)}
          onBack={backToBrowse}
          onDelete={
            deleteRecipe && !canonicalIds.has(selected.id)
              ? () => { deleteRecipe(selected.id); backToBrowse(); }
              : null
          }
        />
      )}

      {mode === 'add' && (
        <AddView
          collection={collection}
          currentUserPersona={currentUserPersona}
          onCancel={backToBrowse}
          onSave={(recipe) => {
            if (addRecipe) {
              const id = addRecipe(recipe);
              if (id) { setSelectedId(id); setMode('detail'); return; }
            }
            backToBrowse();
          }}
        />
      )}
    </div>
  );
}

// -----------------------------------------------------------------------------
// Browse — the collection header + a searchable card grid.
// -----------------------------------------------------------------------------
function BrowseView({ collection, recipes, total, query, setQuery, onOpen, onAdd }) {
  return (
    <div className="space-y-5">
      <div className="bg-white border-2 p-5" style={{ borderColor: ACCENT }}>
        <div className="flex items-center gap-3 flex-wrap">
          <span className="text-3xl shrink-0" style={{ color: ACCENT }}><UiIcon name="chefHat" /></span>
          <div className="min-w-0">
            <div className="text-lg" style={{ ...serif, fontWeight: 600 }}>{collection.name}</div>
            <div className="text-xs" style={{ color: MUTE }}>
              by {collection.chef} · {total} recipe{total === 1 ? '' : 's'}
            </div>
          </div>
        </div>
        <p className="text-sm leading-relaxed mt-3" style={{ ...serif, color: INK }}>{collection.blurb}</p>
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search recipes or ingredients…"
          aria-label="Search recipes"
          className="flex-1 min-w-[12rem] border px-3 py-2 text-sm bg-white"
          style={{ borderColor: LINE, color: INK }}
        />
        <button
          onClick={onAdd}
          className="text-xs uppercase tracking-wider px-4 py-2.5 text-white font-semibold"
          style={{ backgroundColor: INK }}
        >
          + Add recipe
        </button>
      </div>

      {recipes.length === 0 ? (
        <div className="bg-white border p-8 text-center text-sm" style={{ borderColor: LINE, color: MUTE, ...serif }}>
          No recipes match that search yet.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {recipes.map((r) => (
            <RecipeCard key={r.id} recipe={r} onOpen={() => onOpen(r.id)} />
          ))}
        </div>
      )}
    </div>
  );
}

function RecipeCard({ recipe, onOpen }) {
  const sectionLabels = (recipe.ingredientSections || []).map((s) => s.title).filter(Boolean);
  return (
    <button
      onClick={onOpen}
      className="text-left bg-white border p-4 hover:shadow-md transition-shadow focus:outline focus:outline-2"
      style={{ borderColor: INK, outlineColor: ACCENT }}
    >
      <h3 className="text-base leading-snug mb-1" style={{ ...serif, fontWeight: 600, color: INK }}>{recipe.title}</h3>
      <div className="text-[0.625rem] uppercase tracking-[0.15em] mb-3" style={{ color: ACCENT }}>{recipe.chef}</div>
      <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs" style={{ color: MUTE }}>
        {recipe.servings && <span>Serves {recipe.servings}</span>}
        {recipe.prepTime && <span>Prep {recipe.prepTime}</span>}
        {recipe.cookTime && <span>Cook {recipe.cookTime}</span>}
      </div>
      <div className="text-xs mt-3" style={{ color: MUTE }}>
        {ingredientCount(recipe)} ingredients · {stepCount(recipe)} steps
      </div>
      {sectionLabels.length > 0 && (
        <div className="text-xs mt-2" style={{ color: MUTE, ...serif }}>{sectionLabels.join(' · ')}</div>
      )}
      <div className="flex flex-wrap gap-1.5 mt-3">
        {(recipe.tags || []).map((t) => (
          <span key={t} className="text-[0.625rem] uppercase tracking-wider px-2 py-0.5" style={{ backgroundColor: CREAM, color: MUTE }}>{t}</span>
        ))}
      </div>
    </button>
  );
}

// -----------------------------------------------------------------------------
// Detail — the full recipe with the headline serving scaler + metric/American
// unit display. Enter a target number of people; every ingredient recomputes.
// -----------------------------------------------------------------------------
const SYSTEMS = [['american', 'American'], ['metric', 'Metric'], ['both', 'Both']];

function DetailView({ recipe, editable, onBack, onDelete }) {
  const base = recipe.servingsBase || servingsBaseOf(recipe.servings) || 0;
  const [target, setTarget] = useState(base ? String(base) : '');
  const [system, setSystem] = useState('american');

  const targetN = Number(target);
  const factor = base > 0 && Number.isFinite(targetN) && targetN > 0 ? targetN / base : 1;
  const factorLabel = factor === 1 ? '1' : (Math.round(factor * 100) / 100).toString();
  const scaled = factor !== 1;

  return (
    <div className="space-y-5">
      <button onClick={onBack} className="text-xs uppercase tracking-wider" style={{ color: MUTE }}>
        &#8592; All recipes
      </button>

      <div className="bg-white border-2 p-5 sm:p-6" style={{ borderColor: INK }}>
        <h2 className="text-2xl sm:text-3xl leading-tight" style={{ ...serif, fontWeight: 600, color: INK }}>{recipe.title}</h2>
        <div className="text-xs uppercase tracking-[0.15em] mt-2" style={{ color: ACCENT }}>{recipe.chef}</div>

        <div className="flex flex-wrap gap-x-5 gap-y-1 text-sm mt-3" style={{ color: MUTE }}>
          {recipe.servings && <span><span className="font-semibold" style={{ color: INK }}>Serves</span> {recipe.servings}</span>}
          {recipe.prepTime && <span><span className="font-semibold" style={{ color: INK }}>Prep</span> {recipe.prepTime}</span>}
          {recipe.cookTime && <span><span className="font-semibold" style={{ color: INK }}>Cook</span> {recipe.cookTime}</span>}
        </div>

        {/* Headline scaler: one number → every ingredient recomputes */}
        {base > 0 && (
          <div className="mt-4 p-3" style={{ backgroundColor: CREAM }}>
            <div className="flex items-center gap-2 flex-wrap">
              <label className="text-[0.625rem] uppercase tracking-[0.2em] font-semibold" style={{ color: MUTE }} htmlFor="scale-target">Cook for</label>
              <input
                id="scale-target"
                type="number"
                min="1"
                inputMode="numeric"
                value={target}
                onChange={(e) => setTarget(e.target.value)}
                aria-label="Number of people to cook for"
                className="w-20 border px-2 py-1.5 text-sm bg-white"
                style={{ borderColor: LINE, color: INK }}
              />
              <span className="text-sm" style={{ color: MUTE }}>people</span>
              {[1, 2, 3, 5].map((m) => (
                <button key={m} onClick={() => setTarget(String(base * m))} className="text-xs px-2.5 py-1.5 border" style={{ backgroundColor: '#fff', color: INK, borderColor: LINE }}>×{m}</button>
              ))}
              {scaled && (
                <span className="text-xs" style={{ color: ACCENT }}>scaling ×{factorLabel} from {base}</span>
              )}
            </div>
            {scaled && (
              <p className="text-xs mt-2 leading-relaxed" style={{ color: MUTE }}>
                Every ingredient below is recomputed automatically — cook one batch, then portion. Cooking times are a guide, not a multiplier: a bigger batch can need longer, so watch the food, not just the clock.
              </p>
            )}
          </div>
        )}

        {/* Units: metric AND American */}
        <div className="flex items-center gap-2 mt-3 flex-wrap">
          <span className="text-[0.625rem] uppercase tracking-[0.2em]" style={{ color: MUTE }}>Units</span>
          {SYSTEMS.map(([id, label]) => (
            <button
              key={id}
              onClick={() => setSystem(id)}
              className="text-xs px-3 py-1.5 border"
              style={system === id ? { backgroundColor: INK, color: '#fff', borderColor: INK } : { backgroundColor: '#fff', color: INK, borderColor: LINE }}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Ingredients — scaled + unit-converted via the dimension-aware engine */}
        <div className="bg-white border p-5" style={{ borderColor: LINE }}>
          <SubHead>Ingredients</SubHead>
          <div className="space-y-4">
            {recipe.ingredientSections.map((sec, i) => (
              <div key={i}>
                {sec.title && <div className="text-[0.625rem] uppercase tracking-[0.2em] font-semibold mb-1.5" style={{ color: ACCENT }}>{sec.title}</div>}
                <ul className="space-y-1.5">
                  {sec.items.map((item, j) => (
                    <IngredientLine key={j} item={item} factor={factor} system={system} />
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* Instructions */}
        <div className="bg-white border p-5" style={{ borderColor: LINE }}>
          <SubHead>Instructions</SubHead>
          <div className="space-y-4">
            {recipe.instructionSections.map((sec, i) => (
              <div key={i}>
                {sec.title && <div className="text-[0.625rem] uppercase tracking-[0.2em] font-semibold mb-1.5" style={{ color: ACCENT }}>{sec.title}</div>}
                <ol className="space-y-2">
                  {sec.steps.map((step, j) => (
                    <li key={j} className="flex gap-3 text-sm leading-relaxed" style={{ color: INK }}>
                      <span className="shrink-0 font-semibold" style={{ color: ACCENT, ...serif }}>{j + 1}.</span>
                      <span>{step}</span>
                    </li>
                  ))}
                </ol>
              </div>
            ))}
          </div>
        </div>
      </div>

      {recipe.toppings && recipe.toppings.length > 0 && (
        <div className="bg-white border p-5" style={{ borderColor: LINE }}>
          <SubHead>Optional Toppings</SubHead>
          <div className="flex flex-wrap gap-2">
            {recipe.toppings.map((t, i) => (
              <span key={i} className="text-sm px-3 py-1" style={{ backgroundColor: CREAM, color: INK }}>{t}</span>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        {recipe.storage && <InfoBlock label="Storage" body={recipe.storage} />}
        {recipe.reheating && <InfoBlock label="Reheating" body={recipe.reheating} />}
      </div>

      {recipe.chefNote && (
        <div className="border-l-4 p-4" style={{ borderColor: ACCENT, backgroundColor: CREAM }}>
          <div className="text-[0.625rem] uppercase tracking-[0.2em] font-semibold mb-1" style={{ color: ACCENT }}>Chef's Note</div>
          <p className="text-sm leading-relaxed italic" style={{ ...serif, color: INK }}>{recipe.chefNote}</p>
        </div>
      )}

      <div className="flex items-center justify-between flex-wrap gap-3 pt-2">
        <div className="flex flex-wrap gap-1.5">
          {(recipe.tags || []).map((t) => (
            <span key={t} className="text-[0.625rem] uppercase tracking-wider px-2 py-0.5" style={{ backgroundColor: CREAM, color: MUTE }}>{t}</span>
          ))}
          {recipe.dateAdded && <span className="text-[0.625rem] uppercase tracking-wider" style={{ color: MUTE }}>Added {recipe.dateAdded}</span>}
        </div>
        {onDelete && editable && (
          <button onClick={onDelete} className="text-xs px-3 py-2 border" style={{ borderColor: ACCENT, color: ACCENT }}>
            Delete recipe
          </button>
        )}
      </div>
    </div>
  );
}

// One ingredient row: scaled (full precision) + shown in the chosen unit system.
// "Both" appends the metric form in parens; an approximate cross-dimension
// equivalent (e.g. flour ~120 g) and an honest density note ride along subtly.
function IngredientLine({ item, factor, system }) {
  const d = describeIngredient(item, factor);
  const primary = system === 'metric' ? d.metric : d.american;
  const showSecondary = system === 'both' && d.dim !== 'count' && d.metric !== d.american;
  return (
    <li className="flex gap-2 text-sm leading-relaxed" style={{ color: INK }}>
      <span className="shrink-0" style={{ color: ACCENT }}>·</span>
      <span>
        {primary}
        {showSecondary && <span style={{ color: MUTE }}> ({d.metric})</span>}
        {d.altHint && <span style={{ color: MUTE }}> · {d.altHint}</span>}
        {d.note && <span className="italic" style={{ color: MUTE }}> · {d.note}</span>}
      </span>
    </li>
  );
}

function SubHead({ children }) {
  return (
    <h3 className="text-lg mb-3 pb-2 border-b" style={{ ...serif, fontWeight: 600, color: INK, borderColor: LINE }}>{children}</h3>
  );
}

function InfoBlock({ label, body }) {
  return (
    <div className="bg-white border p-4" style={{ borderColor: LINE }}>
      <div className="text-[0.625rem] uppercase tracking-[0.2em] font-semibold mb-1" style={{ color: MUTE }}>{label}</div>
      <p className="text-sm leading-relaxed" style={{ color: INK }}>{body}</p>
    </div>
  );
}

// -----------------------------------------------------------------------------
// Add — paste-import OR a sectioned manual form. Both build the same recipe shape.
// -----------------------------------------------------------------------------
const blankSection = (kind) => (kind === 'ingredients' ? { title: '', items: [''] } : { title: '', steps: [''] });

function AddView({ collection, currentUserPersona, onCancel, onSave }) {
  const [tab, setTab] = useState('photo'); // 'photo' | 'paste' | 'form'
  const [pasteText, setPasteText] = useState('');
  const [form, setForm] = useState(() => emptyForm(collection));
  const [error, setError] = useState('');
  const [ocrBusy, setOcrBusy] = useState(false);
  const [ocrProgress, setOcrProgress] = useState(0);

  const parsePaste = () => {
    const parsed = parseRecipeText(pasteText);
    setForm(recipeToForm(parsed, collection));
    setTab('form');
    setError('');
  };

  // Snap-it-and-it's-in: OCR the photo ON-DEVICE, parse to the structured form,
  // drop the user into the editable form to confirm before saving.
  const handlePhoto = async (file) => {
    if (!file) return;
    setError(''); setOcrBusy(true); setOcrProgress(0);
    try {
      const { recipe } = await importRecipeFromImage(file, setOcrProgress);
      setForm(recipeToForm(recipe, collection));
      setTab('form');
    } catch (e) {
      console.warn('[chef-photo-import] OCR failed', e);
      setError("Couldn't read that photo automatically — you can paste the text or fill it in instead.");
    } finally {
      setOcrBusy(false);
    }
  };

  const save = () => {
    const recipe = formToRecipe(form, collection);
    if (!recipe.title || recipe.title === 'Untitled Recipe') { setError('Give the recipe a title.'); setTab('form'); return; }
    if (ingredientCount(recipe) === 0) { setError('Add at least one ingredient.'); setTab('form'); return; }
    if (stepCount(recipe) === 0) { setError('Add at least one instruction step.'); setTab('form'); return; }
    onSave(recipe);
  };

  return (
    <div className="space-y-5">
      <button onClick={onCancel} className="text-xs uppercase tracking-wider" style={{ color: MUTE }}>
        &#8592; Cancel
      </button>

      <div className="flex gap-1">
        {[['photo', 'Snap a photo'], ['paste', 'Paste a recipe'], ['form', 'Fill it in']].map(([id, label]) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className="text-xs px-4 py-2 border-b-2"
            style={tab === id ? { borderColor: INK, color: INK, fontWeight: 600 } : { borderColor: 'transparent', color: MUTE }}
          >
            {label}
          </button>
        ))}
      </div>

      {error && <div className="text-sm p-3 border-l-4" style={{ borderColor: ACCENT, backgroundColor: CREAM, color: INK }}>{error}</div>}

      {tab === 'photo' ? (
        <div className="bg-white border p-5 space-y-3" style={{ borderColor: LINE }}>
          <p className="text-sm leading-relaxed" style={{ color: MUTE }}>
            Take a picture of a recipe (or pick one from your photos) and we'll read it straight into the fields — title, ingredients, steps. It then scales and converts units like any recipe. The picture stays on your device; only the open-source reader is downloaded.
          </p>
          <label className="inline-block text-xs uppercase tracking-wider px-4 py-2.5 text-white font-semibold cursor-pointer" style={{ backgroundColor: ocrBusy ? MUTE : INK }}>
            {ocrBusy ? `Reading… ${Math.round(ocrProgress * 100)}%` : 'Take / choose a photo'}
            <input
              type="file"
              accept="image/*"
              capture="environment"
              disabled={ocrBusy}
              className="hidden"
              onChange={(e) => { handlePhoto(e.target.files && e.target.files[0]); e.target.value = ''; }}
            />
          </label>
          {ocrBusy && (
            <div className="h-1 w-full" style={{ backgroundColor: LINE }}>
              <div className="h-full" style={{ width: `${Math.round(ocrProgress * 100)}%`, backgroundColor: ACCENT }} />
            </div>
          )}
          <p className="text-xs leading-relaxed" style={{ color: MUTE }}>
            Reading happens in your browser, so the first photo takes a few seconds to warm up. We'll drop you into the editable fields to confirm before saving — OCR is a first pass, not gospel.
          </p>
        </div>
      ) : tab === 'paste' ? (
        <div className="bg-white border p-5 space-y-3" style={{ borderColor: LINE }}>
          <p className="text-sm leading-relaxed" style={{ color: MUTE }}>
            Paste a full recipe in plain text — title, ingredients, instructions, storage, notes.
            We'll structure it into fields for you. Section headers like
            <span style={{ color: INK }}> Burgers:</span> or
            <span style={{ color: INK }}> Prepare the Slaw:</span> become sections automatically.
          </p>
          <textarea
            value={pasteText}
            onChange={(e) => setPasteText(e.target.value)}
            placeholder={'Vegan Street-Style Tacos | Servings: 4–6 | Prep: 15 min | Cook: 20 min\n\nIngredients\nVegan Taco Filling:\n4 bags vegan protein crumbles; 2 tbsp olive oil; 1 onion, diced; ...\n\nInstructions\nPrepare the Filling: heat olive oil...; add onions...\n\nStorage: ...  Reheating: ...\nChef\'s Note: ...'}
            rows={12}
            className="w-full border px-3 py-2 text-sm font-mono"
            style={{ borderColor: LINE, color: INK }}
          />
          <div className="flex gap-2">
            <button onClick={parsePaste} disabled={!pasteText.trim()} className="text-xs uppercase tracking-wider px-4 py-2.5 text-white font-semibold disabled:opacity-40" style={{ backgroundColor: INK }}>
              Structure it &#8594;
            </button>
          </div>
        </div>
      ) : (
        <RecipeForm form={form} setForm={setForm} />
      )}

      <div className="flex gap-2 pt-2">
        <button onClick={save} className="text-xs uppercase tracking-wider px-5 py-2.5 text-white font-semibold" style={{ backgroundColor: '#5A6E3D' }}>
          Save recipe
        </button>
        <button onClick={onCancel} className="text-xs uppercase tracking-wider px-4 py-2.5 border" style={{ borderColor: LINE, color: MUTE }}>
          Cancel
        </button>
      </div>
    </div>
  );
}

function RecipeForm({ form, setForm }) {
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  return (
    <div className="bg-white border p-5 space-y-5" style={{ borderColor: LINE }}>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Field label="Title" value={form.title} onChange={(v) => set('title', v)} full />
        <Field label="Chef / author" value={form.chef} onChange={(v) => set('chef', v)} />
        <Field label="Servings" value={form.servings} onChange={(v) => set('servings', v)} placeholder="4–6" />
        <Field label="Prep time" value={form.prepTime} onChange={(v) => set('prepTime', v)} placeholder="15 min" />
        <Field label="Cook time" value={form.cookTime} onChange={(v) => set('cookTime', v)} placeholder="25 min" />
        <Field label="Tags (comma-separated)" value={form.tags} onChange={(v) => set('tags', v)} placeholder="vegan" />
      </div>

      <SectionsEditor
        kind="ingredients"
        label="Ingredients"
        sections={form.ingredientSections}
        onChange={(s) => set('ingredientSections', s)}
      />
      <SectionsEditor
        kind="instructions"
        label="Instructions"
        sections={form.instructionSections}
        onChange={(s) => set('instructionSections', s)}
      />

      <Field label="Optional toppings (comma-separated)" value={form.toppings} onChange={(v) => set('toppings', v)} full />
      <Field label="Storage" value={form.storage} onChange={(v) => set('storage', v)} full textarea />
      <Field label="Reheating" value={form.reheating} onChange={(v) => set('reheating', v)} full textarea />
      <Field label="Chef's note" value={form.chefNote} onChange={(v) => set('chefNote', v)} full textarea />
    </div>
  );
}

// Generic editor for sectioned ingredients (items) OR instructions (steps).
function SectionsEditor({ kind, label, sections, onChange }) {
  const lineKey = kind === 'ingredients' ? 'items' : 'steps';
  const lineWord = kind === 'ingredients' ? 'ingredient' : 'step';

  const update = (next) => onChange(next);
  const setSectionTitle = (si, title) => update(sections.map((s, i) => (i === si ? { ...s, title } : s)));
  const setLine = (si, li, val) => update(sections.map((s, i) => (i === si ? { ...s, [lineKey]: s[lineKey].map((x, j) => (j === li ? val : x)) } : s)));
  const addLine = (si) => update(sections.map((s, i) => (i === si ? { ...s, [lineKey]: [...s[lineKey], ''] } : s)));
  const removeLine = (si, li) => update(sections.map((s, i) => (i === si ? { ...s, [lineKey]: s[lineKey].filter((_, j) => j !== li) } : s)));
  const addSection = () => update([...sections, blankSection(kind)]);
  const removeSection = (si) => update(sections.filter((_, i) => i !== si));

  return (
    <div>
      <div className="text-[0.625rem] uppercase tracking-[0.2em] font-semibold mb-2" style={{ color: ACCENT }}>{label}</div>
      <div className="space-y-4">
        {sections.map((sec, si) => (
          <div key={si} className="border p-3" style={{ borderColor: LINE, backgroundColor: CREAM }}>
            <div className="flex items-center gap-2 mb-2">
              <input
                type="text"
                value={sec.title}
                onChange={(e) => setSectionTitle(si, e.target.value)}
                placeholder={`Section name (optional, e.g. "House Burger Sauce")`}
                className="flex-1 border px-2 py-1.5 text-sm bg-white"
                style={{ borderColor: LINE, color: INK }}
              />
              {sections.length > 1 && (
                <button onClick={() => removeSection(si)} className="text-xs px-2 py-1" style={{ color: ACCENT }} aria-label="Remove section">Remove</button>
              )}
            </div>
            <div className="space-y-1.5">
              {sec[lineKey].map((line, li) => (
                <div key={li} className="flex items-start gap-2">
                  <span className="text-xs mt-2 shrink-0 w-4 text-right" style={{ color: MUTE }}>{kind === 'instructions' ? `${li + 1}.` : '·'}</span>
                  <textarea
                    value={line}
                    onChange={(e) => setLine(si, li, e.target.value)}
                    rows={kind === 'instructions' ? 2 : 1}
                    placeholder={`Add ${lineWord}`}
                    className="flex-1 border px-2 py-1.5 text-sm bg-white resize-y"
                    style={{ borderColor: LINE, color: INK }}
                  />
                  {sec[lineKey].length > 1 && (
                    <button onClick={() => removeLine(si, li)} className="text-sm mt-1.5 shrink-0" style={{ color: MUTE }} aria-label={`Remove ${lineWord}`}>&times;</button>
                  )}
                </div>
              ))}
            </div>
            <button onClick={() => addLine(si)} className="text-xs uppercase tracking-wider mt-2" style={{ color: '#5A6E3D' }}>+ Add {lineWord}</button>
          </div>
        ))}
      </div>
      <button onClick={addSection} className="text-xs uppercase tracking-wider mt-2" style={{ color: INK }}>+ Add section</button>
    </div>
  );
}

function Field({ label, value, onChange, placeholder, full, textarea }) {
  return (
    <label className={`block ${full ? 'sm:col-span-2' : ''}`}>
      <span className="text-[0.625rem] uppercase tracking-[0.2em] font-semibold block mb-1" style={{ color: MUTE }}>{label}</span>
      {textarea ? (
        <textarea value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} rows={2} className="w-full border px-2 py-1.5 text-sm bg-white" style={{ borderColor: LINE, color: INK }} />
      ) : (
        <input type="text" value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className="w-full border px-2 py-1.5 text-sm bg-white" style={{ borderColor: LINE, color: INK }} />
      )}
    </label>
  );
}

// ---- form <-> recipe mapping helpers ----------------------------------------
function emptyForm(collection) {
  return {
    title: '', chef: collection.chef, servings: '', prepTime: '', cookTime: '',
    ingredientSections: [blankSection('ingredients')],
    instructionSections: [blankSection('instructions')],
    toppings: '', storage: '', reheating: '', chefNote: '', tags: 'vegan',
  };
}

function recipeToForm(recipe, collection) {
  const ing = (recipe.ingredientSections || []).length
    ? recipe.ingredientSections.map((s) => ({ title: s.title || '', items: s.items.length ? [...s.items] : [''] }))
    : [blankSection('ingredients')];
  const ins = (recipe.instructionSections || []).length
    ? recipe.instructionSections.map((s) => ({ title: s.title || '', steps: s.steps.length ? [...s.steps] : [''] }))
    : [blankSection('instructions')];
  return {
    title: recipe.title === 'Untitled Recipe' ? '' : recipe.title,
    chef: recipe.chef || collection.chef,
    servings: recipe.servings || '',
    prepTime: recipe.prepTime || '',
    cookTime: recipe.cookTime || '',
    ingredientSections: ing,
    instructionSections: ins,
    toppings: (recipe.toppings || []).join(', '),
    storage: recipe.storage || '',
    reheating: recipe.reheating || '',
    chefNote: recipe.chefNote || '',
    tags: (recipe.tags || ['vegan']).join(', '),
  };
}

function formToRecipe(form, collection) {
  return makeRecipe({
    title: form.title,
    chef: form.chef,
    collection: collection.id,
    servings: form.servings,
    servingsBase: servingsBaseOf(form.servings),
    prepTime: form.prepTime,
    cookTime: form.cookTime,
    ingredientSections: form.ingredientSections
      .map((s) => ({ title: s.title.trim() || null, items: s.items.map((i) => i.trim()).filter(Boolean) }))
      .filter((s) => s.items.length),
    instructionSections: form.instructionSections
      .map((s) => ({ title: s.title.trim() || null, steps: s.steps.map((i) => i.trim()).filter(Boolean) }))
      .filter((s) => s.steps.length),
    toppings: form.toppings.split(',').map((t) => t.trim()).filter(Boolean),
    storage: form.storage,
    reheating: form.reheating,
    chefNote: form.chefNote,
    tags: form.tags.split(',').map((t) => t.trim()).filter(Boolean),
  });
}
