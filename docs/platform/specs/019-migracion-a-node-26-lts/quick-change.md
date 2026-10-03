# PLAT-019 — Migración del runtime a Node 26 LTS

**Estado documental:** APPROVED

**Versión:** 1.0.0

**Fecha:** 2026-10-03

**Aprobado por:** Tomás, usuario solicitante

**Fecha de aprobación:** 2026-10-03

**Evidencia de aprobación:** Aprobación expresa «Opción 1 para allowScripts, aprueba PLAT-019» registrada en la conversación de trabajo, tras proponerse el cambio como `QUICK`. La aplicación queda condicionada a la fecha del 2026-10-28 y a una autorización expresa de implementación.

**Clasificación:** QUICK

## Contrato afectado

- Decisión vigente que se aplica: ADR-0017, versión `1.0.0` (`APPROVED`), puntos 1 a 4 (migrar a Node 26 al entrar en LTS el 2026-10-28; fijar versión exacta de Node y la de npm que incluye; cambio coordinado; verificación previa con npm 11).
- Especificación vigente que se actualiza: PLAT-004, REQ-01 y AC-01 (runtime coherente y comprobable), cuyos valores concretos (`22.23.2`, `10.9.8`) sustituye ADR-0017 al modificar parcialmente ADR-0011 §1.
- Motivo de clasificación: aplica una decisión ya aprobada con un cambio coordinado de configuración; no introduce decisiones nuevas, salvo la de no declarar `allowScripts` (véase «Decisión: scripts de instalación»), aprobada con este delta.

## Condición de aplicación

Este delta **no se aplica antes del 2026-10-28**, fecha en que Node 26 entra en LTS según el calendario oficial (`nodejs/Release`, `schedule.json`). Hasta entonces la baseline permanece en Node `22.23.2` y npm `10.9.8`. Se redactó el 2026-10-03 con una simulación completa en una copia temporal, para que el día de la migración solo haya que fijar las versiones exactas y repetir las comprobaciones.

## Delta funcional

### Comportamiento vigente

Node `22.23.2` y npm `10.9.8`, declarados en `.nvmrc`, `package.json` (`engines`, `devEngines`, `packageManager`), `package-lock.json`, `README.md`, `AGENTS.md` y pruebas. `devEngines` con `onFail: error` hace que npm rechace cualquier otro runtime (con Node 26 y npm 11 falla `npm ci` con `EBADDEVENGINES`).

### Comportamiento aprobado propuesto

El día de la migración:

- `.nvmrc`: la última versión de Node 26 publicada, consultada en `nodejs.org/dist/index.json` ese día (referencia de la simulación: `26.10.0`, npm `11.19.1`).
- `package.json`: `engines.node` `>=<versión> <27`, `engines.npm` `>=<npm> <12`, `packageManager` `npm@<npm>`, `devEngines.runtime` y `devEngines.packageManager` con las versiones exactas y `onFail: error`, y `@types/node` a la línea mayor 26.
- `package-lock.json` regenerado con npm 11 (en la simulación solo cambiaron `engines` del paquete raíz, `@types/node` `22.20.5` → `26.6.4` y `undici-types` `6.21.0` → `8.9.0`; `lockfileVersion` sigue en 3).
- `README.md` y `AGENTS.md`: las versiones citadas.
- `tests/tools/quality/runtime-config.test.ts`: los valores esperados.
- Manifiesto de baseline: hashes de los archivos gestionados modificados y nuevo `baselineId`; `tests/tools/template/baseline.test.ts` con el nuevo identificador.
- CI: sin cambios, porque `actions/setup-node` lee `.nvmrc`.

### Resultado medido en la simulación (2026-10-03, copia temporal ya eliminada)

Con Node `26.10.0` y npm `11.19.1`, aplicando exactamente la lista anterior:

- `npm ci` desde cero correcto y `npm audit` sin vulnerabilidades.
- `npm run check` correcto (lint, formato, `docs:check`, `architecture:check`, 10 pruebas con cobertura y build) y `npm run test:tools` con las 97 pruebas.
- Derivación real: `template:init` aplicado, `template:doctor` sin `FAIL` (`NODE_VERSION` correcto con el rango `>=26.10.0 <27`) y `npm run check` del derivado con código `0`.
- Servidor de desarrollo (`vite`) arranca y sirve la página (HTTP 200).
- Sin cambiar los archivos, con las declaraciones actuales, `npm ci` falla con `EBADDEVENGINES`, como se espera.

### Decisión: scripts de instalación (`allowScripts`)

npm `11.19.1` bloquea por defecto los scripts de instalación de las dependencias y avisa de los que no cubre `allowScripts` (según `npm help install-scripts` de esa versión: «Dependency install scripts are blocked by default»). En el proyecto afectan a `msw` (`postinstall`, que mantiene sincronizado `mocks/public/mockServiceWorker.js` con la versión de MSW), `@parcel/watcher` (`install`) y `fsevents`. En la simulación, todo funciona con los scripts omitidos y `mockServiceWorker.js` quedó idéntico; la consecuencia previsible es que, tras actualizar MSW, habrá que ejecutar `npx msw init mocks/public` a mano. No se ha analizado el efecto de omitir los scripts de `@parcel/watcher` y `fsevents` más allá de que `check` y el servidor de desarrollo funcionan.

Opciones consideradas:

1. No declarar `allowScripts` y documentar en el `README.md` la actualización manual del worker de MSW. Es el valor por defecto más restrictivo.
2. Aprobar solo `msw` con `npm install-scripts approve msw`, que añade `allowScripts` a `package.json`.
3. Aprobar los tres paquetes.

**Decisión aprobada (2026-10-03): opción 1.** No se declara `allowScripts` en `package.json`. El `README.md` documentará que, con npm 11, los scripts de instalación de las dependencias se omiten por defecto y que, tras actualizar MSW, el worker de `mocks/public/` se actualiza manualmente con `npx msw init mocks/public`. Esta nota se redacta el día de la aplicación y se comprueba con la versión de MSW vigente entonces.

### Fuera de alcance

- Migrar a TypeScript 7 o MSW 3, y cualquier cambio de dependencias distinto de `@types/node`.
- Cambiar la política de Dependabot de `@types/node` (PLAT-009 y PLAT-013).
- Actualizar los derivados ya creados.

## Criterios afectados

### QC-AC-01 — Declaraciones coherentes

- **Dado** el cambio aplicado
- **Cuando** se leen `.nvmrc`, `package.json` y el lockfile
- **Entonces** declaran la misma versión exacta de Node 26 y la misma de npm, con rangos `<27` y `<12`, y `@types/node` en la línea 26

### QC-AC-02 — Puerta completa en el runtime nuevo

- **Dado** Node y npm de las versiones fijadas
- **Cuando** se ejecutan `npm ci`, `npm run check` y `npm run test:tools`
- **Entonces** todo finaliza con código `0`

### QC-AC-03 — Runtime incorrecto rechazado

- **Dado** Node `22.x` con npm `10.x`
- **Cuando** se ejecuta `npm ci`
- **Entonces** npm falla con `EBADDEVENGINES`

### QC-AC-04 — Derivación

- **Dado** una derivación real en copia temporal
- **Cuando** se aplican `template:init` y `template:doctor` y se ejecuta `npm run check` en el derivado
- **Entonces** no hay `FAIL`, `NODE_VERSION` es correcto y la puerta del derivado finaliza con código `0`

### QC-AC-05 — Entorno de desarrollo

- **Dado** el runtime nuevo
- **Cuando** se ejecutan `npm run dev` y `npm run dev:mocks` y se abre la aplicación en el navegador
- **Entonces** `/` renderiza `<main></main>` tras el fallback, `/unknown` queda vacío, MSW se activa en `dev:mocks` y no hay errores de consola

## Alcance técnico mínimo

| Archivo o área | Cambio previsto | Criterio |
| --- | --- | --- |
| `.nvmrc`, `package.json`, `package-lock.json` | Versiones, rangos, `devEngines`, `packageManager` y `@types/node` (archivos gestionados salvo `.nvmrc`). | QC-AC-01 |
| `README.md`, `AGENTS.md` | Versiones citadas y la nota sobre los scripts de instalación omitidos y la actualización manual del worker de MSW (archivos gestionados). | QC-AC-01 |
| `tests/tools/quality/runtime-config.test.ts` | Valores esperados. | QC-AC-01, QC-AC-02 |
| `tools/template/baseline-manifest.json`, `tests/tools/template/baseline.test.ts` | Hashes y `baselineId`. | QC-AC-02 |
| `docs/platform/README.md` | Fila `PLAT-019`. | — |

## Procedimiento de aplicación (el día de la migración)

1. Confirmar con `schedule.json` que Node 26 es LTS y leer en `dist/index.json` la última versión de Node 26 y su npm.
2. Instalar esa versión (`nvm install <versión>`; `nvm use`) y comprobar `node -v` y `npm -v`.
3. Aplicar los cambios de la tabla anterior y regenerar el lockfile con `npm install`.
4. Regenerar los hashes del manifiesto de los archivos gestionados modificados y fijar el nuevo `baselineId`.
5. Ejecutar `npm ci`, `npm run check`, `npm run test:tools`, `npm audit` y una derivación real en copia temporal; comprobar QC-AC-03 con Node 22.
6. Comprobar `npm run dev` y `npm run dev:mocks` en el navegador (QC-AC-05).
7. Registrar la entrega y solicitar tu aceptación; commit y push se solicitan por separado.

## Pruebas y validación previstas

- Automatizadas: las del procedimiento; deben fallar con las declaraciones antiguas bajo el runtime nuevo y pasar tras el cambio.
- Manual: navegador (QC-AC-05) y derivación real.
- Comando de regresión: `npm run check && npm run test:tools`.

## Riesgos y reclasificación

- Riesgo: que entre el 2026-10-03 y el 2026-10-28 aparezca una versión de Node 26 o de npm con comportamiento distinto; se repite la medición el día de la migración.
- Riesgo: omitir los scripts de instalación deje sin actualizar el worker de MSW tras un cambio de versión; mitigado con la nota del `README.md` y la actualización manual.
- Riesgo: los derivados ya creados siguen en Node 22 hasta que adopten el cambio.
- Reclasificar como `FULL` o `ADR` si hay que cambiar dependencias más allá de `@types/node`, o si se decide declarar `allowScripts`, lo que sería una política de seguridad de la baseline.

## Puerta documental

La aprobación autoriza implementar únicamente este delta cuando exista autorización expresa de implementación, y no antes del 2026-10-28. No autoriza commit ni publicación.

## Registro de entrega opcional

- Estado de entrega: `NOT_STARTED`
- Archivos modificados: Pendiente
- Pruebas y resultados: Pendiente
- Desviaciones: Pendiente
- Aceptación: Pendiente
