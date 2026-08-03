import { NextRequest, NextResponse } from 'next/server';
import { requireTier } from '@/lib/apiAuth';
import { checkRateLimit } from '@/lib/rate-limit';
import { getOperatorOpenAiKey } from '@/lib/operator-key';
import { getMonthlyTextLimit, getTextQuotaStatus, incrementTextQuota, TEXT_QUOTA_WEIGHTS } from '@/lib/text-quota';
import { createAdminClient } from '@/lib/supabase-admin';
import { parseGeschmack } from '@/lib/rezeptKiExtraktion';
import { fetchWithTimeout, UpstreamTimeoutError } from '@/lib/upstreamTimeout';
import type { GeneratedMenuResult, GeneratedMenuGang } from '@/types';

export const dynamic = 'force-dynamic';
export const maxDuration = 30; // reiner Text-Call, keine Bilder

const MIN_TIER = 2; // Basic -- gleiche Sperre wie der Menuegenerator selbst
const MAX_ANWEISUNG_LENGTH = 500;
const UPSTREAM_TIMEOUT_MS = 24_000;

const SYSTEM_PROMPT = `Du bist der KI-Sous-Chef von Culinary Studio, hier im Kontext "Menü-Gang gezielt anpassen". Der Nutzer hat ein fertig komponiertes Menü und möchte GENAU EINEN Gang gemäß einer konkreten Anweisung überarbeiten (z.B. "mach ihn vegetarisch", "leichter", "ohne Fisch", "mehr Säure").

Du bekommst: (1) den "Bogen" -- Titel + Beschreibung ALLER Gänge des Menüs in Reihenfolge, nur zur Orientierung, damit deine Änderung nicht mit den Nachbar-Gängen kollidiert oder etwas wiederholt, das schon in einem anderen Gang vorkommt. (2) das VOLLSTÄNDIGE Objekt des einen Gangs, der tatsächlich angepasst werden soll.

WICHTIGSTE REGEL -- nur den einen Gang, nur was gemeint ist: Ändere AUSSCHLIESSLICH Felder des Ziel-Gangs, die von der Anweisung betroffen sind. Die anderen Gänge im Bogen sind nur Kontext, du gibst für sie NICHTS zurück. Erfinde keine zusätzlichen Zutaten oder Fakten, die nicht aus der Anweisung oder dem bestehenden Gang hervorgehen -- fehlt dir eine nötige Information, antworte mit einer kurzen Rückfrage in "reply" und "updatedFields": {}.

Berührt die Anweisung erkennbar mehrere Felder (z.B. "vegetarisch machen" betrifft meist hauptzutaten UND beschreibung UND ggf. zubereitungsidee), passe alle betroffenen Felder konsistent zueinander an, nicht nur eines davon isoliert.

"hauptzutaten" ist, falls zurückgegeben, die VOLLSTÄNDIGE aktualisierte Liste, nicht nur der geänderte Eintrag.

Ändere NIEMALS die Wein-Empfehlung -- das ist nicht Teil dieser Funktion.

"reply": Antworte kurz und konkret, was du geändert hast, oder stelle deine Rückfrage. Kein Smalltalk.

Antworte AUSSCHLIESSLICH mit JSON in exakt dieser Form, keine Erklärung davor/danach:
{
  "reply": string,
  "updatedFields": {
    "titel"?: string, "beschreibung"?: string,
    "hauptzutaten"?: string[], "zubereitungsidee"?: string, "technik"?: string,
    "geschmacksprofil"?: { "acidity": number, "sweetness": number, "bitterness": number, "umami": number, "spiciness": number, "saltiness": number }
  }
}
Lass in "updatedFields" alle Felder weg, die sich nicht geändert haben -- ein leeres Objekt "{}" ist normal (z.B. bei einer reinen Rückfrage).

Verwende ausschließlich reale, tatsächlich existierende Zutaten und Begriffe. Erfinde niemals Wörter oder Fantasiebegriffe.`;

// Absichtlich KEIN "wein_empfehlung"/weinId-Feld in dieser Whitelist -- die
// Wein-Empfehlung zeigt auf einen echten Datensatz (id + name aus der
// "weine"-Tabelle, siehe matchWeine()/api/menuegenerator/route.ts). Liesse
// man die KI hier frei einen neuen Wert liefern, koennte sie eine
// nicht-existente id halluzinieren oder Name/id auseinanderlaufen lassen --
// der Prompt weist sie zusaetzlich an, das Feld nie anzufassen (siehe
// SYSTEM_PROMPT oben), aber diese Whitelist ist die eigentliche technische
// Absicherung: selbst wenn die KI es trotzdem zurueckgeben wuerde, wird es
// hier stillschweigend verworfen statt uebernommen.
function parsePatch(raw: unknown): Partial<GeneratedMenuGang> {
  if (!raw || typeof raw !== 'object') return {};
  const r = raw as Record<string, unknown>;
  const patch: Partial<GeneratedMenuGang> = {};

  if (typeof r.titel === 'string' && r.titel.trim()) patch.titel = r.titel.trim();
  if (typeof r.beschreibung === 'string') patch.beschreibung = r.beschreibung.trim();
  if (Array.isArray(r.hauptzutaten)) {
    patch.hauptzutaten = r.hauptzutaten.filter((z): z is string => typeof z === 'string' && z.trim().length > 0).map(z => z.trim());
  }
  if (typeof r.zubereitungsidee === 'string') patch.zubereitungsidee = r.zubereitungsidee.trim();
  if (typeof r.technik === 'string' && r.technik.trim()) patch.technik = r.technik.trim();
  if (r.geschmacksprofil && typeof r.geschmacksprofil === 'object') patch.geschmacksprofil = parseGeschmack(r.geschmacksprofil);

  return patch;
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
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

  let body: { gangIndex?: unknown; anweisung?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Ungültige Anfrage.' }, { status: 400 });
  }

  const anweisung = typeof body.anweisung === 'string' ? body.anweisung.trim().slice(0, MAX_ANWEISUNG_LENGTH) : '';
  if (!anweisung) {
    return NextResponse.json({ error: 'Keine Anweisung angegeben.' }, { status: 400 });
  }
  const gangIndex = typeof body.gangIndex === 'number' ? body.gangIndex : NaN;
  if (!Number.isInteger(gangIndex) || gangIndex < 0) {
    return NextResponse.json({ error: 'Ungültiger Gang.' }, { status: 400 });
  }

  // Owner-Check + Menü-Kontext kommt aus der DB, NICHT vom Client -- der
  // Client soll fuer den Vorschlag nur menuId/gangIndex/anweisung schicken
  // muessen, und der Server arbeitet garantiert mit dem tatsaechlich
  // gespeicherten Stand statt einer moeglicherweise veralteten Client-Kopie.
  const db = createAdminClient();
  const { data: menuRow, error: fetchError } = await db
    .from('menus')
    .select('id, menu')
    .eq('id', params.id)
    .eq('user_id', user.id)
    .single();

  if (fetchError || !menuRow) {
    return NextResponse.json({ error: 'Menü nicht gefunden.' }, { status: 404 });
  }
  const menu = menuRow.menu as GeneratedMenuResult;
  if (!menu || !Array.isArray(menu.gaenge) || gangIndex >= menu.gaenge.length) {
    return NextResponse.json({ error: 'Gang nicht gefunden.' }, { status: 400 });
  }
  const targetGang = menu.gaenge[gangIndex];

  // Vorab-Kontingent-Pruefung -- VOR dem OpenAI-Call, kein Verbrauch.
  const monthlyTextLimit = getMonthlyTextLimit(tier);
  const textQuotaBefore = await getTextQuotaStatus(user.id, monthlyTextLimit);
  if (textQuotaBefore.remaining < TEXT_QUOTA_WEIGHTS.menuGangAnpassen) {
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
    console.error('[menus/gang-anpassen] Betreiber-Key fehlt:', e instanceof Error ? e.message : e);
    return NextResponse.json({ error: 'Die Gang-Anpassung ist aktuell nicht verfügbar.' }, { status: 500 });
  }

  const bogen = menu.gaenge.map((g, i) => ({ position: i + 1, titel: g.titel, beschreibung: g.beschreibung }));
  const userMessage = JSON.stringify({ anweisung, bogen, zielGang: targetGang });

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
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: userMessage },
        ],
      }),
    }, UPSTREAM_TIMEOUT_MS);
  } catch (e) {
    if (e instanceof UpstreamTimeoutError) {
      console.error('[menus/gang-anpassen] Timeout bei OpenAI-Anfrage.');
      return NextResponse.json(
        { error: 'timeout', message: 'Die Anfrage hat zu lange gedauert. Bitte erneut versuchen.' },
        { status: 504 },
      );
    }
    console.error('[menus/gang-anpassen] Verbindung zu OpenAI fehlgeschlagen:', e instanceof Error ? e.message : e);
    return NextResponse.json({ error: 'Verbindung zur KI fehlgeschlagen.' }, { status: 502 });
  }

  if (!upstream.ok) {
    const errText = await upstream.text().catch(() => '');
    console.error('[menus/gang-anpassen] OpenAI-Fehler:', upstream.status, errText.slice(0, 300));
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
    console.error('[menus/gang-anpassen] KI-Antwort war kein gültiges JSON.');
    return NextResponse.json({ error: 'Die KI-Antwort konnte nicht verarbeitet werden. Bitte erneut versuchen.' }, { status: 502 });
  }
  if (!parsed || typeof parsed !== 'object') {
    console.error('[menus/gang-anpassen] KI-Antwort hat unerwartete Struktur.');
    return NextResponse.json({ error: 'Die KI-Antwort hatte eine unerwartete Struktur. Bitte erneut versuchen.' }, { status: 502 });
  }

  incrementTextQuota(user.id, monthlyTextLimit, TEXT_QUOTA_WEIGHTS.menuGangAnpassen).catch(() => {});

  const p = parsed as Record<string, unknown>;
  const reply = typeof p.reply === 'string' && p.reply.trim() ? p.reply.trim() : 'Verstanden.';
  const updatedFields = parsePatch(p.updatedFields);

  // Server-Merge -- gleiche Begruendung wie beim Rezept-Sous-Chef: die KI
  // liefert nur geaenderte Felder, hier (nicht im Client) werden sie mit dem
  // aus der DB gelesenen Original-Gang zusammengefuehrt.
  const merged: GeneratedMenuGang = { ...targetGang, ...updatedFields };

  return NextResponse.json({ reply, updatedFields, merged });
}
