'use client';
import { useState, useEffect } from 'react';
import { useStore } from '@/lib/store';
import { submitGlow } from '@/lib/utils';
import type { Recipe, Project, ProjectMenu, MenuGang, Ingredient } from '@/types';
import {
  X, Plus, Trash2, ChevronUp, ChevronDown, BookOpen, Wine, Search, Sparkles, Loader2, Eye,
} from 'lucide-react';
import { matchWeine } from '@/lib/weinPairing';
import type { Wein, WeinMatch, FoodProfile } from '@/lib/weinPairing';
import { computeRecipeFlavorProfile } from '@/lib/recipeFlavorUtils';
import { TYP_COLOR, TYP_LABELS } from '@/components/recipes/RecipeDetailModal';

const GANG_PRESETS = ['Vorspeise', 'Hauptgang', 'Dessert'];

// ─── Rezept-Einzelauswahl für einen Gang ──────────────────────────────────────
function GangRecipePicker({ recipes, onClose, onSelect }: { recipes: Recipe[]; onClose: () => void; onSelect: (id: number) => void }) {
  const [search, setSearch] = useState('');
  const filtered = recipes.filter(r => r.title.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="fixed inset-0 z-[60] bg-black/75 backdrop-blur-sm flex items-center justify-center p-6" onClick={onClose}>
      <div className="bg-surface border border-border-strong rounded-2xl w-full max-w-md max-h-[70vh] flex flex-col" onClick={e => e.stopPropagation()}>
        <div className="px-6 py-5 border-b border-border flex items-center justify-between flex-shrink-0">
          <h3 className="font-heading text-[17px] font-bold text-text-primary">Rezept wählen</h3>
          <button onClick={onClose} className="text-text-secondary hover:text-text-primary"><X size={18} /></button>
        </div>
        <div className="px-6 pt-3 flex-shrink-0">
          <div className="relative">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Rezepte durchsuchen…" autoFocus
              className="w-full bg-card border border-border-strong rounded-lg pl-8 pr-3 py-2 text-text-primary text-[13px] outline-none focus:border-gold/40" />
          </div>
        </div>
        <div className="px-6 py-3 overflow-y-auto flex-1 space-y-1">
          {filtered.length === 0 ? (
            <p className="text-center text-[13px] text-text-muted py-6">Keine Treffer.</p>
          ) : filtered.map(r => (
            <button key={r.id} onClick={() => { onSelect(r.id); onClose(); }}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-card-hover text-left transition-colors">
              <div className="w-8 h-8 rounded-md flex-shrink-0 overflow-hidden relative"
                style={r.image
                  ? { backgroundImage: `url(${r.image})`, backgroundSize: 'cover', backgroundPosition: 'center' }
                  : { background: 'linear-gradient(135deg, #1a1500 0%, #0d0d0d 100%)' }}>
                {!r.image && <BookOpen size={12} className="absolute inset-0 m-auto opacity-30" color="#C9A84C" />}
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-[13px] text-text-primary font-medium truncate">{r.title}</div>
                <div className="text-[11px] text-text-muted">{r.category}</div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Wein-Einzelauswahl (manuell, per Suche) ───────────────────────────────────
function WeinPicker({ onClose, onSelect }: { onClose: () => void; onSelect: (wein: Wein) => void }) {
  const [search, setSearch] = useState('');
  const [weine, setWeine] = useState<Wein[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/weine')
      .then(r => r.json())
      .then(setWeine)
      .catch(() => setError('Weine konnten nicht geladen werden.'))
      .finally(() => setLoading(false));
  }, []);

  const filtered = weine.filter(w =>
    w.name.toLowerCase().includes(search.toLowerCase()) || w.rebsorte.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-[60] bg-black/75 backdrop-blur-sm flex items-center justify-center p-6" onClick={onClose}>
      <div className="bg-surface border border-border-strong rounded-2xl w-full max-w-md max-h-[70vh] flex flex-col" onClick={e => e.stopPropagation()}>
        <div className="px-6 py-5 border-b border-border flex items-center justify-between flex-shrink-0">
          <h3 className="font-heading text-[17px] font-bold text-text-primary">Wein wählen</h3>
          <button onClick={onClose} className="text-text-secondary hover:text-text-primary"><X size={18} /></button>
        </div>
        <div className="px-6 pt-3 flex-shrink-0">
          <div className="relative">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Wein oder Rebsorte durchsuchen…" autoFocus
              className="w-full bg-card border border-border-strong rounded-lg pl-8 pr-3 py-2 text-text-primary text-[13px] outline-none focus:border-gold/40" />
          </div>
        </div>
        <div className="px-6 py-3 overflow-y-auto flex-1 space-y-1">
          {loading ? (
            <div className="flex items-center justify-center gap-2 py-6 text-[13px] text-text-muted">
              <Loader2 size={14} className="animate-spin" /> Weine werden geladen…
            </div>
          ) : error ? (
            <p className="text-center text-[13px] py-6" style={{ color: '#C05050' }}>{error}</p>
          ) : filtered.length === 0 ? (
            <p className="text-center text-[13px] text-text-muted py-6">Keine Treffer.</p>
          ) : filtered.map(w => (
            <button key={w.id} onClick={() => { onSelect(w); onClose(); }}
              className="w-full flex items-center justify-between gap-3 px-3 py-2.5 rounded-lg hover:bg-card-hover text-left transition-colors">
              <div className="min-w-0">
                <div className="text-[13px] text-text-primary font-medium truncate">{w.name}</div>
                <div className="text-[11px] text-text-muted">{w.region} · {w.land}</div>
              </div>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full flex-shrink-0"
                style={{ background: `${TYP_COLOR[w.typ]}18`, color: TYP_COLOR[w.typ], border: `1px solid ${TYP_COLOR[w.typ]}33` }}>
                {TYP_LABELS[w.typ]}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Ein Gang ──────────────────────────────────────────────────────────────────
function GangRow({
  gang, index, total, recipes, ingredients, fetchIngredients,
  onUpdate, onRemove, onMove,
}: {
  gang: MenuGang; index: number; total: number; recipes: Recipe[]; ingredients: Ingredient[];
  fetchIngredients: () => void;
  onUpdate: (updates: Partial<MenuGang>) => void;
  onRemove: () => void;
  onMove: (direction: 'up' | 'down') => void;
}) {
  const [bezeichnung, setBezeichnung] = useState(gang.bezeichnung);
  const [showRecipePicker, setShowRecipePicker] = useState(false);
  const [showWeinPicker, setShowWeinPicker] = useState(false);
  const [suggestions, setSuggestions] = useState<WeinMatch[] | null>(null);
  const [suggestLoading, setSuggestLoading] = useState(false);
  const [suggestError, setSuggestError] = useState('');

  const recipe = recipes.find(r => r.id === gang.rezeptId) ?? null;

  const handleSuggest = async () => {
    if (!recipe) return;
    setSuggestLoading(true);
    setSuggestError('');
    setSuggestions(null);
    try {
      let profile = recipe.geschmack as FoodProfile | null;
      if (!profile) {
        if (ingredients.length === 0) fetchIngredients();
        const { profile: computed, matched } = computeRecipeFlavorProfile(recipe.zutaten ?? [], recipe.komponenten ?? [], ingredients);
        if (matched.length === 0) {
          setSuggestError('Kein Geschmacksprofil verfügbar — Zutaten aus der Bibliothek nicht erkannt.');
          return;
        }
        profile = computed as FoodProfile;
      }
      const res = await fetch('/api/weine');
      if (!res.ok) throw new Error('Weine konnten nicht geladen werden.');
      const wines: Wein[] = await res.json();
      if (wines.length === 0) {
        setSuggestError('Keine Weine in der Datenbank.');
        return;
      }
      setSuggestions(matchWeine(profile, wines).slice(0, 3));
    } catch (e) {
      setSuggestError(e instanceof Error ? e.message : 'Fehler bei der Wein-Suche.');
    } finally {
      setSuggestLoading(false);
    }
  };

  return (
    <div className="bg-card border border-border rounded-xl p-4">
      <div className="flex items-start gap-3">
        <div className="flex flex-col gap-0.5 pt-1 flex-shrink-0">
          <button onClick={() => onMove('up')} disabled={index === 0}
            className="text-text-muted hover:text-gold disabled:opacity-20 disabled:hover:text-text-muted transition-colors">
            <ChevronUp size={14} />
          </button>
          <button onClick={() => onMove('down')} disabled={index === total - 1}
            className="text-text-muted hover:text-gold disabled:opacity-20 disabled:hover:text-text-muted transition-colors">
            <ChevronDown size={14} />
          </button>
        </div>

        <div className="flex-1 min-w-0 space-y-3">
          {/* Bezeichnung */}
          <div className="flex items-center gap-2 flex-wrap">
            <input value={bezeichnung}
              onChange={e => setBezeichnung(e.target.value)}
              onBlur={() => { if (bezeichnung.trim() && bezeichnung !== gang.bezeichnung) onUpdate({ bezeichnung }); }}
              className="font-heading text-[15px] font-bold text-text-primary bg-transparent outline-none border-b border-transparent focus:border-gold/40 min-w-[100px]" />
            <div className="flex gap-1">
              {GANG_PRESETS.map(p => (
                <button key={p} onClick={() => { setBezeichnung(p); onUpdate({ bezeichnung: p }); }}
                  className="text-[10px] px-2 py-0.5 rounded-full transition-colors"
                  style={{
                    background: bezeichnung === p ? 'rgba(107,58,75,0.12)' : 'rgba(0,0,0,0.04)',
                    color: bezeichnung === p ? '#6B3A4B' : '#A89880',
                  }}>
                  {p}
                </button>
              ))}
            </div>
            <button onClick={onRemove} className="ml-auto text-text-muted hover:text-red-400 transition-colors flex-shrink-0">
              <Trash2 size={14} />
            </button>
          </div>

          {/* Rezept */}
          <div>
            {recipe ? (
              <button onClick={() => setShowRecipePicker(true)}
                className="w-full flex items-center gap-2.5 bg-background rounded-lg px-3 py-2 hover:border-gold/40 border border-border transition-colors text-left">
                <div className="w-7 h-7 rounded-md flex-shrink-0 overflow-hidden relative"
                  style={recipe.image
                    ? { backgroundImage: `url(${recipe.image})`, backgroundSize: 'cover', backgroundPosition: 'center' }
                    : { background: 'linear-gradient(135deg, #1a1500 0%, #0d0d0d 100%)' }}>
                  {!recipe.image && <BookOpen size={11} className="absolute inset-0 m-auto opacity-30" color="#C9A84C" />}
                </div>
                <span className="text-[13px] text-text-primary font-medium truncate">{recipe.title}</span>
              </button>
            ) : (
              <button onClick={() => setShowRecipePicker(true)}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-lg border border-dashed border-border text-[12px] text-text-muted hover:border-gold/40 hover:text-gold transition-colors">
                <BookOpen size={13} /> Rezept zuordnen
              </button>
            )}
          </div>

          {/* Wein */}
          <div className="pt-2 border-t border-border">
            {gang.weinName ? (
              <div className="flex items-center gap-2 flex-wrap">
                <Wine size={13} className="text-gold flex-shrink-0" />
                <span className="text-[13px] text-text-primary font-medium">{gang.weinName}</span>
                <button onClick={() => onUpdate({ weinId: null, weinName: null })}
                  className="text-[11px] text-text-muted hover:text-red-400 transition-colors ml-1">
                  entfernen
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2 flex-wrap">
                <button onClick={handleSuggest} disabled={!recipe || suggestLoading}
                  className="flex items-center gap-1.5 text-[11px] px-2.5 py-1.5 rounded-lg font-semibold transition-all disabled:opacity-40"
                  style={{ background: 'rgba(107,58,75,0.1)', color: '#6B3A4B', border: '1px solid rgba(107,58,75,0.25)' }}>
                  {suggestLoading ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />} Wein vorschlagen
                </button>
                <button onClick={() => setShowWeinPicker(true)}
                  className="text-[11px] px-2.5 py-1.5 rounded-lg text-text-muted border border-border hover:border-gold/40 hover:text-gold transition-colors">
                  Manuell wählen
                </button>
                {!recipe && <span className="text-[10px] text-text-muted">Erst Rezept zuordnen für Vorschlag</span>}
              </div>
            )}

            {suggestError && <p className="text-[11px] mt-2" style={{ color: '#C05050' }}>{suggestError}</p>}

            {suggestions && (
              <div className="mt-2.5 space-y-1.5">
                {suggestions.map(({ wein, score, gründe }) => (
                  <button key={wein.id}
                    onClick={() => { onUpdate({ weinId: wein.id, weinName: wein.name }); setSuggestions(null); }}
                    className="w-full text-left rounded-lg p-2.5 hover:border-gold/40 border border-border transition-colors bg-background">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[12px] font-semibold text-text-primary">{wein.name}</span>
                      <span className="text-[12px] font-bold flex-shrink-0" style={{ color: TYP_COLOR[wein.typ] }}>{score}%</span>
                    </div>
                    {gründe.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1">
                        {gründe.map(g => (
                          <span key={g} className="text-[10px] px-1.5 py-0.5 rounded-full"
                            style={{ background: 'rgba(107,58,75,0.08)', color: '#6B3A4B' }}>{g}</span>
                        ))}
                      </div>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {showRecipePicker && (
        <GangRecipePicker recipes={recipes} onClose={() => setShowRecipePicker(false)}
          onSelect={id => onUpdate({ rezeptId: id })} />
      )}
      {showWeinPicker && (
        <WeinPicker onClose={() => setShowWeinPicker(false)}
          onSelect={w => onUpdate({ weinId: w.id, weinName: w.name })} />
      )}
    </div>
  );
}

// ─── Menü-Editor ────────────────────────────────────────────────────────────────
export default function MenuEditorModal({ project, menu, onClose, onView }: { project: Project; menu: ProjectMenu; onClose: () => void; onView?: () => void }) {
  const { recipes, ingredients, fetchIngredients, updateMenu, addGang, updateGang, removeGang, moveGang } = useStore();
  const [name, setName] = useState(menu.name);
  const [beschreibung, setBeschreibung] = useState(menu.beschreibung);
  const [newGangName, setNewGangName] = useState('');

  const canAddGang = newGangName.trim().length > 0;

  const handleAddGang = () => {
    if (!canAddGang) return;
    addGang(project.id, menu.id, newGangName.trim());
    setNewGangName('');
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-6" onClick={onClose}>
      <div className="bg-surface border border-border-strong rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="px-7 py-6 border-b border-border flex items-start justify-between sticky top-0 bg-surface z-10">
          <div className="flex-1 min-w-0 pr-4">
            <input value={name} onChange={e => setName(e.target.value)}
              onBlur={() => { if (name.trim() && name !== menu.name) updateMenu(project.id, menu.id, { name }); }}
              className="font-heading text-[22px] font-bold text-text-primary bg-transparent outline-none border-b border-transparent focus:border-gold/40 w-full" />
            <input value={beschreibung} onChange={e => setBeschreibung(e.target.value)}
              onBlur={() => { if (beschreibung !== menu.beschreibung) updateMenu(project.id, menu.id, { beschreibung }); }}
              placeholder="Beschreibung hinzufügen…"
              className="text-[13px] text-text-muted bg-transparent outline-none border-b border-transparent focus:border-gold/40 w-full mt-1.5" />
          </div>
          <div className="flex items-center gap-3 flex-shrink-0">
            {onView && (
              <button onClick={onView}
                className="flex items-center gap-1.5 text-[12px] font-semibold px-3 py-1.5 rounded-lg transition-colors"
                style={{ background: 'rgba(107,58,75,0.1)', color: '#6B3A4B', border: '1px solid rgba(107,58,75,0.25)' }}>
                <Eye size={13} /> Ansehen
              </button>
            )}
            <button onClick={onClose} className="text-text-secondary hover:text-text-primary p-1"><X size={20} /></button>
          </div>
        </div>

        <div className="p-7 space-y-3">
          {menu.gaenge.map((gang, i) => (
            <GangRow key={gang.id} gang={gang} index={i} total={menu.gaenge.length}
              recipes={recipes} ingredients={ingredients} fetchIngredients={fetchIngredients}
              onUpdate={updates => updateGang(project.id, menu.id, gang.id, updates)}
              onRemove={() => removeGang(project.id, menu.id, gang.id)}
              onMove={direction => moveGang(project.id, menu.id, gang.id, direction)} />
          ))}

          {menu.gaenge.length === 0 && (
            <div className="text-center py-8 text-text-muted text-[13px] border border-dashed border-border rounded-xl">
              Noch keine Gänge. Baue dein Menü Gang für Gang auf.
            </div>
          )}

          <div className="flex gap-2 pt-1">
            <input value={newGangName} onChange={e => setNewGangName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleAddGang()}
              placeholder="Gang-Bezeichnung (z.B. Amuse-Bouche)…"
              className="flex-1 bg-card border border-border-strong rounded-lg px-3.5 py-2.5 text-text-primary text-[13px] outline-none focus:border-gold/40" />
            <button onClick={handleAddGang} disabled={!canAddGang}
              className="flex items-center gap-1.5 px-4 rounded-lg text-white text-[13px] font-semibold transition-all disabled:opacity-40"
              style={{ background: '#6B3A4B', boxShadow: submitGlow(canAddGang) }}>
              <Plus size={14} /> Gang hinzufügen
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
