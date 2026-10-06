# PLAT-030 — Elevar la cobertura mínima global al 90 %

**Estado documental:** APPROVED

**Versión:** 1.0.0

**Fecha:** 2026-10-06

**Aprobado por:** Tomás, usuario solicitante

**Fecha de aprobación:** 2026-10-06

**Evidencia de aprobación:** Aprobación expresa «Apruebo PLAT-030 e implementa» registrada en la conversación de trabajo, tras presentarse el borrador 0.1.0. Autoriza la implementación de este delta; no autoriza commit, publicación ni `template:init --apply`.

**Clasificación:** QUICK

## Contrato afectado

- Decisión que se aplica: [ADR-0022](../../../architecture/decisions/0022-cobertura-minima-del-90-por-ciento.md) v1.0.0 (`APPROVED`, 2026-10-06), que modifica parcialmente ADR-0011 §4, ADR-0013 §1 y ADR-0015 §6.
- Especificación vigente que se actualiza: PLAT-004, REQ-06 y AC-09 (cobertura mínima protegida). Sus umbrales concretos (70/55/75/75) los sustituye ADR-0022 por 90 % en las cuatro métricas; el resto de REQ-06 (perímetro, exclusiones, ausencia de actualización automática) no cambia. La especificación aprobada no se reescribe: este delta registra la sustitución.
- Archivos gestionados afectados: `vite.config.ts`, `AGENTS.md` y `README.md` (con hash en el manifiesto) y `tools/template/baseline-manifest.json`.
- Motivo de clasificación: aplica una decisión aprobada con un cambio pequeño y localizado de configuración y documentación. Cambia el comportamiento observable de la puerta de calidad (`npm run test:coverage` y `npm run check` fallan con una cobertura por debajo del 90 %), pero no introduce dependencias, no cambia el perímetro de medición ni toma una decisión arquitectónica nueva.

## Delta funcional

### Comportamiento vigente

`vite.config.ts` aplica umbrales globales de cobertura de 70 % en statements, 55 % en branches, 75 % en functions y 75 % en lines, con `perFile: false` y `autoUpdate: false`, sobre `src/**/*.{ts,tsx}`. `README.md` y la regla de TDD de `AGENTS.md` añadida por PLAT-028 describen esos valores o los mantienen sin cambios. La baseline mide 100 % (18 sentencias, 2 ramas, 5 funciones y 17 líneas, 2026-10-06).

### Comportamiento aprobado propuesto

1. `vite.config.ts` fija los cuatro umbrales globales en **90**; `perFile` y `autoUpdate` permanecen en `false` y el perímetro y las exclusiones no cambian.
2. `README.md` indica los nuevos mínimos y la referencia a ADR-0022, y retira «no se añaden umbrales de cobertura a los ya vigentes» de su sección de TDD.
3. `AGENTS.md` sustituye «No se añaden umbrales de cobertura a los ya vigentes» por la regla de umbrales globales del 90 % (ADR-0022), conservando que Stryker es opcional y que el orden test-first no se verifica automáticamente.
4. Una prueba en `tests/tools/quality/` lee los umbrales configurados en `vite.config.ts` y falla si alguno no es 90 o si `perFile` o `autoUpdate` dejan de ser `false`.
5. El manifiesto regenera los hashes de `vite.config.ts`, `AGENTS.md` y `README.md` y el `baselineId`.

### Fuera de alcance

- Umbrales por archivo (`perFile`) y cualquier cambio del perímetro o de las exclusiones de cobertura.
- Mutation testing (Stryker) y cualquier comprobación automática del orden test-first.
- Modificar ADR-0011, ADR-0013, ADR-0015, ADR-0021 o el texto aprobado de PLAT-004.
- Aplicar el cambio a derivados ya creados.
- Commit, push, merge y publicación.

## Criterios afectados

### QC-AC-01 — Umbrales configurados

- **Dado** `vite.config.ts` con el cambio aplicado
- **Cuando** se leen sus umbrales de cobertura
- **Entonces** `statements`, `branches`, `functions` y `lines` valen 90, `perFile` y `autoUpdate` son `false`, y la prueba que lo comprueba se escribió antes y falló con los valores 70/55/75/75

### QC-AC-02 — Regresión bloqueada

- **Dado** una copia temporal del repositorio en la que se elimina una prueba de `src/` para que la cobertura quede por debajo del 90 %
- **Cuando** se ejecuta `npm run test:coverage`
- **Entonces** finaliza con código distinto de `0` indicando el umbral incumplido

### QC-AC-03 — Documentación coherente

- **Dado** `README.md` y `AGENTS.md` con el cambio aplicado
- **Cuando** se leen las reglas de cobertura
- **Entonces** ambos indican el 90 % global y ADR-0022, y ningún documento vigente fuera de los ADR y las especificaciones históricas afirma los valores 70/55/75/75 como umbrales actuales

### QC-AC-04 — Puerta, manifiesto y derivación

- **Dado** el cambio aplicado
- **Cuando** se ejecutan `npm run check`, `npm run test:tools` y una derivación real con `template:init` y `template:doctor`
- **Entonces** todo finaliza con código `0` (el doctor sin fallos), el manifiesto tiene los hashes y el `baselineId` regenerados, y el `vite.config.ts` del derivado contiene los umbrales del 90 %

## Alcance técnico mínimo

| Archivo o área | Cambio previsto | Criterio |
| --- | --- | --- |
| `tests/tools/quality/coverage-thresholds.test.ts` | Nuevo: comprueba los umbrales y los flags de `vite.config.ts`; se escribe y se ve fallar primero. | QC-AC-01 |
| `vite.config.ts` | Umbrales a 90 (archivo gestionado). | QC-AC-01, QC-AC-02 |
| `AGENTS.md`, `README.md` | Regla y descripción del 90 % (archivos gestionados). | QC-AC-03 |
| `tools/template/baseline-manifest.json`, `tests/tools/template/baseline.test.ts` | Hashes y `baselineId` (`2026-10-06-plat-030.1`); la prueba del `baselineId` se cambia primero. | QC-AC-04 |
| `docs/platform/README.md` | Fila de PLAT-030. | — |

## Pruebas y validación previstas

- Automatizadas: la prueba nueva de umbrales (Red con 70/55/75/75, luego Green), la prueba del `baselineId` cambiada primero, `npm run check` y `npm run test:tools`.
- Manuales o de sesión: QC-AC-02 en una copia temporal con `node_modules` enlazado, sin tocar el repositorio; derivación real de prueba en un directorio temporal, que requiere autorización expresa del token de `--apply`.
- Comando de regresión: `npm run check && npm run test:tools`.

## Riesgos y reclasificación

- Riesgo: con 18 sentencias, 2 ramas y 5 funciones, el 90 % equivale en la baseline a casi el 100 %: ninguna rama ni función puede quedar sin cubrir. Un derivado que añada código sin pruebas fallará la puerta, que es el efecto buscado.
- Riesgo: el porcentaje puede alcanzarse con pruebas que no verifican comportamiento; no sustituye la evidencia del Red de ADR-0021.
- Riesgo: sin `perFile`, un archivo puede quedar por debajo del 90 % mientras el agregado lo cumpla.
- Riesgo: los derivados ya creados no reciben el cambio automáticamente.
- Reclasificar como `ADR` si se decide activar `perFile`, cambiar el perímetro o las exclusiones, o adoptar otra métrica.
- Reclasificar como `FULL` si hace falta tocar `docs:check`, `architecture:check` o la derivación.

## Puerta documental

La aprobación autoriza implementar únicamente este delta cuando exista autorización expresa de implementación. No autoriza commit ni publicación.

## Registro de entrega opcional

Registrar aquí la entrega del cambio, separada del contrato aprobado y sin modificar este último. Puede usarse un `validation-report.md` independiente si la evidencia es demasiado extensa.

- Estado de entrega: `VALIDATED`
- Archivos modificados: `vite.config.ts` (umbrales a 90), `AGENTS.md`, `README.md`, `tools/template/baseline-manifest.json` (hashes de `vite.config.ts`, `AGENTS.md` y `README.md` y `baselineId` `react-vite-ts-sdd-template@2026-10-06-plat-030.1`), `tests/tools/template/baseline.test.ts`, `tests/tools/quality/runtime-config.test.ts`, `docs/platform/README.md` y este registro.
- Pruebas y resultados: Red observado antes de implementar: `runtime-config.test.ts` (umbrales: el cambio de 70/55/75/75 a 90 hizo fallar la prueba existente por la ausencia del comportamiento) y `baseline.test.ts` (`baselineId` esperado `…plat-030.1`, recibido `…plat-029.1`); una prueba de guarda de los flags `perFile`/`autoUpdate` pasó desde el principio porque protege comportamiento ya existente (no es Red). Tras implementar, ambas pruebas pasan. `npm run check` código `0` (100 % de 18 sentencias, 2 ramas, 5 funciones y 17 líneas; 10 pruebas; build) y `npm run test:tools` 17 archivos / 152 pruebas correctas; ningún documento vigente fuera de ADR y especificaciones históricas afirma ya 70/55/75/75 (QC-AC-03). QC-AC-02, en una copia temporal con `node_modules` enlazado y eliminando las pruebas de `App`, `Home` y `main`: cobertura 38,88 % / 0 % / 20 % / 41,17 % (statements, branches, functions, lines) y `npm run test:coverage` terminó con código `1` indicando los cuatro umbrales del 90 % incumplidos; eliminar solo la prueba de `RouteLoading` no bajaba la cobertura porque la cubre la de `App`. QC-AC-04, derivación real en un directorio temporal con la autorización expresa del token `477008f3…672d`: `template:init --apply`, `template:doctor` con `PASS=9 WARN=0 FAIL=0 UNKNOWN=1` (sin remoto observable), el `vite.config.ts` del derivado contiene los cuatro umbrales en 90, no contiene `tools/template/` y `npm run check` del derivado con código `0` (10 pruebas, `node_modules` enlazado de la plantilla). La frescura previa informó 3 `ATTENTION` y 3 `BLOCKED` ajenos a este cambio.
- Desviaciones: el alcance preveía una prueba nueva `tests/tools/quality/coverage-thresholds.test.ts`; al ejecutar `test:tools` se comprobó que `runtime-config.test.ts` ya es la dueña de esos umbrales y la nueva la duplicaba (además fallaba el lint), por lo que se retiró y se actualizó la existente. Con 18 sentencias, 2 ramas y 5 funciones, el 90 % equivale en la baseline a casi el 100 %.
- Aceptación: 2026-10-06, Tomás, usuario solicitante. Aceptación expresa «Acepto PLAT-030 como VALIDATED» registrada en la conversación de trabajo tras contrastar los criterios con la evidencia de este registro, con las limitaciones anotadas (en la baseline el 90 % equivale casi al 100 %; el porcentaje no verifica el orden test-first ni la calidad de las pruebas; `perFile` desactivado).
