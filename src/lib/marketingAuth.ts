import { createClient } from '@/utils/supabase/server';

export type MarketingAuthState = 'loggedIn' | 'loggedOut';

/**
 * Server-seitiger Auth-Check fuer die Marketing-Seite (Landing-Page + die 4
 * oeffentlichen Unterseiten) -- NUR aus Server Components aufrufen (nutzt
 * next/headers ueber utils/supabase/server.ts). Ersetzt den vorherigen rein
 * clientseitigen useEffect-Check: der Header/Hero bekommt den Auth-Status
 * jetzt als fertigen Prop von der Seite selbst, dadurch ist schon der erste
 * Server-Render korrekt -- kein Ladezustand, kein Umspringen der Buttons.
 */
export async function getMarketingAuthState(): Promise<MarketingAuthState> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  return user ? 'loggedIn' : 'loggedOut';
}
