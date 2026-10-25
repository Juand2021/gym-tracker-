# Bases de datos y APIs gratuitas/abiertas de composición de alimentos para una app colombiana

Fecha de la investigación: 2026-10-24. Las cifras sin fuente verificada en esta sesión están marcadas **[NO VERIFICADO]**.

## Tabla comparativa (resumen)

| Fuente | Alimentos | Colombianos / latinos / español | Nutrientes clave | Crudo vs cocido | Porciones caseras | Licencia | Acceso | Límites |
|---|---|---|---|---|---|---|---|---|
| **TCAC ICBF 2015** (Colombia) | 967 | Sí: nativa, nombres en español, preparaciones colombianas | Energía (kcal/kJ), humedad (agua), proteína, lípidos, carbohidratos totales, fibra dietaria, cenizas, minerales, vitaminas; alcohol solo en el nombre de las bebidas | Sí (cocido, frito, asado, horneado, crudo) | No hay una sección de medidas caseras (búsqueda en el texto sin resultados); todo por 100 g de parte comestible | "Prohibida su reproducción total o parcial sin autorización del ICBF" | Solo PDF (con texto, se puede extraer) | n/a |
| **TCAC ICBF 2018** | 773 | Sí; agrega preparaciones típicas, ácidos grasos y aminoácidos | Igual que 2015 (sin verificar) | Sí | No consta | Sin licencia publicada; pie de página genérico "Todos los derechos reservados" | Solo PDF; la extracción de texto no devolvió nada (parece imagen, habría que hacer OCR) | n/a |
| **ICBF 18 preparaciones tradicionales** | 18 platos | Ajiaco, bandeja paisa, sancocho, tamal, lechona, etc. | Análisis de laboratorio por 100 g | Plato preparado | Recetas estandarizadas con número de porciones | "Prohibida su reproducción…" | PDF (texto extraíble) | n/a |
| **USDA FoodData Central** | Decenas de miles (Foundation, SR Legacy, FNDDS, Branded) | Pocos platos latinos; solo en inglés | Completos, incluyen agua y alcohol | Sí | Sí (portions/householdServing) | CC0 1.0 (dominio público), piden citar la fuente | API REST + descarga masiva CSV/JSON | 1.000 solicitudes/hora/IP |
| **Open Food Facts** | 9.848 productos en Colombia | Productos empacados colombianos (Milo, arequipe de marca, etc.), nombres en español | Etiqueta nutricional (kcal, proteína, carbohidratos, grasa, fibra a veces) | n/a (productos) | Tamaño de porción de la etiqueta | ODbL (base de datos) + DbCL (contenido); share-alike en la base derivada | API + volcados masivos | Uso razonable **[límites NO VERIFICADOS]** |
| **OpenNutrition** (opennutrition.app) | **[conteo NO VERIFICADO, ~300k según el encargo]** | Genéricos, de marca y de restaurante; mezcla USDA, CNF, FRIDA, AUSNUT y OFF | **[NO VERIFICADO]** | ? | ? | ODbL v1.0 + DbCL modificada; exige atribución en *toda* interfaz donde se muestren datos, en la tienda de apps y en el sitio web; share-alike | Descarga TSV en ZIP (v2025.1) | n/a (datos locales) |
| **FatSecret Basic** | Base global grande | **Basic: solo el conjunto de datos de EE. UU., solo en inglés.** CO/es solo en Premier (pago) | kcal, macros, fibra… | Sí | Sí (servings) | Comercial; atribución obligatoria | API REST | 5.000 llamadas/día; caché máx. 24 h salvo datos marcados "storable indefinitely" |
| **FatSecret Premier Free** | igual | Solo EE. UU./inglés; los datos de otros países se ofrecen "con descuento" (de pago) | igual | igual | igual | Atribución obligatoria; requiere elegibilidad | API | Ilimitado |
| **Edamam Food DB** | Grande | Algo de español **[NO VERIFICADO]** | Macros | Sí | Sí | Propietaria | API | **Sin plan gratuito**: Basic es de pago (~US$14/mes según un tercero), 50 llamadas/min, 100k/mes; en Basic solo se puede guardar en caché foodId y la etiqueta |
| **Nutritionix** | Grande (EE. UU.) | Mínimo | Macros | Sí | Sí | Propietaria | API | Plan gratuito dudoso **[NO VERIFICADO]**; un tercero cita US$449/mes para el plan de pago |
| **Spoonacular** | Recetas e ingredientes | Mínimo | Macros | — | — | Propietaria | API | Gratis 150 o 50 puntos/día (fuentes contradictorias); caché **[NO VERIFICADO]** |
| **TACO (Brasil, UNICAMP) 4ª ed. 2011** | ~500–597 (597 **[NO VERIFICADO]**) | Alimentos brasileños (mandioca, plátano, fríjoles, carnes por corte), en portugués | Centesimal, minerales, vitaminas, aminoácidos | Sí | No | Se permite reproducción parcial o total citando la fuente | PDF + planillas no oficiales | n/a |
| **TBCA (Brasil, USP/FoRC)** | 6.182 | Brasil, en portugués | Completos | Sí | Sí (medidas caseras **[NO VERIFICADO]**) | Consulta gratuita; **se requiere licencia de pago para usar la base en otra herramienta** | Web/app | — |
| **México: TCA extendida 2019 (INCMNSZ, en SiAgro/CONABIO)** | 3.928 | Alimentos de México, en español | **[NO VERIFICADO]** | ? | ? | **[NO VERIFICADO]** | Descargas en siagro.conabio.gob.mx/nutricion | — |
| **México SMAE** | — | Sistema de equivalentes (porciones) | Macros por equivalente | — | Sí (equivalentes) | — | No encontré una base descargable | — |
| **Perú: Tablas Peruanas CENAN 2017** | 928 (energía + 19 nutrientes, 14 grupos) | Andinos/latinos (yuca, plátano, papa, menestras), en español | Incluye agua y fibra **[NO VERIFICADO]** | Sí | No consta | **[NO VERIFICADO]** | PDF (y edición 2023 en PDF) | — |
| **INCAP Centroamérica 2007/2012** | **[NO VERIFICADO]** | Centroamericanos, en español | Macros + algunos micronutrientes | Sí | — | — | PDF | — |
| **CIQUAL (Francia, ANSES)** | 3.484 (data.gouv) vs 3.185 (ANSES) en la versión 2020 | Francés; nombres en francés/inglés | Muy completo (agua, alcohol, fibra) | Sí | No | **Licence Ouverte / Open Licence (Etalab)**: uso comercial permitido con atribución | XLS/XML; la versión nueva está en recherche.data.gouv | — |
| **AUSNUT 2011-13 (Australia)** | 5.740 foods, 53 nutrientes | Australianos, en inglés | Completo | Sí | Sí (medidas en un archivo aparte **[NO VERIFICADO]**) | CC BY 3.0 AU (según FSANZ) / CC BY 2.5 AU (según data.gov.au) | Descarga Excel | — |
| **CoFID 2021 (Reino Unido)** | "Miles" (sin cifra exacta verificada) | Británicos, en inglés | Completo | Sí | No | Probablemente Open Government Licence **[NO VERIFICADO]** | Excel en gov.uk | — |

---

## 1. ¿Está la TCAC colombiana (ICBF 2015/2018) en formato legible por máquina?

### Takeaway
No. No hay CSV ni Excel oficial, no está en datos.gov.co (sin resultados) y no encontré ningún repositorio en GitHub que la haya extraído. ICBF solo publica PDF y prohíbe expresamente su reproducción sin autorización. El PDF de 2015 sí tiene texto y sus tablas se pueden parsear técnicamente. El de 2018 parece escaneado (pdftotext no devolvió texto).

### Cited Findings
- ICBF publica tres PDF: TCAC 2018 (773 alimentos, con autóctonos, preparaciones típicas, ácidos grasos y aminoácidos), TCAC 2015 (967 alimentos, 301 nuevos y 81 autóctonos) y "Caracterización de 18 Preparaciones Tradicionales". No hay Excel, búsqueda en línea ni API. La única nota legal es el pie de página "© Copyright 2021 - Todos los derechos reservados - Gobierno de Colombia" — [ICBF tabla-alimentos](https://www.icbf.gov.co/bienestar/nutricion/tabla-alimentos)
- La página TCAC de ICBF (actualizada el 19/05/2025) solo remite a la "versión descargable" y no indica licencia — [ICBF TCAC](https://www.icbf.gov.co/tabla-de-composicion-de-alimentos-colombianos-tcac)
- El PDF de la TCAC 2015 (biblioteca de Minsalud) dice: "Prohibida su reproducción total o parcial sin autorización del ICBF". Lo verifiqué extrayendo el texto del PDF — [Minsalud PDF TCAC 2015](https://www.minsalud.gov.co/sites/rid/Lists/BibliotecaDigital/RIDE/INEC/IETS/tabla-de-composicion-alimentos-colombianos-2015.pdf)
- FAO/INFOODS lista la TCAC 2018 como obra de ICBF y Universidad Nacional de Colombia — [FAO INFOODS](https://www.fao.org/food-composition/tables-and-databases/detail/(colombia--2018)-tabla-de-composici%C3%B3n-de-alimentos-colombianos/en)
- La búsqueda en GitHub ("TCAC ICBF") dio 0 repositorios. "alimentos colombianos" solo devolvió guz2001/Lista_intercambios (listas de intercambio para nutricionistas, sin licencia) — [GitHub API search](https://api.github.com/search/repositories?q=TCAC+ICBF), [guz2001/Lista_intercambios](https://github.com/guz2001/Lista_intercambios)
- Columnas de la TCAC 2015 (según el texto extraído): Código, Número, Grupo, Nombre, N, Energía (kcal y kJ), Humedad, Proteína, Lípidos, Carbohidratos (totales y disponibles), Cenizas, Fibra, más minerales y vitaminas. Todo por 100 g de parte comestible. Tiene 16 grupos (A. Cereales … S. Alimentos preparados, T. Leguminosas) — [Minsalud PDF TCAC 2015](https://www.minsalud.gov.co/sites/rid/Lists/BibliotecaDigital/RIDE/INEC/IETS/tabla-de-composicion-alimentos-colombianos-2015.pdf)
- Las "18 preparaciones" también llevan "Prohibida su reproducción total o parcial sin autorización del ICBF" — [ICBF 18 preparaciones PDF](https://www.icbf.gov.co/sites/default/files/caracterizacion-composicion-18-preparaciones-tradicionales-icbf1_0.pdf)

### Inferences
- Legalmente, lo más seguro es pedir autorización escrita a ICBF (o a la Universidad Nacional como coautora) antes de cargar los valores de la TCAC en Firestore y mostrarlos. Los datos fácticos de composición pueden no ser protegibles por derecho de autor como tales (depende de la jurisdicción), pero la tabla como compilación sí lo es, y la nota de ICBF es explícita. **No es asesoría legal.**
- En lo técnico, la TCAC 2015 se puede parsear con `pdftotext -layout` más un script. La 2018 necesitaría OCR.

### Gaps
- No pude abrir datos.gov.co directamente. La búsqueda web no mostró ningún conjunto de datos de ICBF sobre composición de alimentos.
- No encontré suplementos académicos en CSV/Excel con la TCAC ni una tabla aparte de la Universidad Nacional.
- La página de Uniandes "bases de datos de alimentos" respondió 404.

## 2. FatSecret Platform API: nivel gratuito en 2026

### Takeaway
FatSecret Basic es gratuito y da 5.000 llamadas/día, pero solo trae el conjunto de datos de EE. UU. en inglés. Los datos localizados de Colombia/español (región CO, idioma es) solo están en Premier, que es de pago. NLP y reconocimiento de imágenes son complementos de pago. La atribución es obligatoria. Solo se puede guardar en caché por 24 h, salvo lo marcado "storable indefinitely".

### Cited Findings
- Basic: "Free (self sign up)", 5.000 llamadas/día, solo datos de EE. UU., solo inglés, soporte de la comunidad, atribución requerida — [FatSecret Editions](https://platform.fatsecret.com/api-editions)
- Premier Free: gratis con verificación (start-ups con menos de US$1M de ingresos y menos de US$1M de financiación, ONG, estudiantes), llamadas ilimitadas, solo EE. UU./inglés; los datos de otros países se ofrecen "at a discount", es decir, de pago — [FatSecret Editions](https://platform.fatsecret.com/api-editions)
- Premier: precio a convenir, más de 62 países y 26 idiomas, sin atribución obligatoria — [FatSecret Editions](https://platform.fatsecret.com/api-editions)
- Reconocimiento de imágenes y NLP son "Optional Add-On", se cobran por uso mensual en tramos de 25.000 entradas (50 % de descuento para start-ups y ONG). La tabla extraída no deja claro si Basic puede contratarlos — [FatSecret Editions](https://platform.fatsecret.com/api-editions)
- Términos, sección 1.5: el contenido que no esté marcado como almacenable indefinidamente debe borrarse o volver a pedirse "within 24 hours after the time at which you obtained the Content". Sección 1.3: hay que atribuir "in every place that Content is provided or displayed". Sección 1.4: límite de 5.000 llamadas/día. Sección 1.7(iii): prohíbe usar la API para dar consejo de dieta, nutrición o salud, o para diagnosticar — [FatSecret Terms](https://platform.fatsecret.com/terms)
- Un empleado de FatSecret confirma las 5.000/día y dice que las anomalías de uso se detectan automáticamente. No hay un límite por minuto publicado — [Google Group FatSecret](https://groups.google.com/g/fatsecret-platform-api/c/5CpKLtXFwdM)

### Inferences
- Para una app colombiana, el plan gratuito de FatSecret no aporta comidas colombianas en español. Además, la regla de 24 h no permite usarlo como fuente permanente de caché en Firestore (solo los IDs u objetos marcados storable). La cláusula 1.7(iii) podría chocar con funciones de "recomendación de dieta"; conviene revisarla.

### Gaps
- No leí la guía "storable-data" ni la Attribution Policy de FatSecret, así que no sé exactamente qué campos son almacenables (probablemente food_id).

## 3. Edamam, Nutritionix, Spoonacular, USDA FDC

### Takeaway
USDA FDC es la única de estas que es de verdad gratuita y permite guardar todo en caché (CC0). Edamam no tiene plan gratuito para la Food DB y su caché es muy restringida. Nutritionix y Spoonacular tienen planes gratuitos mínimos o poco claros y ninguno sirve para cubrir alimentos colombianos.

### Cited Findings
- USDA FDC: 1.000 solicitudes por hora por IP; si se superan, la clave queda bloqueada 1 hora. Los datos son de dominio público bajo CC0 1.0 y piden citar FDC — [FDC API Guide](https://fdc.nal.usda.gov/api-guide)
- Edamam Food DB: Basic con 50 llamadas/min y 100.000/mes; Core con 100/min y 750k/mes; Plus con 300/min. Solo se pueden guardar en caché los 4 macronutrientes básicos más foodId, etiqueta e imagen (en Basic, solo foodId y etiqueta), y no para construir una copia de los datos ni un buscador. Solo admite solicitudes hechas por usuarios humanos — [Edamam Food DB](https://developer.edamam.com/food-database-api), [Edamam Nutrition API](https://developer.edamam.com/edamam-nutrition-api)
- El precio de Edamam Basic (US$14/mes con prueba de 30 días) viene de un espejo de terceros — [mcpservers.org](https://mcpservers.org/de/servers/developer-edamam-com-mcp-edamam-food)
- Nutritionix: hay fuentes de terceros contradictorias; una habla de un nivel gratuito de 500 llamadas/día y otra de un nivel gratuito limitado a 5 nutrientes, con el plan de pago en US$449/mes — [Spike API blog](https://spikeapi.com/blog/top-nutrition-apis-for-developers-2026), [dev.to](https://dev.to/raviteja_nekkalapu_/most-nutrition-apis-hide-80-of-the-data-behind-paywalls-mine-doesnt-49pl)
- Spoonacular gratuito: 150 puntos/día según una guía de MoEngage, frente a 50 puntos/día según FreeAPIHub y el registro de un desarrollador — [MoEngage](https://partners.moengage.com/hc/en-us/articles/49824568168468-Spoonacular), [FreeAPIHub](https://freeapihub.com/apis/spoonacular-api)

### Inferences
- Solo USDA FDC puede alimentar una caché permanente en Firestore sin conflicto de licencia. Sirve como respaldo para ingredientes genéricos (avena, huevo, aceite, whey, etc.), con traducción propia al español.

### Gaps
- No verifiqué en fuentes oficiales el estado actual de los planes gratuitos de Nutritionix ni de Spoonacular, ni sus reglas de caché.
- No verifiqué el número exacto de alimentos de FDC por tipo de datos (de memoria: SR Legacy ~7.800 y Foundation unos cientos) **[NO VERIFICADO]**.

## 4. Conjuntos de datos abiertos (Brasil, México, Perú, Centroamérica, Francia, Reino Unido, Australia, OpenNutrition, OFF)

### Takeaway
Las licencias abiertas más limpias para uso comercial son CIQUAL (Licence Ouverte), AUSNUT (CC BY), USDA (CC0), TACO (reproducción libre citando la fuente) y OFF/OpenNutrition (ODbL, share-alike). Las tablas latinas que más ayudan para alimentos andinos y tropicales son TACO y la peruana; la peruana no tiene licencia clara. TBCA exige licencia de pago para reutilizarla.

### Cited Findings
- TBCA: 6.182 alimentos; consulta gratuita, pero "a paid license is needed to use its database in another work tool" — [Agência FAPESP](https://agencia.fapesp.br/59305), [Jornal da USP](https://jornal.usp.br/?p=268561)
- TACO 4ª edición (NEPA-UNICAMP, 2011); la front matter de NEPA permite la reproducción parcial o total citando la fuente; la cobertura de 2006 hablaba de unos 500 alimentos — [USP edisciplinas PDF](https://edisciplinas.usp.br/mod/resource/view.php?id=2301180), [Revista Pesquisa FAPESP](https://revistapesquisa.fapesp.br/en/dining-table-a-la-brasileira/)
- Tabla peruana CENAN-MINSA 2017 (10ª ed.): energía y 19 nutrientes de 928 alimentos en 14 grupos, en PDF; existe una edición 2023 de 187 páginas — [INS PDF](https://lamejorreceta.ins.gob.pe/sites/default/files/2020-12/tablas-peruanas-QR_0.pdf), [repositorio INS](https://repositorio.ins.gob.pe/bitstreams/0645148c-0a16-4992-aaed-8d3887e8f0ae/download)
- México: "Tabla de composición de alimentos extendida 2019" (INCMNSZ) con 3.928 registros en 17 grupos; su diccionario de datos y los detalles técnicos están en SiAgro/CONABIO — [Diccionario de datos SiAgro](https://siagro.conabio.gob.mx/nutricion/download/Diccionario_datos.pdf), [Detalles técnicos](https://siagro.conabio.gob.mx/nutricion/download/Detalles_tecnicos.pdf)
- El SMAE fue adaptado en 1988 por nutricionistas del Instituto Nacional de Nutrición (no del INSP); no encontré una base descargable — [tesis UAM](https://repositorio.xoc.uam.mx/jspui/retrieve/1c20a869-8df1-4694-ab79-4b2a9c74be66/251120.pdf)
- INCAP: la Tabla de Composición de Alimentos de Centroamérica (2ª ed. 2007, reimpresión 2012) circula en PDF; LATINFOODS tiene su sede en el INCAP — [PDF en UNAM](https://portalacademico.cch.unam.mx/materiales/prof/matdidac/sitpro/exp/quim/quim2/quimIIvallejo/TCA.pdf), [ALAN](https://www.alanrevista.org/download/article/3806)
- CIQUAL 2020 en data.gouv.fr: "Licence Ouverte / Open Licence", "3 484 aliments référencés"; la versión nueva en recherche.data.gouv "annule et remplace" a la de 2020. ANSES y Zenodo, en cambio, dicen 3.185 alimentos — [data.gouv.fr CIQUAL](https://www.data.gouv.fr/datasets/table-de-composition-nutritionnelle-des-aliments-ciqual-2020/informations), [recherche.data.gouv](https://entrepot.recherche.data.gouv.fr/dataset.xhtml?persistentId=doi:10.57745/RDMHWY), [Zenodo](https://zenodo.org/records/4770600)
- AUSNUT 2011-13: 5.740 alimentos y 53 nutrientes por 100 g; CC BY 3.0 AU según FSANZ, frente a CC BY 2.5 AU según data.gov.au — [FSANZ disclaimer](https://www.foodstandards.gov.au/science-data/monitoringnutrients/ausnut/disclaimer), [data.gov.au](https://data.gov.au/data/dataset/ausnut-2011-13)
- CoFID 2021 (Public Health England) está en gov.uk; no encontré la licencia ni el número de alimentos — [gov.uk CoFID](https://www.gov.uk/government/publications/composition-of-foods-integrated-dataset-cofid)
- OpenNutrition: base bajo ODbL v1.0 y DbCL modificada, distribuida como TSV en ZIP (v2025.1). Exige atribuir "OpenNutrition" con enlace en toda interfaz que muestre datos, en las fichas de tienda de apps, en el sitio web y en la sección legal. Parte de los datos viene de OFF ("(c) Open Food Facts contributors"). Las bases derivadas deben compartirse con la misma licencia — [OpenNutrition download](https://www.opennutrition.app/download), [opennutrition.app](https://www.opennutrition.app/)
- Fuentes de OpenNutrition según un README de terceros: USDA, CNF, FRIDA, AUSNUT — [glama MCP opennutrition](https://glama.ai/mcp/servers/deadletterq/mcp-opennutrition)
- Open Food Facts Colombia: "Productos 9.848" (co.openfoodfacts.org, consultado el 2026-10-24); licencia ODbL + DbCL — [OFF Colombia](https://co.openfoodfacts.org/), [blog OFF](https://blog.openfoodfacts.org/en/news/50k-food-products-in-open-data-and-a-worldwide-scan-party)
- Ojo: varias búsquedas mostraban "Colombia 46/59", pero esas cifras son de Open *Products* Facts (productos no alimentarios), no de OFF — [openproductsfacts](https://world.openproductsfacts.org/state/to-be-completed/countries)

### Inferences
- La ODbL (OFF/OpenNutrition) permite uso comercial. El share-alike aplica a la *base de datos derivada* que se distribuya públicamente, no al código de la app. Mezclar en Firestore filas ODbL con datos propios puede volver "derivada" esa colección; conviene mantener las colecciones separadas por licencia.

### Gaps
- No verifiqué el número de alimentos de OpenNutrition (~300k en el encargo).
- No verifiqué las licencias de la tabla peruana, de la tabla mexicana 2019 ni de INCAP.
- No investigué ARGENFOODS, Chile ni el INN de Venezuela (por límite de tiempo).

## 5. ¿Qué fuentes contienen los alimentos básicos colombianos?

### Takeaway
La TCAC 2015 cubre la mayoría de los ingredientes básicos colombianos con método de cocción. Las preparaciones compuestas (ajiaco, bandeja paisa, sancocho de gallina, tamal, lechona) están en el PDF de las 18 preparaciones. Faltan patacón (con ese nombre), buñuelo, morcilla y Milo; para Milo y otros productos de marca, OFF es la fuente natural.

### Cited Findings (búsqueda en el texto extraído de la TCAC 2015, [PDF Minsalud](https://www.minsalud.gov.co/sites/rid/Lists/BibliotecaDigital/RIDE/INEC/IETS/tabla-de-composicion-alimentos-colombianos-2015.pdf))
- **Presentes:**
  - Arepas: "Arepa de maíz amarillo, asado", "Arepa de maíz blanco, con sal" y otras variantes.
  - Arroz: "Arroz blanco, cocido" y "Arroz blanco, crudo".
  - Plátano: "Platano hartón, maduro, frito / cocido" y "verde, frito / cocido". El verde frito equivale aproximadamente al patacón.
  - Yuca: "Yuca, cocida" y "Yuca, dorada".
  - Papa criolla: "Papa criolla, con cáscara, cocida / cruda".
  - Lentejas: "Lenteja, cocida".
  - Fríjoles: "Fríjol rojo", "Fríjol cargamanto, cocido" y otras variedades.
  - Carnes: "Carne de res, lomo, cocida"; "Carne de cerdo, lomo, cocida / horneada"; "Carne de pollo, pechuga, asada"; "Carne de pollo, alas, frita".
  - Embutidos y fritos: "Chicharrón de cerdo", "Chorizo, ahumado", "Chorizo de pollo".
  - Preparados: "Empanada de guiso", "Empanada de pipián", "Pandebono", "Sancocho" (grupo S).
  - Lácteos y dulces: "Kumis entero con dulce", "Arequipe, con adición de sucralosa…", "Roscón, con arequipe".
  - Bebidas: "Cerveza, 4% de alcohol", "Chicha", "Guarapo".
- **Mencionados solo en anexos o bibliografía, no como fila principal (confirmar):** almojábana y aguardiente aparecen en un anexo de calidad/datos ("Aguardiente … 38,9"); morcilla solo en una tabla anexa.
- **Ausentes en la TCAC 2015:** patacón con ese nombre, buñuelo, Milo, ajiaco y bandeja paisa.
- **Las 18 preparaciones tradicionales (ICBF)** incluyen Ajiaco Santafereño, Bandeja Paisa, Sancocho Valluno de Gallina, Sancocho de Bagre, Tamal Tolimense, Lechona Tolimense, Mute Santandereano, Arroz Atollado, Mote de Queso, Rondón, Mazamorra Chiquita, Cuy Asado, Viudo de Bocachico, Friche de Chivo, Pisillo de Chigüiro, Arroz Clavado, Sudao de Piangüa y Chicharrón de Pirarucú — [ICBF 18 preparaciones](https://www.icbf.gov.co/sites/default/files/caracterizacion-composicion-18-preparaciones-tradicionales-icbf1_0.pdf)
- **Milo, arequipe y kumis de marca, pandebono empacado:** son candidatos naturales para OFF Colombia (9.848 productos) — [OFF Colombia](https://co.openfoodfacts.org/)

### Inferences
- Las tablas USDA, CIQUAL y AUSNUT no tendrán arepa, pandebono, papa criolla ni platos colombianos con nombre propio; sirven para ingredientes genéricos. TACO y la peruana cubren yuca, plátano, fríjoles, carnes y algunos fritos con nombres en portugués/español. Patacón y buñuelo pueden calcularse como receta a partir de ingredientes.

### Gaps
- No revisé fila por fila la TCAC 2018 (es un PDF escaneado) para ver si agrega buñuelo, almojábana o morcilla.
- No verifiqué si OFF tiene Milo Colombia con datos nutricionales completos.

## 6. Combinación recomendada (gratis, maximizando la cobertura)

### Takeaway
1. Usar la TCAC 2015 (más las 18 preparaciones) como núcleo colombiano, *previa autorización de ICBF*.
2. Completar los ingredientes genéricos con USDA FDC (CC0, se puede guardar todo en Firestore).
3. Usar Open Food Facts (ODbL) para productos empacados colombianos por código de barras o búsqueda.
4. Opcionalmente, CIQUAL o AUSNUT como respaldo abierto, y TACO para alimentos tropicales.
5. Evitar FatSecret, Edamam, Nutritionix y Spoonacular en el plan gratuito: no ofrecen datos colombianos y restringen la caché.

### Cited Findings
- USDA CC0, 1.000 solicitudes/h — [FDC API Guide](https://fdc.nal.usda.gov/api-guide)
- OFF Colombia, 9.848 productos, ODbL — [OFF Colombia](https://co.openfoodfacts.org/)
- CIQUAL bajo Licence Ouverte — [data.gouv.fr](https://www.data.gouv.fr/datasets/table-de-composition-nutritionnelle-des-aliments-ciqual-2020/informations)
- TACO, reproducción permitida citando la fuente — [USP PDF](https://edisciplinas.usp.br/mod/resource/view.php?id=2301180)
- FatSecret Basic: solo EE. UU./inglés y caché de 24 h — [Editions](https://platform.fatsecret.com/api-editions), [Terms](https://platform.fatsecret.com/terms)
- Edamam: caché solo de foodId y etiqueta en Basic, sin plan gratuito — [Edamam](https://developer.edamam.com/food-database-api)

### Inferences
- Arquitectura sugerida: colecciones de Firestore separadas por fuente y licencia (`foods_tcac`, `foods_usda`, `products_off`) con campos `source`, `license` y `attribution`; una capa de búsqueda que una alias en español; y una pantalla de "Fuentes" con las atribuciones exigidas (OFF/OpenNutrition piden atribución en cada interfaz que muestre esos datos).
- Las porciones caseras (taza, cucharada, unidad de arepa) no vienen en la TCAC. Habría que definirlas a mano o tomarlas de USDA (`foodPortions`) y adaptarlas.
- OpenNutrition puede ampliar mucho la cobertura, pero su atribución obligatoria en *toda* interfaz y el share-alike la hacen más costosa que OFF o USDA.

### Gaps
- No sé si ICBF concede autorizaciones de uso a apps privadas ni cómo hacerlo; habría que consultarlo (por ejemplo, PQRS de ICBF).
