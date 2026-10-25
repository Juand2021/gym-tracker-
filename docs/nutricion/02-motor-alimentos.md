# Fase 2 — Motor de alimentos y precisión

> Fecha: 2026-10-24 (actualizado 2026-10-25) · Estado: **✅ Fase 2 cerrada: meta cumplida en el set de prueba congelado (R9)**
> Notas completas con fuentes: `research_notes/Motor de alimentos open source/`

## 1. Qué aprendimos

### 1.1 Ninguna API comercial gratuita sirve para Colombia
| Opción | Veredicto |
|---|---|
| FatSecret Basic (gratis, 5.000 llamadas/día) | Solo datos de EE. UU. en inglés; Colombia y español solo en el plan de pago. Obliga a borrar la caché a las 24 h y **prohíbe dar consejos de dieta** → descartada |
| Edamam, Nutritionix, Spoonacular | Sin plan gratuito útil o con caché prohibida → descartadas |
| Fitia, MacroFactor, Cronometer | No venden su base. Lo que funciona en ellas es **la arquitectura**, no un dato secreto: base curada + IA que descompone + el usuario revisa |

### 1.2 Sí hay suficientes datos abiertos (≈ 25.000 entradas combinadas)
| Capa | Fuente | Tamaño | Licencia | Uso |
|---|---|---|---|---|
| 1 | **TCAC 2015 (ICBF)** + 18 preparaciones típicas | 967 alimentos + 18 platos | "Prohibida su reproducción sin autorización" → **pedir permiso a ICBF** antes de lanzar | Núcleo colombiano: arepas, fríjol, plátano, papa criolla, cortes de carne cocidos, chicharrón, pandebono, kumis, sancocho, ajiaco, bandeja paisa… El PDF 2015 tiene texto extraíble |
| 2 | **Guías Alimentarias (GABA 2020) + PAE (Res. 335/2021)** | Tablas de intercambio | Documento público | **Gramos por porción colombiana** (arroz cocido 80 g/intercambio, arepa delgada 56 g, carne 60 g cruda…) |
| 3 | **USDA FoodData Central** (Foundation, SR Legacy, FNDDS) | ~13.000 alimentos y platos | CC0 (libre) | Alimentos genéricos y platos mixtos; precarga completa, traducción a español una sola vez |
| 4 | **CIQUAL (Francia)** / **TACO (Brasil)** | ~3.200 / ~600 | Abierta / con cita | Respaldo; TACO aporta alimentos tropicales |
| 5 | **Open Food Facts Colombia** | 9.848 productos | ODbL (atribución, colección aparte) | Marcas y empacados (Milo, Alpina, Zenú…) |
| 6 | **Recetas colombianas propias** | Las construimos | Nuestra | Corrientazo, bandeja paisa, perro, salchipapa… como **plantillas de componentes** con gramos por defecto |
| 7 | **Tus porciones** | Crece con el uso | — | "Mi porción de arroz = 250 g" aprendida de tus correcciones |

**Respuesta a tu duda de "150–300 alimentos":** ese número era solo la parte transcrita a mano. Con la TCAC 2015 completa extraída automáticamente y las otras capas pasamos a **decenas de miles** de entradas, con lo colombiano primero.

### 1.3 Lo que sube la precisión (evidencia)
- **El sistema con mejores números publicados** (NDS, 2026) llegó al **84,6 %** de aciertos en NutriBench contra el 66,8 % del mejor LLM solo. Funciona así: el LLM descompone la comida → búsqueda **híbrida** (palabras clave + significado/embeddings) → el LLM elige entre ~25 candidatos o dice "no hay coincidencia" → el código calcula.
- Dar gramos reduce mucho el error; las porciones caseras ("una taza") lo aumentan → por eso las **porciones por defecto colombianas** son clave.
- Los LLM **olvidan el aceite y las salsas** → paso obligatorio para el aceite de cocción según el método (frito, sudado, asado).
- Confusión crudo/cocido en carnes → siempre registrar el estado.
- Repetir la misma pregunta varias veces al modelo (*self-consistency*) **no** mejoró → no gastamos en eso.

### 1.4 Límite real (importante)
Un mismo plato de restaurante varía **~35 %** en calorías de un lugar a otro (BMJ 2018, medido con calorimetría). Ninguna app, ni Fitia, puede saber cuánto aceite le echaron a tu almuerzo. Por eso:
- **La meta se mide contra recetas estándar documentadas**, que es lo que sí podemos verificar.
- Contra el plato real, el error de los restaurantes es inevitable; se compensa porque el **TDEE adaptativo** se ajusta con tu peso real (si el registro tiende a quedarse corto, el mantenimiento calculado baja solo).

## 2. Propuesta del motor

```
"almorcé un corrientazo con cerdo y un jugo de mora"
   │
   ▼  (1) gpt-5-mini · Structured Outputs estricto
   ítems: [{nombre_es, nombre_en, estado, método, gramos|porción, fuente_gramos, confianza}]
   + plantilla "corrientazo" → sopa, arroz, principio, cerdo, tajadas, ensalada, jugo
   + aceite de cocción según método
   │
   ▼  (2) búsqueda híbrida (palabras clave + embeddings) en capas 7→1…5
   ~25 candidatos por ítem
   │
   ▼  (3) gpt-5-mini reordena → elige uno o "sin coincidencia"
   │
   ▼  (4) CÓDIGO calcula: nutrientes/100 g × gramos
   validaciones: Atwater (4P+4C+9G+7A ±15 %), densidad plausible, máximos
   │
   ▼  (5) tarjetas editables + ≤1 pregunta (el ítem con más kcal en juego)
   tú confirmas → se guarda → se aprenden tus porciones
```

## 3. Cómo mediremos (2b)
- **~100 comidas canónicas** de tu realidad (desayunos, corrientazos, cenas, domicilios, snacks, fiestas) con valor "verdadero" calculado de recetas estándar ICBF/GABA/USDA.
- Cada una se escribe **de dos formas** en español colombiano (generadas y revisadas): **con gramos** ("300 g de arroz…") y **vaga** ("un plato de arroz…") → **~200 descripciones por set**. Con 200, un 80 % medido tiene un margen de ±6 puntos.
- Métricas: % dentro de ±10 % y ±20 % de kcal, error medio, sesgo (si tiende a quedarse corto o pasarse) y error de proteína.
- **Meta:** con gramos ≥ 90 % dentro de ±10 %; vaga ≥ 80 % dentro de ±20 %.

## 4. Prototipo y banco de pruebas (2c)
- Código en `src/lib/nutrition/engine/` (reutilizable luego por la app) y script `scripts/nutrition-benchmark.ts` que corre todo el set y entrega un reporte.
- Iteramos prompts, plantillas, porciones y búsqueda **hasta pasar la meta**; cada ronda queda registrada en este documento.
- Costo estimado de cada corrida completa: centavos de dólar (gpt-5-mini + embeddings `text-embedding-3-small` ≈ USD 0,02 por millón de tokens).

## 5. Decisiones (2026-10-24)
- **ICBF:** uso personal de Juan → se usa la TCAC sin pedir permiso por ahora. **Antes de abrir la app a otros usuarios, Juan decidirá cómo gestionarlo.**
- **Embeddings:** modelo multilingüe local y gratuito (`@huggingface/transformers`), sin despliegue extra en Azure.
- **Set de prueba:** lo genera y revisa Claude; Juan no revisa la muestra.
- **Diseño del motor aprobado** → se pasa a 2b (set de referencia) y 2c (prototipo + banco de pruebas).
- Datos crudos descargados en `.data/nutrition-raw/` (ignorado por git).

## 6. Lo construido (2b/2c, 2026-10-25)

| Pieza | Archivo | Qué hace |
|---|---|---|
| Base unificada | `scripts/nutrition/build_db.ts` → `.data/nutrition/foods.json` | TCAC 899 + USDA 13.035 + 17 registros propios del núcleo = **13.951**. Deduce el etanol de las bebidas TCAC. Valida que todas las referencias del núcleo existan |
| Verificación cruzada | `scripts/nutrition/cross_check.ts` | Núcleo vs USDA (alerta >30 %) y Atwater (±15 %). **Sin alertas** |
| Texto | `engine/text.ts` | Minúsculas, sin tildes, plurales ("frijoles"→"frijol"), números en palabras ("media", "dos", "1/2") |
| Búsqueda | `engine/search.ts` | BM25 sobre nombres y sinónimos es/en; prioridad al núcleo y a la TCAC; castiga marcas del USDA y alimentos no listos para comer (crudo, en polvo, mezcla) |
| Porciones | `engine/portions.ts` | Gramos dichos > plantilla del plato > porción colombiana del núcleo > porción USDA > medida genérica > estimado de la IA |
| Cálculo | `engine/compute.ts` | Nutrientes × gramos, Atwater, avisos de cantidades imposibles |
| Lector IA | `engine/parse.ts`, `engine/rerank.ts` | gpt-5-mini con JSON Schema estricto (catálogo del núcleo y platos en el prompt) + elección entre ~25 candidatos. **Escrito, sin probar: faltan las credenciales** |
| Lector por reglas | `engine/parse-rules.ts` | Sin IA: reconoce sinónimos, cantidades, unidades, tamaños, "sin X", platos y sus componentes. Sirve de **línea base** y de **respaldo** si la IA falla |
| Pipeline | `engine/pipeline.ts` | Une todo; suma el aceite de cocción (frito 8 g/100 g, apanado 12, salteado 4) si el alimento no lo trae; máximo 1 pregunta por comida |
| Pruebas | `engine/engine.test.ts` | 25 pruebas `node --test` (en `npm test`) |
| Set de referencia | `scripts/nutrition/benchmark/meals.ts` | **100 comidas** (20 desayunos, 25 almuerzos, 17 cenas, 15 domicilios, 13 snacks, 10 fiestas), 2 descripciones cada una = 200. ~15 % usan alimentos fuera del núcleo. Las de número múltiplo de 3 son el **set de prueba congelado** (33 comidas, 66 descripciones) |
| Banco de pruebas | `scripts/nutrition/benchmark.ts` | `--parser rules\|llm --set dev\|test\|all`; reporta % en ±10/±20 %, error medio, sesgo y error de proteína por categoría |

### Correcciones de datos hechas en esta ronda
- **Cerveza:** la TCAC da 63 kcal/100 ml (alto para 4 %) → USDA 43 kcal (3,9 g de etanol). Una pola de 330 ml: 142 kcal en vez de 208.
- **Sancocho:** el análisis ICBF usó 450 g de gallina por porción (16,4 g de proteína y solo 2,9 g de carbohidratos por 100 g) → se reemplaza por receta típica de restaurante (plato de 600 g ≈ 606 kcal).
- Huevos pericos: sin cantidad = 2 huevos (120 g); "3 pericos" = 3 × 60 g.
- Porciones USDA "cantidad no especificada" (código 90000) ahora se usan como porción típica.

## 7. Rondas del banco de pruebas

Meta: con gramos ≥ 90 % dentro de ±10 % · vaga ≥ 80 % dentro de ±20 %.

| Ronda | Lector | Set | Con gramos (±10 %) | Vaga (±20 %) | Cambios |
|---|---|---|---|---|---|
| R1 | reglas | dev | 77,6 % | 80,6 % | Primera medición |
| R2 | reglas | dev | 86,6 % | 91,0 % | Búsqueda en la base completa para lo que no está en el núcleo; "6 cervezas de 330 ml" = 6 × 330; plurales sin cantidad = porción; sinónimos repetidos unidos; "poquito"/"harto" |
| R3 | reglas | dev | 86,6 % | 91,0 % | Palabras genéricas dentro de un plato ("salchipapa: papas…, queso…") = sus componentes |
| R4 | reglas | dev | **92,5 %** ✅ | **91,0 %** ✅ | Porciones USDA bien leídas; castigo a marcas y a "crudo/en polvo/mezcla"; "papas" junto a comida rápida = papas fritas |
| R4 | reglas | **prueba** | 78,8 % ❌ | 69,7 % ❌ | Corrida única sobre el set congelado |

**Lectura de R4:** el lector por reglas pasa la meta en el set con el que se ajustó, pero **no generaliza**: en el set de prueba falla justo en alimentos que nunca vio (shawarma, chontaduro, sushi, ensalada césar, avena en leche). Esto confirma el diseño: hace falta el lector con IA + la base con nombres en español. No se ajustó nada mirando el set de prueba.

| R5 | IA | dev | 91,0 % ✅ | 86,6 % ✅ | Primera corrida con gpt-5-mini (nombres USDA aún en inglés) |
| R6 | IA | dev | 89,6 % | 86,6 % | La IA indica el plato y sus cambios; el código expande la plantilla. Falla: la IA inventaba platos no mencionados |
| R7 | IA | dev | 89,6 % | 85,1 % | Protección: solo se aceptan platos nombrados. Falla: tamal/mute/sancocho iban como "plato" y se perdían |
| R8 | IA | dev | **95,5 %** ✅ | **94,0 %** ✅ | "Combos" explícitos en el prompt + nombres USDA traducidos al español (12.947/13.035) |
| R8 | IA | **prueba** | 87,9 % ❌ | 72,7 % ❌ | Corrida única sobre el set congelado |

**Lectura de R8 (prueba):** con gramos queda cerca; lo vago falla por errores generales: avena sin cantidad = 1 cucharada (6 g); la IA fuerza alimentos parecidos del catálogo (ensalada césar → ensalada de repollo, shawarma → sobrebarriga); "con patacones" = 1 patacón; en platos de afuera usa el peso de una pieza USDA (rollo de sushi = 30 g). Como el set de prueba ya se miró, pasa a ser de ajuste y se escribe un **set de prueba nuevo** (comidas 101–150) **antes** de corregir.

| — | — | — | — | — | Set de prueba nuevo (comidas 101–150) escrito y congelado en git **antes** de corregir; dev pasa a ser 1–100 |
| R9 | IA | dev (1–100) | 92,0 % ✅ | 92,0 % ✅ | Combos no nombrados quedan como alimento a buscar; `core_key` solo si es el mismo alimento; fuera del núcleo manda el estimado de gramos de la IA; plural sin cantidad = porción; avena = porción 40 g |
| **R9** | **IA** | **prueba nueva (101–150)** | **92,0 % ✅** | **86,0 % ✅** | **Corrida única. Meta cumplida.** Error medio 3,5 % (gramos) y 9,5 % (vaga); sesgo ≈ −0,7 % (no se queda corto ni se pasa) |

**Fallas de confiabilidad conocidas (para la Fase 6, no se corrigieron mirando la prueba):** en ~2 % de las descripciones el modelo devuelve un ítem vacío o pierde alimentos (#110 con gramos, #101 vaga). Mitigación ya acordada: **confirmación obligatoria** de cada comida antes de guardar. Otros errores típicos: "tajada de sandía" (42 g vs 300 g), tragos con "coca zero" leídos como coctel. Latencia: 3–9 s por comida con `reasoning_effort: low`.

### Traducción de nombres (2026-10-25)
`enrich_names.ts` con gpt-5-mini: 13.846/13.934 nombres (99,4 %). 88 quedan en inglés porque el filtro de contenido de Azure bloquea esos lotes (falsos positivos con palabras de anatomía animal). Calidad buena: "Blood sausage" → "Morcilla" (sinónimo "rellena"), "Gyro sandwich" → "sándwich gyro".

### Embeddings locales: descartados por ahora
Se probaron 3 modelos multilingües locales (`multilingual-e5-small`, `multilingual-e5-base`, `paraphrase-multilingual-MiniLM-L12-v2`) en 5 casos español→inglés ("almendras" → "Nuts, almonds"; "shawarma" → "Gyro sandwich"…). Acertaron **0/5, 0/5 y 1/5**: prefieren el texto que comparte palabras en el mismo idioma ("almendras" → "Chigua, almendra"). La solución es **traducir los nombres USDA al español** (`enrich_names.ts`, una sola vez con gpt-5-mini) y dejar que el modelo elija entre candidatos. Se puede volver a probar con nombres ya traducidos (español↔español).

### Siguiente ronda (bloqueada por credenciales)
1. Correr `enrich_names.ts` (traduce 13.035 nombres USDA y agrega sinónimos colombianos a la TCAC) y regenerar `foods.json`.
2. `benchmark.ts --parser llm --set dev`, iterar el prompt, y una sola corrida final con `--set test`.
