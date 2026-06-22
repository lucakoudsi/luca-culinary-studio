'use client';
import { useState, useEffect } from 'react';
import { useStore } from '@/lib/store';
import { Palette, Download, RefreshCw, Loader2, CheckCircle, BookOpen } from 'lucide-react';

const styles = ['Klassisch', 'Modern', 'Avantgarde'] as const;
type Style = typeof styles[number];

const styleColors: Record<Style, string> = {
  Klassisch: '#C9A84C',
  Modern: '#7BB8D4',
  Avantgarde: '#E06B6B',
};

const styleDescriptions: Record<Style, string> = {
  Klassisch: 'Symmetrisch, elegant, zeitlos. Zentrale Hauptkomponente, kreisförmige Sauce, klassische Garnitur.',
  Modern: 'Asymmetrisch, kontrastreich. Lineare Elemente, Texturspiel, minimalistische Präsenz auf hellem Teller.',
  Avantgarde: 'Dekonstruiert, experimentell. Essbare Erde, Nitrostickstoff-Elemente, unerwartete Geometrien.',
};

const variantDescriptions: Record<Style, string[]> = {
  Klassisch: [
    'Zentrales Protein, Sauce kreisförmig mit dem Löffel gezogen, Garnitur symmetrisch auf 12 und 6 Uhr.',
    'Hauptkomponente rechts, Beilagen links gestapelt, Kräuteröl in feinen Tropfen um das Protein.',
    'Drei-Punkt-Komposition, jede Komponente klar getrennt, feine Microgreens als klassisches Décor.',
  ],
  Modern: [
    'Diagonale Linie aus Pürée, Protein off-center oben rechts, Microgreens als texturaler Kontrast.',
    'Saucen-Swoosh links gezogen, Protein in der Mitte, drei identische Garnitur-Punkte in Linie.',
    'Strukturpürée als Sockel, luftige Mousse als Finish, Gel-Punkte als reduzierter Akzent.',
  ],
  Avantgarde: [
    'Zerstäubte Sauce-Drops mit Airbrush, Protein in drei Medaillons portioniert, essbare Erde als Basis.',
    'Schiefertafel, lineare Cracker-Elemente, Cryo-gefrorener Schaum, zerbrochene Glasur.',
    'Glas-Teller, durchsichtige Gelee-Schicht mit eingesetzten Kräutern, schwebende Garnitur.',
  ],
};

function PlatingVariant({ index, style, generated, onSave, saved }: {
  index: number; style: Style; generated: boolean; onSave: () => void; saved: boolean;
}) {
  const color = styleColors[style];
  const desc = variantDescriptions[style][index];

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden flex flex-col">
      <div className="relative" style={{ aspectRatio: '4/3', background: 'linear-gradient(135deg, #0d0d0d 0%, #1a1500 50%, #0a0a0a 100%)' }}>
        <div className="absolute inset-0 flex items-center justify-center">
          {generated ? (
            <div className="w-full h-full relative flex items-center justify-center">
              <div className="w-36 h-36 rounded-full border opacity-10 absolute" style={{ borderColor: color }} />
              <div className="w-20 h-20 rounded-full flex items-center justify-center"
                style={{ background: `${color}12`, border: `1px solid ${color}30` }}>
                <Palette size={30} style={{ color }} strokeWidth={1} />
              </div>
              {index === 0 && (
                <div className="absolute bottom-1/3 left-1/4 w-20 h-0.5 rounded-full opacity-25" style={{ background: color }} />
              )}
              {index === 1 && (<>
                <div className="absolute top-1/4 right-1/4 w-8 h-8 rounded-full border opacity-20" style={{ borderColor: color }} />
                <div className="absolute bottom-1/4 left-1/3 w-4 h-4 rounded-full border opacity-15" style={{ borderColor: color }} />
              </>)}
              {index === 2 && (<>
                <div className="absolute top-1/3 left-1/3 w-2 h-2 rounded-full opacity-50" style={{ background: color }} />
                <div className="absolute bottom-1/3 right-1/3 w-3 h-3 rounded-full opacity-35" style={{ background: color }} />
                <div className="absolute top-1/2 right-1/4 w-1.5 h-1.5 rounded-full opacity-25" style={{ background: color }} />
              </>)}
            </div>
          ) : (
            <div className="text-center">
              <Palette size={36} className="text-text-muted opacity-15 mx-auto" strokeWidth={1} />
              <p className="text-[11px] text-text-muted mt-2 opacity-30">Variante {index + 1}</p>
            </div>
          )}
        </div>

        <div className="absolute top-3 left-3">
          <span className="text-[11px] px-2.5 py-1 rounded-full font-semibold"
            style={{ background: `${color}20`, color, border: `1px solid ${color}40` }}>
            Variante {index + 1}
          </span>
        </div>

        {saved && (
          <div className="absolute top-3 right-3 flex items-center gap-1 text-[11px] px-2.5 py-1 rounded-full font-semibold"
            style={{ background: 'rgba(124,184,122,0.2)', color: '#7CB87A', border: '1px solid rgba(124,184,122,0.4)' }}>
            <CheckCircle size={11} /> Gespeichert
          </div>
        )}
      </div>

      <div className="p-4 flex-1 flex flex-col">
        {generated ? (
          <>
            <p className="text-[12px] text-text-secondary leading-relaxed mb-4 flex-1">{desc}</p>
            <button onClick={onSave} disabled={saved}
              className="w-full py-2 rounded-lg text-[12px] font-semibold flex items-center justify-center gap-2 transition-all hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed"
              style={{ background: 'rgba(201,168,76,0.1)', color: '#C9A84C', border: '1px solid rgba(201,168,76,0.3)' }}>
              <Download size={13} /> {saved ? 'Gespeichert' : 'Bild speichern'}
            </button>
          </>
        ) : (
          <p className="text-[12px] text-text-muted text-center py-2 italic">Generiere Varianten für die Vorschau</p>
        )}
      </div>
    </div>
  );
}

export default function TellerdesignerPage() {
  const { recipes, fetchRecipes } = useStore();
  const [selectedId, setSelectedId] = useState<number>(0);
  const [style, setStyle] = useState<Style>('Modern');
  const [generated, setGenerated] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingRecipes, setLoadingRecipes] = useState(true);
  const [saved, setSaved] = useState<number[]>([]);

  useEffect(() => {
    const load = async () => {
      try { await fetchRecipes(); } catch {}
      setLoadingRecipes(false);
    };
    load();
  }, []);

  useEffect(() => {
    if (recipes.length > 0 && !selectedId) setSelectedId(recipes[0].id);
  }, [recipes]);

  const handleGenerate = async () => {
    if (!selectedId) return;
    setLoading(true);
    setGenerated(false);
    setSaved([]);
    await new Promise(r => setTimeout(r, 1600));
    setGenerated(true);
    setLoading(false);
  };

  if (loadingRecipes) {
    return (
      <div style={{ background: '#0A0A0A', minHeight: '100vh' }} className="flex items-center justify-center">
        <Loader2 size={24} className="animate-spin" style={{ color: '#C9A84C' }} />
      </div>
    );
  }

  return (
    <div style={{ background: '#0A0A0A', minHeight: '100vh' }}>
      <div className="px-8 pt-8 pb-6" style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
        <div className="text-[10px] font-semibold tracking-[4px] uppercase mb-2" style={{ color: 'rgba(201,168,76,0.55)' }}>✦ &nbsp;Tellergestaltung</div>
        <h1 className="font-heading font-bold leading-none" style={{ fontSize: 28, color: '#F5F0E8', letterSpacing: '2px', textTransform: 'uppercase' }}>Tellerdesigner</h1>
        <p className="mt-1.5" style={{ color: 'rgba(168,152,128,0.65)', fontSize: 13 }}>Wähle Rezept und Stil – erhalte 3 Anrichte-Varianten</p>
      </div>
      <div className="p-8 max-w-[1400px]">

      {recipes.length === 0 ? (
        <div className="text-center py-24 border border-dashed border-border rounded-xl">
          <div className="w-16 h-16 rounded-xl mx-auto mb-4 flex items-center justify-center"
            style={{ background: 'rgba(201,168,76,0.1)', border: '1px solid rgba(201,168,76,0.25)' }}>
            <BookOpen size={28} color="#C9A84C" strokeWidth={1.5} />
          </div>
          <p className="font-heading text-xl mb-2" style={{ color: '#F5F0E8' }}>Noch keine Rezepte vorhanden</p>
          <p className="text-[13px]" style={{ color: 'rgba(168,152,128,0.65)' }}>
            Erstelle zuerst ein Rezept im Rezeptarchiv.
          </p>
          <a href="/rezepte/neu"
            className="inline-flex items-center gap-2 mt-6 px-6 py-2.5 rounded-xl text-[13px] font-semibold"
            style={{ background: 'rgba(201,168,76,0.1)', color: '#C9A84C', border: '1px solid rgba(201,168,76,0.3)' }}>
            → Rezept erstellen
          </a>
        </div>
      ) : (<>

      <div className="bg-card border border-border rounded-xl p-5 mb-7">
        <div className="flex flex-wrap gap-6 items-end">
          <div className="flex-1 min-w-[200px]">
            <label className="block text-[11px] text-text-muted font-semibold uppercase tracking-widest mb-2">Rezept auswählen</label>
            <select
              value={selectedId}
              onChange={e => { setSelectedId(Number(e.target.value)); setGenerated(false); }}
              className="w-full bg-background border border-border-strong rounded-lg px-3.5 py-2.5 text-text-primary text-[13px] outline-none focus:border-gold/40 cursor-pointer">
              {recipes.map(r => <option key={r.id} value={r.id}>{r.title}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-[11px] text-text-muted font-semibold uppercase tracking-widest mb-2">Anrichtestil</label>
            <div className="flex gap-2">
              {styles.map(s => (
                <button key={s} onClick={() => { setStyle(s); setGenerated(false); }}
                  className="px-4 py-2 rounded-lg text-[12px] font-medium transition-all"
                  style={{
                    background: style === s ? `${styleColors[s]}18` : 'rgba(255,255,255,0.04)',
                    border: `1px solid ${style === s ? styleColors[s] + '45' : 'rgba(255,255,255,0.08)'}`,
                    color: style === s ? styleColors[s] : '#A89880',
                  }}>
                  {s}
                </button>
              ))}
            </div>
          </div>

          <button onClick={handleGenerate} disabled={loading || !selectedId}
            className="px-6 py-2.5 rounded-lg font-semibold text-[14px] flex items-center gap-2 transition-all disabled:opacity-50 flex-shrink-0"
            style={{ background: 'linear-gradient(135deg, #9A7A30, #E2C06A)', color: '#0A0A0A' }}>
            {loading
              ? <><Loader2 size={16} className="animate-spin" /> Generiere…</>
              : <><RefreshCw size={16} /> Generieren</>}
          </button>
        </div>

        <div className="mt-4 pt-4 border-t border-border text-[12px] text-text-secondary">
          <span className="font-semibold" style={{ color: styleColors[style] }}>{style}: </span>
          {styleDescriptions[style]}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-5">
        {([0, 1, 2] as const).map(i => (
          <PlatingVariant
            key={i}
            index={i}
            style={style}
            generated={generated}
            saved={saved.includes(i)}
            onSave={() => setSaved(prev => [...prev, i])}
          />
        ))}
      </div>
      </>)}
    </div>
    </div>
  );
}
