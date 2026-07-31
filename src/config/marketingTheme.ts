// Feste dunkle Palette fuer die oeffentliche Marketing-Seite (/, /features,
// /studio, /preise, /ueber-uns) -- bewusst NICHT theme-adaptiv (kein
// var(--text) usw.), weil der Look laut Vorgabe immer dunkel bleibt,
// unabhaengig vom App-Theme-Toggle des Besuchers. Werte sind identisch zu
// den bestehenden Dark-Mode-Tokens in globals.css (:root[data-theme="dark"]),
// hier nur als Konstanten, damit var(--text) im Light-Mode nicht faelschlich
// dunkelbraun auf diesem schwarzen Hintergrund rendern wuerde.
export const MARKETING_BG = '#0A0A0A';
export const MARKETING_SURFACE = '#1A1A1A';
export const MARKETING_SURFACE_2 = '#2A2420';
export const MARKETING_BORDER = '#2A2A2A';
export const MARKETING_CREAM = '#F5F0E8';
export const MARKETING_CREAM_MUTED = '#A89880';
export const MARKETING_GOLD = '#E8C67A';
export const MARKETING_GOLD_DEEP = '#C9A84C';
export const MARKETING_BORDEAUX = '#6B3A4B';
export const MARKETING_BORDEAUX_LIGHT = '#7D4558';
