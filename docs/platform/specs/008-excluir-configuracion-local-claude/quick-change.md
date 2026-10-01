# PLAT-008 — Excluir la configuración local de Claude de la derivación

**Estado documental:** APPROVED

**Versión:** 1.0.0

**Fecha:** 2026-10-01

**Aprobado por:** Tomás, usuario solicitante

**Fecha de aprobación:** 2026-10-01

**Evidencia de aprobación:** Aprobación expresa «Sí, empieza por el 2 y deja lista la prueba real» registrada en la conversación de trabajo, tras proponerse el cambio como `QUICK`.

**Clasificación:** QUICK

## Contrato afectado

- Especificación vigente: PLAT-007, versión `1.0.0`, REQ-01 y REQ-02; AC-01 y AC-02.
- Decisión vigente: ADR-0014, sección 1 («como mínimo»).
- Motivo de clasificación: amplía una lista de exclusión de forma pequeña y localizada, sin introducir una decisión arquitectónica nueva.

## Delta funcional

### Comportamiento vigente

`derivation.exclude` contiene `tools/template/**`, `tests/tools/template/**`, `project.config.json` y `.template-state.json`. La copia de la plantilla incluye todo el directorio de trabajo, por lo que un `.claude/settings.local.json` personal viajaría al proyecto derivado.

### Comportamiento aprobado

- `derivation.exclude` añade `.claude/settings.local.json`.
- La skill de derivación no copia ese archivo y `template:init` rechaza un destino que lo contenga.
- `.claude/skills/` y `.claude/launch.json` siguen derivándose.

### Fuera de alcance

- Excluir otros archivos de `.claude/` o de editores.
- Cambiar el comportamiento de preview, token, transacción o doctor.

## Criterios afectados

### QC-AC-01 — Configuración local no derivada

- **Dado** un destino que contiene `.claude/settings.local.json`
- **Cuando** se ejecuta el preview
- **Entonces** `template:init` falla indicando la ruta y no escribe nada

### QC-AC-02 — Manifiesto coherente

- **Dado** el manifiesto de baseline
- **Cuando** se leen sus exclusiones
- **Entonces** incluye `.claude/settings.local.json` y las cuatro rutas de PLAT-007

## Alcance técnico mínimo

| Archivo o área | Cambio previsto | Criterio |
| --- | --- | --- |
| `tools/template/baseline-manifest.json` | Añadir la exclusión, nuevo `baselineId` y hashes. | QC-AC-02 |
| `AGENTS.md` | Citar la ruta en la regla de ADR-0014 (archivo gestionado; regenerar hashes). | QC-AC-02 |
| `tests/tools/template/project.test.ts`, `baseline.test.ts` | Cubrir el rechazo y la lista. | QC-AC-01, QC-AC-02 |
| Skill externa de derivación | Citar la ruta en su lista actual (se lee en vivo del manifiesto). | QC-AC-01 |

## Pruebas y validación previstas

- Automatizadas: `npm run test:tools` y `npm run check`.
- Manual: derivación en copia temporal.

## Riesgos y reclasificación

- Riesgo: una persona que use `.claude/settings.local.json` en la plantilla ya no lo verá reflejado en sus derivados; es el comportamiento buscado.
- Reclasificar como `FULL` o `ADR` si se pretende excluir patrones o directorios completos de `.claude/`.

## Puerta documental

La aprobación autoriza implementar únicamente este delta. No autoriza commit ni publicación.
