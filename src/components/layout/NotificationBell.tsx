'use client';
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { Bell, Loader2 } from 'lucide-react';
import { CHANGELOG_KATEGORIE_META, type ChangelogKategorie } from '@/config/changelog';

type Entry = { id: string; titel: string; text: string; kategorie: ChangelogKategorie; created_at: string };

function formatDatum(iso: string) {
  return new Date(iso).toLocaleDateString('de-DE', { day: '2-digit', month: 'short', year: 'numeric' });
}

// Sidebar-Footer-Element (siehe Entscheidung in der Session vom 2026-07-31 --
// "ueberall in der App praesent und ein Pflegeort"). Gleiches Popover-Muster
// wie der Einstellungen-Button direkt darunter: eigener Ref + Click-Outside,
// absolute positioniertes Panel ueber dem Trigger.
export default function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [entries, setEntries] = useState<Entry[] | null>(null);
  const [hasUnseen, setHasUnseen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Nur zum Berechnen des Indikator-Punkts -- oeffnet das Panel NICHT.
  useEffect(() => {
    fetch('/api/changelog')
      .then(r => r.json())
      .then(d => {
        const list: Entry[] = d.entries ?? [];
        setEntries(list);
        const lastSeenAt: string | null = d.lastSeenAt ?? null;
        const newest = list[0]?.created_at;
        setHasUnseen(!!newest && (!lastSeenAt || newest > lastSeenAt));
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!open) return;
    const handle = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, [open]);

  const handleToggle = () => {
    const next = !open;
    setOpen(next);
    if (next && hasUnseen) {
      setHasUnseen(false);
      fetch('/api/changelog/seen', { method: 'POST' }).catch(() => {});
    }
  };

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      {open && (
        <div style={{
          position: 'absolute', bottom: 'calc(100% + 8px)', left: 8, right: 8,
          background: 'var(--surface, #FFFFFF)',
          border: '1px solid var(--border, #E8E0D8)',
          borderRadius: 14,
          boxShadow: '0 8px 32px rgba(0,0,0,0.18)',
          padding: 14,
          zIndex: 100,
          maxHeight: 380,
          overflowY: 'auto',
        }}>
          <div style={{ fontSize: 9, letterSpacing: '3px', textTransform: 'uppercase', color: 'var(--text-muted, #B09880)', marginBottom: 10 }}>
            Neuigkeiten
          </div>

          {entries === null && (
            <div className="flex items-center justify-center py-6">
              <Loader2 size={16} className="animate-spin" style={{ color: '#6B3A4B' }} />
            </div>
          )}

          {entries !== null && entries.length === 0 && (
            <p style={{ fontSize: 12.5, color: 'var(--text-muted)', padding: '8px 2px 2px' }}>
              Noch keine Neuigkeiten.
            </p>
          )}

          {entries !== null && entries.slice(0, 5).map(entry => {
            const meta = CHANGELOG_KATEGORIE_META[entry.kategorie];
            return (
              <div key={entry.id} style={{ padding: '8px 2px', borderTop: '1px solid var(--border, #E8E0D8)' }}>
                <div className="flex items-center gap-2 mb-1">
                  <span className="px-1.5 py-0.5 rounded-full font-semibold" style={{ fontSize: 9.5, background: meta.bg, color: meta.text }}>
                    {meta.label}
                  </span>
                  <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>{formatDatum(entry.created_at)}</span>
                </div>
                <div style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--text)' }}>{entry.titel}</div>
                <p style={{ fontSize: 11.5, color: 'var(--text-muted)', marginTop: 2, lineHeight: 1.5 }}>{entry.text}</p>
              </div>
            );
          })}

          {entries !== null && entries.length > 0 && (
            <Link href="/neuigkeiten" onClick={() => setOpen(false)}
              className="block text-center mt-2 pt-2"
              style={{ fontSize: 11.5, fontWeight: 600, color: '#6B3A4B', borderTop: '1px solid var(--border, #E8E0D8)' }}>
              Alle Neuigkeiten ansehen
            </Link>
          )}
        </div>
      )}

      <button
        onClick={handleToggle}
        className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-[12px] font-medium transition-all"
        style={{ color: 'var(--text-muted, #8B7355)' }}
        onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = '#6B3A4B'; (e.currentTarget as HTMLButtonElement).style.background = 'rgba(107,58,75,0.06)'; }}
        onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = 'var(--text-muted, #8B7355)'; (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; }}>
        <span style={{ position: 'relative', display: 'inline-flex' }}>
          <Bell size={14} />
          {hasUnseen && (
            <span style={{
              position: 'absolute', top: -2, right: -2, width: 7, height: 7, borderRadius: '50%',
              background: '#C05050', border: '1.5px solid var(--sidebar-bg, #F0EBE3)',
            }} />
          )}
        </span>
        Neuigkeiten
      </button>
    </div>
  );
}
