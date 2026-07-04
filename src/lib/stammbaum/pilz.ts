import type { TreeNodeData } from './types';

export const PILZ: TreeNodeData = {
  id: 'root',
  label: 'PILZ',
  subtitle: 'Fungi · König des Umami',
  level: 0,
  description:
    'Pilze sind keine Pflanzen – ihr Glutamatreichtum macht sie zum stärksten natürlichen Umami-Träger und unverzichtbaren Fleischersatz.',
  children: [
    {
      id: 'roh', label: 'ROH', icon: '🌿', level: 1,
      description: 'Hauchdünn geschnitten oder mariniert – nur sehr frische Pilze eignen sich.',
      inspiration: 'Limettensaft + Olivenöl + Parmesan',
      children: [
        { id: 'r-carpaccio', label: 'Carpaccio', level: 2, dishes: ['Champignon-Carpaccio', 'Steinpilz-Carpaccio (Fine Dining)'] },
        { id: 'r-mariniert', label: 'Mariniert',  level: 2, dishes: ['Pilze in Zitrussud', 'Champignon-Ceviche'] },
      ],
    },
    {
      id: 'braten', label: 'BRATEN', icon: '🥘', level: 1,
      description: 'Sehr heiße Pfanne – Pilze geben Wasser ab und brauchen Platz zum Braten.',
      inspiration: 'Nicht zu früh rühren, Farbe entwickeln lassen',
      children: [
        { id: 'br-butter', label: 'In Butter',       level: 2, dishes: ['Pfifferlinge in Butter', 'Steinpilze mit Thymian', 'Champignons à la minute'] },
        { id: 'br-scharf', label: 'Scharf angebraten',level: 2, dishes: ['Pilzragù', 'Pilzpfanne', 'Wok-Pilze (asiatisch)'] },
      ],
    },
    {
      id: 'kochen', label: 'KOCHEN', icon: '🫧', level: 1,
      description: 'In Brühe oder Milch garen – Pilze geben Extrakt und nehmen Aromen auf.',
      inspiration: 'Einweichwasser von getrockneten Pilzen immer nutzen',
      children: [
        { id: 'k-fond',    label: 'Fond & Brühe', level: 2, dishes: ['Pilzfond', 'Dashi (Shiitake)', 'Ramen-Brühe'] },
        { id: 'k-risotto', label: 'Risotto',       level: 2, dishes: ['Porcini-Risotto', 'Steinpilz-Risotto', 'Pilz-Barley-Risotto'] },
        { id: 'k-suppe',   label: 'Suppe',          level: 2, dishes: ['Crème de champignons', 'Pilzcremesuppe', 'Hot & Sour Soup'] },
      ],
    },
    {
      id: 'backen', label: 'BACKEN', icon: '🔥', level: 1,
      description: 'Im Ofen entwickeln Pilze Röstaromen und verlieren intensiv Wasser.',
      inspiration: 'Hohe Temperatur, nicht überlagern',
      children: [
        { id: 'ba-gefuellt', label: 'Gefüllt',        level: 2, dishes: ['Gefüllte Champignons', 'Portobello gefüllt', 'Parmigiana'] },
        { id: 'ba-tarte',    label: 'Tarte & Pastete', level: 2, dishes: ['Pilzquiche', 'Bœuf Wellington (Duxelles)', 'Pilzpastete'] },
      ],
    },
    {
      id: 'trocknen', label: 'TROCKNEN', icon: '🌬️', level: 1,
      description: 'Getrocknete Pilze entwickeln durch Enzymatik ein vielfach intensiveres Aroma.',
      inspiration: 'Einweichwasser nie wegschütten',
      children: [
        { id: 't-getrocknet', label: 'Getrocknet', level: 2, dishes: ['Steinpilze (Porcini)', 'Shiitake', 'Trompetenpfifferlinge'] },
        { id: 't-pulver',     label: 'Pulver',     level: 2, dishes: ['Pilzpulver (Umami-Booster)', 'Pilzmehl für Pasta', 'Rub für Fleisch'] },
      ],
    },
    {
      id: 'fermentieren', label: 'FERMENTIEREN', icon: '🧪', level: 1,
      description: 'Fermentation erzeugt neue Aromenprofile und erhöht die Verdaulichkeit.',
      inspiration: 'Pilze als Miso-Ersatz oder Kombination',
      children: [
        { id: 'fe-eingel', label: 'Eingelegte Pilze', level: 2, dishes: ['Marinierte Pilze', 'Pilz-Antipasto', 'Eingelegte Pfifferlinge'] },
        { id: 'fe-miso',   label: 'Fermentiert',      level: 2, dishes: ['Pilz-Garum', 'Shiitake-Miso', 'Pilz-Kombucha'] },
      ],
    },
    {
      id: 'grillen', label: 'GRILLEN', icon: '♨️', level: 1,
      description: 'Direkte Hitze konzentriert das Umami und gibt Röst- und Rauchnoten.',
      inspiration: 'Große Hüte ganz lassen, marinieren vor dem Grillen',
      children: [
        { id: 'gr-portobello', label: 'Ganze Hüte', level: 2, dishes: ['Gegrillter Portobello (Burger-Patty)', 'Gegrillte Steinpilze'] },
        { id: 'gr-spiess',     label: 'Spieße',      level: 2, dishes: ['Pilz-Gemüse-Spieße', 'Yakitori-Pilze'] },
      ],
    },
    {
      id: 'frittieren', label: 'FRITTIEREN', icon: '✨', level: 1,
      description: 'Ein knuspriger Teigmantel kontrastiert mit dem saftig-fleischigen Pilzkern.',
      inspiration: 'Tempura-Teig, sehr heißes Öl, sofort servieren',
      children: [
        { id: 'fr-tempura', label: 'Tempura', level: 2, dishes: ['Shiitake-Tempura', 'Austernpilz-Tempura'] },
        { id: 'fr-paniert', label: 'Paniert',  level: 2, dishes: ['Frittierte Champignons', 'Pilz-Nuggets'] },
      ],
    },
  ],
};
