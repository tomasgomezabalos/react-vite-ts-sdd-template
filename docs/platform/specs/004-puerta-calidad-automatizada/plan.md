# Plan técnico — PLAT-004 Puerta de calidad automatizada

**Estado documental:** APPROVED

**Versión:** 1.0.0

**Fecha:** 2026-08-28

**Aprobado por:** Tomás, usuario solicitante

**Fecha de aprobación:** 2026-08-28

**Evidencia de aprobación:** Aprobación expresa registrada en la conversación de trabajo.

**Clasificación:** FULL

## Especificación y alcance autorizado

- Especificación: `docs/platform/specs/004-puerta-calidad-automatizada/spec.md`, versión `1.0.0`, `APPROVED`.
- Criterios cubiertos: AC-01 a AC-12.
- Fuera de alcance: modificar contratos para hacer pasar comprobaciones, aprobar documentos automáticamente, validar semántica o enlaces web, imponer cobertura por archivo, añadir seguridad dinámica, desplegar, publicar, utilizar secretos, modificar Git, migrar proyectos existentes o incorporar dependencias nuevas.

## Decisiones y diseño

- ADR aplicables: ADR-0001, ADR-0002, ADR-0008, ADR-0009, ADR-0010 y ADR-0011.
- Componentes propios: no aplica; no se crearán ni modificarán componentes React y no se requiere `@react-ts-feature-pattern`.
- Runtime de las herramientas: TypeScript estricto ejecutado con el type stripping de Node `22.23.2`. Se utilizará únicamente sintaxis borrable, imports relativos con extensión `.ts`, APIs `node:` y la API de TypeScript `~6.0.2` ya instalada. `tsc` continuará realizando el type-check.
- Propietario: toda la capacidad vivirá bajo `tools/quality/`; no se mezclará con `tools/template/`, salvo los ajustes de compatibilidad que PLAT-003 necesita para diagnosticar el nuevo runtime y derivar la nueva baseline.

### Runtime y manifiesto npm

- `.nvmrc` continuará en `22.23.2` sin cambio de contenido y será la fuente consumida por CI.
- `package.json` declarará:
  - `engines.node: ">=22.23.2 <23"`;
  - `engines.npm: ">=10.9.8 <11"`;
  - `packageManager: "npm@10.9.8"`;
  - `devEngines.runtime` con Node `22.23.2` y `onFail: "error"`;
  - `devEngines.packageManager` con npm `10.9.8` y `onFail: "error"`.
- `package-lock.json` se regenerará únicamente en sus metadatos raíz mediante npm `10.9.8`, sin cambiar el conjunto de dependencias. Se comprobará después con `npm ci`.
- Una prueba de integración creará un paquete temporal con una política `devEngines` incompatible y confirmará que npm detiene el comando antes de ejecutar el script. No dependerá de que el equipo tenga instalada una segunda versión real de Node.

### Comandos y secuencia de calidad

- `npm run docs:check` ejecutará `node tools/quality/docs-check.ts`.
- `npm run architecture:check` ejecutará `node tools/quality/architecture-check.ts`.
- `npm run check` ejecutará exactamente `lint`, `docs:check`, `architecture:check`, `test:coverage` y `build`, en ese orden y sin una segunda ejecución de `test`.
- Los entrypoints exportarán una función `main` comprobable en proceso y contendrán solo coordinación mínima. Las pruebas CLI añadirán procesos Node reales, pero la lógica permanecerá importable para conservar cobertura sin depender de instrumentación de subprocesos.

### Modelo común de diagnósticos

- `tools/quality/types.ts` definirá diagnósticos con código estable, archivo, mensaje, severidad bloqueante y línea/columna opcionales.
- `tools/quality/filesystem.ts` recorrerá archivos en orden léxico, resolverá rutas dentro de la raíz y excluirá `.git`, `.agents`, `.codex`, `node_modules`, `dist`, `coverage` y `.template-transaction`.
- `tools/quality/output.ts` ordenará por archivo, posición y código, imprimirá una línea accionable por incumplimiento y devolverá `0` sin errores y `1` con errores de contrato. Un error de uso o lectura que impida comprobar el alcance devolverá `2`.
- Ninguna herramienta llamará APIs de escritura. Las pruebas compararán contenido, estructura, modo y `mtime` de los fixtures antes y después; el tiempo de acceso seguirá siendo un límite del sistema de archivos.

### Comprobador documental

- `tools/quality/markdown.ts` extraerá headings y destinos de enlaces inline, imágenes, referencias y autolinks, ignorando bloques e inline code. Los destinos con `http`, `https`, `mailto`, `tel`, `data` o protocolo relativo se clasificarán como externos y no usarán red.
- Los destinos locales se decodificarán, resolverán desde el documento origen y deberán permanecer dentro del repositorio. Se separarán query y fragmento; el archivo o directorio deberá existir.
- Las anclas utilizarán una normalización compatible con headings de GitHub: minúsculas, eliminación de etiquetas y puntuación, espacios convertidos a guiones y sufijos incrementales para duplicados. También se admitirán identificadores HTML explícitos detectables.
- Un enlace local con sintaxis ambigua, ruta absoluta, escape de la raíz o codificación inválida fallará como no comprobable; no se aceptará silenciosamente.
- `tools/quality/docs-policy.ts` declarará:
  - archivos e índices requeridos;
  - relaciones obligatorias desde `docs/sdd/README.md` hacia constitución, workflow, política y plantillas;
  - relación de `docs/architecture/README.md` con todos los ADR existentes;
  - relación de `docs/platform/README.md` con los contratos efectivos y con los artefactos del modelo actual que existan;
  - existencia de `specs/README.md` y relación con artefactos de producto cuando aparezcan;
  - patrones de artefactos gobernados por ADR-0009 y una lista explícita de excepciones históricas para ADR-0001 a ADR-0008, PLAT-001 y PLAT-002;
  - exclusión de metadatos para índices, guías, templates y ejemplos declarados.
- Para los artefactos actuales se validarán `Estado documental`, `Estado de entrega` cuando exista, versión y metadatos de aprobación. Un documento `APPROVED` fallará si `Aprobado por`, fecha o evidencia permanecen vacíos, en `Pendiente` o con el placeholder de plantilla.
- Códigos iniciales: `DOC_REQUIRED_FILE`, `DOC_INDEX_ENTRY`, `DOC_LINK_TARGET`, `DOC_LINK_ANCHOR`, `DOC_LINK_UNCHECKABLE`, `DOC_DOCUMENT_STATUS`, `DOC_DELIVERY_STATUS` y `DOC_APPROVAL_METADATA`.
- `tools/quality/docs-check.ts` coordinará el recorrido, las reglas y la salida sin interpretar si el contenido o la aprobación son verdaderos.

### Comprobador arquitectónico

- `tools/quality/imports.ts` cargará `tsconfig.app.json` mediante la API pública de TypeScript, recorrerá el AST y extraerá `import`, `export ... from` e `import()`.
- Los imports relativos y aliases que TypeScript resuelva dentro de `src/` se clasificarán por archivo real. Los paquetes externos quedarán fuera del análisis de capas. Un import interno no resoluble fallará; un `import()` con argumento no literal fallará como alcance no comprobable.
- `tools/quality/architecture-policy.ts` clasificará:
  - `src/main.tsx` como raíz de composición con permiso para importar cualquier capa;
  - `src/app/` como composición superior;
  - `src/pages/<propietario>/`, `src/features/<propietario>/`, `src/entities/<propietario>/` y `src/shared/` según ADR-0008;
  - `src/i18n/`, `src/locales/` y el estilo raíz existente como infraestructura shared transitoria.
- La matriz permitirá únicamente dependencias descendentes. Un módulo podrá depender de otro archivo de su mismo propietario.
- Las páginas no podrán depender de otra página. `app` solo podrá importar una página mediante `pages/<propietario>/index.tsx` o su resolución de directorio; los módulos internos de la página serán privados fuera de ella.
- La primera versión no prohibirá automáticamente dependencias laterales entre features diferentes o entidades diferentes cuando no exista una frontera privada explícita: ADR-0008 exige valorar semánticamente si revelan propiedad compartida y la herramienta no inventará esa conclusión. Esta limitación se documentará y la revisión humana seguirá siendo obligatoria.
- Códigos iniciales: `ARCH_LAYER_DIRECTION`, `ARCH_PAGE_TO_PAGE`, `ARCH_PRIVATE_PAGE_IMPORT`, `ARCH_INTERNAL_UNRESOLVED` y `ARCH_DYNAMIC_UNCHECKABLE`.
- `tools/quality/architecture-check.ts` coordinará análisis, política y salida sin modificar fuentes ni configuración.

### Cobertura

- `vite.config.ts` mantendrá V8 e `include: ['src/**/*.{ts,tsx}', 'tools/**/*.ts']`.
- Se excluirán pruebas, declaraciones y módulos exclusivamente de tipos de `src/` y `tools/`.
- `coverage.thresholds` fijará `statements: 70`, `branches: 55`, `functions: 75`, `lines: 75`, `perFile: false` y `autoUpdate: false`.
- Las nuevas herramientas se cubrirán con pruebas en proceso. No se excluirán wrappers o ramas por tener cobertura baja.

### GitHub Actions

- `.github/workflows/quality.yml` se activará en pushes a `main` y pull requests.
- Tendrá `permissions: contents: read`, un grupo de concurrencia por workflow y rama o pull request, `cancel-in-progress: true`, runner Linux y un límite temporal explícito.
- Usará únicamente `actions/checkout` y `actions/setup-node`; esta última leerá `.nvmrc` mediante `node-version-file` y activará `cache: npm` con `package-lock.json`.
- Los únicos comandos de proyecto serán `npm ci` y `npm run check`.
- Inmediatamente antes de crear el workflow se resolverá cada release oficial vigente compatible y se verificará en el repositorio oficial el commit completo correspondiente. El YAML fijará ese SHA y conservará al lado un comentario con la versión legible. El plan no congela ni inventa ahora un SHA susceptible de cambiar antes de la implementación.
- `tests/tools/quality/workflow.test.ts` comprobará localmente el contrato de seguridad y comandos sobre el YAML como texto estructurado de alcance limitado. No afirmará validar el esquema completo de GitHub Actions.
- La evidencia de ejecución real quedará pendiente hasta que una autorización separada permita commit y push. Solo una ejecución observada en GitHub podrá cerrar AC-10 y AC-11 como evidencia remota.

### Compatibilidad con PLAT-003

- `tools/template/diagnostics.ts` sustituirá su comparación mínima simplificada por una comprobación limitada y probada del rango `>=22.23.2 <23`, evitando aceptar Node 23 o superior como compatible.
- `tools/template/project.config.example.json` declarará únicamente `npm run check`, porque la cobertura pasará a formar parte de esa puerta.
- Las pruebas de `template:doctor` cubrirán el nuevo rango sin ampliar su diagnóstico a garantías no observables.
- `tools/template/baseline-manifest.json` actualizará su identificador y únicamente los hashes de archivos gestionados que cambien. Se verificará que el bootstrap continúe previsualizando, aplicando y diagnosticando una copia derivada.

### Documentación y estados

- `README.md` documentará versiones exactas, instalación con lockfile, comandos focalizados, puerta completa, CI y límites de las garantías.
- `AGENTS.md` incorporará la obligación operativa de usar el runtime declarado, no omitir etapas de `npm run check` y distinguir inspección local de evidencia CI real.
- `docs/platform/README.md` enlazará spec, plan e informe de PLAT-004 y reflejará el estado de entrega separado.
- Durante la implementación se creará `validation-report.md` con `Estado de entrega: IMPLEMENTED`; solo una aceptación expresa y las evidencias aplicables permitirán `VALIDATED`.
- No se modificará el contenido aprobado de ADR-0011 ni de la especificación PLAT-004 para registrar ejecución.

## Cambios previstos

| Archivo o área | Cambio | Requisito relacionado |
| --- | --- | --- |
| `package.json` | Coordinar runtime/npm, añadir scripts de calidad y convertir `check` en la puerta única. | REQ-01, REQ-02 |
| `package-lock.json` | Sincronizar metadatos raíz sin cambiar dependencias. | REQ-01 |
| `vite.config.ts` | Añadir umbrales globales y exclusiones de tipos sin reducir el código ejecutable incluido. | REQ-06 |
| `tools/quality/types.ts` | Definir diagnósticos y resultados comunes. | REQ-07 |
| `tools/quality/filesystem.ts` | Resolver raíz, recorrido estable y exclusiones sin escritura. | REQ-03, REQ-07 |
| `tools/quality/output.ts` | Ordenar, presentar y convertir diagnósticos en códigos de salida. | REQ-07 |
| `tools/quality/markdown.ts` | Extraer enlaces y headings y resolver anclas deterministas. | REQ-03 |
| `tools/quality/docs-policy.ts` | Declarar archivos, índices, metadatos y excepciones históricas. | REQ-04 |
| `tools/quality/docs-check.ts` | Implementar la CLI y coordinación documental. | REQ-03, REQ-04, REQ-07 |
| `tools/quality/imports.ts` | Extraer y resolver imports mediante TypeScript. | REQ-05 |
| `tools/quality/architecture-policy.ts` | Aplicar capas, propietarios y privacidad de páginas. | REQ-05 |
| `tools/quality/architecture-check.ts` | Implementar la CLI y coordinación arquitectónica. | REQ-05, REQ-07 |
| `tests/tools/quality/` | Probar reglas documentales, arquitectónicas, runtime, workflow, CLI y no mutación. | REQ-01, REQ-08, REQ-09 |
| `.github/workflows/quality.yml` | Ejecutar `npm ci` y la misma puerta local con permisos mínimos y acciones fijadas. | REQ-09 |
| `tools/template/diagnostics.ts` | Diagnosticar correctamente el nuevo rango Node. | REQ-01, REQ-10 |
| `tools/template/project.config.example.json` | Evitar duplicar cobertura fuera de `npm run check`. | REQ-02 |
| `tests/tools/template/` | Mantener la regresión de doctor, derivación y comandos de calidad. | REQ-01, REQ-02 |
| `tools/template/baseline-manifest.json` | Actualizar baseline y hashes gestionados afectados. | REQ-01, REQ-02, REQ-06 |
| `README.md` | Documentar runtime, puerta, comandos focalizados, CI y límites. | REQ-01, REQ-02, REQ-10 |
| `AGENTS.md` | Convertir el runtime y la puerta aprobados en reglas operativas. | REQ-01, REQ-02, REQ-10 |
| `docs/platform/README.md` | Enlazar artefactos y estado efectivo de PLAT-004. | Trazabilidad |
| `docs/platform/specs/004-puerta-calidad-automatizada/validation-report.md` | Registrar implementación, matriz de evidencias, límites y aceptación separada. | AC-01 a AC-12 |

No se prevén cambios en `.nvmrc`, `tsconfig.node.json`, `tsconfig.app.json`, `eslint.config.js`, el código React, MSW, i18n ni los documentos aprobados de contrato.

## Trazabilidad prevista

| Requisito o criterio | Implementación prevista | Prueba o validación prevista |
| --- | --- | --- |
| REQ-01 / AC-01 / AC-02 | `package.json`, lockfile, diagnóstico PLAT-003 | Coherencia declarativa, entorno exacto, fixture `devEngines` incompatible y `npm ci`. |
| REQ-02 / AC-03 / AC-04 | scripts npm y entrypoints | Puerta completa válida; scripts focalizados y fallo inyectado sin duplicar pruebas. |
| REQ-03 / AC-05 / AC-06 | `markdown.ts`, `filesystem.ts`, `docs-check.ts` | Enlaces inline, referencia, autolink, archivo, ancla, traversal, ambigüedad y snapshot sin cambios. |
| REQ-04 / AC-05 / AC-06 | `docs-policy.ts`, `docs-check.ts` | Índices completos, históricos permitidos, estado inválido y aprobación pendiente detectados. |
| REQ-05 / AC-07 / AC-08 | `imports.ts`, `architecture-policy.ts`, `architecture-check.ts` | Matriz de capas, página propia/ajena, módulo privado, alias, destino ausente e import dinámico. |
| REQ-06 / AC-03 / AC-09 | `vite.config.ts` y suite Vitest | Cobertura real sobre `src` y `tools`; subumbral controlado devuelve error. |
| REQ-07 / AC-04–AC-08 | modelo, filesystem, output y CLI | Orden estable, códigos `0`/`1`/`2`, posición disponible y snapshots sin escritura. |
| REQ-08 / AC-06 / AC-08 | `tests/tools/quality/` | Fixtures positivos y negativos exigidos por la especificación. |
| REQ-09 / AC-10 / AC-11 | workflow y prueba local de contrato | Inspección limitada local; ejecución real y cancelación solo tras publicación autorizada. |
| REQ-10 / AC-10 / AC-12 | README, AGENTS e informe | Límites visibles y separación entre inspección local, CI real y revisiones no cubiertas. |

## Dependencias e instalaciones

- Ninguna dependencia nueva.
- Se utilizarán Node `22.23.2`, npm `10.9.8`, TypeScript `~6.0.2` y Vitest/V8 ya presentes.
- `npm install --package-lock-only --ignore-scripts` podrá utilizarse con npm `10.9.8` para sincronizar el lockfile sin cambiar dependencias; cualquier acceso de red inesperado se detendrá y se comunicará antes de ampliar permisos.
- `npm ci` se ejecutará como validación reproducible una vez sincronizado el manifiesto.

## Estrategia de pruebas

- Unitarias: Vitest en entorno Node para Markdown, anclas, políticas documentales, clasificación de capas, AST, resolución y salida.
- Integración: repositorios fixture bajo directorios temporales para recorridos completos, aliases, metadatos SDD, no mutación y códigos de salida.
- CLI: funciones `main` probadas en proceso y procesos Node reales para comprobar argumentos, stdout/stderr y códigos.
- Runtime: manifiestos reales y fixture npm incompatible; no se instalará otra versión de Node para simular el error.
- Workflow: inspección local del contrato mínimo; el parser limitado no sustituirá una ejecución de GitHub.
- Componentes/hooks: no aplica; no se modifica React.
- HTTP/MSW: no aplica; los comprobadores y el workflow no validan enlaces externos ni llaman servicios de aplicación.
- Regresión: todas las pruebas existentes de React y PLAT-003, cobertura global y build.
- Manuales: revisar mensajes accionables, ejecutar `docs:check` y `architecture:check` sobre el repositorio real y contrastar el workflow publicado únicamente después de autorización de push.

## Tareas

1. Coordinar metadatos Node/npm, lockfile y scripts; añadir pruebas de runtime compatible e incompatible.
2. Implementar modelo común, recorrido seguro, salida estable y pruebas de no mutación.
3. Implementar extracción Markdown, resolución de archivos/anclas y sus fixtures positivos y negativos.
4. Implementar política SDD, índices, estados, aprobaciones y excepciones históricas con pruebas.
5. Implementar extracción AST, resolución TypeScript y matriz de arquitectura con pruebas de capas, páginas, privacidad, aliases e imports dinámicos.
6. Integrar `docs:check` y `architecture:check` en la puerta única y añadir los umbrales de cobertura.
7. Adaptar PLAT-003 al nuevo rango y comando único, actualizar su manifiesto y ejecutar toda su regresión.
8. Actualizar README y AGENTS con operación y límites verificables.
9. Resolver y verificar los SHA oficiales, crear el workflow y probar localmente su contrato limitado.
10. Ejecutar instalación reproducible y la puerta completa con Node/npm exactos; registrar mediciones y desviaciones.
11. Crear `validation-report.md` en `IMPLEMENTED` y actualizar el índice sin cambiar spec, plan o ADR aprobados.
12. Tras autorizaciones independientes de commit y push, observar el workflow real y completar la evidencia remota antes de solicitar `VALIDATED`.

## Riesgos, reversión y validación

- Riesgo: un parser Markdown propio no implementa todo CommonMark; las formas soportadas y cualquier destino no comprobable se harán explícitos y bloqueantes.
- Riesgo: la normalización de anclas puede diferir de GitHub en casos límite; se probarán duplicados, acentos, puntuación e identificadores HTML y se documentará el algoritmo.
- Riesgo: la API de TypeScript cambia entre versiones mayores; `~6.0.2` y las pruebas de AST limitan la deriva, pero cualquier actualización mayor requerirá revisión.
- Riesgo: TypeScript no puede resolver con certeza imports dinámicos no literales; se bloquearán en vez de presentar un falso éxito.
- Riesgo: la propiedad semántica entre features o entidades hermanas no puede inferirse automáticamente; permanece como revisión humana declarada.
- Riesgo: los umbrales globales pueden ocultar una regresión local compensada; `perFile` continúa fuera de alcance.
- Riesgo: la inspección local del YAML no demuestra que GitHub acepte ni ejecute el workflow; la evidencia remota requiere publicación autorizada.
- Riesgo: modificar archivos gestionados por PLAT-003 invalida hashes de baseline; el manifiesto y las pruebas de derivación se actualizarán en el mismo lote.
- Reversión: retirar workflow, scripts y `tools/quality/`; restaurar `package.json`, lockfile, Vite, documentación y compatibilidad PLAT-003 al estado anterior; conservar el informe como evidencia histórica y sustituir ADR-0011 antes de abandonar su política.
- Comandos de validación: `node --version`, `npm --version`, `npm install --package-lock-only --ignore-scripts`, `npm ci`, `npm run docs:check`, `npm run architecture:check`, pruebas focalizadas de `tests/tools/quality/` y `tests/tools/template/`, `npm run check` y `git diff --check`.
- Evidencias necesarias para pasar a `IMPLEMENTED`: matriz AC-01–AC-12 con resultado local, versiones efectivas, instalación reproducible, pruebas positivas/negativas, cobertura sobre `src` y `tools`, puerta completa, snapshots sin escritura, hashes de baseline, revisión del workflow y desviaciones.
- Evidencias necesarias para pasar a `VALIDATED`: informe en `IMPLEMENTED`, criterios locales contrastados, ejecución real correcta de GitHub Actions para el commit publicado, límite de concurrencia observado cuando sea posible sin fabricar eventos y aceptación expresa del usuario. Si AC-11 no puede observarse sin generar actividad artificial, permanecerá identificado como evidencia operativa pendiente y no se declarará probado.

## Puerta documental

La aprobación de esta versión limita el alcance implementable a los cambios enumerados. La implementación requiere autorización expresa y se registra en un `validation-report.md` separado. No autoriza instalaciones, commit, push ni publicación.
