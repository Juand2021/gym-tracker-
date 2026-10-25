# Fase 4 — Frontend de Nutriverse (v2: Liquid Glass plateado)

> Fecha: 2026-10-25 · Estado: **plan v2, pendiente de aprobación de Juan**
> Reemplaza el plan v1 del mismo día. Base: las 3 imágenes de identidad que hizo Juan (`docs/nutricion/referencias/`) y `03-arquitectura.md`.

## 1. La visión (en palabras de Juan)

- **Vidrio por todas partes**, al nivel del *Liquid Glass* de Apple: se ve el fondo a través, con refracción, brillos y bordes de luz. Es lo más trabajado de la app.
- **Nada de minimalismo** (se siente desactualizado): íconos complejos, con muchas líneas y capas, bien diseñados pero legibles. Gráficas, logos y el botón central también de vidrio.
- **Blanco y plateado** como base, con **verde** como acento (las imágenes de referencia).
- **Futurista e identificable**: al verla, se reconoce como Nutriverse.
- **Animaciones muy suaves y optimizadas**.
- **El inicio es un velocímetro de calorías**: la aguja avanza con lo que va comiendo; en déficit hay que quedarse **por debajo del límite**; en volumen, **por encima del mínimo**.
- Chat, semana, progreso y perfil con la misma identidad. **El perfil mantiene las secciones de la referencia.**
- No es una copia del efecto de Apple: es un desarrollo propio que logre ese nivel.

## 2. Lo que dicen las referencias (inventario visual)

| Elemento | Cómo se ve en las imágenes | Qué haremos |
|---|---|---|
| Fondo | Metal líquido plateado con ondas suaves, gotas/burbujas de agua, hojas verdes difuminadas | Fondo animado propio en WebGL (§4.2), que es lo que se ve a través del vidrio |
| Paneles | Tarjetas de vidrio blanco translúcido, borde brillante grueso, sombra suave debajo, reflejo diagonal | "Vidrio de panel" (§4.3) |
| Botones | Píldoras de vidrio con volumen, brillo superior, borde verde cuando están activas | "Vidrio de botón" con presión animada |
| Botón central "+" | Esfera de vidrio verde con relieve, sobresale de la barra | Lente WebGL con refracción real (§4.4) |
| Barra de pestañas | Cápsula de vidrio flotante; la pestaña activa con un lente/burbuja | Barra con lente que se desliza y se puede arrastrar (como Fuerza, mucho más trabajada) |
| Íconos | Íconos 3D: objeto dentro de una burbuja de vidrio, con varias capas de brillo | Sistema de íconos en capas (§6) |
| Comida | Fotos de platos dentro de esferas de vidrio (desayuno = frutas, almuerzo = ensalada, cena = salmón) | Burbujas de comida (§6.3) |
| Gráficas | Anillos y líneas verdes sobre vidrio, con brillo | Gráficas de vidrio propias (§7) |
| Inicio | Velocímetro de vidrio con escala, zonas verde/roja, aguja de vidrio, etiqueta del límite | §5.1 |
| Tipografía | Sans geométrica redondeada, pesos ligeros en títulos, números grandes | Fuente nueva para Nutriverse (§3.3) |
| Perfil | Foto, nivel y puntos, logros, Mi perfil (datos, preferencias, objetivos, configuración), resumen de salud, frase | §5.6 |

## 3. Identidad

### 3.1 Nombre y logo
- **NutriVerse** (como en las imágenes: "Nutri" + "Verse"), con el ícono de hojas de vidrio.
- Lema de la referencia, opcional en la bienvenida: "Comida real. Vida mejor."

### 3.2 Colores
- **Base**: blancos fríos `#F7F9FA`, perla `#EEF1F3`, plata `#C9CED6`, plata oscura `#9AA1AB`, grafito para texto `#1F2428`.
- **Verde**: principal `#2E9E5B`, brillante `#5BD68A` (brillos y anillos), profundo `#1E6E41` (texto sobre vidrio verde).
- **Estados**: dentro de la meta → verde; acercándose → ámbar `#E9B44C`; pasado del límite → rojo coral `#E5604D` (la zona roja del velocímetro); alcohol/fiesta → violeta perla.
- **Vidrio claro**: blanco con 35–60 % de opacidad según la capa, borde de luz casi blanco, sombra de contacto gris-azulada.
- Nutriverse es **clara** y Fuerza es **oscura**: al cambiar de app hay una transición del fondo (el metal oscuro de Fuerza se aclara a plata) para que no deslumbre de golpe.

### 3.3 Tipografía
- Fuente geométrica redondeada, gratuita para la web, cercana a la referencia: **Outfit** (títulos, números grandes, ligera y amplia) + **Inter** o la misma Outfit para el texto. Se decide en el laboratorio comparándolas sobre el vidrio.
- Números con cifras de ancho fijo para que no "bailen" al animarse.

## 4. El motor de vidrio (lo más importante)

### 4.1 El problema técnico
- El efecto de Apple refracta (dobla) lo que está detrás. En la web, la técnica más conocida (filtros SVG con `backdrop-filter: url()`) **no funciona en Safari de iPhone**: se ve plano o no se ve. Como Nutriverse se usa sobre todo como app en el iPhone, esa técnica no sirve.
- WebGL (dibujar con la tarjeta gráfica) sí funciona en todos los navegadores, pero no puede "ver" el texto y las imágenes de la página.
- **La solución**: un motor en capas. Como **el fondo lo dibujamos nosotros**, el vidrio sí puede refractar el fondo de verdad con WebGL; y para el contenido que pasa por debajo (al hacer scroll) se usa el desenfoque nativo del navegador, que en iPhone es rápido.

### 4.2 Capa 0 · Fondo vivo (WebGL)
- Metal líquido plateado con ondas lentas (ruido de flujo), reflejos de luz y algunas gotas/burbujas; hojas verdes desenfocadas en las esquinas.
- Se mueve muy despacio; reacciona apenas al inclinar el teléfono (si el usuario lo permite) y al hacer scroll (paralaje leve).
- Optimización: resolución reducida (el fondo es suave, no necesita nitidez), 30–60 fps según el equipo, se pausa al ocultar la app, imagen fija si el usuario pide "reducir movimiento" o si el teléfono está en ahorro de energía.

### 4.3 Capa 1 · Vidrio de panel (CSS, todo el contenido)
Cada tarjeta, botón y barra se construye con las mismas capas:
1. **Desenfoque y saturación** de lo que hay detrás (`backdrop-filter`, rápido en iPhone).
2. **Cuerpo**: blanco translúcido con un degradado de grosor (más claro arriba, más denso abajo).
3. **Borde de luz**: un trazo brillante que se ilumina más en el lado de la luz, con un leve tinte de color en el borde (aberración cromática, como el vidrio real).
4. **Brillo especular**: una franja diagonal de luz que se mueve un poco con el scroll y la inclinación.
5. **Sombra interior y de contacto**: profundidad y "flotación" sobre el fondo.
6. **Grano finísimo**: evita que el degradado se vea en escalones.
- Tres grosores de vidrio (fino, medio, grueso) para jerarquía: barras y botones gruesos, tarjetas medianas, chips finos.
- Regla de rendimiento: como máximo ~8–10 superficies con desenfoque visibles a la vez; las que están fuera de la pantalla lo apagan.

### 4.4 Capa 2 · Lentes de vidrio con refracción real (WebGL)
Para las piezas protagonistas, un "lente" dibujado con un shader que dobla el fondo vivo:
- **Botón central "+"** (esfera verde), **lente de la pestaña activa**, **velocímetro** (cristal del dial y aguja), **anillos de gráficas** y **burbujas de comida**.
- El shader calcula: refracción según la curvatura del borde (más fuerte en los bordes, como una gota), aberración cromática ligera, brillo especular, sombra de contacto y un "menisco" de luz en el borde.
- Un único lienzo WebGL detrás de la interfaz dibuja todos los lentes en sus posiciones (sincronizadas con la página). Así es una sola carga para la tarjeta gráfica, no una por elemento.
- Si el equipo no soporta WebGL o va lento, cada lente cae a su versión CSS (§4.3) sin que se rompa nada.

### 4.5 Movimiento
- **Física de resortes** para todo lo que se mueve (aguja, lente de pestañas, botones al presionar, hojas que suben): movimientos con un rebote suave, sin tiempos rígidos.
- **Gelatina**: al presionar, el vidrio se aplasta un poco y vuelve; el lente de pestañas se estira mientras se arrastra (como en iOS).
- **Transiciones entre pantallas**: las tarjetas de vidrio se deslizan y se desenfocan al salir; el fondo no se corta nunca.
- Solo se animan propiedades baratas (posición, escala, opacidad); objetivo **60 fps** en un iPhone de hace 3 años.
- Respeta "reducir movimiento" y "reducir transparencia" del iPhone (versión más sólida y legible).

### 4.6 Legibilidad (que el vidrio no se coma el texto)
- Texto oscuro sobre vidrio claro, con una "capa de lectura" un poco más densa bajo los textos largos.
- Contraste mínimo AA en todos los textos, medido sobre la peor zona del fondo.
- Los números importantes (kcal, proteína) van en tarjetas de vidrio más densas.

## 5. Pantallas

**Pestañas** (como en la referencia, 5 lugares con el botón central): **Inicio · [Pestaña 2] · ( + ) · [Pestaña 4] · Perfil** — las pestañas 2 y 4 se deciden en §11.
El **"+"** central abre el **chat de registro** como una hoja de vidrio que sube desde abajo, con el teclado listo: es la acción más usada.

### 5.1 Inicio — el velocímetro
Basado en la imagen 3:
- Arriba: logo NutriVerse, saludo "¡Hola, Juan!", campana, **progreso de agua** (barra de vidrio con líquido que se mueve; tocar suma un vaso).
- **Velocímetro de vidrio** (pieza estrella):
  - Escala en kcal de 0 hasta ~1,5 × el objetivo, con marcas cada 250, en vidrio en relieve.
  - **Déficit**: zona verde de 0 al **límite** (objetivo del día), luego degradado a rojo. Etiqueta "Límite del déficit · 1.880 kcal". El objetivo es mantener la aguja en la zona verde.
  - **Volumen**: zona roja/ámbar hasta el **mínimo**, verde desde el mínimo hasta el tope del volumen (+10 %), ámbar después. Etiqueta "Mínimo del volumen". El objetivo es pasar la aguja por encima del mínimo.
  - **Mantenimiento/recomposición**: banda verde de ±5 % alrededor del objetivo.
  - **Aguja de vidrio** que gira con resorte al abrir la app y cada vez que se guarda una comida; un brillo recorre la escala hasta la nueva posición.
  - Centro: "**1.450** / 1.880 kcal" y un chip con el estado: "Déficit activo · ¡vas por buen camino!", "Cerca del límite", "Te pasaste 200 kcal", "Te faltan 400 kcal para tu mínimo".
  - El alcohol del día se muestra como una franja violeta dentro del recorrido de la aguja.
- **Cápsulas de comidas**: Desayuno, Almuerzo, Cena (y Snacks/Fiesta si hay) con su burbuja de comida y kcal; tocar abre el detalle. Una cápsula "**+ Añadir comida**".
- **Macros**: proteína, carbohidratos, grasa como tubos de vidrio con líquido que se llena; al lado, la tarjeta "**Faltan 550 kcal** para tu límite" (o "para tu mínimo" en volumen).
- **"¿Qué como ahora?"**: tarjeta con la sugerencia de la siguiente comida (del plan del día).

### 5.2 Chat (registro y asistente) — hoja de vidrio
- Burbujas de mensajes de vidrio (las del usuario en verde translúcido, las del asistente en vidrio blanco).
- **Tarjeta de borrador** (decisión de Juan): vidrio grueso con la lista de alimentos (burbuja de ícono + nombre + gramos + kcal), total grande, "te quedarían X kcal" con un mini velocímetro, y botones de vidrio **Guardar** (verde) / **Corregir** / **Descartar**. Al guardar: la tarjeta "se sella" con una animación y la aguja del Inicio se mueve.
- Tarjetas propias para: plan del día, comparación "¿qué pido?" (opciones lado a lado, la recomendada brilla), objetivos/perfil.
- Mientras piensa (~10 s): una burbuja de vidrio que "respira" con mensajes que cambian ("Buscando los alimentos…", "Calculando porciones…").
- Sugerencias de inicio en chips de vidrio.

### 5.3 Detalle de comida
- Encabezado con la burbuja grande del momento y la frase original; lista de alimentos con gramos, kcal y proteína; de dónde salieron los gramos.
- Acciones de vidrio: Corregir (abre el chat), Duplicar hoy, Borrar (con confirmación).

### 5.4 Estadísticas (semana / mes / trimestre)
Basado en "Tus estadísticas":
- Selector de vidrio **Semana · Mes · Trimestre** y rango de fechas con flechas.
- **Anillo de vidrio** con las kcal promedio vs objetivo, y las tres barras de macros con %.
- Tarjetas: **Peso actual** (con cambio), **Agua** (vs meta), **Días en meta** (en lugar de pasos, que no medimos; los pasos se agregan si algún día se conectan con el teléfono).
- **Barras por día** con la línea del límite y los días de fiesta marcados.
- **Evolución del peso** (los pesajes de Fuerza): línea verde de vidrio con su tendencia.
- **Distribución de macros**: dona de vidrio.
- **Balance**: "la fiesta del sábado sumó 1.400 kcal: repartidas en 4 días son ~350 menos por día".

### 5.5 Planes
- **Plan del día** (de `plan_comidas`): las comidas que faltan con 2 opciones cada una, en tarjetas con burbujas de comida, kcal y proteína; "Elegir" la manda al chat para registrarla cuando la coma.
- **"¿Qué pido?"**: escribir o dictar opciones de un menú y verlas comparadas.
- Más adelante (Fase 7): plan de la semana y lista de compras (como en la referencia).

### 5.6 Perfil (como en la referencia)
- **Encabezado**: foto (o avatar), nombre con hoja, lema ("Constancia · Disciplina · Resultados").
- **Nivel y puntos** con barra de vidrio, y **4 logros** en burbujas: días seguidos registrando, comidas registradas, semanas en meta, mejora continua. (Puntos por registrar y cumplir; sin castigos.)
- **Mi perfil** (lista de vidrio): Datos personales (edad, estatura, peso, grasa), Preferencias alimentarias (estilo, lo que no come), **Objetivos** (cambiar objetivo con vista previa en vivo de kcal/proteína/peso por semana), Configuración (unidades, notificaciones, privacidad, reducir movimiento).
- **Resumen de mi salud**: IMC, grasa corporal (medida o estimada), masa magra.
- Tarjeta con la frase ("No es una dieta, es un estilo de vida").
- Cada dato se edita en una **hoja de vidrio** que sube, con la validación del servidor.

### 5.7 Bienvenida (persona nueva)
- 3 pantallas a pantalla completa con el fondo vivo, el logo de vidrio que se arma y textos cortos (qué es, cómo se registra hablando, privacidad) → configuración del perfil por chat → **revelación del velocímetro** con su límite personal.

## 6. Íconos y gráficos

### 6.1 Estilo
Íconos "objeto dentro de vidrio": un objeto con volumen (hoja, plato, mancuerna, gota, llama…) dentro de una cápsula o esfera de vidrio, con varias capas: sombra interior, cuerpo con degradado, reflejos, borde de luz. Detallados pero que se lean a 24 px.

### 6.2 Cómo se fabrican
- **Íconos de interfaz** (pestañas, acciones, listas, logros): SVG en capas hechos a mano, con degradados y brillos, en 3 tamaños; se pueden animar (por ejemplo, la hoja se mueve al activarse la pestaña).
- **Burbujas de comida y logo** (lo más fotográfico de la referencia): imágenes de alta calidad con fondo transparente. Ver §11, pregunta de los recursos gráficos.
- Todos en un solo "set" con la misma luz (de arriba a la izquierda), para que se vean de la misma familia.

### 6.3 Burbujas de comida
Una por momento (desayuno, almuerzo, cena, snack, fiesta/bebida) y por grupo de alimento (proteína, cereal, fruta, verdura, lácteo, bebida, rápida…), usadas en cápsulas, el detalle y el chat.

## 7. Gráficas de vidrio
- Velocímetro, anillos, barras, línea de peso y dona: dibujadas a medida (SVG + capa de brillo, y lente WebGL en las principales), con el mismo vidrio y animación de resorte.
- No se usan gráficas genéricas: Recharts se puede usar solo para calcular escalas si conviene.

## 8. Arquitectura del código del frontend
- `src/app/(nutriverse)/…` pantallas; `src/components/nutriverse/glass/` el motor de vidrio:
  - `GlassBackground` (Capa 0, WebGL) · `GlassSurface` (Capa 1, CSS; props: grosor, tinte, brillo) · `GlassLensLayer` + `useGlassLens()` (Capa 2, un solo lienzo WebGL, registro de lentes por posición) · `useSpring()` (física de resortes) · `useMotionPrefs()` (reducir movimiento/transparencia, ahorro de energía) · `useTilt()` (inclinación, opcional).
  - Componentes: `NvGauge`, `NvTabBar`, `NvFab`, `NvCapsule`, `NvTube` (macro con líquido), `NvRing`, `NvBars`, `NvLine`, `NvDonut`, `NvSheet`, `NvSegmented`, `NvDraftCard`, `NvPlanCard`, `NvCompareCard`, `NvAchievement`, `NvIcon`.
- Tokens de diseño (colores, grosores de vidrio, radios, sombras, resortes) en un archivo; Nutriverse no toca los estilos de Fuerza.
- Sin librerías pesadas: WebGL propio (o una mini librería como OGL, ~30 KB) para los shaders; resortes propios.
- Rutas de servidor nuevas: día por fecha, semana/mes/trimestre, progreso (pesos + medidas), detalle/borrado/duplicado de comida, agua, logros/puntos, perfil completo con vista previa de objetivos, tarjetas estructuradas en los mensajes del chat.

## 9. Calidad y rendimiento
- **Presupuesto**: 60 fps al hacer scroll y animar en iPhone 12 o posterior; primera pantalla en < 1,5 s con caché; el fondo y los lentes en un solo lienzo; nada de saltos de diseño.
- **Pruebas en iPhone real** (Juan) en cada etapa: fluidez, calor/batería (sesión de 5 min), legibilidad al sol.
- **Pruebas automáticas** (Playwright) de cada pantalla en tamaños 375/390/430 y en estados: vacío, normal, fiesta, volumen, perfil incompleto, error, "reducir movimiento".
- **Medición** de cuadros por segundo con una herramienta de diagnóstico propia (solo en desarrollo).
- Accesibilidad: contraste AA, botones ≥ 44 px, lector de pantalla en el velocímetro ("1.450 de 1.880 kcal, dentro del límite").

## 10. Etapas

| Etapa | Entrega | Cómo lo evalúa Juan |
|---|---|---|
| **4a · Laboratorio de vidrio** | Una página de prueba (enlace para abrir en el iPhone) con el fondo vivo, los 3 grosores de vidrio, el botón "+" con refracción, la barra de pestañas con lente arrastrable y el velocímetro animado. Dos variantes de intensidad del vidrio | Lo abre en su iPhone: ¿se siente como lo imagina? ¿va fluido? Elige intensidad y tipografía |
| **4b · Prototipo de pantallas** | Las 6 pantallas (Inicio, Chat, Estadísticas, Planes, Perfil, Bienvenida) con datos de ejemplo, navegables, con el vidrio del laboratorio | Aprueba o pide cambios de diseño antes de conectarlas |
| **4c · Íconos y recursos** | Set de íconos SVG en capas + burbujas de comida + logo e ícono de la app | Aprueba el set |
| **4d · Inicio + "+"/Chat conectados** | Velocímetro con sus datos reales, cápsulas, macros, agua; chat en hoja de vidrio con tarjetas | Lo usa en localhost con su cuenta |
| **4e · Estadísticas + Planes** | Semana/mes/trimestre, peso, balance de fiestas; plan del día y "¿qué pido?" | Lo usa |
| **4f · Perfil + bienvenida** | Perfil con nivel, logros, datos, objetivo con vista previa; bienvenida | Lo usa |
| **4g · Pulido y rendimiento** | Transiciones, accesibilidad, pruebas en tamaños de iPhone, ajuste de rendimiento | Aprueba la fase |

Después: **Fase 6 · Validación** (1–2 semanas de uso real).

## 11. Decisiones pendientes
1. **Pestañas 2 y 4**: la referencia muestra *Recetas* y *Planes*. Propuesta: **Inicio · Estadísticas · (+) · Planes · Perfil**, con *Recetas* para la Fase 7 (necesita una base de recetas que hoy no tenemos).
2. **Recursos gráficos** (burbujas de comida, logo, íconos 3D): **(a)** Juan los genera con la misma herramienta de IA con la que hizo las referencias, siguiendo una ficha que le preparo (tamaños, fondo transparente, luz, lista exacta); **(b)** los dibujo yo en SVG en capas (más ligeros y animables, menos fotográficos); **(c)** mezcla: íconos de interfaz en SVG y burbujas de comida/logo con su herramienta.
3. **Foto de perfil**: subir foto propia (necesita guardarla) o avatar de vidrio con la inicial.
4. **Nivel y puntos**: ¿se quedan (motivan) o solo logros sin puntos?
5. **Ubicación** ("Bogotá, CO" en la referencia): ¿mostrarla? (pide permiso de ubicación; propuesta: no).
