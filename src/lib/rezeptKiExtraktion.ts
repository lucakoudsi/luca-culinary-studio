// Geteilte Prompt-Logik und Antwort-Validierung fuer die KI-gestuetzten
// Rezept-Importe (Text/Caption UND Bild). Beide Routen (import-ki,
// import-bild) fuellen exakt dieselben Formularfelder mit denselben Regeln --
// nur die Quelle (Text vs. Foto) und damit die Einleitung unterscheiden sich.

import { REZEPT_KATEGORIEN, REZEPT_SCHWIERIGKEITEN, REZEPT_SAISONS } from '@/config/rezeptFelder';
import type { FlavorProfile } from '@/types';

export type Zutat = { name: string; menge: string };
export type Komponente = { name: string; zutaten: Zutat[]; zubereitung: string };

export type ErkennungsQualitaet = 'gut' | 'teilweise' | 'schlecht';

export type KiRezeptResult = {
  title: string;
  description: string;
  category: string;
  difficulty: string;
  time: number;
  season: string;
  tags: string[];
  portionen: number;
  zutaten: Zutat[];
  komponenten: Komponente[];
  schritte: string[];
  getraenke: string;
  chefTipps: string;
  geschmack: FlavorProfile;
  erkennungsQualitaet: ErkennungsQualitaet;
};

/** Formular-Stand ohne die importspezifischen Felder -- der Kontext, den der KI-Sous-Chef beim Verfeinern/Korrigieren bekommt (Import UND Bearbeiten bestehender Rezepte). */
export type RezeptSnapshot = Omit<KiRezeptResult, 'erkennungsQualitaet'>;

const ERKENNUNGS_QUALITAETEN = ['gut', 'teilweise', 'schlecht'] as const;

// Der Regelblock, der fuer Text- und Bild-Import identisch gilt -- nur die
// Einleitung (INTRO) und ggf. quellenspezifische Zusatzregeln unterscheiden
// sich zwischen den beiden Routen.
const SHARED_RULES = `Bereinigung (WICHTIG):
- Ignoriere Emojis, Hashtags (#...), @-Erwähnungen und Call-to-Actions ("folgt mir", "liked das Video", "speichert euch das", "kommentiert für das Rezept"). Die gehören nicht ins Rezept.
- Normalisiere umgangssprachliche Mengen in KURZE, plain Kochangaben, z.B. "ne Handvoll Basilikum" -> menge "1 Handvoll", "ein guter Schuss Olivenöl" -> menge "2 EL", "etwas Salz" -> menge "nach Geschmack". "menge" ist IMMER nur die kurze Mengenangabe selbst (z.B. "200g", "2 EL", "1 Prise", "nach Geschmack") -- NIEMALS Erklärungen, Beispiele oder Klammerzusätze wie "(z.B. ...)" enthalten. Der Zutatenname (inkl. Zubereitungshinweis wie "gerieben") gehört ins Feld "name", nicht in "menge".
- Mengeneinheiten bei Kräutern: Verwende KEINE Tassen-Angaben ("cup", "Tasse"). Nutze stattdessen Gramm, Bund, Handvoll, EL oder TL. Rechne amerikanische Mengenangaben grundsätzlich in europäische Einheiten um (Cups -> g/ml), z.B. "1/4 cup parsley, chopped" -> menge "1 Handvoll" oder ein plausibler Gramm-Wert.

HARTE REGEL -- nichts erfinden bei Zutaten/Schritten (WICHTIGSTE REGEL, wichtiger als Vollständigkeit -- bei jedem Konflikt gewinnt diese Regel): Wenn du eine Zutat, eine Menge oder einen Schritt nicht KLAR und SICHER in der Quelle erkennen kannst, lass sie WEG. Erfinde NIEMALS Zutaten, Mengen oder Schritte, die du nicht siehst/liest -- auch nicht, weil sie "typisch" für ein Gericht mit diesem Namen wären. Dein eigenes Kochwissen darüber, wie man ein Gericht mit diesem Namen normalerweise zubereitet, ist KEINE Quelle und rechtfertigt NIEMALS das Ergänzen von Zutaten oder Schritten -- auch wenn du als erfahrene:r Koch:in ganz genau zu wissen glaubst, wie es geht. Nur der tatsächlich bereitgestellte Text bzw. die Bilder zählen als Quelle. Ein unvollständiges Rezept ist RICHTIG. Ein vollständiges, aber teilweise erfundenes Rezept ist FALSCH -- das gilt selbst dann, wenn dadurch "schritte" komplett leer bleibt, während "zutaten" gefüllt ist (oder umgekehrt). Schreibe in "chefTipps" ehrlich, was in der Quelle fehlte oder nicht lesbar war (z.B. "Keine Zubereitungsschritte in der Quelle angegeben." oder "Zutatenliste im Bild unscharf -- bitte ergänzen.") statt zu raten oder zu verwerfen.

Vollständigkeit (WICHTIG: gilt NUR für tatsächlich in der Quelle vorhandenen Inhalt -- widerspricht NIE der "nichts erfinden"-Regel oben, die IMMER Vorrang hat und im Zweifel gewinnt): Erfasse alles, was in der Quelle steht, vollständig -- lass nichts Vorhandenes versehentlich weg. Bei Komponenten: hat die Quelle für eine Komponente sowohl Zutaten als auch eine Zubereitung, müssen BEIDE ins Ergebnis, nicht nur eines davon. Fehlen im Original Koch-/Garzeiten (z.B. "Tortellini 3 Min. kochen"), übernimm sie, wenn sie dort stehen.

Komponenten (nur bei mehrteiligen Gerichten): Erkennst du mehrere eigenständige Elemente mit jeweils EIGENEN Zutaten und eigener Zubereitung (z.B. "Für die Sauce: ... Für den Belag: ..." oder klar getrennte Teile wie Basis/Füllung/Topping/Sauce), trage sie strukturiert in "komponenten" ein (je ein Objekt mit "name", "zutaten", "zubereitung"). In diesem Fall bleiben die flachen Felder "zutaten" und "schritte" leere Arrays -- alles gehört dann in die jeweilige Komponente, nicht doppelt gepflegt. Bei einem normalen, einteiligen Gericht (die meisten Fälle) bleibt "komponenten" ein leeres Array und alles steht wie gewohnt in "zutaten"/"schritte".

Fehlende Felder intelligent ableiten (nicht leer lassen), aus dem Kontext des Gerichts:
- "category": genau einer dieser sechs Werte: Vorspeise, Suppe, Hauptgang, Dessert, Beilage, Snack. Aus Zutaten/Charakter ableiten (z.B. "Ofengericht mit Kürbis" -> Hauptgang).
- "season": genau einer dieser fünf Werte: Frühling, Sommer, Herbst, Winter, Ganzjährig. Aus den Hauptzutaten ableiten (z.B. Kürbis -> Herbst), sonst Ganzjährig.
- "difficulty": genau einer dieser drei Werte: Leicht, Mittel, Schwer. Aus Anzahl/Komplexität der Schritte und Techniken schätzen.
- "time": Gesamtzeit in Minuten (Zahl), aus Anzahl und Art der Schritte plausibel schätzen, falls nicht explizit genannt.
- "portionen": Anzahl Portionen (Zahl), falls nicht genannt eine plausible Standardannahme (meist 4).
- "tags": 2-5 kurze, treffende Schlagworte (Array von Strings), aus Stil/Zutaten/Anlass abgeleitet.
- "geschmack": deine EIGENE fachliche Einschätzung des Geschmacksprofils dieses Gerichts auf 6 Achsen (Skala 0-5: acidity, sweetness, bitterness, umami, spiciness, saltiness), basierend auf deinem Kochwissen über Zutaten und Zubereitung. Das ist explizit eine Schätzung als Rückfalloption (nicht Teil der "nichts erfinden"-Regel) -- schätze so gut du als erfahrene:r Koch:in kannst, lass es nicht bei lauter Nullen.

Getränkeempfehlung ("getraenke"): Steht explizit eine Getränkeempfehlung in der Quelle, übernimm sie unverändert. Steht NICHTS dazu, darfst du selbst einen passenden Vorschlag machen (du kennst das Gericht) -- markiere ihn dann klar mit dem Präfix "Vorschlag: " (z.B. "Vorschlag: Ein trockener Riesling passt gut zur Säure der Suppe."), damit erkennbar bleibt, dass das nicht aus der Quelle stammt. Fällt dir nichts Sinnvolles ein, lass das Feld leer.

Erkennungsqualität ("erkennungs_qualitaet"): Schätze ehrlich ein, wie gut du die Quelle lesen/erkennen konntest -- "gut" (alles klar lesbar, keine Zweifel), "teilweise" (Teile unscharf/unklar, aber ein brauchbares Rezept war ableitbar), "schlecht" (große Teile nicht lesbar/erkennbar, Ergebnis ist lückenhaft). Sei hier eher zu vorsichtig als zu optimistisch -- bei "teilweise"/"schlecht" bekommt der Nutzer einen Warnhinweis und prüft bewusst nach.

Antworte AUSSCHLIESSLICH mit JSON in exakt dieser Form, keine Erklärung davor/danach:
{
  "title": string,
  "description": string,
  "category": string,
  "difficulty": string,
  "time": number,
  "season": string,
  "tags": string[],
  "portionen": number,
  "zutaten": [{ "name": string, "menge": string }],
  "komponenten": [{ "name": string, "zutaten": [{ "name": string, "menge": string }], "zubereitung": string }],
  "schritte": string[],
  "getraenke": string,
  "chefTipps": string,
  "geschmack": { "acidity": number, "sweetness": number, "bitterness": number, "umami": number, "spiciness": number, "saltiness": number },
  "gericht_bild_index": number | null,
  "erkennungs_qualitaet": "gut" | "teilweise" | "schlecht"
}
"description" ist ein kurzer, appetitlicher 1-2-Satz-Text. "chefTipps" enthält unsichere/übrige Inhalte (siehe oben) -- falls keine vorhanden, leerer String. "gericht_bild_index" ist NUR relevant, wenn dir mehrere Bilder vorliegen und eines davon das fertige Gericht zeigt (Details dazu ggf. unten) -- ansonsten (insbesondere bei reiner Text-/Caption-Quelle ohne Bilder) immer null. "erkennungs_qualitaet" ist Pflicht -- vergiss es nicht in deiner Antwort.

Verwende ausschließlich reale, tatsächlich existierende Zutaten und Begriffe. Erfinde niemals Wörter oder Fantasiebegriffe.`;

export function buildRezeptSystemPrompt(intro: string, extraRules?: string): string {
  return `${intro}\n\n${SHARED_RULES}${extraRules ? `\n\n${extraRules}` : ''}`;
}

export function isValidEnum<T extends string>(value: unknown, allowed: readonly T[]): value is T {
  return typeof value === 'string' && (allowed as readonly string[]).includes(value);
}

export function parseZutatenArray(value: unknown): Zutat[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((z): z is Record<string, unknown> => !!z && typeof z === 'object')
    .map(z => ({
      name: typeof z.name === 'string' ? z.name.trim() : '',
      menge: typeof z.menge === 'string' ? z.menge.trim() : '',
    }))
    .filter(z => z.name.length > 0);
}

export function parseKomponenten(value: unknown): Komponente[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((k): k is Record<string, unknown> => !!k && typeof k === 'object')
    .map(k => ({
      name: typeof k.name === 'string' ? k.name.trim() : '',
      zutaten: parseZutatenArray(k.zutaten),
      zubereitung: typeof k.zubereitung === 'string' ? k.zubereitung.trim() : '',
    }))
    .filter(k => k.name.length > 0 && (k.zutaten.length > 0 || k.zubereitung.length > 0));
}

function clamp05(n: unknown): number {
  const num = typeof n === 'number' && Number.isFinite(n) ? n : 0;
  return Math.max(0, Math.min(5, Math.round(num)));
}

export function parseGeschmack(value: unknown): FlavorProfile {
  const g = value && typeof value === 'object' ? (value as Record<string, unknown>) : {};
  return {
    acidity: clamp05(g.acidity),
    sweetness: clamp05(g.sweetness),
    bitterness: clamp05(g.bitterness),
    umami: clamp05(g.umami),
    spiciness: clamp05(g.spiciness),
    saltiness: clamp05(g.saltiness),
  };
}

/** Fehlende Zutaten/Zubereitung erkennt man serverseitig zuverlaessiger als per Prompt-Bitte allein -- Fallback-Netz zur Vollstaendigkeits-Regel oben. */
function buildVollstaendigkeitsWarnungen(zutaten: Zutat[], komponenten: Komponente[], schritte: string[]): string[] {
  const warnungen: string[] = [];
  if (komponenten.length > 0) {
    for (const k of komponenten) {
      if (k.zutaten.length === 0) warnungen.push(`Komponente "${k.name}": keine Zutaten erkannt -- bitte ergänzen.`);
      if (!k.zubereitung) warnungen.push(`Komponente "${k.name}": keine Zubereitung erkannt -- bitte ergänzen.`);
    }
  } else {
    if (zutaten.length > 0 && schritte.length === 0) warnungen.push('Zutaten erkannt, aber keine Zubereitungsschritte -- bitte ergänzen.');
    if (schritte.length > 0 && zutaten.length === 0) warnungen.push('Zubereitungsschritte erkannt, aber keine Zutaten -- bitte ergänzen.');
  }
  return warnungen;
}

function parseErkennungsQualitaet(value: unknown, logPrefix: string): ErkennungsQualitaet {
  if (isValidEnum(value, ERKENNUNGS_QUALITAETEN)) return value;
  console.error(`${logPrefix} erkennungs_qualitaet "${String(value)}" ungültig/fehlend, default "teilweise".`);
  return 'teilweise';
}

/** Validiert + normalisiert die rohe KI-JSON-Antwort. `null` nur bei unbrauchbarer Struktur (kein Objekt). */
export function parseKiRezeptResponse(parsed: unknown, logPrefix: string): KiRezeptResult | null {
  if (!parsed || typeof parsed !== 'object') return null;
  const r = parsed as Record<string, unknown>;

  const category = isValidEnum(r.category, REZEPT_KATEGORIEN) ? r.category : 'Hauptgang';
  const difficulty = isValidEnum(r.difficulty, REZEPT_SCHWIERIGKEITEN) ? r.difficulty : 'Mittel';
  const season = isValidEnum(r.season, REZEPT_SAISONS) ? r.season : 'Ganzjährig';

  if (r.category !== category) console.error(`${logPrefix} category "${String(r.category)}" ungültig, normalisiert zu "${category}".`);
  if (r.difficulty !== difficulty) console.error(`${logPrefix} difficulty "${String(r.difficulty)}" ungültig, normalisiert zu "${difficulty}".`);
  if (r.season !== season) console.error(`${logPrefix} season "${String(r.season)}" ungültig, normalisiert zu "${season}".`);

  const zutaten = parseZutatenArray(r.zutaten);
  const komponenten = parseKomponenten(r.komponenten);
  const schritte = Array.isArray(r.schritte) ? r.schritte.filter((s): s is string => typeof s === 'string' && s.trim().length > 0).map(s => s.trim()) : [];

  const warnungen = buildVollstaendigkeitsWarnungen(zutaten, komponenten, schritte);
  let chefTipps = typeof r.chefTipps === 'string' ? r.chefTipps.trim() : '';
  if (warnungen.length > 0) {
    console.error(`${logPrefix} Vollständigkeits-Warnung: ${warnungen.join(' | ')}`);
    chefTipps = chefTipps ? `${chefTipps}\n\n${warnungen.join(' ')}` : warnungen.join(' ');
  }

  // Verlass dich nicht allein auf die Selbsteinschaetzung der KI -- die faellt
  // erfahrungsgemaess zu gutmuetig aus, selbst wenn objektiv Teile fehlen
  // (siehe Vollstaendigkeits-Warnung oben). Ein erkanntes Loch stuft mindestens
  // auf "teilweise" herunter, damit der Warnhinweis im Frontend zuverlaessig
  // erscheint.
  let erkennungsQualitaet = parseErkennungsQualitaet(r.erkennungs_qualitaet, logPrefix);
  if (warnungen.length > 0 && erkennungsQualitaet === 'gut') {
    erkennungsQualitaet = 'teilweise';
  }

  return {
    title: typeof r.title === 'string' ? r.title.trim() : '',
    description: typeof r.description === 'string' ? r.description.trim() : '',
    category,
    difficulty,
    time: typeof r.time === 'number' && r.time > 0 ? Math.round(r.time) : 30,
    season,
    tags: Array.isArray(r.tags) ? r.tags.filter((t): t is string => typeof t === 'string' && t.trim().length > 0).map(t => t.trim()) : [],
    portionen: typeof r.portionen === 'number' && r.portionen > 0 ? Math.round(r.portionen) : 4,
    zutaten,
    komponenten,
    schritte,
    getraenke: typeof r.getraenke === 'string' ? r.getraenke.trim() : '',
    chefTipps,
    geschmack: parseGeschmack(r.geschmack),
    erkennungsQualitaet,
  };
}

/** Ist im Ergebnis irgendetwas Substanzielles angekommen, oder muessen wir "nichts erkannt" melden? */
export function isEmptyRezeptResult(result: KiRezeptResult): boolean {
  return !result.title && result.zutaten.length === 0 && result.schritte.length === 0 && result.komponenten.length === 0;
}
