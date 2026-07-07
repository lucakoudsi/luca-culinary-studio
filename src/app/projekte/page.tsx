'use client';
import PageTransition from '@/components/ui/PageTransition';
import EmptyState from '@/components/ui/EmptyState';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useStore } from '@/lib/store';
import { getUserTier } from '@/config/roles';
import { submitGlow } from '@/lib/utils';
import type { Project } from '@/types';
import {
  Plus, BookOpen, X,
  StickyNote, ChevronRight, Calendar, Lock, ChefHat,
} from 'lucide-react';

const projectColors = ['#6B3A4B', '#7CB87A', '#7BB8D4', '#C4743A', '#E06B6B', '#8B7355', '#9B7DE8'];
const statusLabels: Record<string, { color: string; bg: string }> = {
  Aktiv: { color: '#7CB87A', bg: 'rgba(124,184,122,0.15)' },
  Abgeschlossen: { color: '#7BB8D4', bg: 'rgba(123,184,212,0.15)' },
  Pausiert: { color: '#E8A838', bg: 'rgba(232,168,56,0.15)' },
};
const STATUS_ORDER: Project['status'][] = ['Aktiv', 'Pausiert', 'Abgeschlossen'];

function formatDate(iso: string) {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  return d.toLocaleDateString('de-DE', { day: 'numeric', month: 'long', year: 'numeric' });
}

function NewProjectModal({ onClose, onSave }: { onClose: () => void; onSave: (data: Omit<Project, 'id' | 'createdAt' | 'notes' | 'recipeIds' | 'menus'>) => Promise<void> }) {
  const [form, setForm] = useState({ name: '', description: '', color: '#C9A84C', status: 'Aktiv' as Project['status'] });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const canSubmit = form.name.trim().length > 0 && !saving;

  const handleCreate = async () => {
    if (!canSubmit) return;
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
            <input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="Projektname…" autoFocus className={inputCls} />
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
            disabled={!canSubmit}
            className="rounded-lg px-6 py-2.5 text-background text-sm font-semibold transition-all disabled:opacity-40"
            style={{
              background: '#6B3A4B',
              boxShadow: submitGlow(canSubmit),
            }}>
            {saving ? 'Speichern…' : 'Erstellen'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── "Mehr aus Projekten holen"-Karte für duenne Zustaende ────────────────────
function ProjectIdeasCard() {
  const items = [
    { icon: BookOpen, text: 'Rezepte aus dem Archiv sammeln' },
    { icon: ChefHat, text: 'Ganze Menüs mit Wein-Pairing komponieren' },
    { icon: StickyNote, text: 'Notizen und Ideen festhalten' },
  ];
  return (
    <div className="w-full sm:w-[380px] rounded-2xl p-6 border border-dashed flex-shrink-0"
      style={{ borderColor: 'rgba(107,58,75,0.25)', background: 'rgba(107,58,75,0.03)' }}>
      <div className="text-[10px] font-semibold tracking-[3px] uppercase mb-4" style={{ color: 'rgba(107,58,75,0.55)' }}>
        ✦ Mehr aus Projekten holen
      </div>
      <div className="space-y-4">
        {items.map(({ icon: Icon, text }, i) => (
          <div key={i} className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(107,58,75,0.08)' }}>
              <Icon size={14} color="#6B3A4B" />
            </div>
            <p className="text-[13px] leading-relaxed pt-1.5" style={{ color: 'var(--text-muted)' }}>{text}</p>
          </div>
        ))}
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

  const activeCount = projects.filter(p => p.status === 'Aktiv').length;
  const totalMenus = projects.reduce((s, p) => s + p.menus.length, 0);
  const projectRecipeIds = new Set(projects.flatMap(p => p.recipeIds));
  const projectRecipesAll = recipes.filter(r => projectRecipeIds.has(r.id));
  const lastEditedRecipe = projectRecipesAll.length > 0
    ? [...projectRecipesAll].sort((a, b) => (b.lastEdited || '').localeCompare(a.lastEdited || ''))[0]
    : null;

  const summary = [
    activeCount === 1 ? '1 aktives Projekt' : `${activeCount} aktive Projekte`,
    totalMenus > 0 ? `${totalMenus} Menü${totalMenus === 1 ? '' : 's'}` : null,
    lastEditedRecipe ? `zuletzt bearbeitet: ${lastEditedRecipe.title}` : null,
  ].filter(Boolean).join(' · ');

  const ProjectCard = ({ project }: { project: Project }) => {
    const st = statusLabels[project.status];
    const projectRecipes = recipes.filter(r => project.recipeIds.includes(r.id));
    const firstMenu = project.menus[0];

    return (
      <Link href={`/projekte/${project.id}`}
        className="card-hover block w-full sm:w-[380px] flex-shrink-0 bg-card border border-border rounded-2xl overflow-hidden cursor-pointer">
        <div style={{ height: 4, background: project.color }} />
        <div className="p-6">
          <div className="flex items-start justify-between gap-2 mb-3">
            <div className="min-w-0">
              <h3 className="font-heading text-[19px] font-bold text-text-primary leading-tight truncate">{project.name}</h3>
              <span className="inline-block mt-1.5 text-[10px] font-semibold px-2.5 py-0.5 rounded-full"
                style={{ background: st.bg, color: st.color }}>{project.status}</span>
            </div>
            <ChevronRight size={18} className="text-text-muted flex-shrink-0 mt-1" />
          </div>

          {project.description && (
            <p className="text-[12.5px] text-text-muted leading-relaxed mb-4 line-clamp-2">{project.description}</p>
          )}

          {/* Rezept-Thumbnails als visuelles Zentrum */}
          <div className="flex items-center justify-center py-3 mb-1" style={{ minHeight: 64 }}>
            {projectRecipes.length > 0 ? (
              <div className="flex items-center -space-x-4">
                {projectRecipes.slice(0, 4).map((r, i) => (
                  <div key={r.id} className="w-14 h-14 rounded-full overflow-hidden flex-shrink-0 relative"
                    style={{
                      border: '3px solid var(--card, #FFFFFF)', zIndex: 4 - i,
                      boxShadow: '0 3px 10px rgba(0,0,0,0.12)',
                      ...(r.image
                        ? { backgroundImage: `url(${r.image})`, backgroundSize: 'cover', backgroundPosition: 'center' }
                        : { background: 'linear-gradient(135deg, #1a1500 0%, #0d0d0d 100%)' }),
                    }}>
                    {!r.image && <BookOpen size={18} className="absolute inset-0 m-auto opacity-40" color="#C9A84C" />}
                  </div>
                ))}
                {projectRecipes.length > 4 && (
                  <div className="w-14 h-14 rounded-full flex items-center justify-center text-[12px] font-semibold flex-shrink-0"
                    style={{ border: '3px solid var(--card, #FFFFFF)', background: 'rgba(107,58,75,0.12)', color: '#6B3A4B', zIndex: 0, boxShadow: '0 3px 10px rgba(0,0,0,0.12)' }}>
                    +{projectRecipes.length - 4}
                  </div>
                )}
              </div>
            ) : (
              <p className="text-[12px] text-text-muted italic">Noch keine Rezepte</p>
            )}
          </div>

          {firstMenu && (
            <div className="flex items-center gap-1.5 justify-center mb-4 text-[12px]" style={{ color: '#6B3A4B' }}>
              <ChefHat size={12} />
              {project.menus.length} {project.menus.length === 1 ? 'Menü' : 'Menüs'} · {firstMenu.name}
            </div>
          )}

          <div className="flex items-center gap-4 pt-3 border-t border-border text-[11px] text-text-muted">
            <span className="flex items-center gap-1.5">
              <BookOpen size={10} /> {project.recipeIds.length} Rezept{project.recipeIds.length !== 1 ? 'e' : ''}
            </span>
            <span className="flex items-center gap-1.5">
              <StickyNote size={10} /> {project.notes.length} Notiz{project.notes.length !== 1 ? 'en' : ''}
            </span>
            <span className="flex items-center gap-1.5 ml-auto">
              <Calendar size={10} /> {formatDate(project.createdAt)}
            </span>
          </div>
        </div>
      </Link>
    );
  };

  const groups = STATUS_ORDER
    .map(status => ({ status, list: projects.filter(p => p.status === status) }))
    .filter(g => g.list.length > 0);
  const showIdeasCard = projects.length > 0 && projects.length <= 2;

  return (
    <PageTransition>
    <div style={{ background: 'var(--bg)', minHeight: '100vh' }}>
      <div className="px-8 pt-8 pb-6 flex items-start justify-between gap-6" style={{ borderBottom: '1px solid var(--border)' }}>
        <div className="min-w-0">
          <div className="text-[10px] font-semibold tracking-[4px] uppercase mb-2" style={{ color: 'rgba(107,58,75,0.55)' }}>✦ &nbsp;Meine Arbeit</div>
          <h1 className="font-heading font-bold leading-none" style={{ fontSize: 28, color: 'var(--text)', letterSpacing: '2px', textTransform: 'uppercase' }}>Projekte</h1>
          <p className="mt-1.5" style={{ color: 'var(--text-muted)', fontSize: 13 }}>
            {projects.length > 0 ? summary : 'Organisiere Menüs, Rezepte und Notizen'}
          </p>
        </div>
        {userTier >= 3 && (
          <div className="mt-1 flex-shrink-0">
            <button onClick={() => setShowNew(true)}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-[13px] font-semibold transition-all hover:opacity-90"
              style={{ background: 'linear-gradient(135deg, #562E3C, #7D4558)', color: '#FFFFFF', boxShadow: '0 4px 18px rgba(107,58,75,0.3)' }}>
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

      <div className="p-8 max-w-[1280px] mx-auto">

      {groups.map((g, gi) => (
        <div key={g.status} className={gi < groups.length - 1 ? 'mb-10' : ''}>
          <h2 className="font-heading text-lg font-bold text-text-primary mb-4">
            {g.status === 'Aktiv' ? 'Aktive Projekte' : g.status}
          </h2>
          <div className="flex flex-wrap justify-center gap-6">
            {g.list.map(p => <ProjectCard key={p.id} project={p} />)}
            {showIdeasCard && gi === groups.length - 1 && <ProjectIdeasCard />}
          </div>
        </div>
      ))}

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
