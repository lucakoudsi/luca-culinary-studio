// Splittet eine Freitext-Zutatenzeile ("500 g Mehl", "2 EL Zucker", "3 Eier")
// in unser {name, menge}-Modell. schema.org liefert Zutaten nie strukturiert
// getrennt, und Weg B (Text/Caption-Import) hat dasselbe Problem — beide
// nutzen denselben Splitter.
//
// Best effort: erkennt eine Einheit nur, wenn sie in der Liste unten steht.
// Kein Treffer? Die ganze Zeile bleibt als `name` erhalten, `menge` leer —
// nichts wird verworfen, nur nicht "geraten".

const UNITS = [
  'g', 'kg', 'mg', 'ml', 'l', 'cl', 'el', 'tl',
  'stk', 'stück', 'stueck', 'prise', 'prisen',
  'bund', 'bünde', 'buende', 'dose', 'dosen',
  'zehe', 'zehen', 'scheibe', 'scheiben',
  'tasse', 'tassen', 'päckchen', 'paeckchen',
  'blatt', 'blätter', 'blaetter', 'handvoll',
  'msp', 'würfel', 'wuerfel', 'glas', 'gläser', 'glaeser',
  'cup', 'cups', 'tbsp', 'tsp', 'oz', 'lb', 'lbs',
  'clove', 'cloves', 'pinch', 'can', 'cans', 'slice', 'slices',
  'gram', 'grams', 'kilogram', 'kilograms',
  'liter', 'liters', 'milliliter', 'milliliters',
];
const UNIT_SET = new Set(UNITS);

const LEADING_NUM_RE = /^(\d+(?:[.,]\d+)?(?:\s*[-–]\s*\d+(?:[.,]\d+)?)?|[¼½¾⅓⅔⅕⅖⅗⅘⅙⅚⅛⅜⅝⅞])/;

export function splitIngredientLine(line: string): { name: string; menge: string } {
  const trimmed = line.trim().replace(/^[-•*▪✓]\s*/, '');
  const numMatch = trimmed.match(LEADING_NUM_RE);
  if (!numMatch) return { name: trimmed, menge: '' };

  let cursor = numMatch[0].length;
  let menge = numMatch[0];

  const rest = trimmed.slice(cursor);
  const unitMatch = rest.match(/^\s*([a-zA-ZäöüÄÖÜ.]+)\b/);
  if (unitMatch && UNIT_SET.has(unitMatch[1].toLowerCase().replace(/\.$/, ''))) {
    menge += ' ' + unitMatch[1];
    cursor += unitMatch[0].length;
  }

  const name = trimmed.slice(cursor).trim().replace(/^,\s*/, '');
  return { name: name || trimmed, menge };
}
