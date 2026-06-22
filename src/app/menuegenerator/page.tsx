'use client';
import { useState } from 'react';
import { useStore } from '@/lib/store';
import { generateMenu } from '@/lib/mockAI';
import type { GeneratedMenu } from '@/types';
import { UtensilsCrossed, Sparkles, Save, Trash2, Wine, CheckCircle, Loader2, ChevronRight } from 'lucide-react';

const regionOptions = ['Deutschland', 'Frankreich', 'Italien', 'Spanien', 'Japan', 'Skandinavien', 'Österreich'];
const seasonOptions = ['Frühling', 'Sommer', 'Herbst', 'Winter'];
const styleOptions = ['Fine Dining', 'Klassisch', 'Modern', 'Fusion', 'Avantgarde', 'Vegetarisch'];

const courseTypeColors: Record<string, string> = {
  'Amuse-Bouche': '#7BB8D4', 'Kalte Vorspeise': '#7CB87A', 'Warme Vorspeise': '#7CB87A',
  'Vorspeise': '#7CB87A', 'Zwischengang': '#E8A838', 'Sorbet': '#7BB8D4',
  'Hauptgang': '#C9A84C', 'Käse': '#C4743A', 'Dessert': '#E8A838',
};

function MenuCard({ menu, onSave, onDelete }: { menu: GeneratedMenu; onSave: () => void; onDelete: () => void }) {
  const [wineOpen, setWineOpen] = useState(false);

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden">
      <div className="px-6 py-5 border-b border-border flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-[11px] px-2 py-0.5 rounded-full font-semibold"
              style={{ background: 'rgba(201,168,76,0.12)', color: '#C9A84C', border: '1px solid rgba(201,168,76,0.3)' }}>
              {menu.season}
            </span>
            <span className="text-[11px] px-2 py-0.5 rounded-full bg-card-hover text-text-secondary border border-border">{menu.style}</span>
            {menu.saved && (
              <span className="text-[11px] px-2 py-0.5 rounded-full font-semibold flex items-center gap-1"
                style={{ background: 'rgba(124,184,122,0.15)', color: '#7CB87A', border: '1px solid rgba(124,184,122,0.3)' }}>
                <CheckCircle size={10} />Gespeichert
              </span>
            )}
          </div>
          <h3 className="font-heading text-[19px] font-bold text-text-primary">{menu.name}</h3>
          <p className="text-[12px] text-text-muted mt-0.5">{menu.courses.length} Gänge · {menu.region}</p>
        </div>
        <div className="flex gap-1.5">
          {!menu.saved && (
            <button onClick={onSave} className="p-2 rounded-lg border border-border hover:border-gold/40 hover:text-gold text-text-muted transition-all">
              <Save size={15} />
            </button>
          )}
          <button onClick={onDelete} className="p-2 rounded-lg border border-border hover:border-red-500/40 hover:text-red-400 text-text-muted transition-all">
            <Trash2 size={15} />
          </button>
        </div>
      </div>

      {/* Courses */}
      <div className="px-6 py-4 space-y-3">
        {menu.courses.map((course) => {
          const color = courseTypeColors[course.type] || '#C9A84C';
          return (
            <div key={course.position} className="flex gap-4 items-start">
              <div className="flex-shrink-0 pt-0.5">
                <div className="w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold"
                  style={{ background: `${color}18`, color }}>
                  {course.position}
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-[10px] font-semibold uppercase tracking-wider" style={{ color }}>{course.type}</span>
                </div>
                <div className="font-heading text-[15px] font-bold text-text-primary leading-snug">{course.dish}</div>
                <div className="text-[12px] text-text-muted mt-0.5 leading-snug">{course.description}</div>
              </div>
              <div className="flex-shrink-0 text-right">
                <div className="text-[11px] font-semibold text-gold flex items-center gap-1 justify-end">
                  <Wine size={11} />{course.wine}
                </div>
                <div className="text-[10px] text-text-muted mt-0.5">{course.wineNote}</div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Overall note */}
      <div className="px-6 pb-5">
        <div className="bg-background rounded-lg p-4 border border-border">
          <div className="text-[11px] text-gold font-semibold uppercase tracking-widest mb-1.5">Menü-Dramatik</div>
          <p className="text-[12px] text-text-secondary leading-relaxed">{menu.overallNote}</p>
        </div>
      </div>
    </div>
  );
}

export default function MenuegeneratorPage() {
  const { generatedMenus, addGeneratedMenu, saveGeneratedMenu, deleteGeneratedMenu } = useStore();
  const [region, setRegion] = useState('Frankreich');
  const [season, setSeason] = useState('Herbst');
  const [style, setStyle] = useState('Fine Dining');
  const [courses, setCourses] = useState(5);
  const [loading, setLoading] = useState(false);

  const handleGenerate = async () => {
    setLoading(true);
    await new Promise(r => setTimeout(r, 2000));
    addGeneratedMenu(generateMenu({ region, season, style, courses }));
    setLoading(false);
  };

  return (
    <div style={{ background: '#0A0A0A', minHeight: '100vh' }}>
      <div className="px-8 pt-8 pb-6" style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
        <div className="text-[10px] font-semibold tracking-[4px] uppercase mb-2" style={{ color: 'rgba(201,168,76,0.55)' }}>✦ &nbsp;Menüplanung</div>
        <h1 className="font-heading font-bold leading-none" style={{ fontSize: 28, color: '#F5F0E8', letterSpacing: '2px', textTransform: 'uppercase' }}>Menügenerator</h1>
        <p className="mt-1.5" style={{ color: 'rgba(168,152,128,0.65)', fontSize: 13 }}>Erstelle vollständige Menüs mit Spannungsbogen und Weinbegleitung.</p>
      </div>
      <div className="p-8 max-w-[1200px]">

      <div className="grid grid-cols-[340px_1fr] gap-8">
        {/* Input */}
        <div className="space-y-5">
          <div className="bg-card border border-border rounded-xl p-5 space-y-5">
            <div className="text-[12px] text-text-muted font-semibold uppercase tracking-widest">Menü-Parameter</div>

            <div>
              <label className="block text-[12px] text-text-secondary font-semibold mb-2 uppercase tracking-wider">Region</label>
              <div className="grid grid-cols-2 gap-2">
                {regionOptions.map(r => (
                  <button key={r} onClick={() => setRegion(r)}
                    className="px-2.5 py-2 rounded-lg text-[12px] font-medium transition-all text-center"
                    style={{
                      background: region === r ? 'rgba(201,168,76,0.15)' : 'rgba(255,255,255,0.04)',
                      border: `1px solid ${region === r ? 'rgba(201,168,76,0.4)' : 'rgba(255,255,255,0.08)'}`,
                      color: region === r ? '#C9A84C' : '#A89880',
                    }}>
                    {r}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-[12px] text-text-secondary font-semibold mb-2 uppercase tracking-wider">Saison</label>
              <div className="grid grid-cols-2 gap-2">
                {seasonOptions.map(s => (
                  <button key={s} onClick={() => setSeason(s)}
                    className="px-2.5 py-2 rounded-lg text-[12px] font-medium transition-all text-center"
                    style={{
                      background: season === s ? 'rgba(201,168,76,0.15)' : 'rgba(255,255,255,0.04)',
                      border: `1px solid ${season === s ? 'rgba(201,168,76,0.4)' : 'rgba(255,255,255,0.08)'}`,
                      color: season === s ? '#C9A84C' : '#A89880',
                    }}>
                    {s}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-[12px] text-text-secondary font-semibold mb-2 uppercase tracking-wider">Stil</label>
              <div className="grid grid-cols-2 gap-2">
                {styleOptions.map(s => (
                  <button key={s} onClick={() => setStyle(s)}
                    className="px-2.5 py-2 rounded-lg text-[12px] font-medium transition-all text-center"
                    style={{
                      background: style === s ? 'rgba(201,168,76,0.15)' : 'rgba(255,255,255,0.04)',
                      border: `1px solid ${style === s ? 'rgba(201,168,76,0.4)' : 'rgba(255,255,255,0.08)'}`,
                      color: style === s ? '#C9A84C' : '#A89880',
                    }}>
                    {s}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-[12px] text-text-secondary font-semibold mb-2 uppercase tracking-wider">
                Anzahl Gänge: <span className="text-gold">{courses}</span>
              </label>
              <input type="range" min={3} max={7} value={courses} onChange={e => setCourses(+e.target.value)}
                className="w-full accent-gold h-1.5 rounded-full cursor-pointer" />
              <div className="flex justify-between text-[10px] text-text-muted mt-1">
                <span>3 Gänge</span><span>5 Gänge</span><span>7 Gänge</span>
              </div>
            </div>

            <button onClick={handleGenerate} disabled={loading}
              className="w-full py-3 rounded-lg font-semibold text-[14px] flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ background: 'linear-gradient(135deg, #9A7A30, #E2C06A)', color: '#0A0A0A' }}>
              {loading ? <><Loader2 size={17} className="animate-spin" /> Menü wird komponiert…</> : <><Sparkles size={17} /> Menü generieren</>}
            </button>
          </div>

          <div className="bg-card border border-border rounded-xl p-5">
            <div className="text-[12px] text-text-muted font-semibold uppercase tracking-widest mb-3">Menüstruktur</div>
            <div className="space-y-2">
              {[
                { n: '3', label: 'Klassisches Menü', desc: 'Vorspeise · Hauptgang · Dessert' },
                { n: '5', label: 'Gehobenes Menü', desc: '+ Amuse-Bouche & Zwischengang' },
                { n: '7', label: 'Großes Degustationsmenü', desc: '+ Sorbet, Käse & Präludien' },
              ].map(i => (
                <div key={i.n} className="flex gap-2.5 text-[12px]">
                  <span className="text-gold font-bold w-4">{i.n}</span>
                  <div>
                    <div className="text-text-secondary font-medium">{i.label}</div>
                    <div className="text-text-muted text-[11px]">{i.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Results */}
        <div>
          {generatedMenus.length === 0 ? (
            <div className="h-full min-h-[500px] flex flex-col items-center justify-center text-center border border-dashed border-border rounded-xl p-12">
              <div className="w-16 h-16 rounded-xl flex items-center justify-center mb-5"
                style={{ background: 'rgba(201,168,76,0.1)', border: '1px solid rgba(201,168,76,0.25)' }}>
                <UtensilsCrossed size={28} color="#C9A84C" strokeWidth={1.5} />
              </div>
              <h3 className="font-heading text-xl font-bold text-text-primary mb-2">Bereit für dein erstes Menü</h3>
              <p className="text-text-secondary text-[13px] max-w-xs leading-relaxed">
                Wähle Region, Saison und Stil – in Sekunden entsteht ein vollständiges Menü mit passendem Weinbegleitvorschlag.
              </p>
            </div>
          ) : (
            <div className="space-y-5">
              <div className="flex justify-between items-center">
                <span className="text-[13px] text-text-secondary">{generatedMenus.length} Menü{generatedMenus.length !== 1 ? 's' : ''}</span>
                <span className="text-[12px] text-text-muted">{generatedMenus.filter(m => m.saved).length} gespeichert</span>
              </div>
              {generatedMenus.map(m => (
                <MenuCard key={m.id} menu={m} onSave={() => saveGeneratedMenu(m.id)} onDelete={() => deleteGeneratedMenu(m.id)} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
    </div>
  );
}
