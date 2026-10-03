# PLAT-012 — Plantilla de pull request con la trazabilidad SDD

**Estado documental:** APPROVED

**Versión:** 1.0.0

**Fecha:** 2026-10-03

**Aprobado por:** Tomás, usuario solicitante

**Fecha de aprobación:** 2026-10-03

**Evidencia de aprobación:** Aprobación expresa «Aprueba PLAT-012 e impleméntalo» registrada en la conversación de trabajo, tras proponerse el cambio como `QUICK`.

**Clasificación:** QUICK

## Contrato afectado

- Reglas vigentes que se reflejan: `AGENTS.md` (clasificación obligatoria `FULL`/`QUICK`/`DIRECT`/`ADR`, aprobaciones, `Estado de entrega`, `npm run check`, autorizaciones independientes de commit, push, merge, despliegue y publicación) y `docs/sdd/change-policy.md`.
- Motivo de clasificación: añade un artefacto de proceso pequeño y localizado que no cambia comportamiento de la aplicación ni introduce decisiones nuevas; se clasifica `QUICK` y no `DIRECT` porque forma parte de la copia que reciben los derivados y establece una convención de revisión.

## Delta funcional

### Comportamiento vigente

Un pull request se abre sin estructura: no recuerda la clasificación del cambio, el artefacto SDD que lo respalda ni la evidencia de validación exigida.

### Comportamiento aprobado propuesto

- `.github/pull_request_template.md` precarga la descripción de cada pull request con estas secciones, en español:
  - **Clasificación:** casillas `FULL`, `QUICK`, `DIRECT`, `ADR` y enlace al artefacto aprobado (spec, `quick-change.md` o ADR) cuando no sea `DIRECT`.
  - **Resumen** del cambio.
  - **Trazabilidad:** requisito o criterio afectado y prueba que lo cubre.
  - **Validación:** casillas para `npm run check` y, si se tocó `tools/`, `npm run test:tools`, con el resultado real; enlace al informe de validación o al registro de entrega cuando exista.
  - **Estado de entrega** declarado (`IMPLEMENTED` o `VALIDATED`) y recordatorio de que `VALIDATED` exige aceptación expresa.
  - **Autorizaciones:** confirmación de que commit, push, merge y despliegue cuentan con autorización independiente.
- `README.md` menciona la plantilla en la lista de estructura.

### Fuera de alcance

- Plantillas de issues, `CODEOWNERS`, `SECURITY.md`, `CONTRIBUTING.md` y `LICENSE`: requieren datos del propietario del derivado o duplican `AGENTS.md` y el README (`AGENTS.md` prohíbe asumir licencia, remoto o visibilidad).
- Comprobaciones automáticas del contenido del pull request.
- Cambios en workflows, en la puerta `npm run check` o en `AGENTS.md`.

## Criterios afectados

### QC-AC-01 — Plantilla presente y completa

- **Dado** `.github/pull_request_template.md`
- **Cuando** se inspecciona su contenido
- **Entonces** contiene las secciones de clasificación (con las cuatro clases), resumen, trazabilidad, validación, estado de entrega y autorizaciones descritas arriba

### QC-AC-02 — Coherencia con las reglas vigentes

- **Dado** la plantilla
- **Cuando** se compara con `AGENTS.md`
- **Entonces** los nombres de las clasificaciones, los estados de entrega y los comandos coinciden con los vigentes y no incorpora datos del propietario, remoto, licencia ni secretos

### QC-AC-03 — Puerta intacta

- **Dado** el cambio aplicado
- **Cuando** se ejecutan `npm run check` y `npm run test:tools`
- **Entonces** ambos finalizan con código `0` y una derivación en copia temporal incluye la plantilla sin que `template:init` ni `template:doctor` la rechacen

## Alcance técnico mínimo

| Archivo o área | Cambio previsto | Criterio |
| --- | --- | --- |
| `.github/pull_request_template.md` | Crear. | QC-AC-01, QC-AC-02 |
| `tests/tools/quality/workflow.test.ts` | Prueba de contrato: secciones, cuatro clasificaciones, comandos y ausencia de secretos. | QC-AC-01, QC-AC-02 |
| `README.md` | Mencionar la plantilla en la estructura (archivo gestionado). | QC-AC-01 |
| `tools/template/baseline-manifest.json`, `tests/tools/template/baseline.test.ts` | Regenerar hash de `README.md` y `baselineId`. | QC-AC-03 |
| `docs/platform/README.md` | Fila `PLAT-012`. | — |

## Pruebas y validación previstas

- Automatizadas: prueba de contrato de la plantilla; `npm run check` y `npm run test:tools`.
- Manual: derivación real en copia temporal. La apariencia de la plantilla en GitHub solo se comprueba tras una publicación autorizada, abriendo un pull request; una inspección local del archivo no equivale a esa comprobación.
- Comando de regresión: `npm run check && npm run test:tools`.

## Riesgos y reclasificación

- Riesgo: una plantilla larga se ignora; se mantendrá corta, con casillas.
- Riesgo: el vocabulario puede quedar desfasado si `AGENTS.md` cambia; la prueba de contrato cubre los nombres de las clases y los estados.
- Reclasificar como `FULL` o `ADR` si se pretende hacer obligatoria la plantilla mediante automatización o protección de rama.

## Puerta documental

La aprobación autoriza implementar únicamente este delta cuando exista autorización expresa de implementación. No autoriza commit ni publicación.

## Registro de entrega opcional

- Estado de entrega: `IMPLEMENTED`
- Archivos modificados: `.github/pull_request_template.md`, `tests/tools/quality/workflow.test.ts`, `README.md`, `tools/template/baseline-manifest.json` (hash de `README.md` y `baselineId` `react-vite-ts-sdd-template@2026-10-03-plat-012.1`), `tests/tools/template/baseline.test.ts`, `docs/platform/README.md`.
- Pruebas y resultados (2026-10-03): `npm run check` y `npm run test:tools` finalizan con código `0` (10 pruebas de aplicación, 58 de herramientas; cobertura 100 %). Derivación real en copia temporal (ya eliminada): `template:init` aplicado, `template:doctor` sin `FAIL`, la plantilla presente en el derivado y `npm run check` del derivado con código `0`. La apariencia en GitHub no se ha comprobado: requiere publicación autorizada y abrir un pull request.
- Desviaciones: `docs:check` interpretó `[ ] ... (texto)` como un enlace Markdown sin destino y falló; se reformularon dos líneas de la plantilla para usar comas en lugar de paréntesis. `docs:check` analiza también los Markdown de `.github/`. El resto, sin desviaciones.
- Aceptación: Pendiente
