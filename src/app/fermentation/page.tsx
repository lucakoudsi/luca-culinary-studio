'use client';
import { useState, useEffect } from 'react';
import { Plus, Calendar, Clock, CheckCircle2, AlertCircle, ChevronDown, ChevronUp, Pencil, Trash2, X } from 'lucide-react';

type FermentStatus = 'Aktiv' | 'Bereit' | 'Abgeschlossen' | 'Problem';
interface Note { id: number; text: string; date: string }

interface FermentProject {
  id: number;
  name: string;
  typ: string;
  startdatum: string;
  dauer_tage: number;
  status: FermentStatus;
  fortschritt: number;
  temperatur: string;
  gefaess: string;
  beschreibung: string;
  notizen: Note[];
}

interface FormState {
  name: string;
  typ: string;
  startdatum: string;
  dauer_tage: number;
  temperatur: string;
  gefaess: string;
  status: FermentStatus;
  fortschritt: number;
  beschreibung: string;
  notizText: string;
}

const STATUS_OPTIONS: FermentStatus[] = ['Aktiv', 'Bereit', 'Abgeschlossen', 'Problem'];

const STATUS_META: Record<FermentStatus, { color: string; bg: string; border: string; label: string; icon: 'clock' | 'check' | 'alert' }> = {
  Aktiv:         { color: '#4A90C4', bg: '#EBF4FB', border: '#B8D9F0', label: 'Läuft',        icon: 'clock' },
  Bereit:        { color: '#3A8A3A', bg: '#EBF5EB', border: '#B0D9B0', label: 'Bereit',       icon: 'check' },
  Abgeschlossen: { color: '#7A6A58', bg: '#F0EDE8', border: '#C8BFB5', label: 'Abgeschlossen',icon: 'check' },
  Problem:       { color: '#C0392B', bg: '#FBEAEA', border: '#F0B8B8', label: 'Problem',      icon: 'alert' },
};

function StatusBadge({ status }: { status: FermentStatus }) {
  const m = STATUS_META[status];
  const Icon = m.icon === 'check' ? CheckCircle2 : m.icon === 'alert' ? AlertCircle : Clock;
  return (
    <span className="inline-flex items-center gap-1 text-[11px] px-2.5 py-0.5 rounded-full font-semibold"
      style={{ background: m.bg, color: m.color, border: `1px solid ${m.border}` }}>
      <Icon size={11} /> {m.label}
    </span>
  );
}

function daysSince(dateStr: string) {
  return Math.max(0, Math.floor((Date.now() - new Date(dateStr).getTime()) / 86_400_000));
}

function emptyForm(): FormState {
  return {
    name: '', typ: '', startdatum: new Date().toISOString().slice(0, 10),
    dauer_tage: 14, temperatur: '', gefaess: '',
    status: 'Aktiv', fortschritt: 0, beschreibung: '', notizText: '',
  };
}

// ── Shared input styles ───────────────────────────────────────────────────────

const inputBase: React.CSSProperties = {
  background: 'var(--surface-2)', border: '1px solid var(--border)', color: 'var(--text)',
  width: '100%', borderRadius: 8, padding: '10px 14px', fontSize: 13, outline: 'none',
};

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-[11px] font-semibold uppercase tracking-widest mb-1.5"
        style={{ color: '#6B3A4B' }}>{label}</label>
      {children}
    </div>
  );
}

function TextInput({ value, onChange, placeholder, onFocus, onBlur }: {
  value: string; onChange: (v: string) => void; placeholder?: string;
  onFocus?: React.FocusEventHandler<HTMLInputElement>;
  onBlur?: React.FocusEventHandler<HTMLInputElement>;
}) {
  return (
    <input value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
      style={inputBase}
      onFocus={e => { e.currentTarget.style.borderColor = '#6B3A4B'; onFocus?.(e); }}
      onBlur={e => { e.currentTarget.style.borderColor = '#DDD5CB'; onBlur?.(e); }} />
  );
}

// ── Fermentation Modal (create + edit) ────────────────────────────────────────

interface FermentModalProps {
  mode: 'create' | 'edit';
  initial: FormState;
  existingNotizen?: Note[];
  onSave: (form: FormState) => Promise<void>;
  onClose: () => void;
}

function FermentModal({ mode, initial, existingNotizen = [], onSave, onClose }: FermentModalProps) {
  const [form, setForm] = useState<FormState>(initial);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const set = <K extends keyof FormState>(k: K, v: FormState[K]) => setForm(f => ({ ...f, [k]: v }));

  const handleSave = async () => {
    if (!form.name.trim()) { setError('Name ist ein Pflichtfeld.'); return; }
    setSaving(true);
    setError('');
    try { await onSave(form); } catch { setError('Fehler beim Speichern.'); } finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(44,36,32,0.45)', backdropFilter: 'blur(4px)' }}>
      <div className="relative w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden"
        style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>

        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-6 pb-4"
          style={{ borderBottom: '1px solid var(--border)' }}>
          <h2 className="font-heading font-bold text-[19px]"
            style={{ color: 'var(--text)', letterSpacing: '1px' }}>
            {mode === 'create' ? 'Neue Fermentation' : 'Fermentation bearbeiten'}
          </h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-black/5 transition-colors">
            <X size={18} style={{ color: 'var(--text-muted)' }} />
          </button>
        </div>

        {/* Form */}
        <div className="px-6 py-5 space-y-4 max-h-[72vh] overflow-y-auto">

          <Field label="Name *">
            <TextInput value={form.name} onChange={v => set('name', v)} placeholder="z.B. Shio Koji – Reis" />
          </Field>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Typ / Fermentationsart">
              <TextInput value={form.typ} onChange={v => set('typ', v)} placeholder="z.B. Koji, Maillard" />
            </Field>
            <Field label="Status">
              <select value={form.status} onChange={e => set('status', e.target.value as FermentStatus)}
                style={{ ...inputBase, cursor: 'pointer' }}>
                {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Startdatum">
              <input type="date" value={form.startdatum} onChange={e => set('startdatum', e.target.value)}
                style={inputBase}
                onFocus={e => e.currentTarget.style.borderColor = '#6B3A4B'}
                onBlur={e => e.currentTarget.style.borderColor = '#DDD5CB'} />
            </Field>
            <Field label="Dauer (Tage)">
              <input type="number" min={0} value={form.dauer_tage}
                onChange={e => set('dauer_tage', Math.max(0, Number(e.target.value)))}
                style={inputBase}
                onFocus={e => e.currentTarget.style.borderColor = '#6B3A4B'}
                onBlur={e => e.currentTarget.style.borderColor = '#DDD5CB'} />
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Temperatur">
              <TextInput value={form.temperatur} onChange={v => set('temperatur', v)} placeholder="z.B. 28–32°C" />
            </Field>
            <Field label="Gefäß">
              <TextInput value={form.gefaess} onChange={v => set('gefaess', v)} placeholder="z.B. Holzbox" />
            </Field>
          </div>

          <Field label={`Fortschritt: ${form.fortschritt}%`}>
            <div className="flex items-center gap-3">
              <input type="range" min={0} max={100} value={form.fortschritt}
                onChange={e => set('fortschritt', Number(e.target.value))}
                className="flex-1 accent-[#6B3A4B]" style={{ accentColor: '#6B3A4B' }} />
              <input type="number" min={0} max={100} value={form.fortschritt}
                onChange={e => set('fortschritt', Math.min(100, Math.max(0, Number(e.target.value))))}
                style={{ ...inputBase, width: 64, textAlign: 'center' }} />
            </div>
          </Field>

          <Field label="Beschreibung">
            <textarea value={form.beschreibung} onChange={e => set('beschreibung', e.target.value)}
              placeholder="Kurze Beschreibung des Projekts…"
              rows={3} style={{ ...inputBase, resize: 'vertical', fontFamily: 'inherit' }}
              onFocus={e => e.currentTarget.style.borderColor = '#6B3A4B'}
              onBlur={e => e.currentTarget.style.borderColor = '#DDD5CB'} />
          </Field>

          <Field label={mode === 'create' ? 'Erste Notiz (optional)' : 'Neue Notiz hinzufügen'}>
            {mode === 'edit' && existingNotizen.length > 0 && (
              <div className="mb-2 space-y-1.5">
                {existingNotizen.map(n => (
                  <div key={n.id} className="rounded-lg px-3 py-2 text-[11px]"
                    style={{ background: 'var(--surface-2)', color: 'var(--text-muted)' }}>
                    <span style={{ color: 'var(--text)' }}>{n.text}</span>
                    <span className="ml-2 opacity-60">{n.date}</span>
                  </div>
                ))}
              </div>
            )}
            <textarea value={form.notizText} onChange={e => set('notizText', e.target.value)}
              placeholder="Beobachtung notieren…"
              rows={2} style={{ ...inputBase, resize: 'vertical', fontFamily: 'inherit' }}
              onFocus={e => e.currentTarget.style.borderColor = '#6B3A4B'}
              onBlur={e => e.currentTarget.style.borderColor = '#DDD5CB'} />
          </Field>

          {error && <p className="text-[12px]" style={{ color: '#C0392B' }}>{error}</p>}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4"
          style={{ borderTop: '1px solid var(--border)' }}>
          <button onClick={onClose} disabled={saving}
            className="px-4 py-2 rounded-lg text-[13px] font-semibold"
            style={{ background: '#EDE8E3', color: 'var(--text-muted)' }}>
            Abbrechen
          </button>
          <button onClick={handleSave} disabled={saving}
            className="px-5 py-2 rounded-lg text-[13px] font-semibold transition-opacity"
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
        style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
        <div className="px-6 pt-6 pb-5">
          <h2 className="font-heading font-bold text-[17px] mb-2" style={{ color: 'var(--text)' }}>
            Fermentation löschen?
          </h2>
          <p className="text-[13px]" style={{ color: 'var(--text-muted)' }}>
            <span className="font-semibold" style={{ color: 'var(--text)' }}>„{name}"</span> wird unwiderruflich gelöscht.
          </p>
        </div>
        <div className="flex items-center justify-end gap-3 px-6 py-4"
          style={{ borderTop: '1px solid var(--border)' }}>
          <button onClick={onClose} disabled={deleting}
            className="px-4 py-2 rounded-lg text-[13px] font-semibold"
            style={{ background: '#EDE8E3', color: 'var(--text-muted)' }}>
            Abbrechen
          </button>
          <button onClick={onConfirm} disabled={deleting}
            className="px-5 py-2 rounded-lg text-[13px] font-semibold"
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
  const days = daysSince(project.startdatum);

  const submit = async () => {
    if (!noteText.trim()) return;
    await onAddNote(project.id, noteText);
    setNoteText('');
  };

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden">
      <div className="p-5">

        {/* Status + Tage */}
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2">
            <StatusBadge status={project.status} />
            {project.typ && (
              <span className="text-[11px] text-text-muted">{project.typ}</span>
            )}
          </div>
          {project.dauer_tage > 0 && (
            <span className="text-[11px] font-semibold flex-shrink-0" style={{ color: '#6B3A4B' }}>
              Tag {Math.min(days, project.dauer_tage)} / {project.dauer_tage} Tage
            </span>
          )}
        </div>

        {/* Name */}
        <h3 className="font-heading text-[17px] font-bold text-text-primary mb-2">{project.name}</h3>

        {/* Beschreibung */}
        {project.beschreibung && (
          <p className="text-[12px] text-text-secondary leading-relaxed mb-3">{project.beschreibung}</p>
        )}

        {/* Fortschrittsbalken */}
        <div className="mb-4">
          <div className="flex justify-between items-center mb-1.5">
            <span className="text-[11px] text-text-muted">Fortschritt</span>
            <span className="text-[11px] font-semibold" style={{ color: '#6B3A4B' }}>{project.fortschritt}%</span>
          </div>
          <div className="h-1.5 bg-background rounded-full overflow-hidden">
            <div className="h-full rounded-full transition-all duration-700"
              style={{ width: `${project.fortschritt}%`, background: '#6B3A4B' }} />
          </div>
        </div>

        {/* Meta */}
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-text-muted mb-4">
          <span className="flex items-center gap-1"><Calendar size={11} />{project.startdatum}</span>
          {project.temperatur && <span>Temp: {project.temperatur}</span>}
          {project.gefaess && <span>Gefäß: {project.gefaess}</span>}
        </div>

        {/* Bottom row: notes toggle + icons */}
        <div className="flex items-center justify-between">
          <button onClick={() => setOpen(o => !o)}
            className="flex items-center gap-1.5 text-[12px] font-medium"
            style={{ color: '#6B3A4B' }}>
            {project.notizen.length} Notiz{project.notizen.length !== 1 ? 'en' : ''}
            {open ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
          <div className="flex items-center gap-1">
            <button onClick={e => { e.stopPropagation(); onEdit(project); }}
              title="Bearbeiten"
              className="p-1.5 rounded-lg transition-colors"
              style={{ color: '#B0A090' }}
              onMouseEnter={e => e.currentTarget.style.color = '#6B3A4B'}
              onMouseLeave={e => e.currentTarget.style.color = '#B0A090'}>
              <Pencil size={16} />
            </button>
            <button onClick={e => { e.stopPropagation(); onDelete(project); }}
              title="Löschen"
              className="p-1.5 rounded-lg transition-colors"
              style={{ color: '#B0A090' }}
              onMouseEnter={e => e.currentTarget.style.color = '#C0392B'}
              onMouseLeave={e => e.currentTarget.style.color = '#B0A090'}>
              <Trash2 size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Notes section */}
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
            <input value={noteText} onChange={e => setNoteText(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && submit()}
              placeholder="Beobachtung notieren…"
              className="flex-1 bg-background border border-border-strong rounded-lg px-3 py-2 text-text-primary text-[12px] outline-none focus:border-gold/40" />
            <button onClick={submit}
              className="px-3.5 py-2 rounded-lg text-[12px] font-semibold flex items-center"
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

  // Modal state
  const [createOpen, setCreateOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<FermentProject | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<FermentProject | null>(null);
  const [deleting, setDeleting] = useState(false);

  const load = async () => {
    try {
      const res = await fetch('/api/fermentation');
      const data = await res.json();
      setProjects(Array.isArray(data) ? data : []);
    } catch { setProjects([]); } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  // Create
  const handleCreate = async (form: FormState) => {
    const notizen: Note[] = form.notizText.trim()
      ? [{ id: Date.now(), text: form.notizText.trim(), date: new Date().toISOString().slice(0, 10) }]
      : [];
    const res = await fetch('/api/fermentation', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, notizen }),
    });
    if (res.ok) { await load(); setCreateOpen(false); }
  };

  // Edit
  const handleSaveEdit = async (form: FormState) => {
    if (!editTarget) return;
    const notizen = form.notizText.trim()
      ? [...editTarget.notizen, { id: Date.now(), text: form.notizText.trim(), date: new Date().toISOString().slice(0, 10) }]
      : editTarget.notizen;
    const res = await fetch(`/api/fermentation/${editTarget.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, notizen }),
    });
    if (res.ok) { await load(); setEditTarget(null); }
  };

  // Add note inline
  const handleAddNote = async (projectId: number, text: string) => {
    const project = projects.find(p => p.id === projectId);
    if (!project) return;
    const newNote: Note = { id: Date.now(), text, date: new Date().toISOString().slice(0, 10) };
    const notizen = [...project.notizen, newNote];
    setProjects(prev => prev.map(p => p.id === projectId ? { ...p, notizen } : p));
    await fetch(`/api/fermentation/${projectId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...project, notizen }),
    });
  };

  // Delete
  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    const res = await fetch(`/api/fermentation/${deleteTarget.id}`, { method: 'DELETE' });
    if (res.ok) { setProjects(prev => prev.filter(p => p.id !== deleteTarget.id)); }
    setDeleting(false);
    setDeleteTarget(null);
  };

  const active = projects.filter(p => p.status === 'Aktiv' || p.status === 'Bereit');
  const done   = projects.filter(p => p.status === 'Abgeschlossen' || p.status === 'Problem');

  return (
    <div style={{ background: 'var(--bg)', minHeight: '100vh' }}>

      {/* Header */}
      <div className="px-8 pt-8 pb-6 flex items-start justify-between gap-4"
        style={{ borderBottom: '1px solid var(--border)' }}>
        <div>
          <div className="text-[10px] font-semibold tracking-[4px] uppercase mb-2"
            style={{ color: 'rgba(107,58,75,0.55)' }}>✦ &nbsp;Laufende Projekte</div>
          <h1 className="font-heading font-bold leading-none"
            style={{ fontSize: 28, color: 'var(--text)', letterSpacing: '2px', textTransform: 'uppercase' }}>
            Fermentation
          </h1>
          <p className="mt-1.5" style={{ color: 'var(--text-muted)', fontSize: 13 }}>
            {loading ? 'Lade…' : `${active.length} laufende Projekte · ${done.length} abgeschlossen`}
          </p>
        </div>
        <button onClick={() => setCreateOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-[13px] font-semibold flex-shrink-0 transition-opacity hover:opacity-90"
          style={{ background: '#6B3A4B', color: '#FAF8F5', marginTop: 4 }}>
          <Plus size={16} /> Neue Fermentation
        </button>
      </div>

      {/* Content */}
      <div className="p-8 max-w-[1200px]">
        {loading && <p className="text-[13px] text-text-muted">Lade Projekte…</p>}

        {!loading && projects.length === 0 && (
          <div className="text-center py-16">
            <p className="text-[14px] text-text-muted mb-3">Noch keine Fermentationsprojekte.</p>
            <button onClick={() => setCreateOpen(true)}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-[13px] font-semibold"
              style={{ background: '#6B3A4B', color: '#FAF8F5' }}>
              <Plus size={15} /> Erstes Projekt anlegen
            </button>
          </div>
        )}

        {!loading && active.length > 0 && (
          <div className="mb-10">
            <div className="text-[11px] text-text-muted font-semibold uppercase tracking-widest mb-4">
              Aktive Projekte
            </div>
            <div className="grid grid-cols-[repeat(auto-fill,minmax(340px,1fr))] gap-5">
              {active.map(p => (
                <ProjectCard key={p.id} project={p}
                  onAddNote={handleAddNote} onEdit={setEditTarget} onDelete={setDeleteTarget} />
              ))}
            </div>
          </div>
        )}

        {!loading && done.length > 0 && (
          <div>
            <div className="text-[11px] text-text-muted font-semibold uppercase tracking-widest mb-4">
              Abgeschlossen
            </div>
            <div className="grid grid-cols-[repeat(auto-fill,minmax(340px,1fr))] gap-5">
              {done.map(p => (
                <ProjectCard key={p.id} project={p}
                  onAddNote={handleAddNote} onEdit={setEditTarget} onDelete={setDeleteTarget} />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Create Modal */}
      {createOpen && (
        <FermentModal mode="create" initial={emptyForm()} onSave={handleCreate} onClose={() => setCreateOpen(false)} />
      )}

      {/* Edit Modal */}
      {editTarget && (
        <FermentModal
          mode="edit"
          initial={{
            name: editTarget.name, typ: editTarget.typ, startdatum: editTarget.startdatum,
            dauer_tage: editTarget.dauer_tage, temperatur: editTarget.temperatur,
            gefaess: editTarget.gefaess, status: editTarget.status,
            fortschritt: editTarget.fortschritt, beschreibung: editTarget.beschreibung,
            notizText: '',
          }}
          existingNotizen={editTarget.notizen}
          onSave={handleSaveEdit}
          onClose={() => setEditTarget(null)}
        />
      )}

      {/* Delete Modal */}
      {deleteTarget && (
        <DeleteModal name={deleteTarget.name} onConfirm={handleDelete}
          onClose={() => setDeleteTarget(null)} deleting={deleting} />
      )}
    </div>
  );
}
