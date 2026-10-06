# ADR-0022 — Cobertura mínima global del 90 %

**Estado documental:** APPROVED

**Versión:** 1.0.0

**Fecha:** 2026-10-06

**Aprobado por:** Tomás, usuario solicitante

**Fecha de aprobación:** 2026-10-06

**Evidencia de aprobación:** Aprobación expresa «Apruebo ADR-0022; A sí, B sí» registrada en la conversación de trabajo, en respuesta a los dos puntos de confirmación del borrador 0.1.0: el 90 % se aplica por igual a las cuatro métricas (A) y `perFile` sigue desactivado (B).

**Relación:** Modifica parcialmente ADR-0011 §4 (umbrales iniciales 70/55/75/75), ADR-0013 §1 (los umbrales «permanecen») y ADR-0015 §6 («mantener los umbrales 70/55/75/75»), y los umbrales de PLAT-004. Corrige la premisa de ADR-0021 §7.A, que describía la cobertura como informativa cuando ya existen umbrales verificados en la puerta; ADR-0021 no se modifica. Su aplicación requerirá un cambio `QUICK` independiente.

## Contexto

Hechos verificados en el repositorio el 2026-10-06:

- `vite.config.ts` aplica umbrales globales de cobertura V8: statements 70 %, branches 55 %, functions 75 % y lines 75 %, con `perFile: false` y `autoUpdate: false`, sobre `src/**/*.{ts,tsx}` (excluidos `*.d.ts`, `src/**/types.ts` y `tests/**`).
- Esos valores proceden de ADR-0011 §4, que los fijó por debajo de la línea base del 2026-08-28 (75,71 %, 59,61 %, 81,75 % y 77,64 %) y previó que «podrán elevarse cuando la línea base lo permita», que reducirlos exigiría un cambio aprobado con causa y evidencia y que no se usaría `autoUpdate`. ADR-0013 y ADR-0015 §6 los conservaron; este último indicaba que cada derivado los ajusta con su propia medición.
- La medición de `npm run check` del 2026-10-06 sobre la baseline es 100 % en las cuatro métricas: 18 de 18 sentencias, 2 de 2 ramas, 5 de 5 funciones y 17 de 17 líneas.
- ADR-0021 (`APPROVED`, 2026-10-06) hace obligatorio TDD y decidió no añadir umbrales; su texto los describe como «informativos», lo que no refleja la configuración existente. Esa premisa se corrige aquí sin editar un ADR aprobado.

Con tan pocas unidades, un umbral del 90 % equivale en la baseline a casi el 100 %: una sola sentencia sin cubrir (17/18, 94,4 %) aún lo cumple, pero una segunda no (16/18, 88,9 %), y ni una rama ni una función pueden quedar sin cubrir (1/2 = 50 %; 4/5 = 80 %). En un derivado con más código el 90 % tiene el significado habitual de proporción.

Límite declarado: un porcentaje de cobertura mide qué líneas ejecutan las pruebas, no si estas detectan errores ni si se escribieron antes que el código; no sustituye la evidencia del Red de ADR-0021.

## Decisión propuesta

1. **Umbrales.** Los umbrales globales de cobertura pasan a **90 %** en las cuatro métricas: statements, branches, functions y lines.
2. **Sin cambios de método.** `perFile` permanece desactivado, `autoUpdate` desactivado y el perímetro de medición (`src/**/*.{ts,tsx}` con las exclusiones actuales) no cambia. Una exclusión nueva debe responder a la naturaleza del archivo y no a la intención de mejorar el porcentaje (ADR-0011 §4).
3. **Herencia.** Los proyectos derivados nuevos reciben el 90 % en su `vite.config.ts` como el resto de la puerta. Reducirlo en un derivado exige un cambio aprobado con causa y evidencia, no un ajuste silencioso.
4. **Relación con TDD.** El umbral comprueba el resultado; el orden test-first y la evidencia del Red siguen siendo declarativos conforme a ADR-0021. Un umbral no se cumple añadiendo pruebas que no verifican comportamiento.
5. **Confirmaciones de la persona responsable (2026-10-06):**
   - A. El 90 % se aplica por igual a las cuatro métricas.
   - B. `perFile` sigue desactivado.

## Aplicación prevista tras la aprobación

1. Cambio `QUICK` (próximo PLAT) que eleve los cuatro umbrales en `vite.config.ts`, con una prueba que falle antes del cambio y compruebe los valores configurados.
2. Actualizar `README.md` y `AGENTS.md` (la regla de ADR-0021 que dice «no se añaden umbrales a los ya vigentes») y registrar la modificación de los umbrales de PLAT-004.
3. Actualizar el índice de arquitectura.
4. Regenerar los hashes de los archivos gestionados modificados (`vite.config.ts`, `AGENTS.md`, `README.md`) y el `baselineId`.

La aprobación del ADR permite utilizar la decisión en planes posteriores; no autoriza automáticamente su aplicación, commit ni publicación.

## Alternativas consideradas

### Mantener 70/55/75/75

Es el contrato vigente y protege poco: con la baseline al 100 % permite perder casi toda la cobertura sin fallar la puerta. Descartada por la decisión de la persona responsable.

### 100 % obligatorio

ADR-0011 lo descartó por empujar a exclusiones o pruebas artificiales; sigue valiendo para derivados con código de borde. Descartada.

### Umbrales por archivo (`perFile`)

Más estricto, pero ADR-0011 lo difirió por producir excepciones artificiales. Queda desactivado por decisión de la persona responsable (punto 5.B).

### Mutation testing (Stryker) obligatorio

Mide mejor la calidad de las pruebas, pero ADR-0021 lo dejó como práctica opcional por su coste en tiempo y dependencias. Sin cambios.

## Consecuencias

- La puerta falla antes cuando baja la cobertura, también en derivados.
- Mayor fricción en el código de borde difícil de probar; el riesgo es que se excluya código para cumplir el porcentaje, que ADR-0011 §4 prohíbe.
- En la baseline el 90 % equivale prácticamente al 100 %; en derivados mayores será proporcional.
- No mejora por sí misma la calidad de las pruebas ni verifica el orden test-first.
- Los derivados ya creados no reciben el cambio automáticamente.

## Migración y reversión

- Migración: cambio `QUICK` descrito arriba; los derivados existentes adoptan el 90 % con su propio cambio y su propia medición.
- Reversión: sustituir este ADR por otro y devolver los umbrales en `vite.config.ts`; no afecta al código de aplicación. Reducirlos exige un cambio aprobado con causa y evidencia (ADR-0011 §4).

## Fuentes

- Evidencia interna: `vite.config.ts` (umbrales y perímetro), ADR-0011 §4, ADR-0013 §1, ADR-0015 §6, ADR-0021, PLAT-004 y la salida de `npm run check` del 2026-10-06 (consultados ese día).
- Ninguna fuente externa consultada para este borrador. No he verificado en la documentación de Vitest el comportamiento exacto de los umbrales globales con `perFile: false`.
