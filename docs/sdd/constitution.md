# Constitución SDD

**Estado documental:** APPROVED

**Versión:** 2.0.0

**Fecha:** 2026-08-28

**Aprobado por:** Tomás, usuario solicitante

**Fecha de aprobación:** 2026-08-28

**Evidencia de aprobación:** Aprobación expresa registrada en la conversación de trabajo.

**Decisión aplicable:** ADR-0009 (`APPROVED`).

## Principios no negociables

1. **La intención funcional precede al código.** Toda capacidad nueva o modificación de comportamiento observable debe estar respaldada por una especificación, requisito, criterio de aceptación o decisión aprobada proporcional a su alcance. Los cambios internos equivalentes pueden seguir `DIRECT`; los cambios observables pequeños y localizados, `QUICK`; y las capacidades nuevas o los cambios significativos, `FULL`, según `docs/sdd/change-policy.md`. El código no sustituye a la especificación ni puede decidir silenciosamente requisitos ausentes.
2. **Aprobación explícita e identificable.** Ninguna etapa autoriza automáticamente la siguiente y ningún borrador concede permiso para implementar. Los artefactos nuevos registran versión, responsable, fecha y evidencia de aprobación sin inventar referencias inexistentes.
3. **Estado documental separado de la entrega.** `DRAFT`, `APPROVED` y `SUPERSEDED` describen la vigencia del contenido. `NOT_STARTED`, `IMPLEMENTED`, `VALIDATED`, `BLOCKED` y `NOT_APPLICABLE` describen la entrega y se registran fuera del contrato aprobado según ADR-0009.
4. **Trazabilidad proporcional y verificable.** Todo cambio de comportamiento debe responder a un requisito, criterio o decisión aprobada:
   - `FULL`: requisito, criterio, diseño o plan, tarea, prueba, código y evidencia de validación.
   - `QUICK`: delta aprobado, criterio afectado, prueba, código y evidencia proporcional.
   - `DIRECT`: código, prueba o validación e historial de cambios, cuando exista.
   - `ADR`: decisión arquitectónica, documentación afectada e implementación autorizada por separado.
5. **Contenido aprobado estable.** Una especificación, plan o ADR aprobado no cambia silenciosamente para incorporar alcance o registrar progreso. Las modificaciones sustantivas requieren un delta, enmienda, nueva versión o decisión aprobados; la ejecución se registra en un informe separado cuando corresponda.
6. **Diseño proporcional.** Aplicar SOLID de forma pragmática, favorecer composición y justificar cada abstracción por una necesidad actual.
7. **Calidad integrada.** Accesibilidad, responsive, navegadores, errores, internacionalización, seguridad, privacidad, rendimiento, observabilidad, despliegue y pruebas se deciden y verifican donde sean aplicables, sin imponer valores ficticios a todos los proyectos.
8. **Cambio documental primero.** Si cambia el alcance, el comportamiento o una decisión aprobada, se preparan y aprueban primero únicamente los artefactos realmente afectados.
9. **Decisiones sustituibles y contrato navegable.** Las decisiones aprobadas son vinculantes mientras estén vigentes, pueden sustituirse mediante otro artefacto aprobado y deben conservar relaciones explícitas que permitan conocer el contrato efectivo.
10. **Publicación independiente.** Implementación y validación no autorizan por sí mismas commit, push, merge, despliegue ni publicación.
