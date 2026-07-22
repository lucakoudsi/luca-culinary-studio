# Feature-Backlog — LUCA Culinary Studio

> Geparkte Produktideen für **nach dem Launch**. Bewusst nicht vor dem
> Live-Gang gebaut — erst absichern und live gehen, dann anhand echter
> Nutzung entscheiden, was sich lohnt. Stand: 2026-07-22.

---

## 1. Kalorien-/Nährwertanzeige

Zwei sehr unterschiedliche Wege — Aufwand und Verlässlichkeit weichen stark ab.

### 1a. Aus Rezepten berechnen (empfohlener Weg)
Deterministische Berechnung aus den bereits strukturierten Zutatenmengen.

- Nährwerte pro Zutat aus einer Datenbank (z. B. **USDA FoodData Central**,
  frei nutzbar; alternativ Open Food Facts) ziehen, mit den Rezeptmengen
  multiplizieren, aufsummieren, durch Portionszahl teilen.
- Vorteil: nachvollziehbar, reproduzierbar, keine KI-Halluzination. Eine Zahl,
  die man erklären kann.
- Anzeige: kcal pro Portion, optional Makros (Protein/Fett/KH).
- Offene Fragen:
  - Mapping Zutat → Datenbank-Eintrag (Freitext-Zutaten sauber zuordnen —
    „Butter" vs. „Butter, gesalzen" vs. „Ghee"). Ggf. Mapping-Tabelle +
    Fallback „nicht berechenbar".
  - Umgang mit Mengen ohne Gewicht („1 Prise", „nach Geschmack", „2 Stück").
  - Verluste/Zubereitung (Fett beim Anbraten etc.) — bewusst ignorieren und
    als „Rohwert-Schätzung" kennzeichnen?

### 1b. Aus Bildern schätzen (heikel, niedrige Priorität)
GPT-4o-Vision schätzt Kalorien aus Fotos.

- Problem: hohe Fehlerquote (Portionsgröße, versteckte Fette, nicht sichtbare
  Zubereitung). Für ein **Profi-Kochprodukt** ist eine erfundene „847 kcal"
  schlechter als keine Zahl — untergräbt Vertrauen.
- Falls überhaupt: nur als ausdrücklich gekennzeichnete grobe Schätzung
  („ca., ohne Gewähr"), nie als exakter Wert. KI-Text-/Vision-Kontingent
  beachten (fällt unter das gewichtete Kontingent-System).

**Empfehlung:** 1a bauen, 1b höchstens als optionale, klar deklarierte Schätzung.

---

## 2. Feedback-System (nützlichstes der drei — Launch-nah sinnvoll)

Nutzer geben Feedback, Admin sieht/verwaltet es.

- Nutzerseite: einfaches Feedback-Formular (Freitext, evtl. Kategorie/Sterne).
- Admin-Bereich: Liste aller Feedbacks, gutes **markieren/behalten**, Müll
  **löschen**. Muster existiert bereits (analog zum „Verwaltung"-Tab auf
  `/profil`).
- Umsetzung überschaubar:
  - Eine `feedback`-Tabelle (id, user_id, text, kategorie?, status
    [neu/behalten/erledigt], created_at).
  - RLS: Nutzer schreiben nur eigenes Feedback; nur Admin (Tier 99) liest alle.
  - Admin-Tab/Route analog zu bestehendem Muster.
- Warum vorziehenswert: liefert nach dem Launch genau die Signale, welche der
  anderen Ideen sich lohnen. Wenn *ein* neues Feature vor/direkt nach Launch,
  dann dieses.

---

## 3. Belohnungs-/Fortschrittssystem (Gamification)

Ursprungsidee (von einem Freund): „100 Gerichte gespeichert → 1 Stern."
Kern ist gut (Bindung), aber ein einzelner Zähler ist dünn. Ausbaurichtungen:

- **Stufen/Titel statt bloßer Zähler**, thematisch ans Küchen-Framing gekoppelt:
  z. B. Commis → Chef de Partie → Sous-Chef → Küchenchef, freigeschaltet durch
  Aktivität. Passt zum vorhandenen Titel-Konzept („Culinary Creator").
- **Mehrere Achsen statt einer:**
  - Streak (aufeinanderfolgende aktive Tage)
  - Vielfalt (verschiedene Techniken/Kategorien ausprobiert)
  - Tiefe (komplette Menüs statt nur Einzelrezepte)
  → belohnt echtes Nutzen, nicht stures Klicken.
- **Wichtige Vorsicht — Zielgruppe:** Publikum sind (semi-)professionelle Köche.
  Zu verspielte Sterne/Badges können billig wirken. Eher dezent, als „Werkzeug,
  das Fortschritt sichtbar macht", nicht als Handyspiel. Optisch zurückhaltend,
  zum bestehenden edlen Look passend.
- Offene Fragen: Wo sichtbar (Profil? Dashboard?), rein kosmetisch oder mit
  echten Freischaltungen verknüpft, Missbrauch/Gaming der Zähler verhindern.

---

## Priorisierung (Vorschlag, nach Launch neu bewerten)

1. **Feedback-System** — kleiner Aufwand, hoher Erkenntniswert, hilft alle
   weiteren Entscheidungen zu treffen.
2. **Kalorien aus Rezepten (1a)** — solide, deterministisch, klarer Nutzwert.
3. **Gamification** — reizvoll, aber am meisten Design-/Zielgruppen-Feinschliff
   nötig; profitiert am stärksten davon, echte Nutzung vorher zu kennen.
4. **Kalorien aus Bildern (1b)** — nur, wenn 1a steht und die Vision-Schätzung
   sauber als „ohne Gewähr" abgegrenzt wird.

> Reihenfolge ist ein Vorschlag, keine Festlegung. Nach dem Launch anhand von
> echtem Nutzerverhalten und Feedback (siehe Punkt 2) neu entscheiden.
