// Kompositions-Fokus fuer den Tellerdesigner -- steuert, wie die Elemente auf
// dem Teller angeordnet werden (Blickfuehrung), unabhaengig von Stilrichtung
// (tellerStilrichtung.ts, welche Aesthetik) und Aufwandsstufe (Komplexitaet).
export const ANRICHTE_FOKUSSE = [
  'zutat_im_fokus',
  'symmetrie',
  'kreativ',
  'farbe_kontrast',
] as const;

export type AnrichteFokus = typeof ANRICHTE_FOKUSSE[number];

export const ANRICHTE_FOKUS_LABEL: Record<AnrichteFokus, string> = {
  zutat_im_fokus: 'Zutat im Fokus',
  symmetrie: 'Symmetrie',
  kreativ: 'Kreativ',
  farbe_kontrast: 'Farbe & Kontrast',
};

// Fliesst in Bild-Prompt UND Techniken-System-Prompt.
export const ANRICHTE_FOKUS_PROMPT: Record<AnrichteFokus, string> = {
  zutat_im_fokus: 'Die Hauptzutat steht klar im Zentrum, alles andere ordnet sich ihr unter (Höhe, Platzierung, Blickführung).',
  symmetrie: 'Streng symmetrischer Aufbau, gespiegelte oder radial wiederholte Elemente.',
  kreativ: 'Ungewöhnliche, überraschende Anordnung -- bewusster Bruch mit klassischen Mustern, verspielte Asymmetrie.',
  farbe_kontrast: 'Bewusst kontrastierende Farben und Texturen als Hauptgestaltungsmittel, kräftige Akzente.',
};

export const DEFAULT_ANRICHTE_FOKUS: AnrichteFokus = 'zutat_im_fokus';
