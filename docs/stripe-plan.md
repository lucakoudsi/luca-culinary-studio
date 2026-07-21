# Stripe-Anbindung — Planung

> Stand 2026-07-21. Reine Planung, noch nichts gebaut. Grundlage: `docs/abo-konzept.md.txt`
> (v.a. Abschnitt 7 "Stripe & Zahlung" und Abschnitt 10/11 zur Team-Grundsatzfrage) und
> der aktuelle Code-Stand (`profiles.stufe` als Integer 1–4, manuell gesetzt über
> `/api/admin/users/[id]`, gelesen via `getUserTier()` in `src/config/roles.ts`).

## 0. Ausgangslage

- Es gibt noch **keinerlei** Stripe-Code im Projekt (geprüft: kein Treffer für "stripe" außer
  in Doku-Dateien).
- Stufen werden aktuell manuell vom Admin vergeben. `profiles.stufe` ist die einzige Quelle,
  von der die gesamte Gating-Logik (`PAGE_MIN_TIER`, `kiLocked`-Checks, Bild-/Text-Kontingent)
  abhängt. Eine Stripe-Anbindung muss am Ende nur zuverlässig genau diese eine Spalte pflegen —
  der Rest der App braucht keine Änderung.
- Preise sind bereits verbindlich festgelegt in `src/config/pricing.ts`
  (`STUFE_PREIS_BRUTTO`): Free 0 €, Basic 9,99 €, Pro 24,99 €, Team 59,99 €, brutto inkl.
  19 % MwSt.

---

## 1. Was auf Stripe-Seite gebraucht wird

### Account
- Stripe-Konto anlegen, Geschäftsdaten + IBAN für Auszahlungen hinterlegen. Identitätsprüfung
  dauert etwas — früh anstoßen.
- Da die Preise als "brutto inkl. 19 % MwSt" geführt werden, ist das Projekt offenbar **nicht**
  als Kleinunternehmer (§19 UStG) geplant.
- **Stripe Tax würde ich zum Start nicht aktivieren** (unnötige Komplexität/Kosten), solange
  nur an DACH-Kunden zu einem fixen Bruttopreis verkauft wird. Stripe stellt trotzdem
  ordentliche Rechnungen/Belege aus. Bei Verkauf in andere EU-Länder mit anderen MwSt-Sätzen
  später neu bewerten.

### Produkte / Preise
- 3 kostenpflichtige Produkte: Basic (9,99 €/Monat), Pro (24,99 €/Monat), Team
  (59,99 €/Monat) — je ein Produkt mit einem wiederkehrenden Monats-Price in EUR.
- Free ist kein Stripe-Produkt (kein Zahlungsvorgang nötig).
- Jährliche Preise (im Konzept-Dokument als "~2 Monate gratis" erwähnt) sind ein sinnvoller
  späterer Zusatz-Price, nicht Teil des Starts.

### Test- vs. Live-Modus
- Komplett getrennte Umgebungen: eigene Keys, eigener Produktkatalog (Test-Produkte sind im
  Live-Modus nicht sichtbar).
- Empfohlene Reihenfolge: erst alles im Testmodus mit Stripe-Test-Karten komplett durchspielen
  (Checkout, Webhook, Portal), danach dieselben Produkte/Preise im Live-Modus anlegen, erst
  dann Live-Keys eintragen.

### Keys — wohin
| Key | Sichtbarkeit | Zweck |
|---|---|---|
| `STRIPE_SECRET_KEY` (`sk_test_…` / `sk_live_…`) | server-only | Checkout-Session & Portal-Session erzeugen |
| `STRIPE_WEBHOOK_SECRET` (`whsec_…`) | server-only | Signaturprüfung eingehender Webhooks — **pro Endpoint eigener Wert**, also Test und Live unterschiedlich |
| `STRIPE_PRICE_BASIC` / `STRIPE_PRICE_PRO` / `STRIPE_PRICE_TEAM` | server-only | Price-IDs, unterscheiden sich zwischen Test und Live |

- Kein `NEXT_PUBLIC_`-Publishable-Key nötig: Bei gehostetem Stripe Checkout wird die Session
  server-seitig erzeugt, der Client bekommt nur die fertige Redirect-URL. Kein Stripe.js im
  Client nötig.
- Ablage: lokale `.env.local` mit Test-Keys (wie bei den bestehenden Supabase-Keys), Live-Keys
  als Vercel-Production-Env-Var. Keys trägt der Nutzer selbst ein.

---

## 2. Architektur

### Checkout Session statt Payment Links
Payment Links sind statische URLs ohne Bezug zum eingeloggten Nutzer — man müsste raten, welcher
Stripe-Kunde zu welcher Supabase-User-ID gehört. Eine server-seitig erzeugte Checkout Session
erlaubt `client_reference_id` = Supabase-User-ID mitzugeben, sodass der Webhook eindeutig
zuordnen kann.

### Ablauf
1. Nutzer klickt "Upgraden" im "Mein Plan"-Tab (`/profil`) → `POST /api/stripe/checkout`
   (authentifizierte Route).
2. Server erstellt Checkout Session (`mode: 'subscription'`, passende Price-ID,
   `client_reference_id: user.id`, `success_url`/`cancel_url` zurück auf `/profil`), gibt die
   Session-URL zurück; Client leitet per `window.location.href` weiter.
3. Stripe hostet die Bezahlseite — die App verarbeitet nie Kartendaten (PCI-Prinzip aus dem
   Konzept-Dokument bleibt gewahrt).
4. Bei Erfolg feuert Stripe `checkout.session.completed` an `/api/stripe/webhook`. Der Handler
   liest `client_reference_id`, mappt die gekaufte Price-ID → Stufe (kleine feste Tabelle,
   analog zu `STUFE_PREIS_BRUTTO`), und setzt per Service-Role-Client (`supabase-admin.ts`,
   wie bei den anderen Admin-Routen) auf `profiles`: `stufe`, `stripe_customer_id`,
   `stripe_subscription_id`, `subscription_status`.
5. Folge-Events (`customer.subscription.updated`, `customer.subscription.deleted`,
   `invoice.payment_failed`) halten diese Felder danach synchron — Details siehe Abschnitt 3.

### Neue Spalten auf `profiles` (kleine Migration, noch nicht geschrieben)
- `stripe_customer_id text`
- `stripe_subscription_id text`
- `subscription_status text` (mirrored von Stripes eigenem Status: active / past_due /
  canceled / …)
- optional `current_period_end timestamptz` — für "nächste Abbuchung am …" im Plan-Tab und
  für die Downgrade-Timing-Logik

### Customer Portal statt Eigenbau
Stripes gehostetes Billing-Portal übernimmt Kündigung, Zahlungsmethode ändern, Rechnungen
einsehen. Eine zweite Route `/api/stripe/portal` erstellt eine Portal-Session und leitet
weiter.

Wichtig: Portal-Aktionen lösen dieselben Webhook-Events aus wie Checkout — der
Webhook-Handler bleibt die **einzige** Quelle der Wahrheit, egal ob die Änderung über
Checkout, Portal oder das Stripe-Dashboard kam. Nirgendwo sonst im Code darf der
Abo-Zustand geändert werden.

### Idempotenz
Stripe kann Webhooks mehrfach zustellen (at-least-once delivery). Da der Handler immer einen
absoluten Zielwert setzt (nicht hoch-/runterzählt), ist er von Natur aus idempotent — kein
zusätzlicher Dedup-Mechanismus nötig.

---

## 3. Kündigung & Zahlungsausfall

### Kündigung
Stripe setzt bei Kündigung über das Portal standardmäßig `cancel_at_period_end: true` — der
Nutzer bleibt bis zum Ende der bereits bezahlten Periode auf seiner Stufe. Erst wenn Stripe
danach `customer.subscription.deleted` feuert, wird auf `stufe = 1` (Free) zurückgestuft. Kein
Sonderfall nötig, das ist Stripes Standardverhalten.

Optional: `cancel_at_period_end` / `current_period_end` speichern, um im Plan-Tab "Ihr Abo
endet am …" anzuzeigen, ohne schon zurückzustufen.

### Zahlungsausfall
Stripes "Smart Retries" versuchen automatisch über ca. 2–3 Wochen erneut abzubuchen (Zeitplan
im Dashboard unter Billing-Settings konfigurierbar). Während der Retries steht die Subscription
auf `past_due`.

- In dieser Phase **nicht sofort zurückstufen** — optional nur einen Hinweis-Banner im UI
  zeigen ("Zahlung fehlgeschlagen, bitte Zahlungsmethode aktualisieren").
- Erst wenn Stripe nach erfolglosen Retries die Subscription automatisch storniert
  (Dashboard-Einstellung "Cancel the subscription after final payment fails"), kommt
  `customer.subscription.deleted` — dann wird das genauso wie eine reguläre Kündigung
  behandelt.

Die eigentliche Kulanzfrist-Logik lebt damit komplett in Stripes Dashboard-Einstellungen, nicht
in eigenem Code — die App reagiert nur auf das Ergebnis. Kein selbstgebauter
Grace-Period-Timer nötig.

### Was "Zurückstufen" technisch bedeutet
Einfach `profiles.stufe = 1` setzen. Nichts wird gelöscht, die bestehende Gating-Logik
(`getUserTier`, `PAGE_MIN_TIER`, `kiLocked`-Checks) liest die Stufe live bei jedem Request —
kein separater "Downgrade-Pfad" nötig.

Netter Nebeneffekt: Ein Pro-Nutzer, der mitten im Monat auf Free zurückfällt, wird beim
nächsten Bild-Generieren automatisch vom bestehenden `check_and_increment_image_quota`
blockiert, weil die Funktion die aktuelle Stufe zum Zeitpunkt des Checks liest — keine
Extra-Behandlung nötig.

---

## 4. Team als Einzelkonto zum Start

**Entscheidung: einverstanden.** Das deckt sich mit der offenen Grundsatzfrage in
`docs/abo-konzept.md.txt` Abschnitt 10/11, die dort bereits als Empfehlung stand ("empfohlen:
nachrüsten" — Team ist technisch der aufwendigste Baustein: Team-Verwaltung, Einladungen,
geteiltes Kontingent). Diese Entscheidung löst die dort offen gelassene Frage jetzt zugunsten
von Modell 1 auf: **Team = Einzelkonto mit größerem (350er) Bildkontingent**, genau wie es
aktuell schon technisch umgesetzt ist. Echtes Mehrbenutzer-Team (Modell 2, geteiltes
Kontingent über mehrere Personen) kommt später als eigener, vergleichbar aufwendiger Baustein.

Für Stripe heißt das konkret: Team ist einfach ein viertes Produkt/Price wie Basic/Pro — ein
Stripe-Kunde = eine Supabase-User-ID = eine `profiles`-Zeile. Kein Seats-/Quantity-Handling,
keine Organisationen, keine Einladungs-Flows nötig. Das hält die gesamte Stripe-Integration
spürbar einfacher. Wenn später echtes Mehrbenutzer-Team gebaut wird, ändert sich nur die
Produktbedeutung, nicht die Abrechnungsmechanik — derselbe Stripe-Price kann weiterverwendet
werden.

### Offener Punkt, gefunden beim Planen
In `src/config/roles.ts` steht für Stufe 4 aktuell wörtlich `desc: '+ Mehrbenutzer'` (Array
`STUFEN`). Das ist mit der "Team = Einzelkonto"-Entscheidung eine Falschaussage gegenüber
zahlenden Kunden. **Muss vor Live-Gang angepasst werden** (z. B. auf "größeres
Bildkontingent" o. ä.) — betrifft sowohl den internen Stufenvergleich als auch den
öffentlichen "Mein Plan"-Tab, da beide aus derselben Quelle (`FEATURE_GATES` /
`STUFEN`) gespeist werden.

---

## 5. Datenerhalt bei Downgrade (Tellerdesigner-Bilder & Galerie)

**Geprüft, bereits so wie gewünscht — nichts zu bauen.**

- **Seitenzugriff (`/tellerdesigner`, `/tellerdesigner/galerie`)**: `src/middleware.ts` liest
  bei **jedem** Request `profiles.stufe` live aus der DB und vergleicht gegen
  `PAGE_MIN_TIER['/tellerdesigner'] = 3` (`src/config/roles.ts`). Reicht die Stufe nicht,
  Redirect auf `/`. Kein Caching, kein Snapshot zum Kündigungszeitpunkt — die Sperre greift
  sofort bei jedem neuen Request, sobald `stufe` sinkt, und fällt genauso sofort wieder weg,
  sobald wieder hochgestuft wird.
- **API-Ebene**: `requireTier(req, 3)` (`src/lib/apiAuth.ts`) sitzt vor
  `src/app/api/tellerdesigner/route.ts` (Generieren), `save/route.ts` (Speichern) **und**
  `designs/route.ts` (Galerie-**Lesen**) — auch der reine Abruf der bestehenden Galerie ist
  Pro-gesperrt, nicht nur das Erzeugen neuer Designs.
- **Datenbestand**: Kein Code-Pfad im gesamten Projekt löscht Zeilen aus `tellerdesigns` oder
  Objekte aus dem zugehörigen Storage-Bucket (geprüft: kein `.delete()`/`.remove()`-Aufruf
  irgendwo referenziert `tellerdesigns` oder Tellerdesigner-Storage-Pfade). Es gibt schlicht
  keinen "Downgrade löscht Daten"-Pfad, weil es noch nie einen automatischen Downgrade gab.

**Verhalten nach Einführung von Stripe**: identisch. Der Webhook-Handler darf **ausschließlich**
`profiles`-Spalten schreiben (`stufe`, `stripe_customer_id`, `stripe_subscription_id`,
`subscription_status`, `current_period_end`) — niemals `tellerdesigns` oder Storage anfassen.
Das ist als explizite Leitplanke zu verstehen, nicht nur als Status quo: Sobald ein
zahlender Nutzer kündigt oder eine Zahlung ausfällt, verliert er per Middleware/`requireTier`
sofort den Zugriff auf Tellerdesigner-Seite und -API; seine Bilder bleiben in der DB/im
Storage unangetastet liegen und werden bei erneutem Upgrade sofort wieder sichtbar, weil der
Zugriff live aus `stufe` abgeleitet wird und nichts zwischengespeichert oder gelöscht wurde.

---

## 6. Widerrufsrecht (14-Tage-Frist)

### Rechtlicher Rahmen (Einordnung, keine Rechtsberatung)
Ein monatliches SaaS-Abo ist ein **Dienstleistungsvertrag** — einschlägig ist § 356 Abs. 4 BGB
(nicht Abs. 5, das gilt für digitale Inhalte auf Zuruf ohne Datenträger, z. B. Einzel-Downloads).
Das Widerrufsrecht erlischt vorzeitig nur, wenn **beide** Bedingungen erfüllt sind:

1. Der Kunde stimmt **ausdrücklich** zu, dass die Leistung schon vor Ablauf der 14-Tage-Frist
   beginnt, **und**
2. der Kunde bestätigt dabei seine **Kenntnis**, dass er durch diese Zustimmung sein
   Widerrufsrecht verliert (sobald die Dienstleistung vollständig erbracht ist).

Zwingende Zusatzvoraussetzung: Es muss **vorher überhaupt eine ordnungsgemäße
Widerrufsbelehrung** erfolgt sein (eigene Rechtstext-Seite, AGB/Widerrufsseite) — ohne die
bleibt das Widerrufsrecht bestehen, selbst wenn die Checkbox angehakt wurde. Diese
Belehrungs-Seite selbst ist Teil des "Rechtsblocks" (juristischer Text), nicht dieses
technischen Plans.

### Technischer Mechanismus in Stripe Checkout (recherchiert)
Stripe Checkout Sessions bieten **genau eine** native Checkbox:

```
consent_collection[terms_of_service] = required
custom_text[terms_of_service_acceptance][message] = "<Freitext, Markdown-Links erlaubt, bis 1200 Zeichen>"
```

- Voraussetzung: Im Stripe-Dashboard unter **Settings → Public Details** muss vorher eine
  Terms-of-Service-URL hinterlegt sein — sonst lässt sich `consent_collection.terms_of_service`
  gar nicht auf `required` setzen. Diese URL sollte auf die eigene AGB-/Widerrufs-Seite zeigen.
- **Wichtiger Befund**: Stripes `custom_fields` (die "echten" frei konfigurierbaren
  Zusatzfelder im Checkout) unterstützen nur `text`, `dropdown` und `numeric` — **keinen**
  Checkbox-Typ. Es gibt also keine Möglichkeit, eine **zweite**, dedizierte Checkbox nur für
  den Widerrufsverzicht neben der allgemeinen AGB-Checkbox einzublenden. Die einzige Checkbox,
  die Checkout überhaupt anbietet, ist die eine `terms_of_service`-Checkbox.
- **Praktische Konsequenz**: Die AGB-Zustimmung und der Widerrufsverzicht müssen in **einem**
  kombinierten, eindeutigen Satz im `custom_text.terms_of_service_acceptance.message`
  formuliert werden (z. B. sinngemäß: "Ich stimme den AGB zu und verlange ausdrücklich, dass
  die Leistung sofort beginnt; mir ist bekannt, dass ich dadurch mein Widerrufsrecht
  verliere, sobald die Leistung vollständig erbracht ist." — **exakter Wortlaut ist
  Rechtsblock-Arbeit**, hier nur als Platzhalter).
- **Nachweisbarkeit**: Nach Abschluss steht `consent.terms_of_service = "accepted"` sowohl auf
  dem Checkout-Session-Objekt als auch im `checkout.session.completed`-Webhook-Payload.
  Empfehlung: Der Webhook-Handler sollte diese Zustimmung **dauerhaft mit Zeitstempel** ablegen
  (z. B. eigene Zeile in einer Log-Tabelle oder zusätzliche Spalten auf `profiles`), idealerweise
  zusammen mit einer Referenz auf die zu diesem Zeitpunkt gültige AGB-/Widerrufstext-Version —
  ein reines Boolean-Flag ist im Streitfall schwächer als ein Nachweis, welchem genauen
  Wortlaut wann zugestimmt wurde.

### Fazit für die Umsetzung
Technisch ist alles vorbereitet und mit der bereits gewählten Checkout-Session-Architektur
kompatibel — es fehlt nur der finale Rechtstext für `custom_text.terms_of_service_acceptance.message`
und die verlinkte AGB-/Widerrufsbelehrungs-Seite. Beides sollte vor dem Live-Gang (nicht vor dem
Testmodus-Aufbau) vorliegen, da es reiner Text ist und die Code-Struktur nicht beeinflusst.

**Quellen (Recherche für diesen Abschnitt):**
- [Customize text and policies — Stripe Docs](https://docs.stripe.com/payments/checkout/customization/policies)
- [Extend checkout with custom components — Stripe Docs](https://docs.stripe.com/payments/checkout/custom-components)
- [Add custom fields — Stripe Docs](https://docs.stripe.com/payments/checkout/custom-fields)
- [it-recht-kanzlei.de: Widerruf bei digitalen Inhalten & Dienstleistungen seit 2022](https://www.it-recht-kanzlei.de/widerrufsrecht-digitale-inhalte-dienstleistungen-2022.html)
- [Haufe: Direktvertriebsvertrag – Erlöschen des Widerrufsrechts](https://www.haufe.de/id/beitrag/direktvertriebsvertrag-6-erloeschen-des-widerrufsrechts-HI6980245.html)

---

## Empfohlene Reihenfolge

1. Stripe-Testmodus-Account + Produkte/Preise anlegen
2. `/api/stripe/checkout` + `/api/stripe/webhook` (Testmodus) bauen, mit Test-Karten
   durchspielen
3. `/api/stripe/portal` bauen
4. Migration: neue Spalten auf `profiles` (`stripe_customer_id`, `stripe_subscription_id`,
   `subscription_status`, optional `current_period_end`)
5. Plan-Tab-Buttons ("Jetzt upgraden" / "Abo verwalten") real verdrahten
6. Copy-Fix `STUFEN`-Beschreibung Stufe 4 ("+ Mehrbenutzer" entfernen)
7. Rechtstext für die Widerruf-Checkbox + AGB-/Widerrufsbelehrungs-Seite fertigstellen
   (Rechtsblock, parallel möglich — blockiert nicht den Testmodus-Aufbau, nur den Live-Gang)
8. `consent_collection`/`custom_text` in der Checkout-Route scharf schalten, sobald der
   Rechtstext steht
9. Dieselben Produkte/Preise im Live-Modus anlegen, Live-Keys eintragen, go-live
