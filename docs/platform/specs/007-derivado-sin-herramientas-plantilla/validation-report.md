# Informe de validación — PLAT-007 Proyecto derivado sin herramientas de plantilla

**Estado de entrega:** VALIDATED

**Fecha de creación:** 2026-10-01

**Fecha de implementación:** 2026-10-01

**Fecha de validación:** 2026-10-01

**Aceptado por:** Tomás, usuario solicitante

**Evidencia de aceptación:** Aceptación expresa «Sí, acepto PLAT-007 y PLAT-008 como validados» registrada en la conversación tras presentar la derivación real, la puerta de calidad en verde y el CI correcto.

## Alcance aprobado

- Especificación: `docs/platform/specs/007-derivado-sin-herramientas-plantilla/spec.md`, versión `1.0.0`, `APPROVED`.
- Plan técnico: `docs/platform/specs/007-derivado-sin-herramientas-plantilla/plan.md`, versión `1.0.0`, `APPROVED`.
- ADR aplicables: ADR-0009, ADR-0010, ADR-0012, ADR-0013 y ADR-0014.
- Criterios cubiertos: AC-01 a AC-08.

## Implementación realizada

| Archivo o área | Cambio realizado | Criterio relacionado |
| --- | --- | --- |
| `tools/template/baseline-manifest.json`, `types.ts`, `project.ts` | Manifiesto v2 con `derivation.exclude`; `assertProjectContext` rechaza un destino que contenga rutas excluidas; se retira `InitializationState`. | AC-01, AC-02 |
| `tools/template/managed-files.ts`, `transaction.ts` | Renderizado sin estado: idempotencia por comparación con baseline o salida deseada; `AGENTS.md` gestionado (bloques `template-only`); retirada de scripts `template:*` y de la sección de diagnóstico del README. | AC-03, AC-04, AC-06 |
| `tools/template/diagnostics.ts`, `output.ts` | `MANAGED_OUTPUTS` sustituye a `INITIALIZATION_STATE`; el siguiente paso indica ejecutar el doctor desde la plantilla. | AC-05 |
| `AGENTS.md`, `README.md` | Marcadores `template-only` alrededor de las reglas de bootstrap; documentación del flujo desde la plantilla con configuración externa. | AC-01, AC-06 |
| `vite.config.ts` | `test.projects` `app` (jsdom y setup) y `tools` (node, sin setup), ambos con `extends: true`. | AC-07 |
| `tests/tools/template/**`, `tests/tools/quality/runtime-config.test.ts` | Prueba de hashes trasladada a `tests/tools/template/baseline.test.ts`; fixture con configuración externa; pruebas de exclusión, ausencia de estado, no-op, configuración distinta, `MANAGED_OUTPUTS` y proyectos de Vitest. | AC-01 a AC-08 |
| `docs/platform/README.md`, `docs/architecture/README.md` | Índices y nota de enmienda de PLAT-003 y PLAT-005. | AC-08 |
| Skill externa `~/.codex/skills/react-vite-ts-sdd-template-init/SKILL.md` | Copia respetando `derivation.exclude` leído en vivo, configuración fuera del destino y comandos ejecutados desde la plantilla. | AC-01 |

## Trazabilidad final

| Requisito o criterio | Código o documentación | Prueba o validación | Resultado |
| --- | --- | --- | --- |
| AC-01 | manifiesto, `project.ts`, `managed-files.ts`, skill | Derivación completa en copia temporal: preview (5 modificaciones), apply, doctor, `npm run test:tools` (5 archivos, 18 pruebas) y `npm run check` en el destino | Correcto, también con la skill real (ver la sección de prueba real) |
| AC-02 | `findExcludedPaths` | `project.test.ts` (4 rutas) y copia ingenua en el destino temporal | Correcto: «El destino contiene rutas que no se derivan… tests/tools/template, tools/template» |
| AC-03 | `buildPreview` | `initialization.test.ts` y repetición real en el destino temporal | Correcto: segunda ejecución con 5 `unchanged`; otra configuración rechazada |
| AC-04 | `buildPreview` | `initialization.test.ts` («contenido no reconocido») | Correcto |
| AC-05 | `diagnostics.ts` | `doctor.test.ts` (aplicado y alterado) | Correcto; sin modificar archivos |
| AC-06 | `managed-files.ts`, `AGENTS.md` | `initialization.test.ts`, `baseline.test.ts` y revisión del destino temporal | Correcto: sin `template:*`, sin `template-only`, con reglas de alcance SPA y `docs/platform/` |
| AC-07 | `vite.config.ts` | `runtime-config.test.ts`; en el destino temporal, `src/i18n/config.ts` accediendo a `document` | Correcto con `test.projects` (`test:tools` 18 pruebas y `test:coverage` 6 pruebas); con la configuración anterior, 5 archivos fallan con `ReferenceError: document is not defined` |
| AC-08 | pruebas PLAT-003 y PLAT-005 adaptadas | `npm run test:tools` | Correcto: preview, token, rollback, recuperación, symlinks y remoto canónico siguen cubiertos |

## Comprobaciones automatizadas

| Comando | Entorno | Resultado |
| --- | --- | --- |
| `npm run check` en la plantilla | Node `22.23.2`, npm `10.9.8`, Vitest `4.1.11` | Correcto: lint, `docs:check` (51 documentos), `architecture:check` (6 archivos), 4 archivos y 6 pruebas de aplicación con 100 % de cobertura de `src/`, y build |
| `npm run test:tools` en la plantilla | Ídem | Correcto: 11 archivos y 53 pruebas |
| Derivación temporal: `template:init` (preview y apply), repetición, otra configuración y `template:doctor` | Ídem | Correcto según la tabla de trazabilidad |
| `npm run docs:check`, `architecture:check`, `test:tools` y `check` en el destino derivado | Ídem | Correcto: sin `tools/template`, `tests/tools/template`, `project.config.json` ni `.template-state.json` |

## Prueba real con la skill de derivación

Derivación de `Prueba Derivada` (`prueba-derivada`) en `/tmp/prueba-derivada`, siguiendo `react-vite-ts-sdd-template-init` con la baseline `react-vite-ts-sdd-template@2026-10-01-plat-008`:

| Paso | Resultado |
| --- | --- |
| Preview ejecutado desde la plantilla con configuración externa | Correcto: 5 modificaciones (`AGENTS.md`, `index.html`, `package-lock.json`, `package.json`, `README.md`) |
| Apply con el token autorizado expresamente | Correcto: 5 operaciones, sin transacción pendiente |
| `template:doctor` | 9 `PASS`, 0 `FAIL`, 1 `UNKNOWN` (`SOURCE_REMOTE`, sin remoto) |
| Contenido del destino | Sin `project.config.json`, `.template-state.json`, `tools/template` ni `tests/tools/template`; `.claude` con `launch.json` y `skills`; 0 coincidencias de `template:` en `package.json`, `README.md` y `AGENTS.md` |
| `npm ci` (autorizado) | Correcto |
| `npm run check` en el destino | Correcto: 4 archivos y 6 pruebas, cobertura de `src/` al 100 % y build |
| `npm run test:tools` en el destino | Correcto: 5 archivos y 18 pruebas |

CI de GitHub Actions: ejecuciones del workflow `Quality` correctas en los commits de implementación, documentación, skill de proyecto, PLAT-008 y actualización de dependencias.

## Validación manual o de navegador

- Cobertura: no aplica; no cambia la interfaz React.
- Resultado: revisión manual de `AGENTS.md`, `README.md` y `package.json` del destino temporal.
- Consola y red: no aplica.

## Desviaciones y riesgos residuales

- Desviación: la prueba real reveló que la skill copiaba por directorio y arrastraba `.idea/`. Se corrigió en la skill externa para copiar solo los archivos versionados por Git (`git ls-files`); el conjunto resultante coincide con el anterior sin `.idea`.
- Desviación: `npm audit` informó de 2 vulnerabilidades altas (`undici` por `jsdom` y `brace-expansion` por `eslint`), ajenas a este alcance. Se resolvieron aparte actualizando el lockfile dentro de los rangos declarados (`b151004`); `npm audit` informa 0.
- Desviación: la skill externa se actualizó en la misma entrega, como autorizó expresamente la persona solicitante; su diff no forma parte del repositorio.
- Riesgo residual: la idempotencia sin estado acepta como «sin cambios» un `package.json` que ya coincide con su salida renderizada aunque tenga contenido añadido posteriormente; nunca lo sobrescribe.
- Riesgo residual: `MANAGED_OUTPUTS` solo describe la derivación recién aplicada; un proyecto evolucionado puede diferir legítimamente.
- Bloqueo: ninguno.

## Puerta de entrega

- Para `IMPLEMENTED`: todo el alcance aprobado está ejecutado y las comprobaciones quedan registradas.
- Para `VALIDATED`: los criterios han sido contrastados y el resultado ha recibido aceptación expresa.
- Commit, push, merge, despliegue y publicación requieren autorización independiente.
