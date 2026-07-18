# Konzept: Rezept-Community / Öffentliche Mediathek

**LUCA Culinary Studio** · Idee festgehalten 2026-07-14 · **STATUS: Zukunftsplan, NICHT jetzt bauen**

> **Kurzfassung:** Aus dem Einzelplatz-Werkzeug wird eine Community. Nutzer können Rezepte öffentlich teilen, andere stöbern, übernehmen und weiterentwickeln. Ersetzt die vage „Kreativlabor"-Idee, deren Zweck nicht mehr klar war.

---

## 1. Warum das strategisch stark ist

**Es löst das Leer-Problem.** Ein neuer Nutzer sieht heute ein leeres Rezeptarchiv. Mit einer geteilten Mediathek sieht er sofort Inhalt – Rezepte anderer Köche zum Stöbern. Das ist der „Aha"-Moment, der beim Onboarding fehlt.

**Es ist ein echter Abo-Anreiz.** Free darf stöbern, Bezahlnutzer dürfen veröffentlichen (oder umgekehrt – Stellschraube). Bindet Nutzer: Wer dort seine Rezepte und Follower hat, wechselt nicht leicht.

**Es macht die Daten wertvoller.** Geteilte Rezepte haben Geschmacksprofile, Zutaten, Techniken – könnten in den Menügenerator zurückfließen („komponiere mit Community-Rezepten").

**Es ist ein Differenzierungsmerkmal.** Rezeptportale gibt es viele – aber keins hat die strukturierten Daten (6 Geschmacksachsen, Diät-Tags, Techniken, Saison), die eine völlig andere Art von Suche erlauben.

---

## 2. Kernfunktionen

**Öffentliche Rezept-Bibliothek**
- Stöbern in veröffentlichten Rezepten anderer Nutzer.
- **Filterung über die vorhandenen strukturierten Daten** – das ist der USP: Kategorie, Saison, Diät-Tags, **Geschmacksprofil** („zeig mir was Säurebetontes / Umami-lastiges"), Technik (Sous-vide, Fermentation …), Aufwand (Bistro/Gehoben/Fine Dining), Zeit, Schwierigkeit.
- Kein anderes Rezeptportal kann so filtern, weil ihnen diese Daten fehlen.

**Koch-Profile**
- Basis existiert bereits: Name, Titel („Chef & Creator"), Foto, Social-Media-Links, „Mein Stil".
- Profil zeigt die veröffentlichten Rezepte des Kochs → Profis können sich präsentieren.

**Übernehmen & Weiterentwickeln**
- Fremdes Rezept in die eigene Sammlung kopieren.
- Dort mit dem **Rezept-Sous-Chef** anpassen (existiert schon!) – „mach es vegetarisch", „auf 6 Portionen".
- Herkunft bleibt sichtbar („basiert auf einem Rezept von …") – Respekt vor dem Original.

**Optional / später**
- Likes, Speichern/Merkliste, Kommentare, Follower.
- Kollektionen („Meine Sommer-Menüs").
- Auch **Menüs** teilen (nicht nur Rezepte) – die Menükarte ist ja schon eine schöne, teilbare Darstellung.

---

## 3. Sichtbarkeit & Rechte (Vorschlag)

Pro Rezept ein Status: **privat** (Standard, nur ich) / **öffentlich** (in der Mediathek) / evtl. **ungelistet** (nur per Link).

Abo-Kopplung als Stellschraube – zwei Denkrichtungen:
- **Free darf stöbern, Bezahlnutzer dürfen veröffentlichen** → Veröffentlichen als Premium-Feature, motiviert Profis zum Upgrade.
- **Umgekehrt:** Jeder darf veröffentlichen (füllt die Plattform schneller), aber erweiterte Features (Statistiken, mehr Sichtbarkeit) sind Premium.

Empfehlung: Zweitere Variante zum Start – die Plattform braucht erst mal **Inhalt**, nicht Zugangshürden.

---

## 4. Die ehrlichen Fallstricke

**⚠ Das kalte Start-Problem (das größte Risiko).**
Eine Community ohne Mitglieder ist eine leere Halle. Am Anfang bist nur du drin. Warum sollte jemand beitreten, wenn nichts da ist? Viele Plattformen sterben genau daran.
→ Gegenmittel: Selbst mit Inhalt füllen (eigene Rezepte veröffentlichen), gezielt Köche einladen, evtl. mit einer kuratierten Startsammlung beginnen.

**⚠ Moderation.**
Sobald Nutzer öffentlich posten, braucht es Regeln, Melde-Funktion und die Möglichkeit, Inhalte zu löschen. Bei Rezepten ist das Risiko gering, aber es kommt (Spam, geklaute Fotos, Unsinn).

**⚠ Rechtliches (wächst deutlich).**
Wer fremde Inhalte hostet, hat mehr Pflichten: Urheberrecht (geklaute Rezepte/Fotos), Impressum, Melde-Mechanismen, ggf. Haftung für Nutzerinhalte. Gehört ins rechtliche Kapitel – **fachliche Beratung nötig.**

**⚠ Es ist ein eigener Produktbereich**, kein „Feature". Deutlich größer als der Menügenerator. Nicht unterschätzen.

---

## 5. Wann bauen? (Empfehlung: NICHT jetzt)

**Erst das Kernprodukt fertig:**
1. Tellerdesigner echt bauen (letztes Mock-Feature)
2. KI-Sous-Chef auf zentralen Betreiber-Key umstellen
3. Kontingent-System + Stripe (Abo)
4. Launch, erste zahlende Nutzer

**Dann die Community draufsetzen** – wenn es Leute gibt, die etwas zu teilen haben. Eine Mediathek ohne Nutzer ist eine leere Halle.

Das Gute: Fast alles, was die Community braucht, existiert schon – Rezepte mit reichen Daten, Profile mit Foto/Titel/Social-Links, der Rezept-Sous-Chef zum Weiterentwickeln. Der Aufwand liegt vor allem in Sichtbarkeits-Logik, Stöber-Oberfläche, Moderation und Recht.

---

## 6. Was mit `/kreativlabor` passiert

Die Seite existiert (fertiges UI, Mock-Daten aus `mockAI.ts`), ihr ursprünglicher Zweck ist aber **nicht mehr rekonstruierbar** – die Idee war nie konkret geworden. Aktuell durch `NEXT_PUBLIC_AI_LAB_ENABLED=false` gesperrt.

**Optionen:**
- **Umwidmen** zur Community/Mediathek (diese Idee).
- **Ersatzlos streichen** – der Menügenerator, der KI-Sous-Chef und der Rezept-Chat decken „kreative KI-Unterstützung" bereits ab. Weniger Features, die dafür alle gut sind, schlägt viele halbgare.

Entscheidung offen. Solange sie gesperrt ist, entsteht kein Schaden.

