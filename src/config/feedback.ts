// Einzige Quelle fuer Feedback-Kategorie-/Status-Labels/Farben -- genutzt vom
// Feedback-Formular und dem Admin-Pflegetab.
export type FeedbackKategorie = 'idee' | 'problem' | 'sonstiges';
export type FeedbackStatus = 'neu' | 'gesehen' | 'erledigt';

export const FEEDBACK_KATEGORIEN: FeedbackKategorie[] = ['idee', 'problem', 'sonstiges'];
export const FEEDBACK_STATUS_LIST: FeedbackStatus[] = ['neu', 'gesehen', 'erledigt'];

export const FEEDBACK_KATEGORIE_META: Record<FeedbackKategorie, { label: string }> = {
  idee:      { label: 'Idee' },
  problem:   { label: 'Problem' },
  sonstiges: { label: 'Sonstiges' },
};

// Farben fest (nicht var(--...)), gleiches Prinzip wie changelog.ts.
export const FEEDBACK_STATUS_META: Record<FeedbackStatus, { label: string; bg: string; text: string }> = {
  neu:      { label: 'Neu',      bg: 'rgba(200,136,42,0.14)', text: '#C8882A' },
  gesehen:  { label: 'Gesehen',  bg: 'rgba(90,154,168,0.14)', text: '#5A9AB4' },
  erledigt: { label: 'Erledigt', bg: 'rgba(90,154,88,0.14)',  text: '#5A9A58' },
};

export const FEEDBACK_TEXT_MAX_LENGTH = 2000;
export const FEEDBACK_RATE_LIMIT_PER_HOUR = 5;
