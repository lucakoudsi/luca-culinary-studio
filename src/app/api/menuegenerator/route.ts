import { NextRequest, NextResponse } from 'next/server';
import { requireTier } from '@/lib/apiAuth';
import { checkRateLimit } from '@/lib/rate-limit';
import { createAdminClient } from '@/lib/supabase-admin';
import { getOperatorOpenAiKey } from '@/lib/operator-key';
import { getMonthlyTextLimit, getTextQuotaStatus, incrementTextQuota, TEXT_QUOTA_WEIGHTS } from '@/lib/text-quota';
import { matchWeine, type Wein, type FoodProfile } from '@/lib/weinPairing';
import {
  AUFWANDSSTUFEN, TECHNIKEN_NACH_AUFWAND, ZUSATZ_TECHNIKEN_NACH_AUFWAND,
  normalisiereTechnik, type Aufwandsstufe,
} from '@/config/techniken';
import { fetchWithTimeout, UpstreamTimeoutError } from '@/lib/upstreamTimeout';

export const dynamic = 'force-dynamic';
export const maxDuration = 60; // ein volles Menue kann 15-25s dauern (gemessen), Vercel-Default reicht nicht

const MENUEGENERATOR_MIN_TIER = 2; // Basic, siehe docs/abo-konzept.md Abschnitt 2a
const MAX_ZUTATEN = 50; // Obergrenze fuer den Prompt-Kontext -- nicht alle 500 mitgeben
const UPSTREAM_TIMEOUT_MS = 50_000; // etwas unter maxDuration, damit wir noch selbst antworten koennen

type ZutatKontext = {
  id: number;
  name: string;
  kategorie: string;
  aromaprofil: string[] | null;
  geschmack: Record<string, number> | null;
  pairings: string[] | null;
};

const ZUTAT_COLUMNS = 'id, name, kategorie, aromaprofil, geschmack, pairings';

const KUECHENSTIL_VALUES = [
  'japanisch', 'nordisch', 'franzoesisch_klassisch', 'mediterran', 'modern_fusion', 'keine_vorgabe',
] as const;
type Kuechenstil = typeof KUECHENSTIL_VALUES[number];

type RequestBody = {
  anlass?: string;
  gaenge?: number;
  saison?: string;
  diaet?: string[];
  leitmotiv?: string;
  pflicht_zutaten?: number[];
  ausschluss_zutaten?: number[];
  aufwand?: string;
  kuechenstil?: string;
};

function parseIdArray(value: unknown): number[] {
  if (!Array.isArray(value)) return [];
  return Array.from(new Set(
    value.map(v => Number(v)).filter(v => Number.isInteger(v) && v > 0),
  ));
}

const SYSTEM_PROMPT = `Du bist der Menü-Komponist von LUCA Culinary Studio, spezialisiert auf die Gestaltung stimmiger Mehrgänge-Menüs für professionelle und ambitionierte Köch:innen.

Du bekommst eine Liste verfügbarer Zutaten mit Kategorie, Aromaprofil, Geschmacksachsen (Skala 0-5: acidity, sweetness, bitterness, umami, spiciness, saltiness) und Pairings. Komponiere daraus ein Menü mit der angegebenen Gangzahl.

Verwende ausschließlich reale, tatsächlich existierende Zutaten, Zubereitungsbegriffe und Fachausdrücke. Erfinde niemals Wörter oder Fantasiebegriffe -- falls dir bei einer Formulierung ein Begriff nicht sicher einfällt, nutze einen einfacheren, aber echten Begriff statt zu improvisieren.

Dramaturgie (WICHTIG, strikt einhalten):
- Die Gänge sollen über den Verlauf einen Geschmacks-Spannungsbogen bilden: ein leichter, säurebetonter Auftakt, steigende Intensität zur Mitte (Umami-/Fett-Eindruck), ein bewusster Kontrast vor dem Dessert.
- Kein Gang darf das dominante Geschmacksprofil des direkt vorangehenden Gangs wiederholen.
- Begründe die Dramaturgie kurz und konkret (welcher Gang bringt welche Achse, warum diese Reihenfolge).

Zutatenwahl:
- Nutze bevorzugt die mitgegebenen Zutaten -- die "hauptzutaten" pro Gang sollen möglichst exakt aus deren Namen stammen (für spätere Verlinkung in der App). Nur wenn wirklich nötig, ergänze eine naheliegende Zutat, die nicht in der Liste steht.
- Beachte Anlass und etwaige Diät-Einschränkungen strikt.
- Vermeide naheliegende Standard-Kombinationen und wiederkehrende Lieblingszutaten. Überrasche mit einer weniger offensichtlichen, aber stimmigen Auswahl aus dem gegebenen Kontext, statt immer zu denselben auffälligen/exotischen Zutaten zu greifen.

HARTE REGELN (keine Ausnahme, wichtiger als alles andere in diesem Prompt):
- Falls "pflicht_zutaten" im Kontext mitgegeben ist: JEDE dieser Zutaten MUSS in mindestens einem Gang als Hauptzutat vorkommen. Finde für jede eine sinnvolle Verwendung, auch wenn es Kreativität erfordert -- weglassen ist keine Option.
- Falls "ausschluss_zutaten" (Namen) im Kontext mitgegeben ist: KEINE dieser Zutaten darf irgendwo im Menü vorkommen -- weder als Hauptzutat noch als Nebenzutat, weder in "beschreibung" noch in "zubereitungsidee".

Stil-Vorgaben (Orientierung, kein hartes Muss, aber deutlich einbauen):
- "aufwand" steuert die Komplexität der Komponenten pro Gang: "bistro" = wenige, einfache Komponenten, schnell umsetzbar; "gehoben" = mehrteilige Komponenten, präzise Technik; "fine_dining" = aufwendige Mehrfach-Komponenten, hohe technische Präzision, kleinteilige Elemente. (Die konkret erlaubten Techniken für die gewählte Stufe stehen ggf. als zusätzliche harte Regel weiter unten.)
- "kuechenstil" (falls angegeben und nicht "keine_vorgabe") gibt die kulinarische Richtung vor -- Zutatenwahl, Techniken und Formulierung sollen erkennbar dazu passen.
- Ein zusätzliches Freitext-"leitmotiv" (falls angegeben) ergänzt den Küchenstil und wird ebenfalls berücksichtigt.

Antworte AUSSCHLIESSLICH mit JSON in exakt dieser Form, keine Erklärung davor/danach:
{
  "titel": string,
  "dramaturgie_begruendung": string,
  "gaenge": [
    {
      "nummer": number,
      "titel": string,
      "beschreibung": string,
      "hauptzutaten": string[],
      "geschmacksprofil": { "acidity": number, "sweetness": number, "bitterness": number, "umami": number, "spiciness": number, "saltiness": number },
      "zubereitungsidee": string,
      "technik": string
    }
  ]
}
"technik" ist die EINE zentrale Zubereitungstechnik dieses Gangs (ein einzelnes Wort/kurzer Begriff, z.B. "braten", "sous-vide", "fermentieren") -- muss zur in "zubereitungsidee" beschriebenen Zubereitung passen.`;

// Fisher-Yates -- ohne das war die DB-Reihenfolge bei gleichen Filtern stets
// identisch, wodurch spreadAcrossCategories() bei jedem Aufruf dieselben
// (auffaelligsten) Zutaten pro Kategorie gezogen hat (z.B. immer Sudachi).
function shuffle<T>(items: T[]): T[] {
  const arr = [...items];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// Round-Robin ueber die Kategorien, damit die Auswahl gestreut ist statt
// z.B. nur die ersten 50 alphabetisch/nach id.
function spreadAcrossCategories(items: ZutatKontext[], max: number): ZutatKontext[] {
  const byCategory = new Map<string, ZutatKontext[]>();
  for (const item of items) {
    const list = byCategory.get(item.kategorie) ?? [];
    list.push(item);
    byCategory.set(item.kategorie, list);
  }
  const categories = Array.from(byCategory.keys());
  const result: ZutatKontext[] = [];
  let idx = 0;
  while (result.length < max && categories.some(c => (byCategory.get(c)?.length ?? 0) > idx)) {
    for (const c of categories) {
      if (result.length >= max) break;
      const item = byCategory.get(c)?.[idx];
      if (item) result.push(item);
    }
    idx++;
  }
  return result;
}

export async function POST(req: NextRequest) {
  const check = await requireTier(req, MENUEGENERATOR_MIN_TIER);
  if (!check.ok) return check.response;
  const { user, tier } = check;

  const rateLimit = await checkRateLimit(user.id);
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: `rate_limit_${rateLimit.reason}`, message: rateLimit.message },
      { status: 429 },
    );
  }

  let body: RequestBody;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Ungültige Anfrage.' }, { status: 400 });
  }

  const anlass = typeof body.anlass === 'string' ? body.anlass.trim() : '';
  const saison = typeof body.saison === 'string' ? body.saison.trim() : '';
  const diaet = Array.isArray(body.diaet) ? body.diaet.filter(d => typeof d === 'string') : [];
  const leitmotiv = typeof body.leitmotiv === 'string' ? body.leitmotiv.trim() : '';
  const gaengeRaw = Number(body.gaenge);
  const gaenge = Number.isFinite(gaengeRaw) && gaengeRaw > 0
    ? Math.min(Math.max(Math.floor(gaengeRaw), 1), 12)
    : 4;

  const pflichtZutatenIds = parseIdArray(body.pflicht_zutaten);
  const ausschlussZutatenIds = parseIdArray(body.ausschluss_zutaten);

  if (body.aufwand !== undefined && !AUFWANDSSTUFEN.includes(body.aufwand as Aufwandsstufe)) {
    return NextResponse.json({ error: `aufwand muss einer von ${AUFWANDSSTUFEN.join(', ')} sein.` }, { status: 400 });
  }
  const aufwand = (body.aufwand as Aufwandsstufe | undefined) ?? null;

  if (body.kuechenstil !== undefined && !KUECHENSTIL_VALUES.includes(body.kuechenstil as Kuechenstil)) {
    return NextResponse.json({ error: `kuechenstil muss einer von ${KUECHENSTIL_VALUES.join(', ')} sein.` }, { status: 400 });
  }
  const kuechenstil = (body.kuechenstil as Kuechenstil | undefined) ?? null;

  if (!anlass || !saison) {
    return NextResponse.json({ error: 'anlass und saison sind erforderlich.' }, { status: 400 });
  }

  const conflictIds = pflichtZutatenIds.filter(id => ausschlussZutatenIds.includes(id));
  if (conflictIds.length > 0) {
    return NextResponse.json(
      { error: `Widersprüchliche Vorgabe: Zutaten-ID(s) ${conflictIds.join(', ')} stehen sowohl in pflicht_zutaten als auch in ausschluss_zutaten.` },
      { status: 400 },
    );
  }

  const db = createAdminClient();
  // "saison" ist jsonb (JSON-Array-Syntax fuer cs.), "diaet_tags" ist ein
  // echtes Postgres text[] (Array-Literal-Syntax fuer cs.) -- unterschiedliche
  // Spaltentypen trotz gleicher Array-Optik im App-Code, daher .filter() statt
  // .contains() (das fuer beide dieselbe Serialisierung verwenden wuerde).
  let query = db
    .from('zutaten')
    .select(ZUTAT_COLUMNS)
    .filter('saison', 'cs', JSON.stringify([saison]));

  if (diaet.length > 0) {
    query = query.filter('diaet_tags', 'cs', `{${diaet.join(',')}}`);
  }

  const { data: zutatenRaw, error: zutatenError } = await query;
  if (zutatenError) {
    console.error('[menuegenerator] Zutaten-Query fehlgeschlagen:', zutatenError.message);
    return NextResponse.json({ error: 'Interner Fehler beim Laden der Zutaten.' }, { status: 500 });
  }

  // Pflicht-Zutaten explizit laden -- auch wenn sie nicht zur Saison/Diaet passen,
  // der Koch hat sie ja da und will sie zwingend verwenden.
  let pflichtZutaten: ZutatKontext[] = [];
  if (pflichtZutatenIds.length > 0) {
    const { data: pflichtRaw, error: pflichtError } = await db
      .from('zutaten')
      .select(ZUTAT_COLUMNS)
      .in('id', pflichtZutatenIds);
    if (pflichtError) {
      console.error('[menuegenerator] Pflicht-Zutaten-Query fehlgeschlagen:', pflichtError.message);
      return NextResponse.json({ error: 'Interner Fehler beim Laden der Pflicht-Zutaten.' }, { status: 500 });
    }
    pflichtZutaten = (pflichtRaw ?? []) as ZutatKontext[];
  }
  const pflichtIdSet = new Set(pflichtZutaten.map(z => z.id));

  // Ausschluss-Zutaten: Namen fuer das explizite Verbot im Prompt laden (best effort).
  let ausschlussNamen: string[] = [];
  if (ausschlussZutatenIds.length > 0) {
    const { data: ausschlussRaw } = await db
      .from('zutaten')
      .select('id, name')
      .in('id', ausschlussZutatenIds);
    ausschlussNamen = (ausschlussRaw ?? []).map((z: { name: string }) => z.name);
  }
  const ausschlussIdSet = new Set(ausschlussZutatenIds);

  // Basisliste: Ausschluesse raus, Pflicht-Zutaten raus (die kommen separat und
  // schon garantiert rein, doppelte Nennung im Kontext waere nur Rauschen).
  const basisGefiltert = ((zutatenRaw ?? []) as ZutatKontext[])
    .filter(z => !ausschlussIdSet.has(z.id) && !pflichtIdSet.has(z.id));

  const restSlots = Math.max(MAX_ZUTATEN - pflichtZutaten.length, 0);
  // shuffle() NUR auf den Rest-Pool -- Pflicht-Zutaten sind separat geladen
  // und landen ohnehin garantiert im Kontext, unabhaengig vom Zufall hier.
  const restZutaten = spreadAcrossCategories(shuffle(basisGefiltert), restSlots);

  if (pflichtZutaten.length === 0 && restZutaten.length === 0) {
    return NextResponse.json(
      { error: 'keine_zutaten', message: 'Für diese Saison-/Diät-Kombination wurden keine passenden Zutaten gefunden.' },
      { status: 422 },
    );
  }

  // Monatliches Text-Kontingent zuerst NUR pruefen (kein Verbrauch) -- ein
  // Menue kostet 3 Einheiten (siehe docs/text-quota.sql), der teure Call
  // wird gar nicht erst ausgeloest, wenn das Restkontingent nicht reicht.
  const monthlyTextLimit = getMonthlyTextLimit(tier);
  const textQuotaBefore = await getTextQuotaStatus(user.id, monthlyTextLimit);
  if (textQuotaBefore.remaining < TEXT_QUOTA_WEIGHTS.menue) {
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
    console.error('[menuegenerator] Betreiber-Key fehlt:', e instanceof Error ? e.message : e);
    return NextResponse.json({ error: 'Der Menügenerator ist aktuell nicht verfügbar.' }, { status: 500 });
  }

  const userPrompt = JSON.stringify({
    anlass,
    gaenge_anzahl: gaenge,
    saison,
    diaet: diaet.length > 0 ? diaet : undefined,
    leitmotiv: leitmotiv || undefined,
    aufwand: aufwand || undefined,
    kuechenstil: kuechenstil && kuechenstil !== 'keine_vorgabe' ? kuechenstil : undefined,
    pflicht_zutaten: pflichtZutaten.length > 0 ? pflichtZutaten : undefined,
    ausschluss_zutaten: ausschlussNamen.length > 0 ? ausschlussNamen : undefined,
    verfuegbare_zutaten: restZutaten,
  });

  // Technik-Einschraenkung an die gewaehlte Aufwandsstufe koppeln (kumulative
  // Taxonomie in src/config/techniken.ts, bewusst unabhaengig vom
  // Zutatenstammbaum -- der deckt nur 6 von 500 Zutaten ab).
  const erlaubteTechniken = aufwand ? TECHNIKEN_NACH_AUFWAND[aufwand] : null;
  const zusatzTechniken = aufwand ? ZUSATZ_TECHNIKEN_NACH_AUFWAND[aufwand] : null;

  let technikRegel = '';
  if (aufwand && erlaubteTechniken) {
    technikRegel = `\n\nZUSÄTZLICHE HARTE REGEL (Technik-Einschränkung für Aufwandsstufe "${aufwand}"): Die "zubereitungsidee" jedes Gangs darf AUSSCHLIESSLICH folgende Techniken verwenden, keine anderen: ${erlaubteTechniken.join(', ')}. Das gilt strikt, auch wenn eine andere Technik naheliegender erscheint -- bleibe innerhalb dieser Liste. Das Feld "technik" pro Gang MUSS WORTWÖRTLICH (exakt derselbe Begriff, keine Konjugation, kein Partizip, kein Synonym -- also "einlegen" statt "mariniert"/"marinieren", "braten" statt "gebraten") einem der oben gelisteten Begriffe entsprechen, und zwar dem jeweils zentralsten für diesen Gang.`;

    if (aufwand === 'fine_dining' && zusatzTechniken && zusatzTechniken.length > 0) {
      const mindestens = Math.ceil(gaenge / 2);
      technikRegel += `\n\nPFLICHT FÜR FINE DINING (eine Erlaubnis reicht nicht -- das muss aktiv eingelöst werden): Mindestens die HÄLFTE der Gänge (bei ${gaenge} Gängen also mindestens ${mindestens}) MUSS tatsächlich eine der folgenden aufwendigen Techniken einsetzen, nicht nur dürfen: ${zusatzTechniken.join(', ')}. Setze sie ein, wo immer kulinarisch sinnvoll -- notfalls auch dort, wo es etwas Kreativität braucht. Ein Fine-Dining-Menü, in dem alles nur gebraten, gekocht oder roh serviert wird, ist KEIN Fine-Dining-Menü und gilt als Fehler.`;
    } else if (aufwand === 'gehoben' && zusatzTechniken && zusatzTechniken.length > 0) {
      technikRegel += `\n\nPFLICHT FÜR GEHOBEN: Mindestens EIN Gang MUSS tatsächlich eine der folgenden Techniken jenseits der reinen Bistro-Basics einsetzen, nicht nur dürfen: ${zusatzTechniken.join(', ')}. Das gesamte Menü darf nicht ausschließlich aus den einfachsten Grundtechniken (roh, kochen, braten, backen) bestehen.`;
    }
  }
  const systemPrompt = SYSTEM_PROMPT + technikRegel;

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
        temperature: 1.15, // etwas ueber dem Default (1.0) -- mehr Variation zwischen Aufrufen
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
      }),
    }, UPSTREAM_TIMEOUT_MS);
  } catch (e) {
    if (e instanceof UpstreamTimeoutError) {
      console.error('[menuegenerator] Timeout bei OpenAI-Anfrage.');
      return NextResponse.json(
        { error: 'timeout', message: 'Die Generierung hat zu lange gedauert. Bitte mit weniger Gängen erneut versuchen.' },
        { status: 504 },
      );
    }
    console.error('[menuegenerator] Verbindung zu OpenAI fehlgeschlagen:', e instanceof Error ? e.message : e);
    return NextResponse.json({ error: 'Verbindung zur KI fehlgeschlagen.' }, { status: 502 });
  }

  if (!upstream.ok) {
    const errText = await upstream.text().catch(() => '');
    console.error('[menuegenerator] OpenAI-Fehler:', upstream.status, errText.slice(0, 300));
    if (upstream.status === 429) {
      return NextResponse.json({ error: 'Anbieter-Limit erreicht. Bitte kurz warten und erneut versuchen.' }, { status: 429 });
    }
    return NextResponse.json({ error: 'Fehler bei der Menü-Generierung.' }, { status: 502 });
  }

  const upstreamData = await upstream.json();
  const raw: string | undefined = upstreamData.choices?.[0]?.message?.content;

  let menu: unknown;
  try {
    menu = JSON.parse(raw ?? '');
  } catch {
    console.error('[menuegenerator] KI-Antwort war kein gültiges JSON.');
    return NextResponse.json({ error: 'Die KI-Antwort konnte nicht verarbeitet werden. Bitte erneut versuchen.' }, { status: 502 });
  }

  if (!menu || typeof menu !== 'object' || !Array.isArray((menu as { gaenge?: unknown }).gaenge)) {
    console.error('[menuegenerator] KI-Antwort hat unerwartete Struktur.');
    return NextResponse.json({ error: 'Die KI-Antwort hatte eine unerwartete Struktur. Bitte erneut versuchen.' }, { status: 502 });
  }

  // Erst JETZT, nach erfolgreicher Generierung, das Kontingent tatsaechlich
  // verbrauchen -- ein fehlgeschlagener Call oben verbrennt kein Kontingent.
  incrementTextQuota(user.id, monthlyTextLimit, TEXT_QUOTA_WEIGHTS.menue).catch(() => {});

  // Technik-Feld serverseitig gegen die erlaubte Liste der Aufwandsstufe
  // absichern -- der Prompt verlangt woertliche Uebernahme, aber die KI weicht
  // gelegentlich auf eine Variante/Konjugation aus (z.B. "mariniert" statt
  // "einlegen"). Nur relevant, wenn ueberhaupt eine Aufwandsstufe gewaehlt wurde.
  if (erlaubteTechniken) {
    const gaengeUnchecked = (menu as { gaenge: Array<{ technik?: unknown } & Record<string, unknown>> }).gaenge;
    for (const gang of gaengeUnchecked) {
      const original = typeof gang.technik === 'string' ? gang.technik : undefined;
      const normalisiert = normalisiereTechnik(original, erlaubteTechniken);
      if (original?.trim().toLowerCase() !== normalisiert) {
        console.error(`[menuegenerator] Technik "${original}" nicht in erlaubter Liste (${aufwand}), normalisiert zu "${normalisiert}".`);
      }
      gang.technik = normalisiert;
    }
  }

  // Wein-Pairing pro Gang -- nutzt dieselbe 6-Achsen-Engine wie /wein-pairing,
  // ohne Formatkonvertierung (geschmacksprofil deckt sich 1:1 mit FoodProfile).
  // Best effort: schlaegt der Weine-Load fehl, wird das Menue trotzdem geliefert.
  const validMenu = menu as {
    gaenge: Array<{ geschmacksprofil?: Partial<FoodProfile> } & Record<string, unknown>>;
  };
  try {
    const { data: weineRaw } = await db.from('weine').select('*');
    const weine = (weineRaw ?? []) as Wein[];
    if (weine.length > 0) {
      for (const gang of validMenu.gaenge) {
        const p = gang.geschmacksprofil;
        if (!p) continue;
        const foodProfile: FoodProfile = {
          acidity: p.acidity ?? 0,
          sweetness: p.sweetness ?? 0,
          bitterness: p.bitterness ?? 0,
          umami: p.umami ?? 0,
          spiciness: p.spiciness ?? 0,
          saltiness: p.saltiness ?? 0,
        };
        const top = matchWeine(foodProfile, weine)[0];
        if (top) {
          gang.wein_empfehlung = { id: top.wein.id, name: top.wein.name };
        }
      }
    }
  } catch (e) {
    console.error('[menuegenerator] Wein-Pairing fehlgeschlagen (nicht kritisch):', e instanceof Error ? e.message : e);
  }

  return NextResponse.json(menu);
}
