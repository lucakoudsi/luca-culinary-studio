'use client';
import type { RecipeKomponente } from '@/types';
import { Plus, X, ChevronRight, Trash2 } from 'lucide-react';

const IC  = "w-full bg-card border border-border-strong rounded-lg px-3.5 py-2.5 text-text-primary text-sm outline-none focus:border-gold/40 transition-colors placeholder:text-text-muted";
const LC  = "block text-[10px] text-text-muted font-semibold mb-1.5 uppercase tracking-wider";
const ABT = "flex items-center gap-1.5 text-[12px] text-gold hover:text-gold-light transition-colors mt-3";

export default function KomponenteCard({
  k, ki, collapsed,
  onToggle, onRemove,
  onName, onZubereitung,
  onAddZutat, onRemoveZutat, onZutat,
}: {
  k: RecipeKomponente; ki: number; collapsed: boolean;
  onToggle: () => void; onRemove: () => void;
  onName: (v: string) => void; onZubereitung: (v: string) => void;
  onAddZutat: () => void; onRemoveZutat: (zi: number) => void;
  onZutat: (zi: number, fld: 'name' | 'menge', v: string) => void;
}) {
  return (
    <div className="border border-border rounded-xl overflow-hidden bg-card-hover">
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-3 cursor-pointer hover:bg-black/[0.02] transition-colors"
        onClick={onToggle}>
        <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 text-[10px] font-bold"
          style={{ background: 'rgba(107,58,75,0.1)', color: '#6B3A4B', border: '1px solid rgba(107,58,75,0.25)' }}>
          {ki + 1}
        </div>
        <span className="flex-1 text-[14px] text-text-primary font-medium truncate">
          {k.name || <span className="text-text-muted italic">Komponentenname…</span>}
        </span>
        {k.zutaten.length > 0 && (
          <span className="text-[11px] text-text-muted mr-1">{k.zutaten.length} Zutaten</span>
        )}
        <ChevronRight size={15} className="text-text-muted transition-transform flex-shrink-0"
          style={{ transform: collapsed ? 'rotate(0deg)' : 'rotate(90deg)' }} />
        <button onClick={e => { e.stopPropagation(); onRemove(); }}
          className="text-text-muted hover:text-red-400 transition-colors ml-1 flex-shrink-0">
          <Trash2 size={14} />
        </button>
      </div>

      {/* Body */}
      {!collapsed && (
        <div className="px-4 pb-4 pt-1 border-t border-border space-y-3">
          <div>
            <label className={LC}>Name der Komponente</label>
            <input value={k.name} onChange={e => onName(e.target.value)}
              placeholder="z.B. Carbonara Ball, Tonnarelli, Pecorino-Espuma…"
              className={IC} onClick={e => e.stopPropagation()} />
          </div>

          <div>
            <label className={LC}>Zutaten</label>
            <div className="space-y-2">
              {k.zutaten.map((z, zi) => (
                <div key={zi} className="flex gap-2">
                  <input value={z.name} onChange={e => onZutat(zi, 'name', e.target.value)}
                    placeholder="Zutat…" className={IC + ' flex-1'} />
                  <input value={z.menge} onChange={e => onZutat(zi, 'menge', e.target.value)}
                    placeholder="Menge" className={IC} style={{ width: 160 }} />
                  <button onClick={() => onRemoveZutat(zi)}
                    className="text-text-muted hover:text-red-400 transition-colors flex-shrink-0 self-center">
                    <X size={14} />
                  </button>
                </div>
              ))}
            </div>
            <button onClick={onAddZutat} className={ABT} style={{ fontSize: 11 }}>
              <Plus size={12} /> Zutat hinzufügen
            </button>
          </div>

          <div>
            <label className={LC}>Zubereitung</label>
            <textarea value={k.zubereitung} onChange={e => onZubereitung(e.target.value)}
              placeholder="Wie wird diese Komponente zubereitet…" rows={3}
              className={IC + ' resize-none leading-relaxed'} />
          </div>
        </div>
      )}
    </div>
  );
}
