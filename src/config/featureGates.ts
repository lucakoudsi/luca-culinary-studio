// Feature-Gating pro Abo-Stufe -- EINZIGE Quelle fuer sowohl die interne
// Rechte-Uebersicht (Admin-Tab auf /profil) als auch den oeffentlichen
// Stufenvergleich (Tab "Mein Plan" auf /profil, fuer alle Nutzer sichtbar).
// Neues Premium-Feature? Hier eine Zeile ergaenzen -- beide Ansichten
// aktualisieren sich automatisch, nichts wird doppelt gepflegt.
//
// minTier 99 markiert Admin-exklusive Funktionen (keine Abo-Stufe schaltet
// sie frei) -- der oeffentliche Stufenvergleich blendet diese Zeilen aus.
export type FeatureGate = { label: string; minTier: number };

export const FEATURE_GATES: FeatureGate[] = [
  { label: 'Dashboard',         minTier: 1 },
  { label: 'Rezepte ansehen',   minTier: 1 },
  { label: 'Zutatenbibliothek', minTier: 1 },
  { label: 'Fermentation',      minTier: 1 },
  { label: 'Projekte',          minTier: 1 },
  { label: 'Mein Stil',         minTier: 1 },
  { label: 'Wein & Pairing',    minTier: 1 },
  { label: 'Collection',        minTier: 1 },
  { label: 'KI-Sous-Chef',      minTier: 2 },
  { label: 'Menügenerator',     minTier: 2 },
  { label: 'Tellerdesigner',    minTier: 3 },
  { label: 'Titel vergeben',    minTier: 99 },
  { label: 'Nutzer verwalten',  minTier: 99 },
];
