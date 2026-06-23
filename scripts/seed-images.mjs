// Fetches Pexels images for all zutaten that have no image_url yet.
// Run: node scripts/seed-images.mjs
// Re-runnable: skips rows where image_url is already set.
// Stops after 180 requests per run to stay under Pexels' 200 req/hour limit.

const SUPABASE_URL = 'https://bredshsuqghsiaefpitk.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJyZWRzaHN1cWdoc2lhZWZwaXRrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MTg1NTYxMiwiZXhwIjoyMDk3NDMxNjEyfQ.8D3LbUjntlKIdUxADVZkdwOXZNvqWhY5SXUAblOA5b8';
const PEXELS_KEY = 'YaqF5O0jwAGeeXjHKcNxLIjV3rVA6WMlmw6kjAhaOsdTMnXIJQZ7gjfA';

const SB = { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}`, 'Content-Type': 'application/json' };

// German → English translations for better Pexels search results
const TRANSLATIONS = {
  'Weißer Spargel': 'white asparagus food', 'Schwarzwurzel': 'salsify vegetable', 'Topinambur': 'jerusalem artichoke',
  'Grüner Spargel': 'green asparagus food', 'Rote Bete': 'beetroot food', 'Gelbe Bete': 'golden beet food',
  'Karotte': 'carrot food', 'Karotte bunt': 'rainbow carrots food', 'Knoblauch': 'garlic food',
  'Zwiebel': 'onion food', 'Schalotte': 'shallot food', 'Lauch': 'leek vegetable',
  'Fenchel': 'fennel vegetable', 'Sellerie': 'celery food', 'Knollensellerie': 'celeriac food',
  'Pastinake': 'parsnip food', 'Petersilienwurzel': 'parsley root food', 'Kerbelknolle': 'chervil root food',
  'Kohlrabi': 'kohlrabi vegetable', 'Rosenkohl': 'brussels sprouts food', 'Brokkoli': 'broccoli food',
  'Blumenkohl': 'cauliflower food', 'Wirsing': 'savoy cabbage food', 'Spitzkohl': 'pointed cabbage food',
  'Grünkohl': 'kale food', 'Spinat': 'spinach food', 'Mangold': 'swiss chard food',
  'Radicchio': 'radicchio food', 'Chicoree': 'chicory food', 'Treviso': 'treviso radicchio',
  'Rucola': 'arugula food', 'Feldsalat': 'mâche salad food', 'Mâche': 'lamb lettuce food',
  'Friséesalat': 'frisée salad food', 'Eichblattsalat': 'oak leaf lettuce food',
  'Eisbergsalat': 'iceberg lettuce food', 'Romanasalat': 'romaine lettuce food',
  'Endivie': 'endive food', 'Löwenzahn': 'dandelion greens food', 'Sauerampfer': 'sorrel herb food',
  'Portulak': 'purslane food', 'Bimi': 'tenderstem broccoli food', 'Nopales': 'nopales cactus food',
  'Jicama': 'jicama food', 'Palmherz': 'hearts of palm food', 'Wasserkastanie': 'water chestnut food',
  'Bambus': 'bamboo shoots food', 'Pak Choi': 'bok choy food', 'Okra': 'okra food',
  'Artischocke': 'artichoke food', 'Mais': 'corn cob food', 'Zucchini': 'zucchini food',
  'Aubergine': 'eggplant food', 'Tomate': 'tomato food', 'Tomate Cherry': 'cherry tomatoes food',
  'Paprika (rot)': 'red bell pepper food', 'Paprika gelb': 'yellow bell pepper food',
  'Gurke': 'cucumber food', 'Avocado': 'avocado food', 'Erbse': 'peas food',
  'Grüne Bohne': 'green beans food', 'Süßkartoffel': 'sweet potato food', 'Kartoffel': 'potato food',
  'Radieschen': 'radish food', 'Rettich': 'daikon radish food', 'Daikon': 'daikon food',
  'Steckrübe': 'rutabaga turnip food', 'Schwarzwurzel': 'salsify root food',
  'Topinambur': 'jerusalem artichoke food', 'Taro': 'taro root food', 'Yuca': 'cassava food',
  'Yam': 'yam food', 'Malanga': 'malanga root food', 'Jicama': 'jicama root food',
  'Wassermelone': 'watermelon food', 'Brennnessel': 'nettle leaves food',
  'Bittermelone': 'bitter melon food', 'Puntarelle': 'puntarelle chicory food',
  'Catalogna': 'catalogna chicory food', 'Borretsch': 'borage flower food',
  'Kapuzinerkresse': 'nasturtium flower food', 'Waldmeister': 'sweet woodruff herb',
  // Obst
  'Apfel': 'apple food', 'Birne': 'pear food', 'Pflaume': 'plum food',
  'Kirsche': 'cherries food', 'Erdbeere': 'strawberry food', 'Himbeere': 'raspberry food',
  'Brombeere': 'blackberry food', 'Schwarze Johannisbeere': 'blackcurrant food',
  'Rote Johannisbeere': 'redcurrant food', 'Stachelbeere': 'gooseberry food',
  'Blutorange': 'blood orange food', 'Orange': 'orange fruit food', 'Zitrone': 'lemon food',
  'Limette': 'lime food', 'Grapefruit': 'grapefruit food', 'Bergamotte': 'bergamot citrus',
  'Meyer Zitrone': 'meyer lemon food', 'Kumquat': 'kumquat fruit', 'Pomelo': 'pomelo fruit food',
  'Yuzu': 'yuzu citrus food', 'Sudachi': 'sudachi citrus food', 'Kaffirlimette': 'kaffir lime food',
  'Feige': 'fig food', 'Granatapfel': 'pomegranate food', 'Mango': 'mango food',
  'Passionsfrucht': 'passion fruit food', 'Maracuja': 'passionfruit food',
  'Aprikose': 'apricot food', 'Pfirsich': 'peach food', 'Nektarine': 'nectarine food',
  'Mirabelle': 'mirabelle plum food', 'Quitte': 'quince fruit food', 'Mispel': 'medlar fruit',
  'Schlehe': 'sloe berry food', 'Sanddorn': 'sea buckthorn food', 'Aronia': 'aronia berry food',
  'Holunderbeere': 'elderberry food', 'Holunderblüte': 'elderflower food',
  'Holunderblütensirup': 'elderflower syrup drink', 'Kornelkirsche': 'cornelian cherry food',
  'Maulbeere': 'mulberry food', 'Lychee': 'lychee fruit food', 'Longan': 'longan fruit food',
  'Rambutan': 'rambutan fruit food', 'Mangosteen': 'mangosteen fruit food',
  'Drachenfrucht': 'dragon fruit food', 'Physalis': 'physalis food', 'Kaki': 'persimmon food',
  'Ananas': 'pineapple food', 'Papaya': 'papaya food', 'Guave': 'guava food',
  'Jackfruit': 'jackfruit food', 'Kokosnuss': 'coconut food', 'Cherimoya': 'cherimoya fruit',
  'Tamarillo': 'tamarillo fruit food', 'Karambole': 'starfruit food', 'Acai': 'acai berry food',
  'Goji': 'goji berries food', 'Kapstachelbeere': 'cape gooseberry food',
  'Nashi-Birne': 'nashi pear food', 'Durian': 'durian fruit food',
  // Fisch & Meeresfrüchte
  'Kabeljau': 'cod fish food', 'Rotbarsch': 'redfish ocean perch', 'Rotfisch': 'red fish fillet',
  'Lachs': 'salmon food', 'Forelle': 'trout fish food', 'Wolfsbarsch': 'sea bass food',
  'Loup de Mer': 'sea bass food', 'Dorade': 'sea bream fish food', 'Rotbarbe': 'red mullet fish',
  'Seeteufel': 'monkfish food', 'Heilbutt': 'halibut fish food', 'Seezunge': 'sole fish food',
  'Flunder': 'flounder fish food', 'Scholle': 'plaice fish food', 'Seebarsch': 'sea bass fish food',
  'Steinbutt': 'turbot fish food', 'Rotbrasse': 'red bream fish food', 'Rotfeder': 'rudd fish',
  'Zander': 'pike perch fish food', 'Wels': 'catfish food', 'Aal': 'eel fish food',
  'Stint': 'smelt fish food', 'Makrele': 'mackerel fish food', 'Sardine': 'sardines food',
  'Thunfisch': 'tuna fish food', 'Schwertfisch': 'swordfish food', 'Hamachi': 'yellowtail fish sushi',
  'Hummer': 'lobster food', 'Langoustine': 'langoustine seafood', 'Langustine': 'langoustine seafood',
  'Garnele': 'shrimp food', 'Crevette': 'shrimp prawn food', 'Rotbraune Crevette': 'red prawn seafood',
  'Jakobsmuschel': 'scallop food', 'Tintenfisch': 'squid calamari food', 'Oktopus': 'octopus food',
  'Venusmuschel': 'clam seafood food', 'Miesmuschel': 'mussel food', 'Herzmuschel': 'cockle seafood',
  'Abalone': 'abalone seafood food', 'Seeigel (Uni)': 'sea urchin uni food',
  'Auster': 'oyster food', 'Bottarga': 'bottarga fish roe food', 'Kaviar': 'caviar food',
  // Fleisch
  'Wagyu Beef': 'wagyu beef food', 'Rinderbäckchen': 'beef cheeks food',
  'Ochsenschwanz': 'oxtail food', 'Knochenmark': 'bone marrow food', 'Rindermark': 'bone marrow food',
  'Rinderfilet': 'beef tenderloin food', 'Rinderhüfte': 'beef sirloin food',
  'Kalbsbäckchen': 'veal cheeks food', 'Kalbsleber': 'calf liver food',
  'Kalbskotelett': 'veal chop food', 'Kalbszunge': 'veal tongue food', 'Kalbsbries': 'sweetbread food',
  'Lammrücken': 'lamb rack food', 'Lammkeule': 'leg of lamb food', 'Lammhaxe': 'lamb shank food',
  'Lammkotelett': 'lamb chop food', 'Zicklein': 'kid goat meat food', 'Hase': 'hare rabbit meat food',
  'Kaninchen': 'rabbit meat food', 'Wildschein': 'wild boar food', 'Rehkeule': 'venison leg food',
  'Hirschrücken': 'venison saddle food', 'Entenbrust': 'duck breast food',
  'Ente Confit': 'duck confit food', 'Entenconfit': 'duck confit food',
  'Foie Gras': 'foie gras food', 'Gänseleberpastete': 'foie gras terrine food',
  'Wachtel': 'quail bird food', 'Fasan': 'pheasant food', 'Rebhuhn': 'partridge food',
  'Perlhuhn': 'guinea fowl food', 'Taubenbrust': 'pigeon breast food',
  'Schwarzfederhuhn': 'black chicken food', 'Hähnchenbrust': 'chicken breast food',
  'Ibérico Secreto': 'iberico pork food', 'Ibérico Lomo': 'iberico pork loin food',
  'Schweinebauch': 'pork belly food', 'Prosciutto Crudo': 'prosciutto ham food',
  'Jamón Ibérico': 'jamon iberico ham food', 'Chorizo': 'chorizo food',
  'Blutwurst': 'black pudding blood sausage', 'Lammhirn': 'lamb brain food',
  'Kalbslungen': 'offal meat food', 'Bison': 'bison meat food',
  // Pilze
  'Schwarze Trüffel': 'black truffle food', 'Weiße Trüffel': 'white truffle food',
  'Steinpilz': 'porcini mushroom food', 'Steinpilz getrocknet': 'dried porcini mushroom',
  'Pfifferling': 'chanterelle mushroom food', 'Morchel': 'morel mushroom food',
  'Shiitake': 'shiitake mushroom food', 'Shiitake getrocknet': 'dried shiitake mushroom',
  'Enoki': 'enoki mushroom food', 'Matsutake': 'matsutake mushroom food',
  'Austernpilz': 'oyster mushroom food', 'Königsausternpilz': 'king oyster mushroom food',
  'Maitake': 'maitake mushroom food', "Lion's Mane": 'lions mane mushroom food',
  'Nameko': 'nameko mushroom food', 'Mu-Err': 'wood ear mushroom food',
  'Champignon': 'mushroom button food', 'Brauner Champignon': 'cremini mushroom food',
  'Portobello': 'portobello mushroom food', 'Samtfußrübling': 'velvet shank mushroom',
  'Trompetenpfifferling': 'golden chanterelle mushroom', 'Maronenröhrling': 'bay bolete mushroom',
  'Semmelstoppelpilz': 'hedgehog mushroom food', 'Totentrompete': 'black trumpet mushroom food',
  'Bibernell-Egerling': 'anise mushroom food', 'Reishi': 'reishi mushroom tea',
  'Chaga': 'chaga mushroom tea', 'Cordyceps': 'cordyceps mushroom supplement',
  // Kräuter & Gewürze
  'Basilikum': 'fresh basil herb food', 'Petersilie': 'parsley herb food',
  'Schnittlauch': 'chives herb food', 'Estragon': 'tarragon herb food',
  'Thymian': 'thyme herb food', 'Rosmarin': 'rosemary herb food', 'Salbei': 'sage herb food',
  'Oregano': 'oregano herb food', 'Dill': 'dill herb food', 'Minze': 'mint herb food',
  'Kerbel': 'chervil herb food', 'Bohnenkraut': 'savory herb food', 'Majoran': 'marjoram herb food',
  'Liebstöckel': 'lovage herb food', 'Melisse': 'lemon balm herb food',
  'Borretsch': 'borage herb flower food', 'Kapuzinerkresse': 'nasturtium herb food',
  'Zitronenverbene': 'lemon verbena herb food', 'Lavendel': 'lavender culinary food',
  'Essbare Rose': 'edible rose petals food', 'Hibiskus': 'hibiscus flower food',
  'Koriander frisch': 'fresh coriander herb food', 'Ingwer': 'ginger root food',
  'Knoblauch': 'garlic food', 'Schwarzer Knoblauch': 'black garlic food',
  'Kurkuma frisch': 'fresh turmeric root food', 'Lemongrass': 'lemongrass food',
  'Kaffir-Limette': 'kaffir lime leaves food', 'Kaffirlimette': 'kaffir lime food',
  'Safran': 'saffron spice food', 'Safranfäden': 'saffron threads spice',
  'Kardamom': 'cardamom spice food', 'Kardamom grün': 'green cardamom spice',
  'Zimt': 'cinnamon spice food', 'Zimt Ceylon': 'ceylon cinnamon spice',
  'Sternanis': 'star anise spice food', 'Nelke': 'cloves spice food',
  'Muskat': 'nutmeg spice food', 'Piment': 'allspice food', 'Anis': 'anise spice food',
  'Lorbeer': 'bay leaf herb food', 'Kreuzkümmel': 'cumin spice food',
  'Koriandersamen': 'coriander seeds food', 'Fenchelsamen': 'fennel seeds food',
  'Schwarzkümmel': 'nigella seeds food', 'Nigella': 'nigella seeds food',
  'Bockshornklee': 'fenugreek spice food', 'Annatto': 'annatto seeds food',
  'Cayennepfeffer': 'cayenne pepper food', 'Chili Habanero': 'habanero chili food',
  'Chili Poblano': 'poblano chili pepper food', 'Aleppo Pfeffer': 'aleppo pepper flakes food',
  'Urfa Biber': 'urfa biber chili food', 'Gochugaru': 'gochugaru korean chili food',
  'Maras Pfeffer': 'maras pepper turkish food', 'Wasabi': 'wasabi paste food',
  'Szechuan Pfeffer': 'sichuan pepper food', 'Sancho Pfeffer': 'sancho pepper japanese',
  'Grüner Pfeffer': 'green pepper peppercorn food', 'Langer Pfeffer': 'long pepper spice',
  'Kampot Pfeffer': 'kampot pepper cambodia food', 'Voatsiperifery': 'voatsiperifery pepper spice',
  'Kubebenpfeffer': 'cubeb pepper spice', 'Sumac': 'sumac spice food',
  'Ras el Hanout': 'ras el hanout spice blend food', 'Baharat': 'baharat spice food',
  'Berbere': 'berbere spice ethiopian food', "Za'atar": 'zaatar spice blend food',
  'Dukkah': 'dukkah spice nut blend food', 'Furikake': 'furikake japanese seasoning',
  'Togarashi': 'togarashi japanese spice food', 'Pandan': 'pandan leaf food',
  'Curry-Blatt': 'curry leaves food', 'Epazote': 'epazote herb mexican',
  // Fermentiertes
  'Kimchi': 'kimchi korean food', 'Sauerkraut': 'sauerkraut german food',
  'Tempeh': 'tempeh food', 'Natto': 'natto japanese food', 'Doenjang': 'doenjang korean paste food',
  'Miso Shiro': 'white miso paste food', 'Miso Mugi': 'barley miso paste food',
  'Miso Aka': 'red miso paste food', 'Garum': 'garum fish sauce food',
  'Garum di Carne': 'umami sauce food', 'Colatura di Alici': 'colatura di alici fish sauce',
  'Nam Pla': 'fish sauce thai food', 'Worcestershire': 'worcestershire sauce food',
  'Gochujang': 'gochujang korean paste food', 'Sambal Oelek': 'sambal oelek chili paste',
  'Sriracha': 'sriracha sauce food', 'Douchi': 'fermented black beans food',
  'Belachan': 'belacan shrimp paste food', 'Kombucha': 'kombucha drink fermented',
  'Amazake': 'amazake japanese sweet rice', 'Kvass': 'kvass fermented drink',
  'Tapenade': 'tapenade olive spread food', 'Chimichurri': 'chimichurri sauce food',
  'Gremolata': 'gremolata herb condiment food', 'Persillade': 'persillade herb garlic food',
  'Adjika': 'adjika georgian sauce food', 'Tepache': 'tepache fermented pineapple',
  'Fermentierter Knoblauch': 'fermented garlic food',
  'Ponzu': 'ponzu sauce japanese food', 'Mirin': 'mirin japanese cooking wine',
  'Shio Koji': 'shio koji rice malt food', 'Dashi Kombu': 'kombu dashi seaweed food',
  'Kombu': 'kombu seaweed food', 'Wakame': 'wakame seaweed food',
  'Wakame Alge': 'wakame seaweed salad food', 'Katsuobushi': 'katsuobushi bonito flakes food',
  'Sojasauce': 'soy sauce food', 'Shiso': 'shiso leaf japanese food',
  'Holunderblütensirup': 'elderflower cordial drink',
  // Öle & Fette
  'Olivenöl Extra Vergine': 'olive oil food', 'Traubenkernöl': 'grape seed oil food',
  'Sesamöl': 'sesame oil food', 'Haselnussöl': 'hazelnut oil food',
  'Walnussöl': 'walnut oil food', 'Pistazienöl': 'pistachio oil food',
  'Kürbiskernöl': 'pumpkin seed oil food', 'Macadamiaöl': 'macadamia oil food',
  'Arganöl': 'argan oil food', 'Hanföl': 'hemp seed oil food',
  'Trüffelöl': 'truffle oil food', 'Avocadoöl': 'avocado oil food',
  'Kokosfett': 'coconut oil food', 'Kakaobutter': 'cocoa butter food',
  'Braune Butter': 'brown butter beurre noisette food', 'Klärte Butter': 'clarified butter ghee food',
  'Gänseschmalz': 'goose fat schmalz food', 'Butter': 'butter food',
  'Champagneressig': 'champagne vinegar food', 'Sherryessig': 'sherry vinegar food',
  'Balsamico Tradizionale': 'balsamic vinegar modena food', 'Weißer Balsamico': 'white balsamic vinegar',
  'Weißweinessig': 'white wine vinegar food', 'Rotweinessig': 'red wine vinegar food',
  'Reisessig': 'rice vinegar japanese food', 'Apfelessig': 'apple cider vinegar food',
  'Coconut Aminos': 'coconut aminos sauce food', 'Verjus': 'verjuice food',
  'Verjus Blanc': 'verjuice white grapes food',
  // Milchprodukte & Käse
  'Burrata': 'burrata cheese food', 'Mozzarella': 'mozzarella cheese food',
  'Ricotta': 'ricotta cheese food', 'Ricotta salata': 'ricotta salata cheese food',
  'Mascarpone': 'mascarpone cheese food', 'Crème fraîche': 'crème fraîche food',
  'Labneh': 'labneh cream cheese food', 'Schmand': 'sour cream food',
  'Doppelrahm': 'heavy cream food', 'Butter': 'butter food',
  'Parmesan': 'parmesan cheese food', 'Pecorino': 'pecorino cheese food',
  'Pecorino Romano': 'pecorino romano cheese food', 'Comté': 'comté cheese food',
  'Comté Alt': 'aged comté cheese food', 'Gruyère': 'gruyere cheese food',
  'Sbrinz': 'sbrinz cheese food', 'Sbrinz Extrahart': 'hard swiss cheese food',
  'Brie': 'brie cheese food', 'Camembert': 'camembert cheese food',
  'Roquefort': 'roquefort blue cheese food', 'Gorgonzola': 'gorgonzola cheese food',
  'Stilton': 'stilton blue cheese food', 'Manchego': 'manchego cheese food',
  'Manchego Viejo': 'aged manchego cheese food', 'Époisses': 'époisses cheese washed rind',
  'Munster': 'munster cheese food', 'Taleggio': 'taleggio cheese food',
  'Fontina': 'fontina cheese food', 'Asiago': 'asiago cheese food',
  'Provolone': 'provolone cheese food', 'Scamorza': 'scamorza smoked cheese food',
  'Halloumi': 'halloumi cheese grilled food', 'Feta': 'feta cheese food',
  'Mimolette': 'mimolette cheese food', 'Beaufort': 'beaufort cheese alpine food',
  'Ossau-Iraty': 'ossau iraty sheep cheese food', 'Idiazabal': 'idiazabal smoked cheese food',
  'Graviera': 'graviera greek cheese food', 'Ziegenkäse': 'goat cheese chèvre food',
  'Schafskäse': 'sheep milk cheese food', 'Stracciatella di Bufala': 'stracciatella burrata food',
  "Vacherin Mont d'Or": 'vacherin mont dor cheese food', 'Raclette Käse': 'raclette cheese food',
  'Brillat-Savarin': 'triple cream cheese food', 'Stracciatella': 'stracciatella cheese food',
  // Getreide & Hülsenfrüchte
  'Quinoa': 'quinoa food', 'Buchweizen': 'buckwheat food', 'Polenta': 'polenta food',
  'Risottoreis': 'arborio risotto rice food', 'Panko': 'panko breadcrumbs food',
  'Weißer Reis': 'white rice food', 'Basmati': 'basmati rice food',
  'Wildreis': 'wild rice food', 'Bulgur': 'bulgur wheat food', 'Couscous': 'couscous food',
  'Farro': 'farro ancient grain food', 'Teff': 'teff grain food', 'Amaranth': 'amaranth grain food',
  'Freekeh': 'freekeh green wheat food', 'Sorghum': 'sorghum grain food',
  'Emmer': 'emmer wheat ancient grain', 'Kamut': 'kamut grain food',
  'Schwarze Bohne': 'black beans food', 'Adzuki': 'adzuki red beans food',
  'Mungobohne': 'mung beans food', 'Belugalinse': 'beluga lentils food',
  'Puy-Linse': 'puy lentils french food', 'Weiße Bohne': 'white beans food',
  'Fava-Bohne': 'fava beans food', 'Kichererbse': 'chickpeas food',
  'Mohn': 'poppy seeds food', 'Edamame': 'edamame soybeans food',
  'Tapioka': 'tapioca pearls food', 'Lupine': 'lupin beans food',
  'Lotussamen': 'lotus seeds food', 'Wakame': 'wakame seaweed food',
  'Kombu': 'kombu seaweed food', 'Wakame Alge': 'wakame seaweed food',
  'Dashi Kombu': 'kombu seaweed dashi food',
  // Nüsse & Samen
  'Walnuss': 'walnut food', 'Mandel': 'almond food', 'Haselnuss': 'hazelnut food',
  'Pistazie': 'pistachio food', 'Pinienkern': 'pine nuts food',
  'Pinienkerne geröstet': 'roasted pine nuts food', 'Paranuss': 'brazil nut food',
  'Paranuss geröstet': 'roasted brazil nut food', 'Macadamia': 'macadamia nut food',
  'Pekannuss': 'pecan nut food', 'Cashew': 'cashew nut food', 'Erdnuss': 'peanut food',
  'Mandelsplitter': 'sliced almonds food', 'Kürbiskern': 'pumpkin seeds food',
  'Sonnenblumenkern': 'sunflower seeds food', 'Leinsamen': 'flax seeds food',
  'Chiasamen': 'chia seeds food', 'Sesam': 'sesame seeds food',
  'Schwarzer Sesam': 'black sesame seeds food', 'Hanfsamen': 'hemp seeds food',
  'Tigernuss': 'tiger nut food', 'Kokosflocken': 'desiccated coconut food',
  'Walnussöl': 'walnut oil food',
};

function getSearchQuery(name) {
  return TRANSLATIONS[name] || `${name} food ingredient`;
}

async function fetchPexels(query) {
  const url = `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=1&orientation=landscape`;
  const res = await fetch(url, { headers: { Authorization: PEXELS_KEY } });
  if (!res.ok) { console.error(`  Pexels HTTP ${res.status}`); return null; }
  const data = await res.json();
  return data.photos?.[0]?.src?.medium ?? null;
}

async function updateImageUrl(id, url) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/zutaten?id=eq.${id}`, {
    method: 'PATCH',
    headers: { ...SB, 'Prefer': 'return=minimal' },
    body: JSON.stringify({ image_url: url }),
  });
  if (!res.ok) console.error(`  Supabase update failed for id ${id}: ${res.status}`);
}

// ── Main ──────────────────────────────────────────────────────────────────────

const res = await fetch(
  `${SUPABASE_URL}/rest/v1/zutaten?select=id,name,image_url&image_url=is.null&order=id`,
  { headers: SB }
);
const zutaten = await res.json();
console.log(`\n${zutaten.length} Zutaten ohne Bild gefunden.\n`);

// 200 req/hour = 1 per 18s. 19s gives ~189/hour — safely below limit.
const DELAY_MS = 19000;
const MAX = 180;
let processed = 0;
let found = 0;
let notFound = 0;

for (const z of zutaten) {
  if (processed >= MAX) {
    console.log(`\n⏸  Stop nach ${MAX} Anfragen (Rate-Limit Schutz).`);
    break;
  }

  const query = getSearchQuery(z.name);
  const imgUrl = await fetchPexels(query);

  if (imgUrl) {
    await updateImageUrl(z.id, imgUrl);
    console.log(`✓ ${z.name.padEnd(30)} → ${imgUrl.slice(0, 60)}…`);
    found++;
  } else {
    console.log(`✗ ${z.name.padEnd(30)} (kein Bild gefunden)`);
    notFound++;
  }

  processed++;
  await new Promise(r => setTimeout(r, DELAY_MS));
}

console.log(`\n──────────────────────────────────────────`);
console.log(`Verarbeitet: ${processed}  |  Gefunden: ${found}  |  Nicht gefunden: ${notFound}`);

// Final count
const countRes = await fetch(
  `${SUPABASE_URL}/rest/v1/zutaten?select=id&image_url=not.is.null`,
  { headers: SB }
);
const withImages = await countRes.json();
console.log(`\nZutaten mit image_url in DB: ${withImages.length} / 500`);
