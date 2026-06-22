'use client';
import { useState } from 'react';
import { X } from 'lucide-react';
import { FEATURES } from '@/config/features';

export default function AiBanner() {
  const [closed, setClosed] = useState(false);
  if (FEATURES.AI_ENABLED || closed) return null;

  return (
    <div
      className="fixed bottom-6 right-6 z-50 flex items-start gap-3 rounded-xl px-4 py-3.5 shadow-2xl"
      style={{
        background: '#141414',
        border: '1px solid rgba(201,168,76,0.35)',
        maxWidth: 260,
      }}
    >
      <span style={{ color: '#C9A84C', fontSize: 16, lineHeight: 1, marginTop: 2 }}>⚠</span>
      <div className="flex-1">
        <p className="text-[12px] font-semibold" style={{ color: '#C9A84C' }}>KI-Funktionen</p>
        <p className="text-[11px] mt-0.5 leading-snug" style={{ color: 'rgba(168,152,128,0.75)' }}>
          OpenAI API Key wird bald eingerichtet
        </p>
      </div>
      <button
        onClick={() => setClosed(true)}
        className="flex-shrink-0 mt-0.5 text-text-muted hover:text-text-secondary transition-colors"
      >
        <X size={14} />
      </button>
    </div>
  );
}
