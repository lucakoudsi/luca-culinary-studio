'use client';
import { useState, useRef, useEffect } from 'react';
import { ChefHat, Send, User, Loader2 } from 'lucide-react';
import type { RezeptSnapshot } from '@/lib/rezeptKiExtraktion';

type SousChefMessage = { id: number; role: 'user' | 'assistant'; text: string; time: string };

function nowTime() {
  return new Date().toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });
}

function renderSousChefText(text: string) {
  return text.split('\n').map((line, i) => {
    if (!line.trim()) return <div key={i} className="h-1.5" />;
    return <p key={i} className="mt-1 first:mt-0 leading-relaxed">{line}</p>;
  });
}

type SousChefPanelProps = {
  /** Liest den AKTUELLEN Formular-Stand -- als Funktion statt fixem Wert, damit bei jeder Nachricht frisch gelesen wird (kein stale Snapshot). */
  getSnapshot: () => RezeptSnapshot;
  /** Wendet nur die vom Sous-Chef zurückgegebenen, tatsächlich geänderten Felder auf den Formular-Stand des Elternteils an. */
  onApplyPatch: (patch: Partial<RezeptSnapshot>) => void;
  /** Erste Nachricht im Chat -- je nach Kontext (Import vs. bestehendes Rezept bearbeiten) unterschiedlich formuliert. */
  greeting: string;
  /** Abstand von oben für die sticky-Positionierung -- je nach Seite (mit/ohne eigenem sticky Header) unterschiedlich. */
  stickyTop?: number;
};

/** Chat-Panel für den KI-Sous-Chef: Rezept im Dialog korrigieren/verfeinern -- sowohl direkt nach dem KI-Import als auch beim späteren Bearbeiten eines gespeicherten Rezepts. */
export default function SousChefPanel({ getSnapshot, onApplyPatch, greeting, stickyTop = 88 }: SousChefPanelProps) {
  const [messages, setMessages] = useState<SousChefMessage[]>(() => [
    { id: Date.now(), role: 'assistant', text: greeting, time: nowTime() },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const send = async (text: string) => {
    if (!text.trim() || loading) return;
    const userMsg: SousChefMessage = { id: Date.now(), role: 'user', text, time: nowTime() };
    const history = [...messages, userMsg];
    setMessages(history);
    setInput('');
    setLoading(true);

    try {
      const res = await fetch('/api/rezepte/sous-chef', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rezept: getSnapshot(),
          messages: history.map(m => ({ role: m.role, content: m.text })),
        }),
      });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) {
        const errText = d.message || d.error || 'Etwas ist schiefgelaufen. Bitte versuche es erneut.';
        setMessages(prev => [...prev, { id: Date.now() + 1, role: 'assistant', text: errText, time: nowTime() }]);
        return;
      }
      if (d.updatedFields && Object.keys(d.updatedFields).length > 0) {
        onApplyPatch(d.updatedFields);
      }
      setMessages(prev => [...prev, { id: Date.now() + 1, role: 'assistant', text: d.reply || 'Verstanden.', time: nowTime() }]);
    } catch {
      setMessages(prev => [...prev, { id: Date.now() + 1, role: 'assistant', text: 'Netzwerkfehler. Bitte versuche es erneut.', time: nowTime() }]);
    } finally {
      setLoading(false);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  };

  return (
    <div className="w-[380px] flex-shrink-0 sticky flex flex-col hidden lg:flex"
      style={{ top: stickyTop, height: `calc(100vh - ${stickyTop + 32}px)` }}>
      <div className="bg-card border border-border rounded-xl flex flex-col flex-1 min-h-0 overflow-hidden">
        <div className="px-4 py-3.5 border-b border-border flex items-center gap-2.5 flex-shrink-0">
          <div className="w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center bg-gold/10 border border-gold/30">
            <ChefHat size={13} color="#C9A84C" strokeWidth={1.5} />
          </div>
          <div>
            <div className="text-[13px] font-semibold text-text-primary">KI-Sous-Chef</div>
            <div className="text-[11px] text-text-muted">Rezept korrigieren &amp; verfeinern</div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 min-h-0">
          {messages.map(msg => (
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
          ))}

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

        <div className="p-3 border-t border-border flex gap-2 flex-shrink-0">
          <input
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && !e.shiftKey && send(input)}
            placeholder="z.B. „Das sind Calamari, keine Ofenkartoffeln“…"
            className="flex-1 bg-background border border-border-strong rounded-lg px-3 py-2.5 text-text-primary text-[12.5px] outline-none focus:border-gold/40 transition-colors" />
          <button onClick={() => send(input)} disabled={loading || !input.trim()}
            className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 transition-all disabled:opacity-40"
            style={{ background: 'linear-gradient(135deg, #562E3C, #7D4558)' }}>
            {loading
              ? <Loader2 size={15} className="animate-spin" color="#FFFFFF" />
              : <Send size={15} color="#FFFFFF" />}
          </button>
        </div>
      </div>
    </div>
  );
}
