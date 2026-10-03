# PLAT-011 — Pruebas automáticas de accesibilidad con axe-core

**Estado documental:** APPROVED

**Versión:** 1.0.0

**Fecha:** 2026-10-03

**Aprobado por:** Tomás, usuario solicitante

**Fecha de aprobación:** 2026-10-03

**Evidencia de aprobación:** Aprobación expresa «Aprueba PLAT-011 e impleméntalo» registrada en la conversación de trabajo, tras proponerse el cambio como `QUICK`.

**Clasificación:** QUICK

## Contrato afectado

- Decisión vigente que se aplica: ADR-0016, versión `1.0.0` (`APPROVED`), puntos 1 a 4.
- Contrato afectado: sección «Pruebas y calidad» de `AGENTS.md` y las pruebas de aplicación; la secuencia de `npm run check` (PLAT-004 REQ-02) no cambia, porque las pruebas ya forman parte de `test:coverage`.
- Motivo de clasificación: aplica una decisión ya aprobada, añade una dependencia de desarrollo y un helper de pruebas, sin comportamiento de producto ni cambios de arquitectura.

## Delta funcional

### Comportamiento vigente

Las pruebas de aplicación usan Testing Library con consultas accesibles, pero ninguna comprobación automática detecta violaciones de accesibilidad.

### Comportamiento aprobado propuesto

- `axe-core` (`^4.13.0`) se añade como `devDependency`, sin paquete envoltorio.
- `tests/setup/axe.ts` exporta `expectNoAccessibilityViolations(container: Element): Promise<void>`: ejecuta `axe.run` con `runOnly` de las etiquetas `wcag2a`, `wcag2aa`, `wcag21a` y `wcag21aa`, con `color-contrast` desactivada, y falla con un mensaje que lista `id`, `impact`, `help` y los selectores de cada violación.
- Las pruebas de `RouteLoading` y de `Home` incluyen una aserción con el helper.
- `README.md` y `AGENTS.md` establecen que cada página o componente con interfaz incluye una aserción de este tipo y que la comprobación no sustituye la revisión manual de contraste, teclado, foco ni lector de pantalla.

### Fuera de alcance

- Playwright/e2e, presupuestos de bundle, artefactos de cobertura y la etiqueta `wcag22aa` (ADR-0016).
- Comprobación de contraste de color.
- Cambios en el código de aplicación, salvo que una prueba revele una violación real (véase reclasificación).

## Criterios afectados

### QC-AC-01 — El helper detecta violaciones

- **Dado** un contenedor con `<img src="x.png" />`
- **Cuando** se llama a `expectNoAccessibilityViolations`
- **Entonces** la promesa se rechaza con un mensaje que incluye el `id` de la regla, su `impact` y el selector del nodo

### QC-AC-02 — El helper acepta contenido accesible

- **Dado** `RouteLoading` renderizado
- **Cuando** se llama al helper
- **Entonces** la promesa se resuelve sin error

### QC-AC-03 — Cobertura de la baseline

- **Dado** las pruebas de `RouteLoading` y de `Home`
- **Cuando** se ejecuta `npm run test:coverage`
- **Entonces** cada una ejecuta el helper y pasa

### QC-AC-04 — Dependencia mínima

- **Dado** `package.json`
- **Cuando** se inspeccionan las dependencias de desarrollo
- **Entonces** incluye `axe-core` y no incluye `vitest-axe`, `jest-axe` ni Playwright

### QC-AC-05 — Límites comunicados

- **Dado** `README.md` y `AGENTS.md`
- **Cuando** se leen sus secciones de pruebas
- **Entonces** declaran la regla de uso y que la comprobación no sustituye la revisión manual

### QC-AC-06 — Puerta intacta

- **Dado** el cambio aplicado
- **Cuando** se ejecutan `npm run check` y `npm run test:tools`
- **Entonces** ambos finalizan con código `0`, la secuencia de `check` no cambia y los umbrales de cobertura se cumplen

## Alcance técnico mínimo

| Archivo o área | Cambio previsto | Criterio |
| --- | --- | --- |
| `package.json`, `package-lock.json` | Añadir `axe-core` (archivos gestionados). | QC-AC-04 |
| `tests/setup/axe.ts` | Crear el helper. | QC-AC-01, QC-AC-02 |
| `tests/setup/axe.test.tsx` | Probar el helper con contenido válido y con una violación. | QC-AC-01, QC-AC-02 |
| `tests/app/RouteLoading/index.test.tsx` | Añadir la aserción (archivo gestionado). | QC-AC-03 |
| `tests/pages/Home/index.test.tsx` | Añadir la aserción. | QC-AC-03 |
| `README.md`, `AGENTS.md` | Regla de uso y límites (archivos gestionados). | QC-AC-05 |
| `tools/template/baseline-manifest.json`, `tests/tools/template/baseline.test.ts` | Regenerar hashes y nuevo `baselineId`. | QC-AC-06 |
| `docs/platform/README.md`, `docs/architecture/README.md` | Fila `PLAT-011` y relación con ADR-0016. | — |

## Pruebas y validación previstas

- Automatizadas: las del helper y las aserciones anteriores; `npm run check` y `npm run test:tools`.
- Manual: una derivación real en copia temporal con `template:init`, `template:doctor` y `npm run check` en el derivado, como en PLAT-010.
- Comando de regresión: `npm run check && npm run test:tools`.

## Riesgos y reclasificación

- Riesgo: `axe-core` podría marcar la página `Home` vacía (`<main />`) por alguna regla; se comprobará y, si ocurre, se decidirá con el usuario sin desactivar reglas para ocultarlo.
- Riesgo: falsos negativos por jsdom (sin layout ni contraste); declarado en ADR-0016.
- Reclasificar como `FULL` o `ADR` si una violación real exige cambiar el contenido o el comportamiento de `Home` o `RouteLoading`, o si se pretende incluir Playwright o contraste.

## Puerta documental

La aprobación autoriza implementar únicamente este delta cuando exista autorización expresa de implementación. No autoriza commit ni publicación.

## Registro de entrega opcional

- Estado de entrega: `IMPLEMENTED`
- Archivos modificados: `package.json`, `package-lock.json` (`axe-core` ^4.13.0), `tests/setup/axe.ts`, `tests/setup/axe.test.tsx`, `tests/app/RouteLoading/index.test.tsx`, `tests/pages/Home/index.test.tsx`, `README.md`, `AGENTS.md`, `tools/template/baseline-manifest.json` (hashes y `baselineId` `react-vite-ts-sdd-template@2026-10-03-plat-011.1`), `tests/tools/template/baseline.test.ts`, `docs/platform/README.md`.
- Pruebas y resultados (2026-10-03): `npm run check` y `npm run test:tools` finalizan con código `0` (10 pruebas de aplicación, 57 de herramientas; cobertura 100 %). El helper rechaza `<img src="x.png" />` con un mensaje que incluye `image-alt (critical)` y el selector `img`, y acepta `RouteLoading`; `Home` (`<main />`) no produjo violaciones. Derivación real en copia temporal (ya eliminada): `template:init` aplicado, `template:doctor` sin `FAIL` y `npm run check` del derivado con código `0`.
- Desviaciones: ninguna respecto al delta aprobado.
- Aceptación: Pendiente
