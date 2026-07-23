import { NextRequest } from 'next/server';
import { requireTier } from '@/lib/apiAuth';
import { checkRateLimit } from '@/lib/rate-limit';
import { getOperatorOpenAiKey } from '@/lib/operator-key';
import { getMonthlyTextLimit, getTextQuotaStatus, incrementTextQuota, TEXT_QUOTA_WEIGHTS } from '@/lib/text-quota';
import { fetchWithTimeout, UpstreamTimeoutError } from '@/lib/upstreamTimeout';

export const dynamic = 'force-dynamic';
export const maxDuration = 30; // allgemeiner Chat -- deckt Verbindungsaufbau + Streaming der Antwort
const UPSTREAM_TIMEOUT_MS = 24_000; // gilt fuer den Verbindungsaufbau (bis die ersten Header/Tokens da sind)
const MIN_TIER = 2; // Basic -- laeuft ueber den Betreiber-Key, siehe docs/abo-konzept.md.txt Abschnitt 2a

const SYSTEM_PROMPT = `Du bist der KI-Sous-Chef von Culinary Studio -- ein erfahrener kulinarischer Assistent für professionelle und ambitionierte Köch:innen. Du hilfst bei Rezeptentwicklung, Kochtechniken, Fermentation sowie Wein- und Aromapairings, auf dem Niveau gehobener, professioneller Küche.

Antworte präzise, fachlich fundiert und praxisnah, wie ein erfahrener Sous-Chef, der sein Wissen gerne teilt. Nutze Fachbegriffe dort, wo sie angebracht sind, erkläre sie aber kurz, wenn es dem Verständnis hilft.

Wichtig: Wenn du dir bei einer fachlichen Aussage nicht sicher bist, sag das ehrlich ("Da bin ich mir nicht ganz sicher...") statt Fakten zu erfinden. Eine erfundene oder ungenaue Behauptung schadet mehr als ein ehrliches "weiß ich nicht genau".

Antworte auf Deutsch, außer die Frage wird auf Englisch gestellt.`;

type ChatMessage = { role: 'user' | 'assistant'; content: string };

export async function POST(req: NextRequest) {
  const check = await requireTier(req, MIN_TIER);
  if (!check.ok) return check.response;
  const { user, tier } = check;

  const rateLimit = await checkRateLimit(user.id);
  if (!rateLimit.allowed) {
    return Response.json(
      { error: `rate_limit_${rateLimit.reason}`, message: rateLimit.message },
      { status: 429 },
    );
  }

  let body: { messages?: ChatMessage[] };
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: 'Ungültige Anfrage.' }, { status: 400 });
  }
  const messages = Array.isArray(body.messages) ? body.messages : [];
  if (messages.length === 0) {
    return Response.json({ error: 'Keine Nachricht angegeben.' }, { status: 400 });
  }

  // Monatliches Text-Kontingent zuerst NUR pruefen (kein Verbrauch) -- so wird
  // der Chat-Call gar nicht erst ausgeloest, wenn das Kontingent schon leer
  // ist (siehe docs/text-quota.sql).
  const monthlyTextLimit = getMonthlyTextLimit(tier);
  const textQuotaBefore = await getTextQuotaStatus(user.id, monthlyTextLimit);
  if (textQuotaBefore.remaining < TEXT_QUOTA_WEIGHTS.chat) {
    return Response.json(
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
    console.error('[ki/chat] Betreiber-Key fehlt:', e instanceof Error ? e.message : e);
    return Response.json({ error: 'Der KI-Sous-Chef ist aktuell nicht verfügbar.' }, { status: 500 });
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
        stream: true,
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          ...messages.map(m => ({ role: m.role, content: m.content })),
        ],
      }),
    }, UPSTREAM_TIMEOUT_MS);
  } catch (e) {
    if (e instanceof UpstreamTimeoutError) {
      console.error('[ki/chat] Timeout bei OpenAI-Anfrage.');
      return Response.json(
        { error: 'timeout', message: 'Die Antwort hat zu lange gedauert. Bitte erneut versuchen oder die Frage kürzen.' },
        { status: 504 },
      );
    }
    console.error('[ki/chat] Verbindung zu OpenAI fehlgeschlagen:', e instanceof Error ? e.message : e);
    return Response.json({ error: 'Verbindung zu OpenAI fehlgeschlagen.' }, { status: 502 });
  }

  if (!upstream.ok || !upstream.body) {
    const errText = await upstream.text().catch(() => '');
    console.error('[ki/chat] OpenAI-Fehler:', upstream.status, errText.slice(0, 300));
    if (upstream.status === 429) {
      return Response.json({ error: 'Anbieter-Limit erreicht. Bitte kurz warten und erneut versuchen.' }, { status: 429 });
    }
    return Response.json({ error: 'Fehler beim Abrufen der Antwort.' }, { status: 502 });
  }

  // Erst JETZT, nach erfolgreichem Verbindungsaufbau zu OpenAI, das
  // Kontingent tatsaechlich verbrauchen (best effort, blockiert das
  // Streaming nicht) -- ein oben bereits abgefangener Fehler verbrennt
  // kein Kontingent.
  incrementTextQuota(user.id, monthlyTextLimit, TEXT_QUOTA_WEIGHTS.chat).catch(() => {});

  // OpenAI-SSE-Stream in einen reinen Text-Stream umwandeln (nur die Content-Deltas an den Client)
  const encoder = new TextEncoder();
  const decoder = new TextDecoder();
  const reader = upstream.body.getReader();

  const stream = new ReadableStream({
    async start(controller) {
      let buffer = '';
      try {
        for (;;) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() ?? '';
          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed.startsWith('data:')) continue;
            const data = trimmed.slice(5).trim();
            if (data === '[DONE]') continue;
            try {
              const json = JSON.parse(data);
              const delta = json.choices?.[0]?.delta?.content;
              if (delta) controller.enqueue(encoder.encode(delta));
            } catch {
              // unvollständiges JSON-Fragment am Chunk-Rand -- ignorieren, kommt im naechsten Chunk komplett an
            }
          }
        }
      } catch (e) {
        console.error('[ki/chat] Stream-Fehler:', e instanceof Error ? e.message : e);
      } finally {
        controller.close();
      }
    },
    cancel() {
      reader.cancel().catch(() => {});
    },
  });

  return new Response(stream, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
}
