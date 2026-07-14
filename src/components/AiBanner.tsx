'use client';
import { useState } from 'react';
import { X } from 'lucide-react';
import { FEATURES } from '@/config/features';

export default function AiBanner() {
  const [closed, setClosed] = useState(false);
  const alleAiFeaturesAktiv = FEATURES.AI_MENU_ENABLED && FEATURES.AI_LAB_ENABLED && FEATURES.AI_PLATE_ENABLED;
  if (alleAiFeaturesAktiv || closed) return null;

  return (
    <div
      className="fixed bottom-6 right-6 z-50 flex items-start gap-3 rounded-xl px-4 py-3.5 shadow-lg"
      style={{
        background: 'var(--surface)',
        border: '1px solid rgba(107,58,75,0.3)',
        maxWidth: 260,
        boxShadow: '0 4px 20px rgba(107,58,75,0.1)',
      }}
    >
      <span style={{ color: '#6B3A4B', fontSize: 16, lineHeight: 1, marginTop: 2 }}>⚠</span>
      <div className="flex-1">
        <p className="text-[12px] font-semibold" style={{ color: '#6B3A4B' }}>KI-Funktionen</p>
        <p className="text-[11px] mt-0.5 leading-snug" style={{ color: 'var(--text-muted)' }}>
          OpenAI API Key wird bald eingerichtet
        </p>
      </div>
      <button
        onClick={() => setClosed(true)}
        className="flex-shrink-0 mt-0.5 transition-colors"
        style={{ color: 'var(--text-muted)' }}
        onMouseEnter={e => (e.currentTarget as HTMLButtonElement).style.color = '#6B3A4B'}
        onMouseLeave={e => (e.currentTarget as HTMLButtonElement).style.color = '#B09880'}
      >
        <X size={14} />
      </button>
    </div>
  );
}
