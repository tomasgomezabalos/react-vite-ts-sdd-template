# PLAT-015 — Título HTML correcto con caracteres especiales de reemplazo

**Estado documental:** APPROVED

**Versión:** 1.0.0

**Fecha:** 2026-10-03

**Aprobado por:** Tomás, usuario solicitante

**Fecha de aprobación:** 2026-10-03

**Evidencia de aprobación:** Aprobación expresa «Aprueba PLAT-015 e impleméntalo» registrada en la conversación de trabajo, tras proponerse el cambio como `QUICK`.

**Clasificación:** QUICK

## Contrato afectado

- Especificación vigente: PLAT-005, versión `1.0.0`, REQ-04 («título HTML igual al nombre visible») y AC-03.
- Motivo de clasificación: corrige un defecto de `template:init` para entradas válidas, restaurando el contrato aprobado. Se clasifica `QUICK` y no `DIRECT` porque cambia la salida observable del bootstrap para esas entradas y la política exige `QUICK` ante la duda.

## Delta funcional

### Comportamiento vigente

`updateIndexHtml` (`tools/template/managed-files.ts`) sustituye el título con `String.prototype.replace` y una cadena de reemplazo construida con el nombre visible, por lo que `$&`, `$$`, `` $` `` y `$'` se interpretan como patrones especiales. Una auditoría el 2026-10-03, ejecutando la función real, obtuvo:

- `Cash $& Co` → `<title>Cash <title>react-vite-ts-sdd-template</title>amp; Co</title>`;
- `Price $$ App` → `<title>Price $ App</title>`;
- `` Tom's $` App `` → título con parte del `index.html` insertada.

El nombre visible es válido para el esquema (cadena no vacía sin espacios en los extremos), de modo que el defecto afecta a entradas permitidas.

### Comportamiento aprobado propuesto

- El título de `index.html` es siempre el nombre visible, con `&`, `<` y `>` escapados como hasta ahora, para cualquier cadena válida, incluidos los patrones `$&`, `$$`, `` $` ``, `$'`, `$1` y `$<nombre>`.
- La sustitución usa una función de reemplazo, de modo que el texto se inserta literalmente.
- El diagnóstico `HTML_IDENTITY` y el digest del preview siguen definiéndose a partir del mismo título.

### Fuera de alcance

- Otras validaciones del nombre visible (saltos de línea u otros caracteres) y del Markdown de `README.md`.
- Cualquier otro uso de `String.replace` (la auditoría no halló otro con reemplazo dinámico).
- Cambios en el esquema de configuración.

## Criterios afectados

### QC-AC-01 — Título literal

- **Dado** un nombre visible con `$&`, `$$`, `` $` `` o `$'`
- **Cuando** se construyen las salidas gestionadas
- **Entonces** `index.html` contiene exactamente `<title>` + nombre visible escapado + `</title>`, sin texto de la plantilla insertado y sin pérdida de `$`

### QC-AC-02 — Nombre ordinario sin cambios

- **Dado** un nombre visible sin caracteres especiales
- **Cuando** se construyen las salidas
- **Entonces** el resultado es idéntico al actual y la derivación existente sigue idempotente

### QC-AC-03 — Diagnóstico coherente

- **Dado** una derivación aplicada con un nombre que contiene `$&`
- **Cuando** se ejecuta `template:doctor`
- **Entonces** `HTML_IDENTITY` es `PASS` y `MANAGED_OUTPUTS` es `PASS`

## Alcance técnico mínimo

| Archivo o área | Cambio previsto | Criterio |
| --- | --- | --- |
| `tools/template/managed-files.ts` | Usar una función de reemplazo en `updateIndexHtml`. | QC-AC-01, QC-AC-02 |
| `tests/tools/template/initialization.test.ts` (o la prueba de salidas gestionadas existente) | Pruebas con `$&`, `$$`, `` $` `` y `$'`, y con un nombre ordinario. | QC-AC-01, QC-AC-02 |
| `tests/tools/template/doctor.test.ts` | Caso de diagnóstico con un nombre con `$&`. | QC-AC-03 |
| `docs/platform/README.md` | Fila `PLAT-015`. | — |

`tools/template/` no contiene archivos gestionados del manifiesto; si la regla de `AGENTS.md` («al modificar `tools/template/`, regenerar los hashes del manifiesto») exige un nuevo `baselineId`, se aplicará como en cambios anteriores.

## Pruebas y validación previstas

- Automatizadas: las pruebas anteriores, que deben fallar antes del cambio y pasar después; `npm run check` y `npm run test:tools`.
- Manual: derivación real en copia temporal con nombre `Cash $& Co`, comprobando `index.html`, `template:doctor` y `npm run check` del derivado.
- Comando de regresión: `npm run check && npm run test:tools`.

## Riesgos y reclasificación

- Riesgo: nulo para nombres sin `$`; el cambio solo afecta a los patrones especiales.
- Reclasificar como `DIRECT` no procede (cambia salida observable); reclasificar como `FULL` o `ADR` si se pretende redefinir qué nombres visibles son válidos.

## Puerta documental

La aprobación autoriza implementar únicamente este delta cuando exista autorización expresa de implementación. No autoriza commit ni publicación.

## Registro de entrega opcional

- Estado de entrega: `VALIDATED`
- Archivos modificados: `tools/template/managed-files.ts` (`updateIndexHtml` usa una función de reemplazo), `tests/tools/template/initialization.test.ts` (seis casos de título: `$&`, `$$`, `` $` ``, `$'`, `$1 $<name>` y un control con `&` y `<>`), `tests/tools/template/doctor.test.ts` (diagnóstico con `Cash $& Co`), `docs/platform/README.md`.
- Pruebas y resultados (2026-10-03): antes del cambio, los cinco casos con patrones especiales y la prueba del doctor fallaban y el control pasaba; después, las 21 pruebas de esos dos archivos pasan. `npm run check` y `npm run test:tools` finalizan con código `0` (10 pruebas de aplicación, 66 de herramientas). Derivación real en copia temporal (ya eliminada) con el nombre `Cash $& Co`: `index.html` contiene `<title>Cash $&amp; Co</title>`, `template:doctor` da `PASS` en `HTML_IDENTITY`, `MANAGED_OUTPUTS` y `TEMPLATE_RESIDUALS` (resumen `PASS=9 FAIL=0 UNKNOWN=1`) y `npm run check` del derivado finaliza con código `0`.
- Desviaciones: no se cambió el manifiesto ni el `baselineId`: `tools/template/` no contiene archivos gestionados del manifiesto y `rehash` no produjo diferencias. Sin otras desviaciones.
- Aceptación: 2026-10-03, Tomás, usuario solicitante. Aceptación expresa «Acepto PLAT-015, 016 y 017 como VALIDATED» registrada en la conversación de trabajo tras contrastar los criterios con la evidencia de este registro. En GitHub, tras el push de `fe53696`, `Quality` (run `37153963551`) y `Security` (run `37153963548`) finalizaron con `success`.
