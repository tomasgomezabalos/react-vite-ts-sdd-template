# PLAT-023 — Alinear la plantilla de plan técnico y `AGENTS.md` con las reglas vigentes

**Estado documental:** APPROVED

**Versión:** 1.0.0

**Fecha:** 2026-10-04

**Aprobado por:** Tomás, usuario solicitante

**Fecha de aprobación:** 2026-10-04

**Evidencia de aprobación:** Aprobación expresa «Aprueba PLAT-023 e impleméntalo» registrada en la conversación de trabajo, tras proponerse el cambio como `QUICK`.

**Clasificación:** QUICK

## Contrato afectado

- Reglas vigentes que se reflejan: `AGENTS.md` (regla de modo `strict` para componentes nuevos, añadida por PLAT-021; aserción `expectNoAccessibilityViolations`, añadida por PLAT-011; `format:check` en la puerta, añadido por PLAT-010) y la skill `react-ts-feature-pattern` (sección «Project overrides»).
- Archivos afectados: `docs/sdd/templates/technical-plan.md` y `AGENTS.md` (archivo gestionado).
- Motivo de clasificación: la plantilla de plan técnico define qué debe contener cada plan y se copia a los derivados; `AGENTS.md` es contrato de agentes. Los cambios no introducen reglas nuevas, pero alteran lo que esos documentos piden, por lo que se clasifican `QUICK` y no `DIRECT`.

## Delta funcional

### Comportamiento vigente (lectura del 2026-10-04)

1. La plantilla de plan técnico dice en «Componentes propios»: «cargar `@react-ts-feature-pattern` y declarar modo», sin indicar que los componentes nuevos usan `strict`, y su «Estrategia de pruebas» no menciona la aserción de accesibilidad que `AGENTS.md` exige en la prueba de cada página o componente con interfaz.
2. `AGENTS.md` incluye `format:check` en la puerta `npm run check`, pero no dice que existe `npm run format` para aplicar el formato; quien falla esa etapa no encuentra el comando en las instrucciones.

### Comportamiento aprobado propuesto

- `docs/sdd/templates/technical-plan.md`: «Componentes propios» pasa a «cargar `@react-ts-feature-pattern` y declarar modo (`strict` para componentes nuevos o con cambios de comportamiento observable, según `AGENTS.md`)», y «Componentes/hooks» añade «incluida la aserción `expectNoAccessibilityViolations` por página o componente con interfaz».
- `AGENTS.md`, sección «Pruebas y calidad»: una viñeta tras la de `npm run check` que indique aplicar el formato con `npm run format` y que `format:check` solo lo verifica. La viñeta queda fuera de los bloques `template-only`, de modo que los derivados la heredan.

### Fuera de alcance

- El idioma heredado («trabajar en español»): es una decisión sobre la plantilla, no una corrección, y queda como nota.
- Cambiar el criterio de «trivial» del registro de entrega embebido (`AGENTS.md` y `workflow.md`), que se decide aparte.
- Cambios en la skill, en los scripts de `package.json` o en otras plantillas.

## Criterios afectados

### QC-AC-01 — Plantilla de plan técnico

- **Dado** `docs/sdd/templates/technical-plan.md`
- **Cuando** se leen «Componentes propios» y «Componentes/hooks»
- **Entonces** el primero indica `strict` para componentes nuevos o con cambios de comportamiento observable y el segundo cita `expectNoAccessibilityViolations`

### QC-AC-02 — Formato en `AGENTS.md`

- **Dado** `AGENTS.md`
- **Cuando** se lee la sección «Pruebas y calidad»
- **Entonces** menciona `npm run format` y `format:check`, ambos scripts existen en `package.json`, y la viñeta no está dentro de un bloque `template-only`

### QC-AC-03 — Coherencia comprobada

- **Dado** una prueba de contrato sobre estos documentos
- **Cuando** se ejecuta `npm run test:tools`
- **Entonces** falla si falta alguno de los términos anteriores o si un script citado no existe

### QC-AC-04 — Puerta y derivación intactas

- **Dado** el cambio aplicado
- **Cuando** se ejecutan `npm run check`, `npm run test:tools` y una derivación real en copia temporal
- **Entonces** todo finaliza con código `0`, el derivado conserva la viñeta de formato en su `AGENTS.md` y `template:doctor` no tiene `FAIL`

## Alcance técnico mínimo

| Archivo o área | Cambio previsto | Criterio |
| --- | --- | --- |
| `docs/sdd/templates/technical-plan.md` | Dos frases en «Componentes propios» y «Componentes/hooks». | QC-AC-01 |
| `AGENTS.md` | Una viñeta sobre `npm run format` (archivo gestionado). | QC-AC-02 |
| `tests/tools/quality/process-docs.test.ts` | Prueba de contrato de ambos documentos. | QC-AC-01 a QC-AC-03 |
| `tools/template/baseline-manifest.json`, `tests/tools/template/baseline.test.ts` | Hash de `AGENTS.md` y `baselineId`. | QC-AC-04 |
| `docs/platform/README.md` | Fila `PLAT-023`. | — |

## Pruebas y validación previstas

- Automatizadas: la prueba de contrato, que debe fallar antes del cambio y pasar después; `npm run check` y `npm run test:tools`.
- Manual: derivación real en copia temporal comprobando la viñeta en el `AGENTS.md` del derivado.
- Comando de regresión: `npm run check && npm run test:tools`.

## Riesgos y reclasificación

- Riesgo: una prueba sobre texto es frágil ante reescrituras; se limita a pocos términos clave, como en la prueba de la skill.
- Riesgo: los planes técnicos ya aprobados no se actualizan; la plantilla solo afecta a los nuevos.
- Reclasificar como `ADR` si se decide cambiar el flujo SDD o la obligatoriedad de las pruebas de accesibilidad.

## Puerta documental

La aprobación autoriza implementar únicamente este delta cuando exista autorización expresa de implementación. No autoriza commit ni publicación.

## Registro de entrega opcional

- Estado de entrega: `IMPLEMENTED`
- Archivos modificados: `docs/sdd/templates/technical-plan.md` (dos frases), `AGENTS.md` (una viñeta sobre `npm run format`, fuera de los bloques `template-only`), `tests/tools/quality/process-docs.test.ts` (2 casos), `tools/template/baseline-manifest.json` (hash de `AGENTS.md` y `baselineId` `react-vite-ts-sdd-template@2026-10-03-plat-023.1`), `tests/tools/template/baseline.test.ts`, `docs/platform/README.md`.
- Pruebas y resultados (2026-10-04): antes del cambio fallaban los 2 casos de `process-docs.test.ts`; después pasan. `npm run check` y `npm run test:tools` finalizan con código `0` (10 pruebas de aplicación, 117 de herramientas). Derivación real en copia temporal (ya eliminada): `template:init` aplicado, `template:doctor` sin `FAIL`, el `AGENTS.md` del derivado contiene la viñeta de `npm run format`, su plantilla de plan técnico cita `strict` y su `npm run check` finaliza con código `0`.
- Desviaciones: ninguna respecto al delta aprobado. El diff de `AGENTS.md` es una inserción de una línea. El punto 1 de la misma petición (viñetas «Modificada por» en ADR-0010 a 0013) se aplicó como cambio `DIRECT` editorial y no forma parte de este registro.
- Aceptación: Pendiente
