# Fase 0 — Discovery

> Fecha: 2026-10-24 · Estado: **cerrada**

## 1. Decisiones de producto

| Tema | Decisión |
|---|---|
| País / base de alimentos | Colombia → Tabla de Composición de Alimentos Colombianos (ICBF) como principal; USDA FoodData Central y Open Food Facts de respaldo |
| Usuarios | Solo Juan por ahora, **pero diseñado para muchos usuarios** (posible lanzamiento a más personas) |
| Qué se registra | Calorías, proteína, carbohidratos, grasas, fibra, agua |
| Cómo se calcula | El LLM interpreta el texto y estima gramos; los nutrientes salen de la base verificada |
| Quién decide los objetivos | **La app** recomienda fase (volumen/déficit/mantenimiento), calorías y macros a partir del perfil y la evidencia. El usuario puede aceptar o ajustar |

## 2. Requisito nuevo: Perfil único compartido (Fuerza + Comidas)

Hoy la edad y la altura viven en `localStorage` del navegador (`AppSettingsContext.tsx`), y el peso en `/api/body-weight`. Eso no sirve para dos apps ni para varios usuarios.

**Se necesita un perfil en el servidor (Firestore / fallback local), por usuario, que lean ambas apps:**

- Sexo, fecha de nacimiento (edad calculada), estatura
- Peso actual → se toma del último registro de peso (no se duplica)
- % de grasa corporal: **opcional**; si no hay número, una estimación cualitativa (p. ej. "alto, sin sobrepeso") o estimación por medidas (cintura/cuello, método US Navy) — a definir en Fase 1
- Nivel de actividad fuera del gym y pasos aproximados
- Días y duración de entreno → **se calculan con el historial real de Fuerza** (promedio de las últimas 4–6 semanas). Lo que dice el usuario solo se usa como valor inicial si no hay historial
- Sueño promedio y hábitos de alcohol (frecuencia y si son ocasiones fuertes)
- Fase actual y objetivo (con fechas)
- Suplementos relevantes (p. ej. creatina)

Se migra lo que hoy está en `localStorage`. Esto se diseña en la Fase 2 (Arquitectura) y se implementa en la 4a.

## 3. Perfil de Juan

| Dato | Valor |
|---|---|
| Sexo | Hombre |
| Nacimiento / edad | 2001-10-15 → 25 años |
| Estatura | 179 cm |
| Peso | Último registro en la app (confirmado al día) |
| % grasa | Desconocido. Percepción: alto sin sobrepeso. Sin abdomen marcado, algo de barriga, cara llena, **mucha acumulación en el pecho** |
| Entreno | ≥ 4 días/semana, ~1 h 30 min por sesión (verificable en Fuerza) |
| Actividad fuera del gym | Sedentaria (oficina, sentado todo el día), ~3.000–4.000 pasos/día |
| Sueño | 7–8 h por noche |
| Alcohol | 1–2 veces/semana, normalmente fiesta fuerte (consumo alto por ocasión) |
| Suplementos | Creatina. Acaba de dejar un ganador de peso (proteína hipercalórica) |
| Alergias / restricciones | Ninguna, come de todo |

## 4. Objetivo

- **Fin del volumen: hoy (2026-10-24). Empieza déficit hoy.**
- Meta: bajar grasa (sobre todo abdomen y pecho) **sin perder mucho peso ni fuerza**, y seguir progresando en el gym.
- Hito: viaje el **2026-11-14** (21 días, 3 semanas); quiere llegar lo más definido posible.

### Expectativas realistas (a confirmar con la investigación de la Fase 1)
- Las guías para quien entrena recomiendan perder **~0,5–1 % del peso por semana** para conservar músculo. En 3 semanas eso son unos **1–2 kg de grasa** (más algo de agua al inicio): se nota la diferencia, pero con el % de grasa alto que describes es poco probable tener los abdominales marcados para el viaje. Es un primer bloque; el proceso completo puede llevar varios meses.
- **Pecho:** puede ser grasa (pseudoginecomastia, baja con el déficit) o tejido glandular (ginecomastia, que no baja con la dieta). Si al tocar sientes un disco firme o gomoso detrás del pezón, conviene consultarlo con un médico. La app no puede distinguir los dos casos.
- **Cara llena:** depende de la grasa y también del sodio y el agua; mejora con el déficit.
- **Creatina:** retiene 1–2 kg de agua en el músculo. Es normal y hay que tenerlo en cuenta al leer la báscula. No se recomienda dejarla.

## 5. Patrón de alimentación

- **Desayuno:** opcional, a veces se lo salta sin problema. Típico: arepa con huevos + Milo.
- **Almuerzo:** la comida principal. "Almuerzo corriente" colombiano.
- **Cena:** siempre come; tiene mucha hambre de noche. Sobras del almuerzo o domicilios de comida rápida.

**Para el diseño:** el hambre nocturna es clave en el déficit. Conviene dejar calorías y proteína para la noche, y saltarse el desayuno puede servir (los estudios de ayuno intermitente muestran resultados parecidos con las mismas calorías).

## 6. Set de calibración (para Fase 5)
Comidas típicas que el chat debe saber estimar bien:
1. Arepa con huevos (fritos/pericos) + Milo con leche
2. Almuerzo corriente: sopa, arroz, frijoles o lentejas, carne/pollo/cerdo, plátano maduro o patacón, ensalada, jugo
3. Cena de sobras (porción de almuerzo sin sopa)
4. Domicilios: hamburguesa, pizza, salchipapa, pollo frito/asado, perro caliente
5. Snacks frecuentes (a completar con el uso)

El almuerzo corriente es lo más difícil de estimar (porciones variables) → la app necesitará **porciones típicas colombianas por defecto** y preguntar solo cuando haya mucha incertidumbre.

## 7. Puntos de atención para el plan
- **Alcohol:** 1–2 fiestas fuertes por semana pueden sumar 1.000–2.000 kcal cada una (7 kcal por gramo de alcohol, más mezcladores y la comida de después) y afectan la recuperación y la síntesis de proteína. La app debe **registrar alcohol** y la Fase 1 debe investigar cómo manejarlo en déficit.
- **Viaje en 3 semanas:** hay que equilibrar un déficit agresivo pero seguro con no perder fuerza.
- **Escalabilidad:** todos estos datos (sueño, alcohol, actividad) se guardan en el perfil para que la app genere el plan sola para cualquier usuario.
