// Kuratierte Wissensbasis echter Plattier-/Anrichtetechniken fuer den
// Tellerdesigner. Fliesst in BEIDE Prompts der Route (src/app/api/
// tellerdesigner/route.ts) ein: in den Bild-Prompt (damit gpt-image-1
// tatsaechlich existierende Techniken zeigt statt generischer "schoener
// Teller"-Bilder) und in den Techniken-Text-Prompt (damit die
// Schlagwort/Kurzsatz/Anleitung-Labels aus echtem Handwerk kommen statt vom
// Modell frei erfunden zu werden).
//
// Bewusst eine flache Liste aus Plain Objects statt verschachtelter
// Strukturen -- neue Technik ergaenzen heisst: neuen Eintrag unten anhaengen,
// fertig. "stile" und "fokusse" duerfen mehrere Werte enthalten (eine
// Technik ist typischerweise nicht auf genau eine Kombination beschraenkt).
//
// "stile" nutzt bewusst denselben Wertebereich wie Aufwandsstufe
// (bistro/gehoben/fine_dining, src/config/techniken.ts) -- im Anrichte-
// Kontext beschreibt diese Stufe primaer die Praezision/den Aufwand der
// Anrichteweise, nicht nur den Aufwand der Zubereitung.
import type { Aufwandsstufe } from './techniken';
import type { AnrichteFokus } from './tellerAnrichteFokus';

export type AnrichteTechnik = {
  id: string;
  name: string;
  beschreibung: string;
  anwendungsfall: string;
  stile: Aufwandsstufe[];
  fokusse: AnrichteFokus[];
};

export const ANRICHTE_TECHNIKEN: AnrichteTechnik[] = [
  {
    id: 'saucenspiegel',
    name: 'Saucenspiegel',
    beschreibung: 'Ein flacher, gleichmäßiger Sauce-„Spiegel" wird mit dem Löffelrücken kreisend vom Zentrum nach außen auf dem Teller verstrichen, bevor die Hauptkomponente daraufgesetzt wird.',
    anwendungsfall: 'Klassische Basis für Saucengerichte (Fleisch/Fisch mit Jus, Beurre blanc, Consommé-Sauce) -- gibt der Hauptkomponente einen ruhigen, edlen Untergrund.',
    stile: ['gehoben', 'fine_dining'],
    fokusse: ['symmetrie', 'zutat_im_fokus'],
  },
  {
    id: 'saucenbahn_wischer',
    name: 'Saucenbahn / Wischer',
    beschreibung: 'Ein Löffel Sauce oder Püree wird mit dem Löffelrücken in einer einzigen, zügigen diagonalen Bewegung über den Teller gezogen -- vom dickeren Ausgangspunkt zum dünn auslaufenden Ende.',
    anwendungsfall: 'Dynamische, moderne Alternative zum Saucenspiegel; führt den Blick diagonal über den Teller und passt zu asymmetrischen, zeitgenössischen Kompositionen.',
    stile: ['gehoben', 'fine_dining'],
    fokusse: ['kreativ', 'farbe_kontrast'],
  },
  {
    id: 'punkt_reihe_abnehmend',
    name: 'Punkt-Reihe (abnehmend)',
    beschreibung: 'Eine Reihe von Sauce- oder Püree-Punkten wird mit Löffelspitze oder Spritzbeutel gesetzt, wobei die Punktgröße von einem Ende zum anderen kontinuierlich abnimmt.',
    anwendungsfall: 'Feine, verspielte Ergänzung entlang einer Tellerkante oder als Begleitspur zu einer Hauptkomponente -- typisch für die klassische Sterneküche.',
    stile: ['gehoben', 'fine_dining'],
    fokusse: ['symmetrie', 'kreativ'],
  },
  {
    id: 'quenelle',
    name: 'Quenelle',
    beschreibung: 'Mit zwei angewärmten Löffeln wird eine weiche Masse (Creme, Mousse, Sorbet, Püree) zwischen den Löffelmulden hin- und hergeformt, bis eine ovale, dreiseitige Form mit glatter Oberfläche entsteht.',
    anwendungsfall: 'Klassische Formgebung für Pürees, Cremes, Mousses, Sorbets und Aufstriche -- ersetzt einen formlosen Klecks durch eine elegante, wiedererkennbare Form.',
    stile: ['gehoben', 'fine_dining'],
    fokusse: ['zutat_im_fokus', 'symmetrie'],
  },
  {
    id: 'turm_hoehenaufbau',
    name: 'Turm / Höhenaufbau',
    beschreibung: 'Komponenten werden geschichtet oder mit einem Anrichtering vertikal gestapelt, um dem Gericht Höhe statt reiner Flächenausdehnung zu geben.',
    anwendungsfall: 'Bei geschichteten Gerichten (Tartar, Terrinen, Gemüseschichtungen) oder wenn eine einzelne Komponente das Gericht optisch dominieren soll.',
    stile: ['gehoben', 'fine_dining'],
    fokusse: ['zutat_im_fokus', 'kreativ'],
  },
  {
    id: 'kreis_anordnung',
    name: 'Kreis-Anordnung',
    beschreibung: 'Mehrere gleich große Elemente (Scheiben, Stücke, Punkte) werden in einem exakten Kreis oder Ring um ein Zentrum oder entlang des Tellerrands angeordnet.',
    anwendungsfall: 'Für Gerichte mit mehreren gleichartigen Einzelstücken (Carpaccio, Ravioli, Jakobsmuscheln) -- betont Ordnung, Wiederholung und Ruhe.',
    stile: ['bistro', 'gehoben', 'fine_dining'],
    fokusse: ['symmetrie'],
  },
  {
    id: 'sichel',
    name: 'Sichel',
    beschreibung: 'Eine Komponente (z.B. Gemüsescheiben, Sauce, Püree) wird in einer geschwungenen Halbmond-/Sichelform an den Tellerrand gesetzt, statt symmetrisch zentriert zu werden.',
    anwendungsfall: 'Rahmt die Hauptkomponente asymmetrisch, ohne den Teller zu überladen -- bringt Bewegung in eine sonst ruhige, zentrierte Komposition.',
    stile: ['gehoben', 'fine_dining'],
    fokusse: ['kreativ', 'farbe_kontrast'],
  },
  {
    id: 'oel_kraeuteroel_tupfen',
    name: 'Öl-/Kräuteröl-Tupfen',
    beschreibung: 'Kleine Tropfen eines aromatisierten Öls (Kräuteröl, Chiliöl, Nussöl) werden mit Pipette oder Löffelspitze gezielt um oder auf das Gericht gesetzt.',
    anwendungsfall: 'Setzt punktuelle Farb- und Geschmacksakzente -- funktioniert auf jedem Aufwandsniveau, vom Bistro-Teller bis Fine Dining.',
    stile: ['bistro', 'gehoben', 'fine_dining'],
    fokusse: ['farbe_kontrast', 'zutat_im_fokus'],
  },
  {
    id: 'crumble_bett',
    name: 'Crumble-Bett',
    beschreibung: 'Eine knusprige Krume (aus Brot, Nüssen, getrockneten Oliven o.Ä.) wird als lockere, unregelmäßige Schicht auf den Teller gestreut, auf der die Hauptkomponente aufliegt.',
    anwendungsfall: 'Gibt Textur-Kontrast zu weichen/cremigen Hauptkomponenten (Fisch, Pürees, Eier) und wirkt bodenständig-rustikal bis gehoben.',
    stile: ['bistro', 'gehoben'],
    fokusse: ['zutat_im_fokus', 'farbe_kontrast'],
  },
  {
    id: 'nest',
    name: 'Nest',
    beschreibung: 'Fein geschnittene, frittierte oder gebackene Stränge (Kartoffel, Filoteig, Nudeln) werden zu einem kleinen Nest geformt, das eine weichere Komponente (Ei, Tatar, Mousse) trägt.',
    anwendungsfall: 'Spielt mit Textur und Optik, wenn eine weiche oder flüssige Komponente einen sichtbaren, strukturierten Rahmen braucht.',
    stile: ['gehoben', 'fine_dining'],
    fokusse: ['kreativ', 'zutat_im_fokus'],
  },
  {
    id: 'asymmetrische_drittel_regel',
    name: 'Asymmetrische Drittel-Regel',
    beschreibung: 'Die Hauptkomponente wird bewusst nicht zentriert, sondern auf einem der gedachten Drittelpunkte des Tellers platziert (analog zur Drittel-Regel aus der Fotografie); der Rest der Komposition balanciert dagegen.',
    anwendungsfall: 'Bricht die klassische Zentrierung auf und wirkt moderner/dynamischer -- besonders stimmig bei Anrichte-Fokus „Kreativ" oder „Farbe & Kontrast".',
    stile: ['gehoben', 'fine_dining'],
    fokusse: ['kreativ', 'farbe_kontrast'],
  },
  {
    id: 'negativraum',
    name: 'Negativraum',
    beschreibung: 'Bewusst großzügig freigelassene, leere Tellerfläche wird als eigenständiges Gestaltungselement genutzt statt mit Dekor gefüllt.',
    anwendungsfall: 'Lenkt die Aufmerksamkeit gezielt auf wenige, hochwertige Komponenten -- zentrales Stilmittel der reduzierten, minimalistischen Fine-Dining-Anrichteweise.',
    stile: ['gehoben', 'fine_dining'],
    fokusse: ['zutat_im_fokus', 'symmetrie'],
  },
  {
    id: 'espuma_schaum',
    name: 'Espuma/Schaum',
    beschreibung: 'Eine mit dem Sahnesiphon aufgeschäumte, sehr leichte und stabile Schaummasse (Espuma) aus einer aromatisierten Basis (Fond, Püree, Saft) wird als lockere Haube oder Tupfen auf oder neben die Hauptkomponente dosiert.',
    anwendungsfall: 'Bringt konzentrierten Geschmack in einer sehr leichten, luftigen Textur ein -- klassisches Element der modernen Küche, funktioniert als Kontrast zu festeren Komponenten.',
    stile: ['gehoben', 'fine_dining'],
    fokusse: ['zutat_im_fokus', 'kreativ'],
  },
  {
    id: 'gel_tupfen',
    name: 'Gel-Tupfen',
    beschreibung: 'Mit Agar-Agar oder ähnlichen Geliermitteln wird eine Flüssigkeit (Fond, Fruchtsaft, Püree) formstabil und glänzend geliert und anschließend als klar definierter, präzise gesetzter Tupfen aufgetragen.',
    anwendungsfall: 'Liefert -- anders als eine flüssige Sauce -- einen dauerhaft formstabilen, glänzenden Akzent, der auch beim Servieren nicht zerläuft; typisch für sehr präzise Fine-Dining-Teller.',
    stile: ['fine_dining'],
    fokusse: ['farbe_kontrast', 'kreativ'],
  },
  {
    id: 'dot_and_drag',
    name: 'Dot-and-drag',
    beschreibung: 'Ein einzelner Sauce- oder Püree-Punkt wird gesetzt und anschließend mit der Löffelspitze oder einem Stäbchen in einer kurzen, gezielten Bewegung zu einer Kometenschweif-Form ausgezogen -- eine eigenständige Technik, nicht zu verwechseln mit dem durchgehenden Wischer.',
    anwendungsfall: 'Erzeugt einen kleinen, präzisen Bewegungsakzent an einer einzelnen Stelle, etwa neben einer Hauptkomponente, ohne die gesamte Tellerfläche wie ein Wischer zu durchziehen.',
    stile: ['gehoben', 'fine_dining'],
    fokusse: ['kreativ', 'farbe_kontrast'],
  },
  {
    id: 'tuile_chip_aufgestellt',
    name: 'Tuile/Chip aufgestellt',
    beschreibung: 'Eine dünne, knusprige Tuile oder ein Chip wird nicht flach aufgelegt, sondern senkrecht in die Komponente gesteckt oder angelehnt, sodass ein vertikales Element mit Eigenschatten entsteht.',
    anwendungsfall: 'Bricht die Flächigkeit des Tellers, gibt Höhe und Textur-Kontrast und wirft bei seitlichem Licht einen zusätzlichen gestalterischen Schatten.',
    stile: ['gehoben', 'fine_dining'],
    fokusse: ['zutat_im_fokus', 'kreativ'],
  },
  {
    id: 'pulver_erde',
    name: 'Pulver/„Erde"',
    beschreibung: 'Gefriergetrocknetes Pulver (z.B. aus Gemüse, Obst, Kräutern) oder geröstete Malz-/Brotkrumen werden lose als unregelmäßige „Erde" auf den Teller gestreut.',
    anwendungsfall: 'Bringt Farbe, konzentriertes Aroma und einen natürlich-organischen, an die Nordic-Küche angelehnten Look, oft als Untergrund für Wurzelgemüse oder Wild.',
    stile: ['gehoben', 'fine_dining'],
    fokusse: ['farbe_kontrast', 'kreativ'],
  },
  {
    id: 'ungerade_anzahl_regel',
    name: 'Ungerade-Anzahl-Regel',
    beschreibung: 'Wiederkehrende Einzelstücke (Gnocchi, Jakobsmuscheln, Spargelspitzen) werden bewusst in ungerader Anzahl -- typischerweise drei oder fünf statt vier -- angeordnet.',
    anwendungsfall: 'Ungerade Gruppierungen wirken für das Auge organischer und dynamischer als gerade Anzahlen; klassische Grundregel der Anrichte-Komposition.',
    stile: ['bistro', 'gehoben', 'fine_dining'],
    fokusse: ['kreativ', 'symmetrie'],
  },
  {
    id: 'randfreiheit',
    name: 'Randfreiheit',
    beschreibung: 'Der äußere Tellerrand bleibt konsequent frei von Sauce, Fett-Spritzern und Krümeln -- notfalls vor dem Service mit einem feuchten Tuch oder Daumen nachgezogen.',
    anwendungsfall: 'Grundregel für jede Anrichteweise unabhängig von Stil oder Fokus: ein sauberer Rand wirkt professionell, ein verschmutzter Rand entwertet selbst eine sonst gelungene Komposition.',
    stile: ['bistro', 'gehoben', 'fine_dining'],
    fokusse: ['zutat_im_fokus', 'symmetrie', 'kreativ', 'farbe_kontrast'],
  },
  {
    id: 'kraeuter_bluetensetzung_pinzette',
    name: 'Kräuter-/Blüten-Setzung mit Pinzette',
    beschreibung: 'Einzelne Kräuterblätter, Mikro-Greens oder essbare Blüten werden mit der Pinzette gezielt einzeln platziert, statt lose über den Teller gestreut zu werden.',
    anwendungsfall: 'Jedes gesetzte Element hat eine bewusste Position und Ausrichtung -- Signatur-Detail präziser Fine-Dining-Teller, deutlich sichtbarer Unterschied zu grob gestreuten Kräutern.',
    stile: ['gehoben', 'fine_dining'],
    fokusse: ['zutat_im_fokus', 'farbe_kontrast'],
  },
  {
    id: 'am_tisch_angegossen',
    name: 'Am Tisch angegossen',
    beschreibung: 'Der Fond, die Sauce oder Brühe wird nicht in der Küche aufgetragen, sondern separat serviert und erst am Tisch vor dem Gast aus einem Kännchen oder Gießer über die bereits angerichteten Komponenten gegossen.',
    anwendungsfall: 'Der Teller wird zunächst trocken/reduziert angerichtet und bewusst als Service-Moment inszeniert -- Fond, Duft und Dampf entfalten sich erst am Tisch; setzt eine hochwertige Service-Choreografie voraus.',
    stile: ['fine_dining'],
    fokusse: ['zutat_im_fokus', 'kreativ'],
  },
];

/**
 * Techniken, die zur gewaehlten Aufwandsstufe UND zum Anrichte-Fokus passen.
 * Faellt auf "nur Aufwandsstufe" zurueck, falls die Schnittmenge leer ist --
 * eine Technik soll nie komplett aus dem Prompt-Kontext fallen, nur weil kein
 * Eintrag zufaellig beide Dimensionen gleichzeitig trifft.
 */
export function technikenFuer(stil: Aufwandsstufe, fokus: AnrichteFokus): AnrichteTechnik[] {
  const passendZuStil = ANRICHTE_TECHNIKEN.filter(t => t.stile.includes(stil));
  const passendZuBeidem = passendZuStil.filter(t => t.fokusse.includes(fokus));
  return passendZuBeidem.length > 0 ? passendZuBeidem : passendZuStil;
}

/** Formatiert eine Technikenliste als kompakte Aufzaehlung fuer Prompt-Kontexte. */
export function formatTechnikenKontext(techniken: AnrichteTechnik[]): string {
  return techniken
    .map(t => `- ${t.name}: ${t.beschreibung} (Einsatz: ${t.anwendungsfall})`)
    .join('\n');
}
