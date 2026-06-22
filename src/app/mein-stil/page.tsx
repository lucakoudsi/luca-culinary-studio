'use client';
import { User, TrendingUp, Leaf, Award, Star } from 'lucide-react';

const tagCloud = [
  { name: 'Morcheln', count: 18 }, { name: 'Weißer Spargel', count: 15 },
  { name: 'Jakobsmuschel', count: 14 }, { name: 'Schwarze Trüffel', count: 12 },
  { name: 'Miso', count: 11 }, { name: 'Foie Gras', count: 10 },
  { name: 'Bärlauch', count: 9 }, { name: 'Shio Koji', count: 9 },
  { name: 'Yuzu', count: 8 }, { name: 'Rote Bete', count: 8 },
  { name: 'Pfifferling', count: 7 }, { name: 'Steinbutt', count: 7 },
  { name: 'Kaviar', count: 6 }, { name: 'Topinambur', count: 6 },
  { name: 'Sakura-Kresse', count: 5 }, { name: 'Rosmarin', count: 4 },
  { name: 'Bergkäse', count: 4 }, { name: 'Lammrücken', count: 3 },
];

const techniques = [
  { name: 'Sous-vide', description: 'Präzise Kerntemperatur für perfekte Texturen', level: 5 },
  { name: 'Fermentation', description: 'Geschmackstiefe durch kontrollierte enzymatische Reifung', level: 5 },
  { name: 'Emulsionen & Espumas', description: 'Saucen und Schäume mit perfekter Bindung', level: 4 },
  { name: 'Karamellisieren', description: 'Maillard-Reaktion für Röst- und Tiefenaromen', level: 4 },
  { name: 'Einlegen & Beizen', description: 'Säure und Konservierung als Geschmackswerkzeug', level: 4 },
  { name: 'Confit', description: 'Langsamgaren in Fett für zarte, aromatische Ergebnisse', level: 3 },
];

const influences = [
  { name: 'Nouvelle Cuisine', region: 'Frankreich', note: 'Leichtheit, natürliche Aromen, präzise Technik – das Produkt steht im Vordergrund.' },
  { name: 'Japanische Präzision', region: 'Japan', note: 'Umami-Bewusstsein, Saisonalität, tiefer Respekt vor dem Produkt.' },
  { name: 'Noma & New Nordic', region: 'Skandinavien', note: 'Fermentation, Wildkräuter, regionale Identität als Philosophie.' },
  { name: 'Südwestdeutsche Küche', region: 'Deutschland', note: 'Verwurzelung, handwerkliche Qualität, ehrliches Handwerk.' },
];

const stats = [
  { label: 'Rezepte gesamt', value: '6', color: '#6B3A4B' },
  { label: 'Lieblingskategorie', value: 'Hauptgang', color: '#7CB87A' },
  { label: 'Lieblingsaison', value: 'Frühling', color: '#7BB8D4' },
  { label: 'Ø Schwierigkeit', value: 'Mittel', color: '#E8A838' },
  { label: 'Fermentprojekte', value: '4', color: '#C4743A' },
  { label: 'Ø Bewertung', value: '4.2 ★', color: '#6B3A4B' },
];

function TagCloud() {
  const max = Math.max(...tagCloud.map(t => t.count));
  const min = Math.min(...tagCloud.map(t => t.count));
  return (
    <div className="flex flex-wrap gap-2.5 items-center">
      {tagCloud.map(tag => {
        const n = (tag.count - min) / (max - min);
        const size = 11 + n * 9;
        const alpha = 0.55 + n * 0.45;
        return (
          <span key={tag.name}
            className="px-3 py-1.5 rounded-full font-medium cursor-default select-none transition-transform hover:scale-105"
            style={{
              fontSize: `${size}px`,
              background: `rgba(107,58,75,${0.06 + n * 0.12})`,
              color: `rgba(107,58,75,${alpha})`,
              border: `1px solid rgba(107,58,75,${0.1 + n * 0.22})`,
            }}>
            {tag.name}
          </span>
        );
      })}
    </div>
  );
}

export default function MeinStilPage() {
  return (
    <div style={{ background: '#FAF8F5', minHeight: '100vh' }}>
      <div className="px-8 pt-8 pb-6" style={{ borderBottom: '1px solid #E8E0D8' }}>
        <div className="text-[10px] font-semibold tracking-[4px] uppercase mb-2" style={{ color: 'rgba(107,58,75,0.55)' }}>✦ &nbsp;Deine Signatur</div>
        <h1 className="font-heading font-bold leading-none" style={{ fontSize: 28, color: '#2C2420', letterSpacing: '2px', textTransform: 'uppercase' }}>Mein Stil</h1>
        <p className="mt-1.5" style={{ color: '#8B7355', fontSize: 13 }}>Kulinarisches Profil & persönliche Handschrift</p>
      </div>
      <div className="p-8 max-w-[1200px]">

      {/* Hero */}
      <div className="bg-card border border-border rounded-xl p-7 mb-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-72 h-72 rounded-full opacity-[0.04] pointer-events-none"
          style={{ background: 'radial-gradient(circle, #6B3A4B, transparent)', transform: 'translate(30%, -30%)' }} />
        <div className="flex items-start gap-6 relative">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center flex-shrink-0"
            style={{ background: 'linear-gradient(135deg, rgba(107,58,75,0.15), rgba(107,58,75,0.04))', border: '1px solid rgba(107,58,75,0.25)' }}>
            <User size={28} color="#6B3A4B" strokeWidth={1.5} />
          </div>
          <div>
            <h2 className="font-heading text-[22px] font-bold text-text-primary mb-0.5">Luca Koudsi</h2>
            <div className="text-[13px] font-semibold mb-3" style={{ color: '#6B3A4B' }}>Fine Dining · Fusion · Modern European</div>
            <p className="text-[13px] text-text-secondary leading-relaxed max-w-2xl">
              Meine Küche verbindet klassische europäische Techniken mit fernöstlichen Aromen und einem tiefen
              Verständnis für Fermentation. Ich arbeite produktzentriert – die beste Zutat braucht keine Ablenkung,
              nur präzise Technik und ehrliches Handwerk.
            </p>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-6 gap-3 mb-7">
        {stats.map(s => (
          <div key={s.label} className="bg-card border border-border rounded-xl p-4 text-center">
            <div className="text-[18px] font-bold mb-1 leading-none" style={{ color: s.color }}>{s.value}</div>
            <div className="text-[10px] text-text-muted leading-tight mt-1">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-[1fr_300px] gap-6">
        <div className="space-y-6">
          {/* Tag Cloud */}
          <div className="bg-card border border-border rounded-xl p-6">
            <div className="flex items-center gap-2 mb-5">
              <Leaf size={14} className="text-gold" />
              <span className="text-[11px] text-text-muted font-semibold uppercase tracking-widest">Häufig verwendete Zutaten</span>
            </div>
            <TagCloud />
          </div>

          {/* Techniques */}
          <div className="bg-card border border-border rounded-xl p-6">
            <div className="flex items-center gap-2 mb-5">
              <Award size={14} className="text-gold" />
              <span className="text-[11px] text-text-muted font-semibold uppercase tracking-widest">Lieblingstechniken</span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {techniques.map(t => (
                <div key={t.name} className="bg-background rounded-xl p-4 border border-border">
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-[13px] font-semibold text-text-primary">{t.name}</div>
                    <div className="flex gap-0.5">
                      {[1, 2, 3, 4, 5].map(i => (
                        <Star key={i} size={10} fill={i <= t.level ? '#6B3A4B' : 'none'} color={i <= t.level ? '#6B3A4B' : '#D4C9BC'} />
                      ))}
                    </div>
                  </div>
                  <p className="text-[11px] text-text-muted leading-snug">{t.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Influences */}
        <div className="bg-card border border-border rounded-xl p-6">
          <div className="flex items-center gap-2 mb-5">
            <TrendingUp size={14} className="text-gold" />
            <span className="text-[11px] text-text-muted font-semibold uppercase tracking-widest">Küchenstil & Einflüsse</span>
          </div>
          <div className="space-y-5">
            {influences.map((inf, i) => (
              <div key={i} className="border-l-2 pl-4 py-0.5"
                style={{ borderColor: `rgba(107,58,75,${0.7 - i * 0.12})` }}>
                <div className="text-[13px] font-semibold text-text-primary mb-0.5">{inf.name}</div>
                <div className="text-[11px] mb-1.5" style={{ color: '#6B3A4B' }}>{inf.region}</div>
                <p className="text-[12px] text-text-muted leading-relaxed">{inf.note}</p>
              </div>
            ))}
          </div>

          <div className="mt-6 pt-5 border-t border-border">
            <div className="text-[11px] text-text-muted font-semibold uppercase tracking-widest mb-3">Philosophie</div>
            <p className="text-[12px] text-text-secondary leading-relaxed italic">
              „Jede Zutat hat ihren Moment der Vollkommenheit. Meine Aufgabe ist es, diesen Moment zu erkennen und in Szene zu setzen."
            </p>
          </div>
        </div>
      </div>
    </div>
    </div>
  );
}
