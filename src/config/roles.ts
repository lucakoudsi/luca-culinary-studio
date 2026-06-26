export const ADMIN_EMAIL = 'luca.koudsi@gmail.com';

export const ALL_TITLES = [
  'Gast / Beobachter',
  'Gastronom',
  'Hobbykoch',
  'Jungkoch / Auszubildende:r',
  'Commis',
  'Chef de Partie',
  'Pâtissier',
  'Food-Entwickler',
  'Sous-Chef',
  'Küchenchef',
  'Kulinarischer Berater',
  'Chef & Creator',
];

export const STUFEN = [
  { stufe: 1, label: 'Stufe 1 · Gast',      desc: 'Dashboard + Rezepte ansehen'                 },
  { stufe: 2, label: 'Stufe 2 · Einsteiger', desc: '+ Zutaten, Rezepte erstellen, Fermentation'  },
  { stufe: 3, label: 'Stufe 3 · Profi',      desc: '+ Projekte, Mein Stil'                       },
  { stufe: 4, label: 'Stufe 4 · Leitung',    desc: '+ Wein & Pairing, KI-Funktionen'            },
];

// Minimum tier required per route prefix
export const PAGE_MIN_TIER: Record<string, number> = {
  '/':              1,
  '/rezepte':       1,
  '/ki-sous-chef':  1,
  '/profil':        1,
  '/zutaten':       2,
  '/saison':        2,
  '/fermentation':  2,
  '/projekte':      3,
  '/wein-pairing':  4,
  '/kreativlabor':  4,
  '/menuegenerator':4,
  '/tellerdesigner':4,
};

// Tier now comes directly from profiles.stufe, not from the titel
export function getUserTier(email: string | null | undefined, stufe: number | null | undefined): number {
  if (email === ADMIN_EMAIL) return 99;
  return stufe ?? 1;
}

// Returns the minimum tier required for a given pathname
export function getMinTierForPath(pathname: string): number {
  let best = 1;
  let bestLen = 0;
  for (const [prefix, tier] of Object.entries(PAGE_MIN_TIER)) {
    if (pathname === prefix || pathname.startsWith(prefix + '/')) {
      if (prefix.length > bestLen) { best = tier; bestLen = prefix.length; }
    }
  }
  return best;
}
