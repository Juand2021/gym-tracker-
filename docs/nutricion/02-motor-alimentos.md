# Fase 2 — Motor de alimentos y precisión

> Fecha: 2026-10-24 · Estado: **2a cerrada, diseño aprobado → 2b/2c en curso**
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
