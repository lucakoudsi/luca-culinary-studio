// Findet ein schema.org/Recipe JSON-LD-Objekt im rohen HTML einer Rezeptseite
// (Chefkoch, Blogs, Zeitungen betten das ueberwiegend so ein) und mappt es auf
// unser Rezept-Datenmodell. Regex-basiertes Auslesen der <script
// type="application/ld+json">-Bloecke statt eines vollen DOM-Parsers -- wir
// brauchen nur die Script-Inhalte, nicht die Seitenstruktur.

import { splitIngredientLine } from './ingredientParse';

export type ImportedRecipe = {
  title: string;
  description: string;
  zutaten: { name: string; menge: string }[];
  schritte: string[];
  time?: number;
  portionen?: number;
  category?: string;
  imageUrl?: string;
};

const JSONLD_RE = /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;

function typeIncludes(type: unknown, target: string): boolean {
  if (typeof type === 'string') return type.toLowerCase() === target.toLowerCase();
  if (Array.isArray(type)) return type.some(t => typeof t === 'string' && t.toLowerCase() === target.toLowerCase());
  return false;
}

function findRecipe(node: unknown): Record<string, unknown> | null {
  if (Array.isArray(node)) {
    for (const item of node) {
      const found = findRecipe(item);
      if (found) return found;
    }
    return null;
  }
  if (node && typeof node === 'object') {
    const obj = node as Record<string, unknown>;
    if (typeIncludes(obj['@type'], 'Recipe')) return obj;
    if (Array.isArray(obj['@graph'])) {
      const found = findRecipe(obj['@graph']);
      if (found) return found;
    }
    return null;
  }
  return null;
}

export function extractRecipeJsonLd(html: string): Record<string, unknown> | null {
  for (const m of Array.from(html.matchAll(JSONLD_RE))) {
    const raw = m[1].trim();
    if (!raw) continue;
    let parsed: unknown;
    try {
      parsed = JSON.parse(raw);
    } catch {
      continue; // kaputtes JSON-LD -> ueberspringen, nicht abbrechen
    }
    const recipe = findRecipe(parsed);
    if (recipe) return recipe;
  }
  return null;
}

// ISO-8601-Dauer ("PT1H15M") -> Minuten
function parseIsoDuration(d: unknown): number | undefined {
  if (typeof d !== 'string') return undefined;
  const m = d.match(/^PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?$/i);
  if (!m) return undefined;
  const total = Number(m[1] ?? 0) * 60 + Number(m[2] ?? 0) + Math.round(Number(m[3] ?? 0) / 60);
  return total > 0 ? total : undefined;
}

function firstString(v: unknown): string | undefined {
  if (typeof v === 'string') return v;
  if (Array.isArray(v)) {
    for (const item of v) {
      const s = firstString(item);
      if (s) return s;
    }
    return undefined;
  }
  if (v && typeof v === 'object') {
    const obj = v as Record<string, unknown>;
    if (typeof obj.url === 'string') return obj.url;
    if (typeof obj['@id'] === 'string') return obj['@id'];
  }
  return undefined;
}

function instructionsToSteps(v: unknown): string[] {
  if (typeof v === 'string') {
    return v.split(/\r?\n+/).map(s => s.trim()).filter(Boolean);
  }
  if (Array.isArray(v)) {
    const steps: string[] = [];
    for (const item of v) {
      if (typeof item === 'string') {
        steps.push(item.trim());
      } else if (item && typeof item === 'object') {
        const obj = item as Record<string, unknown>;
        if (typeIncludes(obj['@type'], 'HowToSection') && Array.isArray(obj.itemListElement)) {
          steps.push(...instructionsToSteps(obj.itemListElement));
        } else if (typeof obj.text === 'string') {
          steps.push(obj.text.trim());
        } else if (typeof obj.name === 'string') {
          steps.push(obj.name.trim());
        }
      }
    }
    return steps.filter(Boolean);
  }
  return [];
}

function yieldToPortionen(v: unknown): number | undefined {
  const s = Array.isArray(v) ? v[0] : v;
  if (typeof s === 'number') return Math.round(s);
  if (typeof s === 'string') {
    const m = s.match(/\d+/);
    if (m) return Number(m[0]);
  }
  return undefined;
}

const CATEGORY_KEYWORDS: [RegExp, string][] = [
  [/dessert|nachspeise|nachtisch|süßspeise/i, 'Dessert'],
  [/vorspeise|starter|appetizer|antipasto/i, 'Vorspeise'],
  [/suppe|soup/i, 'Suppe'],
  [/beilage|side/i, 'Beilage'],
  [/snack/i, 'Snack'],
  [/hauptgang|hauptspeise|main|entr[ée]e/i, 'Hauptgang'],
];

function mapCategory(v: unknown): string | undefined {
  const s = firstString(v) ?? (Array.isArray(v) ? v.filter(x => typeof x === 'string').join(' ') : undefined);
  if (!s) return undefined;
  for (const [re, cat] of CATEGORY_KEYWORDS) {
    if (re.test(s)) return cat;
  }
  return undefined;
}

export function mapSchemaOrgRecipe(raw: Record<string, unknown>): ImportedRecipe {
  const ingredients = Array.isArray(raw.recipeIngredient) ? raw.recipeIngredient : [];
  const zutaten = ingredients
    .filter((i): i is string => typeof i === 'string' && i.trim().length > 0)
    .map(splitIngredientLine);

  const prep = parseIsoDuration(raw.prepTime) ?? 0;
  const cook = parseIsoDuration(raw.cookTime) ?? 0;

  return {
    title: typeof raw.name === 'string' ? raw.name.trim() : '',
    description: typeof raw.description === 'string' ? raw.description.trim() : '',
    zutaten,
    schritte: instructionsToSteps(raw.recipeInstructions),
    time: parseIsoDuration(raw.totalTime) ?? ((prep + cook) > 0 ? prep + cook : undefined),
    portionen: yieldToPortionen(raw.recipeYield),
    category: mapCategory(raw.recipeCategory),
    imageUrl: firstString(raw.image),
  };
}
