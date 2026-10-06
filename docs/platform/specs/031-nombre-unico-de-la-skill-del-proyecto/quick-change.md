# PLAT-031 — Nombre único para la skill del proyecto

**Estado documental:** APPROVED

**Versión:** 1.0.0

**Fecha:** 2026-10-06

**Aprobado por:** Tomás, usuario solicitante

**Fecha de aprobación:** 2026-10-06

**Evidencia de aprobación:** Aprobación expresa «Apruebo PLAT-031 e implementa» registrada en la conversación de trabajo, tras presentarse el borrador 0.1.0 con el nombre propuesto `sdd-react-ts-feature-pattern`. Autoriza la implementación de este delta; no autoriza commit, publicación ni `template:init --apply`.

**Clasificación:** QUICK

## Contrato afectado

- Reglas que se modifican: `AGENTS.md` («React y diseño»), `docs/sdd/templates/technical-plan.md` y la skill `.claude/skills/react-ts-feature-pattern/SKILL.md`, cuya sección «Project skill (source of truth)» (PLAT-029) afirma que prevalece sobre cualquier copia del mismo nombre.
- Hecho que motiva el cambio: la documentación oficial de Claude Code establece que, con el mismo nombre en varios niveles, «enterprise over personal, and personal over project», que las skills de plugin van con espacio de nombres (`/plugin:skill`) y que no existe ajuste ni frontmatter para que una skill de proyecto prevalezca sobre una personal (<https://code.claude.com/docs/en/skills>, apartado «Resolve skills that share a name», consultado el 2026-10-06). La afirmación de PLAT-029 era, por tanto, incorrecta para una copia personal del mismo nombre.
- Archivos gestionados afectados: `AGENTS.md` (con hash en el manifiesto) y `tools/template/baseline-manifest.json`.
- Motivo de clasificación: cambia el nombre y la invocación de una skill que gobierna el trabajo de los agentes y corrige una afirmación de comportamiento, sin dependencias nuevas ni decisión arquitectónica. Se clasifica `QUICK` por decisión de la persona responsable, que eligió renombrar frente a mantener el nombre.

## Delta funcional

### Comportamiento vigente

La skill del proyecto se llama `react-ts-feature-pattern` (carpeta `.claude/skills/react-ts-feature-pattern/`). El 2026-10-06 no existe en `~/.claude/skills/` ninguna copia personal con ese nombre (solo un directorio de sincronización con la copia de la cuenta) y la copia general `anthropic-skills` lleva espacio de nombres, por lo que hoy se carga la del repositorio. Una persona con una copia personal del mismo nombre cargaría la suya por la regla de precedencia, sin que la sección de PLAT-029 pudiera evitarlo.

### Comportamiento aprobado propuesto

1. La skill pasa a llamarse **`sdd-react-ts-feature-pattern`**: la carpeta se mueve a `.claude/skills/sdd-react-ts-feature-pattern/`, el campo `name` del frontmatter cambia y se actualizan los ejemplos de invocación de su texto. Un nombre propio de la plantilla evita la colisión con skills personales de nombre genérico.
2. `AGENTS.md` y `docs/sdd/templates/technical-plan.md` referencian el nombre y la ruta nuevos. Se conserva la guarda de PLAT-029 (leer el archivo si la skill cargada no contiene «Project skill (source of truth)»).
3. La sección «Project skill (source of truth)» deja de afirmar que prevalece sobre otras copias y pasa a explicar que el nombre es propio del proyecto precisamente porque, según la documentación oficial, una skill personal del mismo nombre tendría prioridad sobre la de proyecto.
4. Las pruebas de la skill (`skill.test.ts` y `project-skill.test.ts`) apuntan a la ruta nueva; la segunda comprueba además el `name` del frontmatter y que el texto no afirme prevalencia sobre copias del mismo nombre.
5. El manifiesto regenera el hash de `AGENTS.md` y el `baselineId`.

### Fuera de alcance

- Reescribir los documentos históricos que mencionan el nombre anterior (ADR-0006, ADR-0021, planes y cambios QUICK previos, incluidos PLAT-021, PLAT-023, PLAT-028 y PLAT-029): conservan el nombre vigente cuando se redactaron.
- Mantener un alias o una skill vacía con el nombre anterior, y cualquier cambio en las copias externas (`~/.codex/skills/`, `~/.claude/skills/synced/` y `anthropic-skills`).
- Configurar `skillOverrides` o cualquier otro ajuste de Claude Code para cambiar la prioridad (la documentación lo describe como un mecanismo para ocultar la personal, no verificado aquí).
- Aplicar el cambio a derivados ya creados.
- Commit, push, merge y publicación.

## Criterios afectados

### QC-AC-01 — Skill renombrada

- **Dado** el repositorio con el cambio aplicado
- **Cuando** se inspecciona `.claude/skills/`
- **Entonces** existe `sdd-react-ts-feature-pattern/SKILL.md` con `name: sdd-react-ts-feature-pattern` en el frontmatter y no existe la carpeta `react-ts-feature-pattern/`

### QC-AC-02 — Referencias activas actualizadas

- **Dado** `AGENTS.md`, `docs/sdd/templates/technical-plan.md` y las pruebas de la skill
- **Cuando** se buscan referencias al nombre anterior fuera de los ADR y las especificaciones históricas
- **Entonces** no queda ninguna y todas apuntan al nombre y la ruta nuevos

### QC-AC-03 — Texto veraz sobre la prioridad

- **Dado** la sección «Project skill (source of truth)» de la skill
- **Cuando** se lee
- **Entonces** declara que es la copia distribuida con el repositorio, explica que el nombre es propio por la precedencia personal sobre proyecto y no afirma prevalecer sobre una copia del mismo nombre; las pruebas que lo comprueban se escribieron antes y fallaron

### QC-AC-04 — Carga real en una derivación

- **Dado** una derivación real de prueba con el cambio aplicado
- **Cuando** una sesión `claude -p` headless con fuentes de proyecto invoca `sdd-react-ts-feature-pattern`
- **Entonces** la skill se carga con el contenido del repositorio (incluida la sección de TDD) y el resultado se registra tal como se observe, sin presentarlo como garantía

### QC-AC-05 — Puerta, manifiesto y derivación

- **Dado** el cambio aplicado
- **Cuando** se ejecutan `npm run check`, `npm run test:tools` y una derivación real con `template:init` y `template:doctor`
- **Entonces** todo finaliza con código `0` (el doctor sin fallos), el manifiesto tiene el hash de `AGENTS.md` y el `baselineId` regenerados y el derivado contiene la skill con el nombre nuevo

## Alcance técnico mínimo

| Archivo o área | Cambio previsto | Criterio |
| --- | --- | --- |
| `tests/tools/quality/skill.test.ts`, `tests/tools/quality/project-skill.test.ts` | Ruta nueva; comprobación del `name` y del texto veraz. Se cambian primero y se ven fallar. | QC-AC-01, QC-AC-02, QC-AC-03 |
| `.claude/skills/react-ts-feature-pattern/` → `.claude/skills/sdd-react-ts-feature-pattern/` | Mover la carpeta (con `references/`), cambiar `name`, ejemplos y la sección «Project skill (source of truth)». | QC-AC-01, QC-AC-03 |
| `AGENTS.md` | Ruta y nombre nuevos (archivo gestionado). | QC-AC-02 |
| `docs/sdd/templates/technical-plan.md` | Nombre nuevo. | QC-AC-02 |
| `tools/template/baseline-manifest.json`, `tests/tools/template/baseline.test.ts` | Hash de `AGENTS.md` y `baselineId` (`2026-10-06-plat-031.1`); la prueba del `baselineId` se cambia primero. | QC-AC-05 |
| `docs/platform/README.md` | Fila de PLAT-031. | — |

## Pruebas y validación previstas

- Automatizadas: las dos pruebas de la skill con la ruta y el nombre nuevos, escritas antes y vistas fallar por la ausencia de la carpeta renombrada y del texto veraz; la prueba del `baselineId` cambiada primero; `npm run check` y `npm run test:tools`.
- Manuales o de sesión: QC-AC-04 en una derivación real de prueba con sesión `claude -p`; derivación real con `template:init` y `template:doctor`, que requiere autorización expresa del token de `--apply`.
- Comando de regresión: `npm run check && npm run test:tools`.

## Riesgos y reclasificación

- Riesgo: la unicidad del nombre es una suposición; hoy no existe ninguna skill llamada `sdd-react-ts-feature-pattern` en esta máquina, pero otra persona podría crear una. La precedencia seguiría favoreciendo a la personal.
- Riesgo: quien invoque `/react-ts-feature-pattern` por costumbre cargará la copia general o personal, no la del proyecto; `AGENTS.md` indica el nombre nuevo.
- Riesgo: los documentos históricos conservan el nombre anterior y pueden confundir; se aceptan como registro del momento.
- Riesgo: los derivados ya creados conservan el nombre anterior hasta adoptar el cambio.
- Reclasificar como `ADR` si se decide configurar `skillOverrides`, un hook u otra política de carga de skills.
- Reclasificar como `FULL` si el renombrado exige tocar `docs:check`, `architecture:check` o la derivación.

## Puerta documental

La aprobación autoriza implementar únicamente este delta cuando exista autorización expresa de implementación. No autoriza commit ni publicación.

## Registro de entrega opcional

Registrar aquí la entrega del cambio, separada del contrato aprobado y sin modificar este último. Puede usarse un `validation-report.md` independiente si la evidencia es demasiado extensa.

- Estado de entrega: `VALIDATED`
- Archivos modificados: `.claude/skills/react-ts-feature-pattern/` movida con `git mv` a `.claude/skills/sdd-react-ts-feature-pattern/` (`SKILL.md` con `name`, ejemplos y sección «Project skill (source of truth)» corregidos, y `references/`), `AGENTS.md`, `docs/sdd/templates/technical-plan.md`, `tests/tools/quality/skill.test.ts`, `tests/tools/quality/project-skill.test.ts`, `tests/tools/template/baseline.test.ts`, `tools/template/baseline-manifest.json` (hash de `AGENTS.md` y `baselineId` `react-vite-ts-sdd-template@2026-10-06-plat-031.1`), `docs/platform/README.md` y este registro.
- Pruebas y resultados: Red observado antes de implementar: 9 fallos (las 5 pruebas de `skill.test.ts` y 3 de `project-skill.test.ts` por `ENOENT` de la carpeta renombrada, que aún no existía, y la de `baseline.test.ts` por `baselineId` esperado `…plat-031.1` y recibido `…plat-030.1`); tras implementar pasaron las 13 pruebas de los tres archivos. `npm run check` código `0` (100 % de 18 sentencias, 10 pruebas, build) y `npm run test:tools` 17 archivos / 153 pruebas correctas. QC-AC-02: fuera de los ADR y las especificaciones históricas solo queda una referencia al nombre anterior, la prueba que comprueba que la carpeta antigua ya no existe, y las filas históricas del índice de plataforma (PLAT-021 y PLAT-029). QC-AC-05, derivación real en un directorio temporal con la autorización expresa del token `8c24fa6d…0f6b`: `template:init --apply` con 5 operaciones, `template:doctor` con `PASS=9 WARN=0 FAIL=0 UNKNOWN=1` (sin remoto observable), el derivado contiene `.claude/skills/sdd-react-ts-feature-pattern/` y `AGENTS.md` con el nombre nuevo, no contiene `tools/template/` y `npm run check` del derivado con código `0` (10 pruebas, `node_modules` enlazado de la plantilla). QC-AC-04, sesión `claude -p` 2.1.285 headless con `--setting-sources project` en una copia de esa derivación: la lista de skills solo contenía `sdd-react-ts-feature-pattern`; se cargó con las secciones «Project skill (source of truth)» y «Red-Green-Refactor»; invocar el nombre anterior devolvió `Unknown skill: react-ts-feature-pattern`. Además, la lista de skills de la sesión interactiva de trabajo mostró `sdd-react-ts-feature-pattern` cargada desde el repositorio. La frescura previa informó 3 `ATTENTION` y 3 `BLOCKED` ajenos a este cambio.
- Desviaciones: ninguna en el alcance. Límites: la comprobación headless usó solo fuentes de proyecto, por lo que no prueba qué ocurre si existe una skill personal con el nombre nuevo (la documentación oficial indica que ganaría la personal; no se verificó empíricamente, por decisión de la persona responsable); la unicidad del nombre es una suposición; los derivados ya creados conservan el nombre anterior.
- Aceptación: 2026-10-06, Tomás, usuario solicitante. Aceptación expresa «Acepto PLAT-031 como VALIDATED» registrada en la conversación de trabajo tras contrastar los criterios con la evidencia de este registro, aceptando expresamente las limitaciones anotadas: no se verificó empíricamente la precedencia de una skill personal con el nombre nuevo, la unicidad del nombre es una suposición y los derivados ya creados conservan el nombre anterior.
