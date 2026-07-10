import { createAdminClient } from './supabase-admin';

// Zentrale Stelle fuer die Limit-Werte -- nur hier anpassen.
export const RATE_LIMIT_PER_MINUTE = 20;
export const RATE_LIMIT_PER_DAY = 200;

export type RateLimitResult =
  | { allowed: true }
  | { allowed: false; reason: 'minute' | 'day'; message: string };

const MINUTE_LIMIT_MESSAGE = 'Zu viele Anfragen -- bitte kurz warten.';
const DAY_LIMIT_MESSAGE = 'Tageslimit erreicht -- bitte versuche es morgen wieder.';

// Zaehlt Anfragen pro Nutzer atomar in Postgres (check_and_increment_rate_limit,
// siehe docs/byok-konzept.md Abschnitt 6). Gedacht fuer alle KI-Routen
// (aktuell /api/ki/chat, spaeter auch die Premium-Features).
export async function checkRateLimit(userId: string): Promise<RateLimitResult> {
  const db = createAdminClient();
  const { data, error } = await db.rpc('check_and_increment_rate_limit', {
    p_user_id: userId,
    p_minute_limit: RATE_LIMIT_PER_MINUTE,
    p_day_limit: RATE_LIMIT_PER_DAY,
  });

  if (error) {
    // Rate-Limit-Pruefung selbst kaputt -> lieber durchlassen als KI-Funktionen
    // komplett lahmzulegen, Fehler aber sichtbar loggen.
    console.error('[rate-limit] RPC fehlgeschlagen:', error.message);
    return { allowed: true };
  }

  if (data === 'minute_limit') {
    return { allowed: false, reason: 'minute', message: MINUTE_LIMIT_MESSAGE };
  }
  if (data === 'day_limit') {
    return { allowed: false, reason: 'day', message: DAY_LIMIT_MESSAGE };
  }
  return { allowed: true };
}
