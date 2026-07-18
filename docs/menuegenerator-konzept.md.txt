# Menügenerator-Konzept: Das Killer-Feature

**LUCA Culinary Studio** · Stand 2026-07-13 · Next.js 14 · Supabase · zentraler Betreiber-Key

> **Leitidee:** Warum dieses Tool statt ChatGPT? Weil es auf **echten strukturierten Daten** aufsetzt – 500 Zutaten mit 6 Geschmacksachsen, Diät-Tags, Saisonkalender, Zubereitungs-Stammbaum, Wein-Pairing-Engine. Der Menügenerator ist kein „GPT mit Kochthema", sondern ein Werkzeug, das diese Daten zu einem stimmigen Menü **komponiert** – und das der Koch danach **mitgestalten** kann.

---

## 1. Zielgruppe & Anspruch

- **Profikoch/Gastro:** will Präzision, Kontrolle, Geschmacksbalance-Denkarbeit abgenommen. Muss eingreifen können – ein Koch nimmt nicht, was die Maschine ausspuckt.
- **Ambitionierter Hobbykoch:** will ein durchdachtes Menü *mit* Erklärung und Führung.

Der geführte Dialog bedient beide: Vorschläge/Defaults für die einen, volle Kontrolle für die anderen.

---

## 2. Der geführte Dialog – erweiterte Eingaben

Schrittweise, nicht als Formular-Wand. Jeder Schritt nutzt echte Daten.

**Basis:**
- **Anlass** (Dinner-Party / Tasting-Menü / à la carte / saisonales Fest)
- **Gängezahl** (3 / 5 / 7 …)
- **Saison** → zieht automatisch den Saisonkalender
- **Diät** (vegetarisch / vegan / glutenfrei / laktosefrei) → nutzt das neue `diaet_tags`-Feld

**Erweitert (die Kontrolle, die ein Koch braucht):**
- **Zutaten vorgeben** („muss dabei sein": Steinbutt, weil im Kühlhaus) → **Autocomplete aus der Zutatenbibliothek**, keine Freitext-Tippfehler. Diese Zutaten kommen zwingend ins Menü.
- **Zutaten ausschließen** („kein Koriander", Allergien, Abneigungen) → ebenfalls Autocomplete; werden aus dem Prompt-Kontext gefiltert.
- **Aufwand / Komplexität**: Bistro · Gehoben · Fine Dining. Steuert, wie aufwendig die Komponenten pro Gang sind.
- **Küchenstil / Region**: strukturierte Auswahl (japanisch, nordisch, klassisch französisch, mediterran, modern-fusion, …) statt nur Freitext. Zusätzlich optionales Freitext-Leitmotiv.

---

## 3. Datenanbindung (was in den Prompt fließt)

Vor der KI-Anfrage lädt die Route:
- **Passende Zutaten** aus der Bibliothek, gefiltert nach Saison + Diät + Ausschlüssen, gestreut über Kategorien (ca. 40–60, nicht alle 500 – Kosten/Übersicht).
- Mit **Aromaprofil (Klartext)**, den **6 Geschmacksachsen (0–5)**, **Pairings**, Kategorie.
- **Pflicht-Zutaten** werden explizit als „müssen vorkommen" markiert.

**Technischer Merkposten:** `saison` ist `jsonb`, `diaet_tags` ist `text[]` – unterschiedliche PostgREST-Filtersyntax nötig (`cs` mit `["Sommer"]` vs. `{vegetarisch}`). Bereits gelöst, nicht wieder reinfallen.

---

## 4. Aroma-Dramaturgie – Ansatz A jetzt, B als Ausbau

**Ansatz A (aktuell):** KI komponiert, Daten als Kontext. Der Prompt gibt Zutaten mit Aromaprofilen UND eine klare Dramaturgie-Anweisung: säurebetonter Auftakt → steigende Intensität/Umami zur Mitte → Kontrast vor dem Dessert; kein Gang wiederholt das dominante Profil des vorigen; Dramaturgie kurz begründen.
*Verifiziert: liefert echte Spannungsbögen mit DB-Zutaten (Sudachi, Shio Koji, Gochujang …).*

**Ansatz B (geplanter Ausbau):** Eigene Regel-Logik komponiert das Zielprofil pro Gang, wählt algorithmisch Zutaten, KI formuliert nur aus. Mehr Kontrolle, eigener Algorithmus. **Migrationspfad:** erst mit A sehen, wo die KI schwächelt, dann gezielt ersetzen.

---

## 5. Bearbeitung NACH der Generierung (macht es zum Werkzeug)

Kein Menü ist beim ersten Wurf perfekt. Der Koch muss eingreifen können:

- **Gang gezielt anpassen** per Anweisung („mach ihn vegetarisch", „leichter", „ohne Fisch", „mehr Säure").
  **Wichtig:** Die Anpassungs-Route bekommt das **gesamte Menü als Kontext** mit – sonst baut die KI einen Gang, der geschmacklich mit den Nachbarn kollidiert. Nur so bleibt die Dramaturgie stimmig.
- **Manuell editieren:** Gangtitel/Beschreibung ändern, Gänge **umsortieren**, **löschen**, **hinzufügen**.
- (Bewusst nicht priorisiert: blindes „neu würfeln" – gezieltes Eingreifen schlägt Zufall.)

---

## 6. Design – muss zur Fine-Dining-Ästhetik passen

Bestehende Design-Sprache: warmes Creme/Sepia, Bordeaux als Anker, Gold als Akzent, **Playfair** für Überschriften, ✦-Motive, gesperrte Versalien-Labels, weich gerundete Karten, viel Weißraum. Ruhig und edel – nichts schreit.

**1. Das Ergebnis ist eine echte Menükarte, kein Datenblock.** *(Pflicht)*
Gesetzte Karte wie im Restaurant: Titel in Playfair, zentriert; Gänge mit feiner Nummer/römischer Ziffer; Gangtitel, darunter kursiv die Komponenten; getrennt durch dünne **Goldlinien**; viel Luft. Das ist der Wow-Moment.

**2. Der Spannungsbogen wird sichtbar.** *(Pflicht – das ist das Alleinstellungsmerkmal)*
Eine schlanke **Kurve als feine Goldlinie** über die Gänge (Intensität/Achsen im Verlauf). Pro Gang die 6 Achsen als winzige Balken – das Muster existiert schon in der Zutatenbibliothek, konsistent wiederverwenden. Visueller Beweis, dass komponiert und nicht geraten wurde.

**3. Der Dialog als Ritual, nicht als Formular.**
Schritt für Schritt sanft eingeblendet, große klickbare Karten statt Dropdowns wo möglich. Fühlt sich an wie ein Gespräch mit dem Sous-Chef.

**4. Der Ladezustand als Inszenierung.**
Kein Spinner. Ruhige Sepia-Animation, ✦-Motive, wechselnde Zeilen: „Wähle saisonale Zutaten…", „Komponiere den Spannungsbogen…", „Stimme die Gänge aufeinander ab…". Baut Vorfreude auf und erklärt, was passiert.

**5. Als PDF exportieren / drucken.**
Die Menükarte druckbar machen – für Team und Gäste. Hoher Praxisnutzen für Profis, relativ einfach, weil das Layout ohnehin eine Karte ist.

---

## 7. Verknüpfungen (Features verweben)

- **Wein-Pairing** pro Gang automatisch (die Engine nutzt dasselbe Achsen-Format – ohne Konvertierung anschließbar).
- **Stammbaum:** Hauptzutaten verlinken auf ihre Zubereitungsarten.
- **Zutatenbibliothek:** Zutaten verlinken auf ihr Detail (Aromaprofil, Pairings).
- **Als Projekt speichern:** ganzes Menü in /projekte ablegen – macht es dauerhaft statt Wegwerf-Text.

---

## 8. Technik & Key

- **Zentraler Betreiber-Key** `OPERATOR_OPENAI_KEY` (Server-Env-Var). Getrennt vom BYOK-System.
- **Modell:** GPT-4o, Antwort als **striktes JSON** (`response_format: json_object`), kein Fließtext.
- **JSON-Struktur:** `{ titel, dramaturgie_begruendung, gaenge: [{ nummer, titel, beschreibung, hauptzutaten[], geschmacksprofil{6 Achsen}, zubereitungsidee }] }`
- **Gating:** Tier 2 (Basic). **Rate-Limiting:** bestehendes `checkRateLimit`-Muster.
- **Kosten:** Betreiber zahlt. Vor Live-Gang greift das Kontingent-System aus `abo-konzept.md`.

---

## 9. Bau-Reihenfolge

1. ✅ Betreiber-Key (`operator-key.ts`)
2. ✅ Route-Grundgerüst `/api/menuegenerator` (getestet, liefert stimmige Menüs)
3. ✅ Diät-Feld `diaet_tags` (500 Zutaten getaggt, Grenzfälle fachlich korrigiert)
4. **Route erweitern:** Pflicht-/Ausschluss-Zutaten, Aufwand, Küchenstil
5. **Frontend – geführter Dialog** (Ritual-Optik, Design-Punkt 3 + 4)
6. **Frontend – Menükarte + Spannungsbogen** (Design-Punkt 1 + 2) ← der Wow-Moment
7. **Bearbeitung:** Gang gezielt anpassen (mit Menü-Kontext!), manuell editieren/umsortieren/löschen
8. **Wein-Pairing** pro Gang
9. **Als Projekt speichern**
10. **PDF-Export / Druck** (Design-Punkt 5)
11. Verlinkungen Stammbaum/Zutatenbibliothek
12. Später: Ansatz B, Kontingent-System, `NEXT_PUBLIC_AI_ENABLED` an

Jeder Schritt einzeln bauen, testen, committen.

---

## 10. Offene Fragen (unterwegs zu klären)

- Einkaufsliste automatisch aus den Gängen ableiten? (starker Mehrwert für Hobbyköche)
- Portionen/Mengen mit ausgeben oder nur Konzept?
- Menü-Versionen/Historie (mehrere Entwürfe vergleichen)?

