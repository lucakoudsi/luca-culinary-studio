import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase-admin';
import { getRequestUser } from '@/lib/get-request-user';
import { ADMIN_EMAIL } from '@/config/roles';

export const dynamic = 'force-dynamic';

// ─── Wine seed data ───────────────────────────────────────────────────────────
// profil axes (all 0–5):
//   acidity    — Säure
//   sweetness  — Restsüße
//   tannin     — Tannin / Adstringenz
//   body       — Körper / Fülle (Alkohol-Proxy)
//   fruitiness — Fruchtigkeit
//
// Schaumweine: acidity always 4–5 so Rule 6 (Salz–Säure) fires correctly

const WEINE = [
  // ─── Weißwein (38) ──────────────────────────────────────────────────────────
  { name: 'Riesling trocken Mosel', typ: 'weiss', rebsorte: 'Riesling', region: 'Mosel', land: 'Deutschland', beschreibung: 'Stahliger Schiefer-Riesling mit klingender Säure und Pfirsich-Aromen.', profil: { acidity: 5, sweetness: 0, tannin: 0, body: 2, fruitiness: 4 } },
  { name: 'Riesling Spätlese Mosel', typ: 'weiss', rebsorte: 'Riesling', region: 'Mosel', land: 'Deutschland', beschreibung: 'Zarte Restsüße im Gleichgewicht mit sprühender Säure — klassischer Spargel-Partner.', profil: { acidity: 5, sweetness: 3, tannin: 0, body: 2, fruitiness: 5 } },
  { name: 'Riesling Auslese', typ: 'weiss', rebsorte: 'Riesling', region: 'Rheingau', land: 'Deutschland', beschreibung: 'Konzentrierte Süße, dennoch lebendige Säure — ideal zu Foie Gras und würzigen Gerichten.', profil: { acidity: 4, sweetness: 4, tannin: 0, body: 3, fruitiness: 5 } },
  { name: 'Riesling trocken Rheingau', typ: 'weiss', rebsorte: 'Riesling', region: 'Rheingau', land: 'Deutschland', beschreibung: 'Elegante Mineralik, kräftiger als Mosel, dabei präzise und lang anhaltend.', profil: { acidity: 4, sweetness: 0, tannin: 0, body: 3, fruitiness: 4 } },
  { name: 'Riesling trocken Alsace', typ: 'weiss', rebsorte: 'Riesling', region: 'Elsass', land: 'Frankreich', beschreibung: 'Kräuterwürzige Note, leicht petroliger Hauch, trockener Stil mit Tiefe.', profil: { acidity: 4, sweetness: 1, tannin: 0, body: 3, fruitiness: 4 } },
  { name: 'Grüner Veltliner Smaragd Wachau', typ: 'weiss', rebsorte: 'Grüner Veltliner', region: 'Wachau', land: 'Österreich', beschreibung: 'Pfefferwürze und reife Grapefruit, volle Körper — der klassische Wiener Schnitzel-Wein.', profil: { acidity: 4, sweetness: 0, tannin: 1, body: 4, fruitiness: 3 } },
  { name: 'Grüner Veltliner Federspiel', typ: 'weiss', rebsorte: 'Grüner Veltliner', region: 'Wachau', land: 'Österreich', beschreibung: 'Leichter, frischer Stil — Allzweck-Weißwein für einfachere Gerichte und Vorspeisen.', profil: { acidity: 4, sweetness: 0, tannin: 0, body: 2, fruitiness: 3 } },
  { name: 'Chardonnay Chablis', typ: 'weiss', rebsorte: 'Chardonnay', region: 'Chablis', land: 'Frankreich', beschreibung: 'Kalksteinmineralik, grüner Apfel, kein Holz — der klarste Meeresfrüchte-Wein.', profil: { acidity: 5, sweetness: 0, tannin: 0, body: 3, fruitiness: 3 } },
  { name: 'Chardonnay Burgund Premier Cru', typ: 'weiss', rebsorte: 'Chardonnay', region: 'Côte de Beaune', land: 'Frankreich', beschreibung: 'Nussige Toastnoten vom Fass, butter-cremige Textur, straffe Säure als Gerüst.', profil: { acidity: 4, sweetness: 0, tannin: 1, body: 4, fruitiness: 4 } },
  { name: 'Chardonnay Burgund Grand Cru', typ: 'weiss', rebsorte: 'Chardonnay', region: 'Puligny-Montrachet', land: 'Frankreich', beschreibung: 'Tiefgründige Mineralik, Bienenwachs und weiße Früchte — passt zu Hummer und Zander.', profil: { acidity: 3, sweetness: 0, tannin: 1, body: 5, fruitiness: 4 } },
  { name: 'Chardonnay Neuseeland', typ: 'weiss', rebsorte: 'Chardonnay', region: 'Gisborne', land: 'Neuseeland', beschreibung: 'Pfirsich und tropische Frucht, dezente Eiche, gut strukturiert für den Alltag.', profil: { acidity: 4, sweetness: 1, tannin: 0, body: 3, fruitiness: 4 } },
  { name: 'Chardonnay Napa Valley', typ: 'weiss', rebsorte: 'Chardonnay', region: 'Napa Valley', land: 'USA', beschreibung: 'Vollreifes Buttersäure-Profil, viel Eiche — dominiert zurückhaltende Gerichte, liebt Lobster.', profil: { acidity: 3, sweetness: 1, tannin: 1, body: 5, fruitiness: 5 } },
  { name: 'Sauvignon Blanc Sancerre', typ: 'weiss', rebsorte: 'Sauvignon Blanc', region: 'Loire', land: 'Frankreich', beschreibung: 'Feuerstein-Mineralik, Grapefruit, grüne Kräuter — der klassische Ziegenkäse-Wein.', profil: { acidity: 5, sweetness: 0, tannin: 0, body: 2, fruitiness: 4 } },
  { name: 'Sauvignon Blanc Pouilly-Fumé', typ: 'weiss', rebsorte: 'Sauvignon Blanc', region: 'Loire', land: 'Frankreich', beschreibung: 'Rauchige Note (Silex), Citrus, länger und üppiger als Sancerre.', profil: { acidity: 4, sweetness: 0, tannin: 0, body: 2, fruitiness: 4 } },
  { name: 'Sauvignon Blanc Neuseeland', typ: 'weiss', rebsorte: 'Sauvignon Blanc', region: 'Marlborough', land: 'Neuseeland', beschreibung: 'Explosiv tropisch — Passion, Stachelbeere, Limette. Perfekt zu Sushi und Meeresfrüchten.', profil: { acidity: 4, sweetness: 0, tannin: 0, body: 2, fruitiness: 5 } },
  { name: 'Pinot Grigio Alto Adige', typ: 'weiss', rebsorte: 'Pinot Grigio', region: 'Alto Adige', land: 'Italien', beschreibung: 'Knackig, neutral, leicht — unkomplizierter Aperitif-Wein für leichte Vorspeisen.', profil: { acidity: 3, sweetness: 0, tannin: 0, body: 2, fruitiness: 3 } },
  { name: 'Pinot Gris Alsace', typ: 'weiss', rebsorte: 'Pinot Gris', region: 'Elsass', land: 'Frankreich', beschreibung: 'Körperreich, rauchige Würze, leichte Süße — ein Wein für Geflügel und Foie Gras.', profil: { acidity: 3, sweetness: 2, tannin: 0, body: 4, fruitiness: 4 } },
  { name: 'Gewürztraminer Alsace', typ: 'weiss', rebsorte: 'Gewürztraminer', region: 'Elsass', land: 'Frankreich', beschreibung: 'Rosenblüte, Litschi, Ingwer — ausdrucksstarker Würz- und Käsebegleiter.', profil: { acidity: 2, sweetness: 3, tannin: 0, body: 4, fruitiness: 5 } },
  { name: 'Albariño Rías Baixas', typ: 'weiss', rebsorte: 'Albariño', region: 'Galicien', land: 'Spanien', beschreibung: 'Pfirsich, Salzmandeln, leichte Perlage — Meeresfrüchte und Pulpo in Perfektion.', profil: { acidity: 4, sweetness: 0, tannin: 0, body: 3, fruitiness: 4 } },
  { name: 'Viognier Condrieu', typ: 'weiss', rebsorte: 'Viognier', region: 'Rhône', land: 'Frankreich', beschreibung: 'Aprikose, Veilchen, schwere Fülle — der Wein für aromatische Gerichte und weißes Fleisch.', profil: { acidity: 2, sweetness: 1, tannin: 0, body: 4, fruitiness: 5 } },
  { name: 'Viognier Languedoc', typ: 'weiss', rebsorte: 'Viognier', region: 'Languedoc', land: 'Frankreich', beschreibung: 'Zugänglicherer Stil als Condrieu, blumig-fruchtig, mittelkräftig.', profil: { acidity: 2, sweetness: 1, tannin: 0, body: 3, fruitiness: 5 } },
  { name: 'Chenin Blanc Vouvray trocken', typ: 'weiss', rebsorte: 'Chenin Blanc', region: 'Loire', land: 'Frankreich', beschreibung: 'Quitte, Wachs, enorme Alterungsfähigkeit — zu Süßwasserfisch und Geflügel.', profil: { acidity: 4, sweetness: 0, tannin: 0, body: 3, fruitiness: 4 } },
  { name: 'Chenin Blanc Südafrika', typ: 'weiss', rebsorte: 'Chenin Blanc', region: 'Stellenbosch', land: 'Südafrika', beschreibung: 'Guave, Melone, frische Säure — Südafrikas vielseitigste Weißweinrebsorte.', profil: { acidity: 4, sweetness: 1, tannin: 0, body: 3, fruitiness: 4 } },
  { name: 'Weißburgunder Elsass', typ: 'weiss', rebsorte: 'Weißburgunder', region: 'Elsass', land: 'Frankreich', beschreibung: 'Dezent nussig, mittlerer Körper — dezenter Essensbegleiter ohne Dominanz.', profil: { acidity: 3, sweetness: 0, tannin: 0, body: 3, fruitiness: 3 } },
  { name: 'Grauburgunder Baden trocken', typ: 'weiss', rebsorte: 'Grauburgunder', region: 'Baden', land: 'Deutschland', beschreibung: 'Mandel, milder Körper — guter Allround-Weißwein für Fisch und Geflügel.', profil: { acidity: 3, sweetness: 0, tannin: 0, body: 3, fruitiness: 3 } },
  { name: 'Sylvaner Franken trocken', typ: 'weiss', rebsorte: 'Sylvaner', region: 'Franken', land: 'Deutschland', beschreibung: 'Erdige Mineralik, schlanker Stil — passt hervorragend zu Spargelgerichten.', profil: { acidity: 3, sweetness: 0, tannin: 0, body: 2, fruitiness: 2 } },
  { name: 'Torrontés Salta', typ: 'weiss', rebsorte: 'Torrontés', region: 'Salta', land: 'Argentinien', beschreibung: 'Intensives Blumenbukett — Muskat und Geranien bei knackiger Säure; spicy food-friendly.', profil: { acidity: 3, sweetness: 1, tannin: 0, body: 2, fruitiness: 5 } },
  { name: 'Assyrtiko Santorini', typ: 'weiss', rebsorte: 'Assyrtiko', region: 'Santorini', land: 'Griechenland', beschreibung: 'Vulkanische Mineralik, zitronige Säure, Salzig-Meerescharakter — Octopus-Wein par excellence.', profil: { acidity: 5, sweetness: 0, tannin: 0, body: 3, fruitiness: 3 } },
  { name: 'Vermentino Sardinien', typ: 'weiss', rebsorte: 'Vermentino', region: 'Sardinien', land: 'Italien', beschreibung: 'Bittermandel-Finish, grüner Apfel, salzige Brise — ideal zu Meeresfrüchten.', profil: { acidity: 4, sweetness: 0, tannin: 0, body: 2, fruitiness: 4 } },
  { name: 'Fiano di Avellino', typ: 'weiss', rebsorte: 'Fiano', region: 'Kampanien', land: 'Italien', beschreibung: 'Haselnuss, Honig, lebendige Säure — strukturierter Süditalien-Weißwein für Pasta und Fisch.', profil: { acidity: 4, sweetness: 0, tannin: 0, body: 3, fruitiness: 3 } },
  { name: 'Greco di Tufo', typ: 'weiss', rebsorte: 'Greco', region: 'Kampanien', land: 'Italien', beschreibung: 'Mineralisch, leicht rauchig, Pfirsich und Aprikose — passt zu kräftigeren Fischgerichten.', profil: { acidity: 4, sweetness: 0, tannin: 0, body: 3, fruitiness: 3 } },
  { name: 'Lugana', typ: 'weiss', rebsorte: 'Turbiana', region: 'Gardasee', land: 'Italien', beschreibung: 'Mandeln, weiße Blüten, angenehme Fülle — unterschätzter Gardasee-Weißwein.', profil: { acidity: 4, sweetness: 0, tannin: 0, body: 3, fruitiness: 3 } },
  { name: 'Soave Classico', typ: 'weiss', rebsorte: 'Garganega', region: 'Venetien', land: 'Italien', beschreibung: 'Leichte Bittermandelnote, weißer Pfeffer — einfach, frisch, für unkomplizierte Vorspeisen.', profil: { acidity: 3, sweetness: 0, tannin: 0, body: 2, fruitiness: 3 } },
  { name: 'Vinho Verde', typ: 'weiss', rebsorte: 'Loureiro, Arinto', region: 'Minho', land: 'Portugal', beschreibung: 'Natürliche Perlage, Zitrus, sehr leichter Körper — der Sommer-Aperitif für Meeresfrüchte.', profil: { acidity: 5, sweetness: 0, tannin: 0, body: 1, fruitiness: 3 } },
  { name: 'Riesling Steiermark trocken', typ: 'weiss', rebsorte: 'Riesling', region: 'Steiermark', land: 'Österreich', beschreibung: 'Kräuterig, rassig-säurebetont — österreichischer Bergstil, schlank und präzise.', profil: { acidity: 5, sweetness: 0, tannin: 0, body: 2, fruitiness: 4 } },
  { name: 'Müller-Thurgau Franken', typ: 'weiss', rebsorte: 'Müller-Thurgau', region: 'Franken', land: 'Deutschland', beschreibung: 'Unkompliziert blumig, leichte Muskat-Note — frischer Terrassenwein.', profil: { acidity: 3, sweetness: 1, tannin: 0, body: 2, fruitiness: 3 } },
  { name: 'Aligoté Burgund', typ: 'weiss', rebsorte: 'Aligoté', region: 'Burgund', land: 'Frankreich', beschreibung: 'Straffe Säure, schlanker Körper — traditionell für Kir, gut zu Muscheln und leichten Salaten.', profil: { acidity: 5, sweetness: 0, tannin: 0, body: 2, fruitiness: 3 } },
  { name: 'Muscadet Sèvre et Maine', typ: 'weiss', rebsorte: 'Melon de Bourgogne', region: 'Loire', land: 'Frankreich', beschreibung: 'Sur-lie-Reife gibt dezente Hefe-Tiefe; salzig-frischer Charakter für Austern.', profil: { acidity: 5, sweetness: 0, tannin: 0, body: 2, fruitiness: 2 } },

  // ─── Rotwein (38) ───────────────────────────────────────────────────────────
  { name: 'Pinot Noir Burgund Village', typ: 'rot', rebsorte: 'Pinot Noir', region: 'Burgund', land: 'Frankreich', beschreibung: 'Kirsche, Erde, seidene Tannine — der vielseitigste Rotwein für leichte Speisen.', profil: { acidity: 4, sweetness: 0, tannin: 2, body: 3, fruitiness: 4 } },
  { name: 'Pinot Noir Burgund Premier Cru', typ: 'rot', rebsorte: 'Pinot Noir', region: 'Burgund', land: 'Frankreich', beschreibung: 'Erdbeere, Pfingstrose, feiner Garigue-Hauch — komplex und eleganz-definierend.', profil: { acidity: 4, sweetness: 0, tannin: 2, body: 3, fruitiness: 4 } },
  { name: 'Pinot Noir Burgund Grand Cru', typ: 'rot', rebsorte: 'Pinot Noir', region: 'Côte de Nuits', land: 'Frankreich', beschreibung: 'Trüffel, Teer und rote Beeren auf höchstem Niveau — zu Wildschwein und gereiftem Käse.', profil: { acidity: 4, sweetness: 0, tannin: 3, body: 4, fruitiness: 4 } },
  { name: 'Pinot Noir Oregon', typ: 'rot', rebsorte: 'Pinot Noir', region: 'Willamette Valley', land: 'USA', beschreibung: 'Kirsch-Frucht, kühler Stil — zwischen Burgund und Neuseeland, allgemein zugänglicher.', profil: { acidity: 3, sweetness: 0, tannin: 2, body: 3, fruitiness: 5 } },
  { name: 'Pinot Noir Neuseeland', typ: 'rot', rebsorte: 'Pinot Noir', region: 'Martinborough', land: 'Neuseeland', beschreibung: 'Saftige rote Früchte, natürliche Säure, leichtes Rauch-Element — gut zu Lamm.', profil: { acidity: 3, sweetness: 0, tannin: 2, body: 3, fruitiness: 4 } },
  { name: 'Spätburgunder Baden', typ: 'rot', rebsorte: 'Spätburgunder', region: 'Baden', land: 'Deutschland', beschreibung: 'Seidig, rote Kirsche, leichter Körper — der deutsche Antwort auf Burgund.', profil: { acidity: 3, sweetness: 0, tannin: 2, body: 3, fruitiness: 4 } },
  { name: 'Gamay Beaujolais Villages', typ: 'rot', rebsorte: 'Gamay', region: 'Beaujolais', land: 'Frankreich', beschreibung: 'Weiche Tannine, knackige Frucht — leicht gekühlt ideal zu Charcuterie.', profil: { acidity: 4, sweetness: 0, tannin: 1, body: 2, fruitiness: 5 } },
  { name: 'Gamay Fleurie', typ: 'rot', rebsorte: 'Gamay', region: 'Beaujolais', land: 'Frankreich', beschreibung: 'Floral und eleganter als einfaches Beaujolais, mehr Tiefe, zu Pilzgerichten.', profil: { acidity: 4, sweetness: 0, tannin: 1, body: 3, fruitiness: 5 } },
  { name: 'Cabernet Sauvignon Bordeaux Cru', typ: 'rot', rebsorte: 'Cabernet Sauvignon, Merlot', region: 'Médoc', land: 'Frankreich', beschreibung: 'Schwarze Johannisbeere, Zedernholz, edle Tannine — der klassische Roastbeef-Wein.', profil: { acidity: 3, sweetness: 0, tannin: 4, body: 4, fruitiness: 3 } },
  { name: 'Cabernet Sauvignon Bordeaux Grand Cru', typ: 'rot', rebsorte: 'Cabernet Sauvignon', region: 'Pauillac', land: 'Frankreich', beschreibung: 'Komplexe Tabak-Leder-Aromen, massive Struktur — wird mit Jahren zur Perfektion.', profil: { acidity: 3, sweetness: 0, tannin: 5, body: 5, fruitiness: 3 } },
  { name: 'Cabernet Sauvignon California', typ: 'rot', rebsorte: 'Cabernet Sauvignon', region: 'Napa Valley', land: 'USA', beschreibung: 'Üppige schwarze Frucht, Vanille-Eiche, hoher Alkohol — für gegrilltes Ribeye.', profil: { acidity: 3, sweetness: 1, tannin: 4, body: 5, fruitiness: 4 } },
  { name: 'Cabernet Sauvignon Chile', typ: 'rot', rebsorte: 'Cabernet Sauvignon', region: 'Maipo Valley', land: 'Chile', beschreibung: 'Strukturiert, eucalyptus-Note, Cassis — gute Qualität zu vernünftigem Preis.', profil: { acidity: 3, sweetness: 0, tannin: 3, body: 4, fruitiness: 4 } },
  { name: 'Merlot Pomerol', typ: 'rot', rebsorte: 'Merlot', region: 'Pomerol', land: 'Frankreich', beschreibung: 'Samtweiche Tannine, Pflaume, Trüffel-Note — zugänglicher als Cabernet, trotzdem tief.', profil: { acidity: 3, sweetness: 0, tannin: 3, body: 4, fruitiness: 4 } },
  { name: 'Merlot Napa Valley', typ: 'rot', rebsorte: 'Merlot', region: 'Napa Valley', land: 'USA', beschreibung: 'Vollfruchtig, weiche Struktur, Schokoladen-Noten — einfach zugänglicher Rotwein.', profil: { acidity: 2, sweetness: 1, tannin: 3, body: 4, fruitiness: 5 } },
  { name: 'Syrah Côte-Rôtie', typ: 'rot', rebsorte: 'Syrah', region: 'Nördliche Rhône', land: 'Frankreich', beschreibung: 'Olive, Bacon, schwarze Olive — der edelste nördliche Rhône-Rotwein für Lamm.', profil: { acidity: 3, sweetness: 0, tannin: 4, body: 4, fruitiness: 3 } },
  { name: 'Syrah Crozes-Hermitage', typ: 'rot', rebsorte: 'Syrah', region: 'Nördliche Rhône', land: 'Frankreich', beschreibung: 'Pfeffer, Veilchen, zugänglicherer Bruder von Côte-Rôtie — für gegrilltes Fleisch.', profil: { acidity: 3, sweetness: 0, tannin: 3, body: 3, fruitiness: 3 } },
  { name: 'Shiraz Barossa Valley', typ: 'rot', rebsorte: 'Shiraz', region: 'Barossa Valley', land: 'Australien', beschreibung: 'Üppig, Schokolade, Heidelbeere, viel Körper — Australian BBQ-Wein schlechthin.', profil: { acidity: 2, sweetness: 1, tannin: 3, body: 5, fruitiness: 4 } },
  { name: 'Shiraz McLaren Vale', typ: 'rot', rebsorte: 'Shiraz', region: 'McLaren Vale', land: 'Australien', beschreibung: 'Kakao, schwarze Beeren, etwas eleganter als Barossa — voll und üppig.', profil: { acidity: 2, sweetness: 2, tannin: 3, body: 5, fruitiness: 5 } },
  { name: 'Grenache Châteauneuf-du-Pape', typ: 'rot', rebsorte: 'Grenache', region: 'Südliche Rhône', land: 'Frankreich', beschreibung: 'Reife Kirschen, Garrigue, warme Würze — für Wildgeflügel und Rindfleisch.', profil: { acidity: 3, sweetness: 1, tannin: 2, body: 5, fruitiness: 4 } },
  { name: 'Garnacha Rioja', typ: 'rot', rebsorte: 'Garnacha', region: 'Rioja', land: 'Spanien', beschreibung: 'Erdbeere, Kräuter, runder Körper — leicht zugänglicher Alltags-Rioja.', profil: { acidity: 2, sweetness: 1, tannin: 2, body: 4, fruitiness: 5 } },
  { name: 'Tempranillo Rioja Reserva', typ: 'rot', rebsorte: 'Tempranillo', region: 'Rioja', land: 'Spanien', beschreibung: 'Leder, Vanille-Eiche, reife Pflaume — 12 Monate Barrique, klassisch und verlässlich.', profil: { acidity: 3, sweetness: 0, tannin: 3, body: 4, fruitiness: 3 } },
  { name: 'Tempranillo Ribera del Duero', typ: 'rot', rebsorte: 'Tempranillo', region: 'Ribera del Duero', land: 'Spanien', beschreibung: 'Kräftiger als Rioja, dunklere Frucht, mehr Tannin — für Wildfleisch und Lamm.', profil: { acidity: 3, sweetness: 0, tannin: 4, body: 5, fruitiness: 4 } },
  { name: 'Sangiovese Chianti Classico', typ: 'rot', rebsorte: 'Sangiovese', region: 'Toskana', land: 'Italien', beschreibung: 'Sauerkirsche, Kräuter, hohe Säure — der geborene Pasta-al-Sugo-Wein.', profil: { acidity: 4, sweetness: 0, tannin: 3, body: 3, fruitiness: 3 } },
  { name: 'Brunello di Montalcino', typ: 'rot', rebsorte: 'Sangiovese Grosso', region: 'Toskana', land: 'Italien', beschreibung: 'Gewaltige Struktur, Teer, Leder, trockene Kirsche — braucht Zeit, für Wildschwein.', profil: { acidity: 4, sweetness: 0, tannin: 5, body: 4, fruitiness: 3 } },
  { name: 'Nebbiolo Barolo', typ: 'rot', rebsorte: 'Nebbiolo', region: 'Piemont', land: 'Italien', beschreibung: 'König der Nebbiolo: Rosen, Teer, gewaltige Tannine — passt zu Trüffeln und Wildbret.', profil: { acidity: 5, sweetness: 0, tannin: 5, body: 4, fruitiness: 3 } },
  { name: 'Nebbiolo Barbaresco', typ: 'rot', rebsorte: 'Nebbiolo', region: 'Piemont', land: 'Italien', beschreibung: 'Etwas zugänglicher als Barolo, femininer Stil, Heidelbeere und Veilchen.', profil: { acidity: 4, sweetness: 0, tannin: 4, body: 4, fruitiness: 3 } },
  { name: 'Barbera d\'Asti', typ: 'rot', rebsorte: 'Barbera', region: 'Piemont', land: 'Italien', beschreibung: 'Hohe Säure, wenig Tannin, üppige Kirschfrucht — perfekt zu Pizza und Pasta.', profil: { acidity: 5, sweetness: 0, tannin: 2, body: 3, fruitiness: 4 } },
  { name: 'Montepulciano d\'Abruzzo', typ: 'rot', rebsorte: 'Montepulciano', region: 'Abruzzen', land: 'Italien', beschreibung: 'Weiche Tannine, dunkle Beeren, preiswert und verlässlich für Alltagsgerichte.', profil: { acidity: 3, sweetness: 0, tannin: 3, body: 4, fruitiness: 4 } },
  { name: 'Malbec Mendoza', typ: 'rot', rebsorte: 'Malbec', region: 'Mendoza', land: 'Argentinien', beschreibung: 'Pflaume, Veilchen, samtige Tannine — Argentiniens Aushängeschild, für Asado.', profil: { acidity: 3, sweetness: 1, tannin: 3, body: 4, fruitiness: 5 } },
  { name: 'Malbec Cahors', typ: 'rot', rebsorte: 'Malbec', region: 'Südwestfrankreich', land: 'Frankreich', beschreibung: 'Rustikaler, tanninreicher Ursprung — Schwarze Pflaume, Leder, für Cassoulet.', profil: { acidity: 3, sweetness: 0, tannin: 4, body: 4, fruitiness: 4 } },
  { name: 'Carménère Chile', typ: 'rot', rebsorte: 'Carménère', region: 'Colchagua Valley', land: 'Chile', beschreibung: 'Paprika-Note, schwarze Johannisbeere, weiche Säure — Chiles Signature-Rebsorte.', profil: { acidity: 3, sweetness: 1, tannin: 3, body: 4, fruitiness: 4 } },
  { name: 'Zinfandel California', typ: 'rot', rebsorte: 'Zinfandel', region: 'Sonoma / Napa', land: 'USA', beschreibung: 'Brombeere, Kirschmarmelade, Pfeffer, viel Alkohol — für BBQ und herzhafte Gerichte.', profil: { acidity: 2, sweetness: 2, tannin: 3, body: 5, fruitiness: 5 } },
  { name: 'Blaufränkisch Burgenland', typ: 'rot', rebsorte: 'Blaufränkisch', region: 'Burgenland', land: 'Österreich', beschreibung: 'Intensive Säure, dunkle Frucht, Pfeffer — Österreichs eigenständigste Rotweinhoffnung.', profil: { acidity: 4, sweetness: 0, tannin: 3, body: 3, fruitiness: 3 } },
  { name: 'Zweigelt Österreich', typ: 'rot', rebsorte: 'Zweigelt', region: 'Niederösterreich', land: 'Österreich', beschreibung: 'Sauerkirsche, weiche Tannine — Allzweck-Österreicher für Vesper und Gulasch.', profil: { acidity: 3, sweetness: 0, tannin: 2, body: 3, fruitiness: 4 } },
  { name: 'Xinomavro Naoussa', typ: 'rot', rebsorte: 'Xinomavro', region: 'Makedonien', land: 'Griechenland', beschreibung: 'Tomaten, Oliven, stramme Säure und Tannin — oft als Barolo Griechenlands bezeichnet.', profil: { acidity: 5, sweetness: 0, tannin: 4, body: 3, fruitiness: 3 } },
  { name: 'Primitivo Apulien', typ: 'rot', rebsorte: 'Primitivo', region: 'Apulien', land: 'Italien', beschreibung: 'Üppig süße Frucht, Schokolade, hoher Alkohol — der sonnige Bruder von Zinfandel.', profil: { acidity: 2, sweetness: 2, tannin: 3, body: 5, fruitiness: 5 } },
  { name: 'Pinotage Südafrika', typ: 'rot', rebsorte: 'Pinotage', region: 'Stellenbosch', land: 'Südafrika', beschreibung: 'Rauch, Mokka, schwarze Früchte — eigenwilliger Charakter, gut zu geräuchertem Fleisch.', profil: { acidity: 3, sweetness: 1, tannin: 3, body: 4, fruitiness: 4 } },
  { name: 'Sangiovese Vino Nobile', typ: 'rot', rebsorte: 'Sangiovese', region: 'Montepulciano', land: 'Italien', beschreibung: 'Zwischen Chianti und Brunello — trockene Sauerkirsche, gute Tanninstruktur.', profil: { acidity: 4, sweetness: 0, tannin: 4, body: 4, fruitiness: 3 } },

  // ─── Rosé (5) ────────────────────────────────────────────────────────────────
  { name: 'Rosé Provence', typ: 'rose', rebsorte: 'Grenache, Cinsault, Syrah', region: 'Provence', land: 'Frankreich', beschreibung: 'Blassrosa, trocken, Erdbeere und Kräuter — der quintessenzielle Sommer-Rosé.', profil: { acidity: 3, sweetness: 0, tannin: 1, body: 2, fruitiness: 3 } },
  { name: 'Rosé Tavel', typ: 'rose', rebsorte: 'Grenache', region: 'Rhône', land: 'Frankreich', beschreibung: 'Kräftiger Rosé, mehr Körper — Frankreichs einzige Rosé-AOC, gut zu Grillgemüse.', profil: { acidity: 3, sweetness: 0, tannin: 1, body: 3, fruitiness: 4 } },
  { name: 'Rosé Pinot Noir Deutschland', typ: 'rose', rebsorte: 'Spätburgunder', region: 'Rheinhessen', land: 'Deutschland', beschreibung: 'Zartes Himbeerbukett, frisch und trocken — guter Terassen-Rosé.', profil: { acidity: 3, sweetness: 0, tannin: 1, body: 2, fruitiness: 4 } },
  { name: 'Rosé Grenache Spanien', typ: 'rose', rebsorte: 'Grenache / Garnacha', region: 'Navarra', land: 'Spanien', beschreibung: 'Intensiver als Provence, Kirsche und Pfirsich — gut zu Tapas und leichtem Fleisch.', profil: { acidity: 3, sweetness: 1, tannin: 1, body: 3, fruitiness: 4 } },
  { name: 'Rosé Sangiovese Toskana', typ: 'rose', rebsorte: 'Sangiovese', region: 'Toskana', land: 'Italien', beschreibung: 'Lebendig säurebetont, trockener Stil — idealer Begleiter für toskanische Antipasti.', profil: { acidity: 4, sweetness: 0, tannin: 1, body: 2, fruitiness: 3 } },

  // ─── Schaumwein (11) — hohe acidity (4–5) für korrekte Salz-Säure-Regel ────
  { name: 'Champagne Brut NV', typ: 'schaumwein', rebsorte: 'Chardonnay, Pinot Noir, Meunier', region: 'Champagne', land: 'Frankreich', beschreibung: 'Brioche, Zitrus, Kreide-Mineralik — der universelle Festwein für Austern und Kaviar.', profil: { acidity: 5, sweetness: 0, tannin: 0, body: 2, fruitiness: 3 } },
  { name: 'Champagne Blanc de Blancs', typ: 'schaumwein', rebsorte: 'Chardonnay', region: 'Côte des Blancs', land: 'Frankreich', beschreibung: 'Reine Chardonnay-Eleganz: Zitronenverbene, Kreide, enorme Säure — zu Seafood.', profil: { acidity: 5, sweetness: 0, tannin: 0, body: 2, fruitiness: 4 } },
  { name: 'Champagne Blanc de Noirs', typ: 'schaumwein', rebsorte: 'Pinot Noir', region: 'Montagne de Reims', land: 'Frankreich', beschreibung: 'Mehr Körper und rote Frucht als Blanc de Blancs — gut zu Geflügel und Charcuterie.', profil: { acidity: 4, sweetness: 0, tannin: 1, body: 3, fruitiness: 4 } },
  { name: 'Champagne Demi-Sec', typ: 'schaumwein', rebsorte: 'Chardonnay, Pinot Noir', region: 'Champagne', land: 'Frankreich', beschreibung: 'Süßere Champagner-Variante — ideal zu Desserts und mild-würzigen Gerichten.', profil: { acidity: 4, sweetness: 2, tannin: 0, body: 2, fruitiness: 4 } },
  { name: 'Champagne Rosé', typ: 'schaumwein', rebsorte: 'Chardonnay, Pinot Noir', region: 'Champagne', land: 'Frankreich', beschreibung: 'Rote Beerenstruktur trifft Champagner-Säure — zu Lachs und Erdbeertörtchen.', profil: { acidity: 4, sweetness: 0, tannin: 1, body: 2, fruitiness: 4 } },
  { name: 'Prosecco DOCG', typ: 'schaumwein', rebsorte: 'Glera', region: 'Valdobbiadene', land: 'Italien', beschreibung: 'Pfirsich, Birne, leichte Süße — der Aperitif-Spumante für Vorspeisen und Aperol.', profil: { acidity: 3, sweetness: 1, tannin: 0, body: 1, fruitiness: 4 } },
  { name: 'Cava Brut', typ: 'schaumwein', rebsorte: 'Macabeo, Xarel-lo, Parellada', region: 'Penedès', land: 'Spanien', beschreibung: 'Frischer, etwas rustikalerer Stil als Champagne — gutes Preis-Leistungs-Verhältnis.', profil: { acidity: 4, sweetness: 0, tannin: 0, body: 2, fruitiness: 3 } },
  { name: 'Crémant d\'Alsace', typ: 'schaumwein', rebsorte: 'Pinot Blanc, Auxerrois', region: 'Elsass', land: 'Frankreich', beschreibung: 'Reichhaltigere Frucht als Champagne, blumig — schöner Aperitif mit guter Säure.', profil: { acidity: 4, sweetness: 0, tannin: 0, body: 2, fruitiness: 3 } },
  { name: 'Crémant de Bourgogne', typ: 'schaumwein', rebsorte: 'Chardonnay, Pinot Noir', region: 'Burgund', land: 'Frankreich', beschreibung: 'Cremige Textur, Chardonnay-Mineralik — der günstigere Champagne-Verwandte.', profil: { acidity: 4, sweetness: 0, tannin: 0, body: 2, fruitiness: 4 } },
  { name: 'Sekt Riesling trocken', typ: 'schaumwein', rebsorte: 'Riesling', region: 'Mosel / Rheingau', land: 'Deutschland', beschreibung: 'Feingliedriger Perlwein mit Riesling-Säure — zu Fisch und hellem Geflügel.', profil: { acidity: 5, sweetness: 0, tannin: 0, body: 2, fruitiness: 3 } },
  { name: 'Franciacorta DOCG', typ: 'schaumwein', rebsorte: 'Chardonnay, Pinot Nero', region: 'Lombardei', land: 'Italien', beschreibung: 'Italiens Antwort auf Champagne — cremige Mousse, Brioche, knackige Säure.', profil: { acidity: 4, sweetness: 0, tannin: 0, body: 3, fruitiness: 4 } },

  // ─── Süßwein (10) ───────────────────────────────────────────────────────────
  { name: 'Sauternes', typ: 'suesswein', rebsorte: 'Sémillon, Sauvignon Blanc', region: 'Bordeaux', land: 'Frankreich', beschreibung: 'Botrytis-Gold: Aprikose, Honig, Safran — der klassische Foie-Gras-Wein.', profil: { acidity: 3, sweetness: 5, tannin: 0, body: 4, fruitiness: 5 } },
  { name: 'Riesling Trockenbeerenauslese', typ: 'suesswein', rebsorte: 'Riesling', region: 'Rheingau', land: 'Deutschland', beschreibung: 'Höchste deutsche Prädikats-Süße, enorme Säure als Gegengewicht — zu Desserts.', profil: { acidity: 5, sweetness: 5, tannin: 0, body: 3, fruitiness: 5 } },
  { name: 'Riesling Eiswein', typ: 'suesswein', rebsorte: 'Riesling', region: 'Mosel', land: 'Deutschland', beschreibung: 'Konzentriert, Honig-Zitrus, Säure als Nerv — zu Käse und leichten Desserts.', profil: { acidity: 5, sweetness: 4, tannin: 0, body: 2, fruitiness: 5 } },
  { name: 'Tokaji Aszú 5 Puttonyos', typ: 'suesswein', rebsorte: 'Furmint', region: 'Tokaj', land: 'Ungarn', beschreibung: 'Orange-Honig-Komplex, Aprikose, Safran — der "König aller Weine" zu Foie Gras.', profil: { acidity: 4, sweetness: 4, tannin: 0, body: 4, fruitiness: 5 } },
  { name: 'Gewürztraminer Sélection de Grains Nobles', typ: 'suesswein', rebsorte: 'Gewürztraminer', region: 'Elsass', land: 'Frankreich', beschreibung: 'Exotische Süße trifft Rosenöl — zu intensiven Desserts und Blauschimmelkäse.', profil: { acidity: 3, sweetness: 5, tannin: 0, body: 4, fruitiness: 5 } },
  { name: 'Ruby Port', typ: 'suesswein', rebsorte: 'Touriga Nacional', region: 'Douro', land: 'Portugal', beschreibung: 'Dunkle Beeren, Schokolade, viel Körper — zu Walnüssen, Schokoladendesserts.', profil: { acidity: 2, sweetness: 4, tannin: 3, body: 5, fruitiness: 5 } },
  { name: 'Tawny Port 10 Jahre', typ: 'suesswein', rebsorte: 'Touriga Nacional', region: 'Douro', land: 'Portugal', beschreibung: 'Oxidative Nussigkeit, Karamell, Feige — weniger Tannin als Ruby, zu Käse.', profil: { acidity: 2, sweetness: 4, tannin: 2, body: 5, fruitiness: 4 } },
  { name: 'Fino Sherry', typ: 'suesswein', rebsorte: 'Palomino', region: 'Jerez', land: 'Spanien', beschreibung: 'Knochentrocken, Mandel, salzige Brise — der Tapas-Wein zu Jamón und Oliven.', profil: { acidity: 5, sweetness: 0, tannin: 0, body: 3, fruitiness: 2 } },
  { name: 'Oloroso Sherry', typ: 'suesswein', rebsorte: 'Palomino', region: 'Jerez', land: 'Spanien', beschreibung: 'Nussig-komplex, Walnuss, getrocknete Früchte — ausgebaut und oxidativ-tiefgründig.', profil: { acidity: 3, sweetness: 2, tannin: 0, body: 4, fruitiness: 3 } },
  { name: 'Pedro Ximénez Sherry', typ: 'suesswein', rebsorte: 'Pedro Ximénez', region: 'Jerez', land: 'Spanien', beschreibung: 'Dickflüssige Rosinensüße — über Eis-Cream gegossen ein unvergessliches Dessert.', profil: { acidity: 1, sweetness: 5, tannin: 0, body: 5, fruitiness: 5 } },
];

export async function POST(req: NextRequest) {
  const user = await getRequestUser(req);
  if (!user || user.email !== ADMIN_EMAIL) {
    return NextResponse.json({ error: 'Nicht autorisiert. Diese Aktion ist nur für Admins.' }, { status: 403 });
  }
  const db = createAdminClient();

  // Clear existing seed data to allow re-seeding
  await db.from('weine').delete().neq('id', 0);

  const { data, error } = await db
    .from('weine')
    .insert(WEINE)
    .select('id, name');

  if (error) {
    console.error('[seed-weine]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    success: true,
    count: data?.length ?? 0,
    message: `${data?.length ?? 0} Weine erfolgreich in die Datenbank eingespielt.`,
  });
}
