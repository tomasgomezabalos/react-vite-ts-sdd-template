# PLAT-020 — Adopción de MSW 3

**Estado documental:** DRAFT

**Versión:** 0.1.0

**Fecha:** 2026-10-03

**Aprobado por:** Pendiente

**Fecha de aprobación:** Pendiente

**Evidencia de aprobación:** Pendiente

**Clasificación:** QUICK

## Contrato afectado

- Especificación vigente: PLAT-013, versión `1.0.0` (`VALIDATED`), QC-AC-01: `.github/dependabot.yml` ignora `msw` con `^3.0.0`. Este cambio retira esa regla.
- Decisión vigente: ADR-0001 (MSW para simular HTTP en pruebas y, con activación explícita, en desarrollo local; el código bajo `src/` no depende de MSW) y la convención de `mocks/` de `AGENTS.md`. No cambian.
- Relación: PLAT-019 (Node 26 y npm 11) y su nota sobre scripts de instalación omitidos, que deja de ser cierta para MSW 3.
- Motivo de clasificación: actualización de una dependencia de desarrollo con un cambio de opción en dos archivos y de configuración de automatización; sin decisión arquitectónica nueva.

## Condición de aplicación

Este delta **no se aplica antes de que PLAT-019 esté aplicado** (a partir del 2026-10-28). Motivo medido el 2026-10-03: `npm install msw@3` falla con npm `10.9.8` (error interno de arborist, `Cannot read properties of null (reading 'edgesOut')`, también sin lockfile y con `npm update`), y funciona con npm `11.19.1`. La versión exacta de MSW se fija el día de la aplicación (la última 3.x; referencia: `3.0.2`).

## Delta funcional

### Comportamiento vigente

`msw` `^2.15.0`. `mocks/main.ts` inicia el worker con `onUnhandledRequest: 'bypass'` y `tests/setup/vitest.setup.ts` escucha el servidor con `onUnhandledRequest: 'error'`. `mocks/public/mockServiceWorker.js` es la versión `2.15.0`. `.github/dependabot.yml` ignora `msw` `^3.0.0`.

### Comportamiento aprobado propuesto

- `package.json`: `msw` `^<última 3.x>` (referencia `^3.0.2`); `package-lock.json` regenerado con npm 11.
- `mocks/main.ts`: `worker.start({ onUnhandledFrame: 'bypass' })`.
- `tests/setup/vitest.setup.ts`: `server.listen({ onUnhandledFrame: 'error' })`.
- `mocks/public/mockServiceWorker.js`: el worker de la versión instalada, obtenido con `msw init mocks/public --save` ejecutado con la entrada estándar cerrada (el comando queda esperando una respuesta interactiva si no); `msw.workerDirectory` de `package.json` se conserva.
- Una prueba nueva (`tests/setup/msw.test.ts`) fija la semántica de la estrategia por defecto: una petición sin handler es rechazada. Hoy ninguna prueba la cubre.
- `.github/dependabot.yml`: se elimina la regla de `msw`; `typescript` y `@types/node` se conservan. La prueba de contrato de Dependabot deja de exigir la regla de `msw`.
- `README.md`: en la nota de PLAT-019 sobre scripts de instalación, la parte sobre actualizar el worker a mano tras cambiar MSW se sustituye por lo comprobado (MSW 3 no tiene `postinstall`); si PLAT-019 aún no la incluyó, se omite.

### Resultado medido en el prototipo (2026-10-03, copia temporal ya eliminada)

Con Node `26.10.0` y npm `11.19.1`: `npm install -D msw@^3.0.2` correcto; `tsc` falla con `TS2353` en los dos archivos antes del renombrado y pasa después; `npm run check` correcto (10 pruebas de aplicación); una prueba temporal confirmó que una petición sin handler es rechazada con `onUnhandledFrame: 'error'`; el worker generado fue idéntico al que incluye `msw@3.0.2`; en el navegador, con `dev:mocks` el service worker se registra y activa (`[MSW] Mocking enabled`), `<main></main>` queda vacío y no hay errores de consola. Las 3 pruebas de `test:tools` que fallaron fueron las esperadas por haber modificado archivos gestionados en la copia (hashes y valores de runtime) y se sincronizan al aplicar. Una pestaña abierta como URL externa del panel de navegador no podía registrar ningún service worker, ni siquiera con el worker `2.15.0`; se comprobó en la pestaña gestionada por el servidor de desarrollo.

### Fuera de alcance

- El plugin `msw/vite` y el módulo `virtual:msw`: evitarían mantener el worker, pero cambian el flujo de `dev:mocks`; no se han probado.
- Nuevas APIs de MSW 3 (GraphQL por enlaces, suscripciones, `websocket:*`), handlers o fixtures: el repositorio no tiene ninguno.
- Cambios en `tools/quality` (`ARCH_MSW_IN_SOURCE` no se ve afectado) o en la estrategia de pruebas.

## Criterios afectados

### QC-AC-01 — Compilación con la opción nueva

- **Dado** MSW 3 instalado
- **Cuando** se ejecuta `npm run build`
- **Entonces** compila sin errores y no queda ninguna referencia a `onUnhandledRequest` en `mocks/` ni `tests/`

### QC-AC-02 — Estrategia de peticiones sin handler

- **Dado** el servidor de pruebas con `onUnhandledFrame: 'error'`
- **Cuando** una prueba hace `fetch` a una URL sin handler
- **Entonces** la petición se rechaza, y la prueba `tests/setup/msw.test.ts` falla si se vuelve a `'bypass'`

### QC-AC-03 — Modo `dev:mocks` en el navegador

- **Dado** `npm run dev:mocks` en la pestaña gestionada por el servidor de desarrollo
- **Cuando** se abre `/`
- **Entonces** el service worker queda registrado y activado, la consola muestra `[MSW] Mocking enabled`, `<main></main>` queda vacío tras el fallback y no hay errores de consola

### QC-AC-04 — Worker coherente

- **Dado** el cambio aplicado
- **Cuando** se compara `mocks/public/mockServiceWorker.js` con el archivo del paquete instalado (`node_modules/msw/lib/mockServiceWorker.js`)
- **Entonces** son idénticos, su `PACKAGE_VERSION` coincide con la versión de `msw` instalada y `msw.workerDirectory` sigue siendo `mocks/public`

### QC-AC-05 — Dependabot

- **Dado** `.github/dependabot.yml`
- **Cuando** se inspecciona y se ejecuta `npm run test:tools`
- **Entonces** ya no contiene la regla de `msw`, conserva las de `typescript` y `@types/node`, y la prueba de contrato lo exige

### QC-AC-06 — Puerta y derivación intactas

- **Dado** el cambio aplicado con Node y npm de PLAT-019
- **Cuando** se ejecutan `npm ci`, `npm run check`, `npm run test:tools` y una derivación real en copia temporal
- **Entonces** todo finaliza con código `0`, `template:doctor` no tiene `FAIL` y `npm run check` del derivado también

## Alcance técnico mínimo

| Archivo o área | Cambio previsto | Criterio |
| --- | --- | --- |
| `package.json`, `package-lock.json` | `msw` `^3.x` (archivos gestionados). | QC-AC-01, QC-AC-06 |
| `mocks/main.ts` | Renombrar la opción. | QC-AC-01 |
| `tests/setup/vitest.setup.ts` | Renombrar la opción. | QC-AC-01, QC-AC-02 |
| `tests/setup/msw.test.ts` | Crear. | QC-AC-02 |
| `mocks/public/mockServiceWorker.js` | Actualizar con `msw init`. | QC-AC-03, QC-AC-04 |
| `.github/dependabot.yml`, `tests/tools/quality/workflow.test.ts` | Retirar la regla de `msw` y su aserción. | QC-AC-05 |
| `README.md` | Ajustar la nota de scripts de instalación, si existe (archivo gestionado). | QC-AC-06 |
| `tools/template/baseline-manifest.json`, `tests/tools/template/baseline.test.ts` | Hashes y `baselineId`. | QC-AC-06 |
| `docs/platform/README.md` | Fila `PLAT-020`. | — |

## Procedimiento de aplicación

1. Confirmar que PLAT-019 está aplicado y que `node -v` y `npm -v` son los fijados.
2. `npm install -D msw@^3` (última 3.x) y comprobar que la versión instalada es la esperada.
3. Renombrar la opción en `mocks/main.ts` y `tests/setup/vitest.setup.ts`; crear `tests/setup/msw.test.ts`.
4. `node node_modules/msw/cli/index.js init mocks/public --save < /dev/null` (la entrada cerrada evita la espera interactiva) y comprobar QC-AC-04.
5. Retirar la regla de `msw` de `.github/dependabot.yml` y de su prueba.
6. Regenerar hashes y `baselineId`; ejecutar `npm ci`, `npm run check`, `npm run test:tools`, `npm audit` y una derivación real.
7. Comprobar QC-AC-03 en el navegador con las herramientas de vista previa (pestaña gestionada por el servidor) y restaurar cualquier configuración temporal de `.claude/launch.json`.
8. Registrar la entrega y solicitar aceptación; commit y push se solicitan por separado.

## Pruebas y validación previstas

- Automatizadas: las del procedimiento; `tests/setup/msw.test.ts` debe fallar con `'bypass'` y pasar con `'error'`.
- Manual: navegador (QC-AC-03) y derivación real.
- Comando de regresión: `npm run check && npm run test:tools`.

## Riesgos y reclasificación

- Riesgo: que MSW publique una 3.x con cambios adicionales de tipos entre hoy y la aplicación; se repite la medición el día.
- Riesgo: ejecutar `msw init` sin cerrar la entrada estándar deja el proceso esperando; consta en el procedimiento.
- Riesgo: los derivados ya creados siguen en MSW 2 hasta que adopten el cambio.
- Reclasificar como `FULL` o `ADR` si se decide adoptar `msw/vite` o `virtual:msw`, o si el proyecto incorpora handlers que usen las APIs cambiadas.

## Puerta documental

La aprobación autoriza implementar únicamente este delta cuando exista autorización expresa de implementación, y no antes de que PLAT-019 esté aplicado. No autoriza commit ni publicación.

## Registro de entrega opcional

- Estado de entrega: `NOT_STARTED`
- Archivos modificados: Pendiente
- Pruebas y resultados: Pendiente
- Desviaciones: Pendiente
- Aceptación: Pendiente
