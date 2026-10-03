# PLAT-016 — `docs:check` gobierna los cambios QUICK y su registro de entrega embebido

**Estado documental:** APPROVED

**Versión:** 1.0.0

**Fecha:** 2026-10-03

**Aprobado por:** Tomás, usuario solicitante

**Fecha de aprobación:** 2026-10-03

**Evidencia de aprobación:** Aprobación expresa «Aprueba PLAT-016 e impleméntalo» registrada en la conversación de trabajo, tras proponerse el cambio como `QUICK`.

**Clasificación:** QUICK

## Contrato afectado

- Especificación vigente: PLAT-004, versión `1.0.0`, REQ-04 (contrato estructural SDD: índices que referencian los artefactos vigentes, vocabularios de estado documental y de entrega en los artefactos sujetos al modelo actual, ausencia de placeholders en artefactos `APPROVED`), AC-05 y AC-06.
- Workflow vigente: `docs/sdd/workflow.md`, que incluye los cambios `QUICK` entre los artefactos con estado documental y admite registrar su entrega en una sección embebida cuando el cambio es trivial.
- Motivo de clasificación: ajusta un comprobador para que cumpla un contrato ya aprobado; cambia el resultado de `npm run check` para ciertos documentos, sin decisión arquitectónica nueva.

## Delta funcional

### Comportamiento vigente

Una auditoría el 2026-10-03, sobre una copia de trabajo, comprobó que `docs:check` solo considera artefactos gobernados bajo `docs/platform/` los `spec.md`, `plan.md` y `validation-report.md` numerados desde `003`. Un `quick-change.md` de plataforma con `Estado documental: BOGUS`, `Aprobado por: Pendiente` y sin fila en `docs/platform/README.md` terminó con `docs:check: OK`. Los `quick-change.md` bajo `specs/` (producto) sí se gobiernan, lo que es inconsistente. Además, el registro de entrega embebido (`- Estado de entrega: ...`, usado en PLAT-009 a PLAT-015) no se valida: una entrega `VALIDATED` sin aceptación pasaría.

### Comportamiento aprobado propuesto

- Los `docs/platform/specs/NNN-*/quick-change.md` con `NNN` ≥ `003` pasan a ser artefactos gobernados: se comprueban estado documental, versión `X.Y.Z` y campos de aprobación si están `APPROVED`, y `docs/platform/README.md` debe enlazarlos.
- En todo `quick-change.md` gobernado (de plataforma o de producto) con una línea `- Estado de entrega: <estado>` en su registro embebido:
  - el estado pertenece al vocabulario de entrega (`NOT_STARTED`, `IMPLEMENTED`, `VALIDATED`, `BLOCKED`, `NOT_APPLICABLE`), con o sin comillas invertidas;
  - `IMPLEMENTED` y `VALIDATED` exigen un documento `APPROVED` y los campos `Archivos modificados` y `Pruebas y resultados` completos;
  - `VALIDATED` exige además `Aceptación` completo;
  - «completo» significa no vacío, distinto de `Pendiente` y que no sea un marcador `<...>`; la etiqueta admite un paréntesis opcional, como en `Pruebas y resultados (2026-10-03):`.
- Los diagnósticos reutilizan los códigos existentes (`DOC_DOCUMENT_STATUS`, `DOC_DELIVERY_STATUS`, `DOC_APPROVAL_METADATA`, `DOC_INDEX_ENTRY`).

### Resultado medido del prototipo

Sobre el repositorio actual, el prototipo (en copia temporal, ya eliminada) devuelve `docs:check: OK (70 archivos comprobados)`: ningún registro aprobado necesita modificarse. Con mutaciones controladas sobre esa copia detecta: estado `BOGUS`, fila de índice ausente, `VALIDATED` sin `Aceptación` y `VALIDATED` con documento `DRAFT`.

### Fuera de alcance

- Verificar que una aprobación o aceptación sea auténtica o veraz (límite de PLAT-004 REQ-04).
- Comprobar que las columnas de estado de las tablas de índice coincidan con los archivos.
- Gobernar `amendment-*.md` ni artefactos de plataforma anteriores a `003` (modelo histórico).
- Cambiar el contenido de los registros existentes, el workflow o las plantillas.

## Criterios afectados

### QC-AC-01 — QUICK de plataforma gobernados

- **Dado** un `docs/platform/specs/009-x/quick-change.md` con estado documental no permitido, o `APPROVED` con `Aprobado por: Pendiente`, o sin enlace desde `docs/platform/README.md`
- **Cuando** se ejecuta `npm run docs:check`
- **Entonces** devuelve error con el código de la regla y el archivo, y finaliza con código distinto de cero

### QC-AC-02 — Registro de entrega embebido

- **Dado** un `quick-change.md` con `- Estado de entrega: ` y un estado fuera del vocabulario, o `IMPLEMENTED`/`VALIDATED` con `Archivos modificados` o `Pruebas y resultados` pendientes, o `VALIDATED` con `Aceptación: Pendiente`, o `IMPLEMENTED`/`VALIDATED` con documento `DRAFT`
- **Cuando** se ejecuta `npm run docs:check`
- **Entonces** cada caso devuelve su diagnóstico determinista

### QC-AC-03 — Documentación válida sin cambios

- **Dado** el repositorio con los registros PLAT-006 a PLAT-016 actuales
- **Cuando** se ejecuta `npm run docs:check`
- **Entonces** finaliza con código `0` sin modificar ningún registro aprobado, y un registro con la etiqueta `Pruebas y resultados (fecha):` se acepta

### QC-AC-04 — Puerta y derivación intactas

- **Dado** el cambio aplicado
- **Cuando** se ejecutan `npm run check`, `npm run test:tools` y una derivación real en copia temporal
- **Entonces** todo finaliza con código `0` y `docs:check` del derivado también

## Alcance técnico mínimo

| Archivo o área | Cambio previsto | Criterio |
| --- | --- | --- |
| `tools/quality/docs-policy.ts` | Incluir `quick-change` en los artefactos de plataforma gobernados e indexados; helper `isQuickChange`. | QC-AC-01 |
| `tools/quality/docs-check.ts` | Validar el registro de entrega embebido. | QC-AC-02, QC-AC-03 |
| `tests/tools/quality/docs-check.test.ts` y su fixture | Casos válidos e inválidos de QC-AC-01 a QC-AC-03. | QC-AC-01, QC-AC-02, QC-AC-03 |
| `README.md` | Ajustar la frase sobre lo que valida `docs:check` (archivo gestionado; regenerar hash y `baselineId`). | QC-AC-04 |
| `tools/template/baseline-manifest.json`, `tests/tools/template/baseline.test.ts` | Nuevo hash de `README.md` y `baselineId`. | QC-AC-04 |
| `docs/platform/README.md` | Fila `PLAT-016`. | — |

## Pruebas y validación previstas

- Automatizadas: las pruebas anteriores, que deben fallar antes del cambio y pasar después; `npm run check` y `npm run test:tools`.
- Manual: derivación real en copia temporal con comprobación de `docs:check` del derivado.
- Comando de regresión: `npm run check && npm run test:tools`.

## Riesgos y reclasificación

- Riesgo: falsos positivos en registros futuros cuyas etiquetas difieran (por ejemplo, otro paréntesis o un nombre de campo distinto); el diagnóstico los señala y se corrige el registro o la política.
- Riesgo: los derivados que ya tengan `quick-change.md` con otro formato fallarán en su próxima `docs:check`; no se migran automáticamente.
- Reclasificar como `ADR` o `FULL` si se pretende exigir la validez de las tablas de índice o hacer obligatorio un `validation-report.md` independiente.

## Puerta documental

La aprobación autoriza implementar únicamente este delta cuando exista autorización expresa de implementación. No autoriza commit ni publicación.

## Registro de entrega opcional

- Estado de entrega: `VALIDATED`
- Archivos modificados: `tools/quality/docs-policy.ts` (`quick-change` entre los artefactos de plataforma gobernados e indexados; `isQuickChange`), `tools/quality/docs-check.ts` (validación del registro de entrega embebido), `tests/tools/quality/docs-check.test.ts` y `tests/tools/quality/helpers/quality-fixture.ts` (helper `quickChangeDocument` y 11 casos nuevos), `README.md`, `tools/template/baseline-manifest.json` (hash de `README.md` y `baselineId` `react-vite-ts-sdd-template@2026-10-03-plat-016.1`), `tests/tools/template/baseline.test.ts`, `docs/platform/README.md`.
- Pruebas y resultados (2026-10-03): antes del cambio fallaban 8 de los nuevos casos y 8 pasaban; después pasan los 16 de `docs-check.test.ts`. `npm run check` y `npm run test:tools` finalizan con código `0` (10 pruebas de aplicación, 77 de herramientas); `docs:check` sobre el repositorio da OK (71 archivos) sin modificar ningún registro aprobado. Mutación sobre el repositorio real (ya restaurada): dejar `Aceptación: Pendiente` en PLAT-013 hizo fallar `docs:check` con `DOC_APPROVAL_METADATA`. Derivación real en copia temporal (ya eliminada): `template:init` aplicado, `template:doctor` sin `FAIL`, `docs:check` del derivado OK (70 archivos) y `npm run check` del derivado con código `0`.
- Desviaciones: ninguna respecto al delta aprobado. Reparación editorial del 2026-10-04: el 2026-10-03 un error de edición truncó este registro en el commit `b12ea89` (se perdieron el resto del delta, los criterios, el alcance, las pruebas, los riesgos, la puerta documental y el encabezado del registro de entrega) y el borrador nunca se había commiteado; se restauró el texto aprobado a partir de la conversación de trabajo en la que se redactó y aprobó, sin cambiar su significado, y el registro de entrega se reformateó como viñetas.
- Aceptación: 2026-10-03, Tomás, usuario solicitante. Aceptación expresa «Acepto PLAT-015, 016 y 017 como VALIDATED» registrada en la conversación de trabajo tras contrastar los criterios con la evidencia de este registro. En GitHub, tras el push de `b12ea89`, `Quality` (run `37154201116`) y `Security` (run `37154201113`) finalizaron con `success`.
