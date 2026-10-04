# Plataforma heredada

Este directorio contiene el contrato y el histórico de capacidades incorporadas a la baseline. Los proyectos derivados conservan estas decisiones mientras utilicen la plataforma correspondiente.

## Especificaciones de plataforma

| Alias de plataforma | Artefactos | Estado documental / entrega | Responsabilidad efectiva |
| --- | --- | --- | --- |
| `PLAT-001` | [`FEAT-001 — Enrutamiento base de la SPA`](specs/001-enrutamiento-base-spa/spec.md) | Modelo histórico: `VALIDATED` | React Router declarativo, ruta raíz y fallback de alojamiento documentado. |
| `PLAT-002` | [`FEAT-002 — Carga diferida de páginas`](specs/002-carga-diferida-rutas/spec.md) y su [enmienda obligatoria](specs/002-carga-diferida-rutas/amendment-001-obligatoriedad-paginas.md) | Modelo histórico: `VALIDATED` | `React.lazy`, `Suspense` y carga diferida obligatoria para todas las páginas. |
| `PLAT-003` | [`Especificación`](specs/003-inicializacion-segura-proyecto/spec.md), [plan técnico](specs/003-inicializacion-segura-proyecto/plan.md) e [informe](specs/003-inicializacion-segura-proyecto/validation-report.md) | `APPROVED` / `VALIDATED` | Bootstrap previsualizable e idempotente y `template:doctor` de solo lectura. |
| `PLAT-004` | [`Especificación`](specs/004-puerta-calidad-automatizada/spec.md), [plan técnico](specs/004-puerta-calidad-automatizada/plan.md) e [informe](specs/004-puerta-calidad-automatizada/validation-report.md) | `APPROVED` / `VALIDATED` | Runtime reproducible y puerta local/CI con cobertura, integridad documental y límites arquitectónicos. |
| `PLAT-005` | [`Especificación`](specs/005-bootstrap-minimo-progresivo/spec.md), [plan técnico](specs/005-bootstrap-minimo-progresivo/plan.md) e [informe](specs/005-bootstrap-minimo-progresivo/validation-report.md) | `APPROVED` / `VALIDATED` | Bootstrap limitado a destino e identidad, sin decisiones de producto, con seguridad e idempotencia preservadas. |
| `PLAT-006` | [`Cambio QUICK`](specs/006-separacion-pruebas-aplicacion-plantilla/quick-change.md) e [informe](specs/006-separacion-pruebas-aplicacion-plantilla/validation-report.md) | `APPROVED` / `VALIDATED` | Separa la cobertura y pruebas de aplicación de la suite de mantenimiento de `tools/`. |
| `PLAT-007` | [`Especificación`](specs/007-derivado-sin-herramientas-plantilla/spec.md), [plan técnico](specs/007-derivado-sin-herramientas-plantilla/plan.md) e [informe](specs/007-derivado-sin-herramientas-plantilla/validation-report.md) | `APPROVED` / `VALIDATED` | Proyecto derivado sin bootstrap, diagnóstico ni estado de plantilla, y proyectos de Vitest separados. |
| `PLAT-008` | [`Cambio QUICK`](specs/008-excluir-configuracion-local-claude/quick-change.md) e [informe](specs/008-excluir-configuracion-local-claude/validation-report.md) | `APPROVED` / `VALIDATED` | Excluye `.claude/settings.local.json` de la derivación. |
| `PLAT-009` | [`Cambio QUICK`](specs/009-automatizar-dependencias-y-seguridad-ci/quick-change.md) | `APPROVED` / `VALIDATED` | Actualización automática de dependencias y comprobación de seguridad programada en CI. |
| `PLAT-010` | [`Cambio QUICK`](specs/010-endurecimiento-lint-formato-y-tipado/quick-change.md) | `APPROVED` / `VALIDATED` | Aplica ADR-0015: tipado más estricto, ESLint con tipos, Prettier en la puerta e i18n tipado. |
| `PLAT-011` | [`Cambio QUICK`](specs/011-pruebas-accesibilidad-axe-core/quick-change.md) | `APPROVED` / `VALIDATED` | Aplica ADR-0016: pruebas automáticas de accesibilidad con `axe-core` en Vitest. |
| `PLAT-012` | [`Cambio QUICK`](specs/012-plantilla-pull-request-sdd/quick-change.md) | `APPROVED` / `VALIDATED` | Plantilla de pull request con clasificación SDD, trazabilidad, validación y autorizaciones. |
| `PLAT-013` | [`Cambio QUICK`](specs/013-ignorar-majors-bloqueados-dependabot/quick-change.md) | `APPROVED` / `VALIDATED` | Dependabot ignora los majors bloqueados de TypeScript 7 y MSW 3, con motivo y condición de retirada. |
| `PLAT-014` | [`Cambio QUICK`](specs/014-excluir-material-de-mantenimiento-de-la-derivacion/quick-change.md) | `APPROVED` / `VALIDATED` | Excluye `docs/superpowers/**` de la derivación. |
| `PLAT-015` | [`Cambio QUICK`](specs/015-titulo-html-con-caracteres-especiales/quick-change.md) | `APPROVED` / `VALIDATED` | Corrige el título de `index.html` cuando el nombre visible contiene patrones especiales de reemplazo (`$&`, `$$`). |
| `PLAT-016` | [`Cambio QUICK`](specs/016-docs-check-cambios-quick-y-entrega-embebida/quick-change.md) | `APPROVED` / `VALIDATED` | `docs:check` gobierna los cambios QUICK de plataforma y su registro de entrega embebido. |
| `PLAT-017` | [`Cambio QUICK`](specs/017-architecture-check-reglas-de-agents/quick-change.md) | `APPROVED` / `VALIDATED` | `architecture:check` detecta carpetas técnicas globales y fugas de MSW, `mocks/` y traducciones en `src/`. |
| `PLAT-018` | [`Cambio QUICK`](specs/018-observaciones-menores-de-la-auditoria/quick-change.md) | `APPROVED` / `VALIDATED` | Comentarios en `.env.example`, mensaje de enlaces absolutos y comprobación de todos los remotos. |
| `PLAT-019` | [`Cambio QUICK`](specs/019-migracion-a-node-26-lts/quick-change.md) | `APPROVED` / `NOT_STARTED` | Migración a Node 26 LTS, no aplicable antes del 2026-10-28 (ADR-0017). |
| `PLAT-020` | [`Cambio QUICK`](specs/020-adopcion-de-msw-3/quick-change.md) | `DRAFT` / `NOT_STARTED` | Adopción de MSW 3, no aplicable hasta que PLAT-019 esté aplicado. |
| `PLAT-021` | [`Cambio QUICK`](specs/021-alinear-la-skill-con-el-contrato-del-proyecto/quick-change.md) | `APPROVED` / `VALIDATED` | Alinea la skill `react-ts-feature-pattern` con `AGENTS.md`, ADR-0003, ADR-0008 y PLAT-017; Sonar solo bajo demanda. |
| `PLAT-022` | [`Cambio QUICK`](specs/022-docs-check-secciones-obligatorias-de-cambios-quick/quick-change.md) | `APPROVED` / `VALIDATED` | `docs:check` exige las secciones obligatorias de los cambios QUICK aprobados. |
| `PLAT-023` | [`Cambio QUICK`](specs/023-notas-de-plantilla-de-plan-y-agents/quick-change.md) | `APPROVED` / `VALIDATED` | Alinea la plantilla de plan técnico y `AGENTS.md` con `strict`, la aserción de accesibilidad y `npm run format`. |
| `PLAT-024` | [`Cambio QUICK`](specs/024-aplicar-el-registro-de-entrega-embebido-en-quick/quick-change.md) | `APPROVED` / `IMPLEMENTED` | Aplica ADR-0018: registro de entrega embebido en los QUICK, sin el criterio de «trivial». |
| `PLAT-025` | [`Cambio QUICK`](specs/025-ci-de-herramientas-fuera-del-workflow-heredable/quick-change.md) | `APPROVED` / `NOT_STARTED` | Aplica ADR-0019: `test:tools` se ejecuta en un workflow propio de la plantilla, excluido de la derivación. |

Los alias `PLAT-001` y `PLAT-002` permiten distinguir estas capacidades de las futuras features de producto. No reescriben los identificadores, estados ni evidencias de los artefactos originales.

## Reglas

- Las nuevas capacidades funcionales de la plataforma utilizarán identificadores `PLAT-<número>`.
- `specs/` en la raíz queda reservado para el producto derivado.
- Las referencias nuevas utilizarán el alias y la ruta completa del artefacto de plataforma.
- Los documentos históricos anteriores a ADR-0009 conservan su modelo integrado de estado y evidencias.
- Para derivaciones futuras, `PLAT-007` modifica el contrato de `PLAT-003` y `PLAT-005` sobre estado de inicialización y diagnóstico: el proyecto derivado no recibe el bootstrap, su diagnóstico, su configuración ni `.template-state.json` (ADR-0014). Sus artefactos originales se conservan sin reescribir.
- Una evolución de plataforma seguirá el flujo SDD vigente y no modificará silenciosamente estos artefactos.

ADR-0010 define la separación entre plataforma y producto y la migración conservadora aplicada a este directorio.
