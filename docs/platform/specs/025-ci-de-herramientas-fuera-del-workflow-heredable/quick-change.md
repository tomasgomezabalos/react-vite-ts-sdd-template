# PLAT-025 — Aplicar ADR-0019: CI de herramientas fuera del workflow heredable

**Estado documental:** APPROVED

**Versión:** 1.0.0

**Fecha:** 2026-10-04

**Aprobado por:** Tomás, usuario solicitante

**Fecha de aprobación:** 2026-10-04

**Evidencia de aprobación:** Aprobación expresa «Sí, aprueba ADR-0019 y PLAT-025 e impleméntalo todo» registrada en la conversación de trabajo, tras proponerse el cambio como `QUICK`.

**Clasificación:** QUICK

## Contrato afectado

- Decisión que se aplica: ADR-0019 (`APPROVED` el 2026-10-04 en la misma petición que este delta), que modifica parcialmente ADR-0013 §3.
- Especificaciones vigentes: PLAT-006 (QC-AC-03: el workflow añade `npm run test:tools` solo en el repositorio canónico), PLAT-004 REQ-09 y AC-10 (workflow `Quality`), PLAT-007 y PLAT-014 (`derivation.exclude`).
- Motivo de clasificación: aplica una decisión aprobada con cambios de configuración y pruebas, sin comportamiento de producto; el efecto observable (las herramientas solo se prueban en CI de la plantilla) se conserva.

## Delta funcional

### Comportamiento vigente

`.github/workflows/quality.yml` tiene un paso «Test template tooling» con `if: github.repository == 'tomasgomezabalos/react-vite-ts-sdd-template'` que ejecuta `npm run test:tools`. Un derivado real (2026-10-04) lo heredó sin poder ejecutarlo, junto con una prueba (`tests/tools/quality/workflow.test.ts`) que exige ese texto.

### Comportamiento aprobado propuesto

- `quality.yml` ejecuta solo `npm ci` y `npm run check`; sin paso condicionado ni nombre del repositorio.
- Nuevo `.github/workflows/template-tools.yml` (nombre `Template tools`): push a `main` y pull requests, `permissions: contents: read`, `concurrency` con cancelación, Node desde `.nvmrc` con caché de npm, `actions/checkout` con `persist-credentials: false`, acciones fijadas a los mismos SHA verificados, y los pasos `npm ci` y `npm run test:tools`.
- `tools/template/baseline-manifest.json`: `derivation.exclude` incluye `.github/workflows/template-tools.yml`; `template:init` rechaza un destino que lo contenga.
- `tests/tools/quality/workflow.test.ts` comprueba solo los workflows heredables; la prueba de `template-tools.yml` se crea en `tests/tools/template/`.
- `README.md` y la regla de derivación de `AGENTS.md` reflejan el nuevo mecanismo.

### Fuera de alcance

- Cambiar `npm run check`, `npm run test:tools` o su contenido.
- Configurar protección de ramas o comprobaciones obligatorias en GitHub.
- Modificar `security.yml` o `dependabot.yml`.

## Criterios afectados

### QC-AC-01 — Workflow heredable limpio

- **Dado** `.github/workflows/quality.yml`
- **Cuando** se inspecciona
- **Entonces** sus únicos comandos son `npm ci` y `npm run check`, no tiene `if:` de repositorio y no contiene el nombre del repositorio canónico

### QC-AC-02 — Workflow de herramientas

- **Dado** `.github/workflows/template-tools.yml`
- **Cuando** se inspecciona
- **Entonces** cumple permisos mínimos, cancelación, Node desde `.nvmrc`, acciones fijadas a SHA con comentario de versión y sin secretos, y ejecuta solo `npm ci` y `npm run test:tools`

### QC-AC-03 — No se deriva

- **Dado** el manifiesto de baseline
- **Cuando** se leen sus exclusiones y se ejecuta `template:init` sobre un destino que contiene el workflow
- **Entonces** la lista lo incluye y `template:init` falla indicando la ruta sin escribir nada

### QC-AC-04 — Derivación real limpia

- **Dado** una derivación real nueva
- **Cuando** se aplican `template:init` y `template:doctor` y se ejecutan `npm run check` y `npm run test:tools` en el derivado
- **Entonces** el derivado no contiene `template-tools.yml`, su `quality.yml` es idéntico al de la plantilla, ningún archivo fuera de `docs/` menciona el repositorio canónico y todo finaliza con código `0`

### QC-AC-05 — Ejecución real en GitHub

- **Dado** el cambio publicado con autorización
- **Cuando** se dispara un push a `main`
- **Entonces** `Quality` y `Template tools` finalizan con `success`; hasta entonces, la inspección local del YAML no se presenta como ejecución real

## Alcance técnico mínimo

| Archivo o área | Cambio previsto | Criterio |
| --- | --- | --- |
| `.github/workflows/quality.yml` | Retirar el paso condicionado. | QC-AC-01 |
| `.github/workflows/template-tools.yml` | Crear. | QC-AC-02 |
| `tools/template/baseline-manifest.json` | Añadir la exclusión; nuevo `baselineId`. | QC-AC-03 |
| `tests/tools/quality/workflow.test.ts` | Ajustar a los workflows heredables. | QC-AC-01 |
| `tests/tools/template/template-tools-workflow.test.ts`, `baseline.test.ts`, `project.test.ts` | Contrato del workflow, lista de exclusiones y rechazo. | QC-AC-02, QC-AC-03 |
| `README.md`, `AGENTS.md` | Mecanismo nuevo (archivos gestionados; regenerar hashes). | QC-AC-04 |
| `docs/architecture/README.md`, `docs/architecture/decisions/0013-…md`, `docs/platform/README.md` | ADR-0019, relación en ADR-0013 y fila de PLAT-025. | — |

## Pruebas y validación previstas

- Automatizadas: las pruebas anteriores, que deben fallar antes del cambio y pasar después; `npm run check` y `npm run test:tools`.
- Manual: recrear el proyecto derivado `Template Check App` y repetir su verificación completa; tras el push, observar los dos workflows en GitHub.
- Comando de regresión: `npm run check && npm run test:tools`.

## Riesgos y reclasificación

- Riesgo: si se protege la rama principal con comprobaciones obligatorias, habrá que añadir `Template tools`.
- Riesgo: los derivados ya creados conservan el paso condicionado hasta adoptar el cambio.
- Reclasificar como `ADR` o `FULL` si se decide generar workflows en el bootstrap o ejecutar `test:tools` en los derivados.

## Puerta documental

La aprobación autoriza implementar únicamente este delta cuando exista autorización expresa de implementación y ADR-0019 esté aprobado. No autoriza commit ni publicación.

## Registro de entrega opcional

- Estado de entrega: `VALIDATED`
- Archivos modificados: `.github/workflows/quality.yml` (sin el paso condicionado), `.github/workflows/template-tools.yml` (nuevo), `tools/template/baseline-manifest.json` (`derivation.exclude` con el workflow nuevo, hash de `README.md` y `AGENTS.md`, `baselineId` `react-vite-ts-sdd-template@2026-10-03-plat-025.1`), `tests/tools/quality/workflow.test.ts`, `tests/tools/template/template-tools-workflow.test.ts` (nuevo), `tests/tools/template/baseline.test.ts`, `tests/tools/template/project.test.ts`, `README.md`, `AGENTS.md`, `docs/architecture/README.md`, `docs/architecture/decisions/0013-separacion-pruebas-aplicacion-y-plantilla.md` (línea «Modificada por»), `docs/platform/README.md`.
- Pruebas y resultados (2026-10-04): antes del cambio fallaban 4 casos (el contrato del workflow nuevo, el de `quality.yml`, la lista de exclusiones y el rechazo del destino con el workflow); después pasan. `npm run check` y `npm run test:tools` finalizan con código `0` (10 pruebas de aplicación, 121 de herramientas). Primera derivación real (`Template Check App`, ya eliminada y recreada): `quality.yml` idéntico al de la plantilla y sin `template-tools.yml`, pero una búsqueda encontró `tomasgomezabalos` en `tests/tools/quality/workflow.test.ts`, porque la nueva aserción lo nombraba en su expresión regular (incumplía QC-AC-04); se corrigió en el commit `9d142ab`. Segunda derivación real, desde ese commit, aplicada con el mismo token de preview (`e5b5e15f…`, 5 operaciones, idempotente): `template:doctor` `PASS=9 FAIL=0 UNKNOWN=1`; `quality.yml` idéntico al de la plantilla; `.github/workflows/` solo contiene `quality.yml` y `security.yml`; ningún archivo fuera de `docs/` menciona el repositorio ni su autor; diferencias con la plantilla limitadas a los 5 archivos gestionados y las rutas excluidas; `npm ci`, `npm run check` (cobertura 100 %), `npm run test:tools` (67 pruebas) y `npm audit` correctos; en el navegador, `dev`, `dev:mocks` (MSW activo) y `preview` con `/` vacío tras el fallback, `/unknown` vacío, `Home` en un chunk aparte, sin worker en `dist/` y sin errores de consola; experimentos sobre una copia: un componente creado con la skill pasa la puerta, y una carpeta `src/components/`, un import de `msw`, un `quick-change.md` sin sección, un archivo sin formatear y una clave i18n inexistente fallan como deben. En GitHub, tras los pushes de `6977a2d` y `9d142ab`, `Quality`, `Security` y `Template tools` finalizaron con `success` (runs `37189698768`, `37189698701` y `37189698672` para el primero; `37189761486`, `37189761455` y `37189761459` para el segundo).
- Desviaciones: se añadió la línea «Modificada por» de ADR-0013, que no estaba en el alcance técnico (corrección editorial); la aserción de `workflow.test.ts` se corrigió en un commit posterior al primero de este cambio; el proyecto derivado se recreó dos veces. Sin otras desviaciones.
- Aceptación: 2026-10-04, Tomás, usuario solicitante. Aceptación expresa «Acepto PLAT-025 como VALIDATED» registrada en la conversación de trabajo tras contrastar los criterios con la evidencia de este registro. Tras el push del registro de implementación (`bde0860`), `Quality` (run `37189871537`), `Security` (run `37189871577`) y `Template tools` (run `37189871605`) finalizaron con `success`.
