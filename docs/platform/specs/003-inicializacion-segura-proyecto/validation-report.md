# Informe de validación — PLAT-003 Inicialización segura de proyectos derivados

**Estado de entrega:** VALIDATED

**Fecha de creación:** 2026-08-28

**Fecha de implementación:** 2026-08-28

**Fecha de validación:** 2026-08-28

**Aceptado por:** Tomás, usuario solicitante

**Evidencia de aceptación:** Aceptación expresa registrada en la conversación de trabajo.

## Alcance aprobado

- Especificación: `docs/platform/specs/003-inicializacion-segura-proyecto/spec.md`, versión `1.0.0`, `APPROVED`.
- Plan técnico: `docs/platform/specs/003-inicializacion-segura-proyecto/plan.md`, versión `1.0.0`, `APPROVED`.
- ADR aplicables: ADR-0001, ADR-0008, ADR-0009 y ADR-0010.
- Criterios cubiertos: REQ-01–REQ-11 y AC-01–AC-11.

## Implementación realizada

| Archivo o área | Cambio realizado | Criterio relacionado |
| --- | --- | --- |
| `tools/template/project.schema.json` y `project.config.example.json` | Contrato declarativo, ejemplo revisable, puerta de idoneidad y pendientes estructurados sin secretos. | REQ-01, REQ-02; AC-01–AC-03 |
| `tools/template/config.ts` y `types.ts` | Tipos, validación estricta, canonicalización y SHA-256 sin coerciones silenciosas. | REQ-01–REQ-03, REQ-11 |
| `tools/template/baseline-manifest.json` y `project.ts` | Hashes de baseline, remoto canónico, estructura, comandos, rutas reales y rechazo de symlinks. | REQ-04, REQ-05, REQ-07; AC-06, AC-08 |
| `tools/template/managed-files.ts` | Renderizado en memoria, clasificación de operaciones, token y estado determinista. | REQ-03, REQ-05, REQ-07; AC-04, AC-05, AC-07 |
| `tools/template/transaction.ts` | Preparación, diario, escrituras atómicas por archivo, rollback, recuperación y estado final último. | REQ-06, REQ-07; AC-09 |
| `tools/template/diagnostics.ts` y `doctor.ts` | Diagnósticos `PASS/WARN/FAIL/UNKNOWN` de solo lectura y límites explícitos. | REQ-09, REQ-10; AC-10, AC-11 |
| `tools/template/output.ts` e `init.ts` | CLI humana/JSON, códigos `0/1/2`, preview, apply con token y recuperación expresa. | REQ-03, REQ-08, REQ-11 |
| `tests/tools/template/` | Fixtures temporales y pruebas unitarias, integración, rollback, recuperación, doctor y procesos Node reales. | AC-01–AC-11 |
| `package.json`, `tsconfig.*`, `vite.config.ts` y `.gitignore` | Comandos, type-check Node, cobertura de herramientas y exclusión de transacciones y entornos sensibles. | REQ-06, REQ-08, REQ-11 |
| `README.md` y `AGENTS.md` | Flujo operativo, token, límites, doctor, recuperación y autorizaciones separadas. | REQ-01, REQ-03, REQ-08–REQ-10 |

No se modificaron componentes React ni se añadieron dependencias.

## Trazabilidad final

| Requisito o criterio | Código o documentación | Prueba o validación | Resultado |
| --- | --- | --- | --- |
| REQ-01 / AC-01 / AC-02 | Esquema y `config.ts` | Configuración apta aceptada; estado no apto o criterio pendiente rechazados. | Correcto |
| REQ-02 / AC-03 | Esquema, ejemplo y `config.ts` | Paquete inválido, campo secreto e incoherencias rechazados antes de escribir. | Correcto |
| REQ-03 / AC-04 / AC-05 | `managed-files.ts`, `init.ts` | Dos previews idénticos, snapshot y Git sin cambios; token cambia con configuración. | Correcto |
| REQ-04 / AC-06 | `project.ts` | Traversal, symlink y remoto canónico rechazados; fuente real devuelve código `2`. | Correcto |
| REQ-05 / AC-05 | Renderizadores y manifiesto | Copia derivada actualiza 15 operaciones coherentes; doctor posterior sin fallos. | Correcto |
| REQ-06 / AC-09 | `transaction.ts` | Fallo inyectado revierte; diario interrumpido se recupera por hashes. | Correcto |
| REQ-07 / AC-07 / AC-08 | Estado y hashes | Segunda ejecución: 15 rutas sin cambios y aplicación `changed=0`; contenido divergente se rechaza. | Correcto |
| REQ-08 / AC-05 | Entry point y revisión estática | Solo APIs locales; sin instalación, red, escritura Git ni publicación. | Correcto |
| REQ-09 / AC-10 | `diagnostics.ts` | Snapshot de archivos, modo, `mtime` y estado Git permanece idéntico. | Correcto |
| REQ-10 / AC-10 / AC-11 | Diagnósticos y salida | Secretos limitados a nombres/patrones, valores no impresos y `UNKNOWN` explícito. | Correcto |
| REQ-11 / AC-04 / AC-10 | CLI y `output.ts` | Salida humana/JSON, orden estable y códigos `0`, `1` y `2` probados. | Correcto |

## Comprobaciones automatizadas

| Comando | Entorno | Resultado |
| --- | --- | --- |
| `npm run check` | Plantilla fuente; Node 22.23.2, npm 10.9.8 | Correcto: lint, 8 archivos de prueba, 25/25 pruebas, type-check y build Vite. |
| `npm run test:coverage` | Plantilla fuente; Vitest 4.1.11 y V8 | Correcto: 25/25 pruebas; total 75.71 % statements, 59.61 % branches, 81.75 % functions y 77.64 % lines. |
| `npm run template:init -- --target . --config tools/template/project.config.example.json --format json` | Plantilla fuente con remoto canónico | Rechazo esperado, código `2`: no aplica sobre el origen protegido. |
| Preview y apply sobre copia temporal sin `.git` | Node 22.23.2 | Correcto: 4 creaciones, 10 modificaciones, 1 eliminación; 15 operaciones aplicadas. |
| `npm run template:doctor -- --target . --config project.config.json --format json` | Copia derivada inicializada | Correcto: 11 `PASS`, 11 `WARN`, 0 `FAIL`, 1 `UNKNOWN`; advertencias por decisiones/visión pendientes y remoto no observable. |
| `npm run check` | Copia derivada inicializada | Correcto: 8 archivos de prueba, 24 pruebas superadas, 1 prueba de remoto fuente omitida por no aplicar al derivado y build correcto. |
| Segundo preview y apply | Misma copia y configuración | Correcto: 15 operaciones `unchanged`, `changed=0`. |

## Validación manual o de navegador

- Cobertura: CLI real sobre la plantilla fuente y una copia derivada temporal; preview, aplicación, doctor, calidad e idempotencia.
- Resultado: la fuente quedó protegida y la copia derivada terminó coherente, ejecutable y sin fallos del doctor.
- Consola y red: navegador no aplicable porque PLAT-003 no modifica interfaz React; no se realizaron operaciones de red.
- Limpieza: la copia temporal utilizada para la validación fue eliminada después de obtener las evidencias.

## Desviaciones y riesgos residuales

- Desviación: ninguna respecto a la especificación y el plan aprobados.
- Riesgo residual: Node 22 ejecuta únicamente TypeScript con sintaxis borrable y no realiza type-check en runtime; `tsc -b` permanece obligatorio.
- Riesgo residual: el doctor inspecciona nombres y patrones conocidos y no demuestra ausencia absoluta de secretos o vulnerabilidades.
- Riesgo residual: un proyecto sin remoto observable depende de la evidencia humana incluida en la configuración y se informa como `UNKNOWN`.
- Riesgo residual: la cobertura se informa pero todavía no tiene umbrales mínimos; esa decisión pertenece a la tanda posterior de calidad.
- Riesgo residual: una interrupción abrupta no capturable se representa mediante un diario; la recuperación por hashes está probada mediante simulación controlada.
- Bloqueo: ninguno para presentar la entrega a aceptación.

## Puerta de entrega

La entrega está `VALIDATED` tras contrastar los criterios y recibir aceptación expresa. Commit, push, merge, despliegue y publicación requieren autorización independiente.
