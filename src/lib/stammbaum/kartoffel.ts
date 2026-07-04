import type { TreeNodeData } from './types';

export const KARTOFFEL: TreeNodeData = {
  id: 'root',
  label: 'KARTOFFEL',
  subtitle: 'Solanum tuberosum · Vielseitige Knolle',
  level: 0,
  description:
    'Seit dem 16. Jahrhundert aus den Anden – die Kartoffel revolutionierte die europäische Ernährung und ernährt heute Milliarden Menschen in allen Kulturen.',
  children: [
    {
      id: 'kochen', label: 'KOCHEN', icon: '🫧', level: 1,
      description: 'Feuchte Hitze bei 100 °C in kochendem Wasser oder aromatischer Brühe.',
      inspiration: 'Kräuter, Brühe statt Wasser, Aufläufe',
      children: [
        { id: 'k-ganz',  label: 'Ganz lassen', level: 2, dishes: ['Salzkartoffel', 'Pellkartoffel'] },
        { id: 'k-stueck', label: 'In Stücke',  level: 2, dishes: ['Kartoffelsuppe', 'Eintopf'] },
        { id: 'k-stamp', label: 'Stampfen',    level: 2, dishes: ['Kartoffelpüree', 'Himmel & Erde'] },
      ],
    },
    {
      id: 'backen', label: 'BACKEN', icon: '🔥', level: 1,
      description: 'Trockene Ofenhitze entwickelt Röstaroma und eine knusprige Außenhülle.',
      inspiration: 'Gewürze, Käse überbacken, Füllungen',
      children: [
        { id: 'b-ganz',    label: 'Ganz',    level: 2, dishes: ['Ofenkartoffel', 'Folienkartoffel'] },
        { id: 'b-spal',    label: 'Spalten', level: 2, dishes: ['Wedges', 'Hasselback'] },
        { id: 'b-gefuellt',label: 'Gefüllt', level: 2, dishes: ['Twice-Baked Potato'] },
      ],
    },
    {
      id: 'braten', label: 'BRATEN', icon: '🥘', level: 1,
      description: 'Fett bei hoher Hitze – goldene Kruste durch die Maillard-Reaktion.',
      inspiration: 'Zwiebeln & Speck, Kräuter & Knoblauch',
      children: [
        { id: 'br-scheib', label: 'Scheiben', level: 2, dishes: ['Bratkartoffeln', 'Lyoner Art'] },
        { id: 'br-wuef',   label: 'Würfeln',  level: 2, dishes: ['Kartoffelpfanne', 'Bauernfrühstück'] },
        { id: 'br-rasp',   label: 'Raspeln',  level: 2, dishes: ['Rösti', 'Kartoffelpuffer', 'Latkes', 'Boxty'] },
      ],
    },
    {
      id: 'frittieren', label: 'FRITTIEREN', icon: '✨', level: 1,
      description: 'Heißes Fett bei 160–190 °C – maximale Knusprigkeit durch schnellen Wasserentzug.',
      inspiration: 'Verschiedene Öle, Würzen aus dem Fett',
      children: [
        { id: 'fr-jul',    label: 'Julienne',  level: 2, dishes: ['Pommes frites', 'Curly Fries'] },
        { id: 'fr-scheib', label: 'Scheiben',  level: 2, dishes: ['Chips', 'Crisps'] },
        { id: 'fr-wuef',   label: 'Würfel',    level: 2, dishes: ['Kroketten'] },
        { id: 'fr-gauf',   label: 'Gaufrette', level: 2, dishes: ['Pommes gaufrettes (Fine Dining)'] },
      ],
    },
    {
      id: 'daempfen', label: 'DÄMPFEN', icon: '💨', level: 1,
      description: 'Wasserdampf bei 100 °C – schonendste Methode, erhält alle Nährstoffe.',
      inspiration: 'Kräuter, Butter, als Hauptgericht',
      children: [
        { id: 'd-stueck', label: 'Stücke',   level: 2, dishes: ['Gedämpfte Kartoffeln', 'Dampfkartoffelsalat'] },
        { id: 'd-scheib', label: 'Scheiben', level: 2, dishes: ['Kartoffelgemüse'] },
      ],
    },
    {
      id: 'puerieren', label: 'PÜRIEREN', icon: '🥣', level: 1,
      description: 'Von samtig-fein bis rustikal-grob – die Textur entscheidet über das Gericht.',
      inspiration: 'Sahne & Butter, Trüffel, Fine-Dining Basis',
      children: [
        {
          id: 'p-fein', label: 'Fein passiert', level: 2,
          dishes: ['Kartoffelpüree', 'Pommes Duchesse', 'Kartoffelschaum (Fine Dining)', 'Kartoffelvelouté'],
        },
        {
          id: 'p-grob', label: 'Grob gestampft', level: 2,
          dishes: ['Stampfkartoffeln', 'Rough Mash', 'Smashed Potatoes'],
        },
      ],
    },
    {
      id: 'roh', label: 'ROH', icon: '🌿', level: 1,
      description: 'Roh enthält die Kartoffel resistente Stärke – besondere Textur und Enzymatik.',
      inspiration: 'Dressing, andere Gemüse kombinieren',
      children: [
        { id: 'r-reib', label: 'Reiben',   level: 2, dishes: ['Rohkostsalat', 'Gratin roh'] },
        { id: 'r-jul',  label: 'Julienne', level: 2, dishes: ['Kartoffelnudeln roh'] },
        { id: 'r-rasp', label: 'Raspeln',  level: 2, dishes: ['Rösti (Vorbereitung)'] },
      ],
    },
    {
      id: 'trocknen', label: 'TROCKNEN', icon: '🌬️', level: 1,
      description: 'Feuchtigkeitsentzug konzentriert Aromen und verlängert die Haltbarkeit erheblich.',
      inspiration: 'Haltbarmachen, Geschmack konzentrieren',
      children: [
        { id: 't-trock',    label: 'Trocknen',        level: 2, dishes: ['Kartoffelflocken', 'Kartoffelmehl'] },
        { id: 't-einm',     label: 'Einmachen',       level: 2, dishes: ['Kartoffelkonserven'] },
        { id: 't-gefriert', label: 'Gefriertrocknen', level: 2, dishes: ['Chuño (peruanisch)'] },
      ],
    },
  ],
};
