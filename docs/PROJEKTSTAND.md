# Projektstand — Culinary Studio

> Stand 2026-07-23. Für jemanden ohne Vorwissen, der sofort weiterarbeiten
> können soll. Ersetzt keine der Einzel-Doku-Dateien (siehe unten), fasst
> nur den aktuellen Gesamtzustand zusammen.

## Kurzfassung

Next.js-14-App für professionelle Köche/Gastronomen (Rezepte, Menüs,
Tellerdesign per KI, Zutatenwissen), Supabase als Backend. Kernprodukt ist
fertig, live und in Produktion nutzbar unter der eigenen Domain
**`culinary-studio.de`** (technischer Go-Live im Stripe-Testmodus
abgeschlossen, siehe `docs/master-aufgabenliste.md` Teil 1A/1B). Produktname
im gesamten sichtbaren Text auf **„Culinary Studio"** vereinheitlicht (das
frühere „LUCA"-Präfix ist überall entfernt, siehe Abschnitt 2). Öffentlicher
Bezahlbetrieb ist weiterhin gesperrt (`NEXT_PUBLIC_PAYMENTS_ENABLED=false`),
bis Gewerbe/Rechtstexte stehen (Teil 2 der Master-Aufgabenliste).

---

## 1. Tech-Stack

- Next.js 14.2.35 (App Router), React 18, TypeScript, Tailwind CSS
- Supabase (Auth + Postgres + Storage) — ein Projekt für Dev und Prod
  gemeinsam genutzt (`bredshsuqghsiaefpitk`)
- Resend (Transaktions-Mails), Stripe (Zahlungsabwicklung, `stripe@22.3.2`),
  OpenAI (GPT-4o Text + Bildgenerierung)
- Deployment: Vercel
- `shadcn` (Codegen-CLI für UI-Komponenten, `npx shadcn add ...`) liegt in
  `devDependencies` — landet nicht im ausgelieferten Bundle, kein
  `import`/`require` irgendwo in `src/`. Nebeneffekt: `npm audit --omit=dev`
  meldet dadurch nur noch 2 statt 5 Schwachstellen (Details/verbleibende
  npm-Schwachstellen siehe `docs/master-aufgabenliste.md` Teil 4).

---

## 2. Fertig & produktiv nutzbar

- **Rezepte/Zutaten/Fermentation/Projekte/Wein-Pairing**: CRUD, Bild-Upload,
  Geschmacksprofile (6-Achsen), Saison-Filter, Zutatenstammbaum (SVG, 6
  Zutaten hart hinterlegt).
- **Menügenerator**: echte KI-Generierung über den zentralen Betreiber-Key
  (`OPERATOR_OPENAI_KEY`), 3-Schritt-Dialog, Wein-Pairing pro Gang,
  Technik-Taxonomie an Aufwandsstufe gekoppelt, als Projekt speicherbar.
- **KI-Sous-Chef & Rezept-Sous-Chef**: laufen über denselben zentralen
  Betreiber-Key (`OPERATOR_OPENAI_KEY`), nicht mehr über BYOK. Rezept-Sous-Chef darf bei
  explizitem Chat-Auftrag ("Umbau-Auftrag") aktiv Küchenwissen einbringen,
  beim Import gilt weiter strikt "nichts erfinden".
- **Tellerdesigner**: echte Bildgenerierung + Galerie mit Persistenz
  (Tabelle `tellerdesigns`), 21 Anrichte-Techniken, Zwei-Achsen-System
  (Stilrichtung/Anrichte-Fokus), siehe `docs/tellerdesigner-vision.md`.
- **Gewichtetes KI-Text-Kontingent**: Tabelle `ai_text_quota`,
  `check_and_increment_text_quota`-RPC, Gewichte in
  `src/config/textQuota.ts` (Chat/Import/Menü/Vision unterschiedlich
  teuer). Bild-Kontingent analog über `ai_image_quota`.
- **„Mein Plan"-Tab** (`/profil`): Stufenvergleich mit Punktzahl,
  aktuelles Kontingent, alles aus `TEXT_QUOTA_BY_TIER`/`IMAGE_QUOTA_BY_TIER`
  berechnet, keine hartcodierten Zahlen. Buttons sind seit dieser Session
  **echt** an Stripe angebunden (siehe Abschnitt 4).
- **Supabase-Client-SSR-Crash behoben** (schwerwiegender Bug, hätte jedes
  Produktions-Deployment mit "Element type is invalid" lahmgelegt):
  `src/utils/supabase/client.ts` lädt `@supabase/ssr` jetzt per
  dynamischem `import()`. Alle 14 Aufrufstellen entsprechend auf `await`
  umgestellt, plus defensives Error-Handling (`isChunkLoadError` in
  `src/lib/utils.ts`) an allen kritischen Stellen (Login, Logout,
  Passwort ändern, Admin-Auth-Checks) für den Fall eines
  Chunk-Load-Fehlers nach einem Deploy.
- **BYOK vollständig entfernt** (Verschlüsselung, Key-Verwaltung,
  `src/lib/crypto.ts` etc.), inklusive der zuletzt verwaisten Tabelle
  `user_api_keys` (in Supabase gelöscht). `docs/byok-konzept.md` ist als
  historisch/überholt markiert.
- **Kreativlabor entfernt**, ersetzt durch "Collection"-Navigationspunkt.
  **Collection selbst ist nur Gerüst** (`src/app/collection/*`, ~27 Zeilen
  pro Seite, `EmptyState`-Platzhalter) — keine Datenbank-Anbindung, kein
  Veröffentlichen-Flow. Bewusst zurückgestellt (siehe
  `docs/community-konzept.md`).
- **Branding vereinheitlicht**: „LUCA" als Marken-Präfix komplett entfernt
  (Tab-Titel, Sidebar, mobile Topbar, Footer, Menükarten, KI-System-Prompts),
  einheitlich „Culinary Studio" — inklusive der vorher uneinheitlichen
  Bezeichnung „Culinary Creator". Nebenbei ein Kollisions-Bug im
  Sidebar-/Bottom-Nav-Active-Matching behoben (`/zutatenstammbaum` markierte
  fälschlich auch „Zutatenbibliothek" als aktiv).

---

## 3. Stripe-Zahlungsabwicklung (diese Session, lokal fertig, ungepusht)

Vollständig gebaut und per Browser-Automatisierung end-to-end getestet
(Checkout mit Testkarte 4242…, Webhook, Kündigung über Customer Portal,
simulierter Periodenende-Downgrade). Details: `docs/stripe-plan.md`.

- `src/lib/stripe.ts`, `POST /api/stripe/checkout`,
  `POST /api/stripe/webhook`, `POST /api/stripe/portal`
- `profiles` um `stripe_customer_id`, `stripe_subscription_id`,
  `subscription_status`, `current_period_end` erweitert — **Migration
  bereits in Supabase ausgeführt und verifiziert** (siehe Abschnitt 7).
- „Mein Plan"-Tab hat jetzt echte Upgrade-/„Abo verwalten"-Buttons statt
  des alten Mailto-Links.
- Team-Grundsatzfrage entschieden: **Team = Einzelkonto mit größerem
  Kontingent**, kein echtes Mehrbenutzer-Konto. `src/config/roles.ts`
  entsprechend korrigiert ("+ Mehrbenutzer" → "+ größtes KI-Guthaben &
  Bildkontingent").
- **Noch offen**: Widerrufsrecht-Checkbox im Checkout technisch vorbereitet
  (`consent_collection`/`custom_text` in `src/app/api/stripe/checkout/route.ts`
  als TODO markiert), aber noch nicht scharf geschaltet — fehlt der
  Rechtstext (siehe `docs/master-aufgabenliste.md`).

---

## 4. Offene Registrierung (diese Session, **committet, end-to-end getestet**)

Ersetzt den alten Zugangsantrag-Flow (Formular → `access_requests` →
manuelle Admin-Freigabe) durch echte Selbstanmeldung. Details:
`docs/registrierung-plan.md`.

- `POST /api/register` (`supabase.auth.signUp()`-basiert), `stufe: 1`
  wird sofort gesetzt, kein Admin-Zutun nötig.
- `src/app/auth/callback/route.ts` tauscht den Bestätigungslink-Code gegen
  eine Session (unterstützt sowohl PKCE- als auch Token-Hash-Format).
- `/register`: Grund-Feld entfernt, Pflicht-Checkbox AGB/Datenschutz
  ergänzt, neuer "Bestätigungsmail verschickt"-Zustand mit
  Erneut-senden-Button.
- `/agb`, `/datenschutz`: neue Gerüst-Seiten, **kein bindender Rechtstext**
  (bewusst, siehe `docs/registrierung-plan.md` Abschnitt 6).
- Alte `/api/register-request`-Route entfernt (ersetzt).
- Resend-Domain `mail.culinary-studio.de` verifiziert, Custom SMTP in
  Supabase auf Resend eingerichtet.
- **Voller Erfolgspfad end-to-end getestet und bestätigt**: Registrierung →
  Bestätigungsmail über die eigene Domain → Klick auf den Bestätigungslink →
  `/auth/callback` → Login → Dashboard mit Stufe 1.
- `docs/registrierung-migration.sql` ist ausgeführt (siehe Abschnitt 7).
- Committet als `b3a0997` (`feat: offene Registrierung -- Selbstanmeldung
  statt Zugangsantrag`).

### Alter Zugangsantrag-/Freigabe-Flow entfernt (Commit `99759f6`)

Die im vorherigen Stand dieser Datei noch offene Entscheidung ist getroffen
und umgesetzt:

- 7 Routen gelöscht: `/api/admin/approve`, `/api/admin/reject`,
  `/api/admin/requests`, `/api/admin/requests/[id]/approve`,
  `/api/admin/requests/[id]/reject`, `/api/admin/action`,
  `src/app/admin/page.tsx`.
- `src/lib/email.ts` komplett gelöscht (`sendAccessRequestEmail`,
  `sendApprovedEmail`, `sendRejectedEmail` — nur vom alten Flow genutzt).
- "Anfragen"-Tab vollständig aus `src/app/profil/page.tsx` entfernt
  (Tab-Union, `AccessRequest`-Typ, State, Handler, Nav-Eintrag, JSX-Block).
- Wein-Datenbank-Link von der gelöschten `/admin`-Seite in den
  "Verwaltung"-Tab auf `/profil` umgezogen, damit `/admin/weine` seinen
  In-App-Navigationseinstieg behält.
- `access_requests`-Cleanup in `src/app/api/admin/users/[id]/route.ts`
  (beim Nutzer-Löschen) entfernt — war mit `signUp()`-basierter
  Registrierung ohnehin hinfällig.
- `access_requests`-Tabelle selbst bleibt unangetastet (6 Alt-Zeilen, keine
  DB-Änderung), wird aber von keinem Code-Pfad mehr gelesen/geschrieben.

---

## 5. Git-Status

**Der technische Go-Live ist erfolgt** — der große Rückstand aus früheren
Session-Ständen dieser Datei (zuletzt „22 Commits ungepusht") ist inzwischen
auf `origin/master` gepusht. Aktuell ist `master` nur noch **2 Commits vor
`origin/master`**:

```
2400d7f chore: shadcn von dependencies nach devDependencies verschoben
1b3a915 fix: npm audit fix fuer 4 der 9 gemeldeten Schwachstellen
```

Zuletzt gepushte Commits (Auszug, neueste zuerst):
```
497e85e fix: Unnoetige Einzel-Komponente bei einteiligen Gerichten im Bild-/Text-Import
e8d61b4 fix: Zutaten-Erkennung bei dichten Bild-Vorlagen (Infografiken)
5ce24e3 docs: Produktname vereinheitlicht auf "Culinary Studio"
f71cffb fix: Kollisionssicheres Active-Matching in Sidebar & Bottom-Nav
5e7858a fix: Browser-Autofill ueberschreibt Dark-Mode-Textfarbe in Inputs
928bf74 fix: Dark-Mode-Kontrastprobleme systematisch beheben (Login/Register/Profil/Dashboard/Stammbaum)
b713b18 docs: OPENAI_API_KEY als Altlast streichen, OPERATOR_OPENAI_KEY korrekt dokumentieren
efe4950 feat: Kaufsperre über NEXT_PUBLIC_PAYMENTS_ENABLED, default aus
91de644 docs: PROJEKTSTAND auf aktuellen Stand
f57e0ef docs: vollständige Master-Aufgabenliste
c7e741d docs: Feature-Backlog für Post-Launch-Ideen
99759f6 chore: alten Zugangsantrag-/Freigabe-Flow entfernen
b3a0997 feat: offene Registrierung -- Selbstanmeldung statt Zugangsantrag
```

**Working Tree**: sauber bis auf die laufende Doku-Aufräumung dieser Session
(`.md.txt` → `.md`-Umbenennungen, `docs/byok-konzept.md`-Historisch-Hinweis,
`docs/master-aufgabenliste.md`- und diese `docs/PROJEKTSTAND.md`-Aktualisierung).

`npx tsc --noEmit` und `npm run build` sind mit diesem Stand sauber
(zuletzt verifiziert 2026-07-23).

---

## 6. Env-Vars (`.env.local`, Namen — keine Werte)

| Variable | Zweck | Status |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` / `_ANON_KEY` | Supabase-Client | gesetzt, `_ANON_KEY` auf neues Key-Format migriert (`sb_publishable_...`) |
| `SUPABASE_SERVICE_ROLE_KEY` | Admin-Client (RLS-Bypass) | gesetzt, auf neues Key-Format migriert (`sb_secret_...`) |
| `NEXT_PUBLIC_APP_URL` | für Redirect-/Callback-URLs | gesetzt, zeigt auf `culinary-studio.de` |
| `NEXT_PUBLIC_AI_MENU_ENABLED` / `_AI_PLATE_ENABLED` | Feature-Flags Menügenerator/Tellerdesigner | gesetzt |
| `NEXT_PUBLIC_PAYMENTS_ENABLED` | Kaufsperre (siehe Abschnitt 3) | gesetzt, default `false` |
| `OPERATOR_OPENAI_KEY` | zentraler Betreiber-Key — **einzige** tatsächlich gelesene OpenAI-Variable, einzige Lesestelle `src/lib/operator-key.ts` (`getOperatorOpenAiKey()`), genutzt von allen 6 KI-Routen: KI-Sous-Chef-Chat, Menügenerator, Rezept-Bild-Import, Rezept-KI-Import, Rezept-Sous-Chef, Tellerdesigner-Bildgenerierung | gesetzt |
| `RESEND_API_KEY` | Transaktions-Mails, jetzt auch Supabase-Auth-Confirm-Mails via Custom SMTP | gesetzt, Domain `mail.culinary-studio.de` verifiziert |
| `STRIPE_SECRET_KEY` / `STRIPE_WEBHOOK_SECRET` | Stripe-Testmodus | gesetzt |
| `STRIPE_PRICE_BASIC` / `_PRO` / `_TEAM` | Price-IDs (Testmodus) | gesetzt |

**Custom SMTP**: in Supabase auf Resend umgestellt, Domain
`mail.culinary-studio.de` verifiziert — Supabase verschickt
Auth-Bestätigungsmails jetzt darüber (end-to-end bewiesen, siehe
Abschnitt 4). Keine Änderung an den Env-Vars selbst nötig, reine
Supabase-Dashboard-Konfiguration.

**Supabase-Key-Format-Migration**: `NEXT_PUBLIC_SUPABASE_ANON_KEY` und
`SUPABASE_SERVICE_ROLE_KEY` laufen jetzt über das neue Supabase-Key-Format
(`sb_publishable_...` / `sb_secret_...` statt der alten JWT-Keys). Die alten
Legacy-JWT-Keys sind im Supabase-Dashboard deaktiviert.

**Domain**: App läuft live unter `culinary-studio.de`, Supabase Site-URL/
Redirect-URLs entsprechend umgestellt (siehe Abschnitt 5).

**Bei Vercel erledigt**: alle produktionsrelevanten Env-Vars gesetzt
(`OPERATOR_OPENAI_KEY`, Stripe-Testmodus-Keys, `SUPABASE_SERVICE_ROLE_KEY`
im neuen Format, `NEXT_PUBLIC_AI_PLATE_ENABLED=true`), `NEXT_PUBLIC_AI_LAB_ENABLED`
und `KEY_ENCRYPTION_SECRET` gelöscht (BYOK entfernt). `OPENAI_API_KEY` wird
bei Vercel **nicht** benötigt — kein Code-Pfad liest diese Variable, siehe
`docs/master-aufgabenliste.md` Teil 1B.

---

## 7. Datenbank: Tabellen & Migrationen

Direkt gegen Supabase verifiziert (nicht nur aus dem Gedächtnis):

| Tabelle | Vorhanden | Bemerkung |
|---|---|---|
| `profiles` | ✅ | inkl. `stripe_customer_id`, `stripe_subscription_id`, `subscription_status`, `current_period_end`, `terms_accepted_at`, `terms_version` — **Stripe- und Registrierungs-Migration sind beide ausgeführt** (direkt gegen Supabase verifiziert). |
| `ai_text_quota` | ✅ | siehe `docs/text-quota.sql` |
| `ai_image_quota` | ✅ | analog, Bild-Kontingent |
| `tellerdesigns` | ✅ | siehe `docs/tellerdesigns.sql` |
| `access_requests` | ✅ (6 Alt-Zeilen) | seit Commit `99759f6` von keinem Code-Pfad mehr gelesen/geschrieben (alle Freigabe-Routen entfernt, siehe Abschnitt 4) — reine Alt-Daten |
| `ai_rate_limits` | ✅ | Minuten-/Tages-Limit, unabhängig vom Kontingent-System |
| `user_api_keys` | ❌ gelöscht | BYOK-Altlast, in Supabase entfernt (`drop table`) |

**SQL-Dateien in `docs/`** und ihr Ausführungsstatus:
- `docs/text-quota.sql` — ausgeführt (Feature läuft produktiv)
- `docs/tellerdesigns.sql` — ausgeführt (Feature läuft produktiv)
- `docs/stripe-migration.sql` — **ausgeführt, verifiziert**
- `docs/registrierung-migration.sql` — **ausgeführt, verifiziert** (Spalten
  direkt gegen Supabase geprüft, zusätzlich durch den erfolgreichen
  Stufe-1-Registrierungstest belegt)

---

## 8. Offene Entscheidungen & nächste Schritte

Maßgebliche, laufend gepflegte Quelle dafür ist **`docs/master-aufgabenliste.md`**
(vollständige, nach Launch-Kritikalität sortierte Aufgabenliste, aus dieser
Datei und der Chat-Session zusammengeführt) — wird hier bewusst nicht
dupliziert, um nicht zwei Stellen synchron halten zu müssen. Kurzer Verweis
auf die dortige Struktur:

- Teil 1: Weg zum technischen Go-Live — **1A/1B erledigt** (Code-Checks,
  Push, Vercel-Env-Vars, Domain, Supabase-Produktion), App läuft live im
  Stripe-**Testmodus**. Nur der Stripe-**Live**-Modus-Teil bleibt offen,
  bewusst nicht angefasst, solange Teil 2 offen ist.
- Teil 2: Rechtliches (AGB, Datenschutz, Impressum, Widerrufsrecht,
  Umsatzsteuer) — der Engpass, der auch den Stripe-Live-Teil aus Teil 1
  blockiert.
- Teil 3: Post-Launch-Features (Kalorien, Feedback-System, Gamification,
  Collection/Community, Menügenerator-/Tellerdesigner-Ausbau).
- Teil 4: Aufräumen & technische Schuld.
- Teil 5: bewusst offen gelassene Nicht-Bugs (Dokumentation).

---

## Weitere Dokumentation im Projekt

- `docs/master-aufgabenliste.md` — vollständige, priorisierte Aufgabenliste
  (Weg zum Launch, Rechtliches, Post-Launch-Features, Aufräumen), siehe
  Abschnitt 8
- `CLAUDE.md` — Konventionen, Architektur-Grundregeln
- `TO_CHANGE.md` — älteres, chronologisches Backlog-Log (Stand
  2026-07-15, größtenteils durch diese Datei und master-aufgabenliste.md
  überholt)
- `docs/abo-konzept.md` — Herleitung der 4 Abo-Stufen, Preise, Marge
- `docs/stripe-plan.md` — vollständige Stripe-Architektur
- `docs/registrierung-plan.md` — vollständige Registrierungs-Architektur
- `docs/tellerdesigner-vision.md` — Produktvision Tellerdesigner (vor jeder
  Änderung an `/tellerdesigner` lesen)
- `docs/community-konzept.md` — zurückgestelltes Collection/Community-Konzept
- `docs/menuegenerator-konzept.md` — Konzept Menügenerator
- `docs/feature-backlog.md` — geparkte Post-Launch-Feature-Ideen
- `docs/byok-konzept.md` — historisch, BYOK ist entfernt
