import type { CreativeResult, GeneratedMenu } from '@/types';

// ─── Mock Kreativlabor Generator ──────────────────────────────────────────────
type CreativeInput = { ingredients: string; style: string; requirements: string };

const styleMap: Record<string, { concept: string; techniques: string[] }> = {
  'Modern': {
    concept: 'Dekonstruierter Klassiker mit modernem Fokus auf Texturen und Temperaturkontrasten.',
    techniques: ['Sous-vide Garen', 'Siphon-Espuma', 'Gel-Einschluss', 'Vakuum-Marinade'],
  },
  'Fine Dining': {
    concept: 'Elegantes Gericht mit präziser Technik, fokussiertem Geschmack und minimalistischer Ästhetik.',
    techniques: ['Sous-vide', 'Beurre blanc', 'Reduktion', 'Pacojet-Eis', 'Temperierung'],
  },
  'Fusion': {
    concept: 'Interkulturelle Brücke zwischen klassischer europäischer Technik und asiatischer Aromenwelt.',
    techniques: ['Dashi-Extraktion', 'Koji-Fermentation', 'Tataki-Methode', 'Miso-Glasur'],
  },
  'Klassisch': {
    concept: 'Ehrliche Küche, die den Charakter der Hauptzutat ins Zentrum stellt ohne Ablenkung.',
    techniques: ['Poêlieren', 'Glasieren', 'Fond-Reduktion', 'Beurre noisette', 'Flambieren'],
  },
  'Vegetarisch': {
    concept: 'Pflanzenbasiertes Gericht, das Umami, Textur und Tiefe durch rein vegetarische Mittel erzeugt.',
    techniques: ['Rösten', 'Fermentieren', 'Miso-Marinade', 'Kombu-Dashi', 'Karamellisieren'],
  },
  'Avantgarde': {
    concept: 'Konzeptionelles Gericht, das kulinarische Erwartungen hinterfragt und neue Wahrnehmungen öffnet.',
    techniques: ['Sphärifikation', 'Flüssig-Stickstoff', 'Transglutaminase', 'Zentrifuge', 'Rauchinjektion'],
  },
};

const platingTemplates = [
  'Hauptkomponente links platzieren, Sauce als geschwungene Linie gegenüber. Garnitur auf 12-Uhr-Position setzen.',
  'Kreisförmige Anordnung um einen Mittelpunkt. Sauce darunter aufgießen. Finish: frische Kräuter und Meersalzflocken.',
  'Freies, organisches Arrangement. Hauptelement groß, Kontraste durch Farbe und Höhe erzeugen.',
  'Lineares Setup. Drei Texturen nebeneinander, Sauce als Punkt-Reihe. Microgreens als Höhenakzent.',
];

function capitalize(s: string) { return s.charAt(0).toUpperCase() + s.slice(1); }

export function generateCreativeResult(input: CreativeInput): Omit<CreativeResult, 'id' | 'generatedAt' | 'saved'> {
  const ingredientList = input.ingredients.split(',').map(s => s.trim()).filter(Boolean);
  const style = input.style || 'Modern';
  const template = styleMap[style] || styleMap['Modern'];
  const mainIngredient = ingredientList[0] || 'Saisongemüse';

  const nameVariants = [
    `${capitalize(mainIngredient)} – ${style}e Interpretation`,
    `Essenz von ${capitalize(mainIngredient)}`,
    `${capitalize(mainIngredient)} in drei Texturen`,
    `${capitalize(mainIngredient)} & ${ingredientList[1] || 'Saison'}`,
  ];

  return {
    name: nameVariants[ingredientList.length % nameVariants.length],
    concept: `${template.concept}${input.requirements ? ` Besondere Anforderung: ${input.requirements}.` : ''}`,
    inputStyle: style,
    ingredients: ingredientList.map((name, i) => ({
      name: capitalize(name),
      amount: i === 0 ? '120–160g p.P.' : i === 1 ? '60–80g p.P.' : '20–40g p.P.',
      note: i === 0 ? 'Hauptkomponente – Premiumqualität wählen' : i === 1 ? 'Kontrast-Element' : 'Garnitur / Finish',
    })),
    techniques: template.techniques.slice(0, 4),
    preparation: [
      `${capitalize(mainIngredient)} parieren und auf Gleichmäßigkeit prüfen. Vakuumieren mit 30g Butter und 2 Thymianzweigen.`,
      `Sous-vide: 58°C / 45 min. Anschließend aus dem Beutel nehmen, Oberfläche trockentupfen.`,
      ingredientList[1] ? `${capitalize(ingredientList[1])} schälen, würfeln (5mm Brunoise). In Nussbutter 2 min sautieren, mit Salz und Zitronenabrieb abschmecken.` : 'Beilage vorbereiten und separat warmhalten.',
      `Fond auf 1/3 reduzieren, mit kalter Butter montieren bis zur sämigen Konsistenz (Nappe-Punkt). Mit Salz abschmecken, warm halten.`,
      `Kurz vor dem Service: Hauptkomponente in Nussbutter scharf anflammen. Sauce aufschäumen. Anrichten und sofort servieren.`,
    ],
    plating: platingTemplates[ingredientList.length % platingTemplates.length],
  };
}

// ─── Mock Menügenerator ───────────────────────────────────────────────────────
type MenuInput = { region: string; season: string; style: string; courses: number };

const courseTypes: Record<number, string[]> = {
  3: ['Vorspeise', 'Hauptgang', 'Dessert'],
  4: ['Amuse-Bouche', 'Vorspeise', 'Hauptgang', 'Dessert'],
  5: ['Amuse-Bouche', 'Vorspeise', 'Zwischengang', 'Hauptgang', 'Dessert'],
  6: ['Amuse-Bouche', 'Kalte Vorspeise', 'Warme Vorspeise', 'Zwischengang', 'Hauptgang', 'Dessert'],
  7: ['Amuse-Bouche', 'Kalte Vorspeise', 'Warme Vorspeise', 'Sorbet', 'Hauptgang', 'Käse', 'Dessert'],
};

const menuTemplates: Record<string, Record<string, { dishes: string[]; descriptions: string[]; wines: string[]; wineNotes: string[] }>> = {
  Frühling: {
    'Fine Dining': {
      dishes: ['Bärlauch-Espuma / Forelle / Roggen-Cracker', 'Weißer Spargel / Morcheln / Trüffel-Nage', 'Jacobsmuschel / Erbsen / Bergamotte-Schaum', 'Yuzu-Sorbet / Minze', 'Lammrücken / Bärlauch-Jus / Artischocke', 'Chèvre affiné / Bienenhonig / Walnuss-Pain', 'Rhabarber / Vanille / Joghurt-Eis'],
      descriptions: ['Aromatische Einleitung mit Waldcharakter', 'Frühlingsklassiker in elegantem Gewand', 'Meeresfrüchte mit grüner Frische und Zitrusnote', 'Erfrischende Zwischenstation mit Bitternoten', 'Herzstück des Menüs – kraftvoll und präzise', 'Reifer Ziegenkäse als ruhige Reflexion', 'Leichter, säuerlicher Abschluss mit Nostalgie'],
      wines: ['Champagne Blanc de Blancs', 'Burgundy Blanc Premier Cru', 'Mosel Riesling Spätlese', 'Gewürztraminer Vendange Tardive', 'Barolo Riserva', 'Sauternes', 'Crémant d\'Alsace Rosé Demi-Sec'],
      wineNotes: ['Kalk und Brioche', 'Mineralität und Kraft', 'Apfelblüte und Schiefer', 'Litschi und Rosen – Intermezzo', 'Tannin trifft Wildkräuter', 'Botrytisnoten und Aprikose', 'Frische Beeren und Mousse'],
    },
    'Klassisch': {
      dishes: ['Spargel-Cremesuppe / Kerbel-Öl', 'Lachstatar / Gurke / Dill', 'Kalbsbäckchen / Morcheln / Pommes Dauphines', 'Erdbeere / Quark-Eis / Basilikum'],
      descriptions: ['Sanfte Begrüßung mit Kräuterfinesse', 'Frischer Zwischengang mit Säure', 'Der Hauptakt: Schmorkultur trifft Frühlingswald', 'Fruchtiger Abschluss mit Überraschungsmoment'],
      wines: ['Chablis Premier Cru', 'Sancerre Blanc', 'Pinot Noir Burgund', 'Moscato d\'Asti'],
      wineNotes: ['Austerkalk und Frische', 'Sauvignon mit Loire-Eleganz', 'Erdbeere und feines Tannin', 'Perlend süß und leicht'],
    },
  },
  Sommer: {
    'Fine Dining': {
      dishes: ['Gazpacho-Espuma / Kaviar / Basilikum-Öl', 'Thunfisch-Tartare / Avocado / Sesam-Tuile', 'Steinbutt / Zucchini / Beurre blanc', 'Passionsfrucht-Granita', 'Milchlamm / Tomatenjus / Auberginen-Confit', 'Brie de Meaux / Honig / Feige', 'Mango-Soufflé / Kokos-Eis / Lime'],
      descriptions: ['Erfrischende Eröffnung mit Meerestiefe', 'Japanisch inspirierter Zwischengang', 'Edler Plattfisch in klassischem Gewand', 'Tropischer Kontrapunkt', 'Zartes Lamm in mediterranem Stil', 'Würzig-süßer Ruhepunkt', 'Tropischer Hochpunkt'],
      wines: ['Grüner Veltliner Smaragd', 'Junmai Daiginjo Sake', 'Puligny-Montrachet', 'Elqui Valley Muscat', 'Châteauneuf-du-Pape', 'Sauternes', 'Jurançon Moelleux'],
      wineNotes: ['Pfeffer und Mineralität', 'Rein und präzise', 'Buttercrème und Eleganz', 'Blütenduft und Süße', 'Garrigue und Kraft', 'Gold und Honig', 'Ananas und Frische'],
    },
    'Modern': {
      dishes: ['Wassermelonen-Gazpacho / Feta-Gel / Minze-Öl', 'Burrata / Erbsen-Pesto / Tomaten-Konfit', 'Steinbutt / Pfifferlinge / Beurre blanc', 'Himbeere-Sorbet', 'Lammkarree / Tapenade / Ratatouille-Espuma', 'Mousse au Chocolat / Passionsfrucht / Karamell'],
      descriptions: ['Sommerkick mit Süße und Frische', 'Grüne Energie auf weißem Porzellan', 'Klassiker mit Sommer-Twist', 'Säurebrücke', 'Mediterrane Aromenwelt', 'Intensiver Abschluss'],
      wines: ['Provençal Rosé', 'Vermentino di Gallura', 'White Burgundy', 'Crémant Rosé', 'Southern Rhône Blend', 'Pedro Ximénez'],
      wineNotes: ['Provence am Tisch', 'Salzig und mineralisch', 'Cremige Eleganz', 'Erdbeer-Mousse', 'Tiefe und Garrigue', 'Dattel und Schokolade'],
    },
  },
  Herbst: {
    'Fine Dining': {
      dishes: ['Maronenschaum / Schwarzer Trüffel / Brioche', 'Foie Gras mi-cuit / Quitte / Haselnuss-Praline', 'Kürbis-Cappuccino / Ingwer-Schaum', 'Calvados-Granita', 'Rehrücken / Waldpilze / Preiselbeerjus', 'Époisses affiné / Walnuss-Brot', 'Schokoladen-Fondant / Karamell-Eis / Salz-Karamell'],
      descriptions: ['Waldaromen als Ouvertüre', 'Luxuriöser Zwischengang mit Fruchtspannung', 'Cremige Reflexion des Herbstes', 'Calvados-Pause', 'Wild in der Hauptrolle', 'Käsemoment als Übergang', 'Warmer Abschluss mit Tiefe'],
      wines: ['Champagne Blanc de Noirs', 'Sauternes', 'Grauburgunder Auslese', 'Calvados VSOP', 'Pomerol', 'Banyuls Rimage', 'Maury Vintage'],
      wineNotes: ['Rote Frucht und Brioche', 'Botrytisgold', 'Birne und Rauch', 'Apfel und Toast', 'Merlot-Seide', 'Trockenfrüchte', 'Wärme und Schokolade'],
    },
    'Fusion': {
      dishes: ['Dashi-Brühe / Rote Bete-Gel / Sakura-Kresse', 'Tuna Tataki / Topinambur / Yuzu-Ponzu', 'Waldpilze / Miso-Butter / Soba-Erde', 'Yuzu-Sorbet', 'Wagyu Flat Iron / Shiitake-Dashi / Daikon', 'Sake-Crème Caramel / Miso-Karamell'],
      descriptions: ['Stille und Tiefe im ersten Schluck', 'Atlantik trifft Japan', 'Wald in Japanisch', 'Frische Pause', 'Kraftstück mit asiatischer Seele', 'Süßer Bogen über zwei Kulturen'],
      wines: ['Junmai Ginjo Sake', 'Albariño', 'Grüner Veltliner', 'Sake Nigori', 'Barolo', 'Tokaji Aszú 5 Puttonyos'],
      wineNotes: ['Rein und fruchtig', 'Atlantik und Birne', 'Pfeffer und Frische', 'Cremig und trüb', 'Kraft und Teer', 'Aprikose und Honig'],
    },
  },
  Winter: {
    'Fine Dining': {
      dishes: ['Beluga-Kaviar / Crème fraîche / Blini', 'Hummer-Bisque / Noilly Prat / Korallenschaum', 'Jakobsmuschel / Schwarze Trüffel / Kartoffel-Espuma', 'Champagner-Granita', 'Rinderfilet Wellington / Périgueux-Sauce', 'Comté 36 Monate / Nusshonig / Feige getrocknet', 'Fondant au Chocolat Noir / Fleur de Sel / Vanilleeis'],
      descriptions: ['Luxus im ersten Bissen', 'Schmelzend und tief', 'Trüffel-Moment des Abends', 'Prickelnde Reflexion', 'Klassiker in Vollendung', 'Käse als Kunstform', 'Der dunkle Abschluss'],
      wines: ['Bollinger RD', 'Hermitage Blanc', 'Meursault Charmes 1er Cru', 'Pol Roger Blanc de Blancs', 'Pétrus', 'Château d\'Yquem', 'Taylor Fladgate 20yr Tawny'],
      wineNotes: ['Tiefe und Alter', 'Weiße Blüte und Stein', 'Butter und Minerale', 'Eleganz pur', 'Opulenz und Plüsch', 'Unsterblichkeit im Glas', 'Trockenfrüchte und Nuss'],
    },
  },
};

export function generateMenu(input: MenuInput): Omit<GeneratedMenu, 'id' | 'createdAt' | 'saved'> {
  const n = Math.min(Math.max(input.courses, 3), 7);
  const types = courseTypes[n] || courseTypes[5];
  const seasonTemplates = menuTemplates[input.season] || menuTemplates['Herbst'];
  const template = seasonTemplates[input.style] || Object.values(seasonTemplates)[0];

  const courses = types.map((type, i) => ({
    position: i + 1,
    type,
    dish: template.dishes[i] || `Saisonales Gericht ${i + 1}`,
    description: template.descriptions[i] || 'Harmonisch eingebetteter Gang mit Saisonbezug.',
    wine: template.wines[i] || 'Offener Wein nach Wahl',
    wineNote: template.wineNotes[i] || '',
  }));

  return {
    name: `${input.region}er ${input.season}smenü – ${input.style}`,
    region: input.region,
    season: input.season,
    style: input.style,
    courses,
    overallNote: `Dieses ${n}-Gänge-Menü erzählt die Geschichte des ${input.season}s in ${input.region} durch ${input.style.toLowerCase()}e Küche. Die Weinbegleitung ist aufeinander abgestimmt und folgt dem Spannungsbogen von Frische und Leichtigkeit zu Komplexität und Wärme.`,
  };
}
