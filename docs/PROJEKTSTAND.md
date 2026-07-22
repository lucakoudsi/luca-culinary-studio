# Projektstand — LUCA Culinary Studio

> Stand 2026-07-22. Für jemanden ohne Vorwissen, der sofort weiterarbeiten
> können soll. Ersetzt keine der Einzel-Doku-Dateien (siehe unten), fasst
> nur den aktuellen Gesamtzustand zusammen.

## Kurzfassung

Next.js-14-App für professionelle Köche/Gastronomen (Rezepte, Menüs,
Tellerdesign per KI, Zutatenwissen), Supabase als Backend. Kernprodukt ist
fertig und in Produktion nutzbar (letztes echtes Deployment: 2026-07-15,
Commit `67f28e2`). **Seitdem sind 22 weitere Commits entstanden, die noch
nicht auf `origin/master` gepusht sind** — der größte Teil dieser Session
(Supabase-Crash-Fix, Stripe-Zahlungsabwicklung, Plan-Tab, offene
Registrierung inkl. Entfernung des alten Zugangsantrag-Flows) ist lokal
fertig und lokal end-to-end getestet, aber noch nicht live/gepusht.

---

## 1. Tech-Stack

- Next.js 14.2.35 (App Router), React 18, TypeScript, Tailwind CSS
- Supabase (Auth + Postgres + Storage) — ein Projekt für Dev und Prod
  gemeinsam genutzt (`bredshsuqghsiaefpitk`)
- Resend (Transaktions-Mails), Stripe (Zahlungsabwicklung, `stripe@22.3.2`),
  OpenAI (GPT-4o Text + Bildgenerierung)
- Deployment: Vercel

---

## 2. Fertig & produktiv nutzbar

- **Rezepte/Zutaten/Fermentation/Projekte/Wein-Pairing**: CRUD, Bild-Upload,
  Geschmacksprofile (6-Achsen), Saison-Filter, Zutatenstammbaum (SVG, 6
  Zutaten hart hinterlegt).
- **Menügenerator**: echte KI-Generierung über den zentralen Betreiber-Key
  (`OPERATOR_OPENAI_KEY`), 3-Schritt-Dialog, Wein-Pairing pro Gang,
  Technik-Taxonomie an Aufwandsstufe gekoppelt, als Projekt speicherbar.
- **KI-Sous-Chef & Rezept-Sous-Chef**: laufen über den Betreiber-Key
  (`OPENAI_API_KEY`), nicht mehr über BYOK. Rezept-Sous-Chef darf bei
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
  `src/lib/crypto.ts` etc.) — einzige verbliebene Spur ist die verwaiste
  Tabelle `user_api_keys` in Supabase (siehe Abschnitt 8).
- **Kreativlabor entfernt**, ersetzt durch "Collection"-Navigationspunkt.
  **Collection selbst ist nur Gerüst** (`src/app/collection/*`, ~27 Zeilen
  pro Seite, `EmptyState`-Platzhalter) — keine Datenbank-Anbindung, kein
  Veröffentlichen-Flow. Bewusst zurückgestellt (siehe
  `docs/community-konzept.md.txt`).

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

**Branch `master` ist 22 Commits vor `origin/master`** (letzter Push:
2026-07-15, `67f28e2`). Kein Push in dieser Session durchgeführt.

Ungepushte Commits (neueste zuerst):
```
f57e0ef docs: vollständige Master-Aufgabenliste
c7e741d docs: Feature-Backlog für Post-Launch-Ideen
99759f6 chore: alten Zugangsantrag-/Freigabe-Flow entfernen
b3a0997 feat: offene Registrierung -- Selbstanmeldung statt Zugangsantrag
7ed1daa fix: Team-Stufenbeschreibung an "Einzelkonto"-Entscheidung anpassen
ce9d6dd feat: Stripe-Checkout/Webhook/Portal fuer Abo-Upgrades, end-to-end getestet
f746aef fix: Supabase-Client-SSR-Crash beheben, Plan-Tab, Sous-Chef-Prompt, Komponenten-Hinweis
ae4ad4a chore: toten Code aufraeumen (backend/-Prototyp, ungenutzte Module, npm audit)
b170345 feat: gewichtetes Text-KI-Kontingent, Team-Bildkontingent gesenkt
194c17a feat: KI-Sous-Chef auf Betreiber-Key umstellen, BYOK komplett ausbauen
0f1c3db fix: Tellerdesigner-Varianten beim Stil-/Fokus-Wechsel behalten
4f2174b feat: Collection-Navigation als Ersatz fuer Kreativlabor (Schritt 1)
decd5fc feat: Tellerdesigner Phase B -- Galerie mit Persistenz
41ae4d9 feat: Tellerdesigner-Redesign (Vision, Zwei-Achsen-System, Bugfixes, Layout)
2a062b4 feat: give KI-Sous-Chef vision access to import session images
058ce1a fix: make <main> the real scroll container in AppShell
58a3837 fix: give Admin (Tier 99) unlimited image quota instead of 0
efdfa45 fix: sharpen Gericht-Rekonstruktion prompt (Vollständigkeit, Anrichte-Schritte, Unsicherheit)
5159a57 chore: track project docs + local Claude Code tooling permissions
277f7fc feat: add Gericht-Rekonstruktion mode to Bild-Import
5895019 feat: build real Tellerdesigner (image generation + save)
953707c fix: add maxDuration + soft upstream timeout to all KI-Routen
```

**Working Tree**: sauber bis auf diese Datei selbst (`docs/PROJEKTSTAND.md`,
gerade in Aktualisierung). Alle vorherigen Working-Tree-Änderungen
(offene Registrierung, alter-Flow-Entfernung, Feature-Backlog,
Master-Aufgabenliste) sind in den obigen Commits committet.

`npx tsc --noEmit` und `npm run build` sind mit diesem Stand sauber
(zuletzt verifiziert 2026-07-22).

---

## 6. Env-Vars (`.env.local`, Namen — keine Werte)

| Variable | Zweck | Status |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` / `_ANON_KEY` | Supabase-Client | gesetzt |
| `SUPABASE_SERVICE_ROLE_KEY` | Admin-Client (RLS-Bypass) | gesetzt |
| `NEXT_PUBLIC_APP_URL` | für Redirect-/Callback-URLs | gesetzt |
| `NEXT_PUBLIC_AI_MENU_ENABLED` / `_AI_PLATE_ENABLED` | Feature-Flags Menügenerator/Tellerdesigner | gesetzt |
| `OPENAI_API_KEY` | Rezept-/KI-Sous-Chef, Bildgenerierung | gesetzt |
| `OPERATOR_OPENAI_KEY` | Menügenerator (zentraler Betreiber-Key) | gesetzt |
| `PEXELS_API_KEY` | **ungenutzt** — kein Treffer im gesamten `src/`, vermutlich Altlast | gesetzt, aber tot |
| `RESEND_API_KEY` | Transaktions-Mails, jetzt auch Supabase-Auth-Confirm-Mails via Custom SMTP | gesetzt, Domain `mail.culinary-studio.de` verifiziert |
| `STRIPE_SECRET_KEY` / `STRIPE_WEBHOOK_SECRET` | Stripe-Testmodus | gesetzt |
| `STRIPE_PRICE_BASIC` / `_PRO` / `_TEAM` | Price-IDs (Testmodus) | gesetzt |

**Custom SMTP**: in Supabase auf Resend umgestellt, Domain
`mail.culinary-studio.de` verifiziert — Supabase verschickt
Auth-Bestätigungsmails jetzt darüber (lokal end-to-end bewiesen, siehe
Abschnitt 4). Keine Änderung an den Env-Vars selbst nötig, reine
Supabase-Dashboard-Konfiguration.

**Bei Vercel erledigt**: `NEXT_PUBLIC_AI_PLATE_ENABLED=true` gesetzt,
`NEXT_PUBLIC_AI_LAB_ENABLED` und `KEY_ENCRYPTION_SECRET` gelöscht (BYOK
entfernt). Für den nächsten Deploy weiterhin neu zu ergänzen:
`OPENAI_API_KEY`, alle Stripe-Testmodus-Keys (`STRIPE_SECRET_KEY`,
`STRIPE_WEBHOOK_SECRET`, `STRIPE_PRICE_*`), `SUPABASE_SERVICE_ROLE_KEY`
prüfen — vollständige, priorisierte Liste siehe
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
| `user_api_keys` | ✅ (verwaist) | BYOK entfernt, Tabelle wird von nichts mehr gelesen — laut `TO_CHANGE.md.txt` zum Löschen vorgemerkt, noch nicht erledigt |

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

- Teil 1: Weg zum technischen Go-Live (Code-Checks, Push, Vercel-Env-Vars,
  Supabase-Produktion, Stripe-Live-Modus).
- Teil 2: Rechtliches (AGB, Datenschutz, Impressum, Widerrufsrecht,
  Umsatzsteuer) — wahrscheinlicher Engpass für den öffentlichen
  Bezahl-Live-Gang.
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
- `TO_CHANGE.md.txt` — älteres, chronologisches Backlog-Log (Stand
  2026-07-15, größtenteils durch diese Datei und master-aufgabenliste.md
  überholt)
- `docs/abo-konzept.md.txt` — Herleitung der 4 Abo-Stufen, Preise, Marge
- `docs/stripe-plan.md` — vollständige Stripe-Architektur
- `docs/registrierung-plan.md` — vollständige Registrierungs-Architektur
- `docs/tellerdesigner-vision.md` — Produktvision Tellerdesigner (vor jeder
  Änderung an `/tellerdesigner` lesen)
- `docs/community-konzept.md.txt` — zurückgestelltes Collection/Community-Konzept
- `docs/menuegenerator-konzept.md.txt` — Konzept Menügenerator
- `docs/feature-backlog.md` — geparkte Post-Launch-Feature-Ideen
- `docs/byok-konzept.md` — historisch, BYOK ist entfernt
