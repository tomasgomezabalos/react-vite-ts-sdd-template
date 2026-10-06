# Índice SDD

Este directorio define el proceso de cambio de la plantilla y de los proyectos derivados. Ante una contradicción, se detendrá el trabajo hasta resolverla mediante el flujo y la aprobación aplicables.

## Documentos vigentes

| Documento | Revisión actual | Responsabilidad |
| --- | --- | --- |
| [Constitución](constitution.md) | `APPROVED 2.0.0` | Principios no negociables y trazabilidad proporcional. |
| [Workflow](workflow.md) | `APPROVED 2.1.0` | Estados documentales, entrega, etapas y puertas de aprobación. |
| [Política de cambios](change-policy.md) | `APPROVED 2.2.0` | Clasificación `FULL`, `QUICK`, `DIRECT` y `ADR`. |

La constitución `2.0.0` aplica ADR-0009; el workflow `2.1.0` y la política de cambios `2.2.0` aplican además ADR-0018, y esta última aplica también ADR-0021. Todas están vigentes desde su aprobación expresa. Las versiones anteriores permanecen como antecedente en el historial Git.

## Plantillas disponibles

| Plantilla | Uso |
| --- | --- |
| [Visión de producto](templates/product-vision.md) | Problema, personas usuarias, objetivos, límites, métricas y perfil transversal del proyecto. |
| [Especificación funcional](templates/feature-spec.md) | Problema, alcance, escenarios y criterios observables de un cambio `FULL`. |
| [Plan técnico](templates/technical-plan.md) | Diseño, archivos, dependencias, pruebas, tareas, riesgos y validación del alcance aprobado. |
| [ADR](templates/adr.md) | Decisiones técnicas duraderas o transversales, alternativas y consecuencias. |
| [Cambio QUICK](templates/quick-change.md) | Delta funcional pequeño, localizado y proporcional. |
| [Informe de validación](templates/validation-report.md) | Implementación, trazabilidad, comprobaciones, desviaciones y aceptación. |

## Orden de consulta

1. Leer `AGENTS.md` y la constitución.
2. Clasificar la petición mediante la política de cambios.
3. Aplicar únicamente las etapas del workflow correspondientes a esa clasificación.
4. Consultar los ADR vigentes desde el [índice de arquitectura](../architecture/README.md).
5. Mantener separadas las autorizaciones de documentación, implementación, validación, commit y publicación.

El contrato y las especificaciones históricas de la baseline viven en `docs/platform/`; `specs/` está reservado para el producto derivado. Los artefactos históricos anteriores a ADR-0009 conservan su modelo original. Los artefactos nuevos separan el contrato aprobado de la entrega mediante un informe de validación.
