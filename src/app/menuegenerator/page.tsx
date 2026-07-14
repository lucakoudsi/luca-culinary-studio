'use client';
import PageTransition from '@/components/ui/PageTransition';
import Menuekarte, { type MenuekarteDaten } from '@/components/Menuekarte';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import type { FlavorProfile, Ingredient } from '@/types';
import type { LucideIcon } from 'lucide-react';
import {
  Sparkles, UtensilsCrossed, Wine, Calendar, Search, X,
  ChevronRight, ChevronLeft, AlertCircle, RefreshCw, Save, CheckCircle, Loader2,
} from 'lucide-react';

// ─── Optionen & Konstanten ─────────────────────────────────────────────────

const ANLASS_OPTIONS: { value: string; label: string; desc: string; Icon: LucideIcon }[] = [
  { value: 'Dinner-Party',      label: 'Dinner-Party',      desc: 'Für Gäste zuhause',       Icon: Wine },
  { value: 'Tasting-Menü',      label: 'Tasting-Menü',      desc: 'Kleine, viele Gänge',      Icon: Sparkles },
  { value: 'à la carte',        label: 'À la carte',        desc: 'Freie Gang-Auswahl',       Icon: UtensilsCrossed },
  { value: 'saisonales Fest',   label: 'Saisonales Fest',   desc: 'Anlassbezogen, festlich',  Icon: Calendar },
];

const SEASON_OPTIONS = [
  { value: 'Frühling', color: '#7CB87A' },
  { value: 'Sommer',   color: '#E8A838' },
  { value: 'Herbst',   color: '#C4743A' },
  { value: 'Winter',   color: '#7BB8D4' },
];

const DIAET_OPTIONS = ['vegetarisch', 'vegan', 'glutenfrei', 'laktosefrei'];

const AUFWAND_OPTIONS = [
  { value: 'bistro',      label: 'Bistro',      desc: 'Einfach, schnell umsetzbar' },
  { value: 'gehoben',     label: 'Gehoben',     desc: 'Mehrteilige Komponenten' },
  { value: 'fine_dining', label: 'Fine Dining', desc: 'Hohe Präzision, kleinteilig' },
];

const KUECHENSTIL_OPTIONS = [
  { value: 'japanisch',              label: 'Japanisch' },
  { value: 'nordisch',               label: 'Nordisch' },
  { value: 'franzoesisch_klassisch', label: 'Französisch Klassisch' },
  { value: 'mediterran',             label: 'Mediterran' },
  { value: 'modern_fusion',          label: 'Modern Fusion' },
  { value: 'keine_vorgabe',          label: 'Keine Vorgabe' },
];

const LOADING_LINES = [
  'Wähle saisonale Zutaten…',
  'Komponiere den Spannungsbogen…',
  'Stimme die Gänge aufeinander ab…',
];

function computeCurrentSeason() {
  const month = new Date().getMonth() + 1;
  if (month === 12 || month <= 2) return 'Winter';
  if (month <= 5) return 'Frühling';
  if (month <= 8) return 'Sommer';
  return 'Herbst';
}

const LOADING_STYLES = `
  @keyframes menuegenPulse { 0%, 100% { opacity: 0.5; transform: scale(0.92); } 50% { opacity: 1; transform: scale(1.06); } }
  @keyframes menuegenFade { 0% { opacity: 0; } 15%, 85% { opacity: 1; } 100% { opacity: 0; } }
  .menuegen-glyph { animation: menuegenPulse 2.4s ease-in-out infinite; }
  .menuegen-line { animation: menuegenFade 2.2s ease-in-out; }
  @media (prefers-reduced-motion: reduce) {
    .menuegen-glyph { animation: none; }
    .menuegen-line { animation: none; }
  }
`;

// ─── Typen ───────────────────────────────────────────────────────────────────

type GangResult = {
  nummer: number;
  titel: string;
  beschreibung: string;
  hauptzutaten: string[];
  geschmacksprofil: Partial<FlavorProfile>;
  zubereitungsidee: string;
};
type MenuResult = {
  titel: string;
  dramaturgie_begruendung: string;
  gaenge: GangResult[];
};
type ApiError = { status: number; error?: string; message?: string };
type Stage = 'dialog' | 'loading' | 'result' | 'error';
type SaveState = 'idle' | 'saving' | 'saved' | 'error';

// ─── Kleine Bausteine ───────────────────────────────────────────────────────

function StepDots({ step }: { step: number }) {
  return (
    <div className="flex items-center justify-center gap-2 mb-9">
      {[1, 2, 3].map(n => (
        <div key={n} className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold transition-all"
            style={{
              background: n <= step ? 'linear-gradient(135deg, #562E3C, #7D4558)' : 'rgba(0,0,0,0.05)',
              color: n <= step ? '#FFFFFF' : 'var(--text-muted)',
            }}>
            {n}
          </div>
          {n < 3 && <div className="w-8 h-px" style={{ background: n < step ? '#C9A84C' : 'var(--border)' }} />}
        </div>
      ))}
    </div>
  );
}

function OptionCard({ selected, onClick, label, desc, Icon }: {
  selected: boolean; onClick: () => void; label: string; desc?: string; Icon?: LucideIcon;
}) {
  return (
    <button onClick={onClick} type="button"
      className="text-left p-4 rounded-xl transition-all"
      style={{
        background: selected ? 'rgba(107,58,75,0.08)' : 'var(--card)',
        border: `1px solid ${selected ? 'rgba(107,58,75,0.4)' : 'var(--border)'}`,
      }}>
      {Icon && <Icon size={18} strokeWidth={1.5} style={{ color: selected ? '#6B3A4B' : 'var(--text-muted)', marginBottom: 8 }} />}
      <div className="text-[13px] font-semibold" style={{ color: selected ? '#6B3A4B' : 'var(--text)' }}>{label}</div>
      {desc && <div className="text-[11px] mt-0.5" style={{ color: 'var(--text-muted)' }}>{desc}</div>}
    </button>
  );
}

function Chip({ label, onRemove, tone }: { label: string; onRemove: () => void; tone: 'pflicht' | 'ausschluss' }) {
  const color = tone === 'pflicht' ? '#6B3A4B' : '#C05050';
  return (
    <span className="inline-flex items-center gap-1.5 text-[12px] px-3 py-1.5 rounded-full font-medium"
      style={{ background: `${color}12`, color, border: `1px solid ${color}35` }}>
      {label}
      <button type="button" onClick={onRemove} className="hover:opacity-70"><X size={12} /></button>
    </span>
  );
}

function ZutatenPicker({ label, hint, tone, allZutaten, selectedIds, otherIds, onAdd, onRemove }: {
  label: string; hint: string; tone: 'pflicht' | 'ausschluss';
  allZutaten: Ingredient[]; selectedIds: number[]; otherIds: number[];
  onAdd: (id: number) => void; onRemove: (id: number) => void;
}) {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const selected = allZutaten.filter(z => selectedIds.includes(z.id));
  const suggestions = query.trim().length > 0
    ? allZutaten.filter(z =>
        z.name.toLowerCase().includes(query.trim().toLowerCase()) &&
        !selectedIds.includes(z.id) && !otherIds.includes(z.id)
      ).slice(0, 8)
    : [];

  return (
    <div>
      <label className="block text-[12px] font-semibold mb-1.5 uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>{label}</label>
      <p className="text-[11px] mb-2.5" style={{ color: 'var(--text-muted)' }}>{hint}</p>
      <div className="relative">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
        <input value={query}
          onChange={e => { setQuery(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
          placeholder="Zutat suchen…"
          className="w-full bg-card-hover border border-border-strong rounded-lg pl-9 pr-3.5 py-2.5 text-[13px] outline-none focus:border-gold/40"
          style={{ color: 'var(--text)' }} />
        {open && suggestions.length > 0 && (
          <div className="absolute z-10 top-full left-0 right-0 mt-1.5 bg-card border border-border-strong rounded-lg overflow-hidden shadow-lg max-h-56 overflow-y-auto">
            {suggestions.map(z => (
              <button key={z.id} type="button"
                onMouseDown={() => { onAdd(z.id); setQuery(''); }}
                className="w-full text-left px-3.5 py-2.5 text-[12px] hover:bg-card-hover transition-colors flex items-center justify-between"
                style={{ color: 'var(--text)' }}>
                <span>{z.name}</span>
                <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>{z.kategorie}</span>
              </button>
            ))}
          </div>
        )}
      </div>
      {selected.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-3">
          {selected.map(z => <Chip key={z.id} label={z.name} tone={tone} onRemove={() => onRemove(z.id)} />)}
        </div>
      )}
    </div>
  );
}

function LoadingScene() {
  const [lineIdx, setLineIdx] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setLineIdx(i => (i + 1) % LOADING_LINES.length), 2200);
    return () => clearInterval(t);
  }, []);
  return (
    <div className="flex flex-col items-center justify-center text-center py-24">
      <style>{LOADING_STYLES}</style>
      <div className="menuegen-glyph text-5xl mb-6" style={{ color: '#C9A84C' }}>✦</div>
      <p key={lineIdx} className="menuegen-line text-[14px]" style={{ color: 'var(--text-muted)' }}>
        {LOADING_LINES[lineIdx]}
      </p>
    </div>
  );
}

function toMenuekarteDaten(menu: MenuResult): MenuekarteDaten {
  return {
    titel: menu.titel,
    dramaturgieBegruendung: menu.dramaturgie_begruendung,
    gaenge: menu.gaenge.map(g => ({
      nummer: g.nummer,
      titel: g.titel,
      beschreibung: g.beschreibung,
      hauptzutaten: g.hauptzutaten,
      geschmacksprofil: g.geschmacksprofil,
      zubereitungsidee: g.zubereitungsidee,
    })),
  };
}

function MenuCardResult({ menu, onReset, onSave, saveState, savedProjectId }: {
  menu: MenuResult; onReset: () => void;
  onSave: () => void; saveState: SaveState; savedProjectId: number | null;
}) {
  return (
    <div className="mx-auto" style={{ maxWidth: 680 }}>
      <Menuekarte data={toMenuekarteDaten(menu)} />

      <div className="flex justify-center gap-3 mt-6 flex-wrap">
        {saveState === 'saved' && savedProjectId ? (
          <Link href={`/projekte/${savedProjectId}`}
            className="flex items-center gap-2 px-6 py-3 rounded-xl text-[13px] font-semibold transition-all"
            style={{ background: 'rgba(90,154,88,0.1)', border: '1px solid rgba(90,154,88,0.3)', color: '#5A9A58' }}>
            <CheckCircle size={14} /> Gespeichert – Projekt ansehen
          </Link>
        ) : (
          <button onClick={onSave} type="button" disabled={saveState === 'saving'}
            className="flex items-center gap-2 px-6 py-3 rounded-xl text-[13px] font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ background: 'linear-gradient(135deg, #562E3C, #7D4558)', color: '#FFFFFF' }}>
            {saveState === 'saving' ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
            {saveState === 'saving' ? 'Wird gespeichert…' : 'Als Projekt speichern'}
          </button>
        )}
        <button onClick={onReset} type="button"
          className="flex items-center gap-2 px-6 py-3 rounded-xl text-[13px] font-semibold transition-all"
          style={{ background: 'rgba(107,58,75,0.08)', border: '1px solid rgba(107,58,75,0.25)', color: '#6B3A4B' }}>
          <RefreshCw size={14} /> Neues Menü komponieren
        </button>
      </div>
      {saveState === 'error' && (
        <p className="text-center text-[12px] mt-3" style={{ color: '#C05050' }}>Speichern fehlgeschlagen. Bitte erneut versuchen.</p>
      )}
    </div>
  );
}

function ErrorCard({ error, onBack, onRetry }: { error: ApiError; onBack: () => void; onRetry: () => void }) {
  let title = 'Etwas ist schiefgelaufen';
  let message = error.message || error.error || 'Bitte versuche es erneut.';
  let showUpgrade = false;

  if (error.status === 403) {
    title = 'Ab Basic verfügbar';
    message = 'Der Menügenerator ist ab der Basic-Stufe freigeschaltet.';
    showUpgrade = true;
  } else if (error.status === 422) {
    title = 'Keine passenden Zutaten';
    message = error.message || 'Für diese Saison-/Diät-Kombination wurden keine passenden Zutaten gefunden. Passe deine Auswahl an.';
  } else if (error.status === 429) {
    title = 'Kurz durchatmen';
    message = error.message || 'Zu viele Anfragen. Bitte kurz warten und erneut versuchen.';
  } else if (error.status === 400) {
    title = 'Angaben prüfen';
    message = error.error || error.message || 'Bitte die Eingaben prüfen.';
  }

  return (
    <div className="mx-auto text-center py-16" style={{ maxWidth: 440 }}>
      <div className="w-14 h-14 rounded-xl flex items-center justify-center mx-auto mb-5"
        style={{ background: 'rgba(107,58,75,0.08)', border: '1px solid rgba(107,58,75,0.2)' }}>
        <AlertCircle size={24} style={{ color: '#6B3A4B' }} strokeWidth={1.5} />
      </div>
      <h3 className="font-heading text-xl font-bold mb-2" style={{ color: 'var(--text)' }}>{title}</h3>
      <p className="text-[13px] mb-6" style={{ color: 'var(--text-muted)' }}>{message}</p>
      <div className="flex items-center justify-center gap-3">
        <button onClick={onBack} type="button" className="px-5 py-2.5 rounded-lg text-[12px] font-semibold"
          style={{ background: 'var(--card-hover)', border: '1px solid var(--border)', color: 'var(--text)' }}>
          Zurück
        </button>
        {showUpgrade ? (
          <Link href="/profil" className="px-5 py-2.5 rounded-lg text-[12px] font-semibold"
            style={{ background: 'rgba(107,58,75,0.1)', border: '1px solid rgba(107,58,75,0.25)', color: '#6B3A4B' }}>
            Zu den Einstellungen
          </Link>
        ) : (
          <button onClick={onRetry} type="button" className="px-5 py-2.5 rounded-lg text-[12px] font-semibold"
            style={{ background: 'rgba(107,58,75,0.1)', border: '1px solid rgba(107,58,75,0.25)', color: '#6B3A4B' }}>
            Erneut versuchen
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Hauptkomponente ────────────────────────────────────────────────────────

export default function MenuegeneratorPage() {
  const [stage, setStage] = useState<Stage>('dialog');
  const [step, setStep] = useState<1 | 2 | 3>(1);

  const [anlass, setAnlass] = useState('');
  const [gaenge, setGaenge] = useState(4);
  const [saison, setSaison] = useState(computeCurrentSeason());
  const [diaet, setDiaet] = useState<string[]>([]);

  const [alleZutaten, setAlleZutaten] = useState<Ingredient[]>([]);
  const [pflichtIds, setPflichtIds] = useState<number[]>([]);
  const [ausschlussIds, setAusschlussIds] = useState<number[]>([]);

  const [aufwand, setAufwand] = useState('');
  const [kuechenstil, setKuechenstil] = useState('keine_vorgabe');
  const [leitmotiv, setLeitmotiv] = useState('');

  const [menu, setMenu] = useState<MenuResult | null>(null);
  const [error, setError] = useState<ApiError | null>(null);
  const [saveState, setSaveState] = useState<SaveState>('idle');
  const [savedProjectId, setSavedProjectId] = useState<number | null>(null);

  useEffect(() => {
    fetch('/api/zutaten')
      .then(r => r.json())
      .then(d => setAlleZutaten(Array.isArray(d) ? d : []))
      .catch(() => {});
  }, []);

  const generate = async () => {
    setStage('loading');
    setError(null);
    setSaveState('idle');
    setSavedProjectId(null);
    try {
      const res = await fetch('/api/menuegenerator', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          anlass, gaenge, saison,
          diaet: diaet.length > 0 ? diaet : undefined,
          pflicht_zutaten: pflichtIds.length > 0 ? pflichtIds : undefined,
          ausschluss_zutaten: ausschlussIds.length > 0 ? ausschlussIds : undefined,
          aufwand: aufwand || undefined,
          kuechenstil: kuechenstil !== 'keine_vorgabe' ? kuechenstil : undefined,
          leitmotiv: leitmotiv.trim() || undefined,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError({ status: res.status, error: data.error, message: data.message });
        setStage('error');
        return;
      }
      setMenu(data);
      setStage('result');
    } catch {
      setError({ status: 0, message: 'Netzwerkfehler. Bitte versuche es erneut.' });
      setStage('error');
    }
  };

  const resetToDialog = () => { setStage('dialog'); setStep(3); };
  const newMenu = () => {
    setStage('dialog'); setStep(1); setMenu(null);
    setSaveState('idle'); setSavedProjectId(null);
  };

  const handleSave = async () => {
    if (!menu) return;
    setSaveState('saving');
    try {
      const res = await fetch('/api/projekte', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: menu.titel,
          description: '',
          color: '#C9A84C',
          status: 'Aktiv',
          recipeIds: [],
          notes: [],
          menus: [{
            id: crypto.randomUUID(),
            name: menu.titel,
            beschreibung: menu.dramaturgie_begruendung,
            gaenge: menu.gaenge.map(g => ({
              id: crypto.randomUUID(),
              bezeichnung: g.titel,
              rezeptId: null,
              weinId: null,
              weinName: null,
              beschreibung: g.beschreibung,
              hauptzutaten: g.hauptzutaten,
              geschmacksprofil: g.geschmacksprofil,
              zubereitungsidee: g.zubereitungsidee,
            })),
            createdAt: new Date().toISOString().slice(0, 10),
          }],
        }),
      });
      if (!res.ok) throw new Error('save failed');
      const data = await res.json();
      setSavedProjectId(data.id);
      setSaveState('saved');
    } catch {
      setSaveState('error');
    }
  };

  return (
    <PageTransition>
      <div style={{ background: 'var(--bg)', minHeight: '100vh' }}>
        <div className="px-4 sm:px-8 pt-6 sm:pt-8 pb-6" style={{ borderBottom: '1px solid var(--border)' }}>
          <div className="text-[10px] font-semibold tracking-[4px] uppercase mb-2" style={{ color: 'rgba(107,58,75,0.55)' }}>✦ &nbsp;Menüplanung</div>
          <h1 className="font-heading font-bold leading-none" style={{ fontSize: 28, color: 'var(--text)', letterSpacing: '2px', textTransform: 'uppercase' }}>
            Menügenerator
          </h1>
          <p className="mt-1.5" style={{ color: 'var(--text-muted)', fontSize: 13 }}>
            Ein Menü, komponiert aus echten Zutaten, Aromaprofilen und einem durchdachten Spannungsbogen.
          </p>
        </div>

        <div className="px-4 sm:px-8 py-8 sm:py-10" style={{ maxWidth: 720, margin: '0 auto' }}>
          <PageTransition key={stage === 'dialog' ? `dialog-${step}` : stage}>
            {stage === 'dialog' && (
              <div>
                <StepDots step={step} />

                {step === 1 && (
                  <div className="space-y-7">
                    <div>
                      <label className="block text-[12px] font-semibold mb-3 uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Anlass</label>
                      <div className="grid grid-cols-2 gap-3">
                        {ANLASS_OPTIONS.map(o => (
                          <OptionCard key={o.value} selected={anlass === o.value} onClick={() => setAnlass(o.value)}
                            label={o.label} desc={o.desc} Icon={o.Icon} />
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="block text-[12px] font-semibold mb-3 uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
                        Gängezahl: <span style={{ color: '#C9A84C' }}>{gaenge}</span>
                      </label>
                      <input type="range" min={3} max={9} value={gaenge} onChange={e => setGaenge(+e.target.value)}
                        className="w-full accent-gold h-1.5 rounded-full cursor-pointer" />
                      <div className="flex justify-between text-[10px] mt-1" style={{ color: 'var(--text-muted)' }}>
                        <span>3 Gänge</span><span>6 Gänge</span><span>9 Gänge</span>
                      </div>
                    </div>

                    <div>
                      <label className="block text-[12px] font-semibold mb-3 uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Saison</label>
                      <div className="grid grid-cols-4 gap-2">
                        {SEASON_OPTIONS.map(s => (
                          <button key={s.value} type="button" onClick={() => setSaison(s.value)}
                            className="px-2 py-2.5 rounded-lg text-[12px] font-semibold text-center transition-all"
                            style={{
                              background: saison === s.value ? `${s.color}18` : 'rgba(0,0,0,0.04)',
                              border: `1px solid ${saison === s.value ? s.color + '55' : 'var(--border)'}`,
                              color: saison === s.value ? s.color : 'var(--text-muted)',
                            }}>
                            {s.value}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="block text-[12px] font-semibold mb-3 uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Diät (optional)</label>
                      <div className="flex flex-wrap gap-2">
                        {DIAET_OPTIONS.map(d => {
                          const active = diaet.includes(d);
                          return (
                            <button key={d} type="button"
                              onClick={() => setDiaet(prev => active ? prev.filter(x => x !== d) : [...prev, d])}
                              className="px-3.5 py-2 rounded-full text-[12px] font-semibold transition-all"
                              style={{
                                background: active ? 'rgba(107,58,75,0.1)' : 'rgba(0,0,0,0.04)',
                                border: `1px solid ${active ? 'rgba(107,58,75,0.35)' : 'var(--border)'}`,
                                color: active ? '#6B3A4B' : 'var(--text-muted)',
                              }}>
                              {d}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}

                {step === 2 && (
                  <div className="space-y-9">
                    <ZutatenPicker label="Pflicht-Zutaten" hint="Muss dabei sein – wird garantiert verwendet, auch außerhalb der Saison."
                      tone="pflicht" allZutaten={alleZutaten} selectedIds={pflichtIds} otherIds={ausschlussIds}
                      onAdd={id => setPflichtIds(p => [...p, id])} onRemove={id => setPflichtIds(p => p.filter(x => x !== id))} />
                    <ZutatenPicker label="Ausschluss-Zutaten" hint="Bitte vermeiden – wird nicht ins Menü aufgenommen."
                      tone="ausschluss" allZutaten={alleZutaten} selectedIds={ausschlussIds} otherIds={pflichtIds}
                      onAdd={id => setAusschlussIds(p => [...p, id])} onRemove={id => setAusschlussIds(p => p.filter(x => x !== id))} />
                  </div>
                )}

                {step === 3 && (
                  <div className="space-y-7">
                    <div>
                      <label className="block text-[12px] font-semibold mb-3 uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Aufwand (optional)</label>
                      <div className="grid grid-cols-3 gap-3">
                        {AUFWAND_OPTIONS.map(o => (
                          <OptionCard key={o.value} selected={aufwand === o.value}
                            onClick={() => setAufwand(prev => prev === o.value ? '' : o.value)}
                            label={o.label} desc={o.desc} />
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="block text-[12px] font-semibold mb-3 uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Küchenstil</label>
                      <div className="grid grid-cols-2 gap-2.5">
                        {KUECHENSTIL_OPTIONS.map(o => (
                          <OptionCard key={o.value} selected={kuechenstil === o.value} onClick={() => setKuechenstil(o.value)} label={o.label} />
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="block text-[12px] font-semibold mb-2 uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Leitmotiv (optional)</label>
                      <input value={leitmotiv} onChange={e => setLeitmotiv(e.target.value)}
                        placeholder='z.B. "nose-to-tail", "japanisch-französisch"…'
                        className="w-full bg-card-hover border border-border-strong rounded-lg px-3.5 py-2.5 text-[13px] outline-none focus:border-gold/40"
                        style={{ color: 'var(--text)' }} />
                    </div>

                    <button onClick={generate} type="button" disabled={!anlass || !saison}
                      className="w-full py-3.5 rounded-xl font-semibold text-[14px] flex items-center justify-center gap-2 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                      style={{ background: 'linear-gradient(135deg, #562E3C, #7D4558)', color: '#FFFFFF' }}>
                      <Sparkles size={17} /> Menü komponieren
                    </button>
                  </div>
                )}

                <div className="flex justify-between mt-8">
                  <button type="button" onClick={() => setStep(s => (Math.max(1, s - 1) as 1 | 2 | 3))}
                    style={{
                      visibility: step === 1 ? 'hidden' : 'visible',
                      background: 'var(--card-hover)', border: '1px solid var(--border)', color: 'var(--text)',
                    }}
                    className="flex items-center gap-1.5 px-4 py-2.5 rounded-lg text-[12px] font-semibold">
                    <ChevronLeft size={14} /> Zurück
                  </button>
                  {step < 3 && (
                    <button type="button" onClick={() => setStep(s => (Math.min(3, s + 1) as 1 | 2 | 3))}
                      disabled={step === 1 && !anlass}
                      className="flex items-center gap-1.5 px-5 py-2.5 rounded-lg text-[12px] font-semibold disabled:opacity-40 disabled:cursor-not-allowed"
                      style={{ background: 'rgba(107,58,75,0.1)', border: '1px solid rgba(107,58,75,0.25)', color: '#6B3A4B' }}>
                      Weiter <ChevronRight size={14} />
                    </button>
                  )}
                </div>
              </div>
            )}

            {stage === 'loading' && <LoadingScene />}
            {stage === 'result' && menu && (
              <MenuCardResult menu={menu} onReset={newMenu} onSave={handleSave} saveState={saveState} savedProjectId={savedProjectId} />
            )}
            {stage === 'error' && error && <ErrorCard error={error} onBack={resetToDialog} onRetry={generate} />}
          </PageTransition>
        </div>
      </div>
    </PageTransition>
  );
}
