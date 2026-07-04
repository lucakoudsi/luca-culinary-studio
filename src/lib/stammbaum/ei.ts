import type { TreeNodeData } from './types';

export const EI: TreeNodeData = {
  id: 'root',
  label: 'EI',
  subtitle: 'Gallus gallus domesticus · Das universelle Protein',
  level: 0,
  description:
    'Das Ei ist eines der vielseitigsten Lebensmittel überhaupt – Bindemittel, Emulgator, Triebmittel und eigenständiges Gericht zugleich.',
  children: [
    {
      id: 'kochen', label: 'KOCHEN', icon: '🫧', level: 1,
      description: 'Die Garzeit in heißem Wasser entscheidet über die Dottertextur – von fließend bis fest.',
      inspiration: 'Temperaturgenauigkeit, aromatisierte Bäder',
      children: [
        { id: 'k-weich', label: 'Weich',      level: 2, dishes: ['Frühstücksei', 'Dippered Soldiers'] },
        { id: 'k-wachs', label: 'Wachsweich', level: 2, dishes: ['Ramen-Ei', 'Onsen-Ei', 'Bibimbap-Ei'] },
        { id: 'k-hart',  label: 'Hart',       level: 2, dishes: ['Deviled Eggs', 'Eiersalat', 'Scotch Egg'] },
      ],
    },
    {
      id: 'braten', label: 'BRATEN', icon: '🥘', level: 1,
      description: 'Heißes Fett – von der glasigen Weißen bis zur goldenen Kruste.',
      inspiration: 'Butter, Kräuteröl, Schmalz, Temperaturgefühl',
      children: [
        { id: 'br-spiegel',  label: 'Spiegelei',  level: 2, dishes: ['Sunny Side Up', 'Over Easy', 'Over Hard'] },
        { id: 'br-ruehr',    label: 'Rührei',     level: 2, dishes: ['Scrambled Eggs', 'Baveuse (französisch)'] },
        { id: 'br-omelette', label: 'Omelette',   level: 2, dishes: ['Omelette farci', 'Frittata', 'Tortilla Española'] },
      ],
    },
    {
      id: 'pochieren', label: 'POCHIEREN', icon: '💧', level: 1,
      description: 'Sanftes Garen ohne Hülle – braucht frische Eier und einen Essigsud.',
      inspiration: 'Essigsud, frische Eier, Wasserwirbel',
      children: [
        { id: 'p-klass', label: 'Klassisch',    level: 2, dishes: ['Eggs Benedict', 'Eggs Florentine', 'Shakshuka'] },
        { id: 'p-court', label: 'Im Weinsud',   level: 2, dishes: ['Œufs en meurette', 'Pochiert in Kräutersud'] },
      ],
    },
    {
      id: 'backen', label: 'BACKEN', icon: '🔥', level: 1,
      description: 'Im Ofen nutzt das Ei Bindefähigkeit, Struktur und Luftigkeit zugleich.',
      inspiration: 'Temperaturkontrolle, Bain-Marie',
      children: [
        { id: 'ba-cremes',  label: 'Crèmes',      level: 2, dishes: ['Crème brûlée', 'Crème caramel', 'Pot de crème'] },
        { id: 'ba-souffle', label: 'Soufflé',     level: 2, dishes: ['Käsesoufflé', 'Schokoladensoufflé', 'Grand Marnier Soufflé'] },
        { id: 'ba-quiche',  label: 'Tarte & Quiche', level: 2, dishes: ['Quiche Lorraine', 'Tarte à l\'oignon', 'Clafoutis'] },
      ],
    },
    {
      id: 'aufschlagen', label: 'AUFSCHLAGEN', icon: '✨', level: 1,
      description: 'Luft einschlagen – das Eiweiß zu Schnee oder das ganze Ei zur Masse.',
      inspiration: 'Sauberkeit, Zimmertemperatur, Stabilität',
      children: [
        { id: 'auf-baiser',  label: 'Eischnee', level: 2, dishes: ['Baiser', 'Pavlova', 'Macarons', 'Bombe Alaska'] },
        { id: 'auf-biskuit', label: 'Vollei',   level: 2, dishes: ['Biskuit', 'Génoise', 'Tiramisu-Löffelbiskuit'] },
      ],
    },
    {
      id: 'emulgieren', label: 'EMULGIEREN', icon: '🥣', level: 1,
      description: 'Lecithin im Eidotter bindet Öl und Wasser zu stabilen Saucen und Cremes.',
      inspiration: 'Frische Eier, Säure, Temperaturkontrolle',
      children: [
        { id: 'em-kalt', label: 'Kalt',  level: 2, dishes: ['Mayonnaise', 'Aioli', 'Caesar Dressing', 'Remoulade'] },
        { id: 'em-warm', label: 'Warm',  level: 2, dishes: ['Hollandaise', 'Béarnaise', 'Sabayon', 'Crème Anglaise'] },
      ],
    },
    {
      id: 'einlegen', label: 'EINLEGEN', icon: '🫙', level: 1,
      description: 'Essig, Salz und Zeit konservieren und verwandeln das Ei in neue Formen.',
      inspiration: 'Geduld, Salzbäder, alkalische Prozesse',
      children: [
        { id: 'ei-essig',    label: 'Essig-Pickles', level: 2, dishes: ['Pickled Eggs (britisch)', 'Rote-Bete-Ei'] },
        { id: 'ei-hundert',  label: 'Alkalisch',     level: 2, dishes: ['Century Egg (Pidan)', 'Laugen-Ei'] },
      ],
    },
    {
      id: 'frittieren', label: 'FRITTIEREN', icon: '✨', level: 1,
      description: 'Heißes Fett umhüllt das Ei mit einer knusprigen Kruste – innen bleibt es cremig weich.',
      inspiration: 'Panade, kurze Garzeit, hohe Temperatur',
      children: [
        { id: 'fr-scotch',  label: 'Paniert',            level: 2, dishes: ['Scotch Egg', 'Frittiertes Wachtelei'] },
        { id: 'fr-spiegel', label: 'Frittiertes Spiegelei', level: 2, dishes: ['Huevo frito (spanisch)', 'Crispy Fried Egg (asiatisch)'] },
      ],
    },
  ],
};
