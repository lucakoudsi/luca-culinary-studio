'use client';

import { useState, useRef, useCallback } from 'react';
import { ImagePlus, X, Loader2 } from 'lucide-react';

interface PhotoZoneProps {
  preview: string | null;
  onFile: (file: File) => void;
  onClear: () => void;
  uploading?: boolean;
  error?: string | null;
}

export default function PhotoZone({ preview, onFile, onClear, uploading = false, error }: PhotoZoneProps) {
  const [dragging, setDragging] = useState(false);
  const ref = useRef<HTMLInputElement>(null);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) onFile(file);
  }, [onFile]);

  return (
    <div>
      <div
        onDragOver={e => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        onClick={() => !uploading && ref.current?.click()}
        className="relative w-full h-[220px] rounded-2xl overflow-hidden transition-all"
        style={{
          cursor: uploading ? 'default' : 'pointer',
          border: dragging
            ? '2px dashed rgba(107,58,75,0.6)'
            : preview ? 'none' : '2px dashed var(--border)',
          background: preview ? undefined : dragging ? 'rgba(107,58,75,0.04)' : 'var(--surface-2)',
        }}
      >
        {preview ? (
          <>
            <img src={preview} alt="Vorschau" className="w-full h-full object-cover" />
            {uploading ? (
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                <Loader2 size={28} className="animate-spin text-white" />
              </div>
            ) : (
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                <div className="flex items-center gap-2 bg-black/70 px-4 py-2 rounded-lg text-white text-sm">
                  <ImagePlus size={16} /> Foto ändern
                </div>
              </div>
            )}
            {!uploading && (
              <button
                type="button"
                onClick={e => { e.stopPropagation(); onClear(); }}
                className="absolute top-2 right-2 rounded-full p-1.5 transition-opacity hover:opacity-80"
                style={{ background: 'rgba(0,0,0,0.55)', border: '1px solid rgba(255,255,255,0.25)' }}
              >
                <X size={13} color="white" />
              </button>
            )}
          </>
        ) : (
          <div className="flex flex-col items-center justify-center h-full gap-3">
            {uploading ? (
              <Loader2 size={28} className="animate-spin" style={{ color: '#6B3A4B' }} />
            ) : (
              <>
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center"
                  style={{ background: 'rgba(107,58,75,0.07)', border: '1px solid rgba(107,58,75,0.2)' }}>
                  <ImagePlus size={24} color="#6B3A4B" />
                </div>
                <div className="text-center">
                  <p className="text-[14px] font-medium" style={{ color: 'var(--text)' }}>Foto hochladen</p>
                  <p className="text-[12px] mt-0.5" style={{ color: 'var(--text-muted)' }}>Hierher ziehen oder klicken · JPG, PNG, WebP</p>
                </div>
              </>
            )}
          </div>
        )}
        <input
          ref={ref}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={e => { const f = e.target.files?.[0]; if (f) onFile(f); e.target.value = ''; }}
        />
      </div>

      {error && (
        <div className="mt-2 flex items-start gap-2 px-3 py-2 rounded-lg text-[12px]"
          style={{ background: 'rgba(192,80,80,0.08)', border: '1px solid rgba(192,80,80,0.2)', color: '#C05050' }}>
          <span className="mt-0.5 flex-shrink-0">⚠</span>
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}
