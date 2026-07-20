'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useStore } from '@/lib/store';
import { createClient } from '@/utils/supabase/client';
import { Loader2, Bookmark, Share2, Download, CheckCircle, Plus, Images, Sparkles } from 'lucide-react';
import ImageLightbox from '@/components/ui/ImageLightbox';
import { ADMIN_UNLIMITED_IMAGE_LIMIT } from '@/config/imageQuota';
import { AUFWANDSSTUFEN, type Aufwandsstufe } from '@/config/techniken';
import { STILRICHTUNGEN, STILRICHTUNG_LABEL, DEFAULT_STILRICHTUNG, type Stilrichtung } from '@/config/tellerStilrichtung';
import { ANRICHTE_FOKUSSE, DEFAULT_ANRICHTE_FOKUS, type AnrichteFokus } from '@/config/tellerAnrichteFokus';
import TellerControls from '@/components/tellerdesigner/TellerControls';
import TellerStage from '@/components/tellerdesigner/TellerStage';
import DesignInfoBox from '@/components/tellerdesigner/DesignInfoBox';
import type { RecipeDifficulty, TellerVariante } from '@/types';

const AUFWAND_AUS_SCHWIERIGKEIT: Record<RecipeDifficulty, Aufwandsstufe> = {
  Leicht: 'bistro', Mittel: 'gehoben', Schwer: 'fine_dining',
};

const MAX_VARIANTS = 5; // deckungsgleich mit der festen 5-Slot-Varianten-Leiste

type Quota = { used: number; limit: number; remaining: number };

function randomOf<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export default function TellerdesignerPage() {
  const { recipes, fetchRecipes } = useStore();
  const [loadingRecipes, setLoadingRecipes] = useState(true);
  const [mode, setMode] = useState<'rezept' | 'frei'>('rezept');
  const [selectedId, setSelectedId] = useState<number>(0);
  const [freieBeschreibung, setFreieBeschreibung] = useState('');
  const [aufwand, setAufwand] = useState<Aufwandsstufe>('gehoben');
  const [stilrichtung, setStilrichtung] = useState<Stilrichtung>(DEFAULT_STILRICHTUNG);
  const [anrichteFokus, setAnrichteFokus] = useState<AnrichteFokus>(DEFAULT_ANRICHTE_FOKUS);

  const [quota, setQuota] = useState<Quota | null>(null);
  const [loading, setLoading] = useState(false);
  const [variants, setVariants] = useState<TellerVariante[]>([]);
  const [currentVariantId, setCurrentVariantId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [shareMsg, setShareMsg] = useState<string | null>(null);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  // Nur fuer den Avatar oben rechts (Punkt 1) -- dieselbe Quelle wie Sidebar.tsx.
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [initials, setInitials] = useState('');

  useEffect(() => {
    const load = async () => {
      try { await fetchRecipes(); } catch {}
      setLoadingRecipes(false);
    };
    load();
    fetch('/api/tellerdesigner').then(r => r.json()).then(d => { if (d.quota) setQuota(d.quota); }).catch(() => {});

    createClient().then((supabase) => supabase.auth.getUser()).then(({ data }) => {
      const u = data.user;
      if (!u) return;
      fetch('/api/profil').then(r => r.json()).then(d => {
        setAvatarUrl(d.profile?.avatar_url ?? null);
        const name: string = d.profile?.full_name || u.email?.split('@')[0] || 'Chef';
        setInitials(name.split(' ').map((w: string) => w[0]).join('').toUpperCase().slice(0, 2));
      }).catch(() => {});
    }).catch((e) => console.warn('[Tellerdesigner] Auth-Check fehlgeschlagen:', e));
  }, []);

  useEffect(() => {
    if (recipes.length > 0 && !selectedId) {
      setSelectedId(recipes[0].id);
      setAufwand(AUFWAND_AUS_SCHWIERIGKEIT[recipes[0].difficulty] ?? 'gehoben');
    }
  }, [recipes]);

  // Nur ein Wechsel von Rezept oder Modus (Rezept<->Frei) macht die
  // bisherigen Varianten wirklich ungueltig -- die Labels/das Bild gehoeren
  // dann zu einem komplett anderen Gericht. Stilrichtung/Anrichte-Fokus
  // NICHT mit zuruecksetzen: genau das Sammeln mehrerer Stile fuer dasselbe
  // Rezept in den 5 Slots ist der Vergleichs-Anwendungsfall, den die
  // Varianten-Leiste eigentlich ermoeglichen soll.
  useEffect(() => {
    setVariants([]);
    setCurrentVariantId(null);
    setError(null);
  }, [selectedId, mode]);

  const selectedRecipe = recipes.find(r => r.id === selectedId);
  const currentVariant = variants.find(v => v.id === currentVariantId) ?? null;
  const isUnlimitedQuota = !!quota && quota.limit >= ADMIN_UNLIMITED_IMAGE_LIMIT;
  const quotaExhausted = !!quota && quota.remaining <= 0;
  const canGenerate = mode === 'rezept' ? !!selectedRecipe : freieBeschreibung.trim().length > 0;
  const variantSlotsLeft = variants.length < MAX_VARIANTS;

  const handleSelectedIdChange = (id: number) => {
    setSelectedId(id);
    const r = recipes.find(x => x.id === id);
    if (r) setAufwand(AUFWAND_AUS_SCHWIERIGKEIT[r.difficulty] ?? 'gehoben');
  };

  const runGenerate = async (params?: { aufwand: Aufwandsstufe; stilrichtung: Stilrichtung; anrichteFokus: AnrichteFokus }) => {
    if (!canGenerate || loading || !variantSlotsLeft) return;
    const gen = params ?? { aufwand, stilrichtung, anrichteFokus };
    setLoading(true);
    setError(null);

    const body = mode === 'rezept'
      ? {
          mode: 'rezept',
          rezeptTitel: selectedRecipe!.title,
          rezeptZutaten: selectedRecipe!.zutaten ?? [],
          rezeptKomponenten: selectedRecipe!.komponenten ?? [],
          aufwand: gen.aufwand,
          stilrichtung: gen.stilrichtung,
          anrichteFokus: gen.anrichteFokus,
        }
      : {
          mode: 'frei',
          freieBeschreibung,
          aufwand: gen.aufwand,
          stilrichtung: gen.stilrichtung,
          anrichteFokus: gen.anrichteFokus,
        };

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
      const variant: TellerVariante = {
        id: crypto.randomUUID(),
        image: d.image,
        techniken: d.techniken ?? [],
        titel: d.titel,
        aufwand: d.aufwand,
        stilrichtung: d.stilrichtung,
        anrichteFokus: d.anrichteFokus,
        toured: false,
      };
      setVariants(prev => [...prev, variant]);
      setCurrentVariantId(variant.id);
      if (d.quota) setQuota(d.quota);
    } catch {
      setError('Netzwerkfehler bei der Generierung.');
    } finally {
      setLoading(false);
    }
  };

  const handleRandom = () => {
    const rnd = {
      aufwand: randomOf(AUFWANDSSTUFEN),
      stilrichtung: randomOf(STILRICHTUNGEN),
      anrichteFokus: randomOf(ANRICHTE_FOKUSSE),
    };
    setAufwand(rnd.aufwand);
    setStilrichtung(rnd.stilrichtung);
    setAnrichteFokus(rnd.anrichteFokus);
    runGenerate(rnd);
  };

  const handleNeuesDesign = () => {
    setVariants([]);
    setCurrentVariantId(null);
    setError(null);
  };

  const handleTourComplete = () => {
    if (!currentVariantId) return;
    setVariants(prev => prev.map(v => v.id === currentVariantId ? { ...v, toured: true } : v));
  };

  const handleSave = async () => {
    if (!currentVariant || saving) return;
    setSaving(true);
    // Titel: im "frei"-Modus liefert die API bereits einen erfundenen
    // Gerichtnamen (variant.titel); im "rezept"-Modus gibt es keinen -- dort
    // faellt es auf den Rezepttitel zurueck (siehe Buehnen-Ueberschrift in
    // TellerStage, die aus demselben Grund nur im "frei"-Modus etwas anzeigt).
    const titel = currentVariant.titel || (mode === 'rezept' ? selectedRecipe?.title : undefined) || 'Anrichte-Design';
    try {
      const res = await fetch('/api/tellerdesigner/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          image: currentVariant.image,
          modus: mode,
          titel,
          rezeptId: mode === 'rezept' ? selectedId : null,
          stilrichtung: currentVariant.stilrichtung,
          aufwand: currentVariant.aufwand,
          anrichteFokus: currentVariant.anrichteFokus,
          zubereitungszeit: mode === 'rezept' ? selectedRecipe?.time ?? null : null,
          saison: mode === 'rezept' ? selectedRecipe?.season ?? null : null,
          techniken: currentVariant.techniken,
        }),
      });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(d.message || d.error || 'Speichern fehlgeschlagen.');
        return;
      }
      setVariants(prev => prev.map(v => v.id === currentVariant.id ? { ...v, savedUrl: d.url } : v));
    } catch {
      setError('Netzwerkfehler beim Speichern.');
    } finally {
      setSaving(false);
    }
  };

  const handleDownload = () => {
    if (!currentVariant) return;
    const a = document.createElement('a');
    a.href = currentVariant.image;
    a.download = `tellerdesign-${currentVariant.id}.png`;
    a.click();
  };

  const handleShare = async () => {
    if (!currentVariant?.savedUrl) {
      setShareMsg('Bitte zuerst speichern.');
      setTimeout(() => setShareMsg(null), 2000);
      return;
    }
    const url = currentVariant.savedUrl;
    if (navigator.share) {
      try { await navigator.share({ url, title: currentVariant.titel || 'Tellerdesign' }); return; } catch { /* Nutzer hat abgebrochen oder API nicht nutzbar -- Fallback unten */ }
    }
    try {
      await navigator.clipboard.writeText(url);
      setShareMsg('Link kopiert.');
    } catch {
      setShareMsg(url);
    }
    setTimeout(() => setShareMsg(null), 2500);
  };

  if (loadingRecipes) {
    return (
      <div style={{ background: 'var(--bg)', minHeight: '100vh' }} className="flex items-center justify-center">
        <Loader2 size={24} className="animate-spin" style={{ color: '#6B3A4B' }} />
      </div>
    );
  }

  return (
    <div style={{ background: 'var(--bg)' }} className="min-h-screen">
      {/* Header -- Sticky als Sicherheitsnetz, falls die Seite auf kleineren
          Viewports doch scrollen muss. Bewusst mit Untertitel und etwas mehr
          Luft statt maximal komprimiert: der Teller bleibt der Held, aber ein
          zu knapper Header wirkte gedraengt statt ruhig (Vision: "extrem viel
          Weissraum", "keine ueberladenen Karten"). Etwas Scrollen ist okay. */}
      <div className="sticky top-0 z-20 px-8 py-4 flex items-center justify-between"
        style={{ borderBottom: '1px solid var(--border)', background: 'var(--bg)' }}>
        <div>
          <h1 className="font-heading font-bold leading-none" style={{ fontSize: 20, color: 'var(--text)', letterSpacing: '1.5px', textTransform: 'uppercase' }}>Tellerdesigner</h1>
          <p className="mt-1.5" style={{ fontSize: 12.5, color: 'var(--text-muted)' }}>Foto-realistische Anrichte-Techniken für dein Gericht</p>
        </div>
        <div className="flex items-center gap-2.5 flex-shrink-0">
          <button onClick={handleNeuesDesign}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-[11.5px] font-semibold transition-colors"
            style={{ border: '1px solid var(--border)', color: 'var(--text)' }}>
            <Plus size={12} /> Neues Design
          </button>
          <Link href="/tellerdesigner/galerie"
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-[11.5px] font-semibold transition-colors"
            style={{ border: '1px solid var(--border)', color: 'var(--text)' }}>
            <Images size={12} /> Meine Designs
          </Link>
          <Link href="/profil" title="Profil" className="flex-shrink-0">
            {avatarUrl ? (
              <img src={avatarUrl} alt="" className="w-8 h-8 rounded-full object-cover" style={{ border: '1px solid var(--border)' }} />
            ) : (
              <div className="w-8 h-8 rounded-full flex items-center justify-center text-[10.5px] font-bold text-white"
                style={{ background: 'linear-gradient(135deg, #6B3A4B, #9A5468)' }}>
                {initials}
              </div>
            )}
          </Link>
        </div>
      </div>

      <div className="px-8 py-8 max-w-[1400px] mx-auto">
        <div className="flex gap-10 items-start">
          <TellerControls
            recipes={recipes}
            mode={mode} onModeChange={setMode}
            selectedId={selectedId} onSelectedIdChange={handleSelectedIdChange}
            freieBeschreibung={freieBeschreibung} onFreieBeschreibungChange={setFreieBeschreibung}
            aufwand={aufwand} onAufwandChange={setAufwand}
            stilrichtung={stilrichtung} onStilrichtungChange={setStilrichtung}
            anrichteFokus={anrichteFokus} onAnrichteFokusChange={setAnrichteFokus}
            canGenerate={canGenerate} loading={loading}
            quotaExhausted={quotaExhausted} slotsFull={!variantSlotsLeft} isUnlimitedQuota={isUnlimitedQuota} quota={quota}
            onGenerate={() => runGenerate()} onRandom={handleRandom}
          />

          <div className="flex-1 min-w-0">
            {/* Buehne + Aktionsleiste + Thumbnail-Leiste teilen sich EXAKT
                dieselbe fixe Breite + mx-auto -- haelt alles mittig
                zueinander ausgerichtet statt ueber getrennte Centering-
                Berechnungen im breiteren flex-1 zu geraten. */}
            <div className="mx-auto" style={{ maxWidth: 920 }}>
              {/* Speichern/Teilen/Herunterladen -- permanent sichtbar (Punkt 2),
                  sticky direkt unter dem Seiten-Header. Reserviert die Zeile
                  auch ohne aktuelle Variante (leer), damit die Buehne beim
                  ersten Generieren nicht nach oben springt. */}
              <div className="sticky z-10 flex justify-end gap-2 py-3" style={{ top: 78, background: 'var(--bg)' }}>
                {currentVariant && (<>
                  {currentVariant.savedUrl ? (
                    <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11.5px] font-semibold" style={{ color: '#7CB87A' }}>
                      <CheckCircle size={12} /> Gespeichert
                    </span>
                  ) : (
                    <button onClick={handleSave} disabled={saving}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11.5px] font-semibold transition-colors disabled:opacity-50"
                      style={{ border: '1px solid var(--border)', color: 'var(--text)' }}>
                      {saving ? <Loader2 size={12} className="animate-spin" /> : <Bookmark size={12} />} Speichern
                    </button>
                  )}
                  <button onClick={handleShare}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11.5px] font-semibold transition-colors"
                    style={{ border: '1px solid var(--border)', color: 'var(--text)' }}>
                    <Share2 size={12} /> Teilen
                  </button>
                  <button onClick={handleDownload}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11.5px] font-semibold transition-colors"
                    style={{ border: '1px solid var(--border)', color: 'var(--text)' }}>
                    <Download size={12} /> Herunterladen
                  </button>
                </>)}
              </div>

              {shareMsg && (
                <div className="text-right text-[12px] mb-1" style={{ color: '#6B3A4B' }}>{shareMsg}</div>
              )}

              {error && (
                <div className="mb-4 px-4 py-2.5 rounded-xl text-[13px] flex items-start gap-2"
                  style={{ background: 'rgba(192,80,80,0.08)', border: '1px solid rgba(192,80,80,0.25)', color: '#C05050' }}>
                  <span className="flex-shrink-0 mt-0.5">⚠</span><span>{error}</span>
                </div>
              )}

              {/* Der Teller ist der Held -- bekommt bewusst Luft ueber und
                  unter sich statt direkt an Aktionsleiste/Thumbnails zu
                  stossen (Vision: "Der Teller bekommt Platz zum Atmen"). */}
              <div className={`py-4 ${currentVariant && !loading ? 'cursor-zoom-in' : ''}`} onClick={() => currentVariant && !loading && setLightboxOpen(true)}>
                <TellerStage key={currentVariant?.id ?? 'empty'} loading={loading} variant={currentVariant} onTourComplete={handleTourComplete} />
              </div>

              {/* Varianten-Leiste + Design-Informationen in EINER Zeile statt
                  zwei gestapelten Bloecken. items-center statt items-end: die
                  Design-Informationen-Box ist hoeher als die Thumbnail-Leiste,
                  mit items-end richteten sich beide an ihrer UNTERKANTE aus --
                  die Box klebte dadurch am unteren Rand statt optisch zur
                  Thumbnail-Leiste ausbalanciert zu sein. */}
              <div className="flex items-center justify-between gap-6 mt-6">
                <div className="flex-1 flex justify-center">
                  <div className="inline-flex gap-2 p-2 bg-card border border-border rounded-xl">
                    {variants.map(v => (
                      <button key={v.id} onClick={() => setCurrentVariantId(v.id)}
                        title={STILRICHTUNG_LABEL[v.stilrichtung]}
                        className="group relative w-[58px] h-[58px] rounded-lg overflow-hidden flex-shrink-0 transition-all duration-300 hover:-translate-y-1"
                        style={{
                          border: v.id === currentVariantId ? '2px solid #6B3A4B' : '1px solid transparent',
                          boxShadow: v.id === currentVariantId ? '0 6px 16px rgba(107,58,75,0.22)' : '0 1px 3px rgba(0,0,0,0.08)',
                        }}>
                        <img src={v.image} alt="" className="w-full h-full object-cover" />
                        {/* Stil-Beschriftung nur bei Hover -- mehrere Varianten
                            desselben Rezepts in verschiedenen Stilen sollen
                            sich unterscheiden lassen, ohne die kleine
                            Thumbnail-Leiste dauerhaft mit Text zu ueberladen. */}
                        <span className="absolute inset-x-0 bottom-0 px-1 py-0.5 text-[6.5px] font-semibold uppercase tracking-wide leading-tight text-center text-white opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                          style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.78), transparent)' }}>
                          {STILRICHTUNG_LABEL[v.stilrichtung]}
                        </span>
                      </button>
                    ))}
                    {Array.from({ length: MAX_VARIANTS - variants.length }).map((_, i) => (
                      <button key={`empty-${i}`} onClick={() => runGenerate()} disabled={loading || !canGenerate}
                        title="Weitere Variante generieren (~4ct)"
                        className="w-[58px] h-[58px] rounded-lg flex-shrink-0 flex items-center justify-center transition-all duration-300 hover:-translate-y-1 disabled:opacity-40 disabled:hover:translate-y-0"
                        style={{ border: '1px dashed var(--border)' }}>
                        <Sparkles size={13} style={{ color: 'var(--text-muted)', opacity: 0.5 }} />
                      </button>
                    ))}
                  </div>
                </div>

                {currentVariant && (
                  <div className="w-[230px] flex-shrink-0">
                    <DesignInfoBox
                      stil={STILRICHTUNG_LABEL[currentVariant.stilrichtung]}
                      schwierigkeit={{ bistro: 'Einfach', gehoben: 'Mittel', fine_dining: 'Profi' }[currentVariant.aufwand]}
                      zubereitungszeit={mode === 'rezept' ? selectedRecipe?.time ?? null : null}
                      saison={mode === 'rezept' ? selectedRecipe?.season ?? null : null}
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <ImageLightbox
        images={variants.map(v => v.image)}
        index={lightboxOpen && currentVariant ? variants.findIndex(v => v.id === currentVariant.id) : null}
        onClose={() => setLightboxOpen(false)}
        onNavigate={i => setCurrentVariantId(variants[i]?.id ?? null)}
      />
    </div>
  );
}
