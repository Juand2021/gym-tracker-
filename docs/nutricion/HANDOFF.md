# Traspaso — App de Comidas (para continuar en otra sesión / en la nube)

> Última actualización: **2026-10-25 (noche), sesión local en Claude Desktop**: revisión 1 del frontend, vidrio Cristal, 60 fps y arreglo de la cuota de Firebase. **Publicado en `main` / Vercel.**
> **Leer primero:** `README.md` (plan de fases), `reports/2026-10-25-revision-1.md` (lo último), `05-firebase-cuota.md`, `04-frontend.md`.

## 0a. Planes 2.0 (2026-10-25, noche) — rama `feat/nutriverse-planes-recetas`
- Recetas, despensa, snacks ("Tengo hambre"), plan del día con recetas, semana con meal prep y lista de compras, recetas propias y de la IA, modo cocinar. Todo en `06-planes-recetas.md`.
- Probado en local **sin Firebase** con `node scripts/dev-local.mjs` (puerto 3100, PIN de `.env.example`, datos en `.data/`, base de prueba en `.data/nutrition-local/foods.json`). El chat se probó con Azure.
- `npm test`: todo pasa. `next build` y ESLint de los archivos tocados: sin errores.
- Falta: la revisión de Juan en el iPhone y unir a `main`.

## 0. Estado actual (2026-10-25, noche)
- **Rama**: todo el trabajo de NutriVerse se unió a **`main`** por pull request y Vercel publica esa versión. Para trabajo nuevo: crear una rama desde `main`.
- **Último trabajo** (detalle en `reports/2026-10-25-revision-1.md`):
  - Vidrio **Cristal** en toda la app, con luz que sigue el dedo y presión de gelatina (`04-frontend.md` §12b).
  - **Fluidez a 60 fps**:
    - entradas sin desenfoque;
    - velocímetro en capas y aguja ágil que recuerda su posición;
    - fondo y olas en pausa cuando no hacen falta.
  - **Cuota de Firebase** (`05-firebase-cuota.md`):
    - series dentro del entreno;
    - caché de 60 s en el servidor y en el navegador;
    - 503 con mensaje claro y "Reintentar guardar";
    - contador de lecturas;
    - script de migración.
- **Pendiente inmediato** (con la cuota reiniciada, después de las ~2:00 a. m. de Colombia):
  1. Correr la migración. Primero el modo de prueba y después `--write` (`05-firebase-cuota.md` §5).
  2. Medir las lecturas reales de cada pantalla con los registros `[firestore]` y confirmar que un día normal queda por debajo del 10 % de la cuota.
  3. Juan decide si activa el plan **Blaze** con alerta de presupuesto de US$1. Es la única forma de que la base nunca se bloquee.
- **Ver la app en el iPhone por Wi-Fi**:
  - `npm run iphone` (producción, para juzgar la fluidez) o `npm run dev:iphone` (cambios en vivo). En el panel de vista previa de Claude están las entradas `nutriverse-iphone` y `nutriverse-wifi` de `.claude/launch.json`.
  - Dirección: `http://<IP del PC>:3000/comidas`.
- **`.env.local`** (ignorado por git), con todo ya configurado en el PC de Juan:
  - `SITE_PIN`, `SITE_PIN_LAURA`;
  - `FIREBASE_SERVICE_ACCOUNT`: JSON en una línea;
  - `AZURE_OPENAI_ENDPOINT`, `AZURE_OPENAI_API_KEY`: de la empresa; Juan no tiene acceso al portal de Azure;
  - `AZURE_OPENAI_DEPLOYMENT=gpt-5-mini`.
  - Vercel no deja descargar las claves sensibles; `scripts/merge-env.mjs` copia solo las que faltan.
- **Cuidados**:
  - Lo que se registra en el chat se guarda en el Firestore real de Juan; no crear datos de prueba ahí.
  - El lint de `src/app/ia`, `AppSettingsContext`, `IosInstallPrompt`, `RestTimerContext` y las gráficas de analytics ya tenía errores antes; no son de NutriVerse.
  - Para leer Firestore siempre se usan funciones que no traigan series de más (`listWorkoutDates` para fechas). Se miran los registros `[firestore]` antes de agregar lecturas nuevas.

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
| 2 Motor de alimentos y precisión | ✅ Meta cumplida con IA en el set de prueba congelado (R9: 92 % / 86 %). Ver `02-motor-alimentos.md` §6–7 |
| 3 Arquitectura | ✅ Aprobada el 2026-10-25 (`03-arquitectura.md`) |
| 4 Frontend mínimo | ✅ **Comidas es una app aparte** (corrección de Juan): selector de apps en el logo, `/comidas` (Hoy) y `/comidas/chat` (asistente propio). El Coach `/ia` de Fuerza quedó como estaba |
| 5 Implementación | ✅ Lista para cualquier persona (ver `03-arquitectura.md` §0b): perfil completo y validado, bienvenida guiada, cambio de objetivo, peso, medidas, plan de comidas, perfil compartido con Fuerza, Firebase conectado. Probado: persona nueva de punta a punta (local) y Juan con datos reales (Firebase) |
| 4b Frontend de **NutriVerse** | ✅ Implementado (`04-frontend.md` §12) y **revisado por Juan** (§12b): vidrio Cristal, luz del dedo, 60 fps. Pendiente: fondo WebGL y lentes con refracción (para después) e imágenes de `04b-ficha-recursos.md` |
| Planes 2.0 (recetas, despensa, semana) | 🟡 Implementado en rama; falta revisión en iPhone (`06-planes-recetas.md`) |
| Cuota de Firebase | 🟡 Arreglo publicado (`05-firebase-cuota.md`); falta la migración de entrenos y medir con la cuota reiniciada |
| 6 Validación · 7 Mejoras | Pendientes |

Decisiones clave de la Fase 2: meta doble (con gramos ≥90 % dentro de ±10 % kcal; vaga ≥80 % dentro de ±20 %), Juan **no pesa** comida, solo fuentes gratis, foto para después, embeddings con modelo **local** (`@huggingface/transformers`), uso personal de la TCAC (Juan decidirá sobre ICBF antes de abrir a otros usuarios), Juan no revisa el set de prueba.

## 3. Lo construido en 2b/2c (histórico: ya está todo commiteado)
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

## 5. Credenciales
Azure ya está configurado en el entorno de la nube (`AZURE_OPENAI_ENDPOINT`, `AZURE_OPENAI_API_KEY`, `AZURE_OPENAI_DEPLOYMENT=gpt-5-mini`), verificado el 2026-10-25. Nunca escribir la clave.

## 5b. Firebase (conectado el 2026-10-25)
- La llave de servicio vive solo en `.env.local` (ignorado por git) de este entorno. **Nunca subirla.** En producción ya está en Vercel.
- Proyecto `gym-tracker-fd03b`. Colecciones de Fuerza (no tocar): `workouts`, `bodyWeight`, `chatThreads`, `users/laura/*`.
- Colecciones de Comidas: `profile/main` (perfil, creado), `nutritionDb/current` (+ `chunks/0..1`, base de 13.951 alimentos, subida con `upload_db.ts`), `meals`, `mealDrafts`, `comidasChats`, `bodyMeasurements`.
- Objetivos con datos reales (peso 76,3 kg del 2026-10-03, 14 entrenos en 28 días): **1.880 kcal, 183 g proteína, 52 g grasa, 169 g carbohidratos**.
- Prueba de punta a punta con Firebase: analizar 12 s (incluye la primera carga de la base), guardar 4 s. Datos de prueba borrados.
- Scripts: `node --env-file=.env.local --experimental-strip-types scripts/nutrition/<script>.ts`.

## 6. Próximos pasos
Fase 2 cerrada el 2026-10-25. Para regenerar todo en una sesión nueva (después de la sección 4):
```bash
node --experimental-strip-types scripts/nutrition/enrich_names.ts   # usa el caché si existe; si no, ~45 min
NUTRI_BATCH=8 node --experimental-strip-types scripts/nutrition/enrich_names.ts   # reintenta los lotes bloqueados por el filtro de Azure
node --experimental-strip-types scripts/nutrition/build_db.ts
node --experimental-strip-types scripts/nutrition/cross_check.ts
node --experimental-strip-types scripts/nutrition/benchmark.ts --parser llm --set dev   # dev = 1–100; test = 101–150 (ya usado en R9)
```
Nota: `names_cache.json` vive en `.data/` (no se sube). Si se pierde, se regenera con `enrich_names.ts`.

**Estado 2026-10-25 (tarde, histórico):** el trabajo de la nube quedó en la rama; esa noche Juan lo revisó y se publicó en `main` (ver §0).
- Probar en local: `.env.local` con `SITE_PIN` (+ variables de Azure) → `npx next dev` → tocar el logo → Comidas → Chat → "almorcé…".
- Sin Firebase, Comidas guarda en `.data/nutrition-store.json` y lee la base de `.data/nutrition/foods.json`.
- Con Firebase: `node --env-file=.env.local --experimental-strip-types scripts/nutrition/upload_db.ts` sube la base a `nutritionDb/current`.
- Tiempos medidos: registrar una comida 9–10 s (razonamiento "low"); guardar ~5 s.
- Nota: en local sin entrenos ni peso, el objetivo sale ~1.620 kcal; con los datos reales de Fuerza (~4 sesiones/semana, 78 kg) da ~1.940 kcal.

## 7. Pendientes para fases posteriores (ya acordados)
- Perfil único en servidor compartido por Fuerza y Comidas (migrar `AppSettingsContext` de localStorage); medidas corporales (cintura, cuello, bíceps, pierna…) también visibles en Fuerza.
- Modo fiesta (registrar lo que tomó; afecta objetivo diario y semanal; consejos antes/después).
- Modo consulta "¿qué pido?" (comparar opciones de menú según calorías/macros restantes y fase).
- Confirmación obligatoria antes de guardar cada comida.
- Números provisionales de Juan mientras tanto: ~2.200 kcal, ~170 g proteína (supuesto 78 kg; recalcular con su peso real).

## 8. Preguntas de la Fase 3 — RESPONDIDAS el 2026-10-25 (ver `03-arquitectura.md` §1)
1. Dónde vive la base de alimentos en producción (7,2 MB; 0,9 MB comprimida) sin subir datos TCAC al repo público. Propuesta: archivo privado en Firebase Storage, cargado y guardado en memoria por el servidor.
2. Cómo se registra una comida: pestaña nueva "Comidas" con caja de texto + tarjetas editables, o también desde el chat IA existente.
3. ¿Laura también usa Comidas?
4. Latencia de 3–9 s por comida: ¿aceptable, o probar `reasoning_effort: minimal` (más rápido, hay que volver a medir)?
