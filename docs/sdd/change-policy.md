# Política de gestión de cambios SDD

**Estado:** APPROVED

**Versión:** 1.0.0

**Fecha:** 2026-08-27

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
2. Crear o evolucionar la especificación funcional afectada.
3. Actualizar requisitos y criterios de aceptación.
4. Revisar o crear ADR si existe impacto arquitectónico.
5. Actualizar diseño/plan técnico.
6. Actualizar tareas.
7. Obtener las aprobaciones exigidas por el workflow.
8. Implementar.
9. Ejecutar validaciones.
10. Actualizar la documentación final afectada.

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
2. Actualizar únicamente la documentación que realmente cambia.
3. Comprobar referencias cruzadas y ausencia de contradicciones.
4. Actualizar o añadir las pruebas necesarias.
5. Implementar el cambio.
6. Validar el comportamiento afectado.
7. Registrar archivos modificados, comprobaciones y desviaciones.

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
2. Crear o actualizar el ADR correspondiente.
3. Documentar alternativas y consecuencias.
4. Actualizar las referencias desde los artefactos afectados.
5. Obtener la aprobación exigida.
6. Solo entonces implementar la decisión cuando el workflow lo permita.

Un ADR puede acompañar a un cambio `FULL`; `ADR` describe la decisión arquitectónica y `FULL` describe el cambio funcional/técnico que la utiliza.

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

## 6. Trazabilidad proporcional

La trazabilidad debe conservarse al nivel adecuado:

- `FULL`: requisito → criterio → diseño/plan → tarea → prueba → código.
- `QUICK`: requisito/criterio afectado → prueba → código.
- `DIRECT`: código → prueba/validación → commit o historial de cambios, cuando exista.
- `ADR`: ADR → documentación afectada → implementación.

No se debe crear documentación artificial que no aporte información adicional únicamente para satisfacer una cadena documental.

## 7. Retroalimentación desde la implementación

Durante la implementación pueden descubrirse hechos que invaliden o completen la documentación.

Cuando ocurra:

- si afecta comportamiento o requisito, actualizar la spec mediante `QUICK` o `FULL`;
- si afecta arquitectura, actualizar o crear ADR;
- si es únicamente un detalle interno equivalente, mantenerlo como `DIRECT`.

La implementación no puede modificar silenciosamente el comportamiento esperado.
