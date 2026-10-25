# Bases de datos de composición de alimentos para una app colombiana de nutrición

Researched on 2026-10-24. About 19 tool calls. Several PDFs (TCAC 2015/2018, 18 preparaciones) were too large (>10 MB) or encrypted to read through the fetch tool, so their internal nutrient columns could not be confirmed directly. That is noted below.

## Tabla de Composición de Alimentos Colombianos (TCAC, ICBF): availability, format, coverage, license

### Takeaway
The latest official edition I could find is the TCAC 2018 (5th version, published July 2019): 773 foods, including 95 native foods and typical regional dishes. It is distributed only as a PDF, with no Excel/CSV/API and no explicit open license. Using it in an app means manually transcribing a curated subset, and the reuse terms are legally unclear.

### Cited Findings
- The official page is https://www.icbf.gov.co/bienestar/nutricion/tabla-alimentos. It offers three PDFs: TCAC 2018 (`https://www.icbf.gov.co/system/files/tcac_web.pdf`), TCAC 2015 (`https://www.icbf.gov.co/system/files/tcac_2015_final_para_imprimir.pdf`) and "Caracterización y composición de 18 preparaciones tradicionales" (`https://www.icbf.gov.co/system/files/caracterizacion-composicion-18-preparaciones-tradicionales-icbf1_0.pdf`) — [ICBF – Tabla de Composición de Alimentos Colombianos](https://www.icbf.gov.co/bienestar/nutricion/tabla-alimentos)
- TCAC 2018 has 773 food entries, including native foods and "las preparaciones típicas más importantes" of the country. It also adds fatty-acid and amino-acid data — [ICBF](https://www.icbf.gov.co/bienestar/nutricion/tabla-alimentos)
- ICBF announced the 2018 edition on 2 July 2019 as the fifth version of the TCAC. Details from the announcement:
  - 773 entries, 95 of them native foods (açaí, borojó, champa, weya, umuy…), in 16 groups. One group is "prepared foods".
  - Example dishes: ajiaco santafereño, bandeja paisa, arroz atollado, mote de queso, cuy asado, friche de chivo, arroz clavado.
  - Built by Universidad Nacional de Colombia + ICBF using edible-portion analysis, data imputation and reference to other countries' tables.
  - Source: [ICBF news node 78049](https://www.icbf.gov.co/node/78049)
- TCAC 2015 (2nd edition, Dec 2015) has 967 food entries, including 301 new foods and 81 native foods. It was built by validating and updating the 2005 edition. It is also PDF only, and no online lookup tool is mentioned — [ICBF node 103086](https://www.icbf.gov.co/node/103086); [ICBF](https://www.icbf.gov.co/bienestar/nutricion/tabla-alimentos)
- A copy of the 2015 PDF is also hosted by MinSalud — [MinSalud RID](https://www.minsalud.gov.co/sites/rid/Lists/BibliotecaDigital/RIDE/INEC/IETS/tabla-de-composicion-alimentos-colombianos-2015.pdf)
- Values come either from direct chemical analysis or from secondary sources, such as other countries' tables and published studies — [ICBF taxonomy page (search snippet)](https://www.icbf.gov.co/taxonomy/term/1226)
- The 18-preparations study reports proximate composition, lipid profile and dietary fiber, analyzed in triplicate — [ICBF 18 preparaciones (search snippet)](https://www.icbf.gov.co/system/files/caracterizacion-composicion-18-preparaciones-tradicionales-icbf1_0.pdf)
- The ICBF pages state no terms of use or license for the tables. The only legal text is the generic site footer "Todos los derechos reservados" — [ICBF](https://www.icbf.gov.co/bienestar/nutricion/tabla-alimentos)
- An ICBF TCAC page carries "Fecha de Actualización: 19/05/2025", but that is a page revision, not a new edition. No 2024–2026 edition was found — [ICBF taxonomy term 8207](https://www.icbf.gov.co/taxonomy/term/8207)

### Inferences
- There is no machine-readable format, so the practical path is to hand-transcribe about 100–300 commonly eaten Colombian foods and dishes from the 2018 PDF (and the 18-preparations PDF) into a curated JSON/Firestore table. Each row would carry a `source: "TCAC 2018"` field and the food code.
- Colombian government works are generally reusable with attribution, but that is not stated for TCAC. "Todos los derechos reservados" suggests asking ICBF (Dirección de Nutrición) for permission, or storing only derived per-100 g macro values with attribution. Pure numeric facts are generally less protected than the compiled work, but this is not legal advice.
- Some values are imputed or borrowed from foreign tables, so TCAC entries vary in quality. Analyzed values, especially the 18 preparations, should be preferred for dishes.

### Gaps
- The exact nutrient columns of TCAC 2018 could not be confirmed directly: the PDF is over 10 MB and could not be fetched. I would expect moisture, energy kcal/kJ, protein, total fat, carbohydrate, dietary fiber, ash, minerals and vitamins, per 100 g edible portion. Whether alcohol is a column is unknown. Verify by opening the PDF.
- Raw vs cooked: the pages don't say. Whether TCAC has separate cooked entries for staples (arroz cocido, frijol cocido, arepa asada, patacón, empanada frita, sancocho) is unverified.
- I could not extract the names of the 18 preparations, because the PDF is encrypted against text extraction.
- License or permission for app reuse is unverified.

## Other LatAm sources (LATINFOODS/INFOODS, INCAP, SMAE) and Colombian GABA portion sizes

### Takeaway
Regional tables exist but are PDF-centric and older. The most useful is INCAP's Central American table (2007, reprinted 2012), which covers foods similar to Colombian staples. LATINFOODS/INFOODS is a network, not a downloadable API. The Colombian GABA (2020) define "intercambios" and portion sizes, which help estimate typical servings, but I couldn't extract the exact gram values.

### Cited Findings
- LATINFOODS was created in 1986. It is the Latin American regional data center of INFOODS, which FAO has coordinated since 1999 — [Archivos Latinoamericanos de Nutrición 2014](https://www.alanrevista.org/ediciones/2014/3/art-8); [Repositorio U. Chile – LATINFOODS 2009–2012](https://repositorio.uchile.cl/handle/2250/155141)
- A 2025 report says the Food Research Center (FoRC, Brazil) launched a "Latinfoods Portal" bringing together food composition data from several Latin American countries — [FAPESP ODS](https://ods.fapesp.br/portal-aims-to-centralize-food-composition-data-from-latin-american-countries/12427)
- There is ongoing work on a regional table of Latin American native foods — [MDPI Proceedings 2673-9976/8/1/6](https://www.mdpi.com/2673-9976/8/1/6)
- Tabla de Composición de Alimentos de Centroamérica: Menchú & Méndez (eds.), INCAP/OPS, 2nd ed. 2007, reprinted 2012. It is a PDF, with no public Excel found — [UNAM-hosted PDF](https://portalacademico.cch.unam.mx/materiales/prof/matdidac/sitpro/exp/quim/quim2/quimIIvallejo/TCA.pdf)
- Sources describe INCAP's database as integrated more than 20 years ago from existing tables. One source calls the regional tables outdated and incomplete — [Redalyc](https://www.redalyc.org/journal/446/44664664002/44664664002.pdf); [USAC thesis](https://biblioteca-farmacia.usac.edu.gt/Tesis/QB777.pdf)
- The GABA for Colombians over 2 years old (ICBF/FAO, 2020) give 9 messages built on 6 food groups, shown in the "Plato saludable de la Familia Colombiana" — [ICBF Guías Alimentarias](https://www.icbf.gov.co/taxonomy/term/7154)
- ICBF menu standards ("minutas patrón") use GABA intercambios. Example: 1 dairy intercambio = 200 ml yogurt/kumis, so a 300 ml portion = 1.5 intercambios — [ICBF minuta patrón](https://www.icbf.gov.co/sites/default/files/procesos/a35.g6.pp_minuta_patron_preparacion_para_la_vida_independiente_v1.pdf)

### Inferences
- ICBF minutas patrón give portion sizes in grams per age group. They could be mined to define default portions such as "1 porción de arroz" or "1 arepa", and an "almuerzo corriente" template.
- Use INCAP or Ecuadorian tables only to fill gaps (e.g., tropical tubers and fruits) and tag them as secondary.

### Gaps
- Mexican SMAE (Sistema Mexicano de Alimentos Equivalentes): not researched in this pass. Note that it is a commercially sold book, not open data, so it is probably unsuitable to embed. Verify.
- The exact gram sizes of GABA intercambios per group were not extracted.
- Whether the FAO/INFOODS website still hosts a downloadable list of LatAm tables in 2026 was not verified.
- The Latinfoods Portal's access terms and API, if any, are unknown.

## USDA FoodData Central (FDC)

### Takeaway
FDC is the best open, programmatic fallback. Data is CC0 public domain, there is a free REST API (1,000 requests/hour per IP with a free data.gov key), and full CSV/JSON bulk downloads are available. For generic whole foods, prefer Foundation and SR Legacy; for cooked or mixed dishes with household portions, use FNDDS (Survey). Queries must be in English.

### Cited Findings
- Endpoints: `GET /food/{fdcId}`, `GET|POST /foods` (multiple IDs), `GET|POST /foods/list` (paged), `GET|POST /foods/search` — [FDC API Guide](https://fdc.nal.usda.gov/api-guide/)
- Every request needs a data.gov API key. Keys found publicly (e.g., in repos) are deactivated, so keep it server-side — [FDC API Guide](https://fdc.nal.usda.gov/api-guide/)
- Rate limits:
  - Default is 1,000 requests/hour per IP. Going over returns HTTP 429 and blocks the key for 1 hour.
  - Response headers `X-RateLimit-Limit` / `X-RateLimit-Remaining` show usage.
  - `DEMO_KEY` allows only 30/hour and 50/day.
  - Higher limits are available on request.
  - Source: [FDC API Guide](https://fdc.nal.usda.gov/api-guide/)
- License: public domain under CC0 1.0. "No permission is needed for their use." FDC asks to be credited as the source — [FDC API Guide](https://fdc.nal.usda.gov/api-guide/)
- Data types: Foundation Foods, SR Legacy, Survey Foods (FNDDS), Experimental, Branded — [FDC API Guide](https://fdc.nal.usda.gov/api-guide/)
- Bulk downloads (as of the page fetched 2026-10) — [FDC Download Datasets](https://fdc.nal.usda.gov/download-datasets/):

  | Dataset | Release | Download size (zipped) |
  |---|---|---|
  | Foundation Foods | 04/2026 | JSON 459 KB / CSV 3.7 MB |
  | SR Legacy | 04/2018 | JSON 12.3 MB / CSV 6.7 MB |
  | FNDDS 2021–2023 | 10/2024 | JSON 3.7 MB / CSV 200 MB |
  | Branded | 04/2026 | JSON 195 MB / CSV 428 MB |
  | Full download (CSV only) | 04/2026 | 460 MB |

- SR Legacy is the final Standard Reference release and "will not be updated" — [FDC Download Datasets](https://fdc.nal.usda.gov/download-datasets/)

### Inferences
- FDC food descriptions are in English, so Spanish queries ("frijoles", "arepa") need translation. Options are a server-side synonym dictionary or LLM translation to English before calling `/foods/search` with `dataType=Foundation,SR Legacy,Survey (FNDDS)`. I did not test search quality directly.
- SR Legacy and FNDDS contain both raw and cooked variants (e.g., "Rice, white, long-grain, regular, enriched, cooked") plus `foodPortions` with household measures (cup, piece). FNDDS is the best source for "as eaten" dishes. This is based on general knowledge of the datasets and was not re-verified here.
- The SR Legacy JSON (12 MB zipped) is small enough to preload a subset into Firestore. That avoids rate limits entirely for common foods.
- Nutrient IDs worth mapping: energy (1008 kcal), protein (1003), fat (1004), carbohydrate by difference (1005), fiber (1079), water (1051), alcohol (1018). These are FDC/SR nutrient numbers from domain knowledge; confirm them against the downloaded `nutrient.csv`.

### Gaps
- I didn't test FDC search ranking with Spanish or translated queries.
- I didn't fetch a sample `/food` response to confirm `foodPortions` fields per data type.

## Open Food Facts (OFF)

### Takeaway
OFF is free and needs no key for barcode lookups of packaged products. It is ODbL (attribution + share-alike) with strict per-IP rate limits, and the data is crowd-sourced with uneven quality. It is good for scanning Colombian packaged goods, not for generic or whole foods.

### Cited Findings
- Product endpoint: `https://world.openfoodfacts.org/api/v2/product/{barcode}.json`. No key is needed for reads, and a custom User-Agent identifying the app is required — [OFF API docs](https://openfoodfacts.github.io/documentation/docs/Product-Opener/api/)
- Rate limits:
  - 15 req/min/IP for product reads and 10 req/min/IP for search. Going over can get the IP banned, with HTTP 503 returned.
  - For apps, the limits apply per user when requests come directly from users.
  - Production use is welcome as long as "1 API call = 1 real scan by a user".
  - For more than a few hundred products, download the CSV/JSONL dumps instead.
  - Source: [OFF API docs](https://openfoodfacts.github.io/documentation/docs/Product-Opener/api/); [OFF support – conditions](https://support.openfoodfacts.org/help/en-gb/12-api-data-reuse/94-are-there-conditions-to-use-the-api)
- License:
  - The database is ODbL, individual contents are under the Database Contents License, and images are CC BY-SA.
  - The ODbL conditions are attribution and share-alike. Combining OFF data with other databases may require releasing the result as open data.
  - A third-party listing claiming "no rate limits" conflicts with the official docs and should be disregarded.
  - Source: [OFF license tutorial](https://openfoodfacts.github.io/documentation/docs/Product-Opener/api/tutorials/license-be-on-the-legal-side/); [freeapihub listing (contradicting)](https://freeapihub.com/apis/open-food-facts-api)

### Inferences
- The app runs server-side (Next.js), so all user scans would come from one server IP, and the 15/min/IP limit becomes a shared ceiling. Fixes: cache every barcode result in Firestore, or call OFF from the client so each user has their own IP-based limit.
- Share-alike: keep OFF-derived records in a separate collection, not merged with the curated TCAC table, to avoid triggering share-alike on the whole dataset. Credit OFF in the UI.
- Validate OFF nutrition per 100 g with simple sanity checks: kcal ≈ 4·P + 4·C + 9·F (+7·alcohol) within about ±20%, and macros summing to ≤100 g.

### Gaps
- The number of Colombian products in OFF couldn't be verified: the country page returned HTTP 503 when fetched.
- Data completeness for Colombian brands (Alpina, Zenú, Colombina, Ramo…) is unknown.

## Cooked vs raw conversion, frying oil absorption

### Takeaway
USDA publishes two separate resources: Nutrient Retention Factors (Release 6, 2007), which cover vitamins and minerals, and Cooking Yields tables (weight change, plus fat gain or loss for meat and poultry). For energy and macros, the main factor needed is the yield, meaning the water change. Oil absorption during frying is covered by cooking-yield and European tables, not by the retention factors.

### Cited Findings
- The USDA Table of Nutrient Retention Factors, Release 6 (2007) covers retention of vitamins, minerals and alcohol, and added choline — [data.gov catalog](https://catalog.data.gov/dataset/usda-table-of-nutrient-retention-factors-release-6-2007-1b152)
- USDA cooking yields tables cover yield and fat gains or losses during preparation for meat and poultry — [USDA Cooking Yields Meat & Poultry (2002)](https://ars.usda.gov/ARSUserFiles/80400535/Data/retn/USDA_CookingYields_MeatPoultry02.pdf); [ARS beef cooking yield study](https://ars.usda.gov/ARSUserFiles/80400525/Articles/NDBC38_Beef_CookingYield.pdf)
- A European/German retention-factor compilation reports fat uptake for fried foods in grams per 100 g of raw food — [KIT publication](https://publikationen.bibliothek.kit.edu/9642002/1928)
- FSANZ (AUSNUT) publishes recipe calculators with yield and retention factors, as another method reference — [FSANZ recipe calculators](https://foodstandards.govt.nz/science-data/monitoringnutrients/ausnut/foodnutrient/recipecalculators)

### Inferences
- Simple approach: macros_cooked_per100g = macros_raw_per100g / yield, where yield = cooked weight / raw weight. Rice, pasta and legumes gain water (yield > 1), while meats lose water (yield < 1).
- Prefer a direct "cooked" entry (TCAC or FDC) whenever one exists, instead of converting.
- For fried items (patacón, empanada, chicharrón, papas), use an "as fried" FDC/TCAC entry if available. Otherwise add an oil-absorption allowance (g of oil per 100 g of food) taken from the KIT table, and let the user adjust ("poco/medio/mucho aceite").

### Gaps
- No specific USDA oil-absorption percentages were verified. The KIT table's values weren't extracted.

## Fast-food chains in Colombia (El Corral, Frisby, McDonald's, KFC, Domino's)

### Takeaway
I found no verified official nutrition data for Colombian chains. Only aggregator data (FatSecret, mostly Mexico/Spain) turned up, and it is inconsistent and carries no accuracy guarantee.

### Cited Findings
- FatSecret lists McDonald's items with conflicting values across its country sites (e.g., Big Mac 540 vs 544 kcal) and disclaims any guarantee of accuracy — [FatSecret MX – McDonald's](https://www.fatsecret.com.mx/calor%C3%ADas-nutrici%C3%B3n/mcdonalds); [FatSecret ES – McDonald's](https://www.fatsecret.es/calorías-nutrición/mcdonalds)

### Inferences
- International chains (McDonald's, KFC, Domino's) usually publish nutrition per country, but Colombian recipes and portions may differ from US/MX ones. Store chain items as user-verified custom entries with a "fuente/estimado" flag.
- FatSecret has terms and a commercial API, so scraping it is not advisable.

### Gaps
- I didn't verify whether El Corral, Frisby, McDonald's Colombia (Arcos Dorados), KFC Colombia or Domino's Colombia publish nutrition tables on their websites in 2026.
- Colombian front-of-pack labeling rules (Res. 810/2021) cover packaged foods, not restaurant menus. This comes from domain knowledge and was not verified here.

## Recommended architecture and data-quality caveats

### Takeaway
Use a three-tier lookup:
1. A curated local Colombian table (transcribed from TCAC 2018 and the 18 preparations, with GABA/minuta portion defaults) stored in Firestore or as a bundled JSON.
2. USDA FDC as the fallback for generic foods, via Spanish→English translation, called server-side with the key in env vars, with every result cached in Firestore.
3. Open Food Facts for barcodes, cached per barcode and attributed under ODbL.

Every record should carry its source, `basis: per_100g`, raw/cooked state and a quality flag.

### Cited Findings
- FDC data is CC0, rate-limited per IP/key, and bulk-downloadable, which makes preloading and caching viable — [FDC API Guide](https://fdc.nal.usda.gov/api-guide/); [FDC Downloads](https://fdc.nal.usda.gov/download-datasets/)
- OFF asks large consumers to use dumps rather than the API, and requires attribution and share-alike — [OFF API docs](https://openfoodfacts.github.io/documentation/docs/Product-Opener/api/); [OFF license](https://openfoodfacts.github.io/documentation/docs/Product-Opener/api/tutorials/license-be-on-the-legal-side/)
- TCAC mixes analyzed values with values imputed or borrowed from foreign tables — [ICBF node 78049](https://www.icbf.gov.co/node/78049); [ICBF](https://www.icbf.gov.co/taxonomy/term/1226)

### Inferences
- Firestore schema sketch: `foods/{id}` with:
  - `name_es`, `aliases[]`, `source` (TCAC2018 | FDC | OFF | user)
  - `sourceId`, `state` (raw | cooked | fried | as_sold)
  - `per100g` {kcal, protein_g, carb_g, fat_g, fiber_g, water_g, alcohol_g?}
  - `portions[]` {label: "1 arepa mediana", grams}
  - `quality` (analyzed | imputed | crowd)
  - `fetchedAt`
- Carbohydrate definitions differ: FDC "carbohydrate by difference" includes fiber. Check whether TCAC reports total or available carbohydrate, and normalize before mixing sources. Recompute kcal from macros as a consistency check.
- Mixed dishes (bandeja paisa, almuerzo corriente) are best modeled as recipes of components with gram defaults. A single per-100 g number hides huge variability.

### Gaps
- Open-source projects combining TCAC and FDC for Colombia were not searched (no time budget left). Look on GitHub for "tabla composicion alimentos colombianos json/csv"; community transcriptions may exist, but their accuracy and license would need checking.
- Peer-reviewed assessments of TCAC data quality were not retrieved: the ALAN article PDFs were image-only scans.
