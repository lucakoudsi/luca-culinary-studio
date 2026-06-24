export const ADMIN_EMAIL = 'luca.koudsi@gmail.com';

export const TITLE_TO_TIER: Record<string, number> = {
  'Gast / Beobachter': 1, 'Gastronom': 1,
  'Hobbykoch': 2, 'Jungkoch / Auszubildende:r': 2, 'Commis': 2,
  'Chef de Partie': 3, 'Pâtissier': 3, 'Food-Entwickler': 3,
  'Sous-Chef': 4, 'Küchenchef': 4, 'Kulinarischer Berater': 4, 'Chef & Creator': 4,
};

// Minimum tier required per route prefix
export const PAGE_MIN_TIER: Record<string, number> = {
  '/':              1,
  '/rezepte':       1,
  '/ki-sous-chef':  1,
  '/profil':        1,
  '/zutaten':       2,
  '/fermentation':  2,
  '/projekte':      3,
  '/mein-stil':     3,
  '/wein-pairing':  4,
  '/kreativlabor':  4,
  '/menuegenerator':4,
  '/tellerdesigner':4,
};

export function getUserTier(email: string | null | undefined, titel: string | null | undefined): number {
  if (email === ADMIN_EMAIL) return 99;
  return TITLE_TO_TIER[titel ?? ''] ?? 1;
}

// Returns the minimum tier required for a given pathname
export function getMinTierForPath(pathname: string): number {
  // Longest matching prefix wins
  let best = 1;
  let bestLen = 0;
  for (const [prefix, tier] of Object.entries(PAGE_MIN_TIER)) {
    if (pathname === prefix || pathname.startsWith(prefix + '/')) {
      if (prefix.length > bestLen) { best = tier; bestLen = prefix.length; }
    }
  }
  return best;
}
