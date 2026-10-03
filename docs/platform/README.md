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
| `PLAT-009` | [`Cambio QUICK`](specs/009-automatizar-dependencias-y-seguridad-ci/quick-change.md) | `APPROVED` / `IMPLEMENTED` | Actualización automática de dependencias y comprobación de seguridad programada en CI. |
| `PLAT-010` | [`Cambio QUICK`](specs/010-endurecimiento-lint-formato-y-tipado/quick-change.md) | `APPROVED` / `IMPLEMENTED` | Aplica ADR-0015: tipado más estricto, ESLint con tipos, Prettier en la puerta e i18n tipado. |

Los alias `PLAT-001` y `PLAT-002` permiten distinguir estas capacidades de las futuras features de producto. No reescriben los identificadores, estados ni evidencias de los artefactos originales.

## Reglas

- Las nuevas capacidades funcionales de la plataforma utilizarán identificadores `PLAT-<número>`.
- `specs/` en la raíz queda reservado para el producto derivado.
- Las referencias nuevas utilizarán el alias y la ruta completa del artefacto de plataforma.
- Los documentos históricos anteriores a ADR-0009 conservan su modelo integrado de estado y evidencias.
- Para derivaciones futuras, `PLAT-007` modifica el contrato de `PLAT-003` y `PLAT-005` sobre estado de inicialización y diagnóstico: el proyecto derivado no recibe el bootstrap, su diagnóstico, su configuración ni `.template-state.json` (ADR-0014). Sus artefactos originales se conservan sin reescribir.
- Una evolución de plataforma seguirá el flujo SDD vigente y no modificará silenciosamente estos artefactos.

ADR-0010 define la separación entre plataforma y producto y la migración conservadora aplicada a este directorio.
