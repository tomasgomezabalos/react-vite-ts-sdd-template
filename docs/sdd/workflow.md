# Flujo SDD

**Estado documental:** APPROVED

**Versión:** 2.1.0

**Fecha:** 2026-08-28

**Revisión:** 2026-10-04

**Aprobado por:** Tomás, usuario solicitante

**Fecha de aprobación:** 2026-10-04

**Evidencia de aprobación:** Aprobación expresa registrada en la conversación de trabajo (versión 2.0.0, 2026-08-28). La revisión 2.1.0 se aprobó el 2026-10-04 mediante «Aprueba ADR-0018 y PLAT-024 e impleméntalo».

**Decisión aplicable:** ADR-0009 (`APPROVED`) y ADR-0018 (`APPROVED`).

## Estados documentales

- `DRAFT`: contenido en preparación; no vincula ni autoriza la etapa siguiente.
- `APPROVED`: versión aprobada expresamente y vigente.
- `SUPERSEDED`: contenido sustituido por otro artefacto aprobado identificado explícitamente.

Las especificaciones, planes, cambios `QUICK` y ADR utilizan estos estados. Una modificación sustantiva requiere nueva versión y aprobación; el progreso de ejecución no se registra cambiando su estado documental.

## Estados de entrega

- `NOT_STARTED`: alcance aprobado todavía no implementado.
- `IMPLEMENTED`: alcance implementado y comprobado, pendiente de aceptación.
- `VALIDATED`: criterios contrastados y resultado aceptado expresamente.
- `BLOCKED`: una cuestión concreta impide avanzar.
- `NOT_APPLICABLE`: decisión o artefacto sin entrega ejecutable independiente.

Los estados de entrega se registran en `validation-report.md` o, en los cambios `QUICK`, en la sección de entrega de su `quick-change.md`. `IN_PROGRESS` puede mantenerse en la tarea, issue o conversación y no requiere editar el repositorio en cada avance.

## Aprobaciones

Todo artefacto nuevo que alcance `APPROVED` registra versión, persona que aprueba, fecha y evidencia disponible. Una aprobación autoriza únicamente la puerta descrita. Implementación, validación, commit, push, merge, despliegue y publicación permanecen separados.

## Clasificación inicial

Antes de modificar documentación o código, clasificar la petición conforme a `docs/sdd/change-policy.md`:

- `FULL`: capacidad nueva o cambio significativo, amplio o multiárea.
- `QUICK`: cambio de comportamiento observable pequeño y localizado.
- `DIRECT`: cambio interno equivalente, sin impacto observable, contractual, funcional ni arquitectónico.
- `ADR`: decisión técnica duradera o transversal; puede acompañar a `FULL`.

La clasificación determina los artefactos y puertas aplicables. Si el impacto crece, se detiene el trabajo y se reclasifica antes de continuar.

## Flujo FULL

1. **Visión y contexto.** Revisar la visión vigente; crearla o actualizarla solo cuando el cambio altere problema, usuarios, objetivos, límites o métricas del producto.
2. **Especificación funcional.** Preparar requisitos y criterios observables en `DRAFT`. Su aprobación autoriza preparar decisiones y plan; no autoriza implementación.
3. **Decisiones arquitectónicas.** Crear un ADR únicamente cuando exista una decisión duradera o transversal. Su aprobación permite usarla en planes; no autoriza por sí sola aplicarla.
4. **Plan técnico.** Definir solución, archivos, dependencias, pruebas, riesgos y tareas. Su aprobación limita el alcance implementable; la ejecución requiere autorización expresa.
5. **Implementación.** Ejecutar solo el alcance aprobado y registrar archivos, pruebas, comandos, resultados y desviaciones en `validation-report.md`. Al terminar, el informe pasa a `IMPLEMENTED`.
6. **Validación.** Contrastar el informe con los criterios. Solo la aceptación expresa permite registrar `VALIDATED`.

## Flujo QUICK

1. Identificar el requisito, criterio o contrato afectado.
2. Preparar `quick-change.md` con el delta, alcance mínimo y pruebas necesarias.
3. Comprobar referencias cruzadas y ausencia de contradicciones.
4. Obtener aprobación del cambio antes de implementar.
5. Actualizar o añadir pruebas e implementar únicamente el delta aprobado.
6. Registrar archivos, pruebas y resultados, desviaciones y aceptación en la sección de entrega del propio `quick-change.md`, separada del contrato aprobado; puede utilizarse un `validation-report.md` independiente cuando la evidencia sea demasiado extensa o la persona responsable lo pida (ADR-0018).
7. Validar el comportamiento afectado y registrar desviaciones y aceptación.

## Flujo DIRECT

1. Confirmar que no cambia comportamiento observable, contrato, requisito, dependencia ni arquitectura.
2. Modificar código y pruebas sin exigir una spec, plan o artefacto SDD nuevo.
3. Ejecutar las validaciones aplicables y conservar trazabilidad en el historial de cambios o informe final.
4. Reclasificar antes de continuar si aparece impacto observable o contractual.

## Flujo ADR

1. Identificar decisión, contexto, alternativas, consecuencias y relaciones.
2. Preparar el ADR en `DRAFT` mediante su plantilla.
3. Obtener aprobación antes de aplicar la decisión.
4. Solicitar por separado la aplicación concreta, con archivos y alcance definidos.
5. Aplicar además `FULL` cuando exista un cambio funcional significativo.

## Cambios y consolidación

- Una petición nueva no modifica silenciosamente contenido aprobado.
- `QUICK`, una enmienda, una nueva versión o un ADR actúan como delta explícito según el impacto.
- Cuando varios deltas dificulten conocer el contrato efectivo, se prepara una consolidación en `DRAFT`; solo su aprobación permite marcar los artefactos anteriores como `SUPERSEDED`.
- Las correcciones editoriales `DIRECT` no cambian significado y permanecen trazadas en el historial.
- Las contradicciones entre documentos aprobados bloquean el trabajo hasta que se resuelvan.

## Compatibilidad histórica

Los artefactos anteriores a ADR-0009 pueden conservar el encabezado y las evidencias del modelo histórico. No se migran por formalidad. Cuando deban cambiar, adoptarán el modelo vigente de forma proporcional.
