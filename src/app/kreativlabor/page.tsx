'use client';
import { useState, useEffect } from 'react';
import { useStore } from '@/lib/store';
import { generateCreativeResult } from '@/lib/mockAI';
import type { CreativeResult } from '@/types';
import {
  FlaskConical, Sparkles, Save, Trash2, ChevronRight,
  CheckCircle, Loader2
} from 'lucide-react';
import { FEATURES } from '@/config/features';
import ComingSoonOverlay from '@/components/ui/ComingSoonOverlay';

const styleOptions = ['Modern', 'Fine Dining', 'Fusion', 'Klassisch', 'Vegetarisch', 'Avantgarde'];

function ResultCard({ result, onSave, onDelete }: { result: CreativeResult; onSave: () => void; onDelete: () => void }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden">
      <div className="p-5">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-[11px] px-2 py-0.5 rounded-full font-semibold"
                style={{ background: 'rgba(107,58,75,0.1)', color: '#6B3A4B', border: '1px solid rgba(107,58,75,0.25)' }}>
                {result.inputStyle}
              </span>
              {result.saved && (
                <span className="text-[11px] px-2 py-0.5 rounded-full font-semibold flex items-center gap-1"
                  style={{ background: 'rgba(124,184,122,0.15)', color: '#7CB87A', border: '1px solid rgba(124,184,122,0.3)' }}>
                  <CheckCircle size={10} />Gespeichert
                </span>
              )}
            </div>
            <h3 className="font-heading text-[18px] font-bold text-text-primary leading-snug">{result.name}</h3>
          </div>
          <div className="flex gap-1.5 flex-shrink-0">
            {!result.saved && (
              <button onClick={onSave} title="Im Rezeptarchiv speichern"
                className="p-2 rounded-lg border border-border hover:border-gold/40 hover:text-gold text-text-muted transition-all">
                <Save size={15} />
              </button>
            )}
            <button onClick={onDelete}
              className="p-2 rounded-lg border border-border hover:border-red-500/40 hover:text-red-400 text-text-muted transition-all">
              <Trash2 size={15} />
            </button>
          </div>
        </div>

        <p className="text-[13px] text-text-secondary leading-relaxed mb-4">{result.concept}</p>

        <div className="mb-4">
          <div className="text-[11px] text-text-muted font-semibold uppercase tracking-widest mb-2">Zutaten</div>
          <div className="space-y-1.5">
            {result.ingredients.map((ing, i) => (
              <div key={i} className="flex items-center gap-3 bg-background rounded-md px-3 py-2">
                <span className="text-[13px] font-medium text-text-primary flex-1">{ing.name}</span>
                <span className="text-[12px] font-semibold" style={{ color: '#6B3A4B' }}>{ing.amount}</span>
                <span className="text-[11px] text-text-muted hidden sm:block">{ing.note}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="flex flex-wrap gap-2 mb-4">
          {result.techniques.map(t => (
            <span key={t} className="text-[11px] px-2.5 py-1 rounded-md bg-card-hover text-text-secondary border border-border">{t}</span>
          ))}
        </div>

        <button onClick={() => setOpen(!open)}
          className="text-[13px] flex items-center gap-1.5 transition-colors"
          style={{ color: '#6B3A4B' }}>
          {open ? 'Weniger' : 'Zubereitung & Anrichten anzeigen'}
          <ChevronRight size={14} style={{ transform: open ? 'rotate(90deg)' : 'none', transition: 'transform 0.2s' }} />
        </button>
      </div>

      {open && (
        <div className="border-t border-border px-5 pb-5 pt-4 space-y-5">
          <div>
            <div className="text-[11px] text-text-muted font-semibold uppercase tracking-widest mb-3">Zubereitung</div>
            <ol className="space-y-3">
              {result.preparation.map((step, i) => (
                <li key={i} className="flex gap-3">
                  <span className="w-5 h-5 rounded-full flex-shrink-0 flex items-center justify-center text-[11px] font-bold mt-0.5"
                    style={{ background: 'rgba(107,58,75,0.1)', color: '#6B3A4B' }}>
                    {i + 1}
                  </span>
                  <span className="text-[13px] text-text-secondary leading-relaxed">{step}</span>
                </li>
              ))}
            </ol>
          </div>
          <div>
            <div className="text-[11px] text-text-muted font-semibold uppercase tracking-widest mb-2">Anrichten</div>
            <p className="text-[13px] text-text-secondary leading-relaxed rounded-lg p-3 bg-background border border-border">{result.plating}</p>
          </div>
        </div>
      )}
    </div>
  );
}

export default function KreativlaborPage() {
  const { creativeResults, addCreativeResult, saveCreativeResult, deleteCreativeResult, addRecipe } = useStore();
  const [ingredients, setIngredients] = useState('');
  const [style, setStyle] = useState('Fine Dining');
  const [requirements, setRequirements] = useState('');
  const [loading, setLoading] = useState(false);
  const [projektContext, setProjektContext] = useState<{ id: string; title: string } | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const pre     = params.get('ingredients');
    const context = params.get('context');
    const projektId = params.get('projekt');
    if (pre) setIngredients(pre);
    if (projektId && context) setProjektContext({ id: projektId, title: context });
  }, []);

  const handleGenerate = async () => {
    if (!ingredients.trim()) return;
    setLoading(true);
    await new Promise(r => setTimeout(r, 1800));
    addCreativeResult(generateCreativeResult({ ingredients, style, requirements }));
    setLoading(false);
  };

  const handleSave = (result: CreativeResult) => {
    saveCreativeResult(result.id);
    addRecipe({
      title: result.name, category: 'Hauptgang',
      tags: [result.inputStyle, 'KI-generiert'], difficulty: 'Mittel', time: 90,
      season: 'Ganzjährig', status: 'Entwurf', rating: 0, image: null, description: result.concept,
    });
  };

  return (
    <>
    {!FEATURES.AI_ENABLED && <ComingSoonOverlay />}
    <div style={{ background: '#FAF8F5', minHeight: '100vh', opacity: FEATURES.AI_ENABLED ? 1 : 0.4 }}>
      <div className="px-8 pt-8 pb-6" style={{ borderBottom: '1px solid #E8E0D8' }}>
        <div className="text-[10px] font-semibold tracking-[4px] uppercase mb-2" style={{ color: 'rgba(107,58,75,0.55)' }}>✦ &nbsp;Experimentiere</div>
        <h1 className="font-heading font-bold leading-none" style={{ fontSize: 28, color: '#2C2420', letterSpacing: '2px', textTransform: 'uppercase' }}>
          {projektContext ? 'Konzept bearbeiten' : 'Kreativlabor'}
        </h1>
        <p className="text-text-secondary text-sm mt-1.5">Gib Zutaten und Stil ein – der KI-Sous-Chef entwickelt ein vollständiges Konzept mit Zubereitung und Anrichten.</p>
      </div>

      {projektContext && (
        <div className="px-8 py-3 flex items-center gap-3"
          style={{ background: 'rgba(107,58,75,0.06)', borderBottom: '1px solid rgba(107,58,75,0.15)' }}>
          <span style={{ color: '#6B3A4B', fontSize: 12 }}>✦</span>
          <span className="text-[12px]" style={{ color: 'rgba(107,58,75,0.8)' }}>
            Kontext: <strong style={{ color: '#6B3A4B' }}>{projektContext.title}</strong>
          </span>
          <button onClick={() => setProjektContext(null)}
            className="ml-auto text-[11px] transition-colors"
            style={{ color: 'rgba(139,115,85,0.6)' }}
            onMouseEnter={e => (e.currentTarget as HTMLButtonElement).style.color = '#6B3A4B'}
            onMouseLeave={e => (e.currentTarget as HTMLButtonElement).style.color = 'rgba(139,115,85,0.6)'}>
            ✕ Kontext entfernen
          </button>
        </div>
      )}

      <div className="p-8 max-w-[1200px] mx-auto grid grid-cols-[360px_1fr] gap-8">
        {/* Input */}
        <div className="space-y-5">
          <div className="bg-card border border-border rounded-xl p-5 space-y-4">
            <div className="text-[12px] text-text-muted font-semibold uppercase tracking-widest">Eingabe</div>

            <div>
              <label className="block text-[12px] text-text-secondary font-semibold mb-2 uppercase tracking-wider">Zutaten *</label>
              <textarea value={ingredients} onChange={e => setIngredients(e.target.value)}
                placeholder="z.B. Weißer Spargel, Morcheln, Kalbsbäckchen…" rows={3}
                className="w-full bg-background border border-border-strong rounded-lg px-3.5 py-2.5 text-text-primary text-[13px] resize-none outline-none focus:border-gold/40 leading-relaxed" />
              <p className="text-[11px] text-text-muted mt-1">Komma-getrennt. Erste Zutat = Hauptkomponente.</p>
            </div>

            <div>
              <label className="block text-[12px] text-text-secondary font-semibold mb-2 uppercase tracking-wider">Stilrichtung</label>
              <div className="grid grid-cols-3 gap-2">
                {styleOptions.map(s => (
                  <button key={s} onClick={() => setStyle(s)}
                    className="px-2 py-2 rounded-lg text-[12px] font-medium transition-all text-center"
                    style={{
                      background: style === s ? 'rgba(107,58,75,0.12)' : 'rgba(0,0,0,0.04)',
                      border: `1px solid ${style === s ? 'rgba(107,58,75,0.35)' : 'rgba(0,0,0,0.08)'}`,
                      color: style === s ? '#6B3A4B' : '#8B7355',
                    }}>
                    {s}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-[12px] text-text-secondary font-semibold mb-2 uppercase tracking-wider">Anforderungen</label>
              <input value={requirements} onChange={e => setRequirements(e.target.value)}
                placeholder="z.B. Glutenfrei, max. 45 Min, für 4 Personen…"
                className="w-full bg-background border border-border-strong rounded-lg px-3.5 py-2.5 text-text-primary text-[13px] outline-none focus:border-gold/40" />
            </div>

            <div className="relative">
              <button onClick={handleGenerate}
                disabled={loading || !ingredients.trim() || !FEATURES.AI_ENABLED}
                title={!FEATURES.AI_ENABLED ? 'KI-Funktion coming soon' : undefined}
                className="w-full py-3 rounded-lg font-semibold text-[14px] flex items-center justify-center gap-2 transition-all disabled:cursor-not-allowed"
                style={{
                  background: 'linear-gradient(135deg, #562E3C, #7D4558)',
                  color: '#FFFFFF',
                  opacity: !FEATURES.AI_ENABLED || loading || !ingredients.trim() ? 0.5 : 1,
                }}>
                {loading ? <><Loader2 size={17} className="animate-spin" /> Wird entwickelt…</> : <><Sparkles size={17} /> {projektContext ? 'Konzept aktualisieren' : 'Konzept generieren'}</>}
              </button>
              {!FEATURES.AI_ENABLED && (
                <span className="absolute -top-2 -right-2 text-[10px] font-bold px-1.5 py-0.5 rounded-full"
                  style={{ background: 'rgba(107,58,75,0.12)', color: '#6B3A4B', border: '1px solid rgba(107,58,75,0.3)' }}>
                  Coming Soon
                </span>
              )}
            </div>
          </div>

          <div className="bg-card border border-border rounded-xl p-5">
            <div className="text-[12px] text-text-muted font-semibold uppercase tracking-widest mb-3">Tipps</div>
            <ul className="space-y-2.5">
              {['Hauptzutat zuerst – sie bestimmt den Charakter', 'Kontrast-Zutat (2. Position) schafft Spannung', 'Mehrfach generieren für verschiedene Interpretationen', 'Gespeicherte Konzepte landen im Rezeptarchiv'].map((t, i) => (
                <li key={i} className="flex gap-2 text-[12px] text-text-secondary leading-snug">
                  <span className="text-gold mt-0.5">·</span>{t}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Results */}
        <div>
          {creativeResults.length === 0 ? (
            <div className="h-full min-h-[440px] flex flex-col items-center justify-center text-center border border-dashed border-border rounded-xl p-12">
              <div className="w-16 h-16 rounded-xl flex items-center justify-center mb-5"
                style={{ background: 'rgba(107,58,75,0.08)', border: '1px solid rgba(107,58,75,0.2)' }}>
                <Sparkles size={28} color="#6B3A4B" strokeWidth={1.5} />
              </div>
              <h3 className="font-heading text-xl font-bold text-text-primary mb-2">Bereit für dein erstes Konzept</h3>
              <p className="text-text-secondary text-[13px] max-w-xs leading-relaxed">
                Gib Zutaten und Stil ein – der KI-Sous-Chef entwickelt ein vollständiges Rezeptkonzept mit Zubereitung und Anrichten.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-[13px] text-text-secondary">{creativeResults.length} Konzept{creativeResults.length !== 1 ? 'e' : ''}</span>
                <span className="text-[12px] text-text-muted">{creativeResults.filter(r => r.saved).length} gespeichert</span>
              </div>
              {creativeResults.map(r => (
                <ResultCard key={r.id} result={r} onSave={() => handleSave(r)} onDelete={() => deleteCreativeResult(r.id)} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
    </>
  );
}
