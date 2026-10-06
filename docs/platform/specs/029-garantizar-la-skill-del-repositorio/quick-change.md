# PLAT-029 — Garantizar que se aplica la skill del repositorio

**Estado documental:** APPROVED

**Versión:** 1.0.0

**Fecha:** 2026-10-06

**Aprobado por:** Tomás, usuario solicitante

**Fecha de aprobación:** 2026-10-06

**Evidencia de aprobación:** Aprobación expresa «Apruebo PLAT-029 e implementa» registrada en la conversación de trabajo, tras presentarse el borrador 0.1.0. Autoriza la implementación de este delta; no autoriza commit, publicación ni `template:init --apply`.

**Clasificación:** QUICK

## Contrato afectado

- Reglas que se modifican: `AGENTS.md` («React y diseño»: «cargar `@react-ts-feature-pattern`») y `.claude/skills/react-ts-feature-pattern/SKILL.md`.
- Decisión relacionada: ADR-0021 y PLAT-028, que incorporan el flujo TDD únicamente a la copia de la skill del repositorio.
- Archivos gestionados afectados: `AGENTS.md` (con hash en el manifiesto) y `tools/template/baseline-manifest.json`.
- Motivo de clasificación: cambia una instrucción observable para los agentes (qué skill se aplica) y añade una comprobación automática pequeña. No introduce dependencias, no modifica código de aplicación ni toma una decisión arquitectónica.

## Delta funcional

### Comportamiento vigente

El 2026-10-06 existen cuatro copias de una skill llamada `react-ts-feature-pattern`: la del repositorio (`.claude/skills/`, con el flujo TDD), dos copias idénticas de 874 líneas gestionadas por la app y la cuenta (`anthropic-skills` y `~/.claude/skills/synced/`) y una copia de Codex (`~/.codex/skills/`); ninguna de las tres últimas contiene «Red-Green-Refactor» ni ADR-0021. `AGENTS.md` ordena cargar `@react-ts-feature-pattern` sin precisar de dónde. En la sesión headless de PLAT-028, con solo fuentes de proyecto, se cargó la copia del repositorio; no se ha comprobado qué ocurre cuando existe una copia personal del mismo nombre.

### Comportamiento aprobado propuesto

1. `AGENTS.md` indica que la skill aplicable es la del proyecto, `.claude/skills/react-ts-feature-pattern/SKILL.md`, y que, si la skill cargada no contiene la sección «Project skill (source of truth)», el agente debe leer ese archivo y aplicarlo en lugar de la cargada. No debe usar copias externas al repositorio.
2. `SKILL.md` incorpora una sección breve «Project skill (source of truth)» que declara que esta es la copia distribuida con el repositorio, que prevalece sobre cualquier otra copia del mismo nombre y que ADR-0021 está aplicado en ella.
3. Una prueba en `tests/tools/quality/` falla si `SKILL.md` pierde esa sección o las marcas «Red-Green-Refactor» y «ADR-0021», o si `AGENTS.md` deja de referenciar la ruta de la skill del proyecto.
4. El manifiesto regenera el hash de `AGENTS.md` y el `baselineId`.

### Fuera de alcance

- Eliminar, editar o actualizar las copias externas al repositorio (`~/.codex/skills/`, `~/.claude/skills/synced/` y la copia `anthropic-skills` de la app): están fuera del repositorio y no se distribuyen con él. La persona responsable decide si retirarlas.
- Renombrar la skill del proyecto para evitar cualquier colisión de nombres: cambiaría su invocación y todas las referencias, y se valoraría como cambio aparte.
- Garantizar por mecanismo (hook o configuración) qué copia se carga; la comprobación es declarativa.
- La skill general de la cuenta (su actualización o sustitución).

## Criterios afectados

### QC-AC-01 — Instrucción en `AGENTS.md`

- **Dado** `AGENTS.md` con el cambio aplicado
- **Cuando** se lee la sección «React y diseño»
- **Entonces** indica la ruta `.claude/skills/react-ts-feature-pattern/SKILL.md`, la sección que identifica la copia correcta y la acción cuando la cargada no la contiene

### QC-AC-02 — Marca en la skill y prueba de guarda

- **Dado** el repositorio con el cambio aplicado
- **Cuando** se ejecuta `npm run test:tools`
- **Entonces** la prueba nueva pasa; la prueba se escribió antes y falló por la ausencia de la sección «Project skill (source of truth)» y falla si se retira cualquiera de las marcas

### QC-AC-03 — Comportamiento con una copia personal del mismo nombre

- **Dado** una copia temporal del repositorio y un directorio de configuración de usuario temporal (`CLAUDE_CONFIG_DIR`) que contiene la copia de 874 líneas con el mismo nombre
- **Cuando** una sesión `claude -p` headless invoca la skill con fuentes de usuario y de proyecto
- **Entonces** se registra qué copia se cargó y, si fue la personal, que el agente lee y aplica la del proyecto; el resultado se anota tal como se observe, sin presentarlo como garantía

### QC-AC-04 — Puerta, manifiesto y derivación

- **Dado** el cambio aplicado
- **Cuando** se ejecutan `npm run check`, `npm run test:tools` y una derivación real con `template:init` y `template:doctor`
- **Entonces** todo finaliza con código `0` (el doctor sin fallos), el manifiesto tiene el hash de `AGENTS.md` y el `baselineId` regenerados, y el derivado contiene la skill con su sección y `AGENTS.md` con la instrucción

## Alcance técnico mínimo

| Archivo o área | Cambio previsto | Criterio |
| --- | --- | --- |
| `tests/tools/quality/project-skill.test.ts` | Nuevo: comprueba las marcas de `SKILL.md` y la referencia en `AGENTS.md`; se escribe y se ve fallar primero. | QC-AC-02 |
| `.claude/skills/react-ts-feature-pattern/SKILL.md` | Sección «Project skill (source of truth)». | QC-AC-02 |
| `AGENTS.md` | Instrucción de cargar y verificar la skill del proyecto (archivo gestionado). | QC-AC-01 |
| `tools/template/baseline-manifest.json`, `tests/tools/template/baseline.test.ts` | Hash de `AGENTS.md` y `baselineId` (`2026-10-06-plat-029.1`); la prueba del `baselineId` se cambia primero. | QC-AC-04 |
| `docs/platform/README.md` | Fila de PLAT-029. | — |

## Pruebas y validación previstas

- Automatizadas: la prueba nueva de marcas (Red por ausencia de la sección, luego Green); la prueba del `baselineId` cambiada primero; `npm run check` y `npm run test:tools`.
- Manuales o de sesión: QC-AC-03 con `CLAUDE_CONFIG_DIR` temporal, sin tocar `~/.claude` real; derivación real de prueba en un directorio temporal, que requiere autorización expresa del token de `--apply`.
- Comando de regresión: `npm run check && npm run test:tools`.

## Riesgos y reclasificación

- Riesgo: la instrucción es declarativa; un agente puede ignorarla y ninguna comprobación automática lo detecta.
- Riesgo: si una copia personal del mismo nombre tiene prioridad sobre la del proyecto, la sección «Project skill (source of truth)» solo la detecta cuando la copia cargada carece de ella; no impide que la personal se cargue.
- Riesgo: la prueba comprueba texto, no el comportamiento del agente.
- Riesgo: los derivados ya creados no reciben el cambio automáticamente.
- Reclasificar como `ADR` si se decide renombrar la skill, añadir un hook o configurar una prioridad de carga, o si se pretende que sea una garantía.
- Reclasificar como `FULL` si la comprobación exige tocar `docs:check`, `architecture:check` o la derivación.

## Puerta documental

La aprobación autoriza implementar únicamente este delta cuando exista autorización expresa de implementación. No autoriza commit ni publicación.

## Registro de entrega opcional

Registrar aquí la entrega del cambio, separada del contrato aprobado y sin modificar este último. Puede usarse un `validation-report.md` independiente si la evidencia es demasiado extensa.

- Estado de entrega: `VALIDATED`
- Archivos modificados: `tests/tools/quality/project-skill.test.ts` (nuevo), `.claude/skills/react-ts-feature-pattern/SKILL.md` (sección «Project skill (source of truth)»), `AGENTS.md`, `tools/template/baseline-manifest.json` (hash de `AGENTS.md` y `baselineId` `react-vite-ts-sdd-template@2026-10-06-plat-029.1`), `tests/tools/template/baseline.test.ts`, `docs/platform/README.md` y este registro.
- Pruebas y resultados: Red observado antes de implementar, con tres fallos por ausencia del comportamiento: `project-skill.test.ts` (sin la sección «Project skill (source of truth)» en `SKILL.md`; sin la ruta de la skill ni la sección en `AGENTS.md` derivado) y `baseline.test.ts` (`baselineId` esperado `…plat-029.1`, recibido `…plat-028.1`); tras implementar pasaron las 7 pruebas de ambos archivos. `npm run check` código `0` (100 % de 18 sentencias, 10 pruebas, build) y `npm run test:tools` 17 archivos / 152 pruebas correctas. QC-AC-04, derivación real en un directorio temporal con la autorización expresa del token `b1effe14…0226`: `template:init --apply` con 5 operaciones, `template:doctor` con `PASS=9 WARN=0 FAIL=0 UNKNOWN=1` (sin remoto observable), el destino contiene la skill y `AGENTS.md` con «Project skill (source of truth)», no contiene `tools/template/`, `npm run check` del derivado con código `0` (10 pruebas, `node_modules` enlazado de la plantilla) y la prueba nueva pasa también en el derivado (2 pruebas). La frescura previa informó 3 `ATTENTION` y 3 `BLOCKED` ajenos a este cambio.
- Desviaciones: QC-AC-03 (comportamiento con una copia personal del mismo nombre) **no se pudo verificar**. Los intentos de aislarlo con `CLAUDE_CONFIG_DIR` y con un `HOME` temporales terminaron con «Not logged in» (la autenticación depende de la configuración real; no se copiaron credenciales). No se sabe si una copia personal del mismo nombre tiene prioridad sobre la del proyecto; la persona responsable decidió dejarlo como no verificado, en lugar de colocar una copia temporal en `~/.claude/skills/` real o probarlo en una sesión interactiva. Las copias externas (`~/.codex/skills/`, `~/.claude/skills/synced/` y `anthropic-skills`) no se han tocado, según el alcance.
- Aceptación: 2026-10-06, Tomás, usuario solicitante. Aceptación expresa «Acepto PLAT-029 como VALIDATED» registrada en la conversación de trabajo tras contrastar los criterios con la evidencia de este registro, aceptando expresamente la limitación anotada: QC-AC-03 (prioridad de una copia personal del mismo nombre) queda no verificado y la garantía es declarativa.
