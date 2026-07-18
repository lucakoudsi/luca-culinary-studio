'use client';
import { useState, useEffect, useRef } from 'react';
import { useStore } from '@/lib/store';
import { Palette, Sparkles, Loader2, Download, CheckCircle, BookOpen, PenLine, BookMarked } from 'lucide-react';
import ImageLightbox from '@/components/ui/ImageLightbox';
import { ADMIN_UNLIMITED_IMAGE_LIMIT } from '@/config/imageQuota';

type Aufwandsstufe = 'bistro' | 'gehoben' | 'fine_dining';
const AUFWANDSSTUFEN: Aufwandsstufe[] = ['bistro', 'gehoben', 'fine_dining'];

const AUFWAND_LABEL: Record<Aufwandsstufe, string> = {
  bistro: 'Bistro',
  gehoben: 'Gehoben',
  fine_dining: 'Fine Dining',
};
const AUFWAND_KURZ: Record<Aufwandsstufe, string> = {
  bistro: 'Bodenständig, großzügig, einladend.',
  gehoben: 'Klar, ausgewogen, präzise.',
  fine_dining: 'Kunstvoll, minimalistisch, Sterneniveau.',
};
const AUFWAND_AUS_SCHWIERIGKEIT: Record<string, Aufwandsstufe> = {
  Leicht: 'bistro', Mittel: 'gehoben', Schwer: 'fine_dining',
};

const LOADING_MESSAGES = [
  'Komponiere die Anrichtung…',
  'Stimme den Stil ab…',
  'Male den Teller…',
  'Feinschliff an Sauce und Garnitur…',
];

type Quota = { used: number; limit: number; remaining: number };
type Result = { image: string; techniken: string[]; aufwand: Aufwandsstufe };

export default function TellerdesignerPage() {
  const { recipes, fetchRecipes } = useStore();
  const [loadingRecipes, setLoadingRecipes] = useState(true);
  const [mode, setMode] = useState<'rezept' | 'frei'>('rezept');
  const [selectedId, setSelectedId] = useState<number>(0);
  const [freieBeschreibung, setFreieBeschreibung] = useState('');
  const [aufwandFrei, setAufwandFrei] = useState<Aufwandsstufe>('gehoben');

  const [quota, setQuota] = useState<Quota | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingMsgIdx, setLoadingMsgIdx] = useState(0);
  const [result, setResult] = useState<Result | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [savedUrl, setSavedUrl] = useState<string | null>(null);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const loadingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const load = async () => {
      try { await fetchRecipes(); } catch {}
      setLoadingRecipes(false);
    };
    load();
    fetch('/api/tellerdesigner').then(r => r.json()).then(d => { if (d.quota) setQuota(d.quota); }).catch(() => {});
  }, []);

  useEffect(() => {
    if (recipes.length > 0 && !selectedId) setSelectedId(recipes[0].id);
  }, [recipes]);

  useEffect(() => {
    if (loading) {
      setLoadingMsgIdx(0);
      loadingIntervalRef.current = setInterval(() => {
        setLoadingMsgIdx(i => (i + 1) % LOADING_MESSAGES.length);
      }, 1400);
    } else if (loadingIntervalRef.current) {
      clearInterval(loadingIntervalRef.current);
    }
    return () => { if (loadingIntervalRef.current) clearInterval(loadingIntervalRef.current); };
  }, [loading]);

  const selectedRecipe = recipes.find(r => r.id === selectedId);
  const rezeptAufwand = selectedRecipe ? AUFWAND_AUS_SCHWIERIGKEIT[selectedRecipe.difficulty] ?? 'gehoben' : 'gehoben';

  const canGenerate = mode === 'rezept' ? !!selectedRecipe : freieBeschreibung.trim().length > 0;

  const handleGenerate = async () => {
    if (!canGenerate || loading) return;
    setLoading(true);
    setError(null);
    setResult(null);
    setSavedUrl(null);

    const body = mode === 'rezept'
      ? {
          mode: 'rezept',
          rezeptTitel: selectedRecipe!.title,
          rezeptZutaten: selectedRecipe!.zutaten ?? [],
          rezeptKomponenten: selectedRecipe!.komponenten ?? [],
          rezeptSchwierigkeit: selectedRecipe!.difficulty,
        }
      : { mode: 'frei', freieBeschreibung, aufwand: aufwandFrei };

    try {
      const res = await fetch('/api/tellerdesigner', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(d.message || d.error || 'Generierung fehlgeschlagen.');
        if (d.quota) setQuota(d.quota);
        return;
      }
      setResult({ image: d.image, techniken: d.techniken ?? [], aufwand: d.aufwand });
      if (d.quota) setQuota(d.quota);
    } catch {
      setError('Netzwerkfehler bei der Generierung.');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!result || saving) return;
    setSaving(true);
    try {
      const res = await fetch('/api/tellerdesigner/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: result.image }),
      });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(d.message || d.error || 'Speichern fehlgeschlagen.');
        return;
      }
      setSavedUrl(d.url);
    } catch {
      setError('Netzwerkfehler beim Speichern.');
    } finally {
      setSaving(false);
    }
  };

  if (loadingRecipes) {
    return (
      <div style={{ background: 'var(--bg)', minHeight: '100vh' }} className="flex items-center justify-center">
        <Loader2 size={24} className="animate-spin" style={{ color: '#6B3A4B' }} />
      </div>
    );
  }

  return (
    <div className="relative" style={{ background: 'var(--bg)', minHeight: '100vh', overflow: 'hidden' }}>
      {/* Dezentes Anrichte-Motiv im Hintergrund: Teller-Silhouette + Saucenschwung */}
      <svg className="absolute pointer-events-none" style={{ top: -60, right: -80, opacity: 0.05 }} width="640" height="640" viewBox="0 0 640 640" fill="none">
        <circle cx="320" cy="320" r="300" stroke="#6B3A4B" strokeWidth="2" />
        <circle cx="320" cy="320" r="220" stroke="#6B3A4B" strokeWidth="1.5" />
        <path d="M 160 380 Q 280 460 420 380 T 520 300" stroke="#C9A84C" strokeWidth="3" fill="none" strokeLinecap="round" />
      </svg>

      <div className="relative px-8 pt-8 pb-6" style={{ borderBottom: '1px solid var(--border)' }}>
        <div className="text-[10px] font-semibold tracking-[4px] uppercase mb-2" style={{ color: 'rgba(107,58,75,0.55)' }}>✦ &nbsp;Anrichte-Inspiration</div>
        <h1 className="font-heading font-bold leading-none" style={{ fontSize: 28, color: 'var(--text)', letterSpacing: '2px', textTransform: 'uppercase' }}>Tellerdesigner</h1>
        <p className="mt-1.5" style={{ color: 'var(--text-muted)', fontSize: 13 }}>Fotorealistisches Anrichte-Bild und konkrete Plattier-Techniken für dein Gericht</p>
      </div>

      <div className="relative p-8 max-w-[1100px] mx-auto">

        {recipes.length === 0 && mode === 'rezept' ? (
          <div className="text-center py-16 border border-dashed border-border rounded-xl mb-7">
            <BookOpen size={28} color="#6B3A4B" strokeWidth={1.5} className="mx-auto mb-3" />
            <p className="font-heading text-lg mb-1" style={{ color: 'var(--text)' }}>Noch keine Rezepte vorhanden</p>
            <p className="text-[13px] text-text-muted mb-4">Wähle „Frei beschreiben" oder lege zuerst ein Rezept an.</p>
          </div>
        ) : null}

        {/* Modus-Umschalter */}
        <div className="flex gap-2 mb-5">
          <button onClick={() => setMode('rezept')}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-[12px] font-semibold transition-all"
            style={{
              background: mode === 'rezept' ? 'rgba(107,58,75,0.1)' : 'transparent',
              color: mode === 'rezept' ? '#6B3A4B' : 'var(--text-muted)',
              border: `1px solid ${mode === 'rezept' ? 'rgba(107,58,75,0.25)' : 'transparent'}`,
            }}>
            <BookMarked size={13} /> Bestehendes Rezept
          </button>
          <button onClick={() => setMode('frei')}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-[12px] font-semibold transition-all"
            style={{
              background: mode === 'frei' ? 'rgba(107,58,75,0.1)' : 'transparent',
              color: mode === 'frei' ? '#6B3A4B' : 'var(--text-muted)',
              border: `1px solid ${mode === 'frei' ? 'rgba(107,58,75,0.25)' : 'transparent'}`,
            }}>
            <PenLine size={13} /> Frei beschreiben
          </button>
        </div>

        <div className="bg-card border border-border rounded-xl p-6 mb-7">
          {mode === 'rezept' ? (
            <>
              <label className="block text-[11px] text-text-muted font-semibold uppercase tracking-widest mb-2">Rezept auswählen</label>
              <select
                value={selectedId}
                onChange={e => { setSelectedId(Number(e.target.value)); setResult(null); }}
                disabled={recipes.length === 0}
                className="w-full bg-background border border-border-strong rounded-lg px-3.5 py-2.5 text-text-primary text-[13px] outline-none focus:border-gold/40 cursor-pointer mb-3">
                {recipes.map(r => <option key={r.id} value={r.id}>{r.title}</option>)}
              </select>
              {selectedRecipe && (
                <div className="flex items-center gap-2 text-[12px] text-text-secondary">
                  <span className="px-2.5 py-1 rounded-full font-semibold" style={{ background: 'rgba(201,168,76,0.12)', color: '#9B7A2A', border: '1px solid rgba(201,168,76,0.3)' }}>
                    {AUFWAND_LABEL[rezeptAufwand]}
                  </span>
                  <span className="text-text-muted">Anrichte-Stil aus Schwierigkeit „{selectedRecipe.difficulty}" abgeleitet — {AUFWAND_KURZ[rezeptAufwand]}</span>
                </div>
              )}
            </>
          ) : (
            <>
              <label className="block text-[11px] text-text-muted font-semibold uppercase tracking-widest mb-2">Gericht beschreiben</label>
              <textarea value={freieBeschreibung} onChange={e => { setFreieBeschreibung(e.target.value); setResult(null); }}
                placeholder="z.B. Geschmortes Rinderbäckchen mit Selleriepüree und Rotweinjus…" rows={4}
                className="w-full bg-background border border-border-strong rounded-lg px-3.5 py-2.5 text-text-primary text-[13px] outline-none focus:border-gold/40 resize-none leading-relaxed mb-4" />

              <label className="block text-[11px] text-text-muted font-semibold uppercase tracking-widest mb-2">Anrichte-Stil</label>
              <div className="flex flex-wrap gap-2">
                {AUFWANDSSTUFEN.map(a => (
                  <button key={a} onClick={() => { setAufwandFrei(a); setResult(null); }}
                    className="px-4 py-2.5 rounded-lg text-[12px] font-medium transition-all text-left"
                    style={{
                      background: aufwandFrei === a ? 'rgba(201,168,76,0.12)' : 'rgba(0,0,0,0.03)',
                      border: `1px solid ${aufwandFrei === a ? 'rgba(201,168,76,0.4)' : 'rgba(0,0,0,0.08)'}`,
                      color: aufwandFrei === a ? '#9B7A2A' : 'var(--text-muted)',
                    }}>
                    <div className="font-semibold">{AUFWAND_LABEL[a]}</div>
                    <div className="text-[10.5px] opacity-80 mt-0.5">{AUFWAND_KURZ[a]}</div>
                  </button>
                ))}
              </div>
            </>
          )}

          <div className="flex items-center justify-between mt-5 pt-4 border-t border-border">
            <span className="text-[12px] text-text-muted">
              {quota
                ? quota.limit >= ADMIN_UNLIMITED_IMAGE_LIMIT
                  ? 'Unbegrenztes Kontingent'
                  : `Noch ${quota.remaining} von ${quota.limit} Bildern diesen Monat`
                : ''}
            </span>
            <button onClick={handleGenerate} disabled={loading || !canGenerate || (quota !== null && quota.remaining <= 0)}
              className="px-6 py-2.5 rounded-lg font-semibold text-[14px] flex items-center gap-2 transition-all disabled:opacity-50 flex-shrink-0"
              style={{ background: 'linear-gradient(135deg, #562E3C, #7D4558)', color: '#FFFFFF' }}>
              {loading ? <><Loader2 size={16} className="animate-spin" /> Generiere…</> : <><Sparkles size={16} /> Generieren</>}
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-7 px-4 py-3 rounded-xl text-[13px] flex items-start gap-2"
            style={{ background: 'rgba(192,80,80,0.08)', border: '1px solid rgba(192,80,80,0.25)', color: '#C05050' }}>
            <span className="flex-shrink-0 mt-0.5">⚠</span><span>{error}</span>
          </div>
        )}

        {loading && (
          <div className="bg-card border border-border rounded-xl py-16 flex flex-col items-center justify-center gap-4 mb-7">
            <div className="relative w-16 h-16 flex items-center justify-center">
              <div className="absolute inset-0 rounded-full border animate-pulse" style={{ borderColor: 'rgba(201,168,76,0.3)' }} />
              <Palette size={26} style={{ color: '#C9A84C' }} strokeWidth={1.5} />
            </div>
            <p className="text-[13px] text-text-muted italic transition-opacity">{LOADING_MESSAGES[loadingMsgIdx]}</p>
          </div>
        )}

        {result && !loading && (
          <div className="grid grid-cols-[1.2fr_1fr] gap-6">
            <div className="bg-card border border-border rounded-xl overflow-hidden">
              <div className="relative cursor-zoom-in" onClick={() => setLightboxOpen(true)}>
                <img src={result.image} alt="Generierte Anrichtung" className="w-full block" />
              </div>
              <div className="p-4 flex items-center justify-between">
                <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold" style={{ background: 'rgba(201,168,76,0.12)', color: '#9B7A2A', border: '1px solid rgba(201,168,76,0.3)' }}>
                  {AUFWAND_LABEL[result.aufwand]}
                </span>
                {savedUrl ? (
                  <span className="flex items-center gap-1.5 text-[12px] font-semibold" style={{ color: '#7CB87A' }}>
                    <CheckCircle size={14} /> Gespeichert
                  </span>
                ) : (
                  <button onClick={handleSave} disabled={saving}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg text-[12px] font-semibold transition-all disabled:opacity-50"
                    style={{ background: 'rgba(107,58,75,0.08)', color: '#6B3A4B', border: '1px solid rgba(107,58,75,0.25)' }}>
                    {saving ? <Loader2 size={13} className="animate-spin" /> : <Download size={13} />} Bild speichern
                  </button>
                )}
              </div>
            </div>

            <div className="bg-card border border-border rounded-xl p-6">
              <h2 className="font-heading font-bold text-[16px] mb-1 flex items-center gap-2" style={{ color: 'var(--text)' }}>
                <Palette size={16} color="#6B3A4B" /> Anrichte-Muster
              </h2>
              <p className="text-[12px] text-text-muted mb-4 leading-relaxed">Konkrete Plattier-/Saucentechniken für dieses Gericht.</p>
              <div className="space-y-3">
                {result.techniken.map((t, i) => (
                  <div key={i} className="flex gap-3">
                    <div className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 text-[11px] font-bold mt-0.5"
                      style={{ background: 'rgba(107,58,75,0.1)', color: '#6B3A4B', border: '1px solid rgba(107,58,75,0.2)' }}>
                      {i + 1}
                    </div>
                    <p className="text-[12.5px] text-text-secondary leading-relaxed">{t}</p>
                  </div>
                ))}
                {result.techniken.length === 0 && (
                  <p className="text-[12.5px] text-text-muted italic">Keine Anrichte-Muster verfügbar.</p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      <ImageLightbox
        images={result ? [result.image] : []}
        index={lightboxOpen ? 0 : null}
        onClose={() => setLightboxOpen(false)}
        onNavigate={() => {}}
      />
    </div>
  );
}
