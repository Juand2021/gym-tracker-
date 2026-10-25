# Fase 3 — Arquitectura

> Fecha: 2026-10-25 · Estado: **✅ aprobada por Juan el 2026-10-25**

## 0. Corrección importante (2026-10-25, tarde)
**Comidas es una APP DISTINTA a Fuerza, no una función del Coach.** Comparten el login y el perfil, pero cada una tiene su logo, sus pestañas y su chat:
- Al tocar el logo ("FUERZA." o "COMIDAS.") se abre el menú **"Tus apps"** para cambiar de una a otra (`src/components/AppSwitcher.tsx`).
- **El Coach de Fuerza (`/ia`) queda solo para el entreno**: se deshicieron todos los cambios de Comidas en `/ia` y en `/api/ai/chat`.
- La app Comidas vive en `/comidas` (Hoy) y `/comidas/chat` (su propio asistente de nutrición), con API en `/api/comidas/*` y conversaciones guardadas aparte (`comidasChats`).
- Solo Juan la ve: Laura no tiene selector, `/comidas` la devuelve a Fuerza y la API le responde 403.
Donde este documento dice "el chat de IA que ya existe" o "/ia", léase **el chat de la app Comidas**.

## 1. Decisiones de Juan (2026-10-25)

| Tema | Decisión |
|---|---|
| Cómo se registra una comida | **Por el chat de IA que ya existe** ("almorcé esto y esto"). Nada de buscar tarjetas |
| Guardado | **El chat pregunta antes de guardar**: muestra el resumen y espera "sí" o una corrección |
| Quién lo usa | **Solo Juan** por ahora. Laura no ve nada de Comidas |
| Base de alimentos en producción | En **Firestore** (privada), nunca en el repo público |
| Tiempo de respuesta | 3–9 s por comida es aceptable |
| Prioridad | Que el registro por chat quede lo más preciso posible; la interfaz completa puede esperar |
| Proveedor de IA | Se sigue con **Azure gpt-5-mini** (ver §9) |

## 2. Vista general

```
Juan escribe en /ia: "almorcé un corrientazo de cerdo y un jugo de mora"
        │
        ▼
POST /api/ai/chat  (ruta existente, ahora con herramientas)
        │  gpt-5-mini decide usar la herramienta  analizar_comida(texto, fecha, momento)
        ▼
Motor de Comidas (src/lib/nutrition/engine, Fase 2: 92 % / 86 %)
        │  lector IA → búsqueda en la base → gramos → cálculo en código
        ▼
Borrador guardado en Firestore (mealDrafts)  ──►  el chat responde:
        "Corrientazo: 1.209 kcal · 67 g proteína. Supuse sopa y tajadas.
         Te quedan 990 kcal y 103 g de proteína hoy. ¿Lo guardo?"
        │
        ├─ "sí"              → guardar_comida(borrador)   → meals
        └─ "eran 2 arepas"   → corregir_comida(borrador, cambio) → nuevo resumen → "¿Lo guardo?"
```

## 3. Datos en Firestore

Se sigue el patrón actual: Juan usa colecciones en la raíz (`dataRoot: "legacy"`); si algún día Laura usa Comidas, sus datos irían en `users/laura/...` con el mismo esquema.

### 3.1 Perfil único (compartido por Fuerza y Comidas)
`profile/main`, un solo documento:
```ts
{
  sex: "M" | "F",
  birthDate: "2001-10-15",          // la edad se calcula, no se guarda
  heightCm: 179,
  bodyFatPct: number | null,        // solo si es una medida fiable
  steps: { avgPerDay: 3500 },       // trabajo de oficina
  phase: {
    type: "deficit" | "mantenimiento" | "recomposicion" | "volumen",
    start: "2026-10-24", end: "2026-11-14",
    ratePctPerWeek: 0.7,            // ritmo del déficit (Fase 1 §4)
    objective: "Abdomen visible manteniendo fuerza",
  },
  updatedAt: ISOString,
}
```
- **El peso no se guarda aquí**: sale de `bodyWeight`, que ya existe en Fuerza.
- **Los días de entreno por semana tampoco**: salen del historial de `workouts`.
- **Migración:** `userAge` y `userHeightCm` dejan de vivir en `localStorage` (`AppSettingsContext`) y pasan a este documento; Fuerza los lee desde ahí. Sonido, vibración y pantalla encendida siguen locales (son ajustes del teléfono, no del cuerpo).

### 3.2 Medidas corporales
`bodyMeasurements/{id}`: `{ date, waistCm, neckCm, bicepsCm?, thighCm?, notes? }`. Visibles en Fuerza y Comidas. Con cintura y cuello se estima la grasa corporal (método de la Marina de EE. UU., Fase 1 §6) solo como tendencia.

### 3.3 Comidas guardadas
`meals/{id}`:
```ts
{
  date: "2026-10-25",              // día en hora de Colombia (America/Bogota)
  time: "13:10",
  moment: "desayuno" | "almuerzo" | "cena" | "snack" | "fiesta",
  text: "almorcé un corrientazo de cerdo...",   // lo que escribió Juan
  items: [{
    name, recordId, coreKey, grams, gramsBasis, gramsNote,
    nutrients: { kcal, protein_g, fat_g, carb_g, fiber_g, alcohol_g },   // copia congelada
    assumption, fromDish, addedOil,
  }],
  totals: { kcal, protein_g, fat_g, carb_g, fiber_g, alcohol_g },
  engineVersion: "2026-10-25-r9",
  chatThreadId, createdAt, updatedAt,
}
```
Los nutrientes se **copian** al guardar: si mañana se corrige un alimento en la base, el historial no cambia solo.

### 3.4 Borradores
`mealDrafts/{id}`: mismo formato que `meals`, más `expiresAt` (24 h) y `presentedInMessageId`. Un borrador nunca cuenta en los totales del día.

### 3.5 Base de alimentos
`nutritionDb/{version}` con `{ createdAt, records: 13951, chunks: 2, sha256 }` y `nutritionDb/{version}/chunks/{i}` con trozos del JSON comprimido (gzip + base64, < 900 KB cada uno, por el límite de 1 MiB por documento).
- Se sube con un script nuevo, `scripts/nutrition/upload_db.ts`, desde `.data/nutrition/foods.json`.
- Las reglas de Firestore ya bloquean todo acceso desde el navegador (solo el servidor con Admin SDK), así que la base queda privada.
- **No se usa Firebase Storage**: los buckets nuevos exigen el plan de pago (Blaze), y Firestore ya está en uso.

## 4. Servidor

### 4.1 Carga de la base
`src/lib/nutrition/db-server.ts`: la primera petición lee los trozos de Firestore, descomprime, arma la base y el índice de búsqueda (≈ 0,5–1 s) y los deja en memoria. Las siguientes peticiones del mismo servidor no pagan ese costo. En desarrollo local se lee `.data/nutrition/foods.json` si existe.

### 4.2 Herramientas del chat
La ruta `POST /api/ai/chat` pasa a usar **llamadas a herramientas** (function calling) de gpt-5-mini. Solo se ofrecen si el perfil es Juan:

| Herramienta | Qué hace |
|---|---|
| `analizar_comida(texto, fecha?, momento?)` | Corre el motor, crea un borrador y devuelve el resumen y los supuestos |
| `corregir_comida(borrador_id, cambio)` | Vuelve a correr el motor con el texto original + la corrección ("eran 2 arepas", "sin sopa") y reemplaza el borrador |
| `guardar_comida(borrador_id)` | Pasa el borrador a `meals` |
| `resumen_dia(fecha?)` | Totales del día vs objetivos (kcal, proteína, alcohol) |
| `borrar_comida(meal_id)` / `editar_comida(meal_id, cambio)` | Arreglar algo ya guardado |
| `consultar_opciones(opciones)` | Modo **"¿qué pido?"**: analiza 2–4 opciones de un menú sin guardar nada y las compara con lo que le queda del día y la fase |

**Regla de seguridad en el código, no solo en el prompt:** `guardar_comida` solo funciona si el borrador se mostró en un mensaje **anterior** del chat. Así el modelo no puede guardar en el mismo turno en que analiza, aunque se equivoque.

### 4.3 Contexto del Coach
Al prompt actual de Fuerza se agrega un bloque corto: fase, objetivos del día, lo consumido hoy y si hubo fiesta en los últimos 3 días. El Coach sigue respondiendo de entrenamiento como siempre.

### 4.4 Objetivos diarios
`src/lib/nutrition/targets.ts` (funciones puras, con pruebas): implementa las reglas de la Fase 1 §5 (RMR Mifflin/Tinsley, TDEE por partes con los entrenos reales, objetivos por fase, alcohol). Se calculan al vuelo con el perfil, el peso de `bodyWeight` y los `workouts`; no se guardan. El **TDEE adaptativo** (Fase 1 §5.3) usa `meals` + `bodyWeight` y se activa con ≥14 días de registro.

### 4.5 Modo fiesta
- Lo que toma se registra por el mismo chat ("me tomé una media de guaro y 4 polas"); el alcohol queda en `alcohol_g` y cuenta en las kcal del día (Fase 1 §5.5).
- Un día con más de 60 g de etanol queda marcado `fiesta` en `meals`; el pesaje del día siguiente pesa menos en la tendencia del peso.
- Presupuesto **semanal**: si hubo fiesta, el Coach sugiere repartir el exceso en los 3–4 días siguientes (sin bajar la proteína) y da consejos de antes/después (comer proteína antes, agua, dormir).

### 4.6 Tiempos
Mensaje con comida = chat (decide la herramienta) + lector + reordenador si hace falta + respuesta final ≈ **6–12 s**. Se pone `maxDuration = 60` en la ruta del chat. El resto de mensajes del Coach no cambia.

## 5. Interfaz (mínima, Fase 4)
- Todo pasa en `/ia`. El resumen de cada comida sale como texto normal del chat (sin tarjetas que haya que buscar).
- Lo único nuevo: una línea fija arriba del chat con **kcal y proteína de hoy** ("1.430 / 2.200 kcal · 98 / 170 g proteína"). Se puede dejar para después si Juan prefiere.
- Laura no ve ni la línea ni las herramientas.

## 6. Archivos
```
src/lib/nutrition/
  engine/           (Fase 2, sin cambios de fondo)
  db-server.ts      carga la base desde Firestore o .data/
  meals-store.ts    leer/escribir profile, meals, mealDrafts, bodyMeasurements
  targets.ts        objetivos diarios (Fase 1)  + targets.test.ts
  chat-tools.ts     definición y ejecución de las herramientas + chat-tools.test.ts
src/app/api/ai/chat/route.ts   herramientas + bloque de nutrición en el prompt
scripts/nutrition/upload_db.ts sube foods.json a Firestore
```

## 7. Pruebas
- Unidad (`node --test`): `targets` (casos de Juan de la Fase 1), `chat-tools` (no guardar sin presentar, corrección, solo Juan), `meals-store` con Firestore simulado.
- El banco de pruebas de la Fase 2 se corre antes de cada cambio del motor (`benchmark.ts --set dev`).
- Fase 6: 1–2 semanas de uso real de Juan, comparando su registro con lo que le parece correcto, y revisar las fallas raras (≈2 % pierde un alimento).

## 8. Riesgos
| Riesgo | Mitigación |
|---|---|
| La IA pierde o inventa un alimento (≈2 %) | Confirmación antes de guardar; el resumen lista cada alimento con sus gramos |
| El chat confunde una pregunta ("¿cuánta proteína tiene un huevo?") con un registro | La herramienta solo crea borradores; nada se guarda sin "sí" |
| Datos TCAC en un repo público | La base vive solo en Firestore y `.data/` (ignorado) |
| Arranque en frío lento | Base en memoria; ~1 s solo la primera vez |

## 9. ¿Google AI Plus / Antigravity en vez de Azure?
No sirve para esto:
- **La suscripción de Google (AI Plus/Pro) es para la app de Gemini y para AI Studio en el navegador.** No da acceso a la API para que otra aplicación la use; la API de Gemini se paga aparte con su propia clave.
- **Antigravity es un editor de código con agentes** (como Claude Code), sirve para programar, no para que la app de Juan analice comidas por dentro.
- Cambiar a la API de Gemini sería posible (tiene capa gratuita), pero habría que volver a medir todo el motor, y en la capa gratuita Google puede usar los datos para entrenar. Azure ya está pagado, funciona y pasó la meta.
