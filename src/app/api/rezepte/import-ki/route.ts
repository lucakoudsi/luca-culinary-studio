import { NextRequest, NextResponse } from 'next/server';
import { requireTier } from '@/lib/apiAuth';
import { checkRateLimit } from '@/lib/rate-limit';
import { getOperatorOpenAiKey } from '@/lib/operator-key';
import { buildRezeptSystemPrompt, parseKiRezeptResponse, isEmptyRezeptResult } from '@/lib/rezeptKiExtraktion';

export const dynamic = 'force-dynamic';

const MIN_TIER = 2; // Basic -- laeuft ueber den Betreiber-Key, siehe docs/abo-konzept.md Abschnitt 2a
const MAX_TEXT_LENGTH = 8000; // Captions sind normalerweise deutlich kuerzer -- grosszuegige Sicherheitsgrenze

const INTRO = `Du extrahierst Rezepte aus Social-Media-Captions (Instagram/TikTok) oder kopiertem Rezepttext für LUCA Culinary Studio.

Der Nutzer gibt dir einen rohen Text -- oft eine ungeordnete Caption mit Emojis, Hashtags, Call-to-Actions ("folgt mir für mehr!", "speichert euch das ab!") und locker formulierten Mengenangaben. Extrahiere daraus ein strukturiertes Rezept.`;

const SYSTEM_PROMPT = buildRezeptSystemPrompt(INTRO);

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

  const result = parseKiRezeptResponse(parsed, '[import-ki]');
  if (!result) {
    console.error('[import-ki] KI-Antwort hat unerwartete Struktur.');
    return NextResponse.json({ error: 'Die KI-Antwort hatte eine unerwartete Struktur. Bitte erneut versuchen.' }, { status: 502 });
  }

  if (isEmptyRezeptResult(result)) {
    return NextResponse.json(
      { found: false, error: 'nichts_erkannt', message: 'Konnte in diesem Text kein Rezept erkennen.' },
      { status: 422 },
    );
  }

  return NextResponse.json({ found: true, recipe: result });
}
