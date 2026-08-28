# Plan técnico — PLAT-003 Inicialización segura de proyectos derivados

**Estado documental:** APPROVED

**Versión:** 1.0.0

**Fecha:** 2026-08-28

**Aprobado por:** Tomás, usuario solicitante

**Fecha de aprobación:** 2026-08-28

**Evidencia de aprobación:** Aprobación expresa registrada en la conversación de trabajo.

**Clasificación:** FULL

## Especificación y alcance autorizado

- Especificación: `docs/platform/specs/003-inicializacion-segura-proyecto/spec.md`, versión `1.0.0`, `APPROVED`.
- Criterios cubiertos: AC-01 a AC-11.
- Fuera de alcance: seleccionar otra arquitectura, inventar requisitos, instalar dependencias, corregir automáticamente diagnósticos, reconfigurar proyectos inicializados, modificar Git, operar en red, crear repositorios o infraestructura, hacer commit, publicar o desplegar.

## Decisiones y diseño

- ADR aplicables: ADR-0001, ADR-0008, ADR-0009 y ADR-0010.
- Componentes propios: no aplica; no se crearán ni modificarán componentes React.
- Runtime: TypeScript estricto ejecutable mediante el type stripping incluido en Node 22.23.2. El código usará solo sintaxis borrable, imports relativos con extensión `.ts`, APIs `node:` y ninguna dependencia nueva. `tsc` seguirá realizando el type-check porque Node no valida tipos al ejecutar.
- Interfaces públicas:
  - `npm run template:init -- --target <ruta> --config <ruta>` valida y previsualiza; nunca escribe por defecto.
  - `npm run template:init -- --target <ruta> --config <ruta> --apply --preview-token <sha256>` aplica únicamente la previsualización vinculada al mismo destino, configuración y estado de archivos.
  - `npm run template:init -- --target <ruta> --recover <id>` recupera expresamente una transacción interrumpida cuando los hashes permitan hacerlo sin sobrescribir cambios posteriores.
  - `npm run template:doctor -- --target <ruta> --config <ruta>` diagnostica sin escribir.
  - Ambas herramientas admitirán `--format human|json`; el formato humano será el predeterminado.
- Directorio de trabajo: `--target` será obligatorio y se resolverá mediante `realpath`. La configuración podrá estar dentro o fuera del destino, pero sus referencias internas no podrán escapar de él.
- Configuración: `project.config.json` será un archivo del proyecto derivado, revisable y destinado a permanecer versionado. `tools/template/project.config.example.json` documentará la forma y `tools/template/project.schema.json` permitirá asistencia editorial; la validación efectiva será propia y se probará contra el esquema para poder ejecutar antes de instalar paquetes.
- Estructura de configuración:
  - `schemaVersion`;
  - `derivation`, con confirmación y evidencia de copia derivada cuando el remoto no permita comprobarla;
  - `identity`, con nombre visible, paquete, versión y título HTML;
  - `localization`, con locale predeterminado, fallback, `lang` y recursos iniciales para todas las claves usadas por la baseline;
  - `productVision`, con problema, personas, resultados, límites, métricas, restricciones, supuestos, perfil transversal, riesgos y cuestiones abiertas;
  - `support`, `deployment`, `environments`, `repository` y `quality` con las decisiones exigidas por PLAT-003.
- Pendientes: un valor pendiente no será una cadena ambigua. Utilizará una estructura con estado, responsable y condición de resolución, y solo se aceptará en los campos que el esquema marque como aplazables.
- Protección del origen: `tools/template/baseline-manifest.json` declarará el identificador de baseline, el remoto canónico normalizado y los hashes de los archivos gestionados. La inicialización rechazará el remoto canónico. Si Git o un remoto no son observables, exigirá la confirmación explícita y justificada de copia derivada en la configuración; nunca modificará Git para resolverlo.
- Protección de rutas: se rechazará cada ruta absoluta no autorizada, segmento ascendente o componente simbólico cuyo destino quede fuera de la raíz real. Solo se operará sobre rutas enumeradas por el manifiesto o generadas de forma controlada para locales y artefactos nuevos.
- Previsualización: se construirán en memoria todos los contenidos y operaciones. El token SHA-256 incluirá versión de esquema, configuración canónica, ruta real del destino, manifiesto y hashes actuales de todos los archivos gestionados. La salida distinguirá creación, modificación, eliminación segura y ausencia de cambio, sin mostrar contenido sensible completo.
- Protección de contenido: un archivo existente solo podrá cambiarse si coincide con el hash de baseline esperado, con el estado registrado de una inicialización idéntica o con una condición estructurada explícitamente soportada. Una diferencia desconocida bloqueará el conjunto completo.
- Escritura transaccional: antes de sustituir contenido se prepararán archivos temporales y un diario bajo `.template-transaction/<id>/`, en el mismo sistema de archivos. Se conservarán hashes, modos y copias de los originales gestionados. Las sustituciones serán atómicas por archivo; ante un error controlado se revertirán en orden inverso. El marcador `.template-state.json` se escribirá en último lugar.
- Recuperación: un cierre abrupto puede dejar un diario y parte de las sustituciones, pero nunca un estado final válido. La siguiente aplicación se bloqueará. `--recover <id>` restaurará o eliminará únicamente rutas registradas cuyos hashes sigan coincidiendo con la transacción; cualquier divergencia exigirá recuperación manual y no será sobrescrita.
- Repetición segura: el estado final conservará versión de esquema, digest de configuración y hashes de salidas, sin timestamp variable. La misma configuración y salidas producirán un no-op exitoso; una diferencia requerirá un cambio SDD independiente.
- Archivos derivados gestionados: identidad y versión de `package.json` y `package-lock.json`; `lang` y título de `index.html`; base de Vite; recursos i18n y locales iniciales; expectativas traducidas de las pruebas de carga; `.env.example`; README de producto; `specs/product-vision.md`; índice de producto y `.template-state.json`. La eliminación de un locale original solo se permitirá si conserva el hash de baseline y aparece en la previsualización.
- Visión generada: `specs/product-vision.md` se renderizará como `DRAFT 0.1.0`; no se inventarán aprobación ni evidencia. El contenido procederá exclusivamente de la configuración validada.
- Diagnóstico: cada regla producirá `PASS`, `WARN`, `FAIL` o `UNKNOWN`, código estable, explicación, ruta cuando aplique y límite de comprobación. El doctor excluirá `.git`, `node_modules`, `dist` y `coverage`; para secretos comprobará únicamente nombres y patrones declarados, sin imprimir valores.
- Códigos de salida: `0` sin fallos, aunque puedan existir advertencias; `1` con uno o más hallazgos `FAIL`; `2` para uso inválido, configuración ilegible, destino inseguro o error interno que impida diagnosticar. La salida JSON conservará el mismo significado.
- Metadatos en modos de lectura: las herramientas no invocarán APIs de escritura. Las pruebas contrastarán contenido, entradas, modo, `mtime` y estado Git antes y después; el tiempo de acceso puede depender de la política del sistema de archivos y se declarará como límite del entorno, sin atribuirlo a una escritura de la herramienta.
- Alternativas descartadas:
  - una CLI interactiva, porque dificulta revisar y repetir las entradas;
  - una previsualización que guarde estado, porque dejaría de ser de solo lectura;
  - aplicar con una confirmación booleana sin token, porque no vincula lo revisado con el estado aplicado;
  - `tsx`, `ajv` u otra dependencia, porque la capacidad debe poder ejecutarse antes de instalar paquetes y Node 22.23.2 ya cubre el runtime necesario;
  - corrección automática del doctor, porque mezclaría diagnóstico y mutación.

Fuente técnica del runtime: documentación oficial de Node 22.23.2, [Modules: TypeScript](https://nodejs.org/download/release/latest-jod/docs/api/typescript.html).

## Cambios previstos

| Archivo o área | Cambio | Requisito relacionado |
| --- | --- | --- |
| `package.json` | Añadir `template:init` y `template:doctor`. | REQ-03, REQ-09, REQ-11 |
| `tsconfig.node.json` | Incluir herramienta y pruebas Node con opciones compatibles con type stripping. | REQ-06, REQ-11 |
| `tsconfig.app.json` | Excluir las pruebas Node del proyecto de aplicación. | REQ-06 |
| `vite.config.ts` | Incluir `tools/**/*.ts` en cobertura sin alterar la aplicación de producción. | REQ-06, REQ-11 |
| `.gitignore` | Ignorar únicamente el directorio temporal de transacciones; conservar configuración y estado finales versionables. | REQ-06 |
| `tools/template/project.schema.json` | Declarar el contrato revisable de configuración. | REQ-01, REQ-02 |
| `tools/template/project.config.example.json` | Proporcionar un ejemplo explícito sin datos reales ni secretos. | REQ-01, REQ-02 |
| `tools/template/baseline-manifest.json` | Declarar baseline, remoto canónico, rutas gestionadas y hashes iniciales. | REQ-04, REQ-05, REQ-07 |
| `tools/template/types.ts` | Definir configuración, operaciones, estado, transacción y diagnósticos. | REQ-02, REQ-09, REQ-11 |
| `tools/template/config.ts` | Cargar, normalizar y validar la configuración sin coerciones silenciosas. | REQ-01, REQ-02 |
| `tools/template/project.ts` | Resolver destino, comprobar origen, rutas, symlinks, baseline y estado previo. | REQ-04, REQ-07 |
| `tools/template/managed-files.ts` | Renderizar en memoria el conjunto completo de archivos y operaciones. | REQ-03, REQ-05 |
| `tools/template/transaction.ts` | Aplicar, revertir y recuperar operaciones mediante diario y hashes. | REQ-06, REQ-07 |
| `tools/template/diagnostics.ts` | Implementar comprobaciones puras y clasificación del doctor. | REQ-09, REQ-10 |
| `tools/template/output.ts` | Formatear salida humana/JSON y códigos estables sin filtrar secretos. | REQ-10, REQ-11 |
| `tools/template/init.ts` | Interpretar argumentos y coordinar previsualización, aplicación o recuperación. | REQ-03, REQ-04, REQ-08, REQ-11 |
| `tools/template/doctor.ts` | Interpretar argumentos y ejecutar exclusivamente diagnósticos. | REQ-09, REQ-10, REQ-11 |
| `tests/tools/template/` | Probar validación, rutas, preview, aplicación, recuperación, idempotencia, doctor y CLI. | AC-01 a AC-11 |
| `README.md` | Documentar preparación de configuración, comandos, límites y flujo seguro. | REQ-01, REQ-03, REQ-08, REQ-09 |
| `AGENTS.md` | Exigir preview/token antes de bootstrap y mantener el doctor como operación de lectura. | REQ-03, REQ-08, REQ-09 |
| `docs/platform/README.md` | Mantener indexado PLAT-003 y enlazar sus artefactos efectivos. | Trazabilidad |
| `docs/platform/specs/003-inicializacion-segura-proyecto/validation-report.md` | Registrar entrega, pruebas, desviaciones y aceptación separada. | AC-01 a AC-11 |

Los archivos del proyecto derivado enumerados en el diseño son salidas de la herramienta durante sus pruebas sobre fixtures temporales; no se personalizará la propia plantilla durante la implementación.

## Trazabilidad prevista

| Requisito o criterio | Implementación prevista | Prueba o validación prevista |
| --- | --- | --- |
| REQ-01 / AC-01 / AC-02 | `project.schema.json`, `config.ts` | Configuración apta aceptada; decisión ausente o no apta bloqueada sin cambios. |
| REQ-02 / AC-01 / AC-03 | `config.ts`, ejemplo y esquema | Campos, pendientes, locales, nombres y claves secretas válidos e inválidos. |
| REQ-03 / AC-04 / AC-05 | `managed-files.ts`, `init.ts` | Snapshot antes/después del preview y rechazo de token ausente, caducado o de otro destino. |
| REQ-04 / AC-06 | `project.ts`, manifiesto | Remoto fuente, destino no baseline, traversal y symlinks externos rechazados. |
| REQ-05 / AC-05 | `managed-files.ts` | Golden tests de cada salida y coherencia entre paquete, HTML, Vite, i18n, pruebas y docs. |
| REQ-06 / AC-03 / AC-09 | `transaction.ts` | Validación previa, fallo inyectado, rollback, diario interrumpido y recuperación segura. |
| REQ-07 / AC-07 / AC-08 | estado, manifiesto y `project.ts` | Repetición no-op y rechazo de configuración o contenido divergente. |
| REQ-08 / AC-05 | `init.ts` y pruebas CLI | Sin procesos de instalación, escrituras Git ni red; resumen separa próximos pasos. |
| REQ-09 / AC-10 | `diagnostics.ts`, `doctor.ts` | Hallazgos conocidos y snapshot de contenido, modo, `mtime`, entradas y Git sin cambios. |
| REQ-10 / AC-10 / AC-11 | reglas de secretos y `output.ts` | Resultados `UNKNOWN`, límites visibles y ausencia de valores sensibles en salida. |
| REQ-11 / AC-04 / AC-10 | `output.ts`, entrypoints | Orden estable, formatos humano/JSON y códigos de salida `0`, `1` y `2`. |

## Dependencias e instalaciones

- Ninguna dependencia nueva.
- No se ejecutará instalación durante la implementación salvo autorización separada si el estado real del repositorio la hiciera imprescindible; el plan parte del lockfile existente.

## Estrategia de pruebas

- Unitarias: Vitest en entorno Node para validadores, canonicalización, hashes, rutas, renderizado y clasificación de diagnósticos.
- Integración: proyectos fixture creados bajo un directorio temporal; preview, apply, no-op, conflicto, fallo inyectado, recuperación y doctor.
- CLI: procesos Node reales sobre fixtures, verificando argumentos, formatos, redacción de datos y códigos de salida.
- Componentes/hooks: no aplica; no se modifica React.
- HTTP/MSW: no aplica; las herramientas no usarán red.
- Regresión: pruebas actuales de React, lint, type-check, build y cobertura de `src` y `tools`.
- Manuales: ejecutar preview y doctor sobre la propia plantilla únicamente en modo de lectura; no aplicar la inicialización al repositorio fuente.

## Tareas

1. Crear esquema, ejemplo, tipos y manifiesto de baseline con hashes verificados.
2. Incorporar la herramienta al type-check y configurar sus scripts sin dependencias nuevas.
3. Implementar validación de configuración, puerta de idoneidad y representación explícita de pendientes.
4. Implementar resolución segura del destino, comprobación del origen y límites de rutas y symlinks.
5. Implementar renderizado en memoria, clasificación de operaciones y token de previsualización.
6. Implementar transacción, rollback, diario, estado final, repetición no-op y recuperación explícita.
7. Implementar diagnósticos de solo lectura, salida humana/JSON y códigos de salida.
8. Añadir pruebas unitarias, de integración y CLI trazadas a AC-01–AC-11.
9. Documentar uso y límites en README y AGENTS sin personalizar la baseline.
10. Ejecutar todas las validaciones y registrar resultados y desviaciones en `validation-report.md` como `IMPLEMENTED`.

## Riesgos, reversión y validación

- Riesgo: los hashes de baseline exigen actualizar deliberadamente el manifiesto cuando cambie un archivo gestionado; una prueba verificará cualquier divergencia.
- Riesgo: la protección por remoto no cubre copias sin Git; en ese caso se exige evidencia explícita, pero no puede demostrarse externamente que la declaración humana sea cierta.
- Riesgo: una interrupción no capturable puede dejar una transacción parcial; el marcador final seguirá ausente y el diario bloqueará nuevas aplicaciones hasta recuperación expresa.
- Riesgo: JSON Schema y validación propia podrían divergir; fixtures de contrato ejecutarán los mismos casos contra ambas representaciones comprobables sin introducir un runtime externo.
- Riesgo: los nombres de archivos secretos y patrones conocidos nunca prueban ausencia total; el doctor lo informará como alcance limitado.
- Reversión de la implementación: retirar scripts y `tools/template/`, revertir ajustes de configuración y documentación, y conservar el informe como evidencia histórica; no tocar proyectos externos.
- Reversión en un proyecto derivado: antes del estado final, rollback automático o `--recover`; después de una aplicación completada, cualquier cambio de identidad será un alcance SDD nuevo y no una reversión implícita.
- Comandos de validación: `npm run lint`, `npm run test`, `npm run test:coverage`, `npm run build` y `npm run check`; pruebas CLI adicionales quedarán incluidas en `npm run test`.
- Evidencias necesarias para pasar a `IMPLEMENTED`: matriz AC-01–AC-11 con pruebas, resultados de los comandos, cobertura de `tools/`, comprobación de preview y doctor sin escritura, demostración de no-op, conflicto, rollback y recuperación, y lista de desviaciones.
- Evidencias necesarias para pasar a `VALIDATED`: informe en `IMPLEMENTED`, criterios contrastados, revisión de límites conocidos y aceptación expresa del usuario.

## Puerta documental

La aprobación de esta versión limita el alcance implementable a los cambios enumerados. La implementación requiere autorización expresa y se registra en un `validation-report.md` separado. No autoriza commit ni publicación.
