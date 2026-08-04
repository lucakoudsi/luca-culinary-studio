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
// Etappe 1 (Zutaten-Positionen): Textcall laeuft jetzt VOR dem Bildcall
// (sequenziell, nicht mehr parallel via Promise.allSettled), damit der
// Bildprompt die vom Textmodell geplanten Positionen einweben kann. 90s
// Budget statt 60s, siehe TEXT_TIMEOUT_MS/IMAGE_TIMEOUT_MS unten fuer die
// Aufteilung -- gemessene Werte (Textcall 6,3s, Bildcall 17s) lassen auch
// im Worst Case reichlich Puffer.
export const maxDuration = 90;

const MIN_TIER = 3; // Pro -- Tellerdesigner ist Pro-exklusiv (docs/abo-konzept.md)
const MAX_DESCRIPTION_LENGTH = 1500;
// Bewusst knapper als gpt-4o-Antworten typischerweise brauchen (gemessen
// 6,3s) -- ein haengender Textcall soll nicht das halbe maxDuration-Budget
// verbrennen; bei Timeout greift der Fallback (Bildprompt ohne Positions-
// Klausel, siehe buildImagePrompt), das ist die bessere Antwort als lange
// warten.
const TEXT_TIMEOUT_MS = 15_000;
// Unveraendert -- der Wert war nie das Problem (gemessen 17s).
const IMAGE_TIMEOUT_MS = 50_000;

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

const MAX_KOMPONENTEN = 8;
const MAX_ZUTATEN_PRO_KOMPONENTE = 6; // begrenzt pro Komponente, damit die Beschreibung nicht ausufert
const MAX_HAUPTZUTATEN = 8;

// Vorher: bei Komponenten wurde NUR k.name gelistet (z.B. "Sauce", "Beilage"),
// die tatsaechlichen Zutaten je Komponente (k.zutaten) wurden nie gelesen --
// das Textmodell bekam dadurch teils kaum echte Zutatennamen und konnte das
// "zutaten"-Feld (Etappe 1, Positionen) nicht befuellen, ohne gegen die
// "nichts erfinden"-Vorgabe zu verstossen. Jetzt: Komponenten UND
// Hauptzutaten koennen gemeinsam im Text stehen (kein else-if mehr), pro
// Komponente werden ihre eigenen Zutaten mit aufgelistet.
function buildDishDescription(body: Body): string | null {
  if (body.mode === 'rezept') {
    const titel = (body.rezeptTitel ?? '').trim();
    if (!titel) return null;
    const teile = [`Gericht: "${titel}"`];
    const komponenten = (body.rezeptKomponenten ?? []).filter(k => k.name?.trim()).slice(0, MAX_KOMPONENTEN);
    const zutaten = (body.rezeptZutaten ?? []).filter(z => z.name?.trim());

    if (komponenten.length > 0) {
      const komponentenText = komponenten
        .map(k => {
          const kZutaten = (k.zutaten ?? []).filter(z => z.name?.trim()).slice(0, MAX_ZUTATEN_PRO_KOMPONENTE);
          const zutatenSuffix = kZutaten.length > 0 ? ` (${kZutaten.map(z => z.name.trim()).join(', ')})` : '';
          return `${k.name.trim()}${zutatenSuffix}`;
        })
        .join('; ');
      teile.push(`Bestehend aus den Komponenten: ${komponentenText}.`);
    }
    if (zutaten.length > 0) {
      teile.push(`Hauptzutaten: ${zutaten.slice(0, MAX_HAUPTZUTATEN).map(z => z.name.trim()).join(', ')}.`);
    }
    return teile.join(' ').slice(0, MAX_DESCRIPTION_LENGTH);
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
// Bewusst NICHT an MAX_TECHNIKEN gekoppelt -- dessen 6 kommt von den festen
// Bildschirm-Slots, dieses 6 kommt aus der Erfindungsgefahr: je mehr
// Zutaten-Positionen verlangt werden, desto eher erfindet das Modell
// zusaetzliche, nicht wirklich vorhandene Komponenten nur um die Zahl zu
// erreichen.
const MAX_ZUTATEN = 6;

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
  const zutatenSchema = '"zutaten": [{ "name": string, "position": { "x": number, "y": number }, "rolle": string, "kurzsatz": string }]';
  const jsonSchema = wantsTitel
    ? `{ "techniken": [{ "schlagwort": string, "kurzsatz": string, "anleitung": string }], ${zutatenSchema}, "titel": string }`
    : `{ "techniken": [{ "schlagwort": string, "kurzsatz": string, "anleitung": string }], ${zutatenSchema} }`;

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

Beziehe dich konkret auf das genannte Gericht UND auf die gewählte Stilrichtung/den Anrichte-Fokus, nicht generisch. Verwende ausschließlich reale, tatsächlich existierende Techniken/Zutaten/Begriffe -- orientiere dich bevorzugt an der obigen Sammlung, ergänze bei Bedarf um weitere reale Techniken, aber erfinde keine Fantasiebegriffe. Liefere NIEMALS mehr als ${MAX_TECHNIKEN} Einträge -- die Labels haben nur ${MAX_TECHNIKEN} feste Positionen im Bild.

Benenne zusätzlich bis zu ${MAX_ZUTATEN} sichtbare Hauptkomponenten/Zutaten des fertig angerichteten Gerichts mit ihrer ungefähren Position auf dem Teller (Feld "zutaten"), JEWEILS mit vier Feldern:
- "name": die reale Zutat/Komponente (z.B. "Kalbsbäckchen", "Selleriepüree", "Kräuteröl").
- "position": {"x", "y"}, je 0.0-1.0, bezogen auf das GESAMTE Bild (0/0 = oben links, 1/1 = unten rechts), nicht nur auf den Teller.
- "rolle": kurz, z.B. "Hauptkomponente", "Sauce", "Garnitur", "Textur".
- "kurzsatz": maximal 8 Wörter, was diese Komponente ist.
Nenne NUR so viele, wie das Gericht tatsächlich hat -- bei einem einfachen Gericht reichen 2-3 völlig aus, erfinde keine zusätzlichen Komponenten nur um die Zahl zu erreichen. Verwende ausschließlich reale, tatsächlich im Gericht vorhandene Zutaten -- keine Fantasiebegriffe.${titelAnweisung}

Antworte AUSSCHLIESSLICH mit JSON in exakt dieser Form: ${jsonSchema}`;
}

// Bildmodelle folgen erfahrungsgemaess raeumlicher Sprache zuverlaessiger als
// nackten Koordinaten -- 3x3-Raster statt Zahlen. Bewusst explizit auf den
// TELLER bezogen ("im oberen Tellerbereich", "am linken Tellerrand") statt
// nur "oben"/"links": Letzteres koennte das Modell als Bildkante statt als
// Tellerposition lesen, da x/y bildbezogen sind (siehe Prompt oben), der
// Bildprompt aber pro Zutat eine Position AUF DEM TELLER beschreiben soll.
function positionToRegion(x: number, y: number): string {
  const col = x < 1 / 3 ? 0 : x < 2 / 3 ? 1 : 2;
  const row = y < 1 / 3 ? 0 : y < 2 / 3 ? 1 : 2;
  if (row === 1 && col === 1) return 'in der Mitte des Tellers';
  if (row === 1) return col === 0 ? 'am linken Tellerrand' : 'am rechten Tellerrand';
  if (col === 1) return row === 0 ? 'im oberen Tellerbereich' : 'im unteren Tellerbereich';
  const vert = row === 0 ? 'oberen' : 'unteren';
  const horiz = col === 0 ? 'linken' : 'rechten';
  return `im ${vert} ${horiz} Tellerbereich`;
}

// Ein zusaetzlicher Satz direkt nach der Techniken-Auswahl, VOR dem
// unangetasteten Hintergrund-/Beleuchtungsblock. Leerer String bei leerem
// zutaten -- das IST der Fallback "Bildprompt ohne Positions-Klausel" bei
// fehlgeschlagenem/getimeoutetem Textcall, kein separater Prompt-Zweig
// noetig. "rolle" bewusst NICHT im Satz -- nur in den gespeicherten Daten,
// der Bildprompt ist schon dicht genug.
function buildZutatenPromptClause(zutaten: { name: string; position: { x: number; y: number } }[]): string {
  if (zutaten.length === 0) return '';
  const teile = zutaten.map(z => `${z.name} ${positionToRegion(z.position.x, z.position.y)}`);
  return ` Ordne die Komposition auf dem Teller wie folgt an: ${teile.join('; ')}.`;
}

function clamp01(n: number): number {
  return Math.max(0, Math.min(1, n));
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

  const wantsTitel = body.mode === 'frei';

  // Textcall LAEUFT JETZT VOR dem Bildcall (Etappe 1: Zutaten-Positionen) --
  // der Bildprompt unten webt die geplanten Positionen ein. Anrichte-Muster/
  // Zutaten-Positionen (+ Titel im frei-Modus) bleiben eine Ergaenzung, kein
  // kritischer Teil: schlaegt der Text-Call fehl oder timeoutet er (kurzes
  // eigenes Budget, TEXT_TIMEOUT_MS), geht die Generierung OHNE Anrichte-
  // Muster und OHNE Positions-Klausel im Bildprompt weiter -- kein Abbruch,
  // der Fallback IST einfach ein leeres zutaten (siehe buildZutatenPromptClause).
  let techniken: { schlagwort: string; kurzsatz: string; anleitung: string }[] = [];
  let zutaten: { name: string; position: { x: number; y: number }; rolle: string; kurzsatz: string }[] = [];
  let titel: string | undefined;
  try {
    const techniquesResponse = await fetchWithTimeout('https://api.openai.com/v1/chat/completions', {
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
    }, TEXT_TIMEOUT_MS);

    if (techniquesResponse.ok) {
      const data = await techniquesResponse.json();
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
      if (Array.isArray(parsed.zutaten)) {
        zutaten = parsed.zutaten
          .filter((z: unknown): z is Record<string, unknown> => !!z && typeof z === 'object')
          .map((z: Record<string, unknown>) => {
            const pos = z.position as Record<string, unknown> | undefined;
            const x = typeof pos?.x === 'number' ? pos.x : null;
            const y = typeof pos?.y === 'number' ? pos.y : null;
            if (x === null || y === null) return null; // fehlende Position -> verwerfen, NICHT auf 0.5/0.5 auffuellen
            return {
              name: typeof z.name === 'string' ? z.name.trim() : '',
              position: { x: clamp01(x), y: clamp01(y) },
              rolle: typeof z.rolle === 'string' ? z.rolle.trim() : '',
              kurzsatz: typeof z.kurzsatz === 'string' ? z.kurzsatz.trim() : '',
            };
          })
          .filter((z: { name: string } | null): z is { name: string; position: { x: number; y: number }; rolle: string; kurzsatz: string } => z !== null && !!z.name)
          .slice(0, MAX_ZUTATEN);
      }
      if (wantsTitel && typeof parsed.titel === 'string' && parsed.titel.trim()) {
        titel = parsed.titel.trim();
      }
    } else {
      console.error('[tellerdesigner] Anrichte-Muster-Call fehlgeschlagen (nicht kritisch), Status:', techniquesResponse.status);
    }
  } catch (e) {
    if (e instanceof UpstreamTimeoutError) {
      console.error('[tellerdesigner] Timeout beim Textcall (nicht kritisch) -- Generierung laeuft ohne Anrichte-Muster/Zutaten-Positionen weiter.');
    } else {
      console.error('[tellerdesigner] Anrichte-Muster konnten nicht verarbeitet werden:', e instanceof Error ? e.message : e);
    }
  }

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
  // unabhaengig als sichtbarer Kreis um den Teller stehen. Die Zutaten-
  // Positionsklausel (falls vorhanden) sitzt VOR diesem Block, nicht darin --
  // der Block selbst bleibt Zeichen fuer Zeichen unangetastet.
  const imagePrompt = `Professionelle, fotorealistische Food-Fotografie: ${dishDescription} ${STILRICHTUNG_PROMPT[stilrichtung]} ${ANRICHTE_FOKUS_PROMPT[anrichteFokus]} ${AUFWAND_STIL[aufwand]} Verwende dabei bevorzugt reale Plattier-Techniken aus dieser Auswahl, soweit zum Gericht passend: ${technikenNamenListe}.${buildZutatenPromptClause(zutaten)} Top-down view, plate isolated on a plain light cream/off-white seamless background, no table, no props, no texture. Seamless plain background, no vignette, no shadow edges, no visible frame -- the background must be perfectly flat and uniform all the way to the image edges, with no darkening, no gradient, and no soft shadow ring around the plate. Professional editorial food photography, soft directional studio lighting on the dish itself only (not on the background) bringing out texture and height, elegant plating with height and dimension, michelin-star plating precision. The background must stay plain, bright, light cream/off-white throughout -- never dark, never a moody restaurant backdrop. No people, no text, no watermark, no logo.`;

  let imageResponse: Response;
  try {
    imageResponse = await fetchWithTimeout('https://api.openai.com/v1/images/generations', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'gpt-image-1',
        prompt: imagePrompt,
        size: '1024x1024',
        quality: 'medium',
        n: 1,
      }),
    }, IMAGE_TIMEOUT_MS);
  } catch (e) {
    if (e instanceof UpstreamTimeoutError) {
      console.error('[tellerdesigner] Timeout bei Bild-Generierung.');
      return NextResponse.json(
        { error: 'timeout', message: 'Die Bild-Generierung hat zu lange gedauert. Bitte erneut versuchen.' },
        { status: 504 },
      );
    }
    console.error('[tellerdesigner] Bild-Generierung fehlgeschlagen:', e instanceof Error ? e.message : e);
    return NextResponse.json({ error: 'Bild-Generierung fehlgeschlagen. Bitte erneut versuchen.' }, { status: 502 });
  }

  if (!imageResponse.ok) {
    const errText = await imageResponse.text().catch(() => '');
    console.error('[tellerdesigner] Bild-Generierung fehlgeschlagen:', errText.slice(0, 300));
    if (imageResponse.status === 429) {
      return NextResponse.json({ error: 'Anbieter-Limit erreicht. Bitte kurz warten und erneut versuchen.' }, { status: 429 });
    }
    return NextResponse.json({ error: 'Bild-Generierung fehlgeschlagen. Bitte erneut versuchen.' }, { status: 502 });
  }

  const imageData = await imageResponse.json();
  const b64 = imageData.data?.[0]?.b64_json;
  if (!b64) {
    console.error('[tellerdesigner] Keine Bilddaten in der Antwort.');
    return NextResponse.json({ error: 'Die KI-Antwort enthielt kein Bild. Bitte erneut versuchen.' }, { status: 502 });
  }
  const outputFormat = imageData.output_format ?? 'png';
  const image = `data:image/${outputFormat};base64,${b64}`;

  // Erst JETZT, nach erfolgreicher Bildgenerierung, das Kontingent tatsaechlich
  // verbrauchen -- ein fehlgeschlagener Call oben verbrennt kein Kontingent.
  const incrementResult = await incrementImageQuota(user.id, monthlyLimit);
  const quotaAfter = incrementResult.ok
    ? { used: quotaBefore.used + 1, limit: monthlyLimit, remaining: Math.max(0, monthlyLimit - quotaBefore.used - 1) }
    : quotaBefore;

  return NextResponse.json({ image, techniken, zutaten, titel, aufwand, stilrichtung, anrichteFokus, quota: quotaAfter });
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
