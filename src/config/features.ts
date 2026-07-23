export const FEATURES = {
  AI_MENU_ENABLED: process.env.NEXT_PUBLIC_AI_MENU_ENABLED === 'true',
  AI_PLATE_ENABLED: process.env.NEXT_PUBLIC_AI_PLATE_ENABLED === 'true',
  // Kaufsperre, solange kein Gewerbe/keine Rechtstexte stehen -- siehe
  // docs/master-aufgabenliste.md ("WARNHINWEIS: KEIN GEWERBE, KEIN
  // VERKAUF"). Bewusst default aus (kein "true" in .env.local/Vercel
  // hinterlegt) -- erst scharf schalten, wenn Gewerbe + Rechtstexte stehen.
  PAYMENTS_ENABLED: process.env.NEXT_PUBLIC_PAYMENTS_ENABLED === 'true',
};
