# Firebase: uso de la cuota (Fuerza + NutriVerse)

> Fecha: 2026-10-25 · Estado: **código listo y publicado; falta correr la migración y medir con la cuota reiniciada**

## 1. Qué pasó
El 2026-10-25 el chat de NutriVerse empezó a responder `8 RESOURCE_EXHAUSTED: Quota exceeded`. Firestore, en el plan gratuito (Spark), permite por día **50.000 lecturas, 20.000 escrituras y 20.000 borrados**. Al pasarse, **toda lectura falla** hasta que la cuota se reinicia a medianoche de California (~2:00 a. m. en Colombia). La falla afecta a Fuerza, NutriVerse, local y Vercel, porque todos usan la misma base (`gym-tracker-fd03b`).

## 2. La causa
Cada **serie** de un entreno era un documento aparte (`workouts/{id}/sets/{setId}`), y en Firestore cada documento leído cuenta. `listWorkouts` traía hasta 80 entrenos y **todas sus series**: con ~40 entrenos de ~20 series, ~840 lecturas cada vez. Esa función se llamaba:
- en cada apertura de Inicio, Historial, Métricas, Entreno y el panel de perfil de Fuerza. La caché del navegador pintaba lo guardado, pero siempre volvía a pedir los datos;
- en cada mensaje del Coach IA de Fuerza;
- en NutriVerse, para calcular los objetivos del día: Inicio, Estadísticas, Perfil y **varias veces por cada mensaje del chat**.

Con unas decenas de usos al día se llegaba a 50.000. El problema no era Firebase sino cuánto se leía.

## 3. Decisión
| Opción | Veredicto |
|---|---|
| **Arreglar el código y seguir en Firebase gratis** | ✅ Elegida: ataca la causa; el uso baja ~95 % |
| Plan Blaze (pago por uso) | Red de seguridad **recomendada** después del arreglo. La base no se bloquea; las primeras 50.000 lecturas diarias siguen siendo gratis y después cuesta ~US$0,06 por 100.000. La activa Juan (pide tarjeta), con una alerta de presupuesto de US$1 |
| Migrar a otra base (Supabase, Neon, Turso, Atlas) | ❌ Mucho trabajo y riesgo de romper Fuerza; el código ineficiente sería igual de caro allá |

## 4. Qué se cambió
1. **Series dentro del entreno.** Los entrenos nuevos y editados guardan sus series en un campo `sets` del documento: leer un entreno cuesta **1 lectura**.
   - Durante la transición también se escriben en la subcolección como antes, con los mismos ids. Así se puede volver atrás sin perder nada, y editar o borrar no necesita leer la subcolección.
   - Los entrenos viejos sin el campo se siguen leyendo de la subcolección.
   - Código: `src/lib/workout-sets.ts`, `src/lib/data.ts`. La forma de cada `Workout` es idéntica, así que Métricas, Historial e IA calculan igual.
2. **Caché en el servidor** de 60 s por perfil para entrenos, pesajes y días de entreno (`src/lib/server-cache.ts`). Se borra al crear, editar o borrar un entreno o un pesaje.
3. **El navegador no repite pedidos recientes.** `fetchJsonCached` (Fuerza, `src/lib/client-cache.ts`) y `useNv` (NutriVerse, `src/components/nutriverse/data.ts`) no vuelven a pedir una pantalla vista hace menos de 60 s. Al guardar se invalida y lo nuevo aparece al instante.
4. **NutriVerse**:
   - los objetivos usan solo las **fechas** de entreno (`listWorkoutDates`: 1 lectura por entreno, sin series);
   - el chat lista solo las 30 conversaciones más recientes.
5. **Si algún día se agota igual**:
   - Las rutas de la API responden **503** con un mensaje claro (`src/lib/api-errors.ts`, `isQuotaError` y `QUOTA_MESSAGE` en `src/lib/firebase.ts`).
   - En Entreno, el borrador sigue en el teléfono y el botón cambia a "Reintentar guardar".
   - Inicio y Métricas siguen mostrando la última copia guardada.
   - El chat de NutriVerse corta con el mensaje claro en vez del error técnico.
6. **Contador de lecturas** (`src/lib/firestore-usage.ts`).
   - En local (`npm run iphone`/`dev:iphone`, o con `FIRESTORE_LOG_READS=1`) el registro muestra, por ejemplo, `[firestore] listWorkouts(80) → 41 lecturas (hoy en este servidor: 1.230)`.
   - Para probar la falla de cuota sin gastar: `FIRESTORE_SIMULATE_QUOTA=1`.

## 5. Migración de los entrenos existentes (pendiente)
Se corre **con la cuota recién reiniciada** (después de las ~2:00 a. m.):
```bash
node --env-file=.env.local --experimental-strip-types scripts/migrate-sets-into-workouts.ts          # prueba: solo cuenta
node --env-file=.env.local --experimental-strip-types scripts/migrate-sets-into-workouts.ts --write  # copia y verifica
```
- No borra nada.
- Cubre `workouts` (Juan) y `users/{id}/workouts` (Laura y otros).
- Costo único: ~1 lectura por entreno + 1 por serie, y 1 escritura por entreno.
- Termina con error si alguna copia no coincide con la subcolección.

## 6. Metas y seguimiento
- Abrir una pantalla: ≤ ~100 lecturas. Un mensaje del chat: ≤ ~150. Un día normal: < 5.000, es decir, < 10 % de la cuota.
- Durante la primera semana, revisar los registros `[firestore]` y la consola de Firebase (Uso).
- Pasos futuros, cuando todo lleve semanas estable:
  - dejar de escribir la subcolección `sets`;
  - decidir si se activa Blaze.
