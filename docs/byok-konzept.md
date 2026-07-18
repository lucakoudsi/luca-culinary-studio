# BYOK-Konzept: Individueller API-Key pro Nutzer

**LUCA Culinary Creator** · Next.js 14 (App Router) · Supabase · Vercel

## 1. Architektur auf einen Blick

Der API-Key des Nutzers wandert genau einen Weg: vom Einstellungsformular über eine eigene API-Route auf deinen Server, wird dort verschlüsselt und in Supabase abgelegt. Alle KI-Anfragen (KI-Sous-Chef, später Menügenerator etc.) laufen über eine Server-Route, die den Key entschlüsselt und an OpenAI bzw. Anthropic weiterreicht. Der Browser sieht den Klartext-Key nach dem Speichern nie wieder — nur einen maskierten Hinweis wie `sk-…x4Fq`.

```
Browser (Settings)                 Vercel (Server)                    Extern
─────────────────                  ────────────────                   ──────
Key eingeben  ──POST /api/ki/key──▶ validieren (Test-Call) ─────────▶ OpenAI /models
                                    AES-256-GCM verschlüsseln
                                    in Supabase speichern
              ◀── { hint, valid } ──┘

Chat-Nachricht ──POST /api/ki/chat─▶ Key laden + entschlüsseln ─────▶ OpenAI /chat
              ◀──── Streaming ◀──────────────────────────────────────┘
```

Wichtigster Grundsatz: **Der Key existiert im Klartext nur für Millisekunden im Server-RAM.** Nie im Frontend-State nach dem Absenden, nie in Logs, nie in der URL, nie unverschlüsselt in der DB.

## 2. Datenmodell (Supabase)

Eine eigene Tabelle, getrennt vom Profil, damit RLS sie komplett vom Client abschotten kann:

```sql
create table user_api_keys (
  user_id     uuid primary key references auth.users(id) on delete cascade,
  provider    text not null default 'openai' check (provider in ('openai', 'anthropic')),
  key_cipher  text not null,        -- AES-256-GCM: iv:authTag:ciphertext (base64)
  key_hint    text not null,        -- z. B. "sk-…x4Fq" für die UI
  is_valid    boolean default null, -- Ergebnis des letzten Test-Calls
  last_used   timestamptz,
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);

alter table user_api_keys enable row level security;
-- Bewusst KEINE Policies anlegen: Der Client (anon key) kann damit
-- weder lesen noch schreiben. Zugriff ausschließlich über deine
-- API-Routen mit dem Service-Role-Key.
```

Warum kein Zugriff für den Client, nicht mal lesend? Weil selbst der Ciphertext nichts im Browser verloren hat. Die UI bekommt über deine API-Route nur `{ provider, key_hint, is_valid }`.

## 3. Verschlüsselung

Ein Server-Secret in den Vercel-Umgebungsvariablen (`KEY_ENCRYPTION_SECRET`, 32 Bytes, z. B. per `openssl rand -base64 32` erzeugt). Damit AES-256-GCM:

```ts
// lib/crypto.ts
import { createCipheriv, createDecipheriv, randomBytes } from "crypto";

const SECRET = Buffer.from(process.env.KEY_ENCRYPTION_SECRET!, "base64"); // 32 Bytes

export function encryptKey(plain: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", SECRET, iv);
  const enc = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
  return [iv, cipher.getAuthTag(), enc].map(b => b.toString("base64")).join(":");
}

export function decryptKey(stored: string): string {
  const [iv, tag, data] = stored.split(":").map(s => Buffer.from(s, "base64"));
  const decipher = createDecipheriv("aes-256-gcm", SECRET, iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(data), decipher.final()]).toString("utf8");
}
```

Damit sind die Keys selbst bei einem geleakten Datenbank-Dump wertlos, solange das Vercel-Secret nicht ebenfalls kompromittiert ist. (Alternative: Supabase Vault — funktioniert auch, die eigene Lösung hält die Entschlüsselung aber komplett auf deinem Server.)

## 4. API-Routen

### `POST /api/ki/key` — Key speichern & validieren

Ablauf: Auth prüfen → Key-Format grob prüfen (`sk-` bzw. `sk-ant-`) → **Test-Call** gegen den Anbieter → verschlüsseln → per Service-Role-Client upserten → nur Hint zurückgeben.

```ts
// app/api/ki/key/route.ts
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { encryptKey } from "@/lib/crypto";

const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!   // nur serverseitig!
);

async function testKey(provider: string, key: string): Promise<boolean> {
  const res = provider === "anthropic"
    ? await fetch("https://api.anthropic.com/v1/models", {
        headers: { "x-api-key": key, "anthropic-version": "2023-06-01" } })
    : await fetch("https://api.openai.com/v1/models", {
        headers: { Authorization: `Bearer ${key}` } });
  return res.ok;
}

export async function POST(req: Request) {
  const supabase = createRouteHandlerClient({ cookies });
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: "Nicht angemeldet" }, { status: 401 });

  const { provider, apiKey } = await req.json();
  if (!apiKey?.startsWith("sk-"))
    return Response.json({ error: "Ungültiges Key-Format" }, { status: 400 });

  const valid = await testKey(provider, apiKey);
  if (!valid)
    return Response.json({ error: "Key wurde vom Anbieter abgelehnt" }, { status: 400 });

  const key_hint = `${apiKey.slice(0, 3)}…${apiKey.slice(-4)}`;
  await admin.from("user_api_keys").upsert({
    user_id: user.id, provider,
    key_cipher: encryptKey(apiKey),
    key_hint, is_valid: true, updated_at: new Date().toISOString(),
  });

  return Response.json({ key_hint, is_valid: true });
}
```

Dazu `GET` (liefert nur `{ provider, key_hint, is_valid }` oder `null`) und `DELETE` (Zeile löschen) in derselben Route.

### `POST /api/ki/chat` — der eigentliche KI-Proxy

```ts
// app/api/ki/chat/route.ts (Kernlogik)
const { data: row } = await admin
  .from("user_api_keys").select("provider, key_cipher")
  .eq("user_id", user.id).single();

if (!row)
  return Response.json(
    { error: "kein_key", message: "Bitte hinterlege deinen API-Key in den Einstellungen." },
    { status: 402 }
  );

const apiKey = decryptKey(row.key_cipher);
// → Request an OpenAI/Anthropic mit stream: true,
//   Response als ReadableStream ans Frontend durchreichen.
// Bei 401 vom Anbieter: is_valid=false setzen und Fehler
//   "Dein Key scheint nicht mehr gültig zu sein" zurückgeben.
```

Praktisch: Mit dem Vercel AI SDK (`ai` + `@ai-sdk/openai` + `@ai-sdk/anthropic`) bekommst du Streaming und Provider-Abstraktion fast geschenkt — `createOpenAI({ apiKey })` akzeptiert den Key pro Request.

## 5. Settings-UI (Bereich „KI-Funktionen")

Genau dort, wo jetzt der Platzhalter „OpenAI API Key wird bald eingerichtet" sitzt:

**Kein Key hinterlegt:** Provider-Auswahl (OpenAI / Anthropic), Passwort-Feld (`type="password"`) für den Key, kurzer Hilfetext mit Link zur Key-Erstellung des Anbieters, Button „Speichern & testen". Während des Tests Spinner „Key wird geprüft…".

**Key hinterlegt:** Statuskarte mit `OpenAI · sk-…x4Fq · ✓ Aktiv`, daneben „Key ersetzen" und „Entfernen". Der volle Key ist nicht mehr abrufbar — wer ihn ändern will, gibt einen neuen ein.

**Im KI-Sous-Chef:** Solange kein Key existiert (der Chat-Endpoint antwortet mit `402 kein_key`), zeigt der Chat statt des Eingabefelds eine freundliche Karte: „Um den KI-Sous-Chef zu nutzen, hinterlege deinen API-Key in den Einstellungen" mit Button dorthin. Kein Key-Zwang bei der Registrierung — die Hürde käme sonst zu früh.

## 6. Sicherheits-Checkliste

Der Key erscheint nie in `console.log`, Vercel-Logs oder Fehlermeldungen (Fehlerobjekte von fetch können Header enthalten — nie ungefiltert loggen). `SUPABASE_SERVICE_ROLE_KEY` und `KEY_ENCRYPTION_SECRET` existieren nur als Server-Env-Vars, nie mit `NEXT_PUBLIC_`-Präfix. Die Chat-Route bekommt ein einfaches Rate-Limit pro Nutzer (z. B. Upstash Ratelimit oder ein Zähler in Supabase), damit ein Bug im Frontend nicht das Guthaben eines Nutzers leerfeuert. Beim Entfernen des Accounts löscht `on delete cascade` den Key automatisch mit. Und in den Nutzungshinweisen kurz erwähnen: Der Key wird verschlüsselt gespeichert und ausschließlich für die eigenen Anfragen des Nutzers verwendet.

## 7. Umsetzungsreihenfolge

1. Env-Vars setzen (`KEY_ENCRYPTION_SECRET`, Service-Role-Key liegt bei Supabase-Projekten schon vor)
2. Tabelle + RLS anlegen (SQL oben)
3. `lib/crypto.ts` + `/api/ki/key` (POST/GET/DELETE)
4. Settings-UI im Bereich „KI-Funktionen"
5. `/api/ki/chat` als streamender Proxy + Anbindung des KI-Sous-Chef-Chats
6. Rate-Limit + Fehlerzustände (ungültiger Key, Guthaben aufgebraucht → 429 vom Anbieter sauber anzeigen)

Damit ist der KI-Sous-Chef live, ohne dass du je einen Cent fremder KI-Nutzung trägst — und jeder Nutzer behält die volle Kontrolle über seinen eigenen Key.

