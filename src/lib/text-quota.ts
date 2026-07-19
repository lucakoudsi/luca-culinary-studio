import { createAdminClient } from './supabase-admin';

// Tabelle + Gewichtung + Limit-Aufloesung liegen in src/config/textQuota.ts
// (kein supabase-admin-Import dort) -- exakt dasselbe Muster wie
// image-quota.ts/imageQuota.ts.
export { TEXT_QUOTA_BY_TIER, ADMIN_UNLIMITED_TEXT_LIMIT, getMonthlyTextLimit, TEXT_QUOTA_WEIGHTS } from '@/config/textQuota';

function currentMonthStart(): string {
  const now = new Date();
  return `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, '0')}-01`;
}

export type TextQuotaStatus = { used: number; limit: number; remaining: number };

/** Nur lesen, kein Verbrauch -- fuer die Vorab-Pruefung ("reicht das Restkontingent fuer diese Aktion"), bevor der teure Call ausgeloest wird. */
export async function getTextQuotaStatus(userId: string, limit: number): Promise<TextQuotaStatus> {
  const db = createAdminClient();
  const { data } = await db
    .from('ai_text_quota')
    .select('month_start, used_count')
    .eq('user_id', userId)
    .maybeSingle();

  const usedThisMonth = data && data.month_start === currentMonthStart() ? data.used_count : 0;
  return { used: usedThisMonth, limit, remaining: Math.max(0, limit - usedThisMonth) };
}

export type TextQuotaIncrementResult = { ok: true } | { ok: false; reason: 'quota_exceeded' };

/**
 * Atomar um `weight` Einheiten hochzaehlen -- ausschliesslich NACH einem
 * erfolgreichen KI-Call aufrufen (gleiches Prinzip wie incrementImageQuota:
 * erst pruefen ob genug Restkontingent da ist, BEVOR der teure Call
 * ausgeloest wird, aber erst NACH Erfolg tatsaechlich verbrauchen -- ein
 * fehlgeschlagener Call verbrennt kein Kontingent).
 */
export async function incrementTextQuota(userId: string, monthlyLimit: number, weight: number): Promise<TextQuotaIncrementResult> {
  const db = createAdminClient();
  const { data, error } = await db.rpc('check_and_increment_text_quota', {
    p_user_id: userId,
    p_monthly_limit: monthlyLimit,
    p_weight: weight,
  });

  if (error) {
    // Wie beim Bild-Kontingent: lieber durchlassen (Antwort wurde ja schon
    // generiert) als dem Nutzer sein fertiges Ergebnis wegen eines internen
    // Zaehlfehlers zu verweigern.
    console.error('[text-quota] RPC fehlgeschlagen:', error.message);
    return { ok: true };
  }
  if (data === 'quota_exceeded') {
    return { ok: false, reason: 'quota_exceeded' };
  }
  return { ok: true };
}
