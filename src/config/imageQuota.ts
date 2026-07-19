// Monatliches Bild-Kontingent fuer den Tellerdesigner, gestaffelt nach
// Abo-Stufe (docs/abo-konzept.md.txt Abschnitt 2/5). Getrennt von
// rate-limit.ts (Missbrauchsschutz) -- hier geht es um ein Produkt-
// Entitlement mit Kalendermonat-Fenster statt Minuten/Tag.
//
// Eigenstaendiges Modul (kein supabase-admin-Import) -- wird sowohl von
// src/lib/image-quota.ts (serverseitig) als auch direkt vom Tellerdesigner-
// Frontend importiert, um "unbegrenzt" korrekt anzuzeigen. Ein Import aus
// image-quota.ts wuerde den Admin-Client (Service-Role-Key-Nutzung) in den
// Client-Bundle ziehen.
export const IMAGE_QUOTA_BY_TIER: Record<number, number> = {
  1: 0,   // Free
  2: 0,   // Basic -- Tellerdesigner ist Pro-exklusiv
  3: 150, // Pro
  4: 350, // Team (gesenkt von 500 -- Marge fiel bei voller Ausschoepfung auf ~44%,
          // siehe abo-konzept.md.txt Abschnitt 11. Aktuell pro Nutzer, nicht
          // geteilt -- siehe TO_CHANGE.md.txt und die offene Team-Frage ebenda.)
};

const TEAM_TIER = 4;
const TEAM_TIER_LIMIT = IMAGE_QUOTA_BY_TIER[TEAM_TIER];
// Sentinel statt echtem Infinity/null: muss als JSON-Zahl an die Postgres-RPC
// (p_monthly_limit) durchgereicht werden koennen. 999999 ist praktisch
// unbegrenzt (kein Nutzer generiert das in einem Monat) und bleibt sicher
// innerhalb des Integer-Bereichs der RPC-Parameter.
export const ADMIN_UNLIMITED_IMAGE_LIMIT = 999_999;

// IMAGE_QUOTA_BY_TIER deckt nur 1-4 ab. Ohne Fallback wuerde jede Stufe
// darueber (allen voran der synthetische Admin-Tier 99, siehe getUserTier())
// beim Tabellen-Lookup auf "?? 0" fallen -- ausgerechnet der Admin haette dann
// ein Null-Kontingent. Alles ab Team-Stufe bekommt mindestens das
// Team-Kontingent, Tier 99 (Admin) unbegrenzt.
export function getMonthlyImageLimit(tier: number): number {
  if (tier >= 99) return ADMIN_UNLIMITED_IMAGE_LIMIT;
  if (tier >= TEAM_TIER) return IMAGE_QUOTA_BY_TIER[tier] ?? TEAM_TIER_LIMIT;
  return IMAGE_QUOTA_BY_TIER[tier] ?? 0;
}
