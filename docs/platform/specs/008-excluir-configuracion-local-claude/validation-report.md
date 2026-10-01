# Informe de validación — PLAT-008 Excluir la configuración local de Claude de la derivación

**Estado de entrega:** VALIDATED

**Fecha de creación:** 2026-10-01

**Fecha de implementación:** 2026-10-01

**Fecha de validación:** 2026-10-01

**Aceptado por:** Tomás, usuario solicitante

**Evidencia de aceptación:** Aceptación expresa «Sí, acepto PLAT-007 y PLAT-008 como validados» registrada en la conversación.

## Alcance aprobado

- Delta: `docs/platform/specs/008-excluir-configuracion-local-claude/quick-change.md`, versión `1.0.0`, `APPROVED`.
- Plan técnico: no aplica; el alcance técnico proporcional está incluido en el cambio QUICK.
- ADR aplicables: ADR-0014 y PLAT-007.
- Criterios cubiertos: QC-AC-01 y QC-AC-02.

## Implementación realizada

| Archivo o área | Cambio realizado | Criterio relacionado |
| --- | --- | --- |
| `tools/template/baseline-manifest.json` | `derivation.exclude` incluye `.claude/settings.local.json`; nuevo identificador y hashes. | QC-AC-02 |
| `AGENTS.md` | La regla de ADR-0014 cita la nueva ruta. | QC-AC-02 |
| `tests/tools/template/project.test.ts`, `baseline.test.ts` | Caso de rechazo del destino y comprobación de la lista de exclusión. | QC-AC-01, QC-AC-02 |
| Skill externa de derivación | Su lista actual incluye la ruta; el contenido se lee en vivo del manifiesto. | QC-AC-01 |

## Trazabilidad final

| Requisito o criterio | Código o documentación | Prueba o validación | Resultado |
| --- | --- | --- | --- |
| QC-AC-01 | `findExcludedPaths` y manifiesto | `project.test.ts` con `.claude/settings.local.json` | Correcto |
| QC-AC-02 | manifiesto | `baseline.test.ts` | Correcto |

## Comprobaciones automatizadas

| Comando | Entorno | Resultado |
| --- | --- | --- |
| `npm run check` | Node `22.23.2`, npm `10.9.8` | Correcto: 56 documentos, 6 archivos de arquitectura, 4 archivos y 6 pruebas con cobertura de `src/` al 100 % y build |
| `npm run test:tools` | Ídem | Correcto: 11 archivos y 54 pruebas |
| Derivación real de `/tmp/prueba-derivada` | Ídem | Correcto; el destino no contiene `.claude/settings.local.json` (ver informe de PLAT-007) |

## Validación manual o de navegador

- Cobertura: no aplica; no cambia la interfaz.

## Desviaciones y riesgos residuales

- Desviación: ninguna.
- Riesgo residual: otros archivos locales de `.claude/` no están excluidos; el delta solo cubre `settings.local.json`, y la skill copia solo archivos versionados por Git.
- Bloqueo: ninguno.

## Puerta de entrega

- Para `IMPLEMENTED`: todo el alcance aprobado está ejecutado y las comprobaciones quedan registradas.
- Para `VALIDATED`: los criterios han sido contrastados y el resultado ha recibido aceptación expresa.
- Commit, push, merge, despliegue y publicación requieren autorización independiente.
