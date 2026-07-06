export type RecipeStatus = 'Fertig' | 'In Bearbeitung' | 'Entwurf';
export type RecipeDifficulty = 'Leicht' | 'Mittel' | 'Schwer';
export type Season = 'Frühling' | 'Sommer' | 'Herbst' | 'Winter' | 'Ganzjährig';
export type RecipeCategory = 'Vorspeise' | 'Suppe' | 'Hauptgang' | 'Dessert' | 'Beilage' | 'Snack';

export interface RecipeIngredient {
  name: string;
  menge: string;
}

export interface RecipeKomponente {
  name: string;
  zutaten: RecipeIngredient[];
  zubereitung: string;
}

export interface Recipe {
  id: number;
  title: string;
  category: RecipeCategory;
  tags: string[];
  difficulty: RecipeDifficulty;
  time: number;
  season: Season;
  status: RecipeStatus;
  rating: number;
  image: string | null;
  description: string;
  lastEdited: string;
  views: number;
  zutaten?: RecipeIngredient[];
  komponenten?: RecipeKomponente[];
  schritte?: string[];
  getraenke?: string;
  chefTipps?: string;
  geschmack?: FlavorProfile | null;
}

export interface Idea {
  id: number;
  text: string;
  tag: string;
  date: string;
}

export interface AiMessage {
  role: 'user' | 'assistant';
  text: string;
}

// ─── Kreativlabor ────────────────────────────────────────────────────────────
export interface CreativeResult {
  id: number;
  name: string;
  concept: string;
  ingredients: { name: string; amount: string; note: string }[];
  techniques: string[];
  preparation: string[];
  plating: string;
  inputStyle: string;
  generatedAt: string;
  saved: boolean;
}

// ─── Zutatenbibliothek ───────────────────────────────────────────────────────
export interface FlavorProfile {
  acidity: number;
  sweetness: number;
  bitterness: number;
  umami: number;
  spiciness: number;
  saltiness: number;
}

export interface Ingredient {
  id: number;
  name: string;
  kategorie: string;
  saison: string[];
  herkunft: string;
  aromaprofil: string[];
  geschmack: FlavorProfile;
  pairings: string[];
  beschreibung: string;
  lagertemp: string;
  einheit: string;
  image_url?: string | null;
}

// ─── Menügenerator ───────────────────────────────────────────────────────────
export interface MenuCourse {
  position: number;
  type: string;
  dish: string;
  description: string;
  wine: string;
  wineNote: string;
}

export interface GeneratedMenu {
  id: number;
  name: string;
  region: string;
  season: string;
  style: string;
  courses: MenuCourse[];
  overallNote: string;
  createdAt: string;
  saved: boolean;
}

// ─── Projekte ────────────────────────────────────────────────────────────────
export interface ProjectNote {
  id: number;
  text: string;
  date: string;
}

// Ein Gang innerhalb eines Projekt-Menüs. rezeptId/weinId sind lose
// Referenzen (kein DB-FK, wie recipeIds); weinName ist ein Snapshot,
// damit die Menükarte auch nach einem geloeschten Wein noch etwas anzeigt.
export interface MenuGang {
  id: string;
  bezeichnung: string;
  rezeptId: number | null;
  weinId: number | null;
  weinName: string | null;
}

export interface ProjectMenu {
  id: string;
  name: string;
  beschreibung: string;
  gaenge: MenuGang[];
  createdAt: string;
}

export interface Project {
  id: number;
  name: string;
  description: string;
  color: string;
  createdAt: string;
  recipeIds: number[];
  menus: ProjectMenu[];
  notes: ProjectNote[];
  status: 'Aktiv' | 'Abgeschlossen' | 'Pausiert';
}
