import { Resend } from 'resend';

const FROM  = 'Culinary Studio <onboarding@resend.dev>';
const ADMIN = 'luca.koudsi@gmail.com';

function makeResend() {
  const key = process.env.RESEND_API_KEY;
  console.log('[resend] API key present:', !!key, '| length:', key?.length ?? 0);
  return new Resend(key);
}

async function send(payload: Parameters<Resend['emails']['send']>[0]) {
  const resend = makeResend();
  const result = await resend.emails.send(payload);
  console.log('[resend] send result:', JSON.stringify(result));
  if (result.error) {
    throw new Error(`Resend error ${result.error.name}: ${result.error.message}`);
  }
  return result;
}

export async function sendAccessRequestEmail(opts: {
  name: string;
  email: string;
  grund: string;
  approveUrl: string;
  rejectUrl: string;
}) {
  console.log('[resend] sending access-request email to', ADMIN, 'for applicant:', opts.email);
  return send({
    from: FROM,
    to: ADMIN,
    subject: `Neue Registrierungsanfrage von ${opts.name}`,
    html: `
      <div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:32px;">
        <h2 style="color:#1a1a1a;margin-bottom:4px;">Neue Registrierungsanfrage</h2>
        <hr style="border:none;border-top:1px solid #eee;margin:16px 0"/>
        <p><strong>Name:</strong> ${opts.name}</p>
        <p><strong>Email:</strong> ${opts.email}</p>
        <p><strong>Grund:</strong><br/>${opts.grund}</p>
        <div style="margin-top:32px;">
          <a href="${opts.approveUrl}"
            style="display:inline-block;padding:12px 28px;background:#16a34a;color:white;
                   text-decoration:none;border-radius:8px;font-weight:600;margin-right:12px;">
            ✓ Genehmigen
          </a>
          <a href="${opts.rejectUrl}"
            style="display:inline-block;padding:12px 28px;background:#dc2626;color:white;
                   text-decoration:none;border-radius:8px;font-weight:600;">
            ✗ Ablehnen
          </a>
        </div>
      </div>`,
  });
}

export async function sendApprovedEmail(to: string, name: string, appUrl: string) {
  console.log('[resend] sending approved email to', to);
  return send({
    from: FROM,
    to,
    subject: 'Dein Zugang wurde genehmigt! 🎉',
    html: `
      <div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:32px;">
        <h2 style="color:#1a1a1a;">Willkommen im Culinary Studio, ${name}!</h2>
        <p>Dein Zugang wurde genehmigt. Du kannst dich jetzt einloggen:</p>
        <a href="${appUrl}/login"
          style="display:inline-block;margin-top:16px;padding:12px 28px;background:#C9A84C;
                 color:#0a0a0a;text-decoration:none;border-radius:8px;font-weight:600;">
          Jetzt einloggen →
        </a>
        <p style="color:#666;font-size:13px;margin-top:24px;">
          Melde dich mit der Email-Adresse an, mit der du dich registriert hast.
        </p>
      </div>`,
  });
}

export async function sendRejectedEmail(to: string, name: string) {
  console.log('[resend] sending rejected email to', to);
  return send({
    from: FROM,
    to,
    subject: 'Deine Anfrage beim Culinary Studio',
    html: `
      <div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:32px;">
        <h2 style="color:#1a1a1a;">Hallo ${name},</h2>
        <p>leider wurde deine Registrierungsanfrage abgelehnt.</p>
        <p style="color:#666;font-size:13px;">
          Bei Fragen kannst du dich direkt an uns wenden.
        </p>
      </div>`,
  });
}
