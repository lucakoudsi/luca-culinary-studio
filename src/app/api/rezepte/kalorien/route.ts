import { NextRequest, NextResponse } from 'next/server';
import { requireTier } from '@/lib/apiAuth';
import { checkRateLimit } from '@/lib/rate-limit';
import { getOperatorOpenAiKey } from '@/lib/operator-key';
import { getMonthlyTextLimit, getTextQuotaStatus, incrementTextQuota, TEXT_QUOTA_WEIGHTS } from '@/lib/text-quota';
import { hashZutatenKomponenten } from '@/lib/naehrwertHash';
import { fetchWithTimeout, UpstreamTimeoutError } from '@/lib/upstreamTimeout';
import type { RecipeIngredient, RecipeKomponente, RecipeNaehrwerte, KomponentenNaehrwert } from '@/types';

export const dynamic = 'force-dynamic';
export const maxDuration = 30; // reiner Text-Call, keine Bilder

const MIN_TIER = 2; // Basic -- laeuft ueber den Betreiber-Key, siehe docs/abo-konzept.md Abschnitt 2a
const MAX_PAYLOAD_CHARS = 20_000;
const UPSTREAM_TIMEOUT_MS = 24_000; // etwas unter maxDuration

const SYSTEM_PROMPT = `Du bist ein Ernaehrungs-Assistent fuer Culinary Studio. Du bekommst die Zutatenliste eines Rezepts (ggf. in Komponenten gegliedert) und schaetzt die Naehrwerte -- Kalorien (kcal), Protein, Fett, Kohlenhydrate (KH, alle in Gramm) fuer das GESAMTE Rezept (alle Portionen zusammen, nicht pro Portion).

WICHTIG -- das ist eine Schaetzung, keine exakte Berechnung: Nutze dein Kochwissen fuer realistische Naehrwerte pro Zutat und Menge. Schaetze NUR auf Basis der gegebenen Zutaten/Mengen -- nimm keine zusaetzlichen Zutaten an, die nicht genannt sind. Bei vagen Mengenangaben ("nach Geschmack", "1 Prise") setze einen plausiblen kleinen Wert an, ignoriere sie nicht komplett.

Du bekommst eine Liste von "Abschnitten" (entweder echte Rezept-Komponenten, oder ein einzelner Abschnitt fuer eine flache Zutatenliste, ggf. plus ein Abschnitt "Weitere Zutaten" fuer Zutaten ausserhalb der Komponenten). Schaetze fuer JEDEN Abschnitt einzeln kcal/protein/fett/kh (fuer die dort aufgefuehrten Zutaten in der angegebenen Menge).

Antworte AUSSCHLIESSLICH mit JSON in exakt dieser Form, keine Erklaerung davor/danach:
{
  "abschnitte": [
    { "name": string, "kcal": number, "protein": number, "fett": number, "kh": number }
  ]
}
Ein Eintrag pro Abschnitt, gleiche Reihenfolge wie in der Anfrage, gleicher "name"-Wert. Zahlen sind nicht-negativ, protein/fett/kh in Gramm, kcal als ganze Zahl.`;

type Abschnitt = { name: string; zutaten: RecipeIngredient[] };

function buildAbschnitte(zutaten: RecipeIngredient[], komponenten: RecipeKomponente[]): Abschnitt[] {
  if (komponenten.length === 0) {
    return [{ name: 'Gesamtrezept', zutaten }];
  }
  const abschnitte: Abschnitt[] = komponenten.map(k => ({ name: k.name || 'Komponente', zutaten: k.zutaten }));
  if (zutaten.length > 0) {
    abschnitte.push({ name: 'Weitere Zutaten', zutaten });
  }
  return abschnitte;
}

function parseAbschnitte(raw: unknown, expectedNames: string[]): KomponentenNaehrwert[] {
  if (!Array.isArray(raw)) return [];
  const byName = new Map<string, KomponentenNaehrwert>();
  for (const entry of raw) {
    if (!entry || typeof entry !== 'object') continue;
    const e = entry as Record<string, unknown>;
    if (typeof e.name !== 'string') continue;
    byName.set(e.name, {
      name: e.name,
      kcal:    Math.max(0, Math.round(Number(e.kcal) || 0)),
      protein: Math.max(0, Math.round((Number(e.protein) || 0) * 10) / 10),
      fett:    Math.max(0, Math.round((Number(e.fett) || 0) * 10) / 10),
      kh:      Math.max(0, Math.round((Number(e.kh) || 0) * 10) / 10),
    });
  }
  // In der erwarteten Reihenfolge zurueckgeben, fehlende Abschnitte mit 0 auffuellen
  // (defensiv -- falls die KI einen Abschnitt vergisst, statt den ganzen Aufruf zu verwerfen).
  return expectedNames.map(name => byName.get(name) ?? { name, kcal: 0, protein: 0, fett: 0, kh: 0 });
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

  let body: { zutaten?: unknown; komponenten?: unknown; portionen?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Ungültige Anfrage.' }, { status: 400 });
  }

  if (JSON.stringify(body).length > MAX_PAYLOAD_CHARS) {
    return NextResponse.json({ error: 'Anfrage zu groß.' }, { status: 400 });
  }

  const zutaten: RecipeIngredient[] = Array.isArray(body.zutaten)
    ? body.zutaten.filter((z): z is RecipeIngredient => !!z && typeof z === 'object' && typeof (z as RecipeIngredient).name === 'string')
    : [];
  const komponenten: RecipeKomponente[] = Array.isArray(body.komponenten)
    ? body.komponenten.filter((k): k is RecipeKomponente => !!k && typeof k === 'object' && typeof (k as RecipeKomponente).name === 'string' && Array.isArray((k as RecipeKomponente).zutaten))
    : [];
  const portionen = typeof body.portionen === 'number' && body.portionen > 0 ? body.portionen : 0;

  if (zutaten.length === 0 && komponenten.every(k => k.zutaten.length === 0)) {
    return NextResponse.json({ error: 'Keine Zutaten für eine Schätzung vorhanden.' }, { status: 400 });
  }

  // Vorab-Pruefung des Kontingents -- VOR dem OpenAI-Call, kein Verbrauch.
  const monthlyTextLimit = getMonthlyTextLimit(tier);
  const textQuotaBefore = await getTextQuotaStatus(user.id, monthlyTextLimit);
  if (textQuotaBefore.remaining < TEXT_QUOTA_WEIGHTS.kalorien) {
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
    console.error('[kalorien] Betreiber-Key fehlt:', e instanceof Error ? e.message : e);
    return NextResponse.json({ error: 'Die Kalorien-Schätzung ist aktuell nicht verfügbar.' }, { status: 500 });
  }

  const abschnitte = buildAbschnitte(zutaten, komponenten);
  const expectedNames = abschnitte.map(a => a.name);
  const userMessage = JSON.stringify({ abschnitte });

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
        // 0 statt der sonst in diesen Routen ueblichen 0.3 -- bei identischer
        // Zutatenliste soll dieselbe Schaetzung rauskommen, nicht bei jedem
        // Klick eine leicht andere Zahl. Ergaenzt den Client-Cache (siehe
        // handleKalorienBerechnen in bearbeiten/page.tsx), der ohnehin nur
        // bei tatsaechlich geaenderten Zutaten neu aufruft.
        temperature: 0,
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: userMessage },
        ],
      }),
    }, UPSTREAM_TIMEOUT_MS);
  } catch (e) {
    if (e instanceof UpstreamTimeoutError) {
      console.error('[kalorien] Timeout bei OpenAI-Anfrage.');
      return NextResponse.json(
        { error: 'timeout', message: 'Die Anfrage hat zu lange gedauert. Bitte erneut versuchen.' },
        { status: 504 },
      );
    }
    console.error('[kalorien] Verbindung zu OpenAI fehlgeschlagen:', e instanceof Error ? e.message : e);
    return NextResponse.json({ error: 'Verbindung zur KI fehlgeschlagen.' }, { status: 502 });
  }

  if (!upstream.ok) {
    const errText = await upstream.text().catch(() => '');
    console.error('[kalorien] OpenAI-Fehler:', upstream.status, errText.slice(0, 300));
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
    console.error('[kalorien] KI-Antwort war kein gültiges JSON.');
    return NextResponse.json({ error: 'Die KI-Antwort konnte nicht verarbeitet werden. Bitte erneut versuchen.' }, { status: 502 });
  }
  if (!parsed || typeof parsed !== 'object') {
    console.error('[kalorien] KI-Antwort hat unerwartete Struktur.');
    return NextResponse.json({ error: 'Die KI-Antwort hatte eine unerwartete Struktur. Bitte erneut versuchen.' }, { status: 502 });
  }

  incrementTextQuota(user.id, monthlyTextLimit, TEXT_QUOTA_WEIGHTS.kalorien).catch(() => {});

  const p = parsed as Record<string, unknown>;
  const parsedAbschnitte = parseAbschnitte(p.abschnitte, expectedNames);

  // "gesamt" wird IMMER serverseitig als Summe der Abschnitte berechnet, nie
  // separat von der KI erfragt -- so koennen Einzelwerte und Summe nie
  // auseinanderlaufen.
  const gesamt = parsedAbschnitte.reduce(
    (acc, a) => ({
      kcal: acc.kcal + a.kcal,
      protein: Math.round((acc.protein + a.protein) * 10) / 10,
      fett: Math.round((acc.fett + a.fett) * 10) / 10,
      kh: Math.round((acc.kh + a.kh) * 10) / 10,
    }),
    { kcal: 0, protein: 0, fett: 0, kh: 0 },
  );

  const naehrwerte: RecipeNaehrwerte = {
    gesamt,
    // Nur eine echte Aufschluesselung, wenn es tatsaechlich benannte
    // Komponenten gab -- bei einer reinen flachen Zutatenliste gibt es nur
    // den einen synthetischen "Gesamtrezept"-Abschnitt, der inhaltlich
    // identisch zu "gesamt" waere und keine eigene Anzeige verdient.
    pro_komponente: komponenten.length > 0 ? parsedAbschnitte : [],
    berechnet_am: new Date().toISOString(),
    zutaten_hash: hashZutatenKomponenten(zutaten, komponenten),
    pro_portion: portionen > 0,
  };

  return NextResponse.json({ naehrwerte });
}
