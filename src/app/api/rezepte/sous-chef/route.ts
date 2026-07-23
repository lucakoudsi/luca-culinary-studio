import { NextRequest, NextResponse } from 'next/server';
import { requireTier } from '@/lib/apiAuth';
import { checkRateLimit } from '@/lib/rate-limit';
import { getOperatorOpenAiKey } from '@/lib/operator-key';
import { getMonthlyTextLimit, getTextQuotaStatus, incrementTextQuota, TEXT_QUOTA_WEIGHTS } from '@/lib/text-quota';
import { REZEPT_KATEGORIEN, REZEPT_SCHWIERIGKEITEN, REZEPT_SAISONS } from '@/config/rezeptFelder';
import { isValidEnum, parseZutatenArray, parseKomponenten, parseGeschmack, type RezeptSnapshot } from '@/lib/rezeptKiExtraktion';
import { fetchWithTimeout, UpstreamTimeoutError } from '@/lib/upstreamTimeout';

export const dynamic = 'force-dynamic';
// 60 statt 30 -- diese Route kann jetzt auch mit Vision (Bilder aus der
// Import-Sitzung) laufen, maxDuration ist ein statischer Export und kann
// nicht pro Request umgeschaltet werden. Der interne Upstream-Timeout
// (UPSTREAM_TIMEOUT_MS) wird dagegen pro Request passend gewaehlt.
export const maxDuration = 60;

type ChatMessage = { role: 'user' | 'assistant'; content: string };

const MIN_TIER = 2; // Basic -- laeuft ueber den Betreiber-Key, siehe docs/abo-konzept.md Abschnitt 2a
const MAX_PAYLOAD_CHARS = 30_000; // reiner Text-Payload ohne Bilder
const MAX_PAYLOAD_CHARS_WITH_IMAGES = 20_000_000; // grosszuegig fuer bis zu MAX_IMAGES komprimierte Fotos als Base64
const MAX_MESSAGES = 40;
const MAX_IMAGES = 5; // deckt sich mit MAX_IMAGES in import-bild -- mehr Bilder gab es in der Import-Sitzung ohnehin nie
const UPSTREAM_TIMEOUT_MS_TEXT = 24_000; // reiner Text-Turn -- etwas unter maxDuration
const UPSTREAM_TIMEOUT_MS_VISION = 50_000; // mit Bildern: naeher an maxDuration, Vision braucht laenger

const SYSTEM_PROMPT = `Du bist der KI-Sous-Chef von Culinary Studio. Der Nutzer hat gerade ein Rezept per KI importiert (aus Text oder Bildern) und möchte es jetzt im Dialog mit dir korrigieren und verfeinern, bevor er es speichert.

Du bekommst mit jeder Nachricht den AKTUELLEN Stand aller Formularfelder als JSON mitgeliefert (title, description, category, difficulty, time, season, tags, portionen, zutaten, komponenten, schritte, getraenke, chefTipps, geschmack) sowie die bisherige Chat-Historie.

WICHTIGSTE REGEL -- nur ändern, was gemeint ist: Ändere AUSSCHLIESSLICH die Felder, die von der aktuellen Anweisung des Nutzers betroffen sind. Generiere NIEMALS das ganze Rezept neu -- AUSSER der Nutzer bittet ausdrücklich um einen größeren Umbau (siehe "Umbau-Aufträge" unten), dann sind mehrere oder sogar alle Felder bewusst betroffen, weil genau das die Absicht ist.

Wenn du ein Array-Feld zurückgibst (zutaten, komponenten, schritte, tags), muss es die VOLLSTÄNDIGE aktualisierte Liste sein, nicht nur der geänderte Eintrag -- übernimm alle unveränderten Einträge unverändert mit.

NICHTS ERFINDEN (wie beim Import): Ergänze oder verändere nur, was der Nutzer explizit sagt oder eindeutig meint. Fehlt dir eine Information, die du nicht wissen kannst (z.B. "wie lange soll das köcheln?", wenn das nirgends steht), FRAGE NACH statt zu raten -- antworte dann nur mit "reply" (eine kurze Rückfrage) und "updatedFields": {}.

AUSNAHME -- Umbau-Aufträge (Umrechnung, Neuinterpretation, Ausarbeitung): Bittet der Nutzer dich AUSDRÜCKLICH darum, dein Kochwissen aktiv einzusetzen -- z.B. "mach ein echtes Rezept daraus" (oft nach dem Import einer rohen Verpackungs-Zutatenliste ohne Mengen/Zubereitung), "rechne auf 4 Portionen um", "ergänze die Zubereitung", "ergänze die üblichen Schritte für Kartoffelpüree", "was fehlt hier normalerweise noch?", "schreib eine passende Beschreibung" -- ist das die bewusste Ausnahme zur Nichts-Erfinden-Regel, KEINE Regelverletzung. In diesem Fall SOLLST du aktiv:
- realistische Mengenangaben herleiten, auch wenn im Ausgangsmaterial keine oder nur grobe standen (z.B. eine Verpackungs-Zutatenliste ohne Grammangaben),
- echte Arbeitsschritte formulieren, inklusive plausibler Reihenfolge und Technik, wie ein erfahrener Koch es tun würde,
- dabei nur innerhalb dessen bleiben, was dem Ausgangsmaterial nicht widerspricht -- erfinde keine zusätzlichen Zutaten, die nirgends genannt wurden, aber vervollständige fehlende Mengen/Schritte/Technik aktiv, statt nachzufragen.
Antworte in diesem Fall NICHT nur zustimmend, ohne die Daten tatsächlich auszuarbeiten -- "updatedFields" muss die wirklich hergeleiteten Werte enthalten (Zutaten mit echten Mengen, Komponenten/Schritte mit echter Zubereitung), sonst hat der Nutzer nichts von seiner Bitte.

Mengen/Portionen skalieren: Bittet der Nutzer um eine andere Portionszahl (z.B. "für 2 statt 4 Personen") bei einem Rezept, das schon echte Mengenangaben hat, skaliere ALLE Mengenangaben (auch innerhalb von Komponenten) proportional und runde auf plausible Kochmengen (z.B. keine "0,5 Eier" -- runde sinnvoll, notfalls mit Hinweis in "reply"). Aktualisiere dabei auch "portionen". Hat das Rezept noch keine echten Mengen (z.B. direkt nach dem Import einer Verpackungs-Zutatenliste), gilt stattdessen die Umbau-Ausnahme oben: Mengen für die gewünschte Portionszahl komplett neu herleiten statt zu skalieren.

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

// Nur angehaengt, wenn tatsaechlich Bilder mitgeschickt wurden (siehe POST unten)
// -- ohne Bilder bleibt der Prompt unveraendert wie bisher.
const IMAGE_KONTEXT_HINWEIS = `

Der Nutzer hat beim Import Fotos/Frames hochgeladen -- diese werden dir mit dieser Nachricht als Bilder mitgeschickt. Nutze sie aktiv, wenn der Nutzer sich darauf bezieht (z.B. "auf Bild 3", "die weißen Krümel auf dem Teller", "ist das eher ein Gel oder ein Pudding?"). Schau dir die Bilder genau an, bevor du antwortest oder Felder änderst -- auch kleine, unscheinbare Elemente können gemeint sein, die beim ursprünglichen Import übersehen wurden.`;

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
  const { user, tier } = check;

  const rateLimit = await checkRateLimit(user.id);
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: `rate_limit_${rateLimit.reason}`, message: rateLimit.message },
      { status: 429 },
    );
  }

  let body: { rezept?: unknown; messages?: ChatMessage[]; images?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Ungültige Anfrage.' }, { status: 400 });
  }

  // Bilder nur aus der aktuellen Import-Sitzung (siehe import-bild) -- bereits
  // dort komprimiert, hier nur noch grob validiert (Data-URL-Praefix, Anzahl),
  // keine erneute Komprimierung noetig.
  const rawImages = Array.isArray(body.images) ? body.images.filter((i): i is string => typeof i === 'string' && i.startsWith('data:image/')) : [];
  if (rawImages.length > MAX_IMAGES) {
    return NextResponse.json({ error: `Maximal ${MAX_IMAGES} Bilder.` }, { status: 400 });
  }
  const images = rawImages;
  const hasImages = images.length > 0;
  const textQuotaWeight = hasImages ? TEXT_QUOTA_WEIGHTS.vision : TEXT_QUOTA_WEIGHTS.sousChefText;

  const maxPayloadChars = hasImages ? MAX_PAYLOAD_CHARS_WITH_IMAGES : MAX_PAYLOAD_CHARS;
  if (JSON.stringify(body).length > maxPayloadChars) {
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

  // Gewichtung haengt davon ab, ob dieser Turn Bilder mitschickt (Vision ist
  // spuerbar teurer, siehe docs/text-quota.sql) -- Vorab-Pruefung, kein
  // Verbrauch, bevor der teure Call ausgeloest wird.
  const monthlyTextLimit = getMonthlyTextLimit(tier);
  const textQuotaBefore = await getTextQuotaStatus(user.id, monthlyTextLimit);
  if (textQuotaBefore.remaining < textQuotaWeight) {
    return NextResponse.json(
      {
        error: 'quota_exceeded',
        message: 'Monatskontingent für Text-KI-Funktionen erreicht -- nächsten Monat geht es weiter.',
        quota: textQuotaBefore,
      },
      { status: 429 },
    );
  }

  let apiKey: string;
  try {
    apiKey = getOperatorOpenAiKey();
  } catch (e) {
    console.error('[sous-chef] Betreiber-Key fehlt:', e instanceof Error ? e.message : e);
    return NextResponse.json({ error: 'Der KI-Sous-Chef ist aktuell nicht verfügbar.' }, { status: 500 });
  }

  const systemMessage = `${SYSTEM_PROMPT}\n\nAktueller Stand des Rezept-Formulars (JSON):\n${JSON.stringify(body.rezept)}${hasImages ? IMAGE_KONTEXT_HINWEIS : ''}`;

  // Bilder nur an den NEUESTEN User-Turn haengen, nicht an die gesamte Historie --
  // wir schicken bei jeder Anfrage die komplette Historie erneut (die API ist
  // zustandslos), ein erneutes Anhaengen an aeltere Turns wuerde dieselben Bilder
  // mehrfach im selben Request mitschicken und nur unnoetig Kosten/Tokens kosten.
  type ChatContent = string | Array<{ type: 'text'; text: string } | { type: 'image_url'; image_url: { url: string } }>;
  const chatMessages: { role: 'user' | 'assistant'; content: ChatContent }[] =
    trimmedMessages.map(m => ({ role: m.role, content: m.content }));
  if (hasImages) {
    const lastIndex = chatMessages.length - 1;
    if (chatMessages[lastIndex]?.role === 'user') {
      const lastText = chatMessages[lastIndex].content as string;
      chatMessages[lastIndex] = {
        role: 'user',
        content: [
          { type: 'text', text: lastText },
          ...images.map(dataUrl => ({ type: 'image_url' as const, image_url: { url: dataUrl } })),
        ],
      };
    }
  }

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
          ...chatMessages,
        ],
      }),
    }, hasImages ? UPSTREAM_TIMEOUT_MS_VISION : UPSTREAM_TIMEOUT_MS_TEXT);
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

  incrementTextQuota(user.id, monthlyTextLimit, textQuotaWeight).catch(() => {});

  const p = parsed as Record<string, unknown>;
  const reply = typeof p.reply === 'string' && p.reply.trim() ? p.reply.trim() : 'Verstanden.';
  const updatedFields = parsePatch(p.updatedFields, '[sous-chef]');

  return NextResponse.json({ reply, updatedFields });
}
