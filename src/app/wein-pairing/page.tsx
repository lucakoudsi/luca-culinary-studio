'use client';
import { useState, useEffect, useRef } from 'react';
import { useStore } from '@/lib/store';
import { matchWeine, RULE_LABELS, type Wein, type FoodProfile, type WeinMatch } from '@/lib/weinPairing';
import { Wine, Search, Leaf, MapPin, Loader2, AlertCircle, ChevronDown, X } from 'lucide-react';
import type { Ingredient } from '@/types';
import PageTransition from '@/components/ui/PageTransition';

// ─── Types ────────────────────────────────────────────────────────────────────

type WeinTyp = 'Alle' | 'weiss' | 'rot' | 'rose' | 'schaumwein' | 'suesswein';
type Modus   = 'gericht' | 'zutat';

const TYP_META: Record<string, { label: string; color: string }> = {
  weiss:      { label: 'Weißwein',   color: '#9B6E1A' },
  rot:        { label: 'Rotwein',    color: '#C04040' },
  rose:       { label: 'Rosé',       color: '#C06080' },
  schaumwein: { label: 'Schaumwein', color: '#3A80A8' },
  suesswein:  { label: 'Süßwein',    color: '#8B4A9B' },
};

const WINE_TYPES: WeinTyp[] = ['Alle', 'weiss', 'rot', 'rose', 'schaumwein', 'suesswein'];

// ─── Helpers ──────────────────────────────────────────────────────────────────

// Fuzzy name match: exact → starts-with → contains → query-contains-name
function findIngredient(query: string, list: Ingredient[]): Ingredient | null {
  if (!query.trim()) return null;
  const q = query.toLowerCase().trim();
  return (
    list.find(i => i.name.toLowerCase() === q) ??
    list.find(i => i.name.toLowerCase().startsWith(q)) ??
    list.find(i => i.name.toLowerCase().includes(q)) ??
    list.find(i => q.includes(i.name.toLowerCase())) ??
    null
  );
}

// ─── WeinCard ────────────────────────────────────────────────────────────────

function WeinCard({ match }: { match: WeinMatch }) {
  const { wein, score, gründe } = match;
  const meta = TYP_META[wein.typ] ?? { label: wein.typ, color: '#8B7355' };
  return (
    <div className="bg-white border border-[#E8E0D8] rounded-xl p-5 transition-all hover:border-[rgba(107,58,75,0.3)]">
      <div className="flex items-start gap-3 mb-3">
        {/* Score badge */}
        <div className="flex-shrink-0 w-12 h-12 rounded-xl flex flex-col items-center justify-center"
          style={{ background: `${meta.color}12`, border: `1px solid ${meta.color}30` }}>
          <span className="text-[15px] font-bold leading-none" style={{ color: meta.color }}>{score}</span>
          <span className="text-[9px] text-[#B09880] mt-0.5">Match</span>
        </div>
        <div className="flex-1 min-w-0">
          <div className="mb-1">
            <span className="text-[11px] px-2 py-0.5 rounded-full font-semibold"
              style={{ background: `${meta.color}15`, color: meta.color, border: `1px solid ${meta.color}30` }}>
              {meta.label}
            </span>
          </div>
          <h3 className="font-heading text-[15px] font-bold text-[#2C2420] leading-snug">{wein.name}</h3>
          <p className="text-[11px] text-[#B09880] mt-0.5 italic">{wein.rebsorte}</p>
        </div>
      </div>

      {/* Match bar */}
      <div className="h-1 bg-[#F5F2EE] rounded-full overflow-hidden mb-3">
        <div className="h-full rounded-full" style={{ width: `${score}%`, background: meta.color }} />
      </div>

      <div className="flex items-center gap-1.5 mb-3 text-[12px] text-[#8B7355]">
        <MapPin size={11} className="flex-shrink-0" />
        <span>{wein.region}, {wein.land}</span>
      </div>

      {wein.beschreibung && (
        <p className="text-[12px] text-[#8B7355] leading-relaxed mb-3">{wein.beschreibung}</p>
      )}

      {/* Pairing reason */}
      <div className="text-[11px] px-3 py-2 rounded-lg"
        style={{ background: 'rgba(107,58,75,0.05)', border: '1px solid rgba(107,58,75,0.12)', color: '#6B3A4B' }}>
        <span className="font-semibold">Passt wegen: </span>
        {gründe.map(g => RULE_LABELS[g] ?? g).join(' · ')}
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function WeinPairingPage() {
  const { ingredients, fetchIngredients } = useStore();
  const [weine, setWeine]           = useState<Wein[]>([]);
  const [weinLoading, setWeinLoading] = useState(true);
  const [modus, setModus]           = useState<Modus>('gericht');

  // Mode A — Freitext
  const [freitext, setFreitext]         = useState('');
  const [noMatch, setNoMatch]           = useState(false);
  const [matchedName, setMatchedName]   = useState('');

  // Mode B — Zutat aus Bibliothek
  const [zutatenSearch, setZutatenSearch]   = useState('');
  const [showDropdown, setShowDropdown]     = useState(false);
  const [selectedZutat, setSelectedZutat]   = useState<Ingredient | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Results (shared)
  const [results, setResults]       = useState<WeinMatch[]>([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [typeFilter, setTypeFilter] = useState<WeinTyp>('Alle');

  // ── Load wines + ingredients on mount ──────────────────────────────────────
  useEffect(() => {
    if (ingredients.length === 0) fetchIngredients();
    fetch('/api/weine')
      .then(r => r.json())
      .then((data: Wein[]) => setWeine(Array.isArray(data) ? data : []))
      .catch(() => {})
      .finally(() => setWeinLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    if (!showDropdown) return;
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [showDropdown]);

  // ── Engine ─────────────────────────────────────────────────────────────────
  const runEngine = (profile: FoodProfile) => {
    setResults(matchWeine(profile, weine));
    setHasSearched(true);
    setTypeFilter('Alle');
  };

  // ── Mode A handler ─────────────────────────────────────────────────────────
  const handleFreitextSearch = () => {
    if (!freitext.trim()) return;
    const zutat = findIngredient(freitext, ingredients);
    if (!zutat) {
      setNoMatch(true);
      setMatchedName('');
      setResults([]);
      setHasSearched(false);
      return;
    }
    setNoMatch(false);
    setMatchedName(zutat.name);
    runEngine(zutat.geschmack);
  };

  // ── Mode B handler ─────────────────────────────────────────────────────────
  const handleZutatSelect = (zutat: Ingredient) => {
    setSelectedZutat(zutat);
    setZutatenSearch(zutat.name);
    setShowDropdown(false);
    runEngine(zutat.geschmack);
  };

  const clearZutat = () => {
    setSelectedZutat(null);
    setZutatenSearch('');
    setResults([]);
    setHasSearched(false);
  };

  // ── Filtered ingredients for dropdown ──────────────────────────────────────
  const filteredZutaten = ingredients
    .filter(i => i.name.toLowerCase().includes(zutatenSearch.toLowerCase()))
    .slice(0, 25);

  // ── Filtered wine results ──────────────────────────────────────────────────
  const displayedResults = typeFilter === 'Alle'
    ? results
    : results.filter(r => r.wein.typ === typeFilter);

  const switchModus = (m: Modus) => {
    setModus(m);
    setHasSearched(false);
    setNoMatch(false);
    setResults([]);
  };

  return (
    <PageTransition>
      <div style={{ background: 'var(--bg)', minHeight: '100vh' }}>

        {/* Header */}
        <div className="px-8 pt-8 pb-6" style={{ borderBottom: '1px solid var(--border)' }}>
          <div className="text-[10px] font-semibold tracking-[4px] uppercase mb-2"
            style={{ color: 'rgba(107,58,75,0.55)' }}>✦ &nbsp;Sommellerie</div>
          <h1 className="font-heading font-bold leading-none"
            style={{ fontSize: 28, color: 'var(--text)', letterSpacing: '2px', textTransform: 'uppercase' }}>
            Wein & Pairing
          </h1>
          <p className="mt-1.5 text-[13px]" style={{ color: 'var(--text-muted)' }}>
            Regelbasierte Weinempfehlungen nach Geschmacksprofil
          </p>
        </div>

        <div className="p-8 max-w-[1200px]">

          {/* Mode Tabs */}
          <div className="flex gap-2 mb-6">
            {(['gericht', 'zutat'] as Modus[]).map(m => (
              <button key={m} onClick={() => switchModus(m)}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-[13px] font-semibold transition-all"
                style={{
                  background: modus === m ? 'linear-gradient(135deg, #562E3C, #7D4558)' : 'rgba(0,0,0,0.04)',
                  color:      modus === m ? '#FFFFFF' : '#8B7355',
                  border:     `1px solid ${modus === m ? 'transparent' : 'rgba(0,0,0,0.08)'}`,
                }}>
                {m === 'gericht' ? <Search size={13} /> : <Leaf size={13} />}
                {m === 'gericht' ? 'Nach Gericht / Zutat' : 'Aus Bibliothek wählen'}
              </button>
            ))}
          </div>

          {/* ── Mode A: Freitext ─────────────────────────────────────────────── */}
          {modus === 'gericht' && (
            <div className="bg-white border border-[#E8E0D8] rounded-xl p-5 mb-6">
              <p className="text-[12px] text-[#8B7355] mb-3">
                Gib einen Zutaten- oder Gerichtsnamen ein. Das System sucht in der Bibliothek nach dem Geschmacksprofil.
              </p>
              <div className="flex gap-3">
                <div className="relative flex-1">
                  <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#B09880]" />
                  <input
                    value={freitext}
                    onChange={e => { setFreitext(e.target.value); setNoMatch(false); }}
                    onKeyDown={e => e.key === 'Enter' && handleFreitextSearch()}
                    placeholder="z.B. Lachs, Spargel, Ziegenkäse, Rote Bete…"
                    className="w-full border border-[#E8E0D8] rounded-lg pl-10 pr-4 py-2.5 text-[13px] text-[#2C2420] outline-none bg-[#FAFAF9]"
                    style={{ borderColor: noMatch ? 'rgba(192,80,80,0.4)' : undefined }}
                  />
                </div>
                <button
                  onClick={handleFreitextSearch}
                  disabled={!freitext.trim() || weinLoading}
                  className="px-5 py-2.5 rounded-lg font-semibold text-[13px] text-white disabled:opacity-40 transition-all flex-shrink-0"
                  style={{ background: 'linear-gradient(135deg, #562E3C, #7D4558)' }}>
                  Pairing finden
                </button>
              </div>

              {/* No match error */}
              {noMatch && (
                <div className="flex items-start gap-2 mt-3 px-4 py-3 rounded-lg text-[12px]"
                  style={{ background: 'rgba(192,80,80,0.06)', border: '1px solid rgba(192,80,80,0.2)', color: '#C05050' }}>
                  <AlertCircle size={14} className="flex-shrink-0 mt-0.5" />
                  <span>
                    <strong>Zutat nicht in der Bibliothek.</strong> Wechsel zu „Aus Bibliothek wählen" und wähl die Zutat direkt — oder füge sie zuerst in die Zutatenbibliothek ein.
                  </span>
                </div>
              )}

              {/* Match confirmation */}
              {matchedName && hasSearched && !noMatch && (
                <p className="text-[11px] text-[#8B7355] mt-2">
                  Geschmacksprofil von <strong className="text-[#6B3A4B]">{matchedName}</strong> wird verwendet.
                </p>
              )}
            </div>
          )}

          {/* ── Mode B: Aus Bibliothek ────────────────────────────────────────── */}
          {modus === 'zutat' && (
            <div className="bg-white border border-[#E8E0D8] rounded-xl p-5 mb-6">
              <p className="text-[12px] text-[#8B7355] mb-3">
                Wähl eine Zutat aus der Bibliothek — ihr Geschmacksprofil fließt direkt in die Pairing-Engine.
              </p>
              <div ref={dropdownRef} className="relative">
                <div className="flex items-center border border-[#E8E0D8] rounded-lg bg-[#FAFAF9] focus-within:border-[rgba(107,58,75,0.35)] transition-colors">
                  <Leaf size={14} className="ml-3.5 flex-shrink-0 text-[#B09880]" />
                  <input
                    value={zutatenSearch}
                    onChange={e => { setZutatenSearch(e.target.value); setShowDropdown(true); setSelectedZutat(null); setHasSearched(false); }}
                    onFocus={() => setShowDropdown(true)}
                    placeholder="Zutat suchen…"
                    className="flex-1 px-3 py-2.5 text-[13px] text-[#2C2420] bg-transparent outline-none"
                  />
                  {selectedZutat ? (
                    <button onClick={clearZutat} className="mr-3 text-[#B09880] hover:text-[#8B7355] transition-colors">
                      <X size={14} />
                    </button>
                  ) : (
                    <ChevronDown size={14} className="mr-3 text-[#B09880]" />
                  )}
                </div>

                {showDropdown && filteredZutaten.length > 0 && (
                  <div className="absolute z-20 left-0 right-0 mt-1 bg-white border border-[#E8E0D8] rounded-xl shadow-lg overflow-hidden max-h-64 overflow-y-auto">
                    {filteredZutaten.map(z => (
                      <button key={z.id} onClick={() => handleZutatSelect(z)}
                        className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-[#FAF8F5] transition-colors text-left">
                        <div className="flex-1 min-w-0">
                          <div className="text-[13px] font-medium text-[#2C2420] truncate">{z.name}</div>
                          <div className="text-[11px] text-[#B09880]">{z.kategorie}</div>
                        </div>
                        {/* Mini flavor bar preview */}
                        {z.geschmack && (
                          <div className="flex items-end gap-0.5 flex-shrink-0">
                            {(['acidity','sweetness','bitterness','umami','spiciness'] as const).map(k => (
                              <div key={k} className="w-1.5 rounded-sm bg-[#E8E0D8] overflow-hidden" style={{ height: 14 }}>
                                <div className="w-full rounded-sm bg-[#6B3A4B]"
                                  style={{ height: `${(z.geschmack[k] / 5) * 100}%`, marginTop: 'auto' }} />
                              </div>
                            ))}
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Selected ingredient profile chips */}
              {selectedZutat?.geschmack && (
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {Object.entries(selectedZutat.geschmack).map(([key, val]) => (
                    val > 0 && (
                      <span key={key} className="text-[11px] px-2.5 py-1 rounded-full font-medium"
                        style={{ background: 'rgba(107,58,75,0.08)', color: '#6B3A4B', border: '1px solid rgba(107,58,75,0.18)' }}>
                        {key} {val}/5
                      </span>
                    )
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── Loading wines ─────────────────────────────────────────────────── */}
          {weinLoading && (
            <div className="flex items-center justify-center py-12 text-[13px]" style={{ color: 'var(--text-muted)' }}>
              <Loader2 size={18} className="animate-spin mr-2 text-[#6B3A4B]" />
              Weinbibliothek wird geladen…
            </div>
          )}

          {/* ── Results ──────────────────────────────────────────────────────── */}
          {!weinLoading && hasSearched && results.length > 0 && (
            <>
              {/* Type filter */}
              <div className="flex items-center gap-2 flex-wrap mb-5">
                {WINE_TYPES.map(t => {
                  const meta  = t === 'Alle' ? { label: 'Alle', color: '#6B3A4B' } : (TYP_META[t] ?? { label: t, color: '#8B7355' });
                  const count = t === 'Alle' ? results.length : results.filter(r => r.wein.typ === t).length;
                  if (count === 0 && t !== 'Alle') return null;
                  return (
                    <button key={t} onClick={() => setTypeFilter(t)}
                      className="px-3.5 py-1.5 rounded-full text-[12px] font-medium transition-all"
                      style={{
                        background: typeFilter === t ? `${meta.color}15` : 'rgba(0,0,0,0.04)',
                        border:     `1px solid ${typeFilter === t ? `${meta.color}40` : 'rgba(0,0,0,0.08)'}`,
                        color:      typeFilter === t ? meta.color : '#8B7355',
                      }}>
                      {meta.label} ({count})
                    </button>
                  );
                })}
                <span className="ml-auto text-[12px] text-[#B09880]">
                  {displayedResults.length} Empfehlung{displayedResults.length !== 1 ? 'en' : ''}
                </span>
              </div>

              <div className="grid grid-cols-[repeat(auto-fill,minmax(320px,1fr))] gap-4">
                {displayedResults.map(m => <WeinCard key={m.wein.id} match={m} />)}
              </div>
            </>
          )}

          {/* ── Empty state ───────────────────────────────────────────────────── */}
          {!weinLoading && !hasSearched && !noMatch && (
            <div className="text-center py-20 border border-dashed border-[#E8E0D8] rounded-xl">
              <div className="w-16 h-16 rounded-xl mx-auto mb-4 flex items-center justify-center"
                style={{ background: 'rgba(107,58,75,0.08)', border: '1px solid rgba(107,58,75,0.2)' }}>
                <Wine size={28} color="#6B3A4B" strokeWidth={1.5} />
              </div>
              <p className="font-heading text-xl text-[#2C2420] mb-2">Bereit für das perfekte Pairing</p>
              <p className="text-[13px]" style={{ color: 'var(--text-muted)' }}>
                {modus === 'gericht'
                  ? 'Gib eine Zutat ein — das System sucht deren Profil in der Bibliothek'
                  : 'Wähl eine Zutat aus der Bibliothek für sofortige Empfehlungen'}
              </p>
              {weine.length === 0 && !weinLoading && (
                <p className="text-[12px] mt-3 px-4 py-2 rounded-lg mx-auto inline-block"
                  style={{ background: 'rgba(192,140,40,0.08)', border: '1px solid rgba(192,140,40,0.25)', color: '#9B6E1A' }}>
                  Keine Weine in der Datenbank — bitte erst den Seed ausführen
                </p>
              )}
            </div>
          )}

        </div>
      </div>
    </PageTransition>
  );
}
