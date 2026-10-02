/* =========================================================
   DONNÉES DU PROGRAMME — c'est le seul fichier à modifier
   chaque semaine (séances, recettes, menus, courses).
   Les macros sont calculées automatiquement à partir des
   grammes et de la table FOODS (valeurs pour 100 g, poids cru
   sauf mention "cuit"). Sources : table officielle japonaise
   (日本食品標準成分表 2020) et étiquettes courantes.
   ========================================================= */

window.PLAN = {
  version: "2026-W40",
  startWeight: 110,
  goalWeight: 90,
  targets: { kcal: 2200, p: 185, c: 220, f: 65 },
};

/* Produits de placard : achetés une fois, ils durent plusieurs semaines.
   Ils sont rangés à part dans la liste de courses. */
window.PANTRY = ["riz", "whey", "soja", "ponzu", "miso", "huileSesame", "sesame", "vinaigre",
  "doubanjiang", "katsuobushi", "dashi", "epices", "fecule", "wakame", "nori"];

/* ---------- Table nutritionnelle (pour 100 g) ----------
   [nom, kcal, protéines, glucides, lipides, rayon] */
window.FOODS = {
  riz:          ["Riz blanc cuit", 156, 2.5, 37.1, 0.3, "Féculents"],
  soba:         ["Soba sec", 344, 14.0, 66.7, 2.3, "Féculents"],
  udon:         ["Udon surgelé (1 pack = 200 g)", 95, 2.6, 21.6, 0.4, "Féculents"],
  patate:       ["Patate douce (crue)", 126, 1.2, 31.9, 0.2, "Féculents"],
  fecule:       ["Fécule (katakuriko)", 330, 0.1, 81.6, 0.1, "Épicerie"],

  pouletBlanc:  ["Blanc de poulet sans peau", 105, 23.3, 0.1, 1.9, "Protéines"],
  pouletCuisse: ["Cuisse de poulet sans peau", 113, 19.0, 0.0, 5.0, "Protéines"],
  porcMomo:     ["Porc maigre (momo)", 119, 22.1, 0.2, 3.6, "Protéines"],
  boeufMomo:    ["Bœuf maigre (momo)", 117, 21.2, 0.4, 4.3, "Protéines"],
  shiozake:     ["Saumon salé (shiozake)", 183, 22.4, 0.1, 11.1, "Protéines"],
  saumon:       ["Saumon frais (filet)", 124, 22.3, 0.1, 4.1, "Protéines"],
  saumonSashimi:["Saumon sashimi", 218, 20.1, 0.1, 16.1, "Protéines"],
  thon:         ["Thon maigre (akami)", 115, 26.4, 0.1, 1.4, "Protéines"],
  saba:         ["Maquereau (saba)", 211, 20.6, 0.3, 16.8, "Protéines"],
  crevette:     ["Crevettes décortiquées", 82, 19.6, 0.3, 0.6, "Protéines"],
  oeuf:         ["Œuf entier (1 = 50 g)", 142, 12.2, 0.4, 10.2, "Protéines"],
  blancOeuf:    ["Blanc d'œuf", 44, 10.1, 0.5, 0.0, "Protéines"],
  tofuFerme:    ["Tofu ferme (momen)", 73, 7.0, 1.5, 4.9, "Protéines"],
  tofuSoyeux:   ["Tofu soyeux (kinu)", 56, 5.3, 2.0, 3.5, "Protéines"],
  whey:         ["Whey (shaker)", 380, 80.0, 7.0, 6.0, "Protéines"],

  chouChinois:  ["Chou chinois (hakusai)", 13, 0.8, 3.2, 0.1, "Légumes"],
  chou:         ["Chou (kyabetsu)", 21, 1.3, 5.2, 0.2, "Légumes"],
  brocoli:      ["Brocoli", 37, 5.4, 6.6, 0.6, "Légumes"],
  epinards:     ["Épinards", 18, 2.2, 3.1, 0.4, "Légumes"],
  shimeji:      ["Shimeji", 26, 2.7, 4.8, 0.5, "Légumes"],
  enoki:        ["Enoki", 34, 2.7, 7.6, 0.2, "Légumes"],
  moyashi:      ["Pousses de soja (moyashi)", 15, 1.7, 2.6, 0.1, "Légumes"],
  oignon:       ["Oignon", 33, 1.0, 8.4, 0.1, "Légumes"],
  negi:         ["Ciboule (negi)", 35, 1.4, 8.3, 0.1, "Légumes"],
  concombre:    ["Concombre", 13, 1.0, 3.0, 0.1, "Légumes"],
  goya:         ["Goya (ou chou)", 15, 1.0, 3.9, 0.1, "Légumes"],
  poivron:      ["Poivron", 20, 0.9, 5.1, 0.2, "Légumes"],
  carotte:      ["Carotte", 35, 0.7, 9.3, 0.2, "Légumes"],
  gingembre:    ["Gingembre frais", 30, 0.9, 6.6, 0.3, "Légumes"],
  ail:          ["Ail", 136, 6.4, 27.5, 0.9, "Légumes"],
  wakame:       ["Wakame réhydratée", 17, 2.0, 5.9, 0.2, "Épicerie"],
  kimchi:       ["Kimchi", 27, 2.3, 5.4, 0.1, "Épicerie"],
  nori:         ["Nori (1 feuille = 3 g)", 297, 41.4, 44.3, 3.7, "Épicerie"],

  soja:         ["Sauce soja", 77, 7.7, 7.9, 0.0, "Sauces"],
  ponzu:        ["Ponzu", 50, 3.5, 8.0, 0.0, "Sauces"],
  miso:         ["Miso", 182, 12.5, 21.9, 6.0, "Sauces"],
  huileSesame:  ["Huile de sésame", 890, 0.0, 0.0, 100.0, "Sauces"],
  sesame:       ["Graines de sésame", 599, 20.3, 18.5, 54.2, "Sauces"],
  vinaigre:     ["Vinaigre de riz", 46, 0.1, 7.4, 0.0, "Sauces"],
  doubanjiang:  ["Doubanjiang", 49, 2.0, 7.9, 1.8, "Sauces"],
  katsuobushi:  ["Katsuobushi", 332, 75.7, 0.4, 2.9, "Sauces"],
  dashi:        ["Dashi (poudre, dilué)", 0, 0, 0, 0, "Sauces"],
  epices:       ["Épices (shichimi, poivre, yuzu koshō)", 0, 0, 0, 0, "Sauces"],
};

/* ---------- Recettes (1 portion) ----------
   ing: [clé aliment, grammes, précision]                       */
window.RECIPES = {
  /* ===== PETITS-DÉJEUNERS ===== */
  teishokuSaumon: {
    name: "Teishoku saumon grillé", jp: "鮭定食", meal: "breakfast", time: 15,
    ing: [
      ["riz", 150], ["shiozake", 100, "1 pavé"], ["oeuf", 100, "2 œufs"],
      ["soja", 5], ["huileSesame", 3, "pour la poêle"], ["dashi", 0, "1 c. à café dans les œufs"],
      ["miso", 15, "soupe"], ["tofuFerme", 50, "soupe"], ["wakame", 20, "soupe"], ["negi", 5],
    ],
    steps: [
      "Grille le saumon salé 8 min à la poêle à sec (ou au gril du four), peau d'abord.",
      "Bats les 2 œufs avec le dashi et la sauce soja. Huile la poêle au papier, verse en 3 fois en roulant à chaque fois : tamagoyaki salé.",
      "Soupe : 200 ml d'eau chaude, dashi, tofu en dés et wakame. Hors du feu, dilue le miso, ajoute la ciboule.",
      "Sers avec le riz chaud.",
    ],
    tip: "Le saumon salé est déjà très assaisonné : pas de soja dessus.",
  },
  bolOeufPoulet: {
    name: "Bol œufs brouillés dashi & poulet", jp: "鶏そぼろ玉子丼", meal: "breakfast", time: 10,
    ing: [
      ["riz", 150], ["oeuf", 150, "3 œufs"], ["pouletBlanc", 80, "poids cru, cuit du dimanche"],
      ["soja", 8], ["huileSesame", 4], ["dashi", 0], ["nori", 3, "1 feuille"],
      ["negi", 10], ["sesame", 3],
    ],
    steps: [
      "Effiloche le poulet cuit et réchauffe-le 1 min à la poêle avec 1 c. à café de soja.",
      "Bats les œufs avec une pincée de dashi. Cuis à feu doux en remuant avec des baguettes jusqu'à des petits grains moelleux.",
      "Sur le riz : moitié œufs, moitié poulet. Arrose d'huile de sésame et du reste de soja.",
      "Nori émiettée, ciboule et sésame par-dessus.",
    ],
    tip: "Version soboro classique sans sucre : c'est le goût du dashi qui fait tout.",
  },
  sabaHiyayakko: {
    name: "Saba grillé & tofu froid", jp: "鯖と冷奴", meal: "breakfast", time: 12,
    ing: [
      ["riz", 180], ["saba", 80, "1 filet"], ["tofuFerme", 150, "1/2 bloc"], ["oeuf", 50, "1 œuf au plat"],
      ["gingembre", 5, "râpé"], ["negi", 10], ["katsuobushi", 2], ["soja", 8],
      ["miso", 12, "soupe"], ["wakame", 20, "soupe"],
    ],
    steps: [
      "Grille le saba côté peau 6 à 7 min jusqu'à ce qu'elle croustille.",
      "Œuf au plat dans la poêle du saba, en fin de cuisson.",
      "Égoutte le tofu, coupe-le en deux. Dessus : gingembre, ciboule, katsuobushi, un trait de soja.",
      "Soupe miso express avec la wakame.",
      "Riz chaud à côté.",
    ],
    tip: "Le saba apporte les oméga-3 de la semaine : garde-le au moins 2 fois.",
  },
  okayuPoulet: {
    name: "Okayu poulet-gingembre", jp: "鶏粥", meal: "breakfast", time: 20,
    ing: [
      ["riz", 180, "riz déjà cuit"], ["pouletBlanc", 130], ["oeuf", 100, "2 œufs"],
      ["gingembre", 10, "en julienne"], ["negi", 15], ["huileSesame", 4],
      ["soja", 6], ["dashi", 0], ["epices", 0, "poivre blanc"],
    ],
    steps: [
      "Coupe le poulet en petits morceaux. Mets-le dans 500 ml d'eau froide avec le dashi et la moitié du gingembre. Porte à frémissement 8 min.",
      "Ajoute le riz cuit, laisse mijoter 8 min en remuant : ça devient crémeux.",
      "Casse les 2 œufs dedans, couvre 2 min (ou bats-les en filet pour une texture soyeuse).",
      "Finis avec soja, huile de sésame, ciboule, reste de gingembre, poivre blanc.",
    ],
    tip: "Parfait les matins froids ou après une grosse séance jambes.",
  },
  tamagoEpinards: {
    name: "Omelette shimeji, épinards au sésame", jp: "きのこオムレツ定食", meal: "breakfast", time: 12,
    ing: [
      ["riz", 180], ["oeuf", 100, "2 œufs"], ["blancOeuf", 120, "brick de blancs"],
      ["shimeji", 60], ["epinards", 80], ["soja", 8], ["huileSesame", 5], ["sesame", 4],
      ["tofuFerme", 60, "soupe"], ["miso", 12, "soupe"],
    ],
    steps: [
      "Épinards 1 min dans l'eau bouillante, essore, coupe. Assaisonne avec 1/2 c. à café de soja et le sésame : goma-ae salé.",
      "Fais sauter les shimeji 2 min avec la moitié de l'huile de sésame et un trait de soja.",
      "Bats œufs + blancs, verse sur les champignons, plie l'omelette quand le dessus est encore baveux.",
      "Soupe miso au tofu, riz chaud.",
    ],
    tip: "Les blancs d'œufs en brique (卵白) se trouvent chez Gyomu Super.",
  },

  /* ===== DÉJEUNERS ===== */
  zaruSobaPoulet: {
    name: "Zaru soba poulet & sauce sésame", jp: "ざるそば 鶏胸", meal: "lunch", time: 15,
    ing: [
      ["soba", 100], ["pouletBlanc", 180], ["oeuf", 50, "1 œuf mollet"],
      ["concombre", 100], ["negi", 15], ["nori", 2],
      ["soja", 20], ["huileSesame", 5], ["sesame", 6], ["vinaigre", 5], ["dashi", 0],
    ],
    steps: [
      "Poche le poulet : dans l'eau froide salée, porte à frémissement, coupe le feu et couvre 15 min. Il reste juteux. Tranche-le.",
      "Œuf 6 min 30 dans l'eau bouillante, puis eau glacée.",
      "Soba : cuisson du paquet (4-5 min), rince bien à l'eau froide en frottant.",
      "Sauce : soja + 60 ml d'eau + dashi + vinaigre + huile de sésame + sésame moulu.",
      "Concombre écrasé au plat du couteau, une pincée de sel. Trempe les soba dans la sauce.",
    ],
    tip: "Fais pocher 600 g de poulet d'un coup : ça sert pour 3 repas.",
  },
  pouletSesameMeal: {
    name: "Poulet soja-ail-sésame, riz & brocolis", jp: "鶏むね ごま醤油", meal: "lunch", time: 20,
    ing: [
      ["pouletBlanc", 200], ["riz", 180], ["brocoli", 150],
      ["soja", 12], ["ail", 5, "1 gousse"], ["gingembre", 5], ["huileSesame", 6], ["sesame", 4],
      ["fecule", 5],
    ],
    steps: [
      "Coupe le poulet en tranches fines en biais. Masse avec soja, ail et gingembre râpés, puis la fécule : il restera tendre.",
      "Poêle chaude, la moitié de l'huile de sésame. Saisis 2 min par face.",
      "Brocolis 3 min à la vapeur ou au micro-ondes (couvert, 2 c. à soupe d'eau).",
      "Finis avec le reste d'huile de sésame à cru et le sésame.",
    ],
    tip: "La fécule autour du blanc de poulet change tout : il ne sèche plus.",
  },
  nikuUdon: {
    name: "Niku udon bœuf-oignon", jp: "肉うどん", meal: "lunch", time: 15,
    ing: [
      ["udon", 300, "1 pack et demi"], ["boeufMomo", 170, "tranché fin"], ["oignon", 60],
      ["oeuf", 50, "1 œuf"], ["epinards", 60], ["negi", 15],
      ["soja", 20], ["dashi", 0], ["epices", 0, "shichimi"],
    ],
    steps: [
      "Bouillon : 400 ml d'eau, dashi, 15 g de soja, chauffe.",
      "Dans une poêle, oignon émincé 2 min, puis bœuf + 5 g de soja, 1 min juste.",
      "Udon 1 min au micro-ondes puis dans le bouillon avec les épinards, 1 min.",
      "Bœuf sur le dessus, casse l'œuf dans le bouillon chaud, ciboule et shichimi.",
    ],
    tip: "Les udon sont la spécialité de Fukuoka : gonbo ten en extra si tu sors, pas à la maison.",
  },
  goyaChampuru: {
    name: "Champuru porc-tofu-chou", jp: "キャベツチャンプルー", meal: "lunch", time: 15,
    ing: [
      ["porcMomo", 150], ["tofuFerme", 150], ["oeuf", 50],
      ["chou", 150], ["riz", 150],
      ["huileSesame", 6], ["soja", 10], ["katsuobushi", 3], ["dashi", 0],
    ],
    steps: [
      "Presse le tofu 10 min sous une assiette, coupe en gros cubes.",
      "Chou coupé en gros carrés de 4 cm.",
      "Poêle, huile de sésame : tofu doré 3 min, réserve. Porc 2 min, puis chou 2 min à feu vif.",
      "Remets le tofu, soja et dashi, verse l'œuf battu, mélange 30 s. Katsuobushi dessus.",
    ],
    tip: "Version d'Okinawa : avec de la goya (concombre amer) si tu veux tester.",
  },
  kakeSobaPoulet: {
    name: "Soba chaud poulet & champignons", jp: "鶏きのこそば", meal: "lunch", time: 15,
    ing: [
      ["soba", 100], ["pouletCuisse", 160], ["shimeji", 100],
      ["negi", 20], ["oeuf", 50],
      ["soja", 22], ["dashi", 0], ["epices", 0, "yuzu koshō ou shichimi"],
    ],
    steps: [
      "Coupe la cuisse en bouchées, saisis-la à la poêle sèche 4 min côté peau retirée.",
      "Bouillon : 450 ml d'eau, dashi, soja. Ajoute poulet et champignons, 5 min.",
      "Cuis les soba à part, rince rapidement, mets-les dans le bol.",
      "Verse le bouillon, ajoute l'œuf poché ou cru, ciboule et une pointe de yuzu koshō.",
    ],
    tip: "Le yuzu koshō est la touche de Kyushu : citronné, pimenté, zéro calorie.",
  },
  mapoTofu: {
    name: "Mapo tofu léger", jp: "麻婆豆腐", meal: "lunch", time: 15,
    ing: [
      ["tofuFerme", 250], ["porcMomo", 120, "haché au couteau ou acheté haché maigre"], ["riz", 150],
      ["doubanjiang", 12], ["ail", 5], ["gingembre", 5], ["negi", 20],
      ["soja", 8], ["huileSesame", 5], ["fecule", 6], ["epices", 0, "poivre du Sichuan"],
    ],
    steps: [
      "Tofu en cubes de 2 cm, 2 min dans l'eau frémissante salée (il tiendra mieux).",
      "Poêle, huile de sésame, ail et gingembre 30 s, puis doubanjiang 30 s.",
      "Porc haché 3 min, puis 150 ml d'eau et soja. Ajoute le tofu, mijote 3 min.",
      "Lie avec la fécule diluée dans 2 c. à soupe d'eau. Ciboule, poivre du Sichuan.",
    ],
    tip: "Pique comme tu veux : le piment n'ajoute rien en calories.",
  },
  chahan: {
    name: "Chahan poulet aux œufs", jp: "鶏チャーハン", meal: "lunch", time: 12,
    ing: [
      ["riz", 160, "idéalement de la veille"], ["pouletBlanc", 150], ["oeuf", 100, "2 œufs"],
      ["negi", 30], ["epinards", 60],
      ["huileSesame", 7], ["soja", 10], ["epices", 0, "poivre, sel"],
    ],
    steps: [
      "Poulet en petits dés, saisi 3 min à la poêle très chaude avec la moitié de l'huile. Réserve.",
      "Riz froid dans la poêle chaude, écrase les grumeaux.",
      "Pousse le riz sur le côté, verse les œufs battus, brouille, mélange à tout le riz.",
      "Remets le poulet, épinards, soja versé sur les bords de la poêle, ciboule, reste d'huile de sésame.",
    ],
    tip: "Riz froid = grains séparés. Garde toujours une boîte de riz au frigo.",
  },

  /* ===== DÎNERS ===== */
  mizutaki: {
    name: "Mizutaki de Hakata + zosui", jp: "水炊き", meal: "dinner", time: 35,
    ing: [
      ["pouletCuisse", 220], ["tofuFerme", 100], ["chouChinois", 200], ["shimeji", 80],
      ["negi", 30], ["riz", 120, "pour le zosui"], ["oeuf", 50, "pour le zosui"],
      ["ponzu", 30], ["epices", 0, "yuzu koshō"], ["gingembre", 5],
    ],
    steps: [
      "Poulet en morceaux, 25 min à petits bouillons dans 800 ml d'eau avec le gingembre. Écume.",
      "Ajoute chou chinois (les côtes d'abord), tofu, shimeji, negi. 5 min.",
      "Mange en trempant dans le ponzu avec une pointe de yuzu koshō.",
      "Zosui final : riz dans le bouillon restant, 3 min, œuf battu en filet, ciboule.",
    ],
    tip: "Le plat signature de Fukuoka. Double la recette : ça fait un déjeuner du lendemain.",
  },
  butaShabu: {
    name: "Buta shabu ponzu & patate douce", jp: "豚しゃぶサラダ", meal: "dinner", time: 25,
    ing: [
      ["porcMomo", 200, "tranches shabu-shabu"], ["chou", 150], ["moyashi", 100], ["concombre", 50],
      ["patate", 250], ["ponzu", 25], ["huileSesame", 5], ["sesame", 4],
    ],
    steps: [
      "Patate douce lavée, en tronçons, 6-7 min au micro-ondes enveloppée de film (ou 25 min au four à 200°C).",
      "Eau frémissante (pas bouillante), plonge les tranches de porc une par une 30 s, puis égoutte sans les rincer.",
      "Dans la même eau, moyashi 1 min.",
      "Lit de chou émincé fin et concombre, porc et moyashi dessus. Ponzu, huile de sésame, sésame.",
    ],
    tip: "Eau frémissante = porc tendre. Bouillante = porc caoutchouc.",
  },
  saumonSesame: {
    name: "Saumon grillé soja-sésame", jp: "鮭のごま醤油焼き", meal: "dinner", time: 20,
    ing: [
      ["saumon", 220, "2 filets"], ["riz", 180], ["brocoli", 150], ["shimeji", 50],
      ["soja", 10], ["gingembre", 5], ["huileSesame", 4], ["sesame", 4],
    ],
    steps: [
      "Sèche le saumon au papier, sale légèrement, 10 min.",
      "Poêle avec la moitié de l'huile de sésame, peau d'abord 4 min, retourne 2 min.",
      "Ajoute shimeji, puis soja et gingembre râpé, nappe 30 s.",
      "Brocolis vapeur, sésame sur le saumon, reste d'huile à cru.",
    ],
    tip: "Ne retourne le saumon qu'une seule fois : peau croustillante garantie.",
  },
  gyudonLight: {
    name: "Gyudon light & ohitashi", jp: "牛丼", meal: "dinner", time: 20,
    ing: [
      ["boeufMomo", 220, "tranché fin"], ["oignon", 100], ["shimeji", 50], ["riz", 180], ["oeuf", 50, "œuf mollet"],
      ["epinards", 80], ["sesame", 3],
      ["soja", 20], ["gingembre", 8], ["dashi", 0], ["epices", 0, "beni shōga, shichimi"],
    ],
    steps: [
      "100 ml d'eau, dashi, 15 g de soja et gingembre en julienne dans une petite casserole.",
      "Oignon émincé 5 min dedans jusqu'à ce qu'il soit fondant, puis shimeji.",
      "Bœuf, 2 min seulement en le détachant. Verse sur le riz avec un peu de jus, œuf mollet au centre.",
      "Ohitashi : épinards blanchis, essorés, 5 g de soja, sésame.",
    ],
    tip: "La version de chaîne contient du sucre et du mirin : la tienne est 100 % salée.",
  },
  kaisendon: {
    name: "Kaisendon thon", jp: "海鮮丼", meal: "dinner", time: 15,
    ing: [
      ["thon", 170, "ou mélange thon-saumon"], ["riz", 160], ["vinaigre", 10, "dans le riz"],
      ["wakame", 40], ["concombre", 60], ["ponzu", 10], ["sesame", 3],
      ["nori", 3], ["soja", 10], ["epices", 0, "wasabi"],
      ["tofuFerme", 80, "soupe miso"], ["miso", 12],
    ],
    steps: [
      "Mélange le riz tiède avec le vinaigre et une pincée de sel (pas de sucre).",
      "Tranche le poisson en lamelles de 1 cm.",
      "Salade : wakame, concombre en rondelles, ponzu, sésame.",
      "Riz, nori, poisson. Soja + wasabi à côté. Soupe miso au tofu.",
    ],
    tip: "Achète le poisson le jour même. Après 19 h, les supermarchés font -30 % sur les sashimis.",
  },
  yakitoriShio: {
    name: "Yakitori shio maison & shio kyabetsu", jp: "焼き鳥 塩", meal: "dinner", time: 30,
    ing: [
      ["pouletCuisse", 150], ["pouletBlanc", 100], ["negi", 60],
      ["shimeji", 60, "en brochette ou poêlés"], ["patate", 200], ["chou", 150], ["huileSesame", 5],
      ["epices", 0, "sel, shichimi, citron"],
    ],
    steps: [
      "Patate douce au micro-ondes ou au four (voir buta shabu).",
      "Poulet en cubes de 3 cm, alterne avec les tronçons de negi sur des piques (ou à la poêle, sans pique).",
      "Sel des deux côtés. Poêle-gril ou four à 250°C, 10-12 min en retournant.",
      "Shio kyabetsu comme dans les yakitoris de Fukuoka : chou en gros morceaux, huile de sésame, sel. Shichimi et citron sur le poulet.",
    ],
    tip: "Au resto, demande toujours « shio » (sel) plutôt que « tare » (sauce sucrée).",
  },
  kimchiNabe: {
    name: "Kimchi nabe porc-tofu", jp: "キムチ鍋", meal: "dinner", time: 20,
    ing: [
      ["porcMomo", 180], ["tofuFerme", 150], ["oeuf", 50], ["kimchi", 100],
      ["chouChinois", 150], ["moyashi", 100], ["negi", 20], ["riz", 100],
      ["miso", 10], ["soja", 5], ["huileSesame", 4], ["ail", 5], ["dashi", 0],
    ],
    steps: [
      "Casserole, huile de sésame, ail, porc 2 min, puis kimchi 2 min : c'est là que le goût se crée.",
      "500 ml d'eau, dashi, miso, soja. Porte à frémissement.",
      "Chou chinois, tofu, moyashi, 5 min. Casse l'œuf au centre, 2 min.",
      "Ciboule, riz à côté.",
    ],
    tip: "Le kimchi qui a quelques semaines donne un meilleur bouillon.",
  },
};

/* ---------- Sauces maison (1 portion) ---------- */
window.SAUCES = [
  { name: "Sésame-soja-gingembre", jp: "ごま醤油", ing: [["soja", 10], ["huileSesame", 4], ["sesame", 4], ["gingembre", 3], ["vinaigre", 5]],
    use: "Poulet poché, tofu froid, salade de chou." },
  { name: "Negi shio", jp: "ネギ塩だれ", ing: [["negi", 20], ["huileSesame", 5], ["ail", 2], ["epices", 0, "sel, poivre noir, citron"]],
    use: "Porc grillé, poulet, sur le riz. Une tuerie." },
  { name: "Ponzu yuzu koshō", jp: "柚子胡椒ポン酢", ing: [["ponzu", 20], ["epices", 0, "1/4 c. à café de yuzu koshō"]],
    use: "Nabe, buta shabu, poisson grillé." },
  { name: "Soja-ail-piment", jp: "にんにく醤油", ing: [["soja", 10], ["ail", 3], ["huileSesame", 3], ["epices", 0, "piment, shichimi"]],
    use: "Bœuf, œufs, légumes sautés." },
  { name: "Miso-sésame (sans sucre)", jp: "ごま味噌", ing: [["miso", 10], ["sesame", 4], ["vinaigre", 5]],
    use: "Diluer avec 1 c. à soupe d'eau : légumes vapeur, patate douce." },
];

/* ---------- Menus semaine par semaine ----------
   Une entrée par lundi. Si une semaine n'a pas encore de menu,
   l'app reprend le dernier menu disponible.            */
window.WEEKS = {
  "2026-10-05": {
    label: "Semaine 1",
    note: "Première semaine : pèse le riz et les viandes, ça calibre ton œil pour la suite.",
    menu: [
      { breakfast: "teishokuSaumon", lunch: "zaruSobaPoulet",   dinner: "mizutaki" },
      { breakfast: "bolOeufPoulet",  lunch: "pouletSesameMeal", dinner: "butaShabu" },
      { breakfast: "sabaHiyayakko",  lunch: "nikuUdon",         dinner: "saumonSesame" },
      { breakfast: "okayuPoulet",    lunch: "goyaChampuru",     dinner: "gyudonLight" },
      { breakfast: "tamagoEpinards", lunch: "kakeSobaPoulet",   dinner: "kaisendon" },
      { breakfast: "teishokuSaumon", lunch: "mapoTofu",         dinner: "yakitoriShio" },
      { breakfast: "okayuPoulet",    lunch: "chahan",           dinner: "kimchiNabe" },
    ],
  },
};

window.SHAKER = { name: "Shaker whey à l'eau", ing: [["whey", 30]] };

/* ---------- Programme salle ---------- */
window.SESSIONS = {
  upperA: {
    name: "Haut A", focus: "Force", kind: "gym", duration: 70,
    ex: [
      { n: "Développé couché barre", s: 4, r: "5-6", rest: 180, cue: "Omoplates serrées, pieds ancrés, barre au bas des pecs." },
      { n: "Tractions lestées", s: 4, r: "6-8", rest: 150, cue: "Ou tirage vertical lourd. Poitrine vers la barre, pas de balancier." },
      { n: "Développé militaire debout", s: 3, r: "6-8", rest: 150, cue: "Fessiers et abdos serrés, la tête passe sous la barre." },
      { n: "Rowing barre", s: 3, r: "8", rest: 120, cue: "Buste à 45°, tire vers le nombril." },
      { n: "Dips", s: 3, r: "8-10", rest: 120, cue: "Buste légèrement penché, descends jusqu'à 90°." },
      { n: "Curl incliné + extension triceps poulie", s: 3, r: "10-12", rest: 75, cue: "Superset : enchaîne les deux, repos après." },
      { n: "Face pull", s: 3, r: "15", rest: 60, cue: "Coudes hauts, écarte la corde au niveau du front." },
    ],
    cardio: "Marche inclinée 20 min — 12 %, 5 km/h",
  },
  lowerA: {
    name: "Bas A", focus: "Force", kind: "gym", duration: 65,
    ex: [
      { n: "Squat barre", s: 4, r: "5-6", rest: 180, cue: "Gainage avant de descendre, genoux dans l'axe des pieds." },
      { n: "Soulevé de terre roumain", s: 3, r: "8", rest: 150, cue: "Hanches vers l'arrière, barre collée aux cuisses, dos neutre." },
      { n: "Fentes bulgares haltères", s: 3, r: "8-10 / jambe", rest: 90, cue: "Buste droit pour les quadris, penché pour les fessiers." },
      { n: "Leg curl allongé", s: 3, r: "10-12", rest: 75, cue: "Contrôle la descente sur 2 secondes." },
      { n: "Mollets debout", s: 4, r: "10-12", rest: 60, cue: "Pause d'une seconde en bas, étirement complet." },
      { n: "Relevés de jambes suspendu", s: 3, r: "10-15", rest: 60, cue: "Enroule le bassin, pas d'élan." },
    ],
    cardio: null,
  },
  upperB: {
    name: "Haut B", focus: "Volume", kind: "gym", duration: 70,
    ex: [
      { n: "Développé incliné haltères", s: 4, r: "8-10", rest: 120, cue: "Banc à 30°, descends jusqu'à l'étirement des pecs." },
      { n: "Rowing poitrine appuyée", s: 4, r: "10", rest: 90, cue: "Pause d'une seconde omoplates serrées." },
      { n: "Tirage vertical prise neutre", s: 3, r: "10-12", rest: 90, cue: "Coudes vers les hanches." },
      { n: "Élévations latérales", s: 4, r: "12-15", rest: 60, cue: "Léger, strict, montée jusqu'aux épaules." },
      { n: "Écarté poulie vis-à-vis", s: 3, r: "12-15", rest: 60, cue: "Bras légèrement fléchis, serre en bas 1 seconde." },
      { n: "Curl marteau + barre au front", s: 3, r: "12", rest: 75, cue: "Superset : enchaîne les deux, repos après." },
    ],
    cardio: "Marche inclinée 20 min — 12 %, 5 km/h",
  },
  lowerB: {
    name: "Bas B", focus: "Volume", kind: "gym", duration: 70,
    ex: [
      { n: "Soulevé de terre", s: 3, r: "4-5", rest: 180, cue: "Classique ou trap bar. Pousse le sol, verrouille avec les fessiers." },
      { n: "Presse à cuisses ou hack squat", s: 3, r: "10-12", rest: 120, cue: "Amplitude complète, pas de verrouillage des genoux." },
      { n: "Hip thrust", s: 3, r: "10", rest: 90, cue: "Menton rentré, pause en haut 1 seconde." },
      { n: "Fentes marchées", s: 3, r: "12 / jambe", rest: 90, cue: "Grands pas, genou arrière frôle le sol." },
      { n: "Leg extension", s: 3, r: "15", rest: 60, cue: "Pause en haut, descente lente." },
      { n: "Roue abdominale", s: 3, r: "10", rest: 60, cue: "Bassin rétroversé, ne creuse pas le dos." },
    ],
    cardio: "Finisher rameur : 10 × (30 s fort / 30 s léger)",
  },
  cardio: {
    name: "Cardio", focus: "Zone 2", kind: "cardio", duration: 40,
    blocks: [
      { n: "Vélo, marche inclinée ou rameur", d: "40 min", cue: "Allure où tu peux encore parler. Fréquence cardiaque ~120-135." },
      { n: "Gainage", d: "3 × 45 s", cue: "Planche face + côtés." },
    ],
  },
  walk: {
    name: "Longue marche", focus: "Récup active", kind: "cardio", duration: 75,
    blocks: [
      { n: "Marche 60-90 min", d: "~8 000 pas", cue: "Ohori-kōen, bord de mer de Momochi ou le long de la Naka-gawa." },
    ],
  },
  rest: {
    name: "Repos", focus: "Récupération", kind: "rest", duration: 0,
    blocks: [
      { n: "Repos complet", d: "", cue: "Garde tes 8 000 pas, dors 8 h, prépare tes repas de la semaine." },
    ],
  },
};

/* 0 = lundi … 6 = dimanche */
window.SCHEDULE = ["upperA", "lowerA", "cardio", "upperB", "lowerB", "walk", "rest"];

/* ---------- Règles affichées dans l'onglet Salle ---------- */
window.RULES = [
  "Échauffement : 5 min de vélo + 2 séries légères du premier exercice.",
  "Arrête chaque série à 1-2 répétitions de l'échec.",
  "Toutes les séries en haut de la fourchette ? Monte la charge : +2,5 kg haut, +5 kg bas.",
  "Force en baisse 2 semaines de suite : fais une semaine à moitié des séries.",
  "10 000 pas par jour minimum, en plus des séances.",
];

/* ---------- Prépa du dimanche ---------- */
window.PREP = [
  "Poche 600 g de blanc de poulet (eau froide salée, frémissement, feu coupé 15 min couvert).",
  "Cuis 600 g de riz cru (≈ 1,4 kg cuit) et congèle-le en portions de 150 g pesées.",
  "6 œufs mollets (6 min 30) marinés une nuit dans 50 ml de soja + 50 ml d'eau + dashi.",
  "3 patates douces au four, 45 min à 200 °C.",
  "Lave et coupe chou, ciboule et brocolis pour 3 jours.",
];
