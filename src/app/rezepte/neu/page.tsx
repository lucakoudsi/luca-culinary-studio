'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useStore } from '@/lib/store';
import { createClient } from '@/utils/supabase/client';
import dynamic from 'next/dynamic';
import { compressImage, validateImageFile } from '@/lib/imageUtils';

const PhotoZone = dynamic(() => import('@/components/ui/PhotoZone'), { ssr: false });
import type { Recipe, RecipeIngredient, RecipeKomponente } from '@/types';
import {
  ArrowLeft, Star, Tag, Wine, ChefHat, Plus, X, ChevronUp, ChevronDown,
  Eye, BookOpen, Clock, ImagePlus, Loader2, ChevronRight, Trash2, Calculator,
} from 'lucide-react';
import { FlavorSliders } from '@/components/ui/FlavorSliders';
import { computeRecipeFlavorProfile, EMPTY_FLAVOR } from '@/lib/recipeFlavorUtils';
import type { FlavorProfile } from '@/types';

// ─── Constants ───────────────────────────────────────────────────────────────
const CATEGORIES  = ['Vorspeise', 'Suppe', 'Hauptgang', 'Dessert', 'Beilage', 'Snack'] as const;
const DIFFICULTIES = ['Leicht', 'Mittel', 'Schwer'] as const;
const SEASONS     = ['Frühling', 'Sommer', 'Herbst', 'Winter', 'Ganzjährig'] as const;
const STATUSES    = ['Entwurf', 'In Bearbeitung', 'Fertig'] as const;

const diffColor:   Record<string, string> = { Leicht: '#7CB87A', Mittel: '#E8A838', Schwer: '#E06B6B' };
const statusColor: Record<string, string> = { Fertig: '#7CB87A', 'In Bearbeitung': '#E8A838', Entwurf: '#7BB8D4' };

const IC  = "w-full bg-white border border-[#E8E0D8] rounded-lg px-3.5 py-2.5 text-[#2C2420] text-sm outline-none focus:border-[rgba(107,58,75,0.45)] transition-colors placeholder:text-[#C0B5A8]";
const LC  = "block text-[10px] text-[#8B7355] font-semibold mb-1.5 uppercase tracking-wider";
const SEC = "bg-white border border-[#E8E0D8] rounded-2xl p-6";
const STL = "font-heading text-[16px] font-bold text-[#2C2420] mb-5 flex items-center gap-2.5";
const ABT = "flex items-center gap-1.5 text-[12px] text-[#6B3A4B] hover:text-[#562E3C] transition-colors mt-3";

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

// ─── KomponenteCard ──────────────────────────────────────────────────────────
function KomponenteCard({
  k, ki, collapsed,
  onToggle, onRemove,
  onName, onZubereitung,
  onAddZutat, onRemoveZutat, onZutat,
}: {
  k: RecipeKomponente; ki: number; collapsed: boolean;
  onToggle: () => void; onRemove: () => void;
  onName: (v: string) => void; onZubereitung: (v: string) => void;
  onAddZutat: () => void; onRemoveZutat: (zi: number) => void;
  onZutat: (zi: number, fld: 'name' | 'menge', v: string) => void;
}) {
  return (
    <div className="border border-[#E8E0D8] rounded-xl overflow-hidden"
      style={{ background: 'rgba(0,0,0,0.01)' }}>
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-3 cursor-pointer hover:bg-black/[0.02] transition-colors"
        onClick={onToggle}>
        <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 text-[10px] font-bold"
          style={{ background: 'rgba(107,58,75,0.1)', color: '#6B3A4B', border: '1px solid rgba(107,58,75,0.25)' }}>
          {ki + 1}
        </div>
        <span className="flex-1 text-[14px] text-[#2C2420] font-medium truncate">
          {k.name || <span className="text-[#B09880] italic">Komponentenname…</span>}
        </span>
        {k.zutaten.length > 0 && (
          <span className="text-[11px] text-[#8B7355] mr-1">{k.zutaten.length} Zutaten</span>
        )}
        <ChevronRight size={15} className="text-[#B09880] transition-transform flex-shrink-0"
          style={{ transform: collapsed ? 'rotate(0deg)' : 'rotate(90deg)' }} />
        <button onClick={e => { e.stopPropagation(); onRemove(); }}
          className="text-[#B09880] hover:text-red-400 transition-colors ml-1 flex-shrink-0">
          <Trash2 size={14} />
        </button>
      </div>

      {/* Body */}
      {!collapsed && (
        <div className="px-4 pb-4 pt-1 border-t border-[#E8E0D8] space-y-3">
          <div>
            <label className={LC}>Name der Komponente</label>
            <input value={k.name} onChange={e => onName(e.target.value)}
              placeholder="z.B. Carbonara Ball, Tonnarelli, Pecorino-Espuma…"
              className={IC} onClick={e => e.stopPropagation()} />
          </div>

          <div>
            <label className={LC}>Zutaten</label>
            <div className="space-y-2">
              {k.zutaten.map((z, zi) => (
                <div key={zi} className="flex gap-2">
                  <input value={z.name} onChange={e => onZutat(zi, 'name', e.target.value)}
                    placeholder="Zutat…" className={IC + ' flex-1'} />
                  <input value={z.menge} onChange={e => onZutat(zi, 'menge', e.target.value)}
                    placeholder="Menge" className={IC} style={{ width: 130 }} />
                  <button onClick={() => onRemoveZutat(zi)}
                    className="text-[#B09880] hover:text-red-400 transition-colors flex-shrink-0 self-center">
                    <X size={14} />
                  </button>
                </div>
              ))}
            </div>
            <button onClick={onAddZutat} className={ABT} style={{ fontSize: 11 }}>
              <Plus size={12} /> Zutat hinzufügen
            </button>
          </div>

          <div>
            <label className={LC}>Zubereitung</label>
            <textarea value={k.zubereitung} onChange={e => onZubereitung(e.target.value)}
              placeholder="Wie wird diese Komponente zubereitet…" rows={3}
              className={IC + ' resize-none leading-relaxed'} />
          </div>
        </div>
      )}
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
        color: tab === t ? '#6B3A4B' : '#8B7355',
        border: `1px solid ${tab === t ? 'rgba(107,58,75,0.25)' : 'transparent'}`,
      }}>
      {label}
    </button>
  );

  return (
    <div className="fixed inset-0 z-50 flex flex-col" style={{ background: 'var(--bg)' }}>
      {/* Header */}
      <div className="flex items-center justify-between px-8 py-4 border-b border-[#E8E0D8]">
        <div className="flex items-center gap-3">
          <button onClick={onClose}
            className="flex items-center gap-1.5 text-[#8B7355] hover:text-[#2C2420] transition-colors text-[13px]">
            <ArrowLeft size={15} /> Zurück zur Bearbeitung
          </button>
          <div className="w-px h-4 bg-[#E8E0D8]" />
          <span className="text-[13px] text-[#B09880]">Vorschau</span>
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
            <p className="text-[11px] text-[#B09880] text-center mb-4 uppercase tracking-widest">So erscheint die Karte im Archiv</p>
            <div className="bg-white border border-[#E8E0D8] rounded-xl overflow-hidden shadow-lg">
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
                  <h3 className="font-heading text-[15px] font-bold text-[#2C2420] leading-snug">
                    {recipe.title || <span className="text-[#B09880] italic">Kein Titel</span>}
                  </h3>
                  <span className="text-[11px] text-[#8B7355] flex-shrink-0 flex items-center gap-1">
                    <Clock size={11} />{recipe.time ?? 0}m
                  </span>
                </div>
                <p className="text-[12px] text-[#8B7355] leading-relaxed mb-3 line-clamp-2">
                  {recipe.description || 'Keine Beschreibung'}
                </p>
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {(recipe.tags ?? []).slice(0, 3).map((t, i) => (
                    <span key={i} className="text-[10px] px-2 py-0.5 rounded-full bg-[#F5F2EE] text-[#8B7355] border border-[#E8E0D8]">{t}</span>
                  ))}
                </div>
                <div className="flex items-center justify-between pt-2.5 border-t border-[#E8E0D8]">
                  <span className="text-[11px] font-semibold" style={{ color: dc }}>{recipe.difficulty ?? 'Mittel'}</span>
                  <span className="text-[11px] text-[#8B7355]">{recipe.category ?? 'Hauptgang'}</span>
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
            <p className="text-[11px] text-[#B09880] text-center mb-4 uppercase tracking-widest">Detailansicht</p>
            <div className="bg-white border border-[#E8E0D8] rounded-2xl overflow-hidden shadow-lg">
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
                <p className="text-[14px] text-[#8B7355] leading-relaxed mb-5">
                  {recipe.description || 'Keine Beschreibung vorhanden.'}
                </p>
                <div className="grid grid-cols-3 gap-3 mb-6">
                  {[
                    { label: 'Schwierigkeit', value: recipe.difficulty ?? 'Mittel', color: dc },
                    { label: 'Zeit', value: `${recipe.time ?? 0} Min` },
                    { label: 'Saison', value: recipe.season ?? 'Ganzjährig' },
                  ].map(item => (
                    <div key={item.label} className="bg-[#FAF8F5] rounded-lg p-3 text-center border border-[#E8E0D8]">
                      <div className="text-[10px] text-[#B09880] mb-1 uppercase tracking-wide">{item.label}</div>
                      <div className="text-[13px] font-semibold" style={{ color: item.color || '#2C2420' }}>{item.value}</div>
                    </div>
                  ))}
                </div>

                {/* Zutaten */}
                {(recipe.zutaten ?? []).length > 0 && (
                  <div className="mb-5">
                    <div className="text-[10px] text-[#8B7355] font-semibold mb-2 uppercase tracking-wider flex items-center gap-1.5"><Tag size={10} /> Zutaten</div>
                    <div className="bg-[#FAF8F5] rounded-xl border border-[#E8E0D8] divide-y divide-[#E8E0D8]">
                      {(recipe.zutaten ?? []).map((z, i) => (
                        <div key={i} className="flex justify-between px-4 py-2 text-[13px]">
                          <span className="text-[#2C2420]">{z.name}</span>
                          <span className="text-[#8B7355]">{z.menge}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Komponenten */}
                {(recipe.komponenten ?? []).length > 0 && (
                  <div className="mb-5 space-y-3">
                    <div className="text-[10px] text-[#8B7355] font-semibold mb-2 uppercase tracking-wider">Komponenten</div>
                    {(recipe.komponenten ?? []).map((k, i) => (
                      <div key={i} className="bg-[#FAF8F5] border border-[#E8E0D8] rounded-xl p-4">
                        <div className="font-semibold text-[#2C2420] mb-2">{k.name}</div>
                        {k.zutaten.map((z, j) => (
                          <div key={j} className="flex justify-between text-[12px] mb-1">
                            <span className="text-[#8B7355]">{z.name}</span>
                            <span className="text-[#B09880]">{z.menge}</span>
                          </div>
                        ))}
                        {k.zubereitung && <p className="text-[12px] text-[#8B7355] mt-2 pt-2 border-t border-[#E8E0D8]">{k.zubereitung}</p>}
                      </div>
                    ))}
                  </div>
                )}

                {/* Schritte */}
                {(recipe.schritte ?? []).length > 0 && (
                  <div className="mb-5">
                    <div className="text-[10px] text-[#8B7355] font-semibold mb-3 uppercase tracking-wider">Zubereitung</div>
                    <div className="space-y-3">
                      {(recipe.schritte ?? []).map((s, i) => (
                        <div key={i} className="flex gap-3">
                          <div className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 text-[10px] font-bold mt-0.5"
                            style={{ background: 'rgba(107,58,75,0.1)', color: '#6B3A4B', border: '1px solid rgba(107,58,75,0.2)' }}>
                            {i + 1}
                          </div>
                          <p className="text-[13px] text-[#8B7355] leading-relaxed">{s}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {recipe.getraenke && (
                  <div className="mb-5">
                    <div className="text-[10px] text-[#8B7355] font-semibold mb-2 uppercase tracking-wider flex items-center gap-1.5"><Wine size={10} /> Getränkeempfehlung</div>
                    <p className="text-[13px] text-[#8B7355] bg-[#FAF8F5] border border-[#E8E0D8] rounded-xl p-4">{recipe.getraenke}</p>
                  </div>
                )}
                {recipe.chefTipps && (
                  <div>
                    <div className="text-[10px] text-[#8B7355] font-semibold mb-2 uppercase tracking-wider flex items-center gap-1.5"><ChefHat size={10} /> Chef-Tipps</div>
                    <p className="text-[13px] text-[#8B7355] bg-[#FAF8F5] border border-[#E8E0D8] rounded-xl p-4">{recipe.chefTipps}</p>
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
  const router = useRouter();
  const { addRecipe, ingredients, fetchIngredients } = useStore();

  useEffect(() => { if (ingredients.length === 0) fetchIngredients(); }, []);

  // Form base fields
  const [base, setBase] = useState({
    title: '', category: 'Hauptgang', status: 'Entwurf',
    difficulty: 'Mittel', time: 60, season: 'Ganzjährig',
    tags: '', rating: 3, description: '',
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
  };

  const handleClearPhoto = () => {
    setImageFile(null);
    setImagePreview(null);
    setImageError(null);
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
      let finalImage: string | null = null;
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
      <div className="sticky top-0 z-30 border-b border-[#E8E0D8] px-8 py-4 flex items-center justify-between"
        style={{ background: 'rgba(250,248,245,0.96)', backdropFilter: 'blur(12px)' }}>
        <div className="flex items-center gap-3">
          <button onClick={() => router.push('/rezepte')}
            className="flex items-center gap-1.5 text-[#8B7355] hover:text-[#2C2420] transition-colors text-[13px]">
            <ArrowLeft size={15} /> Rezeptarchiv
          </button>
          <div className="w-px h-4 bg-[#E8E0D8]" />
          <h1 className="font-heading text-[18px] font-bold text-[#2C2420]">Neues Rezept</h1>
        </div>

        <div className="flex items-center gap-2">
          <button onClick={() => setShowPreview(true)}
            className="flex items-center gap-1.5 border border-[#E8E0D8] rounded-lg px-4 py-2 text-[13px] text-[#8B7355] hover:border-[rgba(107,58,75,0.3)] hover:text-[#6B3A4B] transition-all">
            <Eye size={14} /> Vorschau
          </button>
          <button onClick={() => router.push('/rezepte')}
            className="border border-[#E8E0D8] rounded-lg px-4 py-2 text-[13px] text-[#B09880] hover:text-[#8B7355] transition-colors">
            Abbrechen
          </button>
          <button onClick={handleSave} disabled={saving || uploadingImg || !base.title.trim()}
            className="flex items-center gap-2 rounded-lg px-5 py-2 text-[13px] font-semibold text-white disabled:opacity-50 transition-opacity"
            style={{ background: '#6B3A4B' }}>
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
            <div className="grid grid-cols-3 gap-3">
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
            <p className="text-[13px] text-[#8B7355] mb-3">Noch keine Zutaten hinzugefügt.</p>
          )}
          <div className="space-y-2">
            {zutaten.map((z, i) => (
              <div key={i} className="flex gap-2 items-center">
                <input value={z.name} onChange={e => updZutat(i, 'name', e.target.value)}
                  placeholder="Zutat…" className={IC + ' flex-1'} />
                <input value={z.menge} onChange={e => updZutat(i, 'menge', e.target.value)}
                  placeholder="200g / 3 EL / nach Bedarf" className={IC} style={{ width: 180 }} />
                <button onClick={() => removeZutat(i)}
                  className="text-[#B09880] hover:text-red-400 transition-colors flex-shrink-0">
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
            <span className="ml-auto text-[11px] text-[#8B7355] font-normal">
              z.B. Carbonara Ball · Tonnarelli · Pecorino-Espuma
            </span>
          </h2>
          {komponenten.length === 0 && (
            <p className="text-[13px] text-[#8B7355] mb-3">
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
            <p className="text-[13px] text-[#8B7355] mb-3">Noch keine Schritte.</p>
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
                    className="text-[#B09880] hover:text-[#2C2420] disabled:opacity-20 transition-colors">
                    <ChevronUp size={15} />
                  </button>
                  <button onClick={() => moveSchritt(i, 1)} disabled={i === schritte.length - 1}
                    className="text-[#B09880] hover:text-[#2C2420] disabled:opacity-20 transition-colors">
                    <ChevronDown size={15} />
                  </button>
                </div>
                <button onClick={() => removeSchritt(i)}
                  className="text-[#8B7355] hover:text-red-400 transition-colors pt-2.5 flex-shrink-0">
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
            <span className="ml-2 text-[12px] font-normal text-[#8B7355]">· Wein-Pairing</span>
          </h2>
          <p className="text-[13px] text-[#8B7355] mb-4 leading-relaxed">
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
                    <span style={{ color: '#B09880' }}>
                      {' '}· {matchInfo.unmatched.length} ohne Treffer (ignoriert)
                    </span>
                  )}
                </>
              ) : (
                <span style={{ color: '#B09880' }}>
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
