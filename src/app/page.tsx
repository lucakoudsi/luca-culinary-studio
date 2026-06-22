'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useStore } from '@/lib/store';
import { Search, ChevronRight, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { FEATURES } from '@/config/features';

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'GUTEN MORGEN';
  if (h < 17) return 'GUTEN MITTAG';
  if (h < 22) return 'GUTEN ABEND';
  return 'GUTE NACHT';
}

function getWeatherInfo(code: number) {
  if (code === 0)           return { icon: '☀️', color: '#F5C842' };
  if (code <= 3)            return { icon: '⛅', color: '#A89880' };
  if (code <= 48)           return { icon: '🌫️', color: '#A89880' };
  if (code <= 67)           return { icon: '🌧️', color: '#7BB8D4' };
  if (code <= 77)           return { icon: '❄️', color: '#C8E8FF' };
  if (code <= 82)           return { icon: '🌦️', color: '#7BB8D4' };
  return                           { icon: '⛈️', color: '#B07BD4' };
}

const PROJECTS = [
  { id: 1, title: 'Herbst-Menü 2024',    category: 'Fine Dining', komponenten: 4, progress: 75, img: 'https://images.unsplash.com/photo-1488477181946-6428a0291777?w=400' },
  { id: 2, title: 'Signature Dessert',   category: 'Patisserie',  komponenten: 3, progress: 40, img: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=400' },
  { id: 3, title: 'Fermentations-Serie', category: 'Modern',      komponenten: 6, progress: 90, img: 'https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?w=400' },
];

const IDEAS = [
  { emoji: '🍋', combo: 'Yuzu & Schwarzer Sesam',    type: 'Dessert Idee',    ingredients: 'Yuzu, Schwarzer Sesam' },
  { emoji: '🌿', combo: 'Trüffel & Topinambur',      type: 'Vorspeise Idee',  ingredients: 'Trüffel, Topinambur' },
  { emoji: '🫐', combo: 'Rote Bete & Meerrettich',   type: 'Hauptgang Idee',  ingredients: 'Rote Bete, Meerrettich' },
];

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

const MEIN_STIL = {
  techniken: ['Sous-vide', 'Fermentieren', 'Räuchern', 'Gelieren'],
  texturen:  ['Knusprig-Cremig', 'Flüssig-Fest', 'Seidig-Rau'],
  richtung:  ['Japanisch-Europäisch', 'Farm-to-Table', 'Molekular'],
};

export default function DashboardPage() {
  const router = useRouter();
  const { recipes } = useStore();
  const [greeting, setGreeting]       = useState('GUTEN MORGEN');
  const [search, setSearch]           = useState('');
  const [weather, setWeather]         = useState<{ temp: number; code: number } | null>(null);

  useEffect(() => { setGreeting(getGreeting()); }, []);

  useEffect(() => {
    fetch('https://api.open-meteo.com/v1/forecast?latitude=49.99&longitude=8.27&current=temperature_2m,weather_code')
      .then(r => r.json())
      .then(d => setWeather({ temp: Math.round(d.current.temperature_2m), code: d.current.weather_code }))
      .catch(() => {});
  }, []);

  return (
    <div className="flex" style={{ minHeight: '100vh', background: '#0A0A0A' }}>

      {/* ── Main content ──────────────────────────────────────────────── */}
      <div className="flex-1 min-w-0 flex flex-col">

        {/* Topbar */}
        <div className="px-4 sm:px-8 pt-6 sm:pt-8 pb-5 sm:pb-6 flex items-start justify-between gap-4 sm:gap-6"
          style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
          <div className="min-w-0">
            <div className="text-[10px] font-semibold tracking-[4px] uppercase mb-2"
              style={{ color: 'rgba(201,168,76,0.55)' }}>
              ✦ &nbsp;Willkommen zurück
            </div>
            <h1 className="font-heading font-bold leading-none"
              style={{ fontSize: 'clamp(22px, 4vw, 34px)', color: '#F5F0E8', letterSpacing: '3px', textTransform: 'uppercase' }}>
              {greeting}, LUCA.
            </h1>
            <p className="mt-2" style={{ color: 'rgba(168,152,128,0.65)', fontSize: 13 }}>
              Bereit für neue kulinarische Meisterwerke?
            </p>
          </div>

          <div className="flex items-center gap-3 sm:gap-4 mt-1 flex-shrink-0">
            <div className="relative hidden sm:block">
              <Search size={13} className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
                style={{ color: 'rgba(168,152,128,0.4)' }} />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Suchen…"
                className="pl-9 pr-4 py-2.5 rounded-xl text-[13px] outline-none w-44 lg:w-48 transition-all"
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', color: '#F5F0E8' }} />
            </div>
            <div className="flex flex-col items-start">
              <div className="flex items-center gap-2.5">
                <div className="text-[13px] font-semibold" style={{ color: '#F5F0E8' }}>
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
              <div className="text-[11px]" style={{ color: 'rgba(168,152,128,0.45)' }}>
                {new Date().toLocaleDateString('de-DE', { weekday: 'long' })} · Mainz
              </div>
            </div>
          </div>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 px-4 sm:px-8 py-6 space-y-8">

          {/* Hero Card */}
          <div className="relative rounded-2xl overflow-hidden"
            style={{ background: '#141414', border: '1px solid rgba(201,168,76,0.15)', borderTop: '1px solid rgba(201,168,76,0.4)', minHeight: 200 }}>
            <div className="absolute inset-y-0 right-0 w-[44%]">
              <img src="https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800"
                alt="" className="w-full h-full object-cover" style={{ opacity: 0.45 }} />
              <div className="absolute inset-0"
                style={{ background: 'linear-gradient(90deg, #141414 0%, rgba(20,20,20,0.5) 55%, transparent 100%)' }} />
            </div>
            <div className="absolute inset-0 pointer-events-none"
              style={{ background: 'radial-gradient(ellipse 60% 80% at 20% 50%, rgba(201,168,76,0.04) 0%, transparent 70%)' }} />

            <div className="relative z-10 p-6 sm:p-8" style={{ maxWidth: '60%' }}>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-4 sm:mb-5"
                style={{ background: 'rgba(201,168,76,0.1)', border: '1px solid rgba(201,168,76,0.25)' }}>
                <span style={{ color: '#C9A84C', fontSize: 10 }}>✦</span>
                <span style={{ color: '#C9A84C', fontSize: 11, letterSpacing: '3px', textTransform: 'uppercase' }}>
                  Dein KI-Sous-Chef
                </span>
              </div>
              <h2 className="font-heading font-bold leading-tight mb-3"
                style={{ fontSize: 'clamp(18px, 3vw, 28px)', color: '#C9A84C', letterSpacing: '1px' }}>
                Guten Morgen, Luca.
              </h2>
              <p style={{ color: 'rgba(245,240,232,0.55)', fontSize: 14, lineHeight: 1.75 }}>
                Ich habe 3 neue Inspirationen basierend auf<br />
                der aktuellen Saison für dich vorbereitet.
              </p>
              <button
                onClick={() => FEATURES.AI_ENABLED && router.push('/ki-sous-chef')}
                disabled={!FEATURES.AI_ENABLED}
                title={!FEATURES.AI_ENABLED ? 'KI-Funktion coming soon' : undefined}
                className="mt-4 sm:mt-5 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-[13px] font-semibold transition-all"
                style={{
                  border: '1px solid rgba(201,168,76,0.4)',
                  color: '#C9A84C',
                  background: 'rgba(201,168,76,0.07)',
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
              <h2 className="font-heading font-bold" style={{ fontSize: 16, color: '#F5F0E8', letterSpacing: '3px', textTransform: 'uppercase' }}>
                Meine Projekte
              </h2>
              <Link href="/projekte" className="text-[12px] flex items-center gap-1 transition-colors"
                style={{ color: '#C9A84C' }}>
                Alle <ChevronRight size={13} />
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {PROJECTS.map(p => (
                <Link key={p.id} href={`/projekte/${p.id}`} className="block">
                  <div className="relative rounded-xl overflow-hidden cursor-pointer group"
                    style={{ border: '1px solid rgba(255,255,255,0.06)', height: 190 }}
                    onMouseEnter={e => (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(201,168,76,0.25)'}
                    onMouseLeave={e => (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(255,255,255,0.06)'}>
                    <img src={p.img} alt=""
                      className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                    <div className="absolute inset-0"
                      style={{ background: 'linear-gradient(to top, rgba(10,10,10,0.96) 0%, rgba(10,10,10,0.5) 55%, rgba(10,10,10,0.1) 100%)' }} />
                    <div className="absolute inset-x-0 bottom-0 p-4">
                      <div className="text-[10px] tracking-[2px] uppercase mb-1"
                        style={{ color: 'rgba(201,168,76,0.65)' }}>{p.category}</div>
                      <div className="font-heading font-bold mb-2.5"
                        style={{ fontSize: 14, color: '#F5F0E8' }}>{p.title}</div>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-[2px] rounded-full" style={{ background: 'rgba(255,255,255,0.1)' }}>
                          <div className="h-full rounded-full" style={{ width: `${p.progress}%`, background: 'linear-gradient(90deg, #9A7A30, #C9A84C)' }} />
                        </div>
                        <span className="text-[11px] font-semibold flex-shrink-0" style={{ color: '#C9A84C' }}>{p.progress}%</span>
                      </div>
                    </div>
                    <div className="absolute top-3 right-3 text-[10px] px-2 py-0.5 rounded-full"
                      style={{ background: 'rgba(0,0,0,0.55)', color: 'rgba(245,240,232,0.5)', border: '1px solid rgba(255,255,255,0.08)' }}>
                      {p.komponenten} Komp.
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </section>

          {/* Ideen für dich */}
          <section>
            <h2 className="font-heading font-bold mb-4"
              style={{ fontSize: 16, color: '#F5F0E8', letterSpacing: '3px', textTransform: 'uppercase' }}>
              Ideen für dich
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {IDEAS.map(idea => (
                <div key={idea.combo}
                  className="rounded-xl p-4 cursor-pointer transition-all"
                  style={{ background: '#141414', border: '1px solid rgba(255,255,255,0.06)' }}
                  onClick={() => router.push(`/kreativlabor?ingredients=${encodeURIComponent(idea.ingredients)}`)}
                  onMouseEnter={e => {
                    (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(201,168,76,0.25)';
                    (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-2px)';
                  }}
                  onMouseLeave={e => {
                    (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(255,255,255,0.06)';
                    (e.currentTarget as HTMLDivElement).style.transform = 'none';
                  }}>
                  <div className="text-2xl mb-3">{idea.emoji}</div>
                  <div className="font-heading font-bold mb-1" style={{ fontSize: 14, color: '#F5F0E8' }}>{idea.combo}</div>
                  <div className="flex items-center gap-1 mt-2 text-[12px] font-medium" style={{ color: '#C9A84C' }}>
                    {idea.type} <ArrowRight size={12} />
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Mein Stil */}
          <section style={{ borderTop: '1px solid rgba(201,168,76,0.12)', paddingTop: 28 }}>
            <h2 className="font-heading font-bold mb-4"
              style={{ fontSize: 16, color: '#F5F0E8', letterSpacing: '3px', textTransform: 'uppercase' }}>
              Mein Stil
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[
                { label: 'Häufig genutzt',     items: MEIN_STIL.techniken },
                { label: 'Lieblings-Texturen', items: MEIN_STIL.texturen },
                { label: 'Küchenrichtung',     items: MEIN_STIL.richtung },
              ].map(col => (
                <div key={col.label} className="rounded-xl p-4"
                  style={{ background: '#141414', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <div className="text-[10px] tracking-[3px] uppercase mb-3"
                    style={{ color: 'rgba(168,152,128,0.55)' }}>{col.label}</div>
                  {col.items.map(item => (
                    <div key={item} className="flex items-center gap-2 py-1.5 text-[13px]"
                      style={{ color: 'rgba(245,240,232,0.65)' }}>
                      <span style={{ color: '#C9A84C', fontSize: 7 }}>◆</span> {item}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </section>

        </div>
      </div>

      {/* ── Right Panel (hidden below xl) ─────────────────────────────── */}
      <div className="hidden xl:flex flex-col w-[272px] flex-shrink-0 overflow-y-auto"
        style={{ borderLeft: '1px solid rgba(255,255,255,0.05)', background: '#0D0D0D', minHeight: '100vh' }}>
        <div className="p-5 space-y-6">

          {/* Inspiration */}
          <div>
            <div className="text-[10px] tracking-[3px] uppercase mb-4"
              style={{ color: 'rgba(201,168,76,0.55)', paddingTop: 24 }}>
              ✦ &nbsp;Inspiration für dich
            </div>
            <div className="space-y-2">
              {INSPIRATION.map(item => (
                <div key={item.title} className="flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all"
                  style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.05)' }}
                  onMouseEnter={e => (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(201,168,76,0.2)'}
                  onMouseLeave={e => (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(255,255,255,0.05)'}>
                  <img src={item.img} alt="" className="w-10 h-10 rounded-lg object-cover flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="text-[12px] font-semibold leading-tight" style={{ color: '#F5F0E8' }}>{item.title}</div>
                    <div className="text-[10px] mt-0.5" style={{ color: 'rgba(168,152,128,0.55)' }}>{item.sub}</div>
                  </div>
                  <ChevronRight size={12} style={{ color: 'rgba(201,168,76,0.4)', flexShrink: 0 }} />
                </div>
              ))}
            </div>
          </div>

          <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }} />

          {/* Saison im Juni */}
          <div>
            <div className="text-[10px] tracking-[3px] uppercase mb-4"
              style={{ color: 'rgba(201,168,76,0.55)' }}>
              ✦ &nbsp;Saison im Juni
            </div>
            <div className="space-y-2">
              {SAISON.map(s => (
                <div key={s.name} className="flex items-center gap-3 p-3 rounded-xl"
                  style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.04)' }}>
                  <span className="text-lg flex-shrink-0">{s.emoji}</span>
                  <div>
                    <div className="text-[13px] font-semibold" style={{ color: '#F5F0E8' }}>{s.name}</div>
                    <div className="text-[10px]" style={{ color: 'rgba(201,168,76,0.55)' }}>{s.label}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }} />

          {/* Übersicht */}
          <div>
            <div className="text-[10px] tracking-[3px] uppercase mb-4"
              style={{ color: 'rgba(201,168,76,0.55)' }}>
              ✦ &nbsp;Übersicht
            </div>
            <div className="grid grid-cols-2 gap-2">
              {[
                { label: 'Rezepte',       value: recipes.length || 24, icon: '📋' },
                { label: 'Projekte',      value: 3,                    icon: '🎯' },
                { label: 'Ideen',         value: 12,                   icon: '💡' },
                { label: 'Diese Woche',   value: 5,                    icon: '📅' },
              ].map(s => (
                <div key={s.label} className="p-3 rounded-xl text-center"
                  style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }}>
                  <div className="text-[15px] mb-1">{s.icon}</div>
                  <div className="font-heading font-bold" style={{ fontSize: 20, color: '#C9A84C' }}>{s.value}</div>
                  <div className="text-[10px]" style={{ color: 'rgba(168,152,128,0.45)' }}>{s.label}</div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
