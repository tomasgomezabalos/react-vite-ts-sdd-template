# ADR-0020 — Mantenimiento de la frescura de la plantilla

**Estado documental:** APPROVED

**Versión:** 1.0.0

**Fecha:** 2026-10-04

**Aprobado por:** Tomás, usuario solicitante

**Fecha de aprobación:** 2026-10-04

**Evidencia de aprobación:** Aprobación expresa «si, las apruebo y te autorizo a implementarlo todo» registrada en la conversación de trabajo (con frecuencia mensual para el aviso); la aplicación queda a cargo de PLAT-026.

**Relación:** Complementa ADR-0011 (puerta de calidad y runtime), ADR-0014 (la plantilla conserva su propio utillaje) y ADR-0017 (política de runtime); precisa el flujo de derivación de ADR-0010 y ADR-0012 con un paso previo de solo lectura. Su aplicación se especifica mediante PLAT-026.

## Contexto

La plantilla es un artefacto vivo: sus bibliotecas, el runtime de Node y npm, las acciones de GitHub y la documentación de las que depende cambian, y un proyecto derivado hereda el estado de la plantilla en el momento de la derivación. Un derivado nacido sobre dependencias desfasadas arrastra esa deuda desde el primer día.

Situación medida el 2026-10-04:

- Dependabot propone cada semana las actualizaciones menores y de parche de npm y de las acciones de GitHub (PLAT-009), con reglas de ignorado documentadas para `@types/node`, `typescript` 7 y `msw` 3 (PLAT-013). No había pull requests abiertos.
- `npm outdated` mostraba únicamente esas tres dependencias, las tres bloqueadas a propósito; `npm audit` no mostraba vulnerabilidades.
- El workflow `Security` audita cada semana y `Quality` y `Template tools` se ejecutan en cada push (PLAT-009, PLAT-025).

Lo que ninguna automatización actual cubre: la versión de Node y npm (fijada a mano, ADR-0017), el momento de retirar una regla de ignorado cuando cesa su causa (por ejemplo, el peer de `typescript-eslint`), el estado de los cambios con fecha o con dependencias pendientes (PLAT-019, PLAT-020), y la visión conjunta que permita decidir antes de derivar.

## Decisión propuesta

1. **Comprobación de frescura, de solo lectura.** La plantilla incorpora `npm run template:freshness`, un comando propio de la plantilla (excluido de la derivación con el resto de `tools/template/**`, y retirado de los scripts del derivado) que emite un informe de lo que está desactualizado o pendiente y no modifica ningún archivo. Admite `--format human|json` y su salida distingue lo que requiere decisión, lo bloqueado a propósito, lo vigente y lo no comprobable.
2. **Alcance de la comprobación:** dependencias de npm desactualizadas por tamaño del salto (parche, menor, mayor) distinguiendo las cubiertas por una regla de ignorado; avisos de `npm audit`; línea de Node fijada frente al calendario oficial y último parche disponible, y el npm que incluye; revisión de las causas de cada regla de ignorado de Dependabot (versiones más recientes y rangos de peers relacionados) para decidir si pueden retirarse; pull requests de Dependabot abiertos y estado de la última ejecución de CI de la rama principal cuando `gh` esté disponible; y cambios de plataforma `APPROVED` pendientes de aplicar o en `DRAFT`.
3. **Sin red no hay fallo.** Los datos externos que no puedan obtenerse se informan como no comprobables; el comando no forma parte de `npm run check`, que sigue siendo determinista y sin red (ADR-0011).
4. **Paso previo a derivar.** El flujo de derivación de `AGENTS.md` (bloque exclusivo de la plantilla) exige ejecutar la comprobación antes del preview del bootstrap y presentar el informe. Si hay elementos que requieren decisión, la persona responsable decide: actualizar la plantilla mediante el flujo SDD y repetir la comprobación, o continuar dejando constancia de la deuda aceptada. La comprobación nunca actualiza la plantilla por sí misma.
5. **Aviso periódico.** Una tarea programada mensual ejecuta la comprobación y notifica el informe; no escribe en el repositorio ni hace commit, push ni cambios de dependencias.
6. **Las actualizaciones se aplican siempre por el flujo SDD** (`DIRECT`, `QUICK`, `ADR` o `FULL` según su impacto), con verificación completa y las autorizaciones independientes de commit y push.

## Aplicación prevista tras la aprobación

1. Un cambio `QUICK` (PLAT-026) que implemente el comando con sus pruebas deterministas (proveedores de datos inyectables, sin red), lo excluya de la derivación y de los scripts del derivado, documente su uso y añada el paso previo al flujo de derivación.
2. Crear la tarea programada mensual, con autorización expresa en el momento de aplicarlo, y comprobarla con una ejecución manual.
3. Actualizar el índice de arquitectura.

La aprobación del ADR permite utilizar la decisión en planes posteriores; no autoriza automáticamente su aplicación, commit ni publicación.

## Alternativas consideradas

### Solo una tarea programada periódica

Detecta la deuda sin intervención, pero no garantiza que el estado sea el correcto en el momento de derivar, y una revisión periódica ignorada deja pasar la derivación igualmente.

### Actualizar la plantilla automáticamente al derivar

Evita la deuda, pero mezcla el mantenimiento con la creación de un proyecto, convierte la derivación en lenta e impredecible y aplicaría cambios de dependencias sin la revisión y las autorizaciones del flujo SDD.

### Sustituir Dependabot por otra herramienta (Renovate u otra)

Dependabot ya cubre las actualizaciones de dependencias y de acciones sin coste; el vacío está en Node, npm, las reglas de ignorado y la coherencia, que no resuelve una sustitución.

### No hacer nada más

Funciona mientras las actualizaciones que no cubre Dependabot sean recordadas a mano; el caso de Node 22 y de las dos dependencias bloqueadas demuestra que dependen de la memoria de una persona.

## Consecuencias

- Antes de cada derivación hay una fotografía fiable del estado, y la deuda aceptada queda por escrito.
- Un aviso mensual evita que la deuda crezca entre derivaciones.
- El comando requiere red y `gh` para parte de sus datos; sin ellos el informe es parcial, no erróneo.
- Las fuentes externas pueden cambiar de formato (calendario de Node, registro de npm); las pruebas fijan los formatos esperados y un fallo de lectura se informa como no comprobable.
- Los derivados no reciben el comando ni la tarea; mantener sus propias dependencias es decisión de cada proyecto.

## Migración y reversión

- Migración: aplicar PLAT-026; no hay datos que migrar.
- Reversión: retirar el comando, su paso en el flujo de derivación y la tarea programada mediante otro cambio.

## Fuentes

- Calendario oficial de versiones de Node (`nodejs/Release`, `schedule.json`) y distribuciones (`nodejs.org/dist/index.json`).
- Registro de npm y comandos `npm outdated`, `npm audit` y `npm view`.
- GitHub CLI (`gh`) para pull requests y ejecuciones de CI.
- Medición local del 2026-10-04 descrita en el contexto.
