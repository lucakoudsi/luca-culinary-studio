import { NextRequest } from 'next/server';
import { createAdminClient } from '@/lib/supabase-admin';
import { getRequestUser } from '@/lib/get-request-user';
import { decryptKey } from '@/lib/crypto';

export const dynamic = 'force-dynamic';

const SYSTEM_PROMPT = `Du bist der KI-Sous-Chef von LUCA Culinary Studio -- ein erfahrener kulinarischer Assistent für professionelle und ambitionierte Köch:innen. Du hilfst bei Rezeptentwicklung, Kochtechniken, Fermentation sowie Wein- und Aromapairings, auf dem Niveau gehobener, professioneller Küche.

Antworte präzise, fachlich fundiert und praxisnah, wie ein erfahrener Sous-Chef, der sein Wissen gerne teilt. Nutze Fachbegriffe dort, wo sie angebracht sind, erkläre sie aber kurz, wenn es dem Verständnis hilft.

Wichtig: Wenn du dir bei einer fachlichen Aussage nicht sicher bist, sag das ehrlich ("Da bin ich mir nicht ganz sicher...") statt Fakten zu erfinden. Eine erfundene oder ungenaue Behauptung schadet mehr als ein ehrliches "weiß ich nicht genau".

Antworte auf Deutsch, außer die Frage wird auf Englisch gestellt.`;

type ChatMessage = { role: 'user' | 'assistant'; content: string };

export async function POST(req: NextRequest) {
  const user = await getRequestUser(req);
  if (!user) {
    return Response.json({ error: 'Nicht eingeloggt.' }, { status: 401 });
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

  const db = createAdminClient();
  const { data: row } = await db
    .from('user_api_keys')
    .select('provider, key_cipher')
    .eq('user_id', user.id)
    .maybeSingle();

  if (!row) {
    return Response.json(
      { error: 'kein_key', message: 'Bitte hinterlege deinen API-Key in den Einstellungen.' },
      { status: 402 },
    );
  }

  if (row.provider !== 'openai') {
    return Response.json(
      { error: 'anbieter_nicht_unterstuetzt', message: 'Für den Chat wird aktuell nur ein OpenAI-Key unterstützt -- bitte in den Einstellungen hinterlegen.' },
      { status: 400 },
    );
  }

  let apiKey: string;
  try {
    apiKey = decryptKey(row.key_cipher);
  } catch (e) {
    console.error('[ki/chat] Entschlüsselung fehlgeschlagen:', e instanceof Error ? e.message : e);
    return Response.json({ error: 'Interner Fehler.' }, { status: 500 });
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
        stream: true,
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          ...messages.map(m => ({ role: m.role, content: m.content })),
        ],
      }),
    });
  } catch (e) {
    console.error('[ki/chat] Verbindung zu OpenAI fehlgeschlagen:', e instanceof Error ? e.message : e);
    return Response.json({ error: 'Verbindung zu OpenAI fehlgeschlagen.' }, { status: 502 });
  }

  if (upstream.status === 401) {
    await db.from('user_api_keys').update({ is_valid: false }).eq('user_id', user.id);
    return Response.json(
      { error: 'key_ungueltig', message: 'Dein Key scheint nicht mehr gültig zu sein.' },
      { status: 401 },
    );
  }

  if (!upstream.ok || !upstream.body) {
    const errText = await upstream.text().catch(() => '');
    console.error('[ki/chat] OpenAI-Fehler:', upstream.status, errText.slice(0, 300));
    if (upstream.status === 429) {
      return Response.json({ error: 'Anbieter-Limit erreicht. Bitte kurz warten und erneut versuchen.' }, { status: 429 });
    }
    return Response.json({ error: 'Fehler beim Abrufen der Antwort.' }, { status: 502 });
  }

  // Erfolgreicher Call: is_valid + last_used aktualisieren (best effort, blockiert das Streaming nicht)
  db.from('user_api_keys')
    .update({ is_valid: true, last_used: new Date().toISOString() })
    .eq('user_id', user.id)
    .then(() => {});

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
