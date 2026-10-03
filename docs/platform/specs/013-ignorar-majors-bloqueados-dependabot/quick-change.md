# PLAT-013 — Ignorar en Dependabot los majors bloqueados de TypeScript y MSW

**Estado documental:** APPROVED

**Versión:** 1.0.0

**Fecha:** 2026-10-03

**Aprobado por:** Tomás, usuario solicitante

**Fecha de aprobación:** 2026-10-03

**Evidencia de aprobación:** Aprobación expresa «Aprueba PLAT-013 e impleméntalo» registrada en la conversación de trabajo, tras proponerse el cambio como `QUICK`.

**Clasificación:** QUICK

## Contrato afectado

- Especificación vigente: PLAT-009, versión `1.0.0` (`VALIDATED`), QC-AC-01 («exclusión de mayores de `@types/node`»). Este cambio amplía las exclusiones sin modificar el contenido aprobado de PLAT-009.
- Evidencia que lo motiva: pull requests 1 y 2 de Dependabot (`typescript` 6.0.3 → 7.0.2 y `msw` 2.15.0 → 3.0.1), con sus checks en rojo y cerrados a propósito el 2026-10-03; causas registradas en PLAT-009 y en la Fase 6 del plan de mejora.
- Motivo de clasificación: ajuste pequeño y localizado de una configuración de automatización; sin decisión arquitectónica nueva.

## Delta funcional

### Comportamiento vigente

`.github/dependabot.yml` ignora solo las actualizaciones mayores de `@types/node`. Dependabot propone `typescript` 7 y `msw` 3, que hoy no son adoptables.

### Comportamiento aprobado propuesto

- La entrada `npm` añade dos reglas `ignore` por rango de versiones, con la sintaxis `versions` documentada por GitHub para npm (`^1.0.0` como ejemplo): `typescript` con `^7.0.0` y `msw` con `^3.0.0`. Así siguen proponiéndose versiones posteriores (por ejemplo, TypeScript 8 o MSW 4), a diferencia de ignorar todos los mayores.
- Cada regla lleva un comentario YAML con el motivo y la condición para retirarla:
  - `typescript`: `typescript-eslint` 8.x declara el peer `>=4.8.4 <6.1.0`; retirar cuando `typescript-eslint` admita TypeScript 7 y `tools/quality` funcione con él.
  - `msw`: MSW 3 elimina `onUnhandledRequest` de los tipos y requiere migrar `mocks/main.ts` y `tests/setup/vitest.setup.ts`; retirar al planificar esa migración.
- `README.md` refleja las exclusiones adicionales.

### Fuera de alcance

- Cerrar o reabrir pull requests, usar comandos `@dependabot` o ignorar otros paquetes.
- Migrar a TypeScript 7 o MSW 3.
- Cambios en el workflow `Security`, `Quality` o la puerta `check`.

## Criterios afectados

### QC-AC-01 — Reglas de ignorado con motivo

- **Dado** `.github/dependabot.yml`
- **Cuando** se inspecciona su contenido
- **Entonces** conserva la exclusión de mayores de `@types/node` y añade `typescript` con `^7.0.0` y `msw` con `^3.0.0`, cada una con un comentario de motivo y de condición de retirada

### QC-AC-02 — Contrato probado

- **Dado** la prueba de contrato de Dependabot
- **Cuando** se ejecuta `npm run test:tools`
- **Entonces** comprueba las tres reglas y falla si se elimina alguna

### QC-AC-03 — Puerta intacta

- **Dado** el cambio aplicado
- **Cuando** se ejecutan `npm run check` y `npm run test:tools`
- **Entonces** ambos finalizan con código `0` y una derivación real incluye el archivo sin errores

## Alcance técnico mínimo

| Archivo o área | Cambio previsto | Criterio |
| --- | --- | --- |
| `.github/dependabot.yml` | Añadir las dos reglas con comentarios. | QC-AC-01 |
| `tests/tools/quality/workflow.test.ts` | Ampliar la prueba de Dependabot. | QC-AC-02 |
| `README.md` | Actualizar la frase sobre exclusiones (archivo gestionado). | QC-AC-01 |
| `tools/template/baseline-manifest.json`, `tests/tools/template/baseline.test.ts` | Regenerar hash de `README.md` y `baselineId`. | QC-AC-03 |
| `docs/platform/README.md` | Fila `PLAT-013`. | — |

## Pruebas y validación previstas

- Automatizadas: prueba de contrato; `npm run check` y `npm run test:tools`; derivación real en copia temporal.
- Manual: el efecto sobre Dependabot solo se observa tras publicar y esperar su siguiente ejecución, y no he verificado en esta sesión que la sintaxis `versions: ['^7.0.0']` se interprete como se espera; GitHub documenta `^1.0.0` como ejemplo para npm. Si Dependabot reporta la configuración como inválida, se corrige con este mismo delta.
- Comando de regresión: `npm run check && npm run test:tools`.

## Riesgos y reclasificación

- Riesgo: olvidar retirar las reglas cuando el bloqueo desaparezca; mitigado por el comentario con la condición y por revisar la Fase 6 del plan.
- Riesgo: que la sintaxis de rango no ignore lo esperado; se contrasta al observar la siguiente ejecución.
- Reclasificar como `ADR` si se decide una política general de no adoptar majors automáticamente.

## Puerta documental

La aprobación autoriza implementar únicamente este delta cuando exista autorización expresa de implementación. No autoriza commit ni publicación.

## Registro de entrega opcional

- Estado de entrega: `VALIDATED`
- Archivos modificados: `.github/dependabot.yml`, `tests/tools/quality/workflow.test.ts`, `README.md`, `tools/template/baseline-manifest.json` (hash de `README.md` y `baselineId` `react-vite-ts-sdd-template@2026-10-03-plat-013.1`), `tests/tools/template/baseline.test.ts`, `docs/platform/README.md`.
- Pruebas y resultados (2026-10-03): `npm run check` y `npm run test:tools` finalizan con código `0` (10 pruebas de aplicación, 58 de herramientas). El YAML se carga con `ruby -ryaml` y muestra las tres reglas (`@types/node` por `update-types`; `typescript` con `^7.0.0`; `msw` con `^3.0.0`). Al eliminar temporalmente la regla de `msw`, la prueba de contrato falla (1 de 5); restaurada, pasa. Derivación real en copia temporal (ya eliminada): `template:init` aplicado, `template:doctor` sin `FAIL` y `npm run check` del derivado con código `0`. Ejecución en GitHub tras el push de `32c6b67` (2026-10-03): `Quality` (run `37152527634`) y `Security` (run `37152527629`) finalizan con `success`; las dos ejecuciones de `Dependabot Updates` disparadas por el cambio (runs `37152529844` y `37152529767`) terminan con `success`, no aparecen pull requests nuevos y los PR 1 (`typescript` 7.0.2) y 2 (`msw` 3.0.1) siguen cerrados. Quedan ramas remotas `dependabot/npm_and_yarn/typescript-7.0.2` y `.../msw-3.0.1` de esos PR, sin tocar. No se ha observado una ejecución semanal normal posterior ni se ha verificado la sintaxis `versions: ['^7.0.0']` más allá del ejemplo `^1.0.0` de la documentación de GitHub; la ausencia de PR nuevos es compatible con la regla, pero no la demuestra por sí sola.
- Desviaciones: durante la implementación una aserción sobre el comentario se ajustó a `Retirar cuando` y `Retirar al planificar`, porque el comentario se reparte en varias líneas. Sin otras desviaciones.
- Aceptación: 2026-10-03, Tomás, usuario solicitante. Aceptación expresa «Sí, actualiza el registro de PLAT-013 y acepto como VALIDATED» registrada en la conversación de trabajo, sin esperar a una ejecución semanal normal de Dependabot; la aceptación se basa en la prueba de contrato, la derivación local y las ejecuciones de GitHub descritas arriba.
