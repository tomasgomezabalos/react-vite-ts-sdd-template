# Plataforma heredada

Este directorio contiene el contrato y el histórico de capacidades incorporadas a la baseline. Los proyectos derivados conservan estas decisiones mientras utilicen la plataforma correspondiente.

## Especificaciones de plataforma

| Alias de plataforma | Artefactos | Estado documental / entrega | Responsabilidad efectiva |
| --- | --- | --- | --- |
| `PLAT-001` | [`FEAT-001 — Enrutamiento base de la SPA`](specs/001-enrutamiento-base-spa/spec.md) | Modelo histórico: `VALIDATED` | React Router declarativo, ruta raíz y fallback de alojamiento documentado. |
| `PLAT-002` | [`FEAT-002 — Carga diferida de páginas`](specs/002-carga-diferida-rutas/spec.md) y su [enmienda obligatoria](specs/002-carga-diferida-rutas/amendment-001-obligatoriedad-paginas.md) | Modelo histórico: `VALIDATED` | `React.lazy`, `Suspense` y carga diferida obligatoria para todas las páginas. |
| `PLAT-003` | [`Especificación`](specs/003-inicializacion-segura-proyecto/spec.md), [plan técnico](specs/003-inicializacion-segura-proyecto/plan.md) e [informe](specs/003-inicializacion-segura-proyecto/validation-report.md) | `APPROVED` / `VALIDATED` | Bootstrap previsualizable e idempotente y `template:doctor` de solo lectura. |
| `PLAT-004` | [`Especificación`](specs/004-puerta-calidad-automatizada/spec.md), [plan técnico](specs/004-puerta-calidad-automatizada/plan.md) e [informe](specs/004-puerta-calidad-automatizada/validation-report.md) | `APPROVED` / `IMPLEMENTED` | Runtime reproducible y puerta local/CI con cobertura, integridad documental y límites arquitectónicos. |

Los alias `PLAT-001` y `PLAT-002` permiten distinguir estas capacidades de las futuras features de producto. No reescriben los identificadores, estados ni evidencias de los artefactos originales.

## Reglas

- Las nuevas capacidades funcionales de la plataforma utilizarán identificadores `PLAT-<número>`.
- `specs/` en la raíz queda reservado para el producto derivado.
- Las referencias nuevas utilizarán el alias y la ruta completa del artefacto de plataforma.
- Los documentos históricos anteriores a ADR-0009 conservan su modelo integrado de estado y evidencias.
- Una evolución de plataforma seguirá el flujo SDD vigente y no modificará silenciosamente estos artefactos.

ADR-0010 define la separación entre plataforma y producto y la migración conservadora aplicada a este directorio.
