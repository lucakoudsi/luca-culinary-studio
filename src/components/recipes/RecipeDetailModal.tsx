'use client';
import { useState, useEffect } from 'react';
import { useStore } from '@/lib/store';
import type { Recipe, Project } from '@/types';
import { BookOpen, Eye, Star, X, Trash2, Tag, Wine, ChefHat, Loader2, Grape, FolderOpen, Plus, Minus, RotateCcw, Search } from 'lucide-react';
import { matchWeine } from '@/lib/weinPairing';
import type { Wein, WeinMatch, FoodProfile } from '@/lib/weinPairing';
import { computeRecipeFlavorProfile } from '@/lib/recipeFlavorUtils';
import { scaleMenge } from '@/lib/portionen';

export const TYP_COLOR: Record<Wein['typ'], string> = {
  weiss: '#9B6E1A', rot: '#C04040', rose: '#C06080', schaumwein: '#3A80A8', suesswein: '#8B4A9B',
};
export const TYP_LABELS: Record<Wein['typ'], string> = {
  weiss: 'Weißwein', rot: 'Rotwein', rose: 'Rosé', schaumwein: 'Schaumwein', suesswein: 'Süßwein',
};

export const diffColor:   Record<string, string> = { Leicht: '#7CB87A', Mittel: '#E8A838', Schwer: '#E06B6B' };
export const statusColor: Record<string, string> = { Fertig: '#7CB87A', 'In Bearbeitung': '#E8A838', Entwurf: '#7BB8D4' };

const labelCls = "block text-[11px] text-[#A89880] font-semibold mb-1.5 uppercase tracking-wider";

export function StarRating({ value }: { value: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map(i => (
        <Star key={i} size={11} fill={i <= value ? '#6B3A4B' : 'none'} color={i <= value ? '#6B3A4B' : '#D4C9BC'} />
      ))}
    </div>
  );
}

// ─── Projekt-Auswahl (Mehrfachzuordnung) ──────────────────────────────────────
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

export default function RecipeDetailModal({ recipe, onClose, onDelete }: { recipe: Recipe; onClose: () => void; onDelete: () => void }) {
  const { ingredients, fetchIngredients, projects, fetchProjects, addRecipeToProject, removeRecipeFromProject } = useStore();

  const [pairingLoading, setPairingLoading] = useState(false);
  const [pairingResults, setPairingResults] = useState<WeinMatch[]>([]);
  const [pairingError,   setPairingError]   = useState('');
  const [pairingDone,    setPairingDone]    = useState(false);
  const [showProjectPicker, setShowProjectPicker] = useState(false);

  const basisPortionen = recipe.portionen || 4;
  const [portionen, setPortionen] = useState(basisPortionen);
  const factor = portionen / basisPortionen;
  const isScaled = factor !== 1;

  useEffect(() => { if (ingredients.length === 0) fetchIngredients(); }, []);
  useEffect(() => { if (projects.length === 0) fetchProjects(); }, []);

  const recipeProjects = projects.filter(p => p.recipeIds.includes(recipe.id));

  const hasIngredients = (recipe.zutaten ?? []).length > 0 || (recipe.komponenten ?? []).some(k => k.zutaten.length > 0);
  const scaledZutaten = (recipe.zutaten ?? []).map(z => ({ ...z, menge: scaleMenge(z.menge, factor) }));
  const scaledKomponenten = (recipe.komponenten ?? []).map(k => ({
    ...k,
    zutaten: k.zutaten.map(z => ({ ...z, menge: scaleMenge(z.menge, factor) })),
  }));

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
    const { profile, matched } = computeRecipeFlavorProfile(
      recipe.zutaten ?? [], recipe.komponenten ?? [], ingredients,
    );
    if (matched.length === 0) {
      setPairingError('Keine Zutaten aus der Bibliothek erkannt — Profil kann nicht berechnet werden.');
      return;
    }
    runPairing(profile as FoodProfile);
  };

  return (
    <>
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-6" onClick={onClose}>
      <div className="bg-surface border border-border-strong rounded-2xl w-full max-w-2xl max-h-[88vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        {/* Hero */}
        <div className="h-48 relative overflow-hidden rounded-t-2xl"
          style={recipe.image
            ? { backgroundImage: `url(${recipe.image})`, backgroundSize: 'cover', backgroundPosition: 'center' }
            : { background: 'linear-gradient(135deg, #1a1500 0%, #0d0d0d 100%)' }}>
          {!recipe.image && <BookOpen size={42} className="absolute inset-0 m-auto opacity-25" strokeWidth={1} color="#C9A84C" />}
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
          <button onClick={onClose}
            className="absolute top-4 right-4 bg-black/50 backdrop-blur-sm border border-border rounded-lg p-2 text-text-secondary hover:text-text-primary">
            <X size={16} />
          </button>
          <div className="absolute bottom-5 left-6">
            <div className="flex gap-2 mb-2">
              <span className="text-[11px] px-2.5 py-1 rounded-full font-semibold backdrop-blur-sm"
                style={{ color: statusColor[recipe.status], background: `${statusColor[recipe.status]}22`, border: `1px solid ${statusColor[recipe.status]}50` }}>
                {recipe.status}
              </span>
              <span className="text-[11px] px-2.5 py-1 rounded-full bg-black/40 text-white/70 backdrop-blur-sm">{recipe.category}</span>
            </div>
            <h2 className="font-heading text-[24px] font-bold text-white leading-tight drop-shadow">{recipe.title}</h2>
          </div>
        </div>

        <div className="p-7">
          <p className="text-[14px] text-text-secondary leading-relaxed mb-5">{recipe.description}</p>

          <div className="grid grid-cols-3 gap-3 mb-6">
            {[
              { label: 'Schwierigkeit', value: recipe.difficulty, color: diffColor[recipe.difficulty] },
              { label: 'Zeit', value: `${recipe.time} Min` },
              { label: 'Saison', value: recipe.season },
            ].map(item => (
              <div key={item.label} className="bg-card rounded-lg p-3 text-center border border-border">
                <div className="text-[10px] text-text-muted mb-1 uppercase tracking-wider">{item.label}</div>
                <div className="text-[14px] font-semibold" style={{ color: item.color || '#2C2420' }}>{item.value}</div>
              </div>
            ))}
          </div>

          {/* Portionen-Rechner */}
          {hasIngredients && (
            <div className="mb-5 flex items-center justify-between rounded-xl px-4 py-3"
              style={{ background: 'rgba(107,58,75,0.04)', border: '1px solid rgba(107,58,75,0.15)' }}>
              <div className="flex items-center gap-3">
                <span className="text-[12px] font-semibold uppercase tracking-widest" style={{ color: '#6B3A4B' }}>
                  Portionen
                </span>
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

          {/* Zutaten */}
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

          {/* Komponenten */}
          {scaledKomponenten.length > 0 && (
            <div className="mb-5 space-y-3">
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

          {/* Schritte */}
          {(recipe.schritte ?? []).length > 0 && (
            <div className="mb-5">
              <div className={labelCls}>Zubereitung</div>
              <div className="space-y-3">
                {(recipe.schritte ?? []).map((s, i) => (
                  <div key={i} className="flex gap-3">
                    <div className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 text-[11px] font-bold mt-0.5"
                      style={{ background: 'rgba(107,58,75,0.12)', color: '#6B3A4B', border: '1px solid rgba(107,58,75,0.25)' }}>
                      {i + 1}
                    </div>
                    <p className="text-[14px] text-text-secondary leading-relaxed">{s}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Getränke */}
          {recipe.getraenke && (
            <div className="mb-5">
              <div className={labelCls + ' flex items-center gap-1.5'}><Wine size={10} /> Getränkeempfehlung</div>
              <p className="text-[14px] text-text-secondary bg-card border border-border rounded-xl p-4">{recipe.getraenke}</p>
            </div>
          )}

          {/* Chef-Tipps */}
          {recipe.chefTipps && (
            <div className="mb-5">
              <div className={labelCls + ' flex items-center gap-1.5'}><ChefHat size={10} /> Chef-Tipps</div>
              <p className="text-[14px] text-text-secondary bg-card border border-border rounded-xl p-4">{recipe.chefTipps}</p>
            </div>
          )}

          {/* Tags */}
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

          {/* Projekte */}
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

          {/* ── Wein-Pairing ─────────────────────────────────────────────── */}
          <div className="mb-5 rounded-xl p-4" style={{ background: 'rgba(107,58,75,0.04)', border: '1px solid rgba(107,58,75,0.15)' }}>
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

          <div className="flex items-center gap-4 pt-5 border-t border-border">
            <div className="flex gap-1">
              {[1,2,3,4,5].map(i => <Star key={i} size={14} fill={i <= recipe.rating ? '#6B3A4B' : 'none'} color={i <= recipe.rating ? '#6B3A4B' : '#D4C9BC'} />)}
            </div>
            <span className="text-[12px] text-text-muted flex items-center gap-1 ml-1"><Eye size={12} />{recipe.views} Aufrufe</span>
            <div className="flex-1" />
            <button onClick={() => { onDelete(); onClose(); }}
              className="border rounded-lg px-3.5 py-2 text-[12px] flex items-center gap-1.5 transition-colors"
              style={{ background: 'rgba(224,107,107,0.1)', borderColor: 'rgba(224,107,107,0.3)', color: '#E06B6B' }}>
              <Trash2 size={13} /> Löschen
            </button>
          </div>
        </div>
      </div>
    </div>
    {showProjectPicker && (
      <ProjectPickerModal projects={projects} recipeId={recipe.id} onClose={() => setShowProjectPicker(false)}
        onToggle={(pid, add) => add ? addRecipeToProject(pid, recipe.id) : removeRecipeFromProject(pid, recipe.id)} />
    )}
    </>
  );
}
