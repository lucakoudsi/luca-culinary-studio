'use client';
import PageTransition from '@/components/ui/PageTransition';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useStore } from '@/lib/store';
import { getUserTier } from '@/config/roles';
import type { Project } from '@/types';
import {
  FolderOpen, Plus, Trash2, BookOpen, X,
  StickyNote, ChevronRight, Calendar, Lock,
} from 'lucide-react';

const projectColors = ['#6B3A4B', '#7CB87A', '#7BB8D4', '#C4743A', '#E06B6B', '#8B7355', '#9B7DE8'];
const statusLabels: Record<string, { color: string; bg: string }> = {
  Aktiv: { color: '#7CB87A', bg: 'rgba(124,184,122,0.15)' },
  Abgeschlossen: { color: '#7BB8D4', bg: 'rgba(123,184,212,0.15)' },
  Pausiert: { color: '#E8A838', bg: 'rgba(232,168,56,0.15)' },
};

function NewProjectModal({ onClose, onSave }: { onClose: () => void; onSave: (data: Omit<Project, 'id' | 'createdAt' | 'notes' | 'recipeIds' | 'menuIds'>) => void }) {
  const [form, setForm] = useState({ name: '', description: '', color: '#C9A84C', status: 'Aktiv' as Project['status'] });

  const inputCls = "w-full bg-card border border-border-strong rounded-lg px-3.5 py-2.5 text-text-primary text-sm outline-none focus:border-gold/40";
  const labelCls = "block text-[11px] text-text-secondary font-semibold mb-1.5 uppercase tracking-wider";

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-6" onClick={onClose}>
      <div className="bg-surface border border-border-strong rounded-2xl w-full max-w-md" onClick={e => e.stopPropagation()}>
        <div className="px-7 py-6 border-b border-border flex items-center justify-between">
          <h2 className="font-heading text-[20px] font-bold text-text-primary">Neues Projekt</h2>
          <button onClick={onClose} className="text-text-secondary hover:text-text-primary"><X size={20} /></button>
        </div>
        <div className="px-7 py-5 space-y-4">
          <div>
            <label className={labelCls}>Name *</label>
            <input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="Projektname…" className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Beschreibung</label>
            <textarea value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} placeholder="Was ist das Ziel dieses Projekts?" rows={3} className={inputCls + ' resize-none leading-relaxed'} />
          </div>
          <div>
            <label className={labelCls}>Status</label>
            <div className="flex gap-2">
              {(['Aktiv', 'Pausiert', 'Abgeschlossen'] as Project['status'][]).map(s => (
                <button key={s} onClick={() => setForm(p => ({ ...p, status: s }))}
                  className="flex-1 py-2 rounded-lg text-[12px] font-semibold transition-all"
                  style={{
                    background: form.status === s ? statusLabels[s].bg : 'rgba(0,0,0,0.04)',
                    border: `1px solid ${form.status === s ? statusLabels[s].color + '40' : 'rgba(0,0,0,0.08)'}`,
                    color: form.status === s ? statusLabels[s].color : '#A89880',
                  }}>
                  {s}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className={labelCls}>Farbe</label>
            <div className="flex gap-2.5">
              {projectColors.map(c => (
                <button key={c} onClick={() => setForm(p => ({ ...p, color: c }))}
                  className="w-8 h-8 rounded-lg transition-all"
                  style={{
                    background: c,
                    transform: form.color === c ? 'scale(1.2)' : 'scale(1)',
                    outline: form.color === c ? `2px solid ${c}` : 'none',
                    outlineOffset: 2,
                  }} />
              ))}
            </div>
          </div>
        </div>
        <div className="px-7 py-4 border-t border-border flex justify-end gap-2.5">
          <button onClick={onClose} className="border border-border rounded-lg px-5 py-2.5 text-text-secondary text-sm">Abbrechen</button>
          <button
            onClick={() => { if (form.name.trim()) { onSave(form); onClose(); } }}
            className="rounded-lg px-6 py-2.5 text-background text-sm font-semibold"
            style={{ background: '#6B3A4B' }}>
            Erstellen
          </button>
        </div>
      </div>
    </div>
  );
}

function ProjectDetail({ project, onClose }: { project: Project; onClose: () => void }) {
  const { recipes, addProjectNote, deleteProjectNote, addRecipeToProject, removeRecipeFromProject, deleteProject } = useStore();
  const [note, setNote] = useState('');
  const [showRecipePicker, setShowRecipePicker] = useState(false);

  const projectRecipes = recipes.filter(r => project.recipeIds.includes(r.id));
  const availableRecipes = recipes.filter(r => !project.recipeIds.includes(r.id));

  const handleAddNote = () => {
    if (!note.trim()) return;
    addProjectNote(project.id, note);
    setNote('');
  };

  const st = statusLabels[project.status];

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-6" onClick={onClose}>
      <div className="bg-surface border border-border-strong rounded-2xl w-full max-w-2xl max-h-[88vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="px-7 py-6 border-b border-border flex items-start justify-between"
          style={{ borderLeft: `4px solid ${project.color}` }}>
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-[11px] px-2.5 py-1 rounded-full font-semibold"
                style={{ background: st.bg, color: st.color, border: `1px solid ${st.color}40` }}>
                {project.status}
              </span>
              <span className="text-[11px] text-text-muted flex items-center gap-1">
                <Calendar size={10} />{project.createdAt}
              </span>
            </div>
            <h2 className="font-heading text-[24px] font-bold text-text-primary">{project.name}</h2>
            <p className="text-text-secondary text-[13px] mt-1 leading-relaxed">{project.description}</p>
          </div>
          <button onClick={onClose} className="text-text-secondary hover:text-text-primary p-1 flex-shrink-0"><X size={20} /></button>
        </div>

        <div className="p-7 space-y-7">
          {/* Rezepte */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="text-[12px] text-text-muted font-semibold uppercase tracking-widest flex items-center gap-1.5">
                <BookOpen size={11} /> Rezepte ({projectRecipes.length})
              </div>
              <button onClick={() => setShowRecipePicker(!showRecipePicker)}
                className="text-[12px] text-gold flex items-center gap-1 hover:text-gold-light transition-colors">
                <Plus size={13} /> Rezept hinzufügen
              </button>
            </div>

            {showRecipePicker && availableRecipes.length > 0 && (
              <div className="bg-background border border-border rounded-lg p-3 mb-3 max-h-40 overflow-y-auto space-y-1">
                {availableRecipes.map(r => (
                  <button key={r.id} onClick={() => { addRecipeToProject(project.id, r.id); setShowRecipePicker(false); }}
                    className="w-full text-left px-3 py-2 rounded-lg hover:bg-card text-[13px] text-text-secondary hover:text-text-primary transition-colors flex items-center gap-2">
                    <BookOpen size={12} className="text-text-muted" />
                    {r.title}
                  </button>
                ))}
              </div>
            )}

            {projectRecipes.length > 0 ? (
              <div className="space-y-2">
                {projectRecipes.map(r => (
                  <div key={r.id} className="flex items-center gap-3 bg-card rounded-lg px-3.5 py-2.5">
                    <BookOpen size={14} className="text-gold flex-shrink-0" strokeWidth={1.5} />
                    <span className="text-[13px] text-text-primary flex-1">{r.title}</span>
                    <span className="text-[11px] text-text-muted">{r.category}</span>
                    <button onClick={() => removeRecipeFromProject(project.id, r.id)} className="text-text-muted hover:text-red-400 transition-colors">
                      <X size={13} />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-5 text-text-muted text-[13px] border border-dashed border-border rounded-lg">
                Noch keine Rezepte. Füge Rezepte aus dem Archiv hinzu.
              </div>
            )}
          </div>

          {/* Notizen */}
          <div>
            <div className="text-[12px] text-text-muted font-semibold uppercase tracking-widest mb-3 flex items-center gap-1.5">
              <StickyNote size={11} /> Notizen ({project.notes.length})
            </div>

            <div className="flex gap-2 mb-4">
              <input value={note} onChange={e => setNote(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleAddNote()}
                placeholder="Notiz hinzufügen…"
                className="flex-1 bg-card border border-border-strong rounded-lg px-3.5 py-2.5 text-text-primary text-[13px] outline-none focus:border-gold/40" />
              <button onClick={handleAddNote}
                className="px-4 rounded-lg text-background text-[13px] font-semibold transition-opacity hover:opacity-80"
                style={{ background: '#6B3A4B' }}>
                Hinzufügen
              </button>
            </div>

            {project.notes.length > 0 ? (
              <div className="space-y-2.5">
                {[...project.notes].reverse().map(n => (
                  <div key={n.id} className="bg-card border border-border rounded-lg px-4 py-3 flex items-start gap-3">
                    <div className="w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0" style={{ background: project.color }} />
                    <p className="text-[13px] text-text-secondary leading-relaxed flex-1">{n.text}</p>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className="text-[10px] text-text-muted">{n.date}</span>
                      <button onClick={() => deleteProjectNote(project.id, n.id)} className="text-text-muted hover:text-red-400 transition-colors">
                        <X size={12} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-5 text-text-muted text-[13px] border border-dashed border-border rounded-lg">
                Noch keine Notizen. Halte Ideen, Erkenntnisse und Aufgaben fest.
              </div>
            )}
          </div>

          {/* Danger zone */}
          <div className="pt-5 border-t border-border flex justify-end">
            <button onClick={() => { deleteProject(project.id); onClose(); }}
              className="border rounded-lg px-4 py-2 text-[12px] flex items-center gap-1.5 transition-colors"
              style={{ background: 'rgba(224,107,107,0.1)', borderColor: 'rgba(224,107,107,0.3)', color: '#E06B6B' }}>
              <Trash2 size={13} /> Projekt löschen
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ProjektePage() {
  const { projects, addProject, recipes, fetchProjects, fetchRecipes } = useStore();
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [showNew, setShowNew] = useState(false);
  const [userTier, setUserTier] = useState<number>(99);

  useEffect(() => {
    fetchProjects();
    fetchRecipes();
    fetch('/api/profil').then(r => r.json()).then(d => {
      setUserTier(getUserTier(d.user?.email, d.profile?.stufe));
    }).catch(() => setUserTier(1));
  }, []);

  // Derive from store so mutations (notes, recipeIds) are reflected live
  const selected = projects.find(p => p.id === selectedId) ?? null;

  const activeProjects = projects.filter(p => p.status === 'Aktiv');
  const otherProjects = projects.filter(p => p.status !== 'Aktiv');

  const ProjectCard = ({ project }: { project: Project }) => {
    const st = statusLabels[project.status];
    const projectRecipes = recipes.filter(r => project.recipeIds.includes(r.id));

    return (
      <div
        className="bg-card border border-border rounded-xl overflow-hidden cursor-pointer hover:border-opacity-70 transition-all"
        style={{ borderLeftWidth: 3, borderLeftColor: project.color, borderLeftStyle: 'solid' }}
        onClick={() => setSelectedId(project.id)}>
        <div className="p-5">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{ background: `${project.color}20` }}>
                <FolderOpen size={16} style={{ color: project.color }} strokeWidth={1.5} />
              </div>
              <div>
                <h3 className="font-heading text-[16px] font-bold text-text-primary leading-tight">{project.name}</h3>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                  style={{ background: st.bg, color: st.color }}>{project.status}</span>
              </div>
            </div>
            <ChevronRight size={16} className="text-text-muted" />
          </div>

          <p className="text-[12px] text-text-muted leading-relaxed mb-4 line-clamp-2">{project.description}</p>

          <div className="flex items-center gap-4 pt-3 border-t border-border text-[11px] text-text-muted">
            <span className="flex items-center gap-1.5">
              <BookOpen size={10} /> {project.recipeIds.length} Rezept{project.recipeIds.length !== 1 ? 'e' : ''}
            </span>
            <span className="flex items-center gap-1.5">
              <StickyNote size={10} /> {project.notes.length} Notiz{project.notes.length !== 1 ? 'en' : ''}
            </span>
            <span className="flex items-center gap-1.5">
              <Calendar size={10} /> {project.createdAt}
            </span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <PageTransition>
    <div style={{ background: 'var(--bg)', minHeight: '100vh' }}>
      <div className="px-8 pt-8 pb-6 flex items-start justify-between gap-6" style={{ borderBottom: '1px solid var(--border)' }}>
        <div>
          <div className="text-[10px] font-semibold tracking-[4px] uppercase mb-2" style={{ color: 'rgba(107,58,75,0.55)' }}>✦ &nbsp;Meine Arbeit</div>
          <h1 className="font-heading font-bold leading-none" style={{ fontSize: 28, color: 'var(--text)', letterSpacing: '2px', textTransform: 'uppercase' }}>Projekte</h1>
          <p className="mt-1.5" style={{ color: 'var(--text-muted)', fontSize: 13 }}>{projects.length} Projekte · Organisiere Menüs, Rezepte und Notizen</p>
        </div>
        {userTier >= 3 && (
          <div className="mt-1">
            <button onClick={() => setShowNew(true)}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-[13px] font-semibold transition-all hover:opacity-90"
              style={{ background: 'linear-gradient(135deg, #562E3C, #7D4558)', color: '#FFFFFF' }}>
              <Plus size={15} /> Neues Projekt
            </button>
          </div>
        )}
      </div>

      {/* Info banner for users below tier 3 */}
      {userTier < 3 && (
        <div className="mx-8 mt-5 flex items-start gap-3 rounded-xl border px-5 py-4"
          style={{ background: 'rgba(201,168,76,0.06)', borderColor: 'rgba(201,168,76,0.25)' }}>
          <Lock size={15} style={{ color: '#C9A84C', marginTop: 1, flexShrink: 0 }} />
          <p className="text-[13px] leading-relaxed" style={{ color: 'var(--text-muted)' }}>
            Du benötigst Rang <strong style={{ color: 'var(--text)' }}>Profi</strong> um eigene Projekte zu erstellen.{' '}
            <Link href="/profil" style={{ color: '#6B3A4B', textDecoration: 'underline', textUnderlineOffset: 3 }}>
              Profil ansehen →
            </Link>
          </p>
        </div>
      )}

      <div className="p-8 max-w-[1200px]">

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        {[
          { label: 'Aktive Projekte', value: projects.filter(p => p.status === 'Aktiv').length, color: '#7CB87A' },
          { label: 'Gesamte Rezepte', value: projects.reduce((s, p) => s + p.recipeIds.length, 0), color: '#C9A84C' },
          { label: 'Notizen gesamt', value: projects.reduce((s, p) => s + p.notes.length, 0), color: '#7BB8D4' },
        ].map(s => (
          <div key={s.label} className="bg-card border border-border rounded-lg p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: `${s.color}18` }}>
              <span className="text-[18px] font-bold font-heading" style={{ color: s.color }}>{s.value}</span>
            </div>
            <span className="text-[13px] text-text-secondary">{s.label}</span>
          </div>
        ))}
      </div>

      {/* Active projects */}
      {activeProjects.length > 0 && (
        <div className="mb-8">
          <h2 className="font-heading text-lg font-bold text-text-primary mb-4">Aktive Projekte</h2>
          <div className="grid grid-cols-[repeat(auto-fill,minmax(320px,1fr))] gap-4">
            {activeProjects.map(p => <ProjectCard key={p.id} project={p} />)}
          </div>
        </div>
      )}

      {/* Other projects */}
      {otherProjects.length > 0 && (
        <div>
          <h2 className="font-heading text-lg font-bold text-text-primary mb-4">Weitere Projekte</h2>
          <div className="grid grid-cols-[repeat(auto-fill,minmax(320px,1fr))] gap-4">
            {otherProjects.map(p => <ProjectCard key={p.id} project={p} />)}
          </div>
        </div>
      )}

      {projects.length === 0 && (
        <div className="text-center py-20">
          <FolderOpen size={48} strokeWidth={1} className="mx-auto mb-4 text-text-muted" />
          <p className="font-heading text-xl text-text-secondary mb-2">Noch keine Projekte</p>
          <p className="text-sm text-text-muted">Erstelle ein Projekt um Rezepte, Menüs und Notizen zu bündeln.</p>
        </div>
      )}

      {selected && <ProjectDetail project={selected} onClose={() => setSelectedId(null)} />}
      {showNew && <NewProjectModal onClose={() => setShowNew(false)} onSave={(data) => { addProject(data); setShowNew(false); }} />}
    </div>
    </div>
    </PageTransition>
  );
}