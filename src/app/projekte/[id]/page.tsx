'use client';
import PageTransition from '@/components/ui/PageTransition';
import { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useStore } from '@/lib/store';
import RecipeDetail from '@/components/recipes/RecipeDetailModal';
import MenuEditorModal from '@/components/projects/MenuEditorModal';
import MenuCardView from '@/components/projects/MenuCardView';
import type { Recipe, ProjectNote } from '@/types';
import {
  ArrowLeft, Plus, X, Search, BookOpen, Trash2, StickyNote, Calendar,
  ChefHat, Check, ChevronRight, Eye,
} from 'lucide-react';

const statusLabels: Record<string, { color: string; bg: string }> = {
  Aktiv: { color: '#7CB87A', bg: 'rgba(124,184,122,0.15)' },
  Abgeschlossen: { color: '#7BB8D4', bg: 'rgba(123,184,212,0.15)' },
  Pausiert: { color: '#E8A838', bg: 'rgba(232,168,56,0.15)' },
};

// ─── Rezept-Picker ────────────────────────────────────────────────────────────
function RecipePickerModal({ available, onClose, onAdd }: { available: Recipe[]; onClose: () => void; onAdd: (ids: number[]) => void }) {
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<number[]>([]);
  const filtered = available.filter(r => r.title.toLowerCase().includes(search.toLowerCase()));
  const toggle = (id: number) => setSelected(s => s.includes(id) ? s.filter(x => x !== id) : [...s, id]);

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-6" onClick={onClose}>
      <div className="bg-surface border border-border-strong rounded-2xl w-full max-w-lg max-h-[80vh] flex flex-col" onClick={e => e.stopPropagation()}>
        <div className="px-7 py-6 border-b border-border flex items-center justify-between flex-shrink-0">
          <h2 className="font-heading text-[20px] font-bold text-text-primary">Rezept hinzufügen</h2>
          <button onClick={onClose} className="text-text-secondary hover:text-text-primary"><X size={20} /></button>
        </div>
        <div className="px-7 pt-4 flex-shrink-0">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Rezepte durchsuchen…" autoFocus
              className="w-full bg-card border border-border-strong rounded-lg pl-9 pr-3.5 py-2.5 text-text-primary text-sm outline-none focus:border-gold/40" />
          </div>
        </div>
        <div className="px-7 py-4 overflow-y-auto flex-1 space-y-1.5">
          {filtered.length === 0 ? (
            <p className="text-center text-[13px] text-text-muted py-6">
              {available.length === 0 ? 'Alle Rezepte sind bereits im Projekt.' : 'Keine Treffer.'}
            </p>
          ) : filtered.map(r => (
            <label key={r.id}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer hover:bg-card-hover transition-colors"
              style={{ background: selected.includes(r.id) ? 'rgba(107,58,75,0.08)' : 'transparent' }}>
              <input type="checkbox" checked={selected.includes(r.id)} onChange={() => toggle(r.id)} className="accent-[#6B3A4B]" />
              <div className="w-9 h-9 rounded-md flex-shrink-0 overflow-hidden relative"
                style={r.image
                  ? { backgroundImage: `url(${r.image})`, backgroundSize: 'cover', backgroundPosition: 'center' }
                  : { background: 'linear-gradient(135deg, #1a1500 0%, #0d0d0d 100%)' }}>
                {!r.image && <BookOpen size={14} className="absolute inset-0 m-auto opacity-30" color="#C9A84C" />}
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-[13px] text-text-primary font-medium truncate">{r.title}</div>
                <div className="text-[11px] text-text-muted">{r.category}</div>
              </div>
            </label>
          ))}
        </div>
        <div className="px-7 py-4 border-t border-border flex justify-end gap-2.5 flex-shrink-0">
          <button onClick={onClose} className="border border-border rounded-lg px-5 py-2.5 text-text-secondary text-sm">Abbrechen</button>
          <button onClick={() => { onAdd(selected); onClose(); }} disabled={selected.length === 0}
            className="rounded-lg px-6 py-2.5 text-background text-sm font-semibold disabled:opacity-40"
            style={{ background: '#6B3A4B' }}>
            {selected.length > 0 ? `${selected.length} hinzufügen` : 'Hinzufügen'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Notiz-Zeile (inline editierbar, debounced Auto-Save) ────────────────────
function NoteRow({ note, onSave, onDelete }: { note: ProjectNote; onSave: (text: string) => void; onDelete: () => void }) {
  const [text, setText] = useState(note.text);
  const [savedFlash, setSavedFlash] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleChange = (v: string) => {
    setText(v);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      onSave(v);
      setSavedFlash(true);
      setTimeout(() => setSavedFlash(false), 1500);
    }, 800);
  };

  return (
    <div className="bg-card border border-border rounded-lg px-4 py-3 flex items-start gap-3 group">
      <div className="w-1.5 h-1.5 rounded-full mt-2 flex-shrink-0" style={{ background: '#C9A84C' }} />
      <div className="flex-1 min-w-0">
        <textarea value={text} onChange={e => handleChange(e.target.value)} rows={2}
          className="w-full bg-transparent text-[13px] text-text-secondary leading-relaxed outline-none resize-none" />
        <div className="flex items-center gap-2 mt-1 h-3.5">
          <span className="text-[10px] text-text-muted">{note.date}</span>
          {savedFlash && (
            <span className="text-[10px] flex items-center gap-1 transition-opacity" style={{ color: '#7CB87A' }}>
              <Check size={10} /> Gespeichert
            </span>
          )}
        </div>
      </div>
      <button onClick={onDelete} className="text-text-muted hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100 flex-shrink-0">
        <X size={14} />
      </button>
    </div>
  );
}

// ─── Neues Menü (schnell-Anlage) ──────────────────────────────────────────────
function NewMenuModal({ onClose, onCreate }: { onClose: () => void; onCreate: (name: string, beschreibung: string) => void }) {
  const [name, setName] = useState('');
  const [beschreibung, setBeschreibung] = useState('');

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-6" onClick={onClose}>
      <div className="bg-surface border border-border-strong rounded-2xl w-full max-w-md" onClick={e => e.stopPropagation()}>
        <div className="px-7 py-6 border-b border-border flex items-center justify-between">
          <h2 className="font-heading text-[20px] font-bold text-text-primary">Neues Menü</h2>
          <button onClick={onClose} className="text-text-secondary hover:text-text-primary"><X size={20} /></button>
        </div>
        <div className="px-7 py-5 space-y-4">
          <div>
            <label className="block text-[11px] text-text-secondary font-semibold mb-1.5 uppercase tracking-wider">Name *</label>
            <input value={name} onChange={e => setName(e.target.value)} placeholder="z.B. Sommerabend am Rhein" autoFocus
              className="w-full bg-card border border-border-strong rounded-lg px-3.5 py-2.5 text-text-primary text-sm outline-none focus:border-gold/40" />
          </div>
          <div>
            <label className="block text-[11px] text-text-secondary font-semibold mb-1.5 uppercase tracking-wider">Beschreibung</label>
            <textarea value={beschreibung} onChange={e => setBeschreibung(e.target.value)} rows={2} placeholder="Worum geht's bei diesem Menü?"
              className="w-full bg-card border border-border-strong rounded-lg px-3.5 py-2.5 text-text-primary text-sm outline-none focus:border-gold/40 resize-none" />
          </div>
        </div>
        <div className="px-7 py-4 border-t border-border flex justify-end gap-2.5">
          <button onClick={onClose} className="border border-border rounded-lg px-5 py-2.5 text-text-secondary text-sm">Abbrechen</button>
          <button
            onClick={() => { if (name.trim()) { onCreate(name, beschreibung); onClose(); } }}
            className="rounded-lg px-6 py-2.5 text-background text-sm font-semibold"
            style={{ background: '#6B3A4B' }}>
            Anlegen
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Hauptseite ────────────────────────────────────────────────────────────────
export default function ProjectDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const {
    projects, recipes, fetchProjects, fetchRecipes,
    addProjectNote, updateProjectNote, deleteProjectNote,
    addRecipeToProject, removeRecipeFromProject,
    addMenu, deleteMenu, deleteProject, deleteRecipe,
  } = useStore();

  const [loading, setLoading] = useState(true);
  const [showPicker, setShowPicker] = useState(false);
  const [showNewMenu, setShowNewMenu] = useState(false);
  const [viewingRecipe, setViewingRecipe] = useState<Recipe | null>(null);
  const [editingMenuId, setEditingMenuId] = useState<string | null>(null);
  const [viewingMenuId, setViewingMenuId] = useState<string | null>(null);
  const [noteInput, setNoteInput] = useState('');

  useEffect(() => {
    Promise.all([
      projects.length === 0 ? fetchProjects() : Promise.resolve(),
      recipes.length === 0 ? fetchRecipes() : Promise.resolve(),
    ]).then(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const project = projects.find(p => p.id === Number(id));

  if (loading) {
    return <div style={{ background: 'var(--bg)', minHeight: '100vh' }} />;
  }

  if (!project) {
    return (
      <div style={{ background: 'var(--bg)', minHeight: '100vh' }} className="flex items-center justify-center">
        <div className="text-center">
          <p className="font-heading text-xl mb-4 text-text-primary">Projekt nicht gefunden</p>
          <Link href="/projekte"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-[13px] font-semibold"
            style={{ background: 'rgba(107,58,75,0.1)', color: '#6B3A4B', border: '1px solid rgba(107,58,75,0.3)' }}>
            <ArrowLeft size={14} /> Zurück zu Projekte
          </Link>
        </div>
      </div>
    );
  }

  const projectRecipes = recipes.filter(r => project.recipeIds.includes(r.id));
  const availableRecipes = recipes.filter(r => !project.recipeIds.includes(r.id));
  const st = statusLabels[project.status];
  const editingMenu = project.menus.find(m => m.id === editingMenuId) ?? null;
  const viewingMenu = project.menus.find(m => m.id === viewingMenuId) ?? null;

  const handleAddNote = () => {
    if (!noteInput.trim()) return;
    addProjectNote(project.id, noteInput);
    setNoteInput('');
  };

  return (
    <PageTransition>
    <div style={{ background: 'var(--bg)', minHeight: '100vh' }}>
      {/* Header */}
      <div className="px-8 pt-8 pb-6" style={{ borderBottom: '1px solid var(--border)', borderLeft: `4px solid ${project.color}` }}>
        <Link href="/projekte" className="inline-flex items-center gap-2 mb-5 text-[12px] font-medium text-text-muted hover:text-gold transition-colors">
          <ArrowLeft size={14} /> Zurück zur Übersicht
        </Link>
        <div className="flex items-start justify-between gap-6">
          <div className="min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-[11px] px-2.5 py-1 rounded-full font-semibold"
                style={{ background: st.bg, color: st.color, border: `1px solid ${st.color}40` }}>
                {project.status}
              </span>
              <span className="text-[11px] text-text-muted flex items-center gap-1"><Calendar size={10} />{project.createdAt}</span>
            </div>
            <h1 className="font-heading font-bold leading-none" style={{ fontSize: 30, color: 'var(--text)', letterSpacing: '1px' }}>
              {project.name}
            </h1>
            {project.description && (
              <p className="mt-2 max-w-xl text-[13px] leading-relaxed" style={{ color: 'var(--text-muted)' }}>{project.description}</p>
            )}
          </div>
          <button onClick={() => { if (confirm('Projekt wirklich löschen? Rezepte bleiben im Archiv erhalten.')) { deleteProject(project.id); router.push('/projekte'); } }}
            className="border rounded-lg px-3.5 py-2 text-[12px] flex items-center gap-1.5 transition-colors flex-shrink-0"
            style={{ background: 'rgba(224,107,107,0.1)', borderColor: 'rgba(224,107,107,0.3)', color: '#E06B6B' }}>
            <Trash2 size={13} /> Löschen
          </button>
        </div>
      </div>

      <div className="p-8 max-w-[1200px] space-y-10">

        {/* ── Rezepte ─────────────────────────────────────────────────────── */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-heading text-lg font-bold text-text-primary flex items-center gap-2">
              <BookOpen size={16} className="text-gold" /> Rezepte
              <span className="text-text-muted font-normal text-[14px]">({projectRecipes.length})</span>
            </h2>
            <button onClick={() => setShowPicker(true)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-[12px] font-semibold text-white transition-opacity hover:opacity-90"
              style={{ background: 'linear-gradient(135deg, #562E3C, #7D4558)' }}>
              <Plus size={13} /> Rezept hinzufügen
            </button>
          </div>

          {projectRecipes.length > 0 ? (
            <div className="grid grid-cols-[repeat(auto-fill,minmax(220px,1fr))] gap-4">
              {projectRecipes.map(r => (
                <div key={r.id}
                  className="bg-card border border-border rounded-xl overflow-hidden cursor-pointer card-hover group relative"
                  onClick={() => setViewingRecipe(r)}>
                  <button onClick={e => { e.stopPropagation(); removeRecipeFromProject(project.id, r.id); }}
                    title="Aus Projekt entfernen"
                    className="absolute top-2 right-2 z-10 w-6 h-6 rounded-full flex items-center justify-center bg-black/50 backdrop-blur-sm text-white/70 hover:text-white hover:bg-black/70 transition-colors opacity-0 group-hover:opacity-100">
                    <X size={13} />
                  </button>
                  <div className="h-28 relative overflow-hidden"
                    style={r.image
                      ? { backgroundImage: `url(${r.image})`, backgroundSize: 'cover', backgroundPosition: 'center' }
                      : { background: 'linear-gradient(135deg, #1a1500 0%, #0d0d0d 100%)' }}>
                    {!r.image && <BookOpen size={26} className="absolute inset-0 m-auto opacity-25" strokeWidth={1} color="#C9A84C" />}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
                  </div>
                  <div className="p-3">
                    <h3 className="font-heading text-[13px] font-bold text-text-primary leading-snug truncate">{r.title}</h3>
                    <p className="text-[11px] text-text-muted mt-0.5">{r.category}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-text-muted text-[13px] border border-dashed border-border rounded-xl">
              Noch keine Rezepte in diesem Projekt.{' '}
              <button onClick={() => setShowPicker(true)} className="text-gold hover:underline">Erstes Rezept hinzufügen →</button>
            </div>
          )}
        </section>

        {/* ── Notizen ─────────────────────────────────────────────────────── */}
        <section>
          <h2 className="font-heading text-lg font-bold text-text-primary flex items-center gap-2 mb-4">
            <StickyNote size={16} className="text-gold" /> Notizen
            <span className="text-text-muted font-normal text-[14px]">({project.notes.length})</span>
          </h2>

          <div className="flex gap-2 mb-4">
            <input value={noteInput} onChange={e => setNoteInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleAddNote()}
              placeholder="Notiz hinzufügen…"
              className="flex-1 bg-card border border-border-strong rounded-lg px-3.5 py-2.5 text-text-primary text-[13px] outline-none focus:border-gold/40" />
            <button onClick={handleAddNote}
              className="px-4 rounded-lg text-white text-[13px] font-semibold transition-opacity hover:opacity-90"
              style={{ background: '#6B3A4B' }}>
              Hinzufügen
            </button>
          </div>

          {project.notes.length > 0 ? (
            <div className="space-y-2.5">
              {[...project.notes].reverse().map(n => (
                <NoteRow key={n.id} note={n}
                  onSave={text => updateProjectNote(project.id, n.id, text)}
                  onDelete={() => deleteProjectNote(project.id, n.id)} />
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-text-muted text-[13px] border border-dashed border-border rounded-xl">
              Noch keine Notizen. Halte Ideen, Erkenntnisse und Aufgaben fest.
            </div>
          )}
        </section>

        {/* ── Menüs ───────────────────────────────────────────────────────── */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-heading text-lg font-bold text-text-primary flex items-center gap-2">
              <ChefHat size={16} className="text-gold" /> Menüs
              <span className="text-text-muted font-normal text-[14px]">({project.menus.length})</span>
            </h2>
            <button onClick={() => setShowNewMenu(true)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-[12px] font-semibold text-white transition-opacity hover:opacity-90"
              style={{ background: 'linear-gradient(135deg, #562E3C, #7D4558)' }}>
              <Plus size={13} /> Neues Menü
            </button>
          </div>

          {project.menus.length > 0 ? (
            <div className="space-y-2.5">
              {project.menus.map(m => (
                <div key={m.id}
                  onClick={() => setEditingMenuId(m.id)}
                  className="bg-card border border-border rounded-xl px-5 py-4 flex items-center justify-between gap-4 cursor-pointer card-hover">
                  <div className="min-w-0">
                    <h3 className="font-heading text-[15px] font-bold text-text-primary">{m.name}</h3>
                    {m.beschreibung && <p className="text-[12px] text-text-muted mt-0.5 truncate">{m.beschreibung}</p>}
                    <p className="text-[11px] text-text-muted mt-1">{m.gaenge.length} {m.gaenge.length === 1 ? 'Gang' : 'Gänge'}</p>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <button onClick={e => { e.stopPropagation(); setViewingMenuId(m.id); }}
                      title="Menü ansehen"
                      className="text-text-muted hover:text-gold transition-colors">
                      <Eye size={14} />
                    </button>
                    <button onClick={e => {
                        e.stopPropagation();
                        const gangHinweis = m.gaenge.length === 0 ? '' : m.gaenge.length === 1 ? 'Der Gang geht verloren.' : `Alle ${m.gaenge.length} Gänge gehen verloren.`;
                        if (confirm(`"${m.name}" wirklich löschen? ${gangHinweis}`)) deleteMenu(project.id, m.id);
                      }}
                      className="text-text-muted hover:text-red-400 transition-colors">
                      <Trash2 size={14} />
                    </button>
                    <ChevronRight size={16} className="text-text-muted" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-text-muted text-[13px] border border-dashed border-border rounded-xl">
              Noch kein Menü komponiert.{' '}
              <button onClick={() => setShowNewMenu(true)} className="text-gold hover:underline">Erstes Menü anlegen →</button>
            </div>
          )}
        </section>
      </div>

      {showPicker && (
        <RecipePickerModal available={availableRecipes} onClose={() => setShowPicker(false)}
          onAdd={ids => ids.forEach(rid => addRecipeToProject(project.id, rid))} />
      )}
      {showNewMenu && (
        <NewMenuModal onClose={() => setShowNewMenu(false)} onCreate={(name, beschreibung) => addMenu(project.id, name, beschreibung)} />
      )}
      {viewingRecipe && (
        <RecipeDetail
          recipe={viewingRecipe}
          onClose={() => setViewingRecipe(null)}
          onDelete={() => { deleteRecipe(viewingRecipe.id); setViewingRecipe(null); }}
        />
      )}
      {editingMenu && (
        <MenuEditorModal project={project} menu={editingMenu} onClose={() => setEditingMenuId(null)}
          onView={() => { setViewingMenuId(editingMenu.id); setEditingMenuId(null); }} />
      )}
      {viewingMenu && (
        <MenuCardView menu={viewingMenu} recipes={recipes} onClose={() => setViewingMenuId(null)} />
      )}
    </div>
    </PageTransition>
  );
}
