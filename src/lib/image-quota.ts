import { createAdminClient } from './supabase-admin';

// Monatliches Bild-Kontingent fuer den Tellerdesigner, gestaffelt nach
// Abo-Stufe (docs/abo-konzept.md.txt Abschnitt 2/5). Getrennt von
// rate-limit.ts (Missbrauchsschutz) -- hier geht es um ein Produkt-
// Entitlement mit Kalendermonat-Fenster statt Minuten/Tag.
export const IMAGE_QUOTA_BY_TIER: Record<number, number> = {
  1: 0,   // Free
  2: 0,   // Basic -- Tellerdesigner ist Pro-exklusiv
  3: 150, // Pro
  4: 500, // Team (aktuell pro Nutzer, nicht geteilt -- siehe TO_CHANGE.md.txt)
};

export function getMonthlyImageLimit(tier: number): number {
  return IMAGE_QUOTA_BY_TIER[tier] ?? 0;
}

function currentMonthStart(): string {
  const now = new Date();
  return `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, '0')}-01`;
}

export type ImageQuotaStatus = { used: number; limit: number; remaining: number };

/** Nur lesen, kein Verbrauch -- fuer die Vorab-Pruefung ("lohnt sich der teure Call ueberhaupt") und die "noch X von Y"-Anzeige. */
export async function getImageQuotaStatus(userId: string, limit: number): Promise<ImageQuotaStatus> {
  const db = createAdminClient();
  const { data } = await db
    .from('ai_image_quota')
    .select('month_start, used_count')
    .eq('user_id', userId)
    .maybeSingle();

  const usedThisMonth = data && data.month_start === currentMonthStart() ? data.used_count : 0;
  return { used: usedThisMonth, limit, remaining: Math.max(0, limit - usedThisMonth) };
}

export type ImageQuotaIncrementResult = { ok: true } | { ok: false; reason: 'quota_exceeded' };

/**
 * Atomar hochzaehlen -- ausschliesslich NACH einer erfolgreichen Bildgenerierung
 * aufrufen (siehe /api/tellerdesigner: erst getImageQuotaStatus() als schnelles
 * Vorab-Gate, damit ein Nutzer ohne Kontingent nicht erst den teuren
 * Bild-Call ausloest; der eigentliche Verbrauch wird erst nach Erfolg mit
 * dieser Funktion festgeschrieben, damit ein fehlgeschlagener API-Call kein
 * Kontingent verbrennt).
 */
export async function incrementImageQuota(userId: string, monthlyLimit: number): Promise<ImageQuotaIncrementResult> {
  const db = createAdminClient();
  const { data, error } = await db.rpc('check_and_increment_image_quota', {
    p_user_id: userId,
    p_monthly_limit: monthlyLimit,
  });

  if (error) {
    // Wie beim Rate-Limit: lieber durchlassen (Bild wurde ja schon bezahlt/generiert)
    // als dem Nutzer sein fertiges Ergebnis wegen eines internen Zaehlfehlers zu verweigern.
    console.error('[image-quota] RPC fehlgeschlagen:', error.message);
    return { ok: true };
  }
  if (data === 'quota_exceeded') {
    return { ok: false, reason: 'quota_exceeded' };
  }
  return { ok: true };
}
