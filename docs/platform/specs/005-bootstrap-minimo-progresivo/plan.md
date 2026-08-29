# Plan técnico — PLAT-005 Bootstrap mínimo y progresivo

**Estado documental:** APPROVED

**Versión:** 1.0.0

**Fecha:** 2026-08-29

**Aprobado por:** Tomás, usuario solicitante

**Fecha de aprobación:** 2026-08-29

**Evidencia de aprobación:** Aprobación expresa registrada en la conversación de trabajo.

**Clasificación:** FULL

## Especificación y alcance autorizado

- Especificación: `docs/platform/specs/005-bootstrap-minimo-progresivo/spec.md`, versión `1.0.0`, `APPROVED`.
- Decisión: ADR-0012, versión `1.0.0`, `APPROVED`.
- Criterios cubiertos: AC-01 a AC-10.
- Fuera de alcance: adoptar proyectos existentes; elegir otra arquitectura; personalizar producto, idiomas, soporte, despliegue, entornos, repositorio o licencia; migrar proyectos derivados; instalar dependencias; modificar Git; publicar; desplegar.

## Decisiones y diseño

### 1. Contrato de entrada y normalización

- `project.config.json` utilizará `schemaVersion: 2` y aceptará únicamente `$schema`, `schemaVersion` e `identity`.
- `identity` exigirá `displayName` y `packageName`; no admitirá propiedades adicionales.
- `packageName` seguirá validando el formato npm actual. La propuesta automática será una ayuda previa a escribir la configuración, no un valor implícito aceptado sin revisión.
- `config.ts` expondrá una normalización determinista del nombre visible: Unicode NFKD, eliminación de marcas combinantes, minúsculas, sustitución de secuencias no alfanuméricas por `-` y eliminación de separadores extremos. Si el resultado queda vacío o no es un nombre npm válido, el flujo solicitará un nombre npm explícito.
- La configuración efectiva interna añadirá únicamente `packageVersion: "0.1.0"` y `htmlTitle: displayName`. Estos valores no aparecerán como preguntas ni campos opcionales del JSON.
- El digest se calculará sobre la identidad efectiva normalizada. La baseline, los defaults heredados y los archivos actuales seguirán ligados al preview mediante `baselineId` y los hashes de operaciones.
- Se eliminarán `PendingValue`, `ResolvedOrPending`, `SuitabilityCriterion` y todas las ramas de validación de derivación, visión, localización, soporte, despliegue, entornos, repositorio y calidad.

### 2. Versionado y compatibilidad

- El esquema público de configuración pasará de versión 1 a versión 2 y rechazará explícitamente configuraciones v1.
- `.template-state.json` pasará a `schemaVersion: 2` para distinguir el nuevo snapshot mínimo. Conservará `baselineId`, `configDigest` y hashes de salidas gestionadas.
- El formato del manifiesto de baseline y del diario transaccional permanecerá en versión 1 porque sus contratos internos no cambian.
- El token de preview utilizará la versión 2 de configuración junto con el nuevo `baselineId`, destino real, digest y operaciones.
- Los proyectos derivados con versión 1 conservarán sus herramientas y snapshots históricos. No se añadirán migradores ni compatibilidad de reprovisionado.

### 3. Comprobación del origen derivado

- Se mantendrá el rechazo del directorio fuente y del remoto canónico.
- En un destino sin remoto ya no se leerá `derivation.evidence`; la herramienta comprobará la estructura requerida y los hashes de baseline antes de construir las salidas.
- Para una primera inicialización, todos los archivos enumerados por el manifiesto deberán coincidir con la baseline. `project.config.json` será la única entrada nueva esperada por el flujo y no se tratará como contenido de producto.
- Para una repetición, `.template-state.json` identificará una inicialización previa y solo se permitirá el mismo digest con los hashes gestionados intactos.
- No se ampliará el flujo a directorios con contenido desconocido ni a repositorios ya empezados.

### 4. Salidas gestionadas mínimas

La inicialización modificará o creará únicamente:

- `package.json`: nombre npm y versión `0.1.0`;
- `package-lock.json`: nombre y versión coherentes en raíz y paquete raíz;
- `index.html`: título igual al nombre visible; conservará el `lang` de la baseline;
- `README.md`: nombre, naturaleza de SPA derivada, puesta en marcha, enlaces SDD, límites del doctor y próximos pasos sin problema ni datos de producto;
- `.template-state.json`: snapshot técnico determinista de versión 2.

Permanecerán intactos y no serán regenerados:

- `vite.config.ts` y su ruta base vigente;
- `src/i18n/`, locales y textos de carga;
- pruebas React de la baseline;
- `specs/README.md`;
- `.env.example`, que no se creará mientras no existan variables públicas reales.

Se eliminarán de `managed-files.ts` el renderizado de visión, métricas, pendientes, despliegue, repositorio, entornos, locales y pruebas traducidas. La lista de operaciones y el token continuarán construyéndose completamente en memoria antes de cualquier escritura.

### 5. Estado e idempotencia

- El estado final registrará solo las salidas que el bootstrap realmente gestione.
- Una repetición inmediata con la misma configuración producirá operaciones `unchanged` y `changed=0`.
- Una configuración diferente o una modificación de una salida todavía gestionada bloqueará la reejecución sin sobrescribir.
- Los cambios SDD posteriores sobre archivos no gestionados, como visión, features, i18n o despliegue, no alterarán el digest histórico ni se representarán como pendientes del bootstrap.
- `transaction.ts` conservará su diseño actual: preparación, diario, escritura atómica por archivo, estado final en último lugar, rollback y recuperación por hashes.

### 6. Diagnóstico técnico

`template:doctor` conservará formatos, estados y códigos de salida, pero ajustará sus reglas:

- `PACKAGE_IDENTITY`: nombre y versión `0.1.0` coherentes con configuración, manifiesto y lockfile;
- `QUALITY_COMMANDS`: existencia de `npm run check` como contrato heredado, sin leerlo de la configuración;
- `HTML_IDENTITY`: título igual al nombre visible y `lang` no vacío;
- `I18N_CONFIGURATION`: estructura heredada legible y coherente entre recursos y configuración, sin compararla con decisiones de usuario;
- `NODE_VERSION`, `SDD_SEPARATION`, `KNOWN_SECRET_FILES`, `TEMPLATE_RESIDUALS`, `INITIALIZATION_STATE` y `SOURCE_REMOTE`: se mantienen con sus límites actuales;
- `PUBLIC_ENVIRONMENT`: solo se ejecutará si existe `.env.example`; validará nombres `VITE_` públicos y rechazará patrones sensibles sin requerir una lista en configuración.

Se eliminarán `PRODUCT_VISION`, `DEPLOYMENT_DECISIONS`, el recorrido genérico de valores `pending` y cualquier mensaje que interprete la ausencia de producto como fallo o advertencia. La salida indicará expresamente que el doctor valida coherencia técnica de derivación, no preparación funcional ni de despliegue.

`doctor.ts` seguirá siendo un coordinador de solo lectura y no necesita cambios funcionales. Las pruebas continuarán comparando contenido, modo, `mtime` y estado Git antes y después.

### 7. Skill de derivación

El skill `react-vite-ts-sdd-template-init` se actualizará para:

1. verificar fuente, runtime y contrato vigente;
2. solicitar destino absoluto y nombre visible;
3. proponer el nombre npm mediante la normalización aprobada y permitir una corrección;
4. mostrar un único resumen con destino, nombre visible, nombre npm, título derivado y defaults heredados relevantes;
5. copiar la baseline excluyendo `.git`, `node_modules`, `dist` y `coverage`;
6. escribir el JSON mínimo y ejecutar preview;
7. solicitar autorización vinculada al token antes del apply;
8. ejecutar doctor y mantener separadas instalación, validación, Git y publicación.

Se eliminará `references/questionnaire.md`; sus campos y clasificaciones no se trasladarán a otra referencia. El skill solo detendrá la derivación arquitectónica si la persona usuaria declara espontáneamente un requisito confirmado incompatible con la SPA cliente.

### 8. Límites preservados

- `init.ts` conservará sus comandos de preview, apply y recover; no añadirá modo interactivo.
- `doctor.ts` no escribirá ni corregirá.
- `transaction.ts` no cambiará su algoritmo ni ampliará rutas.
- No se modificarán componentes React, dependencias, lockfile de la plantilla, CI, cobertura ni comandos npm.
- No se editarán ADR-0010 ni los artefactos históricos y validados de PLAT-003.

## Cambios previstos

| Archivo o área | Cambio | Requisito relacionado |
| --- | --- | --- |
| `tools/template/project.schema.json` | Sustituir el contrato v1 por el esquema v2 mínimo y cerrado. | REQ-03 |
| `tools/template/project.config.example.json` | Reducir el ejemplo a identidad visible/npm. | REQ-02, REQ-03 |
| `tools/template/types.ts` | Modelar configuración v2, identidad efectiva y estado v2; retirar tipos eliminados. | REQ-03, REQ-04 |
| `tools/template/config.ts` | Validar el JSON mínimo, proponer nombre npm, normalizar defaults y calcular el digest efectivo. | REQ-02–REQ-04 |
| `tools/template/project.ts` | Sustituir evidencia humana por comprobación de estructura/hashes y fijar `npm run check`. | REQ-01, REQ-04, REQ-07 |
| `tools/template/managed-files.ts` | Limitar renderizado a identidad, README y estado; retirar producto, pending, entornos y locales. | REQ-04, REQ-05, REQ-07, REQ-09 |
| `tools/template/diagnostics.ts` | Convertir el doctor en diagnóstico técnico sin visión, despliegue ni pendientes. | REQ-08, REQ-09 |
| `tools/template/output.ts` | Ajustar próximos pasos y declarar el alcance técnico del doctor. | REQ-09, REQ-10 |
| `tools/template/baseline-manifest.json` | Actualizar `baselineId` y hashes de la baseline modificada. | REQ-01, REQ-07 |
| `tests/tools/template/config.test.ts` | Cubrir esquema mínimo, normalización, extras rechazados y ausencia de campos v1. | AC-01–AC-03 |
| `tests/tools/template/project.test.ts` | Cubrir fingerprint sin evidencia, origen canónico y calidad heredada. | AC-01, AC-05, AC-08 |
| `tests/tools/template/initialization.test.ts` | Verificar salidas mínimas, ausencia de producto, estado v2, no-op, conflicto, rollback y recuperación. | AC-03, AC-04, AC-06–AC-08 |
| `tests/tools/template/doctor.test.ts` | Verificar diagnóstico sin ruido de producto y conservación byte a byte/Git. | AC-09 |
| `tests/tools/template/cli.test.ts` | Cubrir preview/apply/doctor v2, salida segura y códigos. | AC-06–AC-10 |
| `tests/tools/template/helpers/project-fixture.ts` | Generar fixtures con configuración mínima normalizada y estados v2. | AC-01–AC-09 |
| `README.md` | Documentar las dos entradas, defaults, preview/apply y descubrimiento posterior. | REQ-02, REQ-09, REQ-10 |
| `AGENTS.md` | Sustituir el cuestionario amplio por la derivación mínima y conservar las puertas operativas. | REQ-01, REQ-02, REQ-06, REQ-10 |
| `docs/platform/README.md` | Enlazar plan e informe y reflejar los estados reales de PLAT-005. | Trazabilidad |
| `docs/platform/specs/005-bootstrap-minimo-progresivo/validation-report.md` | Registrar implementación, pruebas, desviaciones y aceptación separada. | AC-01–AC-10 |
| `/Users/tomas300472/.codex/skills/react-vite-ts-sdd-template-init/SKILL.md` | Sustituir la entrevista por destino, nombre y confirmación de identidad. | REQ-01, REQ-02, REQ-06, REQ-10 |
| `/Users/tomas300472/.codex/skills/react-vite-ts-sdd-template-init/references/questionnaire.md` | Eliminar el cuestionario y no reemplazarlo por campos opcionales o pendientes. | REQ-02, REQ-03, REQ-05 |

No se prevén cambios en `package.json`, `package-lock.json`, `tools/template/init.ts`, `tools/template/doctor.ts`, `tools/template/transaction.ts`, `vite.config.ts`, componentes React, configuración CI ni documentos históricos de PLAT-003.

## Trazabilidad prevista

| Requisito o criterio | Implementación prevista | Prueba o validación prevista |
| --- | --- | --- |
| REQ-01 / AC-01 / AC-05 | `project.ts`, manifiesto y skill | Copia reconocida aceptada; origen canónico, estructura divergente e incompatibilidad declarada rechazados sin escritura. |
| REQ-02 / AC-01 | esquema, ejemplo, `config.ts` y skill | Solo destino/nombre; propuesta npm determinista, revisable y corregible. |
| REQ-03 / AC-02 | esquema, tipos y validador | Fixtures v2 válidas; claves v1, extras, secretos y placeholders rechazados. |
| REQ-04 / AC-03 | `config.ts`, `managed-files.ts` | Golden outputs de paquete, lockfile, título y baseline técnica intacta. |
| REQ-05 / AC-04 | `managed-files.ts`, README y skill | Ausencia de visión generada, `.env.example`, datos de producto y pendientes. |
| REQ-06 / AC-05 | AGENTS y skill | Selección de SPA implícita; incompatibilidad confirmada detiene antes de preparar/aplicar. |
| REQ-07 / AC-06–AC-08 | `project.ts`, `managed-files.ts`, transacción existente | Preview sin escritura, token ligado, apply, no-op, conflicto, rollback y recover. |
| REQ-08 / AC-09 | `diagnostics.ts`, `doctor.ts` existente | Sin findings de producto; secretos limitados; snapshot y Git sin cambios. |
| REQ-09 / AC-04 / AC-10 | README, AGENTS, índice de specs heredado | El producto comienza después mediante SDD sin reescribir configuración/estado. |
| REQ-10 / AC-06 / AC-10 | `output.ts` y skill | Resumen mínimo, operaciones/token seguros y autorizaciones separadas. |

## Dependencias e instalaciones

- Ninguna dependencia nueva ni actualización de versiones.
- La implementación no autorizará `npm ci`. Si el worktree continúa sin `node_modules`, se solicitará autorización separada antes de instalar para ejecutar la puerta completa.
- La actualización del skill se encuentra fuera del worktree del repositorio y requerirá acceso de escritura explícito para esas dos rutas durante la implementación.

## Estrategia de pruebas

- Unitarias: Vitest en entorno Node para esquema, validador, normalización npm, digest, versionado y diagnósticos.
- Integración: fixtures temporales con baseline exacta; preview, apply, no-op, conflicto, fallo inyectado y recuperación.
- CLI: procesos Node reales con configuración v2 y formatos humano/JSON; códigos `0`, `1` y `2`.
- Contrato negativo: buscar las claves retiradas en esquema, ejemplo, tipos de entrada, JSON generado, estado, salidas y skill; deberán aparecer únicamente en documentación histórica o en la explicación de migración de PLAT-005.
- Solo lectura: comparar contenido, modo, `mtime`, entradas y estado Git antes/después de preview y doctor.
- Copia derivada: crear una copia temporal sin `.git`, `node_modules`, `dist` ni `coverage`; aplicar un preview autorizado de prueba, ejecutar doctor y verificar que no se generan visión, `.env.example` ni decisiones de producto.
- Regresión: `npm run check` con Node `22.23.2` y npm `10.9.8`.
- Navegador: no aplica; no se modifica comportamiento React ni interfaz visual.

## Tareas

1. Reducir esquema, ejemplo y tipos a la configuración v2 y añadir la normalización npm con pruebas.
2. Sustituir evidencia humana por validación de baseline y adaptar el versionado de estado/token.
3. Reducir las salidas gestionadas y comprobar que la baseline técnica permanece intacta.
4. Ajustar el doctor y la salida para eliminar producto, despliegue y pendientes sin perder límites de seguridad.
5. Actualizar fixtures y pruebas de configuración, proyecto, inicialización, doctor y CLI.
6. Actualizar README y AGENTS con el flujo mínimo y las puertas separadas.
7. Actualizar el skill y eliminar definitivamente su cuestionario.
8. Ejecutar pruebas focalizadas, derivación temporal y `npm run check`; corregir únicamente desviaciones dentro del alcance aprobado.
9. Crear `validation-report.md` en `IMPLEMENTED` con trazabilidad AC-01–AC-10 y resultados reales.

No se creará un `tasks.md`; este desglose es suficiente y permanece dentro del plan aprobado.

## Riesgos, reversión y validación

- Riesgo: la normalización automática puede no producir un nombre útil para alfabetos no latinos; en ese caso se exige una corrección explícita, sin inventar valor.
- Riesgo: retirar archivos del conjunto gestionado podría ocultar una divergencia de baseline; la comprobación inicial del manifiesto se ejecutará antes de construir operaciones.
- Riesgo: cambiar el estado a versión 2 puede confundirse con una migración; los errores distinguirán claramente configuración antigua de proyecto nuevo.
- Riesgo: un doctor más estrecho podría interpretarse como validación funcional; la salida declarará su alcance técnico.
- Riesgo: el skill externo y el repositorio pueden quedar temporalmente desalineados; la implementación no se presentará como terminada hasta validar ambos contratos juntos.
- Reversión: revertir en conjunto esquema, validador, renderizadores, diagnósticos, manifiesto, pruebas, documentación y skill antes de publicación. Los proyectos v1 no se tocarán.
- Comandos de validación: pruebas focalizadas de `tests/tools/template/`, `npm run docs:check`, `npm run architecture:check`, `npm run test:coverage`, `npm run build` y `npm run check` como puerta final única.
- Evidencias necesarias para `IMPLEMENTED`: diff exacto, matriz AC-01–AC-10, resultados de pruebas y comandos, preview/apply/no-op, conflicto, rollback/recover, snapshot de doctor y comprobación negativa de campos eliminados.
- Evidencias necesarias para `VALIDATED`: informe en `IMPLEMENTED`, criterios contrastados, límites residuales revisados y aceptación expresa.

## Puerta documental

La aprobación de esta versión limita la implementación a los archivos, decisiones y tareas enumerados. Implementar, instalar dependencias, modificar el skill externo, validar, crear commit o publicar requieren las autorizaciones separadas aplicables. La ejecución se registrará en `validation-report.md`; no se modificará este plan para reflejar progreso.
