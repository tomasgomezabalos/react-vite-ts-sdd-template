# PLAT-024 — Aplicar ADR-0018: registro de entrega embebido en los cambios QUICK

**Estado documental:** APPROVED

**Versión:** 1.0.0

**Fecha:** 2026-10-04

**Aprobado por:** Tomás, usuario solicitante

**Fecha de aprobación:** 2026-10-04

**Evidencia de aprobación:** Aprobación expresa «Aprueba ADR-0018 y PLAT-024 e impleméntalo» registrada en la conversación de trabajo, tras proponerse el cambio como `QUICK`.

**Clasificación:** QUICK

## Contrato afectado

- Decisión que se aplica: ADR-0018 (`APPROVED` el 2026-10-04 en la misma petición que este delta).
- Documentos aprobados que se modifican: `docs/sdd/workflow.md` y `docs/sdd/change-policy.md` (ambos `2.0.0`, aprobados el 2026-08-28), `docs/sdd/README.md`, `docs/sdd/templates/quick-change.md` y `AGENTS.md` (archivo gestionado).
- Motivo de clasificación: aplica una decisión ya aprobada con cambios de redacción localizados en el flujo SDD; no introduce decisiones nuevas.

## Delta funcional

### Comportamiento vigente

`workflow.md` (flujo `QUICK`, paso 6) y `change-policy.md` (QUICK, paso 6) dicen «`validation-report.md` o, cuando sea trivial, la sección de entrega del propio registro `QUICK`»; la plantilla `quick-change.md` dice «Utilizar esta sección solo cuando el cambio sea trivial y un informe independiente no aporte claridad»; `AGENTS.md` dice «Al finalizar un alcance `FULL` o un `QUICK` que necesite evidencia persistente, utilizar `validation-report.md`». «Trivial» no está definido y la práctica de PLAT-009 a PLAT-023 usa el registro embebido.

### Comportamiento aprobado propuesto

- `workflow.md`, flujo `QUICK`, paso 6: «Registrar archivos, pruebas y resultados, desviaciones y aceptación en la sección de entrega del propio `quick-change.md`, separada del contrato aprobado; puede utilizarse un `validation-report.md` independiente cuando la evidencia sea demasiado extensa o la persona responsable lo pida».
- `change-policy.md`, QUICK, paso 6: misma redacción.
- `workflow.md` y `change-policy.md` pasan a la versión `2.1.0`, con la fecha y la evidencia de aprobación del ADR-0018 y de este delta; `docs/sdd/README.md` refleja `APPROVED 2.1.0` para ambos.
- Plantilla `quick-change.md`: la sección «Registro de entrega opcional» sustituye «solo cuando el cambio sea trivial…» por «Registrar aquí la entrega del cambio; no modificar el contrato aprobado anterior. Puede usarse un `validation-report.md` independiente si la evidencia es demasiado extensa».
- `AGENTS.md`: «Al finalizar un `FULL`, utilizar `docs/sdd/templates/validation-report.md`; para un `QUICK`, registrar la entrega en la sección de entrega del propio `quick-change.md` (o en un informe independiente si la evidencia es demasiado extensa)». El informe pasa a `IMPLEMENTED` cuando el alcance termina y solo a `VALIDATED` tras contrastar criterios y obtener aceptación expresa.

### Fuera de alcance

- Cambiar los estados de entrega, las reglas de aceptación o `docs:check`.
- Modificar ADR-0009 (la relación se registra en ADR-0018 y en el índice de arquitectura).
- Tocar los registros y los informes ya existentes.

## Criterios afectados

### QC-AC-01 — Sin «trivial»

- **Dado** `workflow.md`, `change-policy.md`, la plantilla `quick-change.md` y `AGENTS.md`
- **Cuando** se busca la palabra «trivial» en el contexto de la entrega
- **Entonces** no aparece, y los cuatro describen el mismo cauce para `QUICK` y el informe independiente para `FULL`

### QC-AC-02 — Versiones y revisiones

- **Dado** `workflow.md`, `change-policy.md` y `docs/sdd/README.md`
- **Cuando** se leen sus versiones
- **Entonces** ambos documentos son `2.1.0` con fecha y evidencia de aprobación completas, el índice indica `APPROVED 2.1.0` y `docs:check` pasa

### QC-AC-03 — Prueba de contrato

- **Dado** una prueba sobre esos cuatro documentos
- **Cuando** se ejecuta `npm run test:tools`
- **Entonces** falla si reaparece «trivial» en ese contexto o si falta la mención del cauce embebido

### QC-AC-04 — Puerta y derivación intactas

- **Dado** el cambio aplicado
- **Cuando** se ejecutan `npm run check`, `npm run test:tools` y una derivación real en copia temporal
- **Entonces** todo finaliza con código `0`, `template:doctor` no tiene `FAIL` y el derivado contiene los documentos actualizados

## Alcance técnico mínimo

| Archivo o área | Cambio previsto | Criterio |
| --- | --- | --- |
| `docs/sdd/workflow.md`, `docs/sdd/change-policy.md` | Paso 6 de `QUICK` y versión `2.1.0` con su aprobación. | QC-AC-01, QC-AC-02 |
| `docs/sdd/README.md` | Revisiones vigentes `APPROVED 2.1.0`. | QC-AC-02 |
| `docs/sdd/templates/quick-change.md` | Frase de la sección de entrega. | QC-AC-01 |
| `AGENTS.md` | Regla de evidencia (archivo gestionado). | QC-AC-01 |
| `tests/tools/quality/process-docs.test.ts` | Casos de QC-AC-01 y QC-AC-03. | QC-AC-01, QC-AC-03 |
| `tools/template/baseline-manifest.json`, `tests/tools/template/baseline.test.ts` | Hash de `AGENTS.md` y `baselineId`. | QC-AC-04 |
| `docs/architecture/README.md`, `docs/platform/README.md` | Fila de ADR-0018 y de PLAT-024. | — |

## Pruebas y validación previstas

- Automatizadas: la prueba de contrato, que debe fallar antes del cambio y pasar después; `npm run check` y `npm run test:tools`.
- Manual: derivación real en copia temporal; tras editar cualquier documento aprobado, comprobar que la lista de encabezados no cambia salvo lo previsto.
- Comando de regresión: `npm run check && npm run test:tools`.

## Riesgos y reclasificación

- Riesgo: editar documentos aprobados (`workflow.md`, `change-policy.md`) con una versión nueva es una modificación sustantiva del flujo; por eso este delta y ADR-0018 deben estar aprobados antes.
- Riesgo: los derivados ya creados conservan la redacción antigua hasta adoptar el cambio.
- Reclasificar como `ADR` o `FULL` si se pretende cambiar los estados de entrega, la obligación del informe de los `FULL` o la política de aprobación.

## Puerta documental

La aprobación autoriza implementar únicamente este delta cuando exista autorización expresa de implementación y ADR-0018 esté aprobado. No autoriza commit ni publicación.

## Registro de entrega opcional

- Estado de entrega: `IMPLEMENTED`
- Archivos modificados: `docs/sdd/workflow.md` y `docs/sdd/change-policy.md` (paso 6 de `QUICK`, versión `2.1.0`, revisión, aprobación y decisión aplicable; el workflow además reformula la frase sobre dónde se registran los estados de entrega), `docs/sdd/README.md` (revisiones `APPROVED 2.1.0`), `docs/sdd/templates/quick-change.md`, `AGENTS.md`, `tests/tools/quality/process-docs.test.ts` (2 casos nuevos), `tools/template/baseline-manifest.json` (hash de `AGENTS.md` y `baselineId` `react-vite-ts-sdd-template@2026-10-03-plat-024.1`), `tests/tools/template/baseline.test.ts`, `docs/architecture/README.md` (ADR-0018 pasa a decisiones vigentes), `docs/architecture/decisions/0009-ciclo-vida-sdd-y-evidencias.md` (línea «Modificada por»), `docs/platform/README.md`.
- Pruebas y resultados (2026-10-04): antes del cambio fallaban los 2 casos nuevos de `process-docs.test.ts`; después pasan los 4 del archivo. `npm run check` y `npm run test:tools` finalizan con código `0` (10 pruebas de aplicación, 119 de herramientas); `docs:check` OK (80 archivos). En cada documento aprobado editado se comprobó por script que la lista de encabezados es idéntica antes y después. Derivación real en copia temporal (ya eliminada): `template:init` aplicado, `template:doctor` sin `FAIL`, el derivado contiene el workflow `2.1.0` y la regla de `AGENTS.md` sobre el registro embebido, ningún documento SDD del derivado contiene «trivial», y su `npm run check` finaliza con código `0`.
- Desviaciones: se añadió la línea «Modificada por» en ADR-0009, que no figuraba en el alcance técnico mínimo; es una corrección editorial `DIRECT` coherente con las de ADR-0010 a 0013 y no cambia el significado de ninguna decisión. Sin otras desviaciones.
- Aceptación: Pendiente
