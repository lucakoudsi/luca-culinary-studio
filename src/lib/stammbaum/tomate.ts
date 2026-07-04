import type { TreeNodeData } from './types';

export const TOMATE: TreeNodeData = {
  id: 'root',
  label: 'TOMATE',
  subtitle: 'Solanum lycopersicum · Frucht der Saucen',
  level: 0,
  description:
    'Botanisch eine Beere, kulinarisch das Fundament Südeuropas – die Tomate vereint Süße, Säure und Umami in einer einzigen Frucht.',
  children: [
    {
      id: 'roh', label: 'ROH', icon: '🌿', level: 1,
      description: 'Frische Tomate in ihrer reinsten Form – Säure und Süße unverfälscht, Textur knackig.',
      inspiration: 'Niemals kühlen, Reifung bei Zimmertemperatur',
      children: [
        { id: 'r-scheib',   label: 'Geschnitten', level: 2, dishes: ['Caprese', 'Tomatensalat', 'BLT-Sandwich'] },
        { id: 'r-gehackt',  label: 'Gehackt',     level: 2, dishes: ['Bruschetta', 'Pico de Gallo', 'Salsa cruda'] },
        { id: 'r-gepresst', label: 'Gepresst',    level: 2, dishes: ['Gazpacho', 'Bloody Mary', 'Tomatensaft'] },
      ],
    },
    {
      id: 'kochen', label: 'KOCHEN', icon: '🫧', level: 1,
      description: 'Hitze baut die Säure ab und konzentriert Süße und Umami.',
      inspiration: 'Langsam garen, Aromazugabe am Ende',
      children: [
        { id: 'k-sauce',    label: 'Sauce',     level: 2, dishes: ['Sugo al pomodoro', 'Arrabbiata', 'Bolognese-Basis'] },
        { id: 'k-suppe',    label: 'Suppe',     level: 2, dishes: ['Tomatencremesuppe', 'Tomatenessenz', 'Gazpacho warm'] },
        { id: 'k-einkochen',label: 'Einkochen', level: 2, dishes: ['Passata', 'Tomatenmark', 'Pelati'] },
      ],
    },
    {
      id: 'confieren', label: 'CONFIEREN', icon: '🫙', level: 1,
      description: 'Langsames Garen in Öl bei niedriger Temperatur – die Tomate wird seidig und hochkonzentriert.',
      inspiration: 'Olivenöl, Kräuter, 90–100 °C, 2–3 Stunden',
      children: [
        { id: 'c-halb', label: 'Halbiert', level: 2, dishes: ['Tomate confite', 'Tapas-Tomate', 'Bruschetta-Belag'] },
        { id: 'c-ganz', label: 'Ganz',     level: 2, dishes: ['Ofentomate gefüllt', 'Tomate provenzalisch'] },
      ],
    },
    {
      id: 'backen', label: 'BACKEN', icon: '🔥', level: 1,
      description: 'Im Ofen karamellisiert der Zucker und bildet intensive Röstaromen.',
      inspiration: 'Hohe Temperatur, Kräuter & Knoblauch',
      children: [
        { id: 'b-pizza', label: 'Pizzabelag', level: 2, dishes: ['Pizza Margherita', 'Pizza Marinara', 'Focaccia'] },
        { id: 'b-grat',  label: 'Gratin',     level: 2, dishes: ['Tian de légumes', 'Tomate farcie', 'Parmigiana'] },
      ],
    },
    {
      id: 'grillen', label: 'GRILLEN', icon: '♨️', level: 1,
      description: 'Direkte Hitze erzeugt Rauchnoten und karamellisiert die Außenhaut.',
      inspiration: 'Holzkohle für Raucharoma, Mazeration mit Öl',
      children: [
        { id: 'g-halb',     label: 'Halbiert',  level: 2, dishes: ['Gegrillte Tomate (englisches Frühstück)', 'Antipasto misto'] },
        { id: 'g-gespiesst',label: 'Geröstet',  level: 2, dishes: ['Shakshuka-Grundlage', 'Chakchouka'] },
      ],
    },
    {
      id: 'trocknen', label: 'TROCKNEN', icon: '☀️', level: 1,
      description: 'Wasserentzug konzentriert alle Aromen – intensivstes Tomatenaroma.',
      inspiration: 'Sonnentrocknung, Dörrautomat, in Öl einlegen',
      children: [
        { id: 't-sonne',  label: 'Sonnengetrocknet', level: 2, dishes: ['Pomodori secchi', 'Antipasto', 'Pesto rosso'] },
        { id: 't-pulver', label: 'Pulver',            level: 2, dishes: ['Tomatenpulver (Umami-Booster)', 'Tomatenflakes'] },
      ],
    },
    {
      id: 'fermentieren', label: 'FERMENTIEREN', icon: '🧪', level: 1,
      description: 'Fermentation entwickelt neue Säure-Schichten und probiotische Komplexität.',
      inspiration: 'Salzbrine, Zimmertemperatur, 3–7 Tage',
      children: [
        { id: 'fe-brine',      label: 'Brine',        level: 2, dishes: ['Fermentierte Tomatensalsa', 'Tomaten-Kimchi'] },
        { id: 'fe-verarbeitet',label: 'Verarbeitet',  level: 2, dishes: ['Fermentierter Tomatensaft', 'Tomaten-Garum'] },
      ],
    },
    {
      id: 'frittieren', label: 'FRITTIEREN', icon: '✨', level: 1,
      description: 'Ein Mantel aus Mehl oder Teig schützt die Tomate im heißen Fett und erzeugt knusprigen Kontrast.',
      inspiration: 'Grüne, unreife Tomaten eignen sich am besten',
      children: [
        { id: 'fr-gruen',   label: 'Grün paniert',   level: 2, dishes: ['Fried Green Tomatoes (Südstaaten-Klassiker)'] },
        { id: 'fr-tempura', label: 'Im Teigmantel', level: 2, dishes: ['Tomaten-Tempura', 'Beignets de tomate'] },
      ],
    },
  ],
};
