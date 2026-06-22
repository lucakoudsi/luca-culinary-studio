'use client';
import { useState } from 'react';
import { Wine, Search, MapPin, Calendar, Loader2 } from 'lucide-react';

type WineType = 'Alle' | 'Rot' | 'Weiß' | 'Rosé' | 'Schaumwein';

interface WineRec {
  id: number;
  name: string;
  type: Exclude<WineType, 'Alle'>;
  region: string;
  vintage: number;
  grapes: string;
  why: string;
  score: number;
  price: string;
}

const wineDb: Record<string, WineRec[]> = {
  default: [
    { id: 1, name: 'Château Margaux', type: 'Rot', region: 'Bordeaux, Frankreich', vintage: 2018, grapes: 'Cabernet Sauvignon, Merlot', why: 'Dichte Tannine harmonieren mit dem Fett und der Textur. Sekundäre Aromen von Leder und Tabak ergänzen Röstaromen elegant.', score: 95, price: '€€€€' },
    { id: 2, name: 'Keller G-Max Riesling', type: 'Weiß', region: 'Rheinhessen, Deutschland', vintage: 2020, grapes: 'Riesling', why: 'Lebendige Säure und mineralische Tiefe schaffen Ausgewogenheit. Petrolnoten ergänzen feine Küche; Frucht kontrastiert Bitterkeit.', score: 92, price: '€€€€' },
    { id: 3, name: 'Billecart-Salmon Blanc de Blancs', type: 'Schaumwein', region: 'Champagne, Frankreich', vintage: 2014, grapes: 'Chardonnay', why: 'Feine Perlage reinigt den Gaumen, Brioche-Noten verbinden sich ideal. Crisp-Säure unterstreicht die Eleganz.', score: 90, price: '€€€' },
    { id: 4, name: 'Trimbach Clos Sainte Hune', type: 'Weiß', region: 'Elsass, Frankreich', vintage: 2017, grapes: 'Riesling', why: 'Konzentrierte Mineralik und exzellente Säurestruktur – einer der präzisesten Weißweine Frankreichs für delikate Gerichte.', score: 94, price: '€€€€' },
    { id: 5, name: 'Château Rayas Châteauneuf-du-Pape', type: 'Rot', region: 'Rhône, Frankreich', vintage: 2016, grapes: 'Grenache', why: 'Reife rote Früchte und Garigue-Noten ergänzen mediterrane Kräuter. Sanfte Tannine lassen die Hauptkomponente strahlen.', score: 91, price: '€€€€' },
    { id: 6, name: 'Domaine Weinbach Riesling', type: 'Weiß', region: 'Elsass, Frankreich', vintage: 2019, grapes: 'Riesling', why: 'Blumige Aromatik und reife Zitrusfrucht. Mittlere Säure für ein ausgewogenes, klassisches Pairing.', score: 88, price: '€€€' },
  ],
  spargel: [
    { id: 7, name: 'Egon Müller Scharzhofberger Spätlese', type: 'Weiß', region: 'Mosel, Deutschland', vintage: 2021, grapes: 'Riesling', why: 'Restsüße kontrastiert die natürliche Bitterkeit des Spargels brillant. Schiefermineralik ist der klassische Partner zu weißem Spargel.', score: 97, price: '€€€€' },
    { id: 8, name: 'Nikolaihof Grüner Veltliner Vinothek', type: 'Weiß', region: 'Wachau, Österreich', vintage: 2015, grapes: 'Grüner Veltliner', why: 'Pfeffrige Würze und saubere Säure – der klassische österreichische Spargel-Begleiter schlechthin.', score: 94, price: '€€€' },
    { id: 9, name: 'Schloß Johannisberg Silberlack', type: 'Weiß', region: 'Rheingau, Deutschland', vintage: 2019, grapes: 'Riesling', why: 'Rheingau-Eleganz mit Honig und Aprikose. Perfekte Brücke zwischen Hollandaise und Spargelfibre.', score: 91, price: '€€€' },
    { id: 10, name: 'Cattier Blanc de Blancs Champagne', type: 'Schaumwein', region: 'Champagne, Frankreich', vintage: 2015, grapes: 'Chardonnay', why: 'Cremige Perlage und straffe Zitrus-Säure ergänzen die grünen Frühlingsaromen des Spargels perfekt.', score: 88, price: '€€€' },
  ],
  lachs: [
    { id: 11, name: 'Domaine Leflaive Puligny-Montrachet', type: 'Weiß', region: 'Burgund, Frankreich', vintage: 2019, grapes: 'Chardonnay', why: 'Butterige Fülle des Chardonnay spiegelt die Fettnoten des Lachses. Nussige Toastnoten ergänzen Röstaromen präzise.', score: 96, price: '€€€€' },
    { id: 12, name: 'Billecart-Salmon Rosé', type: 'Rosé', region: 'Champagne, Frankreich', vintage: 2016, grapes: 'Chardonnay, Pinot Noir', why: 'Delikate Roséfarbe und feine Erdbeernote kontern den fetthaltigen Lachs wunderschön. Ein elegantes Sommerpairing.', score: 89, price: '€€€' },
    { id: 13, name: 'Sancerre Blanc Henri Bourgeois', type: 'Weiß', region: 'Loire, Frankreich', vintage: 2022, grapes: 'Sauvignon Blanc', why: 'Grüne Kräuter und Zitrusfrische schneiden durchs Fett und heben Dill-Aromen hervor.', score: 87, price: '€€' },
  ],
  jakobsmuschel: [
    { id: 14, name: 'Domaine Leflaive Bâtard-Montrachet', type: 'Weiß', region: 'Burgund, Frankreich', vintage: 2018, grapes: 'Chardonnay', why: 'Die natürliche Süße der Jakobsmuschel findet ihr Pendant im reifen Chardonnay. Mineral und Butter erzeugen ein harmonisches Ganzes.', score: 98, price: '€€€€' },
    { id: 15, name: 'Krug Grande Cuvée', type: 'Schaumwein', region: 'Champagne, Frankreich', vintage: 2012, grapes: 'Chardonnay, Pinot Noir, Meunier', why: 'Oxidative Noten und Brioche-Aromen umschließen die Karamell-Süße der angebratenen Muschel. Klassisch und luxuriös.', score: 96, price: '€€€€' },
    { id: 16, name: 'Albariño Rías Baixas Pazo de Señorans', type: 'Weiß', region: 'Galicien, Spanien', vintage: 2022, grapes: 'Albariño', why: 'Salzige Meeresfrische und Pfirsich-Noten spiegeln das Meeresaroma der Jakobsmuschel und unterstreichen die Süße.', score: 90, price: '€€' },
  ],
};

const typeColors: Record<string, string> = {
  Rot: '#E06B6B', Weiß: '#E2C06A', Rosé: '#E8A0B0', Schaumwein: '#7BB8D4',
};

function WineCard({ wine }: { wine: WineRec }) {
  const color = typeColors[wine.type];
  return (
    <div className="bg-card border border-border rounded-xl p-5 hover:border-gold/30 transition-all">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-[11px] px-2.5 py-0.5 rounded-full font-semibold"
              style={{ background: `${color}15`, color, border: `1px solid ${color}35` }}>
              {wine.type}
            </span>
            <span className="text-[11px] text-text-muted">{wine.price}</span>
          </div>
          <h3 className="font-heading text-[16px] font-bold text-text-primary leading-snug">{wine.name}</h3>
        </div>
        <div className="flex-shrink-0 w-12 h-12 rounded-xl flex flex-col items-center justify-center"
          style={{ background: `${color}12`, border: `1px solid ${color}25` }}>
          <span className="text-[15px] font-bold leading-none" style={{ color }}>{wine.score}</span>
          <span className="text-[9px] text-text-muted mt-0.5">Match</span>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mb-3 text-[12px] text-text-muted">
        <span className="flex items-center gap-1"><MapPin size={11} />{wine.region}</span>
        <span className="flex items-center gap-1"><Calendar size={11} />{wine.vintage}</span>
        <span className="italic">{wine.grapes}</span>
      </div>

      <div className="h-1 bg-background rounded-full overflow-hidden mb-3.5">
        <div className="h-full rounded-full" style={{ width: `${wine.score}%`, background: color }} />
      </div>

      <p className="text-[12px] text-text-secondary leading-relaxed">{wine.why}</p>
    </div>
  );
}

const suggestions = ['Weißer Spargel', 'Jakobsmuschel', 'Lachs', 'Kalbsbäckchen', 'Foie Gras', 'Rote Bete'];

export default function WeinPairingPage() {
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<WineType>('Alle');
  const [results, setResults] = useState<WineRec[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const filters: WineType[] = ['Alle', 'Rot', 'Weiß', 'Rosé', 'Schaumwein'];

  const handleSearch = async (q = query) => {
    if (!q.trim()) return;
    setLoading(true);
    setFilter('Alle');
    await new Promise(r => setTimeout(r, 1200));
    const key = q.toLowerCase().includes('spargel') ? 'spargel'
      : q.toLowerCase().includes('lachs') ? 'lachs'
      : q.toLowerCase().includes('jakobs') ? 'jakobsmuschel'
      : 'default';
    setResults(wineDb[key]);
    setSearched(true);
    setLoading(false);
  };

  const filtered = results.filter(w => filter === 'Alle' || w.type === filter);

  return (
    <div style={{ background: '#0A0A0A', minHeight: '100vh' }}>
      <div className="px-8 pt-8 pb-6" style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
        <div className="text-[10px] font-semibold tracking-[4px] uppercase mb-2" style={{ color: 'rgba(201,168,76,0.55)' }}>✦ &nbsp;Sommellerie</div>
        <h1 className="font-heading font-bold leading-none" style={{ fontSize: 28, color: '#F5F0E8', letterSpacing: '2px', textTransform: 'uppercase' }}>Wein & Pairing</h1>
        <p className="mt-1.5" style={{ color: 'rgba(168,152,128,0.65)', fontSize: 13 }}>Gib ein Gericht oder eine Zutat ein für präzise Weinempfehlungen</p>
      </div>
      <div className="p-8 max-w-[1200px]">

      <div className="bg-card border border-border rounded-xl p-5 mb-7">
        <div className="flex gap-3">
          <div className="relative flex-1">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted" />
            <input
              value={query}
              onChange={e => setQuery(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSearch()}
              placeholder="z.B. Jakobsmuschel, weißer Spargel, Kalbsbäckchen…"
              className="w-full bg-background border border-border-strong rounded-lg pl-10 pr-4 py-2.5 text-text-primary text-[13px] outline-none focus:border-gold/40" />
          </div>
          <button onClick={() => handleSearch()} disabled={loading || !query.trim()}
            className="px-5 py-2.5 rounded-lg font-semibold text-[13px] flex items-center gap-2 transition-all disabled:opacity-50 flex-shrink-0"
            style={{ background: 'linear-gradient(135deg, #9A7A30, #E2C06A)', color: '#0A0A0A' }}>
            {loading ? <><Loader2 size={15} className="animate-spin" /> Suche…</> : <><Search size={15} /> Pairing finden</>}
          </button>
        </div>

        <div className="flex gap-2 flex-wrap mt-3.5">
          {suggestions.map(s => (
            <button key={s} onClick={() => { setQuery(s); handleSearch(s); }}
              className="text-[11px] px-2.5 py-1 rounded-full bg-background border border-border text-text-muted hover:border-gold/30 hover:text-text-secondary transition-all">
              {s}
            </button>
          ))}
        </div>
      </div>

      {searched && results.length > 0 && (
        <div className="flex items-center gap-2 mb-5">
          <span className="text-[11px] text-text-muted font-semibold uppercase tracking-widest mr-1">Filter</span>
          {filters.map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className="px-3.5 py-1.5 rounded-full text-[12px] font-medium transition-all"
              style={{
                background: filter === f ? 'rgba(201,168,76,0.12)' : 'rgba(255,255,255,0.04)',
                border: `1px solid ${filter === f ? 'rgba(201,168,76,0.35)' : 'rgba(255,255,255,0.08)'}`,
                color: filter === f ? '#C9A84C' : '#A89880',
              }}>
              {f}
            </button>
          ))}
          <span className="ml-auto text-[12px] text-text-muted">{filtered.length} Empfehlung{filtered.length !== 1 ? 'en' : ''}</span>
        </div>
      )}

      {searched ? (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(340px,1fr))] gap-4">
          {filtered.map(w => <WineCard key={w.id} wine={w} />)}
        </div>
      ) : (
        <div className="text-center py-20 border border-dashed border-border rounded-xl">
          <div className="w-16 h-16 rounded-xl mx-auto mb-4 flex items-center justify-center"
            style={{ background: 'rgba(201,168,76,0.1)', border: '1px solid rgba(201,168,76,0.25)' }}>
            <Wine size={28} color="#C9A84C" strokeWidth={1.5} />
          </div>
          <p className="font-heading text-xl text-text-primary mb-2">Bereit für das perfekte Pairing</p>
          <p className="text-text-secondary text-[13px]">Gib ein Gericht oder eine Zutat ein – oder nutze einen Vorschlag oben</p>
        </div>
      )}
    </div>
    </div>
  );
}
