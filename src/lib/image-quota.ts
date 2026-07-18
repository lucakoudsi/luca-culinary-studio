import { createAdminClient } from './supabase-admin';

// Tabelle + Limit-Aufloesung liegen in src/config/imageQuota.ts (kein
// supabase-admin-Import dort) -- so kann auch das Tellerdesigner-Frontend
// ADMIN_UNLIMITED_IMAGE_LIMIT importieren, ohne den Admin-Client (Service-
// Role-Key-Nutzung) in den Client-Bundle zu ziehen.
export { IMAGE_QUOTA_BY_TIER, ADMIN_UNLIMITED_IMAGE_LIMIT, getMonthlyImageLimit } from '@/config/imageQuota';

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
