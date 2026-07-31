// Einzige Quelle fuer Changelog-Kategorie-Labels/Farben -- genutzt vom
// Glockchen-Panel, /neuigkeiten und dem Admin-Pflegetab, damit nichts
// doppelt gepflegt wird (gleiches Prinzip wie featureGates.ts).
//
// Farben sind bewusst feste Werte (nicht var(--...)), analog zu
// success/warning/danger/info in tailwind.config.js und TIER_COLOR in
// profil/page.tsx -- muessen auf hellem UND dunklem Kartenhintergrund lesbar
// bleiben, statt sich ans Theme anzupassen.
export type ChangelogKategorie = 'neu' | 'verbessert' | 'behoben';

export const CHANGELOG_KATEGORIEN: ChangelogKategorie[] = ['neu', 'verbessert', 'behoben'];

export const CHANGELOG_KATEGORIE_META: Record<ChangelogKategorie, { label: string; bg: string; text: string }> = {
  neu:        { label: 'Neu',        bg: 'rgba(90,154,168,0.14)', text: '#5A9AB4' },
  verbessert: { label: 'Verbessert', bg: 'rgba(90,154,88,0.14)',  text: '#5A9A58' },
  behoben:    { label: 'Behoben',    bg: 'rgba(200,136,42,0.14)', text: '#C8882A' },
};
