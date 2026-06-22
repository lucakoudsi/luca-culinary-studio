'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useStore } from '@/lib/store';
import { ArrowLeft, Save, Loader2, Image as ImageIcon } from 'lucide-react';
import type { Recipe, RecipeCategory, RecipeDifficulty, Season, RecipeStatus } from '@/types';

const categories:  RecipeCategory[]   = ['Vorspeise', 'Suppe', 'Hauptgang', 'Dessert', 'Beilage', 'Snack'];
const difficulties: RecipeDifficulty[] = ['Leicht', 'Mittel', 'Schwer'];
const seasons:     Season[]           = ['Frühling', 'Sommer', 'Herbst', 'Winter', 'Ganzjährig'];
const statuses:    RecipeStatus[]     = ['Fertig', 'In Bearbeitung', 'Entwurf'];

const label = "block text-[11px] font-semibold uppercase tracking-widest mb-1.5";
const input = "w-full rounded-lg px-3.5 py-2.5 text-[13px] outline-none transition-colors";
const inputStyle = { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', color: '#F5F0E8' };

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
  }

  const handleSave = async () => {
    setSaving(true);
    const tags = tagsInput.split(',').map(t => t.trim()).filter(Boolean);
    await updateRecipe(Number(id), { title, category, difficulty, season, status, time, description, tags, image: image || null });
    setSaving(false);
    setSaved(true);
    setTimeout(() => router.push('/rezepte'), 900);
  };

  if (loading) {
    return (
      <div style={{ background: '#0A0A0A', minHeight: '100vh' }} className="flex items-center justify-center">
        <Loader2 size={24} className="animate-spin" style={{ color: '#C9A84C' }} />
      </div>
    );
  }

  if (notFound) {
    return (
      <div style={{ background: '#0A0A0A', minHeight: '100vh' }} className="flex items-center justify-center">
        <div className="text-center">
          <p className="font-heading text-xl mb-4" style={{ color: '#F5F0E8' }}>Rezept nicht gefunden</p>
          <button onClick={() => router.push('/rezepte')}
            className="px-5 py-2.5 rounded-xl text-[13px] font-semibold"
            style={{ background: 'rgba(201,168,76,0.1)', color: '#C9A84C', border: '1px solid rgba(201,168,76,0.3)' }}>
            ← Zurück
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ background: '#0A0A0A', minHeight: '100vh' }}>

      {/* Header */}
      <div className="px-8 pt-8 pb-6 flex items-start justify-between gap-6"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
        <div>
          <button onClick={() => router.back()}
            className="flex items-center gap-2 mb-4 text-[12px] font-medium transition-colors"
            style={{ color: 'rgba(168,152,128,0.6)' }}
            onMouseEnter={e => (e.currentTarget as HTMLButtonElement).style.color = '#C9A84C'}
            onMouseLeave={e => (e.currentTarget as HTMLButtonElement).style.color = 'rgba(168,152,128,0.6)'}>
            <ArrowLeft size={14} /> Zurück
          </button>
          <div className="text-[10px] font-semibold tracking-[4px] uppercase mb-2" style={{ color: 'rgba(201,168,76,0.55)' }}>
            ✦ &nbsp;Rezept bearbeiten
          </div>
          <h1 className="font-heading font-bold leading-none"
            style={{ fontSize: 28, color: '#F5F0E8', letterSpacing: '2px', textTransform: 'uppercase' }}>
            {title || 'Rezept bearbeiten'}
          </h1>
        </div>

        <div className="mt-auto">
          <button onClick={handleSave} disabled={saving || !title.trim()}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-[13px] font-semibold transition-all disabled:opacity-50"
            style={{ background: saved ? 'rgba(124,184,122,0.15)' : 'linear-gradient(135deg, #9A7A30, #C9A84C)', color: saved ? '#7CB87A' : '#0A0A0A' }}>
            {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
            {saving ? 'Speichern…' : saved ? '✓ Gespeichert' : 'Änderungen speichern'}
          </button>
        </div>
      </div>

      {/* Form */}
      <div className="p-8 max-w-[800px] grid gap-6">

        {/* Title */}
        <div>
          <label className={label} style={{ color: 'rgba(168,152,128,0.6)' }}>Titel *</label>
          <input value={title} onChange={e => setTitle(e.target.value)} className={input}
            style={inputStyle} placeholder="Rezepttitel…" />
        </div>

        {/* Grid: Category + Difficulty + Time */}
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className={label} style={{ color: 'rgba(168,152,128,0.6)' }}>Kategorie</label>
            <select value={category} onChange={e => setCategory(e.target.value as RecipeCategory)}
              className={input + ' cursor-pointer'} style={inputStyle}>
              {categories.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className={label} style={{ color: 'rgba(168,152,128,0.6)' }}>Schwierigkeit</label>
            <select value={difficulty} onChange={e => setDifficulty(e.target.value as RecipeDifficulty)}
              className={input + ' cursor-pointer'} style={inputStyle}>
              {difficulties.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>
          <div>
            <label className={label} style={{ color: 'rgba(168,152,128,0.6)' }}>Zeit (Minuten)</label>
            <input type="number" value={time} onChange={e => setTime(Number(e.target.value))} min={1}
              className={input} style={inputStyle} />
          </div>
        </div>

        {/* Grid: Season + Status */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={label} style={{ color: 'rgba(168,152,128,0.6)' }}>Saison</label>
            <div className="flex flex-wrap gap-2">
              {seasons.map(s => (
                <button key={s} onClick={() => setSeason(s)}
                  className="px-3 py-1.5 rounded-lg text-[12px] font-medium transition-all"
                  style={{
                    background: season === s ? 'rgba(201,168,76,0.15)' : 'rgba(255,255,255,0.04)',
                    border:     `1px solid ${season === s ? 'rgba(201,168,76,0.4)' : 'rgba(255,255,255,0.08)'}`,
                    color:      season === s ? '#C9A84C' : '#A89880',
                  }}>
                  {s}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className={label} style={{ color: 'rgba(168,152,128,0.6)' }}>Status</label>
            <div className="flex gap-2">
              {statuses.map(s => (
                <button key={s} onClick={() => setStatus(s)}
                  className="flex-1 py-1.5 rounded-lg text-[12px] font-medium transition-all"
                  style={{
                    background: status === s ? 'rgba(201,168,76,0.15)' : 'rgba(255,255,255,0.04)',
                    border:     `1px solid ${status === s ? 'rgba(201,168,76,0.4)' : 'rgba(255,255,255,0.08)'}`,
                    color:      status === s ? '#C9A84C' : '#A89880',
                  }}>
                  {s}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Tags */}
        <div>
          <label className={label} style={{ color: 'rgba(168,152,128,0.6)' }}>Tags <span style={{ color: 'rgba(168,152,128,0.35)', fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>(komma-getrennt)</span></label>
          <input value={tagsInput} onChange={e => setTagsInput(e.target.value)} className={input}
            style={inputStyle} placeholder="z.B. Sous-vide, Pilze, Herbst" />
          {tagsInput && (
            <div className="flex flex-wrap gap-1.5 mt-2">
              {tagsInput.split(',').map(t => t.trim()).filter(Boolean).map(t => (
                <span key={t} className="text-[11px] px-2.5 py-0.5 rounded-full"
                  style={{ background: 'rgba(201,168,76,0.1)', color: '#C9A84C', border: '1px solid rgba(201,168,76,0.25)' }}>
                  {t}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Description */}
        <div>
          <label className={label} style={{ color: 'rgba(168,152,128,0.6)' }}>Beschreibung</label>
          <textarea value={description} onChange={e => setDescription(e.target.value)} rows={5}
            className={input + ' resize-none'} style={{ ...inputStyle, lineHeight: 1.7 }}
            placeholder="Kurze Beschreibung des Rezepts, Inspiration, Besonderheiten…" />
        </div>

        {/* Image */}
        <div>
          <label className={label} style={{ color: 'rgba(168,152,128,0.6)' }}>
            <span className="flex items-center gap-1.5"><ImageIcon size={10} /> Foto-URL</span>
          </label>
          <input value={image} onChange={e => setImage(e.target.value)} className={input}
            style={inputStyle} placeholder="https://… (Unsplash, eigene URL, etc.)" />
          {image && (
            <div className="mt-3 relative rounded-xl overflow-hidden h-36">
              <img src={image} alt="" className="w-full h-full object-cover" />
              <button onClick={() => setImage('')}
                className="absolute top-2 right-2 rounded-full p-1 text-[11px]"
                style={{ background: 'rgba(0,0,0,0.65)', color: 'rgba(255,255,255,0.7)', border: '1px solid rgba(255,255,255,0.15)' }}>
                ✕
              </button>
            </div>
          )}
        </div>

        {/* Save */}
        <div className="pt-2 flex gap-3">
          <button onClick={handleSave} disabled={saving || !title.trim()}
            className="flex items-center gap-2 px-7 py-3 rounded-xl text-[13px] font-semibold transition-all disabled:opacity-50"
            style={{ background: saved ? 'rgba(124,184,122,0.15)' : 'linear-gradient(135deg, #9A7A30, #C9A84C)', color: saved ? '#7CB87A' : '#0A0A0A' }}>
            {saving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
            {saving ? 'Speichern…' : saved ? '✓ Gespeichert' : 'Änderungen speichern'}
          </button>
          <button onClick={() => router.back()}
            className="px-5 py-3 rounded-xl text-[13px] font-medium transition-all"
            style={{ background: 'rgba(255,255,255,0.04)', color: 'rgba(168,152,128,0.7)', border: '1px solid rgba(255,255,255,0.08)' }}>
            Abbrechen
          </button>
        </div>

      </div>
    </div>
  );
}
