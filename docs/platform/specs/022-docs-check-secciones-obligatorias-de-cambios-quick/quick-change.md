# PLAT-022 — `docs:check` exige las secciones obligatorias de los cambios QUICK

**Estado documental:** APPROVED

**Versión:** 1.0.0

**Fecha:** 2026-10-04

**Aprobado por:** Tomás, usuario solicitante

**Fecha de aprobación:** 2026-10-04

**Evidencia de aprobación:** Aprobación expresa «Aprueba PLAT-022 e impleméntalo» registrada en la conversación de trabajo, tras proponerse el cambio como `QUICK`.

**Clasificación:** QUICK

## Contrato afectado

- Especificaciones vigentes: PLAT-004, versión `1.0.0`, REQ-04 (contrato estructural SDD en los artefactos sujetos al modelo actual) y PLAT-016, versión `1.0.0` (`docs:check` gobierna los cambios `QUICK` y su registro de entrega embebido). Este cambio añade a esa gobernanza la presencia de las secciones de la plantilla.
- Reglas vigentes: `docs/sdd/templates/quick-change.md` (estructura de un cambio `QUICK`) y `docs/sdd/workflow.md`, flujo `QUICK`, paso 2 («preparar `quick-change.md` con el delta, alcance mínimo y pruebas necesarias»).
- Motivo de clasificación: amplía un comprobador para cumplir un contrato ya aprobado; cambia el resultado de `npm run check` para ciertos documentos, sin decisión arquitectónica nueva.

## Delta funcional

### Comportamiento vigente

El 2026-10-04 una lectura de `docs/` comprobó que el registro de PLAT-016 estaba truncado desde el commit `b12ea89`: conservaba el encabezado y el contrato, pero había perdido el resto del delta, los criterios, el alcance técnico, las pruebas, los riesgos y la puerta documental, y figuraba `APPROVED` y `VALIDATED` con `docs:check: OK`. Ninguna regla comprueba que un `quick-change.md` contenga las secciones de su plantilla; PLAT-016 solo validó los metadatos y el registro de entrega embebido, y este último había desaparecido con el truncamiento.

### Comportamiento aprobado propuesto

- En todo `quick-change.md` gobernado (de plataforma desde `003`, o de producto bajo `specs/`) cuyo `Estado documental` sea `APPROVED`, `docs:check` exige estas siete secciones de nivel 2, con el texto exacto de la plantilla y fuera de bloques de código: `Contrato afectado`, `Delta funcional`, `Criterios afectados`, `Alcance técnico mínimo`, `Pruebas y validación previstas`, `Riesgos y reclasificación` y `Puerta documental`.
- `Registro de entrega opcional` no es obligatoria (por su propio nombre y porque PLAT-006 y PLAT-008 no la tienen).
- Los documentos `DRAFT` quedan exentos mientras se redactan; una vez `APPROVED` deben estar completos.
- Cada sección ausente produce un diagnóstico `DOC_REQUIRED_SECTION` con la ruta del archivo y el nombre de la sección.
- La lista de secciones obligatorias se comprueba en una prueba contra los encabezados de nivel 2 de `docs/sdd/templates/quick-change.md`: si la plantilla gana o pierde una sección sin actualizar la política, la prueba falla.

### Resultado medido (2026-10-04)

Sobre el repositorio actual, un cálculo equivalente da cero secciones ausentes en los 15 registros `QUICK` existentes (PLAT-006, 008 a 021, de los cuales PLAT-020 está en `DRAFT`). Aplicado a la versión de `b12ea89` del registro de PLAT-016, habría señalado cinco secciones ausentes (`Criterios afectados`, `Alcance técnico mínimo`, `Pruebas y validación previstas`, `Riesgos y reclasificación` y `Puerta documental`).

### Fuera de alcance

- Otros tipos de artefacto (`spec.md`, `plan.md`, `validation-report.md`, ADR) y sus plantillas.
- El orden de las secciones, sus subsecciones y su contenido (por ejemplo, que contengan al menos un criterio).
- Detectar que un documento haya perdido texto dentro de una sección que sí existe.
- Cambiar la plantilla, el workflow o los registros existentes.

## Criterios afectados

### QC-AC-01 — Sección obligatoria ausente

- **Dado** un `quick-change.md` `APPROVED` de plataforma (`NNN` ≥ `003`) o de producto al que le falta una de las siete secciones
- **Cuando** se ejecuta `npm run docs:check`
- **Entonces** devuelve `DOC_REQUIRED_SECTION` con la ruta y el nombre de la sección, y finaliza con código distinto de cero

### QC-AC-02 — Casos que no cuentan

- **Dado** un `quick-change.md` con un encabezado dentro de un bloque de código, con otro nivel de encabezado, o en estado `DRAFT`
- **Cuando** se ejecuta `npm run docs:check`
- **Entonces** el encabezado dentro de un bloque de código o de otro nivel no cuenta como sección, y un `DRAFT` incompleto no produce el diagnóstico

### QC-AC-03 — Registro de entrega opcional

- **Dado** un `quick-change.md` `APPROVED` con las siete secciones y sin `Registro de entrega opcional`
- **Cuando** se ejecuta `npm run docs:check`
- **Entonces** no produce diagnóstico

### QC-AC-04 — Coherencia con la plantilla

- **Dado** `docs/sdd/templates/quick-change.md`
- **Cuando** se ejecuta `npm run test:tools`
- **Entonces** la lista obligatoria coincide con sus encabezados de nivel 2, salvo `Registro de entrega opcional`, y la prueba falla si divergen

### QC-AC-05 — Repositorio y derivación intactos

- **Dado** el cambio aplicado
- **Cuando** se ejecutan `npm run check`, `npm run test:tools` y una derivación real en copia temporal
- **Entonces** todo finaliza con código `0` sin modificar ningún registro existente, y `docs:check` del derivado también

## Alcance técnico mínimo

| Archivo o área | Cambio previsto | Criterio |
| --- | --- | --- |
| `tools/quality/docs-policy.ts` | Lista `requiredQuickChangeSections`. | QC-AC-01, QC-AC-04 |
| `tools/quality/docs-check.ts` | Comprobar las secciones en los `quick-change.md` gobernados `APPROVED`, ignorando bloques de código. | QC-AC-01 a QC-AC-03 |
| `tests/tools/quality/docs-check.test.ts` y su fixture | Casos de QC-AC-01 a QC-AC-03; el helper `quickChangeDocument` pasa a incluir las siete secciones. | QC-AC-01 a QC-AC-03 |
| `tests/tools/quality/` (prueba de coherencia con la plantilla) | Comparar la lista con los encabezados de la plantilla. | QC-AC-04 |
| `README.md` | Ajustar la frase sobre lo que valida `docs:check` (archivo gestionado; regenerar hash y `baselineId`). | QC-AC-05 |
| `tools/template/baseline-manifest.json`, `tests/tools/template/baseline.test.ts` | Nuevo hash de `README.md` y `baselineId`. | QC-AC-05 |
| `docs/platform/README.md` | Fila `PLAT-022`. | — |

## Pruebas y validación previstas

- Automatizadas: las pruebas anteriores, que deben fallar antes del cambio y pasar después; `npm run check` y `npm run test:tools`.
- Manual: mutación sobre el repositorio real eliminando una sección de un registro y restaurándolo, y derivación real en copia temporal.
- Comando de regresión: `npm run check && npm run test:tools`.

## Riesgos y reclasificación

- Riesgo: los derivados con `quick-change.md` `APPROVED` que no sigan la plantilla fallarán en su próxima `docs:check`; no se migran automáticamente.
- Riesgo: el texto exacto de los encabezados hace frágil la comprobación ante variantes menores; es deliberado, para que coincida con la plantilla, y la prueba de QC-AC-04 detecta cambios de esta.
- Riesgo: no detecta que se pierda texto dentro de una sección existente; queda declarado fuera de alcance.
- Reclasificar como `ADR` o `FULL` si se pretende exigir secciones en otros artefactos, comprobar su contenido o hacer obligatorio un `validation-report.md` independiente.

## Puerta documental

La aprobación autoriza implementar únicamente este delta cuando exista autorización expresa de implementación. No autoriza commit ni publicación.

## Registro de entrega opcional

- Estado de entrega: `IMPLEMENTED`
- Archivos modificados: `tools/quality/docs-policy.ts` (`requiredQuickChangeSections`), `tools/quality/docs-check.ts` (`checkQuickChangeSections`, código `DOC_REQUIRED_SECTION`, ignora bloques de código), `tests/tools/quality/docs-check.test.ts` (13 casos nuevos, incluida la coherencia con la plantilla), `tests/tools/quality/helpers/quality-fixture.ts` (el helper `quickChangeDocument` incluye las siete secciones y admite omitirlas), `README.md`, `tools/template/baseline-manifest.json` (hash de `README.md` y `baselineId` `react-vite-ts-sdd-template@2026-10-03-plat-022.1`), `tests/tools/template/baseline.test.ts`, `docs/platform/README.md`.
- Pruebas y resultados (2026-10-04): antes del cambio fallaban 11 de los casos nuevos (los de sección ausente, producto, bloques de código y plantilla) y pasaban los de registro opcional y borrador; después pasan los 31 de `docs-check.test.ts`. `npm run check` y `npm run test:tools` finalizan con código `0` (10 pruebas de aplicación, 115 de herramientas); `docs:check` sobre el repositorio da OK (77 archivos) sin modificar ningún registro. Mutación sobre el repositorio real (ya restaurada, sin diferencias): renombrar `## Criterios afectados` en PLAT-013 produjo `DOC_REQUIRED_SECTION`. Derivación real en copia temporal (ya eliminada): `template:init` aplicado, `template:doctor` sin `FAIL`, `docs:check` del derivado OK y `npm run check` del derivado con código `0`.
- Desviaciones: ninguna respecto al delta aprobado. La edición de este registro se verificó comparando la lista de encabezados antes y después.
- Aceptación: Pendiente
