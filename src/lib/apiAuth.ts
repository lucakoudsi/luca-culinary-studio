import { NextRequest, NextResponse } from 'next/server';
import type { User } from '@supabase/supabase-js';
import { getRequestUser } from '@/lib/get-request-user';
import { createAdminClient } from '@/lib/supabase-admin';
import { getUserTier } from '@/config/roles';

type TierCheck =
  | { ok: true; user: User; tier: number }
  | { ok: false; response: NextResponse };

const STUFE_LABEL: Record<number, string> = {
  1: 'Free', 2: 'Basic', 3: 'Pro', 4: 'Team',
};

/**
 * Serverseitige Stufen-Pruefung fuer API-Routen (spiegelt getUserTier aus
 * der Middleware, die nur Seiten-Navigation schuetzt, nicht API-Calls).
 * ADMIN_EMAIL loest immer Stufe 99 auf und besteht jede Pruefung.
 */
export async function requireTier(req: NextRequest, minTier: number): Promise<TierCheck> {
  const user = await getRequestUser(req);
  if (!user) {
    return { ok: false, response: NextResponse.json({ error: 'Nicht eingeloggt.' }, { status: 401 }) };
  }

  const admin = createAdminClient();
  const { data: profile } = await admin.from('profiles').select('stufe').eq('id', user.id).maybeSingle();
  const tier = getUserTier(user.email, profile?.stufe);

  if (tier < minTier) {
    const label = STUFE_LABEL[minTier] ?? `Stufe ${minTier}`;
    return {
      ok: false,
      response: NextResponse.json(
        { error: `Diese Aktion erfordert mindestens Stufe ${minTier} (${label}).` },
        { status: 403 },
      ),
    };
  }

  return { ok: true, user, tier };
}
