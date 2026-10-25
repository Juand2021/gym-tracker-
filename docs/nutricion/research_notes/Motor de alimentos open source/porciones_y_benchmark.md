# Porciones colombianas estándar y metodología de benchmark para un logger LLM sin pesaje

Convenciones: **[F]** = valor tomado de una fuente (citada). **[E]** = estimación mía (derivada de recetas citadas o conocimiento general; hay que validarla). Todos los gramos son de parte comestible salvo que se indique. Fecha de investigación: oct-2026.

---

## 1. Referencias oficiales colombianas de porción (GABA / ICBF / PAE)

### Takeaway
El documento técnico de las GABA (ICBF/FAO, 2.ª ed. oct-2020) trae la lista nacional de intercambios (basada en la lista de la U. de Antioquia) con **peso en gramos + medida casera + kcal promedio por intercambio**: es la mejor fuente oficial para "1 porción de X". Las minutas patrón del PAE (Res. 335/2021) dan gramos netos y servidos por componente de almuerzo (arroz, proteína, tubérculo, ensalada, jugo), útiles como piso para un almuerzo tipo; las porciones de restaurante para adultos son más grandes.

### Cited Findings

**Origen de la lista de intercambio**
- Por consenso de los programas de Nutrición del país se adoptó como base la lista de intercambios de la Universidad de Antioquia (Manjarrés et al.), y las Tablas 26–45 de las GABA listan cada alimento con su peso por intercambio y medida casera — [GABA documento técnico, ICBF/FAO 2020 (PDF alojado en Minambiente)](https://www.minambiente.gov.co/wp-content/uploads/2023/11/guias_alimentarias_basadas_en_alimentos_para_la_poblacion_colombiana_mayor_de_2_anos_0.pdf)
- Medidas caseras de referencia: pocillo = 240 cc; cucharada sopera rasa = 15 ml; cucharadita = 5 ml — [encolombia, guías alimentarias](https://encolombia.com/medicina/guiasmed/mayores/alimentacion-lista/)

**Tabla A. Gramos por 1 intercambio (GABA 2020, Tablas 26–45) [F]**
Nota: extraído con pdftotext del PDF; en algunas tablas el maquetado desalinea columnas. Marco con (⚠) los casos donde la asignación alimento↔gramos es inferida por el orden de las columnas.

| Grupo / subgrupo (kcal por intercambio) | Alimento | g por intercambio | Medida casera |
|---|---|---|---|
| I-Cereales (88 kcal; 2,2 P / 1,5 G / 16,7 CHO) | Arroz blanco cocido | 80 | 6 cdas soperas colmadas |
| | Arroz integral cocido (⚠) | 81 | 8 cdas colmadas o 2/3 pocillo |
| | Avena en hojuelas (⚠) | 24 | 4 cdas colmadas |
| | Arepa delgada maíz blanco trillado | 56 | 1 unidad pequeña |
| | Arepa redonda maíz blanco trillado | 52 | 1 unidad grande (sic) |
| | Almojábana | 31 | 1 unidad grande |
| | Pan de queso | 28 | 1 unidad pequeña |
| | Pan de yuca | 20 | 2 unidades |
| | Pan blanco | 22 | 1 tajada delgada |
| | Pan integral | 32 | 1 tajada mediana |
| | Pasta larga o corta cocida | 64 | 2/3 pocillo chocolatero |
| | Maíz tierno/choclo enlatado | 110 | 8 cdas colmadas |
| | Galletas de soda | 24 | 3 unidades |
| | Ponqué | 30 | 1 trozo pequeño |
| | Arroz sopero (crudo) | 23 | — |
| | Harina de maíz blanco trillado | 25 | 2 cdas rasas |
| I-Raíces (90 kcal; 21,7 CHO) | Arracacha cruda | 96 | 1 trozo pequeño |
| | Ñame cocido | 78 | 1 trozo pequeño |
| | Yuca blanca cruda | 62 | 1 trozo mediano |
| I-Tubérculos (93 kcal; 21,3 CHO) | Papa común cocida | 83 | 1 unidad mediana |
| | Papa criolla cocida | 108 | 3 unidades medianas |
| | Batata cocida | 100 | 1 trozo pequeño |
| I-Plátanos (92 kcal; 23,8 CHO) (⚠) | Plátano verde sin cáscara | 78 | 1/2 unidad mediana |
| | Plátano colí/guineo crudo | 88 | 1 unidad mediana |
| | Plátano hartón maduro cocido | 66 | 1/4 unidad mediana |
| II-Frutas (55 kcal) | (columnas desalineadas; ej. jugo de lulo, 1 vaso mediano = 200 g ⚠) | — | — |
| II-Verduras (24 kcal) | Tomate rojo, zanahoria, etc. (desalineado) | ~40–180 | — |
| III-Leche entera (129 kcal; 7,0 P / 7,2 G / 9,5 CHO) | Leche de vaca entera líquida | 200 | 1 vaso mediano |
| | Leche entera en polvo | 27 | 6 cdas rasas |
| III-Lácteos grasa entera (86 kcal) | Kumis / yogur | 150 | 1 vaso pequeño |
| | Queso campesino | 20 | 1 tajada pequeña delgada |
| | Cuajada | 34 | 1 tajada delgada mediana |
| | Quesito | 30 | 1 tajada delgada |
| | Queso mozzarella | 28 | 1 tajada semigruesa |
| III-Lácteos reducidos (87 kcal) | Leche baja en grasa | 200 | 1 vaso mediano |
| IV-Carnes magras crudas (79 kcal; 9,9 P / 4,1 G) | Carne de res / cerdo / ternera | 60 | 1/8 de libra |
| | Pechuga de pollo sin hueso ni piel | 60 | 1/4 unidad mediana |
| | Muslo/contramuslo sin hueso ni piel | 60 | 1 unidad mediana |
| | Atún en aceite | 40 | 1/3 lata mediana |
| | Morcilla (rellena) | 80 | 1 unidad mediana |
| | Jamón | 84 | 4 tajadas |
| IV-Altos en grasa sat. (113 kcal; 12,4 P / 6,3 G) | Contramuslo con piel sin hueso | 66 | 1 unidad mediana |
| | Alas de pollo | 56 | 1 unidad grande |
| | Hígado de pollo | 72 | 2 unidades |
| | Callo/mondongo | 100 | 1/5 libra |
| IV-Huevos (77 kcal; 6,5 P / 5,3 G) | Huevo de gallina crudo | 50 | 1 unidad pequeña |
| IV-Leguminosas cocidas (82 kcal; 4,9 P / 1,0 G / 13,3 CHO) | Fríjol (cualquier variedad) con plátano o guiso | 60 (50–70) | **1/2 cucharón** |
| | Lenteja con guiso | 70 | 1/2 cucharón |
| | Garbanzo con guiso | 50 | 1/2 cucharón |
| IV-Nueces (55 kcal) | Maní sin sal | 10 | 1 cda colmada |
| V-Grasas (44–45 kcal; 5 g grasa) | Aceite (girasol, soya, maíz, oliva, canola) | 5 | 1 cucharadita |
| | Mayonesa | 6 | 1 cdita dulcera rasa |
| | Aguacate | 30 | 1/8 unidad |
| | Mantequilla (⚠) | 6 | 1 cdita rasa |
| | Crema de leche (⚠) | 14 | 1 cda sopera alta |
| | Tocineta (⚠) | 7 | 1 tira |
| VI-Azúcares (81 kcal; 21,7 CHO) | Azúcar granulada | 23 | 2 cdas colmadas |
| | Miel | 21 | 1 cda |
| | Panela | 29 | 1 trozo pequeño |
| VI-Dulces (86 kcal) | Bocadillo de guayaba (⚠) | 30 | 1 tajada delgada |
— todos: [GABA documento técnico 2020, Tablas 26–46](https://www.minambiente.gov.co/wp-content/uploads/2023/11/guias_alimentarias_basadas_en_alimentos_para_la_poblacion_colombiana_mayor_de_2_anos_0.pdf)

- Composición del fríjol "intercambio": 80% leguminosa hidratada + 10% guiso + 10% plátano verde; guiso = 70% tomate, 15% cebolla cabezona, 10% cebolla larga, 5% aceite — [GABA 2020, Tabla 39](https://www.minambiente.gov.co/wp-content/uploads/2023/11/guias_alimentarias_basadas_en_alimentos_para_la_poblacion_colombiana_mayor_de_2_anos_0.pdf)
- Ejemplo de uso en minuta ICBF: 1 intercambio de lácteos = 200 ml de yogur/kumis; para ese grupo la porción es 300 ml = 1,5 intercambios — [ICBF minuta patrón vida independiente](https://www.icbf.gov.co/sites/default/files/procesos/a35.g6.pp_minuta_patron_preparacion_para_la_vida_independiente_v1.pdf)

**Tabla B. Minuta patrón PAE — almuerzo nivel secundaria (≈14–17 años), Res. 335/2021 [F]**

| Componente | Peso neto (crudo) | Porción servida |
|---|---|---|
| Proteico: carne (4×/sem) | 50–78 g | 50 g (sic) |
| Proteico: leguminosa (2×/sem) | 25 g seco | 75 g |
| Cereal (arroz/pasta) | 56–60 g | 125–135 g |
| Tubérculo / raíz / plátano | 65–110 g | 65–110 g |
| Ensalada o verdura caliente | 70–80 g | 70–80 g |
| Bebida (jugo de fruta) | 60–65 g fruta | 200 cm³ |
| Azúcar | 8–10 g | — |
| Grasa | 70 cm³ por semana (≈14 ml/día) | — |
| **Aporte promedio** | **764 kcal; 28,3 g P; 24,7 g G; 103,4 g CHO** | (≈31% de 2.491 kcal) |
— [Anexo técnico Alimentación Saludable y Sostenible en el PAE (UApA, 2023), Tabla 16](https://www.alimentosparaaprender.gov.co/web/sites/default/files/2023-08/2208_anexo-alimentacion-saludable-final-pp.pdf)

- Una minuta patrón de la U. Distrital (2009, no normativa) usaba arroz 140 g cocido y carne 125 g cruda / 85–100 g cocida como mínimos de almuerzo — (vía snippet de búsqueda) [U. Distrital doc 846](https://www.udistrital.edu.co/contratacion/local/storage/app/DOCUMENTOS/2009/julio/846.doc)
- Según USA Rice (fuente de la industria), Minsalud propuso en 2021 reducir la porción de referencia de arroz de 50 g crudo (Res. 333/2011) a 30 g; no se confirmó si se adoptó — [USA Rice Daily, jun-2021](https://www.usarice.com/news-and-events/publications/usa-rice-daily/article/usa-rice-daily/2021/06/11/colombia-leaves-daily-rice-recommended-serving-unchanged-consumers-still-outpace-it)
- La TCAC (ICBF 2015/2018) es la base de composición usada por las GABA — [ICBF TCAC](https://www.icbf.gov.co/node/78049); [TCAC 2015 PDF Minsalud](https://www.minsalud.gov.co/sites/rid/Lists/BibliotecaDigital/RIDE/INEC/IETS/tabla-de-composicion-alimentos-colombianos-2015.pdf)

### Inferences
- Las porciones GABA son **unidades de intercambio**, no "lo que se sirve". Un plato de arroz de restaurante ≈ 2–2,5 intercambios (160–200 g cocido) [E]; el PAE secundaria sirve 125–135 g.
- "1/2 cucharón = 60 g de fríjol" es un ancla oficial útil: un "principio" de fríjoles de corrientazo suele ser 1–1,5 cucharones ≈ 120–180 g [E].
- "1/8 de libra = 60 g crudo" de carne es un intercambio; una presa/porción de carne de restaurante suele ser 2–3 intercambios (120–180 g crudo, 90–130 g cocido) [E].

### Gaps
- No se pudo leer limpio el bloque de frutas/verduras (columnas desalineadas en el PDF); revisar visualmente págs. 124–126 del PDF de GABA.
- No encontré datos de ENSIN con tamaños de porción por alimento consumido.

---

## 2. Composición y gramos de platos colombianos típicos

### Takeaway
El estudio ICBF "Caracterización y composición nutricional de 18 preparaciones tradicionales" da **kcal/100 g medidos en laboratorio (AOAC)** y la receta estandarizada por porción (ingredientes pesados) para ajiaco, bandeja paisa, sancocho, tamal, lechona, mute, arroz atollado, etc. No publica el peso servido, así que el peso de plato hay que estimarlo. Para panadería/comida rápida no hallé estandarización oficial: los valores de la tabla D son estimaciones.

### Cited Findings

**Tabla C. ICBF 18 preparaciones — kcal por 100 g (laboratorio) y receta por 1 porción [F]**

| Preparación | kcal/100 g | P / G / CHO por 100 g | Ingredientes de 1 porción (crudo) |
|---|---|---|---|
| Ajiaco santafereño | 69 | 6,4 / 0,8 / 9,1 | 450 ml agua, papa sabanera 125 g, pastusa 125 g, criolla 200 g, pollo con hueso 150 g, mazorca 120 g, guascas (acompañamientos —crema, alcaparras, aguacate, arroz— NO incluidos) |
| Bandeja paisa | 198 | 11,7 / 11,0 / 13,0 | fríjol rojo 88 g (seco), plátano verde 106 g, tomate 131 g, aceite 2,6 g; arroz 62 g crudo + aceite 4 g; carne molida 136 g + aceite 9,5 g; tocino (chicharrón) 212 g; maduro 58,5 g + aceite 6,5 g; rellena 84 g; huevo 35 g + aceite 4 g |
| Mazamorra chiquita (sopa) | 105 | 9,8 / 5,0 / 5,1 | agua 700 ml, murillo 120 g, costilla 140 g, papa sabanera 100 g, criolla 65 g, fríjol/arveja/haba verde 25 g c/u, mazorca 20 g, maíz 25 g, aceite 10 g |
| Mute santandereano | 101 | 8,1 / 6,1 / 3,5 | agua 700 ml, callo 100 g, mano de res 100 g, cerdo/res 120 g, maíz mute 68 g, papa 70 g, arracacha 50 g, ahuyama 50 g… |
| Lechona tolimense | 224 | 21,8 / 12,0 / 7,3 | cuero con tocino 37,5 g, pulpa cerdo 75 g, arveja seca 20 g, arroz 30 g |
| Tamal tolimense | 108 | 5,7 / 3,8 / 12,7 | masa: maíz 12,5 g, arroz 6,3 g, arveja seca 25 g, manteca 4,4 g; relleno: tocino 25 g, costilla 25 g, pollo 25 g, papa 25 g, zanahoria 12,5 g, huevo 10 g, aceite 8 g |
| Arroz atollado | 109 | 10,1 / 4,3 / 7,5 | arroz 65 g, ala 60 g, presa 140 g, carne 60 g, papa 130 g, longaniza 50 g, salchicha 40 g, aceite 4 g |
| Sancocho valluno de gallina | 113 | 16,4 / 4,0 / 2,9 | agua 600 ml, gallina 450 g, yuca 130 g, plátano verde 150 g, tomate 35 g, aceite 3 g |
| Mote de queso | 89 | 5,4 / — / — | agua 250 g, ñame 125 g, queso costeño 125 g, aceite 4,2 g |
| Rundown | 126 | 8,2 / — / — | leche de coco 300 ml, plátano 120 g, yuca 120 g, ñame 120 g, pescado 300 g, cola de cerdo 90 g |
| Otras (sin desglose aquí) | Viudo de bocachico 117; cuy asado 178; friche de chivo 238; chicharrón de pirarucú 212; pisillo de chigüiro 211; sancocho de bagre 125; arroz clavado 179; sudao de piangüa 175 | | |
— [ICBF, Caracterización y composición nutricional de 18 preparaciones tradicionales](https://www.icbf.gov.co/system/files/caracterizacion-composicion-18-preparaciones-tradicionales-icbf1_0.pdf)
- Método: cocineros tradicionales; se pesó cada ingrediente, se determinó el número de porciones y se pesó una porción servida; 3 puntos de muestreo por receta; análisis AOAC por 100 g de parte comestible — [ICBF 18 preparaciones](https://www.icbf.gov.co/system/files/caracterizacion-composicion-18-preparaciones-tradicionales-icbf1_0.pdf)

**Corrientazo (descripción, sin gramos oficiales)**
- Prensa: el corrientazo incluye sopa, principio, carne, ensalada, papa (o tajada) y jugo — [El País Cali](https://www.elpais.com.co/colombia/el-corrientazo-sube-de-precio-en-colombia-pan-y-empanadas-tambien-podrian-aumentar-0424.html)
- Fuente comercial (sin método): almuerzo corriente ≈ 800–1.200 kcal, >1.500 con frituras — [comiai.co](https://comiai.co/blog/tabla-alimentos-colombianos-calorias) (baja confiabilidad)
- No hallé ningún estudio colombiano que midiera (pesaje o calorimetría) almuerzos corrientes.

**Panadería y otros**
- Arepa: fabricante dice 100–150 g por arepa estándar (promedio 100–120 g) — [Fábrica de arepas](https://fabricaarepas.com/cuantos-gramos-tiene-una-arepa-colombiana/) (comercial). GABA: arepa delgada pequeña 56 g y redonda 52 g = 1 intercambio (88 kcal).
- Empanada ~70 g como tamaño más común (guía de negocio, no técnica) — [comococinarocomer](https://comococinarocomer.com/cuanto-cuesta-una-empanada-en-colombia/)
- Milo: no se halló etiqueta colombiana; FatSecret (Sudáfrica) 4 cditas = 20 g ≈ 84 kcal; etiquetas chilenas usan 14 g — [FatSecret](https://www.fatsecret.co.za/calories-nutrition/milo/chocolate-powder/4-tsp?frc=True); [Jumbo Chile](https://www.jumbo.cl/saborizante-nestle-milo-chocolate-1-kg/p)

**Tabla D. Porciones por defecto propuestas (la mayoría [E], con ancla citada cuando existe)**

| Ítem | Porción por defecto | g (rango) | kcal aprox. | Base |
|---|---|---|---|---|
| Arroz blanco, "una porción" restaurante | 1 plato/pocillo | 180 (150–220) cocido | ~230 | [E]; ancla GABA 80 g = 88 kcal, PAE 125–135 g |
| Fríjoles (principio) | 1 cucharón | 150 (120–200) | ~200 | [E]; GABA 1/2 cucharón = 60 g = 82 kcal |
| Lentejas (principio) | 1 cucharón | 150 | ~180 | [E]; GABA 70 g = 82 kcal |
| Pechuga/carne a la plancha | 1 porción | 120 (100–150) cocido | 180–280 | [E]; GABA 60 g crudo = 1 int. |
| Pollo asado 1/4 (pierna-pernil con piel) | 1/4 | 250 con hueso / ~170 comestible | ~400 | [E] |
| Pollo asado 1/4 pechuga con piel | 1/4 | 280 con hueso / ~200 comestible | ~400 | [E] |
| Chicharrón (porción bandeja) | 1 trozo | 100 (80–150) cocido | 450–550 | [E]; ICBF bandeja usa 212 g tocino crudo |
| Tajadas de maduro | 3–4 tajadas | 80 (60–120) | ~200 (fritas) | [E]; ICBF bandeja 58,5 g + 6,5 g aceite |
| Patacón | 2 unidades | 80 (60–100) | ~200 | [E] |
| Papa común cocida | 1 mediana | 83–150 | 70–125 | GABA 83 g [F] |
| Yuca cocida | 1 trozo | 100–150 | 160–240 | [E]; GABA 62 g crudo = 90 kcal |
| Sopa del corrientazo (verduras/pasta/arroz) | 1 plato | 300 ml (250–400) | 100–200 | [E] |
| Ensalada (repollo/tomate/zanahoria) | 1 porción | 70 (50–100) | 15–60 (según aderezo) | PAE 70–80 g [F] |
| Jugo natural con azúcar (agua) | 1 vaso | 250 ml (200–300) | 80–130 | [E]; PAE 200 cm³ + 8–10 g azúcar |
| **Corrientazo completo** (sopa + arroz + principio + proteína + tajada + ensalada + jugo) | 1 almuerzo | ~950–1.150 g totales | **900–1.200** | [E]; suma de filas |
| Bandeja paisa | 1 plato | 800–1.000 servido | 1.300–1.900 | [E]: ICBF 198 kcal/100 g × peso estimado de la receta ICBF |
| Ajiaco (sin acompañantes) | 1 plato | 600–750 comestible | 420–520 | [E]: 69 kcal/100 g × peso estimado; +crema 30 g (~90), +½ aguacate (~120), +arroz 100 g (~130) |
| Sancocho de gallina | 1 plato | 700–900 | 600–1.000 | [E]: 113 kcal/100 g |
| Tamal tolimense | 1 unidad | 400–550 | 450–600 | [E]: 108 kcal/100 g |
| Arepa paisa (blanca delgada sin sal) | 1 unidad | 50–60 | 85–110 | GABA 56 g = 88 kcal [F] |
| Arepa boyacense (dulce con queso, mantequilla) | 1 unidad | 110–130 | 330–420 | [E] |
| Arepa de choclo | 1 unidad | 120–150 (sin queso) | 250–330; +queso 40 g ≈ +120 | [E] |
| Arepa con queso (asada, rellena) | 1 unidad | 120–150 | 300–400 | [E] |
| Huevos pericos | 2 huevos | 130 (con tomate/cebolla) + 5 g aceite | 190–230 | [E]; GABA huevo 50 g = 77 kcal |
| Empanada frita (maíz, papa/carne) | 1 unidad | 70 (50–100) | 180–260 | [E]; peso de comococinarocomer |
| Pandebono | 1 unidad | 50–70 | 170–250 | [E]; GABA pan de queso pequeño 28 g = 88 kcal |
| Buñuelo | 1 unidad mediano | 50–60 | 180–230 | [E] |
| Almojábana | 1 unidad | 60–80 | 200–280 | [E]; GABA 31 g = 88 kcal (unidad "grande" de 31 g parece pequeña) |
| Perro caliente colombiano (salsas, papitas, queso) | 1 unidad | 220–300 | 500–750 | [E] |
| Hamburguesa callejera colombiana | 1 unidad | 300–400 | 700–1.000 | [E] |
| Salchipapa personal | 1 porción | 350–450 | 800–1.100 | [E] |
| Milo en leche | 1 vaso: 250 ml leche entera + 20 g Milo | 270 | ~245 (161 + 84) | GABA leche 200 g = 129 kcal [F]; Milo 20 g [F, no Colombia] |
| Cerveza (Águila/Póker) | 1 lata/botella | 330 ml | 130–150 | [E] |
| Aguardiente (29°) | 1 trago (copa) | 30 ml | ~65–70 | [E] (alcohol 29% v/v × 0,789 × 7 kcal/g) |
| Aceite añadido "frito" | por porción frita | +5–15 g | +45–135 | GABA 5 g = 44 kcal [F] |

### Inferences
- La densidad energética de platos colombianos medidos por ICBF va de ~70 (ajiaco) a ~200–240 kcal/100 g (bandeja paisa, lechona, friche); el principal factor de error vago será el **peso del plato**, no la densidad.
- Los acompañamientos no incluidos (crema, aguacate, arroz en ajiaco; arepa en bandeja) pueden sumar 150–350 kcal; el logger debe preguntarlos o asumirlos explícitamente.

### Gaps
- El documento ICBF no imprime el peso de la porción servida, aunque dice haberlo medido; habría que pedirlo al ICBF o pesar recetas.
- No hallé estudio formal colombiano para arepa/empanada/pandebono/buñuelo/perro/salchipapa/pollo asado; todos esos valores son [E].
- No hallé etiqueta de Milo Colombia (verificar empaque).

---

## 3. Metodología de benchmark sin comidas pesadas

### Takeaway
NutriBench construyó la verdad de terreno a partir de **registros de ingesta con alimentos codificados y gramos (WWEIA/FNDDS; FAO/WHO GIFT)** y luego generó descripciones en lenguaje natural con un LLM, en dos versiones (porción natural vs métrica), verificadas por humanos. El mismo diseño aplica aquí: definir **recetas estándar colombianas (Tablas A–D + TCAC)** como verdad, generar descripciones paráfrasis en español colombiano, y medir por separado el error de *lookup/cálculo* (gramos dados) y el error de *porción* (vago). Para estimar "≥80%" con precisión ±5–6 pp hacen falta ~200 comidas por condición.

### Cited Findings
- NutriBench: 11.857 descripciones de comidas, etiquetadas con carbohidratos, proteína, grasa y calorías, de 11 países; verdad desde WWEIA (FNDDS 2017–18) y FAO/WHO GIFT mapeado a USDA FoodData Central por similitud de embeddings (≈85,5% de acierto en revisión manual de 100 ítems) — [NutriBench arXiv v6](https://arxiv.org/html/2407.12843v6)
- Descripciones generadas con GPT-4o-mini (5 variantes por comida, se elige una al azar), revisadas por un autor (corrigiendo nombres de alimentos o tamaños de porción faltantes); 5.532 comidas con porciones naturales ("una taza de arroz") y 5.532 con métricas (gramos) — [NutriBench arXiv v6](https://arxiv.org/html/2407.12843v6)
- Métricas: MAE, Acc@7.5 (carbohidratos dentro de ±7,5 g) y tasa de respuesta (el modelo puede responder −1 si no sabe) — [NutriBench arXiv v6](https://arxiv.org/html/2407.12843v6)
- Mejor resultado: GPT-4o + CoT, Acc@7.5 = 66,82%, MAE 8,61 g, tasa de respuesta 99,16%; CoT sube la exactitud promedio de 12 modelos de 43,24% a 47,46%; la mayoría de modelos tiene más MAE con porciones naturales que métricas — [NutriBench arXiv v6](https://arxiv.org/html/2407.12843v6)
- Nutricionistas (3) en 72 comidas sin herramientas: 42,45% vs 60,56% de GPT-4o CoT — [NutriBench arXiv v6](https://arxiv.org/html/2407.12843v6)
- NutriBench v2 amplía a 24 países (abr-2025) — [NutriBench v2, UCSB](https://www.ai.ece.ucsb.edu/nutribench_v2); licencia CC BY-NC-SA 4.0 — [arXiv](https://arxiv.org/abs/2407.12843)
- LLMs ajustados (PEFT) sobre texto de recordatorios de 24 h: MAPE de energía ≈9–10%, macros ≈12–16% (según snippet de búsqueda, no verificado en el PDF) — [arXiv 2509.13268](https://arxiv.org/pdf/2509.13268)
- Caso de ingeniería (no revisado por pares): 107 descripciones, mejor configuración 60% dentro de ±10% kcal — [ZenML LLMOps DB (Taralli)](https://www.zenml.io/llmops-database/iterative-prompt-optimization-and-model-selection-for-nutritional-calorie-estimation)
- En imágenes, dar el peso real bajó el MAPE a 20,2% (Gemini 2.5 Flash) y 26,8% (GPT-4.1) (según snippet) — [ODU digital commons](https://digitalcommons.odu.edu/computerscience_fac_pubs/417)

**Tabla E. Intervalo de confianza 95% (Wilson) para una proporción observada [cálculo propio]**

| n | p̂ = 0,80 | p̂ = 0,90 |
|---|---|---|
| 30 | 0,63–0,91 | 0,74–0,97 |
| 50 | 0,67–0,89 | 0,79–0,96 |
| 100 | 0,71–0,87 | 0,83–0,95 |
| 150 | 0,73–0,86 | 0,84–0,94 |
| 200 | 0,74–0,85 | 0,85–0,93 |
| 300 | 0,75–0,84 | 0,86–0,93 |
| 400 | 0,76–0,84 | 0,87–0,93 |

### Inferences (diseño recomendado)
- **Dos conjuntos separados**:
  1. *Set G (gramos dados)*: ítems con gramos explícitos ("300 g de arroz blanco cocido, 150 g de pechuga a la plancha"). Verdad = TCAC/USDA × gramos. Mide parsing + lookup + aritmética. Meta ≥90% dentro de ±10% kcal.
  2. *Set V (vago)*: mismas comidas descritas en medidas caseras o nombres de plato ("un corrientazo con pollo", "una porción de arroz"). Verdad = **receta/porción estándar documentada** (Tablas A–D). Mide si el logger aplica la convención de porción. Meta ≥80% dentro de ±20%.
  - Generar ambos desde la misma "comida canónica" (lista de ítems + gramos) para atribuir error: error_total ≈ error_porción (V vs G) + error_lookup (G).
- **Métricas**: % dentro de ±10% y ±20% kcal (primaria), MAPE y mediana APE, sesgo medio con signo (sub/sobreestimación sistemática), MAE en kcal, y lo mismo para proteína (relevante para app de gimnasio). Reportar por categoría (desayuno, corrientazo, comida rápida, snacks, bebidas/alcohol) y tasa de "pidió aclaración".
- **Tamaño**: con n=50 un 80% observado es compatible con 67–89% → no sirve para afirmar ≥80%. Para que el límite inferior quede ≥80% hay que observar ~85% con n≈200 o ~84% con n≈300. Recomendación: **≥200 comidas por set** (≈400 total), o 100 por set como piloto.
- **Paráfrasis**: usar un LLM distinto al evaluado para generar 3–5 variantes en español colombiano por comida (regionalismos: "corrientazo", "seco", "principio", "una porción", "un pocillo", "media", "unas tajaditas", "el de la esquina"), con revisión humana como NutriBench; congelar el set y no usarlo para ajustar prompts (tener un set dev aparte).
- **Expectativa realista**: los ±20% del set V miden concordancia con una convención, no con la ingesta real. Con CV de ~30–35% en kcal entre restaurantes (Sección 4), aun un logger perfecto que use la media estaría dentro de ±20% del plato real solo en ~45–55% de los casos (suponiendo distribución normal: P(|z|<0,2/0,33) ≈ 45%) [inferencia].

### Gaps
- No encontré un benchmark publicado en español/Latinoamérica para estimación nutricional desde texto.
- No verifiqué el PDF completo de arXiv 2509.13268 ni el estudio ODU; sus cifras vienen de snippets.

---

## 4. Variabilidad real de porciones en restaurantes (expectativas)

### Takeaway
Los estudios con calorimetría muestran desviaciones estándar de ~30–45% de la media en kcal por comida de restaurante, y el mismo plato puede variar ~2 veces entre locales. No hay estudio colombiano equivalente; Brasil es la referencia latinoamericana más cercana.

### Cited Findings
- Roberts et al., BMJ 2018 (calorimetría, 223 comidas, 111 restaurantes en Brasil, China, Finlandia, Ghana, India): servicio a la mesa (todos los países) 1.317 ± 442 kcal; comida rápida 809 ± 363 kcal; comida rápida ~33% menos energía que servicio a la mesa — [Roberts 2018, BMJ (PMC6290458)](https://pmc.ncbi.nlm.nih.gov/articles/PMC6290458)
- Brasil: servicio a la mesa 1.301 ± 453 kcal y 780 ± 327 g; comida rápida 862 ± 285 kcal y 337 ± 122 g; densidad 1,82 kcal/g (FS) y 2,63 (FF). CV derivado ≈ 35% / 33% — [Roberts 2018](https://pmc.ncbi.nlm.nih.gov/articles/PMC6290458)
- Comedor de empresa en Finlandia (análogo a "almuerzo corriente" estandarizado): 880 ± 156 kcal, 668 ± 93 g (CV ≈ 18%) — [Roberts 2018](https://pmc.ncbi.nlm.nih.gov/articles/PMC6290458)
- El mismo plato en China midió 1.386 kcal en un restaurante y 657 kcal en otro (~2,1×) — [Roberts 2018](https://pmc.ncbi.nlm.nih.gov/articles/PMC6290458)
- Urban et al. 2016 (EE. UU., San Francisco/Boston/Little Rock, 2011–2014, calorimetría): comidas de restaurantes no de cadena 1.205 ± 465 kcal (CV ≈ 39%), sin diferencia significativa con cadenas equivalentes (+5,1%) — [escholarship UC](https://escholarship.org/uc/item/22k3z8b1); [AGRIS](https://agris.fao.org/search/es/records/65e01b936eef00c2cea3c70e)
- Urban et al. 2013 (JAMA Intern Med; Boston, 157 comidas de 33 restaurantes): ~1.327 kcal promedio por comida — [Newswise](https://www.newswise.com/articles/individual-and-small-chain-restaurant-meals-exceed-recommended-daily-calorie-needs)

### Inferences
- Un corrientazo se parece más a un "comedor" con menú fijo (CV menor, ~18–25%) que a la carta (~35%); pero varía mucho entre locales y ciudades [inferencia].
- La meta "≥80% dentro de ±20%" para porciones vagas es alcanzable **solo contra la verdad-convención** del benchmark; frente a la ingesta real el error irreducible por variabilidad de restaurante probablemente supere ±20% en ~la mitad de los casos. Comunicarlo al usuario y ofrecer "corrección rápida" (pequeño/normal/grande, o foto) mejora más que afinar el modelo.
- La comida rápida y frituras tienen mayor densidad (2,1–2,6 kcal/g): el aceite absorbido es la mayor fuente de incertidumbre en Colombia (empanadas, chicharrón, patacón, salchipapa) [inferencia].

### Gaps
- No hallé estudios latinoamericanos/colombianos de variabilidad de porciones en corrientazos o restaurantes populares (solo prensa sobre precios: [Portafolio/DANE](https://www.portafolio.co/mis-finanzas/ahorro/precio-del-corrientazo-sigue-subiendo-en-colombia-esto-es-lo-que-dice-el-dane-497895)).
- El artículo de Nutr. Hosp. 2015 sobre menús fuera del hogar ([aulamedica](http://www.aulamedica.es/nh/pdf/7752.pdf)) no se revisó; país y cifras sin confirmar.
