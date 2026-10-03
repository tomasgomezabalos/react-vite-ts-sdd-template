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

Una auditoría el 2026-10-03, sobre una copia de trabajo, comprobó que `docs:check` solo considera artefactos gobernados bajo `docs/platform/` los `spec.md`, `plan.md` y `validation-report.md` numerados desde `003`. Un `quick-change.md` de plataforma con `Estado documental: BOGUS`, `Aprobado por: Pendiente` y sin fila en `docs/platform/README.md` terminó con `docs:check: OK`. Los `quick-change.md` bajo `specs/` (producto) sí se gobiernan, lo que es inconsistente. Además, el registro de entrega embebido (`- Estado de entrega: `VALIDATED`
- Archivos modificados: `tools/quality/docs-policy.ts` (`quick-change` entre los artefactos de plataforma gobernados e indexados; `isQuickChange`), `tools/quality/docs-check.ts` (validación del registro de entrega embebido), `tests/tools/quality/docs-check.test.ts` y `tests/tools/quality/helpers/quality-fixture.ts` (helper `quickChangeDocument` y 11 casos nuevos), `README.md`, `tools/template/baseline-manifest.json` (hash de `README.md` y `baselineId` `react-vite-ts-sdd-template@2026-10-03-plat-016.1`), `tests/tools/template/baseline.test.ts`, `docs/platform/README.md`.
- Pruebas y resultados (2026-10-03): antes del cambio fallaban 8 de los nuevos casos y 8 pasaban; después pasan los 16 de `docs-check.test.ts`. `npm run check` y `npm run test:tools` finalizan con código `0` (10 pruebas de aplicación, 77 de herramientas); `docs:check` sobre el repositorio da OK (71 archivos) sin modificar ningún registro aprobado. Mutación sobre el repositorio real (ya restaurada): dejar `Aceptación: Pendiente` en PLAT-013 hizo fallar `docs:check` con `DOC_APPROVAL_METADATA`. Derivación real en copia temporal (ya eliminada): `template:init` aplicado, `template:doctor` sin `FAIL`, `docs:check` del derivado OK (70 archivos) y `npm run check` del derivado con código `0`.
- Desviaciones: ninguna respecto al delta aprobado.
- Aceptación: 2026-10-03, Tomás, usuario solicitante. Aceptación expresa «Acepto PLAT-015, 016 y 017 como VALIDATED» registrada en la conversación de trabajo tras contrastar los criterios con la evidencia de este registro. En GitHub, tras el push de `b12ea89`, `Quality` (run `37154201116`) y `Security` (run `37154201113`) finalizaron con `success`.
