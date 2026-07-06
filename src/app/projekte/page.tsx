'use client';
import PageTransition from '@/components/ui/PageTransition';
import EmptyState from '@/components/ui/EmptyState';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useStore } from '@/lib/store';
import { getUserTier } from '@/config/roles';
import type { Project } from '@/types';
import {
  FolderOpen, Plus, Trash2, BookOpen, X,
  StickyNote, ChevronRight, Calendar, Lock, ChefHat,
} from 'lucide-react';

const projectColors = ['#6B3A4B', '#7CB87A', '#7BB8D4', '#C4743A', '#E06B6B', '#8B7355', '#9B7DE8'];
const statusLabels: Record<string, { color: string; bg: string }> = {
  Aktiv: { color: '#7CB87A', bg: 'rgba(124,184,122,0.15)' },
  Abgeschlossen: { color: '#7BB8D4', bg: 'rgba(123,184,212,0.15)' },
  Pausiert: { color: '#E8A838', bg: 'rgba(232,168,56,0.15)' },
};

function NewProjectModal({ onClose, onSave }: { onClose: () => void; onSave: (data: Omit<Project, 'id' | 'createdAt' | 'notes' | 'recipeIds' | 'menus'>) => Promise<void> }) {
  const [form, setForm] = useState({ name: '', description: '', color: '#C9A84C', status: 'Aktiv' as Project['status'] });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCreate = async () => {
    if (!form.name.trim()) return;
    setSaving(true);
    setError(null);
    try {
      await onSave(form);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Projekt konnte nicht gespeichert werden');
    } finally {
      setSaving(false);
    }
  };

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
        {error && (
          <div className="mx-7 mb-2 flex items-start gap-2 px-4 py-3 rounded-xl text-[13px]"
            style={{ background: 'rgba(192,80,80,0.08)', border: '1px solid rgba(192,80,80,0.25)', color: '#C05050' }}>
            <span className="flex-shrink-0 mt-0.5">⚠</span>
            <span>{error}</span>
          </div>
        )}
        <div className="px-7 py-4 border-t border-border flex justify-end gap-2.5">
          <button onClick={onClose} className="border border-border rounded-lg px-5 py-2.5 text-text-secondary text-sm">Abbrechen</button>
          <button
            onClick={handleCreate}
            disabled={saving}
            className="rounded-lg px-6 py-2.5 text-background text-sm font-semibold disabled:opacity-50"
            style={{ background: '#6B3A4B' }}>
            {saving ? 'Speichern…' : 'Erstellen'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ProjektePage() {
  const { projects, addProject, recipes, fetchProjects, fetchRecipes } = useStore();
  const [showNew, setShowNew] = useState(false);
  const [userTier, setUserTier] = useState<number>(99);

  useEffect(() => {
    fetchProjects();
    fetchRecipes();
    fetch('/api/profil').then(r => r.json()).then(d => {
      setUserTier(getUserTier(d.user?.email, d.profile?.stufe));
    }).catch(() => setUserTier(1));
  }, []);

  const activeProjects = projects.filter(p => p.status === 'Aktiv');
  const otherProjects = projects.filter(p => p.status !== 'Aktiv');

  const ProjectCard = ({ project }: { project: Project }) => {
    const st = statusLabels[project.status];
    const projectRecipes = recipes.filter(r => project.recipeIds.includes(r.id));

    return (
      <Link href={`/projekte/${project.id}`}
        className="block bg-card border border-border rounded-xl overflow-hidden cursor-pointer hover:border-opacity-70 transition-all"
        style={{ borderLeftWidth: 3, borderLeftColor: project.color, borderLeftStyle: 'solid' }}>
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

          <p className="text-[12px] text-text-muted leading-relaxed mb-3 line-clamp-2">{project.description}</p>

          {projectRecipes.length > 0 && (
            <div className="flex items-center -space-x-2.5 mb-4">
              {projectRecipes.slice(0, 4).map((r, i) => (
                <div key={r.id} className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0 relative"
                  style={{
                    border: '2px solid var(--card, #FFFFFF)', zIndex: 4 - i,
                    ...(r.image
                      ? { backgroundImage: `url(${r.image})`, backgroundSize: 'cover', backgroundPosition: 'center' }
                      : { background: 'linear-gradient(135deg, #1a1500 0%, #0d0d0d 100%)' }),
                  }}>
                  {!r.image && <BookOpen size={12} className="absolute inset-0 m-auto opacity-40" color="#C9A84C" />}
                </div>
              ))}
              {projectRecipes.length > 4 && (
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-semibold flex-shrink-0"
                  style={{ border: '2px solid var(--card, #FFFFFF)', background: 'rgba(107,58,75,0.12)', color: '#6B3A4B', zIndex: 0 }}>
                  +{projectRecipes.length - 4}
                </div>
              )}
            </div>
          )}

          <div className="flex items-center gap-4 pt-3 border-t border-border text-[11px] text-text-muted">
            <span className="flex items-center gap-1.5">
              <BookOpen size={10} /> {project.recipeIds.length} Rezept{project.recipeIds.length !== 1 ? 'e' : ''}
            </span>
            <span className="flex items-center gap-1.5">
              <ChefHat size={10} /> {project.menus.length} {project.menus.length === 1 ? 'Menü' : 'Menüs'}
            </span>
            <span className="flex items-center gap-1.5">
              <StickyNote size={10} /> {project.notes.length} Notiz{project.notes.length !== 1 ? 'en' : ''}
            </span>
            <span className="flex items-center gap-1.5">
              <Calendar size={10} /> {project.createdAt}
            </span>
          </div>
        </div>
      </Link>
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
        <EmptyState
          icon={
            <svg width="30" height="30" viewBox="0 0 48 48" fill="none">
              <circle cx="24" cy="24" r="15" fill="rgba(107,58,75,0.06)" stroke="#6B3A4B" strokeWidth="1.5"/>
              <circle cx="24" cy="24" r="2.5" fill="#6B3A4B"/>
              <polygon points="24,10 22.5,24 24,22 25.5,24" fill="#6B3A4B" opacity="0.85"/>
              <polygon points="24,38 22.5,24 24,26 25.5,24" fill="rgba(107,58,75,0.35)"/>
              <line x1="24" y1="11.5" x2="24" y2="14" stroke="#6B3A4B" strokeWidth="1.4" opacity="0.35"/>
              <line x1="24" y1="34" x2="24" y2="36.5" stroke="#6B3A4B" strokeWidth="1.4" opacity="0.35"/>
              <line x1="11.5" y1="24" x2="14" y2="24" stroke="#6B3A4B" strokeWidth="1.4" opacity="0.35"/>
              <line x1="34" y1="24" x2="36.5" y2="24" stroke="#6B3A4B" strokeWidth="1.4" opacity="0.35"/>
            </svg>
          }
          title="Große Ideen brauchen Struktur"
          subtitle="Organisiere deine kulinarischen Vorhaben."
          action={userTier >= 3 ? { label: '+ Erstes Projekt erstellen', onClick: () => setShowNew(true) } : undefined}
        />
      )}

      {showNew && <NewProjectModal onClose={() => setShowNew(false)} onSave={(data) => addProject(data)} />}
    </div>
    </div>
    </PageTransition>
  );
}