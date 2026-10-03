# PLAT-010 — Aplicar el endurecimiento de lint, formato y tipado

**Estado documental:** APPROVED

**Versión:** 1.0.0

**Fecha:** 2026-10-03

**Aprobado por:** Tomás, usuario solicitante

**Fecha de aprobación:** 2026-10-03

**Evidencia de aprobación:** Aprobación expresa «Aprueba PLAT-010 e impleméntalo» registrada en la conversación de trabajo, tras proponerse el cambio como `QUICK`.

**Clasificación:** QUICK

## Contrato afectado

- Decisión vigente que se aplica: ADR-0015, versión `1.0.0` (`APPROVED`), puntos 1 a 5.
- Especificación vigente: PLAT-004, REQ-02, AC-03 y AC-04 (secuencia de la puerta `npm run check`). Este cambio añade una etapa a esa secuencia, tal como autoriza ADR-0015 al modificar parcialmente ADR-0011 §2.
- Motivo de clasificación: aplica una decisión ya aprobada; no introduce una decisión arquitectónica nueva ni comportamiento de producto. Altera el contrato de la puerta de calidad, que es lo único observable.

## Delta funcional

### Comportamiento vigente

`npm run check` ejecuta, por este orden, `lint`, `docs:check`, `architecture:check`, `test:coverage` y `build`. ESLint usa las configuraciones sin información de tipos, `tsconfig` no activa `noUncheckedIndexedAccess`, `noImplicitOverride` ni `noUncheckedSideEffectImports`, no hay formateador y las claves de i18next no están tipadas.

### Comportamiento aprobado propuesto

- `tsconfig.app.json` y `tsconfig.node.json` activan `noUncheckedIndexedAccess`, `noImplicitOverride` y `noUncheckedSideEffectImports`. No se activa `exactOptionalPropertyTypes`.
- ESLint añade `tseslint.configs.recommendedTypeChecked` con `projectService` para `**/*.{ts,tsx}`. No se adopta `strictTypeChecked` ni `eslint-plugin-jsx-a11y`.
- Se añade Prettier (`^3.9.9`) con `.prettierrc.json` (`semi: false`, `singleQuote: true`; el resto, valores por defecto) y `.prettierignore` (`dist`, `coverage`, `mocks/public`, `package-lock.json`, `docs/`, `*.md`).
- Se añaden los scripts `format` (`prettier --write .`) y `format:check` (`prettier --check .`), aplicables a `ts`, `tsx`, `js`, `scss` y `json`.
- La secuencia de `check` pasa a `npm run lint && npm run format:check && npm run docs:check && npm run architecture:check && npm run test:coverage && npm run build`.
- `src/i18n/i18next.d.ts` declara `CustomTypeOptions` con `defaultNS` y `resources` derivados de `src/i18n/resources.ts`, de modo que una clave inexistente falla en compilación.
- Los umbrales de cobertura no cambian.

### Fuera de alcance

- `exactOptionalPropertyTypes`, `strictTypeChecked`, `eslint-plugin-jsx-a11y`, Biome, hooks de pre-commit y cambios de umbrales de cobertura (ADR-0015).
- Formatear Markdown o `docs/`.
- `.git-blame-ignore-revs`.
- Cambiar comportamiento de la aplicación, de `tools/` o de los scripts `template:*`.

## Criterios afectados

### QC-AC-01 — Tipado estricto adicional

- **Dado** las tres opciones activadas en ambos `tsconfig`
- **Cuando** se ejecuta `npm run build`
- **Entonces** compila sin errores y `exactOptionalPropertyTypes` no figura en ninguno

### QC-AC-02 — Lint con tipos

- **Dado** la configuración con `recommendedTypeChecked`
- **Cuando** se ejecuta `npm run lint`
- **Entonces** finaliza con código `0` sobre `src/`, `tests/`, `mocks/` y `tools/`, sin desactivar reglas para ocultar los 4 errores medidos en ADR-0015

### QC-AC-03 — Formato verificado

- **Dado** un archivo `ts`, `tsx`, `js`, `scss` o `json` no formateado
- **Cuando** se ejecuta `npm run format:check`
- **Entonces** el comando devuelve error y lista el archivo; con todos formateados finaliza con código `0`

### QC-AC-04 — Secuencia de la puerta

- **Dado** el cambio aplicado
- **Cuando** se lee el script `check`
- **Entonces** es exactamente la secuencia indicada arriba, cada etapa una sola vez, y un fallo de `format:check` detiene la puerta sin presentar las etapas posteriores como superadas (PLAT-004 AC-04)

### QC-AC-05 — Claves i18n tipadas

- **Dado** `src/i18n/i18next.d.ts`
- **Cuando** un componente usa `t('routes.inexistente')`
- **Entonces** `tsc` devuelve error de tipo; con `t('routes.loading')` compila

### QC-AC-06 — Sin cambios de comportamiento

- **Dado** el reformateo y las correcciones de tipos
- **Cuando** se ejecutan `npm run check` y `npm run test:tools`
- **Entonces** ambos finalizan con código `0` con las mismas pruebas que antes, y la cobertura sigue cumpliendo los umbrales

## Alcance técnico mínimo

| Archivo o área | Cambio previsto | Criterio |
| --- | --- | --- |
| `tsconfig.app.json`, `tsconfig.node.json` | Activar las tres opciones. | QC-AC-01 |
| `tools/quality/output.ts`, `tools/template/init.ts`, `tools/template/transaction.ts` | Corregir los 3 errores de `noUncheckedIndexedAccess` sin cambiar comportamiento. | QC-AC-01, QC-AC-06 |
| `eslint.config.js` | Añadir `recommendedTypeChecked` y `projectService`. | QC-AC-02 |
| `tests/main.test.tsx`, `tests/tools/template/cli.test.ts`, `tests/tools/template/doctor.test.ts`, `tools/quality/imports.ts` | Corregir los 4 errores de lint con tipos. | QC-AC-02, QC-AC-06 |
| `package.json`, `package-lock.json` | `prettier`, scripts `format` y `format:check`, nueva secuencia de `check` (archivos gestionados). | QC-AC-03, QC-AC-04 |
| `.prettierrc.json`, `.prettierignore` | Crear. | QC-AC-03 |
| Todos los `ts`, `tsx`, `js`, `scss` y `json` no ignorados | Reformateo, en un commit propio. | QC-AC-03, QC-AC-06 |
| `src/i18n/i18next.d.ts` | Crear; añadir a `managedFiles` si el diagnóstico lo exige (se confirmará en la implementación). | QC-AC-05 |
| `tests/tools/quality/runtime-config.test.ts`, `tests/tools/quality/`, `tests/tools/template/baseline.test.ts` | Actualizar la secuencia esperada de `check`, cubrir `format:check` y el `baselineId`. | QC-AC-04 |
| `README.md`, `AGENTS.md` | Documentar la puerta con formato y los límites de las nuevas comprobaciones (archivos gestionados). | QC-AC-04 |
| `tools/template/baseline-manifest.json` | Regenerar hashes de archivos gestionados modificados o reformateados y nuevo `baselineId`. | QC-AC-06 |
| `docs/platform/README.md`, `docs/architecture/README.md` | Fila `PLAT-010` y relación con ADR-0015. | — |

## Orden de aplicación y commits

1. Prettier (`.prettierrc.json`, `.prettierignore`, scripts `format`/`format:check`, dependencia) y reformateo, **sin** añadir aún `format:check` a `check`.
2. Opciones de `tsconfig`, ESLint con tipos, correcciones y `i18next.d.ts`.
3. `format:check` en `check`, pruebas de la puerta, documentación y manifiesto.

Cada commit debe superar `npm run check` y `npm run test:tools`; el commit 1 no mezcla cambios de comportamiento con el reformateo. Los commits requieren tu autorización.

## Pruebas y validación previstas

- Automatizadas: `npm run check`, `npm run test:tools`, `npm run format:check`; prueba de contrato de `check`; comprobación de error con una clave i18n inexistente en una prueba de tipos o verificación manual con `tsc`.
- Manual: `format:check` con un archivo deliberadamente mal formateado, descartado después.
- Pendiente de contrastar: la documentación de Prettier y de typescript-eslint, no consultada al aprobar ADR-0015.
- Comando de regresión: `npm run check && npm run test:tools`.

## Riesgos y reclasificación

- Riesgo: el lint con tipos aumenta el tiempo de la puerta; se medirá antes y después y se registrará.
- Riesgo: el reformateo altera `git blame`; se mitiga con commit propio.
- Riesgo: los archivos gestionados reformateados cambian de hash y afectan a derivados futuros, no a los ya creados.
- Reclasificar como `FULL` o `ADR` si aparecen errores de lint o tipos cuya corrección cambie comportamiento observable, si la versión de `typescript-eslint` o Prettier exige otra decisión de dependencias, o si se pretende ampliar a `strictTypeChecked`.

## Puerta documental

La aprobación autoriza implementar únicamente este delta cuando exista autorización expresa de implementación. No autoriza commit ni publicación.

## Registro de entrega opcional

- Estado de entrega: `VALIDATED`
- Archivos modificados: `tsconfig.app.json`, `tsconfig.node.json`, `eslint.config.js`, `package.json`, `package-lock.json`, `.prettierrc.json`, `.prettierignore`, `src/i18n/i18next.d.ts`, `tools/quality/output.ts`, `tools/quality/imports.ts`, `tools/template/init.ts`, `tools/template/transaction.ts`, `tests/main.test.tsx`, `tests/tools/template/cli.test.ts`, `tests/tools/template/doctor.test.ts`, `tests/tools/quality/runtime-config.test.ts`, `README.md`, `AGENTS.md`, `tools/template/baseline-manifest.json` (hashes y `baselineId` `react-vite-ts-sdd-template@2026-10-03-plat-010.1`), `tests/tools/template/baseline.test.ts`, `docs/platform/README.md`, más el reformateo de los `ts`, `tsx`, `js`, `scss` y `json` no ignorados.
- Pruebas y resultados (2026-10-03): `npm run check` y `npm run test:tools` finalizan con código `0` (6 pruebas de aplicación, 57 de herramientas; cobertura 100 %). QC-AC-03/04: un `src/bad.ts` sin formatear detuvo `npm run check` en `format:check` sin ejecutar las etapas posteriores; se eliminó. QC-AC-05: `t('routes.inexistente')` produjo error de tipo y `t('routes.loading')` compiló, con un archivo temporal ya eliminado. Tiempo de `eslint .`: ~0,85 s con la configuración anterior y ~2,2 s con tipos (dos mediciones cada una, mismo equipo).
- Desviaciones: los scripts usan el patrón `"**/*.{ts,tsx,js,scss,json}"` en lugar de `.` para respetar el ámbito aprobado sin formatear otros tipos de archivo; `src/i18n/i18next.d.ts` no se añadió a `managedFiles` (no es un archivo que el bootstrap modifique y el diagnóstico no lo exige; se mantiene como archivo de la baseline copiado). Los 3 commits previstos no se han creado todavía.
- Aceptación: 2026-10-03, Tomás, usuario solicitante. Aceptación expresa «Acepto PLAT-009, 010, 011 y 012 como VALIDATED» registrada en la conversación de trabajo tras contrastar los criterios con la evidencia de este registro.
