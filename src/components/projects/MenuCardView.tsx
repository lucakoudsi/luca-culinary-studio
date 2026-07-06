'use client';
import type { ProjectMenu, Recipe } from '@/types';
import { X } from 'lucide-react';

export default function MenuCardView({ menu, recipes, onClose }: { menu: ProjectMenu; recipes: Recipe[]; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-6" onClick={onClose}>
      <div className="bg-surface border border-border-strong rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto relative" onClick={e => e.stopPropagation()}>
        <button onClick={onClose} className="absolute top-5 right-5 text-text-secondary hover:text-text-primary transition-colors">
          <X size={18} />
        </button>

        <div className="px-10 sm:px-14 py-12 text-center">
          <div className="text-[10px] font-semibold tracking-[5px] uppercase text-gold mb-4">✦ Menü ✦</div>
          <h2 className="font-heading font-bold text-text-primary leading-tight" style={{ fontSize: 30 }}>{menu.name}</h2>
          {menu.beschreibung && (
            <p className="text-[13px] text-text-muted italic mt-3 leading-relaxed max-w-sm mx-auto">{menu.beschreibung}</p>
          )}

          <div className="w-16 h-px mx-auto my-8" style={{ background: 'linear-gradient(90deg, transparent, #C9A84C, transparent)' }} />

          {menu.gaenge.length === 0 ? (
            <p className="text-[13px] text-text-muted italic">Noch keine Gänge komponiert.</p>
          ) : (
            <div className="space-y-7">
              {menu.gaenge.map(g => {
                const recipe = recipes.find(r => r.id === g.rezeptId) ?? null;
                return (
                  <div key={g.id}>
                    <div className="text-[10px] font-semibold tracking-[3px] uppercase mb-1.5" style={{ color: 'rgba(107,58,75,0.55)' }}>
                      {g.bezeichnung}
                    </div>
                    <div className="font-heading text-text-primary" style={{ fontSize: 19 }}>
                      {recipe ? recipe.title : '—'}
                    </div>
                    {g.weinName && (
                      <div className="text-[13px] text-text-muted italic mt-1.5">{g.weinName}</div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          <div className="w-16 h-px mx-auto my-8" style={{ background: 'linear-gradient(90deg, transparent, #C9A84C, transparent)' }} />
          <div className="text-[10px] tracking-[3px] uppercase" style={{ color: 'rgba(107,58,75,0.4)' }}>LUCA Culinary Studio</div>
        </div>
      </div>
    </div>
  );
}
