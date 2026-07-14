'use client';
import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useStore } from '@/lib/store';
import { createClient } from '@/utils/supabase/client';
import dynamic from 'next/dynamic';
import { compressImage, validateImageFile } from '@/lib/imageUtils';
import { submitGlow } from '@/lib/utils';

const PhotoZone = dynamic(() => import('@/components/ui/PhotoZone'), { ssr: false });
import KomponenteCard from '@/components/recipes/KomponenteCard';
import type { Recipe, RecipeIngredient, RecipeKomponente } from '@/types';
import {
  ArrowLeft, Star, Tag, Wine, ChefHat, Plus, X, ChevronUp, ChevronDown,
  Eye, BookOpen, Clock, ImagePlus, Loader2, Calculator, Link2, Download, FileText, Sparkles, Images,
} from 'lucide-react';
import { FlavorSliders } from '@/components/ui/FlavorSliders';
import { computeRecipeFlavorProfile, EMPTY_FLAVOR } from '@/lib/recipeFlavorUtils';
import { parseRecipeText } from '@/lib/recipeTextParser';
import { REZEPT_KATEGORIEN, REZEPT_SCHWIERIGKEITEN, REZEPT_SAISONS } from '@/config/rezeptFelder';
import type { FlavorProfile } from '@/types';

// ─── Constants ───────────────────────────────────────────────────────────────
const CATEGORIES   = REZEPT_KATEGORIEN;
const DIFFICULTIES = REZEPT_SCHWIERIGKEITEN;
const SEASONS      = REZEPT_SAISONS;
const STATUSES     = ['Entwurf', 'In Bearbeitung', 'Fertig'] as const;
const MAX_IMPORT_IMAGES = 5; // muss zum Server-Limit in api/rezepte/import-bild passen

const diffColor:   Record<string, string> = { Leicht: '#7CB87A', Mittel: '#E8A838', Schwer: '#E06B6B' };
const statusColor: Record<string, string> = { Fertig: '#7CB87A', 'In Bearbeitung': '#E8A838', Entwurf: '#7BB8D4' };

const IC  = "w-full bg-card border border-border-strong rounded-lg px-3.5 py-2.5 text-text-primary text-sm outline-none focus:border-gold/40 transition-colors placeholder:text-text-muted";
const LC  = "block text-[10px] text-text-muted font-semibold mb-1.5 uppercase tracking-wider";
const SEC = "bg-card border border-border rounded-2xl p-6";
const STL = "font-heading text-[16px] font-bold text-text-primary mb-5 flex items-center gap-2.5";
const ABT = "flex items-center gap-1.5 text-[12px] text-gold hover:text-gold-light transition-colors mt-3";

// ─── StarRating ──────────────────────────────────────────────────────────────
function StarRating({ value, onChange }: { value: number; onChange?: (v: number) => void }) {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map(i => (
        <button key={i} type="button" onClick={() => onChange?.(i)}
          className={onChange ? 'cursor-pointer' : 'cursor-default'}>
          <Star size={onChange ? 22 : 14} fill={i <= value ? '#6B3A4B' : 'none'} color={i <= value ? '#6B3A4B' : '#D4C9BC'} />
        </button>
      ))}
    </div>
  );
}

// ─── RecipePreview ───────────────────────────────────────────────────────────
function RecipePreview({ recipe, onClose }: { recipe: Partial<Recipe>; onClose: () => void }) {
  const [tab, setTab] = useState<'card' | 'detail'>('card');
  const sc = statusColor[(recipe.status as string) ?? 'Entwurf'];
  const dc = diffColor[(recipe.difficulty as string) ?? 'Mittel'];

  const tabBtn = (t: 'card' | 'detail', label: string) => (
    <button onClick={() => setTab(t)}
      className="px-4 py-2 text-[13px] font-medium rounded-lg transition-all"
      style={{
        background: tab === t ? 'rgba(107,58,75,0.1)' : 'transparent',
        color: tab === t ? '#6B3A4B' : 'var(--text-muted)',
        border: `1px solid ${tab === t ? 'rgba(107,58,75,0.25)' : 'transparent'}`,
      }}>
      {label}
    </button>
  );

  return (
    <div className="fixed inset-0 z-50 flex flex-col" style={{ background: 'var(--bg)' }}>
      {/* Header */}
      <div className="flex items-center justify-between px-8 py-4 border-b border-border">
        <div className="flex items-center gap-3">
          <button onClick={onClose}
            className="flex items-center gap-1.5 text-text-muted hover:text-text-primary transition-colors text-[13px]">
            <ArrowLeft size={15} /> Zurück zur Bearbeitung
          </button>
          <div className="w-px h-4 bg-border" />
          <span className="text-[13px] text-text-muted">Vorschau</span>
        </div>
        <div className="flex gap-2">
          {tabBtn('card', 'Kartenansicht')}
          {tabBtn('detail', 'Detailansicht')}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto flex items-start justify-center p-10">
        {tab === 'card' ? (
          /* ── Card Preview ───────────────────────────── */
          <div className="w-[300px]">
            <p className="text-[11px] text-text-muted text-center mb-4 uppercase tracking-widest">So erscheint die Karte im Archiv</p>
            <div className="bg-card border border-border rounded-xl overflow-hidden shadow-lg">
              <div className="h-44 relative overflow-hidden"
                style={recipe.image
                  ? { backgroundImage: `url(${recipe.image})`, backgroundSize: 'cover', backgroundPosition: 'center' }
                  : { background: 'linear-gradient(135deg, #1a1500 0%, #0d0d0d 100%)' }}>
                {!recipe.image && <BookOpen size={36} className="absolute inset-0 m-auto opacity-25" strokeWidth={1} color="#6B3A4B" />}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                <div className="absolute top-3 left-3">
                  <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full"
                    style={{ color: sc, background: `${sc}18`, border: `1px solid ${sc}40` }}>
                    {recipe.status ?? 'Entwurf'}
                  </span>
                </div>
                <div className="absolute top-3 right-3 flex items-center gap-1 bg-black/50 rounded-md px-2 py-1 text-[11px] text-white/50">
                  <Eye size={10} /> 0
                </div>
              </div>
              <div className="p-4">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <h3 className="font-heading text-[15px] font-bold text-text-primary leading-snug">
                    {recipe.title || <span className="text-text-muted italic">Kein Titel</span>}
                  </h3>
                  <span className="text-[11px] text-text-muted flex-shrink-0 flex items-center gap-1">
                    <Clock size={11} />{recipe.time ?? 0}m
                  </span>
                </div>
                <p className="text-[12px] text-text-muted leading-relaxed mb-3 line-clamp-2">
                  {recipe.description || 'Keine Beschreibung'}
                </p>
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {(recipe.tags ?? []).slice(0, 3).map((t, i) => (
                    <span key={i} className="text-[10px] px-2 py-0.5 rounded-full bg-card-hover text-text-muted border border-border">{t}</span>
                  ))}
                </div>
                <div className="flex items-center justify-between pt-2.5 border-t border-border">
                  <span className="text-[11px] font-semibold" style={{ color: dc }}>{recipe.difficulty ?? 'Mittel'}</span>
                  <span className="text-[11px] text-text-muted">{recipe.category ?? 'Hauptgang'}</span>
                  <div className="flex gap-0.5">
                    {[1,2,3,4,5].map(i => <Star key={i} size={11} fill={i <= (recipe.rating ?? 3) ? '#6B3A4B' : 'none'} color={i <= (recipe.rating ?? 3) ? '#6B3A4B' : '#D4C9BC'} />)}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* ── Detail Preview ─────────────────────────── */
          <div className="w-full max-w-2xl">
            <p className="text-[11px] text-text-muted text-center mb-4 uppercase tracking-widest">Detailansicht</p>
            <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-lg">
              <div className="h-48 relative overflow-hidden"
                style={recipe.image
                  ? { backgroundImage: `url(${recipe.image})`, backgroundSize: 'cover', backgroundPosition: 'center' }
                  : { background: 'linear-gradient(135deg, #1a1500 0%, #0d0d0d 100%)' }}>
                {!recipe.image && <BookOpen size={42} className="absolute inset-0 m-auto opacity-20" strokeWidth={1} color="#6B3A4B" />}
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                <div className="absolute bottom-4 left-6">
                  <div className="flex gap-2 mb-2">
                    <span className="text-[11px] px-2.5 py-1 rounded-full font-semibold"
                      style={{ color: sc, background: `${sc}18`, border: `1px solid ${sc}40` }}>
                      {recipe.status ?? 'Entwurf'}
                    </span>
                    <span className="text-[11px] px-2.5 py-1 rounded-full bg-black/40 text-white/70">
                      {recipe.category ?? 'Hauptgang'}
                    </span>
                  </div>
                  <h2 className="font-heading text-[22px] font-bold text-white leading-tight drop-shadow">
                    {recipe.title || 'Kein Titel'}
                  </h2>
                </div>
              </div>
              <div className="p-7">
                <p className="text-[14px] text-text-muted leading-relaxed mb-5">
                  {recipe.description || 'Keine Beschreibung vorhanden.'}
                </p>
                <div className="grid grid-cols-3 gap-3 mb-6">
                  {[
                    { label: 'Schwierigkeit', value: recipe.difficulty ?? 'Mittel', color: dc },
                    { label: 'Zeit', value: `${recipe.time ?? 0} Min` },
                    { label: 'Saison', value: recipe.season ?? 'Ganzjährig' },
                  ].map(item => (
                    <div key={item.label} className="bg-card-hover rounded-lg p-3 text-center border border-border">
                      <div className="text-[10px] text-text-muted mb-1 uppercase tracking-wide">{item.label}</div>
                      <div className="text-[13px] font-semibold" style={{ color: item.color || 'var(--text)' }}>{item.value}</div>
                    </div>
                  ))}
                </div>

                {/* Zutaten */}
                {(recipe.zutaten ?? []).length > 0 && (
                  <div className="mb-5">
                    <div className="text-[10px] text-text-muted font-semibold mb-2 uppercase tracking-wider flex items-center gap-1.5"><Tag size={10} /> Zutaten</div>
                    <div className="bg-card-hover rounded-xl border border-border divide-y divide-border">
                      {(recipe.zutaten ?? []).map((z, i) => (
                        <div key={i} className="flex justify-between px-4 py-2 text-[13px]">
                          <span className="text-text-primary">{z.name}</span>
                          <span className="text-text-muted">{z.menge}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Komponenten */}
                {(recipe.komponenten ?? []).length > 0 && (
                  <div className="mb-5 space-y-3">
                    <div className="text-[10px] text-text-muted font-semibold mb-2 uppercase tracking-wider">Komponenten</div>
                    {(recipe.komponenten ?? []).map((k, i) => (
                      <div key={i} className="bg-card-hover border border-border rounded-xl p-4">
                        <div className="font-semibold text-text-primary mb-2">{k.name}</div>
                        {k.zutaten.map((z, j) => (
                          <div key={j} className="flex justify-between text-[12px] mb-1">
                            <span className="text-text-muted">{z.name}</span>
                            <span className="text-text-muted">{z.menge}</span>
                          </div>
                        ))}
                        {k.zubereitung && <p className="text-[12px] text-text-muted mt-2 pt-2 border-t border-border">{k.zubereitung}</p>}
                      </div>
                    ))}
                  </div>
                )}

                {/* Schritte */}
                {(recipe.schritte ?? []).length > 0 && (
                  <div className="mb-5">
                    <div className="text-[10px] text-text-muted font-semibold mb-3 uppercase tracking-wider">Zubereitung</div>
                    <div className="space-y-3">
                      {(recipe.schritte ?? []).map((s, i) => (
                        <div key={i} className="flex gap-3">
                          <div className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 text-[10px] font-bold mt-0.5"
                            style={{ background: 'rgba(107,58,75,0.1)', color: '#6B3A4B', border: '1px solid rgba(107,58,75,0.2)' }}>
                            {i + 1}
                          </div>
                          <p className="text-[13px] text-text-muted leading-relaxed">{s}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {recipe.getraenke && (
                  <div className="mb-5">
                    <div className="text-[10px] text-text-muted font-semibold mb-2 uppercase tracking-wider flex items-center gap-1.5"><Wine size={10} /> Getränkeempfehlung</div>
                    <p className="text-[13px] text-text-muted bg-card-hover border border-border rounded-xl p-4">{recipe.getraenke}</p>
                  </div>
                )}
                {recipe.chefTipps && (
                  <div>
                    <div className="text-[10px] text-text-muted font-semibold mb-2 uppercase tracking-wider flex items-center gap-1.5"><ChefHat size={10} /> Chef-Tipps</div>
                    <p className="text-[13px] text-text-muted bg-card-hover border border-border rounded-xl p-4">{recipe.chefTipps}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function NewRezeptPage() {
  return (
    <Suspense fallback={null}>
      <NewRezeptForm />
    </Suspense>
  );
}

function NewRezeptForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { addRecipe, ingredients, fetchIngredients } = useStore();

  useEffect(() => { if (ingredients.length === 0) fetchIngredients(); }, []);

  // Form base fields
  const [base, setBase] = useState({
    title: '', category: 'Hauptgang', status: 'Entwurf',
    difficulty: 'Mittel', time: 60, season: 'Ganzjährig',
    tags: '', rating: 3, description: '', portionen: 4,
  });

  // Extended fields
  const [zutaten, setZutaten]         = useState<RecipeIngredient[]>([]);
  const [komponenten, setKomponenten] = useState<RecipeKomponente[]>([]);
  const [collapsed, setCollapsed]     = useState<boolean[]>([]);
  const [schritte, setSchritte]       = useState<string[]>([]);
  const [getraenke, setGetraenke]     = useState('');
  const [chefTipps, setChefTipps]     = useState('');

  // Photo
  const [imageFile, setImageFile]     = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploadingImg, setUploadingImg] = useState(false);
  const [imageError, setImageError]   = useState<string | null>(null);
  const [importedImage, setImportedImage] = useState<string | null>(null);

  // Rezept-Import (Weg A: URL, Weg B: Text/Caption, Weg C: Bild-Upload)
  const [importOpen, setImportOpen]   = useState(false);
  const [importMode, setImportMode]   = useState<'url' | 'text' | 'bild'>('url');
  const [importUrl, setImportUrl]     = useState('');
  const [importRawText, setImportRawText] = useState('');
  const [importing, setImporting]     = useState(false);
  const [importingKi, setImportingKi] = useState(false);
  const [importImages, setImportImages] = useState<File[]>([]);
  const [importImagePreviews, setImportImagePreviews] = useState<string[]>([]);
  const [importingBild, setImportingBild] = useState(false);
  const [importDragOver, setImportDragOver] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  const [importSuccessMsg, setImportSuccessMsg] = useState<string | null>(null);
  const [importQualityWarning, setImportQualityWarning] = useState<string | null>(null);

  useEffect(() => { if (searchParams.get('import') === '1') setImportOpen(true); }, [searchParams]);

  useEffect(() => {
    const urls = importImages.map(f => URL.createObjectURL(f));
    setImportImagePreviews(urls);
    return () => { urls.forEach(u => URL.revokeObjectURL(u)); };
  }, [importImages]);

  // Geschmacksprofil
  const [geschmack, setGeschmackRaw]  = useState<FlavorProfile>(EMPTY_FLAVOR);
  const [geschmackSet, setGeschmackSet] = useState(false);
  const [matchInfo, setMatchInfo]     = useState<{ matched: string[]; unmatched: string[] } | null>(null);
  const setGeschmack = (p: FlavorProfile) => { setGeschmackRaw(p); setGeschmackSet(true); };

  // UI state
  const [saving, setSaving]           = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [saveError, setSaveError]     = useState<string | null>(null);

  const upd = (k: string, v: string | number) => setBase(p => ({ ...p, [k]: v }));

  const handleCompute = () => {
    const result = computeRecipeFlavorProfile(zutaten, komponenten, ingredients);
    setGeschmack(result.profile);
    setMatchInfo({ matched: result.matched, unmatched: result.unmatched });
  };

  // ── Photo handler ──────────────────────────────────────────────────────────
  const handlePhoto = (file: File) => {
    const err = validateImageFile(file);
    if (err) { setImageError(err); return; }
    setImageError(null);
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
    setImportedImage(null); // manueller Upload ersetzt ein evtl. importiertes Bild
  };

  const handleClearPhoto = () => {
    setImageFile(null);
    setImagePreview(null);
    setImageError(null);
    setImportedImage(null);
  };

  // ── Rezept-Import (Weg A: URL) ─────────────────────────────────────────────
  const handleImportUrl = async () => {
    const url = importUrl.trim();
    if (!url) return;
    setImporting(true);
    setImportError(null);
    setImportSuccessMsg(null);
    setImportQualityWarning(null);
    try {
      const res = await fetch('/api/rezepte/import-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      });
      const d = await res.json();
      if (!res.ok || !d.found) {
        setImportError(d.error || 'Import fehlgeschlagen.');
        return;
      }
      const r = d.recipe as {
        title: string; description: string;
        zutaten: RecipeIngredient[]; schritte: string[];
        time?: number; portionen?: number; category?: string; image: string | null;
      };
      setBase(p => ({
        ...p,
        title:       r.title || p.title,
        description: r.description || p.description,
        time:        r.time ?? p.time,
        portionen:   r.portionen ?? p.portionen,
        category:    r.category ?? p.category,
      }));
      if (r.zutaten.length > 0) setZutaten(r.zutaten);
      if (r.schritte.length > 0) setSchritte(r.schritte);
      if (r.image) {
        setImportedImage(r.image);
        setImagePreview(r.image);
        setImageFile(null);
      }
      setImportSuccessMsg('Rezept übernommen — bitte prüfen und bei Bedarf korrigieren.');
    } catch {
      setImportError('Netzwerkfehler beim Import.');
    } finally {
      setImporting(false);
    }
  };

  const handleImportText = () => {
    const text = importRawText.trim();
    if (!text) return;
    setImportError(null);
    setImportSuccessMsg(null);
    setImportQualityWarning(null);

    const result = parseRecipeText(text);
    if (result.zutaten.length === 0 && result.schritte.length === 0 && result.unsicher.length === 0) {
      setImportError('Konnte in diesem Text nichts erkennen.');
      return;
    }

    if (result.title) setBase(p => ({ ...p, title: result.title || p.title }));
    if (result.zutaten.length > 0) setZutaten(result.zutaten);
    if (result.schritte.length > 0) setSchritte(result.schritte);
    if (result.unsicher.length > 0) {
      const note = 'Nicht eindeutig erkannt — bitte manuell einsortieren:\n' + result.unsicher.map(u => `• ${u}`).join('\n');
      setChefTipps(prev => prev ? `${prev}\n\n${note}` : note);
    }

    const parts: string[] = [];
    if (result.zutaten.length > 0) parts.push(`${result.zutaten.length} Zutat${result.zutaten.length !== 1 ? 'en' : ''}`);
    if (result.schritte.length > 0) parts.push(`${result.schritte.length} Schritt${result.schritte.length !== 1 ? 'e' : ''}`);
    if (result.unsicher.length > 0) parts.push(`${result.unsicher.length} unklar → Chef-Tipps`);
    setImportSuccessMsg(`Text analysiert (${parts.join(', ')}) — bitte prüfen und bei Bedarf korrigieren. Best effort ohne KI, nicht jede Formatierung wird erkannt.`);
  };

  // ── Rezept-Import (KI-gestützt, Text UND Bild teilen sich diese Logik) ────
  type KiRezept = {
    title: string; description: string; category: string; difficulty: string;
    time: number; season: string; tags: string[]; portionen: number;
    zutaten: RecipeIngredient[]; komponenten: RecipeKomponente[]; schritte: string[];
    getraenke: string; chefTipps: string; geschmack: FlavorProfile;
    erkennungsQualitaet: 'gut' | 'teilweise' | 'schlecht';
  };

  const applyKiRezept = (r: KiRezept, image?: string | null) => {
    if (image) {
      setImportedImage(image);
      setImagePreview(image);
      setImageFile(null);
    }
    setBase(p => ({
      ...p,
      title:       r.title || p.title,
      description: r.description || p.description,
      category:    r.category || p.category,
      difficulty:  r.difficulty || p.difficulty,
      time:        r.time || p.time,
      season:      r.season || p.season,
      tags:        r.tags.length > 0 ? r.tags.join(', ') : p.tags,
      portionen:   r.portionen || p.portionen,
    }));
    if (r.zutaten.length > 0) setZutaten(r.zutaten);
    if (r.komponenten.length > 0) {
      setKomponenten(r.komponenten);
      setCollapsed(r.komponenten.map(() => false));
    }
    if (r.schritte.length > 0) setSchritte(r.schritte);
    if (r.getraenke) setGetraenke(r.getraenke);
    if (r.chefTipps) setChefTipps(prev => prev ? `${prev}\n\n${r.chefTipps}` : r.chefTipps);

    // Geschmacksprofil: erst echte Bibliotheks-Berechnung versuchen (praeziser,
    // da auf realen Zutaten-Daten basierend), sonst die KI-eigene Schaetzung
    // uebernehmen -- ohne Profil ist das Rezept im Wein-Pairing nicht nutzbar.
    const computeZutaten = r.zutaten.length > 0 ? r.zutaten : zutaten;
    const computeKomponenten = r.komponenten.length > 0 ? r.komponenten : komponenten;
    const computed = computeRecipeFlavorProfile(computeZutaten, computeKomponenten, ingredients);
    if (computed.matched.length > 0) {
      setGeschmack(computed.profile);
      setMatchInfo({ matched: computed.matched, unmatched: computed.unmatched });
    } else {
      setGeschmack(r.geschmack);
      setMatchInfo(null);
    }
  };

  const handleImportTextKi = async () => {
    const text = importRawText.trim();
    if (!text) return;
    setImportingKi(true);
    setImportError(null);
    setImportSuccessMsg(null);
    setImportQualityWarning(null);
    try {
      const res = await fetch('/api/rezepte/import-ki', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      });
      const d = await res.json().catch(() => ({}));
      if (!res.ok || !d.found) {
        setImportError(d.message || d.error || 'KI-Import fehlgeschlagen.');
        return;
      }
      const r = d.recipe as KiRezept;
      applyKiRezept(r);
      setImportSuccessMsg('Rezept per KI erkannt — bitte prüfen und bei Bedarf korrigieren.');
      if (r.erkennungsQualitaet === 'schlecht' || r.erkennungsQualitaet === 'teilweise') {
        setImportQualityWarning('Der Text war teilweise unklar oder unvollständig – bitte alle Felder prüfen.');
      }
    } catch {
      setImportError('Netzwerkfehler beim KI-Import.');
    } finally {
      setImportingKi(false);
    }
  };

  // ── Rezept-Import (Weg C: Bild-Upload) ─────────────────────────────────────
  const fileToBase64 = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject(new Error('Datei konnte nicht gelesen werden.'));
      reader.readAsDataURL(file);
    });

  const addImportImages = (files: FileList | File[]) => {
    const arr = Array.from(files);
    setImportError(null);
    const valid: File[] = [];
    for (const f of arr) {
      if (importImages.length + valid.length >= MAX_IMPORT_IMAGES) {
        setImportError(`Maximal ${MAX_IMPORT_IMAGES} Bilder auf einmal.`);
        break;
      }
      const err = validateImageFile(f);
      if (err) { setImportError(err); continue; }
      valid.push(f);
    }
    if (valid.length > 0) setImportImages(prev => [...prev, ...valid]);
  };
  const removeImportImage = (i: number) => setImportImages(prev => prev.filter((_, j) => j !== i));

  const handleImportBild = async () => {
    if (importImages.length === 0) return;
    setImportingBild(true);
    setImportError(null);
    setImportSuccessMsg(null);
    setImportQualityWarning(null);
    try {
      const images = await Promise.all(importImages.map(fileToBase64));
      const res = await fetch('/api/rezepte/import-bild', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ images }),
      });
      const d = await res.json().catch(() => ({}));
      if (!res.ok || !d.found) {
        setImportError(d.message || d.error || 'Bild-Import fehlgeschlagen.');
        return;
      }
      const r = d.recipe as KiRezept & { image: string | null };
      applyKiRezept(r, r.image);
      const fotoHinweis = r.image ? ' Das fertige Gericht wurde als Rezeptfoto übernommen.' : '';
      setImportSuccessMsg(`Rezept aus ${importImages.length === 1 ? 'Bild' : 'Bildern'} erkannt — bitte prüfen und bei Bedarf korrigieren.${fotoHinweis}`);
      if (r.erkennungsQualitaet === 'schlecht' || r.erkennungsQualitaet === 'teilweise') {
        setImportQualityWarning('Das Bild war schwer lesbar – bitte alle Felder prüfen.');
      }
    } catch {
      setImportError('Netzwerkfehler beim Bild-Import.');
    } finally {
      setImportingBild(false);
    }
  };

  const uploadPhoto = async (file: File): Promise<string | null> => {
    setUploadingImg(true);
    setImageError(null);
    try {
      let blob: Blob;
      try {
        blob = await compressImage(file);
      } catch {
        setImageError('Bild konnte nicht komprimiert werden. Bitte ein anderes Format versuchen.');
        return null;
      }
      const path = `${crypto.randomUUID()}.jpg`;
      const sb = createClient();
      const { error } = await sb.storage.from('rezept-bilder').upload(path, blob, {
        contentType: 'image/jpeg',
        cacheControl: '31536000',
        upsert: false,
      });
      if (error) {
        setImageError(`Upload fehlgeschlagen: ${error.message}`);
        return null;
      }
      const { data } = sb.storage.from('rezept-bilder').getPublicUrl(path);
      return data.publicUrl;
    } finally {
      setUploadingImg(false);
    }
  };

  // ── Zutaten helpers ────────────────────────────────────────────────────────
  const addZutat    = () => setZutaten(p => [...p, { name: '', menge: '' }]);
  const removeZutat = (i: number) => setZutaten(p => p.filter((_, j) => j !== i));
  const updZutat    = (i: number, k: 'name' | 'menge', v: string) =>
    setZutaten(p => p.map((z, j) => j === i ? { ...z, [k]: v } : z));

  // ── Komponenten helpers ────────────────────────────────────────────────────
  const addKomponente    = () => {
    setKomponenten(p => [...p, { name: '', zutaten: [], zubereitung: '' }]);
    setCollapsed(p => [...p, false]);
  };
  const removeKomponente = (i: number) => {
    setKomponenten(p => p.filter((_, j) => j !== i));
    setCollapsed(p => p.filter((_, j) => j !== i));
  };
  const toggleCollapse   = (i: number) => setCollapsed(p => p.map((c, j) => j === i ? !c : c));
  const updKName         = (i: number, v: string) =>
    setKomponenten(p => p.map((k, j) => j === i ? { ...k, name: v } : k));
  const updKZubereitung  = (i: number, v: string) =>
    setKomponenten(p => p.map((k, j) => j === i ? { ...k, zubereitung: v } : k));
  const addKZutat        = (ki: number) =>
    setKomponenten(p => p.map((k, j) => j === ki ? { ...k, zutaten: [...k.zutaten, { name: '', menge: '' }] } : k));
  const removeKZutat     = (ki: number, zi: number) =>
    setKomponenten(p => p.map((k, j) => j === ki ? { ...k, zutaten: k.zutaten.filter((_, z) => z !== zi) } : k));
  const updKZutat        = (ki: number, zi: number, fld: 'name' | 'menge', v: string) =>
    setKomponenten(p => p.map((k, j) => j === ki ? {
      ...k, zutaten: k.zutaten.map((z, z2) => z2 === zi ? { ...z, [fld]: v } : z),
    } : k));

  // ── Schritte helpers ───────────────────────────────────────────────────────
  const addSchritt    = () => setSchritte(p => [...p, '']);
  const removeSchritt = (i: number) => setSchritte(p => p.filter((_, j) => j !== i));
  const updSchritt    = (i: number, v: string) => setSchritte(p => p.map((s, j) => j === i ? v : s));
  const moveSchritt   = (i: number, dir: -1 | 1) => {
    const a = [...schritte], j = i + dir;
    if (j < 0 || j >= a.length) return;
    [a[i], a[j]] = [a[j], a[i]];
    setSchritte(a);
  };

  // ── Save ───────────────────────────────────────────────────────────────────
  const handleSave = async () => {
    if (!base.title.trim()) return;
    setSaving(true);
    setSaveError(null);
    try {
      let finalImage: string | null = importedImage;
      if (imageFile) {
        finalImage = await uploadPhoto(imageFile);
        if (!finalImage) return; // upload failed; error is shown in PhotoZone
      }

      await addRecipe({
        title:       base.title,
        category:    base.category    as Recipe['category'],
        status:      base.status      as Recipe['status'],
        difficulty:  base.difficulty  as Recipe['difficulty'],
        time:        base.time,
        season:      base.season      as Recipe['season'],
        tags:        base.tags.split(',').map(t => t.trim()).filter(Boolean),
        rating:      base.rating,
        description: base.description,
        portionen:   base.portionen,
        image:       finalImage,
        zutaten,
        komponenten,
        schritte,
        getraenke,
        chefTipps,
        geschmack:   geschmackSet ? geschmack : null,
      });
      router.push('/rezepte');
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Rezept konnte nicht gespeichert werden');
    } finally {
      setSaving(false);
    }
  };

  // ── Preview recipe object ──────────────────────────────────────────────────
  const previewRecipe: Partial<Recipe> = {
    title:       base.title,
    category:    base.category    as Recipe['category'],
    status:      base.status      as Recipe['status'],
    difficulty:  base.difficulty  as Recipe['difficulty'],
    time:        base.time,
    season:      base.season      as Recipe['season'],
    tags:        base.tags.split(',').map(t => t.trim()).filter(Boolean),
    rating:      base.rating,
    description: base.description,
    image:       imagePreview,
    zutaten,
    komponenten,
    schritte,
    getraenke,
    chefTipps,
  };

  if (showPreview) {
    return <RecipePreview recipe={previewRecipe} onClose={() => setShowPreview(false)} />;
  }

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg)' }}>
      {/* ── Sticky Header ─────────────────────────────────────────────────── */}
      <div className="sticky top-0 z-30 border-b border-border px-8 py-4 flex items-center justify-between"
        style={{ background: 'rgba(var(--bg-rgb), 0.96)', backdropFilter: 'blur(12px)' }}>
        <div className="flex items-center gap-3">
          <button onClick={() => router.push('/rezepte')}
            className="flex items-center gap-1.5 text-text-muted hover:text-text-primary transition-colors text-[13px]">
            <ArrowLeft size={15} /> Rezeptarchiv
          </button>
          <div className="w-px h-4 bg-border" />
          <h1 className="font-heading text-[18px] font-bold text-text-primary">Neues Rezept</h1>
        </div>

        <div className="flex items-center gap-2">
          <button onClick={() => setShowPreview(true)}
            className="flex items-center gap-1.5 border border-border rounded-lg px-4 py-2 text-[13px] text-text-muted hover:border-gold/40 hover:text-gold transition-all">
            <Eye size={14} /> Vorschau
          </button>
          <button onClick={() => router.push('/rezepte')}
            className="border border-border rounded-lg px-4 py-2 text-[13px] text-text-muted hover:text-text-primary transition-colors">
            Abbrechen
          </button>
          <button onClick={handleSave} disabled={saving || uploadingImg || !base.title.trim()}
            className="flex items-center gap-2 rounded-lg px-5 py-2 text-[13px] font-semibold text-white transition-all disabled:opacity-40"
            style={{ background: '#6B3A4B', boxShadow: submitGlow(!saving && !uploadingImg && !!base.title.trim()) }}>
            {(saving || uploadingImg) && <Loader2 size={14} className="animate-spin" />}
            {saving ? 'Speichern…' : uploadingImg ? 'Foto hochladen…' : 'Speichern'}
          </button>
        </div>
      </div>

      {saveError && (
        <div className="mx-8 mt-3 flex items-start gap-2 px-4 py-3 rounded-xl text-[13px]"
          style={{ background: 'rgba(192,80,80,0.08)', border: '1px solid rgba(192,80,80,0.25)', color: '#C05050' }}>
          <span className="flex-shrink-0 mt-0.5">⚠</span>
          <span>{saveError}</span>
        </div>
      )}

      {/* ── Form ──────────────────────────────────────────────────────────── */}
      <div className="max-w-[820px] mx-auto px-8 py-8 pb-24 space-y-5">

        {/* ── Rezept-Import ────────────────────────────────────────────────── */}
        <div className={SEC}>
          <button onClick={() => setImportOpen(p => !p)}
            className="w-full flex items-center justify-between text-left">
            <span className="font-heading text-[16px] font-bold text-text-primary flex items-center gap-2.5">
              <Download size={16} color="#6B3A4B" /> Rezept importieren
            </span>
            <ChevronDown size={16} className="text-text-muted transition-transform flex-shrink-0"
              style={{ transform: importOpen ? 'rotate(180deg)' : 'rotate(0deg)' }} />
          </button>

          {importOpen && (
            <div className="mt-4">
              <div className="flex gap-2 mb-4">
                <button onClick={() => { setImportMode('url'); setImportError(null); setImportSuccessMsg(null); }}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-[12px] font-semibold transition-all"
                  style={{
                    background: importMode === 'url' ? 'rgba(107,58,75,0.1)' : 'transparent',
                    color: importMode === 'url' ? '#6B3A4B' : 'var(--text-muted)',
                    border: `1px solid ${importMode === 'url' ? 'rgba(107,58,75,0.25)' : 'transparent'}`,
                  }}>
                  <Link2 size={13} /> Von URL
                </button>
                <button onClick={() => { setImportMode('text'); setImportError(null); setImportSuccessMsg(null); }}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-[12px] font-semibold transition-all"
                  style={{
                    background: importMode === 'text' ? 'rgba(107,58,75,0.1)' : 'transparent',
                    color: importMode === 'text' ? '#6B3A4B' : 'var(--text-muted)',
                    border: `1px solid ${importMode === 'text' ? 'rgba(107,58,75,0.25)' : 'transparent'}`,
                  }}>
                  <FileText size={13} /> Text/Caption einfügen
                </button>
                <button onClick={() => { setImportMode('bild'); setImportError(null); setImportSuccessMsg(null); }}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-[12px] font-semibold transition-all"
                  style={{
                    background: importMode === 'bild' ? 'rgba(107,58,75,0.1)' : 'transparent',
                    color: importMode === 'bild' ? '#6B3A4B' : 'var(--text-muted)',
                    border: `1px solid ${importMode === 'bild' ? 'rgba(107,58,75,0.25)' : 'transparent'}`,
                  }}>
                  <Images size={13} /> Bild(er) hochladen
                </button>
              </div>

              {importMode === 'url' ? (
                <>
                  <label className={LC}><Link2 size={10} className="inline mr-1" />Rezept-URL einfügen</label>
                  <div className="flex gap-2">
                    <input value={importUrl} onChange={e => setImportUrl(e.target.value)}
                      placeholder="https://www.chefkoch.de/rezepte/…" className={IC + ' flex-1'}
                      onKeyDown={e => { if (e.key === 'Enter') handleImportUrl(); }} />
                    <button onClick={handleImportUrl} disabled={importing || !importUrl.trim()}
                      className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-[13px] font-semibold text-white transition-all disabled:opacity-40 flex-shrink-0"
                      style={{ background: '#6B3A4B' }}>
                      {importing ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
                      {importing ? 'Importiere…' : 'Importieren'}
                    </button>
                  </div>
                  <p className="text-[11px] text-text-muted mt-2">
                    Funktioniert bei Seiten mit strukturierten Rezeptdaten (Chefkoch, die meisten Food-Blogs &amp; Zeitungen).
                  </p>
                </>
              ) : importMode === 'text' ? (
                <>
                  <label className={LC}><FileText size={10} className="inline mr-1" />Rezept-Text oder Caption einfügen</label>
                  <textarea value={importRawText} onChange={e => setImportRawText(e.target.value)}
                    placeholder={'z.B. eine Instagram-/TikTok-Caption oder kopierter Rezepttext…'} rows={8}
                    className={IC + ' resize-none leading-relaxed'} />
                  <div className="flex justify-end gap-2 mt-2">
                    <button onClick={handleImportText} disabled={!importRawText.trim() || importingKi}
                      className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-[13px] font-semibold transition-all disabled:opacity-40 flex-shrink-0"
                      style={{ background: 'transparent', color: '#6B3A4B', border: '1px solid rgba(107,58,75,0.3)' }}>
                      <FileText size={14} /> Text analysieren
                    </button>
                    <button onClick={handleImportTextKi} disabled={!importRawText.trim() || importingKi}
                      className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-[13px] font-semibold text-white transition-all disabled:opacity-40 flex-shrink-0"
                      style={{ background: '#6B3A4B' }}>
                      {importingKi ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
                      {importingKi ? 'Analysiere…' : 'Mit KI analysieren'}
                    </button>
                  </div>
                  <p className="text-[11px] text-text-muted mt-2">
                    <strong>Mit KI analysieren</strong> versteht auch Fließtext, Emojis und lockere Mengenangaben („ne Handvoll…") —
                    ideal für Instagram-/TikTok-Captions. <strong>Text analysieren</strong> ist der schnelle, kostenlose Weg ohne KI
                    für sauber strukturierte „Zutaten:"/„Zubereitung:"-Texte. Bei beiden landet Unsicheres gesammelt in Chef-Tipps
                    statt verworfen zu werden — bitte Ergebnis immer prüfen.
                  </p>
                </>
              ) : (
                <>
                  <label className={LC}><Images size={10} className="inline mr-1" />Foto(s) einer Kochbuchseite, eines Reels oder handgeschriebenen Rezepts</label>
                  <div
                    onClick={() => document.getElementById('import-bild-input')?.click()}
                    onDragOver={e => { e.preventDefault(); setImportDragOver(true); }}
                    onDragLeave={() => setImportDragOver(false)}
                    onDrop={e => {
                      e.preventDefault();
                      setImportDragOver(false);
                      if (e.dataTransfer.files.length > 0) addImportImages(e.dataTransfer.files);
                    }}
                    className="flex flex-col items-center justify-center gap-2 rounded-xl py-8 px-4 cursor-pointer transition-colors text-center"
                    style={{
                      border: `2px dashed ${importDragOver ? '#C9A84C' : 'rgba(107,58,75,0.25)'}`,
                      background: importDragOver ? 'rgba(201,168,76,0.06)' : 'var(--bg)',
                    }}>
                    <input id="import-bild-input" type="file" accept="image/jpeg,image/png,image/webp" multiple
                      className="hidden"
                      onChange={e => { if (e.target.files) addImportImages(e.target.files); e.target.value = ''; }} />
                    <Images size={22} style={{ color: 'rgba(107,58,75,0.5)' }} />
                    <span className="text-[13px] text-text-secondary">
                      Bilder hierher ziehen oder <span style={{ color: '#6B3A4B', fontWeight: 600 }}>klicken zum Auswählen</span>
                    </span>
                    <span className="text-[11px] text-text-muted">JPG, PNG oder WebP · max. {MAX_IMPORT_IMAGES} Bilder</span>
                  </div>

                  {importImages.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-3">
                      {importImages.map((file, i) => (
                        <div key={i} className="relative w-20 h-20 rounded-lg overflow-hidden border border-border group flex-shrink-0">
                          <img src={importImagePreviews[i]} alt="" className="w-full h-full object-cover" />
                          <button onClick={() => removeImportImage(i)}
                            className="absolute top-1 right-1 w-5 h-5 rounded-full flex items-center justify-center transition-opacity opacity-0 group-hover:opacity-100"
                            style={{ background: 'rgba(0,0,0,0.6)', color: '#FFFFFF' }}>
                            <X size={12} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="flex justify-end mt-3">
                    <button onClick={handleImportBild} disabled={importImages.length === 0 || importingBild}
                      className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-[13px] font-semibold text-white transition-all disabled:opacity-40 flex-shrink-0"
                      style={{ background: '#6B3A4B' }}>
                      {importingBild ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
                      {importingBild ? 'Analysiere…' : 'Mit KI analysieren'}
                    </button>
                  </div>
                  <p className="text-[11px] text-text-muted mt-2">
                    Ideal für abfotografierte Kochbuchseiten, Screenshots aus Reels, handgeschriebene Rezepte oder Rezeptkarten.
                    Bei mehreren Bildern (z.B. mehrere Frames aus einem Video) wird alles zu einem Rezept zusammengeführt.
                    Unleserliche Stellen landen als ehrlicher Hinweis in Chef-Tipps statt geraten zu werden.
                  </p>
                </>
              )}

              {importError && (
                <div className="flex items-start gap-2 mt-3 px-4 py-3 rounded-xl text-[13px]"
                  style={{ background: 'rgba(192,80,80,0.08)', border: '1px solid rgba(192,80,80,0.25)', color: '#C05050' }}>
                  <span className="flex-shrink-0 mt-0.5">⚠</span>
                  <span>{importError}</span>
                </div>
              )}
              {importSuccessMsg && (
                <div className="mt-3 px-4 py-3 rounded-xl text-[13px]"
                  style={{ background: 'rgba(90,154,88,0.08)', border: '1px solid rgba(90,154,88,0.25)', color: '#3A7A38' }}>
                  ✓ {importSuccessMsg}
                </div>
              )}
              {importQualityWarning && (
                <div className="flex items-start gap-2 mt-3 px-4 py-3 rounded-xl text-[13px] font-medium"
                  style={{ background: 'rgba(196,142,42,0.1)', border: '1px solid rgba(196,142,42,0.3)', color: '#9A6B1E' }}>
                  <span className="flex-shrink-0 mt-0.5">⚠</span>
                  <span>{importQualityWarning}</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── Foto Upload ─────────────────────────────────────────────────── */}
        <div className={SEC}>
          <h2 className={STL}><ImagePlus size={16} color="#6B3A4B" /> Rezeptfoto</h2>
          <PhotoZone
            preview={imagePreview}
            onFile={handlePhoto}
            onClear={handleClearPhoto}
            uploading={uploadingImg}
            error={imageError}
          />
        </div>

        {/* ── Grundinformationen ───────────────────────────────────────────── */}
        <div className={SEC}>
          <h2 className={STL}>Grundinformationen</h2>
          <div className="space-y-4">
            <div>
              <label className={LC}>Titel *</label>
              <input value={base.title} onChange={e => upd('title', e.target.value)}
                placeholder="Rezeptname…" className={IC} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={LC}>Kategorie</label>
                <select value={base.category} onChange={e => upd('category', e.target.value)} className={IC + ' cursor-pointer'}>
                  {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className={LC}>Status</label>
                <select value={base.status} onChange={e => upd('status', e.target.value)} className={IC + ' cursor-pointer'}>
                  {STATUSES.map(s => <option key={s}>{s}</option>)}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-4 gap-3">
              <div>
                <label className={LC}>Schwierigkeit</label>
                <select value={base.difficulty} onChange={e => upd('difficulty', e.target.value)} className={IC + ' cursor-pointer'}>
                  {DIFFICULTIES.map(d => <option key={d}>{d}</option>)}
                </select>
              </div>
              <div>
                <label className={LC}>Zeit (Min)</label>
                <input type="number" value={base.time} onChange={e => upd('time', +e.target.value)}
                  className={IC} min={5} max={600} />
              </div>
              <div>
                <label className={LC}>Saison</label>
                <select value={base.season} onChange={e => upd('season', e.target.value)} className={IC + ' cursor-pointer'}>
                  {SEASONS.map(s => <option key={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className={LC}>Portionen</label>
                <input type="number" value={base.portionen} onChange={e => upd('portionen', +e.target.value)}
                  className={IC} min={1} max={100} />
              </div>
            </div>
            <div>
              <label className={LC}>Tags (Komma-getrennt)</label>
              <input value={base.tags} onChange={e => upd('tags', e.target.value)}
                placeholder="Modern, Fine Dining, Sommer…" className={IC} />
            </div>
            <div>
              <label className={LC}>Bewertung</label>
              <StarRating value={base.rating} onChange={v => upd('rating', v)} />
            </div>
          </div>
        </div>

        {/* ── Beschreibung ─────────────────────────────────────────────────── */}
        <div className={SEC}>
          <h2 className={STL}>Beschreibung</h2>
          <textarea value={base.description} onChange={e => upd('description', e.target.value)}
            placeholder="Kurze, appetitliche Beschreibung des Gerichts…" rows={4}
            className={IC + ' resize-none leading-relaxed'} />
        </div>

        {/* ── Zutaten ──────────────────────────────────────────────────────── */}
        <div className={SEC}>
          <h2 className={STL}><Tag size={16} color="#6B3A4B" /> Zutaten</h2>
          {zutaten.length === 0 && (
            <p className="text-[13px] text-text-muted mb-3">Noch keine Zutaten hinzugefügt.</p>
          )}
          <div className="space-y-2">
            {zutaten.map((z, i) => (
              <div key={i} className="flex gap-2 items-center">
                <input value={z.name} onChange={e => updZutat(i, 'name', e.target.value)}
                  placeholder="Zutat…" className={IC + ' flex-1'} />
                <input value={z.menge} onChange={e => updZutat(i, 'menge', e.target.value)}
                  placeholder="200g / 3 EL / nach Bedarf" className={IC} style={{ width: 220 }} />
                <button onClick={() => removeZutat(i)}
                  className="text-text-muted hover:text-red-400 transition-colors flex-shrink-0">
                  <X size={15} />
                </button>
              </div>
            ))}
          </div>
          <button onClick={addZutat} className={ABT}>
            <Plus size={14} /> Zutat hinzufügen
          </button>
        </div>

        {/* ── Komponenten ──────────────────────────────────────────────────── */}
        <div className={SEC}>
          <h2 className={STL}>
            Komponenten
            <span className="ml-auto text-[11px] text-text-muted font-normal">
              z.B. Carbonara Ball · Tonnarelli · Pecorino-Espuma
            </span>
          </h2>
          {komponenten.length === 0 && (
            <p className="text-[13px] text-text-muted mb-3">
              Noch keine Komponenten. Jede Komponente hat eigene Zutaten &amp; Zubereitung.
            </p>
          )}
          <div className="space-y-2">
            {komponenten.map((k, ki) => (
              <KomponenteCard
                key={ki} k={k} ki={ki} collapsed={collapsed[ki] ?? false}
                onToggle={() => toggleCollapse(ki)}
                onRemove={() => removeKomponente(ki)}
                onName={v => updKName(ki, v)}
                onZubereitung={v => updKZubereitung(ki, v)}
                onAddZutat={() => addKZutat(ki)}
                onRemoveZutat={zi => removeKZutat(ki, zi)}
                onZutat={(zi, fld, v) => updKZutat(ki, zi, fld, v)}
              />
            ))}
          </div>
          <button onClick={addKomponente} className={ABT}>
            <Plus size={14} /> Komponente hinzufügen
          </button>
        </div>

        {/* ── Zubereitungsschritte ──────────────────────────────────────────── */}
        <div className={SEC}>
          <h2 className={STL}>Zubereitungsschritte</h2>
          {schritte.length === 0 && (
            <p className="text-[13px] text-text-muted mb-3">Noch keine Schritte.</p>
          )}
          <div className="space-y-2">
            {schritte.map((s, i) => (
              <div key={i} className="flex gap-2 items-start">
                <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 text-[11px] font-bold mt-2.5"
                  style={{ background: 'rgba(107,58,75,0.1)', color: '#6B3A4B', border: '1px solid rgba(107,58,75,0.2)' }}>
                  {i + 1}
                </div>
                <textarea value={s} onChange={e => updSchritt(i, e.target.value)}
                  placeholder={`Schritt ${i + 1}…`} rows={2}
                  className={IC + ' flex-1 resize-none leading-relaxed'} />
                <div className="flex flex-col gap-0.5 pt-1.5 flex-shrink-0">
                  <button onClick={() => moveSchritt(i, -1)} disabled={i === 0}
                    className="text-text-muted hover:text-text-primary disabled:opacity-20 transition-colors">
                    <ChevronUp size={15} />
                  </button>
                  <button onClick={() => moveSchritt(i, 1)} disabled={i === schritte.length - 1}
                    className="text-text-muted hover:text-text-primary disabled:opacity-20 transition-colors">
                    <ChevronDown size={15} />
                  </button>
                </div>
                <button onClick={() => removeSchritt(i)}
                  className="text-text-muted hover:text-red-400 transition-colors pt-2.5 flex-shrink-0">
                  <X size={15} />
                </button>
              </div>
            ))}
          </div>
          <button onClick={addSchritt} className={ABT}>
            <Plus size={14} /> Schritt hinzufügen
          </button>
        </div>

        {/* ── Getränkeempfehlung ────────────────────────────────────────────── */}
        <div className={SEC}>
          <h2 className={STL}><Wine size={16} color="#6B3A4B" /> Getränkeempfehlung</h2>
          <textarea value={getraenke} onChange={e => setGetraenke(e.target.value)}
            placeholder="Weinempfehlung, Cocktail oder alkoholfreie Alternative…" rows={3}
            className={IC + ' resize-none leading-relaxed'} />
        </div>

        {/* ── Geschmacksprofil ─────────────────────────────────────────────── */}
        <div className={SEC}>
          <h2 className={STL}>
            <Wine size={16} color="#6B3A4B" />
            Geschmacksprofil
            <span className="ml-2 text-[12px] font-normal text-text-muted">· Wein-Pairing</span>
          </h2>
          <p className="text-[13px] text-text-muted mb-4 leading-relaxed">
            Beschreibt den Geschmack des Gerichts auf 6 Achsen (0 = nicht vorhanden, 5 = intensiv).
            Wird verwendet, um passende Weine zu empfehlen.
          </p>

          <button
            type="button"
            onClick={handleCompute}
            disabled={zutaten.length === 0 && komponenten.every(k => k.zutaten.length === 0)}
            className="flex items-center gap-2 mb-4 px-4 py-2.5 rounded-xl text-[13px] font-semibold transition-all disabled:opacity-40"
            style={{ background: 'rgba(107,58,75,0.08)', color: '#6B3A4B', border: '1px solid rgba(107,58,75,0.25)' }}>
            <Calculator size={14} /> Aus Zutaten berechnen
          </button>

          {matchInfo && (
            <div className="mb-5 px-3 py-2.5 rounded-lg text-[12px]"
              style={{ background: 'rgba(107,58,75,0.05)', border: '1px solid rgba(107,58,75,0.15)' }}>
              {matchInfo.matched.length > 0 ? (
                <>
                  <span style={{ color: '#6B3A4B', fontWeight: 600 }}>
                    {matchInfo.matched.length} Zutat{matchInfo.matched.length !== 1 ? 'en' : ''} aus Bibliothek
                  </span>
                  {matchInfo.unmatched.length > 0 && (
                    <span style={{ color: 'var(--text-muted)' }}>
                      {' '}· {matchInfo.unmatched.length} ohne Treffer (ignoriert)
                    </span>
                  )}
                </>
              ) : (
                <span style={{ color: 'var(--text-muted)' }}>
                  Keine Zutaten in der Bibliothek gefunden — Profil bitte manuell einstellen.
                </span>
              )}
            </div>
          )}

          <FlavorSliders profile={geschmack} onChange={setGeschmack} />
        </div>

        {/* ── Chef-Tipps ────────────────────────────────────────────────────── */}
        <div className={SEC}>
          <h2 className={STL}><ChefHat size={16} color="#6B3A4B" /> Notizen &amp; Chef-Tipps</h2>
          <textarea value={chefTipps} onChange={e => setChefTipps(e.target.value)}
            placeholder="Persönliche Notizen, Variationen, Tricks aus der Küche…" rows={4}
            className={IC + ' resize-none leading-relaxed'} />
        </div>
      </div>
    </div>
  );
}
