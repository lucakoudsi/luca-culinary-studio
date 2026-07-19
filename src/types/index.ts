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
  portionen: number;
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
  // Optional, nur gefuellt wenn der Gang aus dem Menuegenerator (KI) stammt --
  // manuell angelegte Gaenge lassen diese Felder einfach weg.
  beschreibung?: string;
  hauptzutaten?: string[];
  geschmacksprofil?: Partial<FlavorProfile>;
  zubereitungsidee?: string;
  technik?: string;
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

// ─── Tellerdesigner ──────────────────────────────────────────────────────────
import type { Aufwandsstufe } from '@/config/techniken';
import type { Stilrichtung } from '@/config/tellerStilrichtung';
import type { AnrichteFokus } from '@/config/tellerAnrichteFokus';

// Eine einzelne Anrichte-Technik fuer die Label-Darstellung um den Teller:
// "schlagwort" + "kurzsatz" bilden das dauerhaft sichtbare Label, "anleitung"
// ist der laengere Ausfuehrungstext, der erst bei Hover/Klick erscheint.
export interface TellerTechnik {
  schlagwort: string;
  kurzsatz: string;
  anleitung: string;
}

// Eine generierte Bild-Variante innerhalb der aktuellen Sitzung (Client-State,
// nicht persistiert -- persistiert wird erst per "Speichern" als TellerDesignRow).
// "toured" steuert, ob TellerStage beim Mounten die gefuehrte Tour abspielt
// (nur bei frisch generierten Varianten, nicht beim erneuten Anzeigen).
export interface TellerVariante {
  id: string;
  image: string;
  techniken: TellerTechnik[];
  titel?: string;
  aufwand: Aufwandsstufe;
  stilrichtung: Stilrichtung;
  anrichteFokus: AnrichteFokus;
  toured: boolean;
  /** Gesetzt nach erfolgreichem "Speichern" -- die oeffentliche Storage-URL (nicht mehr die grosse Base64-Data-URL). Praesenz = gespeichert. */
  savedUrl?: string;
}

// Eine gespeicherte Galerie-Zeile aus public.tellerdesigns (siehe
// GET /api/tellerdesigner/designs) -- Snapshot der Design-Parameter zum
// Speicherzeitpunkt, nicht live aus dem Rezept nachgeladen.
export interface TellerDesignRow {
  id: string;
  createdAt: string;
  bildUrl: string;
  rezeptId: number | null;
  titel: string;
  stil: string | null;
  schwierigkeit: string | null;
  zubereitungszeit: number | null;
  saison: string | null;
  anrichteFokus: string | null;
  techniken: TellerTechnik[];
  modus: 'rezept' | 'frei';
}
