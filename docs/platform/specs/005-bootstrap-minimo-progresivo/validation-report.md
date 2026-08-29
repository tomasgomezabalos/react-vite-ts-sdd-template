# Informe de validación — PLAT-005 Bootstrap mínimo y progresivo

**Estado de entrega:** VALIDATED

**Fecha de creación:** 2026-08-29

**Fecha de implementación:** 2026-08-29

**Fecha de validación:** 2026-08-29

**Aceptado por:** Tomás, usuario solicitante

**Evidencia de aceptación:** Aceptación expresa registrada en la conversación de trabajo mediante “Adelante” tras presentar la puerta completa correcta y los riesgos residuales.

## Alcance aprobado

- Especificación: `docs/platform/specs/005-bootstrap-minimo-progresivo/spec.md`, versión `1.0.0`, `APPROVED`.
- Plan técnico: `docs/platform/specs/005-bootstrap-minimo-progresivo/plan.md`, versión `1.0.0`, `APPROVED`.
- ADR aplicables: ADR-0009, ADR-0010 y ADR-0012.
- Criterios cubiertos: REQ-01 a REQ-10 y AC-01 a AC-10.

## Implementación realizada

| Archivo o área | Cambio realizado | Criterio relacionado |
| --- | --- | --- |
| `tools/template/project.schema.json`, `project.config.example.json`, `types.ts` y `config.ts` | Contrato v2 cerrado con nombre visible/npm, propuesta npm determinista y defaults efectivos `0.1.0` / título visible. | REQ-02 a REQ-04; AC-01 a AC-03 |
| `tools/template/project.ts`, `managed-files.ts` y `baseline-manifest.json` | Fingerprint de baseline sin evidencia humana, estado v2 y salidas limitadas a paquete, lockfile, título, README y snapshot. | REQ-01, REQ-04, REQ-05, REQ-07; AC-03 a AC-08 |
| `tools/template/diagnostics.ts` y `output.ts` | Doctor técnico sin findings de producto, variables públicas condicionales y alcance explícito `technical-derivation`. | REQ-08 a REQ-10; AC-09, AC-10 |
| `tests/tools/template/` y `tests/tools/quality/runtime-config.test.ts` | Fixtures y casos v2 para configuración, seguridad, salidas mínimas, no-op, conflicto, rollback, recuperación, doctor, CLI y baseline PLAT-005. | AC-01 a AC-10 |
| `README.md` y `AGENTS.md` | Flujo mínimo, selección SPA implícita, descubrimiento posterior y puertas separadas. | REQ-01, REQ-02, REQ-06, REQ-09, REQ-10 |
| `docs/architecture/decisions/0012-bootstrap-minimo-y-descubrimiento-progresivo.md` e índices | Decisión y trazabilidad de plataforma aprobadas antes de implementar. | REQ-01 a REQ-10 |
| Skill `react-vite-ts-sdd-template-init` | Entrevista reducida a destino/nombre, confirmación npm, preview y apply; cuestionario eliminado. | REQ-01, REQ-02, REQ-06, REQ-10 |

## Trazabilidad final

| Requisito o criterio | Código o documentación | Prueba o validación | Resultado |
| --- | --- | --- | --- |
| REQ-01 / AC-01 / AC-05 | `project.ts`, manifiesto, AGENTS y skill | Copia temporal reconocida aceptada sin remoto ni evidencia declarada; selección SPA documentada. | Correcto |
| REQ-02 / AC-01 | esquema, ejemplo, `suggestPackageName` y skill | `Ágil / Café 2026` produce `agil-cafe-2026`; resumen e instrucciones limitados a destino/identidad. | Correcto |
| REQ-03 / AC-02 | esquema, tipos y validador | v1, propiedad heredada y clave con forma de secreto rechazadas; búsqueda negativa del contrato activo. | Correcto |
| REQ-04 / AC-03 | configuración efectiva y renderizado | Paquete y lockfile `agil-cafe@0.1.0`, título `Ágil Café` y `lang=en` heredado. | Correcto |
| REQ-05 / AC-04 | `managed-files.ts` y README derivado | No se crean visión ni `.env.example`; el estado registra solo cuatro salidas técnicas. | Correcto |
| REQ-06 / AC-05 | ADR-0012, README, AGENTS y skill | No existe puerta de idoneidad persistida; una incompatibilidad confirmada detiene el flujo antes de escribir. | Correcto por contrato; no se automatiza una conversación del skill |
| REQ-07 / AC-06 a AC-08 | preview, estado y transacción existente | Preview determinista y de solo lectura, apply de 5 operaciones, no-op, conflicto, rollback y recuperación por hash. | Correcto |
| REQ-08 / AC-09 | `diagnostics.ts` y doctor temporal | `PASS=9`, `WARN=0`, `FAIL=0`, `UNKNOWN=1` por remoto no observable; snapshot completo sin cambios. | Correcto |
| REQ-09 / AC-04 / AC-10 | README, AGENTS, `specs/README.md` intacto | Sin artefacto de producto; flujo SDD heredado disponible para el primer alcance real. | Correcto |
| REQ-10 / AC-06 / AC-10 | `output.ts` y skill | Token y rutas sin contenido, alcance técnico y autorizaciones posteriores separadas. | Correcto |

## Comprobaciones automatizadas

| Comando | Entorno | Resultado |
| --- | --- | --- |
| `node --version` / `npm --version` | Node `22.23.2`, npm `10.9.8` | Correcto |
| `npm ci` | Node `22.23.2`, npm `10.9.8`, lockfile vigente | Correcto; 308 paquetes instalados |
| `node --check tools/template/*.ts` | Node `22.23.2` | Correcto |
| Validación directa de configuración v2 | Node `22.23.2` | Correcto; defaults y propuesta npm deterministas; v1, extras y secretos rechazados |
| Comprobación de hashes del manifiesto | Node `22.23.2` | Correcto; 11 archivos y 0 divergencias |
| Derivación temporal preview/apply/no-op | Copia nueva sin `.git` ni dependencias | Correcto; 1 creación + 4 modificaciones, apply `changed=5` y repetición con 5 `unchanged` |
| Doctor temporal con snapshot antes/después | Node `22.23.2` | Correcto; 9 PASS, 0 WARN, 0 FAIL, 1 UNKNOWN; contenido, modo y mtime sin cambios |
| Validación manual automatizada de transacción | Node `22.23.2`, fixtures temporales | Correcto; preview de solo lectura, conflicto rechazado, rollback y recuperación restaurados |
| Primer `npm run check` | Node `22.23.2`, dependencias instaladas | Fallo específico: `runtime-config.test.ts` esperaba todavía el `baselineId` de PLAT-004; 46 de 47 pruebas correctas |
| Segundo y último `npm run check` | Node `22.23.2`, npm `10.9.8` | Correctos tras la corrección y después de actualizar este informe: lint, 45 documentos, arquitectura, 13 archivos y 47 pruebas, cobertura y build |
| `quick_validate.py <skill>` | Python del sistema y runtime incluido | Bloqueado antes de validar: `ModuleNotFoundError: No module named 'yaml'`; no se instalaron paquetes |
| Validación equivalente del frontmatter del skill | Ruby/Psych disponible | Correcto; YAML, claves, nombre, descripción y ausencia de TODO válidos; cuestionario ausente |

Cobertura de la puerta correcta: statements `78,40 %`, branches `62,24 %`, functions `87,05 %` y lines `81,29 %`; todos los valores superan los umbrales globales aprobados.

## Validación manual o de navegador

- Cobertura: copia temporal completa, configuración mínima, operaciones del preview, salidas finales, estado v2, no-op y salida JSON del doctor.
- Resultado: la copia conserva la baseline técnica y solo cambia identidad, README y snapshot; no aparecen artefactos ni decisiones de producto.
- Consola y red: navegador no aplica porque no cambia la aplicación React. El bootstrap temporal no utilizó red; `npm ci` se ejecutó como puerta separada autorizada.

## Desviaciones y riesgos residuales

- Desviación: se actualizó también `agents/openai.yaml` del skill, no enumerado por separado en el plan, porque su prompt visible conservaba “campo por campo” y contradecía el contrato mínimo. No se amplió la capacidad ni el conjunto de entradas.
- Desviación: la primera puerta completa reveló una expectativa de PLAT-004 en `tests/tools/quality/runtime-config.test.ts`; se actualizó al `baselineId` aprobado de PLAT-005 y la puerta completa posterior pasó.
- Riesgo residual: `SOURCE_REMOTE=UNKNOWN` es esperado en una copia local sin Git; el doctor limita la procedencia observable al fingerprint y al estado.
- Riesgo residual: la fuente predeterminada del skill en `/Users/tomas300472/workspaces/react-vite-ts-sdd-template` continúa en esquema v1 hasta que este worktree se integre mediante una puerta Git separada. El skill comprueba el contrato vivo y se detendrá, en lugar de ejecutar un flujo incompatible.
- Bloqueo: ninguno; los riesgos residuales registrados fueron aceptados expresamente.

## Puerta de entrega

- Estado actual: `VALIDATED`.
- Aceptación: expresa, registrada el 2026-08-29 tras contrastar la puerta completa y los riesgos residuales.
- Commit, push, merge, despliegue y publicación requieren autorización independiente.
