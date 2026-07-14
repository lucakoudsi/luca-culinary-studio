import type { FlavorProfile } from '@/types';

// ─── Wiederverwendbare Menükarte ────────────────────────────────────────────
// Genutzt in /menuegenerator (direkt nach der Generierung) UND in
// /projekte/[id] (beim Ansehen eines gespeicherten, KI-generierten Menüs) --
// identische Darstellung an beiden Stellen, siehe docs/menuegenerator-konzept.md
// Abschnitt 6 (Design-Punkt 1+2).

export type MenuekarteGang = {
  nummer: number;
  titel: string;
  beschreibung?: string;
  hauptzutaten?: string[];
  geschmacksprofil?: Partial<FlavorProfile>;
  zubereitungsidee?: string;
  weinId?: number | null;
  weinName?: string | null;
};

export type MenuekarteDaten = {
  titel: string;
  dramaturgieBegruendung?: string;
  gaenge: MenuekarteGang[];
};

const FLAVOR_LABELS = ['Säure', 'Süße', 'Bitter', 'Umami', 'Schärfe', 'Salzig'];
const FLAVOR_KEYS = ['acidity', 'sweetness', 'bitterness', 'umami', 'spiciness', 'saltiness'] as const;
const FLAVOR_COLORS = ['#7BB8D4', '#E8A838', '#7CB87A', '#C9A84C', '#E06B6B', '#A89880'];

const ROMAN = ['', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII'];

function gangIntensity(g: MenuekarteGang): number {
  return FLAVOR_KEYS.reduce((sum, k) => sum + (g.geschmacksprofil?.[k] ?? 0), 0);
}

// Catmull-Rom -> kubische Bezier, fuer eine dezente, gleichmaessig geschwungene Kurve
function smoothPath(points: { x: number; y: number }[]): string {
  if (points.length < 2) return '';
  let d = `M ${points[0].x} ${points[0].y}`;
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i === 0 ? i : i - 1];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[i + 2 < points.length ? i + 2 : i + 1];
    const cp1x = p1.x + (p2.x - p0.x) / 6;
    const cp1y = p1.y + (p2.y - p0.y) / 6;
    const cp2x = p2.x - (p3.x - p1.x) / 6;
    const cp2y = p2.y - (p3.y - p1.y) / 6;
    d += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2.x} ${p2.y}`;
  }
  return d;
}

function Spannungsbogen({ gaenge }: { gaenge: MenuekarteGang[] }) {
  const width = 600, height = 64, padX = 16, padY = 12;
  const intensities = gaenge.map(gangIntensity);
  const min = Math.min(...intensities), max = Math.max(...intensities);
  const range = max - min || 1;
  const points = gaenge.map((g, i) => ({
    x: gaenge.length > 1 ? padX + (i / (gaenge.length - 1)) * (width - padX * 2) : width / 2,
    y: height - padY - ((gangIntensity(g) - min) / range) * (height - padY * 2),
  }));
  const pathD = smoothPath(points);

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full" style={{ height: 64, display: 'block' }} aria-hidden="true">
      {pathD && <path d={pathD} fill="none" stroke="#C9A84C" strokeWidth={1.75} strokeLinecap="round" opacity={0.85} />}
      {points.map((p, i) => <circle key={i} cx={p.x} cy={p.y} r={3} fill="#C9A84C" />)}
    </svg>
  );
}

function MiniFlavorBars({ profile }: { profile: MenuekarteGang['geschmacksprofil'] }) {
  return (
    <div className="flex flex-wrap gap-x-5 gap-y-1.5 mt-4">
      {FLAVOR_KEYS.map((key, i) => (
        <div key={key} className="flex items-center gap-1.5" style={{ width: 98 }}>
          <span className="text-[9px] w-9 flex-shrink-0" style={{ color: 'var(--text-muted)' }}>{FLAVOR_LABELS[i]}</span>
          <div className="flex-1 h-1 rounded-full overflow-hidden" style={{ background: 'rgba(0,0,0,0.07)' }}>
            <div className="h-full rounded-full" style={{ width: `${((profile?.[key] ?? 0) / 5) * 100}%`, background: FLAVOR_COLORS[i] }} />
          </div>
        </div>
      ))}
    </div>
  );
}

export default function Menuekarte({ data }: { data: MenuekarteDaten }) {
  return (
    <div className="rounded-2xl px-7 py-11 sm:px-14 sm:py-16" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
      <div className="text-center">
        <div className="text-[14px] mb-3" style={{ color: '#C9A84C' }}>✦</div>
        {/* Kein truncate/line-clamp -- der Titel darf mehrzeilig umbrechen, nichts wird abgeschnitten */}
        <h2 className="font-heading font-bold" style={{ fontSize: 30, color: 'var(--text)', letterSpacing: '0.5px' }}>{data.titel}</h2>
      </div>

      {data.dramaturgieBegruendung && (
        <p className="text-center italic mt-4 mb-9 mx-auto" style={{ color: 'var(--text-muted)', fontSize: 13, maxWidth: 480, lineHeight: 1.7 }}>
          {data.dramaturgieBegruendung}
        </p>
      )}

      {data.gaenge?.length > 0 && (
        <div className="mb-9">
          <Spannungsbogen gaenge={data.gaenge} />
        </div>
      )}

      <div>
        {data.gaenge?.map((g, i) => (
          <div key={g.nummer ?? i}>
            <div className="py-6">
              <div className="text-center mb-3">
                <span className="font-heading" style={{ fontSize: 13, letterSpacing: 3, color: '#C9A84C' }}>
                  {ROMAN[g.nummer] ?? g.nummer}
                </span>
              </div>
              <h3 className="text-center font-heading font-bold" style={{ fontSize: 19, color: 'var(--text)', lineHeight: 1.4 }}>
                {g.titel}
              </h3>
              {g.hauptzutaten && g.hauptzutaten.length > 0 && (
                <p className="text-center italic mt-1.5" style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                  {g.hauptzutaten.join(' · ')}
                </p>
              )}
              {g.beschreibung && (
                <p className="mt-3" style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.7 }}>{g.beschreibung}</p>
              )}

              {g.zubereitungsidee && (
                <div className="mt-4 rounded-lg p-3.5" style={{ background: 'var(--bg)' }}>
                  <div className="text-[10px] font-semibold uppercase tracking-widest mb-1.5" style={{ color: 'var(--text-muted)' }}>Zubereitungsidee</div>
                  <p style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.6 }}>{g.zubereitungsidee}</p>
                </div>
              )}

              {g.geschmacksprofil && <MiniFlavorBars profile={g.geschmacksprofil} />}

              {g.weinName && (
                <p className="text-center italic mt-4" style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                  <span style={{ color: '#C9A84C' }}>✦</span> {g.weinName}
                </p>
              )}
            </div>
            {i < data.gaenge.length - 1 && (
              <div className="flex items-center justify-center gap-3">
                <div className="h-px flex-1" style={{ background: 'linear-gradient(90deg, transparent, rgba(201,168,76,0.4), transparent)' }} />
                <span style={{ color: '#C9A84C', fontSize: 10 }}>✦</span>
                <div className="h-px flex-1" style={{ background: 'linear-gradient(90deg, transparent, rgba(201,168,76,0.4), transparent)' }} />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
