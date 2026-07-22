# Offene Registrierung — Planung

> Stand 2026-07-22. Reine Planung, noch nichts gebaut. Grundlage: Analyse des
> aktuellen Zugangsantrag-Flows (siehe Chat-Verlauf) + die im Anschluss
> getroffenen Entscheidungen.

## 0. Entscheidungen (vorgegeben)

1. `supabase.auth.signUp()` statt Eigenbau — `access_requests.password_temp`
   (Klartext-Passwort in der DB) entfällt damit ersatzlos.
2. Admin-Freigabe wird umgewidmet zum manuellen Stufen-Upgrade für
   bestehende Nutzer; die drei parallelen Freigabe-Implementierungen sollen
   konsolidiert werden — siehe Abschnitt 4, dort ein Fund, der diesen Punkt
   nochmal vereinfacht.
3. AGB-Zustimmung mit Nachweis: `terms_accepted_at` + `terms_version` auf
   `profiles`, Pflicht-Checkbox mit Links auf `/agb` und `/datenschutz`.
4. Nach der Anmeldung: Dashboard mit Stufe 1, keine Bezahlschranke.
5. Neu zu bauen: `/auth/callback` fuer den Bestaetigungslink, plus
   Zwischenzustand "Bestaetigungsmail verschickt" auf `/register`.

Offen, wird nachgereicht: Status von Supabase "Confirm email" + Custom-SMTP
(Resend) — siehe Abschnitt 8. Der Rest dieses Plans ist davon unabhaengig
umsetzbar; nur Abschnitt 8 selbst haengt am Ergebnis.

---

## 1. Datenmodell-Aenderungen

### `profiles` (neue Spalten, kleine Migration)
- `terms_accepted_at timestamptz`
- `terms_version text` (z.B. `"2026-07-22"` oder eine fortlaufende Nummer —
  identifiziert, welcher AGB-/Datenschutz-Stand zugestimmt wurde)

### `access_requests`
Wird mit der Umstellung **funktional obsolet** fuer den Registrierungs-Flow
(dazu mehr in Abschnitt 4) — bleibt als Tabelle bestehen (keine Daten
loeschen), wird aber von keinem neuen Code-Pfad mehr beschrieben. Die
`password_temp`-Spalte wird nirgends mehr geschrieben.

---

## 2. Neuer Registrierungs-Ablauf

Ersetzt `POST /api/register-request` durch `POST /api/register`:

1. Client sendet `{ name, email, password, termsAccepted }`. `termsAccepted`
   muss `true` sein (serverseitig nochmal geprueft, nicht nur im UI
   erzwungen — ein deaktivierter Button ist kein Ersatz fuer eine
   Server-Validierung).
2. Server ruft `supabase.auth.signUp({ email, password, options: {
   data: { full_name: name }, emailRedirectTo: '<app-url>/auth/callback' } })`
   auf. Supabase legt den Account **sofort** an (Status: nicht bestaetigt)
   und verschickt selbststaendig die Bestaetigungs-Mail — kein eigener
   E-Mail-Versand-Code mehr noetig fuer diesen Schritt.
3. Duplikat-Handling kommt jetzt **gratis von Supabase**: `signUp()` mit
   einer bereits existierenden E-Mail liefert einen entsprechenden Fehler
   zurueck, den wir nur noch weiterreichen muessen. Der manuelle
   Duplikat-Check aus `register-request/route.ts` (nur gegen
   `access_requests`, nie gegen echte Accounts) entfaellt und wird durch
   etwas Zuverlaessigeres ersetzt.
4. Direkt im Anschluss (gleicher Request, `authData.user.id` liegt vor):
   `profiles.upsert({ id, full_name: name, stufe: 1, terms_accepted_at:
   now(), terms_version: CURRENT_TERMS_VERSION })`. Stufe 1 wird also
   **serverseitig fest gesetzt**, nicht dem Admin ueberlassen (im
   Unterschied zum heutigen Freigabe-Flow, der auf Stufe 2 defaultet).
5. Response an den Client: nur Erfolg/Fehler, kein Passwort oder Token im
   Klartext irgendwo sichtbar.

Kein neuer Code fuer den eigentlichen Mail-Versand oder die Token-Erzeugung
— das übernimmt `signUp()` vollstaendig.

---

## 3. `/auth/callback` (neu)

Supabase leitet nach Klick auf den Bestaetigungslink auf die in
`emailRedirectTo` angegebene URL um, mit einem Code/Token im Query-String.
Die Route muss:
1. Den Code gegen eine Session tauschen (`supabase.auth.exchangeCodeForSession`
   bzw. das Aequivalent fuer den gewaehlten Supabase-SSR-Client — exakte
   Methode haengt vom eingesetzten `@supabase/ssr`-Flow ab, wird beim Bauen
   verifiziert).
2. Bei Erfolg: Redirect auf `/` (Dashboard, Nutzer ist jetzt eingeloggt und
   bestaetigt).
3. Bei Fehler (abgelaufener/ungueltiger Link): Redirect auf `/login` mit
   einer verstaendlichen Fehlermeldung, plus einem Weg, die
   Bestaetigungs-Mail erneut anzufordern (`supabase.auth.resend()`).

---

## 4. Admin-Freigabe: Fund + Empfehlung

Beim Nachlesen der Nutzerverwaltung fuer diesen Plan aufgefallen: **Das
"manuelle Stufen-Upgrade fuer bestehende Nutzer" aus Entscheidung 2 gibt es
bereits, fertig gebaut, unabhaengig von `access_requests`:**

- `PATCH /api/admin/users/[id]` setzt `titel`/`stufe` fuer eine beliebige
  bestehende `profiles`-Zeile (Admin-only, per `ADMIN_EMAIL`-Check).
- Der "Verwaltung"-Tab auf `/profil` (Tab 5, admin-only) ist die dazugehoerige
  UI — Liste aller Nutzer, Stufe/Titel direkt editierbar.

Das heisst: Sobald Registrierung offen ist, hat *jeder* Interessent (Tester,
Presse) ohnehin einen eigenen, sofort nutzbaren Free-Account per
Selbstanmeldung. Um jemandem Pro zu geben, reicht ein Klick im bestehenden
Verwaltung-Tab — **voellig unabhaengig von den drei
`access_requests`-Freigabe-Routen.**

**Daraus folgt eine einfachere Empfehlung als "auf eine konsolidieren":**
Alle drei koennen ersatzlos entfernt werden, weil ihr einziger Zweck —
Accounts aus `access_requests` erzeugen — mit offener Registrierung
wegfaellt, und der verbleibende echte Bedarf (Stufe manuell hochsetzen)
bereits vom Verwaltung-Tab abgedeckt ist:
- `GET /api/admin/approve` + `GET /api/admin/reject` (Token-Links aus der
  Benachrichtigungs-Mail)
- `POST /api/admin/requests/[id]/approve` + das zugehoerige `reject`
- `POST /api/admin/action`
- Der "Anfragen"-Tab auf `/profil` (Tab 6) faellt damit ebenfalls weg.
- `sendAccessRequestEmail` / `sendApprovedEmail` / `sendRejectedEmail` in
  `src/lib/email.ts` werden ungenutzt und koennen mit entfernt werden.

Das ist eine Abweichung von "konsolidieren" hin zu "entfernen, weil bereits
redundant abgedeckt" — bewusst nur als Empfehlung markiert, keine
eigenmaechtige Entscheidung. Falls du die Anfragen-Tabelle/-Mails aus
anderen Gruenden (Nachvollziehbarkeit, wer sich wann beworben hat) behalten
willst, ist das genauso machbar; dann bliebe nur das Loeschen der
Freigabe-*Routen* (kein Account-Erzeugungs-Zweck mehr), waehrend
`access_requests` rein als Log stehen bleibt.

---

## 5. `/register`-UI: neue Zustaende

- **Formular**: unveraendert Name/E-Mail/Passwort/Passwort-Bestaetigung,
  **"Warum moechtest du Zugang?"-Feld entfaellt** (war nur fuer die manuelle
  Pruefung noetig). Neu: Pflicht-Checkbox "Ich akzeptiere die [AGB](/agb)
  und [Datenschutzerklaerung](/datenschutz)", Submit-Button bleibt bis zum
  Anhaken deaktiviert (Client-seitig, plus serverseitige Pruefung wie in
  Abschnitt 2 Punkt 1).
- **Neuer Zwischenzustand nach Submit**: ersetzt den bisherigen "Anfrage
  eingereicht"-Screen durch "Bestaetigungsmail verschickt — bitte
  Posteingang pruefen", mit optionalem "Mail erneut senden"-Button
  (`supabase.auth.resend({ type: 'signup', email })`).

---

## 6. AGB-/Datenschutz-Seiten — Scope-Klaerung

Analog zum Stripe-Widerrufsrecht: Ich liefere das **technische Geruest**
(zwei Seiten unter `/agb` und `/datenschutz`, im App-Design, mit
Platzhalter-Struktur und klar markierten TODO-Abschnitten), aber **keinen
bindenden Rechtstext** — das ist Rechtsblock-Arbeit, nicht meine. Ohne
echten Text sind die Checkbox-Links zwar technisch funktionsfaehig, aber
`terms_version` haette vorerst nur einen Platzhalter-Stand. Empfehlung:
Rechtstext parallel zum Bau erarbeiten (blockiert den Testmodus-Aufbau
nicht, nur den echten Live-Gang — gleiches Muster wie beim
Stripe-Widerspruchsrecht).

---

## 7. Abhaengigkeit: Supabase-Dashboard-Check (ausstehend)

Zwei Einstellungen, die den Ablauf aus Abschnitt 2/3 direkt beeinflussen,
werden gerade separat geprueft:
- **Authentication → Settings → "Confirm email"**: muss aktiv sein, sonst
  legt `signUp()` den Account zwar an, aber ohne Bestaetigungspflicht — der
  Login waere dann sofort moeglich, ohne dass `/auth/callback` je durchlaufen
  wird.
- **Custom SMTP (Resend)**: ohne eigene verifizierte Absender-Domain landet
  die Bestaetigungs-Mail entweder ueber Supabases stark ratenlimitierten
  Standard-Versand (nur fuer Tests tragbar) oder gar nicht zuverlaessig beim
  Empfaenger.

Ergebnis wird nachgereicht, aendert aber nichts an Abschnitt 1–6 — nur
daran, wie zuverlaessig die Mail beim Nutzer ankommt.

---

## Empfohlene Reihenfolge

1. Supabase-Dashboard-Check abschliessen (Confirm email + Custom SMTP/Resend-Domain)
2. Migration: `terms_accepted_at` + `terms_version` auf `profiles`
3. `POST /api/register` (signUp-basiert) + serverseitige Terms-Pruefung
4. `/auth/callback` (Code-Tausch, Redirect-Logik, Fehlerfall)
5. `/register`-UI: Checkbox + neuer "Mail verschickt"-Zustand
6. `/agb` + `/datenschutz` als Geruest-Seiten (Platzhaltertext, klar markiert)
7. Alte `access_requests`-Freigabe-Routen entfernen (oder bewusst als Log
   stehen lassen, siehe Abschnitt 4) — Entscheidung vor diesem Schritt noetig
8. Rechtstext fuer AGB/Datenschutz fertigstellen, `terms_version` auf den
   finalen Stand heben, dann Live-Gang
