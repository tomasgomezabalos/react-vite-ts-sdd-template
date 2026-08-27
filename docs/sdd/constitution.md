# Constitución SDD

**Estado:** APPROVED

**Versión:** 1.1.0

**Aprobación:** 2026-08-27

## Principios no negociables

1. **La intención funcional precede al código.** Toda capacidad nueva o modificación de comportamiento observable debe estar respaldada por una especificación, requisito, criterio de aceptación o decisión aprobada proporcional a su alcance. No toda modificación del código constituye un cambio funcional: los cambios internos equivalentes pueden seguir `DIRECT`; los cambios observables pequeños y localizados, `QUICK`; y las capacidades nuevas o los cambios significativos, `FULL`, según `docs/sdd/change-policy.md`. El código no sustituye a la especificación ni puede decidir silenciosamente requisitos ausentes.
2. **Aprobación explícita.** Ninguna etapa autoriza automáticamente la siguiente y ningún borrador concede permiso para implementar.
3. **Trazabilidad proporcional y verificable.** Todo cambio de comportamiento debe responder a un requisito, criterio o decisión aprobada. La trazabilidad se mantiene sin duplicación innecesaria según la clasificación:
   - `FULL`: requisito, criterio, diseño o plan, tarea, prueba y código.
   - `QUICK`: requisito o criterio afectado, prueba y código.
   - `DIRECT`: código, prueba o validación e historial de cambios, cuando exista.
   - `ADR`: decisión arquitectónica, documentación afectada e implementación.
4. **Diseño proporcional.** Aplicar SOLID de forma pragmática, favorecer composición y justificar cada abstracción por una necesidad actual.
5. **Calidad integrada.** Accesibilidad, comportamiento responsive, errores, internacionalización y pruebas se incorporan donde sean aplicables a cada feature.
6. **Cambio documental primero.** Si cambia el alcance, el comportamiento o una decisión aprobada, se actualizan y aprueban los artefactos realmente afectados antes del código.
7. **Decisiones sustituibles.** Las decisiones arquitectónicas aprobadas son vinculantes mientras estén vigentes y pueden ser reemplazadas mediante otro ADR aprobado.
