import { NextRequest, NextResponse } from 'next/server';
import { requireTier } from '@/lib/apiAuth';
import { checkRateLimit } from '@/lib/rate-limit';
import { getOperatorOpenAiKey } from '@/lib/operator-key';
import { REZEPT_KATEGORIEN, REZEPT_SCHWIERIGKEITEN, REZEPT_SAISONS } from '@/config/rezeptFelder';
import type { FlavorProfile } from '@/types';

export const dynamic = 'force-dynamic';

const MAX_TEXT_LENGTH = 8000; // Captions sind normalerweise deutlich kuerzer -- grosszuegige Sicherheitsgrenze

type Zutat = { name: string; menge: string };
type Komponente = { name: string; zutaten: Zutat[]; zubereitung: string };

type KiImportResult = {
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
};

function isValidEnum<T extends string>(value: unknown, allowed: readonly T[]): value is T {
  return typeof value === 'string' && (allowed as readonly string[]).includes(value);
}

function parseZutatenArray(value: unknown): Zutat[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((z): z is Record<string, unknown> => !!z && typeof z === 'object')
    .map(z => ({
      name: typeof z.name === 'string' ? z.name.trim() : '',
      menge: typeof z.menge === 'string' ? z.menge.trim() : '',
    }))
    .filter(z => z.name.length > 0);
}

function parseKomponenten(value: unknown): Komponente[] {
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

function parseGeschmack(value: unknown): FlavorProfile {
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

const SYSTEM_PROMPT = `Du extrahierst Rezepte aus Social-Media-Captions (Instagram/TikTok) oder kopiertem Rezepttext für LUCA Culinary Studio.

Der Nutzer gibt dir einen rohen Text -- oft eine ungeordnete Caption mit Emojis, Hashtags, Call-to-Actions ("folgt mir für mehr!", "speichert euch das ab!") und locker formulierten Mengenangaben. Extrahiere daraus ein strukturiertes Rezept.

Bereinigung (WICHTIG):
- Ignoriere Emojis, Hashtags (#...), @-Erwähnungen und Call-to-Actions ("folgt mir", "liked das Video", "speichert euch das", "kommentiert für das Rezept"). Die gehören nicht ins Rezept.
- Normalisiere umgangssprachliche Mengen in KURZE, plain Kochangaben, z.B. "ne Handvoll Basilikum" -> menge "1 Handvoll", "ein guter Schuss Olivenöl" -> menge "2 EL", "etwas Salz" -> menge "nach Geschmack". "menge" ist IMMER nur die kurze Mengenangabe selbst (z.B. "200g", "2 EL", "1 Prise", "nach Geschmack") -- NIEMALS Erklärungen, Beispiele oder Klammerzusätze wie "(z.B. ...)" enthalten. Der Zutatenname (inkl. Zubereitungshinweis wie "gerieben") gehört ins Feld "name", nicht in "menge".

HARTE REGEL -- nichts erfinden bei Zutaten/Schritten: Zutaten und Zubereitungsschritte MÜSSEN aus dem Text stammen (ggf. umformuliert/normalisiert). Erfinde keine Zutat und keinen Schritt, der im Text nicht vorkommt oder eindeutig impliziert ist. Textteile, die relevant wirken, sich aber nicht sicher zuordnen lassen, sammle im Feld "chefTipps" statt sie zu verwerfen oder zu erfinden.

Komponenten (nur bei mehrteiligen Gerichten): Erkennt der Text mehrere eigenständige Elemente mit jeweils EIGENEN Zutaten und eigener Zubereitung (z.B. "Für die Sauce: ... Für den Belag: ..." oder klar getrennte Teile wie Basis/Füllung/Topping/Sauce), trage sie strukturiert in "komponenten" ein (je ein Objekt mit "name", "zutaten", "zubereitung"). In diesem Fall bleiben die flachen Felder "zutaten" und "schritte" leere Arrays -- alles gehört dann in die jeweilige Komponente, nicht doppelt gepflegt. Bei einem normalen, einteiligen Gericht (die meisten Fälle) bleibt "komponenten" ein leeres Array und alles steht wie gewohnt in "zutaten"/"schritte".

Fehlende Felder intelligent ableiten (nicht leer lassen), aus dem Kontext des Gerichts:
- "category": genau einer dieser sechs Werte: Vorspeise, Suppe, Hauptgang, Dessert, Beilage, Snack. Aus Zutaten/Charakter ableiten (z.B. "Ofengericht mit Kürbis" -> Hauptgang).
- "season": genau einer dieser fünf Werte: Frühling, Sommer, Herbst, Winter, Ganzjährig. Aus den Hauptzutaten ableiten (z.B. Kürbis -> Herbst), sonst Ganzjährig.
- "difficulty": genau einer dieser drei Werte: Leicht, Mittel, Schwer. Aus Anzahl/Komplexität der Schritte und Techniken schätzen.
- "time": Gesamtzeit in Minuten (Zahl), aus Anzahl und Art der Schritte plausibel schätzen, falls nicht explizit genannt.
- "portionen": Anzahl Portionen (Zahl), falls nicht genannt eine plausible Standardannahme (meist 4).
- "tags": 2-5 kurze, treffende Schlagworte (Array von Strings), aus Stil/Zutaten/Anlass abgeleitet.
- "geschmack": deine EIGENE fachliche Einschätzung des Geschmacksprofils dieses Gerichts auf 6 Achsen (Skala 0-5: acidity, sweetness, bitterness, umami, spiciness, saltiness), basierend auf deinem Kochwissen über Zutaten und Zubereitung. Das ist explizit eine Schätzung als Rückfalloption (nicht Teil der "nichts erfinden"-Regel) -- schätze so gut du als erfahrene:r Koch:in kannst, lass es nicht bei lauter Nullen.

Getränkeempfehlung ("getraenke"): Steht im Text explizit eine Getränkeempfehlung, übernimm sie unverändert. Steht NICHTS dazu im Text, darfst du selbst einen passenden Vorschlag machen (du kennst das Gericht) -- markiere ihn dann klar mit dem Präfix "Vorschlag: " (z.B. "Vorschlag: Ein trockener Riesling passt gut zur Säure der Suppe."), damit erkennbar bleibt, dass das nicht aus dem Originaltext stammt. Fällt dir nichts Sinnvolles ein, lass das Feld leer.

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
  "geschmack": { "acidity": number, "sweetness": number, "bitterness": number, "umami": number, "spiciness": number, "saltiness": number }
}
"description" ist ein kurzer, appetitlicher 1-2-Satz-Text (aus der Caption destilliert oder neutral zusammengefasst, falls die Caption keine brauchbare Beschreibung enthält). "chefTipps" enthält unsichere/übrige Textteile (siehe oben) -- falls keine vorhanden, leerer String.

Verwende ausschließlich reale, tatsächlich existierende Zutaten und Begriffe. Erfinde niemals Wörter oder Fantasiebegriffe.`;

export async function POST(req: NextRequest) {
  const check = await requireTier(req, 1);
  if (!check.ok) return check.response;
  const { user } = check;

  const rateLimit = await checkRateLimit(user.id);
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: `rate_limit_${rateLimit.reason}`, message: rateLimit.message },
      { status: 429 },
    );
  }

  let body: { text?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Ungültige Anfrage.' }, { status: 400 });
  }
  const text = typeof body.text === 'string' ? body.text.trim() : '';
  if (!text) {
    return NextResponse.json({ error: 'Kein Text angegeben.' }, { status: 400 });
  }
  if (text.length > MAX_TEXT_LENGTH) {
    return NextResponse.json({ error: `Text ist zu lang (max. ${MAX_TEXT_LENGTH} Zeichen).` }, { status: 400 });
  }

  let apiKey: string;
  try {
    apiKey = getOperatorOpenAiKey();
  } catch (e) {
    console.error('[import-ki] Betreiber-Key fehlt:', e instanceof Error ? e.message : e);
    return NextResponse.json({ error: 'Der KI-Import ist aktuell nicht verfügbar.' }, { status: 500 });
  }

  let upstream: Response;
  try {
    upstream = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        temperature: 0.4, // Extraktion, nicht Kreativitaet -- bewusst niedrig
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: text },
        ],
      }),
    });
  } catch (e) {
    console.error('[import-ki] Verbindung zu OpenAI fehlgeschlagen:', e instanceof Error ? e.message : e);
    return NextResponse.json({ error: 'Verbindung zur KI fehlgeschlagen.' }, { status: 502 });
  }

  if (!upstream.ok) {
    const errText = await upstream.text().catch(() => '');
    console.error('[import-ki] OpenAI-Fehler:', upstream.status, errText.slice(0, 300));
    if (upstream.status === 429) {
      return NextResponse.json({ error: 'Anbieter-Limit erreicht. Bitte kurz warten und erneut versuchen.' }, { status: 429 });
    }
    return NextResponse.json({ error: 'Fehler bei der Rezept-Analyse.' }, { status: 502 });
  }

  const upstreamData = await upstream.json();
  const raw: string | undefined = upstreamData.choices?.[0]?.message?.content;

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw ?? '');
  } catch {
    console.error('[import-ki] KI-Antwort war kein gültiges JSON.');
    return NextResponse.json({ error: 'Die KI-Antwort konnte nicht verarbeitet werden. Bitte erneut versuchen.' }, { status: 502 });
  }

  if (!parsed || typeof parsed !== 'object') {
    console.error('[import-ki] KI-Antwort hat unerwartete Struktur.');
    return NextResponse.json({ error: 'Die KI-Antwort hatte eine unerwartete Struktur. Bitte erneut versuchen.' }, { status: 502 });
  }

  const r = parsed as Record<string, unknown>;

  const category = isValidEnum(r.category, REZEPT_KATEGORIEN) ? r.category : 'Hauptgang';
  const difficulty = isValidEnum(r.difficulty, REZEPT_SCHWIERIGKEITEN) ? r.difficulty : 'Mittel';
  const season = isValidEnum(r.season, REZEPT_SAISONS) ? r.season : 'Ganzjährig';

  if (r.category !== category) console.error(`[import-ki] category "${String(r.category)}" ungültig, normalisiert zu "${category}".`);
  if (r.difficulty !== difficulty) console.error(`[import-ki] difficulty "${String(r.difficulty)}" ungültig, normalisiert zu "${difficulty}".`);
  if (r.season !== season) console.error(`[import-ki] season "${String(r.season)}" ungültig, normalisiert zu "${season}".`);

  const result: KiImportResult = {
    title: typeof r.title === 'string' ? r.title.trim() : '',
    description: typeof r.description === 'string' ? r.description.trim() : '',
    category,
    difficulty,
    time: typeof r.time === 'number' && r.time > 0 ? Math.round(r.time) : 30,
    season,
    tags: Array.isArray(r.tags) ? r.tags.filter((t): t is string => typeof t === 'string' && t.trim().length > 0).map(t => t.trim()) : [],
    portionen: typeof r.portionen === 'number' && r.portionen > 0 ? Math.round(r.portionen) : 4,
    zutaten: parseZutatenArray(r.zutaten),
    komponenten: parseKomponenten(r.komponenten),
    schritte: Array.isArray(r.schritte) ? r.schritte.filter((s): s is string => typeof s === 'string' && s.trim().length > 0).map(s => s.trim()) : [],
    getraenke: typeof r.getraenke === 'string' ? r.getraenke.trim() : '',
    chefTipps: typeof r.chefTipps === 'string' ? r.chefTipps.trim() : '',
    geschmack: parseGeschmack(r.geschmack),
  };

  if (!result.title && result.zutaten.length === 0 && result.schritte.length === 0 && result.komponenten.length === 0) {
    return NextResponse.json(
      { found: false, error: 'nichts_erkannt', message: 'Konnte in diesem Text kein Rezept erkennen.' },
      { status: 422 },
    );
  }

  return NextResponse.json({ found: true, recipe: result });
}
