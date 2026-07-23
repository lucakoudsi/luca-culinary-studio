// Monatliches Text-KI-Kontingent, gestaffelt nach Abo-Stufe (siehe
// docs/text-quota.sql fuer Herleitung/Diskussion). Gleiches Muster wie
// imageQuota.ts, aber gewichteter statt fixer Verbrauch pro Aktion --
// ein Menuegenerator-Aufruf kostet spuerbar mehr als eine Chat-Nachricht,
// das Kontingent soll das widerspiegeln statt beides gleich zu zaehlen.
//
// Eigenstaendiges Modul (kein supabase-admin-Import) -- kann so auch von
// Frontend-Code importiert werden, ohne den Admin-Client ins Client-Bundle
// zu ziehen (gleiche Begruendung wie imageQuota.ts).
export const TEXT_QUOTA_BY_TIER: Record<number, number> = {
  1: 0,   // Free -- keine der 5 Text-KI-Routen ist unter Tier 1 erreichbar
  2: 150, // Basic
  3: 375, // Pro
  4: 900, // Team (aktuell pro Nutzer, nicht geteilt -- siehe TO_CHANGE.md.txt)
};

const TEAM_TIER = 4;
const TEAM_TIER_LIMIT = TEXT_QUOTA_BY_TIER[TEAM_TIER];

export const ADMIN_UNLIMITED_TEXT_LIMIT = 999_999;

// Gleicher Fallback-Gedanke wie getMonthlyImageLimit(): TEXT_QUOTA_BY_TIER
// deckt nur 1-4 ab, alles ab Team-Stufe (inkl. dem synthetischen Admin-Tier
// 99) bekommt mindestens das Team-Kontingent, Tier 99 unbegrenzt.
export function getMonthlyTextLimit(tier: number): number {
  if (tier >= 99) return ADMIN_UNLIMITED_TEXT_LIMIT;
  if (tier >= TEAM_TIER) return TEXT_QUOTA_BY_TIER[tier] ?? TEAM_TIER_LIMIT;
  return TEXT_QUOTA_BY_TIER[tier] ?? 0;
}

// Einheiten pro Aktion (1 Einheit ≈ 0,7 ct, der Chat-Basiswert). Siehe
// docs/text-quota.sql fuer die Kostenherleitung pro Feature.
export const TEXT_QUOTA_WEIGHTS = {
  chat: 1,          // /api/ki/chat
  sousChefText: 2,  // /api/rezepte/sous-chef, ohne angehaengte Bilder
  importText: 2,    // /api/rezepte/import-ki
  menue: 3,         // /api/menuegenerator
  vision: 7,         // /api/rezepte/import-bild, ODER sous-chef MIT Bildern -- ab
                      // 2026-07-23 detail:"high" statt "auto" (siehe import-bild/
                      // route.ts), teurer pro Bild durch mehr Tiles/Tokens.
} as const;
