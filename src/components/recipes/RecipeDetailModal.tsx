'use client';
import Link from 'next/link';
import type { Recipe } from '@/types';
import { BookOpen, X } from 'lucide-react';
import type { Wein } from '@/lib/weinPairing';

// TYP_COLOR/TYP_LABELS werden intern nicht mehr gebraucht (Wein-Pairing ist
// mit Etappe 3 aus dem Overlay raus, siehe unten) -- bleiben aber exportiert,
// weil MenuEditorModal.tsx UND rezepte/[id]/page.tsx sie von hier
// importieren. Nicht verschieben ohne beide Importstellen anzupassen.
export const TYP_COLOR: Record<Wein['typ'], string> = {
  weiss: '#9B6E1A', rot: '#C04040', rose: '#C06080', schaumwein: '#3A80A8', suesswein: '#8B4A9B',
};
export const TYP_LABELS: Record<Wein['typ'], string> = {
  weiss: 'Weißwein', rot: 'Rotwein', rose: 'Rosé', schaumwein: 'Schaumwein', suesswein: 'Süßwein',
};

export const diffColor:   Record<string, string> = { Leicht: '#7CB87A', Mittel: '#E8A838', Schwer: '#E06B6B' };
export const statusColor: Record<string, string> = { Fertig: '#7CB87A', 'In Bearbeitung': '#E8A838', Entwurf: '#7BB8D4' };

/** Schnellblick auf ein Rezept (Etappe 3) -- Bild, Titel, Status/Kategorie,
 * Beschreibungssatz, die drei Kennzahlen, ein Knopf zur Detailseite
 * (/rezepte/[id]). Alles Weitere (Zutaten, Komponenten, Zubereitung,
 * Wein-Pairing, Naehrwerte, Chef-Tipps, Tags, Projekte, Bewertung,
 * Loeschen, Portionsrechner) steht dort -- gegengeprueft, nichts davon
 * wird durchs Eindampfen unerreichbar.
 *
 * Kein lokaler State mehr noetig (keine Interaktion ausser Schliessen/
 * Weiterklicken) -- deshalb kein useState/useEffect/useStore mehr hier. */
export default function RecipeDetailModal({ recipe, onClose }: { recipe: Recipe; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-6" onClick={onClose}>
      {/* Hoehenbudget rechnerisch gegen die eigene p-6-Polsterung des
       * aeusseren Containers (2x24px), nicht gegen einen nackten vh-Wert --
       * garantiert unabhaengig von der Viewport-Hoehe, dass das Panel in
       * den tatsaechlich verfuegbaren Platz passt (siehe Analyse: die alte
       * Fassung mass max-h-[88vh] gegen den Viewport, das p-6 gehoerte ihm
       * nicht, items-center verteilte den Ueberstand nach oben UND unten,
       * aussen scrollt niemand -- das Panel war oben abgeschnitten). */}
      <div className="bg-surface border border-border-strong rounded-2xl w-full max-w-2xl overflow-y-auto"
        style={{ maxHeight: 'min(90vh, calc(100vh - 48px))' }}
        onClick={e => e.stopPropagation()}>
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
          {recipe.description && (
            <p className="text-[14px] text-text-secondary leading-relaxed mb-5">{recipe.description}</p>
          )}

          <div className="grid grid-cols-3 gap-3 mb-6">
            {[
              { label: 'Schwierigkeit', value: recipe.difficulty, color: diffColor[recipe.difficulty] },
              { label: 'Zeit', value: `${recipe.time} Min` },
              { label: 'Saison', value: recipe.season },
            ].map(item => (
              <div key={item.label} className="bg-card rounded-lg p-3 text-center border border-border">
                <div className="text-[10px] text-text-muted mb-1 uppercase tracking-wider">{item.label}</div>
                {/* var(--text) statt fix #2C2420 -- der feste Wert ist
                 * zufaellig exakt der Light-Mode-Textwert, im Dark Mode
                 * waere "Zeit"/"Saison" (kein diffColor-Eintrag) fast
                 * unsichtbar gewesen (dunkler Text auf dunkler Karte).
                 * Gleicher Fix, den die Detailseite an derselben Stelle
                 * schon hat (rezepte/[id]/page.tsx). */}
                <div className="text-[14px] font-semibold" style={{ color: item.color || 'var(--text)' }}>{item.value}</div>
              </div>
            ))}
          </div>

          <Link href={`/rezepte/${recipe.id}`} onClick={onClose}
            className="flex items-center justify-center w-full px-4 py-3 rounded-xl text-[13px] font-semibold transition-all hover:opacity-90"
            style={{ background: 'linear-gradient(135deg, #562E3C, #7D4558)', color: '#FFFFFF' }}>
            Rezept öffnen
          </Link>
        </div>
      </div>
    </div>
  );
}
