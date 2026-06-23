'use client';
import { Lock } from 'lucide-react';

export default function ComingSoonOverlay() {
  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 50,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(250, 248, 245, 0.85)',
        backdropFilter: 'blur(2px)',
        WebkitBackdropFilter: 'blur(2px)',
        pointerEvents: 'all',
      }}
    >
      <div style={{ textAlign: 'center', padding: '2rem' }}>
        <div style={{
          width: 80, height: 80, borderRadius: '50%',
          background: 'rgba(107,58,75,0.08)',
          border: '1px solid rgba(107,58,75,0.15)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 1.25rem',
        }}>
          <Lock size={36} style={{ color: '#6B3A4B' }} strokeWidth={1.5} />
        </div>
        <h2 style={{
          fontFamily: 'var(--font-heading, "Playfair Display", serif)',
          fontSize: 28, fontWeight: 700,
          color: '#2C2420', letterSpacing: '1px',
          marginBottom: '0.5rem',
        }}>
          Coming Soon
        </h2>
        <p style={{ fontSize: 14, color: '#8B7355', marginBottom: '0.4rem' }}>
          Diese Funktion wird bald verfügbar sein.
        </p>
        <p style={{ fontSize: 12, color: '#B09880' }}>
          KI-Funktionen werden aktiviert sobald der OpenAI Key eingerichtet ist.
        </p>
      </div>
    </div>
  );
}
