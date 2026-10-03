# ADR-0016 — Pruebas automáticas de accesibilidad con axe-core

**Estado documental:** APPROVED

**Versión:** 1.0.0

**Fecha:** 2026-10-03

**Aprobado por:** Tomás, usuario solicitante

**Fecha de aprobación:** 2026-10-03

**Evidencia de aprobación:** Aprobación expresa «Aprueba el ADR-0016 y redacta el QUICK» registrada en la conversación de trabajo; las etiquetas WCAG quedan como se proponían (`wcag2a`, `wcag2aa`, `wcag21a`, `wcag21aa`).

**Relación:** Completa ADR-0015 (punto 3, que descartó `eslint-plugin-jsx-a11y` por no declarar soporte para ESLint 10) y precisa la estrategia de pruebas de ADR-0001 y ADR-0013. Aplica el principio 7 de la constitución (accesibilidad verificada donde sea aplicable).

## Contexto

La baseline no tiene comprobación automática de accesibilidad: el análisis estático en JSX quedó descartado en ADR-0015 y la plantilla solo exige pruebas con consultas accesibles de Testing Library. Datos del 2026-10-03:

| Opción | Dato |
| --- | --- |
| `axe-core` | Versión 4.13.0, modificada en npm el 2026-10-02. `axe.run(contexto, opciones)` devuelve `violations` e `incomplete`, y admite `runOnly` por etiquetas (`wcag2a`, `wcag2aa`, `wcag21a`, `wcag21aa`, `wcag22aa`, `best-practice`) según su documentación (`doc/API.md`). |
| Prueba local | Con `axe-core` instalado temporalmente (revertido), `axe.run` sobre `RouteLoading` renderizado en jsdom no devolvió violaciones y sobre `<img src="x.png" />` devolvió al menos una. |
| `vitest-axe` | Versión 0.1.0, modificada por última vez el 2025-01-22, anterior a 1.0. |
| `jest-axe` | Versión 11.0.0, modificada el 2026-07-26; su documentación no trata Vitest. Indica que las comprobaciones de contraste de color no funcionan en JSDOM y las desactiva. |
| `@playwright/test` 1.63.0 y `@axe-core/playwright` 4.13.0 | Existen; no se ha medido el tamaño de la descarga de navegadores ni el tiempo añadido a CI. |
| Bundle actual | Build del 2026-10-03: chunk principal 275,48 kB (88,15 kB gzip), `Home` 0,10 kB. |
| Cobertura | 100 % sobre 18 sentencias (ADR-0015). |

Una aplicación en blanco sin flujos no ofrece nada sustancial que un e2e o un presupuesto de bundle protejan hoy.

## Decisión propuesta

1. **Dependencia:** añadir `axe-core` (`^4.13.0`) como `devDependency`, sin paquete envoltorio.
2. **Helper:** `tests/setup/axe.ts` exportará `expectNoAccessibilityViolations(container: Element): Promise<void>`, que ejecuta `axe.run` con `runOnly` de etiquetas `wcag2a`, `wcag2aa`, `wcag21a` y `wcag21aa`, desactiva explícitamente `color-contrast` (no es fiable en jsdom) y, si hay violaciones, falla con un mensaje que lista `id`, `impact`, `help` y los selectores.
3. **Uso:** cada página y componente con interfaz incluye al menos una aserción con el helper en su prueba, en los estados relevantes (por ejemplo, también el fallback de carga). La baseline lo aplica a `RouteLoading` y `Home`.
4. **Reglas para el equipo:** documentar en `README.md` y `AGENTS.md` que esta comprobación detecta solo un subconjunto de problemas y **no** sustituye la revisión manual de contraste, teclado, foco y lector de pantalla.
5. **Fuera de la baseline:** Playwright/e2e, presupuestos de tamaño de bundle y artefactos de cobertura en CI. Cada derivado los decide cuando tenga flujos reales; el README ya exige una comparación antes/después para cualquier afirmación de rendimiento.

## Aplicación prevista tras la aprobación

1. Cambio `QUICK` (próximo PLAT) que añada la dependencia, el helper, sus pruebas y las aserciones de `RouteLoading` y `Home`.
2. Actualizar `README.md`, `AGENTS.md` (sección de pruebas) y el manifiesto (archivos gestionados: regenerar hashes y `baselineId`).
3. Actualizar el índice de arquitectura.

La aprobación del ADR permite utilizar la decisión en planes posteriores; no autoriza automáticamente su aplicación, commit ni publicación.

## Alternativas consideradas

### `vitest-axe`

Matcher listo para Vitest, pero está en 0.1.0 y sin cambios desde enero de 2025; añade una dependencia que depende de un mantenimiento incierto para ahorrar un helper de pocas líneas.

### `jest-axe`

Mantenido, pero diseñado para Jest y su documentación no cubre Vitest.

### Playwright con `@axe-core/playwright`

Permitiría contraste y navegador real, pero exige descargar navegadores y añadir tiempo a CI para una aplicación sin flujos. Se reevaluará por derivado.

### Solo análisis estático

Descartado en ADR-0015 por falta de soporte de `eslint-plugin-jsx-a11y` para ESLint 10.

## Consecuencias

- Los errores comunes (nombres accesibles ausentes, roles inválidos, `alt` ausente) fallan en la puerta `check` sin infraestructura nueva.
- Sin comprobación de contraste ni de interacción por teclado: riesgo aceptado y declarado.
- Un falso sentido de seguridad si se presenta una prueba axe verde como «accesible»; por eso la regla 4.
- Una dependencia más de desarrollo, mantenida por un solo proveedor (Deque).

## Migración y reversión

- Migración: cambio `QUICK` descrito arriba; los derivados ya creados no la reciben automáticamente.
- Reversión: retirar la dependencia, el helper y las aserciones; no afecta al código de aplicación.

## Fuentes

- axe-core, `doc/API.md`: <https://github.com/dequelabs/axe-core/blob/develop/doc/API.md> (consultado 2026-10-03).
- jest-axe, README: <https://github.com/nickcolley/jest-axe> (consultado 2026-10-03; fuente de la limitación de contraste en JSDOM).
- Metadatos de npm de `axe-core`, `vitest-axe`, `jest-axe`, `@playwright/test` y `@axe-core/playwright` (`npm view`, 2026-10-03).
- Prototipo local descrito en el contexto, no conservado.
- No he contrastado la limitación de contraste en JSDOM con la documentación de axe-core, que no la menciona.
