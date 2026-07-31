'use client';
import { Star } from 'lucide-react';

// Einzige StarRating-Implementierung im Projekt. Ohne onChange reine
// Anzeige (read-only), mit onChange klickbare Buttons -- verhindert, dass
// mehrere unabhaengige Sterne-Darstellungen wieder auseinanderlaufen.
export function StarRating({ value, onChange, size = 14 }: {
  value: number;
  onChange?: (v: number) => void;
  size?: number;
}) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map(i => {
        const filled = i <= value;
        const color = filled ? 'var(--star-filled, #6B3A4B)' : 'var(--star-empty, #D4C9BC)';
        const star = <Star size={size} fill={filled ? color : 'none'} color={color} />;
        if (!onChange) return <span key={i}>{star}</span>;
        return (
          <button key={i} type="button" onClick={() => onChange(i)}
            className="cursor-pointer" aria-label={`${i} von 5 Sternen`}>
            {star}
          </button>
        );
      })}
    </div>
  );
}

export default StarRating;
