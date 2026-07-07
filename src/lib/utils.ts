import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Gold/Bordeaux Glow fuer primaere Formular-Buttons, sobald die
// Pflichtfelder ausgefuellt sind (siehe Projekte-Neu-Modal). rgb passt
// den Farbton an den jeweiligen Button an (Standard: Bordeaux).
export function submitGlow(active: boolean, rgb: string = '107,58,75'): string {
  return active ? `0 0 0 1px rgba(${rgb},0.35), 0 4px 18px rgba(${rgb},0.35)` : 'none';
}
