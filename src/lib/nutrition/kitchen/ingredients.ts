import type { CoreCategory, Nutrients } from "../engine/types.ts";
import { normalize } from "../engine/text.ts";

/**
 * Ingredientes de despensa para las recetas (docs/nutricion/06-planes-recetas.md §2).
 * Los gramos de las recetas son de ingrediente CRUDO; por eso se apunta a registros crudos de la base
 * (USDA FDC o TCAC). Solo se guarda el id: los valores viven en la base privada, no en este repo público.
 */

/** Sección de la despensa y de la lista de compras. */
export type PantryGroup = "proteinas" | "lacteos" | "granos" | "verduras" | "frutas" | "despensa" | "basicos";

export const GROUP_LABEL: Record<PantryGroup, string> = {
  proteinas: "Carnes, pollo, pescado y huevos",
  lacteos: "Lácteos",
  granos: "Granos, harinas y tubérculos",
  verduras: "Verduras",
  frutas: "Frutas",
  despensa: "Despensa",
  basicos: "Básicos (siempre hay)",
};

export type Ingredient = {
  key: string;
  name: string;
  aliases: string[];
  group: PantryGroup;
  /** Registro de la base (id); o `core`, o valores propios en `per100g`. */
  ref?: string;
  core?: string;
  per100g?: Nutrients;
  /** Se da por hecho que hay en casa (sal, aceite, especias). */
  staple?: boolean;
  /** Para filtrar por estilo de dieta (mismas categorías del núcleo). */
  diet?: Extract<CoreCategory, "carne" | "pollo" | "pescado" | "huevo" | "lacteo">;
  /** Unidad contable: "2 huevos" en vez de "100 g". */
  /** `step`: de a cuánto se redondea (1 = enteros: no hay medio huevo). */
  unit?: { one: string; many: string; grams: number; step: number };
  /** Medida de cocina preferida si no hay unidad. */
  measure?: { one: string; many: string; grams: number };
  /** Cómo se compra (lista de compras). */
  buy?: { label: string; grams: number };
  /** Sale de otro ingrediente (claras → huevos): tenerlo cuenta, y en la lista de compras se pide ese, por unidades. */
  buyAs?: string;
};

const Z: Nutrients = { kcal: 0, protein_g: 0, fat_g: 0, carb_g: 0, fiber_g: 0, alcohol_g: 0, water_g: 0 };

const TAZA = (g: number) => ({ one: "taza", many: "tazas", grams: g });
const CDA = (g: number) => ({ one: "cucharada", many: "cucharadas", grams: g });
const CDTA = (g: number) => ({ one: "cucharadita", many: "cucharaditas", grams: g });
const U = (one: string, many: string, grams: number, step = 0.5) => ({ one, many, grams, step });
const B = (label: string, grams: number) => ({ label, grams });

export const INGREDIENTS: Ingredient[] = [
  // ── Proteínas ──
  { key: "pechuga", name: "Pechuga de pollo", aliases: ["pollo", "pechuga", "filete de pollo"], group: "proteinas", ref: "FDC-171077", diet: "pollo", buy: B("libra (500 g)", 500) },
  { key: "muslo_pollo", name: "Muslo de pollo sin piel", aliases: ["muslo", "contramuslo", "pernil"], group: "proteinas", ref: "FDC-173627", diet: "pollo", buy: B("libra (500 g)", 500) },
  { key: "carne_molida", name: "Carne molida magra", aliases: ["carne molida", "molida de res"], group: "proteinas", ref: "FDC-174030", diet: "carne", buy: B("libra (500 g)", 500) },
  { key: "res_magra", name: "Carne de res magra (bola, cadera, lomo)", aliases: ["res", "carne de res", "bistec", "lomo de res", "cadera", "bola"], group: "proteinas", ref: "FDC-171804", diet: "carne", buy: B("libra (500 g)", 500) },
  { key: "lomo_cerdo", name: "Lomo de cerdo", aliases: ["cerdo", "lomo de cerdo", "solomito de cerdo"], group: "proteinas", ref: "FDC-168249", diet: "carne", buy: B("libra (500 g)", 500) },
  { key: "tilapia", name: "Filete de tilapia o mojarra", aliases: ["tilapia", "mojarra", "pescado blanco", "filete de pescado"], group: "proteinas", ref: "FDC-175176", diet: "pescado", buy: B("libra (500 g)", 500) },
  { key: "salmon", name: "Salmón", aliases: ["salmon"], group: "proteinas", ref: "FDC-175167", diet: "pescado", buy: B("filete (200 g)", 200) },
  { key: "camarones", name: "Camarones crudos pelados", aliases: ["camaron", "camarones"], group: "proteinas", ref: "FDC-175179", diet: "pescado", buy: B("bolsa (400 g)", 400) },
  { key: "huevo", name: "Huevos", aliases: ["huevo", "huevos"], group: "proteinas", ref: "FDC-171287", diet: "huevo", unit: U("huevo", "huevos", 50, 1), buy: B("cubeta (30)", 1500) },
  { key: "clara", name: "Claras de huevo", aliases: ["clara", "claras"], group: "proteinas", ref: "FDC-172183", diet: "huevo", unit: U("clara", "claras", 33, 1), buyAs: "huevo" },
  { key: "atun", name: "Atún en agua", aliases: ["atun", "lata de atun"], group: "proteinas", core: "atun_agua", diet: "pescado", unit: U("lata", "latas", 120), buy: B("lata", 120) },
  { key: "jamon", name: "Jamón de pavo o de cerdo", aliases: ["jamon", "jamon de pavo"], group: "proteinas", core: "jamon", diet: "carne", unit: U("tajada", "tajadas", 20), buy: B("paquete (250 g)", 250) },

  // ── Lácteos ──
  { key: "leche_descremada", name: "Leche descremada o deslactosada light", aliases: ["leche", "leche descremada", "deslactosada", "leche light"], group: "lacteos", core: "leche_descremada", diet: "lacteo", measure: TAZA(240), buy: B("bolsa (1,1 L)", 1100) },
  { key: "leche_entera", name: "Leche entera", aliases: ["leche entera"], group: "lacteos", core: "leche_entera", diet: "lacteo", measure: TAZA(240), buy: B("bolsa (1,1 L)", 1100) },
  { key: "yogur_griego", name: "Yogur griego natural", aliases: ["yogur griego", "yogurt griego", "griego"], group: "lacteos", core: "yogurt_griego", diet: "lacteo", measure: TAZA(230), buy: B("vaso (500 g)", 500) },
  { key: "queso_campesino", name: "Queso campesino", aliases: ["queso", "queso blanco", "queso campesino", "cuajada"], group: "lacteos", core: "queso_campesino", diet: "lacteo", unit: U("tajada", "tajadas", 30), buy: B("bloque (250 g)", 250) },
  { key: "mozzarella", name: "Queso mozzarella", aliases: ["mozzarella", "queso mozarela", "queso tajado", "doble crema"], group: "lacteos", core: "queso_mozzarella", diet: "lacteo", unit: U("tajada", "tajadas", 20), buy: B("paquete (250 g)", 250) },
  { key: "requeson", name: "Requesón o queso cottage", aliases: ["requeson", "cottage", "queso cottage"], group: "lacteos", ref: "FDC-172179", diet: "lacteo", measure: TAZA(225), buy: B("vaso (400 g)", 400) },
  { key: "queso_crema", name: "Queso crema light", aliases: ["queso crema", "philadelphia"], group: "lacteos", ref: "FDC-169079", diet: "lacteo", measure: CDA(15), buy: B("tarrina (200 g)", 200) },
  { key: "whey", name: "Proteína en polvo (whey)", aliases: ["whey", "proteina", "proteina en polvo", "scoop"], group: "lacteos", core: "proteina_whey", diet: "lacteo", unit: U("scoop", "scoops", 30), buy: B("tarro", 900) },

  // ── Granos, harinas y tubérculos ──
  { key: "arroz", name: "Arroz blanco (crudo)", aliases: ["arroz", "arroz blanco"], group: "granos", ref: "TCAC-11", measure: TAZA(185), buy: B("bolsa (1 kg)", 1000) },
  { key: "arroz_integral", name: "Arroz integral (crudo)", aliases: ["arroz integral"], group: "granos", ref: "TCAC-12", measure: TAZA(185), buy: B("bolsa (1 kg)", 1000) },
  { key: "avena", name: "Avena en hojuelas", aliases: ["avena", "hojuelas"], group: "granos", core: "avena_hojuelas", measure: TAZA(90), buy: B("bolsa (500 g)", 500) },
  { key: "pasta", name: "Pasta seca (espagueti, tornillos)", aliases: ["pasta", "espagueti", "spaghetti", "macarrones", "tornillos"], group: "granos", ref: "FDC-168927", buy: B("paquete (500 g)", 500) },
  { key: "quinoa", name: "Quinua", aliases: ["quinoa", "quinua"], group: "granos", ref: "FDC-168874", measure: TAZA(170), buy: B("bolsa (500 g)", 500) },
  { key: "arepa", name: "Arepas listas (blancas)", aliases: ["arepa", "arepas", "arepa blanca"], group: "granos", core: "arepa_blanca", unit: U("arepa", "arepas", 70), buy: B("paquete (5)", 350) },
  { key: "pan_integral", name: "Pan integral tajado", aliases: ["pan", "pan integral", "pan tajado", "pan de molde"], group: "granos", ref: "FDC-172688", unit: U("tajada", "tajadas", 28, 1), buy: B("bolsa (15 tajadas)", 420) },
  { key: "pan_hamburguesa", name: "Pan de hamburguesa", aliases: ["pan de hamburguesa"], group: "granos", ref: "FDC-172796", unit: U("pan", "panes", 50), buy: B("paquete (6)", 300) },
  { key: "tortilla", name: "Tortillas de trigo", aliases: ["tortilla", "tortillas", "wrap"], group: "granos", ref: "FDC-175037", unit: U("tortilla", "tortillas", 40), buy: B("paquete (10)", 400) },
  { key: "galletas_arroz", name: "Galletas de arroz", aliases: ["galletas de arroz", "tortitas de arroz"], group: "granos", ref: "FDC-170250", unit: U("galleta", "galletas", 9, 1), buy: B("paquete", 100) },
  { key: "maiz_pira", name: "Maíz pira (para crispetas)", aliases: ["maiz pira", "crispetas", "palomitas"], group: "granos", ref: "FDC-167959", measure: CDA(12), buy: B("bolsa (500 g)", 500) },
  { key: "papa", name: "Papa pastusa o sabanera", aliases: ["papa", "papas", "papa pastusa", "papa sabanera"], group: "granos", ref: "FDC-170026", unit: U("papa mediana", "papas medianas", 170), buy: B("libra (500 g)", 500) },
  { key: "papa_criolla", name: "Papa criolla", aliases: ["papa criolla", "criolla"], group: "granos", ref: "TCAC-194", buy: B("libra (500 g)", 500) },
  { key: "yuca", name: "Yuca", aliases: ["yuca"], group: "granos", ref: "FDC-169985", buy: B("libra (500 g)", 500) },
  { key: "platano_verde", name: "Plátano verde", aliases: ["platano verde", "platano", "patacon"], group: "granos", ref: "FDC-168215", unit: U("plátano", "plátanos", 200), buy: B("unidad", 200) },
  { key: "platano_maduro", name: "Plátano maduro", aliases: ["maduro", "platano maduro"], group: "granos", ref: "FDC-169130", unit: U("plátano", "plátanos", 200), buy: B("unidad", 200) },
  { key: "batata", name: "Batata (camote)", aliases: ["batata", "camote", "papa dulce"], group: "granos", ref: "FDC-168482", buy: B("libra (500 g)", 500) },
  { key: "lentejas", name: "Lentejas (crudas)", aliases: ["lenteja", "lentejas"], group: "granos", ref: "FDC-172420", measure: TAZA(190), buy: B("bolsa (500 g)", 500) },
  { key: "frijol_rojo", name: "Fríjol rojo (crudo)", aliases: ["frijol", "frijoles", "frijol rojo", "cargamanto"], group: "granos", ref: "TCAC-941", measure: TAZA(185), buy: B("bolsa (500 g)", 500) },
  { key: "frijol_lata", name: "Fríjoles en lata (escurridos)", aliases: ["frijoles en lata", "frijol enlatado"], group: "granos", ref: "FDC-173797", unit: U("lata", "latas", 240), buy: B("lata", 240) },
  { key: "garbanzo_lata", name: "Garbanzos en lata (escurridos)", aliases: ["garbanzo", "garbanzos"], group: "granos", ref: "FDC-173801", unit: U("lata", "latas", 240), buy: B("lata", 240) },
  { key: "maicena", name: "Fécula de maíz (maicena)", aliases: ["maicena", "fecula de maiz"], group: "granos", ref: "FDC-169698", measure: CDA(8), buy: B("caja (200 g)", 200) },

  // ── Verduras ──
  { key: "tomate", name: "Tomate", aliases: ["tomate", "tomates", "tomate chonto"], group: "verduras", ref: "FDC-170457", unit: U("tomate", "tomates", 120), buy: B("unidad", 120) },
  { key: "cebolla", name: "Cebolla cabezona", aliases: ["cebolla", "cebolla cabezona", "cebolla blanca", "cebolla roja"], group: "verduras", ref: "FDC-170000", unit: U("cebolla", "cebollas", 110), buy: B("unidad", 110) },
  { key: "cebolla_larga", name: "Cebolla larga", aliases: ["cebolla larga", "cebollin", "cebolla junca"], group: "verduras", ref: "FDC-170005", buy: B("atado", 150) },
  { key: "zanahoria", name: "Zanahoria", aliases: ["zanahoria", "zanahorias"], group: "verduras", ref: "FDC-170393", unit: U("zanahoria", "zanahorias", 80), buy: B("unidad", 80) },
  { key: "brocoli", name: "Brócoli", aliases: ["brocoli"], group: "verduras", ref: "FDC-170379", buy: B("unidad (400 g)", 400) },
  { key: "espinaca", name: "Espinaca", aliases: ["espinaca", "espinacas"], group: "verduras", ref: "FDC-168462", measure: TAZA(30), buy: B("bolsa (200 g)", 200) },
  { key: "champinones", name: "Champiñones", aliases: ["champinon", "champinones", "hongos"], group: "verduras", ref: "FDC-169251", buy: B("bandeja (250 g)", 250) },
  { key: "calabacin", name: "Calabacín (zucchini)", aliases: ["calabacin", "zucchini"], group: "verduras", ref: "FDC-169291", buy: B("unidad (250 g)", 250) },
  { key: "pimenton", name: "Pimentón", aliases: ["pimenton", "pimiento"], group: "verduras", ref: "FDC-170108", unit: U("pimentón", "pimentones", 150), buy: B("unidad", 150) },
  { key: "lechuga", name: "Lechuga", aliases: ["lechuga"], group: "verduras", ref: "FDC-169247", measure: TAZA(50), buy: B("unidad", 300) },
  { key: "pepino", name: "Pepino cohombro", aliases: ["pepino", "cohombro"], group: "verduras", ref: "FDC-169225", buy: B("unidad (300 g)", 300) },
  { key: "repollo", name: "Repollo", aliases: ["repollo"], group: "verduras", ref: "FDC-169975", buy: B("medio repollo", 500) },
  { key: "habichuela", name: "Habichuela", aliases: ["habichuela", "habichuelas", "ejotes"], group: "verduras", ref: "FDC-169961", buy: B("libra (500 g)", 500) },
  { key: "ahuyama", name: "Ahuyama", aliases: ["ahuyama", "zapallo", "calabaza"], group: "verduras", ref: "FDC-168448", buy: B("trozo (500 g)", 500) },
  { key: "maiz_dulce", name: "Maíz tierno desgranado", aliases: ["maiz", "maiz tierno", "mazorca", "choclo"], group: "verduras", ref: "FDC-168398", measure: TAZA(150), buy: B("bolsa congelada (500 g)", 500) },
  { key: "arveja", name: "Arveja verde", aliases: ["arveja", "arvejas", "guisantes"], group: "verduras", ref: "FDC-170016", measure: TAZA(140), buy: B("bolsa congelada (500 g)", 500) },
  { key: "tomate_triturado", name: "Tomate triturado o salsa natural", aliases: ["tomate triturado", "salsa napolitana", "pulpa de tomate"], group: "verduras", ref: "FDC-170501", buy: B("caja (400 g)", 400) },
  { key: "cilantro", name: "Cilantro", aliases: ["cilantro", "perejil"], group: "verduras", ref: "FDC-169997", buy: B("atado", 50) },
  { key: "limon", name: "Limón", aliases: ["limon", "limones"], group: "verduras", ref: "FDC-168156", unit: U("limón", "limones", 15), buy: B("unidad", 60) },

  // ── Frutas ──
  { key: "banano", name: "Banano", aliases: ["banano", "banana", "guineo"], group: "frutas", core: "banano", unit: U("banano", "bananos", 100), buy: B("unidad", 140) },
  { key: "fresas", name: "Fresas", aliases: ["fresa", "fresas"], group: "frutas", core: "fresas", measure: TAZA(150), buy: B("caja (500 g)", 500) },
  { key: "arandanos", name: "Arándanos", aliases: ["arandano", "arandanos", "moras azules"], group: "frutas", ref: "FDC-171711", measure: TAZA(145), buy: B("caja (125 g)", 125) },
  { key: "mango", name: "Mango", aliases: ["mango", "mango biche"], group: "frutas", core: "mango", unit: U("mango", "mangos", 200), buy: B("unidad", 300) },
  { key: "pina", name: "Piña", aliases: ["pina"], group: "frutas", core: "pina", measure: TAZA(165), buy: B("unidad", 1000) },
  { key: "papaya", name: "Papaya", aliases: ["papaya"], group: "frutas", core: "papaya", measure: TAZA(145), buy: B("unidad", 1000) },
  { key: "manzana", name: "Manzana", aliases: ["manzana", "manzanas"], group: "frutas", core: "manzana", unit: U("manzana", "manzanas", 150), buy: B("unidad", 170) },
  { key: "mora", name: "Mora", aliases: ["mora", "moras"], group: "frutas", ref: "TCAC-339", measure: TAZA(145), buy: B("libra (500 g)", 500) },
  { key: "aguacate", name: "Aguacate", aliases: ["aguacate", "palta"], group: "frutas", core: "aguacate", unit: U("aguacate", "aguacates", 140), buy: B("unidad", 200) },

  // ── Despensa ──
  { key: "mantequilla_mani", name: "Mantequilla de maní", aliases: ["mantequilla de mani", "crema de mani"], group: "despensa", core: "mantequilla_mani", measure: CDA(16), buy: B("frasco (340 g)", 340) },
  { key: "mani", name: "Maní", aliases: ["mani"], group: "despensa", ref: "FDC-172430", measure: CDA(9), buy: B("bolsa (200 g)", 200) },
  { key: "almendras", name: "Almendras", aliases: ["almendra", "almendras"], group: "despensa", ref: "FDC-168596", unit: U("almendra", "almendras", 1.2, 1), buy: B("bolsa (200 g)", 200) },
  { key: "chia", name: "Chía", aliases: ["chia"], group: "despensa", ref: "FDC-170554", measure: CDA(12), buy: B("bolsa (250 g)", 250) },
  { key: "miel", name: "Miel", aliases: ["miel"], group: "despensa", ref: "FDC-169640", measure: CDA(21), buy: B("frasco", 300) },
  { key: "panela", name: "Panela", aliases: ["panela"], group: "despensa", core: "panela", buy: B("unidad (500 g)", 500) },
  { key: "cacao", name: "Cacao en polvo sin azúcar", aliases: ["cacao", "cocoa", "cacao en polvo"], group: "despensa", ref: "FDC-169593", measure: CDA(6), buy: B("bolsa (200 g)", 200) },
  { key: "chocolate_oscuro", name: "Chocolate oscuro 70 %", aliases: ["chocolate", "chocolate oscuro", "chocolate amargo"], group: "despensa", ref: "FDC-170273", unit: U("cuadrito", "cuadritos", 5, 1), buy: B("barra (100 g)", 100) },
  { key: "pasta_tomate", name: "Pasta de tomate", aliases: ["pasta de tomate", "concentrado de tomate"], group: "despensa", ref: "FDC-170459", measure: CDA(16), buy: B("sobre (100 g)", 100) },
  { key: "salsa_soya", name: "Salsa de soya", aliases: ["soya", "salsa soya", "sillao"], group: "despensa", ref: "FDC-174277", measure: CDA(16), buy: B("frasco", 150) },
  { key: "mostaza", name: "Mostaza", aliases: ["mostaza"], group: "despensa", ref: "FDC-172234", measure: CDA(15), buy: B("frasco", 200) },
  { key: "edulcorante", name: "Edulcorante (stevia o sucralosa)", aliases: ["stevia", "sucralosa", "edulcorante", "splenda"], group: "despensa", per100g: Z, buy: B("caja", 50) },

  // ── Básicos (se dan por hechos) ──
  { key: "aceite", name: "Aceite", aliases: ["aceite", "aceite vegetal", "aceite de oliva"], group: "basicos", core: "aceite", staple: true, measure: CDTA(4.5) },
  { key: "sal", name: "Sal", aliases: ["sal"], group: "basicos", per100g: Z, staple: true },
  { key: "pimienta", name: "Pimienta", aliases: ["pimienta"], group: "basicos", per100g: Z, staple: true },
  { key: "ajo", name: "Ajo", aliases: ["ajo", "ajos"], group: "basicos", ref: "FDC-169230", staple: true, unit: U("diente de ajo", "dientes de ajo", 4, 1) },
  { key: "especias", name: "Especias (comino, color, paprika, orégano)", aliases: ["comino", "color", "paprika", "oregano", "especias", "sazon"], group: "basicos", per100g: Z, staple: true },
  { key: "canela", name: "Canela", aliases: ["canela"], group: "basicos", per100g: Z, staple: true },
  { key: "polvo_hornear", name: "Polvo de hornear", aliases: ["polvo de hornear", "royal"], group: "basicos", per100g: Z, staple: true, measure: CDTA(4) },
  { key: "vainilla", name: "Esencia de vainilla", aliases: ["vainilla"], group: "basicos", per100g: Z, staple: true },
  { key: "vinagre", name: "Vinagre", aliases: ["vinagre"], group: "basicos", per100g: Z, staple: true },
];

export const INGREDIENT_BY_KEY = new Map(INGREDIENTS.map((i) => [i.key, i]));

/** Busca ingredientes por nombre o sinónimo ("compré pollo y huevos" → pechuga, huevo). */
export function findIngredients(text: string): Ingredient[] {
  const t = ` ${normalize(text).replace(/[.,;:]/g, " ").replace(/\s+/g, " ")} `;
  const hits: { ing: Ingredient; len: number; at: number }[] = [];
  for (const ing of INGREDIENTS) {
    let best: { len: number; at: number } | null = null;
    for (const alias of [ing.name, ...ing.aliases]) {
      const a = normalize(alias);
      const at = t.indexOf(` ${a} `) >= 0 ? t.indexOf(` ${a} `) : t.indexOf(` ${a}s `);
      if (at >= 0 && (!best || a.length > best.len)) best = { len: a.length, at };
    }
    if (best) hits.push({ ing, ...best });
  }
  // Si un sinónimo largo contiene uno corto en la misma posición ("leche entera" vs "leche"), gana el largo.
  return hits
    .filter((h) => !hits.some((o) => o !== h && o.len > h.len && o.at <= h.at && h.at + h.len <= o.at + o.len))
    .map((h) => h.ing);
}
