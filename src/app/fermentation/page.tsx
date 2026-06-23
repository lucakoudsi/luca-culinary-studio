'use client';
import { useState, useEffect } from 'react';
import { Plus, Calendar, Clock, CheckCircle2, AlertCircle, ChevronDown, ChevronUp, Pencil, Trash2, X } from 'lucide-react';

interface Note { id: number; text: string; date: string }
type FermentStatus = 'Aktiv' | 'Bereit' | 'Abgeschlossen' | 'Problem';

interface FermentProject {
  id: number;
  name: string;
  typ: string;
  startdatum: string;
  status: FermentStatus;
  fortschritt: number;
  temperatur: string;
  gefaess: string;
  notizen: Note[];
}

const statusColors: Record<FermentStatus, string> = {
  Aktiv: '#7BB8D4', Bereit: '#7CB87A', Abgeschlossen: '#A89880', Problem: '#E06B6B',
};

const STATUS_OPTIONS: FermentStatus[] = ['Aktiv', 'Bereit', 'Abgeschlossen', 'Problem'];

function StatusIcon({ status }: { status: FermentStatus }) {
  if (status === 'Bereit' || status === 'Abgeschlossen') return <CheckCircle2 size={12} />;
  if (status === 'Problem') return <AlertCircle size={12} />;
  return <Clock size={12} />;
}

// ── Edit Modal ────────────────────────────────────────────────────────────────

interface EditModalProps {
  project: FermentProject;
  onSave: (updated: FermentProject) => Promise<void>;
  onClose: () => void;
}

function EditModal({ project, onSave, onClose }: EditModalProps) {
  const [form, setForm] = useState<FermentProject>({ ...project });
  const [saving, setSaving] = useState(false);

  const set = (key: keyof FermentProject, val: unknown) =>
    setForm(f => ({ ...f, [key]: val }));

  const handleSave = async () => {
    setSaving(true);
    await onSave(form);
    setSaving(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(44,36,32,0.45)', backdropFilter: 'blur(4px)' }}>
      <div className="relative w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden"
        style={{ background: '#FDFAF7', border: '1px solid #E8E0D8' }}>

        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-6 pb-4"
          style={{ borderBottom: '1px solid #E8E0D8' }}>
          <h2 className="font-heading font-bold text-[19px]" style={{ color: '#2C2420', letterSpacing: '1px' }}>
            Fermentation bearbeiten
          </h2>
          <button onClick={onClose} className="p-1.5 rounded-lg transition-colors hover:bg-black/5">
            <X size={18} style={{ color: '#8B7355' }} />
          </button>
        </div>

        {/* Form */}
        <div className="px-6 py-5 space-y-4 max-h-[70vh] overflow-y-auto">

          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-widest mb-1.5" style={{ color: '#6B3A4B' }}>Name</label>
            <input value={form.name} onChange={e => set('name', e.target.value)}
              className="w-full rounded-lg px-3.5 py-2.5 text-[13px] outline-none transition-colors"
              style={{ background: '#F5EFE8', border: '1px solid #DDD5CB', color: '#2C2420' }}
              onFocus={e => e.currentTarget.style.borderColor = '#6B3A4B'}
              onBlur={e => e.currentTarget.style.borderColor = '#DDD5CB'} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-widest mb-1.5" style={{ color: '#6B3A4B' }}>Typ</label>
              <input value={form.typ} onChange={e => set('typ', e.target.value)}
                className="w-full rounded-lg px-3.5 py-2.5 text-[13px] outline-none transition-colors"
                style={{ background: '#F5EFE8', border: '1px solid #DDD5CB', color: '#2C2420' }}
                onFocus={e => e.currentTarget.style.borderColor = '#6B3A4B'}
                onBlur={e => e.currentTarget.style.borderColor = '#DDD5CB'} />
            </div>
            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-widest mb-1.5" style={{ color: '#6B3A4B' }}>Status</label>
              <select value={form.status} onChange={e => set('status', e.target.value as FermentStatus)}
                className="w-full rounded-lg px-3.5 py-2.5 text-[13px] outline-none cursor-pointer"
                style={{ background: '#F5EFE8', border: '1px solid #DDD5CB', color: '#2C2420' }}>
                {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-widest mb-1.5" style={{ color: '#6B3A4B' }}>Startdatum</label>
              <input type="date" value={form.startdatum} onChange={e => set('startdatum', e.target.value)}
                className="w-full rounded-lg px-3.5 py-2.5 text-[13px] outline-none"
                style={{ background: '#F5EFE8', border: '1px solid #DDD5CB', color: '#2C2420' }}
                onFocus={e => e.currentTarget.style.borderColor = '#6B3A4B'}
                onBlur={e => e.currentTarget.style.borderColor = '#DDD5CB'} />
            </div>
            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-widest mb-1.5" style={{ color: '#6B3A4B' }}>Fortschritt (%)</label>
              <input type="number" min={0} max={100} value={form.fortschritt}
                onChange={e => set('fortschritt', Math.min(100, Math.max(0, Number(e.target.value))))}
                className="w-full rounded-lg px-3.5 py-2.5 text-[13px] outline-none"
                style={{ background: '#F5EFE8', border: '1px solid #DDD5CB', color: '#2C2420' }}
                onFocus={e => e.currentTarget.style.borderColor = '#6B3A4B'}
                onBlur={e => e.currentTarget.style.borderColor = '#DDD5CB'} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-widest mb-1.5" style={{ color: '#6B3A4B' }}>Temperatur</label>
              <input value={form.temperatur} onChange={e => set('temperatur', e.target.value)}
                className="w-full rounded-lg px-3.5 py-2.5 text-[13px] outline-none"
                style={{ background: '#F5EFE8', border: '1px solid #DDD5CB', color: '#2C2420' }}
                onFocus={e => e.currentTarget.style.borderColor = '#6B3A4B'}
                onBlur={e => e.currentTarget.style.borderColor = '#DDD5CB'} />
            </div>
            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-widest mb-1.5" style={{ color: '#6B3A4B' }}>Gefäß</label>
              <input value={form.gefaess} onChange={e => set('gefaess', e.target.value)}
                className="w-full rounded-lg px-3.5 py-2.5 text-[13px] outline-none"
                style={{ background: '#F5EFE8', border: '1px solid #DDD5CB', color: '#2C2420' }}
                onFocus={e => e.currentTarget.style.borderColor = '#6B3A4B'}
                onBlur={e => e.currentTarget.style.borderColor = '#DDD5CB'} />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4" style={{ borderTop: '1px solid #E8E0D8' }}>
          <button onClick={onClose} disabled={saving}
            className="px-4 py-2 rounded-lg text-[13px] font-semibold transition-colors"
            style={{ background: '#EDE8E3', color: '#6B5744' }}>
            Abbrechen
          </button>
          <button onClick={handleSave} disabled={saving}
            className="px-5 py-2 rounded-lg text-[13px] font-semibold transition-all"
            style={{ background: '#6B3A4B', color: '#FAF8F5', opacity: saving ? 0.7 : 1 }}>
            {saving ? 'Speichern…' : 'Speichern'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Delete Confirm Modal ──────────────────────────────────────────────────────

function DeleteModal({ name, onConfirm, onClose, deleting }: {
  name: string; onConfirm: () => Promise<void>; onClose: () => void; deleting: boolean;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(44,36,32,0.45)', backdropFilter: 'blur(4px)' }}>
      <div className="w-full max-w-sm rounded-2xl shadow-2xl"
        style={{ background: '#FDFAF7', border: '1px solid #E8E0D8' }}>
        <div className="px-6 pt-6 pb-5">
          <h2 className="font-heading font-bold text-[17px] mb-2" style={{ color: '#2C2420' }}>
            Fermentation löschen?
          </h2>
          <p className="text-[13px]" style={{ color: '#6B5744' }}>
            <span className="font-semibold" style={{ color: '#2C2420' }}>„{name}"</span> wird unwiderruflich gelöscht.
          </p>
        </div>
        <div className="flex items-center justify-end gap-3 px-6 py-4" style={{ borderTop: '1px solid #E8E0D8' }}>
          <button onClick={onClose} disabled={deleting}
            className="px-4 py-2 rounded-lg text-[13px] font-semibold"
            style={{ background: '#EDE8E3', color: '#6B5744' }}>
            Abbrechen
          </button>
          <button onClick={onConfirm} disabled={deleting}
            className="px-5 py-2 rounded-lg text-[13px] font-semibold transition-all"
            style={{ background: '#C0392B', color: '#fff', opacity: deleting ? 0.7 : 1 }}>
            {deleting ? 'Löschen…' : 'Löschen'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Project Card ──────────────────────────────────────────────────────────────

interface CardProps {
  project: FermentProject;
  onAddNote: (id: number, text: string) => Promise<void>;
  onEdit: (p: FermentProject) => void;
  onDelete: (p: FermentProject) => void;
}

function ProjectCard({ project, onAddNote, onEdit, onDelete }: CardProps) {
  const [noteText, setNoteText] = useState('');
  const [open, setOpen] = useState(false);
  const color = statusColors[project.status];

  const submit = async () => {
    if (!noteText.trim()) return;
    await onAddNote(project.id, noteText);
    setNoteText('');
  };

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden">
      <div className="p-5">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-[11px] px-2.5 py-0.5 rounded-full font-semibold flex items-center gap-1"
                style={{ background: `${color}15`, color, border: `1px solid ${color}35` }}>
                <StatusIcon status={project.status} /> {project.status}
              </span>
              <span className="text-[11px] text-text-muted">{project.typ}</span>
            </div>
            <h3 className="font-heading text-[17px] font-bold text-text-primary">{project.name}</h3>
          </div>
          <div className="text-right flex-shrink-0">
            <div className="text-[22px] font-bold leading-none" style={{ color }}>{project.fortschritt}</div>
            <div className="text-[10px] text-text-muted mt-0.5">% fertig</div>
          </div>
        </div>

        <div className="mb-4">
          <div className="flex justify-between items-center mb-1.5">
            <span className="text-[11px] text-text-muted">Fortschritt</span>
            <span className="text-[11px] font-semibold" style={{ color }}>{project.fortschritt}%</span>
          </div>
          <div className="h-1.5 bg-background rounded-full overflow-hidden">
            <div className="h-full rounded-full transition-all duration-700"
              style={{ width: `${project.fortschritt}%`, background: color }} />
          </div>
        </div>

        <div className="flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-text-muted mb-4">
          <span className="flex items-center gap-1"><Calendar size={11} />{project.startdatum}</span>
          {project.temperatur && <span>Temp: {project.temperatur}</span>}
          {project.gefaess && <span>Gefäß: {project.gefaess}</span>}
        </div>

        {/* Bottom row: notes toggle left, icons right */}
        <div className="flex items-center justify-between">
          <button onClick={() => setOpen(!open)}
            className="flex items-center gap-1.5 text-[12px] font-medium transition-colors"
            style={{ color: '#6B3A4B' }}>
            {project.notizen.length} Notiz{project.notizen.length !== 1 ? 'en' : ''}
            {open ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>

          <div className="flex items-center gap-1.5">
            <button
              onClick={e => { e.stopPropagation(); onEdit(project); }}
              className="p-1.5 rounded-lg transition-colors group"
              title="Bearbeiten"
              style={{ color: '#A89880' }}
              onMouseEnter={e => e.currentTarget.style.color = '#6B3A4B'}
              onMouseLeave={e => e.currentTarget.style.color = '#A89880'}>
              <Pencil size={16} />
            </button>
            <button
              onClick={e => { e.stopPropagation(); onDelete(project); }}
              className="p-1.5 rounded-lg transition-colors"
              title="Löschen"
              style={{ color: '#A89880' }}
              onMouseEnter={e => e.currentTarget.style.color = '#C0392B'}
              onMouseLeave={e => e.currentTarget.style.color = '#A89880'}>
              <Trash2 size={16} />
            </button>
          </div>
        </div>
      </div>

      {open && (
        <div className="border-t border-border px-5 pb-5 pt-4">
          <div className="space-y-2.5 mb-4">
            {project.notizen.length === 0 && (
              <p className="text-[12px] text-text-muted italic">Noch keine Notizen.</p>
            )}
            {project.notizen.map(n => (
              <div key={n.id} className="bg-background rounded-lg px-3.5 py-2.5">
                <p className="text-[12px] text-text-secondary leading-relaxed">{n.text}</p>
                <p className="text-[10px] text-text-muted mt-1">{n.date}</p>
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            <input
              value={noteText}
              onChange={e => setNoteText(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && submit()}
              placeholder="Beobachtung notieren…"
              className="flex-1 bg-background border border-border-strong rounded-lg px-3 py-2 text-text-primary text-[12px] outline-none focus:border-gold/40" />
            <button onClick={submit}
              className="px-3.5 py-2 rounded-lg text-[12px] font-semibold transition-all flex items-center"
              style={{ background: 'rgba(107,58,75,0.08)', color: '#6B3A4B', border: '1px solid rgba(107,58,75,0.25)' }}>
              <Plus size={14} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function FermentationPage() {
  const [projects, setProjects] = useState<FermentProject[]>([]);
  const [loading, setLoading] = useState(true);

  const [editTarget, setEditTarget] = useState<FermentProject | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<FermentProject | null>(null);
  const [deleting, setDeleting] = useState(false);

  const load = async () => {
    try {
      const res = await fetch('/api/fermentation');
      const data = await res.json();
      setProjects(Array.isArray(data) ? data : []);
    } catch {
      setProjects([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleAddNote = async (projectId: number, text: string) => {
    const project = projects.find(p => p.id === projectId);
    if (!project) return;
    const newNote: Note = { id: Date.now(), text, date: new Date().toISOString().slice(0, 10) };
    const updatedNotizen = [...project.notizen, newNote];

    // Optimistic update
    setProjects(prev => prev.map(p => p.id === projectId ? { ...p, notizen: updatedNotizen } : p));

    await fetch(`/api/fermentation/${projectId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...project, notizen: updatedNotizen }),
    });
  };

  const handleSaveEdit = async (updated: FermentProject) => {
    const res = await fetch(`/api/fermentation/${updated.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updated),
    });
    if (res.ok) {
      const saved = await res.json();
      setProjects(prev => prev.map(p => p.id === saved.id ? saved : p));
    }
    setEditTarget(null);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    const res = await fetch(`/api/fermentation/${deleteTarget.id}`, { method: 'DELETE' });
    if (res.ok) {
      setProjects(prev => prev.filter(p => p.id !== deleteTarget.id));
    }
    setDeleting(false);
    setDeleteTarget(null);
  };

  const active = projects.filter(p => p.status === 'Aktiv' || p.status === 'Bereit');
  const done   = projects.filter(p => p.status === 'Abgeschlossen' || p.status === 'Problem');

  return (
    <div style={{ background: '#FAF8F5', minHeight: '100vh' }}>
      <div className="px-8 pt-8 pb-6" style={{ borderBottom: '1px solid #E8E0D8' }}>
        <div className="text-[10px] font-semibold tracking-[4px] uppercase mb-2" style={{ color: 'rgba(107,58,75,0.55)' }}>✦ &nbsp;Laufende Projekte</div>
        <h1 className="font-heading font-bold leading-none" style={{ fontSize: 28, color: '#2C2420', letterSpacing: '2px', textTransform: 'uppercase' }}>Fermentation</h1>
        <p className="mt-1.5" style={{ color: '#8B7355', fontSize: 13 }}>
          {loading ? 'Lade…' : `${active.length} laufende Projekte · ${done.length} abgeschlossen`}
        </p>
      </div>

      <div className="p-8 max-w-[1200px]">
        {loading && (
          <p className="text-[13px] text-text-muted">Lade Fermentationsprojekte…</p>
        )}

        {!loading && projects.length === 0 && (
          <p className="text-[13px] text-text-muted">Noch keine Projekte vorhanden.</p>
        )}

        {!loading && active.length > 0 && (
          <div className="mb-8">
            <div className="text-[11px] text-text-muted font-semibold uppercase tracking-widest mb-4">Aktive Projekte</div>
            <div className="grid grid-cols-[repeat(auto-fill,minmax(340px,1fr))] gap-5">
              {active.map(p => (
                <ProjectCard key={p.id} project={p} onAddNote={handleAddNote} onEdit={setEditTarget} onDelete={setDeleteTarget} />
              ))}
            </div>
          </div>
        )}

        {!loading && done.length > 0 && (
          <div>
            <div className="text-[11px] text-text-muted font-semibold uppercase tracking-widest mb-4">Abgeschlossen</div>
            <div className="grid grid-cols-[repeat(auto-fill,minmax(340px,1fr))] gap-5">
              {done.map(p => (
                <ProjectCard key={p.id} project={p} onAddNote={handleAddNote} onEdit={setEditTarget} onDelete={setDeleteTarget} />
              ))}
            </div>
          </div>
        )}
      </div>

      {editTarget && (
        <EditModal project={editTarget} onSave={handleSaveEdit} onClose={() => setEditTarget(null)} />
      )}

      {deleteTarget && (
        <DeleteModal
          name={deleteTarget.name}
          onConfirm={handleDelete}
          onClose={() => setDeleteTarget(null)}
          deleting={deleting}
        />
      )}
    </div>
  );
}
