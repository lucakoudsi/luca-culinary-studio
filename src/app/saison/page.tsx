'use client';
import PageTransition from '@/components/ui/PageTransition';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Leaf, ChevronLeft } from 'lucide-react';

const MONTH_NAMES_DE = ['Januar','Februar','März','April','Mai','Juni','Juli','August','September','Oktober','November','Dezember'];
const SEASON_MONTHS: Record<string, number[]> = {
  'Frühling': [2,3,4], 'Frühsommer': [4,5,6], 'Sommer': [5,6,7],
  'Spätsommer': [6,7,8], 'Herbst': [8,9,10], 'Winter': [11,0,1],
};

function isSaisonal(saison: string | null | undefined, month: number): boolean {
  if (!saison) return false;
  const s = saison.toLowerCase();
  if (s.includes(MONTH_NAMES_DE[month].toLowerCase())) return true;
  for (const [season, months] of Object.entries(SEASON_MONTHS)) {
    if (s.includes(season.toLowerCase()) && months.includes(month)) return true;
  }
  return false;
}

type Zutat = {
  id: number;
  name: string;
  kategorie: string;
  saison: string | null;
  image_url: string | null;
  beschreibung: string | null;
};

type FilterType = 'Alle' | 'Hauptsaison' | 'Beginn' | 'Ausklang';

const FILTER_OPTS: FilterType[] = ['Alle', 'Hauptsaison', 'Beginn', 'Ausklang'];
const FILTER_COLORS: Record<FilterType, string> = {
  'Alle':       '#6B3A4B',
  'Hauptsaison':'#7CB87A',
  'Beginn':     '#C9A84C',
  'Ausklang':   '#9A8070',
};

export default function SaisonPage() {
  const month = new Date().getMonth();
  const currentMonth = MONTH_NAMES_DE[month];

  const [all, setAll]         = useState<Zutat[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter]   = useState<FilterType>('Alle');

  useEffect(() => {
    fetch('/api/zutaten')
      .then(r => r.json())
      .then((items: Zutat[]) => {
        setAll(items.filter(z => isSaisonal(z.saison, month)));
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [month]);

  const filtered = filter === 'Alle'
    ? all
    : all.filter(z => z.saison?.toLowerCase().includes(filter.toLowerCase()));

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
              {all.length} saisonale Zutaten diesen Monat
            </p>
          </div>
          <Link href="/" className="flex items-center gap-1.5 text-[12px] font-medium mt-1"
            style={{ color: '#6B3A4B', flexShrink: 0 }}>
            <ChevronLeft size={14} /> Dashboard
          </Link>
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2 mt-5 flex-wrap">
          {FILTER_OPTS.map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className="px-4 py-1.5 rounded-full text-[11px] font-semibold transition-all"
              style={{
                background: filter === f ? FILTER_COLORS[f] : 'var(--surface-2)',
                color:      filter === f ? '#FFFFFF'         : 'var(--text-muted)',
                border:     filter === f ? `1px solid ${FILTER_COLORS[f]}` : '1px solid var(--border)',
              }}>
              {f}
            </button>
          ))}
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
              Keine Zutaten für diesen Filter gefunden.
            </p>
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
                  {items.map(z => (
                    <div key={z.id}
                      className="rounded-2xl overflow-hidden bg-card border border-border card-hover cursor-default">
                      {/* Image */}
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
                      {/* Info */}
                      <div className="p-3">
                        <div className="font-semibold text-[13px] leading-tight mb-1.5"
                          style={{ color: 'var(--text)' }}>{z.name}</div>
                        {z.saison && (
                          <div className="inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-semibold"
                            style={{ background: 'rgba(124,184,122,0.12)', color: '#5A9A58', border: '1px solid rgba(124,184,122,0.25)' }}>
                            {z.saison.length > 24 ? z.saison.slice(0, 24) + '…' : z.saison}
                          </div>
                        )}
                        {z.beschreibung && (
                          <p className="mt-1.5 text-[11px] leading-snug line-clamp-2"
                            style={{ color: 'var(--text-muted)' }}>
                            {z.beschreibung}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
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
