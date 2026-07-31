'use client';
import { useEffect, useState } from 'react';
import { Loader2, Bell } from 'lucide-react';
import PageTransition from '@/components/ui/PageTransition';
import EmptyState from '@/components/ui/EmptyState';
import { CHANGELOG_KATEGORIE_META, type ChangelogKategorie } from '@/config/changelog';

type Entry = { id: string; titel: string; text: string; kategorie: ChangelogKategorie; created_at: string };

function formatDatum(iso: string) {
  return new Date(iso).toLocaleDateString('de-DE', { day: '2-digit', month: 'long', year: 'numeric' });
}

function KategorieTag({ kategorie }: { kategorie: ChangelogKategorie }) {
  const meta = CHANGELOG_KATEGORIE_META[kategorie];
  return (
    <span className="px-2 py-0.5 rounded-full font-semibold" style={{ fontSize: 10.5, letterSpacing: 0.3, background: meta.bg, color: meta.text }}>
      {meta.label}
    </span>
  );
}

export default function NeuigkeitenPage() {
  const [entries, setEntries] = useState<Entry[] | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/changelog')
      .then(r => r.json())
      .then(d => setEntries(d.entries ?? []))
      .catch(() => setError('Neuigkeiten konnten nicht geladen werden.'));
  }, []);

  return (
    <PageTransition>
      <div className="px-4 sm:px-8 pt-6 sm:pt-8 pb-10 max-w-2xl mx-auto">
        <div className="mb-8">
          <h1 className="font-heading font-bold" style={{ fontSize: 26, color: 'var(--text)' }}>Neuigkeiten</h1>
          <p className="mt-1.5" style={{ fontSize: 13, color: 'var(--text-muted)' }}>
            Was sich in Culinary Studio zuletzt getan hat.
          </p>
        </div>

        {error && (
          <div className="rounded-xl px-4 py-3 text-[13px]" style={{ background: 'rgba(192,80,80,0.08)', color: '#C05050' }}>
            {error}
          </div>
        )}

        {!error && entries === null && (
          <div className="flex items-center justify-center py-16">
            <Loader2 size={20} className="animate-spin" style={{ color: '#6B3A4B' }} />
          </div>
        )}

        {entries !== null && entries.length === 0 && (
          <EmptyState icon={<Bell size={28} color="#6B3A4B" strokeWidth={1.5} />}
            title="Noch keine Neuigkeiten"
            subtitle="Hier erscheinen künftige Updates zu Culinary Studio." />
        )}

        {entries !== null && entries.length > 0 && (
          <div className="space-y-4">
            {entries.map(entry => (
              <div key={entry.id} className="rounded-2xl p-5" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
                <div className="flex items-center gap-2.5 mb-2">
                  <KategorieTag kategorie={entry.kategorie} />
                  <span style={{ fontSize: 11.5, color: 'var(--text-muted)' }}>{formatDatum(entry.created_at)}</span>
                </div>
                <h3 className="font-heading font-bold" style={{ fontSize: 16, color: 'var(--text)' }}>{entry.titel}</h3>
                <p className="mt-1.5" style={{ fontSize: 13.5, color: 'var(--text-muted)', lineHeight: 1.65, whiteSpace: 'pre-wrap' }}>
                  {entry.text}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </PageTransition>
  );
}
