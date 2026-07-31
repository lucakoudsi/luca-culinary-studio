'use client';
import { useState, useRef, useEffect } from 'react';
import { ChefHat, Send, User, Loader2, Check, X as XIcon } from 'lucide-react';
import type { RezeptSnapshot } from '@/lib/rezeptKiExtraktion';
import { TEXT_QUOTA_WEIGHTS } from '@/config/textQuota';

type TextMessage = { id: number; kind: 'text'; role: 'user' | 'assistant'; text: string; time: string };
type DiffMessage = {
  id: number; kind: 'diff'; time: string;
  before: RezeptSnapshot; patch: Partial<RezeptSnapshot>; merged: RezeptSnapshot;
  status: 'pending' | 'applied' | 'discarded';
};
type SousChefMessage = TextMessage | DiffMessage;

const FIELD_LABELS: Record<string, string> = {
  title: 'Titel', description: 'Beschreibung', category: 'Kategorie', difficulty: 'Schwierigkeit',
  time: 'Zeit', season: 'Saison', tags: 'Tags', portionen: 'Portionen',
  zutaten: 'Zutaten', komponenten: 'Komponenten', schritte: 'Zubereitungsschritte',
  getraenke: 'Getränkeempfehlung', chefTipps: 'Notizen & Chef-Tipps', geschmack: 'Geschmacksprofil',
};

const GESCHMACK_LABELS: Record<string, string> = {
  acidity: 'Säure', sweetness: 'Süße', bitterness: 'Bitterkeit', umami: 'Umami', spiciness: 'Schärfe', saltiness: 'Salzigkeit',
};

function truncate(s: string, n = 70) {
  const t = s.trim();
  return t.length > n ? t.slice(0, n).trimEnd() + '…' : t;
}

function formatFieldValue(key: string, value: unknown): string {
  if (value === undefined || value === null) return '–';
  if (key === 'zutaten' && Array.isArray(value)) return `${value.length} Zutat${value.length !== 1 ? 'en' : ''}`;
  if (key === 'komponenten' && Array.isArray(value)) return `${value.length} Komponente${value.length !== 1 ? 'n' : ''}`;
  if (key === 'schritte' && Array.isArray(value)) return `${value.length} Schritt${value.length !== 1 ? 'e' : ''}`;
  if (key === 'tags' && Array.isArray(value)) return value.length > 0 ? value.join(', ') : '–';
  if (key === 'time') return `${value} Min.`;
  if (key === 'portionen') return `${value} Portionen`;
  if (key === 'geschmack' && typeof value === 'object') {
    const g = value as Record<string, number>;
    return Object.entries(GESCHMACK_LABELS).map(([k, label]) => `${label} ${g[k] ?? 0}`).join(', ');
  }
  if (typeof value === 'string') return value.trim() ? `„${truncate(value)}"` : '–';
  return String(value);
}

function nowTime() {
  return new Date().toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });
}

function renderSousChefText(text: string) {
  return text.split('\n').map((line, i) => {
    if (!line.trim()) return <div key={i} className="h-1.5" />;
    return <p key={i} className="mt-1 first:mt-0 leading-relaxed">{line}</p>;
  });
}

type QuotaState = { tier: number; remaining: number } | null;

type SousChefPanelProps = {
  /** Liest den AKTUELLEN Formular-Stand -- als Funktion statt fixem Wert, damit bei jeder Nachricht frisch gelesen wird (kein stale Snapshot). */
  getSnapshot: () => RezeptSnapshot;
  /** Wendet nur die vom Nutzer bestaetigten, tatsaechlich geaenderten Felder auf den Formular-Stand des Elternteils an -- erst nach Klick auf "Uebernehmen" im Diff-Vorschlag, nie automatisch. */
  onApplyPatch: (patch: Partial<RezeptSnapshot>) => void;
  /** Erste Nachricht im Chat -- je nach Kontext (Import vs. bestehendes Rezept bearbeiten) unterschiedlich formuliert. */
  greeting: string;
  /** Abstand von oben für die sticky-Positionierung -- nur bei variant "sidebar" relevant. */
  stickyTop?: number;
  /**
   * Komprimierte Bilder aus der aktuellen Bild-Import-Sitzung (siehe
   * /rezepte/neu) -- werden bei jeder Chat-Nachricht als Vision-Kontext
   * mitgeschickt, damit sich der Nutzer auf sichtbare Details beziehen kann
   * ("die weißen Krümel auf Bild 3"). Nur innerhalb derselben Sitzung
   * vorhanden -- beim späteren Bearbeiten eines gespeicherten Rezepts gibt es
   * keine Bilder mehr, der Chat läuft dann rein textbasiert (Prop weglassen).
   */
  images?: string[];
  /**
   * "sidebar" (Standard): feste Breite, sticky, volle verfuegbare Hoehe --
   * fuer die Bearbeiten-Seite neben dem Formular. "stacked": volle Breite,
   * normaler Blockfluss, begrenzte eigene Hoehe mit internem Scroll -- fuer
   * den Rezept-Import, wo das Panel unter dem Import-Ergebnis sitzt statt
   * daneben (auch am Desktop, nicht nur mobil).
   */
  variant?: 'sidebar' | 'stacked';
};

/** Chat-Panel für den KI-Sous-Chef: Rezept im Dialog korrigieren/verfeinern -- sowohl direkt nach dem Import (URL/Text/Bild) als auch beim späteren Bearbeiten eines gespeicherten Rezepts. Jede Feld-Änderung kommt als Diff-Vorschlag (Übernehmen/Verwerfen) statt automatisch übernommen zu werden. */
export default function SousChefPanel({ getSnapshot, onApplyPatch, greeting, stickyTop = 88, images, variant = 'sidebar' }: SousChefPanelProps) {
  const hasImages = !!images && images.length > 0;
  const weight = hasImages ? TEXT_QUOTA_WEIGHTS.vision : TEXT_QUOTA_WEIGHTS.sousChefText;

  const [messages, setMessages] = useState<SousChefMessage[]>(() => [
    { id: Date.now(), kind: 'text', role: 'assistant', text: greeting, time: nowTime() },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Proaktive Kontingent-Anzeige -- reiner Lese-Status (kein Verbrauch), damit
  // die Eingabe schon gesperrt ist, BEVOR der Nutzer eine Nachricht schickt,
  // die serverseitig ohnehin abgelehnt wuerde. Die eigentliche Absicherung
  // bleibt vollstaendig serverseitig in /api/rezepte/sous-chef (Tier- +
  // Kontingent-Pruefung vor jedem OpenAI-Call) -- das hier ist nur UX.
  const [quota, setQuota] = useState<QuotaState>(null);
  useEffect(() => {
    fetch('/api/profil/kontingent').then(r => r.json()).then(d => {
      if (typeof d.tier === 'number' && d.text && typeof d.text.remaining === 'number') {
        setQuota({ tier: d.tier, remaining: d.text.remaining });
      }
    }).catch(() => {});
  }, []);

  const gateReady = quota !== null;
  const blocked = gateReady && (quota!.tier < 2 || quota!.remaining < weight);
  const blockedReason = !gateReady
    ? 'Prüfe KI-Guthaben…'
    : quota!.tier < 2
      ? 'KI-Sous-Chef ist ein Basic-Feature -- ab Basic verfügbar.'
      : 'KI-Guthaben aufgebraucht -- nächsten Monat geht es weiter.';

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const applyDiff = (id: number) => {
    setMessages(prev => prev.map(m => {
      if (m.id !== id || m.kind !== 'diff') return m;
      onApplyPatch(m.patch);
      return { ...m, status: 'applied' };
    }));
  };

  const discardDiff = (id: number) => {
    setMessages(prev => prev.map(m => (m.id === id && m.kind === 'diff') ? { ...m, status: 'discarded' } : m));
  };

  const send = async (text: string) => {
    if (!text.trim() || loading || blocked) return;
    const userMsg: TextMessage = { id: Date.now(), kind: 'text', role: 'user', text, time: nowTime() };
    const history = [...messages, userMsg];
    setMessages(history);
    setInput('');
    setLoading(true);

    const before = getSnapshot();

    try {
      const res = await fetch('/api/rezepte/sous-chef', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rezept: before,
          messages: history.filter((m): m is TextMessage => m.kind === 'text').map(m => ({ role: m.role, content: m.text })),
          ...(hasImages ? { images } : {}),
        }),
      });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) {
        if (d.error === 'quota_exceeded') setQuota(q => q ? { ...q, remaining: 0 } : q);
        const errText = d.message || d.error || 'Etwas ist schiefgelaufen. Bitte versuche es erneut.';
        setMessages(prev => [...prev, { id: Date.now() + 1, kind: 'text', role: 'assistant', text: errText, time: nowTime() }]);
        return;
      }

      const newMessages: SousChefMessage[] = [
        { id: Date.now() + 1, kind: 'text', role: 'assistant', text: d.reply || 'Verstanden.', time: nowTime() },
      ];
      if (d.updatedFields && Object.keys(d.updatedFields).length > 0 && d.merged) {
        newMessages.push({
          id: Date.now() + 2, kind: 'diff', time: nowTime(),
          before, patch: d.updatedFields, merged: d.merged, status: 'pending',
        });
      }
      setMessages(prev => [...prev, ...newMessages]);
      setQuota(q => q ? { ...q, remaining: Math.max(0, q.remaining - weight) } : q);
    } catch {
      setMessages(prev => [...prev, { id: Date.now() + 1, kind: 'text', role: 'assistant', text: 'Netzwerkfehler. Bitte versuche es erneut.', time: nowTime() }]);
    } finally {
      setLoading(false);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  };

  const containerClass = variant === 'sidebar'
    ? 'w-[380px] flex-shrink-0 sticky flex flex-col hidden lg:flex'
    : 'w-full flex flex-col';
  const containerStyle = variant === 'sidebar'
    ? { top: stickyTop, height: `calc(100vh - ${stickyTop + 32}px)` }
    : undefined;
  const messagesClass = variant === 'sidebar'
    ? 'flex-1 overflow-y-auto px-4 py-4 space-y-4 min-h-0'
    : 'overflow-y-auto px-4 py-4 space-y-4 max-h-[440px]';

  return (
    <div className={containerClass} style={containerStyle}>
      <div className="bg-card border border-border rounded-xl flex flex-col flex-1 min-h-0 overflow-hidden">
        <div className="px-4 py-3.5 border-b border-border flex items-center gap-2.5 flex-shrink-0">
          <div className="w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center bg-gold/10 border border-gold/30">
            <ChefHat size={13} color="#C9A84C" strokeWidth={1.5} />
          </div>
          <div>
            <div className="text-[13px] font-semibold text-text-primary">KI-Sous-Chef</div>
            <div className="text-[11px]" style={{ color: hasImages ? '#9B7A2A' : 'var(--text-muted)' }}>
              {hasImages ? `Sieht deine ${images!.length} hochgeladenen Bilder` : 'Rezept korrigieren & verfeinern'}
            </div>
          </div>
        </div>

        <div className={messagesClass}>
          {messages.map(msg => {
            if (msg.kind === 'text') {
              return (
                <div key={msg.id} className={`flex gap-2.5 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                  <div className={`w-6 h-6 rounded-full flex-shrink-0 flex items-center justify-center mt-0.5 ${
                    msg.role === 'assistant' ? 'bg-gold/10 border border-gold/30' : 'bg-black/5 border border-black/10'
                  }`}>
                    {msg.role === 'assistant'
                      ? <ChefHat size={12} color="#C9A84C" strokeWidth={1.5} />
                      : <User size={11} className="text-text-secondary" />}
                  </div>
                  <div className={`max-w-[82%] flex flex-col gap-1 ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                    <div className={`rounded-xl px-3.5 py-2.5 text-[12.5px] ${
                      msg.role === 'user'
                        ? 'rounded-tr-sm text-white'
                        : 'bg-background border border-border text-text-secondary rounded-tl-sm'
                    }`}
                      style={msg.role === 'user' ? { background: 'linear-gradient(135deg, #562E3C, #6B3A4B)' } : {}}>
                      {renderSousChefText(msg.text)}
                    </div>
                    <span className="text-[10px] text-text-muted px-1">{msg.time}</span>
                  </div>
                </div>
              );
            }

            // Diff-Vorschlag -- KEINE automatische Uebernahme, der Nutzer
            // muss jede Aenderung explizit bestaetigen oder verwerfen.
            return (
              <div key={msg.id} className="flex gap-2.5">
                <div className="w-6 h-6 rounded-full flex-shrink-0 flex items-center justify-center mt-0.5 bg-gold/10 border border-gold/30">
                  <ChefHat size={12} color="#C9A84C" strokeWidth={1.5} />
                </div>
                <div className="max-w-[88%] rounded-xl px-3.5 py-3 text-[12px] rounded-tl-sm"
                  style={{
                    background: 'var(--surface-2, rgba(107,58,75,0.04))',
                    border: `1px solid ${msg.status === 'pending' ? 'var(--accent)' : 'var(--border)'}`,
                    opacity: msg.status === 'discarded' ? 0.55 : 1,
                  }}>
                  <div className="font-semibold mb-2" style={{ color: 'var(--text)' }}>Änderungsvorschlag</div>
                  <div className="space-y-1.5 mb-3">
                    {Object.keys(msg.patch).map(key => (
                      <div key={key} className="flex flex-col gap-0.5">
                        <span className="font-semibold text-[10.5px] uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>
                          {FIELD_LABELS[key] ?? key}
                        </span>
                        <span style={{ color: 'var(--text)' }}>
                          <span style={{ textDecoration: 'line-through', opacity: 0.6 }}>
                            {formatFieldValue(key, msg.before[key as keyof RezeptSnapshot])}
                          </span>
                          {' → '}
                          <span style={{ color: 'var(--accent)', fontWeight: 600 }}>
                            {formatFieldValue(key, msg.merged[key as keyof RezeptSnapshot])}
                          </span>
                        </span>
                      </div>
                    ))}
                  </div>
                  {msg.status === 'pending' ? (
                    <div className="flex gap-2">
                      <button onClick={() => applyDiff(msg.id)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11.5px] font-semibold transition-all"
                        style={{ background: 'var(--primary)', color: 'var(--primary-foreground)' }}>
                        <Check size={12} /> Übernehmen
                      </button>
                      <button onClick={() => discardDiff(msg.id)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11.5px] font-medium transition-all"
                        style={{ background: 'transparent', border: '1px solid var(--border)', color: 'var(--text-muted)' }}>
                        <XIcon size={12} /> Verwerfen
                      </button>
                    </div>
                  ) : (
                    <div className="text-[11px] font-semibold flex items-center gap-1"
                      style={{ color: msg.status === 'applied' ? '#3A7A38' : 'var(--text-muted)' }}>
                      {msg.status === 'applied' ? <><Check size={12} /> Übernommen</> : <><XIcon size={12} /> Verworfen</>}
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {loading && (
            <div className="flex gap-2.5">
              <div className="w-6 h-6 rounded-full flex-shrink-0 flex items-center justify-center bg-gold/10 border border-gold/30">
                <ChefHat size={12} color="#C9A84C" strokeWidth={1.5} />
              </div>
              <div className="bg-background border border-border rounded-xl rounded-tl-sm px-3.5 py-3">
                <div className="flex gap-1.5 items-center">
                  {[0, 1, 2].map(i => (
                    <div key={i} className="w-1.5 h-1.5 rounded-full animate-bounce"
                      style={{ background: '#6B3A4B', opacity: 0.6, animationDelay: `${i * 150}ms` }} />
                  ))}
                </div>
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        <div className="p-3 border-t border-border flex flex-col gap-1.5 flex-shrink-0">
          {(blocked || !gateReady) && (
            <span className="text-[11px] px-1" style={{ color: 'var(--text-muted)' }}>{blockedReason}</span>
          )}
          <div className="flex gap-2">
            <input
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && !e.shiftKey && send(input)}
              disabled={blocked || !gateReady}
              placeholder="z.B. „Übersetze auf Deutsch“…"
              className="flex-1 bg-background border border-border-strong rounded-lg px-3 py-2.5 text-text-primary text-[12.5px] outline-none focus:border-gold/40 transition-colors disabled:opacity-50" />
            <button onClick={() => send(input)} disabled={loading || !input.trim() || blocked || !gateReady}
              className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 transition-all disabled:opacity-40"
              style={{ background: 'linear-gradient(135deg, #562E3C, #7D4558)' }}>
              {loading
                ? <Loader2 size={15} className="animate-spin" color="#FFFFFF" />
                : <Send size={15} color="#FFFFFF" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
