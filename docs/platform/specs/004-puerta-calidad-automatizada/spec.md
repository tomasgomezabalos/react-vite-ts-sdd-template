# PLAT-004 — Puerta de calidad automatizada

**Estado documental:** APPROVED

**Versión:** 1.0.0

**Fecha:** 2026-08-28

**Aprobado por:** Tomás, usuario solicitante

**Fecha de aprobación:** 2026-08-28

**Evidencia de aprobación:** Aprobación expresa registrada en la conversación de trabajo.

**Clasificación:** FULL

## Relaciones y vigencia

- Visión de producto: no aplica; esta capacidad pertenece a la plataforma reutilizable y no define el producto derivado.
- Decisiones relacionadas: ADR-0001, ADR-0002, ADR-0008, ADR-0009, ADR-0010 y ADR-0011.
- Capacidades relacionadas: PLAT-003, que debe declarar y diagnosticar la puerta heredada sin duplicar su implementación.
- Artefactos modificados o sustituidos: la composición actual de `npm run check` y el rango de runtime declarado, conforme a ADR-0011; ninguna especificación funcional anterior.

## Problema y resultado esperado

La plantilla permite ejecutar lint, pruebas, cobertura y build, pero no dispone de una única puerta que proteja además la integridad documental y los límites arquitectónicos. La versión Node efectiva puede diferir de `.nvmrc`, la cobertura puede descender sin hacer fallar la ejecución y una revisión manual puede no detectar enlaces rotos o dependencias prohibidas entre capas.

La persona que mantiene la plantilla o un proyecto derivado necesita un solo comando local, reproducido por CI, que falle de forma temprana y accionable cuando el runtime, el código, las pruebas, la cobertura, la documentación, la arquitectura o el build incumplan el contrato vigente.

## Alcance

- Declarar y comprobar de forma coordinada las versiones Node y npm de la baseline.
- Consolidar lint, integridad documental, límites arquitectónicos, pruebas con cobertura y build bajo `npm run check`.
- Validar enlaces e invariantes estructurales de la documentación SDD sin modificarla ni inferir decisiones humanas.
- Validar automáticamente las dependencias de capas y propietarios definidas por ADR-0008.
- Aplicar umbrales globales de cobertura coherentes con la línea base aprobada.
- Ejecutar la misma puerta mediante un workflow mínimo de GitHub Actions.
- Proporcionar diagnósticos deterministas y pruebas positivas y negativas de los nuevos comprobadores.

## Fuera de alcance

- Modificar requisitos funcionales, arquitectura o documentación para hacer pasar una comprobación.
- Aprobar artefactos, validar entregas o inventar evidencias automáticamente.
- Comprobar semánticamente que una especificación sea correcta, completa o jurídicamente suficiente.
- Validar enlaces web mediante peticiones de red.
- Analizar imports construidos dinámicamente como si su destino fuera conocido.
- Introducir límites de cobertura por archivo en esta primera versión.
- Añadir `npm audit`, análisis remoto de vulnerabilidades, SAST, Dependabot u otros controles de seguridad dinámicos.
- Desplegar, publicar paquetes, modificar Git o utilizar secretos desde el workflow de calidad.
- Añadir dependencias cuando Node, npm, TypeScript y las herramientas ya instaladas cubran el alcance aprobado.
- Migrar automáticamente proyectos derivados existentes.

## Flujo principal

1. La persona responsable utiliza Node `22.23.2` y npm `10.9.8`, instala las dependencias bloqueadas y ejecuta `npm run check`.
2. La puerta comprueba lint, documentación, arquitectura, pruebas con cobertura y build en una secuencia única.
3. Cada comprobador devuelve un resultado determinista e identifica regla, archivo y ubicación cuando dispone de ella.
4. La ejecución se detiene con error cuando cualquier etapa incumple su contrato y no presenta las etapas pendientes como superadas.
5. En GitHub, un push a la rama principal o una pull request ejecuta `npm ci` y delega la calidad en el mismo `npm run check`.
6. La persona responsable corrige el incumplimiento mediante el flujo SDD que corresponda y repite la puerta completa.

## Requisitos

### REQ-01 — Runtime coherente y comprobable

La plantilla deberá declarar de forma coherente Node `22.23.2` y npm `10.9.8` como versiones exactas de trabajo y CI, junto con los rangos compatibles aprobados en ADR-0011. Los comandos ejecutados con la versión npm soportada deberán fallar antes de iniciar sus scripts cuando el runtime o el gestor no satisfagan la política efectiva; el diagnóstico de PLAT-003 seguirá informando además de la versión efectiva observable.

El lockfile será obligatorio y las instalaciones limpias o de CI utilizarán `npm ci`. Una actualización de runtime deberá mantener sincronizadas todas sus declaraciones y evidencias.

### REQ-02 — Una única puerta completa

`npm run check` será la fuente de verdad local y de CI. Deberá ejecutar, sin duplicar la suite, lint, comprobación documental, comprobación arquitectónica, pruebas con cobertura y build de producción.

Un fallo en cualquier etapa devolverá un código distinto de cero. La salida no deberá afirmar que las etapas posteriores se ejecutaron o superaron cuando la secuencia se haya detenido antes.

### REQ-03 — Integridad de enlaces Markdown locales

`npm run docs:check` deberá recorrer los documentos Markdown gestionados por el repositorio y comprobar que cada enlace local apunta a un archivo, directorio o ancla existente.

La comprobación no realizará peticiones de red para validar enlaces externos. Excluirá dependencias, metadatos Git, cobertura, build y otros artefactos generados definidos explícitamente. Los enlaces que no puedan interpretarse de forma determinista deberán producir un diagnóstico, no un éxito supuesto.

### REQ-04 — Contrato estructural SDD

`npm run docs:check` deberá comprobar como mínimo:

- existencia de los índices de SDD, arquitectura, plataforma y producto;
- existencia de la constitución, workflow, política de cambios y plantillas obligatorias vigentes;
- referencia desde cada índice a los artefactos vigentes que le correspondan;
- uso de los vocabularios de estado documental y de entrega definidos por ADR-0009 en los artefactos sujetos al modelo actual;
- ausencia de placeholders obligatorios sin resolver en artefactos nuevos marcados `APPROVED`.

Las plantillas, ejemplos declarados y documentos históricos anteriores a ADR-0009 tendrán excepciones explícitas. El comprobador no cambiará estados, no verificará quién aprobó realmente un documento y no sustituirá una revisión de contenido.

### REQ-05 — Límites arquitectónicos automatizados

`npm run architecture:check` deberá analizar los imports estáticos, las reexportaciones y los `import()` con especificador literal dentro de `src/`, resolviendo rutas relativas y aliases configurados.

Deberá hacer cumplir:

- dirección `app → pages → features → entities → shared` sin exigir capas intermedias;
- prohibición de imports ascendentes desde `shared`, `entities` y `features`;
- prohibición de que una página importe otra página;
- confinamiento de módulos privados dentro de su propietario;
- tratamiento de `src/main.tsx` como raíz de composición;
- tratamiento transitorio de `src/i18n/` y `src/locales/` como infraestructura compartida existente.

Un `import()` cuyo destino no sea un literal estático dentro del código analizado deberá fallar con un diagnóstico de alcance no comprobable. La herramienta no presentará como válida una dependencia que no haya podido resolver.

### REQ-06 — Cobertura mínima protegida

Las pruebas con cobertura deberán incluir el código ejecutable de `src/**/*.{ts,tsx}` y `tools/**/*.ts` y aplicar estos umbrales globales:

| Métrica | Umbral mínimo |
| --- | ---: |
| Statements | 70 % |
| Branches | 55 % |
| Functions | 75 % |
| Lines | 75 % |

Podrán excluirse declaraciones, módulos exclusivamente de tipos, pruebas, fixtures generados y otros artefactos no ejecutables identificados explícitamente. No se excluirá código por estar insuficientemente probado y los umbrales no se actualizarán automáticamente durante una ejecución.

### REQ-07 — Diagnósticos deterministas y no mutantes

`docs:check` y `architecture:check` deberán ser de solo lectura respecto al repositorio. Con los mismos archivos y configuración producirán la misma clasificación y orden de resultados.

Cada incumplimiento indicará como mínimo un código de regla, el archivo afectado y un mensaje accionable; añadirá línea y columna cuando puedan determinarse. La ausencia de incumplimientos devolverá código `0`; cualquier incumplimiento bloqueante devolverá un código distinto de cero.

### REQ-08 — Cobertura de pruebas de los comprobadores

Los nuevos comprobadores tendrán pruebas positivas y negativas que cubran, como mínimo:

- repositorio documental válido, archivo local ausente, ancla ausente, estado inválido y placeholder no resuelto en un artefacto aprobado;
- dependencia descendente válida, import ascendente, import entre páginas, acceso a módulo privado, alias resuelto e import dinámico no comprobable;
- estabilidad del orden de diagnósticos, códigos de salida y ausencia de modificaciones en los fixtures.

Las pruebas reflejarán bajo `tests/` la estructura propietaria de las herramientas y no dependerán de red ni del estado Git externo.

### REQ-09 — Workflow de calidad mínimo

El repositorio deberá proporcionar un workflow de GitHub Actions que, para pushes a la rama principal y pull requests:

- utilice un runner Linux hospedado por GitHub;
- conceda únicamente permiso `contents: read` al token;
- cancele ejecuciones anteriores sustituidas dentro de la misma rama o pull request;
- utilice la versión Node de `.nvmrc` y caché npm basada en el lockfile;
- ejecute `npm ci` y después `npm run check`;
- no utilice secretos, no despliegue y no publique.

Toda acción reutilizada deberá estar fijada a un SHA completo verificado de su repositorio oficial y conservar un comentario con su versión legible. La configuración no duplicará pasos internos de la puerta local.

### REQ-10 — Comunicación honesta de cobertura

La documentación deberá indicar qué comprueban y qué no comprueban la puerta, los analizadores y el workflow. Una ejecución correcta no se presentará como prueba de corrección funcional completa, ausencia de vulnerabilidades, validez jurídica, accesibilidad visual o compatibilidad con entornos no declarados.

La ejecución real del workflow solo podrá registrarse como evidencia cuando exista una publicación autorizada que la haya disparado; una inspección local del YAML no se presentará como ejecución en GitHub.

## Escenarios y criterios de aceptación

### AC-01 — Runtime correcto

**Requisitos relacionados:** REQ-01, REQ-02

- **Dado** un checkout con las dependencias bloqueadas y Node `22.23.2`/npm `10.9.8`
- **Cuando** se ejecuta `npm run check`
- **Entonces** la puerta puede iniciar su secuencia completa con las versiones declaradas de forma coherente

### AC-02 — Runtime incompatible

**Requisitos relacionados:** REQ-01

- **Dado** la versión npm soportada y un Node o gestor que no satisface la política exacta de desarrollo
- **Cuando** se intenta ejecutar un comando npm del proyecto
- **Entonces** la operación falla antes del script con un diagnóstico de runtime o gestor incompatible

### AC-03 — Puerta completa superada

**Requisitos relacionados:** REQ-02, REQ-06

- **Dado** que lint, documentación, arquitectura, pruebas, cobertura y build cumplen sus contratos
- **Cuando** se ejecuta `npm run check`
- **Entonces** cada etapa se ejecuta una sola vez, la cobertura respeta los cuatro umbrales y el comando finaliza con código `0`

### AC-04 — Fallo de una etapa

**Requisitos relacionados:** REQ-02, REQ-07

- **Dado** un incumplimiento controlado en una etapa de la puerta
- **Cuando** se ejecuta `npm run check`
- **Entonces** el comando devuelve error, conserva el diagnóstico original y no presenta las etapas no ejecutadas como superadas

### AC-05 — Documentación válida

**Requisitos relacionados:** REQ-03, REQ-04, REQ-07

- **Dado** un fixture con índices, estados, referencias, enlaces y anclas válidos
- **Cuando** se ejecuta el comprobador documental
- **Entonces** finaliza con código `0`, no utiliza red y no modifica el fixture

### AC-06 — Incumplimientos documentales

**Requisitos relacionados:** REQ-03, REQ-04, REQ-07, REQ-08

- **Dado** fixtures con un enlace local roto, un ancla ausente, un estado no permitido o un placeholder obligatorio en un artefacto aprobado
- **Cuando** se ejecuta el comprobador documental
- **Entonces** cada caso devuelve error e identifica de forma determinista regla, archivo y ubicación disponible

### AC-07 — Dependencias arquitectónicas válidas

**Requisitos relacionados:** REQ-05, REQ-07

- **Dado** un fixture que respeta la dirección de capas, los propietarios y los aliases configurados
- **Cuando** se ejecuta el comprobador arquitectónico
- **Entonces** finaliza con código `0` y no modifica el fixture

### AC-08 — Dependencias arquitectónicas prohibidas

**Requisitos relacionados:** REQ-05, REQ-07, REQ-08

- **Dado** fixtures con un import ascendente, un import entre páginas, acceso a un módulo privado o un `import()` no comprobable
- **Cuando** se ejecuta el comprobador arquitectónico
- **Entonces** cada incumplimiento devuelve error e identifica la regla y el origen afectado sin afirmar que el destino es válido

### AC-09 — Regresión de cobertura

**Requisitos relacionados:** REQ-06

- **Dado** una ejecución cuya cobertura queda por debajo de cualquiera de los umbrales aprobados
- **Cuando** finaliza `npm run test:coverage` o la puerta completa
- **Entonces** Vitest devuelve error y la regresión bloquea `npm run check`

### AC-10 — Workflow conforme

**Requisitos relacionados:** REQ-02, REQ-09, REQ-10

- **Dado** el workflow versionado de la plantilla
- **Cuando** se inspecciona su contrato y, tras una publicación autorizada, se dispara mediante push a la rama principal o pull request
- **Entonces** utiliza acciones fijadas a SHA, permisos mínimos, Node desde `.nvmrc`, caché npm, `npm ci` y un único `npm run check`, sin secretos, publicación ni despliegue

### AC-11 — Ejecución sustituida

**Requisitos relacionados:** REQ-09

- **Dado** una ejecución activa de la misma rama o pull request
- **Cuando** un cambio posterior dispara otra ejecución
- **Entonces** la ejecución anterior se cancela y solo la más reciente continúa como evidencia aplicable

### AC-12 — Límites comunicados

**Requisitos relacionados:** REQ-10

- **Dado** una puerta completa superada
- **Cuando** una persona consulta la documentación operativa
- **Entonces** puede distinguir las garantías automatizadas de las revisiones funcionales, visuales, de seguridad y jurídicas que siguen requiriendo evidencia separada

## Requisitos transversales aplicables

- Accesibilidad: no aplica a una interfaz gráfica; la salida de terminal no dependerá exclusivamente del color y conservará texto legible.
- Navegadores y dispositivos: no aplica a los comprobadores; el build seguirá cubriendo los navegadores declarados por cada proyecto.
- Responsive: no aplica por no existir interfaz visual.
- Internacionalización: los diagnósticos podrán mantenerse en el idioma de mantenimiento de la plantilla; no inspeccionarán semánticamente traducciones salvo invariantes documentales aprobadas.
- Carga, vacío y error: se cubrirán repositorio sin archivos aplicables, configuración ausente, ruta o alias no resoluble, documento vacío y múltiples incumplimientos simultáneos.
- Seguridad y privacidad: los comprobadores no usarán red, no ejecutarán contenido Markdown, no mostrarán secretos completos y no escribirán en los archivos analizados; el workflow tendrá permisos mínimos y ninguna credencial adicional.
- Rendimiento: las herramientas excluirán dependencias y artefactos generados; no se fija presupuesto temporal hasta disponer de una medición estable, pero la salida deberá identificar el alcance recorrido.
- Observabilidad: cada fallo proporcionará regla, archivo, mensaje y ubicación disponible; CI conservará el resultado del comando sin sustituirlo por una conclusión genérica.
- Despliegue: el workflow no desplegará; su ejecución en GitHub dependerá de una publicación autorizada por separado.

## Supuestos, riesgos y cuestiones abiertas

- **Supuesto:** GitHub continuará siendo el proveedor del repositorio plantilla; `npm run check` permanecerá utilizable en otros proveedores.
- **Supuesto:** TypeScript `~6.0.2` ofrece la API necesaria para analizar los imports del alcance aprobado.
- **Riesgo:** el algoritmo de anclas Markdown puede diferir entre renderizadores; el plan deberá definir una normalización compatible con GitHub y probar caracteres repetidos o acentuados.
- **Riesgo:** un comprobador arquitectónico propio puede quedar desalineado tras una actualización mayor de TypeScript o de aliases; las pruebas deberán detectar esa deriva.
- **Riesgo:** los umbrales globales permiten regresiones locales compensadas por mejoras en otros archivos; la primera versión acepta este límite de forma explícita.
- **Riesgo:** la prueba real de concurrencia y eventos de GitHub no puede completarse solo en local; deberá diferenciarse inspección, ejecución real y evidencia pendiente.
- **Abierta:** el plan técnico decidirá la estructura interna de los comprobadores, sus códigos de salida concretos y el formato de sus resultados.
- **Abierta:** el plan técnico enumerará los artefactos gobernados por ADR-0009, las excepciones históricas y los patrones excluidos de cada recorrido.
- **Abierta:** el plan técnico concretará qué fronteras privadas son detectables automáticamente sin ampliar las reglas de propiedad de ADR-0008.
- **Abierta:** el plan técnico definirá cómo se valida localmente la estructura del workflow sin presentar esa inspección como una ejecución remota.

## Puerta documental

La aprobación de esta versión autoriza preparar el plan técnico de PLAT-004 dentro de este alcance. ADR-0011 ya cubre las decisiones transversales necesarias. La aprobación no autoriza implementar scripts, modificar configuración o dependencias, crear el workflow, hacer commit ni publicar. La ejecución y sus evidencias se registrarán por separado mediante `validation-report.md`.
