'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/utils/supabase/client';
import { ArrowLeft, Loader2, UtensilsCrossed, Sparkles, Pencil, Trash2, Check, X } from 'lucide-react';
import type { SavedMenuRow } from '@/types';

const DATE_FORMAT = new Intl.DateTimeFormat('de-DE', { day: '2-digit', month: 'short', year: 'numeric' });

export default function MenuegeneratorGaleriePage() {
  const router = useRouter();
  const [menus, setMenus] = useState<SavedMenuRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [renaming, setRenaming] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Nur fuer den Avatar oben rechts -- dieselbe Quelle wie andere Feature-Seiten.
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [initials, setInitials] = useState('');

  const load = () => {
    setError(null);
    fetch('/api/menus')
      .then(async r => ({ ok: r.ok, body: await r.json().catch(() => ({})) }))
      .then(({ ok, body }) => {
        if (!ok) { setError(body.message || body.error || 'Menüs konnten nicht geladen werden.'); return; }
        setMenus(body.menus ?? []);
      })
      .catch(() => setError('Netzwerkfehler beim Laden.'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
    createClient().then((supabase) => supabase.auth.getUser()).then(({ data }) => {
      const u = data.user;
      if (!u) return;
      fetch('/api/profil').then(r => r.json()).then(d => {
        setAvatarUrl(d.profile?.avatar_url ?? null);
        const name: string = d.profile?.full_name || u.email?.split('@')[0] || 'Chef';
        setInitials(name.split(' ').map((w: string) => w[0]).join('').toUpperCase().slice(0, 2));
      }).catch(() => {});
    }).catch((e) => console.warn('[Menuegenerator-Galerie] Auth-Check fehlgeschlagen:', e));
  }, []);

  const startRename = (m: SavedMenuRow) => {
    setEditingId(m.id);
    setEditingName(m.name);
  };
  const cancelRename = () => { setEditingId(null); setEditingName(''); };
  const confirmRename = async (id: string) => {
    const name = editingName.trim();
    if (!name) return;
    setRenaming(true);
    try {
      const res = await fetch(`/api/menus/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      });
      if (!res.ok) throw new Error('rename failed');
      const updated: SavedMenuRow = await res.json();
      setMenus(prev => prev.map(m => m.id === id ? updated : m));
      cancelRename();
    } catch {
      setError('Umbenennen fehlgeschlagen. Bitte erneut versuchen.');
    } finally {
      setRenaming(false);
    }
  };

  const handleDelete = async (m: SavedMenuRow) => {
    if (!confirm(`"${m.name}" wirklich löschen?`)) return;
    setDeletingId(m.id);
    try {
      const res = await fetch(`/api/menus/${m.id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('delete failed');
      setMenus(prev => prev.filter(x => x.id !== m.id));
    } catch {
      setError('Löschen fehlgeschlagen. Bitte erneut versuchen.');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div style={{ background: 'var(--bg)' }} className="min-h-screen">
      <div className="sticky top-0 z-20 px-4 sm:px-8 py-4 flex items-center justify-between"
        style={{ borderBottom: '1px solid var(--border)', background: 'var(--bg)' }}>
        <div>
          <Link href="/menuegenerator"
            className="inline-flex items-center gap-1.5 text-[11.5px] font-semibold mb-1.5 transition-colors"
            style={{ color: 'var(--text-muted)' }}>
            <ArrowLeft size={12} /> Menügenerator
          </Link>
          <h1 className="font-heading font-bold leading-none" style={{ fontSize: 20, color: 'var(--text)', letterSpacing: '1.5px', textTransform: 'uppercase' }}>Meine Menüs</h1>
          <p className="mt-1.5" style={{ fontSize: 12.5, color: 'var(--text-muted)' }}>Deine gespeicherten Menüvorschläge</p>
        </div>
        <Link href="/profil" title="Profil" className="flex-shrink-0">
          {avatarUrl ? (
            <img src={avatarUrl} alt="" className="w-8 h-8 rounded-full object-cover" style={{ border: '1px solid var(--border)' }} />
          ) : (
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-[10.5px] font-bold text-white"
              style={{ background: 'linear-gradient(135deg, #6B3A4B, #9A5468)' }}>
              {initials}
            </div>
          )}
        </Link>
      </div>

      <div className="px-4 sm:px-8 py-10 max-w-[1400px] mx-auto">
        {error && (
          <div className="mx-auto max-w-md mb-6 px-4 py-2.5 rounded-xl text-[13px] flex items-start gap-2"
            style={{ background: 'rgba(192,80,80,0.08)', border: '1px solid rgba(192,80,80,0.25)', color: '#C05050' }}>
            <span className="flex-shrink-0 mt-0.5">⚠</span><span>{error}</span>
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center" style={{ minHeight: 400 }}>
            <Loader2 size={22} className="animate-spin" style={{ color: '#6B3A4B' }} />
          </div>
        ) : menus.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 text-center" style={{ minHeight: 420 }}>
            <UtensilsCrossed size={28} strokeWidth={1.3} style={{ color: 'rgba(107,58,75,0.35)' }} />
            <p className="font-heading text-lg" style={{ color: 'var(--text)' }}>Noch keine Menüs gespeichert</p>
            <p className="text-[13px]" style={{ color: 'var(--text-muted)', maxWidth: 320 }}>
              Komponiere ein Menü und speichere es -- es landet hier in deiner Galerie und bleibt wiederaufrufbar.
            </p>
            <Link href="/menuegenerator"
              className="mt-2 inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-[12.5px] font-semibold text-white transition-all"
              style={{ background: 'linear-gradient(135deg, #562E3C, #7D4558)' }}>
              <Sparkles size={13} /> Menü komponieren
            </Link>
          </div>
        ) : (
          <div className="grid gap-5" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))' }}>
            {menus.map(m => {
              const isEditing = editingId === m.id;
              return (
                <div key={m.id}
                  className={`bg-card border border-border rounded-xl p-4 ${isEditing ? '' : 'card-hover cursor-pointer'}`}
                  onClick={() => { if (!isEditing) router.push(`/menuegenerator?laden=${m.id}`); }}>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    {isEditing ? (
                      <input value={editingName} onChange={e => setEditingName(e.target.value)} autoFocus
                        onClick={e => e.stopPropagation()}
                        onKeyDown={e => { if (e.key === 'Enter') confirmRename(m.id); if (e.key === 'Escape') cancelRename(); }}
                        className="flex-1 min-w-0 px-2 py-1 rounded-lg text-[14px] font-semibold outline-none"
                        style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text)' }} />
                    ) : (
                      <h3 className="font-heading text-[14px] font-bold leading-snug truncate" style={{ color: 'var(--text)' }}>{m.name}</h3>
                    )}
                  </div>

                  <p className="text-[12px] mb-3" style={{ color: 'var(--text-muted)' }}>
                    {m.menu.gaenge.length} Gänge · {DATE_FORMAT.format(new Date(m.createdAt))}
                  </p>

                  {m.menu.gaenge.length > 0 && (
                    <p className="text-[11px] leading-snug line-clamp-2 mb-3" style={{ color: 'var(--text-muted)' }}>
                      {m.menu.gaenge.map(g => g.titel).join(' · ')}
                    </p>
                  )}

                  <div className="flex items-center gap-2 pt-2" style={{ borderTop: '1px solid var(--border)' }} onClick={e => e.stopPropagation()}>
                    {isEditing ? (
                      <>
                        <button onClick={() => confirmRename(m.id)} disabled={renaming || !editingName.trim()}
                          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11.5px] font-semibold transition-all disabled:opacity-40"
                          style={{ background: 'var(--primary)', color: 'var(--primary-foreground)' }}>
                          {renaming ? <Loader2 size={11} className="animate-spin" /> : <Check size={11} />} Speichern
                        </button>
                        <button onClick={cancelRename}
                          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11.5px] font-medium"
                          style={{ background: 'transparent', border: '1px solid var(--border)', color: 'var(--text-muted)' }}>
                          <X size={11} /> Abbrechen
                        </button>
                      </>
                    ) : (
                      <>
                        <button onClick={() => startRename(m)}
                          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11.5px] font-medium transition-colors"
                          style={{ color: 'var(--text-muted)' }}>
                          <Pencil size={11} /> Umbenennen
                        </button>
                        <button onClick={() => handleDelete(m)} disabled={deletingId === m.id}
                          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11.5px] font-medium transition-colors disabled:opacity-40 ml-auto"
                          style={{ color: '#C05050' }}>
                          {deletingId === m.id ? <Loader2 size={11} className="animate-spin" /> : <Trash2 size={11} />} Löschen
                        </button>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
