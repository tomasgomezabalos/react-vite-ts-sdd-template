# ADR-0015 — Endurecimiento de lint, formato y tipado de la baseline

**Estado documental:** APPROVED

**Versión:** 1.0.0

**Fecha:** 2026-10-03

**Aprobado por:** Tomás, usuario solicitante

**Fecha de aprobación:** 2026-10-03

**Evidencia de aprobación:** Aprobación expresa «Aprueba el ADR-0015 con tus recomendaciones» registrada en la conversación de trabajo: `format:check` dentro de `check`, Prettier, `recommendedTypeChecked`.

**Relación:** Amplía ADR-0002 (ESLint) y ADR-0001 (TypeScript e i18n). Si se aprueba incluir el formato en la puerta, modifica parcialmente ADR-0011 §2 (secuencia de `npm run check`) y el contrato de PLAT-004.

## Contexto

La baseline usa TypeScript estricto, ESLint con las configuraciones `recommended` (sin información de tipos), i18next sin tipado de claves y no tiene formateador. Medición del 2026-10-03 sobre el repositorio, con configuraciones temporales que no se conservaron:

| Opción | Resultado medido |
| --- | --- |
| `noImplicitOverride`, `noUncheckedSideEffectImports`, `exactOptionalPropertyTypes` | 0 errores en `tsconfig.app.json` y `tsconfig.node.json`. |
| `noUncheckedIndexedAccess` | 0 errores en la aplicación; 3 en `tools/` (`quality/output.ts`, `template/init.ts`, `template/transaction.ts`). |
| ESLint `recommendedTypeChecked` (typescript-eslint, `projectService`) | 4 errores: `tests/main.test.tsx`, `tests/tools/template/cli.test.ts`, `tests/tools/template/doctor.test.ts`, `tools/quality/imports.ts`. |
| ESLint `strictTypeChecked` | 32 errores (p. ej. `no-unnecessary-condition`, `restrict-template-expressions`). |
| `eslint-plugin-jsx-a11y` 6.10.2 | Su `peerDependencies.eslint` declara `^3 … ^9`; el proyecto usa ESLint 10. Última modificación publicada: 2024-10-26. No hay soporte declarado. |
| Prettier 3.9.9 (`semi: false`, `singleQuote: true`) | 31–32 de unos 50 archivos TypeScript/SCSS diferirían, casi todos en `tools/`; en `src/` y `tests/app/` solo 2. El resultado no cambia con `printWidth` 80, 100 o 120. |
| Cobertura | 100 % medido sobre 18 sentencias; los umbrales aprobados son 70/55/75/75 (PLAT-004). |

La guía de i18next para claves tipadas (<https://www.i18next.com/overview/typescript>) declara `CustomTypeOptions` con `defaultNS` y `resources`, requiere recursos `as const`, `strict` y `resolveJsonModule`, y es aplicable a i18next v26 y react-i18next v17.

## Decisión propuesta

1. **TypeScript:** activar `noUncheckedIndexedAccess`, `noImplicitOverride` y `noUncheckedSideEffectImports` en `tsconfig.app.json` y `tsconfig.node.json`, y corregir los 3 errores de `tools/`. No activar `exactOptionalPropertyTypes`: no produce errores hoy, pero cambia la semántica de las propiedades opcionales y puede chocar con tipos de terceros en los derivados.
2. **ESLint con tipos:** adoptar `tseslint.configs.recommendedTypeChecked` con `projectService`, para `src/`, `tests/`, `mocks/` y `tools/`, y corregir los 4 errores. No adoptar `strictTypeChecked`; cada derivado puede endurecerlo.
3. **Accesibilidad estática:** no adoptar `eslint-plugin-jsx-a11y` mientras no declare soporte para ESLint 10 ni se decida usar `overrides` de npm (soporte no oficial). La cobertura de accesibilidad pasa a pruebas en ejecución (Fase 4 del plan de mejora).
4. **Formato:** adoptar Prettier con `.prettierrc.json` (`semi: false`, `singleQuote: true`; el resto, valores por defecto), `.prettierignore` (`dist`, `coverage`, `mocks/public`, `package-lock.json`, `docs/`, `*.md`) y scripts `format` y `format:check`. Aplicarlo a `ts`, `tsx`, `js`, `scss` y `json`. Añadir `format:check` a `npm run check` justo después de `lint`.
5. **i18n:** declarar `CustomTypeOptions` en `src/i18n/i18next.d.ts` a partir de `resources` y `defaultNamespace`, para que una clave inexistente falle en compilación.
6. **Cobertura:** mantener los umbrales 70/55/75/75. Una medición sobre 18 sentencias no es base para fijar umbrales de proyectos reales; cada derivado los ajusta con su propia medición.
7. **Hooks de pre-commit:** no adoptarlos; la puerta oficial sigue siendo `npm run check` (AGENTS.md).

## Aplicación prevista tras la aprobación

1. Un cambio `QUICK` (próximo PLAT) con criterios por punto 1–5, que actualice `tsconfig.*`, `eslint.config.js`, `package.json` (scripts y `prettier`), `.prettierrc.json`, `.prettierignore`, `src/i18n/i18next.d.ts` y el código afectado.
2. Reformateo con Prettier en un commit propio, sin cambios de comportamiento, separado del resto.
3. `README.md`, `AGENTS.md` (puerta y formato), la secuencia de `check` en las pruebas de `tests/tools/quality/` y el manifiesto: regenerar hashes y `baselineId` (archivos gestionados).
4. Actualizar el índice de arquitectura y las relaciones de ADR-0011 y PLAT-004.

La aprobación del ADR permite utilizar la decisión en planes posteriores; no autoriza automáticamente su aplicación, commit ni publicación.

## Alternativas consideradas

### Biome en lugar de ESLint más Prettier

Unifica lint y formato en una herramienta. Se descarta porque sustituye ADR-0002, obliga a reescribir reglas de React Hooks y React Refresh y supera el alcance de un endurecimiento.

### `strictTypeChecked` como base

Más reglas y más protección, pero 32 errores hoy y mayor fricción para derivados pequeños. Se deja como opción de cada proyecto.

### `format:check` fuera de `check`

Evita tocar la puerta de PLAT-004, pero un formato no verificado en CI se degrada. Se propone incluirlo; si no se aprueba, el resto de la decisión no cambia.

### `jsx-a11y` con `overrides` de npm

Permite instalarlo con ESLint 10, pero sin soporte declarado puede dar falsos negativos o fallar con futuras versiones; se rechaza hasta que haya soporte oficial.

## Consecuencias

- El código nuevo hereda comprobaciones de tipos más estrictas y claves i18n verificadas en compilación.
- El lint con tipos es más lento que el actual; el coste no se ha medido.
- El reformateo con Prettier toca casi todos los archivos de `tools/`; su historial `git blame` queda afectado salvo que se use `.git-blame-ignore-revs` (no incluido en esta decisión).
- La puerta `check` se alarga con una etapa más.
- La accesibilidad estática en JSX queda sin cubrir hasta que haya soporte de `jsx-a11y` para ESLint 10 o se añadan pruebas en ejecución.

## Migración y reversión

- Migración: cambio `QUICK` descrito arriba; los derivados ya creados no reciben el cambio automáticamente y lo adoptan con su propio flujo.
- Reversión: sustituir este ADR; retirar `format:check` de `check` y las opciones de `tsconfig` es un cambio localizado.

## Fuentes

- i18next, «TypeScript»: <https://www.i18next.com/overview/typescript> (consultado 2026-10-03).
- Metadatos de npm de `eslint-plugin-jsx-a11y` (`npm view`, 2026-10-03).
- Mediciones locales descritas en el contexto, no conservadas como archivos.
- No he consultado la documentación de typescript-eslint ni de Prettier en esta sesión; las opciones se probaron localmente y deben contrastarse con ella al redactar el cambio.
