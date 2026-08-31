# PLAT-006 — Separación de pruebas de aplicación y plantilla

**Estado documental:** APPROVED

**Versión:** 1.0.0

**Fecha:** 2026-08-31

**Aprobado por:** Tomás, usuario solicitante

**Fecha de aprobación:** 2026-08-31

**Evidencia de aprobación:** Autorización expresa «ok, adelante con todo» registrada en la conversación tras confirmar el alcance.

**Clasificación:** QUICK con decisión transversal ADR-0013

## Contrato afectado

- Especificación vigente: PLAT-004, versión `1.0.0`, REQ-02, REQ-06, REQ-08 y REQ-09; AC-03, AC-04, AC-09 y AC-10.
- Decisión vigente: ADR-0011, modificada parcialmente por ADR-0013.
- Motivo de clasificación: el comportamiento de los comandos de calidad cambia de forma observable, pero el delta es localizado y no modifica la aplicación React ni introduce dependencias.

## Delta funcional

### Comportamiento vigente

`npm test`, `npm run test:coverage` y `npm run check` descubren `tests/tools/**`; la cobertura global incluye `tools/**/*.ts`. El workflow ejecuta una única puerta idéntica en la plantilla fuente y en cualquier proyecto derivado.

### Comportamiento aprobado

- Los comandos de pruebas de aplicación excluyen `tests/tools/**`.
- La cobertura mide solo `src/**/*.{ts,tsx}` con los umbrales vigentes.
- `npm run check` no ejecuta pruebas propias de las herramientas.
- `npm run test:tools` conserva esas pruebas como suite independiente sin cobertura.
- El workflow ejecuta la suite de herramientas adicional únicamente en el repositorio canónico de la plantilla.

### Fuera de alcance

- Eliminar `tools/` o `tests/tools/` del repositorio.
- Modificar el comportamiento de bootstrap, doctor, comprobadores, aplicación React o build.
- Cambiar dependencias, runtime, umbrales de cobertura, Git o publicación.
- Presentar una inspección local del workflow como ejecución real de GitHub Actions.

## Criterios afectados

### QC-AC-01 — Puerta de aplicación aislada

- **Dado** el repositorio de la plantilla o un proyecto derivado
- **Cuando** se ejecutan `npm test`, `npm run test:coverage` o `npm run check`
- **Entonces** no se ejecuta ningún archivo bajo `tests/tools/**` y la cobertura incluye únicamente código ejecutable de `src/`

### QC-AC-02 — Herramientas comprobables por separado

- **Dado** el repositorio canónico de la plantilla
- **Cuando** se ejecuta `npm run test:tools`
- **Entonces** se ejecutan las pruebas bajo `tests/tools/**` sin alterar el informe de cobertura de aplicación

### QC-AC-03 — CI diferenciada sin divergencia oculta

- **Dado** el workflow heredable de calidad
- **Cuando** se ejecuta en cualquier repositorio
- **Entonces** aplica `npm run check`, y añade `npm run test:tools` solo cuando el repositorio es el canónico de la plantilla

### QC-AC-04 — Contrato y baseline coherentes

- **Dado** el cambio aprobado de alcance
- **Cuando** se revisan scripts, configuración, instrucciones, pruebas de contrato y manifiesto
- **Entonces** todos describen la misma separación y los hashes gestionados coinciden con los archivos efectivos

## Alcance técnico mínimo

| Archivo o área | Cambio previsto | Criterio |
| --- | --- | --- |
| `package.json` | Separar comandos de aplicación y `test:tools`. | QC-AC-01, QC-AC-02 |
| `vite.config.ts` | Limitar V8 a `src/**/*.{ts,tsx}`. | QC-AC-01 |
| `.github/workflows/quality.yml` | Ejecutar `test:tools` solo en el repositorio canónico. | QC-AC-03 |
| `tests/tools/quality/runtime-config.test.ts`, `workflow.test.ts` | Fijar el nuevo contrato mediante pruebas. | QC-AC-01 a QC-AC-04 |
| `README.md`, `AGENTS.md` e índices | Documentar alcance, operación y relaciones. | QC-AC-03, QC-AC-04 |
| `tools/template/baseline-manifest.json` | Actualizar identificador y hashes gestionados. | QC-AC-04 |

## Pruebas y validación previstas

- Automatizadas: pruebas de contrato de runtime/workflow, `npm test`, `npm run test:coverage`, `npm run test:tools` y `npm run check`.
- Manuales o navegador: no aplica; no cambia la interfaz React.
- Comando de regresión de aplicación: `npm run check`.
- Comando adicional de mantenimiento de plantilla: `npm run test:tools`.

## Riesgos y reclasificación

- Riesgo: una persona que mantenga la plantilla puede ejecutar solo `npm run check` localmente y omitir la suite de herramientas; CI canónica actúa como barrera adicional.
- Riesgo: un cambio futuro del nombre del repositorio canónico exigiría actualizar la condición explícita.
- Reclasificar como `FULL` o un nuevo `ADR` si se eliminan herramientas, se altera el bootstrap derivado o se rediseña la puerta de calidad más allá de esta separación.

## Puerta documental

La aprobación autoriza implementar únicamente este delta, conforme a la autorización expresa de aplicación registrada. No autoriza commit ni publicación.
