import type { TreeNodeData } from './types';

export const KAROTTE: TreeNodeData = {
  id: 'root',
  label: 'KAROTTE',
  subtitle: 'Daucus carota · Süße aus der Erde',
  level: 0,
  description:
    'Die Karotte bietet süßen Geschmack, lebhafte Farbe und bemerkenswerte Vielseitigkeit – von rohem Snack bis zur feinen Velouté.',
  children: [
    {
      id: 'roh', label: 'ROH', icon: '🌿', level: 1,
      description: 'Knackig, süß, voller Beta-Carotin – roh behält die Karotte maximale Nährstoffe.',
      inspiration: 'Dünne Scheiben oder Julienne, Dressing mit Säure',
      children: [
        { id: 'r-sticks',    label: 'Sticks',    level: 2, dishes: ['Rohkostplatte', 'Hummus-Dip', 'Bento-Box'] },
        { id: 'r-geraspelt', label: 'Geraspelt', level: 2, dishes: ['Karottensalat', 'Coleslaw', 'Sandwich-Belag'] },
        { id: 'r-jul',       label: 'Julienne',  level: 2, dishes: ['Vietnamesische Sommerrolle', 'Pho-Garnish', 'Papaya-Salat'] },
      ],
    },
    {
      id: 'kochen', label: 'KOCHEN', icon: '🫧', level: 1,
      description: 'Feuchte Hitze weicht die Karotte auf und konzentriert ihre natürliche Süße.',
      inspiration: 'In Brühe statt Wasser für mehr Tiefe',
      children: [
        { id: 'k-glasiert', label: 'Glaciert',  level: 2, dishes: ['Carottes glacées (fr. Klassiker)', 'Honigkarotten', 'Vichy-Karotten'] },
        { id: 'k-suppe',    label: 'Suppe',     level: 2, dishes: ['Karotten-Ingwer-Suppe', 'Potage Crécy', 'Karottenvelouté'] },
        { id: 'k-pure',     label: 'Pürieren',  level: 2, dishes: ['Karottenpüree', 'Karottencreme als Sauce'] },
      ],
    },
    {
      id: 'braten', label: 'BRATEN', icon: '🥘', level: 1,
      description: 'Karamellisierung intensiviert die natürliche Süße enorm.',
      inspiration: 'Honig oder Ahornsirup in der letzten Minute',
      children: [
        { id: 'br-roest',   label: 'Geröstet',  level: 2, dishes: ['Ofenkarotten mit Cumin', 'Honig-Thymian-Karotten', 'Hasselback Karotte'] },
        { id: 'br-mirepoix',label: 'Mirepoix',  level: 2, dishes: ['Braten-Basis', 'Fond-Gemüse', 'Bouillon-Karotte'] },
      ],
    },
    {
      id: 'backen', label: 'BACKEN', icon: '🔥', level: 1,
      description: 'Die natürliche Süße macht die Karotte zur idealen Backzutat.',
      inspiration: 'Gerieben für Feuchte, gewürfelt für Textur',
      children: [
        { id: 'ba-kuchen', label: 'Kuchen',      level: 2, dishes: ['Karottenkuchen', 'Carrot Cake mit Frischkäse', 'Rüeblitorte (Schweiz)'] },
        { id: 'ba-muffin', label: 'Kleingebäck', level: 2, dishes: ['Karottenmuffins', 'Karotten-Energy-Balls'] },
      ],
    },
    {
      id: 'daempfen', label: 'DÄMPFEN', icon: '💨', level: 1,
      description: 'Schonendste Methode – erhält Farbe, Textur und alle Nährstoffe.',
      inspiration: 'Kräuter in den Dampf geben',
      children: [
        { id: 'd-ganz',  label: 'Ganz',    level: 2, dishes: ['Gedämpfte Babykarotten', 'Dampfkarotte mit Kräuterbutter'] },
        { id: 'd-scheib',label: 'Scheiben',level: 2, dishes: ['Gedämpfte Karottenscheiben', 'Asiatisches Gemüsedampfgericht'] },
      ],
    },
    {
      id: 'fermentieren', label: 'FERMENTIEREN', icon: '🧪', level: 1,
      description: 'Fermentierte Karotte entwickelt frische Säure und Komplexität.',
      inspiration: '2 % Salzlake, 3–5 Tage bei Zimmertemperatur',
      children: [
        { id: 'fe-brine', label: 'Brine-Fermentiert', level: 2, dishes: ['Kimchi-Karotten', 'Fermentierte Karottensticks', 'Đồ chua (vietnamesisch)'] },
        { id: 'fe-saft',  label: 'Saft',              level: 2, dishes: ['Fermentierter Karottensaft', 'Karottenkwas'] },
      ],
    },
    {
      id: 'trocknen', label: 'TROCKNEN', icon: '🌬️', level: 1,
      description: 'Getrocknet intensiviert sich das Karottenaroma und die Farbe bleibt lebhaft.',
      inspiration: 'Für Suppen, Eintöpfe, Gewürzmischungen',
      children: [
        { id: 't-chips',  label: 'Chips',   level: 2, dishes: ['Karottenchips', 'Dehydrierte Karottenscheiben'] },
        { id: 't-pulver', label: 'Pulver',  level: 2, dishes: ['Karottenmehl', 'Karottenpulver für Suppen', 'Naturfarbe für Pasta'] },
      ],
    },
    {
      id: 'grillen', label: 'GRILLEN', icon: '♨️', level: 1,
      description: 'Direkte Glut karamellisiert die natürliche Süße und gibt Rauchnoten.',
      inspiration: 'Ganze Baby-Karotten, Glasur aus Honig oder Miso',
      children: [
        { id: 'gr-ganz',   label: 'Ganz',   level: 2, dishes: ['BBQ-Karotten mit Miso-Glasur', 'Gegrillte Babykarotten'] },
        { id: 'gr-spiess', label: 'Spieße', level: 2, dishes: ['Gemüsespieße', 'Karotten-Satay'] },
      ],
    },
  ],
};
