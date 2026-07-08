// Portionsrechner: skaliert die führende Zahl einer Freitext-Mengenangabe
// ("500 g", "2 EL", "½ TL", "2-3 Zwiebeln") proportional, lässt alles ohne
// erkennbare führende Zahl ("eine Prise", "nach Bedarf") unverändert.

const VULGAR_FRACTIONS: Record<string, number> = {
  '¼': 0.25, '½': 0.5, '¾': 0.75,
  '⅓': 1 / 3, '⅔': 2 / 3,
  '⅕': 0.2, '⅖': 0.4, '⅗': 0.6, '⅘': 0.8,
  '⅙': 1 / 6, '⅚': 5 / 6,
  '⅛': 0.125, '⅜': 0.375, '⅝': 0.625, '⅞': 0.875,
};
const VULGAR_CLASS = Object.keys(VULGAR_FRACTIONS).join('');

const VULGAR_RE = new RegExp(`^[${VULGAR_CLASS}]`);
const NUM_RE = /^\d+(?:[.,]\d+)?/;
const NUM_THEN_SPACE_RE = /^\d+(?:[.,]\d+)?\s?/;
const MIXED_ASCII_RE = /^(\d+)\s+(\d+)\/(\d+)/;
const ASCII_FRAC_RE = /^(\d+)\/(\d+)/;
const RANGE_SEP_RE = /^\s*(?:-|–|—|bis)\s*/i;

type QuantityMatch = { value: number; raw: string };

// Parst GENAU ein führendes Mengen-Token am Anfang von `s`. Deckt ab:
// "500", "2.5", "2,5", "½", "1½", "1 ½", "1/2", "1 1/2". Sonst null.
function parseLeadingQuantity(s: string): QuantityMatch | null {
  // Gemischte Zahl + Unicode-Bruch: "1½" / "1 ½"
  const numThenSpace = s.match(NUM_THEN_SPACE_RE);
  if (numThenSpace) {
    const rest = s.slice(numThenSpace[0].length);
    if (VULGAR_RE.test(rest)) {
      const wholeStr = numThenSpace[0].trimEnd();
      const value = parseFloat(wholeStr.replace(',', '.')) + VULGAR_FRACTIONS[rest[0]];
      return { value, raw: numThenSpace[0] + rest[0] };
    }
  }

  // Unicode-Bruch allein: "½"
  if (VULGAR_RE.test(s)) {
    return { value: VULGAR_FRACTIONS[s[0]], raw: s[0] };
  }

  // Gemischter ASCII-Bruch: "1 1/2"
  const mixedAscii = s.match(MIXED_ASCII_RE);
  if (mixedAscii) {
    const value = parseInt(mixedAscii[1], 10) + parseInt(mixedAscii[2], 10) / parseInt(mixedAscii[3], 10);
    return { value, raw: mixedAscii[0] };
  }

  // ASCII-Bruch allein: "1/2"
  const asciiOnly = s.match(ASCII_FRAC_RE);
  if (asciiOnly) {
    const value = parseInt(asciiOnly[1], 10) / parseInt(asciiOnly[2], 10);
    return { value, raw: asciiOnly[0] };
  }

  // Ganze/Dezimalzahl: "500", "2.5", "2,5"
  const plain = s.match(NUM_RE);
  if (plain) return { value: parseFloat(plain[0].replace(',', '.')), raw: plain[0] };

  return null;
}

// Rundet sinnvoll (kein "333.3333") und formatiert mit deutschem Komma.
function formatScaledNumber(n: number): string {
  const rounded = n >= 10 ? Math.round(n) : Math.round(n * 10) / 10;
  if (Number.isInteger(rounded)) return String(rounded);
  return rounded.toFixed(1).replace('.', ',');
}

export function scaleMenge(menge: string, factor: number): string {
  if (!menge || factor === 1) return menge;

  const q1 = parseLeadingQuantity(menge);
  if (!q1) return menge; // keine erkennbare Zahl am Anfang -> unverändert

  let cursor = q1.raw.length;
  let secondValue: number | null = null;

  const afterFirst = menge.slice(cursor);
  const sepMatch = afterFirst.match(RANGE_SEP_RE);
  if (sepMatch) {
    const q2 = parseLeadingQuantity(afterFirst.slice(sepMatch[0].length));
    if (q2) {
      secondValue = q2.value;
      cursor += sepMatch[0].length + q2.raw.length;
    }
  }

  const scaledPrefix = secondValue !== null
    ? `${formatScaledNumber(q1.value * factor)} - ${formatScaledNumber(secondValue * factor)}`
    : formatScaledNumber(q1.value * factor);

  return scaledPrefix + menge.slice(cursor);
}
