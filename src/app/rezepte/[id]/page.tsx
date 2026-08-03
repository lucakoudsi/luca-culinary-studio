'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useStore } from '@/lib/store';
import type { Recipe, Project } from '@/types';
import {
  ArrowLeft, BookOpen, Eye, Trash2, Tag, Wine, ChefHat, Loader2, Grape,
  FolderOpen, Plus, Minus, RotateCcw, Search, Flame, Printer, Utensils,
  Pencil, X,
} from 'lucide-react';
import { matchWeine } from '@/lib/weinPairing';
import type { Wein, WeinMatch, FoodProfile } from '@/lib/weinPairing';
import { computeRecipeFlavorProfile } from '@/lib/recipeFlavorUtils';
import { scaleMenge } from '@/lib/portionen';
import { StarRating } from '@/components/ui/StarRating';
import { diffColor, statusColor, TYP_COLOR, TYP_LABELS } from '@/components/recipes/RecipeDetailModal';

const labelCls = "block text-[11px] text-[#A89880] font-semibold mb-1.5 uppercase tracking-wider";

// ─── Projekt-Auswahl (Mehrfachzuordnung) ──────────────────────────────────────
// Duplikat von ProjectPickerModal in RecipeDetailModal.tsx -- das Overlay wird
// in dieser Etappe bewusst nicht angefasst (siehe Etappen-Plan), daher hier
// noch keine gemeinsame Extraktion. Bei Etappe 3 (Overlay auf Schnellblick
// reduzieren) sollte das zusammengelegt werden, sobald beide Stellen ohnehin
// angefasst werden.
function ProjectPickerModal({ projects, recipeId, onClose, onToggle }: {
  projects: Project[]; recipeId: number; onClose: () => void; onToggle: (projectId: number, add: boolean) => void;
}) {
  const [search, setSearch] = useState('');
  const filtered = projects.filter(p => p.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="fixed inset-0 z-[60] bg-black/75 backdrop-blur-sm flex items-center justify-center p-6" onClick={onClose}>
      <div className="bg-surface border border-border-strong rounded-2xl w-full max-w-md max-h-[70vh] flex flex-col" onClick={e => e.stopPropagation()}>
        <div className="px-6 py-5 border-b border-border flex items-center justify-between flex-shrink-0">
          <h3 className="font-heading text-[17px] font-bold text-text-primary">Zu Projekt hinzufügen</h3>
          <button onClick={onClose} className="text-text-secondary hover:text-text-primary"><X size={18} /></button>
        </div>
        <div className="px-6 pt-3 flex-shrink-0">
          <div className="relative">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Projekte durchsuchen…" autoFocus
              className="w-full bg-card border border-border-strong rounded-lg pl-8 pr-3 py-2 text-text-primary text-[13px] outline-none focus:border-gold/40" />
          </div>
        </div>
        <div className="px-6 py-3 overflow-y-auto flex-1 space-y-1">
          {filtered.length === 0 ? (
            <p className="text-center text-[13px] text-text-muted py-6">
              {projects.length === 0 ? 'Noch keine Projekte vorhanden.' : 'Keine Treffer.'}
            </p>
          ) : filtered.map(p => {
            const inProject = p.recipeIds.includes(recipeId);
            return (
              <label key={p.id}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer hover:bg-card-hover transition-colors"
                style={{ background: inProject ? 'rgba(107,58,75,0.08)' : 'transparent' }}>
                <input type="checkbox" checked={inProject} onChange={() => onToggle(p.id, !inProject)} className="accent-[#6B3A4B]" />
                <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: p.color }} />
                <span className="text-[13px] text-text-primary font-medium truncate">{p.name}</span>
              </label>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─── Deaktivierter Aktionsknopf (Kochmodus/PDF -- Funktion folgt in Etappe 4/5) ─
function DisabledActionButton({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <button type="button" disabled title="Bald verfügbar"
      className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-[13px] font-semibold opacity-40 cursor-not-allowed"
      style={{ background: 'rgba(107,58,75,0.08)', color: '#6B3A4B', border: '1px solid rgba(107,58,75,0.2)' }}>
      {icon} {label}
    </button>
  );
}

// ─── Portionen +/- Stepper -- gemeinsamer Kern fuer die volle Box (ab 900px,
// Teil des oberen Blocks) und die schmale sticky Leiste (unter 900px), damit
// beide Darstellungen garantiert denselben Zustand/dieselbe Logik nutzen. ──
function PortionenStepper({ portionen, setPortionen }: { portionen: number; setPortionen: (fn: (p: number) => number) => void }) {
  return (
    <div className="flex items-center gap-2">
      <button onClick={() => setPortionen(p => Math.max(1, p - 1))}
        className="w-6 h-6 rounded-full flex items-center justify-center transition-all hover:opacity-80"
        style={{ background: 'rgba(107,58,75,0.12)', color: '#6B3A4B', border: '1px solid rgba(107,58,75,0.25)' }}>
        <Minus size={12} />
      </button>
      <span className="text-[15px] font-bold w-6 text-center tabular-nums" style={{ color: '#6B3A4B' }}>
        {portionen}
      </span>
      <button onClick={() => setPortionen(p => Math.min(100, p + 1))}
        className="w-6 h-6 rounded-full flex items-center justify-center transition-all hover:opacity-80"
        style={{ background: 'rgba(107,58,75,0.12)', color: '#6B3A4B', border: '1px solid rgba(107,58,75,0.25)' }}>
        <Plus size={12} />
      </button>
    </div>
  );
}

export default function RezeptDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { ingredients, fetchIngredients, projects, fetchProjects, addRecipeToProject, removeRecipeFromProject, updateRecipe, deleteRecipe } = useStore();

  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  // Bewusst NICHT ueber den Store (der laedt ALLE Rezepte) -- direkter Fetch
  // per ID, damit die Seite auch bei einem Direktaufruf (Reload, geteilter
  // Link) ohne vorher gefuellten Store funktioniert. Auth/Owner-Filter
  // passiert serverseitig in GET /api/rezepte/[id] (getRequestUser +
  // .eq('user_id', user.id)), 404 bei fremder/nicht existenter ID.
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

  useEffect(() => { if (ingredients.length === 0) fetchIngredients(); }, []);
  useEffect(() => { if (projects.length === 0) fetchProjects(); }, []);

  const [showProjectPicker, setShowProjectPicker] = useState(false);

  const [pairingLoading, setPairingLoading] = useState(false);
  const [pairingResults, setPairingResults] = useState<WeinMatch[]>([]);
  const [pairingError, setPairingError] = useState('');
  const [pairingDone, setPairingDone] = useState(false);

  const [ratingValue, setRatingValue] = useState(0);
  const [ratingError, setRatingError] = useState('');
  useEffect(() => { if (recipe) setRatingValue(recipe.rating); }, [recipe?.id]);

  const [portionen, setPortionen] = useState(4);
  useEffect(() => { if (recipe) setPortionen(recipe.portionen || 4); }, [recipe?.id]);

  if (loading) {
    return (
      <div style={{ background: 'var(--bg)', minHeight: '100vh' }} className="flex items-center justify-center">
        <Loader2 size={24} className="animate-spin" style={{ color: '#6B3A4B' }} />
      </div>
    );
  }

  if (notFound || !recipe) {
    return (
      <div style={{ background: 'var(--bg)', minHeight: '100vh' }} className="flex items-center justify-center">
        <div className="text-center">
          <p className="font-heading text-xl mb-4" style={{ color: 'var(--text)' }}>Rezept nicht gefunden</p>
          <button onClick={() => router.push('/rezepte')}
            className="px-5 py-2.5 rounded-xl text-[13px] font-semibold"
            style={{ background: 'rgba(107,58,75,0.08)', color: '#6B3A4B', border: '1px solid rgba(107,58,75,0.25)' }}>
            ← Zurück zur Übersicht
          </button>
        </div>
      </div>
    );
  }

  const basisPortionen = recipe.portionen || 4;
  const factor = portionen / basisPortionen;
  const isScaled = factor !== 1;

  const recipeProjects = projects.filter(p => p.recipeIds.includes(recipe.id));
  const hasIngredients = (recipe.zutaten ?? []).length > 0 || (recipe.komponenten ?? []).some(k => k.zutaten.length > 0);
  const scaledZutaten = (recipe.zutaten ?? []).map(z => ({ ...z, menge: scaleMenge(z.menge, factor) }));
  const scaledKomponenten = (recipe.komponenten ?? []).map(k => ({
    ...k,
    zutaten: k.zutaten.map(z => ({ ...z, menge: scaleMenge(z.menge, factor) })),
  }));

  const handleRatingChange = async (v: number) => {
    const previous = ratingValue;
    setRatingValue(v);
    setRatingError('');
    try {
      await updateRecipe(recipe.id, { rating: v });
    } catch (err) {
      setRatingValue(previous);
      setRatingError(err instanceof Error ? err.message : 'Bewertung konnte nicht gespeichert werden');
    }
  };

  const handleDelete = async () => {
    if (!confirm(`"${recipe.title}" wirklich löschen?`)) return;
    await deleteRecipe(recipe.id);
    router.push('/rezepte');
  };

  const runPairing = async (profile: FoodProfile) => {
    setPairingLoading(true);
    setPairingError('');
    setPairingResults([]);
    try {
      const res = await fetch('/api/weine');
      if (!res.ok) throw new Error('Weine konnten nicht geladen werden.');
      const wines: Wein[] = await res.json();
      if (wines.length === 0) {
        setPairingError('Keine Weine in der Datenbank — bitte Seed ausführen.');
        return;
      }
      setPairingResults(matchWeine(profile, wines).slice(0, 3));
      setPairingDone(true);
    } catch (e) {
      setPairingError(e instanceof Error ? e.message : 'Fehler beim Laden der Weine.');
    } finally {
      setPairingLoading(false);
    }
  };

  const handlePairingFromProfile = () => runPairing(recipe.geschmack as FoodProfile);
  const handlePairingFromZutaten = () => {
    const { profile, matched } = computeRecipeFlavorProfile(recipe.zutaten ?? [], recipe.komponenten ?? [], ingredients);
    if (matched.length === 0) {
      setPairingError('Keine Zutaten aus der Bibliothek erkannt — Profil kann nicht berechnet werden.');
      return;
    }
    runPairing(profile as FoodProfile);
  };

  return (
    <div style={{ background: 'var(--bg)', minHeight: '100vh' }}>
      {/* Header */}
      <div className="px-8 pt-8 pb-6" style={{ borderBottom: '1px solid var(--border)' }}>
        <button onClick={() => router.push('/rezepte')}
          className="flex items-center gap-2 mb-4 text-[12px] font-medium transition-colors"
          style={{ color: 'var(--text-muted)' }}>
          <ArrowLeft size={14} /> Zurück zur Übersicht
        </button>
        <div className="text-[10px] font-semibold tracking-[4px] uppercase" style={{ color: 'rgba(107,58,75,0.55)' }}>
          ✦ &nbsp;{recipe.category}
        </div>
      </div>

      {/* Schmale sticky Portionsleiste -- nur unter 900px, ersetzt dort die
       * volle Box im oberen Block (die ab 900px erscheint). Bleibt beim
       * Scrollen durch Zutaten/Zubereitung sichtbar. top-[52px] haelt sie
       * unterhalb der eigenen sticky Mobil-Topbar der AppShell
       * (AppShell.tsx: "sticky top-0 z-30", ca. 52px hoch) -- sonst
       * ueberlappen sich beide sticky Leisten. */}
      {hasIngredients && (
        <div className="min-[900px]:hidden sticky top-[52px] z-20 px-4 py-2 flex items-center justify-between"
          style={{ background: 'var(--surface)', borderBottom: '1px solid var(--border)' }}>
          <div className="flex items-center gap-2.5">
            <span className="text-[11px] font-semibold uppercase tracking-widest" style={{ color: '#6B3A4B' }}>
              Portionen
            </span>
            <PortionenStepper portionen={portionen} setPortionen={setPortionen} />
          </div>
          {isScaled && (
            <button onClick={() => setPortionen(basisPortionen)}
              className="flex items-center gap-1 text-[10px] font-medium" style={{ color: 'rgba(107,58,75,0.6)' }}>
              <RotateCcw size={10} /> zurücksetzen
            </button>
          )}
        </div>
      )}

      <div className="px-8 py-8 max-w-[1400px] mx-auto">
        {/* ── Oberer Block: ohne Scrollen sichtbar, zweispaltig ──────────────── */}
        <div className="flex flex-col min-[900px]:flex-row gap-8 mb-10">
          <div className="min-[900px]:w-[380px] flex-shrink-0">
            <div className="rounded-2xl overflow-hidden relative aspect-square"
              style={recipe.image
                ? { backgroundImage: `url(${recipe.image})`, backgroundSize: 'cover', backgroundPosition: 'center' }
                : { background: 'linear-gradient(135deg, #1a1500 0%, #0d0d0d 100%)' }}>
              {!recipe.image && <BookOpen size={48} className="absolute inset-0 m-auto opacity-25" strokeWidth={1} color="#C9A84C" />}
              <span className="absolute top-3 left-3 text-[11px] px-2.5 py-1 rounded-full font-semibold backdrop-blur-sm"
                style={{ color: statusColor[recipe.status], background: `${statusColor[recipe.status]}22`, border: `1px solid ${statusColor[recipe.status]}50` }}>
                {recipe.status}
              </span>
            </div>
          </div>

          <div className="flex-1 min-w-0">
            <h1 className="font-heading font-bold text-[28px] leading-tight mb-3" style={{ color: 'var(--text)' }}>
              {recipe.title}
            </h1>
            {recipe.description && (
              <p className="text-[14px] text-text-secondary leading-relaxed mb-5">{recipe.description}</p>
            )}

            <div className="grid grid-cols-3 gap-3 mb-6 max-w-md">
              {[
                { label: 'Schwierigkeit', value: recipe.difficulty, color: diffColor[recipe.difficulty] },
                { label: 'Zeit', value: `${recipe.time} Min` },
                { label: 'Saison', value: recipe.season },
              ].map(item => (
                <div key={item.label} className="bg-card rounded-lg p-3 text-center border border-border">
                  <div className="text-[10px] text-text-muted mb-1 uppercase tracking-wider">{item.label}</div>
                  <div className="text-[14px] font-semibold" style={{ color: item.color || 'var(--text)' }}>{item.value}</div>
                </div>
              ))}
            </div>

            {/* Volle Portionen-Box -- nur ab 900px Teil des oberen Blocks;
             * darunter uebernimmt die schmale sticky Leiste weiter unten
             * (gleicher Zustand, gleicher PortionenStepper). */}
            {hasIngredients && (
              <div className="hidden min-[900px]:flex mb-6 items-center justify-between rounded-xl px-4 py-3 max-w-md"
                style={{ background: 'rgba(107,58,75,0.04)', border: '1px solid rgba(107,58,75,0.15)' }}>
                <div className="flex items-center gap-3">
                  <span className="text-[12px] font-semibold uppercase tracking-widest" style={{ color: '#6B3A4B' }}>
                    Portionen
                  </span>
                  <PortionenStepper portionen={portionen} setPortionen={setPortionen} />
                </div>
                {isScaled && (
                  <button onClick={() => setPortionen(basisPortionen)}
                    className="flex items-center gap-1.5 text-[11px] font-medium transition-colors"
                    style={{ color: 'rgba(107,58,75,0.6)' }}
                    onMouseEnter={e => (e.currentTarget.style.color = '#6B3A4B')}
                    onMouseLeave={e => (e.currentTarget.style.color = 'rgba(107,58,75,0.6)')}>
                    <RotateCcw size={11} /> umgerechnet · zurücksetzen
                  </button>
                )}
              </div>
            )}

            <div className="flex flex-wrap items-center gap-2.5">
              <button onClick={() => router.push(`/rezepte/${recipe.id}/bearbeiten`)}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-[13px] font-semibold transition-all hover:opacity-90"
                style={{ background: 'linear-gradient(135deg, #562E3C, #7D4558)', color: '#FFFFFF' }}>
                <Pencil size={14} /> Bearbeiten
              </button>
              <DisabledActionButton icon={<Utensils size={14} />} label="Kochmodus starten" />
              <DisabledActionButton icon={<Printer size={14} />} label="Als PDF exportieren" />
            </div>
          </div>
        </div>

        {/* ── Zutaten (sticky) + Zubereitung, ab 900px zweispaltig ───────────── */}
        <div className="flex flex-col min-[900px]:flex-row gap-8 mb-10">
          {hasIngredients && (
            <div className="min-[900px]:w-[360px] flex-shrink-0">
              <div className="min-[900px]:sticky min-[900px]:top-6 min-[900px]:max-h-[calc(100vh-3rem)] min-[900px]:overflow-y-auto">
                {scaledZutaten.length > 0 && (
                  <div className="mb-5">
                    <div className={labelCls + ' flex items-center gap-1.5'}><Tag size={10} /> Zutaten</div>
                    <div className="bg-card rounded-xl divide-y divide-border border border-border">
                      {scaledZutaten.map((z, i) => (
                        <div key={i} className="flex justify-between px-4 py-2.5 text-sm">
                          <span className="text-text-primary">{z.name}</span>
                          <span className="text-text-muted">{z.menge}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {scaledKomponenten.length > 0 && (
                  <div className="space-y-3">
                    <div className={labelCls}>Komponenten</div>
                    {scaledKomponenten.map((k, i) => (
                      <div key={i} className="bg-card border border-border rounded-xl p-4">
                        <div className="font-semibold text-text-primary mb-2">{k.name}</div>
                        {k.zutaten.length > 0 && (
                          <div className="mb-3 space-y-1">
                            {k.zutaten.map((z, j) => (
                              <div key={j} className="flex justify-between text-[13px]">
                                <span className="text-text-secondary">{z.name}</span>
                                <span className="text-text-muted">{z.menge}</span>
                              </div>
                            ))}
                          </div>
                        )}
                        {k.zubereitung && <p className="text-[13px] text-text-secondary leading-relaxed border-t border-border pt-2 mt-2">{k.zubereitung}</p>}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {(recipe.schritte ?? []).length > 0 && (
            <div className="flex-1 min-w-0">
              <div className={labelCls}>Zubereitung</div>
              <div className="space-y-6">
                {(recipe.schritte ?? []).map((s, i) => (
                  <div key={i} className="flex gap-4">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-[13px] font-bold mt-0.5"
                      style={{ background: 'rgba(107,58,75,0.12)', color: '#6B3A4B', border: '1px solid rgba(107,58,75,0.25)' }}>
                      {i + 1}
                    </div>
                    <p className="text-[15px] text-text-secondary leading-[1.8] pt-1">{s}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ── Restliche Abschnitte ────────────────────────────────────────────── */}
        {recipe.getraenke && (
          <div className="mb-5">
            <div className={labelCls + ' flex items-center gap-1.5'}><Wine size={10} /> Getränkeempfehlung</div>
            <p className="text-[14px] text-text-secondary bg-card border border-border rounded-xl p-4">{recipe.getraenke}</p>
          </div>
        )}

        {recipe.naehrwerte && (
          <div className="mb-5">
            <div className={labelCls + ' flex items-center gap-1.5'}><Flame size={10} /> Kalorien &amp; Nährwerte</div>
            <div className="bg-card border border-border rounded-xl p-4">
              <div className="flex items-baseline gap-2">
                <span className="font-heading text-[20px] font-bold text-text-primary">
                  {recipe.portionen > 0 ? Math.round(recipe.naehrwerte.gesamt.kcal / recipe.portionen) : recipe.naehrwerte.gesamt.kcal}
                </span>
                <span className="text-[12px] text-text-muted">
                  kcal {recipe.portionen > 0 ? `pro Portion (${recipe.portionen})` : 'gesamt — Portionen nicht angegeben'}
                </span>
              </div>
              <p className="text-[10px] font-semibold uppercase tracking-wide mt-1 mb-2" style={{ color: '#9A6B1E' }}>
                ca. — KI-Schätzung, keine exakte Nährwertberechnung
              </p>
              <p className="text-[12px] text-text-muted">
                Protein {recipe.portionen > 0 ? Math.round((recipe.naehrwerte.gesamt.protein / recipe.portionen) * 10) / 10 : recipe.naehrwerte.gesamt.protein} g
                {' · '}Fett {recipe.portionen > 0 ? Math.round((recipe.naehrwerte.gesamt.fett / recipe.portionen) * 10) / 10 : recipe.naehrwerte.gesamt.fett} g
                {' · '}KH {recipe.portionen > 0 ? Math.round((recipe.naehrwerte.gesamt.kh / recipe.portionen) * 10) / 10 : recipe.naehrwerte.gesamt.kh} g
              </p>
            </div>
          </div>
        )}

        {recipe.chefTipps && (
          <div className="mb-5">
            <div className={labelCls + ' flex items-center gap-1.5'}><ChefHat size={10} /> Chef-Tipps</div>
            <p className="text-[14px] text-text-secondary bg-card border border-border rounded-xl p-4">{recipe.chefTipps}</p>
          </div>
        )}

        {recipe.tags.length > 0 && (
          <div className="mb-5">
            <div className={labelCls + ' flex items-center gap-1.5'}><Tag size={10} /> Tags</div>
            <div className="flex flex-wrap gap-2">
              {recipe.tags.map(t => (
                <span key={t} className="text-[12px] px-3 py-1 rounded-full"
                  style={{ background: 'rgba(107,58,75,0.1)', color: '#6B3A4B', border: '1px solid rgba(107,58,75,0.25)' }}>
                  {t}
                </span>
              ))}
            </div>
          </div>
        )}

        <div className="mb-5">
          <div className={labelCls + ' flex items-center justify-between'}>
            <span className="flex items-center gap-1.5"><FolderOpen size={10} /> Projekte</span>
            <button onClick={() => setShowProjectPicker(true)}
              className="normal-case text-gold flex items-center gap-1 hover:text-gold-light transition-colors">
              <Plus size={11} /> Zu Projekt hinzufügen
            </button>
          </div>
          {recipeProjects.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {recipeProjects.map(p => (
                <span key={p.id} className="text-[12px] px-3 py-1 rounded-full flex items-center gap-1.5"
                  style={{ background: `${p.color}18`, color: p.color, border: `1px solid ${p.color}40` }}>
                  <FolderOpen size={10} /> {p.name}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-[13px] text-text-muted">Noch in keinem Projekt.</p>
          )}
        </div>

        {/* ── Wein-Pairing ─────────────────────────────────────────────────── */}
        <div className="mb-5 rounded-xl p-4 max-w-xl" style={{ background: 'rgba(107,58,75,0.04)', border: '1px solid rgba(107,58,75,0.15)' }}>
          <div className="flex items-center gap-2 mb-3">
            <Grape size={14} color="#6B3A4B" />
            <span className="text-[12px] font-semibold uppercase tracking-widest" style={{ color: '#6B3A4B' }}>Wein-Pairing</span>
          </div>

          {!pairingDone && !pairingLoading && (
            recipe.geschmack ? (
              <button onClick={handlePairingFromProfile}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-[13px] font-semibold w-full justify-center transition-all hover:opacity-90"
                style={{ background: 'rgba(107,58,75,0.12)', color: '#6B3A4B', border: '1px solid rgba(107,58,75,0.3)' }}>
                <Wine size={14} /> Passenden Wein finden
              </button>
            ) : (
              <div className="space-y-2">
                <button onClick={handlePairingFromZutaten}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-[13px] font-semibold w-full justify-center transition-all hover:opacity-90"
                  style={{ background: 'rgba(107,58,75,0.12)', color: '#6B3A4B', border: '1px solid rgba(107,58,75,0.3)' }}>
                  <Wine size={14} /> Direkt aus Zutaten berechnen
                </button>
                <p className="text-center text-[11px]" style={{ color: 'rgba(107,58,75,0.5)' }}>
                  Kein gespeichertes Profil · Für dauerhaftes Profil → Rezept bearbeiten
                </p>
              </div>
            )
          )}

          {pairingLoading && (
            <div className="flex items-center justify-center gap-2 py-4 text-[13px]" style={{ color: '#8B7355' }}>
              <Loader2 size={14} className="animate-spin" /> Weine werden geladen…
            </div>
          )}

          {pairingError && (
            <p className="text-[12px] px-3 py-2 rounded-lg" style={{ background: 'rgba(224,107,107,0.08)', color: '#E06B6B', border: '1px solid rgba(224,107,107,0.2)' }}>
              {pairingError}
            </p>
          )}

          {pairingResults.length > 0 && (
            <div className="space-y-2">
              {pairingResults.map(({ wein, score, gründe }) => (
                <div key={wein.id} className="rounded-xl p-3" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div>
                      <p className="text-[13px] font-semibold text-text-primary">{wein.name}</p>
                      <p className="text-[11px] text-text-muted">{wein.region} · {wein.land}</p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full"
                        style={{ background: `${TYP_COLOR[wein.typ]}18`, color: TYP_COLOR[wein.typ], border: `1px solid ${TYP_COLOR[wein.typ]}33` }}>
                        {TYP_LABELS[wein.typ]}
                      </span>
                      <span className="text-[13px] font-bold" style={{ color: TYP_COLOR[wein.typ] }}>{score}%</span>
                    </div>
                  </div>
                  <div className="mb-2 h-1 rounded-full overflow-hidden" style={{ background: 'var(--border)' }}>
                    <div className="h-full rounded-full transition-all" style={{ width: `${score}%`, background: TYP_COLOR[wein.typ] }} />
                  </div>
                  {gründe.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {gründe.map(g => (
                        <span key={g} className="text-[10px] px-2 py-0.5 rounded-full"
                          style={{ background: 'rgba(107,58,75,0.08)', color: '#6B3A4B', border: '1px solid rgba(107,58,75,0.2)' }}>
                          {g}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
              <button onClick={() => { setPairingResults([]); setPairingDone(false); setPairingError(''); }}
                className="text-[11px] text-center w-full pt-1" style={{ color: 'rgba(107,58,75,0.5)' }}>
                Neu berechnen
              </button>
            </div>
          )}
        </div>

        {/* ── Bewertung / Aufrufe / Löschen ───────────────────────────────────── */}
        <div className="flex items-center gap-4 pt-5 mt-5 border-t border-border">
          <div className="flex items-center gap-2">
            <StarRating value={ratingValue} onChange={handleRatingChange} size={16} />
            {ratingError && <span className="text-[11px]" style={{ color: '#E06B6B' }}>{ratingError}</span>}
          </div>
          <span className="text-[12px] text-text-muted flex items-center gap-1 ml-1"><Eye size={12} />{recipe.views} Aufrufe</span>
          <div className="flex-1" />
          <button onClick={handleDelete}
            className="border rounded-lg px-3.5 py-2 text-[12px] flex items-center gap-1.5 transition-colors"
            style={{ background: 'rgba(224,107,107,0.1)', borderColor: 'rgba(224,107,107,0.3)', color: '#E06B6B' }}>
            <Trash2 size={13} /> Löschen
          </button>
        </div>
      </div>

      {showProjectPicker && (
        <ProjectPickerModal projects={projects} recipeId={recipe.id} onClose={() => setShowProjectPicker(false)}
          onToggle={(pid, add) => add ? addRecipeToProject(pid, recipe.id) : removeRecipeFromProject(pid, recipe.id)} />
      )}
    </div>
  );
}
