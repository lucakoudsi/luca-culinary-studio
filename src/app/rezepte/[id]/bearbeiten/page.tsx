'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useStore } from '@/lib/store';
import { createClient } from '@/utils/supabase/client';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { ArrowLeft, Save, Loader2, ImagePlus, Wine, Calculator, Tag, Plus, X, ChevronUp, ChevronDown, ChefHat, Lock } from 'lucide-react';
import type { Recipe, RecipeCategory, RecipeDifficulty, Season, RecipeStatus, RecipeIngredient, RecipeKomponente, FlavorProfile } from '@/types';
import { compressImage, validateImageFile } from '@/lib/imageUtils';
import { submitGlow } from '@/lib/utils';
import { FlavorSliders } from '@/components/ui/FlavorSliders';
import { computeRecipeFlavorProfile, EMPTY_FLAVOR } from '@/lib/recipeFlavorUtils';
import KomponenteCard from '@/components/recipes/KomponenteCard';
import SousChefPanel from '@/components/recipes/SousChefPanel';
import { getUserTier } from '@/config/roles';
import type { RezeptSnapshot } from '@/lib/rezeptKiExtraktion';

const PhotoZone = dynamic(() => import('@/components/ui/PhotoZone'), { ssr: false });

const categories:  RecipeCategory[]   = ['Vorspeise', 'Suppe', 'Hauptgang', 'Dessert', 'Beilage', 'Snack'];
const difficulties: RecipeDifficulty[] = ['Leicht', 'Mittel', 'Schwer'];
const seasons:     Season[]           = ['Frühling', 'Sommer', 'Herbst', 'Winter', 'Ganzjährig'];
const statuses:    RecipeStatus[]     = ['Fertig', 'In Bearbeitung', 'Entwurf'];

const label = "block text-[11px] font-semibold uppercase tracking-widest mb-1.5";
const input = "w-full rounded-lg px-3.5 py-2.5 text-[13px] outline-none transition-colors";
const inputStyle = { background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text)' };
const abt = "flex items-center gap-1.5 text-[12px] text-gold hover:text-gold-light transition-colors mt-3";

export default function RezeptBearbeitenPage() {
  const { id }   = useParams<{ id: string }>();
  const router   = useRouter();
  const { recipes, fetchRecipes, updateRecipe, ingredients, fetchIngredients } = useStore();

  const [loading, setLoading]   = useState(true);
  const [saving,  setSaving]    = useState(false);
  const [saved,   setSaved]     = useState(false);
  const [notFound, setNotFound] = useState(false);

  // Rezept-Sous-Chef laeuft ueber den Betreiber-Key und ist ab Basic (Tier 2)
  // freigeschaltet -- Server erzwingt das ohnehin (requireTier), hier nur UI.
  const [userTier, setUserTier] = useState<number | null>(null);
  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      const email = data.user?.email ?? null;
      fetch('/api/profil').then(r => r.json()).then(d => {
        setUserTier(getUserTier(email, d.profile?.stufe));
      }).catch(() => setUserTier(1));
    });
  }, []);
  const kiLocked = userTier !== null && userTier < 2;

  const [title,       setTitle]       = useState('');
  const [category,    setCategory]    = useState<RecipeCategory>('Hauptgang');
  const [difficulty,  setDifficulty]  = useState<RecipeDifficulty>('Mittel');
  const [season,      setSeason]      = useState<Season>('Ganzjährig');
  const [status,      setStatus]      = useState<RecipeStatus>('Entwurf');
  const [time,        setTime]        = useState(60);
  const [portionen,   setPortionen]   = useState(4);
  const [description, setDescription] = useState('');
  const [tagsInput,   setTagsInput]   = useState('');
  const [image,       setImage]       = useState('');
  const [imageFile,     setImageFile]     = useState<File | null>(null);
  const [imagePreview,  setImagePreview]  = useState<string | null>(null);
  const [uploadingImg,  setUploadingImg]  = useState(false);
  const [imageError,    setImageError]    = useState<string | null>(null);
  const [saveError,     setSaveError]     = useState<string | null>(null);

  // Geschmacksprofil
  const [geschmack,    setGeschmackRaw]  = useState<FlavorProfile>(EMPTY_FLAVOR);
  const [geschmackSet, setGeschmackSet]  = useState(false);
  const [matchInfo,    setMatchInfo]     = useState<{ matched: string[]; unmatched: string[] } | null>(null);
  const setGeschmack = (p: FlavorProfile) => { setGeschmackRaw(p); setGeschmackSet(true); };

  const [zutaten,     setZutaten]     = useState<RecipeIngredient[]>([]);
  const [komponenten, setKomponenten] = useState<RecipeKomponente[]>([]);
  const [collapsed,   setCollapsed]   = useState<boolean[]>([]);
  const [schritte,    setSchritte]    = useState<string[]>([]);
  const [getraenke,   setGetraenke]   = useState('');
  const [chefTipps,   setChefTipps]   = useState('');

  useEffect(() => { if (ingredients.length === 0) fetchIngredients(); }, []);

  useEffect(() => {
    const load = async () => {
      if (!recipes.length) await fetchRecipes();
      const recipe = recipes.find(r => r.id === Number(id));
      if (!recipe) {
        try {
          const res = await fetch(`/api/rezepte/${id}`);
          if (!res.ok) { setNotFound(true); setLoading(false); return; }
          const data: Recipe = await res.json();
          fillForm(data);
        } catch {
          setNotFound(true);
        }
      } else {
        fillForm(recipe);
      }
      setLoading(false);
    };
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  function fillForm(r: Recipe) {
    setTitle(r.title);
    setCategory(r.category);
    setDifficulty(r.difficulty);
    setSeason(r.season);
    setStatus(r.status);
    setTime(r.time);
    setPortionen(r.portionen ?? 4);
    setDescription(r.description || '');
    setTagsInput((r.tags || []).join(', '));
    setImage(r.image || '');
    setImagePreview(r.image || null);
    setZutaten(r.zutaten ?? []);
    setKomponenten(r.komponenten ?? []);
    setCollapsed((r.komponenten ?? []).map(() => true));
    setSchritte(r.schritte ?? []);
    setGetraenke(r.getraenke ?? '');
    setChefTipps(r.chefTipps ?? '');
    if (r.geschmack) {
      setGeschmackRaw(r.geschmack);
      setGeschmackSet(true);
    }
  }

  const handleCompute = () => {
    const result = computeRecipeFlavorProfile(zutaten, komponenten, ingredients);
    setGeschmack(result.profile);
    setMatchInfo({ matched: result.matched, unmatched: result.unmatched });
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
    setImage('');
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

  const handleSave = async () => {
    setSaving(true);
    setSaveError(null);
    const tags = tagsInput.split(',').map(t => t.trim()).filter(Boolean);
    let finalImage: string | null = image || null;
    try {
      if (imageFile) {
        const uploaded = await uploadPhoto(imageFile);
        if (!uploaded) { setSaving(false); return; } // upload failed; error shown in PhotoZone
        finalImage = uploaded;
      }
      await updateRecipe(Number(id), {
        title, category, difficulty, season, status, time, description, tags, portionen,
        zutaten, komponenten, schritte, getraenke, chefTipps,
        image: finalImage,
        geschmack: geschmackSet ? geschmack : undefined,
      });
      setSaved(true);
      setTimeout(() => router.push('/rezepte'), 900);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Rezept konnte nicht gespeichert werden');
    } finally {
      setSaving(false);
    }
  };

  // ── KI-Sous-Chef: bestehendes Rezept im Dialog korrigieren/verfeinern ─────
  // Änderungen landen nur im Formular-Stand -- übernommen wird wie bei jeder
  // anderen Bearbeitung erst durch "Änderungen speichern".
  const getSousChefSnapshot = (): RezeptSnapshot => ({
    title, description, category, difficulty, time, season,
    tags: tagsInput.split(',').map(t => t.trim()).filter(Boolean),
    portionen, zutaten, komponenten, schritte, getraenke, chefTipps, geschmack,
  });

  const applySousChefPatch = (f: Partial<RezeptSnapshot>) => {
    if (f.title !== undefined) setTitle(f.title);
    if (f.description !== undefined) setDescription(f.description);
    if (f.category) setCategory(f.category as RecipeCategory);
    if (f.difficulty) setDifficulty(f.difficulty as RecipeDifficulty);
    if (f.time) setTime(f.time);
    if (f.season) setSeason(f.season as Season);
    if (f.tags) setTagsInput(f.tags.join(', '));
    if (f.portionen) setPortionen(f.portionen);
    if (f.zutaten) setZutaten(f.zutaten);
    if (f.komponenten) {
      setKomponenten(f.komponenten);
      setCollapsed(f.komponenten.map(() => false));
    }
    if (f.schritte) setSchritte(f.schritte);
    if (f.getraenke !== undefined) setGetraenke(f.getraenke);
    if (f.chefTipps !== undefined) setChefTipps(f.chefTipps);
    if (f.geschmack) setGeschmack(f.geschmack);
  };

  if (loading) {
    return (
      <div style={{ background: 'var(--bg)', minHeight: '100vh' }} className="flex items-center justify-center">
        <Loader2 size={24} className="animate-spin" style={{ color: '#6B3A4B' }} />
      </div>
    );
  }

  if (notFound) {
    return (
      <div style={{ background: 'var(--bg)', minHeight: '100vh' }} className="flex items-center justify-center">
        <div className="text-center">
          <p className="font-heading text-xl mb-4" style={{ color: 'var(--text)' }}>Rezept nicht gefunden</p>
          <button onClick={() => router.push('/rezepte')}
            className="px-5 py-2.5 rounded-xl text-[13px] font-semibold"
            style={{ background: 'rgba(107,58,75,0.08)', color: '#6B3A4B', border: '1px solid rgba(107,58,75,0.25)' }}>
            ← Zurück
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ background: 'var(--bg)', minHeight: '100vh' }}>

      {/* Header */}
      <div className="px-8 pt-8 pb-6 flex items-start justify-between gap-6"
        style={{ borderBottom: '1px solid var(--border)' }}>
        <div>
          <button onClick={() => router.back()}
            className="flex items-center gap-2 mb-4 text-[12px] font-medium transition-colors"
            style={{ color: 'var(--text-muted)' }}
            onMouseEnter={e => (e.currentTarget as HTMLButtonElement).style.color = '#6B3A4B'}
            onMouseLeave={e => (e.currentTarget as HTMLButtonElement).style.color = '#8B7355'}>
            <ArrowLeft size={14} /> Zurück
          </button>
          <div className="text-[10px] font-semibold tracking-[4px] uppercase mb-2" style={{ color: 'rgba(107,58,75,0.55)' }}>
            ✦ &nbsp;Rezept bearbeiten
          </div>
          <h1 className="font-heading font-bold leading-none"
            style={{ fontSize: 28, color: 'var(--text)', letterSpacing: '2px', textTransform: 'uppercase' }}>
            {title || 'Rezept bearbeiten'}
          </h1>
        </div>

        <div className="mt-auto">
          <button onClick={handleSave} disabled={saving || uploadingImg || !title.trim()}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-[13px] font-semibold transition-all disabled:opacity-40"
            style={{
              background: saved ? 'rgba(124,184,122,0.15)' : 'linear-gradient(135deg, #562E3C, #7D4558)', color: saved ? '#7CB87A' : '#FFFFFF',
              boxShadow: saved ? 'none' : submitGlow(!saving && !uploadingImg && !!title.trim()),
            }}>
            {(saving || uploadingImg) ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
            {saving ? 'Speichern…' : uploadingImg ? 'Foto hochladen…' : saved ? '✓ Gespeichert' : 'Änderungen speichern'}
          </button>
        </div>
      </div>

      {saveError && (
        <div className="mx-8 mt-4 flex items-start gap-2 px-4 py-3 rounded-xl text-[13px]"
          style={{ background: 'rgba(192,80,80,0.08)', border: '1px solid rgba(192,80,80,0.25)', color: '#C05050' }}>
          <span className="flex-shrink-0 mt-0.5">⚠</span>
          <span>{saveError}</span>
        </div>
      )}

      {/* Form (+ KI-Sous-Chef-Sidebar) */}
      <div className="flex gap-6 items-start p-8">
      <div className="max-w-[800px] w-full grid gap-6">

        {/* Title */}
        <div>
          <label className={label} style={{ color: 'var(--text-muted)' }}>Titel *</label>
          <input value={title} onChange={e => setTitle(e.target.value)} className={input}
            style={inputStyle} placeholder="Rezepttitel…" />
        </div>

        {/* Grid: Category + Difficulty + Time + Portionen */}
        <div className="grid grid-cols-4 gap-4">
          <div>
            <label className={label} style={{ color: 'var(--text-muted)' }}>Kategorie</label>
            <select value={category} onChange={e => setCategory(e.target.value as RecipeCategory)}
              className={input + ' cursor-pointer'} style={inputStyle}>
              {categories.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className={label} style={{ color: 'var(--text-muted)' }}>Schwierigkeit</label>
            <select value={difficulty} onChange={e => setDifficulty(e.target.value as RecipeDifficulty)}
              className={input + ' cursor-pointer'} style={inputStyle}>
              {difficulties.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>
          <div>
            <label className={label} style={{ color: 'var(--text-muted)' }}>Zeit (Minuten)</label>
            <input type="number" value={time} onChange={e => setTime(Number(e.target.value))} min={1}
              className={input} style={inputStyle} />
          </div>
          <div>
            <label className={label} style={{ color: 'var(--text-muted)' }}>Portionen</label>
            <input type="number" value={portionen} onChange={e => setPortionen(Number(e.target.value))} min={1} max={100}
              className={input} style={inputStyle} />
          </div>
        </div>

        {/* Grid: Season + Status */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={label} style={{ color: 'var(--text-muted)' }}>Saison</label>
            <div className="flex flex-wrap gap-2">
              {seasons.map(s => (
                <button key={s} onClick={() => setSeason(s)}
                  className="px-3 py-1.5 rounded-lg text-[12px] font-medium transition-all"
                  style={{
                    background: season === s ? 'rgba(107,58,75,0.12)' : 'rgba(0,0,0,0.04)',
                    border:     `1px solid ${season === s ? 'rgba(107,58,75,0.35)' : 'rgba(0,0,0,0.08)'}`,
                    color:      season === s ? '#6B3A4B' : '#8B7355',
                  }}>
                  {s}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className={label} style={{ color: 'var(--text-muted)' }}>Status</label>
            <div className="flex gap-2">
              {statuses.map(s => (
                <button key={s} onClick={() => setStatus(s)}
                  className="flex-1 py-1.5 rounded-lg text-[12px] font-medium transition-all"
                  style={{
                    background: status === s ? 'rgba(107,58,75,0.12)' : 'rgba(0,0,0,0.04)',
                    border:     `1px solid ${status === s ? 'rgba(107,58,75,0.35)' : 'rgba(0,0,0,0.08)'}`,
                    color:      status === s ? '#6B3A4B' : '#8B7355',
                  }}>
                  {s}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Tags */}
        <div>
          <label className={label} style={{ color: 'var(--text-muted)' }}>Tags <span style={{ color: 'var(--text-muted)', fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>(komma-getrennt)</span></label>
          <input value={tagsInput} onChange={e => setTagsInput(e.target.value)} className={input}
            style={inputStyle} placeholder="z.B. Sous-vide, Pilze, Herbst" />
          {tagsInput && (
            <div className="flex flex-wrap gap-1.5 mt-2">
              {tagsInput.split(',').map(t => t.trim()).filter(Boolean).map(t => (
                <span key={t} className="text-[11px] px-2.5 py-0.5 rounded-full"
                  style={{ background: 'rgba(107,58,75,0.1)', color: '#6B3A4B', border: '1px solid rgba(107,58,75,0.25)' }}>
                  {t}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Description */}
        <div>
          <label className={label} style={{ color: 'var(--text-muted)' }}>Beschreibung</label>
          <textarea value={description} onChange={e => setDescription(e.target.value)} rows={5}
            className={input + ' resize-none'} style={{ ...inputStyle, lineHeight: 1.7 }}
            placeholder="Kurze Beschreibung des Rezepts, Inspiration, Besonderheiten…" />
        </div>

        {/* Zutaten */}
        <div>
          <label className={label} style={{ color: 'var(--text-muted)' }}>
            <span className="flex items-center gap-1.5"><Tag size={10} /> Zutaten</span>
          </label>
          {zutaten.length === 0 && (
            <p className="text-[13px] mb-3" style={{ color: 'var(--text-muted)' }}>Noch keine Zutaten hinzugefügt.</p>
          )}
          <div className="space-y-2">
            {zutaten.map((z, i) => (
              <div key={i} className="flex gap-2 items-center">
                <input value={z.name} onChange={e => updZutat(i, 'name', e.target.value)}
                  placeholder="Zutat…" className={input + ' flex-1'} style={inputStyle} />
                <input value={z.menge} onChange={e => updZutat(i, 'menge', e.target.value)}
                  placeholder="200g / 3 EL / nach Bedarf" className={input} style={{ ...inputStyle, width: 180 }} />
                <button onClick={() => removeZutat(i)}
                  className="text-text-muted hover:text-red-400 transition-colors flex-shrink-0">
                  <X size={15} />
                </button>
              </div>
            ))}
          </div>
          <button onClick={addZutat} className={abt}>
            <Plus size={14} /> Zutat hinzufügen
          </button>
        </div>

        {/* Komponenten */}
        <div>
          <label className={label} style={{ color: 'var(--text-muted)' }}>
            Komponenten <span style={{ color: 'var(--text-muted)', fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>(optional, z.B. für mehrteilige Gerichte)</span>
          </label>
          {komponenten.length === 0 && (
            <p className="text-[13px] mb-3" style={{ color: 'var(--text-muted)' }}>
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
          <button onClick={addKomponente} className={abt}>
            <Plus size={14} /> Komponente hinzufügen
          </button>
        </div>

        {/* Zubereitungsschritte */}
        <div>
          <label className={label} style={{ color: 'var(--text-muted)' }}>Zubereitungsschritte</label>
          {schritte.length === 0 && (
            <p className="text-[13px] mb-3" style={{ color: 'var(--text-muted)' }}>Noch keine Schritte.</p>
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
                  className={input + ' flex-1 resize-none leading-relaxed'} style={inputStyle} />
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
          <button onClick={addSchritt} className={abt}>
            <Plus size={14} /> Schritt hinzufügen
          </button>
        </div>

        {/* Getränkeempfehlung */}
        <div>
          <label className={label} style={{ color: 'var(--text-muted)' }}>
            <span className="flex items-center gap-1.5"><Wine size={10} /> Getränkeempfehlung</span>
          </label>
          <textarea value={getraenke} onChange={e => setGetraenke(e.target.value)} rows={3}
            className={input + ' resize-none leading-relaxed'} style={inputStyle}
            placeholder="Weinempfehlung, Cocktail oder alkoholfreie Alternative…" />
        </div>

        {/* Chef-Tipps */}
        <div>
          <label className={label} style={{ color: 'var(--text-muted)' }}>
            <span className="flex items-center gap-1.5"><ChefHat size={10} /> Notizen &amp; Chef-Tipps</span>
          </label>
          <textarea value={chefTipps} onChange={e => setChefTipps(e.target.value)} rows={4}
            className={input + ' resize-none leading-relaxed'} style={inputStyle}
            placeholder="Persönliche Notizen, Variationen, Tricks aus der Küche…" />
        </div>

        {/* Image */}
        <div>
          <label className={label} style={{ color: 'var(--text-muted)' }}>
            <span className="flex items-center gap-1.5"><ImagePlus size={10} /> Rezeptfoto</span>
          </label>
          <PhotoZone
            preview={imagePreview}
            onFile={handlePhoto}
            onClear={handleClearPhoto}
            uploading={uploadingImg}
            error={imageError}
          />
        </div>

        {/* Geschmacksprofil */}
        <div className="rounded-2xl p-6" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
          <div className="flex items-center gap-2 mb-1" style={{ color: 'var(--text)' }}>
            <Wine size={16} color="#6B3A4B" />
            <span className="font-heading text-[16px] font-bold">Geschmacksprofil</span>
            <span className="text-[12px] font-normal ml-1" style={{ color: 'var(--text-muted)' }}>· Wein-Pairing</span>
          </div>
          <p className="text-[13px] mb-4 leading-relaxed" style={{ color: 'var(--text-muted)' }}>
            Beschreibt den Geschmack des Gerichts (0 = nicht vorhanden, 5 = intensiv). Basis für Weinempfehlungen.
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

        {/* Save */}
        <div className="pt-2 flex gap-3">
          <button onClick={handleSave} disabled={saving || uploadingImg || !title.trim()}
            className="flex items-center gap-2 px-7 py-3 rounded-xl text-[13px] font-semibold transition-all disabled:opacity-40"
            style={{
              background: saved ? 'rgba(124,184,122,0.15)' : 'linear-gradient(135deg, #562E3C, #7D4558)', color: saved ? '#7CB87A' : '#FFFFFF',
              boxShadow: saved ? 'none' : submitGlow(!saving && !uploadingImg && !!title.trim()),
            }}>
            {(saving || uploadingImg) ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
            {saving ? 'Speichern…' : uploadingImg ? 'Foto hochladen…' : saved ? '✓ Gespeichert' : 'Änderungen speichern'}
          </button>
          <button onClick={() => router.back()}
            className="px-5 py-3 rounded-xl text-[13px] font-medium transition-all"
            style={{ background: 'rgba(0,0,0,0.04)', color: 'var(--text-muted)', border: '1px solid rgba(0,0,0,0.08)' }}>
            Abbrechen
          </button>
        </div>

      </div>

      {/* ── KI-Sous-Chef: Rezept im Dialog korrigieren/verfeinern ──────────── */}
      {kiLocked ? (
        <div className="w-[380px] flex-shrink-0 sticky flex flex-col hidden lg:flex" style={{ top: 32 }}>
          <div className="bg-card border border-border rounded-xl flex flex-col items-center justify-center gap-3 p-8 text-center">
            <div className="w-11 h-11 rounded-full flex items-center justify-center"
              style={{ background: 'rgba(201,168,76,0.12)', border: '1px solid rgba(201,168,76,0.3)' }}>
              <Lock size={18} style={{ color: '#C9A84C' }} />
            </div>
            <div>
              <p className="text-[13px] font-semibold text-text-primary mb-1">KI-Sous-Chef ist ein Basic-Feature</p>
              <p className="text-[12px] text-text-muted">
                Rezepte im Dialog korrigieren und verfeinern — ab Basic verfügbar.
              </p>
            </div>
            <Link href="/profil"
              className="px-4 py-2 rounded-lg text-[12px] font-semibold transition-all"
              style={{ background: 'rgba(107,58,75,0.1)', color: '#6B3A4B', border: '1px solid rgba(107,58,75,0.25)' }}>
              Jetzt upgraden
            </Link>
          </div>
        </div>
      ) : userTier !== null ? (
        <SousChefPanel
          getSnapshot={getSousChefSnapshot}
          onApplyPatch={applySousChefPatch}
          greeting={`Frag mich, was ich an „${title || 'diesem Rezept'}“ anpassen soll — z.B. „Die Garzeit stimmt nicht, das braucht 25 Minuten“ oder „Rechne die Mengen auf 6 Portionen um“. Änderungen werden erst beim Speichern übernommen.`}
          stickyTop={32}
        />
      ) : null}
    </div>
    </div>
  );
}
