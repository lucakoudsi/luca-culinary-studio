// Zentraler Betreiber-Key fuer KI-Anfragen im Abo-Modell (docs/menuegenerator-konzept.md,
// Abschnitt 6). Ausschliesslich serverseitig verwenden -- niemals ans Frontend durchreichen
// oder loggen. Getrennt vom BYOK-System (Nutzer-Key im Profil).
export function getOperatorOpenAiKey(): string {
  const key = process.env.OPERATOR_OPENAI_KEY;
  if (!key) {
    throw new Error('OPERATOR_OPENAI_KEY ist nicht gesetzt.');
  }
  return key;
}
