'use client';
import PageTransition from '@/components/ui/PageTransition';
import { useState, useRef, useEffect } from 'react';
import { ChefHat, Send, Loader2, User } from 'lucide-react';

interface Message {
  id: number;
  role: 'user' | 'assistant';
  text: string;
  time: string;
}

const quickPrompts = [
  'Welche Sauce passt zu Steinbutt?',
  'Wie fermentiere ich schwarzen Knoblauch?',
  'Dessert für ein 7-Gang-Menü?',
  'Techniken für perfektes Tartare',
  'Was passt zu Bärlauch im Frühling?',
  'Foie Gras vegan ersetzen?',
];

function now() {
  return new Date().toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });
}

function renderText(text: string) {
  return text.split('\n').map((line, i) => {
    const boldLine = line.match(/^\*\*(.+?)\*\*/);
    if (boldLine) {
      const rest = line.slice(boldLine[0].length);
      return (
        <p key={i} className="mt-2 first:mt-0">
          <span className="font-semibold text-text-primary">{boldLine[1]}</span>{rest}
        </p>
      );
    }
    const numLine = line.match(/^(\d+)\.\s(.+)/);
    if (numLine) {
      return (
        <p key={i} className="flex gap-2 mt-1.5 first:mt-0">
          <span className="font-semibold flex-shrink-0" style={{ color: '#6B3A4B' }}>{numLine[1]}.</span>
          <span>{numLine[2]}</span>
        </p>
      );
    }
    if (!line.trim()) return <div key={i} className="h-1.5" />;
    return <p key={i} className="mt-1 first:mt-0 leading-relaxed">{line}</p>;
  });
}

const initial: Message[] = [{
  id: 1,
  role: 'assistant',
  text: 'Guten Tag. Ich bin dein KI-Sous-Chef. Was beschäftigt dich heute in der Küche?\n\nIch helfe dir bei Rezeptentwicklung, Techniken, Pairings, Fermentation und allem rund um professionelle Küche.',
  time: '09:00',
}];

export default function KiSousChefPage() {
  const [messages, setMessages] = useState<Message[]>(initial);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const send = async (text: string) => {
    if (!text.trim() || loading) return;
    const userMsg: Message = { id: Date.now(), role: 'user', text, time: now() };
    const history = [...messages, userMsg];
    setMessages(history);
    setInput('');
    setLoading(true);

    const assistantId = Date.now() + 1;
    setMessages(prev => [...prev, { id: assistantId, role: 'assistant', text: '', time: now() }]);

    try {
      const res = await fetch('/api/ki/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: history.map(m => ({ role: m.role, content: m.text })),
        }),
      });

      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        const errText = d.message || d.error || 'Etwas ist schiefgelaufen. Bitte versuche es erneut.';
        setMessages(prev => prev.map(m => m.id === assistantId ? { ...m, text: errText } : m));
        return;
      }

      const reader = res.body?.getReader();
      if (reader) {
        const decoder = new TextDecoder();
        for (;;) {
          const { done, value } = await reader.read();
          if (done) break;
          const chunk = decoder.decode(value, { stream: true });
          if (chunk) {
            setMessages(prev => prev.map(m => m.id === assistantId ? { ...m, text: m.text + chunk } : m));
          }
        }
      }
    } catch {
      setMessages(prev => prev.map(m => m.id === assistantId
        ? { ...m, text: 'Netzwerkfehler. Bitte versuche es erneut.' }
        : m));
    } finally {
      setLoading(false);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  };

  return (
    <PageTransition>
    <div className="flex flex-col" style={{ background: 'var(--bg)', height: '100vh' }}>
      <div className="px-8 pt-8 pb-6 flex-shrink-0"
        style={{ borderBottom: '1px solid var(--border)' }}>
        <div className="text-[10px] font-semibold tracking-[4px] uppercase mb-2"
          style={{ color: 'rgba(107,58,75,0.55)' }}>✦ &nbsp;Kulinarische KI</div>
        <h1 className="font-heading font-bold leading-none"
          style={{ fontSize: 28, color: 'var(--text)', letterSpacing: '2px', textTransform: 'uppercase' }}>
          KI-Sous-Chef
        </h1>
        <p className="mt-1.5" style={{ color: 'var(--text-muted)', fontSize: 13 }}>
          Dein kulinarischer Assistent für Rezepte, Techniken und Inspiration
        </p>
      </div>
      <div className="flex flex-col flex-1 p-8 max-w-[900px] w-full mx-auto min-h-0">

      {/* Chat */}
      <div className="flex-1 overflow-y-auto bg-card border border-border rounded-xl p-5 mb-4 space-y-5 min-h-0">
        {messages.map(msg => (
          <div key={msg.id} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
            <div className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center mt-0.5 ${
              msg.role === 'assistant' ? 'bg-gold/10 border border-gold/30' : 'bg-black/5 border border-black/10'
            }`}>
              {msg.role === 'assistant'
                ? <ChefHat size={15} color="#C9A84C" strokeWidth={1.5} />
                : <User size={14} className="text-text-secondary" />}
            </div>
            <div className={`max-w-[78%] flex flex-col gap-1 ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
              <div className={`rounded-xl px-4 py-3 text-[13px] ${
                msg.role === 'user'
                  ? 'rounded-tr-sm text-white'
                  : 'bg-background border border-border text-text-secondary rounded-tl-sm'
              }`}
                style={msg.role === 'user' ? { background: 'linear-gradient(135deg, #562E3C, #6B3A4B)' } : {}}>
                {renderText(msg.text)}
              </div>
              <span className="text-[10px] text-text-muted px-1">{msg.time}</span>
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center bg-gold/10 border border-gold/30">
              <ChefHat size={15} color="#C9A84C" strokeWidth={1.5} />
            </div>
            <div className="bg-background border border-border rounded-xl rounded-tl-sm px-4 py-3.5">
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

      {/* Quick prompts */}
      <div className="flex gap-2 flex-wrap mb-3 flex-shrink-0">
        {quickPrompts.map(q => (
          <button key={q}
            onClick={() => send(q)}
            disabled={loading}
            className="text-[11px] px-3 py-1.5 rounded-full bg-card border border-border text-text-muted transition-all whitespace-nowrap disabled:opacity-40 disabled:cursor-not-allowed">
            {q}
          </button>
        ))}
      </div>

      {/* Input */}
      <div className="flex gap-3 flex-shrink-0">
        <input
          ref={inputRef}
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && !e.shiftKey && send(input)}
          placeholder="Frage stellen oder Idee beschreiben…"
          className="flex-1 bg-card border border-border-strong rounded-xl px-4 py-3 text-text-primary text-[13px] outline-none focus:border-gold/40 transition-colors" />
        <button onClick={() => send(input)} disabled={loading || !input.trim()}
          className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 transition-all disabled:opacity-40"
          style={{ background: 'linear-gradient(135deg, #562E3C, #7D4558)' }}>
          {loading
            ? <Loader2 size={18} className="animate-spin" color="#FFFFFF" />
            : <Send size={18} color="#FFFFFF" />}
        </button>
      </div>
    </div>
    </div>
    </PageTransition>
  );
}