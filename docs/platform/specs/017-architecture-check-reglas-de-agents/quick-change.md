# PLAT-017 — `architecture:check` aplica las reglas de carpetas, MSW, mocks y traducciones

**Estado documental:** APPROVED

**Versión:** 1.0.0

**Fecha:** 2026-10-03

**Aprobado por:** Tomás, usuario solicitante

**Fecha de aprobación:** 2026-10-03

**Evidencia de aprobación:** Aprobación expresa «Aprueba PLAT-017 e impleméntalo» registrada en la conversación de trabajo, tras proponerse el cambio como `QUICK`.

**Clasificación:** QUICK

## Contrato afectado

- Especificación vigente: PLAT-004, versión `1.0.0`, REQ-05 (límites arquitectónicos automatizados) y AC-07/AC-08. Este cambio amplía la lista de reglas que `architecture:check` hace cumplir.
- Reglas vigentes que se automatizan: ADR-0008 (no existirán `src/components/`, `src/services/` ni `src/slices/` globales; su alternativa descartada incluye también `hooks`), ADR-0001 («el código bajo `src/` no depende de MSW», mocks bajo `mocks/`) y `AGENTS.md` («los componentes no deben importar JSON de traducciones»).
- Motivo de clasificación: automatiza reglas ya aprobadas y cambia el resultado de `npm run check` para código que las incumpla; sin decisión arquitectónica nueva.

## Delta funcional

### Comportamiento vigente

Una auditoría el 2026-10-03, sobre una copia de trabajo, comprobó que `architecture:check` no detecta nada de lo siguiente: un archivo `src/pages/Home/leak.ts` que importaba `msw`, `msw/browser`, un JSON de `src/locales/` y un módulo de `mocks/` terminó sin diagnósticos; `src/components/Foo/index.tsx` se trató como `shared` y solo falló porque además importaba `app`. ESLint tampoco lo cubre: un prototipo de `no-restricted-imports` detectó los imports estáticos y las reexportaciones, pero no los `import()` con literal.

### Comportamiento aprobado propuesto

`architecture:check` añade, para el código bajo `src/`, estas reglas con diagnósticos deterministas (ruta, línea y columna cuando existan):

- `ARCH_GLOBAL_TECHNICAL_FOLDER`: existe algún archivo bajo `src/components/`, `src/hooks/`, `src/services/` o `src/slices/`. Se informa una vez por carpeta, con el primer archivo en orden alfabético. No se limita a `.ts`/`.tsx` y no afecta a subcarpetas con esos nombres dentro de un propietario (por ejemplo `src/pages/Home/components/` o `src/shared/hooks/`).
- `ARCH_MSW_IN_SOURCE`: un import, `import type`, reexportación o `import()` con literal cuyo especificador sea `msw` o empiece por `msw/`.
- `ARCH_MOCKS_IN_SOURCE`: un import cuyo destino resuelto esté bajo `mocks/`.
- `ARCH_LOCALES_IMPORT`: un import cuyo destino resuelto esté bajo `src/locales/` y cuyo origen no esté bajo `src/i18n/`.

`src/i18n/` conserva su excepción para importar `src/locales/`. `tests/` y `mocks/` no se analizan, como hasta ahora.

### Resultado medido del prototipo

Sobre el repositorio actual, el prototipo (en copia temporal, ya eliminada) devuelve `architecture:check: OK`; con un archivo de fugas y una carpeta `src/hooks/` detecta las 8 violaciones esperadas: una de carpeta, cuatro de MSW (`msw`, `msw/browser` por import de tipo, `msw/node` por reexportación y `import('msw/browser')`), dos de mocks (estático y dinámico) y una de traducciones, y no marca `src/i18n/`.

### Fuera de alcance

- Reglas de ESLint (`no-restricted-imports`): se descartan por no cubrir `import()`.
- Otras carpetas globales (`utils`, `lib`, `store`, `types`) que ADR-0008 no prohíbe.
- Imports de Sass/CSS, `require` y rutas construidas dinámicamente; los `import()` con destino no literal ya producen `ARCH_DYNAMIC_UNCHECKABLE`.
- Cambiar ADR-0008, ADR-0001, `AGENTS.md` o la estructura de los derivados ya existentes.

## Criterios afectados

### QC-AC-01 — Carpetas técnicas globales

- **Dado** un archivo bajo `src/components/`, `src/hooks/`, `src/services/` o `src/slices/`
- **Cuando** se ejecuta `npm run architecture:check`
- **Entonces** devuelve `ARCH_GLOBAL_TECHNICAL_FOLDER` una vez por carpeta, y no lo devuelve para `src/pages/X/components/` ni `src/shared/hooks/`

### QC-AC-02 — MSW fuera de `src/`

- **Dado** código bajo `src/` con `import 'msw'`, `import type … from 'msw/browser'`, `export … from 'msw/node'` o `import('msw/…')`
- **Cuando** se ejecuta el comprobador
- **Entonces** cada referencia devuelve `ARCH_MSW_IN_SOURCE` con su línea y columna

### QC-AC-03 — `mocks/` fuera de `src/`

- **Dado** un import bajo `src/` que resuelve a `mocks/`
- **Cuando** se ejecuta el comprobador
- **Entonces** devuelve `ARCH_MOCKS_IN_SOURCE`, tanto estático como dinámico

### QC-AC-04 — Traducciones solo desde `src/i18n/`

- **Dado** un import de un JSON de `src/locales/` desde `src/pages/` u otra ruta ajena a `src/i18n/`
- **Cuando** se ejecuta el comprobador
- **Entonces** devuelve `ARCH_LOCALES_IMPORT`, y el mismo import desde `src/i18n/` no produce diagnóstico

### QC-AC-05 — Repositorio y derivación intactos

- **Dado** el cambio aplicado
- **Cuando** se ejecutan `npm run check`, `npm run test:tools` y una derivación real en copia temporal
- **Entonces** todo finaliza con código `0`, sin modificar código de aplicación, y `architecture:check` del derivado también

## Alcance técnico mínimo

| Archivo o área | Cambio previsto | Criterio |
| --- | --- | --- |
| `tools/quality/imports.ts` | `resolveImport` devuelve también la ruta resuelta cuando está fuera de `src/` (necesaria para detectar `mocks/`). | QC-AC-03 |
| `tools/quality/architecture-policy.ts` | Reglas de carpeta y de imports restringidos, con sus códigos. | QC-AC-01 a QC-AC-04 |
| `tools/quality/architecture-check.ts` | Recorrido de carpetas y aplicación de las reglas por referencia. | QC-AC-01 a QC-AC-04 |
| `tests/tools/quality/architecture-check.test.ts` (y fixture si hace falta) | Casos válidos e inválidos de cada criterio. | QC-AC-01 a QC-AC-04 |
| `README.md` | Ajustar la frase sobre lo que valida `architecture:check` (archivo gestionado; regenerar hash y `baselineId`). | QC-AC-05 |
| `tools/template/baseline-manifest.json`, `tests/tools/template/baseline.test.ts` | Nuevo hash de `README.md` y `baselineId`. | QC-AC-05 |
| `docs/platform/README.md` | Fila `PLAT-017`. | — |

## Pruebas y validación previstas

- Automatizadas: las pruebas anteriores, que deben fallar antes del cambio y pasar después; `npm run check` y `npm run test:tools`.
- Manual: derivación real en copia temporal con comprobación de `architecture:check` del derivado, y una mutación controlada con un archivo de fugas sobre el repositorio real, restaurado después.
- Comando de regresión: `npm run check && npm run test:tools`.

## Riesgos y reclasificación

- Riesgo: un derivado que ya tenga `src/components/` (o similares) o importe MSW desde `src/` fallará en su próxima `architecture:check`; es el incumplimiento que se pretende detectar, y no se migra automáticamente.
- Riesgo: `src/hooks/` y la carpeta `hooks` figuran en ADR-0008 solo como ejemplo de carpetas técnicas globales descartadas; si se considerara que no están prohibidas, se retira del delta.
- Reclasificar como `ADR` si se pretende ampliar la lista de carpetas prohibidas o prohibir otras dependencias, o como `FULL` si se exige un mecanismo de excepciones configurable.

## Puerta documental

La aprobación autoriza implementar únicamente este delta cuando exista autorización expresa de implementación. No autoriza commit ni publicación.

## Registro de entrega opcional

- Estado de entrega: `VALIDATED`
- Archivos modificados: `tools/quality/imports.ts` (`resolveImport` devuelve `externalPath` para destinos resueltos fuera de `src/`), `tools/quality/architecture-policy.ts` (`forbiddenFolderViolation`, `restrictedImportViolation`), `tools/quality/architecture-check.ts` (recorrido de carpetas y reglas por referencia), `tests/tools/quality/architecture-check.test.ts` (10 casos nuevos), `README.md`, `tools/template/baseline-manifest.json` (hash de `README.md` y `baselineId` `react-vite-ts-sdd-template@2026-10-03-plat-017.1`), `tests/tools/template/baseline.test.ts`, `docs/platform/README.md`.
- Pruebas y resultados (2026-10-03): antes del cambio fallaban 8 de los 10 casos nuevos y 2 pasaban (los negativos); después pasan los 14 de `architecture-check.test.ts`. `npm run check` y `npm run test:tools` finalizan con código `0` (10 pruebas de aplicación, 87 de herramientas); `architecture:check` sobre el repositorio da OK. Mutación sobre el repositorio real (ya restaurada): un `src/hooks/useX.ts` y un `src/pages/Home/leak.ts` con imports de `msw`, de `src/locales/`, de `mocks/` y `import('msw/browser')` produjeron 5 diagnósticos (1 de carpeta, 2 de MSW, 1 de mocks y 1 de traducciones). Derivación real en copia temporal (ya eliminada): `template:init` aplicado, `template:doctor` sin `FAIL`, `architecture:check` del derivado OK y `npm run check` del derivado con código `0`.
- Desviaciones: el caso de prueba de una carpeta global con solo archivos no fuente necesitó incluir un `.ts` en `src/`, porque `tsconfig` con `include: ['src']` sin ningún archivo TypeScript produce un error interno preexistente de `analyzeImports` (TS18003); ese comportamiento no se modificó. Sin otras desviaciones.
- Aceptación: 2026-10-03, Tomás, usuario solicitante. Aceptación expresa «Acepto PLAT-015, 016 y 017 como VALIDATED» registrada en la conversación de trabajo tras contrastar los criterios con la evidencia de este registro. En GitHub, tras el push de `e31367c`, `Quality` (run `37154518059`) y `Security` (run `37154518072`) estaban `in_progress` en la última consulta; su resultado final no se ha observado, y la aceptación se basa en la evidencia local.
