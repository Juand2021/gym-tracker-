/** Nutrientes por 100 g de parte comestible (o por 100 ml en bebidas, aprox. 1 g/ml). */
export type Nutrients = {
  kcal: number;
  protein_g: number;
  fat_g: number;
  /** Carbohidratos disponibles (sin fibra), igual criterio que la TCAC. */
  carb_g: number;
  fiber_g: number;
  alcohol_g: number;
  water_g: number;
};

export type FoodSource =
  | "TCAC-2015"
  | "ICBF-18-PREP"
  | "GABA-2020"
  | "FDC-Foundation"
  | "FDC-SR"
  | "FDC-FNDDS"
  | "LABEL"
  | "ESTIMATE";

/** Registro de la base unificada (TCAC + USDA + curados). */
export type FoodRecord = {
  id: string;
  source: FoodSource;
  name_es: string;
  name_en?: string;
  aliases: string[];
  per100g: Nutrients;
  portions: Portion[];
  /** analyzed = laboratorio; imputed = tomado de otra tabla; estimated = calculado por nosotros */
  quality: "analyzed" | "imputed" | "estimated";
};

export type Portion = {
  /** Unidad en la que habla la gente: porcion, unidad, vaso, cucharada, tajada, presa... */
  unit: PortionUnit;
  grams: number;
  /** Etiqueta para la interfaz, ej. "1 arepa mediana". */
  label: string;
  /** Fuente del peso: GABA/PAE oficial o estimación documentada. */
  basis: "GABA" | "PAE" | "ICBF" | "LABEL" | "USDA" | "ESTIMATE";
};

export const PORTION_UNITS = [
  "porcion",
  "plato",
  "unidad",
  "presa",
  "tajada",
  "rebanada",
  "pocillo",
  "taza",
  "vaso",
  "copa",
  "lata",
  "botella",
  "trago",
  "media",
  "cucharada",
  "cucharadita",
  "cucharon",
  "scoop",
  "sobre",
  "paquete",
  "punado",
  "bola",
] as const;
export type PortionUnit = (typeof PORTION_UNITS)[number];

/** Alimento del núcleo curado: lo más frecuente para el usuario, con referencia verificada. */
export type CoreFood = {
  key: string;
  name: string;
  aliases: string[];
  /** id en la base unificada (TCAC-x / FDC-x) o valores propios en `per100g`. */
  ref?: string;
  per100g?: Nutrients;
  source?: FoodSource;
  sourceNote?: string;
  /** Porción por defecto cuando el usuario no da cantidad. */
  defaultUnit: PortionUnit;
  portions: Omit<Portion, "label">[];
  category: CoreCategory;
  /** El valor ya incluye la grasa de cocción (ej. arroz colombiano, fritos). */
  fatIncluded?: boolean;
  /** Para cruzar contra el USDA en la verificación automática. */
  crossCheck?: string;
};

export type CoreCategory =
  | "cereal"
  | "tuberculo"
  | "platano"
  | "leguminosa"
  | "carne"
  | "pollo"
  | "pescado"
  | "huevo"
  | "lacteo"
  | "fruta"
  | "verdura"
  | "grasa"
  | "azucar"
  | "bebida"
  | "alcohol"
  | "plato"
  | "rapida"
  | "snack"
  | "suplemento";

/** Plantilla de plato compuesto (corrientazo, bandeja paisa...). */
export type DishTemplate = {
  key: string;
  name: string;
  aliases: string[];
  description: string;
  components: { slot: string; coreKey: string; grams: number; optional?: boolean; alternatives?: string[] }[];
  sourceNote: string;
};
