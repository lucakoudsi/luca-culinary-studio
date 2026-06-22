'use client';
import { useParams, useRouter } from 'next/navigation';
import { useState } from 'react';
import { useStore } from '@/lib/store';
import { ArrowLeft, Clock, CheckCircle2, ChefHat, FileText, TrendingUp, Edit3, X, Save } from 'lucide-react';

interface ProjectDetail {
  id: number;
  title: string;
  category: string;
  description: string;
  progress: number;
  status: string;
  img: string;
  created: string;
  target: string;
  recipes: { title: string; status: string; category: string }[];
  notes: { text: string; date: string }[];
  tags: string[];
}

const PROJECT_DATA: Record<number, ProjectDetail> = {
  1: {
    id: 1,
    title: 'Herbst-Menü 2024',
    category: 'Fine Dining',
    description: 'Ein 7-gängiges Herbst-Menü für die kommende Saison. Fokus auf regionale Produkte aus dem Rhein-Main-Gebiet kombiniert mit japanischen Fermentationstechniken. Jeder Gang soll die Transformation des Herbstes erzählen – vom ersten Morgenfrost bis zur tiefen Erdenwärme.',
    progress: 75,
    status: 'Aktiv',
    img: 'https://images.unsplash.com/photo-1488477181946-6428a0291777?w=800',
    created: '2024-09-01',
    target: '2024-11-15',
    recipes: [
      { title: 'Kürbis-Miso Velouté',       status: 'Fertig',   category: 'Suppe' },
      { title: 'Steinpilz-Espuma',          status: 'Fertig',   category: 'Amuse-Bouche' },
      { title: 'Hirschfilet Sous-vide',     status: 'Fertig',   category: 'Hauptgang' },
      { title: 'Waldpilz-Tarte',            status: 'Entwurf',  category: 'Vorspeise' },
    ],
    notes: [
      { text: 'Kastaniensauce mit Haselnussöl testen – gibt mehr Tiefe als Butter.', date: '2024-09-12' },
      { text: 'Quincepairing mit Wildfleisch sehr interessant. Notiz: saure Komponente fehlt noch.', date: '2024-10-03' },
      { text: 'Schwarze Nuss als Garnitur – Tannin-Kontrast perfekt für Wildgerichte.', date: '2024-10-18' },
    ],
    tags: ['Herbst', 'Regional', 'Fine Dining', 'Fermentation', '7-gängig'],
  },
  2: {
    id: 2,
    title: 'Signature Dessert',
    category: 'Patisserie',
    description: 'Entwicklung eines Signature-Desserts für das Restaurant-Konzept. Das Dessert soll die Brücke zwischen asiatischer Patisserie und klassischer französischer Confiserie schlagen. Yuzu als Hauptaroma, Schwarze Sesam-Praline als Textur-Element.',
    progress: 40,
    status: 'Aktiv',
    img: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800',
    created: '2024-10-15',
    target: '2024-12-01',
    recipes: [
      { title: 'Yuzu-Cremeux',             status: 'Fertig',   category: 'Dessert' },
      { title: 'Sesam-Praline',            status: 'Entwurf',  category: 'Patisserie' },
      { title: 'Matcha-Biscuit',           status: 'Entwurf',  category: 'Patisserie' },
    ],
    notes: [
      { text: 'Yuzu-Cremeux braucht mehr Säure – Kombination mit Passionsfrucht testen.', date: '2024-10-20' },
      { text: 'Textur-Konzept: Kalt-Warm-Kontrast. Warmes Sesam-Kuchen mit kaltem Yuzu-Sorbet.', date: '2024-11-05' },
    ],
    tags: ['Dessert', 'Patisserie', 'Fusion', 'Yuzu', 'Sesam'],
  },
  3: {
    id: 3,
    title: 'Fermentations-Serie',
    category: 'Modern',
    description: 'Systematische Erforschung von Fermentationstechniken als Grundlage für neue Geschmacksdimensionen. Von Shio Koji über Schwarzen Knoblauch bis zu fermentierten Säften – jedes Experiment wird dokumentiert und auf Restaurant-Tauglichkeit geprüft.',
    progress: 90,
    status: 'Fast fertig',
    img: 'https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?w=800',
    created: '2024-06-01',
    target: '2024-12-31',
    recipes: [
      { title: 'Shio Koji Marinade',       status: 'Fertig',   category: 'Technik' },
      { title: 'Schwarzer Knoblauch',      status: 'Fertig',   category: 'Technik' },
      { title: 'Koji-Butter',              status: 'Fertig',   category: 'Sauce' },
      { title: 'Fermentierter Holunder',   status: 'Fertig',   category: 'Getränk' },
      { title: 'Miso aus lokalen Bohnen',  status: 'Fertig',   category: 'Grundrezept' },
      { title: 'Amazake Dessertbasis',     status: 'Entwurf',  category: 'Dessert' },
    ],
    notes: [
      { text: 'Shio Koji bei 55°C, 72h – optimales Ergebnis. Fleisch 12h marinieren.', date: '2024-07-14' },
      { text: 'Schwarzer Knoblauch Ansatz #4 mit Reiswärmer: 45 Tage perfekt. Balsamico-Aroma, wenig Bitterkeit.', date: '2024-08-22' },
      { text: 'Koji-Butter: 10% Koji-Paste zu Butter, 24h Ruhezeit. Umami ohne Aufdringlichkeit.', date: '2024-09-10' },
      { text: 'Lokale Bohnen-Miso nach 6 Monaten bereit. Charakteristischer als Supermarkt-Miso.', date: '2024-11-30' },
    ],
    tags: ['Fermentation', 'Koji', 'Modern', 'Technik', 'Umami'],
  },
};

const statusColors: Record<string, string> = {
  'Fertig':       '#7CB87A',
  'Entwurf':      '#E8A838',
  'In Arbeit':    '#7BB8D4',
};

export default function ProjektDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router  = useRouter();
  const { addProject } = useStore();
  const projekt = PROJECT_DATA[Number(id)];

  const [editOpen, setEditOpen]   = useState(false);
  const [saving,   setSaving]     = useState(false);
  const [saved,    setSaved]      = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editDesc,  setEditDesc]  = useState('');
  const [editStatus, setEditStatus] = useState<'Aktiv' | 'Abgeschlossen' | 'Pausiert'>('Aktiv');
  const [editTarget, setEditTarget] = useState('');
  const [editTags,   setEditTags]   = useState('');

  const openEdit = () => {
    if (!projekt) return;
    setEditTitle(projekt.title);
    setEditDesc(projekt.description);
    setEditStatus(projekt.status === 'Fast fertig' ? 'Aktiv' : (projekt.status as 'Aktiv' | 'Abgeschlossen' | 'Pausiert') || 'Aktiv');
    setEditTarget(projekt.target);
    setEditTags(projekt.tags.join(', '));
    setSaved(false);
    setEditOpen(true);
  };

  const handleSave = async () => {
    setSaving(true);
    await addProject({
      name:        editTitle,
      description: editDesc + (editTags ? `\n\nTags: ${editTags}\nZieldatum: ${editTarget}` : ''),
      color:       '#C9A84C',
      status:      editStatus,
    });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setEditOpen(false), 1200);
  };

  if (!projekt) {
    return (
      <div style={{ background: '#0A0A0A', minHeight: '100vh' }} className="flex items-center justify-center">
        <div className="text-center">
          <p className="font-heading text-2xl mb-4" style={{ color: '#F5F0E8' }}>Projekt nicht gefunden</p>
          <button onClick={() => router.push('/projekte')}
            className="px-5 py-2.5 rounded-xl text-[13px] font-semibold"
            style={{ background: 'rgba(201,168,76,0.1)', color: '#C9A84C', border: '1px solid rgba(201,168,76,0.3)' }}>
            ← Zurück zu Projekte
          </button>
        </div>
      </div>
    );
  }

  const doneRecipes  = projekt.recipes.filter(r => r.status === 'Fertig').length;
  const totalRecipes = projekt.recipes.length;

  return (
    <div style={{ background: '#0A0A0A', minHeight: '100vh' }}>

      {/* Header */}
      <div className="relative overflow-hidden"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', minHeight: 220 }}>
        <img src={projekt.img} alt=""
          className="absolute inset-0 w-full h-full object-cover"
          style={{ opacity: 0.18 }} />
        <div className="absolute inset-0"
          style={{ background: 'linear-gradient(to bottom, rgba(10,10,10,0.5) 0%, #0A0A0A 100%)' }} />

        <div className="relative z-10 px-8 pt-8 pb-8">
          <button onClick={() => router.back()}
            className="flex items-center gap-2 mb-6 text-[12px] font-medium transition-colors"
            style={{ color: 'rgba(168,152,128,0.6)' }}
            onMouseEnter={e => (e.currentTarget as HTMLButtonElement).style.color = '#C9A84C'}
            onMouseLeave={e => (e.currentTarget as HTMLButtonElement).style.color = 'rgba(168,152,128,0.6)'}>
            <ArrowLeft size={14} /> Zurück zur Übersicht
          </button>

          <div className="text-[10px] font-semibold tracking-[4px] uppercase mb-2"
            style={{ color: 'rgba(201,168,76,0.55)' }}>✦ &nbsp;{projekt.category}</div>
          <h1 className="font-heading font-bold leading-none mb-3"
            style={{ fontSize: 34, color: '#F5F0E8', letterSpacing: '2px', textTransform: 'uppercase' }}>
            {projekt.title}
          </h1>

          <div className="flex flex-wrap items-center gap-3 mb-5">
            <span className="text-[12px] px-3 py-1 rounded-full font-semibold"
              style={{ background: 'rgba(124,184,122,0.15)', color: '#7CB87A', border: '1px solid rgba(124,184,122,0.3)' }}>
              {projekt.status}
            </span>
            {projekt.tags.map(t => (
              <span key={t} className="text-[11px] px-2.5 py-0.5 rounded-full"
                style={{ background: 'rgba(255,255,255,0.05)', color: 'rgba(245,240,232,0.5)', border: '1px solid rgba(255,255,255,0.08)' }}>
                {t}
              </span>
            ))}
          </div>

          {/* Progress bar */}
          <div className="max-w-md">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px]" style={{ color: 'rgba(168,152,128,0.55)' }}>Fortschritt</span>
              <span className="text-[13px] font-bold" style={{ color: '#C9A84C' }}>{projekt.progress}%</span>
            </div>
            <div className="h-1.5 rounded-full" style={{ background: 'rgba(255,255,255,0.08)' }}>
              <div className="h-full rounded-full transition-all"
                style={{ width: `${projekt.progress}%`, background: 'linear-gradient(90deg, #9A7A30, #C9A84C)' }} />
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 sm:p-8 max-w-[1000px] grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6 sm:gap-8">

        {/* Left column */}
        <div className="space-y-6">

          {/* Description */}
          <div className="bg-card border border-border rounded-xl p-6">
            <div className="text-[11px] text-text-muted font-semibold uppercase tracking-widest mb-3 flex items-center gap-2">
              <FileText size={12} /> Beschreibung
            </div>
            <p className="text-[13px] leading-relaxed" style={{ color: 'rgba(245,240,232,0.7)' }}>
              {projekt.description}
            </p>
          </div>

          {/* Recipes */}
          <div className="bg-card border border-border rounded-xl p-6">
            <div className="text-[11px] text-text-muted font-semibold uppercase tracking-widest mb-4 flex items-center justify-between">
              <span className="flex items-center gap-2"><ChefHat size={12} /> Rezepte & Elemente</span>
              <span style={{ color: '#C9A84C' }}>{doneRecipes}/{totalRecipes}</span>
            </div>
            <div className="space-y-2">
              {projekt.recipes.map((r, i) => (
                <div key={i} className="flex items-center gap-3 p-3 rounded-lg"
                  style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }}>
                  <CheckCircle2 size={15}
                    style={{ color: r.status === 'Fertig' ? '#7CB87A' : 'rgba(255,255,255,0.2)', flexShrink: 0 }} />
                  <div className="flex-1 min-w-0">
                    <div className="text-[13px] font-semibold" style={{ color: '#F5F0E8' }}>{r.title}</div>
                    <div className="text-[11px]" style={{ color: 'rgba(168,152,128,0.5)' }}>{r.category}</div>
                  </div>
                  <span className="text-[11px] px-2 py-0.5 rounded-full flex-shrink-0"
                    style={{
                      background: r.status === 'Fertig' ? 'rgba(124,184,122,0.1)' : 'rgba(232,168,56,0.1)',
                      color: statusColors[r.status] || '#A89880',
                      border: `1px solid ${r.status === 'Fertig' ? 'rgba(124,184,122,0.25)' : 'rgba(232,168,56,0.25)'}`,
                    }}>
                    {r.status}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div className="bg-card border border-border rounded-xl p-6">
            <div className="text-[11px] text-text-muted font-semibold uppercase tracking-widest mb-4 flex items-center gap-2">
              <FileText size={12} /> Notizen
            </div>
            <div className="space-y-3">
              {projekt.notes.map((n, i) => (
                <div key={i} className="border-l-2 pl-4 py-1"
                  style={{ borderColor: 'rgba(201,168,76,0.3)' }}>
                  <p className="text-[13px] leading-relaxed" style={{ color: 'rgba(245,240,232,0.7)' }}>{n.text}</p>
                  <p className="text-[11px] mt-1" style={{ color: 'rgba(168,152,128,0.4)' }}>{n.date}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right column */}
        <div className="space-y-4">

          {/* Stats */}
          <div className="bg-card border border-border rounded-xl p-5">
            <div className="text-[11px] text-text-muted font-semibold uppercase tracking-widest mb-4 flex items-center gap-2">
              <TrendingUp size={12} /> Übersicht
            </div>
            <div className="space-y-3">
              {[
                { label: 'Rezepte fertig',   value: `${doneRecipes} / ${totalRecipes}` },
                { label: 'Kategorie',         value: projekt.category },
                { label: 'Gestartet',         value: projekt.created },
                { label: 'Zieldatum',         value: projekt.target },
                { label: 'Notizen',           value: `${projekt.notes.length}` },
              ].map(s => (
                <div key={s.label} className="flex items-center justify-between py-1.5"
                  style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                  <span className="text-[12px]" style={{ color: 'rgba(168,152,128,0.6)' }}>{s.label}</span>
                  <span className="text-[12px] font-semibold" style={{ color: '#F5F0E8' }}>{s.value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Timeline */}
          <div className="bg-card border border-border rounded-xl p-5">
            <div className="text-[11px] text-text-muted font-semibold uppercase tracking-widest mb-4 flex items-center gap-2">
              <Clock size={12} /> Timeline
            </div>
            <div className="relative">
              <div className="absolute left-[5px] top-1 bottom-1 w-px" style={{ background: 'rgba(201,168,76,0.2)' }} />
              <div className="space-y-4 pl-6">
                {projekt.notes.map((n, i) => (
                  <div key={i} className="relative">
                    <div className="absolute -left-[19px] w-2.5 h-2.5 rounded-full top-0.5"
                      style={{ background: i === 0 ? '#C9A84C' : 'rgba(201,168,76,0.3)', border: '2px solid rgba(201,168,76,0.5)' }} />
                    <div className="text-[10px] mb-0.5" style={{ color: 'rgba(201,168,76,0.55)' }}>{n.date}</div>
                    <div className="text-[12px] leading-snug" style={{ color: 'rgba(245,240,232,0.6)' }}>
                      {n.text.length > 80 ? n.text.slice(0, 80) + '…' : n.text}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="space-y-2">
            <button onClick={openEdit}
              className="w-full py-2.5 rounded-xl text-[13px] font-semibold flex items-center justify-center gap-2 transition-all hover:opacity-90"
              style={{ background: 'rgba(201,168,76,0.12)', color: '#C9A84C', border: '1px solid rgba(201,168,76,0.35)' }}>
              <Edit3 size={14} /> Projekt bearbeiten
            </button>
            <button onClick={() => router.push(
                `/kreativlabor?projekt=${projekt.id}&ingredients=${encodeURIComponent(projekt.tags.join(', '))}&context=${encodeURIComponent(projekt.title)}`
              )}
              className="w-full py-2.5 rounded-xl text-[13px] font-semibold flex items-center justify-center gap-2 transition-all hover:opacity-90"
              style={{ background: 'rgba(255,255,255,0.04)', color: 'rgba(245,240,232,0.7)', border: '1px solid rgba(255,255,255,0.08)' }}>
              ✦ Im Kreativlabor öffnen
            </button>
            <button onClick={() => router.push('/projekte')}
              className="w-full py-2.5 rounded-xl text-[13px] font-medium flex items-center justify-center gap-2 transition-all"
              style={{ background: 'rgba(255,255,255,0.03)', color: 'rgba(168,152,128,0.7)', border: '1px solid rgba(255,255,255,0.07)' }}>
              ← Alle Projekte
            </button>
          </div>

        </div>
      </div>

      {/* Edit Modal */}
      {editOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6"
          style={{ background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(4px)' }}
          onClick={() => setEditOpen(false)}>
          <div className="w-full max-w-lg rounded-2xl overflow-hidden"
            style={{ background: '#141414', border: '1px solid rgba(201,168,76,0.2)' }}
            onClick={e => e.stopPropagation()}>

            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-5"
              style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
              <div>
                <div className="text-[10px] tracking-[3px] uppercase mb-1" style={{ color: 'rgba(201,168,76,0.55)' }}>✦ Bearbeiten</div>
                <h2 className="font-heading font-bold text-[18px]" style={{ color: '#F5F0E8' }}>Projekt bearbeiten</h2>
              </div>
              <button onClick={() => setEditOpen(false)} style={{ color: 'rgba(168,152,128,0.5)' }}
                className="transition-colors hover:text-text-primary">
                <X size={18} />
              </button>
            </div>

            {/* Form */}
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-widest mb-1.5" style={{ color: 'rgba(168,152,128,0.6)' }}>Name</label>
                <input value={editTitle} onChange={e => setEditTitle(e.target.value)}
                  className="w-full rounded-lg px-3.5 py-2.5 text-[13px] outline-none"
                  style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', color: '#F5F0E8' }} />
              </div>

              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-widest mb-1.5" style={{ color: 'rgba(168,152,128,0.6)' }}>Beschreibung</label>
                <textarea value={editDesc} onChange={e => setEditDesc(e.target.value)} rows={4}
                  className="w-full rounded-lg px-3.5 py-2.5 text-[13px] outline-none resize-none"
                  style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', color: '#F5F0E8', lineHeight: 1.65 }} />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-widest mb-1.5" style={{ color: 'rgba(168,152,128,0.6)' }}>Status</label>
                  <select value={editStatus} onChange={e => setEditStatus(e.target.value as 'Aktiv' | 'Abgeschlossen' | 'Pausiert')}
                    className="w-full rounded-lg px-3.5 py-2.5 text-[13px] outline-none cursor-pointer"
                    style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', color: '#F5F0E8' }}>
                    <option value="Aktiv">Aktiv</option>
                    <option value="Pausiert">Pausiert</option>
                    <option value="Abgeschlossen">Abgeschlossen</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-widest mb-1.5" style={{ color: 'rgba(168,152,128,0.6)' }}>Zieldatum</label>
                  <input type="date" value={editTarget} onChange={e => setEditTarget(e.target.value)}
                    className="w-full rounded-lg px-3.5 py-2.5 text-[13px] outline-none"
                    style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', color: '#F5F0E8', colorScheme: 'dark' }} />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-widest mb-1.5" style={{ color: 'rgba(168,152,128,0.6)' }}>Tags <span style={{ color: 'rgba(168,152,128,0.35)' }}>(komma-getrennt)</span></label>
                <input value={editTags} onChange={e => setEditTags(e.target.value)}
                  placeholder="z.B. Herbst, Regional, Fine Dining"
                  className="w-full rounded-lg px-3.5 py-2.5 text-[13px] outline-none"
                  style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', color: '#F5F0E8' }} />
              </div>

              <p className="text-[11px]" style={{ color: 'rgba(168,152,128,0.4)' }}>
                Wird als Projekt in Supabase gespeichert.
              </p>
            </div>

            {/* Footer */}
            <div className="flex gap-3 px-6 pb-6">
              <button onClick={() => setEditOpen(false)}
                className="flex-1 py-2.5 rounded-xl text-[13px] font-medium transition-all"
                style={{ background: 'rgba(255,255,255,0.04)', color: 'rgba(168,152,128,0.7)', border: '1px solid rgba(255,255,255,0.08)' }}>
                Abbrechen
              </button>
              <button onClick={handleSave} disabled={saving || !editTitle.trim()}
                className="flex-1 py-2.5 rounded-xl text-[13px] font-semibold flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                style={{ background: saved ? 'rgba(124,184,122,0.15)' : 'linear-gradient(135deg, #9A7A30, #C9A84C)', color: saved ? '#7CB87A' : '#0A0A0A' }}>
                {saving ? '…' : saved ? '✓ Gespeichert' : <><Save size={14} /> Speichern</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
