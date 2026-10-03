# PLAT-009 — Automatizar actualización de dependencias y comprobación de seguridad en CI

**Estado documental:** APPROVED

**Versión:** 1.0.0

**Fecha:** 2026-10-03

**Aprobado por:** Tomás, usuario solicitante

**Fecha de aprobación:** 2026-10-03

**Evidencia de aprobación:** Aprobación expresa «Apruebo PLAT-009, impleméntalo» registrada en la conversación de trabajo, tras proponerse el cambio como `QUICK`.

**Clasificación:** QUICK

## Contrato afectado

- Especificación vigente: PLAT-004, versión vigente, REQ-09 y AC-10 (workflow de calidad mínimo, sin secretos, sin despliegue ni publicación).
- Decisión vigente: ADR-0011 (puerta única `npm run check`, comprobaciones externas no deterministas fuera de la puerta principal).
- Motivo de clasificación: añade automatización de repositorio pequeña y localizada. No modifica la puerta `check` ni el workflow `Quality`, ni introduce una decisión arquitectónica nueva.

## Delta funcional

### Comportamiento vigente

El repositorio no actualiza dependencias ni acciones de GitHub de forma automática (las acciones están fijadas por SHA y no se renuevan solas) y ningún workflow comprueba vulnerabilidades. `npm audit` se ejecuta solo a mano.

### Comportamiento aprobado propuesto

- `.github/dependabot.yml` programa actualizaciones semanales de `npm` y `github-actions`, agrupando actualizaciones menores y de parche; los cambios de versión mayor llegan en PR separados.
- Las dependencias de Node y npm fijadas en ADR-0011 (`.nvmrc`, `engines`, `devEngines`, `packageManager`) y `@types/node` quedan fuera de las actualizaciones mayores automáticas para respetar la regla de actualización coordinada.
- Un workflow `Security` independiente de `Quality` ejecuta `npm audit --omit=dev --audit-level=high` en pull requests, en pushes a la rama principal y de forma semanal programada, con `permissions: contents: read` y sin secretos.
- Toda acción nueva se fija a un SHA completo verificado en su repositorio oficial, con comentario de versión (PLAT-004 REQ-09).

### Fuera de alcance

- Incluir `npm audit` en `npm run check`.
- CodeQL, `dependency-review-action` (requiere el grafo de dependencias habilitado; no se confirma su disponibilidad en un derivado privado) y Renovate.
- Cambiar el workflow `Quality`.
- Auto-merge de los PR de Dependabot.

## Criterios afectados

### QC-AC-01 — Actualizaciones programadas

- **Dado** `.github/dependabot.yml` versionado
- **Cuando** se inspecciona su contenido
- **Entonces** declara los ecosistemas `npm` y `github-actions` con frecuencia semanal, agrupación de menores/parches y exclusión de mayores de `@types/node`

### QC-AC-02 — Workflow de seguridad conforme

- **Dado** el workflow `Security` versionado
- **Cuando** se inspecciona
- **Entonces** tiene permisos `contents: read`, acciones fijadas a SHA con comentario de versión, Node desde `.nvmrc`, `npm ci` y `npm audit --omit=dev --audit-level=high`, sin secretos, publicación ni despliegue

### QC-AC-03 — Puerta intacta

- **Dado** el cambio aplicado
- **Cuando** se ejecuta `npm run check`
- **Entonces** su secuencia no incluye `npm audit` y el workflow `Quality` conserva el contrato de PLAT-004

## Alcance técnico mínimo

| Archivo o área | Cambio previsto | Criterio |
| --- | --- | --- |
| `.github/dependabot.yml` | Crear. | QC-AC-01 |
| `.github/workflows/security.yml` | Crear. | QC-AC-02 |
| `tests/tools/quality/workflow.test.ts` | Cubrir ambos archivos (contrato y SHA fijados). | QC-AC-01, QC-AC-02, QC-AC-03 |
| `README.md` | Documentar el workflow y qué comprueba y qué no (archivo gestionado; regenerar hashes y `baselineId`). | QC-AC-02 |
| `docs/platform/README.md` | Añadir la fila `PLAT-009`. | — |

## Pruebas y validación previstas

- Automatizadas: pruebas de contrato del YAML en `tests/tools/quality/`; `npm run check` y `npm run test:tools`.
- Manuales: la ejecución real en GitHub y los PR de Dependabot solo cuentan como evidencia tras una publicación autorizada por separado; una inspección local del YAML no es una ejecución real.
- Comando de regresión: `npm run check && npm run test:tools`.

## Riesgos y reclasificación

- Riesgo: `npm audit` depende de la red y de la base de avisos, así que puede fallar sin cambio de código; por eso queda fuera de `check` y no bloquea la puerta principal.
- Riesgo: el volumen de PR semanales; mitigado con agrupación.
- Reclasificar como `ADR` si se decide que la auditoría entre en la puerta obligatoria o se adopte otra herramienta de seguridad.

## Puerta documental

La aprobación autoriza implementar únicamente este delta cuando exista autorización expresa de implementación. No autoriza commit ni publicación.

## Registro de entrega opcional

- Estado de entrega: `VALIDATED`
- Archivos modificados: `.github/dependabot.yml`, `.github/workflows/security.yml`, `tests/tools/quality/workflow.test.ts`, `README.md`, `tools/template/baseline-manifest.json` (hash de `README.md` y `baselineId` `react-vite-ts-sdd-template@2026-10-03-plat-009.1`), `tests/tools/template/baseline.test.ts`, `docs/platform/README.md`.
- Pruebas y resultados: ver informe de ejecución en la conversación; `npm run check` y `npm run test:tools` pasan localmente. Ejecución en GitHub tras el push de `4470f00` (2026-10-03): `Quality` (run `37151781479`) y `Security` (run `37151781465`) finalizan con `success`; en `Security` pasan `npm ci` y `npm audit --omit=dev --audit-level=high` con `found 0 vulnerabilities`. Dos ejecuciones de `Dependabot Updates` se dispararon sobre esa confirmación (una `success` y otra `in_progress` en la última consulta); no había pull requests de Dependabot abiertos en ese momento, por lo que el comportamiento de sus PR no está observado.
- Desviaciones: ninguna respecto al delta aprobado.
- Aceptación: 2026-10-03, Tomás, usuario solicitante. Aceptación expresa «Acepto PLAT-009, 010, 011 y 012 como VALIDATED» registrada en la conversación de trabajo tras contrastar los criterios con la evidencia de este registro. La aceptación se registró antes de la ejecución en GitHub, que después confirmó `Quality` y `Security` (véase «Pruebas y resultados»); los pull requests de Dependabot siguen sin observarse.
