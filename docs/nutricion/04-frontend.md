# Fase 4 — Frontend de Nutriverse

> Fecha: 2026-10-25 · Estado: **plan propuesto, pendiente de aprobación de Juan**
> Antes: `03-arquitectura.md` (Nutriverse es una app aparte de Fuerza, con su propio chat).

## 1. Decisiones de Juan (2026-10-25)

| Tema | Decisión |
|---|---|
| Nombre | **Nutriverse** (logo, menú "Tus apps", ícono, títulos) |
| Colores | **Blanco, gris, plateado y verde** |
| Resumen al registrar una comida | **Tarjeta compacta** dentro del chat (alimentos con gramos y kcal, total, botones Guardar / Corregir) |
| Proceso | **Primero diseños** (prototipo de las pantallas) → Juan aprueba o pide cambios → se construye |
| Registro de comidas | Por el chat (decisión de la Fase 3), sin tener que buscar tarjetas en otras pantallas |
| Usuarios | Pensado para **cualquier persona** (perfil, objetivo y bienvenida guiada ya implementados) |

## 2. Objetivos del frontend

1. **Registrar una comida en menos de 15 segundos** de esfuerzo: escribir como se habla → ver la tarjeta → "Guardar".
2. **Saber cómo vas con una mirada**: al abrir la app, las calorías y la proteína del día se entienden sin leer.
3. **Saber qué comer**: el plan del día y "¿qué pido?" a un toque.
4. **Ver el progreso** de semanas: peso, medidas, días de fiesta, si la tendencia va hacia la meta.
5. **Que se sienta hermana de Fuerza** (mismo vidrio, tipografías, gestos y barra de pestañas) pero que **al cambiar de app se note** en cuál estás.
6. Hecha para **iPhone en modo app** (pantalla completa, zonas seguras, teclado), que también funcione en el computador.

## 3. Identidad visual

### 3.1 Nombre y logo
- Logo de texto en la misma tipografía de "FUERZA." (Bebas Neue): **NUTRIVERSE.** con el punto en verde.
- "NUTRIVERSE" es más largo que "FUERZA": en pantallas angostas se verifica que el logo + el menú desplegable + la cápsula de perfil quepan; si no, se reduce el tamaño del logo solo en Nutriverse.
- Ícono de la app (menú "Tus apps" y pantalla de inicio): plato/hoja estilizado en plata con un detalle verde, mismo estilo de ícono de vidrio que el de Fuerza.

### 3.2 Paleta (blanco, gris, plateado y verde)
Se proponen **dos direcciones** y se eligen viéndolas en los diseños:

| | A · Grafito plateado (oscuro) | B · Plata clara |
|---|---|---|
| Fondo | Grafito casi negro con un brillo plateado frío arriba | Blanco roto / gris muy claro |
| Vidrio | Paneles de vidrio gris humo con borde plateado | Paneles blancos translúcidos con borde gris plata |
| Texto | Blanco y grises | Gris carbón y grises medios |
| Acento | **Verde** (botones principales, barras, el punto del logo) | **Verde** más profundo para que contraste sobre claro |
| Ventaja | Hermana directa de Fuerza (que es oscura); cambio de app suave | Se diferencia muchísimo de Fuerza; muy "salud" |
| Riesgo | Puede parecerse demasiado a Fuerza si el verde es tímido | Pasar de Fuerza (oscura) a una app clara puede deslumbrar de noche |

Tonos de partida (se ajustan en el prototipo):
- Plata: `#C9CED6` (bordes, brillos), gris medio `#8A9099`, gris oscuro `#2A2E34`, grafito `#0E1013`.
- Verde: `#3DDC84` (acento en oscuro) / `#1E9E5A` (acento en claro); verde suave para fondos de "en meta".
- Colores de estado (los mismos en toda la app): **en meta** verde · **cerca** gris plata · **te pasaste** ámbar suave (no rojo, para no regañar) · **alcohol/fiesta** violeta tenue.
- Los macros tienen color fijo en todas las pantallas: proteína (verde), carbohidratos (plata), grasa (gris cálido), alcohol (violeta).

### 3.3 Tipografía y estilo
- Las mismas fuentes de Fuerza: **Bebas Neue** (títulos y números grandes) y **Barlow** (texto).
- Números grandes "tabulares" (no bailan al cambiar).
- Mismo lenguaje de íconos de línea (sin emojis), radios grandes, vidrio con borde de luz, barra de pestañas Liquid Glass con la lente que se desliza.
- Animaciones cortas y con rebote suave (como la barra de Fuerza); respetan "reducir movimiento" del iPhone.

## 4. Navegación

**Menú del logo** (ya existe): "Tus apps" → FUERZA / NUTRIVERSE.

**Pestañas de Nutriverse** (barra inferior, 5 como máximo para que quepan):

| Pestaña | Para qué | Pantalla |
|---|---|---|
| **Hoy** | Cómo voy y qué comí hoy | §5.1 |
| **Chat** | Registrar, preguntar, "¿qué como?" | §5.2 |
| **Semana** | Los últimos días: si cumplí, fiestas, promedio | §5.4 |
| **Progreso** | Peso, medidas, tendencia hacia la meta | §5.5 |
| **Perfil** | Mis datos y mi objetivo | §5.6 |

Botón flotante o principal "**+ Comida**" en Hoy que lleva directo al Chat con el teclado abierto.

## 5. Pantallas

### 5.1 Hoy (inicio)
**Arriba — el día en una mirada**
- **Anillo grande de calorías**: lo consumido llena el anillo; en el centro "**1.240** de 1.880 kcal" y debajo "te quedan 640".
- **Tres barras de macros** debajo del anillo: proteína (la más importante, primero y más grande), carbohidratos, grasa. Fibra y agua como datos pequeños.
- Si hubo alcohol: chip con ícono de copa (de línea) "**86 g de alcohol · día de fiesta**" en violeta tenue.
- Chip de la fase: "Déficit grande · faltan 20 días".

**Plan / sugerencia**
- Tarjeta "**¿Qué como ahora?**" con la sugerencia para la siguiente comida (de `plan_comidas`): "Cena: pechuga 150 g + arepa + ensalada · 520 kcal · 45 g prot". Toque → abre el Chat con el plan completo.

**Comidas de hoy**
- Agrupadas por momento: Desayuno · Almuerzo · Algo entre comidas · Cena · Fiesta.
- Cada comida: hora, frase original ("almorcé un corrientazo…"), kcal y proteína; toque → **detalle** (§5.3).
- Estados: sin comidas ("Cuéntale al chat qué comiste") · perfil incompleto (la tarjeta "Configura tu perfil" que ya existe) · cargando (esqueletos del mismo tamaño, sin saltos).

**Navegar días**: flechas o deslizar ← → para ver ayer/anteayer con la misma pantalla.

### 5.2 Chat
- Lo que ya existe (historial, nueva conversación, respuestas rápidas), con el estilo de Nutriverse.
- **Tarjeta de borrador** (decisión de Juan) cuando el asistente analiza una comida:
  ```
  ┌──────────────────────────────────────┐
  │ ALMUERZO · BORRADOR                   │
  │ Arroz blanco ............ 180 g  275 │
  │ Fríjoles ................ 150 g  206 │
  │ Pechuga a la plancha .... 130 g  212 │
  │ ─────────────────────────────────── │
  │ 693 kcal · 57 g proteína             │
  │ Te quedarían 1.187 kcal hoy          │
  │ Supuse porciones típicas de almuerzo │
  │ [ Guardar ]  [ Corregir ]  [ ✕ ]     │
  └──────────────────────────────────────┘
  ```
  - **Guardar** envía "Sí, guárdalo"; **Corregir** pone el cursor en la caja con "Corrige: "; **✕** descarta.
  - Al guardar, la tarjeta cambia a "✓ Guardado" (verde) y la cifra del día se actualiza.
  - Los alimentos "sin coincidencia" o con supuesto importante se marcan con un punto plata y su nota.
- **Tarjetas de otras respuestas**: plan del día (comidas con opciones), "¿qué pido?" (comparación lado a lado con la recomendada resaltada), perfil/objetivos (números con su explicación).
- Sugerencias de inicio: "¿Qué como hoy?", "Almorcé…", "¿Cómo voy?", "Quiero cambiar mi objetivo".
- Indicador de espera con texto que cambia ("Buscando los alimentos…", "Calculando…") porque una comida tarda ~10 s.

### 5.3 Detalle de una comida
- Encabezado: momento, fecha y hora, frase original.
- Lista de alimentos: nombre, gramos, kcal, proteína; de dónde salieron los gramos ("dijiste 200 g", "porción típica", "estimado").
- Totales y macros de esa comida.
- Acciones: **Corregir por chat** (abre el chat con la comida cargada), **Duplicar hoy** (para "lo mismo de ayer"), **Borrar** (con confirmación).

### 5.4 Semana
- **Barras de 7 días** (calorías vs la línea del objetivo) con color por estado (en meta / cerca / te pasaste); los días de fiesta con su marca.
- Promedio de la semana: kcal y proteína, y **días que cumplió la proteína**.
- **Balance de la semana**: "vas 1.200 kcal por debajo de lo planeado ✓" o "la fiesta del sábado sumó 1.400 kcal: repartidas en 4 días son ~350 menos por día".
- Toque en un día → abre ese día en "Hoy".

### 5.5 Progreso
- **Peso** (los pesajes son los mismos de Fuerza): puntos diarios + línea de tendencia suavizada; meta y fecha meta si hay.
- Ritmo real vs planeado: "bajando 0,6 kg/semana (plan: 0,8)".
- **Medidas** (cintura, cuello, bíceps, muslo, cadera) y **grasa estimada** con cinta, como líneas pequeñas.
- **Mantenimiento según tu registro** (TDEE adaptativo, Fase 7) cuando haya 14+ días de datos; antes, un aviso "se calcula con 2 semanas de registro".
- Botones: "Registrar peso" y "Registrar medidas" (formularios cortos, sin chat).

### 5.6 Perfil y objetivo
- **Objetivo actual** arriba, grande: tipo, ritmo, fechas, meta con sus palabras.
- **Cambiar objetivo** visual: 4 tarjetas (Déficit · Mantener · Recomposición · Volumen); al elegir déficit/volumen, selector de ritmo (suave · moderado · grande) que muestra en vivo **cuántas kcal y proteína** quedarían y **cuánto peso por semana**.
- **Mis números explicados**: gasto en reposo → mantenimiento → ajuste por objetivo → objetivo diario, como una escalera simple; "estimación ±10 %, se ajusta con tu peso".
- **Mis datos**: sexo, fecha de nacimiento, estatura, peso, grasa, actividad, entrenos, estilo de alimentación, alimentos que no como, comidas al día. Cada dato editable en una hoja inferior (bottom sheet), con la misma validación del servidor.
- Edad y estatura son las mismas que en Fuerza.

### 5.7 Bienvenida (persona nueva)
- Hoy ya muestra "Configura tu perfil". Se añade una **bienvenida de 3 pantallas** la primera vez (qué es Nutriverse · cómo se registra hablando · tu privacidad) que termina en el chat con el mensaje listo.
- La configuración del perfil sigue por chat (pocas preguntas a la vez); al final, una **tarjeta de resultado** con sus números y el botón "Ver mi plan de hoy".

## 6. Componentes reutilizables (librería Nutriverse)
- `NvRing` (anillo de calorías), `NvMacroBar`, `NvStat` (número grande + etiqueta), `NvChip` (fase, fiesta, estado).
- `NvMealRow` (comida en lista), `NvFoodLine` (alimento · gramos · kcal), `NvDraftCard`, `NvPlanCard`, `NvCompareCard`, `NvTargetsCard`.
- `NvSheet` (hoja inferior para editar), `NvSegmented` (selector de ritmo / día), `NvEmpty`, `NvSkeleton`.
- `NvWeekBars`, `NvTrendChart` (con la librería de gráficas que ya usa Fuerza: Recharts).
- Tokens de diseño (colores, radios, sombras, tiempos de animación) en un solo lugar, separados de los de Fuerza (`data-app="nutriverse"` en la página).

## 7. Datos que necesita el frontend (servidor)
| Pantalla | Qué falta | Cambio |
|---|---|---|
| Chat | Que la respuesta traiga la tarjeta (borrador, plan, comparación, objetivos) además del texto | Guardar en cada mensaje del asistente un `card` con los datos de la herramienta |
| Hoy | Sugerencia de la siguiente comida; navegar por días | `GET /api/comidas/day?date=` (generaliza `today`) + primer bloque de `plan_comidas` |
| Detalle | Leer, borrar y duplicar una comida | `GET/DELETE /api/comidas/meals/[id]`, `POST …/duplicate` |
| Semana | Totales por día y balance | `GET /api/comidas/week?end=` |
| Progreso | Pesos, medidas, tendencia | `GET /api/comidas/progress` (pesos de Fuerza + medidas + tendencia) |
| Perfil | Leer/editar todo el perfil y previsualizar objetivos | `GET/PUT /api/comidas/profile` (completo) + `POST …/preview` (calcula sin guardar) |

## 8. Calidad
- **iPhone primero**: 390 × 844 (iPhone 14/15) como referencia; probar también 375 (SE) y 430 (Pro Max); zonas seguras, teclado, pantalla completa.
- **Accesibilidad**: contraste AA (importante en la opción clara con plata), textos ≥ 15 px, botones ≥ 44 px, lectores de pantalla en anillos y barras, "reducir movimiento".
- **Rendimiento**: la pantalla Hoy se pinta desde caché al instante y se actualiza después (como Fuerza); nada de saltos de diseño.
- **Pruebas visuales automáticas** (Playwright) de cada pantalla en tamaño iPhone, en estados: vacío, normal, fiesta, perfil incompleto, error.
- Fuerza no cambia (salvo el menú del logo).

## 9. Plan de trabajo

| Etapa | Qué se entrega | Aprobación |
|---|---|---|
| **4a. Diseños** | Prototipo navegable (página web en tamaño iPhone) con las pantallas Hoy, Chat (con tarjeta de borrador), Semana, Progreso y Perfil, en **las dos paletas** (A grafito plateado / B plata clara), con datos de ejemplo realistas | Juan elige paleta y pide cambios |
| **4b. Base visual** | Tokens de Nutriverse, logo, ícono, barra de pestañas de 5, componentes de §6 | — |
| **4c. Hoy + Chat** | Anillo, macros, sugerencia, comidas por momento, navegación por días; tarjetas en el chat (borrador, plan, comparación) | Juan prueba en localhost |
| **4d. Semana + Progreso** | Barras semanales, balance de fiestas, peso y medidas, formularios cortos | Juan prueba |
| **4e. Perfil + bienvenida** | Objetivo visual con vista previa, datos editables, bienvenida de 3 pantallas | Juan prueba |
| **4f. Pulido** | Animaciones, estados vacíos/errores, accesibilidad, pruebas visuales, revisión en iPhone | Juan aprueba la fase |

Después de 4f: **Fase 6 (Validación)** — 1–2 semanas de uso real de Juan.

## 10. Fuera de esta fase (ideas para la Fase 7)
Foto de la comida, código de barras de productos, comidas favoritas/frecuentes con un toque, recordatorios (agua, proteína de la noche), exportar datos, TDEE adaptativo completo, modo "antes de la fiesta".

## 11. Preguntas abiertas (se responden con los diseños)
1. Paleta: **A (grafito plateado)** o **B (plata clara)**.
2. ¿5 pestañas (Hoy · Chat · Semana · Progreso · Perfil) o 4 juntando Semana y Progreso?
3. ¿El ícono del menú "Tus apps" debe tener el nombre completo "NUTRIVERSE" o solo "NUTRI"?
