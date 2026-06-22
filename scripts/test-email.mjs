import { Resend } from 'resend';

const resend = new Resend('re_6r6TNHyx_JYxuXcTpAFTjCMuQ5FhAVbAN');

const { data, error } = await resend.emails.send({
  from: 'Culinary Studio <onboarding@resend.dev>',
  to: 'luca.koudsi@gmail.com',
  subject: '✅ Culinary Studio – Email-System funktioniert!',
  html: `
    <div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:32px;">
      <h2 style="color:#1a1a1a;">Test-Email erfolgreich! 🎉</h2>
      <p>Das Resend Email-System ist korrekt eingerichtet.</p>
      <p>Du wirst jetzt benachrichtigt wenn jemand eine Registrierungsanfrage stellt.</p>
      <hr style="border:none;border-top:1px solid #eee;margin:24px 0"/>
      <p style="color:#888;font-size:12px;">Culinary Studio · Automatische Benachrichtigung</p>
    </div>
  `,
});

if (error) {
  console.error('Fehler:', error);
  process.exit(1);
} else {
  console.log('✅ Email gesendet! ID:', data.id);
}
