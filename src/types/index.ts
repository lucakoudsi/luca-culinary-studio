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
export type IngredientCategory =
  | 'Gemüse' | 'Fleisch' | 'Fisch & Meeresfrüchte' | 'Pilze' | 'Kräuter & Gewürze'
  | 'Obst' | 'Nüsse & Samen' | 'Milchprodukte & Käse' | 'Getreide & Hülsenfrüchte'
  | 'Öle & Fette' | 'Fermentiertes';

export interface FlavorProfile {
  acidity: number;    // 0–5
  sweetness: number;  // 0–5
  bitterness: number; // 0–5
  umami: number;      // 0–5
  spiciness: number;  // 0–5
  saltiness: number;  // 0–5
}

export interface Ingredient {
  id: number;
  name: string;
  category: IngredientCategory;
  seasons: Season[];
  origin: string;
  aromas: string[];
  flavor: FlavorProfile;
  pairings: string[];
  description: string;
  storageTemp: string;
  unit: string;
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

export interface Project {
  id: number;
  name: string;
  description: string;
  color: string;
  createdAt: string;
  recipeIds: number[];
  menuIds: number[];
  notes: ProjectNote[];
  status: 'Aktiv' | 'Abgeschlossen' | 'Pausiert';
}
