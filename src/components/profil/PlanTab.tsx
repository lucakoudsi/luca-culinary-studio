'use client';
import { CheckCircle2, Loader2, Mail, HelpCircle } from 'lucide-react';
import { ADMIN_EMAIL, STUFEN } from '@/config/roles';
import { FEATURE_GATES } from '@/config/featureGates';
import { STUFE_PREIS_BRUTTO, formatPreis } from '@/config/pricing';
import { TEXT_QUOTA_BY_TIER, TEXT_QUOTA_WEIGHTS } from '@/config/textQuota';
import { IMAGE_QUOTA_BY_TIER } from '@/config/imageQuota';

const TIER_SHORT: Record<number, string> = { 1: 'Free', 2: 'Basic', 3: 'Pro', 4: 'Team' };
const UNLIMITED_SENTINEL = 999_999; // siehe ADMIN_UNLIMITED_*_LIMIT in den Quota-Configs

export type QuotaStatus = { used: number; limit: number; remaining: number };
export type QuotaResponse = { tier: number; text: QuotaStatus; image: QuotaStatus };

// Nur die Zeilen, die tatsaechlich zu einer Abo-Stufe gehoeren (minTier 99 =
// Admin-exklusiv, taucht in keiner Stufe auf und wird hier ausgeblendet).
const PUBLIC_GATES = FEATURE_GATES.filter(g => g.minTier < 99);

// "KI-Guthaben" statt roher Punktzahl -- niemand weiss aus dem Stand, was
// eine "KI-Aktion" ist. Rechnet IMMER aus TEXT_QUOTA_WEIGHTS, nie hart
// codierte Zahlen -- aendert sich die Gewichtung, stimmen die Beispiele
// automatisch weiter (siehe docs/text-quota.sql fuer die Herleitung).
function guthabenBeispiel(punkte: number): string {
  const menues = Math.floor(punkte / TEXT_QUOTA_WEIGHTS.menue);
  const chats = Math.floor(punkte / TEXT_QUOTA_WEIGHTS.chat);
  return `${menues} Menü-Kompositionen oder ${chats} Chat-Fragen`;
}

// Erklaer-Tabelle fuer das aufklappbare "Wie funktioniert das?" -- Labels
// sind fix, die Punktzahlen kommen aus derselben Quelle wie die Beispiele
// oben und die tatsaechliche Kontingent-Pruefung in den API-Routen.
const GUTHABEN_ERKLAERUNG = [
  { label: 'Chat-Frage', punkte: TEXT_QUOTA_WEIGHTS.chat },
  { label: 'Rezept bearbeiten oder importieren (Text)', punkte: TEXT_QUOTA_WEIGHTS.importText },
  { label: 'Menü-Komposition', punkte: TEXT_QUOTA_WEIGHTS.menue },
  { label: 'Foto-Analyse (Rezept- oder Gerichtbild)', punkte: TEXT_QUOTA_WEIGHTS.vision },
];

function quotaColor(status: QuotaStatus): string {
  if (status.limit <= 0) return '#D0C8C0';
  if (status.remaining <= 0) return '#C05050';
  if (status.used / status.limit >= 0.9) return '#9B7A2A';
  return '#7CB87A';
}

function QuotaCard({ title, status, kind }: { title: string; status: QuotaStatus; kind: 'guthaben' | 'bilder' }) {
  const unlimited = status.limit >= UNLIMITED_SENTINEL;
  const notAvailable = status.limit <= 0;
  const pct = unlimited || notAvailable ? 0 : Math.min(100, (status.used / status.limit) * 100);
  const color = quotaColor(status);
  const einheit = kind === 'guthaben' ? 'Punkten' : 'Bildern';

  const einordnung = status.remaining <= 0
    ? (kind === 'guthaben' ? 'Kein Guthaben mehr diesen Monat' : 'Keine Tellerbilder mehr diesen Monat')
    : kind === 'guthaben'
      ? `Reicht noch für ~${guthabenBeispiel(status.remaining)}`
      : `Reicht noch für ${status.remaining} Tellerbilder`;

  return (
    <div className="rounded-xl p-4 text-center" style={{ background: 'var(--surface-2, #F4EFE9)', border: '1px solid var(--border, #E8E0D8)' }}>
      <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text)', marginBottom: 8 }}>{title}</div>

      {notAvailable ? (
        <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>Nicht in deiner Stufe enthalten.</p>
      ) : unlimited ? (
        <p style={{ fontFamily: 'var(--font-playfair, serif)', fontSize: 20, fontWeight: 700, color: '#6B3A4B' }}>Unbegrenzt</p>
      ) : (
        <>
          <div style={{ fontFamily: 'var(--font-playfair, serif)', fontSize: 22, fontWeight: 700, color: 'var(--text)' }}>
            {status.used}
            <span style={{ fontFamily: 'inherit', fontSize: 14, fontWeight: 500, color: 'var(--text-muted)' }}> von {status.limit} {einheit}</span>
          </div>
          <div style={{ height: 6, borderRadius: 3, background: 'rgba(0,0,0,0.06)', overflow: 'hidden', margin: '10px 0 8px' }}>
            <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: 3, transition: 'width 0.3s ease' }} />
          </div>
          <p style={{ fontSize: 11, color: 'var(--text-muted)' }}>{einordnung}</p>
        </>
      )}
    </div>
  );
}

function GuthabenErklaerung() {
  return (
    <details className="rounded-xl" style={{ border: '1px solid var(--border, #E8E0D8)', background: 'var(--surface-2, #F4EFE9)' }}>
      <summary className="flex items-center gap-1.5" style={{ cursor: 'pointer', padding: '10px 14px', fontSize: 12, fontWeight: 600, color: '#6B3A4B' }}>
        <HelpCircle size={13} /> Wie funktioniert das KI-Guthaben?
      </summary>
      <div style={{ padding: '0 14px 14px' }}>
        <p style={{ fontSize: 11.5, color: 'var(--text-muted)', lineHeight: 1.6, marginBottom: 10 }}>
          Nicht jede KI-Aktion ist gleich aufwendig — eine Chat-Frage ist schnell beantwortet, eine vollständige Menü-Komposition oder eine Foto-Analyse braucht deutlich mehr Rechenleistung. Jede Aktion zieht deshalb unterschiedlich viele Punkte von deinem monatlichen Guthaben ab:
        </p>
        <table style={{ width: '100%', fontSize: 11.5, borderCollapse: 'collapse' }}>
          <tbody>
            {GUTHABEN_ERKLAERUNG.map(row => (
              <tr key={row.label} style={{ borderTop: '1px solid var(--border, #E8E0D8)' }}>
                <td style={{ padding: '6px 0', color: 'var(--text)' }}>{row.label}</td>
                <td style={{ padding: '6px 0', textAlign: 'right', fontWeight: 700, color: '#6B3A4B', whiteSpace: 'nowrap' }}>
                  {row.punkte} Punkt{row.punkte !== 1 ? 'e' : ''}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </details>
  );
}

export default function PlanTab({ currentTier, quota, quotaLoading }: {
  currentTier: number;
  quota: QuotaResponse | null;
  quotaLoading: boolean;
}) {
  const isAdminTier = currentTier >= 99;

  return (
    <div>
      <h3 style={{ fontFamily: 'var(--font-playfair, serif)', fontSize: 18, fontWeight: 600, color: 'var(--text)', margin: '0 0 0.5rem' }}>
        Mein Plan
      </h3>
      <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: '1.5rem', lineHeight: 1.6, maxWidth: 520 }}>
        Übersicht über deine aktuelle Stufe, dein Kontingent diesen Monat und was die anderen Stufen zusätzlich bieten.
      </p>

      {isAdminTier && (
        <div className="rounded-xl px-4 py-3 mb-6" style={{ background: 'rgba(86,46,60,0.06)', border: '1px solid rgba(86,46,60,0.18)' }}>
          <p style={{ fontSize: 12, color: 'var(--text)' }}>
            Du bist Admin und hast automatisch Zugriff auf alle Funktionen, unbegrenzt. Die Stufen unten gelten für andere Nutzer.
          </p>
        </div>
      )}

      {/* ── Kontingent-Status ──────────────────────────────────────────── */}
      <div style={{ marginBottom: '2rem' }}>
        <h4 style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 10 }}>
          Dein Kontingent diesen Monat
        </h4>
        {quotaLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 size={18} className="animate-spin" style={{ color: '#6B3A4B' }} />
          </div>
        ) : quota ? (
          <div className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <QuotaCard title="KI-Guthaben" status={quota.text} kind="guthaben" />
              <QuotaCard title="Tellerbilder" status={quota.image} kind="bilder" />
            </div>
            <GuthabenErklaerung />
          </div>
        ) : (
          <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>Konnte nicht geladen werden.</p>
        )}
      </div>

      {/* ── Stufenvergleich ────────────────────────────────────────────── */}
      <h4 style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 10 }}>
        Stufenvergleich
      </h4>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {STUFEN.map((s, i) => {
          const isCurrent = s.stufe === currentTier;
          const canUpgrade = currentTier < s.stufe && !isAdminTier;
          const prev = STUFEN[i - 1];

          const textLimit = TEXT_QUOTA_BY_TIER[s.stufe] ?? 0;
          const imageLimit = IMAGE_QUOTA_BY_TIER[s.stufe] ?? 0;
          const prevTextLimit = prev ? TEXT_QUOTA_BY_TIER[prev.stufe] ?? 0 : 0;
          const prevImageLimit = prev ? IMAGE_QUOTA_BY_TIER[prev.stufe] ?? 0 : 0;

          const ownGates = PUBLIC_GATES.filter(g => g.minTier === s.stufe);
          const baseGates = PUBLIC_GATES.filter(g => g.minTier === 1);

          return (
            <div key={s.stufe} className="rounded-2xl p-5 flex flex-col"
              style={{
                background: isCurrent ? 'rgba(107,58,75,0.05)' : 'var(--surface, #FFFFFF)',
                border: isCurrent ? '1.5px solid #6B3A4B' : '1px solid var(--border, #E8E0D8)',
              }}>
              {isCurrent && (
                <span className="self-start mb-3 px-2.5 py-1 rounded-full"
                  style={{ fontSize: 10, fontWeight: 700, letterSpacing: 0.5, color: '#FFFFFF', background: '#6B3A4B' }}>
                  Dein aktueller Plan
                </span>
              )}
              <div style={{ fontFamily: 'var(--font-playfair, serif)', fontSize: 18, fontWeight: 700, color: 'var(--text)' }}>
                {TIER_SHORT[s.stufe]}
              </div>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#6B3A4B', marginTop: 2, marginBottom: 12 }}>
                {formatPreis(STUFE_PREIS_BRUTTO[s.stufe])}
              </div>

              <div style={{ flex: 1 }}>
                {i === 0 ? (
                  <ul style={{ margin: 0, padding: 0, listStyle: 'none' }}>
                    {baseGates.map(g => (
                      <li key={g.label} className="flex items-start gap-1.5" style={{ fontSize: 12, color: 'var(--text)', marginBottom: 6 }}>
                        <CheckCircle2 size={13} style={{ color: '#7CB87A', flexShrink: 0, marginTop: 1 }} />
                        {g.label}
                      </li>
                    ))}
                    <li style={{ fontSize: 11.5, color: 'var(--text-muted)', marginTop: 8 }}>Keine KI-Funktionen</li>
                  </ul>
                ) : (
                  <>
                    <p style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 8 }}>
                      Alles aus {TIER_SHORT[prev.stufe]}, außerdem:
                    </p>
                    <ul style={{ margin: 0, padding: 0, listStyle: 'none' }}>
                      {ownGates.map(g => (
                        <li key={g.label} className="flex items-start gap-1.5" style={{ fontSize: 12, color: 'var(--text)', marginBottom: 6 }}>
                          <CheckCircle2 size={13} style={{ color: '#7CB87A', flexShrink: 0, marginTop: 1 }} />
                          {g.label}
                        </li>
                      ))}
                      {textLimit > prevTextLimit && (
                        <li className="flex items-start gap-1.5" style={{ marginBottom: 6 }}>
                          <CheckCircle2 size={13} style={{ color: '#7CB87A', flexShrink: 0, marginTop: 2 }} />
                          <div>
                            <div style={{ fontSize: 12, color: 'var(--text)' }}>
                              {textLimit} Punkte KI-Guthaben/Monat{prevTextLimit > 0 ? ` (statt ${prevTextLimit})` : ''}
                            </div>
                            <div style={{ fontSize: 10.5, color: 'var(--text-muted)', marginTop: 1 }}>
                              z. B. {guthabenBeispiel(textLimit)}
                            </div>
                          </div>
                        </li>
                      )}
                      {imageLimit > prevImageLimit && (
                        <li className="flex items-start gap-1.5" style={{ fontSize: 12, color: 'var(--text)', marginBottom: 6 }}>
                          <CheckCircle2 size={13} style={{ color: '#7CB87A', flexShrink: 0, marginTop: 1 }} />
                          {imageLimit} Tellerbilder/Monat{prevImageLimit > 0 ? ` (statt ${prevImageLimit})` : ''}
                        </li>
                      )}
                    </ul>
                  </>
                )}
              </div>

              <div style={{ marginTop: 16 }}>
                {isCurrent ? (
                  <div className="flex items-center gap-1.5 justify-center py-2 rounded-lg"
                    style={{ fontSize: 11.5, fontWeight: 600, color: '#6B3A4B', background: 'rgba(107,58,75,0.08)' }}>
                    <CheckCircle2 size={13} /> Aktueller Plan
                  </div>
                ) : canUpgrade ? (
                  <a
                    href={`mailto:${ADMIN_EMAIL}?subject=${encodeURIComponent(`Upgrade-Anfrage: ${TIER_SHORT[s.stufe]}`)}&body=${encodeURIComponent(`Hallo,\n\nich möchte gerne auf die Stufe ${TIER_SHORT[s.stufe]} upgraden.\n\nDanke!`)}`}
                    className="flex items-center gap-1.5 justify-center py-2 rounded-lg transition-colors"
                    style={{ fontSize: 11.5, fontWeight: 600, color: '#FFFFFF', background: 'linear-gradient(135deg, #562E3C, #6B3A4B)' }}>
                    <Mail size={12} /> Upgrade auf Anfrage
                  </a>
                ) : (
                  <div className="text-center py-2" style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                    In deinem Plan enthalten
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
      <p style={{ fontSize: 10.5, color: 'var(--text-muted)', marginTop: 12, lineHeight: 1.6 }}>
        Es gibt noch keine automatische Zahlungsabwicklung — ein Upgrade wird aktuell manuell freigeschaltet. „Upgrade auf Anfrage" öffnet eine vorausgefüllte E-Mail.
      </p>
    </div>
  );
}
