# ADR-0018 — Registro de entrega de los cambios QUICK

**Estado documental:** APPROVED

**Versión:** 1.0.0

**Fecha:** 2026-10-04

**Aprobado por:** Tomás, usuario solicitante

**Fecha de aprobación:** 2026-10-04

**Evidencia de aprobación:** Aprobación expresa «Aprueba ADR-0018 y PLAT-024 e impleméntalo» registrada en la conversación de trabajo; la aplicación queda a cargo de PLAT-024.

**Relación:** Modifica parcialmente ADR-0009 §4 (dónde se registra la entrega de los cambios `QUICK`) y, cuando se aplique mediante PLAT-024, `docs/sdd/workflow.md`, `docs/sdd/change-policy.md`, la plantilla `quick-change.md` y `AGENTS.md`.

## Contexto

ADR-0009 §4 dispone que los cambios `FULL` y los `QUICK` «que necesiten evidencia persistente» utilicen un `validation-report.md`. El flujo `QUICK` de `docs/sdd/workflow.md` (paso 6) y de `docs/sdd/change-policy.md` (paso 6) añade que, «cuando sea trivial», la evidencia puede ir en una sección de entrega del propio `quick-change.md`, y la plantilla repite «solo cuando el cambio sea trivial». Ninguno de esos documentos define qué es trivial, y `AGENTS.md` solo menciona el informe independiente.

Práctica observada el 2026-10-04: los quince cambios `QUICK` PLAT-009 a PLAT-023 registran su entrega en la sección embebida, con archivos modificados, resultados extensos de pruebas, derivaciones reales, desviaciones y aceptación; ninguno es «trivial» en el sentido literal. Los informes independientes existen solo para PLAT-003 a PLAT-008. `docs:check` valida el registro embebido desde PLAT-016 (estado de entrega, archivos, resultados y aceptación completos según el estado) y exige desde PLAT-022 las secciones de la plantilla en los `quick-change.md` aprobados. Un truncamiento accidental del registro de PLAT-016 el 2026-10-03 (reparado el 2026-10-04) mostró el riesgo de editar un documento aprobado, mitigado hoy por esas dos comprobaciones.

El criterio ambiguo obliga a elegir caso por caso entre dos cauces, y la práctica ya ha elegido uno.

## Decisión propuesta

1. **Cambios `QUICK`:** la sección «Registro de entrega opcional» del propio `quick-change.md` es el cauce por defecto y suficiente para registrar archivos modificados, pruebas y resultados, desviaciones y aceptación, sin condición de «trivial». Un `validation-report.md` independiente sigue siendo posible para un `QUICK` cuando la evidencia sea demasiado extensa para el registro o la persona responsable lo pida, pero no es obligatorio.
2. **Cambios `FULL`:** sin cambios; exigen `validation-report.md` (ADR-0009 §4).
3. **Contrato aprobado y entrega:** el registro embebido permanece en su sección propia, sin modificar el contrato aprobado anterior; se aplican las mismas reglas de estado de entrega (`IMPLEMENTED` al terminar, `VALIDATED` solo con aceptación expresa) y las comprobaciones de `docs:check`.
4. **Terminología:** se retira la palabra «trivial» de `workflow.md`, `change-policy.md` y la plantilla; `AGENTS.md` pasa a describir ambos cauces.

## Aplicación prevista tras la aprobación

1. Un cambio `QUICK` (PLAT-024) que actualice `docs/sdd/workflow.md` y `docs/sdd/change-policy.md` (nueva versión `2.1.0` con su aprobación), `docs/sdd/README.md` (revisiones vigentes), `docs/sdd/templates/quick-change.md` y `AGENTS.md`, con una prueba de contrato y la regeneración de hashes del manifiesto.
2. Actualizar el índice de arquitectura y la relación de ADR-0009.

La aprobación del ADR permite utilizar la decisión en planes posteriores; no autoriza automáticamente su aplicación, commit ni publicación.

## Alternativas consideradas

### Definir «trivial» con un umbral

Un umbral (por ejemplo, número de archivos o de líneas) sería arbitrario, difícil de comprobar automáticamente y chocaría con la práctica de quince registros extensos que funcionan.

### Exigir `validation-report.md` en todos los cambios `QUICK`

Duplica el contrato y la entrega en dos archivos para cambios pequeños, que es lo que ADR-0009 quería evitar («documentación sin valor proporcional para cambios pequeños»).

### Registro embebido también para `FULL`

Los cambios `FULL` necesitan una tabla de trazabilidad completa entre requisitos, plan, tareas y pruebas; un informe independiente la acomoda mejor.

## Consecuencias

- Una sola regla clara para `QUICK`, alineada con la práctica y con lo que `docs:check` valida.
- El archivo del contrato aprobado sigue modificándose para registrar la entrega, con el riesgo de edición accidental ya observado; lo mitigan `docs:check` (estado, campos y secciones obligatorias) y la regla de verificar la estructura tras editar.
- Los seis informes independientes existentes y los de los derivados que los usen siguen siendo válidos.
- Los derivados heredan la regla con la plantilla; los ya creados la adoptan por su propio flujo.

## Migración y reversión

- Migración: aplicar PLAT-024; no hay registros que migrar, porque la práctica ya coincide.
- Reversión: sustituir este ADR y restaurar la redacción anterior mediante otro cambio.

## Fuentes

- ADR-0009 §4 y `docs/sdd/workflow.md`, `docs/sdd/change-policy.md`, `docs/sdd/templates/quick-change.md` (texto citado el 2026-10-04).
- Registros `quick-change.md` de PLAT-009 a PLAT-023 y su validación en `docs:check` (PLAT-016 y PLAT-022).
- Ninguna fuente externa necesaria.
