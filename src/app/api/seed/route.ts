import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase-admin';
const supabase = createAdminClient();

const rezepte = [
  { name: 'Schwarzwälder Kirsch-Tartar', kategorie: 'Vorspeise', tags: ['Fingerfood', 'Modern', 'Sommer'], schwierigkeit: 'Mittel', zubereitungszeit: 45, saison: 'Sommer', status: 'Fertig', bewertung: 5, bild: null, beschreibung: 'Zartes Rinderfilet-Tartar mit eingelegten Kirschen, Walnuss-Crumble und Sauerrahm-Espuma.', zuletzt_bearbeitet: '2026-06-15', aufrufe: 142 },
  { name: 'Wildkräuter-Velouté mit Hühnerei-Confit', kategorie: 'Suppe', tags: ['Klassisch', 'Frühling', 'Vegetarisch'], schwierigkeit: 'Leicht', zubereitungszeit: 30, saison: 'Frühling', status: 'In Bearbeitung', bewertung: 4, bild: null, beschreibung: 'Samtweiche Kräutersuppe aus frischen Wildkräutern mit einem sous-vide gegarten Eigelb.', zuletzt_bearbeitet: '2026-06-10', aufrufe: 89 },
  { name: 'Kalbsbäckchen, Morcheln & Spargel', kategorie: 'Hauptgang', tags: ['Fine Dining', 'Frühling', 'Klassisch'], schwierigkeit: 'Schwer', zubereitungszeit: 240, saison: 'Frühling', status: 'Fertig', bewertung: 5, bild: null, beschreibung: 'Geschmorte Kalbsbäckchen mit Morcheln, weißem Spargel und einer reduzierten Kalbsjus.', zuletzt_bearbeitet: '2026-06-08', aufrufe: 310 },
  { name: 'Miso-Crème Brûlée mit Sesam-Praline', kategorie: 'Dessert', tags: ['Fusion', 'Umami', 'Herbst'], schwierigkeit: 'Mittel', zubereitungszeit: 90, saison: 'Herbst', status: 'Entwurf', bewertung: 4, bild: null, beschreibung: 'Klassische Crème Brûlée mit weißem Miso verfeinert, dazu karamellisierte Sesam-Praline.', zuletzt_bearbeitet: '2026-06-01', aufrufe: 67 },
  { name: 'Lachs, Gurke & Dill-Öl', kategorie: 'Hauptgang', tags: ['Modern', 'Sommer', 'Leicht'], schwierigkeit: 'Mittel', zubereitungszeit: 60, saison: 'Sommer', status: 'Fertig', bewertung: 4, bild: null, beschreibung: 'Sous-vide gegarter Lachs mit frischer Gurkenmousse und aromatischem Dill-Öl.', zuletzt_bearbeitet: '2026-05-28', aufrufe: 198 },
  { name: 'Herbstlicher Kürbis-Cappuccino', kategorie: 'Suppe', tags: ['Herbst', 'Vegetarisch', 'Comfort'], schwierigkeit: 'Leicht', zubereitungszeit: 40, saison: 'Herbst', status: 'Fertig', bewertung: 3, bild: null, beschreibung: 'Cremige Kürbissuppe serviert wie ein Cappuccino mit Ingwerschaum und Kürbiskernöl.', zuletzt_bearbeitet: '2026-05-20', aufrufe: 124 },
];

const zutaten = [
  { name: 'Weißer Spargel', category: 'Gemüse', seasons: ['Frühling'], origin: 'Deutschland', aromas: ['Nussig', 'Mild', 'Erdig'], flavor: { acidity: 1, sweetness: 2, bitterness: 2, umami: 2, spiciness: 0, saltiness: 0 }, pairings: ['Butter', 'Parmesan', 'Morcheln'], description: 'Delikater Frühlingsklassiker.', storage_temp: '0–2°C', unit: 'Stück' },
  { name: 'Schwarze Trüffel', category: 'Pilze', seasons: ['Winter'], origin: 'Périgord, Frankreich', aromas: ['Muschig', 'Erdig', 'Intensiv'], flavor: { acidity: 0, sweetness: 1, bitterness: 1, umami: 5, spiciness: 0, saltiness: 1 }, pairings: ['Ei', 'Pasta', 'Butter'], description: 'Das schwarze Gold der Küche.', storage_temp: '2–4°C', unit: 'Gramm' },
  { name: 'Pfifferling', category: 'Pilze', seasons: ['Sommer', 'Herbst'], origin: 'Europa', aromas: ['Pfeffrig', 'Fruchtig', 'Nussig'], flavor: { acidity: 1, sweetness: 2, bitterness: 1, umami: 3, spiciness: 2, saltiness: 0 }, pairings: ['Rahm', 'Petersilie', 'Ei'], description: 'Sommerlicher Wildpilz.', storage_temp: '4–6°C', unit: 'Gramm' },
];

const ideen = [
  { text: 'Fermentierter Knoblauch als Basis für eine neue Vinaigrette', tag: 'Fermentation', date: '2026-06-16' },
  { text: 'Dessert mit lokalen Bienen-Pollen und Kastanienhonig', tag: 'Dessert', date: '2026-06-14' },
  { text: 'Rote Bete Tataki – japanische Technik, regionale Zutaten', tag: 'Fusion', date: '2026-06-12' },
];

const projekte = [
  { name: 'Frühlingsmenü 2026', beschreibung: 'Siebengängiges Menü für das Pop-up-Dinner im April.', farbe: '#7CB87A', status: 'Aktiv', recipe_ids: [], menu_ids: [], notizen: [], created_at: '2026-03-01' },
  { name: 'Fermentations-Kollektion', beschreibung: 'Entwicklung einer Serie von 5 Gerichten basierend auf hausgemachten Fermenten.', farbe: '#C9A84C', status: 'Aktiv', recipe_ids: [], menu_ids: [], notizen: [], created_at: '2026-04-10' },
  { name: 'Kochbuch Kapitel 3', beschreibung: 'Rezepte und Konzepte für das Kapitel „Sommer am Meer".', farbe: '#7BB8D4', status: 'Pausiert', recipe_ids: [], menu_ids: [], notizen: [], created_at: '2026-02-01' },
];

export async function POST() {
  try {
    await supabase.from('recipes').delete().neq('id', 0);
    await supabase.from('zutaten').delete().neq('id', 0);
    await supabase.from('ideen').delete().neq('id', 0);
    await supabase.from('projekte').delete().neq('id', 0);

    const { error: e1 } = await supabase.from('recipes').insert(rezepte);
    if (e1) return NextResponse.json({ error: e1.message }, { status: 500 });

    const { error: e2 } = await supabase.from('zutaten').insert(zutaten);
    if (e2) return NextResponse.json({ error: e2.message }, { status: 500 });

    const { error: e3 } = await supabase.from('ideen').insert(ideen);
    if (e3) return NextResponse.json({ error: e3.message }, { status: 500 });

    const { error: e4 } = await supabase.from('projekte').insert(projekte);
    if (e4) return NextResponse.json({ error: e4.message }, { status: 500 });

    return NextResponse.json({ ok: true, rezepte: rezepte.length, zutaten: zutaten.length, ideen: ideen.length, projekte: projekte.length });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
