# Apps líderes, proyectos open source y técnicas para registro de alimentos por texto con LLM (enfoque: español / comida colombiana, Azure OpenAI gpt-5-mini, datos gratuitos)

> Notas de investigación (oct-2026). Se separa explícitamente lo que es **marketing de la empresa** de la **evidencia independiente / académica**. Todo lo que no tiene fuente está en "Gaps" o marcado como inferencia.

## 1. Fitia (app latinoamericana): base de datos, IA/voz, precisión

### Takeaway
Fitia afirma tener una base "100 % verificada por nutricionistas internos" contrastada con USDA y sin entradas de usuarios, y ofrece registro por foto/voz/texto en lenguaje natural; pero no publica fuentes concretas, método para platos locales, ni ninguna cifra de precisión. Todo es autodeclarado.

### Cited Findings
- (Marketing) Cada alimento es revisado y validado por el equipo de nutricionistas profesionales de Fitia; se excluyen las entradas enviadas por usuarios; sistemas automáticos "re-chequean" calorías, macros y porciones periódicamente — [Fitia Help: How reliable is Fitia's food database?](https://fitia.app/help/articles/how-reliable-is-fitia-food-database)
- (Marketing) La página de ayuda NO nombra fuentes de datos, no explica cómo se manejan platos regionales (solo menciona "bases de datos por país" y un artículo para cambiar el país), ni cómo se verifican los alimentos creados con IA ("Create foods with AI") — [Fitia Help](https://fitia.app/help/articles/how-reliable-is-fitia-food-database)
- (Marketing) Base "verificada por un equipo interno de nutricionistas" y contrastada con instituciones como USDA; registro por foto, voz o texto en lenguaje natural, código de barras, herramienta IA para crear alimentos caseros/inusuales, coach IA 24/7 — [Fitia blog (oct-2025)](https://fitia.app/learn/article/best-nutrition-apps-verified-databases-ai-tools)
- (Marketing) Ninguna cifra de precisión: solo popularidad (10 M+ usuarios, 4,9★); cita el margen FDA de ±20 % en etiquetas como dato general — [Fitia blog](https://fitia.app/learn/article/best-nutrition-apps-verified-databases-ai-tools)
- Tamaño de la base inconsistente entre terceros: ">1 millón de alimentos y 50.000 recetas" vs ">400.000 productos" — [ToolMage](https://www.toolmage.com/es/tool/fitia/); [moge.ai](https://moge.ai/es/product/fitia)
- Fitia existe un artículo de ayuda para "reportar datos incorrectos", lo que implica que hay errores pese a la "verificación" — [Fitia Help](https://fitia.app/help/articles/how-reliable-is-fitia-food-database)

### Inferences
- El diferenciador que Fitia vende en LatAm es la **curaduría humana + bases por país** (platos locales), no un modelo de IA especial. Para replicarlo gratis, el equivalente sería curar un catálogo propio de platos colombianos anclado a la TCAC del ICBF (2018: 773 alimentos, incluye preparaciones típicas y 95 nativos — [ICBF](https://www.icbf.gov.co/bienestar/nutricion/tabla-alimentos), [ICBF noticia](https://www.icbf.gov.co/node/78049)).
- El patrón "IA propone → se ancla a un ítem verificado de la base" parece ser el mismo que MacroFactor (ver §2), aunque Fitia no lo documenta.

### Gaps
- No se encontró información pública técnica de Fitia (qué LLM usan, si anclan la salida de voz/texto a su base, cómo manejan porciones vagas, ni estudios de precisión). No hay evaluación independiente de Fitia.

## 2. MacroFactor, Cronometer, MyFitnessPal, Lose It, Cal AI, SnapCalorie: estrategia de base de datos, porciones vagas, UI de confirmación y precisión

### Takeaway
Las apps "serias" (MacroFactor, Cronometer) usan **bases curadas/de laboratorio** y la IA solo **descompone y mapea** a entradas reales, con una pantalla de revisión editable por ítem. Las cifras de precisión publicadas son de marketing; la única evaluación independiente (NIH, 2026, fotos) encontró **subestimación de 250–345 kcal por comida**, sobre todo por grasa.

### Cited Findings
**MacroFactor**
- "AI Describe" (texto o voz) interpreta ingredientes y cantidades; búsqueda sobre una base "totalmente verificada de millones de alimentos" — [MacroFactor Food Logger](https://macrofactorapp.com/?p=4543)
- Arquitectura (según la empresa): varios prompts LLM encadenados descomponen la comida en ingredientes y recetas y luego **consultan la base de MacroFactor por alimentos reales**; "no dependen del LLM para generar todas las entradas", generan una entrada IA solo cuando es necesario y priorizan resultados "de laboratorio" con nutrición completa; ítems de marca se emparejan con la base de productos — [MacroFactor: AI-Powered Food Logging](https://macrofactor.com/ai-food-logging/)
- UI: los resultados aparecen en un "plato" con editor en contexto por alimento (incluidos los ingredientes de recetas); acción "Explode" para partir una receta en componentes; se puede re-ejecutar la IA para agregar faltantes; recomiendan revisar cada resultado antes de registrar — [MacroFactor](https://macrofactor.com/ai-food-logging/)
- Porciones: el ejemplo propio muestra error de porción (arroz estimado en 1 taza, el usuario lo corrige a 2) — [MacroFactor](https://macrofactor.com/ai-food-logging/)
- Estado: la IA estaba en "Open Beta… mientras mejoramos su precisión"; no hay benchmarks ni tasas de error publicadas — [MacroFactor v5.0.0 release notes](https://macrofactor.com/version-5-0-0/); [MacroFactor](https://macrofactor.com/ai-food-logging/)
- Usa datos de Open Food Facts (ODbL) y permite que usuarios envíen datos que son revisados antes de agregarse — [Stronger by Science](https://www.strongerbyscience.com/?p=56079)

**Cronometer**
- Fuentes: NCCDB y USDA SR28 (datos de laboratorio) entre >10 fuentes (tablas de Canadá, Irlanda, Nutritionix, FDC Branded); los envíos de usuarios son revisados uno a uno por staff y se etiquetan "CRDB" — [Cronometer: Accurate databases](https://cronometer.com/features/accurate-databases.html)

**MyFitnessPal**
- Meal Scan (foto) construido con Passio, empareja contra su base ("14 millones de alimentos verificados" según el artículo) y registra varios ítems a la vez; voz y foto son Premium — [BrainStation](https://brainstation.io/magazine/myfitnesspal-introduces-ai-photo-recognition); [NutriScan blog](https://nutriscan.app/blog/posts/myfitnesspal-vs-lose-it-2026-which-app-is-faster-d4cb63c7c2)
- MacroFactor describe la base de MFP como "principalmente no verificada, enviada por usuarios" (afirmación de un competidor) — [MacroFactor](https://macrofactorapp.com/?p=2562)
- MyFitnessPal adquirió Cal AI (cierre reportado dic-2025) — [RaftLabs teardown](https://www.raftlabs.com/blog/cal-ai-product-teardown)

**Lose It (Snap It / Say It)**
- (Marketing) Snap It reutiliza la misma funcionalidad de *food matching* de la app — [Lose It press release, abr-2025](https://www.accessnewswire.com/newsroom/en/publishing-and-media/lose-it-finds-ai-powered-logging-boosts-weight-loss-success-and-greater-nutrit-1015267)
- (Benchmark propio) 87,3 % top-1 y 97,1 % top-5 en identificación — [Digital Trends](https://uat4.www.digitaltrends.com/?p=1050176)
- (Tercero, metodología no clara) Food ID 67,3 % y error de porción ±23 %; empeora con platos mixtos/caseros — [Programming Insider](https://programminginsider.com/best-photo-calorie-tracking-apps-2026/)

**SnapCalorie**
- (Marketing) Probado en Nutrition5k (~5.000 platos pesados): error esperado ±80 kcal para un plato de 500 kcal en iPhone Pro (LiDAR), ±130 en iPhone normal, vs ±265 de usuarios estimando a ojo — [App Store](https://apps.apple.com/us/app/-/id1574239307)

**Evidencia independiente**
- Estudio NIH (NUTRITION 2026, preliminar, no revisado por pares): >100 comidas pesadas en cocina metabólica; MyFitnessPal, Lose It!, Cal AI y Appediet **subestimaron 250–345 kcal por comida y ~30 g de grasa**; mejor en carbohidratos que en grasa/proteína; peor en comidas keto (por la grasa) — [HealthDay](https://www.healthday.com/health-news/nutrition/how-accurate-are-photo-based-calorie-apps-4-are-put-to-the-test); [MedicineNet](https://www.medicinenet.com/how_accurate_are_photo_based_calorie_apps/news.htm)

### Inferences
- Patrón común de las mejores: **LLM = parser/descomponedor; números = base curada; humano = confirma en una UI editable por ítem**. Ninguna app seria deja que el LLM invente los macros de alimentos comunes.
- El error sistemático dominante en apps reales es la **grasa oculta (aceite, mantequilla, salsas)** → justifica modelar el aceite de cocción como ítem separado.
- Para texto (no foto), el problema de porción se traslada a medidas caseras ("un plato", "una taza") → requiere tabla de conversión de medidas caseras.

### Gaps
- No hay evaluaciones independientes de logging **por texto/voz** (las del NIH son de fotos). No se encontraron cifras de MacroFactor Describe, Cronometer IA, ni Cal AI por texto. No se verificó la cifra "345 kcal" atribuida solo a Cal AI (conflicto con el rango 250–345 del conjunto).

## 3. Proyectos open source / papers con LLM + base de datos (licencia, stack, partes reutilizables)

### Takeaway
Las piezas más reutilizables y con evidencia son: (a) **Open-KNEAD** (descomposición + FNDDS + retrieval híbrido BM25 + BGE-M3 con RRF + "recipe prior" para aceite + selección gated por ambigüedad), (b) **NDS** (parseo LLM con facetas, retrieval híbrido, rerank listwise LLM y abstención; 84,6 % vs 66,8 % en NutriBench), (c) **mcp-opennutrition** (MIT, TypeScript, 300k alimentos), (d) NutriBench como benchmark. No se encontró "DietAI24" públicamente (solo como baseline reimplementado en Open-KNEAD).

### Cited Findings
**NutriBench (ICLR 2025)**
- 11.857 descripciones de comidas de 11 países (incl. Argentina, México, Perú) generadas desde WWEIA y FAO/WHO GIFT, etiquetas de carbs/proteína/grasa/kcal; dataset en mehak126.github.io/nutribench.html; licencia del paper CC BY-NC-SA 4.0; no se enlaza repo de código — [arXiv 2407.12843v6](https://arxiv.org/html/2407.12843v6); [ICLR](https://proceedings.iclr.cc/paper_files/paper/2025/hash/ef3a57e4f26b640e6f90d78cbb011feb-Abstract-Conference.html)
- Mejor: GPT-4o + CoT = 66,82 % Acc@7.5g, MAE 8,61 g; promedio 12 modelos Base 43,24 % → CoT 47,46 % — [arXiv](https://arxiv.org/html/2407.12843v6)
- RAG sobre FDC (450.182 ítems), parseando la comida en componentes + búsqueda semántica por vecino más cercano: efecto **mixto**; con porciones naturales ("una taza de arroz") CoT solo siempre superó a RAG+CoT; los autores lo atribuyen a que las entradas recuperadas están en 100 g — [arXiv](https://arxiv.org/html/2407.12843v6)
- Porciones naturales dan mayor MAE que porciones métricas ("80 g de arroz"); GPT rinde mejor con métricas — [arXiv](https://arxiv.org/html/2407.12843v6)

**Open-KNEAD (Purdue, jul-2026, CC BY 4.0 el paper)**
- Premisa: el estimado directo de un MLLM moderno ya iguala o supera un pipeline de retrieval ingenuo; el valor del grounding es porciones más precisas + registro auditable ítem por ítem — [arXiv abs 2607.12911](https://arxiv.org/abs/2607.12911)
- Pipeline B: (1) listar ítems con gramos; (2) llamada de texto "recipe-prior" que agrega ingredientes de cocción típicos (aceite, mantequilla), **desactivada para alimentos crudos/sin aderezo**; (3) match a candidatos FNDDS (~5.400 entradas, por 100 g); (4) puntaje de ambigüedad por dispersión nutricional en la categoría: si es ambiguo el modelo elige código, si no se usa la **media ponderada** de candidatos (τ=0,5, máx. 5 elecciones/comida); (5) escalar por masa y sumar — [arXiv html](https://arxiv.org/html/2607.12911v1)
- Retrieval: **BM25 + BGE-M3 denso fusionados con RRF (κ=60), top-10** por ítem; BM25 solo o denso solo fueron peores — [arXiv html](https://arxiv.org/html/2607.12911v1)
- Ablaciones: quitar el gate (nunca elegir código) +27 kcal de error; elegir siempre ≈ sin beneficio y más llamadas; **self-consistency de 5 llamadas en estimación directa NO superó una sola llamada** → la ganancia viene de la descomposición anclada, no de más inferencia; el recipe-prior corrige subestimación en OmniFood (139,1 vs 155,2 kcal MAE) pero sobreestima en Nutrition5k y ACETADA → se activa por cocina — [arXiv html](https://arxiv.org/html/2607.12911v1)
- Superó a su reimplementación de DietAI24; modelos locales Gemma/Qwen; afirma liberar framework + "FNDDS agent-ready" pero sin URL ni licencia de código visibles — [arXiv html](https://arxiv.org/html/2607.12911v1); [arXiv abs](https://arxiv.org/abs/2607.12911)

**NDS – Nutrition Data Infrastructure for the AI Era (arXiv 2608.10363)**
- Parseo con LLM y schema estructurado → alimento base normalizado + **facetas de vocabulario cerrado** (estado cocido, método, forma, conservación, rebozado, tipo de plato, aditivos); embeddings 1.536-d en pgvector HNSW; canal semántico (250 cand., score 0,70·coseno + 0,30·acuerdo de facetas) + canal léxico full-text (25) → RRF k=60 → top-25 → **un rerank listwise LLM** que devuelve ≤5 con veredicto; **abstención explícita** si ningún candidato es defendible — [arXiv html 2608.10363v2](https://arxiv.org/html/2608.10363v2)
- Resultados: F1 0,875 (recall@5 0,942) en resolución de registros; en NutriBench v1: 96,4 % respondidas, **84,6 % dentro de 7,5 g, MAE 4,3 g** vs 66,8 % / 8,6 g del mejor GPT-4o CoT publicado (comparación no pareada); sin ablaciones; sin repo/licencia de código — [arXiv html](https://arxiv.org/html/2608.10363v2)

**Otros proyectos reutilizables**
- mcp-opennutrition (deadletterq): servidor MCP local TypeScript, licencia reportada MIT, >300.000 alimentos (USDA, CNF, FRIDA, AUSNUT) + códigos de barras, Docker — [Glama](https://glama.ai/mcp/servers/tc7m4n437i); [CodaOne](https://www.codaone.ai/mcp/servers/mcp-opennutrition) (licencia del dataset OpenNutrition no confirmada)
- Epicure (arXiv 2604.22776): cascada reglas/strings → embeddings gemini (top-5, coseno ≥0,80) → LLM elige o "no match" — [arXiv](https://arxiv.org/pdf/2604.22776)
- food-llm (github.com/jainsanil18/food-llm): extractor 0,5B + bi-encoder fine-tuned + cross-encoder reranker sobre base derivada de USDA; prototipo — [Hugging Face](https://huggingface.co/sanil08/food-llm)
- NutriTransform (github.com/ruptho/nutritransform): SentenceTransformers sobre USDA, sin rerank LLM — [arXiv 2503.04755](https://arxiv.org/pdf/2503.04755)
- ingredient-parser (Python): mapeo a FDC Foundation Foods con normalización + embeddings, sin LLM — [docs](https://ingredient-parser.readthedocs.io/en/latest/explanation/foundation.html)

### Inferences
- Arquitectura recomendada derivada (para gpt-5-mini): Structured Outputs → lista de ítems {nombre_normalizado_es, facetas, cantidad, unidad_casera, gramos_estimados, confianza} → retrieval híbrido (léxico sobre nombres + sinónimos ES, denso multilingüe) con RRF k=60 → rerank listwise con gpt-5-mini sobre ≤25 candidatos con opción "ninguno" → nutrientes = base × gramos. Esto reproduce NDS/Open-KNEAD, los dos únicos sistemas con números fuertes.
- Para Colombia, la base debe ser TCAC/ICBF + FDC (FNDDS para platos mixtos) + recetas propias; el "density bias" US-céntrico que reporta Open-KNEAD sugiere priorizar la tabla local.

### Gaps
- "DietAI24" no se encontró públicamente (solo citado/reimplementado por Open-KNEAD). Repos de Open-KNEAD y NDS no localizados. No se confirmó la licencia del dataset OpenNutrition.

## 4. Técnicas con evidencia de mejora de precisión

### Takeaway
Con evidencia: **descomposición anclada a base** (Open-KNEAD, NDS), **retrieval híbrido > solo denso o solo léxico** (Open-KNEAD), **rerank LLM con abstención** (NDS), **CoT** (+~4 pts promedio; mejor config. GPT-4o en NutriBench), **convertir a gramos** (porciones métricas < error), **aceite/grasa de cocción explícita pero condicionada** (Open-KNEAD; NIH muestra subestimación de grasa), **few-shot** (CL4Health 2026). Sin evidencia o negativa: **self-consistency** (no ayudó en Open-KNEAD). Sin evidencia encontrada: memoria personal de porciones, preguntas aclaratorias.

### Cited Findings
- CoT: promedio 12 LLMs 43,24 % → 47,46 % Acc@7.5; GPT-4o+CoT el mejor (66,82 %) — [NutriBench](https://arxiv.org/html/2407.12843v6)
- RAG ingenuo (100 g por entrada, porciones naturales) puede empeorar frente a CoT solo — [NutriBench](https://arxiv.org/html/2407.12843v6)
- Porciones métricas → menor error que medidas caseras — [NutriBench](https://arxiv.org/html/2407.12843v6)
- Descomposición + grounding + rerank + abstención: 84,6 % Acc@7.5 vs 66,8 % — [NDS](https://arxiv.org/html/2608.10363v2)
- Híbrido BM25 + denso (RRF) > cada uno solo; selección gated por ambigüedad (media ponderada si poco ambiguo) ahorra llamadas y reduce error (+27 kcal sin gate) — [Open-KNEAD](https://arxiv.org/html/2607.12911v1)
- Recipe prior (aceite/mantequilla añadidos), apagado para crudos: mejora en una cocina, sobreestima en otras → debe ser condicionado — [Open-KNEAD](https://arxiv.org/html/2607.12911v1)
- Self-consistency (5 muestras) no superó 1 llamada directa — [Open-KNEAD](https://arxiv.org/html/2607.12911v1)
- LLMs descomponen bien ingredientes compuestos (GPT-4o, Llama-3 70B) pero **fallan identificando condimentos y aceites** — [arXiv 2411.05892](https://arxiv.org/abs/2411.05892v1); seguimiento revisado por pares: Llama-3 70B > GPT-4o en cantidades precisas — Kopitar et al., Nutrients 2025;17(9):1492 (vía [IU ScholarWorks](https://scholarworks.indianapolis.iu.edu/items/0b29c7d8-728f-4d77-b1fe-04877b2378ab))
- Few-shot (2-shot) LLM (Gemma-3-27B) y híbrido TF-IDF + Gemini 2.5 Flash superan TF-IDF/DeBERTa en estimación de nutrientes de recetas, a costa de latencia; atribuido a conocimiento previo sobre nombres ambiguos y unidades no estándar — [CL4Health @ LREC 2026](https://aclanthology.org/2026.cl4health-1.31/)
- Fine-tuning con prompt 10-shot para recalls de 24 h solo texto (existe como línea de trabajo) — [arXiv 2509.13268](https://arxiv.org/pdf/2509.13268)
- Sesgo real de apps: subestimación de grasa ~30 g/comida — [HealthDay/NIH](https://www.healthday.com/health-news/nutrition/how-accurate-are-photo-based-calorie-apps-4-are-put-to-the-test)

### Inferences
- Para gpt-5-mini (modelo de razonamiento), "CoT antes de números" equivale a pedir en el schema un campo de razonamiento breve/supuestos por ítem antes de `gramos`; no gastar en self-consistency, sí en grounding.
- Aceite: ítem separado por método (frito/sudado/guisado/hervido/crudo), no un % fijo a todo, en línea con el gate de Open-KNEAD.
- Crudo vs cocido: facetas cerradas (estado cocido, método) como en NDS, y elegir la entrada de la base que coincida con la faceta (arroz cocido ≠ crudo, ~3x en kcal/100 g).
- Preguntas aclaratorias: lo razonable es preguntar solo por el ítem con mayor varianza energética × gramos (p. ej. tamaño de porción de arroz o si la carne es frita); es una inferencia de diseño, no probada.

### Gaps
- No se encontró evidencia cuantitativa de: memoria personal de porciones, preguntas aclaratorias, plantillas de receta para platos mixtos en texto, ni de gpt-5-mini en NutriBench. No hay estudio de self-consistency en estimación por **texto** (la evidencia negativa es en imagen).

## 5. Coincidencia de nombres en español / regionalismos y embeddings multilingües

### Takeaway
No hay recursos académicos sobre sinónimos/slang colombiano de comida; habrá que construir un diccionario propio (fríjol/frijol/poroto, corrientazo, principio, seco, sopa del día). Los embeddings de OpenAI son baratos (text-embedding-3-small ≈ US$0,02/M tokens; MIRACL multilingüe 44,0), y Open-KNEAD usó BGE-M3 (multilingüe, abierto) combinado con BM25.

### Cited Findings
- Corrientazo típico: sopa, "principio", carne/proteína, arroz y/o papa, ensalada y jugo; versiones baratas con sopa de lentejas o fríjol; se han reducido porciones de proteína por costos — [El País Cali](https://www.elpais.com.co/colombia/el-corrientazo-sube-de-precio-en-colombia-pan-y-empanadas-tambien-podrian-aumentar-0424.html); [El Tiempo](https://www.eltiempo.com/economia/finanzas-personales/almuerzos-a-3-000-en-medellin-los-mejores-restaurantes-de-corrientazo-que-desafian-la-inflacion-3549089); [Valora Analitik](https://www.valoraanalitik.com/precio-del-corrientazo-llegara-a-20000-en-2026/); [Pulzo](https://www.pulzo.com/economia/corrientazos-colombia-subieron-precio-donde-se-consiguen-8000-PP3383298A)
- TCAC 2018 (ICBF): 773 alimentos, incluye preparaciones típicas, 95 nativos (açaí, borojó), 16 grupos — [ICBF](https://www.icbf.gov.co/node/78049); [ICBF tabla](https://www.icbf.gov.co/bienestar/nutricion/tabla-alimentos)
- text-embedding-3-small ≈ US$0,02/M tokens; -3-large ≈ US$0,13/M; MIRACL promedio 44,0 (vs 31,4 ada-002); sin desglose para español — [Zilliz](https://zilliz.com/ai-models/text-embedding-3-small); [Azure AI catalog](https://ai.azure.com/catalog/models/text-embedding-3-small)
- BGE-M3 denso + BM25 con RRF fue mejor que cada uno solo (en inglés, FNDDS) — [Open-KNEAD](https://arxiv.org/html/2607.12911v1)
- Ejemplo de RAG sobre tabla nacional no inglesa: base eslovena (32.000 ítems) con gemini-embedding-001 en Chroma; filtros generados por LLM funcionan en consultas expresables (F1 ≈1,0) y caen en comparativas (F1 ~0,45) — [arXiv 2603.09704](https://arxiv.org/html/2603.09704v2)

### Inferences
- Costo: embeber ~10.000 nombres de alimentos (~10 tokens c/u = 100k tokens) con text-embedding-3-small cuesta ~US$0,002 → irrelevante; la búsqueda puede hacerse en memoria/cliente.
- El canal léxico (BM25 o búsqueda normalizada sin tildes) es clave para español: maneja "fríjol"/"frijol" tras quitar tildes; los sinónimos regionales ("poroto", "caraota", "habichuela" vs "ejote") requieren tabla de alias, no embeddings.
- Términos compuestos colombianos ("corrientazo", "bandeja paisa", "sopa del día", "seco" = plato fuerte, "principio" = acompañamiento de granos/verduras) deben modelarse como **plantillas de receta** que el LLM expande a ítems con gramos por defecto, editables en la UI.

### Gaps
- Sin fuentes sobre: gramajes estándar de componentes del corrientazo; benchmarks de embeddings en nombres de alimentos en español; rendimiento de multilingual-e5 vs OpenAI en este dominio; costo/latencia de gpt-5-mini en Azure (no buscado). Un diccionario de sinónimos alimentarios hispanos open source no se encontró.
