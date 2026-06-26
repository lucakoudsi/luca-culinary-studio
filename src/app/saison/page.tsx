'use client';
import PageTransition from '@/components/ui/PageTransition';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Leaf, ChevronLeft } from 'lucide-react';

const MONTH_NAMES_DE = ['Januar','Februar','März','April','Mai','Juni','Juli','August','September','Oktober','November','Dezember'];
const MONTH_TO_SEASON: Record<number, string> = {
  0: 'Winter', 1: 'Winter',  2: 'Frühling', 3: 'Frühling',
  4: 'Frühling', 5: 'Sommer', 6: 'Sommer',  7: 'Sommer',
  8: 'Herbst',  9: 'Herbst', 10: 'Herbst',  11: 'Winter',
};
const SEASON_COLORS: Record<string, string> = {
  Frühling: '#7CB87A', Sommer: '#E8A838', Herbst: '#C4743A', Winter: '#7BB8D4', Ganzjährig: '#A89880',
};

type Zutat = {
  id: number;
  name: string;
  kategorie: string;
  saison: string[] | string | null;
  image_url: string | null;
  beschreibung: string | null;
};

const SEASON_TABS = ['Alle', 'Frühling', 'Sommer', 'Herbst', 'Winter', 'Ganzjährig'];

export default function SaisonPage() {
  const now = new Date();
  const month = now.getMonth();
  const currentMonth = MONTH_NAMES_DE[month];
  const currentSeason = MONTH_TO_SEASON[month];

  const [all, setAll]         = useState<Zutat[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter]   = useState<string>(currentSeason);

  useEffect(() => {
    fetch('/api/zutaten')
      .then(r => r.json())
      .then((items: Zutat[]) => {
        // Show only items that have at least one season assigned
        setAll(items.filter(z => {
          const arr = Array.isArray(z.saison) ? z.saison : (z.saison ? [String(z.saison)] : []);
          return arr.length > 0;
        }));
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const filtered = filter === 'Alle'
    ? all
    : all.filter(z => {
        const arr = Array.isArray(z.saison) ? z.saison : (z.saison ? [String(z.saison)] : []);
        return arr.includes(filter);
      });

  // Group by kategorie
  const groups: Record<string, Zutat[]> = {};
  filtered.forEach(z => {
    const k = z.kategorie || 'Sonstige';
    if (!groups[k]) groups[k] = [];
    groups[k].push(z);
  });
  const sortedGroups = Object.entries(groups).sort((a, b) => b[1].length - a[1].length);

  return (
    <PageTransition>
    <div style={{ background: 'var(--bg)', minHeight: '100vh' }}>

      {/* Header */}
      <div className="px-4 sm:px-8 pt-6 sm:pt-8 pb-6" style={{ borderBottom: '1px solid var(--border)' }}>
        <div className="text-[10px] font-semibold tracking-[4px] uppercase mb-2" style={{ color: 'rgba(107,58,75,0.55)' }}>
          ✦ &nbsp;Saisonkalender
        </div>
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="font-heading font-bold leading-none"
              style={{ fontSize: 'clamp(20px, 3.5vw, 30px)', color: 'var(--text)', letterSpacing: '3px', textTransform: 'uppercase' }}>
              Saison im {currentMonth}
            </h1>
            <p className="mt-2 text-[13px]" style={{ color: 'var(--text-muted)' }}>
              {filtered.length} Zutaten {filter === 'Alle' ? 'mit Saisonzuordnung' : `— ${filter}`}
            </p>
          </div>
          <Link href="/" className="flex items-center gap-1.5 text-[12px] font-medium mt-1"
            style={{ color: '#6B3A4B', flexShrink: 0 }}>
            <ChevronLeft size={14} /> Dashboard
          </Link>
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2 mt-5 flex-wrap">
          {SEASON_TABS.map(f => {
            const color = SEASON_COLORS[f] ?? '#6B3A4B';
            const active = filter === f;
            return (
              <button key={f} onClick={() => setFilter(f)}
                className="px-4 py-1.5 rounded-full text-[11px] font-semibold transition-all"
                style={{
                  background: active ? color : 'var(--surface-2)',
                  color:      active ? '#FFFFFF' : 'var(--text-muted)',
                  border:     active ? `1px solid ${color}` : '1px solid var(--border)',
                }}>
                {f === currentSeason ? `${f} (jetzt)` : f}
              </button>
            );
          })}
        </div>
      </div>

      {/* Content */}
      <div className="px-4 sm:px-8 py-8">
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="rounded-2xl animate-pulse"
                style={{ height: 180, background: 'var(--surface-2)', border: '1px solid var(--border)' }} />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20">
            <Leaf size={36} style={{ color: '#C0B5A8', margin: '0 auto 12px' }} />
            <p style={{ color: 'var(--text-muted)', fontSize: 15 }}>
              Keine Zutaten für diese Saison gefunden.
            </p>
            <button onClick={() => setFilter('Alle')} className="mt-4 text-[13px] font-medium"
              style={{ color: '#6B3A4B' }}>Alle anzeigen →</button>
          </div>
        ) : (
          <div className="space-y-10">
            {sortedGroups.map(([kat, items]) => (
              <div key={kat}>
                <div className="flex items-center gap-3 mb-5">
                  <span className="text-[10px] font-semibold tracking-[3px] uppercase"
                    style={{ color: 'rgba(107,58,75,0.65)' }}>
                    {kat}
                  </span>
                  <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
                  <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>{items.length}</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                  {items.map(z => {
                    const saisonArr = Array.isArray(z.saison) ? z.saison : (z.saison ? [String(z.saison)] : []);
                    const primarySeason = saisonArr[0];
                    const seasonColor = SEASON_COLORS[primarySeason ?? ''] ?? '#A89880';
                    return (
                      <div key={z.id}
                        className="rounded-2xl overflow-hidden bg-card border border-border card-hover cursor-default">
                        <div style={{ height: 110, background: 'var(--surface-2)', overflow: 'hidden' }}>
                          {z.image_url ? (
                            <img src={z.image_url} alt={z.name}
                              style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <span style={{ fontSize: 32 }}>🌿</span>
                            </div>
                          )}
                        </div>
                        <div className="p-3">
                          <div className="font-semibold text-[13px] leading-tight mb-1.5"
                            style={{ color: 'var(--text)' }}>{z.name}</div>
                          <div className="flex flex-wrap gap-1 mb-1.5">
                            {saisonArr.map(s => (
                              <span key={s} className="text-[9px] px-1.5 py-0.5 rounded-full font-semibold"
                                style={{
                                  background: `${SEASON_COLORS[s] ?? '#A89880'}18`,
                                  color: SEASON_COLORS[s] ?? '#A89880',
                                  border: `1px solid ${SEASON_COLORS[s] ?? '#A89880'}35`,
                                }}>
                                {s}
                              </span>
                            ))}
                          </div>
                          {z.beschreibung && (
                            <p className="text-[11px] leading-snug line-clamp-2"
                              style={{ color: 'var(--text-muted)' }}>
                              {z.beschreibung}
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
    </PageTransition>
  );
}
