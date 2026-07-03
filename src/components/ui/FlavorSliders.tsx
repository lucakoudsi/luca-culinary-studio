'use client';
import type { FlavorProfile } from '@/types';

const AXES: { key: keyof FlavorProfile; label: string }[] = [
  { key: 'acidity',    label: 'Säure'       },
  { key: 'sweetness',  label: 'Süße'        },
  { key: 'bitterness', label: 'Bitterkeit'  },
  { key: 'umami',      label: 'Umami'       },
  { key: 'spiciness',  label: 'Schärfe'     },
  { key: 'saltiness',  label: 'Salzigkeit'  },
];

export interface FlavorSlidersProps {
  profile:      FlavorProfile;
  onChange:     (p: FlavorProfile) => void;
  accentColor?: string;
  labelColor?:  string;
  mutedColor?:  string;
  trackBg?:     string;
}

export function FlavorSliders({
  profile,
  onChange,
  accentColor = '#6B3A4B',
  labelColor  = '#8B7355',
  mutedColor  = '#B09880',
  trackBg     = 'rgba(0,0,0,0.1)',
}: FlavorSlidersProps) {
  return (
    <div className="grid grid-cols-2 gap-x-6 gap-y-5">
      {AXES.map(({ key, label }) => (
        <div key={key}>
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[12px] font-medium" style={{ color: labelColor }}>{label}</span>
            <span className="text-[12px] font-bold" style={{ color: accentColor }}>{profile[key]}</span>
          </div>
          <input
            type="range" min={0} max={5} step={1}
            value={profile[key]}
            onChange={e => onChange({ ...profile, [key]: Number(e.target.value) })}
            className="w-full h-1.5 rounded-full appearance-none cursor-pointer"
            style={{
              accentColor,
              background: `linear-gradient(to right, ${accentColor} ${profile[key] / 5 * 100}%, ${trackBg} 0)`,
            }}
          />
          <div className="flex justify-between mt-0.5">
            <span className="text-[10px]" style={{ color: mutedColor }}>0</span>
            <span className="text-[10px]" style={{ color: mutedColor }}>5</span>
          </div>
        </div>
      ))}
    </div>
  );
}
