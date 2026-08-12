# Changelog

Formato basado en [Keep a Changelog](https://keepachangelog.com/es-ES/1.1.0/).
Versionado con [SemVer](https://semver.org/lang/es/): `MAYOR.MENOR.PARCHE`.

## [1.1.1] — 2026-08-12

### Fixed
- Modales de carga en iPhone: se renderizan con portal a `document.body` para no quedar bajo otras cards (stacking context de `backdrop-filter`).
- Altura/scroll de sheets con `svh` + safe-area; bloqueo de scroll del body al abrir.

## [1.1.0] — 2026-08-12

Release de experiencia de carga visual (antes `experiment/visual-redesign`).  
**No cambia el modelo de datos ni migra Firestore:** los workouts siguen guardando `weightKg` / `reps` igual que en `1.0.0`.

### Added
- Selector visual de **stack de placas** (polea/máquina) en ejercicios de cable de espalda, pecho, hombro, tríceps y pierna.
- Selector de **rack de mancuernas** (lb del gym → kg) en ejercicios de mancuerna.
- Selector de **barra olímpica + discos** (lb → kg total) en Press banca, encogimientos, sentadilla libre y peso muerto rumano.
- Selector de **barra Z** (kg fijos del rack) en Press francés y Bíceps barra Z.
- Playbook de humo (`npm run playbook`) y tests unitarios de stacks/racks.
- Estilo **Liquid Glass** en cards, botones, nav y overlays (modales opacos para legibilidad).

### Changed
- UI de series con bullet `·` en lugar de numeración `1.`.
- Convenciones de carga siguen en **kilogramos** fuera de los selectores (lb solo como referencia al elegir).

### Safety
- Sin migraciones de Firestore.
- Sin cambios de esquema en `workouts`, `sets` ni `bodyWeight`.
- Los datos históricos existentes se abren igual; los pickers solo ayudan a elegir el kg al registrar.

## [1.0.0] — 2026-08

Baseline estable: decimales, historial editable, análisis IA, antebrazos, orden de ejercicios.
