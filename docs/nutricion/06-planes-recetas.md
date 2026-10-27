# Planes 2.0 — Recetas, despensa, snacks y semana

> Fecha: 2026-10-25 · Estado: **implementado en la rama `feat/nutriverse-planes-recetas`**, probado en local sin Firebase. Falta la revisión de Juan en el iPhone.

## 1. Qué pidió Juan
Planes más completos para comer mejor sin ser experto en cocina:
- recetas probadas y fáciles, en una biblioteca;
- snacks para el hambre entre comidas;
- que la despensa (lo que hay en casa) active las recetas que se pueden hacer;
- gastar menos tiempo pensando qué comer.

**Decisiones (2026-10-25):**
- Biblioteca inicial más recetas propias más recetas propuestas por la IA. Juan marca cuáles probó y si le gustaron.
- Despensa de tipo "tengo / no tengo". Sal, aceite y especias se dan por hechos.
- Equipo: estufa, air fryer y licuadora (sin microondas).
- Todo por etapas.

## 2. Cómo funciona (en simple)
- **Las kcal nunca las inventa la IA.** Cada receta es una lista de ingredientes crudos con gramos. El código suma sus nutrientes con la base de alimentos (USDA para carnes y básicos, TCAC para lo colombiano) y divide por las porciones. Como Juan no pesa la comida cocinada, todo va **por porción**.
- **Ajuste al día:** cada receta tiene ingredientes que se pueden ajustar (la proteína, el carbohidrato y a veces la grasa). Para una comida, la app sube o baja esos ingredientes hasta acercarse a la meta de esa comida. Lo demás no cambia y todo se redondea a medidas de cocina: huevos enteros, ½ taza, de a 5 g.
- **Topes por comida:** aunque sobre mucho del día, una comida no pasa de su tope (por ejemplo, la cena hasta ~40 % del objetivo diario y 60 g de proteína). Lo que sobra se sugiere como snack.
- **Despensa:** una receta está "Puedes hacerla" si hay todo lo obligatorio, "Te falta: X" si faltan 1–2 cosas, o "Te faltan N cosas". Un reemplazo que sí hay en casa cuenta: por ejemplo, tilapia en vez de pollo. Las claras salen de los huevos.
- **Dieta y gustos:** se respetan el estilo (vegetariano, etc.) y "lo que no come" del perfil. Las recetas marcadas "No es para mí" no se vuelven a proponer.

## 3. Pantallas (Planes → Hoy · Recetas · Despensa · Semana)
| Pantalla | Qué hace |
|---|---|
| **Hoy** | Una receta ajustada por cada comida que falta, con "Cambiar" para ver otras y "Ya me lo comí". Tiene el botón **Tengo hambre**, que muestra 3 snacks (primero los que se pueden hacer ya y los que más llenan), y "¿Qué pido?" para comer fuera |
| **Recetas** | Buscador y filtros: puedo hacerla ya, favoritas, probadas, por probar, tipo, ≤ 15 min, air fryer, meal prep, mías. Botones **Mi receta** (la escribes y la IA la ordena) y **Proponme una** (la IA inventa una con tu despensa). Siempre se ve antes de guardar |
| **Detalle** | Porción "ajustada a tu comida" o "como la receta", ingredientes con ✓ si están en casa, pasos con temporizador, favorita, "¿Te gustó?", **Registrar** (sin IA: se calcula con la receta) y **Cocinar paso a paso** |
| **Modo cocinar** | Pantalla completa con letra grande. Primero alistar ingredientes; luego un paso por pantalla con temporizador (sonido y vibración) y la pantalla siempre encendida. Al final: registrar y valorar |
| **Despensa** | Ingredientes por sección para marcar con un toque, el equipo de cocina y el contador "Con esto puedes hacer N recetas" |
| **Semana** | "Armar mi semana": recetas para los 7 días ajustadas al objetivo, con **meal prep** (una receta que rinde 3–4 porciones se cocina una vez y cubre los días siguientes como "sobras"). Cambiar cualquier comida. **Lista de compras** agrupada, que separa lo que ya tienes; "Ya compré" lo pasa a la despensa. El domingo se planea la semana que empieza el lunes |
| **Inicio** | "¿Qué como ahora?" muestra la receta de la siguiente comida |

## 4. Chat
Herramientas nuevas:
- `buscar_recetas`;
- `actualizar_despensa` ("compré pollo y huevos");
- `sugerir_snack`;
- `registrar_receta`: acepta el id o el nombre y crea un **borrador**, que se guarda solo después del "sí", como cualquier comida;
- `proponer_receta`;
- `guardar_receta`.

`plan_comidas` ahora responde con recetas, y si ninguna sirve vuelve al plan de alimentos sueltos.

Arreglo de robustez: si el modelo copia mal el id del borrador y hay un solo borrador pendiente de un turno anterior, se guarda ese.

## 5. Datos
- **En el código** (repo público, sin valores de la TCAC; solo ids):
  - `src/lib/nutrition/kitchen/ingredients.ts`: 91 ingredientes;
  - `library.ts`: 46 recetas (12 desayunos, 18 almuerzos o cenas, 16 snacks).
- **En Firestore** (pocas lecturas):

| Documento | Contenido |
|---|---|
| `kitchen/main` | Despensa, equipo, estado de cada receta y marcas de la lista de compras. Un solo documento |
| `recipes/{id}` | Solo las recetas propias y de la IA |
| `mealPlans/{lunes}` | El plan de una semana |

  Además, `meals` guarda `recipeId` cuando una comida sale de una receta.
- **Lecturas con la caché fría:**
  - Recetas y Despensa: ~2–3 (perfil, cocina y recetas propias);
  - Hoy, detalle y Semana: además las comidas de hoy;
  - Inicio: usa lo que ya leía, más la cocina en caché.

## 6. Archivos
```
src/lib/nutrition/kitchen/
  ingredients.ts   catálogo de despensa (ids de la base, unidades, cómo se compra)
  recipes.ts       tipos
  library.ts       biblioteca inicial
  nutrition.ts     nutrientes por porción y cantidades de cocina ("2 huevos", "½ taza (45 g)")
  scale.ts         ajuste a la meta de una comida
  match.ts         despensa, equipo, dieta y alimentos evitados
  planner.ts       comidas que faltan, metas por comida, plan del día, "Tengo hambre"
  week.ts          plan de la semana y lista de compras
  authoring.ts     recetas propias y de la IA (validación + Structured Outputs)
  state.ts         estado de la cocina y del plan semanal
  server.ts        vistas para la API y herramientas del chat
  kitchen.test.ts  32 pruebas
src/app/api/comidas/{recipes,pantry,snacks,week,shopping}/…
src/app/comidas/planes/{page,recetas,despensa,semana}/…
src/components/nutriverse/NvKitchen.tsx, src/app/comidas/planes.css
scripts/nutrition/check_recipes.ts   revisa la biblioteca contra la base real
scripts/dev-local.mjs                app local SIN Firebase (puerto 3100, PIN de ejemplo)
```

## 7. Cómo probar sin tocar los datos reales
1. Necesitas una base local en `.data/nutrition-local/foods.json`. Se baja con `download_db.ts` (cuando haya cuota) o se arma con `build_db.ts` y se copia ahí.
2. `node scripts/dev-local.mjs`, o la entrada `nutriverse-local` del panel de vista previa.
3. Abrir http://localhost:3100/comidas y entrar con el PIN de `.env.example`.

Todo se guarda en `.data/nutrition-store.json`.

## 8. Pendiente
- Revisión de Juan en el iPhone: las recetas, que las porciones ajustadas se sientan reales, y el modo cocinar.
- Fotos de las recetas: por ahora usan la burbuja de su tipo. Se pueden generar con `04b-ficha-recursos.md`.
- Las cantidades de la biblioteca son estimaciones de recetas caseras. Si Juan prueba una y la porción no cuadra, se ajusta en `library.ts` y se vuelve a correr `check_recipes.ts`.
- La IA tarda ~15–20 s en proponer o leer una receta (razonamiento "low").
