# Master-Aufgabenliste — LUCA Culinary Studio

> Stand 2026-07-22. Vollständige Zusammenführung aus (a) der Chat-Session vom
> 22.07. und (b) Claude Codes Bestandsaufnahme über 16 Projekt-Dateien
> (docs/*, CLAUDE.md, TO_CHANGE.md.txt). Dedupliziert, mit Status und Phase.
> Ersetzt die frühere, unvollständige launch-checkliste.md.
>
> Legende: [ ] offen · [~] teilweise/unklar · [x] erledigt (zur Info gelistet)

═══════════════════════════════════════════════════════════════════════
## TEIL 1 — WEG ZUM LAUNCH (das eigentliche Ziel)
═══════════════════════════════════════════════════════════════════════

### 1A. VOR DEM PUSH — lokal / Code / Dashboard, kein Deploy nötig

**Code-Checks (Claude Code)**
- [ ] `resend.dev`-Absender im ganzen `src/` gegenchecken (sollte durch das
  Löschen von `src/lib/email.ts` erledigt sein — verifizieren).
- [ ] `NEXT_PUBLIC_AI_ENABLED` klären. **Wichtiger als gedacht:** Laut
  TO_CHANGE.md.txt ist das eine seit Langem offene Entscheidung — das Flag
  passt nicht mehr sauber zu allen Features (Menü echt, Teller echt). Optionen:
  pro Feature aufsplitten, Flag ganz abschaffen zugunsten reinem Tier-Gating,
  oder so lassen. Erst prüfen, ob/wo der Code es liest, dann entscheiden.
- [ ] Absenderadresse in Env-Var (`RESEND_FROM`) zentralisieren (optional).

**Lokale Env-Aufräumung**
- [ ] `PEXELS_API_KEY` aus `.env.local` entfernen (ungenutzt).
- [~] Alter `OPENAI_API_KEY`-Stub-Hinweis aus TO_CHANGE.md.txt bezog sich auf
  einen alten `sk-`-Platzhalter; heute ist der Key echt in Nutzung — vermutlich
  gegenstandslos, kurz gegenprüfen.

**Build-Check**
- [ ] `npx tsc --noEmit` + `npm run build` sauber, `git status` gesichtet.

### 1B. MIT / NACH DEM PUSH — braucht Deploy oder Produktionsumgebung

**Push & Deploy**
- [ ] Alle Commits pushen (Branch weit vor `origin/master`), dann Live-Seite
  durchklicken.

**Vercel-Env-Vars nachziehen (PFLICHT — sonst crasht der Live-Build)**
- [ ] `OPENAI_API_KEY` bei Vercel ergänzen.
- [ ] Stripe-Vars ergänzen: `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`,
  `STRIPE_PRICE_BASIC`, `STRIPE_PRICE_PRO`, `STRIPE_PRICE_TEAM` (Testmodus).
- [ ] `SUPABASE_SERVICE_ROLE_KEY` bei Vercel prüfen (aus TO_CHANGE.md.txt —
  laut Vercel-Screenshot heute vorhanden, also vermutlich [x], kurz bestätigen).
- [x] `NEXT_PUBLIC_AI_PLATE_ENABLED=true` gesetzt (heute erledigt).
- [x] `NEXT_PUBLIC_AI_LAB_ENABLED` + `KEY_ENCRYPTION_SECRET` gelöscht (heute).

**Supabase Produktion**
- [ ] Site-URL & Redirect-URLs auf echte Produktions-Domain (bisher nur
  `localhost:3000` getestet).
- [ ] Registrierungs-Flow gegen Live-Domain nachtesten (Register → Mail →
  Confirm → Dashboard/Stufe 1).
- [ ] Custom SMTP aus Produktion verifizieren (lokal bewiesen, live steht aus).

**Stripe Live-Modus (echter Bezahlbetrieb)**
- [ ] Produkte/Preise im Live-Modus anlegen, Live-Keys eintragen.
- [ ] Webhook-Endpoint im Live-Dashboard auf Produktions-URL registrieren.
- [ ] `consent_collection`/`custom_text` (Widerruf-Checkbox) scharf schalten —
  abhängig vom Rechtstext (Teil 2).
- [ ] Test-Kauf im Live-Modus end-to-end (Checkout → Webhook → Stufe → Portal).

═══════════════════════════════════════════════════════════════════════
## TEIL 2 — RECHTLICHES (blockiert den ÖFFENTLICHEN Live-Gang)
═══════════════════════════════════════════════════════════════════════

> Aus abo-konzept.md.txt (⚖️-Kasten), registrierung-plan.md, stripe-plan.md,
> community-konzept.md.txt. Läuft extern/parallel, ist aber der wahrscheinlichste
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
- [ ] **Feedback-System** (Nutzer-Formular + Admin-Verwaltung, `feedback`-
  Tabelle, RLS) — als „launch-nah sinnvoll" markiert.
- [ ] **Gamification/Belohnungssystem** (Küchen-Titel-Stufen). Offene Fragen:
  wo sichtbar, kosmetisch vs. echte Freischaltungen, Anti-Gaming.

### 3B. Collection / Community (GROSSER zurückgestellter Baustein)

> **Achtung — das ist mehr als ein Nav-Punkt.** Laut PROJEKTSTAND ist die
> Collection nur ein leeres Gerüst (~27 Zeilen/Seite, keine DB, kein Publish).
> community-konzept.md.txt beschreibt ein komplettes, ungebautes Feature.

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

### 3C. Menügenerator — Ausbau (aus menuegenerator-konzept.md.txt)
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

═══════════════════════════════════════════════════════════════════════
## TEIL 4 — AUFRÄUMEN & TECHNISCHE SCHULD (unkritisch, jederzeit)
═══════════════════════════════════════════════════════════════════════

- [ ] **`user_api_keys`-Tabelle** löschen (`drop table if exists
  public.user_api_keys;`) — BYOK-Altlast, „vor dem nächsten DB-Audit".
- [ ] **`access_requests`-Tabelle** — 6 Alt-Einträge, seit Commit 99759f6 nicht
  mehr referenziert. Löschen oder als Historie behalten.
- [ ] **npm-Schwachstellen:** aktuell 9 (5 moderate / 4 high), ungelöst.
  `npm audit` prüfen — vor Live-Gang wünschenswert.
- [ ] **`.md.txt`-Doppeldateien** normalisieren (`feature-backlog.txt`,
  `TO_CHANGE.md.txt`, `abo-konzept.md.txt`, `community-konzept.md.txt`,
  `menuegenerator-konzept.md.txt`).
- [ ] **`docs/feature-backlog.txt`** löschen (Zwilling der committeten `.md`).
- [ ] **`docs/byok-konzept.md`** ist inhaltlich überholt (BYOK entfernt) —
  archivieren/markieren oder löschen.
- [ ] **PROJEKTSTAND.md aktualisieren** — mehrere eigene „offene Punkte" sind
  inzwischen erledigt (Freigabe-Routen, Team-Copy, Registrierung committet).

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

1. **Vor Push:** Teil 1A (Code-Checks, PEXELS raus, Build-Check).
2. **Technischer Go-Live:** Teil 1B (Push + Vercel-Vars + Supabase-URL) —
   im Testmodus lauffähig.
3. **Öffentlicher Bezahl-Live-Gang:** Teil 2 (Rechtliches) + Stripe-Live-Teil
   aus 1B. **Teil 2 ist der wahrscheinliche Engpass.**
4. **Danach:** Teil 3 (Features) nach echtem Nutzer-Feedback priorisieren.
5. **Jederzeit nebenher:** Teil 4 (Aufräumen).

> Nichts aus Teil 3/4/5 blockiert den technischen Go-Live. Nur Teil 1 + 2 stehen
> zwischen dir und einem live nutzbaren, bezahlbaren Produkt.
