# ADR-0017 — Runtime Node LTS vigente para la baseline

**Estado documental:** APPROVED

**Versión:** 1.0.0

**Fecha:** 2026-10-03

**Aprobado por:** Tomás, usuario solicitante

**Fecha de aprobación:** 2026-10-03

**Evidencia de aprobación:** Aprobación expresa «Sí, haz los tres commits y aprueba ADR-0017» registrada en la conversación de trabajo, tras proponerse migrar a Node 26 al entrar en LTS (2026-10-28) y permanecer en Node 22.23.2 hasta entonces.

**Relación:** Modifica parcialmente ADR-0011 §1 (runtime fijado en Node `22.23.2` y npm `10.9.8`) y el contrato de PLAT-004 REQ-01 y AC-01 cuando se aplique.

## Contexto

ADR-0011 fija Node `22.23.2` y npm `10.9.8` de forma coordinada en `.nvmrc`, `engines`, `devEngines`, `packageManager`, el lockfile y CI. Según el calendario oficial de versiones (`nodejs/Release`, `schedule.json`, consultado el 2026-10-03):

| Línea | Inicio | LTS activo | Mantenimiento | Fin de vida |
| --- | --- | --- | --- | --- |
| 22 (Jod) | 2024-04-24 | 2024-10-29 | 2025-10-21 | 2027-04-30 |
| 24 (Krypton) | 2025-05-06 | 2025-10-28 | 2026-10-20 | 2028-04-30 |
| 26 | 2026-05-05 | 2026-10-28 | 2027-10-20 | 2029-04-30 |

Es decir: la baseline usa una línea en mantenimiento desde hace once meses y con fin de vida en siete; Node 24 pasará a mantenimiento el 2026-10-20 y Node 26 será LTS el 2026-10-28.

Del índice de distribuciones de Node (`nodejs.org/dist/index.json`): `v22.23.3` (2026-09-23) incluye npm `10.9.9`, es decir, la baseline ya está un parche por detrás; `v24.21.0` incluye npm `11.19.0` y `v26.10.0` (2026-09-21, aún no LTS) incluye npm `11.19.1`. Cualquier línea 24 o 26 implica cambiar el rango de npm de `>=10.9.8 <11` de ADR-0011.

Compatibilidad medida el 2026-10-03 con los binarios `node@24.21.0` y `node@26.10.0` del paquete npm `node`, ejecutando directamente las etapas (no `npm run`, porque `devEngines` rechaza otros runtimes): lint, formato, `docs:check`, `architecture:check`, pruebas de aplicación con cobertura, `tsc -b` y `vite build` pasan en ambos. De las 58 pruebas de `tools/`, 56 pasan; fallan 2 (`cli.test.ts` y `doctor.test.ts`) porque el diagnóstico `NODE_VERSION` de `template:doctor` exige que el Node efectivo cumpla el rango declarado (`>=22.23.2 <23`), lo que es el comportamiento diseñado, no una incompatibilidad. No se probó `npm ci` ni `devEngines` con npm 11.

Los `engines` publicados de las dependencias mayores evaluadas aceptan Node 22, 24 y 26 (`vitest@5`: `^22.12.0 || ^24.0.0 || >=26.0.0`; `jsdom@30`: `^22.22.2 || ^24.15.0 || >=26.0.0`; `msw@3`: `>=22.12.0`), por lo que no obligan a cambiar de runtime.

## Decisión propuesta

1. **Línea objetivo:** migrar a Node 26 cuando entre en LTS el 2026-10-28 (fecha del calendario oficial); no hacerlo antes. Hasta entonces la baseline permanece en Node `22.23.2`. No se adopta Node 24 como paso intermedio: su fase de mantenimiento empieza el 2026-10-20.
2. **Versión exacta y npm:** al migrar, fijar la última versión de Node 26 disponible y la versión de npm que ese Node incluye, comprobada en `dist/index.json` ese día. Sustituir el rango de npm de `engines` por `>=<versión> <12` (o el equivalente que se verifique) y mantener `devEngines` con `onFail: error`.
3. **Aplicación coordinada:** `.nvmrc`, `package.json` (`engines`, `devEngines`, `packageManager`), `package-lock.json`, `@types/node` (a la misma línea mayor), `README.md`, `AGENTS.md`, las pruebas de `tests/tools/quality/runtime-config.test.ts`, el manifiesto de baseline y CI (que ya lee `.nvmrc`) cambian en un único cambio, tal como exige ADR-0011 §1. El rango del diagnóstico `NODE_VERSION` se actualiza con las declaraciones.
4. **Verificación previa a la aplicación:** `npm ci`, `npm run check`, `npm run test:tools` y una derivación real con el runtime nuevo y su npm; comprobar en la documentación de npm el comportamiento de `devEngines` y del lockfile con npm 11 antes de aprobar el cambio de aplicación.
5. **Parches:** no se automatizan actualizaciones del parche de Node o npm; cada una sigue el mismo cambio coordinado. Se revisa la lista cuando Dependabot proponga mayores o antes de cada derivación importante.

## Aplicación prevista tras la aprobación

1. Esperar a la fecha de LTS de Node 26 y repetir la medición de compatibilidad con la versión LTS publicada.
2. Redactar y aprobar un cambio `QUICK` (próximo PLAT) con los criterios de runtime de PLAT-004 REQ-01/AC-01 actualizados y aplicar el punto 3.
3. Actualizar el índice de arquitectura y las relaciones de ADR-0011.

La aprobación del ADR permite utilizar la decisión en planes posteriores; no autoriza automáticamente su aplicación, commit ni publicación.

## Alternativas consideradas

### Migrar ahora a Node 24

Disponible hoy y con fin de vida en 2028-04-30, pero entra en mantenimiento el 2026-10-20 y obligaría a una segunda migración dentro de pocos meses frente al fin de vida de 2029 de Node 26.

### Permanecer en Node 22

Sin riesgo inmediato, pero cada derivado nuevo nacería con siete meses de vida restantes y tendría que migrar enseguida.

### Migrar ahora a Node 26 (aún no LTS)

Funciona en las pruebas de compatibilidad, pero la política de Node recomienda las líneas LTS para producción; se descarta hasta el 2026-10-28. No he consultado esa recomendación en la documentación de Node en esta sesión.

### Rango de Node en lugar de versión exacta

Reduciría el trabajo de parches, pero ADR-0011 eligió la versión exacta por reproducibilidad; no se revisa aquí.

## Consecuencias

- La baseline y los derivados nuevos heredarían un runtime soportado hasta 2029-04-30.
- npm pasa de la línea 10 a la 11, cambio no verificado con el lockfile ni con `devEngines`; de ahí el punto 4.
- Los derivados ya creados no se migran automáticamente.
- Hasta la migración, la baseline permanece en una línea en mantenimiento.

## Migración y reversión

- Migración: cambio `QUICK` coordinado tras la fecha de LTS.
- Reversión: restaurar las declaraciones previas mediante otro cambio coordinado.

## Fuentes

- Calendario oficial de versiones de Node: <https://raw.githubusercontent.com/nodejs/Release/main/schedule.json> (consultado 2026-10-03).
- Distribuciones de Node: <https://nodejs.org/dist/index.json> y <https://nodejs.org/en/about/previous-releases> (consultados 2026-10-03).
- Metadatos de npm (`engines`) de `vitest@5`, `jsdom@30` y `msw@3` (`npm view`, 2026-10-03).
- Mediciones locales descritas en el contexto, no conservadas.
