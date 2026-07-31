import Link from 'next/link';

// Geruest-Seite, bewusst ohne bindenden Rechtstext -- gleiches Muster wie
// datenschutz/page.tsx und agb/page.tsx. Muss vor dem oeffentlichen
// Bezahl-Live-Gang durch echten, juristisch geprueften Text ersetzt werden
// (Anbieterkennzeichnung ist ab dem ersten oeffentlichen Tag mit
// Bezahlfunktion Pflicht, siehe docs/master-aufgabenliste.md Teil 2).
export default function ImpressumPage() {
  return (
    <div className="min-h-screen px-6 py-16" style={{ background: 'var(--bg)' }}>
      <div className="max-w-[640px] mx-auto">
        <Link href="/" className="text-[12px] font-semibold" style={{ color: '#6B3A4B' }}>
          ← Zurück
        </Link>
        <h1 className="font-heading text-[28px] font-bold mt-6 mb-2" style={{ color: 'var(--text)' }}>
          Impressum
        </h1>
        <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 32 }}>
          Platzhalter
        </p>

        <div className="rounded-xl px-5 py-4 mb-8"
          style={{ background: 'rgba(201,168,76,0.08)', border: '1px solid rgba(201,168,76,0.3)' }}>
          <p style={{ fontSize: 13, color: 'var(--text)', lineHeight: 1.6 }}>
            Diese Seite ist ein technisches Gerüst und enthält noch keine
            rechtsverbindliche Anbieterkennzeichnung. Der endgültige Inhalt
            folgt vor dem öffentlichen Start.
          </p>
        </div>

        <div style={{ fontSize: 14, color: 'var(--text-muted)', lineHeight: 1.8 }}>
          <p>Hier stehen künftig u. a.: verantwortliche Person/Anbieter gemäß
            §5 DDG, Kontaktdaten (Anschrift, E-Mail), Vertretungsberechtigte:r,
            ggf. Handelsregister-/Umsatzsteuer-ID, verantwortlich für den
            Inhalt nach §18 Abs. 2 MStV.</p>
        </div>
      </div>
    </div>
  );
}
