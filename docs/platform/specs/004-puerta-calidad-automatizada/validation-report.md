# Informe de validación — PLAT-004 Puerta de calidad automatizada

**Estado de entrega:** VALIDATED

**Fecha de creación:** 2026-08-28

**Fecha de implementación:** 2026-08-28

**Fecha de validación:** 2026-08-28

**Aceptado por:** Tomás, usuario solicitante

**Evidencia de aceptación:** Aceptación expresa registrada en la conversación de trabajo tras contrastar la ejecución local y las ejecuciones reales de GitHub Actions.

## Alcance aprobado

- Especificación: `docs/platform/specs/004-puerta-calidad-automatizada/spec.md`, versión `1.0.0`, `APPROVED`.
- Plan técnico: `docs/platform/specs/004-puerta-calidad-automatizada/plan.md`, versión `1.0.0`, `APPROVED`.
- ADR aplicables: ADR-0001, ADR-0002, ADR-0008, ADR-0009, ADR-0010 y ADR-0011.
- Criterios cubiertos: REQ-01 a REQ-10 y AC-01 a AC-12. AC-10 dispone de ejecución remota correcta; la persona solicitante acepta que AC-11 conserva como límite declarado la cancelación real no observada, sin presentarla como probada.

## Implementación realizada

| Archivo o área | Cambio realizado | Criterio relacionado |
| --- | --- | --- |
| `package.json`, `package-lock.json` y `.nvmrc` | Runtime Node/npm coordinado, lockfile reproducible y `npm run check` como puerta única. | REQ-01, REQ-02; AC-01 a AC-04 |
| `tools/quality/` | Comprobadores de documentación y arquitectura de solo lectura, con diagnósticos ordenados y accionables. | REQ-03 a REQ-05, REQ-07; AC-05 a AC-08 |
| `vite.config.ts` | Cobertura V8 sobre código ejecutable de `src` y `tools`, con umbrales globales fijos. | REQ-06; AC-03, AC-09 |
| `tests/tools/quality/` | Fixtures positivos y negativos para runtime, documentación, imports, CLI, cobertura, workflow, orden y no mutación. | REQ-01, REQ-06 a REQ-09; AC-02 a AC-11 |
| `.github/workflows/quality.yml` | Workflow mínimo para `main` y pull requests, permisos de lectura, concurrencia, caché npm y acciones fijadas a SHA. | REQ-09; AC-10, AC-11 |
| `tools/template/` y `tests/tools/template/` | Compatibilidad de PLAT-003 con el rango Node, la puerta única y la nueva baseline. | REQ-01, REQ-02; AC-01 a AC-03 |
| `README.md`, `AGENTS.md` y `docs/platform/README.md` | Operación, garantías, limitaciones y trazabilidad de PLAT-004. | REQ-10; AC-12 |

## Trazabilidad final

| Requisito o criterio | Código o documentación | Prueba o validación | Resultado |
| --- | --- | --- | --- |
| REQ-01 / AC-01 / AC-02 | `package.json`, lockfile y `tools/template/diagnostics.ts` | Versiones efectivas, `npm ci`, coherencia de manifiestos y fixture `devEngines` incompatible. | Correcto |
| REQ-02 / AC-03 / AC-04 | scripts npm y CLIs de calidad | Puerta completa y códigos de salida controlados. | Correcto |
| REQ-03 / AC-05 / AC-06 | `markdown.ts`, `filesystem.ts` y `docs-check.ts` | Enlaces, anclas, rutas no comprobables, índices, estados y metadatos. | Correcto |
| REQ-04 / AC-05 / AC-06 | `docs-policy.ts` y `docs-check.ts` | Repositorio válido y fixtures documentales inválidos. | Correcto |
| REQ-05 / AC-07 / AC-08 | `imports.ts`, `architecture-policy.ts` y `architecture-check.ts` | Capas, páginas, privacidad, alias, destinos ausentes e imports dinámicos. | Correcto |
| REQ-06 / AC-03 / AC-09 | `vite.config.ts` | Cobertura real por encima del umbral y fixture subumbral bloqueado. | Correcto |
| REQ-07 / AC-04 a AC-08 | modelo, salida y fixtures | Orden determinista, códigos `0`, `1` y `2`, y snapshots sin cambios. | Correcto |
| REQ-08 / AC-06 / AC-08 | `tests/tools/quality/` | Casos positivos y negativos sin red ni estado Git externo. | Correcto |
| REQ-09 / AC-10 / AC-11 | workflow y `workflow.test.ts` | Contrato local inspeccionado y ejecución real correcta tras corregir el timeout observado en el primer run. | Correcto para AC-10; cancelación real de AC-11 no observada |
| REQ-10 / AC-10 / AC-12 | README, AGENTS e informe | Revisión documental de garantías y exclusiones. | Correcto |

## Comprobaciones automatizadas

| Comando | Entorno | Resultado |
| --- | --- | --- |
| `node --version` / `npm --version` | Node `22.23.2`, npm `10.9.8` | Correcto |
| `npm ci` | Node `22.23.2`, npm `10.9.8`, `package-lock.json` vigente | Correcto; 308 paquetes instalados |
| `npm test -- tests/tools/quality tests/tools/template/doctor.test.ts` | Vitest `4.1.11` | Correcto; 6 archivos y 20 pruebas |
| `npm test -- tests/tools/quality/runtime-config.test.ts` | Vitest `4.1.11` | Correcto; 1 archivo y 5 pruebas, incluido el bloqueo subumbral |
| `npm run check` | Node `22.23.2`, npm `10.9.8` | Correcto; 13 archivos y 44 pruebas, cobertura y build correctos |
| [GitHub Actions `33210972020`](https://github.com/tomasgomezabalos/react-vite-ts-sdd-template/actions/runs/33210972020) | Ubuntu, Node/npm declarados, commit `ef0129c` | Fallo: dos pruebas de integración de PLAT-003 superaron el timeout predeterminado de 5 s; lint, documentación y arquitectura habían finalizado correctamente |
| [GitHub Actions `33211404839`](https://github.com/tomasgomezabalos/react-vite-ts-sdd-template/actions/runs/33211404839) | Ubuntu, Node/npm declarados, commit `3804a52` | Correcto; instalación y puerta completa superadas en 40 s |
| [GitHub Actions `33211618417`](https://github.com/tomasgomezabalos/react-vite-ts-sdd-template/actions/runs/33211618417) | Ubuntu, Node/npm declarados, commit `2ba05af` | Correcto; commit documental final y puerta completa superados en 41 s |

Cobertura observada en la puerta completa: statements `79,70 %`, branches `64,98 %`, functions `85,92 %` y lines `82,16 %`. Todos los valores superan los umbrales globales aprobados.

## Validación manual o de navegador

- Cobertura: revisión local de los mensajes de éxito y error de ambos comprobadores y del contrato textual del workflow.
- Resultado: los diagnósticos incluyen código, archivo, ubicación disponible y mensaje; el orden se comprueba mediante pruebas.
- Consola y red: navegador no aplica. Los comprobadores no usan red. La primera ejecución remota expuso un timeout específico del runner; la segunda ejecución confirmó la corrección y completó la puerta.

## Desviaciones y riesgos residuales

- Desviación: la primera ejecución remota necesitó más de 5 s para dos pruebas de integración válidas. Se aplicó un timeout explícito de 30 s solo para esos casos, sin relajar el resto de la suite ni cambiar el comportamiento probado.
- Riesgo residual: el parser Markdown cubre las formas documentadas, pero no sustituye una implementación completa de CommonMark; las dependencias laterales entre features o entidades continúan requiriendo revisión semántica; los umbrales son globales y no por archivo.
- Bloqueo: ninguno. La cancelación de una ejecución sustituida no se ha provocado artificialmente y permanece como límite de evidencia aceptado para AC-11.

## Puerta de entrega

- Estado actual: `VALIDATED`.
- Aceptación: expresa, registrada el 2026-08-28 con el límite de evidencia de AC-11 indicado en este informe.
- Commit, push, merge, despliegue y publicación requieren autorización independiente.
