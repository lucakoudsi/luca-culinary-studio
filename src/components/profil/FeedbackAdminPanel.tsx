'use client';
import { useEffect, useState } from 'react';
import { Loader2, Trash2, MessageSquare } from 'lucide-react';
import {
  FEEDBACK_KATEGORIEN, FEEDBACK_KATEGORIE_META, FEEDBACK_STATUS_LIST, FEEDBACK_STATUS_META,
  type FeedbackKategorie, type FeedbackStatus,
} from '@/config/feedback';

type Entry = {
  id: string; kategorie: FeedbackKategorie; text: string; status: FeedbackStatus; created_at: string;
  user_name: string; user_email: string;
};

function formatDatum(iso: string) {
  return new Date(iso).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export default function FeedbackAdminPanel() {
  const [entries, setEntries] = useState<Entry[] | null>(null);
  const [error, setError] = useState('');
  const [kategorieFilter, setKategorieFilter] = useState<FeedbackKategorie | 'alle'>('alle');
  const [statusFilter, setStatusFilter] = useState<FeedbackStatus | 'alle'>('alle');
  const [statusActing, setStatusActing] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const load = () => {
    setError('');
    fetch('/api/admin/feedback').then(r => r.json()).then(d => {
      if (d.error) { setError(d.error); return; }
      setEntries(d.entries ?? []);
    }).catch(() => setError('Konnte nicht geladen werden.'));
  };

  useEffect(load, []);

  const changeStatus = async (id: string, status: FeedbackStatus) => {
    setStatusActing(id);
    try {
      await fetch(`/api/admin/feedback/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      setEntries(prev => prev?.map(e => e.id === id ? { ...e, status } : e) ?? null);
    } catch {
      setError('Status konnte nicht geändert werden.');
    }
    setStatusActing(null);
  };

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      await fetch(`/api/admin/feedback/${id}`, { method: 'DELETE' });
      setEntries(prev => prev?.filter(e => e.id !== id) ?? null);
      setDeleteConfirmId(null);
    } catch {
      setError('Löschen fehlgeschlagen.');
    }
    setDeletingId(null);
  };

  const filtered = (entries ?? []).filter(e =>
    (kategorieFilter === 'alle' || e.kategorie === kategorieFilter) &&
    (statusFilter === 'alle' || e.status === statusFilter)
  );

  return (
    <div style={{ paddingBottom: '2rem' }}>
      <h3 style={{ fontFamily: 'var(--font-playfair, serif)', fontSize: 16, fontWeight: 600, color: 'var(--text)', margin: '0 0 1rem' }}>
        Feedback
      </h3>

      {error && (
        <div className="rounded-xl px-4 py-3 text-[12px] mb-4" style={{ background: 'rgba(239,68,68,0.07)', color: '#E06B6B' }}>
          {error}
        </div>
      )}

      {/* Filter */}
      {entries !== null && entries.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-4">
          <select value={kategorieFilter} onChange={e => setKategorieFilter(e.target.value as FeedbackKategorie | 'alle')}
            style={{ padding: '6px 10px', borderRadius: 8, fontSize: 12, background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text)', cursor: 'pointer' }}>
            <option value="alle">Alle Kategorien</option>
            {FEEDBACK_KATEGORIEN.map(k => <option key={k} value={k}>{FEEDBACK_KATEGORIE_META[k].label}</option>)}
          </select>
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value as FeedbackStatus | 'alle')}
            style={{ padding: '6px 10px', borderRadius: 8, fontSize: 12, background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text)', cursor: 'pointer' }}>
            <option value="alle">Alle Status</option>
            {FEEDBACK_STATUS_LIST.map(s => <option key={s} value={s}>{FEEDBACK_STATUS_META[s].label}</option>)}
          </select>
        </div>
      )}

      {entries === null && (
        <div className="flex items-center justify-center py-8">
          <Loader2 size={18} className="animate-spin" style={{ color: '#6B3A4B' }} />
        </div>
      )}

      {entries !== null && entries.length === 0 && (
        <div className="rounded-xl px-5 py-8 text-center" style={{ background: 'var(--surface-2, #F4EFE9)', border: '1px dashed var(--border)' }}>
          <MessageSquare size={22} style={{ color: '#6B3A4B', margin: '0 auto 8px' }} />
          <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>Noch kein Feedback vorhanden.</p>
        </div>
      )}

      {entries !== null && entries.length > 0 && filtered.length === 0 && (
        <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>Kein Feedback für diese Filter.</p>
      )}

      {filtered.map(entry => {
        const kMeta = FEEDBACK_KATEGORIE_META[entry.kategorie];
        const sMeta = FEEDBACK_STATUS_META[entry.status];
        const isConfirming = deleteConfirmId === entry.id;

        return (
          <div key={entry.id} style={{
            borderRadius: 12, marginBottom: 8, overflow: 'hidden',
            background: 'var(--surface)', border: isConfirming ? '1px solid rgba(192,80,80,0.35)' : '1px solid var(--border)',
          }}>
            <div style={{ padding: '12px 14px' }}>
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                <span className="px-2 py-0.5 rounded-full font-semibold" style={{ fontSize: 10, background: 'rgba(107,58,75,0.1)', color: '#6B3A4B' }}>
                  {kMeta.label}
                </span>
                <span className="px-2 py-0.5 rounded-full font-semibold" style={{ fontSize: 10, background: sMeta.bg, color: sMeta.text }}>
                  {sMeta.label}
                </span>
                <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                  {entry.user_name}{entry.user_email ? ` · ${entry.user_email}` : ''}
                </span>
                <span style={{ fontSize: 11, color: 'var(--text-muted)', marginLeft: 'auto' }}>{formatDatum(entry.created_at)}</span>
              </div>

              <p style={{ fontSize: 13, color: 'var(--text)', lineHeight: 1.6, whiteSpace: 'pre-wrap', marginBottom: 10 }}>
                {entry.text}
              </p>

              <div className="flex items-center gap-2">
                <select value={entry.status} disabled={statusActing === entry.id}
                  onChange={e => changeStatus(entry.id, e.target.value as FeedbackStatus)}
                  style={{ padding: '5px 8px', borderRadius: 8, fontSize: 11.5, background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text)', cursor: 'pointer' }}>
                  {FEEDBACK_STATUS_LIST.map(s => <option key={s} value={s}>{FEEDBACK_STATUS_META[s].label}</option>)}
                </select>
                {statusActing === entry.id && <Loader2 size={13} className="animate-spin" style={{ color: '#6B3A4B' }} />}
                <button onClick={() => setDeleteConfirmId(isConfirming ? null : entry.id)} title="Löschen"
                  className="ml-auto"
                  style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 5, color: isConfirming ? '#C05050' : 'rgba(192,80,80,0.45)' }}>
                  <Trash2 size={14} />
                </button>
              </div>
            </div>

            {isConfirming && (
              <div style={{ padding: '10px 14px 12px', borderTop: '1px solid rgba(192,80,80,0.15)', background: 'rgba(192,80,80,0.03)' }}>
                <p style={{ fontSize: 12, color: '#4A2020', margin: '0 0 10px' }}>Diesen Feedback-Eintrag wirklich löschen?</p>
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
