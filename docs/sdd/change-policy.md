# Política de gestión de cambios SDD

**Estado documental:** APPROVED

**Versión:** 2.0.0

**Fecha:** 2026-08-27

**Revisión:** 2026-08-28

**Aprobado por:** Tomás, usuario solicitante

**Fecha de aprobación:** 2026-08-28

**Evidencia de aprobación:** Aprobación expresa registrada en la conversación de trabajo.

**Decisión aplicable:** ADR-0009 (`APPROVED`).

## Propósito

Aplicar Spec-Driven Development de forma proporcional al alcance, riesgo e impacto del cambio, preservando la trazabilidad sin exigir el flujo completo para modificaciones que no lo justifican.

Antes de modificar documentación o código, el agente debe clasificar la petición como `FULL`, `QUICK`, `DIRECT` o `ADR`.

La clasificación no sustituye a las reglas de arquitectura, calidad, pruebas, accesibilidad ni a las decisiones ya aprobadas.

## 1. FULL

Usar `FULL` cuando el cambio:

- introduce una capacidad nueva;
- modifica de forma significativa el comportamiento del producto;
- afecta a varias áreas, flujos o módulos;
- altera varios requisitos o criterios de aceptación;
- requiere decisiones de diseño relevantes;
- implica migración, riesgo o coordinación técnica significativa.

### Flujo

1. Revisar la visión y las especificaciones vigentes.
2. Crear la especificación funcional o preparar una nueva versión o enmienda de la afectada.
3. Actualizar requisitos y criterios de aceptación.
4. Revisar o crear ADR si existe impacto arquitectónico.
5. Actualizar diseño/plan técnico.
6. Actualizar tareas.
7. Obtener las aprobaciones exigidas por el workflow.
8. Implementar.
9. Registrar implementación, trazabilidad, comprobaciones y desviaciones en `validation-report.md`.
10. Contrastar los criterios y obtener aceptación antes de registrar la entrega como `VALIDATED`.

No se debe implementar un cambio `FULL` mientras la documentación requerida por el workflow no esté preparada y aprobada.

## 2. QUICK

Usar `QUICK` cuando el cambio:

- modifica comportamiento observable, pero de forma pequeña y localizada;
- afecta a uno o pocos requisitos/criterios existentes;
- no introduce una capacidad de producto independiente;
- no necesita un rediseño técnico completo;
- no introduce una decisión arquitectónica nueva.

### Flujo

1. Identificar el requisito, criterio de aceptación o contrato afectado.
2. Preparar un `quick-change.md` con el delta y actualizar únicamente la documentación que realmente cambia.
3. Comprobar referencias cruzadas y ausencia de contradicciones.
4. Obtener aprobación del delta antes de implementar.
5. Actualizar o añadir las pruebas necesarias e implementar el cambio.
6. Registrar archivos, comprobaciones y desviaciones en `validation-report.md` o, cuando sea trivial, en la sección de entrega separada del propio registro `QUICK`.
7. Validar el comportamiento afectado y obtener aceptación expresa antes de registrar `VALIDATED`.

Un cambio `QUICK` no exige regenerar automáticamente visión, plan completo ni desglose completo de tareas si esos artefactos continúan siendo correctos.

Si durante un `QUICK` aparece impacto transversal, arquitectónico o de alcance mayor, debe reclasificarse como `FULL` o `ADR` antes de continuar.

## 3. DIRECT

Usar `DIRECT` únicamente cuando el cambio:

- no modifica comportamiento observable;
- no modifica contratos públicos o compartidos;
- no modifica requisitos;
- no modifica arquitectura;
- no introduce dependencias;
- no altera decisiones funcionales.

Ejemplos habituales:

- refactorización interna equivalente;
- renombrado interno;
- eliminación de código muerto;
- simplificación de implementación;
- corrección de formato o lint;
- ajuste de tests que no cambia el comportamiento esperado;
- reorganización interna de componentes manteniendo sus contratos.

### Flujo

1. Confirmar explícitamente que no existe impacto observable ni contractual.
2. Modificar código y pruebas necesarias.
3. Ejecutar las validaciones aplicables.
4. Informar de los cambios y resultados.

No es obligatorio actualizar una spec por un cambio `DIRECT`.

Si el cambio que parecía `DIRECT` modifica comportamiento, contrato o criterio de aceptación, debe reclasificarse como `QUICK` o `FULL`.

## 4. ADR

Usar `ADR` cuando se toma o modifica una decisión técnica con impacto duradero o transversal, por ejemplo:

- plataforma o framework;
- librerías estructurales;
- estrategia de estado o data fetching;
- contratos compartidos;
- estructura transversal;
- estrategia de pruebas;
- persistencia;
- seguridad;
- integración con servicios externos;
- decisiones con coste relevante de reversión.

### Flujo

1. Identificar la decisión y su contexto.
2. Crear o actualizar el ADR correspondiente mediante `docs/sdd/templates/adr.md`.
3. Documentar alternativas y consecuencias.
4. Actualizar las referencias desde los artefactos afectados.
5. Obtener la aprobación exigida.
6. Solo entonces implementar la decisión cuando el workflow lo permita.

Un ADR puede acompañar a un cambio `FULL`; `ADR` describe la decisión arquitectónica y `FULL` describe el cambio funcional/técnico que la utiliza. La aprobación del ADR no autoriza automáticamente su aplicación, commit ni publicación.

## 5. Regla de clasificación

Aplicar este orden:

1. ¿Hay una decisión arquitectónica nueva o modificada?
   - Sí → `ADR` y, si además existe cambio funcional significativo, también `FULL`.
2. ¿Existe una capacidad nueva o un cambio funcional amplio/multiárea?
   - Sí → `FULL`.
3. ¿Existe un cambio observable pequeño y localizado?
   - Sí → `QUICK`.
4. ¿No cambia comportamiento, contrato, requisito ni arquitectura?
   - Sí → `DIRECT`.

En caso de duda entre `DIRECT` y `QUICK`, usar `QUICK`.

En caso de duda entre `QUICK` y `FULL`, valorar alcance, número de áreas afectadas, riesgo, reversibilidad y cantidad de requisitos modificados. Ante impacto significativo, usar `FULL`.

## 6. Estados y estabilidad documental

Los artefactos de intención y decisión utilizan `Estado documental`: `DRAFT`, `APPROVED` o `SUPERSEDED`. La ejecución utiliza `Estado de entrega`: `NOT_STARTED`, `IMPLEMENTED`, `VALIDATED`, `BLOCKED` o `NOT_APPLICABLE`.

Una especificación, plan, cambio `QUICK` o ADR aprobado no se modifica silenciosamente para incorporar alcance ni para registrar progreso. Los cambios sustantivos requieren un delta, enmienda, nueva versión o decisión aprobados. Las evidencias de implementación y validación se mantienen separadas conforme a ADR-0009.

Los documentos nuevos registran versión, persona que aprueba, fecha y evidencia disponible. No se inventan referencias y un commit posterior no sustituye la aprobación expresa.

## 7. Trazabilidad proporcional

La trazabilidad debe conservarse al nivel adecuado:

- `FULL`: requisito → criterio → diseño/plan → tarea → prueba → código → informe de validación.
- `QUICK`: delta aprobado → requisito/criterio afectado → prueba → código → evidencia proporcional.
- `DIRECT`: código → prueba/validación → commit o historial de cambios, cuando exista.
- `ADR`: ADR aprobado → autorización de aplicación → documentación o implementación afectada.

No se debe crear documentación artificial que no aporte información adicional únicamente para satisfacer una cadena documental.

## 8. Retroalimentación desde la implementación

Durante la implementación pueden descubrirse hechos que invaliden o completen la documentación.

Cuando ocurra:

- si afecta comportamiento o requisito, preparar un delta, enmienda o nueva versión mediante `QUICK` o `FULL`;
- si afecta arquitectura, actualizar o crear ADR;
- si es únicamente un detalle interno equivalente, mantenerlo como `DIRECT`.

La implementación no puede modificar silenciosamente el comportamiento esperado.
