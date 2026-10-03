# PLAT-014 — Excluir de la derivación el material de mantenimiento de la plantilla

**Estado documental:** APPROVED

**Versión:** 1.0.0

**Fecha:** 2026-10-03

**Aprobado por:** Tomás, usuario solicitante

**Fecha de aprobación:** 2026-10-03

**Evidencia de aprobación:** Aprobación expresa «Aprueba PLAT-014 e impleméntalo» registrada en la conversación de trabajo, tras proponerse el cambio como `QUICK`.

**Clasificación:** QUICK

## Contrato afectado

- Especificación vigente: PLAT-007, versión `1.0.0`, REQ-01 y REQ-02; AC-01 y AC-02, y PLAT-008 (`derivation.exclude` ampliado con `.claude/settings.local.json`).
- Decisión vigente: ADR-0014, sección 1 («como mínimo»).
- Motivo de clasificación: amplía una lista de exclusión de forma pequeña y localizada, sin decisión arquitectónica nueva; mismo patrón que PLAT-008.

## Delta funcional

### Comportamiento vigente

`derivation.exclude` contiene `tools/template/**`, `tests/tools/template/**`, `project.config.json`, `.template-state.json` y `.claude/settings.local.json`. El commit `047a036` añadió `docs/superpowers/plans/2026-10-03-mejoras-baseline-plantilla.md`, una hoja de ruta de mantenimiento de la plantilla; una derivación real hecha el 2026-10-03 (copia temporal, ya eliminada) lo copió al proyecto derivado, que lo recibe en `docs/superpowers/plans/`.

### Comportamiento aprobado propuesto

- `derivation.exclude` añade `docs/superpowers/**`.
- La copia de la derivación no incluye `docs/superpowers/` y `template:init` rechaza un destino que lo contenga, indicando la ruta y sin escribir nada.
- `AGENTS.md` cita la ruta en la regla de ADR-0014 (bloque `template-only`).
- La skill externa de derivación lee la lista en vivo del manifiesto, como se indicó en PLAT-008.
- El plan de mejora permanece en la plantilla.

### Fuera de alcance

- Excluir otras rutas de `docs/` (por ejemplo `docs/platform/specs/`, que cada derivado hereda por ADR-0010) ni otros archivos de `.claude/`.
- Impedir que un derivado cree después su propio `docs/superpowers/` (por ejemplo, con planes propios): el cambio solo evita que la plantilla lo copie.
- Cambiar el comportamiento de preview, token, transacción o doctor.

## Criterios afectados

### QC-AC-01 — Material de mantenimiento no derivado

- **Dado** un destino que contiene `docs/superpowers/plans/x.md`
- **Cuando** se ejecuta el preview o `assertProjectContext`
- **Entonces** `template:init` falla indicando `docs/superpowers` y no escribe nada

### QC-AC-02 — Manifiesto coherente

- **Dado** el manifiesto de baseline
- **Cuando** se leen sus exclusiones
- **Entonces** incluye `docs/superpowers/**` y las cinco rutas anteriores

### QC-AC-03 — Derivación real sin la hoja de ruta

- **Dado** una copia de la plantilla que respeta `derivation.exclude`
- **Cuando** se aplican `template:init` y `template:doctor` y se ejecuta `npm run check` en el derivado
- **Entonces** el derivado no contiene `docs/superpowers`, el diagnóstico no tiene `FAIL` y la puerta finaliza con código `0` (en particular, `docs:check` no depende del archivo excluido)

## Alcance técnico mínimo

| Archivo o área | Cambio previsto | Criterio |
| --- | --- | --- |
| `tools/template/baseline-manifest.json` | Añadir la exclusión, nuevo `baselineId` y hashes. | QC-AC-02 |
| `AGENTS.md` | Citar la ruta en la regla de ADR-0014 (archivo gestionado; regenerar hashes). | QC-AC-02 |
| `tests/tools/template/project.test.ts`, `baseline.test.ts` | Cubrir el rechazo y la lista. | QC-AC-01, QC-AC-02 |
| `docs/platform/README.md` | Fila `PLAT-014`. | — |

## Pruebas y validación previstas

- Automatizadas: `npm run test:tools` y `npm run check`.
- Manual: derivación real en copia temporal que respete la lista, con comprobación de ausencia de `docs/superpowers`, `template:doctor` y `npm run check` del derivado.
- Comando de regresión: `npm run check && npm run test:tools`.

## Riesgos y reclasificación

- Riesgo: quien copie la plantilla con una herramienta que no lea `derivation.exclude` seguirá recibiendo el archivo; `template:init` lo detecta y rechaza.
- Riesgo: este repositorio mantiene sus propios planes en la ruta excluida; es el comportamiento buscado.
- Reclasificar como `FULL` o `ADR` si se pretende excluir directorios completos de `docs/` de forma general o revisar qué documentación de plataforma hereda un derivado.

## Puerta documental

La aprobación autoriza implementar únicamente este delta cuando exista autorización expresa de implementación. No autoriza commit ni publicación.

## Registro de entrega opcional

- Estado de entrega: `VALIDATED`
- Archivos modificados: `tools/template/baseline-manifest.json` (`derivation.exclude` con `docs/superpowers/**`, hash de `AGENTS.md` y `baselineId` `react-vite-ts-sdd-template@2026-10-03-plat-014.1`), `AGENTS.md`, `tests/tools/template/project.test.ts`, `tests/tools/template/baseline.test.ts`, `docs/platform/README.md`.
- Pruebas y resultados (2026-10-03): `npm run check` y `npm run test:tools` finalizan con código `0` (10 pruebas de aplicación, 59 de herramientas, una nueva para el rechazo de `docs/superpowers`). Derivación real en copias temporales (ya eliminadas): una copia ingenua que conservaba `docs/superpowers` fue rechazada por `template:init` con «El destino contiene rutas que no se derivan y debe copiarse respetando derivation.exclude: docs/superpowers»; otra copia construida con la lista del manifiesto no contenía `docs/superpowers`, `template:init` aplicó 5 operaciones, `template:doctor` no tuvo `FAIL`, `docs:check` del derivado dio OK (68 archivos) y `npm run check` del derivado finalizó con código `0`.
- Desviaciones: ninguna respecto al delta aprobado. La skill externa de derivación no se ha modificado ni verificado; se asume que lee la lista del manifiesto en vivo, como se indicó en PLAT-008.
- Aceptación: 2026-10-03, Tomás, usuario solicitante. Aceptación expresa «Acepto PLAT-014 como VALIDATED» registrada en la conversación de trabajo tras contrastar los criterios con la evidencia de este registro. La skill externa de derivación sigue sin verificarse; la aceptación se basa en la prueba de contrato y en las derivaciones reales hechas con la lista del manifiesto.
