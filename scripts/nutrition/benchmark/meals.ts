/**
 * Set de referencia del motor de comidas (Fase 2b).
 *
 * Cada comida canónica tiene:
 *  - items: la "verdad" como [clave del núcleo o id de la base, gramos].
 *    Los gramos son porciones típicas colombianas (GABA/PAE, plantillas o estimación documentada).
 *  - grams: descripción con gramos, como la escribiría alguien que pesó o leyó la etiqueta.
 *  - vague: descripción vaga, como habla Juan ("un plato de arroz", "un corrientazo").
 *
 * Las comidas con número múltiplo de 3 forman el set de PRUEBA congelado; el resto es el set DEV
 * con el que se ajusta el motor. No ajustar el motor mirando el set de prueba.
 */

export type MealCategory = "desayuno" | "almuerzo" | "cena" | "domicilio" | "snack" | "fiesta";

export type RefMeal = {
  id: number;
  cat: MealCategory;
  items: [string, number][];
  grams: string;
  vague: string;
};

export const REF_MEALS: RefMeal[] = [
  // ───────── Desayunos ─────────
  { id: 1, cat: "desayuno", items: [["arepa_blanca", 70], ["huevos_revueltos", 120]], grams: "Arepa blanca 70 g con 120 g de huevos pericos", vague: "una arepa con dos huevos pericos" },
  { id: 2, cat: "desayuno", items: [["arepa_blanca", 140], ["huevos_revueltos", 180], ["chocolate_bebida", 240]], grams: "2 arepas (140 g), huevos pericos 180 g y 240 ml de chocolate", vague: "dos arepas con 3 huevos pericos y un pocillo de chocolate" },
  { id: 3, cat: "desayuno", items: [["arepa_con_queso", 130], ["tinto", 120]], grams: "arepa con queso de 130 g y un tinto de 120 ml", vague: "una arepa de queso y un tinto" },
  { id: 4, cat: "desayuno", items: [["huevo_frito", 100], ["arepa_blanca", 70], ["queso_campesino", 30]], grams: "2 huevos fritos (100 g), arepa 70 g y 30 g de queso campesino", vague: "dos huevos fritos con arepa y una tajada de queso" },
  { id: 5, cat: "desayuno", items: [["pan_blanco", 100], ["leche_entera", 150], ["tinto", 100], ["azucar", 10]], grams: "pan blanco 100 g y café con leche: 150 ml de leche, 100 ml de café y 10 g de azúcar", vague: "dos panes y un café con leche" },
  { id: 6, cat: "desayuno", items: [["leche_entera", 250], ["milo_polvo", 20], ["pan_tajado", 50], ["mantequilla", 5]], grams: "250 ml de leche con 20 g de milo, 50 g de pan tajado y 5 g de mantequilla", vague: "un milo en leche con dos tajadas de pan con mantequilla" },
  { id: 7, cat: "desayuno", items: [["arroz_blanco", 120], ["frijoles", 120], ["huevo_frito", 50], ["arepa_blanca", 70]], grams: "calentado: 120 g de arroz, 120 g de frijoles, 1 huevo frito de 50 g y arepa de 70 g", vague: "un calentado con huevo y arepa" },
  { id: 8, cat: "desayuno", items: [["pandebono", 60], ["kumis", 200]], grams: "pandebono de 60 g y kumis 200 g", vague: "un pandebono y un kumis" },
  { id: 9, cat: "desayuno", items: [["avena_hojuelas", 40], ["leche_entera", 250], ["banano", 120]], grams: "40 g de avena en hojuelas con 250 ml de leche y un banano de 120 g", vague: "avena en hojuelas con un vaso de leche y un banano" },
  { id: 10, cat: "desayuno", items: [["huevo_cocido", 150], ["pan_tajado", 50], ["jugo_naranja", 250]], grams: "3 huevos cocidos (150 g), 50 g de pan tajado y 250 ml de jugo de naranja", vague: "tres huevos cocidos, dos tajadas de pan y un jugo de naranja" },
  { id: 11, cat: "desayuno", items: [["almojabana", 70], ["chocolate_bebida", 240], ["queso_campesino", 30]], grams: "almojábana 70 g, chocolate 240 ml y queso campesino 30 g", vague: "una almojábana con chocolate y quesito" },
  { id: 12, cat: "desayuno", items: [["yogurt_griego", 150], ["fresas", 100], ["avena_hojuelas", 30]], grams: "yogurt griego 150 g con 100 g de fresas y 30 g de avena", vague: "un yogurt griego con fresas y avena" },
  { id: 13, cat: "desayuno", items: [["arepa_frita", 110], ["tinto", 120], ["azucar", 5]], grams: "arepa de huevo de 110 g y un tinto de 120 ml con 5 g de azúcar", vague: "una arepa de huevo y un tinto con azúcar" },
  { id: 14, cat: "desayuno", items: [["huevos_revueltos", 120], ["jamon", 40], ["pan_tajado", 50], ["leche_entera", 250]], grams: "120 g de huevos revueltos con 40 g de jamón, pan tajado 50 g y 250 ml de leche", vague: "huevos revueltos con jamón, dos tajadas de pan y un vaso de leche" },
  { id: 15, cat: "desayuno", items: [["pan_de_yuca", 80], ["aguapanela_bebida", 250]], grams: "pan de yuca 80 g y aguapanela 250 ml", vague: "dos pandeyucas con una aguapanela" },
  { id: 16, cat: "desayuno", items: [["FDC-175006", 150], ["arequipe", 20], ["leche_entera", 250]], grams: "pancakes 150 g con 20 g de arequipe y 250 ml de leche", vague: "unos pancakes con arequipe y un vaso de leche" },
  { id: 17, cat: "desayuno", items: [["proteina_whey", 30], ["leche_descremada", 250], ["banano", 120]], grams: "batido: 30 g de proteína whey, 250 ml de leche descremada y banano de 120 g", vague: "un batido de proteína con leche descremada y un banano" },
  { id: 18, cat: "desayuno", items: [["TCAC-23", 60], ["FDC-2710386", 300]], grams: "croissant 60 g y latte de 300 ml", vague: "un croissant y un latte" },
  { id: 19, cat: "desayuno", items: [["arepa_amarilla", 70], ["mantequilla", 5], ["queso_mozzarella", 20], ["chocolate_bebida", 240]], grams: "arepa amarilla 70 g con 5 g de mantequilla y 20 g de mozzarella, y chocolate 240 ml", vague: "arepa amarilla con mantequilla y queso tajado, y un chocolate" },
  { id: 20, cat: "desayuno", items: [["tamal", 450], ["chocolate_bebida", 240], ["pan_blanco", 50]], grams: "tamal tolimense de 450 g, chocolate 240 ml y pan 50 g", vague: "un tamal con chocolate y pan" },

  // ───────── Almuerzos ─────────
  { id: 21, cat: "almuerzo", items: [["sopa_dia", 300], ["arroz_blanco", 180], ["frijoles", 150], ["cerdo_asado", 130], ["maduro_frito", 80], ["ensalada", 70], ["jugo_fruta_agua", 250], ["azucar", 15]], grams: "corrientazo: sopa 300 g, arroz 180 g, frijoles 150 g, cerdo asado 130 g, maduro frito 80 g, ensalada 70 g y jugo de mora 250 ml con 15 g de azúcar", vague: "almorcé un corrientazo con cerdo y jugo de mora" },
  { id: 22, cat: "almuerzo", items: [["arroz_blanco", 180], ["lentejas", 150], ["pechuga_asada", 130], ["maduro_frito", 80], ["ensalada", 70], ["jugo_fruta_agua", 250], ["azucar", 15]], grams: "arroz 180 g, lentejas 150 g, pechuga a la plancha 130 g, tajadas de maduro 80 g, ensalada 70 g, jugo de lulo 250 ml con 15 g de azúcar", vague: "corrientazo sin sopa: lentejas, pechuga a la plancha, tajadas y jugo de lulo" },
  { id: 23, cat: "almuerzo", items: [["sopa_dia", 300], ["arroz_blanco", 180], ["frijoles", 150], ["res_asada", 130], ["maduro_frito", 80], ["ensalada", 70], ["jugo_fruta_agua", 250], ["azucar", 15]], grams: "sopa 300 g, arroz 180 g, frijoles 150 g, carne asada 130 g, maduro 80 g, ensalada 70 g, jugo 250 ml y azúcar 15 g", vague: "un almuerzo corriente de carne asada" },
  { id: 24, cat: "almuerzo", items: [["bandeja_paisa_base", 850], ["arepa_blanca", 70], ["aguacate", 50]], grams: "bandeja paisa de 850 g con arepa de 70 g y 50 g de aguacate", vague: "una bandeja paisa completa con arepa y aguacate" },
  { id: 25, cat: "almuerzo", items: [["ajiaco", 650], ["arroz_blanco", 100], ["aguacate", 50], ["crema_leche", 15]], grams: "ajiaco 650 g con 100 g de arroz, 50 g de aguacate y 15 g de crema de leche", vague: "un plato de ajiaco con arroz, aguacate y crema" },
  { id: 26, cat: "almuerzo", items: [["sancocho", 600], ["arroz_blanco", 120], ["aguacate", 50]], grams: "sancocho 600 g, arroz 120 g, aguacate 50 g", vague: "un sancocho de gallina con arroz y aguacate" },
  { id: 27, cat: "almuerzo", items: [["arroz_blanco", 180], ["pescado_frito", 250], ["patacon", 80], ["ensalada", 70], ["gaseosa", 400]], grams: "arroz 180 g, mojarra frita 250 g, patacones 80 g, ensalada 70 g y gaseosa 400 ml", vague: "una mojarra frita con arroz, patacones, ensalada y una gaseosa" },
  { id: 28, cat: "almuerzo", items: [["arroz_blanco", 180], ["pollo_sudado", 130], ["papa_cocida", 130], ["ensalada", 70]], grams: "arroz 180 g, pollo sudado 130 g, papa 130 g y ensalada 70 g", vague: "arroz con una presa de pollo sudado, una papa y ensalada" },
  { id: 29, cat: "almuerzo", items: [["arroz_blanco", 250], ["res_sudada", 130], ["papa_cocida", 130], ["aguacate", 50]], grams: "250 g de arroz, carne sudada 130 g, papa 130 g y aguacate 50 g", vague: "un plato de arroz con carne sudada, papa y aguacate" },
  { id: 30, cat: "almuerzo", items: [["pasta_cocida", 250], ["carne_molida", 100], ["queso_mozzarella", 20]], grams: "250 g de espagueti con 100 g de carne molida y 20 g de queso", vague: "un plato de espaguetis con carne molida y queso" },
  { id: 31, cat: "almuerzo", items: [["arroz_blanco", 180], ["sobrebarriga", 130], ["papa_criolla", 108], ["ensalada", 70]], grams: "arroz 180 g, sobrebarriga 130 g, papa criolla 108 g, ensalada 70 g", vague: "sobrebarriga con arroz, papitas criollas y ensalada" },
  { id: 32, cat: "almuerzo", items: [["arroz_blanco", 180], ["costilla_cerdo", 150], ["yuca_cocida", 130], ["ensalada", 70]], grams: "arroz 180 g, costilla de cerdo 150 g, yuca 130 g y ensalada 70 g", vague: "costilla de cerdo con arroz, yuca y ensalada" },
  { id: 33, cat: "almuerzo", items: [["pechuga_asada", 200], ["verduras_mixtas", 150], ["papa_cocida", 130]], grams: "pechuga a la plancha 200 g, verduras al vapor 150 g y papa cocida 130 g", vague: "una pechuga grande a la plancha con verduras al vapor y una papa" },
  { id: 34, cat: "almuerzo", items: [["arroz_blanco", 180], ["higado_res", 120], ["maduro_frito", 80], ["frijoles", 150]], grams: "arroz 180 g, hígado encebollado 120 g, maduro 80 g y fríjoles 150 g", vague: "hígado encebollado con arroz, fríjoles y maduro" },
  { id: 35, cat: "almuerzo", items: [["lechona", 350], ["arepa_blanca", 70], ["gaseosa", 400]], grams: "lechona 350 g, arepa 70 g y gaseosa 400 ml", vague: "una porción de lechona con arepa y gaseosa" },
  { id: 36, cat: "almuerzo", items: [["arroz_atollado", 450], ["patacon", 80]], grams: "arroz atollado 450 g con 80 g de patacones", vague: "un plato de arroz atollado con patacones" },
  { id: 37, cat: "almuerzo", items: [["sopa_dia", 300], ["arroz_blanco", 180], ["garbanzos", 150], ["pollo_sudado", 130], ["papa_cocida", 130], ["ensalada", 70], ["jugo_fruta_agua", 250], ["azucar", 15]], grams: "sopa 300 g, arroz 180 g, garbanzos 150 g, pollo sudado 130 g, papa 130 g, ensalada 70 g, jugo 250 ml con 15 g de azúcar", vague: "corrientazo de pollo sudado con garbanzos y papa" },
  { id: 38, cat: "almuerzo", items: [["arroz_blanco", 180], ["FDC-167819", 150], ["papas_fritas", 130], ["ensalada", 70]], grams: "arroz 180 g, lomo de cerdo en salsa 150 g, papas a la francesa 130 g, ensalada 70 g", vague: "lomo de cerdo en salsa con arroz, papas a la francesa y ensalada" },
  { id: 39, cat: "almuerzo", items: [["arroz_blanco", 180], ["pierna_asada", 120], ["arvejas", 100], ["ensalada", 70]], grams: "arroz 180 g, pernil de pollo asado 120 g, arveja con zanahoria 100 g, ensalada 70 g", vague: "un pernil de pollo asado con arroz, arveja y ensalada" },
  { id: 40, cat: "almuerzo", items: [["mute", 600], ["arepa_blanca", 70]], grams: "mute santandereano 600 g y arepa 70 g", vague: "un plato de mute con arepa" },
  { id: 41, cat: "almuerzo", items: [["arroz_blanco", 180], ["atun_agua", 120], ["ensalada", 70], ["aguacate", 50]], grams: "arroz 180 g, atún en agua 120 g, ensalada 70 g y aguacate 50 g", vague: "arroz con una lata de atún, ensalada y aguacate" },
  { id: 42, cat: "almuerzo", items: [["FDC-168722", 200], ["papa_cocida", 130], ["ensalada", 70], ["vino", 150]], grams: "lomo de res 200 g, papa 130 g, ensalada 70 g y una copa de vino de 150 ml", vague: "un lomo de res con papa, ensalada y una copa de vino" },
  { id: 43, cat: "almuerzo", items: [["FDC-167680", 400]], grams: "espaguetis a la boloñesa de restaurante, 400 g", vague: "unos espaguetis a la boloñesa en restaurante italiano" },
  { id: 44, cat: "almuerzo", items: [["arroz_blanco", 180], ["camarones", 120], ["patacon", 80], ["ensalada", 70], ["jugo_fruta_agua", 250]], grams: "arroz 180 g, camarones 120 g, patacones 80 g, ensalada 70 g y jugo natural sin azúcar 250 ml", vague: "camarones con arroz, patacones, ensalada y jugo natural sin azúcar" },
  { id: 45, cat: "almuerzo", items: [["FDC-2708961", 250], ["agua", 500]], grams: "sushi roll California 250 g y 500 ml de agua", vague: "un rollo de sushi california y una botella de agua" },

  // ───────── Cenas (sobras, caseras) ─────────
  { id: 46, cat: "cena", items: [["arroz_blanco", 150], ["frijoles", 150], ["huevo_frito", 50]], grams: "arroz 150 g, frijoles 150 g y un huevo frito de 50 g", vague: "lo que sobró: arroz con frijoles y un huevo frito" },
  { id: 47, cat: "cena", items: [["pechuga_asada", 150], ["ensalada", 150]], grams: "pechuga a la plancha 150 g con ensalada 150 g", vague: "una pechuga a la plancha con un plato de ensalada" },
  { id: 48, cat: "cena", items: [["arepa_blanca", 70], ["queso_campesino", 30], ["chocolate_bebida", 240]], grams: "arepa 70 g, queso 30 g y chocolate 240 ml", vague: "arepa con quesito y chocolate" },
  { id: 49, cat: "cena", items: [["sandwich_jamon_queso", 180], ["jugo_naranja", 250]], grams: "sándwich de jamón y queso 180 g y jugo de naranja 250 ml", vague: "un sanduche de jamón y queso con jugo de naranja" },
  { id: 50, cat: "cena", items: [["huevos_revueltos", 180], ["arepa_blanca", 70], ["aguacate", 50]], grams: "180 g de huevos revueltos, arepa 70 g y aguacate 50 g", vague: "tres huevos revueltos con arepa y aguacate" },
  { id: 51, cat: "cena", items: [["pasta_cocida", 180], ["atun_agua", 120], ["salsa_tomate", 30]], grams: "pasta 180 g con atún 120 g y 30 g de salsa de tomate", vague: "pasta con una lata de atún y salsa de tomate" },
  { id: 52, cat: "cena", items: [["pollo_asado_cuarto", 200], ["papa_cocida", 130], ["arepa_blanca", 70]], grams: "cuarto de pollo asado 200 g, papa salada 130 g y arepa 70 g", vague: "un cuarto de pollo asado con papa salada y arepa" },
  { id: 53, cat: "cena", items: [["sopa_dia", 300], ["pan_blanco", 50]], grams: "sopa de verduras 300 g y pan 50 g", vague: "un plato de sopa de verduras con un pan" },
  { id: 54, cat: "cena", items: [["arroz_blanco", 150], ["carne_molida", 100], ["maduro_frito", 80]], grams: "arroz 150 g, carne molida 100 g y maduro 80 g", vague: "arroz con carne molida y tajadas de maduro" },
  { id: 55, cat: "cena", items: [["yogurt", 200], ["galletas_dulces", 40]], grams: "yogurt 200 g y un paquete de galletas de 40 g", vague: "un yogurt alpina con un paquete de galletas" },
  { id: 56, cat: "cena", items: [["pescado_plancha", 150], ["arroz_blanco", 120], ["brocoli", 80]], grams: "salmón a la plancha 150 g, arroz 120 g y brócoli 80 g", vague: "un filete de salmón a la plancha con poquito arroz y brócoli" },
  { id: 57, cat: "cena", items: [["FDC-2708383", 300], ["banano", 120]], grams: "avena en leche 300 g y un banano de 120 g", vague: "una taza grande de avena en leche caliente con banano" },
  { id: 58, cat: "cena", items: [["empanada", 210], ["salsa_tomate", 15], ["gaseosa", 400]], grams: "3 empanadas (210 g), 15 g de salsa y gaseosa 400 ml", vague: "tres empanadas con salsa y una gaseosa" },
  { id: 59, cat: "cena", items: [["arroz_blanco", 150], ["lentejas", 150], ["chorizo", 80]], grams: "arroz 150 g, lentejas 150 g y un chorizo de 80 g", vague: "arroz con lentejas y un chorizo" },
  { id: 60, cat: "cena", items: [["pechuga_asada", 130], ["aceite", 10], ["papas_fritas", 130]], grams: "pechuga frita 130 g (con 10 g de aceite absorbido) y papas a la francesa 130 g", vague: "una pechuga frita con papas a la francesa" },
  { id: 61, cat: "cena", items: [["queso_campesino", 60], ["bocadillo", 30], ["pan_tajado", 50]], grams: "queso campesino 60 g con bocadillo 30 g y 50 g de pan tajado", vague: "dos tajadas de queso con bocadillo y dos tajadas de pan" },
  { id: 62, cat: "cena", items: [["tamal", 450]], grams: "un tamal de 450 g", vague: "un tamal" },

  // ───────── Domicilios y comida rápida ─────────
  { id: 63, cat: "domicilio", items: [["hamburguesa", 250], ["papas_fritas", 130], ["gaseosa", 400]], grams: "hamburguesa 250 g, papas 130 g y gaseosa 400 ml", vague: "un combo de hamburguesa con papas y gaseosa" },
  { id: 64, cat: "domicilio", items: [["papas_fritas", 250], ["salchicha", 100], ["salsas_rapidas", 30], ["queso_mozzarella", 30]], grams: "salchipapa: 250 g de papas, 100 g de salchicha, 30 g de salsas y 30 g de queso", vague: "una salchipapa" },
  { id: 65, cat: "domicilio", items: [["pizza", 330], ["gaseosa", 400]], grams: "3 porciones de pizza (330 g) y gaseosa 400 ml", vague: "tres porciones de pizza y una coca cola" },
  { id: 66, cat: "domicilio", items: [["perro_caliente", 250], ["gaseosa", 400]], grams: "perro caliente 250 g y gaseosa 400 ml", vague: "un perro caliente con todo y una gaseosa" },
  { id: 67, cat: "domicilio", items: [["pollo_frito", 300], ["papas_fritas", 130], ["gaseosa", 400]], grams: "2 presas de pollo apanado (300 g), papas 130 g y gaseosa 400 ml", vague: "dos presas de pollo frito tipo frisby con papas y gaseosa" },
  { id: 68, cat: "domicilio", items: [["hamburguesa_doble", 350], ["papas_fritas", 130], ["gaseosa_zero", 400]], grams: "hamburguesa doble 350 g, papas 130 g y coca cola zero 400 ml", vague: "una hamburguesa doble carne con papas y coca cola zero" },
  { id: 69, cat: "domicilio", items: [["alitas", 210], ["papas_fritas", 130], ["cerveza", 330]], grams: "6 alitas (210 g), papas 130 g y una cerveza de 330 ml", vague: "seis alitas bbq con papas y una cerveza" },
  { id: 70, cat: "domicilio", items: [["burrito", 350]], grams: "burrito de 350 g", vague: "un burrito grande" },
  { id: 71, cat: "domicilio", items: [["FDC-2708514", 300], ["FDC-2708576", 150]], grams: "3 tacos (300 g) y nachos 150 g", vague: "tres tacos y unos nachos" },
  { id: 72, cat: "domicilio", items: [["FDC-2706962", 300], ["papas_fritas", 130]], grams: "shawarma 300 g y papas 130 g", vague: "un shawarma con papas" },
  { id: 73, cat: "domicilio", items: [["FDC-2709153", 500]], grams: "ramen 500 g", vague: "un ramen" },
  { id: 74, cat: "domicilio", items: [["pizza", 220], ["FDC-2706093", 100]], grams: "2 porciones de pizza (220 g) y nuggets 100 g", vague: "dos tajadas de pizza y unos nuggets" },
  { id: 75, cat: "domicilio", items: [["FDC-2709591", 250], ["pechuga_asada", 100]], grams: "ensalada césar 250 g con 100 g de pollo a la plancha", vague: "una ensalada césar con pollo" },
  { id: 76, cat: "domicilio", items: [["pollo_asado_cuarto", 400], ["papa_cocida", 130], ["arepa_blanca", 70], ["gaseosa", 400]], grams: "medio pollo asado (400 g), papa 130 g, arepa 70 g y gaseosa 400 ml", vague: "medio pollo asado con papa, arepa y gaseosa" },
  { id: 77, cat: "domicilio", items: [["empanada", 140], ["FDC-168071", 60], ["gaseosa", 250]], grams: "2 empanadas (140 g), un buñuelo de 60 g y un vaso de gaseosa de 250 ml", vague: "dos empanadas, un buñuelo y un vaso de gaseosa" },

  // ───────── Snacks y mecatos ─────────
  { id: 78, cat: "snack", items: [["mani", 30]], grams: "maní 30 g", vague: "un puñado de maní" },
  { id: 79, cat: "snack", items: [["papas_paquete", 30], ["gaseosa", 400]], grams: "papas de paquete 30 g y gaseosa 400 ml", vague: "unas papitas margarita y una gaseosa" },
  { id: 80, cat: "snack", items: [["chocolatina", 25]], grams: "chocolatina de 25 g", vague: "una chocolatina jet" },
  { id: 81, cat: "snack", items: [["manzana", 150]], grams: "manzana 150 g", vague: "una manzana" },
  { id: 82, cat: "snack", items: [["helado", 140]], grams: "helado de crema 140 g", vague: "dos bolas de helado" },
  { id: 83, cat: "snack", items: [["proteina_whey", 30], ["agua", 300], ["creatina", 5]], grams: "30 g de whey en 300 ml de agua y 5 g de creatina", vague: "un scoop de proteína con agua y la creatina" },
  { id: 84, cat: "snack", items: [["mango", 200]], grams: "mango 200 g", vague: "un mango" },
  { id: 85, cat: "snack", items: [["TCAC-18", 60], ["tinto", 120]], grams: "brownie 60 g y tinto 120 ml", vague: "un brownie con un tinto" },
  { id: 86, cat: "snack", items: [["FDC-170158", 30]], grams: "almendras 30 g", vague: "un puñado de almendras" },
  { id: 87, cat: "snack", items: [["TCAC-289", 100]], grams: "chontaduro 100 g", vague: "un chontaduro" },
  { id: 88, cat: "snack", items: [["bebida_energetica", 380]], grams: "energizante 380 ml", vague: "un vive 100" },
  { id: 89, cat: "snack", items: [["galletas_soda", 30], ["queso_campesino", 30]], grams: "galletas de soda 30 g con 30 g de queso", vague: "un paquete de saltinas con una tajada de queso" },
  { id: 90, cat: "snack", items: [["FDC-169105", 150], ["TCAC-362", 100]], grams: "mandarina 150 g y uvas 100 g", vague: "una mandarina y unas uvas" },

  // ───────── Fiestas y alcohol ─────────
  { id: 91, cat: "fiesta", items: [["cerveza", 1980]], grams: "6 cervezas de 330 ml (1.980 ml)", vague: "me tomé 6 polas" },
  { id: 92, cat: "fiesta", items: [["aguardiente", 375]], grams: "375 ml de aguardiente", vague: "una media de guaro" },
  { id: 93, cat: "fiesta", items: [["aguardiente", 750], ["cerveza", 660]], grams: "750 ml de aguardiente y 660 ml de cerveza", vague: "una botella de aguardiente y dos cervezas" },
  { id: 94, cat: "fiesta", items: [["ron", 180], ["gaseosa", 600]], grams: "180 ml de ron con 600 ml de coca cola", vague: "seis tragos de ron con coca cola" },
  { id: 95, cat: "fiesta", items: [["whisky", 240], ["agua", 500]], grams: "whisky 240 ml y agua 500 ml", vague: "ocho tragos de whisky y una botella de agua" },
  { id: 96, cat: "fiesta", items: [["cerveza", 3300]], grams: "10 cervezas de 330 ml", vague: "como diez cervezas" },
  { id: 97, cat: "fiesta", items: [["vino", 450], ["queso_mozzarella", 40], ["galletas_soda", 30]], grams: "450 ml de vino, 40 g de queso y 30 g de galletas", vague: "tres copas de vino con queso y galletas" },
  { id: 98, cat: "fiesta", items: [["cerveza", 1320], ["papas_fritas", 250], ["salchicha", 100], ["salsas_rapidas", 30], ["queso_mozzarella", 30]], grams: "4 cervezas de 330 ml y salchipapa: papas 250 g, salchicha 100 g, salsas 30 g, queso 30 g", vague: "4 cervezas y al final una salchipapa" },
  { id: 99, cat: "fiesta", items: [["aguardiente", 375], ["chicharron", 100], ["arepa_blanca", 70]], grams: "aguardiente 375 ml, chicharrón 100 g y arepa 70 g", vague: "media de aguardiente y después un chicharrón con arepa" },
  { id: 100, cat: "fiesta", items: [["bebida_energetica", 380], ["whisky", 120]], grams: "un energizante de 380 ml con 120 ml de vodka", vague: "un red bull con cuatro tragos de vodka" },
];
