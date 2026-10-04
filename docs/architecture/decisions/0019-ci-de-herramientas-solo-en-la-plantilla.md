# ADR-0019 — CI de las herramientas de la plantilla fuera del workflow heredable

**Estado documental:** APPROVED

**Versión:** 1.0.0

**Fecha:** 2026-10-04

**Aprobado por:** Tomás, usuario solicitante

**Fecha de aprobación:** 2026-10-04

**Evidencia de aprobación:** Aprobación expresa «Sí, aprueba ADR-0019 y PLAT-025 e impleméntalo todo» registrada en la conversación de trabajo; la aplicación queda a cargo de PLAT-025.

**Relación:** Modifica parcialmente ADR-0013 §3 (mecanismo que limita `npm run test:tools` al repositorio canónico) y aplica el principio de ADR-0014 (los derivados no reciben herramientas ni automatización de la plantilla). Su aplicación se especifica mediante PLAT-025.

## Contexto

ADR-0013 §3 dispone que el workflow heredable ejecute siempre `npm run check` y añada `npm run test:tools` «únicamente cuando `github.repository` identifique el repositorio canónico». PLAT-006 lo implementó con un paso condicionado por el nombre del repositorio y advirtió el riesgo de que un cambio de nombre exigiera actualizar la condición.

Una derivación real verificada el 2026-10-04 (`template-check-app`, ya eliminada) mostró el efecto en un proyecto nuevo: su `quality.yml` conserva el paso «Test template tooling», que nunca se ejecuta, con el nombre del repositorio de la plantilla, y `tests/tools/quality/workflow.test.ts` (que también se hereda) comprueba ese texto, de modo que el derivado no puede retirar el paso sin editar una prueba. El resto de la derivación coincidía con la plantilla salvo los cinco archivos gestionados y las rutas excluidas (`tools/template/**`, `tests/tools/template/**`, `docs/superpowers/`).

ADR-0014 y `derivation.exclude` ya son el mecanismo para que los derivados no reciban material propio de la plantilla; la CI de las herramientas es material propio de la plantilla.

## Decisión propuesta

1. `.github/workflows/quality.yml` (heredable) ejecuta únicamente `npm ci` y `npm run check`, sin paso condicionado ni referencia al repositorio canónico.
2. La CI de las herramientas pasa a `.github/workflows/template-tools.yml`, un workflow propio de la plantilla (push a la rama principal y pull requests, `contents: read`, cancelación de ejecuciones sustituidas, Node desde `.nvmrc`, acciones fijadas a SHA) que ejecuta `npm ci` y `npm run test:tools`.
3. `derivation.exclude` incluye `.github/workflows/template-tools.yml`; `template:init` rechaza un destino que lo contenga, como con las demás rutas excluidas.
4. Las pruebas de ese workflow viven bajo `tests/tools/template/`, que no se deriva; `tests/tools/quality/workflow.test.ts` solo comprueba los workflows heredables.
5. Ningún archivo heredable contiene el nombre del repositorio canónico.

## Aplicación prevista tras la aprobación

1. Un cambio `QUICK` (PLAT-025) que cree el workflow, retire el paso de `quality.yml`, amplíe `derivation.exclude`, actualice pruebas, `README.md` y `AGENTS.md`, y regenere el manifiesto.
2. Recrear una derivación real y verificar que su `quality.yml` es el heredable y que el derivado no contiene el workflow de herramientas.
3. Actualizar el índice de arquitectura y la relación de ADR-0013.

La aprobación del ADR permite utilizar la decisión en planes posteriores; no autoriza automáticamente su aplicación, commit ni publicación.

## Alternativas consideradas

### Mantener el paso condicionado por el nombre del repositorio

Es el estado actual; deja en cada derivado un paso muerto, el nombre del repositorio de la plantilla y una prueba que lo exige.

### Condicionar el paso por la existencia de `tools/template/`

Quita el nombre del repositorio, pero el paso muerto y su referencia a una ruta inexistente siguen en cada derivado.

### Generar `quality.yml` en el bootstrap sin el paso

Limpia el derivado, pero convierte el workflow en una salida gestionada nueva, con su hash, su diagnóstico y sus pruebas, más trabajo y superficie que excluir un archivo.

### Ejecutar `test:tools` también en los derivados

Contradice ADR-0013, que mantiene esa suite fuera de la puerta de un proyecto derivado.

## Consecuencias

- El `quality.yml` de un derivado es idéntico al de la plantilla y no menciona la plantilla.
- La plantilla pasa a tener dos workflows de calidad (`Quality` y `Template tools`); si se exigen comprobaciones obligatorias en la rama protegida, hay que listar ambas.
- Un cambio del nombre del repositorio canónico ya no afecta a ningún archivo heredable.
- Los derivados ya creados conservan el paso condicionado hasta adoptar el cambio por su propio flujo.

## Migración y reversión

- Migración: aplicar PLAT-025; no hay datos que migrar.
- Reversión: restaurar el paso condicionado en `quality.yml` y retirar el workflow y su exclusión mediante otro cambio.

## Fuentes

- ADR-0013 §3, ADR-0014, PLAT-006 y `.github/workflows/quality.yml` (texto citado el 2026-10-04).
- Derivación real verificada el 2026-10-04 (resultado descrito en el contexto).
- Ninguna fuente externa necesaria.
