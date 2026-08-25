# Plan técnico — FEAT-002 Carga diferida de páginas enrutadas

**Estado:** VALIDATED

**Fecha:** 2026-08-25

**Aprobación:** 2026-08-25

**Implementación:** 2026-08-25

**Validación:** 2026-08-25

**Modificado por:** `amendment-001-plan.md` implementa la obligatoriedad aprobada para todas las páginas y sustituye la excepción técnica de `Home`. El resto de este plan histórico permanece vigente.

## Especificación y alcance autorizado

- Especificación: `specs/002-carga-diferida-rutas/spec.md` (`VALIDATED`).
- Criterios cubiertos: AC-01 a AC-08.
- Fuera de alcance: modificar `Home`, `App`, rutas, componentes, pruebas, traducciones, configuración i18n, dependencias, Data Mode o Framework Mode; crear helpers sin consumidores; incorporar una página de demostración; aplicar el cambio a repositorios ya derivados.

## Decisiones y diseño

- ADR aplicables: ADR-0001 y ADR-0004 continúan vigentes; ADR-0006 (`APPROVED`) modifica únicamente la exclusión general de carga diferida de ADR-0004.
- Baseline: `Home` conservará su importación estática como excepción aprobada porque es mínima y se necesita inmediatamente. No se añadirá `Suspense` ni un fallback sin una página realmente diferida.
- Regla para agentes: `AGENTS.md` indicará que las nuevas páginas reales de ruta usan `React.lazy` e importación dinámica por defecto, que el contenido pendiente queda dentro de una frontera `Suspense` proporcionada y que cualquier excepción se documenta en el plan técnico.
- Documentación para proyectos derivados: `README.md` explicará el patrón, la ubicación de la frontera, el fallback visible, accesible y traducido, la adaptación de exports nombrados y la evidencia necesaria.
- Trazabilidad: ADR-0004 registrará que ADR-0006 modifica su exclusión histórica de carga diferida, sin reescribir el resto de la decisión aprobada.
- Componentes propios: no se crearán ni modificarán componentes React; `react-ts-feature-pattern` no aplica a la implementación documental.
- Verificación futura: la salida del build y la red del navegador demostrarán separación y carga bajo demanda. Solo se afirmará una mejora cuando exista comparación de tamaño transferido o tiempo de carga.
- Alternativas descartadas: diferir `Home`, añadir una ruta ficticia, crear un helper `lazy` sin consumidor, modificar la skill global, introducir un fallback genérico en la baseline y duplicar el contenido completo de ADR-0006 en varios documentos.

## Cambios previstos

| Archivo o área | Cambio | Requisito relacionado |
| --- | --- | --- |
| `AGENTS.md` | Incorporar la regla operativa para páginas de ruta diferidas, fronteras, fallback y excepciones. | AC-01, AC-03, AC-04, AC-05, AC-06 |
| `README.md` | Documentar el patrón para proyectos derivados, la adaptación de exports nombrados y las evidencias de verificación. | AC-01 a AC-06, AC-08 |
| `docs/architecture/decisions/0004-react-router-base-spa.md` | Añadir la relación de modificación por ADR-0006 sin reescribir la decisión histórica. | AC-06, AC-07 |
| `specs/002-carga-diferida-rutas/spec.md` | Registrar el estado de implementación cuando se completen las comprobaciones. | AC-01 a AC-08 |
| `specs/002-carga-diferida-rutas/plan.md` | Registrar tareas, evidencias y estado de implementación. | AC-01 a AC-08 |

## Dependencias e instalaciones

- Ninguna.
- No se modificarán `package.json`, `package-lock.json` ni `.nvmrc`.

## Estrategia de pruebas

- Unitarias: no aplica; no se introduce lógica ejecutable.
- Componentes/hooks: no aplica; no se modifican componentes ni hooks.
- HTTP/MSW: no aplica; no se añaden contratos ni peticiones.
- Integración: ejecutar `npm run check` para confirmar que el repositorio conserva su baseline válida, aunque esa puerta no valida el contenido Markdown.
- Documentación: revisar enlaces y referencias entre FEAT-002, ADR-0004 y ADR-0006; comprobar que `AGENTS.md` y `README.md` expresan la misma regla sin contradecir la excepción de `Home`.
- Manuales: no se requiere navegador porque no cambia el comportamiento ejecutable. La comprobación de red se aplicará en futuras features que incorporen una página realmente diferida.

## Tareas

1. Añadir a ADR-0004 una referencia explícita a la modificación aprobada en ADR-0006.
2. Incorporar en `AGENTS.md` la regla operativa de carga diferida de páginas y sus excepciones.
3. Documentar en `README.md` el patrón compatible con exports nombrados, el fallback y las evidencias requeridas.
4. Auditar las referencias y confirmar que no se han modificado `src/`, `tests/`, traducciones ni dependencias.
5. Ejecutar `npm run check` y registrar el resultado como comprobación de no regresión.
6. Registrar las evidencias y pasar especificación y plan a `IMPLEMENTED` sin declararlos `VALIDATED`.

## Evidencias de implementación

- ADR-0004 registra que ADR-0006 modifica únicamente su exclusión histórica de carga diferida.
- `AGENTS.md` exige carga diferida por defecto para nuevas páginas reales, fallback visible, accesible y traducido, conservación de la interfaz persistente y justificación de excepciones.
- `README.md` documenta el patrón compatible con exports nombrados, la excepción estática de `Home` y las evidencias necesarias antes de afirmar una mejora.
- Auditoría de alcance: `src/`, `tests/`, traducciones, `.nvmrc`, `package.json` y `package-lock.json` permanecen sin cambios.
- `git diff --check` correcto y búsquedas focalizadas coherentes entre FEAT-002, ADR-0004, ADR-0006, `AGENTS.md` y `README.md`.
- Puerta completa correcta con Node `v22.23.2` y npm `10.9.8`: ESLint sin incidencias, 2 archivos y 3 pruebas Vitest correctas, TypeScript correcto y build Vite 8.2.2 completado.
- No se realizó validación en navegador porque el alcance no modifica comportamiento ejecutable; la evidencia de red se exigirá a futuras features con páginas realmente diferidas.
- Estado SDD: especificación y plan en `VALIDATED` tras la aceptación expresa del resultado documental.

## Riesgos, reversión y validación

- Riesgos: duplicación o divergencia entre `AGENTS.md`, `README.md` y los ADR; interpretar la convención como obligación indiscriminada; afirmar mejoras sin medición; confundir `Suspense` de carga de código con obtención de datos o con `useSuspense` de react-i18next.
- Reversión: retirar únicamente las reglas añadidas a `AGENTS.md` y `README.md`, eliminar la referencia incorporada en ADR-0004 y devolver especificación y plan al estado documental anterior, conservando cualquier cambio ajeno presente entonces.
- Comandos de validación: `git diff --check`, búsquedas focalizadas con `rg` sobre `lazy`, `Suspense`, ADR-0006 y FEAT-002, y `npm run check` con la versión Node fijada en `.nvmrc`.
- Evidencias necesarias para pasar a `VALIDATED`: trazabilidad coherente entre FEAT-002, ADR-0004, ADR-0006, `AGENTS.md` y `README.md`; `Home`, `src/`, `tests/`, traducciones y dependencias sin cambios; `npm run check` correcto; confirmación expresa del resultado documental.
