# PLAT-027 — Configuración compartida de Claude Code (permisos y formateo automático)

**Estado documental:** APPROVED

**Versión:** 1.0.0

**Fecha:** 2026-10-04

**Aprobado por:** Tomás, usuario solicitante

**Fecha de aprobación:** 2026-10-04

**Evidencia de aprobación:** Aprobación expresa «Apruebo PLAT-027 e implementa» registrada en la conversación de trabajo, tras proponerse el cambio como `QUICK` y presentarse su borrador 0.1.0. Autoriza la implementación de este delta; no autoriza commit ni publicación.

**Clasificación:** QUICK

## Contrato afectado

- Reglas que se aplican: `AGENTS.md` («Pruebas y calidad»: aplicar `npm run format` antes de la puerta; «Spec-Driven Development»: commit, push, merge, despliegue y publicación requieren autorizaciones independientes) y PLAT-008 (`.claude/settings.local.json` queda fuera de la derivación).
- Archivos afectados: nuevos `.claude/settings.json` y `tools/quality/format-edited-file.ts`; `AGENTS.md` y `README.md` (archivos gestionados) y el manifiesto de la baseline.
- Motivo de clasificación: añade configuración de herramienta de desarrollo (no de producto) que cambia el comportamiento observable del agente en la plantilla y en los derivados: qué comandos pide confirmar y que formatea los archivos que edita. Es pequeño y localizado, y no introduce dependencias ni modifica la arquitectura de la aplicación. Se clasifica `QUICK` por decisión de la persona responsable; la política de permisos es un caso limítrofe y se reclasificará como `ADR` si crece (véase «Riesgos y reclasificación»).

## Delta funcional

### Comportamiento vigente

El repositorio solo contiene `.claude/launch.json` y la skill del proyecto. `.claude/settings.local.json` está ignorado y excluido de la derivación, de modo que cada proyecto nuevo arranca sin reglas de permisos compartidas y sin ningún hook: los comandos de la puerta de calidad se aprueban a mano y el formato solo se comprueba al final con `npm run check`.

### Comportamiento aprobado propuesto

- Nuevo `.claude/settings.json` versionado, con `$schema` de `https://json.schemastore.org/claude-code-settings.json`, que se deriva a los proyectos nuevos:
  - `permissions.allow`: `Bash(npm run check)`, `Bash(npm run lint)`, `Bash(npm run format)`, `Bash(npm run format:check)`, `Bash(npm run docs:check)`, `Bash(npm run architecture:check)`, `Bash(npm run test)`, `Bash(npm run test:coverage)` y `Bash(npm run build)`.
  - `permissions.ask`: `Bash(git commit *)` y `Bash(git push *)`, para exigir confirmación expresa por operación conforme a `AGENTS.md`.
  - `permissions.deny`: `Bash(npm publish *)`, `Read(./.env)` y `Read(./.env.*)`.
  - `hooks.PostToolUse` con `matcher` `Edit|Write|MultiEdit` que ejecuta `tools/quality/format-edited-file.ts`.
- `tools/quality/format-edited-file.ts` lee de la entrada estándar el JSON del hook y toma `tool_input.file_path`. Si el archivo está dentro del proyecto y su extensión es `ts`, `tsx`, `js`, `scss` o `json`, ejecuta el Prettier local del proyecto con `--write` sobre ese único archivo, respetando `.prettierignore`. Cualquier otro caso (sin ruta, extensión no soportada, fuera del proyecto, Prettier no instalado, entrada no válida) termina con código `0` sin escribir nada. Si Prettier no puede procesar el archivo (por ejemplo, error de sintaxis), termina con código `2` y el mensaje en la salida de error, que Claude recibe como aviso.
- `AGENTS.md` y `README.md` documentan el archivo, el hook y sus límites.

### Fuera de alcance

- Subagentes, skills de proceso, reglas por ruta (`.claude/rules/`), plugins, servidores MCP y la GitHub Action de revisión.
- Reglas `allow` para comandos de git de solo lectura, que Claude Code ya ejecuta sin preguntar según su documentación.
- Un hook de `Stop` o de `PreToolUse` y cualquier ejecución de `npm run check` desde un hook.
- Sustituir a `format:check` o a la puerta de calidad.
- Modificar o excluir de la derivación `.claude/settings.local.json` (PLAT-008).

## Criterios afectados

### QC-AC-01 — Reglas de permisos compartidas

- **Dado** el repositorio con el cambio aplicado
- **Cuando** se lee `.claude/settings.json`
- **Entonces** es JSON válido y contiene exactamente las reglas `allow`, `ask` y `deny` y el hook `PostToolUse` descritos, sin reglas `allow` de `git commit`, `git push`, `npm publish` ni de lectura de `.env*`

### QC-AC-02 — Formateo del archivo editado

- **Dado** un proyecto de prueba con un archivo `ts` mal formateado, otro con extensión no soportada y uno listado en `.prettierignore`
- **Cuando** se ejecuta el hook con la ruta de cada uno
- **Entonces** solo el primero queda formateado y los otros no se modifican; el código de salida es `0`

### QC-AC-03 — Fallos no bloqueantes y errores visibles

- **Dado** entradas inválidas (JSON roto, sin `file_path`, ruta fuera del proyecto, Prettier no instalado) y un archivo con error de sintaxis
- **Cuando** se ejecuta el hook
- **Entonces** las entradas inválidas terminan con `0` sin escribir ningún archivo y el error de sintaxis termina con `2` y el diagnóstico en la salida de error

### QC-AC-04 — Derivación

- **Dado** una derivación real con `template:init` y `template:doctor`
- **Cuando** se inspecciona el destino
- **Entonces** contiene `.claude/settings.json` y `tools/quality/format-edited-file.ts`, no contiene `.claude/settings.local.json`, y `npm run check` del derivado finaliza con código `0`

### QC-AC-05 — Puerta intacta

- **Dado** el cambio aplicado
- **Cuando** se ejecutan `npm run check` y `npm run test:tools`
- **Entonces** ambos finalizan con código `0` y `npm run check` no ejecuta el hook

## Alcance técnico mínimo

| Archivo o área | Cambio previsto | Criterio |
| --- | --- | --- |
| `.claude/settings.json` | Nuevo: permisos y hook `PostToolUse`. | QC-AC-01, QC-AC-04 |
| `tools/quality/format-edited-file.ts` | Nuevo: lectura de la entrada, filtro de ruta y extensión, llamada a Prettier local, códigos de salida. | QC-AC-02, QC-AC-03 |
| `tests/tools/quality/format-edited-file.test.ts` y fixtures | Nuevo: casos de QC-AC-01 a QC-AC-03, sin red. | QC-AC-01 a QC-AC-03 |
| `AGENTS.md`, `README.md` | Documentar el archivo y el hook (archivos gestionados). | QC-AC-04 |
| `tools/template/baseline-manifest.json`, `tests/tools/template/baseline.test.ts` | Hashes y `baselineId`; comprobar que la derivación incluye los nuevos archivos. | QC-AC-04 |
| `docs/platform/README.md` | Fila de PLAT-027. | — |

## Pruebas y validación previstas

- Automatizadas: pruebas del hook con proyectos temporales (deben fallar antes de implementarlo y pasar después) y lectura del JSON de `settings.json`; `npm run check` y `npm run test:tools`.
- Manuales: en una sesión real de Claude Code, comprobar que `npm run check` se ejecuta sin pedir confirmación, que `git commit` y `git push` la piden, que la lectura de `.env` se rechaza y que una edición de un archivo mal formateado queda formateada. Comprobar también la forma exacta del campo `command` del hook con `${CLAUDE_PROJECT_DIR}`; la documentación oficial muestra la variable, pero no se ha probado en este repositorio.
- Derivación real con su verificación completa (QC-AC-04).
- Comando de regresión: `npm run check && npm run test:tools`.

## Riesgos y reclasificación

- Riesgo: las reglas de Bash comparan el texto del comando y no cubren invocaciones alternativas (por ejemplo, `git -C . push`); no son una frontera de seguridad y se documentan como ayuda, no como garantía (documentación oficial de permisos de Claude Code).
- Riesgo: las reglas `allow` de un proyecto solo se aplican tras confiar en la carpeta; hasta entonces el derivado pedirá confirmación.
- Riesgo: el hook solo actúa sobre archivos editados con las herramientas de edición, no sobre los generados por comandos de shell; `format:check` sigue siendo la puerta.
- Riesgo: una regla `deny` de `Read(./.env*)` no impide leer esos archivos mediante comandos que Claude Code no reconoce.
- Reclasificar como `ADR` si se decide ampliar la política de permisos más allá de lo descrito (por ejemplo, reglas gestionadas, `bypassPermissions` o sandbox) o si se pretende que la configuración sea una garantía de seguridad.
- Reclasificar como `FULL` si se añaden subagentes, skills, plugins o MCP.

## Puerta documental

La aprobación autoriza implementar únicamente este delta cuando exista autorización expresa de implementación. No autoriza commit ni publicación.

## Registro de entrega opcional

Registrar aquí la entrega del cambio, separada del contrato aprobado y sin modificar este último. Puede usarse un `validation-report.md` independiente si la evidencia es demasiado extensa.

- Estado de entrega: `VALIDATED`
- Archivos modificados: `.claude/settings.json`, `tools/quality/format-edited-file.ts` y `tests/tools/quality/format-edited-file.test.ts` (nuevos), `AGENTS.md`, `README.md`, `tools/template/baseline-manifest.json` (hashes y `baselineId` `react-vite-ts-sdd-template@2026-10-04-plat-027.1`), `tests/tools/template/baseline.test.ts`, `docs/platform/README.md` y este registro.
- Pruebas y resultados: `npm run check` código `0`; `npm run test:tools` 16 archivos / 150 pruebas correctas (7 nuevas del hook y de `settings.json`, escritas antes y fallando antes de implementar). Derivación real en un directorio temporal con la autorización expresa del token `9c65453f…bb9d`: `template:init --apply` con 5 operaciones, `template:doctor` con `PASS=9 WARN=0 FAIL=0 UNKNOWN=1` (sin remoto observable), el destino contiene `.claude/settings.json` y `tools/quality/format-edited-file.ts` y no contiene `.claude/settings.local.json`, `tools/template/` ni scripts `template:*`, y `npm run check` del derivado con código `0` (10 pruebas). La copia se construyó con `git ls-files` más los archivos aún sin versionar. Comando del hook comprobado con `sh -c` y `CLAUDE_PROJECT_DIR`: formatea el archivo y sale con `0`.
- Desviaciones: ninguna en el alcance. Comprobación en la propia sesión de Claude Code (2026-10-04): el hook se ejecutó al crear con la herramienta Write un archivo mal formateado (quedó formateado y el sistema informó de la modificación posterior) y `Read` de `.env` fue rechazado por los permisos. No concluyentes: `git commit --dry-run` se ejecutó sin que pueda confirmar que se pidiera confirmación (el modo de permisos de la sesión puede omitirla) y `npm run check` ya estaba permitido por `.claude/settings.local.json`, por lo que no se aísla la regla `allow` compartida. Esas dos comprobaciones requieren una sesión nueva en modo de permisos por defecto.
- Aceptación: 2026-10-04, Tomás, usuario solicitante. Aceptación expresa «Acepto PLAT-027 como VALIDATED» registrada en la conversación de trabajo tras contrastar los criterios con la evidencia de este registro, aceptando expresamente la limitación anotada: las confirmaciones de `git commit` y `git push` y la regla `allow` compartida no se comprobaron en una sesión nueva con el modo de permisos por defecto.
