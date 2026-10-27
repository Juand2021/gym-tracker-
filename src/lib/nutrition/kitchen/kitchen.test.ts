import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { Nutrients } from "../engine/types.ts";
import { INGREDIENT_BY_KEY, findIngredients } from "./ingredients.ts";
import { LIBRARY } from "./library.ts";
import { countReady, inPantry, matchRecipe, type KitchenPrefs } from "./match.ts";
import { formatAmount, fraction, kitchenGrams, recipeNutrition, type Per100gOf } from "./nutrition.ts";
import type { Recipe } from "./recipes.ts";
import { scaleRecipe } from "./scale.ts";
import { resolveRecipe, sanitizeRecipe, slugify, toRaw, type RawRecipe } from "./authoring.ts";
import { buildWeekPlan, shoppingList, weekStartOf } from "./week.ts";
import { hungrySnacks, planDay, rankForSlot, remainingSlots, slotsFor, splitTargets, unassigned } from "./planner.ts";

const N = (kcal: number, protein_g: number, fat_g = 0, carb_g = 0): Nutrients => ({ kcal, protein_g, fat_g, carb_g, fiber_g: 0, alcohol_g: 0, water_g: 0 });

/** Valores redondos para que las cuentas se vean a mano. */
const FAKE: Record<string, Nutrients> = {
  pechuga: N(120, 22, 3, 0),
  arroz: N(350, 7, 1, 78),
  tomate: N(20, 1, 0, 4),
  aceite: N(900, 0, 100, 0),
  huevo: N(140, 12.5, 10, 1),
  tilapia: N(100, 20, 2, 0),
};
const per100gOf: Per100gOf = (ing) => FAKE[ing.key] ?? N(0, 0);

const recipe = (over: Partial<Recipe> = {}): Recipe => ({
  id: "test",
  name: "Pollo con arroz",
  description: "",
  kind: "comida",
  servings: 2,
  minutes: 20,
  difficulty: 1,
  equipment: ["estufa"],
  tags: [],
  ingredients: [
    { key: "pechuga", grams: 400, scale: "protein", alt: ["tilapia"] },
    { key: "arroz", grams: 120, scale: "carb" },
    { key: "tomate", grams: 100 },
    { key: "aceite", grams: 10 },
    { key: "huevo", grams: 100, optional: true },
  ],
  steps: [{ text: "Cocinar" }],
  source: "nutriverse",
  ...over,
});

const prefs = (pantry: string[], over: Partial<KitchenPrefs> = {}): KitchenPrefs => ({ pantry: new Set(pantry), equipment: ["estufa", "airfryer", "licuadora"], dietStyle: "omnivoro", avoidFoods: [], ...over });

describe("cantidades de cocina", () => {
  it("fracciones legibles", () => {
    assert.equal(fraction(0.5), "½");
    assert.equal(fraction(1.5), "1½");
    assert.equal(fraction(2), "2");
    assert.equal(fraction(0.75), "¾");
  });
  it("unidades: no hay medio huevo", () => {
    const huevo = INGREDIENT_BY_KEY.get("huevo");
    assert.equal(formatAmount(huevo, 150), "3 huevos");
    assert.equal(formatAmount(huevo, 60), "1 huevo");
    assert.equal(kitchenGrams(huevo, 130), 150);
  });
  it("medidas con gramos y gramos sueltos", () => {
    assert.equal(formatAmount(INGREDIENT_BY_KEY.get("avena"), 45), "½ taza (45 g)");
    assert.equal(formatAmount(INGREDIENT_BY_KEY.get("pechuga"), 182), "182 g");
    assert.equal(kitchenGrams(INGREDIENT_BY_KEY.get("pechuga"), 182), 180);
    assert.equal(kitchenGrams(INGREDIENT_BY_KEY.get("aceite"), 4.4), 4);
  });
  it("encuentra ingredientes en una frase", () => {
    const keys = findIngredients("compré pollo, 2 bananos, leche entera y huevos").map((x) => x.key);
    assert.ok(keys.includes("pechuga"));
    assert.ok(keys.includes("banano"));
    assert.ok(keys.includes("leche_entera"));
    assert.ok(!keys.includes("leche_descremada"), "leche entera no debe marcar también la descremada");
    assert.ok(keys.includes("huevo"));
  });
});

describe("nutrientes de la receta", () => {
  it("suma crudos y divide por porciones; los opcionales no cuentan si no se piden", () => {
    const n = recipeNutrition(recipe(), per100gOf);
    // Por porción: 200 g pollo (240) + 60 g arroz (210) + 50 g tomate (10) + 5 g aceite (45) = 505
    assert.equal(n.totals.kcal, 505);
    assert.equal(n.totals.protein_g, 48.7);
    assert.equal(n.lines.find((l) => l.key === "huevo")?.included, false);
  });
  it("con opcional y con reemplazo", () => {
    const n = recipeNutrition(recipe(), per100gOf, { withOptional: ["huevo"], swaps: { pechuga: "tilapia" } });
    // tilapia 200 g = 200 kcal; huevo 50 g = 70 kcal → 200 + 210 + 10 + 45 + 70
    assert.equal(n.totals.kcal, 535);
    assert.equal(n.lines[0].key, "tilapia");
    assert.equal(n.lines[0].swappedFrom, "pechuga");
  });
  it("porciones comidas multiplican", () => {
    assert.equal(recipeNutrition(recipe(), per100gOf, { servings: 2 }).totals.kcal, 1010);
  });
});

describe("ajustar la receta a lo que queda del día", () => {
  it("sube la proteína y baja el carbohidrato para llegar a la meta", () => {
    const s = scaleRecipe(recipe(), per100gOf, { kcal: 450, protein_g: 55 });
    assert.ok(s.factors.protein > 1, "más pollo");
    assert.ok(s.factors.carb < 1, "menos arroz");
    assert.ok(Math.abs(s.diff.protein_g) <= 3, `proteína cerca: ${s.diff.protein_g}`);
    assert.ok(Math.abs(s.diff.kcal) <= 30, `kcal cerca: ${s.diff.kcal}`);
    assert.equal(s.gramsPerServing.tomate, 50, "lo que no se ajusta no cambia");
    assert.equal(s.gramsPerServing.pechuga % 5, 0, "redondeado de a 5 g");
  });
  it("no baja de los mínimos aunque quede poco del día", () => {
    const s = scaleRecipe(recipe(), per100gOf, { kcal: 100, protein_g: 10 });
    assert.ok(s.factors.protein >= 0.6 && s.factors.carb >= 0.3);
    assert.ok(s.diff.kcal > 0, "se pasa y lo dice");
  });
  it("con huevo ajusta por huevos enteros", () => {
    const r = recipe({ ingredients: [{ key: "huevo", grams: 100, scale: "protein" }, { key: "arroz", grams: 60, scale: "carb" }], servings: 1 });
    const s = scaleRecipe(r, per100gOf, { kcal: 500, protein_g: 30 });
    assert.equal(s.gramsPerServing.huevo % 50, 0);
  });
});

describe("despensa", () => {
  it("lista si hay todo lo obligatorio; los básicos se dan por hechos", () => {
    const m = matchRecipe(recipe(), prefs(["pechuga", "arroz", "tomate"]));
    assert.equal(m.status, "ready");
    assert.deepEqual(m.missing, []);
    assert.ok(inPantry("aceite", new Set()));
  });
  it("casi: dice qué falta; usa el reemplazo que sí hay", () => {
    const m = matchRecipe(recipe(), prefs(["tilapia", "arroz"]));
    assert.equal(m.status, "almost");
    assert.deepEqual(m.missing, ["tomate"]);
    assert.equal(m.swaps.pechuga, "tilapia");
  });
  it("las claras salen de los huevos", () => {
    assert.ok(inPantry("clara", new Set(["huevo"])));
  });
  it("bloquea por equipo, dieta o alimentos que no come", () => {
    assert.equal(matchRecipe(recipe({ equipment: ["airfryer"] }), prefs([], { equipment: ["estufa"] })).blocked?.reason, "equipo");
    const veg = matchRecipe(recipe(), prefs(["arroz", "tomate"], { dietStyle: "vegetariano" }));
    assert.equal(veg.blocked?.reason, "dieta");
    const pesc = matchRecipe(recipe(), prefs(["arroz", "tomate"], { dietStyle: "pescetariano" }));
    assert.equal(pesc.blocked, null, "pescetariano: la tilapia reemplaza al pollo");
    assert.equal(pesc.swaps.pechuga, "tilapia");
    assert.equal(matchRecipe(recipe(), prefs([], { avoidFoods: ["tomate"] })).blocked?.reason, "evitar");
  });
  it("opcional que no come se omite sin bloquear", () => {
    const m = matchRecipe(recipe(), prefs(["pechuga", "arroz", "tomate"], { avoidFoods: ["huevo"] }));
    assert.equal(m.blocked, null);
  });
  it("la biblioteca: con una despensa básica ya hay varias recetas listas", () => {
    const n = countReady(LIBRARY, prefs(["huevo", "arepa", "tomate", "cebolla_larga", "yogur_griego", "fresas", "avena", "leche_descremada", "whey", "banano"]));
    assert.ok(n >= 5, `listas: ${n}`);
  });
});

describe("biblioteca", () => {
  it("toda receta usa ingredientes del catálogo y tiene algo que ajustar", () => {
    for (const r of LIBRARY) {
      for (const ri of r.ingredients) for (const k of [ri.key, ...(ri.alt ?? [])]) assert.ok(INGREDIENT_BY_KEY.has(k), `${r.id}: ${k}`);
      assert.ok(r.ingredients.some((x) => x.scale), r.id);
      assert.ok(r.steps.length > 0, r.id);
    }
  });
  it("ids únicos y equipos de Juan (sin microondas)", () => {
    assert.equal(new Set(LIBRARY.map((r) => r.id)).size, LIBRARY.length);
    for (const r of LIBRARY) for (const e of r.equipment) assert.ok(["estufa", "airfryer", "licuadora"].includes(e), r.id);
  });
});

describe("plan del día", () => {
  it("comidas según cuántas come y las que faltan", () => {
    assert.deepEqual(slotsFor(4), ["desayuno", "almuerzo", "snack", "cena"]);
    assert.deepEqual(remainingSlots(4, ["desayuno"], "12:00"), ["almuerzo", "snack", "cena"]);
    // A las 20:00 ya pasaron desayuno y almuerzo.
    assert.deepEqual(remainingSlots(4, [], "20:00"), ["snack", "cena"]);
    // Si ya registró la cena y es tarde, queda el snack.
    assert.deepEqual(remainingSlots(4, ["cena"], "21:00"), ["snack"]);
  });
  it("reparte lo que queda sin pasar los topes de cada comida", () => {
    const t = splitTargets(["cena"], 1400, 130, { kcal: 1900, protein_g: 180 });
    assert.equal(t[0].kcal, 760, "cena hasta 40 % del día");
    assert.equal(t[0].protein_g, 60);
    const left = unassigned(t, 1400, 130);
    assert.equal(left.kcal, 640);
    const many = splitTargets(["almuerzo", "snack", "cena"], 1300, 110);
    assert.ok(many[0].kcal > many[2].kcal && many[2].kcal > many[1].kcal, "almuerzo > cena > snack");
    assert.equal(many.reduce((a, x) => a + x.kcal, 0), 1300);
  });
  it("elige recetas que se pueden hacer y no repite la misma en el día", () => {
    const ctx = {
      recipes: LIBRARY,
      kitchen: { pantry: ["huevo", "arepa", "tomate", "cebolla_larga", "yogur_griego", "fresas", "avena", "leche_descremada", "pechuga", "arroz", "lechuga", "pepino", "limon", "atun", "garbanzo_lata", "cebolla"], equipment: ["estufa", "airfryer", "licuadora"] as ("estufa" | "airfryer" | "licuadora")[], recipes: {}, shoppingChecked: [], updatedAt: "" },
      prefs: prefs(["huevo", "arepa", "tomate", "cebolla_larga", "yogur_griego", "fresas", "avena", "leche_descremada", "pechuga", "arroz", "lechuga", "pepino", "limon", "atun", "garbanzo_lata", "cebolla"]),
      per100gOf: (ing: Parameters<Per100gOf>[0]) => FAKE[ing.key] ?? N(100, 5, 3, 12),
      today: "2026-10-25",
    };
    const plan = planDay(ctx, splitTargets(["desayuno", "almuerzo", "cena"], 1600, 140));
    const ids = plan.map((s) => s.pick?.recipe.id);
    assert.equal(new Set(ids).size, 3, "tres recetas distintas");
    assert.ok(plan.every((s) => s.pick?.match.status === "ready"), "todas con la despensa");
    assert.equal(plan[0].pick?.recipe.kind, "desayuno");
  });
  it("no propone recetas que no le gustaron", () => {
    const pantry = ["yogur_griego", "fresas", "huevo"];
    const base = { recipes: LIBRARY, prefs: prefs(pantry), per100gOf, today: "2026-10-25" };
    const k = (liked: -1 | 0) => ({ pantry, equipment: ["estufa", "airfryer", "licuadora"] as ("estufa" | "airfryer" | "licuadora")[], recipes: { "yogur-griego-fruta": { tried: true, liked, favorite: false, timesCooked: 1, lastCooked: null } }, shoppingChecked: [], updatedAt: "" });
    const ids = (liked: -1 | 0) => rankForSlot({ ...base, kitchen: k(liked) }, { slot: "snack", kcal: 200, protein_g: 20 }).map((p) => p.recipe.id);
    assert.ok(ids(0).includes("yogur-griego-fruta"));
    assert.ok(!ids(-1).includes("yogur-griego-fruta"));
  });
  it("con hambre: primero lo que se puede hacer ya", () => {
    const pantry = ["huevo"];
    const snacks = hungrySnacks({ recipes: LIBRARY, kitchen: { pantry, equipment: ["estufa", "airfryer", "licuadora"], recipes: {}, shoppingChecked: [], updatedAt: "" }, prefs: prefs(pantry), per100gOf: (ing) => FAKE[ing.key] ?? N(100, 5, 3, 12), today: "2026-10-25" }, 600, 40);
    assert.equal(snacks[0].match.status, "ready");
    assert.equal(snacks.length, 3);
  });
});

describe("semana y lista de compras", () => {
  const allPantry = ["huevo", "arroz", "pechuga", "tomate"];
  const ctx = {
    recipes: LIBRARY,
    kitchen: { pantry: allPantry, equipment: ["estufa", "airfryer", "licuadora"] as ("estufa" | "airfryer" | "licuadora")[], recipes: {}, shoppingChecked: [], updatedAt: "" },
    prefs: prefs(allPantry),
    per100gOf: (ing: Parameters<Per100gOf>[0]) => FAKE[ing.key] ?? N(100, 6, 3, 12),
    today: "2026-10-26",
  };

  it("el lunes de la semana", () => {
    assert.equal(weekStartOf("2026-10-25"), "2026-10-19"); // domingo → lunes anterior
    assert.equal(weekStartOf("2026-10-26"), "2026-10-26");
    assert.equal(weekStartOf("2026-10-29"), "2026-10-26");
  });

  it("arma 7 días; las recetas de meal prep dejan sobras para los días siguientes", () => {
    const plan = buildWeekPlan({ ctx, start: "2026-10-26", mealsPerDay: 4, daily: { kcal: 1900, protein_g: 180 } });
    assert.equal(plan.days.length, 7);
    assert.ok(plan.days.every((d) => d.slots.length === 4));
    const lunches = plan.days.map((d) => d.slots.find((s) => s.slot === "almuerzo")!);
    for (let i = 0; i < lunches.length; i++) {
      const r = LIBRARY.find((x) => x.id === lunches[i].recipeId);
      if (r && r.servings > 1 && !lunches[i].leftoverOf) {
        // Los siguientes días (hasta completar las porciones) son sobras de ese día.
        for (let k = 1; k < r.servings && i + k < lunches.length; k++) assert.equal(lunches[i + k].leftoverOf, plan.days[i].date);
        break;
      }
    }
    const desayunos = plan.days.map((d) => d.slots[0].recipeId);
    assert.ok(new Set(desayunos).size >= 5, "desayunos variados");
  });

  it("no planea días pasados", () => {
    const plan = buildWeekPlan({ ctx, start: "2026-10-26", mealsPerDay: 3, daily: { kcal: 1900, protein_g: 180 }, fromDate: "2026-10-28" });
    assert.equal(plan.days[0].slots.length, 0);
    assert.equal(plan.days[2].slots.length, 3);
  });

  it("lista de compras: suma, no cuenta sobras, pasa claras a huevos y separa lo que ya hay", () => {
    const recipes = new Map(LIBRARY.map((r) => [r.id, r]));
    const plan = {
      weekStart: "2026-10-26",
      createdAt: "",
      updatedAt: "",
      days: [
        { date: "2026-10-26", slots: [{ slot: "desayuno" as const, recipeId: "omelette-espinaca-champinones", kcal: 0, protein_g: 0 }, { slot: "almuerzo" as const, recipeId: "lentejas-con-arroz", kcal: 0, protein_g: 0 }] },
        { date: "2026-10-27", slots: [{ slot: "desayuno" as const, recipeId: "omelette-espinaca-champinones", kcal: 0, protein_g: 0 }, { slot: "almuerzo" as const, recipeId: "lentejas-con-arroz", leftoverOf: "2026-10-26", kcal: 0, protein_g: 0 }] },
      ],
    };
    const list = shoppingList(plan, recipes, new Set(["arroz"]), new Set(["champinones"]));
    const items = list.groups.flatMap((g) => g.items);
    const by = (k: string) => items.find((i) => i.key === k);
    // Dos omelettes: 2 huevos + 3 claras cada uno = 10 huevos.
    assert.ok(by("huevo")?.amount.startsWith("10 huevos"), by("huevo")?.amount);
    assert.equal(by("clara"), undefined);
    // Lentejas se cocinan una vez (el martes son sobras): 300 g.
    assert.equal(by("lentejas")?.grams, 300);
    assert.equal(by("arroz")?.inPantry, true);
    assert.equal(by("champinones")?.checked, true);
    assert.equal(by("aceite"), undefined, "los básicos no se compran");
    assert.ok(list.toBuy > 0);
  });
});

describe("recetas propias y de la IA", () => {
  const raw = (over: Partial<RawRecipe> = {}): RawRecipe => ({
    nombre: "Pollo al curry",
    descripcion: "Rápido y rico",
    tipo: "comida",
    porciones: 2,
    minutos: 25,
    dificultad: 1,
    equipo: ["estufa", "microondas"],
    etiquetas: ["salado", "inventada"],
    ingredientes: [
      { clave: "pechuga", gramos: 300, opcional: false, ajuste: null, nota: "en cubos" },
      { clave: "pechuga", gramos: 100, opcional: false, ajuste: null, nota: null },
      { clave: "arroz", gramos: 120, opcional: false, ajuste: null, nota: null },
      { clave: "aceite", gramos: 9, opcional: false, ajuste: "fat", nota: null },
      { clave: "curry_magico", gramos: 5, opcional: false, ajuste: null, nota: null },
    ],
    pasos: [{ texto: "Sofríe", minutos_temporizador: 3 }, { texto: "  ", minutos_temporizador: null }],
    consejos: [],
    sin_catalogo: ["curry"],
    ...over,
  });

  it("limpia: une repetidos, quita desconocidos, equipo y etiquetas válidos, avisa", () => {
    const { recipe, warnings } = sanitizeRecipe(raw(), "mia");
    assert.equal(recipe.ingredients.find((i) => i.key === "pechuga")?.grams, 400);
    assert.ok(!recipe.ingredients.some((i) => i.key === "curry_magico"));
    assert.deepEqual(recipe.equipment, ["estufa"]);
    assert.deepEqual(recipe.tags, ["salado"]);
    assert.equal(recipe.steps.length, 1);
    assert.equal(recipe.steps[0].timerMin, 3);
    assert.ok(warnings.some((w) => w.includes("curry")));
    assert.ok(recipe.id.startsWith("mia-pollo-al-curry-"));
    assert.equal(recipe.source, "mia");
  });

  it("si nadie marcó qué ajustar, se elige la proteína y el carbohidrato; los básicos no se ajustan", () => {
    const { recipe } = sanitizeRecipe(raw(), "ia");
    assert.equal(recipe.ingredients.find((i) => i.key === "pechuga")?.scale, "protein");
    assert.equal(recipe.ingredients.find((i) => i.key === "arroz")?.scale, "carb");
    assert.equal(recipe.ingredients.find((i) => i.key === "aceite")?.scale, undefined);
  });

  it("valores fuera de rango y sin ingredientes", () => {
    const { recipe } = sanitizeRecipe(raw({ porciones: 40, minutos: -5, dificultad: 9, tipo: "merienda" }), "mia");
    assert.equal(recipe.servings, 8);
    assert.equal(recipe.minutes, 1);
    assert.equal(recipe.difficulty, 3);
    assert.equal(recipe.kind, "comida");
    assert.throws(() => sanitizeRecipe(raw({ ingredientes: [] }), "mia"));
  });

  it("ida y vuelta conserva la receta (para volver a validar al guardar)", () => {
    const { recipe } = sanitizeRecipe(raw(), "mia");
    const again = sanitizeRecipe(toRaw(recipe), "mia", recipe.id).recipe;
    assert.deepEqual(again.ingredients, recipe.ingredients);
    assert.equal(again.id, recipe.id);
    assert.equal(slugify("¡Arepa con Queso!"), "arepa-con-queso");
  });
});

describe("buscar receta por nombre (chat)", () => {
  it("id exacto, nombre parcial y ambiguo", () => {
    assert.equal((resolveRecipe(LIBRARY, "changua") as { id: string }).id, "changua");
    assert.equal((resolveRecipe(LIBRARY, "los huevos pericos") as { id: string }).id, "pericos-con-arepa");
    assert.equal((resolveRecipe(LIBRARY, "pancakes de avena") as { id: string }).id, "pancakes-avena-banano");
    const amb = resolveRecipe(LIBRARY, "pollo") as { candidatas: string[] };
    assert.ok(amb.candidatas.length > 1);
  });
});
