import { NextRequest, NextResponse } from 'next/server';
import { requireTier } from '@/lib/apiAuth';
import { checkRateLimit } from '@/lib/rate-limit';
import { getOperatorOpenAiKey } from '@/lib/operator-key';
import { REZEPT_KATEGORIEN, REZEPT_SCHWIERIGKEITEN, REZEPT_SAISONS } from '@/config/rezeptFelder';
import { isValidEnum, parseZutatenArray, parseKomponenten, parseGeschmack, type RezeptSnapshot } from '@/lib/rezeptKiExtraktion';
import { fetchWithTimeout, UpstreamTimeoutError } from '@/lib/upstreamTimeout';

export const dynamic = 'force-dynamic';
export const maxDuration = 30; // einzelner Dialog-Turn, kein Vollrezept-Neugenerieren

type ChatMessage = { role: 'user' | 'assistant'; content: string };

const MIN_TIER = 2; // Basic -- laeuft ueber den Betreiber-Key, siehe docs/abo-konzept.md Abschnitt 2a
const MAX_PAYLOAD_CHARS = 30000;
const MAX_MESSAGES = 40;
const UPSTREAM_TIMEOUT_MS = 24_000; // etwas unter maxDuration, damit wir noch selbst antworten koennen

const SYSTEM_PROMPT = `Du bist der KI-Sous-Chef von LUCA Culinary Studio. Der Nutzer hat gerade ein Rezept per KI importiert (aus Text oder Bildern) und möchte es jetzt im Dialog mit dir korrigieren und verfeinern, bevor er es speichert.

Du bekommst mit jeder Nachricht den AKTUELLEN Stand aller Formularfelder als JSON mitgeliefert (title, description, category, difficulty, time, season, tags, portionen, zutaten, komponenten, schritte, getraenke, chefTipps, geschmack) sowie die bisherige Chat-Historie.

WICHTIGSTE REGEL -- nur ändern, was gemeint ist: Ändere AUSSCHLIESSLICH die Felder, die von der aktuellen Anweisung des Nutzers betroffen sind. Generiere NIEMALS das ganze Rezept neu. Felder, die nicht gemeint sind, bleiben exakt so, wie sie sind -- gib sie in "updatedFields" gar nicht erst zurück.

Wenn du ein Array-Feld zurückgibst (zutaten, komponenten, schritte, tags), muss es die VOLLSTÄNDIGE aktualisierte Liste sein, nicht nur der geänderte Eintrag -- übernimm alle unveränderten Einträge unverändert mit.

NICHTS ERFINDEN (wie beim Import): Ergänze oder verändere nur, was der Nutzer explizit sagt oder eindeutig meint. Fehlt dir eine Information, die du nicht wissen kannst (z.B. "wie lange soll das köcheln?", wenn das nirgends steht), FRAGE NACH statt zu raten -- antworte dann nur mit "reply" (eine kurze Rückfrage) und "updatedFields": {}.
AUSNAHME: Bittet der Nutzer dich AUSDRÜCKLICH, dein Kochwissen einzubringen (z.B. "ergänze die üblichen Schritte für Kartoffelpüree", "was fehlt hier normalerweise noch?", "schreib eine passende Beschreibung"), darfst und sollst du das tun -- das ist dann ausdrücklich gewollt und keine Regelverletzung.

Mengen/Portionen skalieren: Bittet der Nutzer um eine andere Portionszahl (z.B. "für 2 statt 4 Personen"), skaliere ALLE Mengenangaben (auch innerhalb von Komponenten) proportional und runde auf plausible Kochmengen (z.B. keine "0,5 Eier" -- runde sinnvoll, notfalls mit Hinweis in "reply"). Aktualisiere dabei auch "portionen".

Enums: "category" nur aus Vorspeise/Suppe/Hauptgang/Dessert/Beilage/Snack. "difficulty" nur aus Leicht/Mittel/Schwer. "season" nur aus Frühling/Sommer/Herbst/Winter/Ganzjährig.

"reply": Antworte kurz und konkret, was du geändert hast (z.B. "Zutaten aktualisiert: Calamari statt Ofenkartoffel.") oder stelle deine Rückfrage. Kein Smalltalk, keine langen Erklärungen.

Antworte AUSSCHLIESSLICH mit JSON in exakt dieser Form, keine Erklärung davor/danach:
{
  "reply": string,
  "updatedFields": {
    "title"?: string, "description"?: string, "category"?: string, "difficulty"?: string,
    "time"?: number, "season"?: string, "tags"?: string[], "portionen"?: number,
    "zutaten"?: [{ "name": string, "menge": string }],
    "komponenten"?: [{ "name": string, "zutaten": [{ "name": string, "menge": string }], "zubereitung": string }],
    "schritte"?: string[], "getraenke"?: string, "chefTipps"?: string,
    "geschmack"?: { "acidity": number, "sweetness": number, "bitterness": number, "umami": number, "spiciness": number, "saltiness": number }
  }
}
Lass in "updatedFields" alle Felder weg, die sich nicht geändert haben -- ein leeres Objekt "{}" ist völlig normal (z.B. bei einer reinen Rückfrage).

Verwende ausschließlich reale, tatsächlich existierende Zutaten und Begriffe. Erfinde niemals Wörter oder Fantasiebegriffe.`;

function parsePatch(raw: unknown, logPrefix: string): Partial<RezeptSnapshot> {
  if (!raw || typeof raw !== 'object') return {};
  const r = raw as Record<string, unknown>;
  const patch: Partial<RezeptSnapshot> = {};

  if (typeof r.title === 'string' && r.title.trim()) patch.title = r.title.trim();
  if (typeof r.description === 'string') patch.description = r.description.trim();
  if ('category' in r) {
    if (isValidEnum(r.category, REZEPT_KATEGORIEN)) patch.category = r.category;
    else console.error(`${logPrefix} category "${String(r.category)}" ungültig, ignoriert.`);
  }
  if ('difficulty' in r) {
    if (isValidEnum(r.difficulty, REZEPT_SCHWIERIGKEITEN)) patch.difficulty = r.difficulty;
    else console.error(`${logPrefix} difficulty "${String(r.difficulty)}" ungültig, ignoriert.`);
  }
  if ('season' in r) {
    if (isValidEnum(r.season, REZEPT_SAISONS)) patch.season = r.season;
    else console.error(`${logPrefix} season "${String(r.season)}" ungültig, ignoriert.`);
  }
  if (typeof r.time === 'number' && r.time > 0) patch.time = Math.round(r.time);
  if (Array.isArray(r.tags)) patch.tags = r.tags.filter((t): t is string => typeof t === 'string' && t.trim().length > 0).map(t => t.trim());
  if (typeof r.portionen === 'number' && r.portionen > 0) patch.portionen = Math.round(r.portionen);
  if (Array.isArray(r.zutaten)) patch.zutaten = parseZutatenArray(r.zutaten);
  if (Array.isArray(r.komponenten)) patch.komponenten = parseKomponenten(r.komponenten);
  if (Array.isArray(r.schritte)) patch.schritte = r.schritte.filter((s): s is string => typeof s === 'string' && s.trim().length > 0).map(s => s.trim());
  if (typeof r.getraenke === 'string') patch.getraenke = r.getraenke.trim();
  if (typeof r.chefTipps === 'string') patch.chefTipps = r.chefTipps.trim();
  if (r.geschmack && typeof r.geschmack === 'object') patch.geschmack = parseGeschmack(r.geschmack);

  return patch;
}

export async function POST(req: NextRequest) {
  const check = await requireTier(req, MIN_TIER);
  if (!check.ok) return check.response;
  const { user } = check;

  const rateLimit = await checkRateLimit(user.id);
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: `rate_limit_${rateLimit.reason}`, message: rateLimit.message },
      { status: 429 },
    );
  }

  let body: { rezept?: unknown; messages?: ChatMessage[] };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Ungültige Anfrage.' }, { status: 400 });
  }

  if (JSON.stringify(body).length > MAX_PAYLOAD_CHARS) {
    return NextResponse.json({ error: 'Anfrage zu groß.' }, { status: 400 });
  }

  if (!body.rezept || typeof body.rezept !== 'object') {
    return NextResponse.json({ error: 'Kein Rezept-Kontext angegeben.' }, { status: 400 });
  }
  const messages = Array.isArray(body.messages)
    ? body.messages.filter((m): m is ChatMessage =>
        !!m && (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string' && m.content.trim().length > 0)
    : [];
  if (messages.length === 0) {
    return NextResponse.json({ error: 'Keine Nachricht angegeben.' }, { status: 400 });
  }
  const trimmedMessages = messages.slice(-MAX_MESSAGES);

  let apiKey: string;
  try {
    apiKey = getOperatorOpenAiKey();
  } catch (e) {
    console.error('[sous-chef] Betreiber-Key fehlt:', e instanceof Error ? e.message : e);
    return NextResponse.json({ error: 'Der KI-Sous-Chef ist aktuell nicht verfügbar.' }, { status: 500 });
  }

  const systemMessage = `${SYSTEM_PROMPT}\n\nAktueller Stand des Rezept-Formulars (JSON):\n${JSON.stringify(body.rezept)}`;

  let upstream: Response;
  try {
    upstream = await fetchWithTimeout('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        temperature: 0.3,
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: systemMessage },
          ...trimmedMessages.map(m => ({ role: m.role, content: m.content })),
        ],
      }),
    }, UPSTREAM_TIMEOUT_MS);
  } catch (e) {
    if (e instanceof UpstreamTimeoutError) {
      console.error('[sous-chef] Timeout bei OpenAI-Anfrage.');
      return NextResponse.json(
        { error: 'timeout', message: 'Die Anfrage hat zu lange gedauert. Bitte die Nachricht kürzen oder erneut versuchen.' },
        { status: 504 },
      );
    }
    console.error('[sous-chef] Verbindung zu OpenAI fehlgeschlagen:', e instanceof Error ? e.message : e);
    return NextResponse.json({ error: 'Verbindung zur KI fehlgeschlagen.' }, { status: 502 });
  }

  if (!upstream.ok) {
    const errText = await upstream.text().catch(() => '');
    console.error('[sous-chef] OpenAI-Fehler:', upstream.status, errText.slice(0, 300));
    if (upstream.status === 429) {
      return NextResponse.json({ error: 'Anbieter-Limit erreicht. Bitte kurz warten und erneut versuchen.' }, { status: 429 });
    }
    return NextResponse.json({ error: 'Fehler bei der Anfrage an die KI.' }, { status: 502 });
  }

  const upstreamData = await upstream.json();
  const raw: string | undefined = upstreamData.choices?.[0]?.message?.content;

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw ?? '');
  } catch {
    console.error('[sous-chef] KI-Antwort war kein gültiges JSON.');
    return NextResponse.json({ error: 'Die KI-Antwort konnte nicht verarbeitet werden. Bitte erneut versuchen.' }, { status: 502 });
  }

  if (!parsed || typeof parsed !== 'object') {
    console.error('[sous-chef] KI-Antwort hat unerwartete Struktur.');
    return NextResponse.json({ error: 'Die KI-Antwort hatte eine unerwartete Struktur. Bitte erneut versuchen.' }, { status: 502 });
  }
  const p = parsed as Record<string, unknown>;
  const reply = typeof p.reply === 'string' && p.reply.trim() ? p.reply.trim() : 'Verstanden.';
  const updatedFields = parsePatch(p.updatedFields, '[sous-chef]');

  return NextResponse.json({ reply, updatedFields });
}
