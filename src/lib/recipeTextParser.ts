// Weg B (Text/Caption-Import): rein heuristisch, ohne KI, best effort.
// Erst Header-Erkennung ("Zutaten:"/"Zubereitung:"), sonst zeilenweise
// Bullet-/Nummer-/Satzlaenge-Heuristik. Alles, was nicht sicher zuordenbar
// ist, landet gesammelt in `unsicher` statt verworfen zu werden — der
// Aufrufer haengt das an ein Freitextfeld (Chef-Tipps) an.

import { splitIngredientLine } from './ingredientParse';

export type ParsedRecipeText = {
  title: string;
  zutaten: { name: string; menge: string }[];
  schritte: string[];
  unsicher: string[];
};

const ZUTATEN_HEADER_RE = /^(zutaten|ingredients?)\s*(f[uü]r\s+.+)?:?\s*$/i;
const SCHRITTE_HEADER_RE = /^(zubereitung|anleitung|instructions?|steps?|schritte|directions?|methode?)\s*:?\s*$/i;
const HASHTAG_ONLY_RE = /^(\s*[#@]\S+\s*)+$/;
const BULLET_RE = /^[-•*▪✓○●▫️✅✔️➤➡️]+\s*/;
const STEP_NUM_RE = /^\d+[.)]\s*/;
// Keycap-Emoji-Nummerierung (1️⃣ 2️⃣ ...) enthaelt intern eine echte ASCII-Ziffer
// (Ziffer + optionaler Variationsselektor + Kombinationszeichen) -- sonst
// wuerde sie faelschlich als Mengenangabe erkannt statt als Schritt-Marker.
const KEYCAP_NUM_RE = /^[0-9]️?⃣\s*/;
const LEADING_NUM_RE = /^(\d+(?:[.,]\d+)?(?:\s*[-–]\s*\d+(?:[.,]\d+)?)?|[¼½¾⅓⅔⅕⅖⅗⅘⅙⅚⅛⅜⅝⅞])/;

function looksLikeIngredient(line: string): boolean {
  return LEADING_NUM_RE.test(line.replace(BULLET_RE, ''));
}

function looksLikeStep(line: string): boolean {
  if (STEP_NUM_RE.test(line) || KEYCAP_NUM_RE.test(line)) return true;
  return line.length > 25 && /[.!?]$/.test(line);
}

function cleanLine(line: string): string {
  return line.replace(STEP_NUM_RE, '').replace(KEYCAP_NUM_RE, '').replace(BULLET_RE, '').trim();
}

export function parseRecipeText(raw: string): ParsedRecipeText {
  const lines = raw
    .split(/\r?\n/)
    .map(l => l.trim())
    .filter(l => l.length > 0 && !HASHTAG_ONLY_RE.test(l));

  if (lines.length === 0) {
    return { title: '', zutaten: [], schritte: [], unsicher: [] };
  }

  const zutatenHeaderIdx = lines.findIndex(l => ZUTATEN_HEADER_RE.test(l));
  const schritteHeaderIdx = lines.findIndex(
    (l, i) => SCHRITTE_HEADER_RE.test(l) && (zutatenHeaderIdx === -1 || i > zutatenHeaderIdx),
  );

  const zutatenLines: string[] = [];
  const schritteLines: string[] = [];
  const unsicher: string[] = [];
  let title = '';

  if (zutatenHeaderIdx !== -1) {
    // Header gefunden -> sauberer Zonen-Split
    const preHeader = lines.slice(0, zutatenHeaderIdx);
    if (preHeader.length > 0 && preHeader[0].length < 80) title = preHeader[0];
    unsicher.push(...preHeader.slice(title ? 1 : 0));

    if (schritteHeaderIdx !== -1) {
      zutatenLines.push(...lines.slice(zutatenHeaderIdx + 1, schritteHeaderIdx));
      schritteLines.push(...lines.slice(schritteHeaderIdx + 1));
    } else {
      // Kein expliziter Schritte-Header -> Umschaltpunkt per Heuristik
      const rest = lines.slice(zutatenHeaderIdx + 1);
      let switchIdx = rest.findIndex(l => looksLikeStep(l) && !looksLikeIngredient(l));
      if (switchIdx === -1) switchIdx = rest.length;
      zutatenLines.push(...rest.slice(0, switchIdx));
      schritteLines.push(...rest.slice(switchIdx));
    }
  } else {
    // Kein Header -> zeilenweise klassifizieren
    let rest = lines;
    const first = lines[0];
    if (first.length < 80 && !looksLikeIngredient(first) && !looksLikeStep(first)) {
      title = first;
      rest = lines.slice(1);
    }

    for (const line of rest) {
      // Schritt-Pruefung zuerst: ein Keycap-/ASCII-Nummern-Marker ("1️⃣", "1.")
      // ist ein staerkeres Signal als eine zufaellig fuehrende Ziffer.
      if (looksLikeStep(line)) schritteLines.push(line);
      else if (looksLikeIngredient(line)) zutatenLines.push(line);
      else unsicher.push(line);
    }
  }

  return {
    title,
    zutaten: zutatenLines.map(l => splitIngredientLine(cleanLine(l))),
    schritte: schritteLines.map(cleanLine).filter(Boolean),
    unsicher,
  };
}
