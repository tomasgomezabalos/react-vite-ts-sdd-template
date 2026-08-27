# Flujo SDD

**Estado:** APPROVED

**Versión:** 1.1.0

**Aprobación:** 2026-08-27

## Estados

- `DRAFT`: artefacto aún no aprobado.
- `APPROVED`: contenido aprobado expresamente.
- `IMPLEMENTED`: alcance aprobado implementado, pendiente de validación.
- `VALIDATED`: criterios verificados y resultado aceptado expresamente.
- `BLOCKED`: una cuestión impide avanzar.
- `SUPERSEDED`: otro artefacto aprobado lo sustituye.

## Clasificación inicial

Antes de modificar documentación o código, clasificar la petición conforme a `docs/sdd/change-policy.md`:

- `FULL`: capacidad nueva o cambio significativo, amplio o multiárea.
- `QUICK`: cambio de comportamiento observable pequeño y localizado.
- `DIRECT`: cambio interno equivalente, sin impacto observable, contractual, funcional ni arquitectónico.
- `ADR`: decisión técnica duradera o transversal; puede acompañar a `FULL`.

La clasificación determina qué artefactos y puertas son aplicables. No elimina las aprobaciones exigidas para los artefactos que deban cambiar.

## Etapas y puertas del flujo FULL

1. **Especificación funcional.** Define problema, alcance, comportamiento y criterios verificables. Su aprobación autoriza preparar decisiones y plan técnico; no autoriza instalaciones ni implementación.
2. **Decisiones arquitectónicas.** Un ADR documenta una decisión técnica sustituible. Su aprobación permite usarla en planes; por sí sola no autoriza instalaciones ni implementación.
3. **Plan técnico y tareas.** Define solución, archivos, dependencias, pruebas, riesgos y tareas. Su aprobación autoriza exclusivamente lo enumerado y solo cuando el usuario autorice implementar.
4. **Implementación.** Ejecuta el alcance aprobado y registra comprobaciones. Al finalizar pasa a `IMPLEMENTED`; todavía no está validado.
5. **Validación.** Contrasta evidencias con los criterios de aceptación. La aceptación expresa permite pasar a `VALIDATED`.

## Flujos proporcionales

### QUICK

1. Identificar el requisito, criterio o contrato afectado.
2. Actualizar únicamente la documentación que realmente cambia.
3. Comprobar referencias cruzadas y ausencia de contradicciones.
4. Obtener aprobación de los artefactos modificados antes de implementar.
5. Actualizar o añadir pruebas e implementar el cambio.
6. Validar el comportamiento afectado y registrar resultados y desviaciones.

### DIRECT

1. Confirmar que no cambia comportamiento observable, contrato, requisito ni arquitectura.
2. Modificar el código y las pruebas necesarias sin exigir una nueva spec, plan o tareas.
3. Ejecutar las validaciones aplicables y registrar los resultados.

### ADR

1. Identificar la decisión, su contexto, alternativas y consecuencias.
2. Crear o actualizar el ADR y sus referencias.
3. Obtener su aprobación antes de implementar la decisión.
4. Aplicar además `FULL` cuando exista un cambio funcional significativo.

## Cambios

- Una petición nueva no modifica silenciosamente el alcance aprobado.
- Primero se clasifica la petición; después se actualiza únicamente el artefacto afectado y se obtiene la aprobación correspondiente.
- Si el impacto real supera la clasificación inicial, se detiene la implementación y se reclasifica antes de continuar.
- Las contradicciones entre documentos aprobados bloquean el trabajo hasta que se resuelvan.
