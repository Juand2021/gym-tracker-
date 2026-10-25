# Plan: App de Nutrición dentro de Gym Tracker ("Fuerza" + "Comidas")

## Contexto
Juan quiere controlar su alimentación diaria (déficit desde 2026-10-24, viaje 2026-11-14; luego volumen/mantenimiento) en una **segunda app dentro de Gym Tracker**, a la que se entra por un ícono y que está conectada con Fuerza. El registro es por **chat con el LLM actual (Azure `gpt-5-mini`, confirmado en `.env.local`)**. Objetivo de producto: escalable a más usuarios.

Regla de trabajo: **al entrar a cada fase, Claude resume lo que hará y hace preguntas; Juan aprueba y recién ahí se ejecuta.**

## Decisiones tomadas
- Colombia; solo Juan por ahora, diseño multiusuario.
- Seguimiento: kcal, proteína, carbohidratos, grasa, fibra, agua y alcohol.
- LLM interpreta → gramos → base de datos → cálculo en código → **confirmación obligatoria antes de guardar**.
- **Perfil único en servidor** compartido por Fuerza y Comidas (sexo, nacimiento, estatura, % grasa opcional, actividad, sueño, alcohol, creatina, fase). Peso y días/duración de entreno salen del historial real (últimas 4–6 semanas).
- **Medidas corporales** (cintura, cuello y también bíceps, pierna, etc.) en el perfil compartido: Comidas las usa para estimar % grasa (RFM/Navy) y Fuerza para ver crecimiento muscular.
- La app recomienda fase, kcal y macros (reglas en `docs/nutricion/01-investigacion.md`, ritmo de déficit por defecto 0,7 %/semana).
- **Modo fiesta:** registrar qué y cuánto se tomó; impacta objetivo diario y semanal; consejos antes/después.
- **Modo consulta ("¿qué pido?"):** el usuario describe opciones de menú y el LLM recomienda según las calorías/macros que le quedan y la fase.
- **Sin MVP apresurado:** la app debe quedar pulida; Juan arranca el déficit ya con los números provisionales del informe.
- **El motor de alimentos (precisión) es el módulo más crítico** → fase propia antes de la arquitectura.

## Fases
- **Fase 0 — Discovery** ✅ `docs/nutricion/00-discovery.md`
- **Fase 1 — Investigación nutricional** ✅ `docs/nutricion/01-investigacion.md`
- **Fase 2 — Motor de alimentos y precisión (NUEVA, prioridad máxima)**
  - 2a. Investigar opciones open source / gratuitas: bases de datos (USDA FDC, Open Food Facts, TACO/TBCA Brasil, SMAE México, CIQUAL, otras con alimentos latinos), APIs con capa gratuita (FatSecret, Edamam, Nutritionix…), cómo lo hacen Fitia/MacroFactor/Cal AI, y proyectos open source de food logging con LLM. Cómo ampliar la tabla colombiana más allá de 150–300 alimentos.
  - 2b. Meta acordada (doble): con gramos dados ≥90 % de comidas dentro de ±10 % kcal; con porciones vagas ≥80 % dentro de ±20 %. Juan **no pesará** comidas (come mucho en restaurantes): el set de referencia se arma con porciones estándar ICBF/GABA y recetas publicadas; las cantidades que Juan diga a ojo se toman como verdad de entrada.
  - Restricciones: solo fuentes gratuitas/open source; foto queda para Fase 7.
  - 2c. Prototipo del pipeline + **banco de pruebas automatizado** que mida el error contra el set de referencia; iterar prompts, porciones por defecto y búsqueda hasta alcanzar la meta.
  - Entregable: `docs/nutricion/02-motor-alimentos.md` + resultados del benchmark.
- **Fase 3 — Arquitectura** (aprobación de Juan): perfil único, medidas, modelo de datos, pipeline, modos fiesta/consulta, integración con Coach IA. `docs/nutricion/03-arquitectura.md`.
- **Fase 4 — Frontend**: requerimientos de Juan + mockups Liquid Glass/iPhone. `docs/nutricion/04-frontend.md`.
- **Fase 5 — Implementación** por sub-fases probadas: perfil+medidas → objetivos/TDEE → motor de alimentos productivo → chat de registro → pantalla del día → modo fiesta → modo consulta → historial/TDEE adaptativo → integración con Fuerza.
- **Fase 6 — Validación real** (1–2 semanas de uso en iPhone, recalibración).
- **Fase 7 — Mejoras** (foto, código de barras, comidas frecuentes, transición de fases).

## Reutilizar
- Cliente LLM: `src/app/api/ai/chat/route.ts:12-37`, `src/app/api/ai/analyze/route.ts` (pasar a Structured Outputs).
- Persistencia: `src/lib/data.ts`, `src/lib/firebase.ts`, `src/lib/local-store.ts`; perfiles con `profileFromRequest` (`src/lib/request-profile.ts`).
- Peso: `/api/body-weight`; ajustes actuales en `src/context/AppSettingsContext.tsx` (migrar).
- Nav: `src/components/AppNav.tsx`, `LiquidTabBar.tsx`; estilos `src/app/globals.css`.
- Tests: `node --test` sobre `src/lib/*.test.ts`. Leer `node_modules/next/dist/docs/` antes de escribir código Next (AGENTS.md).

## Verificación
- Fases documentales: Juan aprueba cada `.md`.
- Motor de alimentos: script de benchmark reproducible con métricas (MAPE de kcal y % de comidas dentro de la tolerancia acordada).
- Implementación: `npm test`, `npm run build`, preview móvil 375 px.
