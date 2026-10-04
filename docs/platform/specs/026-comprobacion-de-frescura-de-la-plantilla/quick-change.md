# PLAT-026 — Comprobación de frescura de la plantilla (`template:freshness`)

**Estado documental:** APPROVED

**Versión:** 1.0.0

**Fecha:** 2026-10-04

**Aprobado por:** Tomás, usuario solicitante

**Fecha de aprobación:** 2026-10-04

**Evidencia de aprobación:** Aprobación expresa «si, las apruebo y te autorizo a implementarlo todo» registrada en la conversación de trabajo, incluida la creación de la tarea programada mensual, tras proponerse el cambio como `QUICK`.

**Clasificación:** QUICK

## Contrato afectado

- Decisión que se aplica: ADR-0020 (`APPROVED` el 2026-10-04 en la misma petición que este delta).
- Archivos afectados: nuevo `tools/template/freshness.ts` y sus módulos, `package.json` (script, archivo gestionado), `tools/template/managed-files.ts` (scripts retirados del derivado), `AGENTS.md` (flujo de derivación, bloque exclusivo de la plantilla; archivo gestionado) y `README.md` (archivo gestionado).
- Motivo de clasificación: añade un comando de mantenimiento propio de la plantilla, sin comportamiento de producto, ni cambio arquitectónico fuera de lo decidido en ADR-0020, y con efecto solo sobre el utillaje de la plantilla y su flujo de derivación. Se clasifica `QUICK` y se reclasificará como `FULL` si el alcance de las comprobaciones crece más allá de lo descrito aquí.

## Delta funcional

### Comportamiento vigente

No existe una comprobación del estado de la plantilla frente al exterior: las dependencias de npm, el runtime de Node y npm, las reglas de ignorado de Dependabot y los cambios pendientes se revisan a mano. El flujo de derivación de `AGENTS.md` parte de la configuración y el preview del bootstrap, sin revisar la frescura.

### Comportamiento aprobado propuesto

- `npm run template:freshness [--format human|json]` emite un informe de solo lectura (no escribe en el repositorio ni cambia dependencias) con una entrada por comprobación y uno de estos estados: `ATTENTION` (requiere decisión), `BLOCKED` (bloqueado a propósito, con su causa), `CURRENT` (vigente) o `UNKNOWN` (no comprobable). Código de salida: `0` sin `ATTENTION`, `1` con alguna, `2` por error de uso.
- Comprobaciones de la primera versión:
  1. **Dependencias:** `npm outdated` clasificado en parche, menor o mayor; las cubiertas por una regla de ignorado de `.github/dependabot.yml` salen `BLOCKED` con la causa indicada en sus comentarios.
  2. **Seguridad:** `npm audit --omit=dev`; vulnerabilidades de nivel alto o crítico, `ATTENTION`.
  3. **Node y npm:** línea de Node de `.nvmrc` frente a `schedule.json` (fase actual y fin de vida) y a `dist/index.json` (último parche de la línea, siguiente línea LTS y npm incluido); `ATTENTION` si hay parche más reciente, si la línea está en mantenimiento con otra LTS activa, o si el fin de vida está a menos de 180 días.
  4. **Reglas de ignorado:** por cada regla, última versión del paquete ignorado y rangos de peer de los paquetes relacionados (`typescript-eslint` para `typescript`), para decidir si la causa persiste; el resultado es informativo (`BLOCKED` o `ATTENTION` si un peer ya admite la versión ignorada).
  5. **GitHub (si `gh` está disponible):** pull requests de Dependabot abiertos y resultado de la última ejecución de CI de `main`; sin `gh`, `UNKNOWN`.
  6. **Cambios pendientes:** filas de `docs/platform/README.md` en `DRAFT` o `APPROVED` / `NOT_STARTED`, con su condición de aplicación si consta en el registro.
- Los proveedores de datos (red, `npm`, `gh`, sistema de archivos) son inyectables, de modo que las pruebas son deterministas y sin red; un fallo de lectura de una fuente externa se informa como `UNKNOWN`, nunca como error.
- El comando pertenece a `tools/template/**` (no se deriva) y `template:init` retira `template:freshness` de los scripts del derivado, igual que `template:init` y `template:doctor`.
- `AGENTS.md`, bloque exclusivo de la plantilla: antes del preview del bootstrap se ejecuta `npm run template:freshness` y se presenta el informe; con `ATTENTION` se decide actualizar mediante el flujo SDD y repetir la comprobación, o continuar dejando constancia de la deuda aceptada. La comprobación no actualiza nada.
- Tarea programada mensual `revisar-frescura-plantilla` (primer día de cada mes a las 10:00 hora local) que ejecuta el comando con `--format json`, resume el informe y lo notifica, sin escribir en el repositorio ni hacer commit, push ni cambios de dependencias. Se crea con autorización expresa en el momento de aplicar este delta.
- `README.md` documenta el comando y sus límites en la sección de la plantilla.

### Fuera de alcance

- Actualizar dependencias, el runtime o la documentación desde el comando.
- Ejecutar `npm run check` o `npm run test:tools` dentro de la comprobación.
- Comprobar los derivados ya creados.
- Sustituir Dependabot o añadir otra herramienta de actualización.

## Criterios afectados

### QC-AC-01 — Solo lectura y códigos de salida

- **Dado** un repositorio de prueba con datos simulados
- **Cuando** se ejecuta la comprobación con y sin `ATTENTION`
- **Entonces** no modifica ningún archivo (instantánea antes y después), devuelve `1` y `0` respectivamente y `2` ante argumentos inválidos

### QC-AC-02 — Clasificación de las comprobaciones

- **Dado** datos simulados de `npm outdated`, `npm audit`, el calendario de Node, `dist/index.json`, `dependabot.yml`, los peers de `typescript-eslint` y `docs/platform/README.md`
- **Cuando** se ejecuta la comprobación
- **Entonces** cada comprobación produce el estado esperado (`ATTENTION`, `BLOCKED`, `CURRENT`) y la causa de cada regla de ignorado consta en el informe

### QC-AC-03 — Sin red no hay fallo

- **Dado** un proveedor de red que falla y `gh` ausente
- **Cuando** se ejecuta la comprobación
- **Entonces** las comprobaciones afectadas salen `UNKNOWN`, el resto se informa, y no hay excepción ni código `2`

### QC-AC-04 — Fuera de la derivación

- **Dado** una derivación real
- **Cuando** se aplican `template:init` y `template:doctor`
- **Entonces** el derivado no contiene `tools/template/` y su `package.json` no tiene `template:freshness`

### QC-AC-05 — Flujo y aviso

- **Dado** `AGENTS.md` y la tarea programada
- **Cuando** se leen el flujo de derivación y la tarea
- **Entonces** el flujo exige ejecutar la comprobación antes del preview y la tarea es mensual, solo informa y no escribe en el repositorio; una ejecución manual de la tarea produce el informe

### QC-AC-06 — Puerta intacta

- **Dado** el cambio aplicado
- **Cuando** se ejecutan `npm run check`, `npm run test:tools` y una derivación real con su verificación
- **Entonces** todo finaliza con código `0` y `npm run check` no ejecuta la comprobación

## Alcance técnico mínimo

| Archivo o área | Cambio previsto | Criterio |
| --- | --- | --- |
| `tools/template/freshness.ts` (y módulos de comprobaciones y salida) | Comando, comprobaciones y formato; proveedores inyectables. | QC-AC-01 a QC-AC-03 |
| `package.json` | Script `template:freshness` (archivo gestionado). | QC-AC-04 |
| `tools/template/managed-files.ts` | Retirar `template:freshness` de los scripts del derivado. | QC-AC-04 |
| `tests/tools/template/freshness.test.ts` (y fixtures) | Casos de QC-AC-01 a QC-AC-04, sin red. | QC-AC-01 a QC-AC-04 |
| `AGENTS.md`, `README.md` | Flujo de derivación y documentación (archivos gestionados). | QC-AC-05 |
| Tarea programada `revisar-frescura-plantilla` | Crear con autorización expresa y probar con ejecución manual. | QC-AC-05 |
| `tools/template/baseline-manifest.json`, `tests/tools/template/baseline.test.ts` | Hashes y `baselineId`. | QC-AC-06 |
| `docs/architecture/README.md`, `docs/platform/README.md` | Fila de ADR-0020 y de PLAT-026. | — |

## Pruebas y validación previstas

- Automatizadas: pruebas con proveedores simulados, que deben fallar antes del cambio y pasar después; `npm run check` y `npm run test:tools`.
- Manual: ejecutar el comando con red real y comprobar que su informe coincide con una revisión a mano; derivación real con su verificación completa; ejecución manual de la tarea programada.
- Comando de regresión: `npm run check && npm run test:tools`.

## Riesgos y reclasificación

- Riesgo: las fuentes externas cambian de formato; mitigado con pruebas del formato esperado y con `UNKNOWN` ante fallos de lectura.
- Riesgo: el informe se ignora; mitigado con el paso obligatorio del flujo de derivación y el aviso mensual.
- Riesgo: la tarea programada solo se ejecuta con la aplicación abierta; si no, se ejecuta al abrirla de nuevo.
- Reclasificar como `FULL` si el comando pasa a actualizar archivos, o si se amplían las comprobaciones a los derivados.

## Puerta documental

La aprobación autoriza implementar únicamente este delta cuando exista autorización expresa de implementación y ADR-0020 esté aprobado. No autoriza commit ni publicación, ni crear la tarea programada sin una autorización expresa en ese momento.

## Registro de entrega opcional

- Estado de entrega: `VALIDATED`
- Archivos modificados: `tools/template/freshness.ts`, `freshness-checks.ts`, `freshness-providers.ts` (nuevos), `tools/template/managed-files.ts`, `tools/template/baseline-manifest.json`, `package.json`, `AGENTS.md`, `README.md`, `tests/tools/template/freshness.test.ts` (nuevo), `tests/tools/template/baseline.test.ts`, ADR-0020 y su índice, índice de plataforma.
- Pruebas y resultados: `npm run check` código `0`; `npm run test:tools` 15 archivos / 142 pruebas correctas (21 nuevas, con proveedores simulados); derivación real con `doctor` sin fallos, sin `tools/template/` ni script `template:freshness` en el derivado y `check` del derivado con código `0`; ejecución real con red: 2 `ATTENTION`, 4 `BLOCKED`, 3 `CURRENT`, código `1`; ejecución manual de la tarea programada `revisar-frescura-plantilla` (cron mensual `0 10 1 * *`): informe en español sin escrituras en el repositorio, coincidente con la ejecución real.
- Desviaciones: ninguna.
- Aceptación: 2026-10-04, Tomás, usuario solicitante. Aceptación expresa «Acepto PLAT-026 como VALIDATED» registrada en la conversación de trabajo tras contrastar los criterios con la evidencia de este registro. Tras el push (`3a0400c`), `Quality`, `Security` y `Template tools` finalizaron con `success`.
