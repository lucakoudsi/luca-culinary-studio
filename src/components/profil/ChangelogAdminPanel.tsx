'use client';
import { useEffect, useState } from 'react';
import { Loader2, Plus, Trash2, Pencil, Eye, EyeOff, X, Check, Sparkles } from 'lucide-react';
import { CHANGELOG_KATEGORIEN, CHANGELOG_KATEGORIE_META, type ChangelogKategorie } from '@/config/changelog';

type Entry = { id: string; titel: string; text: string; kategorie: ChangelogKategorie; sichtbar: boolean; created_at: string };

const fieldStyle: React.CSSProperties = {
  width: '100%', boxSizing: 'border-box', padding: '8px 10px', borderRadius: 8, fontSize: 12.5,
  border: '1px solid var(--border, #E8E0D8)', background: 'var(--bg, #FAF8F5)', color: 'var(--text, #2C2420)',
  outline: 'none', fontFamily: 'inherit',
};

function KategorieSelect({ value, onChange }: { value: ChangelogKategorie; onChange: (k: ChangelogKategorie) => void }) {
  return (
    <div style={{ display: 'flex', gap: 6 }}>
      {CHANGELOG_KATEGORIEN.map(k => (
        <button key={k} type="button" onClick={() => onChange(k)}
          style={{
            flex: 1, padding: '6px 4px', borderRadius: 8, fontSize: 11, fontWeight: 600, cursor: 'pointer',
            background: value === k ? 'var(--accent, #6B3A4B)' : 'var(--accent-light, rgba(107,58,75,0.06))',
            color: value === k ? '#FFFFFF' : 'var(--text-muted, #8B7355)',
            border: value === k ? '1px solid var(--accent, #6B3A4B)' : '1px solid var(--border, #E8E0D8)',
          }}>
          {CHANGELOG_KATEGORIE_META[k].label}
        </button>
      ))}
    </div>
  );
}

export default function ChangelogAdminPanel() {
  const [entries, setEntries] = useState<Entry[] | null>(null);
  const [error, setError] = useState('');

  // Neuer Eintrag
  const [newTitel, setNewTitel] = useState('');
  const [newText, setNewText] = useState('');
  const [newKategorie, setNewKategorie] = useState<ChangelogKategorie>('neu');
  const [creating, setCreating] = useState(false);
  const [isDraft, setIsDraft] = useState(false);

  // KI-Assistent aus Commit-Messages
  const [commits, setCommits] = useState('');
  const [drafting, setDrafting] = useState(false);
  const [draftHinweis, setDraftHinweis] = useState('');

  // Inline-Bearbeitung
  const [editId, setEditId] = useState<string | null>(null);
  const [editTitel, setEditTitel] = useState('');
  const [editText, setEditText] = useState('');
  const [editKategorie, setEditKategorie] = useState<ChangelogKategorie>('neu');
  const [saving, setSaving] = useState(false);

  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const load = () => {
    setError('');
    fetch('/api/admin/changelog').then(r => r.json()).then(d => {
      if (d.error) { setError(d.error); return; }
      setEntries(d.entries ?? []);
    }).catch(() => setError('Konnte nicht geladen werden.'));
  };

  useEffect(load, []);

  const handleCreate = async () => {
    if (!newTitel.trim() || !newText.trim()) return;
    setCreating(true);
    setError('');
    try {
      const res = await fetch('/api/admin/changelog', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ titel: newTitel.trim(), text: newText.trim(), kategorie: newKategorie, sichtbar: false }),
      });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) { setError(d.error || 'Anlegen fehlgeschlagen.'); setCreating(false); return; }
      setNewTitel(''); setNewText(''); setNewKategorie('neu'); setIsDraft(false);
      load();
    } catch {
      setError('Netzwerkfehler.');
    }
    setCreating(false);
  };

  const handleDraft = async () => {
    if (!commits.trim()) return;
    setDrafting(true);
    setDraftHinweis('');
    setError('');
    try {
      const res = await fetch('/api/admin/changelog/draft', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ commits: commits.trim() }),
      });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) { setError(d.message || d.error || 'Entwurf konnte nicht erstellt werden.'); setDrafting(false); return; }
      if (!d.geeignet) {
        setDraftHinweis(d.hinweis || 'Diese Änderungen sind nicht für ein Nutzer-Update geeignet.');
        setDrafting(false);
        return;
      }
      setNewTitel(d.titel);
      setNewText(d.text);
      setNewKategorie(d.kategorie);
      setIsDraft(true);
    } catch {
      setError('Netzwerkfehler.');
    }
    setDrafting(false);
  };

  const toggleSichtbar = async (entry: Entry) => {
    setTogglingId(entry.id);
    try {
      await fetch(`/api/admin/changelog/${entry.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sichtbar: !entry.sichtbar }),
      });
      setEntries(prev => prev?.map(e => e.id === entry.id ? { ...e, sichtbar: !e.sichtbar } : e) ?? null);
    } catch {
      setError('Sichtbarkeit konnte nicht geändert werden.');
    }
    setTogglingId(null);
  };

  const startEdit = (entry: Entry) => {
    setEditId(entry.id);
    setEditTitel(entry.titel);
    setEditText(entry.text);
    setEditKategorie(entry.kategorie);
  };

  const saveEdit = async () => {
    if (!editId || !editTitel.trim() || !editText.trim()) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/changelog/${editId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ titel: editTitel.trim(), text: editText.trim(), kategorie: editKategorie }),
      });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) { setError(d.error || 'Speichern fehlgeschlagen.'); setSaving(false); return; }
      setEntries(prev => prev?.map(e => e.id === editId ? d.entry : e) ?? null);
      setEditId(null);
    } catch {
      setError('Netzwerkfehler.');
    }
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      await fetch(`/api/admin/changelog/${id}`, { method: 'DELETE' });
      setEntries(prev => prev?.filter(e => e.id !== id) ?? null);
      setDeleteConfirmId(null);
    } catch {
      setError('Löschen fehlgeschlagen.');
    }
    setDeletingId(null);
  };

  return (
    <div style={{ paddingBottom: '2rem' }}>
      <h3 style={{ fontFamily: 'var(--font-playfair, serif)', fontSize: 16, fontWeight: 600, color: 'var(--text)', margin: '0 0 1rem' }}>
        Neuigkeiten pflegen
      </h3>

      {error && (
        <div className="rounded-xl px-4 py-3 text-[12px] mb-4" style={{ background: 'rgba(239,68,68,0.07)', color: '#E06B6B' }}>
          {error}
        </div>
      )}

      {/* KI-Assistent aus Commit-Messages */}
      <div className="rounded-xl p-4 mb-4" style={{ background: 'rgba(107,58,75,0.04)', border: '1px solid rgba(107,58,75,0.18)' }}>
        <div style={{ fontSize: 10, letterSpacing: 2, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 8 }}>
          Commit-Messages einfügen
        </div>
        <textarea value={commits} onChange={e => setCommits(e.target.value)}
          placeholder={'z.B.\nfix: Zutaten-Erkennung bei dichten Bild-Vorlagen\nfeat: Dark-Mode-Kontrastprobleme systematisch beheben'}
          rows={4} style={{ ...fieldStyle, marginBottom: 8, resize: 'vertical', fontFamily: 'monospace', fontSize: 12 }} />
        {draftHinweis && (
          <div className="rounded-lg px-3 py-2 text-[12px] mb-2" style={{ background: 'rgba(200,136,42,0.1)', color: '#C8882A' }}>
            {draftHinweis}
          </div>
        )}
        <button onClick={handleDraft} disabled={drafting || !commits.trim()}
          className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-[12px] font-semibold transition-all disabled:opacity-40"
          style={{ background: 'rgba(107,58,75,0.1)', border: '1px solid rgba(107,58,75,0.25)', color: '#6B3A4B' }}>
          {drafting ? <Loader2 size={13} className="animate-spin" /> : <Sparkles size={13} />}
          Mit KI in Neuigkeit umwandeln
        </button>
      </div>

      {/* Neuer Eintrag */}
      <div className="rounded-xl p-4 mb-6" style={{ background: 'var(--surface-2, #F4EFE9)', border: isDraft ? '1.5px solid #C9A84C' : '1px solid var(--border, #E8E0D8)' }}>
        <div style={{ fontSize: 10, letterSpacing: 2, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 8 }}>
          Neuer Eintrag
        </div>
        {isDraft && (
          <div className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-[12px] font-semibold mb-3" style={{ background: 'rgba(201,168,76,0.14)', color: '#9B7A2A' }}>
            <Sparkles size={13} /> KI-Vorschlag — bitte prüfen, bevor du veröffentlichst
          </div>
        )}
        <input value={newTitel} onChange={e => { setNewTitel(e.target.value); setIsDraft(false); }} placeholder="Titel"
          style={{ ...fieldStyle, marginBottom: 8 }} />
        <textarea value={newText} onChange={e => { setNewText(e.target.value); setIsDraft(false); }} placeholder="Text" rows={3}
          style={{ ...fieldStyle, marginBottom: 8, resize: 'vertical' }} />
        <div style={{ marginBottom: 10 }}>
          <KategorieSelect value={newKategorie} onChange={setNewKategorie} />
        </div>
        <button onClick={handleCreate} disabled={creating || !newTitel.trim() || !newText.trim()}
          className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-[12px] font-semibold transition-all disabled:opacity-40"
          style={{ background: 'linear-gradient(135deg, #562E3C, #6B3A4B)', color: '#FFFFFF' }}>
          {creating ? <Loader2 size={13} className="animate-spin" /> : <Plus size={13} />}
          Anlegen (unsichtbar)
        </button>
      </div>

      {/* Liste */}
      {entries === null && (
        <div className="flex items-center justify-center py-8">
          <Loader2 size={18} className="animate-spin" style={{ color: '#6B3A4B' }} />
        </div>
      )}

      {entries !== null && entries.length === 0 && (
        <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>Noch keine Einträge angelegt.</p>
      )}

      {entries !== null && entries.map(entry => {
        const meta = CHANGELOG_KATEGORIE_META[entry.kategorie];
        const isEditing = editId === entry.id;
        const isConfirming = deleteConfirmId === entry.id;

        return (
          <div key={entry.id} style={{
            borderRadius: 12, marginBottom: 6, overflow: 'hidden',
            background: 'var(--surface)', border: isConfirming ? '1px solid rgba(192,80,80,0.35)' : '1px solid var(--border)',
          }}>
            {isEditing ? (
              <div style={{ padding: 14 }}>
                <input value={editTitel} onChange={e => setEditTitel(e.target.value)} style={{ ...fieldStyle, marginBottom: 8 }} />
                <textarea value={editText} onChange={e => setEditText(e.target.value)} rows={3} style={{ ...fieldStyle, marginBottom: 8, resize: 'vertical' }} />
                <div style={{ marginBottom: 10 }}>
                  <KategorieSelect value={editKategorie} onChange={setEditKategorie} />
                </div>
                <div className="flex gap-2">
                  <button onClick={saveEdit} disabled={saving}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11.5px] font-semibold disabled:opacity-40"
                    style={{ background: '#6B3A4B', color: '#FFFFFF' }}>
                    {saving ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />} Speichern
                  </button>
                  <button onClick={() => setEditId(null)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11.5px] font-semibold"
                    style={{ background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text-muted)' }}>
                    <X size={12} /> Abbrechen
                  </button>
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', opacity: entry.sichtbar ? 1 : 0.55 }}>
                <span className="px-2 py-0.5 rounded-full font-semibold flex-shrink-0" style={{ fontSize: 10, background: meta.bg, color: meta.text }}>
                  {meta.label}
                </span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {entry.titel}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {entry.text}
                  </div>
                </div>
                <button onClick={() => toggleSichtbar(entry)} disabled={togglingId === entry.id}
                  title={entry.sichtbar ? 'Sichtbar -- klicken zum Verstecken' : 'Unsichtbar -- klicken zum Veröffentlichen'}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 5, flexShrink: 0, color: entry.sichtbar ? '#5A9A58' : 'var(--text-muted)' }}>
                  {togglingId === entry.id ? <Loader2 size={15} className="animate-spin" /> : entry.sichtbar ? <Eye size={15} /> : <EyeOff size={15} />}
                </button>
                <button onClick={() => startEdit(entry)} title="Bearbeiten"
                  style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 5, flexShrink: 0, color: 'var(--text-muted)' }}>
                  <Pencil size={14} />
                </button>
                <button onClick={() => setDeleteConfirmId(isConfirming ? null : entry.id)} title="Löschen"
                  style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 5, flexShrink: 0, color: isConfirming ? '#C05050' : 'rgba(192,80,80,0.45)' }}>
                  <Trash2 size={14} />
                </button>
              </div>
            )}

            {isConfirming && !isEditing && (
              <div style={{ padding: '10px 14px 12px', borderTop: '1px solid rgba(192,80,80,0.15)', background: 'rgba(192,80,80,0.03)' }}>
                <p style={{ fontSize: 12, color: '#4A2020', margin: '0 0 10px' }}>Eintrag „{entry.titel}" wirklich löschen?</p>
                <div className="flex gap-2">
                  <button onClick={() => setDeleteConfirmId(null)}
                    style={{ padding: '5px 14px', borderRadius: 7, fontSize: 12, fontWeight: 600, background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text-muted)', cursor: 'pointer' }}>
                    Abbrechen
                  </button>
                  <button onClick={() => handleDelete(entry.id)} disabled={deletingId === entry.id}
                    className="disabled:opacity-40"
                    style={{ padding: '5px 14px', borderRadius: 7, fontSize: 12, fontWeight: 600, background: 'linear-gradient(135deg,#C05050,#A03030)', color: '#fff', border: 'none', cursor: 'pointer' }}>
                    Löschen
                  </button>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
