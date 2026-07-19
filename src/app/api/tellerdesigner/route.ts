import { NextRequest, NextResponse } from 'next/server';
import { requireTier } from '@/lib/apiAuth';
import { checkRateLimit } from '@/lib/rate-limit';
import { getOperatorOpenAiKey } from '@/lib/operator-key';
import { getMonthlyImageLimit, getImageQuotaStatus, incrementImageQuota } from '@/lib/image-quota';
import { AUFWANDSSTUFEN, type Aufwandsstufe } from '@/config/techniken';
import { STILRICHTUNGEN, STILRICHTUNG_LABEL, STILRICHTUNG_PROMPT, type Stilrichtung } from '@/config/tellerStilrichtung';
import { ANRICHTE_FOKUSSE, ANRICHTE_FOKUS_LABEL, ANRICHTE_FOKUS_PROMPT, type AnrichteFokus } from '@/config/tellerAnrichteFokus';
import { technikenFuer, formatTechnikenKontext } from '@/config/anrichteTechniken';
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
  freieBeschreibung?: string;
  aufwand?: Aufwandsstufe;
  stilrichtung?: Stilrichtung;
  anrichteFokus?: AnrichteFokus;
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

// Aufwand kommt in BEIDEN Modi direkt vom Client (Schwierigkeits-Slider) --
// im Rezept-Modus setzt das Frontend nur die Ausgangsposition aus der
// Rezept-Schwierigkeit, der Nutzer kann sie danach frei uebersteuern. Die
// frueher hier serverseitige Ableitung aus rezeptSchwierigkeit ist damit
// obsolet, siehe TellerControls.tsx.
function resolveAufwand(body: Body): Aufwandsstufe | null {
  return body.aufwand && AUFWANDSSTUFEN.includes(body.aufwand) ? body.aufwand : null;
}

function resolveStilrichtung(body: Body): Stilrichtung | null {
  return body.stilrichtung && STILRICHTUNGEN.includes(body.stilrichtung) ? body.stilrichtung : null;
}

function resolveAnrichteFokus(body: Body): AnrichteFokus | null {
  return body.anrichteFokus && ANRICHTE_FOKUSSE.includes(body.anrichteFokus) ? body.anrichteFokus : null;
}

const MAX_TECHNIKEN = 6; // deckungsgleich mit den 6 festen Label-Positionen im Frontend (TellerStage)

// Ein Systemprompt-Baustein pro Dimension (Aufwand/Stilrichtung/Anrichte-Fokus),
// dieselben drei Texte fliessen sowohl in den Bild-Prompt als auch hier ein --
// die vorgeschlagenen Techniken sollen zur GESAMTEN Kombination passen, nicht
// nur zum Aufwand.
function buildTechnikSystemPrompt(
  aufwand: Aufwandsstufe,
  stilrichtung: Stilrichtung,
  anrichteFokus: AnrichteFokus,
  wantsTitel: boolean,
  technikenKontext: string,
): string {
  const titelAnweisung = wantsTitel
    ? `\n\nDas Gericht wurde frei beschrieben, ohne eigenen Namen. Erfinde zusätzlich einen kurzen, appetitlichen Gerichtnamen (2-5 Wörter, wie auf einer Menükarte formuliert) und gib ihn im Feld "titel" zurück.`
    : '';
  const jsonSchema = wantsTitel
    ? '{ "techniken": [{ "schlagwort": string, "kurzsatz": string, "anleitung": string }], "titel": string }'
    : '{ "techniken": [{ "schlagwort": string, "kurzsatz": string, "anleitung": string }] }';

  return `Du bist ein erfahrener Chef de Cuisine und gibst konkrete Anrichte-/Plattier-Empfehlungen für ein Gericht, aufbereitet als Bild-Labels (wie Beschriftungen auf einer Menükarten-Illustration).

Stilrichtung "${STILRICHTUNG_LABEL[stilrichtung]}": ${STILRICHTUNG_PROMPT[stilrichtung]}
Anrichte-Fokus "${ANRICHTE_FOKUS_LABEL[anrichteFokus]}": ${ANRICHTE_FOKUS_PROMPT[anrichteFokus]}
Aufwandsstufe "${aufwand}": ${AUFWAND_STIL[aufwand]}

Zu dieser Kombination passende, real existierende Plattier-Techniken aus unserer kuratierten Sammlung (bevorzugt hieraus schöpfen, nicht zwingend alle verwenden):
${technikenKontext}

Schlage 4-${MAX_TECHNIKEN} konkrete Anrichte-/Saucentechniken oder auffällige Komponenten vor, JEWEILS mit drei Feldern:
- "schlagwort": EIN bis maximal zwei Wörter, GROSSGESCHRIEBEN als Label gedacht (z.B. "SAUCENSPIEGEL", "PUNKT-REIHE", "FISCHHAUT", "NORI"). Kein ganzer Satz.
- "kurzsatz": maximal 8 Wörter, knapp und konkret, was diese Technik/Komponente bewirkt (z.B. "Bringt eine feine Umami-Note.", "Sorgt für Textur und Kontrast."). Wird permanent unter dem Schlagwort angezeigt.
- "anleitung": der ausführliche, direkt umsetzbare Handgriff, wie ein Koch ihn am Teller ausführen würde (z.B. "Saucenspiegel mit dem Löffelrücken in einer fließenden Bewegung ziehen, dabei den Teller leicht kippen."). Wird erst bei Klick/Hover angezeigt.

Beziehe dich konkret auf das genannte Gericht UND auf die gewählte Stilrichtung/den Anrichte-Fokus, nicht generisch. Verwende ausschließlich reale, tatsächlich existierende Techniken/Zutaten/Begriffe -- orientiere dich bevorzugt an der obigen Sammlung, ergänze bei Bedarf um weitere reale Techniken, aber erfinde keine Fantasiebegriffe. Liefere NIEMALS mehr als ${MAX_TECHNIKEN} Einträge -- die Labels haben nur ${MAX_TECHNIKEN} feste Positionen im Bild.${titelAnweisung}

Antworte AUSSCHLIESSLICH mit JSON in exakt dieser Form: ${jsonSchema}`;
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
  const stilrichtung = resolveStilrichtung(body);
  if (!stilrichtung) {
    return NextResponse.json({ error: 'Ungültige oder fehlende Stilrichtung.' }, { status: 400 });
  }
  const anrichteFokus = resolveAnrichteFokus(body);
  if (!anrichteFokus) {
    return NextResponse.json({ error: 'Ungültiger oder fehlender Anrichte-Fokus.' }, { status: 400 });
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

  // Kuratierte Anrichte-Techniken (src/config/anrichteTechniken.ts) passend
  // zu Aufwandsstufe + Anrichte-Fokus -- Grundlage fuer BEIDE Prompts unten,
  // damit Bild UND Techniken-Labels aus echtem Handwerk statt freier
  // Erfindung kommen.
  const passendeTechniken = technikenFuer(aufwand, anrichteFokus);
  const technikenKontext = formatTechnikenKontext(passendeTechniken);
  const technikenNamenListe = passendeTechniken.map(t => t.name).join(', ');

  // "Freigestellt" statt Restaurant-Ambiente: der Teller soll im Frontend frei
  // auf der Creme-Seite schweben (kein Rahmen/Kasten), dafür muss das Bild
  // selbst schon isoliert und schattenfrei-flach vom Hintergrund kommen --
  // exakte Vorgabe (Englisch, wirkt bei gpt-image-1 zuverlaessiger als eine
  // deutsche Umschreibung fuer diese Art Produktfotografie-Anweisung).
  // WICHTIG: "dramatic lighting"/"michelin-star presentation" allein liess
  // gpt-image-1 wiederholt einen dunklen Restaurant-Hintergrund rendern statt
  // des isolierten Creme-Hintergrunds -- die Hintergrund-Vorgabe muss deshalb
  // explizit gegen die Stimmungs-Zusaetze verteidigt werden (Klammerzusatz),
  // sonst bricht die freischwebende Teller-Optik im Frontend. Zusaetzlich
  // "no vignette, no shadow edges, no visible frame" -- die CSS-Radialmaske
  // (teller-image-mask) blendet die Bildkante zwar weich aus, aber ein vom
  // Modell selbst erzeugter Vignetten-/Schatten-/Rahmenrand blieb davon
  // unabhaengig als sichtbarer Kreis um den Teller stehen.
  const imagePrompt = `Professionelle, fotorealistische Food-Fotografie: ${dishDescription} ${STILRICHTUNG_PROMPT[stilrichtung]} ${ANRICHTE_FOKUS_PROMPT[anrichteFokus]} ${AUFWAND_STIL[aufwand]} Verwende dabei bevorzugt reale Plattier-Techniken aus dieser Auswahl, soweit zum Gericht passend: ${technikenNamenListe}. Top-down view, plate isolated on a plain light cream/off-white seamless background, no table, no props, no texture. Seamless plain background, no vignette, no shadow edges, no visible frame -- the background must be perfectly flat and uniform all the way to the image edges, with no darkening, no gradient, and no soft shadow ring around the plate. Professional editorial food photography, soft directional studio lighting on the dish itself only (not on the background) bringing out texture and height, elegant plating with height and dimension, michelin-star plating precision. The background must stay plain, bright, light cream/off-white throughout -- never dark, never a moody restaurant backdrop. No people, no text, no watermark, no logo.`;

  const wantsTitel = body.mode === 'frei';

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
          { role: 'system', content: buildTechnikSystemPrompt(aufwand, stilrichtung, anrichteFokus, wantsTitel, technikenKontext) },
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

  // Anrichte-Muster (+ Titel im frei-Modus) sind eine Ergaenzung, kein
  // kritischer Teil -- schlaegt der Text-Call fehl, liefern wir das (teure,
  // bereits generierte) Bild trotzdem aus.
  let techniken: { schlagwort: string; kurzsatz: string; anleitung: string }[] = [];
  let titel: string | undefined;
  if (techniquesResult.status === 'fulfilled' && techniquesResult.value.ok) {
    try {
      const data = await techniquesResult.value.json();
      const parsed = JSON.parse(data.choices?.[0]?.message?.content ?? '{}');
      if (Array.isArray(parsed.techniken)) {
        techniken = parsed.techniken
          .filter((t: unknown): t is Record<string, unknown> => !!t && typeof t === 'object')
          .map((t: Record<string, unknown>) => ({
            schlagwort: typeof t.schlagwort === 'string' ? t.schlagwort.trim().toUpperCase() : '',
            kurzsatz: typeof t.kurzsatz === 'string' ? t.kurzsatz.trim() : '',
            anleitung: typeof t.anleitung === 'string' ? t.anleitung.trim() : '',
          }))
          .filter((t: { schlagwort: string; kurzsatz: string; anleitung: string }) => t.schlagwort && t.kurzsatz)
          .slice(0, MAX_TECHNIKEN);
      }
      if (wantsTitel && typeof parsed.titel === 'string' && parsed.titel.trim()) {
        titel = parsed.titel.trim();
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

  return NextResponse.json({ image, techniken, titel, aufwand, stilrichtung, anrichteFokus, quota: quotaAfter });
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
