# PLAT-018 — Observaciones menores de la auditoría de herramientas

**Estado documental:** APPROVED

**Versión:** 1.0.0

**Fecha:** 2026-10-03

**Aprobado por:** Tomás, usuario solicitante

**Fecha de aprobación:** 2026-10-03

**Evidencia de aprobación:** Aprobación expresa «Aprueba PLAT-018 e impleméntalo» registrada en la conversación de trabajo, tras proponerse el cambio como `QUICK`.

**Clasificación:** QUICK

## Contrato afectado

- Especificaciones vigentes: PLAT-003 y PLAT-005 (diagnóstico `template:doctor` y rechazo del remoto canónico: REQ-08 de PLAT-005 y las garantías de PLAT-003), y PLAT-004 REQ-03 (enlaces locales no comprobables producen diagnóstico).
- Motivo de clasificación: tres ajustes pequeños de comportamiento observable de herramientas, sin decisión arquitectónica nueva. Los cambios internos equivalentes de la misma auditoría se aplicaron como `DIRECT` (véase más abajo).

## Delta funcional

### Comportamiento vigente (verificado el 2026-10-03 en copias temporales)

1. `template:doctor` (`PUBLIC_ENVIRONMENT`) interpreta una línea de comentario de `.env.example` como un nombre de variable inválido: `# Variables públicas` produce `FAIL`; un archivo solo con variables válidas pasa.
2. `docs:check` informa de un enlace local absoluto (`/etc/hosts`) con el mensaje «El enlace local escapa de la raíz o tiene una codificación inválida», que no describe su causa.
3. `template:init` y `template:doctor` solo examinan el remoto `origin`: un destino con `origin` distinto y un segundo remoto `upstream` apuntando al repositorio canónico supera `assertProjectContext` y `SOURCE_REMOTE` da `PASS`.

### Comportamiento aprobado propuesto

1. `PUBLIC_ENVIRONMENT` ignora las líneas vacías y las que empiezan por `#` (tras recortar espacios); una variable con nombre inválido o sensible sigue produciendo `FAIL`, y un comentario que mencione `secret` o `token` no lo produce.
2. Los destinos que empiezan por `/` producen `DOC_LINK_UNCHECKABLE` con un mensaje propio («El enlace absoluto no puede comprobarse dentro del repositorio: …»); el resto de casos conserva su mensaje actual.
3. Se examinan todos los remotos configurados (`url` y `pushurl`):
   - `assertProjectContext` rechaza el destino si cualquiera apunta al remoto canónico, indicando el nombre del remoto;
   - `SOURCE_REMOTE` es `FAIL` si cualquiera lo hace, `PASS` si hay remotos y ninguno lo hace, y `UNKNOWN` si no se observa ninguno.

### Cambios `DIRECT` acompañantes, ya aplicados sin alterar comportamiento

- Una sola implementación de `htmlText` (exportada desde `managed-files.ts`) y de la normalización de remotos (`normalizeRemote` de `project.ts`, que sustituye a `canonicalRemote` de `diagnostics.ts`).
- `removeEmptyParents` deja de depender del separador `/` (usa `relative` y `sep`).
- `writeReplacement` aplica el modo al archivo preparado antes de renombrarlo, en lugar de después.

### Fuera de alcance, con motivo

- `isExecutedModule` y la detección del módulo principal: se probó ejecutar `docs:check`, `architecture:check` y `template:doctor` a través de un enlace simbólico del repositorio y funcionan igual que por la ruta directa; la observación de la auditoría no se confirma y no requiere cambio.
- Rama `delete` de `applyPreview` y tipo `FileOperation['kind']`: no se produce hoy, pero está ligada al formato del diario transaccional; eliminarla aportaría poco y arriesga compatibilidad.
- Duplicación del análisis de argumentos de `init.ts` y `doctor.ts`: los dos analizadores aceptan conjuntos de opciones distintos; unificarlos exigiría un analizador genérico, una abstracción que `AGENTS.md` pide no añadir sin necesidad.

## Criterios afectados

### QC-AC-01 — Comentarios en `.env.example`

- **Dado** un `.env.example` con una línea `# …` (incluso con las palabras `secret` o `token`), líneas vacías y variables `VITE_*` válidas
- **Cuando** se ejecuta `template:doctor`
- **Entonces** `PUBLIC_ENVIRONMENT` es `PASS`; con una variable `VITE_API_TOKEN` o `API_URL` sigue siendo `FAIL`

### QC-AC-02 — Enlaces absolutos

- **Dado** un enlace Markdown `[x](/ruta)`
- **Cuando** se ejecuta `docs:check`
- **Entonces** devuelve `DOC_LINK_UNCHECKABLE` con el mensaje de enlace absoluto, y un enlace con codificación inválida conserva el mensaje anterior

### QC-AC-03 — Todos los remotos

- **Dado** un destino con `origin` distinto y otro remoto con la URL canónica (en `url` o `pushurl`)
- **Cuando** se ejecuta `template:init` o `template:doctor`
- **Entonces** `init` falla indicando ese remoto y `SOURCE_REMOTE` es `FAIL`; con remotos ajenos es `PASS`; sin remotos, `UNKNOWN`

### QC-AC-04 — Puerta y derivación intactas

- **Dado** el cambio aplicado
- **Cuando** se ejecutan `npm run check`, `npm run test:tools` y una derivación real en copia temporal
- **Entonces** todo finaliza con código `0` y `template:doctor` sin `FAIL`

## Alcance técnico mínimo

| Archivo o área | Cambio previsto | Criterio |
| --- | --- | --- |
| `tools/template/diagnostics.ts` | Ignorar comentarios en `PUBLIC_ENVIRONMENT`; `SOURCE_REMOTE` con todos los remotos. | QC-AC-01, QC-AC-03 |
| `tools/template/project.ts` | `readRemotes` (todas las URL) y `assertProjectContext` con todos los remotos. | QC-AC-03 |
| `tools/quality/docs-check.ts` | Mensaje propio para enlaces absolutos. | QC-AC-02 |
| `tests/tools/template/doctor.test.ts`, `project.test.ts`, `tests/tools/quality/docs-check.test.ts` | Casos de QC-AC-01 a QC-AC-03. | QC-AC-01 a QC-AC-03 |
| `docs/platform/README.md` | Fila `PLAT-018`. | — |

`tools/` no contiene archivos gestionados del manifiesto ni se describe en el `README.md` derivado a este nivel de detalle; no se prevé cambiar `baselineId` salvo que `rehash` produzca diferencias.

## Pruebas y validación previstas

- Automatizadas: las pruebas anteriores, que deben fallar antes del cambio y pasar después; `npm run check` y `npm run test:tools`.
- Manual: derivación real en copia temporal, y los casos de QC-AC-01 y QC-AC-03 con un destino de prueba.
- Comando de regresión: `npm run check && npm run test:tools`.

## Riesgos y reclasificación

- Riesgo: un destino con un remoto auxiliar apuntando al canónico, antes aceptado, pasará a rechazarse; es el comportamiento buscado por «No aplicar el bootstrap sobre el remoto canónico» en `AGENTS.md`.
- Riesgo: salida de `git config` con formatos poco habituales; si no se puede interpretar, el resultado es `UNKNOWN`, no `PASS`.
- Reclasificar como `FULL` o `ADR` si se pretende alterar el contrato de bootstrap o ampliar las comprobaciones del diagnóstico más allá de estas tres.

## Puerta documental

La aprobación autoriza implementar únicamente este delta cuando exista autorización expresa de implementación. No autoriza commit ni publicación.

## Registro de entrega opcional

- Estado de entrega: `IMPLEMENTED`
- Archivos modificados: `tools/template/project.ts` (`readRemotes`, `canonicalRemoteNames`, `normalizeRemote` exportada; `readOriginRemote` eliminada; `assertProjectContext` con todos los remotos), `tools/template/diagnostics.ts` (`PUBLIC_ENVIRONMENT` ignora comentarios; `SOURCE_REMOTE` con todos los remotos; usa `htmlText` y `normalizeRemote` compartidos), `tools/template/managed-files.ts` (`htmlText` exportada), `tools/template/transaction.ts` (`removeEmptyParents` sin separador fijo; modo aplicado antes del renombrado), `tools/quality/docs-check.ts` (mensaje de enlace absoluto), `tests/tools/template/project.test.ts`, `tests/tools/template/doctor.test.ts`, `tests/tools/quality/docs-check.test.ts`, `docs/platform/README.md`. El manifiesto no cambió.
- Pruebas y resultados (2026-10-03): antes de los cambios observables fallaban 5 de los casos nuevos y 37 pasaban; después pasan los 42 de esos tres archivos. `npm run check` y `npm run test:tools` finalizan con código `0` (10 pruebas de aplicación, 97 de herramientas; los refactors `DIRECT` se aplicaron antes con las 87 pruebas existentes en verde). Derivación real en copia temporal (ya eliminada): con `origin` ajeno y `upstream` canónico, `template:init` falla con «…remoto canónico de la plantilla fuente (remoto upstream)»; con solo remotos ajenos se aplica, `template:doctor` da `PASS=11 FAIL=0 UNKNOWN=0`, incluidos `SOURCE_REMOTE` y `PUBLIC_ENVIRONMENT` con un `.env.example` con comentario, y `npm run check` del derivado finaliza con código `0`.
- Desviaciones: ninguna respecto al delta aprobado. `readRemotes` usa `git config --local --get-regexp` (solo la configuración del repositorio) y trata un estado distinto de 0 o 1 como remotos no observables.
- Aceptación: Pendiente
