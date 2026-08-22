# Flujo SDD

**Estado:** APPROVED

**Aprobación:** 2026-08-22

## Estados

- `DRAFT`: artefacto aún no aprobado.
- `APPROVED`: contenido aprobado expresamente.
- `IMPLEMENTED`: alcance aprobado implementado, pendiente de validación.
- `VALIDATED`: criterios verificados y resultado aceptado expresamente.
- `BLOCKED`: una cuestión impide avanzar.
- `SUPERSEDED`: otro artefacto aprobado lo sustituye.

## Etapas y puertas

1. **Especificación funcional.** Define problema, alcance, comportamiento y criterios verificables. Su aprobación autoriza preparar decisiones y plan técnico; no autoriza instalaciones ni implementación.
2. **Decisiones arquitectónicas.** Un ADR documenta una decisión técnica sustituible. Su aprobación permite usarla en planes; por sí sola no autoriza instalaciones ni implementación.
3. **Plan técnico y tareas.** Define solución, archivos, dependencias, pruebas, riesgos y tareas. Su aprobación autoriza exclusivamente lo enumerado y solo cuando el usuario autorice implementar.
4. **Implementación.** Ejecuta el alcance aprobado y registra comprobaciones. Al finalizar pasa a `IMPLEMENTED`; todavía no está validado.
5. **Validación.** Contrasta evidencias con los criterios de aceptación. La aceptación expresa permite pasar a `VALIDATED`.

## Cambios

- Una petición nueva no modifica silenciosamente el alcance aprobado.
- Primero se actualiza el artefacto afectado y se obtiene la aprobación correspondiente.
- Las contradicciones entre documentos aprobados bloquean el trabajo hasta que se resuelvan.
