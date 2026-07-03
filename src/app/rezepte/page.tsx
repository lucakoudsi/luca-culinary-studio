'use client';
import PageTransition from '@/components/ui/PageTransition';
import EmptyState from '@/components/ui/EmptyState';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useStore } from '@/lib/store';
import type { Recipe } from '@/types';
import {
  BookOpen, Search, Plus, Filter, Clock, Eye, Star, X, Trash2, Edit3,
  Tag, Wine, ChefHat,
} from 'lucide-react';

const categories = ['Alle', 'Vorspeise', 'Suppe', 'Hauptgang', 'Dessert', 'Beilage', 'Snack'];
const statuses   = ['Alle', 'Fertig', 'In Bearbeitung', 'Entwurf'];

const diffColor:   Record<string, string> = { Leicht: '#7CB87A', Mittel: '#E8A838', Schwer: '#E06B6B' };
const statusColor: Record<string, string> = { Fertig: '#7CB87A', 'In Bearbeitung': '#E8A838', Entwurf: '#7BB8D4' };

const labelCls = "block text-[11px] text-[#A89880] font-semibold mb-1.5 uppercase tracking-wider";

// ─── StarRating ───────────────────────────────────────────────────────────────
function StarRating({ value }: { value: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map(i => (
        <Star key={i} size={11} fill={i <= value ? '#6B3A4B' : 'none'} color={i <= value ? '#6B3A4B' : '#D4C9BC'} />
      ))}
    </div>
  );
}

// ─── RecipeCard ───────────────────────────────────────────────────────────────
function RecipeCard({ recipe, onView, onDelete, onEdit }: { recipe: Recipe; onView: () => void; onDelete: () => void; onEdit: () => void }) {
  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden cursor-pointer card-hover group" onClick={onView}>
      {/* Image / Placeholder */}
      <div className="h-44 relative overflow-hidden"
        style={recipe.image
          ? { backgroundImage: `url(${recipe.image})`, backgroundSize: 'cover', backgroundPosition: 'center' }
          : { background: 'linear-gradient(135deg, #1a1500 0%, #0d0d0d 100%)' }}>
        {!recipe.image && (
          <BookOpen size={36} className="absolute inset-0 m-auto opacity-25 group-hover:opacity-40 transition-opacity" strokeWidth={1} color="#C9A84C" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
        <div className="absolute top-3 left-3">
          <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full backdrop-blur-sm"
            style={{ color: statusColor[recipe.status], background: `${statusColor[recipe.status]}22`, border: `1px solid ${statusColor[recipe.status]}50` }}>
            {recipe.status}
          </span>
        </div>
        <div className="absolute top-3 right-3 flex items-center gap-1 bg-black/50 backdrop-blur-sm rounded-md px-2 py-1 text-[11px] text-white/60">
          <Eye size={10} />{recipe.views}
        </div>
      </div>

      <div className="p-4">
        <div className="flex items-start justify-between gap-2 mb-2">
          <h3 className="font-heading text-[15px] font-bold text-text-primary leading-snug">{recipe.title}</h3>
          <span className="text-[11px] text-text-muted flex-shrink-0 flex items-center gap-1 mt-0.5">
            <Clock size={11} />{recipe.time}m
          </span>
        </div>
        <p className="text-[12px] text-text-muted leading-relaxed mb-3 line-clamp-2">{recipe.description}</p>
        <div className="flex flex-wrap gap-1.5 mb-3">
          {recipe.tags.slice(0, 3).map(t => (
            <span key={t} className="text-[10px] px-2 py-0.5 rounded-full bg-card-hover text-text-secondary border border-border">{t}</span>
          ))}
        </div>
        <div className="flex items-center justify-between pt-2.5 border-t border-border">
          <span className="text-[11px] font-semibold" style={{ color: diffColor[recipe.difficulty] }}>{recipe.difficulty}</span>
          <span className="text-[11px] text-text-muted">{recipe.category}</span>
          <StarRating value={recipe.rating} />
        </div>
      </div>

      <div className="flex gap-2 px-4 pb-3.5" onClick={e => e.stopPropagation()}>
        <button onClick={onView}
          className="flex-1 border border-border rounded-md py-1.5 text-[12px] text-text-secondary flex items-center justify-center gap-1.5 hover:border-gold/40 hover:text-gold transition-all">
          <Eye size={12} /> Ansehen
        </button>
        <button onClick={e => { e.stopPropagation(); onEdit(); }}
          className="border border-border rounded-md px-2.5 py-1.5 text-text-muted hover:border-gold/40 hover:text-gold transition-all"
          title="Bearbeiten">
          <Edit3 size={13} />
        </button>
        <button onClick={e => { e.stopPropagation(); onDelete(); }}
          className="border border-border rounded-md px-2.5 py-1.5 text-text-muted hover:border-red-500/40 hover:text-red-400 transition-all">
          <Trash2 size={13} />
        </button>
      </div>
    </div>
  );
}

// ─── RecipeDetail ─────────────────────────────────────────────────────────────
function RecipeDetail({ recipe, onClose, onDelete }: { recipe: Recipe; onClose: () => void; onDelete: () => void }) {
  return (
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

          {/* Zutaten */}
          {(recipe.zutaten ?? []).length > 0 && (
            <div className="mb-5">
              <div className={labelCls + ' flex items-center gap-1.5'}><Tag size={10} /> Zutaten</div>
              <div className="bg-card rounded-xl divide-y divide-border border border-border">
                {(recipe.zutaten ?? []).map((z, i) => (
                  <div key={i} className="flex justify-between px-4 py-2.5 text-sm">
                    <span className="text-text-primary">{z.name}</span>
                    <span className="text-text-muted">{z.menge}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Komponenten */}
          {(recipe.komponenten ?? []).length > 0 && (
            <div className="mb-5 space-y-3">
              <div className={labelCls}>Komponenten</div>
              {(recipe.komponenten ?? []).map((k, i) => (
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
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function RezeptePage() {
  const router = useRouter();
  const { getFilteredRecipes, searchQuery, setSearchQuery, filterCategory, setFilterCategory,
    filterStatus, setFilterStatus, deleteRecipe, fetchRecipes } = useStore();
  const [selected, setSelected] = useState<Recipe | null>(null);
  const filtered = getFilteredRecipes();

  useEffect(() => { fetchRecipes(); }, []);

  return (
    <PageTransition>
    <div style={{ background: 'var(--bg)', minHeight: '100vh' }}>
      {/* Header */}
      <div className="px-8 pt-8 pb-6 flex items-start justify-between gap-6"
        style={{ borderBottom: '1px solid var(--border)' }}>
        <div>
          <div className="text-[10px] font-semibold tracking-[4px] uppercase mb-2"
            style={{ color: 'rgba(107,58,75,0.55)' }}>✦ &nbsp;Deine Küche</div>
          <h1 className="font-heading font-bold leading-none"
            style={{ fontSize: 28, color: 'var(--text)', letterSpacing: '2px', textTransform: 'uppercase' }}>
            Rezeptarchiv
          </h1>
          <p className="mt-1.5" style={{ color: 'var(--text-muted)', fontSize: 13 }}>{filtered.length} Rezepte</p>
        </div>
        <div className="mt-1">
          <button onClick={() => router.push('/rezepte/neu')}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-[13px] font-semibold transition-all hover:opacity-90"
            style={{ background: 'linear-gradient(135deg, #562E3C, #7D4558)', color: '#FFFFFF' }}>
            <Plus size={15} /> Neues Rezept
          </button>
        </div>
      </div>
      <div className="p-8 max-w-[1400px]">

      {/* Filters */}
      <div className="bg-card border border-border rounded-xl px-5 py-4 mb-7 flex flex-wrap gap-4 items-center">
        <div className="relative flex-1 min-w-[220px]">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
          <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
            placeholder="Rezepte durchsuchen…"
            className="w-full bg-card-hover border border-border-strong rounded-lg pl-9 pr-3.5 py-2 text-text-primary text-[13px] outline-none focus:border-gold/40" />
        </div>
        <div className="flex flex-wrap gap-1.5">
          {categories.map(c => (
            <button key={c} onClick={() => setFilterCategory(c)}
              className="px-3.5 py-1.5 rounded-full text-[12px] font-medium transition-all"
              style={{
                background: filterCategory === c ? 'rgba(107,58,75,0.12)' : 'rgba(0,0,0,0.04)',
                border: `1px solid ${filterCategory === c ? 'rgba(107,58,75,0.3)' : 'rgba(0,0,0,0.08)'}`,
                color: filterCategory === c ? '#6B3A4B' : '#8B7355',
              }}>
              {c}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2 ml-auto">
          <Filter size={14} className="text-text-muted" />
          {statuses.map(s => (
            <button key={s} onClick={() => setFilterStatus(s)}
              className="px-3 py-1 rounded-full text-[11px] font-medium transition-all"
              style={{
                background: filterStatus === s ? 'rgba(107,58,75,0.12)' : 'transparent',
                border: `1px solid ${filterStatus === s ? 'rgba(107,58,75,0.3)' : 'rgba(0,0,0,0.08)'}`,
                color: filterStatus === s ? '#6B3A4B' : '#8B7355',
              }}>
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      {filtered.length > 0 ? (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-5">
          {filtered.map(r => (
            <RecipeCard key={r.id} recipe={r} onView={() => setSelected(r)} onDelete={() => deleteRecipe(r.id)} onEdit={() => router.push(`/rezepte/${r.id}/bearbeiten`)} />
          ))}
        </div>
      ) : (
        <EmptyState
          icon={
            <svg width="32" height="32" viewBox="0 0 48 48" fill="none">
              <path d="M24 13 C20 11 13 11 9 13 L9 37 C13 35 20 35 24 37 C28 35 35 35 39 37 L39 13 C35 11 28 11 24 13Z" fill="rgba(107,58,75,0.07)" stroke="#6B3A4B" strokeWidth="1.5"/>
              <line x1="24" y1="13" x2="24" y2="37" stroke="#6B3A4B" strokeWidth="1.4"/>
              <line x1="13" y1="19" x2="22" y2="19" stroke="#6B3A4B" strokeWidth="1" strokeOpacity="0.45"/>
              <line x1="13" y1="23" x2="22" y2="23" stroke="#6B3A4B" strokeWidth="1" strokeOpacity="0.45"/>
              <line x1="13" y1="27" x2="22" y2="27" stroke="#6B3A4B" strokeWidth="1" strokeOpacity="0.45"/>
              <line x1="26" y1="19" x2="35" y2="19" stroke="#6B3A4B" strokeWidth="1" strokeOpacity="0.45"/>
              <line x1="26" y1="23" x2="35" y2="23" stroke="#6B3A4B" strokeWidth="1" strokeOpacity="0.45"/>
              <line x1="26" y1="27" x2="35" y2="27" stroke="#6B3A4B" strokeWidth="1" strokeOpacity="0.45"/>
            </svg>
          }
          title="Dein Archiv ist bereit"
          subtitle="Dokumentiere deine ersten Kreationen."
          action={{ label: '+ Erstes Rezept erstellen', onClick: () => router.push('/rezepte/neu') }}
        />
      )}

      {selected && (
        <RecipeDetail
          recipe={selected}
          onClose={() => setSelected(null)}
          onDelete={() => deleteRecipe(selected.id)}
        />
      )}
    </div>
    </div>
    </PageTransition>
  );
}