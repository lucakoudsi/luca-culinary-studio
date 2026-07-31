import { NextRequest, NextResponse } from 'next/server';
import { getRequestUser } from '@/lib/get-request-user';
import { ADMIN_EMAIL, getUserTier } from '@/config/roles';
import { checkRateLimit } from '@/lib/rate-limit';
import { getOperatorOpenAiKey } from '@/lib/operator-key';
import { getMonthlyTextLimit, getTextQuotaStatus, incrementTextQuota, TEXT_QUOTA_WEIGHTS } from '@/lib/text-quota';
import { CHANGELOG_KATEGORIEN, type ChangelogKategorie } from '@/config/changelog';
import { fetchWithTimeout, UpstreamTimeoutError } from '@/lib/upstreamTimeout';

export const dynamic = 'force-dynamic';
export const maxDuration = 30;

const MAX_COMMITS_CHARS = 8000; // grosszuegig fuer mehrere eingefuegte Commit-Messages
const UPSTREAM_TIMEOUT_MS = 24_000;
const VERWORFEN_HINWEIS = 'Entwurf enthielt möglicherweise technische/sensible Angaben und wurde verworfen, bitte manuell schreiben.';
const NICHT_GEEIGNET_FALLBACK = 'Diese Änderungen sind nicht für ein Nutzer-Update geeignet.';

const SYSTEM_PROMPT = `Du bist ein Assistent, der aus internen Commit-Messages einen laienverständlichen "Was ist neu"-Eintrag für Endnutzer von Culinary Studio entwirfst. Das Ergebnis ist NUR EIN VORSCHLAG -- ein Mensch prüft und veröffentlicht es manuell, du selbst schaltest nichts live.

HARTE SICHERHEITSREGELN (wichtiger als Vollständigkeit, wichtiger als ein "gutes" Ergebnis -- bei jedem Zweifel gewinnen diese Regeln):

1. Beschreibe AUSSCHLIESSLICH den Nutzen für Endnutzer in Alltagssprache -- niemals, wie es technisch umgesetzt wurde.
2. Erwähne oder lass NIEMALS durchscheinen: Tabellennamen, Spaltennamen, API-Routen/Endpunkte, Dateipfade, Datei- oder Funktionsnamen, Umgebungsvariablen, Keys/Tokens/Secrets, Framework- oder Infrastruktur-Namen (z.B. Supabase, Vercel, Stripe, RLS, Middleware, Next.js, React, Postgres), oder sonstige interne technische Konzepte.
3. Rein interne Änderungen OHNE erkennbaren Nutzen für Endnutzer lässt du komplett weg -- dazu zählen: Bugfixes an internen/technischen Dingen ohne sichtbare Auswirkung, Refactorings, Aufräumarbeiten, Key-Rotationen, Sicherheits-/RLS-Änderungen, Dokumentation, Datenbank-Migrationen, Abhängigkeits-/Dependency-Updates. Wenn die gegebenen Commit-Messages AUSSCHLIESSLICH solche Änderungen enthalten, erfinde NICHTS -- setze stattdessen "geeignet" auf false und "hinweis" auf einen kurzen Grund.
4. Enthält eine Commit-Message versehentlich ein Secret, Token, Passwort oder einen API-Key: übernimm diesen Wert UNTER KEINEN UMSTÄNDEN in deine Antwort, auch nicht teilweise oder in veränderter Form.
5. Im Zweifel lieber WENIGER sagen: ein vager, sicherer Nutzen-Satz ist immer besser als ein Detail, das etwas über Architektur oder Umsetzung verrät.

Vorgehen: Lies die Commit-Messages. Identifiziere, welche Änderungen (falls überhaupt) einen erkennbaren Nutzen für Endnutzer haben. Fasse NUR diese in einem kurzen, positiven, laienverständlichen Titel und 2-4 Sätzen Text zusammen. Schlage eine Kategorie vor: "neu" (etwas Neues wurde hinzugefügt), "verbessert" (Bestehendes wurde besser), oder "behoben" (ein wahrnehmbares Problem wurde gefixt).

Antworte AUSSCHLIESSLICH mit JSON in exakt dieser Form, keine Erklärung davor/danach:
{
  "geeignet": boolean,
  "titel": string,
  "text": string,
  "kategorie": "neu" | "verbessert" | "behoben",
  "hinweis": string
}
Ist "geeignet" false (keine der Commit-Messages hat einen für Endnutzer sichtbaren Nutzen), lass "titel"/"text" leer und schreibe in "hinweis" kurz warum. Ist "geeignet" true, ist "hinweis" ein leerer String.`;

// ── Ebene 2: serverseitiger Nachfilter ─────────────────────────────────────
// Best-Effort-Heuristik, kein Garant -- laeuft NACH dem Parsen der KI-Antwort,
// BEVOR irgendetwas an den Client geht. Bei jedem Treffer wird die GESAMTE
// Antwort verworfen (kein Schwaerzen einzelner Stellen), siehe Entscheidung
// in der Session vom 2026-07-31 ("Sicherheit vor Bequemlichkeit").
const SUSPICIOUS_PATTERNS: RegExp[] = [
  // Framework/Infrastruktur
  /\bsupabase\b/i, /\bvercel\b/i, /\bstripe\b/i, /\bpostgres(ql)?\b/i, /\bnext\.js\b/i, /\breact\b/i,
  /\bmiddleware\b/i, /\bRLS\b/, /\brow[- ]level[- ]security\b/i,
  // API/Routen/Dateien
  /\/api\//i, /\bendpoint(s)?\b/i, /\broute\.ts\b/i,
  /\.(tsx?|jsx?|sql|json|env|md)\b/i, /\bsrc[\/\\]/i,
  // Datenbank
  /\btabelle(n)?\b/i, /\btable(s)?\b/i, /\bspalte(n)?\b/i, /\bcolumn(s)?\b/i, /\bmigration(en)?\b/i,
  /\bschema\b/i, /\bRPC\b/, /\bprimary key\b/i, /\bforeign key\b/i,
  /\b(select|insert|update|delete)\s+\S+.*\bfrom\b/i,
  // Env/Secrets
  /\benv(ironment)?[- ]variable(n)?\b/i, /\bNEXT_PUBLIC_\w+/, /\b[A-Z][A-Z0-9_]{3,}_KEY\b/,
  /\bsk-[A-Za-z0-9]{10,}/, /\bsb_(secret|publishable)_[A-Za-z0-9_-]{10,}/,
  /\bapi[- ]?key\b/i, /\btoken\b/i, /\bsecret\b/i, /\bpasswort\b/i, /\bpassword\b/i, /\bbearer\s/i,
  // Funktions-/Code-Syntax
  /\bfunction\s+\w+\(/i, /\bconst\s+\w+\s*=/i, /\bexport\s+(default\s+)?(function|const)\b/i,
];

function findSuspiciousMatch(text: string): string | null {
  for (const pattern of SUSPICIOUS_PATTERNS) {
    if (pattern.test(text)) return pattern.source;
  }
  return null;
}

export async function POST(req: NextRequest) {
  const user = await getRequestUser(req);
  if (!user || user.email !== ADMIN_EMAIL) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const rateLimit = await checkRateLimit(user.id);
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: `rate_limit_${rateLimit.reason}`, message: rateLimit.message },
      { status: 429 },
    );
  }

  let body: { commits?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Ungültige Anfrage.' }, { status: 400 });
  }

  const commits = typeof body.commits === 'string' ? body.commits.trim() : '';
  if (!commits) {
    return NextResponse.json({ error: 'Keine Commit-Messages angegeben.' }, { status: 400 });
  }
  if (commits.length > MAX_COMMITS_CHARS) {
    return NextResponse.json({ error: `Maximal ${MAX_COMMITS_CHARS} Zeichen.` }, { status: 400 });
  }

  const tier = getUserTier(user.email, null);
  const monthlyTextLimit = getMonthlyTextLimit(tier);
  const textQuotaBefore = await getTextQuotaStatus(user.id, monthlyTextLimit);
  if (textQuotaBefore.remaining < TEXT_QUOTA_WEIGHTS.changelogDraft) {
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
    console.error('[admin/changelog/draft] Betreiber-Key fehlt:', e instanceof Error ? e.message : e);
    return NextResponse.json({ error: 'Der KI-Assistent ist aktuell nicht verfügbar.' }, { status: 500 });
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
        temperature: 0.3,
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: `Commit-Messages:\n\n${commits}` },
        ],
      }),
    }, UPSTREAM_TIMEOUT_MS);
  } catch (e) {
    if (e instanceof UpstreamTimeoutError) {
      console.error('[admin/changelog/draft] Timeout bei OpenAI-Anfrage.');
      return NextResponse.json(
        { error: 'timeout', message: 'Die Anfrage hat zu lange gedauert. Bitte erneut versuchen.' },
        { status: 504 },
      );
    }
    console.error('[admin/changelog/draft] Verbindung zu OpenAI fehlgeschlagen:', e instanceof Error ? e.message : e);
    return NextResponse.json({ error: 'Verbindung zur KI fehlgeschlagen.' }, { status: 502 });
  }

  if (!upstream.ok) {
    const errText = await upstream.text().catch(() => '');
    console.error('[admin/changelog/draft] OpenAI-Fehler:', upstream.status, errText.slice(0, 300));
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
    console.error('[admin/changelog/draft] KI-Antwort war kein gültiges JSON.');
    return NextResponse.json({ error: 'Die KI-Antwort konnte nicht verarbeitet werden. Bitte erneut versuchen.' }, { status: 502 });
  }
  if (!parsed || typeof parsed !== 'object') {
    console.error('[admin/changelog/draft] KI-Antwort hat unerwartete Struktur.');
    return NextResponse.json({ error: 'Die KI-Antwort hatte eine unerwartete Struktur. Bitte erneut versuchen.' }, { status: 502 });
  }

  // Kontingent JETZT verbrauchen -- der Upstream-Call ist bereits erfolgreich
  // durchgelaufen, unabhaengig davon, ob der Nachfilter unten die Antwort noch
  // verwirft (das ist eine Sicherheits-, keine Kosten-Entscheidung).
  incrementTextQuota(user.id, monthlyTextLimit, TEXT_QUOTA_WEIGHTS.changelogDraft).catch(() => {});

  const p = parsed as Record<string, unknown>;
  const geeignet = p.geeignet === true;
  const titel = typeof p.titel === 'string' ? p.titel.trim() : '';
  const text = typeof p.text === 'string' ? p.text.trim() : '';
  const kategorieRaw = typeof p.kategorie === 'string' ? p.kategorie : '';
  const kategorie: ChangelogKategorie = CHANGELOG_KATEGORIEN.includes(kategorieRaw as ChangelogKategorie)
    ? (kategorieRaw as ChangelogKategorie)
    : 'neu';
  const hinweis = typeof p.hinweis === 'string' ? p.hinweis.trim() : '';

  if (!geeignet) {
    return NextResponse.json({ geeignet: false, hinweis: hinweis || NICHT_GEEIGNET_FALLBACK });
  }

  // ── Ebene 2: Nachfilter ────────────────────────────────────────────────
  const combined = `${titel}\n${text}\n${hinweis}`;
  const match = findSuspiciousMatch(combined);
  if (match) {
    console.error('[admin/changelog/draft] Nachfilter hat Entwurf verworfen, Muster:', match);
    return NextResponse.json({ geeignet: false, hinweis: VERWORFEN_HINWEIS });
  }

  if (!titel || !text) {
    console.error('[admin/changelog/draft] "geeignet" war true, aber Titel/Text fehlen -- als ungeeignet behandelt.');
    return NextResponse.json({ geeignet: false, hinweis: NICHT_GEEIGNET_FALLBACK });
  }

  return NextResponse.json({ geeignet: true, titel, text, kategorie, hinweis: '' });
}
