'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/utils/supabase/client';
import { ArrowLeft, Loader2, Palette, Sparkles } from 'lucide-react';
import GalerieDetailOverlay from '@/components/tellerdesigner/GalerieDetailOverlay';
import type { TellerDesignRow } from '@/types';

const DATE_FORMAT = new Intl.DateTimeFormat('de-DE', { day: '2-digit', month: 'short', year: 'numeric' });

export default function TellerdesignerGaleriePage() {
  const [designs, setDesigns] = useState<TellerDesignRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<TellerDesignRow | null>(null);

  // Nur fuer den Avatar oben rechts -- dieselbe Quelle wie die Haupt-Seite/Sidebar.tsx.
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [initials, setInitials] = useState('');

  useEffect(() => {
    fetch('/api/tellerdesigner/designs')
      .then(async r => ({ ok: r.ok, body: await r.json().catch(() => ({})) }))
      .then(({ ok, body }) => {
        if (!ok) { setError(body.message || body.error || 'Designs konnten nicht geladen werden.'); return; }
        setDesigns(body.designs ?? []);
      })
      .catch(() => setError('Netzwerkfehler beim Laden.'))
      .finally(() => setLoading(false));

    createClient().then((supabase) => supabase.auth.getUser()).then(({ data }) => {
      const u = data.user;
      if (!u) return;
      fetch('/api/profil').then(r => r.json()).then(d => {
        setAvatarUrl(d.profile?.avatar_url ?? null);
        const name: string = d.profile?.full_name || u.email?.split('@')[0] || 'Chef';
        setInitials(name.split(' ').map((w: string) => w[0]).join('').toUpperCase().slice(0, 2));
      }).catch(() => {});
    }).catch((e) => console.warn('[Tellerdesigner-Galerie] Auth-Check fehlgeschlagen:', e));
  }, []);

  return (
    <div style={{ background: 'var(--bg)' }} className="min-h-screen">
      <div className="sticky top-0 z-20 px-8 py-4 flex items-center justify-between"
        style={{ borderBottom: '1px solid var(--border)', background: 'var(--bg)' }}>
        <div>
          <Link href="/tellerdesigner"
            className="inline-flex items-center gap-1.5 text-[11.5px] font-semibold mb-1.5 transition-colors"
            style={{ color: 'var(--text-muted)' }}>
            <ArrowLeft size={12} /> Tellerdesigner
          </Link>
          <h1 className="font-heading font-bold leading-none" style={{ fontSize: 20, color: 'var(--text)', letterSpacing: '1.5px', textTransform: 'uppercase' }}>Meine Designs</h1>
          <p className="mt-1.5" style={{ fontSize: 12.5, color: 'var(--text-muted)' }}>Deine gespeicherten Anrichte-Inspirationen</p>
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

      <div className="px-8 py-10 max-w-[1400px] mx-auto">
        {loading ? (
          <div className="flex items-center justify-center" style={{ minHeight: 400 }}>
            <Loader2 size={22} className="animate-spin" style={{ color: '#6B3A4B' }} />
          </div>
        ) : error ? (
          <div className="mx-auto max-w-md px-4 py-2.5 rounded-xl text-[13px] flex items-start gap-2"
            style={{ background: 'rgba(192,80,80,0.08)', border: '1px solid rgba(192,80,80,0.25)', color: '#C05050' }}>
            <span className="flex-shrink-0 mt-0.5">⚠</span><span>{error}</span>
          </div>
        ) : designs.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 text-center" style={{ minHeight: 420 }}>
            <Palette size={28} strokeWidth={1.3} style={{ color: 'rgba(107,58,75,0.35)' }} />
            <p className="font-heading text-lg" style={{ color: 'var(--text)' }}>Noch keine Designs gespeichert</p>
            <p className="text-[13px]" style={{ color: 'var(--text-muted)', maxWidth: 320 }}>
              Generiere ein Tellerdesign und speichere deine liebsten Varianten -- sie landen hier in deiner Galerie.
            </p>
            <Link href="/tellerdesigner"
              className="mt-2 inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-[12.5px] font-semibold text-white transition-all"
              style={{ background: 'linear-gradient(135deg, #562E3C, #7D4558)' }}>
              <Sparkles size={13} /> Design generieren
            </Link>
          </div>
        ) : (
          // Bewusst ein loses Foto-Raster statt Karten (Vision: "Die
          // Varianten sollen wie kleine Fotografien wirken, nicht wie
          // Karten") -- keine bg-card/border-Umrandung ums Bild, nur ein
          // dezenter Hover-Lift, Titel/Metadaten als reine Bildunterschrift
          // darunter statt in einem umschliessenden Kasten.
          <div className="grid gap-x-8 gap-y-12" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))' }}>
            {designs.map(d => (
              <button key={d.id} onClick={() => setSelected(d)} className="text-left group">
                <div className="rounded-lg overflow-hidden transition-transform duration-300 group-hover:-translate-y-1"
                  style={{ aspectRatio: '1 / 1', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
                  <img src={d.bildUrl} alt={d.titel}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.03]" />
                </div>
                <div className="mt-3">
                  <div className="font-heading text-[13px] font-semibold leading-snug" style={{ color: 'var(--text)' }}>{d.titel}</div>
                  <div className="text-[11px] mt-0.5" style={{ color: 'var(--text-muted)' }}>
                    {[d.stil, DATE_FORMAT.format(new Date(d.createdAt))].filter(Boolean).join(' · ')}
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {selected && <GalerieDetailOverlay design={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}
