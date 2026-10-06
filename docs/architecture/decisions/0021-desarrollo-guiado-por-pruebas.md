# ADR-0021 — Desarrollo guiado por pruebas (TDD) como práctica de la baseline

**Estado documental:** APPROVED

**Versión:** 1.0.0

**Fecha:** 2026-10-06

**Aprobado por:** Tomás, usuario solicitante

**Fecha de aprobación:** 2026-10-06

**Evidencia de aprobación:** Aprobación expresa «Aprueba el ADR-0021; A, B y C» registrada en la conversación de trabajo; los puntos abiertos se resolvieron en respuesta a una pregunta explícita: A = No, B = Opcional documentado, C = Sí.

**Relación:** Precisa la estrategia de pruebas de ADR-0001, ADR-0013 y ADR-0016; aplica los principios 1, 4 y 7 de la constitución SDD y modifica el orden de trabajo descrito en `docs/sdd/change-policy.md` (QUICK, paso 5) y en la skill `react-ts-feature-pattern` (modo `strict`). Su aplicación requerirá un cambio `QUICK` o `FULL` independiente.

## Contexto

Hechos verificados en el repositorio el 2026-10-06:

- `AGENTS.md` exige pruebas con Vitest y Testing Library, `expectNoAccessibilityViolations` en interfaces y `npm run check` con cobertura de `src/`, pero **no menciona TDD ni un orden test-first**.
- `docs/sdd/change-policy.md` (QUICK, paso 5) dice «Actualizar o añadir las pruebas necesarias e implementar el cambio»: no fija el orden.
- La skill `.claude/skills/react-ts-feature-pattern/SKILL.md` ejecuta la implementación primero y aplica «test assurance» al final (pasos 10 del Creation Workflow y 9 del Refactor Workflow); el modo `strict` exige que el componente quede cubierto, no que las pruebas se escriban antes.
- La skill solo rige componentes React; hooks sueltos, `model/`, `api/` y otro código quedan fuera de su alcance.
- La plantilla tiene hoy cobertura del 100 % de `src/` (ADR-0015, dato del 2026-10-03; no reverificado para este ADR).

La cobertura mide qué líneas ejecutan las pruebas, no si estas pueden detectar un error. Una prueba escrita después de la implementación puede pasar sin haber demostrado que falla cuando el comportamiento es incorrecto. TDD añade esa evidencia: la prueba se observa fallar por la razón esperada antes de que exista el código.

Límite declarado: TDD gobierna el **comportamiento observable**. Jsdom no valida la presentación visual (colores, espaciado, contraste); eso queda fuera de este ADR (ver «Fuera de alcance»).

## Decisión propuesta

1. **Práctica obligatoria.** Todo código ejecutable con comportamiento propio de la baseline y de los proyectos derivados se desarrolla con TDD: componentes, hooks, `model/`, `api/` y mappers, utilidades, configuración i18n con lógica, handlers de `mocks/` y scripts de herramientas que el proyecto conserve.
2. **Ciclo.** Para cada comportamiento: **Red** (escribir una sola prueba, ejecutarla y verificar que falla por la ausencia del comportamiento, no por un error de importación, de tipos o de configuración), **Green** (implementar lo mínimo para que pase) y **Refactor** (mejorar con las pruebas en verde, sin añadir comportamiento).
3. **Aplicación por clasificación** (`docs/sdd/change-policy.md`):
   - `FULL` y `QUICK`: cada escenario o criterio de aceptación aprobado se convierte primero en prueba fallida.
   - Corrección de un defecto: primero una prueba que lo reproduce.
   - `DIRECT`: no exige prueba nueva (no cambia el comportamiento), pero las existentes permanecen en verde y, si el cambio revela comportamiento sin cubrir, se reclasifica.
4. **Evidencia.** El registro de entrega (`quick-change.md` o `validation-report.md`) indica, por comportamiento o criterio, la prueba y el motivo de fallo observado en Red. Sin esa constancia la entrega no puede declararse `IMPLEMENTED`.
5. **Excepciones** (sin TDD, declaradas en el registro de entrega): configuración declarativa sin lógica, estilos (SCSS), assets, código generado y prototipos descartables que no se integran en el repositorio.
6. **Fuente única de la política.** Este ADR define la política; `AGENTS.md` y `change-policy.md` la referencian; la skill `react-ts-feature-pattern` describe el procedimiento y no la redefine. Si la skill contradice este ADR aprobado, prevalece el ADR.
7. **Decisiones sobre los puntos abiertos del borrador:**
   - A. **No** se añaden umbrales de cobertura explícitos a `npm run check`; la cobertura sigue siendo informativa y la evidencia de Red (punto 4) es el mecanismo de control.
   - B. **Stryker** (mutation testing) se documenta como práctica **opcional** por derivado, fuera de `npm run check` y sin dependencia en la baseline.
   - C. La regla **se hereda con hashes**: los archivos modificados para aplicarla (`AGENTS.md`, `change-policy.md`, plantillas y skill) siguen siendo archivos gestionados del manifiesto, con `baselineId` regenerado.

## Aplicación prevista tras la aprobación

1. Actualizar `AGENTS.md` (sección de pruebas y calidad) con la regla y la referencia al ADR.
2. Actualizar `docs/sdd/change-policy.md` (nueva versión) para fijar el orden test-first en `FULL`, `QUICK` y correcciones, y la reclasificación de `DIRECT`.
3. Actualizar `docs/sdd/templates/quick-change.md` y `validation-report.md` con el campo de evidencia de Red.
4. Reescribir el flujo de la skill `react-ts-feature-pattern` en modo `strict` (Red → Green → Refactor), ampliar su alcance a hooks y lógica sin componente, y retirar su dependencia de «test assurance al final».
5. Actualizar `README.md` y el índice de arquitectura, y documentar Stryker como práctica opcional (sin añadirlo a la baseline ni a la puerta).
6. Regenerar los hashes y el `baselineId` del manifiesto si cambian archivos gestionados.

La aprobación del ADR permite utilizar la decisión en planes posteriores; no autoriza automáticamente su aplicación, commit ni publicación.

## Alternativas consideradas

### Solo convención en la skill

Barata y se hereda, pero solo cubre componentes y no es la fuente de las decisiones duraderas. Descartada como única vía; se mantiene como procedimiento.

### Política sin evidencia de Red

Más simple, pero indistinguible de escribir las pruebas después. Descartada: el valor de TDD es el fallo observado.

### Hook de Claude Code que bloquee editar `src/` sin prueba previa

Detecta el orden de edición, no que la prueba falle por el motivo correcto; frágil y con falsos positivos, y cambiar hooks exige su propio flujo SDD (PLAT-027). Descartada por ahora.

### Mutation testing obligatorio (Stryker)

Mide la calidad real de las pruebas, pero añade tiempo, dependencias y mantenimiento a la puerta. Resuelto: se documenta como opcional por derivado (punto 7.B), no como requisito de la baseline.

### Cobertura como único criterio

Ya existe; no demuestra que las pruebas detecten errores. Insuficiente por sí sola.

## Consecuencias

- Las pruebas pasan a ser parte del diseño, y cada comportamiento tiene una prueba observada en fallo.
- Mayor esfuerzo inicial por cambio y por derivación.
- El orden test-first **no es verificable automáticamente**: la evidencia es declarativa. Riesgo aceptado; sin umbrales de cobertura en la puerta (punto 7.A) y con mutación solo opcional, nada automático comprueba la calidad de las pruebas.
- Una prueba verde no demuestra corrección funcional completa ni accesibilidad visual.
- Los derivados ya creados no reciben la regla automáticamente.

## Fuera de alcance

- Regresión visual (Playwright, Chromatic, capturas) y e2e: decisión separada por derivado, coherente con ADR-0016.
- La validación visual manual de contraste, teclado, foco y lector de pantalla sigue siendo manual.

## Migración y reversión

- Migración: cambio `QUICK` o `FULL` descrito arriba; los derivados existentes la adoptan mediante su propio cambio.
- Reversión: sustituir este ADR por otro, retirar las referencias en `AGENTS.md` y `change-policy.md` y restaurar el flujo anterior de la skill; no afecta al código de aplicación.

## Fuentes

- Evidencia interna: `AGENTS.md`, `docs/sdd/change-policy.md` v2.1.0, `docs/sdd/constitution.md` v2.0.0, `.claude/skills/react-ts-feature-pattern/SKILL.md` y ADR-0013, ADR-0015 y ADR-0016 (consultados 2026-10-06).
- Ninguna fuente externa consultada para este borrador. No he verificado la cobertura actual ni los umbrales configurados.
