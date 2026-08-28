# Enmienda 001 de FEAT-002 — Carga diferida obligatoria para páginas

**Estado:** VALIDATED

**Fecha:** 2026-08-25

**Aprobación:** 2026-08-25

**Implementación:** 2026-08-25

**Validación:** 2026-08-25

**Especificación afectada:** `docs/platform/specs/002-carga-diferida-rutas/spec.md` (`VALIDATED`, alias `PLAT-002`)

**ADR afectado:** ADR-0006 (`APPROVED`)

## Motivo del cambio

FEAT-002 y ADR-0006 establecen actualmente la carga diferida de páginas como una convención predeterminada que admite excepciones justificadas. Esa formulación permite que una página, incluida la página inicial, conserve una importación estática cuando se considere mínima o necesaria inmediatamente.

La convención se debe reforzar para que todas las aplicaciones creadas desde la plantilla sigan un criterio uniforme: toda página real asociada a una ruta utilizará carga diferida, con independencia de que sea inicial, mínima o inmediatamente visible. La evaluación de coste y beneficio seguirá siendo necesaria para componentes que no sean páginas.

## Cambio funcional propuesto

- Toda página real asociada a una ruta se declarará mediante `React.lazy` y una importación dinámica.
- La obligatoriedad se aplicará también a la ruta inicial y a la página `Home` de la baseline; no existirán excepciones de importación estática para páginas.
- Cada página diferida quedará dentro de una frontera `Suspense` con un `fallback` visible, ligero, accesible y traducido mediante la infraestructura i18n.
- El layout, la navegación y otros elementos persistentes permanecerán fuera de la frontera de la página cuando puedan seguir utilizándose durante la espera.
- Los componentes que no sean páginas no se dividirán de forma automática. Cada feature evaluará si su peso, sus dependencias, su momento de aparición y la secuencia de revelado justifican la carga diferida.
- Las decisiones sobre componentes deberán evitar fragmentación, solicitudes y estados de espera que no produzcan una reducción razonable de la carga inicial.
- La división generada se comprobará mediante el build y la red del navegador. Solo se afirmará una mejora de rendimiento cuando exista evidencia comparativa antes/después.

## Criterios de aceptación modificados

### AC-A01 — Obligatoriedad para todas las páginas

- **Dado** un proyecto creado desde la plantilla
- **Cuando** se incorpora o mantiene una página real asociada a una ruta, incluida la ruta inicial
- **Entonces** la página se declara mediante `React.lazy`, se obtiene mediante importación dinámica y se renderiza dentro de una frontera `Suspense`
- **Y** no se admite una importación estática de la página como excepción

### AC-A02 — Baseline coherente con la convención

- **Dado** que `Home` es la página de la ruta raíz de la plantilla
- **Cuando** se aplique la enmienda
- **Entonces** `Home` dejará de ser una excepción estática y la baseline mostrará directamente el patrón obligatorio que heredarán los proyectos derivados

### AC-A03 — Evaluación selectiva de componentes

- **Dado** un componente que no representa una página de ruta
- **Cuando** una feature evalúa su impacto sobre la carga inicial
- **Entonces** el plan técnico documenta si su peso, sus dependencias y su aparición diferida justifican o no utilizar carga perezosa
- **Y** solo se divide cuando el beneficio esperado compensa las solicitudes, los estados de espera y la complejidad añadidos

### AC-A04 — Regla visible y coherente

- **Dado** que agentes y desarrolladores consultan la plantilla
- **Cuando** revisan `AGENTS.md`, `README.md`, FEAT-002 y ADR-0006
- **Entonces** todos los documentos expresan sin contradicciones que las páginas usan carga diferida obligatoria y que los componentes se evalúan de forma selectiva

## Impacto documental y técnico previsto

- Actualizar FEAT-002 mediante esta enmienda sin reescribir su estado histórico `VALIDATED`.
- Enmendar ADR-0006 para eliminar las excepciones de páginas y la excepción explícita de `Home`.
- Alinear ADR-0004, `AGENTS.md` y `README.md` con la nueva obligatoriedad.
- Preparar un plan técnico independiente para adaptar la página `Home`, sus pruebas y el estado de espera de la baseline.
- Ejecutar `npm run check`, revisar el build y validar el comportamiento en navegador antes de marcar la enmienda como implementada o validada.

## Fuera de alcance

- Añadir nuevas rutas, navegación, layouts o comportamiento de producto.
- Aplicar `lazy` indiscriminadamente a todos los componentes.
- Modificar la estrategia de obtención de datos o `useSuspense` de react-i18next.
- Propagar automáticamente el cambio a repositorios ya derivados; cada repositorio lo adoptará mediante sus propias puertas SDD.
- Afirmar una reducción de peso o tiempo de carga sin medición comparativa.

## Decisiones confirmadas

- La carga diferida será obligatoria para todas las páginas, incluida la página inicial.
- La existencia de una página mínima o inmediatamente visible no permitirá una excepción estática.
- Los componentes que no sean páginas se evaluarán individualmente y solo se diferirán cuando resulte razonable para reducir la carga inicial.
- La propia baseline deberá ejemplificar la convención que impone a los proyectos derivados.

## Cuestiones abiertas

- Ninguna cuestión funcional pendiente.
- El plan técnico decidirá la posición exacta de la frontera `Suspense`, el componente de espera reutilizable y las pruebas necesarias, sin alterar el contrato visual vacío de la baseline.

## Evidencias de implementación

- `Home` se declara mediante `lazy` e importación dinámica en ámbito de módulo y la ruta `/` la renderiza dentro de `Suspense`.
- `RouteLoading` es un fallback estático pequeño, accesible y traducido; se mantiene en la entrada porque debe estar disponible antes que la página pendiente.
- `AGENTS.md`, `README.md`, ADR-0004 y ADR-0006 enlazan la obligatoriedad aprobada en ADR-0007 y reservan la evaluación coste/beneficio para componentes que no sean páginas.
- Modo `strict`: 3 archivos y 4 pruebas Vitest correctas, incluidas la espera controlada, la resolución de `Home`, el fallback y la URL sin coincidencia.
- `npm run check` correcto con Node `v22.23.2` y npm `10.9.8`: ESLint sin incidencias, pruebas correctas, TypeScript correcto y build Vite `8.2.2` completado.
- Build: `Home-wncrxAzV.js` queda separado con `0.10 kB` (`0.11 kB` gzip); la entrada `index-BtmvuxHY.js` mide `275.48 kB` (`88.15 kB` gzip).
- Navegador interno: `/` carga el chunk de `Home` y termina con un `<main>` vacío; `/unknown` no renderiza `main` ni `status` y no observa el chunk de `Home`; ambas rutas quedan sin errores de consola.
- Validación temporal con el chunk de `Home` retrasado `1.2 s`: el navegador muestra `Loading page...` con rol `status` y después lo sustituye por el `<main>` vacío, sin errores.
- Los tamaños anteriores demuestran separación técnica. No se afirma una mejora de rendimiento porque no se realizó una comparación válida antes/después de tiempo o transferencia.

## Puerta SDD

La enmienda está validada mediante las evidencias registradas y la aceptación expresa del resultado. La validación no autoriza por sí sola commits ni publicación.
