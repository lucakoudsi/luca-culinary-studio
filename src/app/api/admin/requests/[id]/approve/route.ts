import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';
import { createAdminClient } from '@/lib/supabase-admin';
import { getRequestUser } from '@/lib/get-request-user';
import { ADMIN_EMAIL } from '@/config/roles';

export const dynamic = 'force-dynamic';

const stufeDescs: Record<number, string> = {
  1: 'Du kannst das Dashboard und Rezepte ansehen.',
  2: 'Du hast Zugriff auf Rezepte, Zutaten, Fermentation und mehr.',
  3: 'Du hast Zugriff auf Rezepte, Zutaten, Fermentation, Projekte und Mein Stil.',
  4: 'Du hast vollen Zugriff auf alle Bereiche inkl. Wein & Pairing.',
};

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await getRequestUser(req);
  if (!user || user.email !== ADMIN_EMAIL) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const { titel, stufe } = await req.json();
    const stufeNum: number = (typeof stufe === 'number' && stufe >= 1 && stufe <= 4) ? stufe : 2;

    const admin = createAdminClient();

    const { data: request, error: fetchErr } = await admin
      .from('access_requests')
      .select('*')
      .eq('id', params.id)
      .single();

    if (fetchErr || !request) {
      console.error('[approve] request not found:', fetchErr?.message);
      return NextResponse.json({ error: 'Anfrage nicht gefunden.' }, { status: 404 });
    }
    if (request.status !== 'pending') {
      return NextResponse.json({ error: 'Bereits bearbeitet.' }, { status: 409 });
    }

    // Create auth user
    console.log('[approve] creating user:', request.email);
    const password = request.password_temp || (Math.random().toString(36).slice(-10) + 'A1!');
    const { data: authData, error: authError } = await admin.auth.admin.createUser({
      email: request.email,
      password,
      user_metadata: { full_name: request.name },
      email_confirm: true,
    });
    console.log('[approve] user created:', authData?.user?.id ?? ('error: ' + authError?.message));

    if (authError) {
      console.error('[approve] createUser failed:', authError.message);
      return NextResponse.json({ error: authError.message }, { status: 500 });
    }

    // Upsert profile
    if (authData.user) {
      const profileFields: Record<string, unknown> = {
        id: authData.user.id,
        full_name: request.name,
        stufe: stufeNum,
        updated_at: new Date().toISOString(),
      };
      if (titel) profileFields.titel = titel;
      const { error: profileErr } = await admin.from('profiles').upsert(profileFields, { onConflict: 'id' });
      if (profileErr) console.error('[approve] profile upsert failed:', profileErr.message);
    }

    // Mark approved, clear temp password
    const { error: updateErr } = await admin
      .from('access_requests')
      .update({ status: 'approved', password_temp: null })
      .eq('id', params.id);

    if (updateErr) {
      console.error('[approve] status update failed:', updateErr.message);
      return NextResponse.json(
        { error: `Account wurde erstellt, aber der Status konnte nicht gespeichert werden: ${updateErr.message}. Bitte manuell in der DB prüfen.` },
        { status: 500 },
      );
    }

    // Send welcome email
    const titleUsed = titel || 'Hobbykoch';
    const titleDesc = stufeDescs[stufeNum] ?? '';

    console.log('[approve] sending welcome email to:', request.email);
    console.log('[approve] resend key present:', !!process.env.RESEND_API_KEY, '| key len:', process.env.RESEND_API_KEY?.length ?? 0);

    try {
      const resend = new Resend(process.env.RESEND_API_KEY);
      const result = await resend.emails.send({
        from: 'Culinary Studio <onboarding@resend.dev>',
        to: request.email,
        subject: 'Willkommen im LUCA Culinary Studio!',
        html: `<!DOCTYPE html>
<html>
<body style="background:#FAF8F5;margin:0;padding:0;font-family:Georgia,serif;">
  <div style="max-width:560px;margin:0 auto;padding:40px 20px;">
    <div style="text-align:center;padding:40px 40px 32px;background:linear-gradient(135deg,#6B3A4B,#8B5A6A);border-radius:16px 16px 0 0;">
      <div style="font-size:10px;letter-spacing:5px;color:rgba(201,168,76,0.85);text-transform:uppercase;margin-bottom:12px;">&#10022; &nbsp;LUCA CULINARY STUDIO&nbsp; &#10022;</div>
      <h1 style="color:#FAF8F5;font-size:26px;font-weight:700;margin:0;letter-spacing:1px;">Willkommen!</h1>
    </div>
    <div style="background:#FFFFFF;padding:40px;border:1px solid #E8E0D8;border-top:none;border-radius:0 0 16px 16px;">
      <p style="color:#2C2420;font-size:16px;margin:0 0 20px;">Hallo ${request.name},</p>
      <div style="background:rgba(90,154,88,0.08);border:1px solid rgba(90,154,88,0.25);border-radius:10px;padding:14px 18px;margin-bottom:24px;">
        <p style="color:#3A7A38;font-size:14px;margin:0;font-weight:600;">&#10003; Deine Anfrage wurde angenommen &ndash; du bist jetzt freigeschaltet!</p>
      </div>
      <div style="background:#FAF8F5;border:1px solid #EEE8E2;border-radius:10px;padding:16px 18px;margin-bottom:28px;">
        <div style="font-size:10px;letter-spacing:3px;text-transform:uppercase;color:#B09880;margin-bottom:8px;">Dein Titel</div>
        <div style="font-size:17px;font-weight:700;color:#6B3A4B;margin-bottom:6px;">${titleUsed}</div>
        <p style="color:#5A4A3A;font-size:13px;margin:0;line-height:1.55;">${titleDesc}</p>
      </div>
      <div style="text-align:center;margin:32px 0;">
        <a href="https://culinary-studio.vercel.app/login"
          style="display:inline-block;padding:14px 36px;background:linear-gradient(135deg,#6B3A4B,#8B5A6A);color:#FFFFFF;text-decoration:none;border-radius:10px;font-size:14px;font-weight:700;letter-spacing:0.5px;">
          Jetzt einloggen &rarr;
        </a>
      </div>
      <p style="color:#2C2420;font-size:14px;line-height:1.7;text-align:center;margin:0;">
        Wir freuen uns auf dich und w&uuml;nschen dir viel Spa&szlig;<br>und Inspiration in der K&uuml;che!
      </p>
      <hr style="border:none;border-top:1px solid #EEE8E2;margin:28px 0;"/>
      <p style="color:#9A8070;font-size:13px;text-align:center;margin:0;">
        Luca &amp; das Culinary Studio Team
      </p>
    </div>
    <p style="color:#B0A090;font-size:11px;text-align:center;margin-top:20px;">
      Diese Email wurde automatisch versendet.
    </p>
  </div>
</body>
</html>`,
      });

      // Resend gibt bei Fehler { data: null, error: {...} } statt throw
      console.log('[approve] email result:', JSON.stringify(result));
      if (result.error) {
        console.error('[approve] welcome email REJECTED by Resend:', result.error);
        console.error('[approve] HINWEIS: onboarding@resend.dev darf nur an die eigene Resend-Account-Email senden.');
        console.error('[approve] Fuer andere Empfaenger: eigene Domain in Resend verifizieren und from-Adresse aendern.');
      } else {
        console.log('[approve] welcome email sent successfully, id:', result.data?.id);
      }
    } catch (e) {
      console.error('[approve] welcome email exception:', e);
    }

    console.log('[approve] approved request', params.id, 'for', request.email);
    return NextResponse.json({ success: true });
  } catch (e) {
    console.error('[approve]', e);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
