# Traspaso — App de Comidas (para continuar en otra sesión / en la nube)

> Última actualización: 2026-10-24. Escrito al cortar la sesión local para continuar en Claude Code en la nube.
> **Leer primero:** `README.md` (plan de fases), `00-discovery.md`, `01-investigacion.md`, `02-motor-alimentos.md`.

## 1. Reglas de trabajo acordadas con Juan
- Trabajo **por fases**. Al entrar a cada fase: resumen de lo que se hará + preguntas → Juan aprueba → se ejecuta.
- Español, lenguaje simple (Juan es nuevo en nutrición).
- Cuenta de GitHub: **Juand2021** (personal), nunca la de empresa.
- Next.js 16.3 con cambios incompatibles: leer `node_modules/next/dist/docs/` antes de escribir código Next (ver `AGENTS.md`).
- Repo **público** → los datos derivados de la TCAC/ICBF ("prohibida su reproducción") **no se suben**; viven en `.data/` (ignorado). Solo se versionan los scripts que los generan.

## 2. Dónde vamos
| Fase | Estado |
|---|---|
| 0 Discovery | ✅ `00-discovery.md` |
| 1 Investigación nutricional | ✅ `01-investigacion.md` (reglas de cálculo, objetivos por fase, alcohol, TDEE adaptativo) |
| 2 Motor de alimentos y precisión | 🟡 2a ✅ investigación + diseño aprobado (`02-motor-alimentos.md`). **2b/2c en curso** |
| 3 Arquitectura · 4 Frontend · 5 Implementación · 6 Validación · 7 Mejoras | Pendientes |

Decisiones clave de la Fase 2: meta doble (con gramos ≥90 % dentro de ±10 % kcal; vaga ≥80 % dentro de ±20 %), Juan **no pesa** comida, solo fuentes gratis, foto para después, embeddings con modelo **local** (`@huggingface/transformers`), uso personal de la TCAC (Juan decidirá sobre ICBF antes de abrir a otros usuarios), Juan no revisa el set de prueba.

## 3. Lo construido en 2b/2c (sin commitear antes de este traspaso)
- `scripts/nutrition/parse_tcac.py` — extrae la tabla proximal de la TCAC 2015 (PyMuPDF) → **899 alimentos**, validado con Atwater (solo fallan 3 bebidas alcohólicas, esperado). Tildes correctas (en consola Windows se ven mal, es solo display).
- `scripts/nutrition/build_fdc.py` — USDA FDC (Foundation 2026-04, SR Legacy, FNDDS 2024-10) → **13.035 alimentos** por 100 g; carbohidratos normalizados a "disponibles" (total − fibra) como la TCAC.
- `scripts/nutrition/enrich_names.ts` — traduce nombres USDA al español y genera sinónimos colombianos con gpt-5-mini (Structured Outputs, por lotes, con caché reanudable `.data/nutrition-raw/names_cache.json`). **No se ha ejecutado** (ver bloqueo).
- `src/lib/nutrition/ai-client.ts` — cliente Azure/OpenAI compartido + `structuredCompletion()` (JSON Schema estricto, sin temperature para gpt-5).
- `src/lib/nutrition/engine/types.ts` — tipos (Nutrients, FoodRecord, CoreFood, DishTemplate, unidades de porción).
- `src/lib/nutrition/engine/core-foods.ts` — **núcleo curado de ~120 alimentos** colombianos con referencia verificada (TCAC-x / FDC-x o valores propios GABA/ICBF), porciones colombianas (GABA/PAE o estimación marcada) y sinónimos; **8 plantillas** de platos (corrientazo, calentado, milo en leche, café con leche, jugo en leche, salchipapa, bandeja paisa, desayuno típico). Aún no compilado ni probado.

### Hallazgos de calidad de datos (TCAC)
Valores dudosos reemplazados en el núcleo: pasta "cocida" (son valores de pasta seca), fríjol/lenteja/garbanzo cocidos (60/49/71 kcal, demasiado bajos → se usan intercambios GABA 137/117/164), lomo de res cocido y carne molida (humedad de crudo → USDA). Arroz blanco cocido TCAC = 153 kcal (incluye aceite, correcto para Colombia).

## 4. Cómo regenerar los datos (en la nube no existen: `.data/` está ignorado)
```bash
mkdir -p .data/nutrition-raw/fdc && cd .data/nutrition-raw
curl -sL -o tcac_2015.pdf "https://www.minsalud.gov.co/sites/rid/Lists/BibliotecaDigital/RIDE/INEC/IETS/tabla-de-composicion-alimentos-colombianos-2015.pdf"
curl -sL -o icbf_18_preparaciones.pdf "https://www.icbf.gov.co/system/files/caracterizacion-composicion-18-preparaciones-tradicionales-icbf1_0.pdf"
curl -sL -o gaba_2020.pdf "https://www.minambiente.gov.co/wp-content/uploads/2023/11/guias_alimentarias_basadas_en_alimentos_para_la_poblacion_colombiana_mayor_de_2_anos_0.pdf"
for f in FoodData_Central_foundation_food_json_2026-04-30.zip FoodData_Central_sr_legacy_food_json_2018-04.zip FoodData_Central_survey_food_json_2024-10-31.zip; do curl -sL -o "$f" "https://fdc.nal.usda.gov/fdc-datasets/$f"; done
cd fdc && for z in ../*.zip; do unzip -oq "$z"; done && cd ../../..
pdftotext -enc UTF-8 -layout .data/nutrition-raw/tcac_2015.pdf .data/nutrition-raw/tcac_2015.txt
pip install pymupdf   # si falta
python -I scripts/nutrition/parse_tcac.py .data/nutrition-raw/tcac_2015.pdf .data/nutrition-raw/tcac_2015.json .data/nutrition-raw/tcac_2015.txt
python -I scripts/nutrition/build_fdc.py .data/nutrition-raw/fdc .data/nutrition-raw/fdc_compact.json
```
Juan ya autorizó estas descargas (≈160 MB) y la del modelo de embeddings local.

## 5. Bloqueo actual
`.env.local` local tiene **vacías** `AZURE_OPENAI_ENDPOINT` y `AZURE_OPENAI_API_KEY` (la app en producción las tiene en Vercel). Para correr `enrich_names.ts` y el benchmark hace falta que Juan configure esas variables en el entorno de la nube (formato en `.env.example`: endpoint `https://<recurso>.services.ai.azure.com/openai/v1`, deployment `gpt-5-mini`). Nunca escribir la clave por él.

## 6. Próximos pasos (en orden)
1. Regenerar datos (sección 4) y verificar conteos (899 TCAC, 13.035 FDC).
2. `scripts/nutrition/build_db.ts`: unir TCAC + FDC + `names_cache` → `.data/nutrition/foods.json`; calcular `alcohol_g` en bebidas TCAC como `(kcal − Atwater)/7`; validar que todas las `ref` del núcleo existen.
3. Script de **verificación cruzada**: cada alimento del núcleo vs su `crossCheck`/equivalente USDA; alertar si difiere >30 % en kcal/100 g.
4. Compilar/probar `core-foods.ts` (tipos; hay un `.filter` raro en `jugo_fruta_agua` que conviene limpiar).
5. Motor (`src/lib/nutrition/engine/`): `text.ts` (normalizar español, sin tildes, plurales), `search.ts` (BM25 sobre nombres+sinónimos es/en; luego híbrido con embeddings locales + fusión RRF k=60), `portions.ts` (gramos dados > porción del núcleo > unidad genérica > estimación LLM marcada), `parse.ts` (gpt-5-mini, JSON Schema: ítems con core_key, cantidad, unidad, gramos dichos, estado crudo/cocido, método, plato de origen, confianza, supuesto; el prompt incluye la lista del núcleo y las plantillas; aceite/salsas/bebidas como ítems aparte), `rerank.ts` (LLM elige entre ~25 candidatos o "sin coincidencia"), `compute.ts` (nutrientes × gramos; validaciones Atwater ±15 %, densidad plausible, máximos), `pipeline.ts` (resultado editable + ≤1 pregunta aclaratoria por comida).
6. Tests `node --test` de text/search/portions/compute (agregarlos al script `test` de `package.json`).
7. **Set de referencia** (`scripts/nutrition/benchmark/`): ~100 comidas canónicas (desayunos, corrientazos, cenas de sobras, domicilios, snacks, fiestas) definidas como claves del núcleo + gramos estándar; generar 2 descripciones por comida en español colombiano (con gramos / vaga) → apuntar a ≥200 por set; separar set dev y set de prueba congelado.
8. `scripts/nutrition/benchmark.ts`: correr el pipeline, reportar % dentro de ±10/±20 % kcal, MAPE, sesgo, error de proteína, por categoría; iterar hasta la meta y registrar cada ronda en `02-motor-alimentos.md`.
9. Al pasar la meta: presentar resultados a Juan y entrar a la **Fase 3 (Arquitectura)** con resumen + preguntas.

## 7. Pendientes para fases posteriores (ya acordados)
- Perfil único en servidor compartido por Fuerza y Comidas (migrar `AppSettingsContext` de localStorage); medidas corporales (cintura, cuello, bíceps, pierna…) también visibles en Fuerza.
- Modo fiesta (registrar lo que tomó; afecta objetivo diario y semanal; consejos antes/después).
- Modo consulta "¿qué pido?" (comparar opciones de menú según calorías/macros restantes y fase).
- Confirmación obligatoria antes de guardar cada comida.
- Números provisionales de Juan mientras tanto: ~2.200 kcal, ~170 g proteína (supuesto 78 kg; recalcular con su peso real).
