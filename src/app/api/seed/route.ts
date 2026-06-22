import { NextResponse } from 'next/server';
import { getDatabaseManager } from '@/lib/infra/db';

const rezepte = [
  { title: 'Schwarzwälder Kirsch-Tartar', category: 'Vorspeise', tags: ['Fingerfood', 'Modern', 'Sommer'], difficulty: 'Mittel', time: 45, season: 'Sommer', status: 'Fertig', rating: 5, image: null, description: 'Zartes Rinderfilet-Tartar mit eingelegten Kirschen, Walnuss-Crumble und Sauerrahm-Espuma.', lastEdited: '2026-06-15', views: 142 },
  { title: 'Wildkräuter-Velouté mit Hühnerei-Confit', category: 'Suppe', tags: ['Klassisch', 'Frühling', 'Vegetarisch'], difficulty: 'Leicht', time: 30, season: 'Frühling', status: 'In Bearbeitung', rating: 4, image: null, description: 'Samtweiche Kräutersuppe aus frischen Wildkräutern mit einem sous-vide gegarten Eigelb.', lastEdited: '2026-06-10', views: 89 },
  { title: 'Kalbsbäckchen, Morcheln & Spargel', category: 'Hauptgang', tags: ['Fine Dining', 'Frühling', 'Klassisch'], difficulty: 'Schwer', time: 240, season: 'Frühling', status: 'Fertig', rating: 5, image: null, description: 'Geschmorte Kalbsbäckchen mit Morcheln, weißem Spargel und einer reduzierten Kalbsjus.', lastEdited: '2026-06-08', views: 310 },
  { title: 'Miso-Crème Brûlée mit Sesam-Praline', category: 'Dessert', tags: ['Fusion', 'Umami', 'Herbst'], difficulty: 'Mittel', time: 90, season: 'Herbst', status: 'Entwurf', rating: 4, image: null, description: 'Klassische Crème Brûlée mit weißem Miso verfeinert, dazu karamellisierte Sesam-Praline.', lastEdited: '2026-06-01', views: 67 },
  { title: 'Lachs, Gurke & Dill-Öl', category: 'Hauptgang', tags: ['Modern', 'Sommer', 'Leicht'], difficulty: 'Mittel', time: 60, season: 'Sommer', status: 'Fertig', rating: 4, image: null, description: 'Sous-vide gegarter Lachs mit frischer Gurkenmousse und aromatischem Dill-Öl.', lastEdited: '2026-05-28', views: 198 },
  { title: 'Herbstlicher Kürbis-Cappuccino', category: 'Suppe', tags: ['Herbst', 'Vegetarisch', 'Comfort'], difficulty: 'Leicht', time: 40, season: 'Herbst', status: 'Fertig', rating: 3, image: null, description: 'Cremige Kürbissuppe serviert wie ein Cappuccino mit Ingwerschaum und Kürbiskernöl.', lastEdited: '2026-05-20', views: 124 },
];

const zutaten = [
  { name: 'Weißer Spargel', category: 'Gemüse', seasons: ['Frühling'], origin: 'Deutschland', aromas: ['Nussig', 'Mild', 'Erdig'], flavor: { acidity: 1, sweetness: 2, bitterness: 2, umami: 2, spiciness: 0, saltiness: 0 }, pairings: ['Butter', 'Parmesan', 'Morcheln', 'Hollandaise', 'Schinken'], description: 'Delikater Frühlingsklassiker mit zartem Aroma und feiner Süße. Muss frisch verarbeitet werden.', storageTemp: '0–2°C', unit: 'Stück' },
  { name: 'Schwarze Trüffel', category: 'Pilze', seasons: ['Winter'], origin: 'Périgord, Frankreich', aromas: ['Muschig', 'Erdig', 'Intensiv', 'Komplex'], flavor: { acidity: 0, sweetness: 1, bitterness: 1, umami: 5, spiciness: 0, saltiness: 1 }, pairings: ['Ei', 'Pasta', 'Kartoffel', 'Foie Gras', 'Butter'], description: 'Das schwarze Gold der Küche – intensiver Umami-Träger mit einzigartiger Aromatik.', storageTemp: '2–4°C', unit: 'Gramm' },
  { name: 'Pfifferling', category: 'Pilze', seasons: ['Sommer', 'Herbst'], origin: 'Europa', aromas: ['Pfeffrig', 'Fruchtig', 'Nussig'], flavor: { acidity: 1, sweetness: 2, bitterness: 1, umami: 3, spiciness: 2, saltiness: 0 }, pairings: ['Rahm', 'Petersilie', 'Ei', 'Wild', 'Speck'], description: 'Sommerlicher Wildpilz mit charakteristischem pfeffrigem Aroma und Goldgelbe.', storageTemp: '4–6°C', unit: 'Gramm' },
  { name: 'Morchel', category: 'Pilze', seasons: ['Frühling'], origin: 'Europa, Nordamerika', aromas: ['Nussig', 'Rauchig', 'Erdig'], flavor: { acidity: 0, sweetness: 1, bitterness: 1, umami: 4, spiciness: 0, saltiness: 0 }, pairings: ['Rahm', 'Kalbfleisch', 'Butter', 'Spargel', 'Vin Jaune'], description: 'Seltener Frühjahrspilz mit tiefem Umami-Profil. Essentiell für klassische Küche.', storageTemp: '2–4°C', unit: 'Gramm' },
  { name: 'Jakobsmuschel', category: 'Fisch & Meeresfrüchte', seasons: ['Herbst', 'Winter', 'Frühling'], origin: 'Atlantik', aromas: ['Salzig', 'Süßlich', 'Meeresfrisch'], flavor: { acidity: 1, sweetness: 3, bitterness: 0, umami: 4, spiciness: 0, saltiness: 2 }, pairings: ['Blumenkohl', 'Trüffel', 'Erbsen', 'Haselnuss', 'Yuzu'], description: 'Edles Produkt mit natürlicher Süße. Kurz anbraten für perfekte Karamellisierung.', storageTemp: '0–2°C', unit: 'Stück' },
  { name: 'Steinbutt', category: 'Fisch & Meeresfrüchte', seasons: ['Ganzjährig'], origin: 'Nordsee', aromas: ['Mild', 'Nussig', 'Meereswürze'], flavor: { acidity: 0, sweetness: 1, bitterness: 0, umami: 3, spiciness: 0, saltiness: 2 }, pairings: ['Champagner', 'Kaviar', 'Butter', 'Kapern', 'Zitrone'], description: 'Der König der Flachfische – festes Fleisch, dezentes Aroma, ideal für Spitzengastronomie.', storageTemp: '0–2°C', unit: 'Gramm' },
  { name: 'Rote Bete', category: 'Gemüse', seasons: ['Herbst', 'Winter'], origin: 'Europa', aromas: ['Erdig', 'Süßlich', 'Mineralisch'], flavor: { acidity: 1, sweetness: 4, bitterness: 1, umami: 1, spiciness: 0, saltiness: 0 }, pairings: ['Ziegenkäse', 'Meerrettich', 'Orange', 'Walnuss', 'Balsamico'], description: 'Vielseitiges Wintergemüse mit intensiver Farbe und natürlicher Süße.', storageTemp: '0–4°C', unit: 'Stück' },
  { name: 'Bärlauch', category: 'Kräuter & Gewürze', seasons: ['Frühling'], origin: 'Europa, Asien', aromas: ['Knoblauch', 'Grün', 'Frisch', 'Würzig'], flavor: { acidity: 1, sweetness: 0, bitterness: 2, umami: 2, spiciness: 3, saltiness: 0 }, pairings: ['Ricotta', 'Pasta', 'Lamm', 'Butter', 'Kartoffel'], description: 'Wildes Frühlingsgewürz mit intensivem Knoblauch-Profil. Frisch nur kurz erhitzen.', storageTemp: '4–6°C', unit: 'Gramm' },
  { name: 'Yuzu', category: 'Obst', seasons: ['Winter'], origin: 'Japan, Korea', aromas: ['Zitrus', 'Blumig', 'Komplex', 'Bergamotte'], flavor: { acidity: 5, sweetness: 1, bitterness: 2, umami: 0, spiciness: 0, saltiness: 0 }, pairings: ['Lachs', 'Jakobsmuschel', 'Schokolade', 'Ingwer', 'Kaviar'], description: 'Japanische Zitrusfrucht mit einzigartiger Aromatik – teuer und einzigartig.', storageTemp: '6–8°C', unit: 'Gramm' },
  { name: 'Lammrücken', category: 'Fleisch', seasons: ['Frühling', 'Sommer'], origin: 'Europa', aromas: ['Wildwürzig', 'Zart', 'Fettig'], flavor: { acidity: 0, sweetness: 1, bitterness: 0, umami: 4, spiciness: 0, saltiness: 1 }, pairings: ['Rosmarin', 'Thymian', 'Aubergine', 'Oliven', 'Minze'], description: 'Delikates Fleisch mit charakteristischem Aroma. Medium-rare für optimale Textur.', storageTemp: '0–2°C', unit: 'Gramm' },
  { name: 'Foie Gras', category: 'Fleisch', seasons: ['Herbst', 'Winter'], origin: 'Frankreich', aromas: ['Buttrig', 'Nussig', 'Reichhaltig'], flavor: { acidity: 0, sweetness: 2, bitterness: 0, umami: 5, spiciness: 0, saltiness: 1 }, pairings: ['Sauternes', 'Feige', 'Brioche', 'Trüffel', 'Apfel'], description: 'Luxusprodukt mit buttrigem Schmelz und intensivem Umami. Kalt oder scharf angebraten.', storageTemp: '0–2°C', unit: 'Gramm' },
  { name: 'Kürbis (Hokaido)', category: 'Gemüse', seasons: ['Herbst'], origin: 'Japan', aromas: ['Nussig', 'Süßlich', 'Karamell'], flavor: { acidity: 0, sweetness: 4, bitterness: 1, umami: 1, spiciness: 0, saltiness: 0 }, pairings: ['Ingwer', 'Kokosmilch', 'Zimt', 'Salbei', 'Parmesan'], description: 'Mit Schale verwendbarer Kürbis mit intensiv nussigem, süßlichem Aroma.', storageTemp: '10–15°C', unit: 'Gramm' },
  { name: 'Miso (Weiß)', category: 'Fermentiertes', seasons: ['Ganzjährig'], origin: 'Japan', aromas: ['Süßlich', 'Mild', 'Fermentiert'], flavor: { acidity: 1, sweetness: 3, bitterness: 0, umami: 5, spiciness: 0, saltiness: 3 }, pairings: ['Butter', 'Fisch', 'Gemüse', 'Schokolade', 'Karamell'], description: 'Mild fermentierte Sojapaste – vielseitiger Umami-Verstärker für Saucen und Marinaden.', storageTemp: '4–6°C', unit: 'Gramm' },
  { name: 'Bergkäse (24 Monate)', category: 'Milchprodukte', seasons: ['Ganzjährig'], origin: 'Allgäu, Deutschland', aromas: ['Würzig', 'Nussig', 'Karamell', 'Komplex'], flavor: { acidity: 2, sweetness: 2, bitterness: 1, umami: 4, spiciness: 0, saltiness: 3 }, pairings: ['Birne', 'Honig', 'Walnuss', 'Prosciutto', 'Rotwein'], description: 'Gereifter Almkäse mit Kristallstruktur und tiefer Aromatik. Komplex und ausgewogen.', storageTemp: '8–12°C', unit: 'Gramm' },
  { name: 'Sakura-Kresse', category: 'Kräuter & Gewürze', seasons: ['Ganzjährig'], origin: 'Japan / Kultiviert', aromas: ['Senfartig', 'Scharf', 'Frisch'], flavor: { acidity: 1, sweetness: 0, bitterness: 2, umami: 1, spiciness: 4, saltiness: 0 }, pairings: ['Sashimi', 'Jakobsmuschel', 'Tartare', 'Foie Gras', 'Lachs'], description: 'Dekorative Microgreens mit intensiver Schärfe. Klassisches Fine-Dining-Finish-Element.', storageTemp: '4–6°C', unit: 'Gramm' },
  { name: 'Passionsfrucht', category: 'Obst', seasons: ['Sommer', 'Herbst'], origin: 'Südamerika, Kenia', aromas: ['Tropisch', 'Säuerlich', 'Blumig', 'Exotisch'], flavor: { acidity: 4, sweetness: 3, bitterness: 1, umami: 0, spiciness: 0, saltiness: 0 }, pairings: ['Mango', 'Kokos', 'Schokolade', 'Vanille', 'Karamell'], description: 'Intensiv aromatische Tropenfrucht für Desserts und Saucen. Frisch unersetzlich.', storageTemp: '8–12°C', unit: 'Stück' },
  { name: 'Rosmarin', category: 'Kräuter & Gewürze', seasons: ['Ganzjährig'], origin: 'Mittelmeer', aromas: ['Harzartig', 'Kiefernnadel', 'Würzig'], flavor: { acidity: 0, sweetness: 0, bitterness: 3, umami: 1, spiciness: 2, saltiness: 0 }, pairings: ['Lamm', 'Kartoffel', 'Knoblauch', 'Olivenöl', 'Zitrone'], description: 'Mediterranes Würzkraut mit intensivem Harzaroma. Sparsam dosieren.', storageTemp: '6–8°C', unit: 'Gramm' },
  { name: 'Kaviar (Beluga)', category: 'Fisch & Meeresfrüchte', seasons: ['Herbst', 'Winter'], origin: 'Kaspisches Meer', aromas: ['Salzig', 'Buttrig', 'Jodiert', 'Nussig'], flavor: { acidity: 0, sweetness: 0, bitterness: 0, umami: 5, spiciness: 0, saltiness: 5 }, pairings: ['Crème fraîche', 'Blini', 'Ei', 'Champagner', 'Butter'], description: 'Ultraluxuriöser Umami-Träger. Nie erhitzen – immer kalt auf Perlmutt servieren.', storageTemp: '0–2°C', unit: 'Gramm' },
  { name: 'Topinambur', category: 'Gemüse', seasons: ['Herbst', 'Winter'], origin: 'Nordamerika', aromas: ['Nussig', 'Artischockenartig', 'Süßlich'], flavor: { acidity: 0, sweetness: 3, bitterness: 1, umami: 2, spiciness: 0, saltiness: 0 }, pairings: ['Haselnuss', 'Trüffel', 'Räucherfisch', 'Thymian', 'Parmesan'], description: 'Unterschätztes Wintergemüse mit nuttigem Artischocken-Profil.', storageTemp: '0–4°C', unit: 'Gramm' },
  { name: 'Shio Koji', category: 'Fermentiertes', seasons: ['Ganzjährig'], origin: 'Japan', aromas: ['Mild', 'Umami', 'Fermentiert', 'Süßlich'], flavor: { acidity: 1, sweetness: 2, bitterness: 0, umami: 4, spiciness: 0, saltiness: 3 }, pairings: ['Fleisch', 'Fisch', 'Gemüse', 'Butter', 'Ei'], description: 'Universelles Ferment aus Koji-Reis – natürlicher Umami-Booster und Marinade-Basis.', storageTemp: '4–6°C', unit: 'Gramm' },
];

const ideen = [
  { text: 'Fermentierter Knoblauch als Basis für eine neue Vinaigrette', tag: 'Fermentation', date: '2026-06-16' },
  { text: 'Dessert mit lokalen Bienen-Pollen und Kastanienhonig', tag: 'Dessert', date: '2026-06-14' },
  { text: 'Rote Bete Tataki – japanische Technik, regionale Zutaten', tag: 'Fusion', date: '2026-06-12' },
  { text: 'Wildkräuter-Butter-Reihe für den Herbst', tag: 'Fermentation', date: '2026-06-10' },
];

// recipeIds werden nach Insert aufgelöst (Rezepte 1–6 in Reihenfolge)
const projekte = [
  {
    name: 'Frühlingsmenü 2026',
    description: 'Siebengängiges Menü für das Pop-up-Dinner im April. Fokus auf Spargel, Morcheln und Wildkräuter.',
    color: '#7CB87A', createdAt: '2026-03-01', status: 'Aktiv',
    recipeIds: [2, 3], menuIds: [],
    notes: [
      { id: 1, text: 'Amuse-Bouche noch nicht finalisiert – Idee: Bärlauch-Espuma auf Kartoffelchip.', date: '2026-03-15' },
      { id: 2, text: 'Weinbegleitung: Weingut Huber kontaktiert für Zusammenarbeit.', date: '2026-04-02' },
    ],
  },
  {
    name: 'Fermentations-Kollektion',
    description: 'Entwicklung einer Serie von 5 Gerichten basierend auf hausgemachten Fermenten.',
    color: '#C9A84C', createdAt: '2026-04-10', status: 'Aktiv',
    recipeIds: [4], menuIds: [],
    notes: [
      { id: 3, text: 'Shio Koji-Experiment mit Steinbutt ergab fantastische Textur nach 6h.', date: '2026-04-18' },
    ],
  },
  {
    name: 'Kochbuch Kapitel 3',
    description: 'Rezepte und Konzepte für das Kapitel „Sommer am Meer" im geplanten Kochbuch.',
    color: '#7BB8D4', createdAt: '2026-02-01', status: 'Pausiert',
    recipeIds: [1, 5], menuIds: [],
    notes: [],
  },
];

export async function POST() {
  try {
    const db = getDatabaseManager();
    await db.ready;

    // Tabellen droppen und neu erstellen
    await db.sequelize.sync({ force: true });

    // Rezepte
    const createdRezepte = await db.Rezepte.model.bulkCreate(rezepte);
    const idMap = createdRezepte.map((r: any) => r.id as number);

    // Projekte — recipeIds auf echte IDs mappen (Position 1-basiert → Index 0-basiert)
    const projekteWithRealIds = projekte.map(p => ({
      ...p,
      recipeIds: p.recipeIds.map(pos => idMap[pos - 1]).filter(Boolean),
    }));
    await db.Projekte.model.bulkCreate(projekteWithRealIds);

    // Zutaten & Ideen
    await db.Zutaten.model.bulkCreate(zutaten);
    await db.Ideen.model.bulkCreate(ideen);

    return new Response(
      JSON.stringify({ ok: true, rezepte: rezepte.length, zutaten: zutaten.length, ideen: ideen.length, projekte: projekte.length }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (e) {
    console.error('[SEED]', e);
    return new Response(JSON.stringify({ error: String(e) }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
}
