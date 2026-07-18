import { NextRequest, NextResponse } from 'next/server';
import { randomUUID } from 'node:crypto';
import sharp from 'sharp';
import { requireTier } from '@/lib/apiAuth';
import { checkRateLimit } from '@/lib/rate-limit';
import { createAdminClient } from '@/lib/supabase-admin';
import { getOperatorOpenAiKey } from '@/lib/operator-key';
import { buildRezeptSystemPrompt, parseKiRezeptResponse, isEmptyRezeptResult, type PromptModus } from '@/lib/rezeptKiExtraktion';
import { fetchWithTimeout, UpstreamTimeoutError } from '@/lib/upstreamTimeout';

export const dynamic = 'force-dynamic';
export const maxDuration = 60; // Vision mit mehreren Bildern ist deutlich langsamer als reiner Text

const MIN_TIER = 2; // Basic -- laeuft ueber den Betreiber-Key (Vision, teurer als Text), siehe docs/abo-konzept.md Abschnitt 2a
const MAX_IMAGES = 5;
const MAX_RAW_BYTES_PER_IMAGE = 15 * 1024 * 1024; // roh, vor der Komprimierung
const UPSTREAM_TIMEOUT_MS = 50_000; // etwas unter maxDuration, damit wir noch selbst antworten koennen

const INTRO_ABLESEN = `Du extrahierst Rezepte aus Fotos für LUCA Culinary Studio.

Der Nutzer lädt ein oder mehrere Fotos hoch -- z.B. eine abfotografierte Kochbuchseite, ein Screenshot aus einem Instagram-/TikTok-Reel, ein handgeschriebenes Rezept, eine Rezeptkarte oder ein Foto des fertigen Gerichts. Lies Text und Struktur aus den Bildern und extrahiere daraus ein strukturiertes Rezept. Bei mehreren Bildern (z.B. mehrere Frames aus einem Video, in denen das Rezept über die Bilder verteilt ist) führe sie zu EINEM zusammenhängenden Rezept zusammen -- nicht zu mehreren getrennten Rezepten.`;

const INTRO_REKONSTRUKTION = `Du rekonstruierst ein plausibles Rezept aus Fotos des FERTIGEN, bereits angerichteten Gerichts für LUCA Culinary Studio -- z.B. Standbilder aus einem TikTok-/Instagram-Anrichte-Video, bei denen kein Rezepttext zu lesen ist, nur das fertige Gericht selbst.

Der Nutzer hat KEIN ablesbares Rezept zur Verfügung -- nur Bilder des Ergebnisses. Analysiere, was auf den Bildern zu sehen ist (Komponenten, Techniken, Anrichteweise) und rekonstruiere daraus ein plausibles Rezept aus deinem Kochwissen. Bei mehreren Bildern (z.B. verschiedene Frames desselben Anrichte-Vorgangs) beziehen sich alle auf DASSELBE Gericht -- führe sie zu einer einzigen, zusammenhängenden Rekonstruktion zusammen.`;

const EXTRA_RULES = `Bild-Lesbarkeit: Ist ein Bild oder ein Teil davon unleserlich, unscharf oder inhaltlich unklar, rate NICHT, was dort stehen könnte. Vermerke stattdessen ehrlich in "chefTipps", was nicht sicher lesbar war (z.B. "Ein Teil der Zutatenliste im zweiten Bild war unscharf und nicht lesbar -- bitte prüfen.").

Rezeptfoto-Erkennung ("gericht_bild_index"): Unterscheide klar zwischen Bildern, die Rezept-INFORMATIONEN enthalten (Text, Zutatenliste, Kochbuchseite, handgeschriebene Notizen, Screenshot mit Anleitung) und Bildern, die das FERTIGE, servierte/angerichtete GERICHT zeigen (ein Foto des Essens selbst, keine Textseite). Setze "gericht_bild_index" auf die nullbasierte Position (0 = erstes Bild, 1 = zweites Bild, ...) desjenigen Bildes, das am besten das fertige Gericht zeigt. Zeigen mehrere Bilder das fertige Gericht, wähle das aussagekräftigste/appetitlichste aus. Zeigt KEINES der Bilder das fertige Gericht (z.B. nur Kochbuchseiten oder Zutatenlisten), setze "gericht_bild_index" auf null. Dieses Feld ist Pflicht -- vergiss es nicht in deiner Antwort.`;

const SYSTEM_PROMPT_ABLESEN = buildRezeptSystemPrompt(INTRO_ABLESEN, EXTRA_RULES, 'ablesen');
const SYSTEM_PROMPT_REKONSTRUKTION = buildRezeptSystemPrompt(INTRO_REKONSTRUKTION, EXTRA_RULES, 'rekonstruktion');

function parseDataUrl(dataUrl: string): { mime: string; buffer: Buffer } | null {
  const match = /^data:(image\/[a-zA-Z+]+);base64,(.+)$/.exec(dataUrl);
  if (!match) return null;
  try {
    return { mime: match[1], buffer: Buffer.from(match[2], 'base64') };
  } catch {
    return null;
  }
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

  let body: { images?: unknown; modus?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Ungültige Anfrage.' }, { status: 400 });
  }

  const modus: PromptModus = body.modus === 'rekonstruktion' ? 'rekonstruktion' : 'ablesen';
  const systemPrompt = modus === 'rekonstruktion' ? SYSTEM_PROMPT_REKONSTRUKTION : SYSTEM_PROMPT_ABLESEN;

  const rawImages = Array.isArray(body.images) ? body.images.filter((i): i is string => typeof i === 'string') : [];
  if (rawImages.length === 0) {
    return NextResponse.json({ error: 'Kein Bild angegeben.' }, { status: 400 });
  }
  if (rawImages.length > MAX_IMAGES) {
    return NextResponse.json({ error: `Maximal ${MAX_IMAGES} Bilder auf einmal.` }, { status: 400 });
  }

  // Serverseitig dekodieren + komprimieren (sharp) -- unabhaengig von der
  // hochgeladenen Originalgroesse bleibt die Anfrage an OpenAI klein und
  // guenstig. Buffer bleiben erhalten, falls eines der Bilder spaeter als
  // Rezeptfoto in den Storage-Bucket hochgeladen werden soll (kein zweiter
  // Komprimierungs-Durchlauf noetig).
  const compressed: { dataUrl: string; buffer: Buffer }[] = [];
  for (const dataUrl of rawImages) {
    const parsedImg = parseDataUrl(dataUrl);
    if (!parsedImg) {
      return NextResponse.json({ error: 'Ungültiges Bildformat.' }, { status: 400 });
    }
    if (parsedImg.buffer.length > MAX_RAW_BYTES_PER_IMAGE) {
      return NextResponse.json({ error: 'Ein Bild ist zu groß (max. 15 MB pro Bild).' }, { status: 400 });
    }
    try {
      const buffer = await sharp(parsedImg.buffer)
        .resize({ width: 1600, withoutEnlargement: true })
        .jpeg({ quality: 75 })
        .toBuffer();
      compressed.push({ buffer, dataUrl: `data:image/jpeg;base64,${buffer.toString('base64')}` });
    } catch (e) {
      console.error('[import-bild] Bildkomprimierung fehlgeschlagen:', e instanceof Error ? e.message : e);
      return NextResponse.json({ error: 'Ein Bild konnte nicht verarbeitet werden. Bitte ein anderes Format versuchen.' }, { status: 400 });
    }
  }

  let apiKey: string;
  try {
    apiKey = getOperatorOpenAiKey();
  } catch (e) {
    console.error('[import-bild] Betreiber-Key fehlt:', e instanceof Error ? e.message : e);
    return NextResponse.json({ error: 'Der Bild-Import ist aktuell nicht verfügbar.' }, { status: 500 });
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
        temperature: 0.4,
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: systemPrompt },
          {
            role: 'user',
            content: [
              { type: 'text', text: 'Extrahiere das Rezept aus diesen Bildern.' },
              ...compressed.map(c => ({ type: 'image_url', image_url: { url: c.dataUrl } })),
            ],
          },
        ],
      }),
    }, UPSTREAM_TIMEOUT_MS);
  } catch (e) {
    if (e instanceof UpstreamTimeoutError) {
      console.error('[import-bild] Timeout bei OpenAI-Anfrage.');
      return NextResponse.json(
        { error: 'timeout', message: 'Die Bildanalyse hat zu lange gedauert. Bitte mit weniger oder kleineren Bildern erneut versuchen.' },
        { status: 504 },
      );
    }
    console.error('[import-bild] Verbindung zu OpenAI fehlgeschlagen:', e instanceof Error ? e.message : e);
    return NextResponse.json({ error: 'Verbindung zur KI fehlgeschlagen.' }, { status: 502 });
  }
  if (!upstream.ok) {
    const errText = await upstream.text().catch(() => '');
    console.error('[import-bild] OpenAI-Fehler:', upstream.status, errText.slice(0, 300));
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
    console.error('[import-bild] KI-Antwort war kein gültiges JSON.');
    return NextResponse.json({ error: 'Die KI-Antwort konnte nicht verarbeitet werden. Bitte erneut versuchen.' }, { status: 502 });
  }

  const result = parseKiRezeptResponse(parsed, '[import-bild]', modus);
  if (!result) {
    console.error('[import-bild] KI-Antwort hat unerwartete Struktur.');
    return NextResponse.json({ error: 'Die KI-Antwort hatte eine unerwartete Struktur. Bitte erneut versuchen.' }, { status: 502 });
  }

  if (isEmptyRezeptResult(result)) {
    return NextResponse.json(
      { found: false, error: 'nichts_erkannt', message: 'Konnte auf diesen Bildern kein Rezept erkennen.' },
      { status: 422 },
    );
  }

  // Zeigt eines der Bilder laut KI das fertige Gericht? Dann als Rezeptfoto
  // uebernehmen -- gleicher Weg wie beim URL-Import (Storage-Bucket
  // rezept-bilder), best effort: schlaegt der Upload fehl, wird das Rezept
  // trotzdem geliefert, nur ohne Foto.
  const rawIndex = (parsed as Record<string, unknown>).gericht_bild_index;
  const gerichtBildIndex =
    typeof rawIndex === 'number' && Number.isInteger(rawIndex) && rawIndex >= 0 && rawIndex < compressed.length
      ? rawIndex
      : null;

  let image: string | null = null;
  if (gerichtBildIndex !== null) {
    try {
      const db = createAdminClient();
      const path = `${randomUUID()}.jpg`;
      const { error: uploadError } = await db.storage.from('rezept-bilder').upload(path, compressed[gerichtBildIndex].buffer, {
        contentType: 'image/jpeg',
        cacheControl: '31536000',
        upsert: false,
      });
      if (uploadError) {
        console.error('[import-bild] Rezeptfoto-Upload fehlgeschlagen (nicht kritisch):', uploadError.message);
      } else {
        const { data } = db.storage.from('rezept-bilder').getPublicUrl(path);
        image = data.publicUrl;
      }
    } catch (e) {
      console.error('[import-bild] Rezeptfoto-Upload-Fehler (nicht kritisch):', e instanceof Error ? e.message : e);
    }
  }

  // Komprimierte Bilder (dieselben Bytes, die an OpenAI gingen) mit zurueckgeben --
  // der KI-Sous-Chef braucht sie spaeter in derselben Import-Sitzung fuer
  // Vision-Rueckfragen (siehe /api/rezepte/sous-chef), ohne sie erneut
  // hochzuladen oder serverseitig neu zu komprimieren.
  return NextResponse.json({ found: true, recipe: { ...result, image }, images: compressed.map(c => c.dataUrl) });
}
