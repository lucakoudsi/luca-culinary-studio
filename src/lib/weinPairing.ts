'use client';

// ─── Types ────────────────────────────────────────────────────────────────────

// Food flavor profile — same 6 axes as Ingredient.geschmack (scale 0–5)
export interface FoodProfile {
  acidity:    number;
  sweetness:  number;
  bitterness: number;
  umami:      number;
  spiciness:  number;
  saltiness:  number;
}

// Wine flavor profile — 5 wine-specific axes (scale 0–5)
export interface WeinProfil {
  acidity:    number; // Säure
  sweetness:  number; // Restsüße
  tannin:     number; // Tannin
  body:       number; // Körper / Fülle (Alkohol-Proxy)
  fruitiness: number; // Fruchtigkeit
}

export interface Wein {
  id:           number;
  name:         string;
  typ:          'weiss' | 'rot' | 'rose' | 'schaumwein' | 'suesswein';
  rebsorte:     string;
  region:       string;
  land:         string;
  beschreibung: string | null;
  profil:       WeinProfil;
}

export interface WeinMatch {
  wein:   Wein;
  score:  number;   // 0–100 normalised
  gründe: string[]; // top-2 rule labels for "passt wegen…"
}

type RuleResult = { points: number; label: string };

// Max raw score: 7 rules × 5 points = 35
const MAX_RAW = 35;

// ─── Pairing rules ────────────────────────────────────────────────────────────

// Rule 1 · Säure-Harmonie
// High-acid food needs equally high-acid wine; mismatch makes wine taste flat/flabby
function ruleAcidity(food: FoodProfile, wine: WeinProfil): RuleResult {
  const diff = Math.abs(food.acidity - wine.acidity);
  return { points: Math.max(0, 5 - diff * 1.5), label: 'Säure-Harmonie' };
}

// Rule 2 · Süße-Asymmetrie
// Wine must be at least as sweet as food — a drier wine tastes sour next to sweet dishes
function ruleSweetness(food: FoodProfile, wine: WeinProfil): RuleResult {
  const diff = wine.sweetness - food.sweetness;
  const points = diff >= 0
    ? Math.max(0, 5 - diff * 0.5) // wine sweeter/equal: small penalty for excess
    : Math.max(0, 5 + diff * 3);  // wine drier: heavy penalty (×3)
  return { points, label: 'Süße-Balance' };
}

// Rule 3 · Umami-Tannin-Bremse
// Umami amplifies tannin astringency → high umami + high tannin = unpleasant harshness
function ruleUmamiTannin(food: FoodProfile, wine: WeinProfil): RuleResult {
  const clash = (food.umami * wine.tannin) / 5; // 0–5
  return { points: Math.max(0, 5 - clash), label: 'Umami-Tannin-Balance' };
}

// Rule 4 · Bitter-Frucht-Ausgleich
// Fruity wines soften food bitterness (dark vegetables, chicory, dark chocolate)
function ruleBitterFruit(food: FoodProfile, wine: WeinProfil): RuleResult {
  const points = food.bitterness > 0
    ? (food.bitterness * wine.fruitiness) / 5
    : 3; // neutral when no bitterness
  return { points, label: 'Bitter-Frucht-Ausgleich' };
}

// Rule 5 · Schärfe-Süße-Kühlung
// Residual sugar dampens perceived chilli heat; high alcohol (body proxy) amplifies it
function ruleSpiciness(food: FoodProfile, wine: WeinProfil): RuleResult {
  if (food.spiciness === 0) return { points: 5, label: 'Schärfe-Balance' };
  const cooling = (food.spiciness * wine.sweetness) / 5;
  const heating = (food.spiciness * wine.body) / 10;
  return {
    points: Math.max(0, 5 - food.spiciness * 0.5 + cooling - heating),
    label: 'Schärfe-Süße-Kühlung',
  };
}

// Rule 6 · Salz-Säure-Klassik
// Salt + acid = classic pairing (oysters + Champagne, feta + crisp white)
function ruleSaltyAcidity(food: FoodProfile, wine: WeinProfil): RuleResult {
  const points = food.saltiness > 0
    ? (food.saltiness * wine.acidity) / 5
    : 3; // neutral when no saltiness
  return { points, label: 'Salz-Säure-Klassik' };
}

// Rule 7 · Gewichts-Harmonie
// Dish weight (umami + salt + sweetness) should match wine body;
// a heavy dish dominates a light wine and vice versa
function ruleBody(food: FoodProfile, wine: WeinProfil): RuleResult {
  const dishWeight = (food.umami + food.saltiness + food.sweetness) / 3;
  const diff = Math.abs(dishWeight - wine.body);
  return { points: Math.max(0, 5 - diff * 1.2), label: 'Gewichts-Harmonie' };
}

// ─── Main matcher ─────────────────────────────────────────────────────────────

export function matchWeine(food: FoodProfile, weine: Wein[]): WeinMatch[] {
  return weine
    .map(wein => {
      const rules: RuleResult[] = [
        ruleAcidity(food, wein.profil),
        ruleSweetness(food, wein.profil),
        ruleUmamiTannin(food, wein.profil),
        ruleBitterFruit(food, wein.profil),
        ruleSpiciness(food, wein.profil),
        ruleSaltyAcidity(food, wein.profil),
        ruleBody(food, wein.profil),
      ];

      const raw   = rules.reduce((s, r) => s + r.points, 0);
      const score = Math.round(Math.min(raw / MAX_RAW, 1) * 100);

      // Top-2 contributing rules → "passt wegen…" UI text
      const gründe = [...rules]
        .sort((a, b) => b.points - a.points)
        .slice(0, 2)
        .map(r => r.label);

      return { wein, score, gründe };
    })
    .sort((a, b) => b.score - a.score);
}

// Human-readable label map for UI
export const RULE_LABELS: Record<string, string> = {
  'Säure-Harmonie':          'harmonische Säure',
  'Süße-Balance':            'ausgeglichene Süße',
  'Umami-Tannin-Balance':    'sanfte Tannine zum Umami',
  'Bitter-Frucht-Ausgleich': 'Frucht puffert Bitterkeit',
  'Schärfe-Balance':         'neutrale Schärfe-Wirkung',
  'Schärfe-Süße-Kühlung':    'Restsüße kühlt die Schärfe',
  'Salz-Säure-Klassik':      'Säure harmoniert mit Salzigkeit',
  'Gewichts-Harmonie':       'passendes Weingewicht',
};
