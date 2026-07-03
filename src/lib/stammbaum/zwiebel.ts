import type { TreeNodeData } from './types';

export const ZWIEBEL: TreeNodeData = {
  id: 'root',
  label: 'ZWIEBEL',
  subtitle: 'Allium cepa · Fundament jeder Küche',
  level: 0,
  description:
    'Selten als Hauptdarstellerin, immer als tragende Basis – die Zwiebel gibt jedem Gericht Tiefe, Süße und Körper.',
  children: [
    {
      id: 'roh', label: 'ROH', icon: '🌿', level: 1,
      description: 'Scharf, knackig, intensiv – roh entfaltet die Zwiebel ihre volle aromatische Kraft.',
      inspiration: 'Kurz marinieren mildert die Schärfe erheblich',
      children: [
        { id: 'r-ringe',    label: 'Ringe',       level: 2, dishes: ['Zwiebelringe im Salat', 'Burger-Belag', 'Döner'] },
        { id: 'r-fein',     label: 'Fein gehackt', level: 2, dishes: ['Vinaigrette-Basis', 'Tartare-Garnish', 'Ceviche'] },
        { id: 'r-mariniert',label: 'Mariniert',   level: 2, dishes: ['Rote Zwiebel-Pickles', 'Schnell-Pickle für Tacos'] },
      ],
    },
    {
      id: 'glacieren', label: 'GLASIEREN', icon: '✨', level: 1,
      description: 'Sanftes Dünsten in Butter bis zur Transparenz – die Grundlage für unzählige Saucen.',
      inspiration: 'Niedrige Hitze, viel Zeit, Deckel halb auf',
      children: [
        { id: 'g-glasiert', label: 'Glasiert',     level: 2, dishes: ['Soffritto', 'Mirepoix', 'Trinité (fr. Küche)'] },
        { id: 'g-karamell', label: 'Karamellisiert', level: 2, dishes: ['Zwiebelsuppe gratinée', 'Tarte flambée', 'Onion Jam'] },
      ],
    },
    {
      id: 'braten', label: 'BRATEN', icon: '🥘', level: 1,
      description: 'Höhere Hitze erzeugt Röstaromen – von der goldenen Scheibe bis zum Knusperchip.',
      inspiration: 'Heiße Pfanne, nicht zu früh rühren',
      children: [
        { id: 'br-scheib', label: 'Scheiben',  level: 2, dishes: ['Röstzwiebeln', 'Lyonnaise Kartoffeln', 'Leberwurst-Beleg'] },
        { id: 'br-wuef',   label: 'Gewürfelt', level: 2, dishes: ['Pfannengericht-Basis', 'Curry-Ansatz', 'Reisbasis'] },
      ],
    },
    {
      id: 'frittieren', label: 'FRITTIEREN', icon: '🌟', level: 1,
      description: 'Heißes Fett macht die Zwiebel knusprig – als Belag und Beilage unschlagbar.',
      inspiration: 'Mehlieren oder Bierteig für Extra-Knusprigkeit',
      children: [
        { id: 'fr-ringe', label: 'Ringe', level: 2, dishes: ['Onion Rings', 'Crispy Onions (Belag)', 'Bloomin\' Onion'] },
        { id: 'fr-chips', label: 'Chips', level: 2, dishes: ['Frittierte Zwiebelchips', 'Biriyani-Topping', 'Dal-Topping'] },
      ],
    },
    {
      id: 'backen', label: 'BACKEN', icon: '🔥', level: 1,
      description: 'Im Ofen gart die Zwiebel zur Süße und entwickelt intensive Karamellnoten.',
      inspiration: 'Ganz backen für intensivstes Aroma',
      children: [
        { id: 'b-ganz',   label: 'Ganz',         level: 2, dishes: ['Ofenzwiebel', 'Gefüllte Zwiebel (Farci)'] },
        { id: 'b-kuchen', label: 'Kuchen & Tarte',level: 2, dishes: ['Schwäbischer Zwiebelkuchen', 'Tarte à l\'oignon'] },
      ],
    },
    {
      id: 'einlegen', label: 'EINLEGEN', icon: '🫙', level: 1,
      description: 'Säure und Salz konservieren die Zwiebel und machen sie zum vielseitigen Kondiment.',
      inspiration: 'Rote Zwiebeln für die schönste Farbe',
      children: [
        { id: 'ei-pickles', label: 'Essig-Pickles', level: 2, dishes: ['Rote Zwiebel-Pickle', 'Taco-Belag', 'Burger-Condiment'] },
        { id: 'ei-ferment', label: 'Fermentiert',   level: 2, dishes: ['Kimchi (Lauchzwiebel)', 'Brine-Pickles'] },
      ],
    },
    {
      id: 'trocknen', label: 'TROCKNEN', icon: '🌬️', level: 1,
      description: 'Getrocknet ist die Zwiebel ein konzentrierter Umami-Booster.',
      inspiration: 'Dörrautomat oder niedrige Ofentemperatur',
      children: [
        { id: 't-pulver', label: 'Pulver',      level: 2, dishes: ['Zwiebelmehl', 'Gewürzmischungen', 'Instant-Brühen'] },
        { id: 't-roest',  label: 'Röstzwiebeln',level: 2, dishes: ['Fertig-Rösti-Topping', 'Linsengericht', 'Döner-Belag'] },
      ],
    },
  ],
};
