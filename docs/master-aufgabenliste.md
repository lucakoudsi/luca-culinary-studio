# Master-Aufgabenliste — Culinary Studio

> Stand 2026-07-23, ergänzt 2026-07-31 (neue 3F: Landing-Page, Changelog+
> Feedback, Sterne-Bewertung, Sous-Chef-Import; Teil 4 DB-Cleanup
> abgeschlossen). Teil 1A/1B seit 22.07. vollständig abgeschlossen. Ursprünglich
> zusammengeführt aus (a) der Chat-Session vom 22.07.
> und (b) Claude Codes Bestandsaufnahme über 16 Projekt-Dateien (docs/*,
> CLAUDE.md, TO_CHANGE.md). Dedupliziert, mit Status und Phase. Ersetzt die
> frühere, unvollständige launch-checkliste.md.
>
> Legende: [ ] offen · [~] teilweise/unklar · [x] erledigt (zur Info gelistet)

═══════════════════════════════════════════════════════════════════════
## ⚠️ WARNHINWEIS: KEIN GEWERBE, KEIN VERKAUF
═══════════════════════════════════════════════════════════════════════

**Es existiert aktuell noch KEIN Gewerbe/keine Firma.** Damit dürfen
aktuell **keine kostenpflichtigen Produkte verkauft werden** — unabhängig
davon, wie weit Stripe technisch fertig ist.

**Strategie:** Alle Features inklusive Stripe fertig bauen, aber die
Kauffunktion gesperrt halten, bis Gewerbe/Rechtsform/Impressum/
Rechtstexte stehen (siehe Teil 2 — die Rechtsform-/Gewerbe-/
Steuer-Klärung dort ist die Voraussetzung fürs Freischalten). Konkrete
Sperr-Aufgabe siehe Teil 1A.

═══════════════════════════════════════════════════════════════════════
## TEIL 1 — WEG ZUM LAUNCH (das eigentliche Ziel)
═══════════════════════════════════════════════════════════════════════

### 1A. VOR DEM PUSH — lokal / Code / Dashboard, kein Deploy nötig (Stand 2026-07-23, bis auf einen optionalen Punkt erledigt)

**Code-Checks (Claude Code)**
- [x] `resend.dev`-Absender im ganzen `src/` gegenchecken (sollte durch das
  Löschen von `src/lib/email.ts` erledigt sein — verifiziert).
- [x] `NEXT_PUBLIC_AI_ENABLED` geklärt.
- [ ] Absenderadresse in Env-Var (`RESEND_FROM`) zentralisieren (optional,
  weiterhin nicht umgesetzt).

**Lokale Env-Aufräumung**
- [x] `PEXELS_API_KEY` aus `.env.local` entfernt (ungenutzt).
- [x] Alter `OPENAI_API_KEY`-Stub-Hinweis aus TO_CHANGE.md bezog sich auf
  einen alten `sk-`-Platzhalter — gegengeprüft, gegenstandslos. `OPENAI_API_KEY`
  selbst inzwischen aus `.env.local` entfernt (nur `OPERATOR_OPENAI_KEY` in
  Nutzung, siehe PROJEKTSTAND.md).

**Build-Check**
- [x] `npx tsc --noEmit` + `npm run build` sauber, `git status` gesichtet.

**Kaufsperre (siehe Warnhinweis ganz oben — kein Gewerbe, kein Verkauf)**
- [x] **Kauffunktion serverseitig gesperrt** — Feature-Flag
  `NEXT_PUBLIC_PAYMENTS_ENABLED` (default aus), blendet Upgrade-/Checkout-
  Buttons aus UND blockiert `/api/stripe/checkout` hart mit 403. Scharf
  schalten erst, wenn Gewerbe + Rechtstexte stehen (Teil 2).

### 1B. MIT / NACH DEM PUSH — braucht Deploy oder Produktionsumgebung (Stand 2026-07-23, technischer Testmodus-Teil erledigt — Stripe-Live-Modus siehe unten, weiterhin offen)

**Push & Deploy**
- [x] Alle Commits gepusht, Live-Seite durchgeklickt.

**Vercel-Env-Vars nachgezogen**
- [x] `OPENAI_API_KEY` bei Vercel — **entfällt**, kein Code-Pfad liest diese
  Variable; genutzt wird ausschließlich `OPERATOR_OPENAI_KEY`.
- [x] Stripe-Vars ergänzt: `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`,
  `STRIPE_PRICE_BASIC`, `STRIPE_PRICE_PRO`, `STRIPE_PRICE_TEAM` (Testmodus).
- [x] `SUPABASE_SERVICE_ROLE_KEY` bei Vercel bestätigt.
- [x] `NEXT_PUBLIC_AI_PLATE_ENABLED=true` gesetzt.
- [x] `NEXT_PUBLIC_AI_LAB_ENABLED` + `KEY_ENCRYPTION_SECRET` gelöscht.

**Domain & Supabase-Key-Format**
- [x] Domain-Anbindung (Produktions-Domain live).
- [x] Supabase-Keys auf neues Format migriert (`sb_publishable_...`/
  `sb_secret_...` statt der alten JWT-Keys).
- [x] Alte (Legacy-JWT-)Keys in Supabase deaktiviert.

**Supabase Produktion**
- [x] Site-URL & Redirect-URLs auf echte Produktions-Domain umgestellt.
- [x] Registrierungs-Flow gegen Live-Domain nachgetestet (Register → Mail →
  Confirm → Dashboard/Stufe 1).
- [x] Custom SMTP aus Produktion verifiziert.

**Stripe Live-Modus (echter Bezahlbetrieb) — weiterhin offen, blockiert durch
Teil 2 (Gewerbe/Rechtstexte) und die aktive Kaufsperre**
- [ ] Produkte/Preise im Live-Modus anlegen, Live-Keys eintragen (bisher nur
  Testmodus).
- [ ] Webhook-Endpoint im Live-Dashboard auf Produktions-URL registrieren
  (aktuell nur der lokale Stripe-CLI-Listener).
- [ ] `consent_collection`/`custom_text` (Widerruf-Checkbox) scharf schalten —
  abhängig vom Rechtstext (Teil 2).
- [ ] Test-Kauf im Live-Modus end-to-end (Checkout → Webhook → Stufe → Portal).

═══════════════════════════════════════════════════════════════════════
## TEIL 2 — RECHTLICHES (blockiert den ÖFFENTLICHEN Live-Gang)
═══════════════════════════════════════════════════════════════════════

> Aus abo-konzept.md (⚖️-Kasten), registrierung-plan.md, stripe-plan.md,
> community-konzept.md. Läuft extern/parallel, ist aber der wahrscheinlichste
> Zeitfaktor für den öffentlichen, bezahlbaren Betrieb.

- [ ] **AGB** (inkl. digitale Abos EU) — `/agb` ist nur Gerüst.
- [ ] **Datenschutzerklärung** (DSGVO) — `/datenschutz` ist nur Gerüst.
- [ ] **Impressum** — Seite `/impressum` **existiert noch gar nicht**. Pflicht
  (§5 DDG) ab erstem öffentlichen Tag mit Bezahlfunktion.
- [ ] **Widerrufsrecht-Text** für die Stripe-Checkout-Checkbox (nur Platzhalter
  formuliert).
- [ ] **Auftragsverarbeitungsvertrag mit OpenAI** (DSGVO).
- [ ] **Umsatzsteuer klären:** Kleinunternehmerregelung? USt-ID? OSS-Verfahren
  bei EU-Ausland-Verkauf?
- [ ] **Rechtsform / Gewerbe / Steuer-Setup** fachlich klären.
- [ ] Nach Einbau: `CURRENT_TERMS_VERSION` in `src/config/legal.ts` hochzählen.

═══════════════════════════════════════════════════════════════════════
## TEIL 3 — POST-LAUNCH FEATURES (geparkt, nach dem Launch bauen)
═══════════════════════════════════════════════════════════════════════

### 3A. Neue Ideen (aus feature-backlog.md, diese Session)
- [ ] **Kalorien aus Rezepten** berechnen (Nährwert-DB, deterministisch).
  Offene Fragen: Zutat→DB-Mapping, Mengen ohne Gewicht, Roh- vs. Zubereitet.
- [ ] **Kalorien aus Bildern** schätzen (Vision, „ohne Gewähr", niedrige Prio).
- [x] **Feedback-System** (Nutzer-Formular + Admin-Verwaltung, `feedback`-
  Tabelle, RLS) — umgesetzt, siehe 3F.
- [ ] **Gamification/Belohnungssystem** (Küchen-Titel-Stufen). Offene Fragen:
  wo sichtbar, kosmetisch vs. echte Freischaltungen, Anti-Gaming.

### 3B. Collection / Community (GROSSER zurückgestellter Baustein)

> **Achtung — das ist mehr als ein Nav-Punkt.** Laut PROJEKTSTAND ist die
> Collection nur ein leeres Gerüst (~27 Zeilen/Seite, keine DB, kein Publish).
> community-konzept.md beschreibt ein komplettes, ungebautes Feature.

- [ ] Sichtbarkeits-/Rechte-Modell (wer sieht was).
- [ ] Stöber-/Entdecken-Oberfläche.
- [ ] „Übernehmen & weiterentwickeln"-Flow.
- [ ] Kaltstart-Problem (Community ohne Mitglieder) — Gegenmittel skizziert,
  nicht umgesetzt.
- [ ] Moderation: Regeln, Melde-Funktion, Lösch-Möglichkeit.
- [ ] Rechtliches für Nutzerinhalte (Urheberrecht, Haftung, Melde-Mechanismen)
  — „fachliche Beratung nötig".
- [~] Formale Alt-Entscheidung „/kreativlabor umwidmen vs. streichen" nie
  offiziell getroffen — faktisch per Collection-Platzhalter gelöst. Kann als
  „erledigt durch dritten Weg" abgehakt werden.

### 3C. Menügenerator — Ausbau (aus menuegenerator-konzept.md)
- [ ] **PDF-Export/Druck** der Menükarte (mehrfach genannt, weiterhin offen).
- [ ] **Gang gezielt anpassen** („mach Gang 3 vegetarisch", „leichter", „ohne
  Fisch") — braucht ganzes Menü als Kontext.
- [ ] **Verlinkung** Stammbaum/Zutatenbibliothek aus den Gängen heraus.
- [ ] Einkaufsliste automatisch aus Gängen ableiten?
- [ ] Portionen/Mengen mit ausgeben oder nur Konzept?
- [ ] Menü-Versionen/Historie (Entwürfe vergleichen)?
- [ ] „Ansatz B" (eigene Regel-Logik statt reiner KI-Komposition) — später.

### 3D. Tellerdesigner — Roadmap (aus tellerdesigner-vision.md)
- [ ] Verschiedene Tellerformen.
- [ ] Dunkler Hintergrundmodus (schwarze Teller).
- [ ] Mehrere Kameraperspektiven (Top, 45°, Detail).
- [ ] Vorher/Nachher-Vergleich.
- [ ] Anrichteschritte als Animation.
- [ ] Zutaten-Hotspots mit Beschreibungen.
- [ ] PDF-Export im W²-Stil.
- [ ] Designhistorie.
- [ ] Variantenvergleich nebeneinander.
- [x] Speichern von Designs (Galerie mit Persistenz existiert).

### 3E. Sonstige Feature-/Design-Punkte
- [ ] **Saison-Karten Redesign** (Dashboard-Seitenleiste): 3 Varianten (Gold
  Thread / Bordeaux Depth / Warm Glow) gezeigt, **keine Auswahl getroffen** —
  danach in `SeasonalCard` umsetzen. Scheint vergessen worden zu sein.
- [ ] Separates `rolle`-Feld (admin/staff/member), getrennt von der Stufe —
  „erst nötig, sobald Mitarbeiter mit Sonderrechten dazukommen".
- [~] „Anthropic im Chat" — bewusst zurückgestellt, Chat-Route lehnt Anthropic-
  Keys weiter mit 400 ab. Kein To-do, nur Notiz.

### 3F. Kürzlich umgesetzt (nachträglich ergänzt, ursprünglich nicht in dieser Liste)
- [x] **Öffentliche Landing-Page** + 4 Content-Seiten (`/features`, `/studio`,
  `/preise`, `/ueber-uns`), Auth-abhängige Header-/Hero-Buttons (Login/Logout
  je nach Session), OG-Bild für Link-Vorschauen (Social/Messenger).
- [x] **Changelog ("Was ist neu") + Feedback-System** — `changelog_entries`/
  `feedback`-Tabellen, Sidebar-Glocke + Feedback-Button, `/neuigkeiten`-Seite,
  Admin-CRUD unter „Verwaltung" auf `/profil`, inkl. KI-Entwurfsassistent für
  Changelog-Einträge aus eingefügten Commit-Messages.
- [x] **Sterne-Bewertung editierbar** — Detail-Modal + Bearbeiten-Seite, dabei
  vier unabhängige `StarRating`-Implementierungen zu einer gemeinsamen
  Komponente konsolidiert.
- [x] **KI-Sous-Chef auch beim Rezept-Import** — bisher nur Bild-/Text-KI-
  Import, jetzt auch URL-Import; Diff-Vorschau (Übernehmen/Verwerfen) statt
  automatischer Übernahme, serverseitiger Merge, proaktive Kontingent-Sperre.

═══════════════════════════════════════════════════════════════════════
## TEIL 4 — AUFRÄUMEN & TECHNISCHE SCHULD (unkritisch, jederzeit)
═══════════════════════════════════════════════════════════════════════

- [x] **`user_api_keys`-Tabelle** gelöscht (BYOK-Altlast).
- [x] **`access_requests`-Tabelle** gelöscht — 6 Alt-Einträge, seit Commit
  99759f6 nicht mehr referenziert, DROP in Supabase ausgeführt.
- [x] **`users_deprecated`-Tabelle** gelöscht — keine Referenz irgendwo im
  Repo gefunden (weder Code noch Doku), reine Alt-Tabelle.
- [x] **`ideen`-Tabelle geprüft** — aktiv genutzt (Dashboard-Ideen-Widget,
  volle CRUD-Kette über `/api/ideen`), keine Altlast, bewusst behalten.
- [x] **npm-Schwachstellen:** von 9 (4 moderate / 5 high) auf 4 reduziert via
  `npm audit fix` (brace-expansion, fast-uri, hono, js-yaml). Verbleibende 4
  hängen an `shadcn` (Downgrade-only) bzw. `next` — `shadcn` inzwischen nach
  `devDependencies` verschoben, dadurch meldet `npm audit --omit=dev` nur noch
  **2** (next + verschachteltes postcss, siehe neuer Punkt unten).
- [x] **`.md.txt`-Doppeldateien** normalisiert (`TO_CHANGE.md`,
  `abo-konzept.md`, `community-konzept.md`, `menuegenerator-konzept.md`),
  Verweise in allen Fundstellen angepasst.
- [x] **`docs/feature-backlog.txt`** war bereits gelöscht (Zwilling der
  committeten `.md`).
- [x] **`docs/byok-konzept.md`** mit Hinweis „historisch/überholt" markiert
  (BYOK entfernt, siehe Datei-Kopf).
- [x] **PROJEKTSTAND.md aktualisieren** — Freigabe-Routen/Team-Copy/
  Registrierung waren dort bereits korrekt dokumentiert; Landing-Page,
  Changelog+Feedback, Sterne-Bewertung, Sous-Chef-Import und der
  DB-Cleanup (2026-07-31) ergänzt.
- [ ] **Next.js 14 → 16 migrieren** (eigenes Migrationsprojekt, Breaking
  Changes in App Router/Middleware/Caching; die verbleibende
  postcss-Schwachstelle hängt daran).

═══════════════════════════════════════════════════════════════════════
## TEIL 5 — BEWUSST OFFEN GELASSEN (kein To-do, nur Dokumentation)
═══════════════════════════════════════════════════════════════════════

> Damit niemand das später „aus Versehen als Bug findet".

- `GET /api/zutaten` läuft ohne Login-/Stufen-Prüfung (nur POST ist Stufe-2-
  abgesichert). Lesen bewusst offen.
- HTML-Fallback für Rezept-Import (Zutaten aus `<ul>/<li>` ohne schema.org)
  bewusst NICHT gebaut — zu hohes Fehlerkennungs-Risiko.
- „E-Mail fehlt in der Verwaltung": frühere Meldung, kein Bug gefunden; zwei der
  drei damals betroffenen Oberflächen existieren nach 99759f6 ohnehin nicht mehr.

═══════════════════════════════════════════════════════════════════════
## KRITISCHER PFAD (Kurzfassung)
═══════════════════════════════════════════════════════════════════════

1. ✅ **Vor Push:** Teil 1A — erledigt (bis auf den optionalen `RESEND_FROM`-Punkt).
2. ✅ **Technischer Go-Live (Testmodus):** Teil 1B — Push, Vercel-Vars, Domain,
   Supabase-Key-Format erledigt, App läuft live im **Stripe-Testmodus**.
3. **Öffentlicher Bezahl-Live-Gang:** Teil 2 (Rechtliches) **und** der
   Stripe-Live-Modus-Teil aus 1B (Live-Produkte, Live-Webhook, Live-Testkauf —
   bewusst noch nicht angefasst, solange Teil 2 offen und die Kaufsperre aktiv
   ist). **Teil 2 ist der Engpass, der auch den Stripe-Live-Teil blockiert.**
4. **Danach:** Teil 3 (Features) nach echtem Nutzer-Feedback priorisieren.
5. **Jederzeit nebenher:** Teil 4 (Aufräumen, u.a. Next.js-Major-Upgrade).

> Nichts aus Teil 3/4/5 blockiert den technischen Go-Live im Testmodus. Für den
> öffentlichen Bezahlbetrieb stehen Teil 2 + der Stripe-Live-Teil aus 1B noch aus.
