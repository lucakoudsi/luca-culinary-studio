'use client';
import PageTransition from '@/components/ui/PageTransition';
import EmptyState from '@/components/ui/EmptyState';
import { Library } from 'lucide-react';

// Schritt 1 (Navigation + Seitengeruest) aus docs/community-konzept.md.txt --
// noch keine Datenbank-Anbindung, kein Veroeffentlichen-Flow. Die Filterung
// nach Geschmacksprofil/Technik/Saison aus dem Konzept kommt in einer
// spaeteren Phase, sobald es tatsaechlich veroeffentlichte Rezepte gibt.
export default function CollectionPage() {
  return (
    <PageTransition>
      <div style={{ background: 'var(--bg)', minHeight: '100vh' }}>
        <div className="px-4 sm:px-8 pt-6 sm:pt-8 pb-6" style={{ borderBottom: '1px solid var(--border)' }}>
          <div className="text-[10px] font-semibold tracking-[4px] uppercase mb-2" style={{ color: 'rgba(107,58,75,0.55)' }}>✦ &nbsp;Collection</div>
          <h1 className="font-heading font-bold leading-none" style={{ fontSize: 28, color: 'var(--text)', letterSpacing: '2px', textTransform: 'uppercase' }}>LUCA Collection</h1>
          <p className="mt-1.5" style={{ color: 'var(--text-muted)', fontSize: 13 }}>Die öffentliche Rezept-Mediathek — stöbere in veröffentlichten Rezepten anderer Köche.</p>
        </div>

        <div className="px-4 sm:px-8 py-8 max-w-[1400px] mx-auto">
          <EmptyState
            icon={<Library size={28} color="#6B3A4B" strokeWidth={1.5} />}
            title="Die Mediathek ist noch leer"
            subtitle="Bald kannst du hier veröffentlichte Rezepte anderer Köche entdecken und nach Geschmacksprofil, Technik, Aufwand und Saison filtern." />
        </div>
      </div>
    </PageTransition>
  );
}
