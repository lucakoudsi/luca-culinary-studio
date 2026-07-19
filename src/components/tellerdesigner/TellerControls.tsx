'use client';
import { useEffect, useRef, useState } from 'react';
import { Sparkles, Loader2, Shuffle, BookMarked, PenLine, Target, LayoutGrid, Wand2, Contrast, ChevronDown } from 'lucide-react';
import type { Recipe } from '@/types';
import { AUFWANDSSTUFEN, type Aufwandsstufe } from '@/config/techniken';
import { STILRICHTUNGEN, STILRICHTUNG_LABEL, type Stilrichtung } from '@/config/tellerStilrichtung';
import { ANRICHTE_FOKUSSE, ANRICHTE_FOKUS_LABEL, type AnrichteFokus } from '@/config/tellerAnrichteFokus';

const AUFWAND_LABEL: Record<Aufwandsstufe, string> = {
  bistro: 'Einfach',
  gehoben: 'Mittel',
  fine_dining: 'Profi',
};

const ANRICHTE_FOKUS_ICON: Record<AnrichteFokus, typeof Target> = {
  zutat_im_fokus: Target,
  symmetrie: LayoutGrid,
  kreativ: Wand2,
  farbe_kontrast: Contrast,
};

type Quota = { used: number; limit: number; remaining: number } | null;

type TellerControlsProps = {
  recipes: Recipe[];
  mode: 'rezept' | 'frei';
  onModeChange: (mode: 'rezept' | 'frei') => void;
  selectedId: number;
  onSelectedIdChange: (id: number) => void;
  freieBeschreibung: string;
  onFreieBeschreibungChange: (text: string) => void;
  aufwand: Aufwandsstufe;
  onAufwandChange: (a: Aufwandsstufe) => void;
  stilrichtung: Stilrichtung;
  onStilrichtungChange: (s: Stilrichtung) => void;
  anrichteFokus: AnrichteFokus;
  onAnrichteFokusChange: (f: AnrichteFokus) => void;
  canGenerate: boolean;
  loading: boolean;
  quotaExhausted: boolean;
  isUnlimitedQuota: boolean;
  quota: Quota;
  onGenerate: () => void;
  onRandom: () => void;
};

const NUM_LABEL = 'text-[10px] font-semibold uppercase tracking-[2.5px]';

// Ruhiger Text-Praefix statt Kreis-Badge -- "1. REZEPT AUSWAEHLEN" statt
// nummeriertem Icon-Chip. NUM_LABEL bringt uppercase bereits per CSS mit,
// der Aufrufer kann die Kinder also in normaler Schreibweise uebergeben.
function StepLabel({ n, children }: { n: number; children: React.ReactNode }) {
  return (
    <div className={`${NUM_LABEL} mb-2.5`} style={{ color: 'var(--text-muted)' }}>
      {n}. {children}
    </div>
  );
}

/** Gerahmtes, eigenes Dropdown statt natives <select> -- ein natives select
 * kann den gewaehlten Text im geschlossenen Zustand nicht browseruebergreifend
 * zweizeilig umbrechen (das OS-Widget rendert ihn erzwungen einzeilig). */
function RezeptSelect({ recipes, selectedId, onChange }: {
  recipes: Recipe[]; selectedId: number; onChange: (id: number) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const selected = recipes.find(r => r.id === selectedId);

  useEffect(() => {
    if (!open) return;
    const onClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      <button type="button" onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between gap-3 text-left rounded-xl px-4 py-3 transition-colors"
        style={{ border: '1px solid var(--border)', background: 'var(--card)' }}>
        <span className="font-heading text-[15px] leading-snug" style={{ color: 'var(--text)' }}>
          {selected?.title ?? 'Rezept wählen'}
        </span>
        <ChevronDown size={16} className="flex-shrink-0 transition-transform duration-200"
          style={{ color: 'var(--text-muted)', transform: open ? 'rotate(180deg)' : 'none' }} />
      </button>
      {open && (
        <div className="absolute left-0 right-0 z-30 mt-2 py-1.5 rounded-xl overflow-auto"
          style={{ border: '1px solid var(--border)', background: 'var(--card)', boxShadow: '0 12px 28px rgba(0,0,0,0.14)', maxHeight: 280 }}>
          {recipes.map(r => (
            <button key={r.id} type="button" onClick={() => { onChange(r.id); setOpen(false); }}
              className="w-full text-left px-4 py-2.5 text-[13.5px] leading-snug transition-colors hover:bg-black/[0.03]"
              style={{
                color: r.id === selectedId ? '#6B3A4B' : 'var(--text)',
                background: r.id === selectedId ? 'rgba(107,58,75,0.06)' : 'transparent',
                fontWeight: r.id === selectedId ? 600 : 400,
              }}>
              {r.title}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function TellerControls({
  recipes, mode, onModeChange, selectedId, onSelectedIdChange,
  freieBeschreibung, onFreieBeschreibungChange,
  aufwand, onAufwandChange, stilrichtung, onStilrichtungChange,
  anrichteFokus, onAnrichteFokusChange,
  canGenerate, loading, quotaExhausted, isUnlimitedQuota, quota, onGenerate, onRandom,
}: TellerControlsProps) {
  const aufwandIndex = AUFWANDSSTUFEN.indexOf(aufwand);

  return (
    <div className="w-[320px] flex-shrink-0 space-y-6 bg-card border border-border rounded-2xl p-7">
      {/* Modus-Umschalter */}
      <div className="flex gap-1.5 p-1 rounded-lg" style={{ background: 'rgba(0,0,0,0.03)' }}>
        <button onClick={() => onModeChange('rezept')}
          className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-md text-[11.5px] font-semibold transition-all"
          style={{
            background: mode === 'rezept' ? 'var(--card)' : 'transparent',
            color: mode === 'rezept' ? '#6B3A4B' : 'var(--text-muted)',
            boxShadow: mode === 'rezept' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
          }}>
          <BookMarked size={12} /> Rezept
        </button>
        <button onClick={() => onModeChange('frei')}
          className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-md text-[11.5px] font-semibold transition-all"
          style={{
            background: mode === 'frei' ? 'var(--card)' : 'transparent',
            color: mode === 'frei' ? '#6B3A4B' : 'var(--text-muted)',
            boxShadow: mode === 'frei' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
          }}>
          <PenLine size={12} /> Frei
        </button>
      </div>

      {/* 1. Rezept auswaehlen / Gericht beschreiben */}
      <div>
        <StepLabel n={1}>{mode === 'rezept' ? 'Rezept auswählen' : 'Gericht beschreiben'}</StepLabel>
        {mode === 'rezept' ? (
          recipes.length === 0 ? (
            <p className="text-[12px] text-text-muted italic">Noch keine Rezepte vorhanden — wechsle zu „Frei".</p>
          ) : (
            <RezeptSelect recipes={recipes} selectedId={selectedId} onChange={onSelectedIdChange} />
          )
        ) : (
          <textarea value={freieBeschreibung} onChange={e => onFreieBeschreibungChange(e.target.value)}
            placeholder="z.B. Geschmortes Rinderbäckchen mit Selleriepüree und Rotweinjus…" rows={2}
            className="w-full bg-transparent border rounded-lg px-3 py-2.5 text-text-primary text-[13px] outline-none focus:border-gold/50 resize-none leading-relaxed transition-colors"
            style={{ borderColor: 'var(--border)' }} />
        )}
      </div>

      <div className="h-px" style={{ background: 'var(--border)' }} />

      {/* 2. Stilrichtung */}
      <div>
        <StepLabel n={2}>Stilrichtung</StepLabel>
        <div className="grid grid-cols-2 gap-2">
          {STILRICHTUNGEN.map(s => (
            <button key={s} onClick={() => onStilrichtungChange(s)}
              className="px-2.5 py-1.5 rounded-lg text-[11px] font-semibold transition-all text-center"
              style={{
                background: stilrichtung === s ? '#6B3A4B' : 'rgba(0,0,0,0.03)',
                color: stilrichtung === s ? '#FFFFFF' : 'var(--text-muted)',
                border: `1px solid ${stilrichtung === s ? '#6B3A4B' : 'rgba(0,0,0,0.08)'}`,
              }}>
              {STILRICHTUNG_LABEL[s]}
            </button>
          ))}
        </div>
      </div>

      <div className="h-px" style={{ background: 'var(--border)' }} />

      {/* 3. Schwierigkeit */}
      <div>
        <StepLabel n={3}>Schwierigkeit</StepLabel>
        <div className="flex items-center gap-3">
          <span className="text-[11px] font-medium flex-shrink-0" style={{ color: 'var(--text-muted)' }}>Einfach</span>
          <input
            type="range" min={0} max={2} step={1} value={aufwandIndex}
            onChange={e => onAufwandChange(AUFWANDSSTUFEN[Number(e.target.value)])}
            className="flex-1 teller-slider"
            style={{ '--slider-pct': `${(aufwandIndex / 2) * 100}%` } as React.CSSProperties} />
          <span className="text-[11px] font-medium flex-shrink-0" style={{ color: 'var(--text-muted)' }}>Profi</span>
        </div>
        <div className="text-center mt-2 text-[11px] font-semibold" style={{ color: '#6B3A4B' }}>{AUFWAND_LABEL[aufwand]}</div>
      </div>

      <div className="h-px" style={{ background: 'var(--border)' }} />

      {/* 4. Anrichte-Fokus */}
      <div>
        <StepLabel n={4}>Anrichte-Fokus</StepLabel>
        <div className="grid grid-cols-2 gap-2">
          {ANRICHTE_FOKUSSE.map(f => {
            const Icon = ANRICHTE_FOKUS_ICON[f];
            const active = anrichteFokus === f;
            return (
              <button key={f} onClick={() => onAnrichteFokusChange(f)}
                className="flex flex-col items-center gap-1 px-2 py-2 rounded-lg text-[11px] font-medium transition-all text-center"
                style={{
                  background: active ? 'rgba(201,168,76,0.12)' : 'rgba(0,0,0,0.03)',
                  border: `1px solid ${active ? 'rgba(201,168,76,0.4)' : 'rgba(0,0,0,0.08)'}`,
                  color: active ? '#9B7A2A' : 'var(--text-muted)',
                }}>
                <Icon size={16} strokeWidth={1.6} />
                {ANRICHTE_FOKUS_LABEL[f]}
              </button>
            );
          })}
        </div>
      </div>

      <div className="space-y-2">
        <button onClick={onGenerate} disabled={loading || !canGenerate || quotaExhausted}
          className="w-full flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg font-semibold text-[14px] transition-all disabled:opacity-50"
          style={{ background: 'linear-gradient(135deg, #562E3C, #7D4558)', color: '#FFFFFF' }}>
          {loading ? <><Loader2 size={16} className="animate-spin" /> Generiere…</> : <><Sparkles size={16} /> Generieren</>}
        </button>
        <button onClick={onRandom} disabled={loading}
          className="w-full flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg font-semibold text-[13px] transition-all disabled:opacity-50"
          style={{ background: 'transparent', color: '#6B3A4B', border: '1px solid rgba(107,58,75,0.25)' }}>
          <Shuffle size={14} /> Zufälliges Design
        </button>
        <p className="text-[11px] text-center" style={{ color: 'var(--text-muted)' }}>
          {quota ? (isUnlimitedQuota ? 'Unbegrenztes Kontingent' : `Noch ${quota.remaining} von ${quota.limit} Bildern diesen Monat`) : ''}
        </p>
      </div>
    </div>
  );
}
