// Generische Technik-Taxonomie fuer den Menuegenerator-Aufwand-Regler
// (docs/menuegenerator-konzept.md). Bewusst UNABHAENGIG vom Zutatenstammbaum
// (src/lib/stammbaum/*) -- der deckt nur 6 von 500 Zutaten ab und ist fuer
// eine Kopplung an den Aufwand-Regler der falsche Hebel. Kumulativ aufgebaut:
// jede hoehere Stufe enthaelt alle Techniken der niedrigeren Stufen plus eigene.

export type Aufwandsstufe = 'bistro' | 'gehoben' | 'fine_dining';
export const AUFWANDSSTUFEN: readonly Aufwandsstufe[] = ['bistro', 'gehoben', 'fine_dining'];

const BISTRO_TECHNIKEN = [
  'roh', 'kochen', 'braten', 'backen', 'schmoren', 'grillen',
  'frittieren', 'dämpfen', 'pürieren', 'fermentieren', 'einlegen',
];

// Was gegenueber der jeweils niedrigeren Stufe neu dazukommt -- getrennt
// gehalten, damit der Prompt formulieren kann "davon MUSS mindestens X
// tatsaechlich benutzt werden", nicht nur "ist erlaubt".
const GEHOBEN_ZUSATZ = [
  'pochieren', 'beizen', 'räuchern', 'glasieren', 'emulgieren',
  'blanchieren', 'karamellisieren',
];

const FINE_DINING_ZUSATZ = [
  'konfieren', 'sous-vide', 'espuma/schaum', 'gel/sphärifizieren',
  'dehydrieren', 'kryo/stickstoff', 'geräucherte öle', 'aschen/kohle',
];

const GEHOBEN_TECHNIKEN = [...BISTRO_TECHNIKEN, ...GEHOBEN_ZUSATZ];
const FINE_DINING_TECHNIKEN = [...GEHOBEN_TECHNIKEN, ...FINE_DINING_ZUSATZ];

export const TECHNIKEN_NACH_AUFWAND: Record<Aufwandsstufe, string[]> = {
  bistro: BISTRO_TECHNIKEN,
  gehoben: GEHOBEN_TECHNIKEN,
  fine_dining: FINE_DINING_TECHNIKEN,
};

// Nur die auf dieser Stufe neu hinzukommenden Techniken -- Basis fuer die
// "muss aktiv genutzt werden"-Pflicht im Prompt (bistro hat keine, da
// unterste Stufe).
export const ZUSATZ_TECHNIKEN_NACH_AUFWAND: Record<Aufwandsstufe, string[]> = {
  bistro: [],
  gehoben: GEHOBEN_ZUSATZ,
  fine_dining: FINE_DINING_ZUSATZ,
};

// Trotz enger Prompt-Vorgabe weicht die KI gelegentlich auf eine naheliegende
// Variante/Konjugation statt des exakten Listenbegriffs aus (beobachtet:
// "marinieren" statt "einlegen", "gebraten" statt "braten"). Serverseitiges
// Sicherheitsnetz: bekannte Varianten auf den kanonischen Begriff mappen.
const TECHNIK_SYNONYME: Record<string, string> = {
  mariniert: 'einlegen',
  marinieren: 'einlegen',
  eingelegt: 'einlegen',
  gekocht: 'kochen',
  gegart: 'kochen',
  gebraten: 'braten',
  angebraten: 'braten',
  gebacken: 'backen',
  geschmort: 'schmoren',
  gegrillt: 'grillen',
  frittiert: 'frittieren',
  gedaempft: 'dämpfen',
  gedämpft: 'dämpfen',
  puriert: 'pürieren',
  püriert: 'pürieren',
  fermentiert: 'fermentieren',
  pochiert: 'pochieren',
  gebeizt: 'beizen',
  geraeuchert: 'räuchern',
  geräuchert: 'räuchern',
  glasiert: 'glasieren',
  glacieren: 'glasieren',
  glaciert: 'glasieren',
  emulgiert: 'emulgieren',
  blanchiert: 'blanchieren',
  karamellisiert: 'karamellisieren',
  konfiert: 'konfieren',
  dehydriert: 'dehydrieren',
  gefroren: 'kryo/stickstoff',
  frieren: 'kryo/stickstoff',
  eingefroren: 'kryo/stickstoff',
  espuma: 'espuma/schaum',
  schaum: 'espuma/schaum',
  sphaerifiziert: 'gel/sphärifizieren',
  sphärifiziert: 'gel/sphärifizieren',
  sphaerifizieren: 'gel/sphärifizieren',
  sphärifizieren: 'gel/sphärifizieren',
};

// Universeller Fallback, falls weder exakter Treffer noch Synonym in der
// erlaubten Liste der gewaehlten Stufe landen -- "kochen" ist Mitglied aller
// drei Stufen, also immer gueltig.
const SICHERER_FALLBACK = 'kochen';

export function normalisiereTechnik(technik: string | undefined | null, erlaubt: string[]): string {
  const t = (technik ?? '').trim().toLowerCase();
  if (erlaubt.includes(t)) return t;
  const synonym = TECHNIK_SYNONYME[t];
  if (synonym && erlaubt.includes(synonym)) return synonym;
  return SICHERER_FALLBACK;
}
