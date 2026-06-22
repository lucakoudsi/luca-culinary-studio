'use client';
import { useState, useEffect } from 'react';
import { useStore } from '@/lib/store';
import type { Ingredient, IngredientCategory } from '@/types';
import { Search, Leaf, X, Plus, Thermometer, MapPin, Tag } from 'lucide-react';

const seasonOptions = ['Alle', 'Frühling', 'Sommer', 'Herbst', 'Winter', 'Ganzjährig'];
const categoryOptions: string[] = ['Alle', 'Gemüse', 'Obst', 'Fleisch', 'Fisch & Meeresfrüchte', 'Pilze', 'Kräuter & Gewürze', 'Nüsse & Samen', 'Milchprodukte & Käse', 'Getreide & Hülsenfrüchte', 'Öle & Fette', 'Fermentiertes'];

const seasonColors: Record<string, string> = { Frühling: '#7CB87A', Sommer: '#E8A838', Herbst: '#C4743A', Winter: '#7BB8D4', Ganzjährig: '#A89880' };
const flavorLabels = ['Säure', 'Süße', 'Bitter', 'Umami', 'Schärfe', 'Salzig'];
const flavorKeys: (keyof Ingredient['flavor'])[] = ['acidity', 'sweetness', 'bitterness', 'umami', 'spiciness', 'saltiness'];
const flavorColors = ['#7BB8D4', '#E8A838', '#7CB87A', '#C9A84C', '#E06B6B', '#A89880'];

function FlavorBar({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="flex items-center gap-2.5">
      <span className="text-[11px] text-text-muted w-12 flex-shrink-0">{label}</span>
      <div className="flex-1 h-1.5 bg-background rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all duration-500"
          style={{ width: `${(value / 5) * 100}%`, background: color }} />
      </div>
      <span className="text-[11px] font-semibold w-4 text-right" style={{ color }}>{value}</span>
    </div>
  );
}

function IngredientCard({ ingredient, onClick }: { ingredient: Ingredient; onClick: () => void }) {
  const catColor: Record<string, string> = {
    'Gemüse': '#7CB87A', 'Fleisch': '#E06B6B', 'Fisch & Meeresfrüchte': '#7BB8D4',
    'Pilze': '#C4743A', 'Kräuter & Gewürze': '#7CB87A', 'Obst': '#E8A838',
    'Nüsse & Samen': '#C4743A', 'Milchprodukte & Käse': '#A08060',
    'Fermentiertes': '#6B3A4B', 'Getreide & Hülsenfrüchte': '#8B7355',
    'Öle & Fette': '#9B6E1A',
  };
  const color = catColor[ingredient.category] || '#C9A84C';
  const topFlavor = flavorKeys.reduce((a, b) => ingredient.flavor[a] >= ingredient.flavor[b] ? a : b);
  const topFlavorIdx = flavorKeys.indexOf(topFlavor);

  return (
    <div onClick={onClick}
      className="bg-card border border-border rounded-xl p-4 cursor-pointer hover:border-gold/30 transition-all">
      <div className="flex items-start justify-between mb-3">
        <div>
          <div className="text-[11px] font-semibold mb-1" style={{ color }}>{ingredient.category}</div>
          <h3 className="font-heading text-[16px] font-bold text-text-primary leading-snug">{ingredient.name}</h3>
        </div>
        <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
          style={{ background: `${color}18` }}>
          <Leaf size={18} style={{ color }} strokeWidth={1.5} />
        </div>
      </div>

      <div className="flex flex-wrap gap-1.5 mb-3">
        {ingredient.seasons.map(s => (
          <span key={s} className="text-[10px] px-2 py-0.5 rounded-full font-semibold"
            style={{ background: `${seasonColors[s]}15`, color: seasonColors[s], border: `1px solid ${seasonColors[s]}30` }}>
            {s}
          </span>
        ))}
      </div>

      <div className="flex flex-wrap gap-1.5 mb-3">
        {ingredient.aromas.slice(0, 3).map(a => (
          <span key={a} className="text-[10px] px-2 py-0.5 rounded-md bg-card-hover text-text-muted border border-border">{a}</span>
        ))}
      </div>

      <div className="pt-3 border-t border-border flex items-center justify-between">
        <span className="text-[11px] text-text-muted flex items-center gap-1.5">
          <MapPin size={10} />{ingredient.origin}
        </span>
        <span className="text-[11px] font-semibold" style={{ color: flavorColors[topFlavorIdx] }}>
          {flavorLabels[topFlavorIdx]} {ingredient.flavor[topFlavor]}/5
        </span>
      </div>
    </div>
  );
}

function IngredientDetail({ ingredient, onClose }: { ingredient: Ingredient; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-6" onClick={onClose}>
      <div className="bg-surface border border-border-strong rounded-2xl w-full max-w-xl max-h-[88vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="p-7">
          <div className="flex items-start justify-between mb-5">
            <div>
              <div className="text-[11px] text-gold font-semibold uppercase tracking-wider mb-1">{ingredient.category}</div>
              <h2 className="font-heading text-[28px] font-bold text-text-primary">{ingredient.name}</h2>
              <div className="flex items-center gap-2 mt-1.5 text-[12px] text-text-muted">
                <MapPin size={11} />{ingredient.origin}
                <span className="mx-1">·</span>
                <Thermometer size={11} />{ingredient.storageTemp}
              </div>
            </div>
            <button onClick={onClose} className="text-text-secondary hover:text-text-primary p-1"><X size={20} /></button>
          </div>

          <p className="text-[13px] text-text-secondary leading-relaxed mb-6">{ingredient.description}</p>

          {/* Seasons */}
          <div className="mb-5">
            <div className="text-[11px] text-text-muted font-semibold uppercase tracking-widest mb-2.5">Saison</div>
            <div className="flex gap-2">
              {ingredient.seasons.map(s => (
                <span key={s} className="text-[12px] px-3 py-1.5 rounded-lg font-semibold"
                  style={{ background: `${seasonColors[s]}18`, color: seasonColors[s], border: `1px solid ${seasonColors[s]}35` }}>
                  {s}
                </span>
              ))}
            </div>
          </div>

          {/* Aroma Profile */}
          <div className="mb-5">
            <div className="text-[11px] text-text-muted font-semibold uppercase tracking-widest mb-2.5">Aromaprofil</div>
            <div className="flex flex-wrap gap-2">
              {ingredient.aromas.map(a => (
                <span key={a} className="text-[12px] px-2.5 py-1 rounded-md text-text-secondary border border-border bg-card">{a}</span>
              ))}
            </div>
          </div>

          {/* Flavor Profile */}
          <div className="mb-5 bg-card rounded-xl p-4">
            <div className="text-[11px] text-text-muted font-semibold uppercase tracking-widest mb-4">Geschmacksprofil</div>
            <div className="space-y-3">
              {flavorKeys.map((key, i) => (
                <FlavorBar key={key} label={flavorLabels[i]} value={ingredient.flavor[key]} color={flavorColors[i]} />
              ))}
            </div>
          </div>

          {/* Pairings */}
          <div>
            <div className="text-[11px] text-text-muted font-semibold uppercase tracking-widest mb-2.5 flex items-center gap-1.5">
              <Tag size={10} /> Passt zu
            </div>
            <div className="flex flex-wrap gap-2">
              {ingredient.pairings.map(p => (
                <span key={p} className="text-[12px] px-3 py-1 rounded-full font-medium"
                  style={{ background: 'rgba(107,58,75,0.1)', color: '#6B3A4B', border: '1px solid rgba(107,58,75,0.25)' }}>
                  {p}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ZutatenPage() {
  const { getFilteredIngredients, ingredientSearch, setIngredientSearch, ingredientSeasonFilter, setIngredientSeasonFilter, ingredientCategoryFilter, setIngredientCategoryFilter, fetchIngredients } = useStore();
  const [selected, setSelected] = useState<Ingredient | null>(null);
  const filtered = getFilteredIngredients();

  useEffect(() => { fetchIngredients(); }, []);

  return (
    <div style={{ background: '#FAF8F5', minHeight: '100vh' }}>
      <div className="px-8 pt-8 pb-6" style={{ borderBottom: '1px solid #E8E0D8' }}>
        <div className="text-[10px] font-semibold tracking-[4px] uppercase mb-2" style={{ color: 'rgba(107,58,75,0.55)' }}>✦ &nbsp;Botanik & Aromen</div>
        <h1 className="font-heading font-bold leading-none" style={{ fontSize: 28, color: '#2C2420', letterSpacing: '2px', textTransform: 'uppercase' }}>Zutatenbibliothek</h1>
        <p className="mt-1.5" style={{ color: '#8B7355', fontSize: 13 }}>{filtered.length} Zutaten · Klicke für Aromaprofil & Pairings</p>
      </div>
      <div className="p-8 max-w-[1400px]">

      {/* Filters */}
      <div className="bg-card border border-border rounded-xl px-5 py-4 mb-7 space-y-3">
        <div className="flex gap-4 flex-wrap items-center">
          <div className="relative flex-1 min-w-[220px]">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
            <input value={ingredientSearch} onChange={e => setIngredientSearch(e.target.value)} placeholder="Zutat oder Aroma suchen…"
              className="w-full bg-card-hover border border-border-strong rounded-lg pl-9 pr-3.5 py-2 text-text-primary text-[13px] outline-none focus:border-gold/40" />
          </div>
          <div className="flex gap-1.5 flex-wrap">
            {seasonOptions.map(s => (
              <button key={s} onClick={() => setIngredientSeasonFilter(s)}
                className="px-3 py-1.5 rounded-full text-[11px] font-semibold transition-all"
                style={{
                  background: ingredientSeasonFilter === s ? `${seasonColors[s] || 'rgba(107,58,75'}18` : 'rgba(0,0,0,0.04)',
                  border: `1px solid ${ingredientSeasonFilter === s ? (seasonColors[s] || '#6B3A4B') + '40' : 'rgba(0,0,0,0.08)'}`,
                  color: ingredientSeasonFilter === s ? (seasonColors[s] || '#C9A84C') : '#A89880',
                }}>
                {s}
              </button>
            ))}
          </div>
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {categoryOptions.map(c => (
            <button key={c} onClick={() => setIngredientCategoryFilter(c)}
              className="px-3 py-1 rounded-full text-[11px] font-medium transition-all"
              style={{
                background: ingredientCategoryFilter === c ? 'rgba(107,58,75,0.1)' : 'transparent',
                border: `1px solid ${ingredientCategoryFilter === c ? 'rgba(107,58,75,0.3)' : 'rgba(0,0,0,0.07)'}`,
                color: ingredientCategoryFilter === c ? '#6B3A4B' : '#8B7355',
              }}>
              {c}
            </button>
          ))}
        </div>
      </div>

      {filtered.length > 0 ? (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(260px,1fr))] gap-4">
          {filtered.map(i => (
            <IngredientCard key={i.id} ingredient={i} onClick={() => setSelected(i)} />
          ))}
        </div>
      ) : (
        <div className="text-center py-20 text-text-muted">
          <Leaf size={48} strokeWidth={1} className="mx-auto mb-4" />
          <p className="font-heading text-xl text-text-secondary mb-2">Keine Zutaten gefunden</p>
          <p className="text-sm">Filter oder Suchbegriff anpassen.</p>
        </div>
      )}

      {selected && <IngredientDetail ingredient={selected} onClose={() => setSelected(null)} />}
    </div>
    </div>
  );
}
