import { NextRequest, NextResponse } from 'next/server';
import { requireTier } from '@/lib/apiAuth';
import { checkRateLimit } from '@/lib/rate-limit';
import { getOperatorOpenAiKey } from '@/lib/operator-key';
import { getMonthlyImageLimit, getImageQuotaStatus, incrementImageQuota } from '@/lib/image-quota';
import { AUFWANDSSTUFEN, type Aufwandsstufe } from '@/config/techniken';
import { fetchWithTimeout, UpstreamTimeoutError } from '@/lib/upstreamTimeout';

export const dynamic = 'force-dynamic';
export const maxDuration = 60; // Bildgenerierung ist der langsamste KI-Call im Projekt

const MIN_TIER = 3; // Pro -- Tellerdesigner ist Pro-exklusiv (docs/abo-konzept.md.txt)
const MAX_DESCRIPTION_LENGTH = 1500;
const UPSTREAM_TIMEOUT_MS = 50_000; // etwas unter maxDuration, damit wir noch selbst antworten koennen

type Zutat = { name: string; menge?: string };
type Komponente = { name: string; zutaten?: Zutat[]; zubereitung?: string };

type Body = {
  mode?: 'rezept' | 'frei';
  rezeptTitel?: string;
  rezeptZutaten?: Zutat[];
  rezeptKomponenten?: Komponente[];
  rezeptSchwierigkeit?: 'Leicht' | 'Mittel' | 'Schwer';
  freieBeschreibung?: string;
  aufwand?: Aufwandsstufe;
};

// Rezepte haben keine eigene "Aufwand"-Einstufung (das ist eine Menuegenerator-
// Taxonomie) -- Mapping von der vorhandenen Schwierigkeit, am naechsten
// liegende Zuordnung. Bei "frei" waehlt der Nutzer den Aufwand direkt.
const AUFWAND_AUS_SCHWIERIGKEIT: Record<'Leicht' | 'Mittel' | 'Schwer', Aufwandsstufe> = {
  Leicht: 'bistro',
  Mittel: 'gehoben',
  Schwer: 'fine_dining',
};

const AUFWAND_STIL: Record<Aufwandsstufe, string> = {
  bistro: 'Bodenständig-einladende Anrichteweise: großzügige, satte Portion, warmer rustikaler Teller, wenig Dekor, ehrlich und einladend statt kunstvoll -- wie in einem guten Wirtshaus.',
  gehoben: 'Gehobene Restaurant-Anrichteweise: klare, ausgewogene Komposition, saubere Saucenführung, gezielte Garnitur, moderner heller oder dunkler Teller -- deutlich mehr Präzision als Bistro, aber noch nicht avantgardistisch.',
  fine_dining: 'Fine-Dining-Anrichteweise: kunstvoll plattiert, jede Komponente präzise platziert, minimalistisch-elegant, bewusst genutzter Weißraum auf dem Teller, feine Saucenspiegel/Punkte/Wischer -- Sterneküchen-Niveau.',
};

function buildDishDescription(body: Body): string | null {
  if (body.mode === 'rezept') {
    const titel = (body.rezeptTitel ?? '').trim();
    if (!titel) return null;
    const teile = [`Gericht: "${titel}"`];
    const komponenten = (body.rezeptKomponenten ?? []).filter(k => k.name?.trim());
    const zutaten = (body.rezeptZutaten ?? []).filter(z => z.name?.trim());
    if (komponenten.length > 0) {
      teile.push(`Bestehend aus den Komponenten: ${komponenten.map(k => k.name.trim()).join(', ')}.`);
    } else if (zutaten.length > 0) {
      teile.push(`Hauptzutaten: ${zutaten.slice(0, 8).map(z => z.name.trim()).join(', ')}.`);
    }
    return teile.join(' ');
  }
  const text = (body.freieBeschreibung ?? '').trim();
  return text ? text.slice(0, MAX_DESCRIPTION_LENGTH) : null;
}

function resolveAufwand(body: Body): Aufwandsstufe | null {
  if (body.mode === 'rezept') {
    const schwierigkeit = body.rezeptSchwierigkeit;
    if (schwierigkeit && schwierigkeit in AUFWAND_AUS_SCHWIERIGKEIT) return AUFWAND_AUS_SCHWIERIGKEIT[schwierigkeit];
    return 'gehoben'; // Fallback, falls Schwierigkeit fehlt
  }
  return body.aufwand && AUFWANDSSTUFEN.includes(body.aufwand) ? body.aufwand : null;
}

const TECHNIK_SYSTEM_PROMPT = (aufwand: Aufwandsstufe) => `Du bist ein erfahrener Chef de Cuisine und gibst konkrete Anrichte-/Plattier-Empfehlungen für ein Gericht, im Anrichte-Stil "${aufwand}": ${AUFWAND_STIL[aufwand]}

Schlage 3-4 konkrete, direkt umsetzbare Anrichte-/Saucentechniken vor -- kurze, klare Anweisungen, wie ein Koch sie am Teller ausführen würde (z.B. "Saucenspiegel mit dem Löffelrücken ziehen", "Punkt-Reihe abnehmend anordnen", "Wischer diagonal über den Teller ziehen", "Komponente leicht schräg anlehnen für Höhe"). Beziehe dich konkret auf das genannte Gericht, nicht generisch. Verwende ausschließlich reale, tatsächlich existierende Techniken und Begriffe -- erfinde keine Fantasiebegriffe.

Antworte AUSSCHLIESSLICH mit JSON in exakt dieser Form: { "techniken": string[] }`;

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

  let body: Body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Ungültige Anfrage.' }, { status: 400 });
  }

  if (body.mode !== 'rezept' && body.mode !== 'frei') {
    return NextResponse.json({ error: 'Ungültiger Modus.' }, { status: 400 });
  }
  const dishDescription = buildDishDescription(body);
  if (!dishDescription) {
    return NextResponse.json({ error: body.mode === 'rezept' ? 'Kein Rezept angegeben.' : 'Keine Beschreibung angegeben.' }, { status: 400 });
  }
  const aufwand = resolveAufwand(body);
  if (!aufwand) {
    return NextResponse.json({ error: 'Ungültiger oder fehlender Aufwand.' }, { status: 400 });
  }

  // Bild-Kontingent zuerst NUR pruefen (kein Verbrauch) -- so wird der teure
  // Bild-Call gar nicht erst ausgeloest, wenn das Kontingent schon leer ist.
  const monthlyLimit = getMonthlyImageLimit(tier);
  const quotaBefore = await getImageQuotaStatus(user.id, monthlyLimit);
  if (quotaBefore.remaining <= 0) {
    return NextResponse.json(
      {
        error: 'quota_exceeded',
        message: 'Monatskontingent erreicht -- nächsten Monat geht es weiter.',
        quota: quotaBefore,
      },
      { status: 429 },
    );
  }

  let apiKey: string;
  try {
    apiKey = getOperatorOpenAiKey();
  } catch (e) {
    console.error('[tellerdesigner] Betreiber-Key fehlt:', e instanceof Error ? e.message : e);
    return NextResponse.json({ error: 'Der Tellerdesigner ist aktuell nicht verfügbar.' }, { status: 500 });
  }

  const imagePrompt = `Professionelle, fotorealistische Food-Fotografie: ${dishDescription} ${AUFWAND_STIL[aufwand]} Aufnahme von schräg oben (ca. 45 Grad), natürliches Licht, scharfer Fokus auf dem Teller, dezent unscharfer Hintergrund, keine Personen, kein Text, kein Wasserzeichen, kein Logo. Wirkt wie ein professionelles Foto aus einem Restaurant-Portfolio.`;

  const [imageResult, techniquesResult] = await Promise.allSettled([
    fetchWithTimeout('https://api.openai.com/v1/images/generations', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'gpt-image-1',
        prompt: imagePrompt,
        size: '1024x1024',
        quality: 'medium',
        n: 1,
      }),
    }, UPSTREAM_TIMEOUT_MS),
    fetchWithTimeout('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'gpt-4o',
        temperature: 0.7,
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: TECHNIK_SYSTEM_PROMPT(aufwand) },
          { role: 'user', content: dishDescription },
        ],
      }),
    }, UPSTREAM_TIMEOUT_MS),
  ]);

  if (imageResult.status === 'rejected' || !imageResult.value.ok) {
    if (imageResult.status === 'rejected' && imageResult.reason instanceof UpstreamTimeoutError) {
      console.error('[tellerdesigner] Timeout bei Bild-Generierung.');
      return NextResponse.json(
        { error: 'timeout', message: 'Die Bild-Generierung hat zu lange gedauert. Bitte erneut versuchen.' },
        { status: 504 },
      );
    }
    const errText = imageResult.status === 'fulfilled' ? await imageResult.value.text().catch(() => '') : String(imageResult.reason);
    console.error('[tellerdesigner] Bild-Generierung fehlgeschlagen:', errText.slice(0, 300));
    if (imageResult.status === 'fulfilled' && imageResult.value.status === 429) {
      return NextResponse.json({ error: 'Anbieter-Limit erreicht. Bitte kurz warten und erneut versuchen.' }, { status: 429 });
    }
    return NextResponse.json({ error: 'Bild-Generierung fehlgeschlagen. Bitte erneut versuchen.' }, { status: 502 });
  }

  const imageData = await imageResult.value.json();
  const b64 = imageData.data?.[0]?.b64_json;
  if (!b64) {
    console.error('[tellerdesigner] Keine Bilddaten in der Antwort.');
    return NextResponse.json({ error: 'Die KI-Antwort enthielt kein Bild. Bitte erneut versuchen.' }, { status: 502 });
  }
  const outputFormat = imageData.output_format ?? 'png';
  const image = `data:image/${outputFormat};base64,${b64}`;

  // Anrichte-Muster sind eine Ergaenzung, kein kritischer Teil -- schlaegt der
  // Text-Call fehl, liefern wir das (teure, bereits generierte) Bild trotzdem aus.
  let techniken: string[] = [];
  if (techniquesResult.status === 'fulfilled' && techniquesResult.value.ok) {
    try {
      const data = await techniquesResult.value.json();
      const parsed = JSON.parse(data.choices?.[0]?.message?.content ?? '{}');
      if (Array.isArray(parsed.techniken)) {
        techniken = parsed.techniken.filter((t: unknown): t is string => typeof t === 'string' && t.trim().length > 0).map((t: string) => t.trim());
      }
    } catch (e) {
      console.error('[tellerdesigner] Anrichte-Muster konnten nicht verarbeitet werden:', e instanceof Error ? e.message : e);
    }
  } else {
    console.error('[tellerdesigner] Anrichte-Muster-Call fehlgeschlagen (nicht kritisch).');
  }

  // Erst JETZT, nach erfolgreicher Bildgenerierung, das Kontingent tatsaechlich
  // verbrauchen -- ein fehlgeschlagener Call oben verbrennt kein Kontingent.
  const incrementResult = await incrementImageQuota(user.id, monthlyLimit);
  const quotaAfter = incrementResult.ok
    ? { used: quotaBefore.used + 1, limit: monthlyLimit, remaining: Math.max(0, monthlyLimit - quotaBefore.used - 1) }
    : quotaBefore;

  return NextResponse.json({ image, techniken, aufwand, quota: quotaAfter });
}

// Leichter Statusabruf fuer die Kontingent-Anzeige im Frontend (kein Verbrauch, kein OpenAI-Call).
export async function GET(req: NextRequest) {
  const check = await requireTier(req, MIN_TIER);
  if (!check.ok) return check.response;
  const { user, tier } = check;

  const monthlyLimit = getMonthlyImageLimit(tier);
  const quota = await getImageQuotaStatus(user.id, monthlyLimit);
  return NextResponse.json({ quota });
}
