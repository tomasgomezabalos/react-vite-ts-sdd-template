# ADR-0014 — Proyectos derivados sin herramientas de plantilla

**Estado documental:** APPROVED

**Versión:** 1.0.0

**Fecha:** 2026-10-01

**Aprobado por:** Tomás, usuario solicitante

**Fecha de aprobación:** 2026-10-01

**Evidencia de aprobación:** Aprobación expresa de ADR-0014 y PLAT-007 («lo que sí hacemos es la aprobación del ADR y del PLAT… adelante») registrada en la conversación de trabajo, junto con la autorización de implementar y de actualizar la skill externa.

**Relación:** Modifica parcialmente ADR-0010 (sección 5), ADR-0012 (secciones 3, 7 y 8) y ADR-0013 (sección 2); se aplicará mediante PLAT-007.

## Contexto

Las utilidades `template:init` y `template:doctor` sirven para crear y diagnosticar copias nuevas de la plantilla, no para el producto derivado. Aun así, la derivación copia la plantilla completa, excepto `.git`, `node_modules`, `dist` y `coverage`, y el proyecto derivado recibe `tools/template/**`, `tests/tools/template/**`, los scripts `template:*`, `.template-state.json` y reglas de bootstrap en `AGENTS.md` y `README.md`.

En cuanto el proyecto evoluciona (dependencias, README, i18n), esas herramientas dejan de coincidir con la baseline: `npm run test:tools` falla y `template:doctor` informa `FAIL` en `INITIALIZATION_STATE` e `I18N_CONFIGURATION`. Bank Dashboard tuvo que retirarlas manualmente mediante su ADR-0017.

Verificación del 2026-10-01 sobre una copia temporal: `template:init` y `template:doctor` ejecutados desde la plantilla funcionan contra un destino que no contiene `tools/template`, porque el manifiesto se lee desde el directorio del propio script. Con ese destino, la única prueba que falla en `test:tools` es la que lee `tools/template/baseline-manifest.json`.

Además, `vite.config.ts` aplica a todas las pruebas el entorno jsdom y `tests/setup/vitest.setup.ts`, que importa `src/i18n/config`. Si un proyecto derivado hace que i18n toque `document` al importarse, fallan al cargar todas las pruebas de `tests/tools`, que usan entorno Node.

## Decisión propuesta

### 1. Declarar lo que no se deriva

`tools/template/baseline-manifest.json` pasará a `schemaVersion: 2` y declarará `derivation.exclude` con, como mínimo: `tools/template/**`, `tests/tools/template/**`, `project.config.json` y `.template-state.json`. La derivación copiará la plantilla respetando esa lista, además de `.git`, `node_modules`, `dist` y `coverage`.

`template:init` rechazará un destino que contenga alguna ruta excluida, de modo que el contrato sea comprobable y no dependa solo de quien copia.

### 2. Operar siempre desde la plantilla

`template:init` y `template:doctor` se ejecutarán desde la plantilla contra `--target`. El `--config` se proporcionará desde fuera del destino y no se persistirá en él.

### 3. Eliminar el estado persistido del derivado

`template:init` dejará de crear `.template-state.json`. La idempotencia y el rechazo de contenido divergente se resolverán comparando cada archivo gestionado con su hash de baseline o con el contenido que renderizaría la configuración:

- coincide con el contenido deseado: sin cambios;
- coincide con la baseline: se modifica;
- cualquier otro caso: se rechaza sin sobrescribir.

El token del preview seguirá ligado a la configuración normalizada, al destino, a la baseline y a los hashes de las operaciones.

### 4. Mantener un doctor técnico, de solo lectura y sin estado

`INITIALIZATION_STATE` se sustituye por una comprobación de coherencia entre los archivos gestionados y la salida que produciría la configuración suministrada. El doctor sigue siendo de solo lectura y limitado a la derivación técnica; se ejecuta tras el apply, no como mantenimiento continuo del proyecto.

### 5. No dejar rastro del bootstrap en el derivado

La salida gestionada de `template:init` eliminará:

- los scripts `template:init` y `template:doctor` de `package.json`;
- la sección «Diagnóstico de la derivación» del `README.md` renderizado;
- del `AGENTS.md`, el bloque delimitado por marcadores `template-only` con las reglas de bootstrap y diagnóstico. `AGENTS.md` pasa a ser archivo gestionado con hash de baseline.

Se conservan en el derivado las reglas de alcance SPA y de separación entre `docs/platform/` y `specs/`.

### 6. Conservar las comprobaciones de calidad

`tools/quality/**`, `tests/tools/quality/**` y `npm run test:tools` permanecen en el derivado, como en ADR-0017 de Bank Dashboard. La prueba que valida los hashes del manifiesto se traslada a `tests/tools/template/`, que no se deriva. La suite `test:tools` del derivado cubre solo los comprobadores `docs:check` y `architecture:check`. `npm run check` no cambia.

### 7. Separar proyectos de Vitest

`vite.config.ts` adoptará `test.projects`, ambos con `extends: true`:

- `app`: `include` `tests/**/*.test.{ts,tsx}`, `exclude` `tests/tools/**`, entorno `jsdom` y `setupFiles` de aplicación;
- `tools`: `include` `tests/tools/**/*.test.ts`, entorno `node`, sin setup.

Los scripts npm, la cobertura (solo `src/`) y los umbrales no cambian.

### 8. Conservar el histórico

PLAT-003 y PLAT-005 no se reescriben. PLAT-007 los enmienda para las derivaciones futuras. Los proyectos ya derivados no se reprovisionan.

## Aplicación prevista tras la aprobación

1. Aprobar la especificación y el plan técnico de PLAT-007.
2. Adaptar `tools/template`, el manifiesto, las pruebas, `vite.config.ts`, `package.json`, `README.md` y `AGENTS.md`.
3. Regenerar el manifiesto de baseline y ejecutar `npm run check` y `npm run test:tools`.
4. Actualizar la skill externa `react-vite-ts-sdd-template-init` (copia con exclusiones y configuración fuera del destino).
5. Validar una derivación completa sobre una copia temporal.

La aprobación del ADR permite utilizar la decisión en planes posteriores; no autoriza automáticamente su aplicación, commit ni publicación.

## Alternativas consideradas

### Que `init` borre los archivos de plantilla del destino

Mantiene la skill sin cambios y muestra los borrados en el preview, pero exige hashes de unas 25 rutas en el manifiesto, sincronizados con cada cambio de las herramientas. Se descarta por coste de mantenimiento; la exclusión al copiar es más simple y `init` la hace cumplir.

### Mantener el estado en el derivado

Conserva el diagnóstico actual, pero obliga a mantener `.template-state.json`, que se invalida con cualquier evolución legítima del proyecto. Se descarta.

### Retirar las herramientas manualmente en cada derivado

Es lo que hizo Bank Dashboard mediante su ADR-0017. No escala y repite el trabajo en cada proyecto. Se descarta.

### Dejar `AGENTS.md` sin gestionar

Evita ampliar los archivos gestionados, pero deja instrucciones obsoletas sobre un bootstrap que el derivado no contiene. Se descarta.

## Consecuencias

- El derivado nace sin código ni reglas de bootstrap y `test:tools` es fiable desde el primer día.
- La baseline cambia: nuevo `baselineId`, manifiesto v2 y hashes regenerados.
- El contrato de PLAT-003 y PLAT-005 cambia para futuras derivaciones: sin estado persistido y con otro diagnóstico de coherencia.
- Un derivado ya no puede diagnosticarse sin la plantilla; esa capacidad permanece en el repositorio de origen.
- Una configuración distinta tras aplicar sigue rechazándose, con otro mensaje.
- La skill externa deja de ser autosuficiente respecto al contenido que copia: depende del manifiesto.

## Migración y reversión

- Migración: aplica solo a futuras derivaciones. Los derivados existentes conservan su estado o lo retiran mediante su propia decisión, como Bank Dashboard.
- Reversión: sustituir este ADR por una decisión aprobada y restaurar estado, scripts y reglas desde el historial Git.

## Fuentes

- Evidencia interna: `tools/template/`, `tests/tools/quality/runtime-config.test.ts`, verificación del 2026-10-01 en copia temporal, ADR-0017 de Bank Dashboard y sus commits `a88c71e` y `f4b4131`.
- ADR-0010, ADR-0012, ADR-0013, PLAT-003 y PLAT-005.
- Tipos de Vitest `4.1.11`: `extends?: string | true` en la definición de proyectos.
