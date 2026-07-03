import type { FlavorProfile, Ingredient, RecipeIngredient, RecipeKomponente } from '@/types';

/** Collects all ingredient names from flat list + all komponenten */
export function collectIngredientNames(
  zutaten: RecipeIngredient[],
  komponenten: RecipeKomponente[],
): string[] {
  const names: string[] = [];
  for (const z of zutaten)          { if (z.name.trim()) names.push(z.name.trim()); }
  for (const k of komponenten)       { for (const z of k.zutaten) { if (z.name.trim()) names.push(z.name.trim()); } }
  return names;
}

/**
 * Finds the best library match for one recipe ingredient name.
 * Priority (highest wins):
 *  1. Exact (case-insensitive)
 *  2. Recipe name starts with library name  → "Lachsfilet" starts with "Lachs"
 *  3. Library name starts with recipe name  → "Lachs geräuchert" starts with "lachs"
 *  4. Recipe name contains library name     → "Knoblauchzehe" contains "Knoblauch"
 *
 * Rules 2-4 pick the LONGEST matching library name (most specific wins).
 * Minimum length guards prevent short words ("Öl", "Ei") from causing false positives.
 */
function findLibraryMatch(query: string, library: Ingredient[]): Ingredient | null {
  const q = query.toLowerCase().trim();
  if (q.length < 2) return null;

  // Rule 1: exact
  const exact = library.find(i => i.name.toLowerCase() === q);
  if (exact) return exact;

  // Rule 2: recipe name starts with library name (e.g. "Lachsfilet" → "Lachs")
  const r2 = library
    .filter(i => i.name.length >= 3 && q.startsWith(i.name.toLowerCase()))
    .sort((a, b) => b.name.length - a.name.length)[0];
  if (r2) return r2;

  // Rule 3: library name starts with recipe name (e.g. "Lachs geräuchert" when query is "Lachs")
  const r3 = library
    .filter(i => q.length >= 3 && i.name.toLowerCase().startsWith(q))
    .sort((a, b) => b.name.length - a.name.length)[0];
  if (r3) return r3;

  // Rule 4: recipe name contains library name (min 4 chars to guard against "Ei", "Öl")
  const r4 = library
    .filter(i => i.name.length >= 4 && q.includes(i.name.toLowerCase()))
    .sort((a, b) => b.name.length - a.name.length)[0];
  if (r4) return r4;

  return null;
}

/** Averages profiles from MATCHED ingredients only — unmatched don't contribute. */
function averageProfiles(profiles: FlavorProfile[]): FlavorProfile {
  if (profiles.length === 0) {
    return { acidity: 0, sweetness: 0, bitterness: 0, umami: 0, spiciness: 0, saltiness: 0 };
  }
  const axes: (keyof FlavorProfile)[] = ['acidity', 'sweetness', 'bitterness', 'umami', 'spiciness', 'saltiness'];
  const result = {} as FlavorProfile;
  for (const ax of axes) {
    result[ax] = Math.round(profiles.reduce((sum, p) => sum + p[ax], 0) / profiles.length);
  }
  return result;
}

export interface FlavorComputeResult {
  profile:   FlavorProfile;
  matched:   string[];   // library names that were found
  unmatched: string[];   // recipe ingredient names with no library match
}

/**
 * Computes a FlavorProfile for a recipe by matching its ingredients against
 * the library and averaging the profiles of matched ones.
 * Ingredient names are deduplicated before matching.
 */
export function computeRecipeFlavorProfile(
  zutaten:     RecipeIngredient[],
  komponenten: RecipeKomponente[],
  library:     Ingredient[],
): FlavorComputeResult {
  const names = collectIngredientNames(zutaten, komponenten);

  // Deduplicate (case-insensitive) before matching
  const seen = new Set<string>();
  const unique = names.filter(n => {
    const k = n.toLowerCase();
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });

  const matched:   string[]        = [];
  const unmatched: string[]        = [];
  const profiles:  FlavorProfile[] = [];

  for (const name of unique) {
    const lib = findLibraryMatch(name, library);
    if (lib) {
      matched.push(lib.name);
      profiles.push(lib.geschmack);
    } else {
      unmatched.push(name);
    }
  }

  return { profile: averageProfiles(profiles), matched, unmatched };
}

export const EMPTY_FLAVOR: FlavorProfile = {
  acidity: 0, sweetness: 0, bitterness: 0, umami: 0, spiciness: 0, saltiness: 0,
};
