'use client';
import { useEffect, useRef, useState } from 'react';
import { MessageSquarePlus, Loader2, CheckCircle2 } from 'lucide-react';
import { FEEDBACK_KATEGORIEN, FEEDBACK_KATEGORIE_META, FEEDBACK_TEXT_MAX_LENGTH, type FeedbackKategorie } from '@/config/feedback';

export default function FeedbackButton() {
  const [open, setOpen] = useState(false);
  const [kategorie, setKategorie] = useState<FeedbackKategorie>('idee');
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handle = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, [open]);

  const handleToggle = () => {
    setOpen(p => {
      const next = !p;
      // Beim Schliessen zuruecksetzen, damit das naechste Oeffnen frisch startet.
      if (!next) { setSuccess(false); setError(''); }
      return next;
    });
  };

  const handleSubmit = async () => {
    if (!text.trim()) return;
    setSending(true);
    setError('');
    try {
      const res = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ kategorie, text: text.trim() }),
      });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(d.error || 'Feedback konnte nicht gesendet werden.');
        setSending(false);
        return;
      }
      setSuccess(true);
      setText('');
      setSending(false);
    } catch {
      setError('Netzwerkfehler.');
      setSending(false);
    }
  };

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      {open && (
        <div style={{
          position: 'absolute', bottom: 'calc(100% + 8px)', left: 8, right: 8,
          background: 'var(--surface, #FFFFFF)',
          border: '1px solid var(--border, #E8E0D8)',
          borderRadius: 14,
          boxShadow: '0 8px 32px rgba(0,0,0,0.18)',
          padding: 16,
          zIndex: 100,
        }}>
          {success ? (
            <div className="text-center py-3">
              <CheckCircle2 size={24} style={{ color: '#5A9A58', margin: '0 auto 8px' }} />
              <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>Danke, dein Feedback ist angekommen!</p>
            </div>
          ) : (
            <>
              <div style={{ fontSize: 9, letterSpacing: '3px', textTransform: 'uppercase', color: 'var(--text-muted, #B09880)', marginBottom: 10 }}>
                Feedback
              </div>

              <div style={{ display: 'flex', gap: 6, marginBottom: 10 }}>
                {FEEDBACK_KATEGORIEN.map(k => (
                  <button key={k} type="button" onClick={() => setKategorie(k)}
                    style={{
                      flex: 1, padding: '6px 4px', borderRadius: 8, fontSize: 11, fontWeight: 600,
                      cursor: 'pointer', transition: 'all 0.15s',
                      background: kategorie === k ? 'var(--accent, #6B3A4B)' : 'var(--accent-light, rgba(107,58,75,0.06))',
                      color: kategorie === k ? '#FFFFFF' : 'var(--text-muted, #8B7355)',
                      border: kategorie === k ? '1px solid var(--accent, #6B3A4B)' : '1px solid var(--border, #E8E0D8)',
                    }}>
                    {FEEDBACK_KATEGORIE_META[k].label}
                  </button>
                ))}
              </div>

              <textarea
                value={text}
                onChange={e => setText(e.target.value.slice(0, FEEDBACK_TEXT_MAX_LENGTH))}
                placeholder="Was möchtest du uns sagen?"
                rows={4}
                style={{
                  width: '100%', boxSizing: 'border-box', resize: 'vertical',
                  padding: '8px 10px', borderRadius: 8, fontSize: 12.5,
                  border: '1px solid var(--border, #E8E0D8)',
                  background: 'var(--bg, #FAF8F5)',
                  color: 'var(--text, #2C2420)',
                  outline: 'none',
                  fontFamily: 'inherit',
                }} />
              <div style={{ textAlign: 'right', fontSize: 10, color: 'var(--text-muted)', marginTop: 3, marginBottom: 10 }}>
                {text.length} / {FEEDBACK_TEXT_MAX_LENGTH}
              </div>

              {error && (
                <div style={{ fontSize: 11.5, color: '#C05050', marginBottom: 8 }}>{error}</div>
              )}

              <button onClick={handleSubmit} disabled={sending || !text.trim()}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-[12px] font-semibold transition-all disabled:opacity-40"
                style={{ background: 'linear-gradient(135deg, #562E3C, #6B3A4B)', color: '#FFFFFF' }}>
                {sending && <Loader2 size={13} className="animate-spin" />}
                {sending ? 'Wird gesendet…' : 'Absenden'}
              </button>
            </>
          )}
        </div>
      )}

      <button
        onClick={handleToggle}
        className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-[12px] font-medium transition-all"
        style={{ color: 'var(--text-muted, #8B7355)' }}
        onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = '#6B3A4B'; (e.currentTarget as HTMLButtonElement).style.background = 'rgba(107,58,75,0.06)'; }}
        onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = 'var(--text-muted, #8B7355)'; (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; }}>
        <MessageSquarePlus size={14} />
        Feedback
      </button>
    </div>
  );
}
