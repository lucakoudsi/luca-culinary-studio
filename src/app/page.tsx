'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search, ChevronRight, ArrowRight, FolderOpen } from 'lucide-react';
import Link from 'next/link';
import { FEATURES } from '@/config/features';

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Guten Morgen';
  if (h < 17) return 'Guten Mittag';
  if (h < 22) return 'Guten Abend';
  return 'Gute Nacht';
}

function getWeatherInfo(code: number) {
  if (code === 0)  return { icon: '☀️', color: '#C8882A' };
  if (code <= 3)   return { icon: '⛅', color: '#8B7355' };
  if (code <= 48)  return { icon: '🌫️', color: '#8B7355' };
  if (code <= 67)  return { icon: '🌧️', color: '#5A9AB4' };
  if (code <= 77)  return { icon: '❄️', color: '#5A9AB4' };
  if (code <= 82)  return { icon: '🌦️', color: '#5A9AB4' };
  return                  { icon: '⛈️', color: '#8B7355' };
}

const SAISON = [
  { emoji: '🍓', name: 'Erdbeere',  label: 'Hauptsaison' },
  { emoji: '🌸', name: 'Holunder',  label: 'Hauptsaison' },
  { emoji: '🌿', name: 'Spargel',   label: 'Ausklangsaison' },
  { emoji: '🌱', name: 'Rhabarber', label: 'Hauptsaison' },
];

const INSPIRATION = [
  { title: 'Yuzu Kosho – Japanische Würzpaste', sub: 'Fermentation · Japanisch', img: 'https://images.unsplash.com/photo-1547592166-23ac45744acd?w=120' },
  { title: 'Sansho-Pfeffer Emulsion',           sub: 'Technik · Modern',         img: 'https://images.unsplash.com/photo-1551218808-94e220e084d2?w=120' },
  { title: 'Miso-Karamell Komposition',         sub: 'Dessert · Fusion',         img: 'https://images.unsplash.com/photo-1563805042-7684c019e1cb?w=120' },
];

type Project = {
  id: number;
  name: string;
  description: string;
  color: string;
  status: string;
  recipe_ids: number[];
  menu_ids: number[];
};

type Idea = {
  id: number;
  text: string;
  tag: string;
};

type Stats = {
  rezepte: number;
  projekte: number;
  fermente: number;
  dieseWoche: number;
};

type MeinStil = {
  kuechenstil: string;
  spezialitaeten: string;
  lieblingszutaten: string;
};

function splitTags(str: string): string[] {
  return str.split(/[,;]/).map(s => s.trim()).filter(Boolean);
}

export default function DashboardPage() {
  const router = useRouter();
  const [greeting, setGreeting]         = useState('GUTEN MORGEN');
  const [search, setSearch]             = useState('');
  const [weather, setWeather]           = useState<{ temp: number; code: number } | null>(null);
  const [displayName, setDisplayName]   = useState('Chef');

  const [stats, setStats]               = useState<Stats>({ rezepte: 0, projekte: 0, fermente: 0, dieseWoche: 0 });
  const [projects, setProjects]         = useState<Project[]>([]);
  const [ideas, setIdeas]               = useState<Idea[]>([]);
  const [meinStil, setMeinStil]         = useState<MeinStil>({ kuechenstil: '', spezialitaeten: '', lieblingszutaten: '' });
  const [dataLoaded, setDataLoaded]     = useState(false);

  useEffect(() => { setGreeting(getGreeting()); }, []);

  // Profil für Displayname
  useEffect(() => {
    fetch('/api/profil')
      .then(r => r.json())
      .then(d => {
        const full  = (d.profile?.full_name ?? '').trim();
        const email = (d.user?.email ?? '').trim();
        if (full) {
          setDisplayName(full.split(' ')[0]);
        } else if (email) {
          const prefix = email.split('@')[0];
          setDisplayName(prefix.charAt(0).toUpperCase() + prefix.slice(1));
        }
      })
      .catch(() => {});
  }, []);

  // Dashboard-Daten: Stats, Projekte, Ideen, Mein Stil
  useEffect(() => {
    fetch('/api/dashboard/stats')
      .then(r => r.json())
      .then(d => {
        if (d.stats)    setStats(d.stats);
        if (d.projects) setProjects(d.projects);
        if (d.ideas)    setIdeas(d.ideas);
        if (d.meinStil) setMeinStil(d.meinStil);
        setDataLoaded(true);
      })
      .catch(() => setDataLoaded(true));
  }, []);

  // Wetter
  useEffect(() => {
    fetch('https://api.open-meteo.com/v1/forecast?latitude=49.99&longitude=8.27&current=temperature_2m,weather_code')
      .then(r => r.json())
      .then(d => setWeather({ temp: Math.round(d.current.temperature_2m), code: d.current.weather_code }))
      .catch(() => {});
  }, []);

  const hasMeinStil = meinStil.kuechenstil || meinStil.spezialitaeten || meinStil.lieblingszutaten;

  return (
    <div className="flex" style={{ minHeight: '100vh', background: '#FAF8F5' }}>

      {/* ── Main content ────────────────────────────────────────────── */}
      <div className="flex-1 min-w-0 flex flex-col">

        {/* Topbar */}
        <div className="px-4 sm:px-8 pt-6 sm:pt-8 pb-5 sm:pb-6 flex items-start justify-between gap-4 sm:gap-6 border-b border-border">
          <div className="min-w-0">
            <div className="text-[10px] font-semibold tracking-[4px] uppercase mb-2"
              style={{ color: 'rgba(107,58,75,0.6)' }}>
              ✦ &nbsp;Willkommen zurück
            </div>
            <h1 className="font-heading font-bold leading-none"
              style={{ fontSize: 'clamp(22px, 4vw, 34px)', color: '#2C2420', letterSpacing: '3px', textTransform: 'uppercase' }}>
              {greeting}, {displayName.toUpperCase()}.
            </h1>
            <p className="mt-2" style={{ color: '#8B7355', fontSize: 13 }}>
              Bereit für neue kulinarische Meisterwerke?
            </p>
          </div>

          <div className="flex items-center gap-3 sm:gap-4 mt-1 flex-shrink-0">
            <div className="relative hidden sm:block">
              <Search size={13} className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
                style={{ color: '#B09880' }} />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Suchen…"
                className="pl-9 pr-4 py-2.5 rounded-xl text-[13px] outline-none w-44 lg:w-48 transition-all border border-border"
                style={{ background: '#FFFFFF', color: '#2C2420' }} />
            </div>
            <div className="flex flex-col items-start">
              <div className="flex items-center gap-2.5">
                <div className="text-[13px] font-semibold" style={{ color: '#2C2420' }}>
                  {new Date().toLocaleDateString('de-DE', { day: '2-digit', month: 'long' })}
                </div>
                {weather && (() => {
                  const { icon, color } = getWeatherInfo(weather.code);
                  return (
                    <div className="flex items-center gap-1">
                      <span className="text-base leading-none">{icon}</span>
                      <span className="text-[13px] font-semibold" style={{ color }}>{weather.temp}°</span>
                    </div>
                  );
                })()}
              </div>
              <div className="text-[11px]" style={{ color: '#B09880' }}>
                {new Date().toLocaleDateString('de-DE', { weekday: 'long' })}
              </div>
            </div>
          </div>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 px-4 sm:px-8 py-6 space-y-8">

          {/* Hero Card */}
          <div className="relative rounded-2xl overflow-hidden shadow-sm"
            style={{ background: '#FFFFFF', border: '1px solid #E8E0D8', borderTop: '2px solid #6B3A4B', minHeight: 200 }}>
            <div className="absolute inset-y-0 right-0 w-[44%]">
              <img src="https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800"
                alt="" className="w-full h-full object-cover" style={{ opacity: 0.6 }} />
              <div className="absolute inset-0"
                style={{ background: 'linear-gradient(90deg, #FFFFFF 0%, rgba(255,255,255,0.6) 55%, transparent 100%)' }} />
            </div>
            <div className="absolute inset-0 pointer-events-none"
              style={{ background: 'radial-gradient(ellipse 60% 80% at 20% 50%, rgba(107,58,75,0.03) 0%, transparent 70%)' }} />

            <div className="relative z-10 p-6 sm:p-8 max-w-[80%] sm:max-w-[60%]">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-4 sm:mb-5"
                style={{ background: 'rgba(107,58,75,0.08)', border: '1px solid rgba(107,58,75,0.2)' }}>
                <span style={{ color: '#6B3A4B', fontSize: 10 }}>✦</span>
                <span style={{ color: '#6B3A4B', fontSize: 11, letterSpacing: '3px', textTransform: 'uppercase' }}>
                  Dein KI-Sous-Chef
                </span>
              </div>
              <h2 className="font-heading font-bold leading-tight mb-3"
                style={{ fontSize: 'clamp(18px, 3vw, 28px)', color: '#2C2420', letterSpacing: '1px' }}>
                {greeting}, {displayName}.
              </h2>
              <p style={{ color: '#8B7355', fontSize: 14, lineHeight: 1.75 }}>
                Entdecke neue Inspirationen und verwalte<br />
                deine kulinarischen Projekte.
              </p>
              <button
                onClick={() => FEATURES.AI_ENABLED && router.push('/ki-sous-chef')}
                disabled={!FEATURES.AI_ENABLED}
                title={!FEATURES.AI_ENABLED ? 'KI-Funktion coming soon' : undefined}
                className="mt-4 sm:mt-5 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-[13px] font-semibold transition-all"
                style={{
                  border: '1px solid rgba(107,58,75,0.35)',
                  color: '#6B3A4B',
                  background: 'rgba(107,58,75,0.06)',
                  opacity: FEATURES.AI_ENABLED ? 1 : 0.5,
                  cursor: FEATURES.AI_ENABLED ? 'pointer' : 'not-allowed',
                }}>
                {FEATURES.AI_ENABLED ? 'Mit mir sprechen' : 'Coming Soon'} <ArrowRight size={14} />
              </button>
            </div>
          </div>

          {/* Meine Projekte */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-heading font-bold"
                style={{ fontSize: 16, color: '#2C2420', letterSpacing: '3px', textTransform: 'uppercase' }}>
                Meine Projekte
              </h2>
              <Link href="/projekte" className="text-[12px] flex items-center gap-1 transition-colors"
                style={{ color: '#6B3A4B' }}>
                Alle <ChevronRight size={13} />
              </Link>
            </div>

            {!dataLoaded ? (
              // Skeleton
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {[1, 2, 3].map(i => (
                  <div key={i} className="rounded-xl animate-pulse"
                    style={{ height: 140, background: '#EDE8E3', border: '1px solid #E8E0D8' }} />
                ))}
              </div>
            ) : projects.length === 0 ? (
              <div className="rounded-xl p-8 text-center border border-dashed"
                style={{ borderColor: '#E8E0D8', background: '#FAFAF9' }}>
                <FolderOpen size={28} style={{ color: '#C0B5A8', margin: '0 auto 10px' }} />
                <p style={{ fontSize: 14, color: '#9A8070', marginBottom: 12 }}>Noch keine Projekte</p>
                <Link href="/projekte"
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-[13px] font-semibold transition-all"
                  style={{ background: 'rgba(107,58,75,0.08)', color: '#6B3A4B', border: '1px solid rgba(107,58,75,0.2)' }}>
                  Erstes Projekt erstellen <ArrowRight size={13} />
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {projects.map(p => {
                  const komponenten = (p.recipe_ids?.length ?? 0) + (p.menu_ids?.length ?? 0);
                  return (
                    <Link key={p.id} href={`/projekte/${p.id}`} className="block">
                      <div className="relative rounded-xl overflow-hidden cursor-pointer group transition-all"
                        style={{ border: '1px solid #E8E0D8', minHeight: 130, background: '#FFFFFF' }}
                        onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(107,58,75,0.35)'; (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-2px)'; (e.currentTarget as HTMLDivElement).style.boxShadow = '0 4px 16px rgba(107,58,75,0.08)'; }}
                        onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.borderColor = '#E8E0D8'; (e.currentTarget as HTMLDivElement).style.transform = 'none'; (e.currentTarget as HTMLDivElement).style.boxShadow = 'none'; }}>
                        {/* Color accent top bar */}
                        <div className="h-1 w-full" style={{ background: p.color || '#6B3A4B' }} />
                        <div className="p-4">
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <div className="font-heading font-bold leading-tight"
                              style={{ fontSize: 14, color: '#2C2420' }}>{p.name}</div>
                            <span className="text-[10px] px-2 py-0.5 rounded-full flex-shrink-0"
                              style={{ background: 'rgba(107,58,75,0.08)', color: '#6B3A4B', border: '1px solid rgba(107,58,75,0.18)' }}>
                              {p.status}
                            </span>
                          </div>
                          {p.description && (
                            <p className="text-[12px] leading-relaxed mb-3 line-clamp-2"
                              style={{ color: '#9A8070' }}>{p.description}</p>
                          )}
                          {komponenten > 0 && (
                            <div className="text-[11px]" style={{ color: '#B09880' }}>
                              {komponenten} Komponente{komponenten !== 1 ? 'n' : ''}
                            </div>
                          )}
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </section>

          {/* Ideen für dich */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-heading font-bold"
                style={{ fontSize: 16, color: '#2C2420', letterSpacing: '3px', textTransform: 'uppercase' }}>
                Ideen für dich
              </h2>
              <Link href="/ki-sous-chef" className="text-[12px] flex items-center gap-1"
                style={{ color: '#6B3A4B' }}>
                Mehr <ChevronRight size={13} />
              </Link>
            </div>

            {!dataLoaded ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {[1, 2, 3].map(i => (
                  <div key={i} className="rounded-xl animate-pulse"
                    style={{ height: 90, background: '#EDE8E3', border: '1px solid #E8E0D8' }} />
                ))}
              </div>
            ) : ideas.length === 0 ? (
              <div className="rounded-xl p-6 text-center border border-dashed"
                style={{ borderColor: '#E8E0D8', background: '#FAFAF9' }}>
                <p style={{ fontSize: 13, color: '#B09880' }}>
                  Noch keine Ideen gespeichert
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {ideas.map(idea => (
                  <div key={idea.id}
                    className="rounded-xl p-4 cursor-pointer transition-all bg-white border border-border"
                    onClick={() => router.push('/ki-sous-chef')}
                    onMouseEnter={e => {
                      (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(107,58,75,0.3)';
                      (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-2px)';
                      (e.currentTarget as HTMLDivElement).style.boxShadow = '0 4px 16px rgba(107,58,75,0.08)';
                    }}
                    onMouseLeave={e => {
                      (e.currentTarget as HTMLDivElement).style.borderColor = '#E8E0D8';
                      (e.currentTarget as HTMLDivElement).style.transform = 'none';
                      (e.currentTarget as HTMLDivElement).style.boxShadow = 'none';
                    }}>
                    <div className="font-heading font-bold mb-1.5 leading-snug"
                      style={{ fontSize: 13, color: '#2C2420' }}>{idea.text}</div>
                    {idea.tag && (
                      <div className="flex items-center gap-1 mt-2 text-[11px] font-medium" style={{ color: '#6B3A4B' }}>
                        {idea.tag} <ArrowRight size={11} />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Mein Stil */}
          <section style={{ borderTop: '1px solid #E8E0D8', paddingTop: 28 }}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-heading font-bold"
                style={{ fontSize: 16, color: '#2C2420', letterSpacing: '3px', textTransform: 'uppercase' }}>
                Mein Stil
              </h2>
              <Link href="/mein-stil" className="text-[12px] flex items-center gap-1"
                style={{ color: '#6B3A4B' }}>
                Bearbeiten <ChevronRight size={13} />
              </Link>
            </div>

            {!dataLoaded ? (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {[1, 2, 3].map(i => (
                  <div key={i} className="rounded-xl animate-pulse"
                    style={{ height: 100, background: '#EDE8E3', border: '1px solid #E8E0D8' }} />
                ))}
              </div>
            ) : !hasMeinStil ? (
              <div className="rounded-xl p-6 text-center border border-dashed"
                style={{ borderColor: '#E8E0D8', background: '#FAFAF9' }}>
                <p style={{ fontSize: 13, color: '#B09880', marginBottom: 10 }}>
                  Noch kein Küchenstil eingetragen
                </p>
                <Link href="/mein-stil"
                  className="inline-flex items-center gap-1.5 text-[13px] font-semibold"
                  style={{ color: '#6B3A4B' }}>
                  Jetzt einrichten <ArrowRight size={13} />
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {[
                  { label: 'Küchenrichtung',    value: meinStil.kuechenstil },
                  { label: 'Spezialitäten',      value: meinStil.spezialitaeten },
                  { label: 'Lieblingszutaten',   value: meinStil.lieblingszutaten },
                ].filter(col => col.value).map(col => (
                  <div key={col.label} className="rounded-xl p-4 bg-white border border-border">
                    <div className="text-[10px] tracking-[3px] uppercase mb-3"
                      style={{ color: '#B09880' }}>{col.label}</div>
                    {splitTags(col.value).slice(0, 5).map(item => (
                      <div key={item} className="flex items-center gap-2 py-1.5 text-[13px]"
                        style={{ color: '#8B7355' }}>
                        <span style={{ color: '#6B3A4B', fontSize: 7 }}>◆</span> {item}
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            )}
          </section>

        </div>
      </div>

      {/* ── Right Panel ─────────────────────────────────────────────── */}
      <div className="hidden xl:flex flex-col w-[272px] flex-shrink-0 overflow-y-auto border-l border-border"
        style={{ background: '#F0EBE3', minHeight: '100vh' }}>
        <div className="p-5 space-y-6">

          {/* Inspiration */}
          <div>
            <div className="text-[10px] tracking-[3px] uppercase mb-4"
              style={{ color: 'rgba(107,58,75,0.65)', paddingTop: 24 }}>
              ✦ &nbsp;Inspiration für dich
            </div>
            <div className="space-y-2">
              {INSPIRATION.map(item => (
                <div key={item.title} className="flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all bg-white border border-border"
                  onMouseEnter={e => (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(107,58,75,0.3)'}
                  onMouseLeave={e => (e.currentTarget as HTMLDivElement).style.borderColor = '#E8E0D8'}>
                  <img src={item.img} alt="" className="w-10 h-10 rounded-lg object-cover flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="text-[12px] font-semibold leading-tight" style={{ color: '#2C2420' }}>{item.title}</div>
                    <div className="text-[10px] mt-0.5" style={{ color: '#B09880' }}>{item.sub}</div>
                  </div>
                  <ChevronRight size={12} style={{ color: 'rgba(107,58,75,0.5)', flexShrink: 0 }} />
                </div>
              ))}
            </div>
          </div>

          <div className="border-t border-border" />

          {/* Saison */}
          <div>
            <div className="text-[10px] tracking-[3px] uppercase mb-4"
              style={{ color: 'rgba(107,58,75,0.65)' }}>
              ✦ &nbsp;Saison im {new Date().toLocaleDateString('de-DE', { month: 'long' })}
            </div>
            <div className="space-y-2">
              {SAISON.map(s => (
                <div key={s.name} className="flex items-center gap-3 p-3 rounded-xl bg-white border border-border">
                  <span className="text-lg flex-shrink-0">{s.emoji}</span>
                  <div>
                    <div className="text-[13px] font-semibold" style={{ color: '#2C2420' }}>{s.name}</div>
                    <div className="text-[10px]" style={{ color: 'rgba(107,58,75,0.65)' }}>{s.label}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="border-t border-border" />

          {/* Übersicht KPIs */}
          <div>
            <div className="text-[10px] tracking-[3px] uppercase mb-4"
              style={{ color: 'rgba(107,58,75,0.65)' }}>
              ✦ &nbsp;Übersicht
            </div>
            <div className="grid grid-cols-2 gap-2">
              {[
                { label: 'Rezepte',     value: dataLoaded ? stats.rezepte    : '—', icon: '📋' },
                { label: 'Projekte',    value: dataLoaded ? stats.projekte   : '—', icon: '🎯' },
                { label: 'Fermente',    value: dataLoaded ? stats.fermente   : '—', icon: '🫙' },
                { label: 'Diese Woche', value: dataLoaded ? stats.dieseWoche : '—', icon: '📅' },
              ].map(s => (
                <div key={s.label} className="p-3 rounded-xl text-center bg-white border border-border">
                  <div className="text-[15px] mb-1">{s.icon}</div>
                  <div className={`font-heading font-bold ${!dataLoaded ? 'animate-pulse' : ''}`}
                    style={{ fontSize: 20, color: '#6B3A4B' }}>{s.value}</div>
                  <div className="text-[10px]" style={{ color: '#B09880' }}>{s.label}</div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
