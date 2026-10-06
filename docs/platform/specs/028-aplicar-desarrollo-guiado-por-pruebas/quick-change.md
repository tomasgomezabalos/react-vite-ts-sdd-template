# PLAT-028 — Aplicar el desarrollo guiado por pruebas (TDD) en la baseline

**Estado documental:** APPROVED

**Versión:** 1.0.0

**Fecha:** 2026-10-06

**Aprobado por:** Tomás, usuario solicitante

**Fecha de aprobación:** 2026-10-06

**Evidencia de aprobación:** Aprobación expresa «Apruebo PLAT-028 con la opción mínima. Implementa» registrada en la conversación de trabajo, tras presentarse el borrador 0.1.0. Autoriza la implementación de este delta; no autoriza commit ni publicación ni `template:init --apply`.

**Clasificación:** QUICK

## Contrato afectado

- Decisión que se aplica: [ADR-0021](../../../architecture/decisions/0021-desarrollo-guiado-por-pruebas.md) v1.0.0 (`APPROVED`, 2026-10-06).
- Reglas que se modifican: `AGENTS.md` («Pruebas y calidad»), `docs/sdd/change-policy.md` v2.1.0 (QUICK, paso 5; FULL, paso 8; DIRECT), `docs/sdd/templates/quick-change.md`, `docs/sdd/templates/validation-report.md` y `.claude/skills/react-ts-feature-pattern/SKILL.md` (modos `strict` y `test-audit`, Creation y Refactor Workflow, Acceptance Checklist).
- Archivos gestionados afectados: `AGENTS.md` y `README.md` (con hash en el manifiesto) y `tools/template/baseline-manifest.json`.
- Motivo de clasificación: aplica una decisión ya aprobada (ADR-0021) mediante cambios documentales y de procedimiento localizados. No añade dependencias, no modifica código de aplicación, no cambia contratos de producto ni introduce una decisión arquitectónica nueva. Cambia el comportamiento observable de los agentes y del flujo SDD en la plantilla y en los derivados, por lo que no es `DIRECT`.

## Delta funcional

### Comportamiento vigente

`AGENTS.md` exige pruebas y su estructura, pero no un orden test-first. `change-policy.md` indica «Actualizar o añadir las pruebas necesarias e implementar el cambio» sin fijar el orden. La skill `react-ts-feature-pattern` implementa primero y aplica la «test assurance» al final; su modo `strict` exige que el componente quede cubierto, no que las pruebas se escriban antes. El registro de entrega no pide evidencia de que una prueba fallara antes de la implementación.

### Comportamiento aprobado propuesto

1. `AGENTS.md` incorpora, en «Pruebas y calidad», la regla de TDD de ADR-0021 con referencia a este: todo código con comportamiento se desarrolla con Red → Green → Refactor; el Red se verifica (la prueba falla por el comportamiento ausente, no por un error de import, tipos o configuración); las excepciones (configuración declarativa sin lógica, SCSS, assets, código generado, prototipos descartables) se declaran en el registro de entrega; Stryker es una práctica opcional por derivado, sin dependencia en la baseline; y TDD cubre comportamiento, no la presentación visual.
2. `change-policy.md` pasa a la versión 2.2.0:
   - En `FULL` y `QUICK`, cada escenario o criterio aprobado se convierte primero en una prueba fallida antes de implementar.
   - Un defecto se corrige con una prueba que lo reproduce primero.
   - `DIRECT` no exige prueba nueva, mantiene las existentes en verde y se reclasifica si el cambio revela comportamiento sin cubrir.
   - El registro de entrega indica, por criterio, la prueba y el motivo de fallo observado en Red.
3. Las plantillas `quick-change.md` y `validation-report.md` piden esa evidencia **dentro de las secciones que ya tienen** (la entrada «Pruebas y resultados» del registro embebido y la tabla «Trazabilidad final»); no se añaden encabezados nuevos, de modo que los cambios QUICK ya aprobados siguen cumpliendo `docs:check`.
4. La skill `react-ts-feature-pattern`:
   - En `strict`, el Creation y el Refactor Workflow siguen el orden: fijar la estructura y el contrato de tipos, escribir una prueba de comportamiento, ejecutarla y verificar el Red, implementar lo mínimo (Green), y aplicar los gates de constantes, deduplicación y revisión Sonar-like como Refactor con las pruebas en verde. La extracción del hook ocurre en el Refactor, tras probar por el contrato público del componente.
   - Una nueva sección «Red-Green-Refactor» define el procedimiento, qué cuenta como Red válido, la aserción `expectNoAccessibilityViolations` dentro del primer ciclo de la interfaz y la evidencia a informar (prueba y motivo de fallo).
   - El mismo procedimiento rige un hook o lógica pura invocados con la skill; para código sin componente que no pase por la skill, rige `AGENTS.md`.
   - Se actualizan «Operating Modes», «Project overrides», «Strict Impact Policy», el Acceptance Checklist y el contrato de salida del modo carpeta con la evidencia del Red.
   - `standard` no cambia: la skill sigue sin ejecutar ni escribir pruebas en ese modo (la puerta `npm run check` del proyecto las ejecuta igualmente).
   - Se añade que, si la skill contradice ADR-0021, prevalece el ADR.
5. `README.md` documenta la práctica y Stryker como opción documentada, y su referencia a ADR-0021.
6. El manifiesto regenera los hashes de `AGENTS.md` y `README.md` y el `baselineId`.

### Fuera de alcance

- Umbrales de cobertura en `npm run check` (ADR-0021 §7.A: No).
- Instalar o configurar Stryker (ADR-0021 §7.B: solo documentación opcional).
- Comprobaciones automáticas de que se hizo test-first (hooks, `docs:check` o `architecture:check` que lo exijan); el ADR descarta el hook y no propone una comprobación objetiva.
- Regresión visual, e2e y revisión manual de contraste, teclado, foco y lector de pantalla.
- Una skill nueva para `model/`, `api/` y otro código sin componente.
- Reescribir los registros históricos de PLAT anteriores o los QUICK ya aprobados.
- Commit, push, merge, despliegue y publicación.

### Decisión sobre el manifiesto

Se aplica la **opción mínima**: se regeneran solo los hashes de `AGENTS.md` y `README.md` y el `baselineId`. `change-policy.md`, las plantillas y la skill siguen copiándose a los derivados sin control de hash. Esto precisa ADR-0021 §7.C, cuyo texto daba por gestionados esos archivos; hoy no lo están (`managedFiles`, 12 entradas, comprobado el 2026-10-06).

## Criterios afectados

### QC-AC-01 — Regla de TDD en `AGENTS.md`

- **Dado** `AGENTS.md` con el cambio aplicado
- **Cuando** se lee la sección «Pruebas y calidad»
- **Entonces** enuncia el ciclo Red → Green → Refactor con Red verificado, las excepciones, la evidencia en el registro de entrega, Stryker opcional, el límite de comportamiento frente a presentación visual y la referencia a ADR-0021

### QC-AC-02 — Orden test-first en la política de cambios

- **Dado** `docs/sdd/change-policy.md` v2.2.0
- **Cuando** se leen los flujos `FULL`, `QUICK` y `DIRECT`
- **Entonces** `FULL` y `QUICK` fijan pruebas fallidas antes de implementar, el defecto se corrige con una prueba que lo reproduce primero y `DIRECT` mantiene las pruebas existentes en verde con su condición de reclasificación

### QC-AC-03 — Evidencia en las plantillas sin romper `docs:check`

- **Dado** las plantillas actualizadas y los cambios QUICK aprobados existentes sin modificar
- **Cuando** se ejecuta `npm run docs:check`
- **Entonces** finaliza con código `0`, y las plantillas piden la prueba y el motivo de fallo observado

### QC-AC-04 — Skill con flujo test-first en `strict`

- **Dado** `SKILL.md` actualizado
- **Cuando** se leen el Creation Workflow, el Refactor Workflow, «Red-Green-Refactor» y el Acceptance Checklist
- **Entonces** `strict` exige escribir y ver fallar la prueba antes de implementar, `standard` no ejecuta trabajo de pruebas, el hook se extrae en el Refactor, la aserción axe va en el primer ciclo de interfaz y prevalece ADR-0021 si hay contradicción

### QC-AC-05 — Comportamiento real de la skill

- **Dado** una sesión nueva de Claude Code en el repositorio con el cambio aplicado
- **Cuando** se pide crear un componente sencillo con la skill en modo `strict`
- **Entonces** la prueba se escribe y se ejecuta con fallo por comportamiento ausente antes de crear la implementación, y la salida informa de la prueba y del motivo del fallo

### QC-AC-06 — Documentación y manifiesto

- **Dado** el cambio aplicado
- **Cuando** se ejecutan `npm run check` y `npm run test:tools`
- **Entonces** ambos finalizan con código `0`, `README.md` documenta la práctica y Stryker como opcional, y el manifiesto tiene los hashes y el `baselineId` regenerados

### QC-AC-07 — Derivación

- **Dado** una derivación real con `template:init` y `template:doctor`
- **Cuando** se inspecciona el destino
- **Entonces** contiene `AGENTS.md`, `change-policy.md`, las plantillas y la skill actualizados, no contiene `tools/template/**`, y `npm run check` del derivado finaliza con código `0`

## Alcance técnico mínimo

| Archivo o área | Cambio previsto | Criterio |
| --- | --- | --- |
| `AGENTS.md` | Regla de TDD, excepciones, evidencia, Stryker opcional (archivo gestionado). | QC-AC-01, QC-AC-06 |
| `docs/sdd/change-policy.md` | Versión 2.2.0 con el orden test-first. | QC-AC-02 |
| `docs/sdd/templates/quick-change.md`, `docs/sdd/templates/validation-report.md` | Guía de evidencia del Red sin encabezados nuevos. | QC-AC-03 |
| `.claude/skills/react-ts-feature-pattern/SKILL.md` | Flujo Red-Green-Refactor en `strict`, nueva sección y checklist. | QC-AC-04, QC-AC-05 |
| `README.md` | Práctica TDD y Stryker opcional (archivo gestionado). | QC-AC-06 |
| `tools/template/baseline-manifest.json`, `tests/tools/template/baseline.test.ts` | Hashes y `baselineId`; ajustar si el alcance del punto abierto cambia. | QC-AC-06, QC-AC-07 |
| `docs/platform/README.md` | Fila de PLAT-028. | — |

## Pruebas y validación previstas

- Automatizadas: el manifiesto ya tiene pruebas que comparan hashes; modificar `AGENTS.md` y `README.md` las hace fallar antes de regenerar el manifiesto, y esa es la evidencia de Red de la parte verificable. `npm run docs:check` (QC-AC-03), `npm run check` y `npm run test:tools`. La mayor parte del cambio es documental y de procedimiento, sin prueba unitaria directa: la excepción se declarará en el registro de entrega.
- Manuales: QC-AC-05 en una sesión nueva en modo de permisos por defecto, y revisión de la skill contra ADR-0021 punto por punto. Ese comportamiento depende del seguimiento de instrucciones por el agente, no es determinista y puede variar; se registrará lo observado sin presentarlo como garantía.
- Derivación real con su verificación completa (QC-AC-07).
- Comando de regresión: `npm run check && npm run test:tools`.

## Riesgos y reclasificación

- Riesgo: el orden test-first no se puede verificar automáticamente (ADR-0021, consecuencias); la evidencia del Red es declarativa.
- Riesgo: la skill es una instrucción para el agente. Una sesión que no la cargue o la ignore no la aplicará; `AGENTS.md` la hace obligatoria por texto, no por mecanismo.
- Riesgo: posible conflicto de redacción entre `standard` (sin trabajo de pruebas en la skill) y la política (pruebas existentes en verde); se resuelve diciendo que la puerta `npm run check` ejecuta las pruebas con independencia del modo.
- Riesgo: existen otras copias de la skill con el mismo nombre en la sesión (global y de plugin); no se ha comprobado cuál se carga en cada caso.
- Riesgo: los derivados ya creados no reciben el cambio automáticamente.
- Reclasificar como `ADR` si se decide añadir umbrales de cobertura, instalar Stryker, un hook o una comprobación automática de test-first.
- Reclasificar como `FULL` si la ampliación del manifiesto (punto abierto) altera `template:doctor`, la derivación o el contrato de archivos gestionados, o si hace falta una skill nueva.

## Puerta documental

La aprobación autoriza implementar únicamente este delta cuando exista autorización expresa de implementación. No autoriza commit ni publicación.

## Registro de entrega opcional

Registrar aquí la entrega del cambio, separada del contrato aprobado y sin modificar este último. Puede usarse un `validation-report.md` independiente si la evidencia es demasiado extensa.

- Estado de entrega: `VALIDATED`
- Archivos modificados: `AGENTS.md`, `README.md`, `docs/sdd/change-policy.md` (v2.2.0, con su aprobación registrada), `docs/sdd/README.md`, `docs/sdd/templates/quick-change.md`, `docs/sdd/templates/validation-report.md`, `.claude/skills/react-ts-feature-pattern/SKILL.md`, `tools/template/baseline-manifest.json` (hashes de `AGENTS.md` y `README.md` y `baselineId` `react-vite-ts-sdd-template@2026-10-06-plat-028.1`), `tests/tools/template/baseline.test.ts`, `tests/tools/quality/process-docs.test.ts`, `docs/architecture/README.md` (ADR-0021), `docs/platform/README.md`, y este registro. ADR-0021 se aprobó antes, en la misma sesión.
- Pruebas y resultados: Red observado en la parte verificable: `baseline.test.ts` se cambió primero al nuevo `baselineId` y falló porque el manifiesto aún declaraba `2026-10-04-plat-027.1`; tras regenerar el manifiesto pasó. `process-docs.test.ts` fijaba la versión 2.1.0 de la política y falló al subirla a 2.2.0; se actualizó a 2.2.0 con ADR-0021 y pasó. Resto del cambio (documentación y skill): sin prueba unitaria directa, excepción declarada. `npm run check` código `0` (100 % de 18 sentencias, 10 pruebas, build), `npm run test:tools` 16 archivos / 150 pruebas correctas y `docs:check` correcto con los QUICK aprobados anteriores sin modificar (QC-AC-03). QC-AC-05, sesión `claude -p` 2.1.285 headless con `--setting-sources project` en una copia temporal con `node_modules` enlazado: la primera ejecución se detuvo en la puerta SDD pidiendo aprobar el delta; en la segunda, con el delta declarado aprobado, el agente creó un stub y la prueba, la ejecutó y observó Red (`Unable to find an accessible element with the role "status"`), implementó, añadió la segunda prueba y observó Red (recibió «Pulsaciones: 0» en vez de «1»), implementó y extrajo el hook en el Refactor; informó de que la prueba axe no tuvo Red. Límites: una sola ejecución no determinista; no pudo ejecutar `npm run check` completo por aprobaciones del modo headless (sí `lint` y 13 pruebas de `src/`); textos en español en el idioma `en`. QC-AC-07, derivación real en un directorio temporal con la autorización expresa del token `4c0586ac…6150`: `template:init --apply` con 5 operaciones, `template:doctor` con `PASS=9 WARN=0 FAIL=0 UNKNOWN=1` (sin remoto observable), el destino contiene la política v2.2.0, ADR-0021, la skill con «Red-Green-Refactor» y `AGENTS.md` con la regla, no contiene `tools/template/` y `npm run check` del derivado con código `0` (10 pruebas, `node_modules` enlazado de la plantilla, sin instalación). El `README.md` del derivado es el generado por la derivación (28 líneas) y no incluye la sección de TDD de la plantilla; el derivado la recibe por `AGENTS.md`, `docs/` y la skill. La frescura previa a derivar informó 3 `ATTENTION` y 3 `BLOCKED` ajenos a este cambio (dependencias, Node 22.23.3 y cambios PLAT pendientes).
- Desviaciones: umbrales de cobertura: el README ya fija mínimos globales (70/55/75/75), por lo que el texto aplicado dice «no se añaden umbrales a los ya vigentes»; ADR-0021 §7.A y su contexto los describen como informativos, inexactitud no corregida porque el ADR está aprobado. No se comprobó qué copia de la skill se carga cuando existen copias globales o de plugin con el mismo nombre.
- Aceptación: 2026-10-06, Tomás, usuario solicitante. Aceptación expresa «Acepto PLAT-028 como VALIDATED» registrada en la conversación de trabajo tras contrastar los criterios con la evidencia de este registro, con las limitaciones anotadas (evidencia de una sola ejecución no determinista de la skill, README del derivado generado sin la sección de TDD, inexactitud de ADR-0021 sobre los umbrales y copias de la skill sin verificar).
