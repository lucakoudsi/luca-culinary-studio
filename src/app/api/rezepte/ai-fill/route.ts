import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function POST(req: NextRequest) {
  const { hauptzutaten, stil } = await req.json();

  const prompt = `Du bist Küchenchef in einem Michelin-Sterne-Restaurant. Erstelle ein vollständiges, professionelles Rezept.

Hauptzutaten: ${hauptzutaten}
Stilrichtung: ${stil}

Antworte AUSSCHLIESSLICH mit einem gültigen JSON-Objekt (kein Markdown, kein Kommentar, kein Text außen):
{
  "title": "Kreativname des Gerichts",
  "category": "Hauptgang",
  "description": "Appetitliche Beschreibung in 2-3 Sätzen aus Küchenchef-Perspektive",
  "difficulty": "Mittel",
  "time": 45,
  "season": "Ganzjährig",
  "tags": ["Tag1", "Tag2", "Tag3", "Tag4"],
  "zutaten": [
    { "name": "Zutatname", "menge": "200g" }
  ],
  "komponenten": [
    {
      "name": "Komponentenname",
      "zutaten": [
        { "name": "Zutat", "menge": "100g" }
      ],
      "zubereitung": "Detaillierte Zubereitung dieser Komponente in 2-4 Sätzen..."
    }
  ],
  "schritte": [
    "Schritt 1: ...",
    "Schritt 2: ..."
  ],
  "getraenke": "Genaue Wein- oder Getränkeempfehlung mit Begründung...",
  "chefTipps": "Professioneller Insider-Tipp oder kreative Variation..."
}

Regeln:
- category muss EXAKT einer sein: Vorspeise, Suppe, Hauptgang, Dessert, Beilage, Snack
- difficulty muss EXAKT einer sein: Leicht, Mittel, Schwer
- season muss EXAKT einer sein: Frühling, Sommer, Herbst, Winter, Ganzjährig
- time ist eine Zahl in Minuten
- Mindestens 2-3 Komponenten wenn es ein Fine-Dining Gericht ist
- Mindestens 5-8 Zubereitungsschritte`;

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' },
      temperature: 0.85,
    });

    const data = JSON.parse(completion.choices[0].message.content!);
    return NextResponse.json(data);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unbekannter Fehler';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
