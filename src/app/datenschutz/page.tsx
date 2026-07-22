import Link from 'next/link';
import { CURRENT_TERMS_VERSION } from '@/config/legal';

// Geruest-Seite, bewusst ohne bindenden Rechtstext -- siehe
// docs/registrierung-plan.md Abschnitt 6. Muss vor dem Live-Gang durch
// echten, juristisch geprueften Text ersetzt werden (dann CURRENT_TERMS_VERSION
// in src/config/legal.ts entsprechend hochzaehlen).
export default function DatenschutzPage() {
  return (
    <div className="min-h-screen px-6 py-16" style={{ background: 'var(--bg)' }}>
      <div className="max-w-[640px] mx-auto">
        <Link href="/" className="text-[12px] font-semibold" style={{ color: '#6B3A4B' }}>
          ← Zurück
        </Link>
        <h1 className="font-heading text-[28px] font-bold mt-6 mb-2" style={{ color: 'var(--text)' }}>
          Datenschutzerklärung
        </h1>
        <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 32 }}>
          Stand: {CURRENT_TERMS_VERSION} (Platzhalter)
        </p>

        <div className="rounded-xl px-5 py-4 mb-8"
          style={{ background: 'rgba(201,168,76,0.08)', border: '1px solid rgba(201,168,76,0.3)' }}>
          <p style={{ fontSize: 13, color: 'var(--text)', lineHeight: 1.6 }}>
            Diese Seite ist ein technisches Gerüst und enthält noch keinen
            rechtsverbindlichen Text. Der endgültige Inhalt folgt vor dem
            öffentlichen Start.
          </p>
        </div>

        <div style={{ fontSize: 14, color: 'var(--text-muted)', lineHeight: 1.8 }}>
          <p>Hier stehen künftig u. a.: verantwortliche Stelle, welche Daten bei
            Registrierung/Nutzung verarbeitet werden (inkl. Supabase als
            Auftragsverarbeiter für Auth/DB/Storage, Resend für Transaktions-Mails,
            Stripe für Zahlungsabwicklung, sowie eingesetzte KI-Dienste),
            Rechtsgrundlagen, Speicherdauer und Betroffenenrechte.</p>
        </div>
      </div>
    </div>
  );
}
