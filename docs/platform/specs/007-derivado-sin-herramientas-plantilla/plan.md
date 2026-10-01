# Plan técnico — PLAT-007 Proyecto derivado sin herramientas de plantilla

**Estado documental:** APPROVED

**Versión:** 1.0.0

**Fecha:** 2026-10-01

**Aprobado por:** Tomás, usuario solicitante

**Fecha de aprobación:** 2026-10-01

**Evidencia de aprobación:** Aprobación expresa de ADR-0014 y PLAT-007 («lo que sí hacemos es la aprobación del ADR y del PLAT… adelante») registrada en la conversación de trabajo, junto con la autorización de implementar y de actualizar la skill externa.

**Clasificación:** FULL

## Especificación y alcance autorizado

- Especificación: `docs/platform/specs/007-derivado-sin-herramientas-plantilla/spec.md`, versión `1.0.0`, `APPROVED`.
- Decisión: ADR-0014, versión `1.0.0`, `APPROVED`.
- Criterios cubiertos: AC-01 a AC-08.
- Fuera de alcance: eliminar `tools/quality` o `test:tools` del derivado; cambiar `npm run check`, cobertura o umbrales; migrar derivados existentes; instalar dependencias; Git, commit, publicación y despliegue.

## Decisiones y diseño

- ADR aplicables: ADR-0010, ADR-0012, ADR-0013 y ADR-0014.
- Componentes React propios: no se crean ni modifican; no aplica `@react-ts-feature-pattern`.
- Manifiesto: `schemaVersion: 2` con `derivation.exclude`; `loadBaselineManifest` valida el nuevo campo y rechaza v1.
- Sin estado: `buildPreview` y `assertProjectContext` comparan cada archivo gestionado con el hash de baseline o con el contenido renderizado. `.template-state.json` y `InitializationState` desaparecen del código.
- Salidas gestionadas: `package.json` (sin scripts `template:*`), `package-lock.json`, `index.html`, `README.md` (sin sección de diagnóstico) y `AGENTS.md` (sin el bloque entre `<!-- template-only:start -->` y `<!-- template-only:end -->`). Todas con hash de baseline.
- Doctor: `INITIALIZATION_STATE` se sustituye por `MANAGED_OUTPUTS`, que renderiza la salida deseada y la compara con el destino en modo lectura.
- Vitest: `test.projects` según ADR-0014 sección 7.

## Cambios previstos

| Archivo o área | Cambio | Criterio |
| --- | --- | --- |
| `tools/template/baseline-manifest.json`, `project.ts`, `types.ts` | Manifiesto v2, `derivation.exclude`, rechazo de rutas excluidas, retirada del estado. | AC-01, AC-02 |
| `tools/template/managed-files.ts`, `transaction.ts` | Renderizado sin estado, `AGENTS.md` y scripts gestionados, idempotencia por comparación. | AC-03, AC-04, AC-06 |
| `tools/template/diagnostics.ts`, `output.ts` | `MANAGED_OUTPUTS` en lugar de `INITIALIZATION_STATE`. | AC-05 |
| `AGENTS.md` | Marcadores `template-only` alrededor de las reglas de bootstrap y diagnóstico. | AC-06 |
| `README.md` | Documentar operación desde la plantilla, config externa y ausencia de estado. | AC-01 |
| `package.json` | Sin cambios de scripts del derivado más allá de la salida gestionada; conservar `template:*` en la plantilla. | AC-06 |
| `vite.config.ts` | `test.projects` `app` y `tools`. | AC-07 |
| `tests/tools/quality/runtime-config.test.ts` → `tests/tools/template/baseline.test.ts` | Trasladar la prueba de hashes; ajustar la de `vite.config.ts` si procede. | AC-01 |
| `tests/tools/template/**` | Adaptar pruebas a manifiesto v2, ausencia de estado y nuevos rechazos; añadir un caso de setup que accede a `document`. | AC-01 a AC-08 |
| `docs/platform/README.md`, `docs/architecture/README.md`, `specs` de PLAT-003/005 | Índices y nota de enmienda sin reescribir contenido histórico. | AC-08 |
| `~/.codex/skills/react-vite-ts-sdd-template-init/SKILL.md` | Copiar respetando `derivation.exclude`, config fuera del destino y comandos desde la plantilla. | AC-01 |

## Trazabilidad prevista

| Requisito o criterio | Implementación prevista | Prueba o validación prevista |
| --- | --- | --- |
| REQ-01, REQ-02 / AC-02 | Manifiesto y `project.ts` | Prueba de destino con ruta excluida |
| REQ-03, REQ-07 / AC-01 | `init`, `doctor`, prueba trasladada | Derivación completa en copia temporal con `test:tools` y `check` |
| REQ-04 / AC-03, AC-04 | `managed-files.ts` | Pruebas de no-op, configuración distinta y divergencia |
| REQ-05 / AC-05 | `diagnostics.ts` | Pruebas de doctor sobre destino aplicado y alterado |
| REQ-06 / AC-06 | `managed-files.ts`, `AGENTS.md` | Inspección del destino aplicado |
| REQ-08 / AC-07 | `vite.config.ts` | Prueba con setup que accede a `document` |
| REQ-09 / AC-08 | Pruebas existentes adaptadas | `npm run test:tools` |

## Dependencias e instalaciones

Ninguna.

## Estrategia de pruebas

- Unitarias: Vitest para configuración, proyecto, preview, transacción y diagnóstico.
- Integración: derivación completa en un directorio temporal y ejecución de `template:init`, `template:doctor`, `test:tools` y `check` desde la plantilla.
- Componentes/hooks y HTTP/MSW: no aplica.
- Manuales: revisión del diff de `AGENTS.md` y `README.md` renderizados.

## Tareas

1. Manifiesto v2 y `derivation.exclude`; rechazo de rutas excluidas.
2. Retirar el estado; idempotencia por comparación.
3. Salidas gestionadas: scripts, README y `AGENTS.md` con marcadores.
4. Doctor `MANAGED_OUTPUTS`.
5. Trasladar la prueba de hashes y adaptar la suite de plantilla.
6. `test.projects` en `vite.config.ts` y prueba asociada.
7. Regenerar `baselineId` y hashes del manifiesto.
8. Actualizar README, índices y notas de enmienda.
9. Actualizar la skill externa.
10. Validar una derivación completa en copia temporal y registrar el informe.

## Riesgos, reversión y validación

- Riesgos: regenerar hashes de forma incoherente; la skill y el manifiesto desalineados; marcadores de `AGENTS.md` alterados.
- Reversión: revertir el commit de implementación y restaurar la skill desde su copia previa.
- Comandos de validación: `npm run check`, `npm run test:tools`, y la derivación temporal con `template:init`, `template:doctor`, `npm run test:tools` y `npm run check` en el destino.
- Evidencias necesarias para `VALIDATED`: salida de ambas suites en la plantilla, resultado de la derivación temporal, diff de la skill y aceptación expresa.

## Puerta documental

La aprobación de esta versión limita el alcance implementable a los cambios enumerados. La implementación requiere autorización expresa y se registra en un `validation-report.md` separado. No autoriza commit ni publicación.
