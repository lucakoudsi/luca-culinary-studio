'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useStore } from '@/lib/store';
import { createClient } from '@/utils/supabase/client';
import { ArrowLeft, Save, Loader2, ImagePlus } from 'lucide-react';
import type { Recipe, RecipeCategory, RecipeDifficulty, Season, RecipeStatus } from '@/types';
import PhotoZone from '@/components/ui/PhotoZone';
import { compressImage, validateImageFile } from '@/lib/imageUtils';

const categories:  RecipeCategory[]   = ['Vorspeise', 'Suppe', 'Hauptgang', 'Dessert', 'Beilage', 'Snack'];
const difficulties: RecipeDifficulty[] = ['Leicht', 'Mittel', 'Schwer'];
const seasons:     Season[]           = ['Frühling', 'Sommer', 'Herbst', 'Winter', 'Ganzjährig'];
const statuses:    RecipeStatus[]     = ['Fertig', 'In Bearbeitung', 'Entwurf'];

const label = "block text-[11px] font-semibold uppercase tracking-widest mb-1.5";
const input = "w-full rounded-lg px-3.5 py-2.5 text-[13px] outline-none transition-colors";
const inputStyle = { background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text)' };

export default function RezeptBearbeitenPage() {
  const { id }   = useParams<{ id: string }>();
  const router   = useRouter();
  const { recipes, fetchRecipes, updateRecipe } = useStore();

  const [loading, setLoading]   = useState(true);
  const [saving,  setSaving]    = useState(false);
  const [saved,   setSaved]     = useState(false);
  const [notFound, setNotFound] = useState(false);

  const [title,       setTitle]       = useState('');
  const [category,    setCategory]    = useState<RecipeCategory>('Hauptgang');
  const [difficulty,  setDifficulty]  = useState<RecipeDifficulty>('Mittel');
  const [season,      setSeason]      = useState<Season>('Ganzjährig');
  const [status,      setStatus]      = useState<RecipeStatus>('Entwurf');
  const [time,        setTime]        = useState(60);
  const [description, setDescription] = useState('');
  const [tagsInput,   setTagsInput]   = useState('');
  const [image,       setImage]       = useState('');
  const [imageFile,     setImageFile]     = useState<File | null>(null);
  const [imagePreview,  setImagePreview]  = useState<string | null>(null);
  const [uploadingImg,  setUploadingImg]  = useState(false);
  const [imageError,    setImageError]    = useState<string | null>(null);

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
    setDescription(r.description || '');
    setTagsInput((r.tags || []).join(', '));
    setImage(r.image || '');
    setImagePreview(r.image || null);
  }

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
    const tags = tagsInput.split(',').map(t => t.trim()).filter(Boolean);
    let finalImage: string | null = image || null;
    if (imageFile) {
      const uploaded = await uploadPhoto(imageFile);
      if (!uploaded) { setSaving(false); return; } // upload failed; error shown in PhotoZone
      finalImage = uploaded;
    }
    await updateRecipe(Number(id), { title, category, difficulty, season, status, time, description, tags, image: finalImage });
    setSaving(false);
    setSaved(true);
    setTimeout(() => router.push('/rezepte'), 900);
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
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-[13px] font-semibold transition-all disabled:opacity-50"
            style={{ background: saved ? 'rgba(124,184,122,0.15)' : 'linear-gradient(135deg, #562E3C, #7D4558)', color: saved ? '#7CB87A' : '#FFFFFF' }}>
            {(saving || uploadingImg) ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
            {saving ? 'Speichern…' : uploadingImg ? 'Foto hochladen…' : saved ? '✓ Gespeichert' : 'Änderungen speichern'}
          </button>
        </div>
      </div>

      {/* Form */}
      <div className="p-8 max-w-[800px] grid gap-6">

        {/* Title */}
        <div>
          <label className={label} style={{ color: 'var(--text-muted)' }}>Titel *</label>
          <input value={title} onChange={e => setTitle(e.target.value)} className={input}
            style={inputStyle} placeholder="Rezepttitel…" />
        </div>

        {/* Grid: Category + Difficulty + Time */}
        <div className="grid grid-cols-3 gap-4">
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

        {/* Save */}
        <div className="pt-2 flex gap-3">
          <button onClick={handleSave} disabled={saving || uploadingImg || !title.trim()}
            className="flex items-center gap-2 px-7 py-3 rounded-xl text-[13px] font-semibold transition-all disabled:opacity-50"
            style={{ background: saved ? 'rgba(124,184,122,0.15)' : 'linear-gradient(135deg, #562E3C, #7D4558)', color: saved ? '#7CB87A' : '#FFFFFF' }}>
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
    </div>
  );
}
