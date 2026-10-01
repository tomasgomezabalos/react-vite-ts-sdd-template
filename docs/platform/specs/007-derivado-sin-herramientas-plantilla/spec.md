# PLAT-007 — Proyecto derivado sin herramientas de plantilla

**Estado documental:** APPROVED

**Versión:** 1.0.0

**Fecha:** 2026-10-01

**Aprobado por:** Tomás, usuario solicitante

**Fecha de aprobación:** 2026-10-01

**Evidencia de aprobación:** Aprobación expresa de ADR-0014 y PLAT-007 («lo que sí hacemos es la aprobación del ADR y del PLAT… adelante») registrada en la conversación de trabajo, junto con la autorización de implementar y de actualizar la skill externa.

**Clasificación:** FULL

## Relaciones y vigencia

- Visión de producto: no aplica; pertenece a la plataforma reutilizable.
- Decisiones relacionadas: ADR-0009, ADR-0010, ADR-0012, ADR-0013 (`APPROVED`) y ADR-0014 (`APPROVED`).
- Artefactos modificados: para derivaciones futuras, enmienda REQ-01, REQ-02, REQ-05 y REQ-07 de PLAT-005 y los requisitos de PLAT-003 sobre estado de inicialización y diagnóstico de estado, sin reescribir sus especificaciones ni validaciones históricas.

## Problema y resultado esperado

Un proyecto derivado recibe el bootstrap, su diagnóstico, sus pruebas, su configuración, su estado y reglas que solo sirven para crear copias de la plantilla. Al evolucionar el proyecto, esos artefactos dejan de coincidir con la baseline y rompen `npm run test:tools` y `template:doctor`.

El resultado esperado es que un repositorio recién derivado no contenga nada del mecanismo que lo creó, que su suite de pruebas sea fiable desde el primer día y que el bootstrap y el diagnóstico se ejecuten siempre desde la plantilla contra el destino.

## Alcance

- Declarar en el manifiesto de baseline qué rutas no se derivan.
- Hacer que `template:init` rechace un destino que contenga rutas excluidas.
- Eliminar el estado persistido `.template-state.json` y mantener idempotencia y rechazo de divergencias sin él.
- Sustituir el diagnóstico de estado de `template:doctor` por una comprobación de coherencia con la configuración.
- Retirar del derivado los scripts `template:*`, la sección de diagnóstico del README y las reglas de bootstrap de `AGENTS.md`.
- Trasladar a `tests/tools/template/` la prueba de hashes del manifiesto.
- Separar los proyectos de Vitest `app` y `tools`.
- Actualizar la skill externa de derivación.

## Fuera de alcance

- Eliminar `tools/quality`, `tests/tools/quality` o `npm run test:tools` del derivado.
- Cambiar `npm run check`, la cobertura o sus umbrales.
- Migrar o reprovisionar proyectos ya derivados.
- Cambiar la identidad mínima del bootstrap (destino y nombre) ni sus garantías de preview, token, transacción, rollback y recuperación.
- Instalar dependencias, modificar Git, usar la red, commitear, publicar o desplegar.

## Flujo principal

1. La skill copia la plantilla respetando `derivation.exclude`.
2. La persona usuaria revisa el preview ejecutado desde la plantilla contra `--target` con una configuración externa al destino.
3. Tras la autorización del token, `template:init` aplica solo la identidad y la limpieza de salidas gestionadas.
4. `template:doctor` se ejecuta desde la plantilla y valida la derivación técnica.
5. El derivado queda sin herramientas, estado ni reglas de bootstrap.

## Requisitos

### REQ-01 — Exclusión declarada

El manifiesto de baseline declarará las rutas que no se derivan: `tools/template/**`, `tests/tools/template/**`, `project.config.json` y `.template-state.json`.

### REQ-02 — Exclusión exigida

`template:init` rechazará, sin escribir, un destino que contenga alguna ruta excluida e indicará cuáles son.

### REQ-03 — Operación desde la plantilla

`template:init` y `template:doctor` funcionarán contra un `--target` que no contenga `tools/template` y con una configuración situada fuera del destino.

### REQ-04 — Sin estado persistido

`template:init` no creará `.template-state.json`. Repetir la misma operación sobre un destino ya aplicado será un no-op; una configuración distinta, un archivo gestionado divergente o un destino con contenido no reconocido se rechazarán sin sobrescribir.

### REQ-05 — Diagnóstico de coherencia

`template:doctor` sustituirá `INITIALIZATION_STATE` por una comprobación de que los archivos gestionados coinciden con la salida de la configuración suministrada. Seguirá siendo de solo lectura, no exigirá `.template-state.json` y declarará sus límites.

### REQ-06 — Salidas sin rastro de bootstrap

Tras el apply, el derivado no contendrá los scripts `template:init` ni `template:doctor`, ni la sección de diagnóstico en el README, ni el bloque `template-only` de `AGENTS.md`. Conservará las reglas de alcance SPA y de separación entre plataforma y producto.

### REQ-07 — Pruebas del derivado fiables

En un derivado recién aplicado, `npm run test:tools` y `npm run check` terminarán sin fallos. La prueba de hashes del manifiesto vivirá en `tests/tools/template/`.

### REQ-08 — Proyectos de Vitest separados

Las pruebas de `tests/tools/**` se ejecutarán en entorno Node y sin el setup de aplicación; el resto, en jsdom con el setup. Los scripts npm, la cobertura y sus umbrales no cambiarán.

### REQ-09 — Garantías preservadas

Se mantienen preview sin escritura, token ligado a configuración, destino, baseline y operaciones, rutas seguras, transacción, rollback, recuperación expresa y rechazo del remoto canónico.

## Escenarios y criterios de aceptación

### AC-01 — Derivación sin herramientas

**Requisitos relacionados:** REQ-01, REQ-03, REQ-06, REQ-07

- **Dado** una copia hecha respetando `derivation.exclude`
- **Cuando** se ejecuta preview, apply, `template:doctor`, `npm run test:tools` y `npm run check` desde la plantilla y el destino
- **Entonces** el doctor no informa `FAIL` y las dos suites terminan sin fallos, sin `tools/template`, `tests/tools/template`, `project.config.json` ni `.template-state.json` en el destino

### AC-02 — Destino con rutas excluidas

**Requisitos relacionados:** REQ-02

- **Dado** un destino que contiene `tools/template`
- **Cuando** se ejecuta el preview
- **Entonces** `template:init` falla indicando la ruta y no escribe nada

### AC-03 — Idempotencia sin estado

**Requisitos relacionados:** REQ-04, REQ-09

- **Dado** un destino ya aplicado
- **Cuando** se repite la operación con la misma configuración, y después con otra distinta
- **Entonces** la primera es un no-op y la segunda se rechaza sin modificar archivos

### AC-04 — Contenido divergente

**Requisitos relacionados:** REQ-04, REQ-09

- **Dado** un archivo gestionado que no coincide con la baseline ni con el contenido deseado
- **Cuando** se ejecuta el preview
- **Entonces** se rechaza sin sobrescribir

### AC-05 — Doctor de coherencia

**Requisitos relacionados:** REQ-05

- **Dado** un destino aplicado, y otro con un archivo gestionado alterado
- **Cuando** se ejecuta `template:doctor`
- **Entonces** el primero no informa `FAIL` y el segundo informa `FAIL` en la comprobación de coherencia, sin modificar archivos

### AC-06 — Limpieza de salidas gestionadas

**Requisitos relacionados:** REQ-06

- **Dado** un destino aplicado
- **Cuando** se inspeccionan `package.json`, `README.md` y `AGENTS.md`
- **Entonces** no hay scripts `template:*`, ni sección de diagnóstico, ni bloque `template-only`, y se conservan las reglas de alcance SPA y separación documental

### AC-07 — Proyectos de Vitest

**Requisitos relacionados:** REQ-08

- **Dado** un setup de aplicación que accede a `document` al importarse
- **Cuando** se ejecuta `npm run test:tools` y `npm run test:coverage`
- **Entonces** las pruebas de `tests/tools` no cargan el setup y las de aplicación sí, con los mismos umbrales

### AC-08 — Garantías heredadas

**Requisitos relacionados:** REQ-09

- **Dado** las pruebas de PLAT-003 y PLAT-005 adaptadas
- **Cuando** se ejecuta `npm run test:tools` en la plantilla
- **Entonces** continúan cubiertos preview, token, rollback, recuperación, symlinks y remoto canónico

## Requisitos transversales aplicables

- Accesibilidad, navegadores, responsive e internacionalización: no aplica; no cambia la interfaz.
- Carga, vacío y error: no aplica; cambia herramientas de derivación.
- Seguridad y privacidad: se mantienen rutas seguras, ausencia de secretos y rechazo del remoto canónico.
- Rendimiento, observabilidad y despliegue: no aplica.

## Supuestos, riesgos y cuestiones abiertas

- **Supuesto:** la skill externa se actualiza en la misma entrega y la copia respeta el manifiesto.
- **Riesgo:** una copia que no respete la exclusión será rechazada por `init`, no corregida.
- **Riesgo:** editar `AGENTS.md` con marcadores cambia su hash de baseline y exige regenerar el manifiesto.
- **Abierta:** ninguna.

## Puerta documental

La aprobación de esta versión autoriza preparar el plan técnico dentro de su alcance. No autoriza implementación, commit ni publicación. La ejecución y sus evidencias se registran por separado mediante `validation-report.md`.
