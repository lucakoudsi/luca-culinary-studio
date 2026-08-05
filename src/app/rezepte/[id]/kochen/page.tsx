'use client';
import { Suspense, useEffect, useMemo, useRef, useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import type { Recipe } from '@/types';
import { scaleMenge } from '@/lib/portionen';
import { useWakeLock } from '@/lib/useWakeLock';
import { ArrowLeft, ChevronLeft, ChevronRight, Plus, Minus, List, X, CheckCircle, Loader2 } from 'lucide-react';

const SWIPE_THRESHOLD_PX = 50;

// Kleinerer Stepper fuer die Kopfzeile hier -- eigene, kompaktere Variante
// statt der PortionenStepper aus rezepte/[id]/page.tsx zu importieren: die
// dortige ist auf den Karten-Kontext der Detailseite zugeschnitten (Seite
// exportiert sie ohnehin nicht), hier reicht ein kleineres Pendant.
function KochPortionenStepper({ portionen, setPortionen }: { portionen: number; setPortionen: (fn: (p: number) => number) => void }) {
  return (
    <div className="flex items-center gap-1.5">
      <button onClick={() => setPortionen(p => Math.max(1, p - 1))}
        className="w-7 h-7 rounded-full flex items-center justify-center transition-all hover:opacity-80"
        style={{ background: 'rgba(107,58,75,0.12)', color: 'var(--accent-recipes)', border: '1px solid rgba(107,58,75,0.25)' }}>
        <Minus size={13} />
      </button>
      <span className="text-[15px] font-bold w-6 text-center tabular-nums" style={{ color: 'var(--accent-recipes)' }}>
        {portionen}
      </span>
      <button onClick={() => setPortionen(p => Math.min(100, p + 1))}
        className="w-7 h-7 rounded-full flex items-center justify-center transition-all hover:opacity-80"
        style={{ background: 'rgba(107,58,75,0.12)', color: 'var(--accent-recipes)', border: '1px solid rgba(107,58,75,0.25)' }}>
        <Plus size={13} />
      </button>
    </div>
  );
}

// useSearchParams() braucht laut Next.js einen Suspense-Rand (gleiches
// Muster wie saison/page.tsx) -- ohne Wrapper meckert der Build.
export default function KochmodusPage() {
  return (
    <Suspense fallback={null}>
      <KochmodusPageInner />
    </Suspense>
  );
}

function KochmodusPageInner() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  // Gleiches Muster wie rezepte/[id]/page.tsx -- eigener Fetch per ID statt
  // ueber den Store, damit die Seite auch bei Direktaufruf/Reload
  // funktioniert.
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setNotFound(false);
    fetch(`/api/rezepte/${id}`)
      .then(async res => {
        if (cancelled) return;
        if (!res.ok) { setNotFound(true); setLoading(false); return; }
        const data: Recipe = await res.json();
        setRecipe(data);
        setLoading(false);
      })
      .catch(() => { if (!cancelled) { setNotFound(true); setLoading(false); } });
    return () => { cancelled = true; };
  }, [id]);

  // Uebernimmt die auf der Detailseite eingestellte Portionenzahl nur als
  // STARTWERT (per Query-Param) -- danach eigenstaendig verstellbar (siehe
  // KochPortionenStepper). Genau der Fall "am Herd merkt man, dass es doch
  // mehr sein sollen", ohne zurueck zur Detailseite wechseln zu muessen.
  // Der veraenderte Wert wird bewusst NICHT zurueckgemeldet, verfaellt beim
  // Verlassen.
  const [portionen, setPortionen] = useState(4);
  useEffect(() => {
    if (!recipe) return;
    const fromQuery = Number(searchParams.get('portionen'));
    setPortionen(Number.isFinite(fromQuery) && fromQuery > 0 ? fromQuery : (recipe.portionen || 4));
    // eslint-disable-next-line react-hooks/exhaustive-deps -- nur beim Laden des Rezepts initialisieren, searchParams danach ignorieren (sonst ueberschreibt jede Neu-Auswertung die eigene Verstellung)
  }, [recipe?.id]);

  const [stepIndex, setStepIndex] = useState(0);
  useEffect(() => { setStepIndex(0); }, [recipe?.id]);

  const [showZutaten, setShowZutaten] = useState(false);

  useWakeLock();

  const schritte = useMemo(() => recipe?.schritte ?? [], [recipe]);
  const lastIndex = schritte.length - 1;
  const isLastStep = stepIndex >= lastIndex;

  const factor = recipe && recipe.portionen > 0 ? portionen / recipe.portionen : 1;
  const scaledZutaten = useMemo(() => (recipe?.zutaten ?? []).map(z => ({ ...z, menge: scaleMenge(z.menge, factor) })), [recipe, factor]);
  const scaledKomponenten = useMemo(() => (recipe?.komponenten ?? []).map(k => ({
    ...k,
    zutaten: k.zutaten.map(z => ({ ...z, menge: scaleMenge(z.menge, factor) })),
  })), [recipe, factor]);

  const goPrev = () => setStepIndex(i => Math.max(0, i - 1));
  // Auf dem letzten Schritt fuehrt "Weiter" nicht ins Leere -- wird zu
  // "Fertig" und geht zurueck zum Rezept (siehe Knopf-Beschriftung unten).
  const goNext = () => {
    if (isLastStep) { router.push(`/rezepte/${id}`); return; }
    setStepIndex(i => Math.min(lastIndex, i + 1));
  };

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') goPrev();
      if (e.key === 'ArrowRight') goNext();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- goPrev/goNext lesen stepIndex/isLastStep frisch bei jedem Tastendruck, kein Re-Binding noetig
  }, [stepIndex, isLastStep]);

  const touchStartX = useRef<number | null>(null);
  const handleTouchStart = (e: React.TouchEvent) => { touchStartX.current = e.touches[0].clientX; };
  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const delta = e.changedTouches[0].clientX - touchStartX.current;
    touchStartX.current = null;
    if (delta <= -SWIPE_THRESHOLD_PX) goNext();
    else if (delta >= SWIPE_THRESHOLD_PX) goPrev();
  };

  if (loading) {
    return (
      <div style={{ background: 'var(--bg)', minHeight: '100dvh' }} className="flex items-center justify-center">
        <Loader2 size={24} className="animate-spin" style={{ color: 'var(--accent-recipes)' }} />
      </div>
    );
  }

  if (notFound || !recipe) {
    return (
      <div style={{ background: 'var(--bg)', minHeight: '100dvh' }} className="flex flex-col items-center justify-center gap-4">
        <p className="font-heading text-xl" style={{ color: 'var(--text)' }}>Rezept nicht gefunden</p>
        <Link href="/rezepte" className="px-5 py-2.5 rounded-xl text-[13px] font-semibold"
          style={{ background: 'rgba(107,58,75,0.08)', color: 'var(--accent-recipes)', border: '1px solid rgba(107,58,75,0.25)' }}>
          ← Zurück zur Übersicht
        </Link>
      </div>
    );
  }

  const hasZutaten = scaledZutaten.length > 0 || scaledKomponenten.length > 0;

  return (
    // 100dvh statt 100vh -- auf dem Handy soll die Vollbild-Buehne nicht
    // hinter der mobilen Adressleiste verschwinden/springen (dynamische
    // Viewport-Hoehe beruecksichtigt deren Ein-/Ausblenden).
    <div style={{ background: 'var(--bg)', minHeight: '100dvh' }} className="flex flex-col">
      {/* Kopfzeile -- Rueckweg, Titel, Portionen, Zutaten-Umschalter. Bewusst
       * ohne AppShell-Chrome (siehe AppShell.tsx-Ausschluss), diese Zeile
       * ist die einzige Navigation. */}
      <div className="flex items-center justify-between gap-3 px-4 py-3 flex-wrap" style={{ borderBottom: '1px solid var(--border)' }}>
        <Link href={`/rezepte/${id}`} className="flex items-center gap-2 text-[12px] font-medium flex-shrink-0" style={{ color: 'var(--text-muted)' }}>
          <ArrowLeft size={16} /> Zum Rezept
        </Link>
        <h1 className="font-heading text-[14px] font-bold text-center flex-1 min-w-0 truncate" style={{ color: 'var(--text)' }}>
          {recipe.title}
        </h1>
        <div className="flex items-center gap-2 flex-shrink-0">
          <KochPortionenStepper portionen={portionen} setPortionen={setPortionen} />
          {hasZutaten && (
            <button onClick={() => setShowZutaten(v => !v)}
              className="w-8 h-8 rounded-full flex items-center justify-center transition-all"
              style={{
                background: showZutaten ? 'var(--accent-recipes)' : 'rgba(107,58,75,0.12)',
                color: showZutaten ? '#fff' : 'var(--accent-recipes)',
                border: '1px solid rgba(107,58,75,0.25)',
              }}
              aria-label="Zutaten anzeigen">
              <List size={15} />
            </button>
          )}
        </div>
      </div>

      {/* Schritt-Bereich */}
      {schritte.length === 0 ? (
        <div className="flex-1 flex items-center justify-center p-8 text-center">
          <p className="text-[15px]" style={{ color: 'var(--text-muted)' }}>Dieses Rezept hat keine Zubereitungsschritte.</p>
        </div>
      ) : (
        <>
          <div className="text-center pt-4 text-[12px] font-semibold uppercase tracking-widest" style={{ color: 'var(--accent-recipes)' }}>
            Schritt {stepIndex + 1} von {schritte.length}
          </div>

          <div className="flex-1 flex items-center justify-center px-6 py-8 sm:px-16 select-none"
            onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}>
            <p className="text-center font-heading" style={{ color: 'var(--text)', fontSize: 'clamp(22px, 4.5vw, 34px)', lineHeight: 1.5, maxWidth: 720 }}>
              {schritte[stepIndex]}
            </p>
          </div>

          <div className="flex items-center gap-3 px-4 pb-6 pt-2 max-w-xl mx-auto w-full">
            <button onClick={goPrev} disabled={stepIndex === 0}
              className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-xl text-[14px] font-semibold transition-all disabled:opacity-30"
              style={{ background: 'rgba(107,58,75,0.08)', color: 'var(--accent-recipes)', border: '1px solid rgba(107,58,75,0.2)' }}>
              <ChevronLeft size={18} /> Zurück
            </button>
            <button onClick={goNext}
              className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-xl text-[14px] font-semibold text-white transition-all hover:opacity-90"
              style={{ background: 'linear-gradient(135deg, #562E3C, #7D4558)' }}>
              {isLastStep ? (<><CheckCircle size={18} /> Fertig</>) : (<>Weiter <ChevronRight size={18} /></>)}
            </button>
          </div>
        </>
      )}

      {/* Zutaten-Panel als Bottom-Sheet auf Wunsch -- nicht permanent
       * gedockt, der Vollbild-Fokus auf den Schritt soll dadurch nicht
       * dauerhaft verkleinert werden. */}
      {showZutaten && (
        <div className="fixed inset-0 z-50 flex items-end justify-center" style={{ background: 'rgba(0,0,0,0.4)' }} onClick={() => setShowZutaten(false)}>
          <div className="w-full max-w-xl max-h-[70vh] overflow-y-auto rounded-t-2xl p-5"
            style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderBottom: 'none' }}
            onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-heading text-[15px] font-bold" style={{ color: 'var(--text)' }}>
                Zutaten · {portionen} {portionen === 1 ? 'Portion' : 'Portionen'}
              </h2>
              <button onClick={() => setShowZutaten(false)} style={{ color: 'var(--text-muted)' }}><X size={18} /></button>
            </div>

            {scaledZutaten.length > 0 && (
              <div className="mb-4 divide-y divide-border border border-border rounded-xl overflow-hidden">
                {scaledZutaten.map((z, i) => (
                  <div key={i} className="flex justify-between px-3 py-2 text-[14px]" style={{ background: 'var(--card)' }}>
                    <span style={{ color: 'var(--text)' }}>{z.name}</span>
                    <span style={{ color: 'var(--text-muted)' }}>{z.menge}</span>
                  </div>
                ))}
              </div>
            )}

            {scaledKomponenten.map((k, i) => (
              <div key={i} className="mb-4">
                <div className="font-semibold text-[13px] mb-1.5" style={{ color: 'var(--text)' }}>{k.name}</div>
                <div className="divide-y divide-border border border-border rounded-xl overflow-hidden">
                  {k.zutaten.map((z, j) => (
                    <div key={j} className="flex justify-between px-3 py-2 text-[13px]" style={{ background: 'var(--card)' }}>
                      <span style={{ color: 'var(--text)' }}>{z.name}</span>
                      <span style={{ color: 'var(--text-muted)' }}>{z.menge}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
