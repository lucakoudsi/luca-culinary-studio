import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase-admin';
import { CURRENT_TERMS_VERSION } from '@/config/legal';

export const dynamic = 'force-dynamic';

// Ersetzt den alten Zugangsantrag-Flow (/api/register-request +
// Admin-Freigabe) durch echte Selbstanmeldung: Account entsteht sofort,
// Supabase Auth uebernimmt Bestaetigungsmail + Login-Sperre bis zum Klick
// auf den Link (voraussetzt "Confirm email" ist im Supabase-Projekt aktiv).
// Siehe docs/registrierung-plan.md.
export async function POST(req: NextRequest) {
  const { name, email, password, termsAccepted } = await req.json();

  if (!name || !email || !password) {
    return NextResponse.json({ error: 'Alle Felder sind erforderlich.' }, { status: 400 });
  }
  if (password.length < 6) {
    return NextResponse.json({ error: 'Passwort muss mindestens 6 Zeichen lang sein.' }, { status: 400 });
  }
  if (termsAccepted !== true) {
    return NextResponse.json({ error: 'Bitte AGB und Datenschutzerklärung akzeptieren.' }, { status: 400 });
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const admin = createAdminClient();

  const { data, error } = await admin.auth.signUp({
    email,
    password,
    options: {
      data: { full_name: name },
      emailRedirectTo: `${appUrl}/auth/callback`,
    },
  });

  if (error) {
    console.error('[register] signUp failed:', error.message);
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  // Supabase gibt bei bereits existierender, bestaetigter Email aus
  // Sicherheitsgruenden KEINEN Fehler zurueck (verhindert User-Enumeration),
  // sondern ein Nutzerobjekt mit leerem identities-Array -- das ist das
  // dokumentierte Erkennungsmerkmal fuer "Email schon vergeben".
  if (data.user && data.user.identities?.length === 0) {
    return NextResponse.json(
      { error: 'Für diese Email-Adresse existiert bereits ein Account. Bitte einloggen oder Passwort zurücksetzen.' },
      { status: 409 },
    );
  }

  if (!data.user) {
    console.error('[register] signUp returned no user without an error');
    return NextResponse.json({ error: 'Registrierung fehlgeschlagen.' }, { status: 500 });
  }

  const { error: profileErr } = await admin.from('profiles').upsert({
    id: data.user.id,
    full_name: name,
    stufe: 1,
    terms_accepted_at: new Date().toISOString(),
    terms_version: CURRENT_TERMS_VERSION,
    updated_at: new Date().toISOString(),
  }, { onConflict: 'id' });

  if (profileErr) {
    // Auth-User existiert bereits, das ist das Wichtige fuer den Nutzer --
    // Profil-Zeile fehlschlagen lassen wir nicht die ganze Registrierung
    // scheitern, sondern loggen es fuer manuelles Nachziehen.
    console.error('[register] profile upsert failed:', data.user.id, profileErr.message);
  }

  return NextResponse.json({ success: true });
}
