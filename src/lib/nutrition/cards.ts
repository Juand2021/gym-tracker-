/**
 * Tarjetas que acompañan las respuestas del asistente de NutriVerse.
 * Se arman en el servidor a partir de lo que devolvieron las herramientas y la pantalla las dibuja en vidrio.
 * (Este archivo no importa nada de servidor: lo usa también el navegador.)
 */

export type DraftCardItem = { name: string; grams: number; kcal: number; protein: number; note: string | null; unmatched: boolean };

export type ChatCard =
  | {
      type: "draft";
      draftId: string;
      date: string;
      moment: string;
      items: DraftCardItem[];
      kcal: number;
      protein: number;
      /** Objetivo y total del día si se guarda (null si el perfil está incompleto). */
      dayTarget: number | null;
      dayAfter: number;
      /** pending → saved / discarded cuando la persona decide. */
      status: "pending" | "saved" | "discarded";
    }
  | {
      type: "plan";
      remainingKcal: number;
      remainingProtein: number;
      meals: { n: number; kcal: number; protein: number; options: { kcal: number; protein: number; foods: { name: string; grams: number; kcal: number }[] }[] }[];
    }
  | {
      type: "compare";
      left: number | null;
      options: { text: string; kcal: number; protein: number; leftAfter: number | null }[];
      /** Índice de la opción recomendada (más proteína por kcal sin pasarse). */
      best: number;
    }
  | {
      type: "targets";
      kcal: number;
      protein: number;
      fat: number;
      carbs: number;
      maintenance: number;
      phase: string | null;
    };

const num = (v: unknown) => (typeof v === "number" && Number.isFinite(v) ? v : 0);

/** Convierte el resultado de una herramienta en tarjeta (o null si no lleva). */
export function cardFromTool(name: string, result: Record<string, unknown>): ChatCard | null {
  if (result.error) return null;
  if ((name === "analizar_comida" || name === "corregir_comida") && typeof result.borrador_id === "string") {
    const items = (result.alimentos as { alimento: string; gramos: number; kcal: number; proteina_g: number; supuesto?: string; sin_coincidencia?: boolean }[]) ?? [];
    const totals = (result.totales as { kcal: number; protein_g: number }) ?? { kcal: 0, protein_g: 0 };
    const day = (result.dia_si_se_guarda as { objetivo_kcal?: number; consumido_kcal?: number }) ?? {};
    return {
      type: "draft",
      draftId: result.borrador_id,
      date: String(result.fecha ?? ""),
      moment: String(result.momento ?? ""),
      items: items.map((i) => ({ name: i.alimento, grams: Math.round(i.gramos), kcal: Math.round(i.kcal), protein: Math.round(i.proteina_g), note: i.supuesto ?? null, unmatched: !!i.sin_coincidencia })),
      kcal: Math.round(totals.kcal),
      protein: Math.round(totals.protein_g),
      dayTarget: day.objetivo_kcal ?? null,
      dayAfter: Math.round(num(day.consumido_kcal)),
      status: "pending",
    };
  }
  if (name === "plan_comidas" && Array.isArray(result.comidas)) {
    const comidas = result.comidas as { comida: number; kcal_objetivo: number; proteina_objetivo_g: number; opciones: { kcal: number; proteina_g: number; alimentos: { alimento: string; gramos: number; kcal: number }[] }[] }[];
    return {
      type: "plan",
      remainingKcal: num(result.restante_kcal),
      remainingProtein: num(result.restante_proteina_g),
      meals: comidas.map((c) => ({
        n: c.comida,
        kcal: c.kcal_objetivo,
        protein: c.proteina_objetivo_g,
        options: c.opciones.map((o) => ({ kcal: o.kcal, protein: o.proteina_g, foods: o.alimentos.map((a) => ({ name: a.alimento, grams: a.gramos, kcal: a.kcal })) })),
      })),
    };
  }
  if (name === "consultar_opciones" && Array.isArray(result.opciones)) {
    const opts = result.opciones as { opcion: string; kcal: number; proteina_g: number; quedaria_kcal?: number }[];
    const left = (result.restante_hoy as { restante_kcal?: number })?.restante_kcal ?? null;
    const volume = result.objetivo === "volumen";
    const score = (o: (typeof opts)[number]) => {
      const fits = left == null || volume || o.kcal <= left ? 1 : 0;
      return fits * 1000 + (o.proteina_g / Math.max(o.kcal, 1)) * 100;
    };
    const best = opts.reduce((b, o, i) => (score(o) > score(opts[b]) ? i : b), 0);
    return {
      type: "compare",
      left,
      best,
      options: opts.map((o) => ({ text: o.opcion, kcal: Math.round(o.kcal), protein: Math.round(o.proteina_g), leftAfter: o.quedaria_kcal ?? null })),
    };
  }
  if ((name === "ver_perfil" || name === "actualizar_perfil" || name === "registrar_peso") && result.objetivos_diarios) {
    const o = result.objetivos_diarios as { kcal: number; proteina_g: number; grasa_g: number; carbohidratos_g: number };
    const c = (result.calculo as { mantenimiento_kcal?: number }) ?? {};
    const phase = ((result.perfil as { objetivo?: { type?: string } } | null)?.objetivo?.type as string) ?? null;
    return { type: "targets", kcal: o.kcal, protein: o.proteina_g, fat: o.grasa_g, carbs: o.carbohidratos_g, maintenance: num(c.mantenimiento_kcal), phase };
  }
  return null;
}
