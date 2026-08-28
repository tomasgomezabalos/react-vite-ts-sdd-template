# PLAT-003 — Inicialización segura de proyectos derivados

**Estado documental:** APPROVED

**Versión:** 1.0.0

**Fecha:** 2026-08-28

**Aprobado por:** Tomás, usuario solicitante

**Fecha de aprobación:** 2026-08-28

**Evidencia de aprobación:** Aprobación expresa registrada en la conversación de trabajo.

**Clasificación:** FULL

## Relaciones y vigencia

- Visión de producto: no aplica; esta capacidad pertenece a la plataforma reutilizable y no define el producto derivado.
- Decisiones relacionadas: ADR-0009 y ADR-0010.
- Artefactos modificados o sustituidos: ninguno.

## Problema y resultado esperado

La derivación manual de la plantilla puede conservar nombres, idiomas, metadatos o decisiones de despliegue que pertenecen a la baseline. También puede iniciar un proyecto cuya necesidad no encaje con una SPA renderizada en cliente.

La persona responsable necesita preparar una configuración revisable, comprobar por adelantado su efecto, aplicarla una sola vez sobre una copia derivada apta y verificar después la coherencia del proyecto sin que el diagnóstico modifique archivos.

## Alcance

- Evaluar y registrar la idoneidad de la SPA cliente antes de inicializar el proyecto.
- Definir una entrada declarativa validable, revisable y libre de secretos para la derivación.
- Previsualizar todos los cambios que realizaría la inicialización sin escribir archivos.
- Aplicar de forma coherente la identidad y las decisiones iniciales aprobadas.
- Detectar una inicialización previa y evitar sobrescrituras accidentales.
- Diagnosticar de forma reproducible la coherencia básica del proyecto mediante `template:doctor`.
- Proporcionar resultados comprensibles para personas y códigos de salida utilizables en automatización.

## Fuera de alcance

- Elegir automáticamente una arquitectura alternativa cuando la SPA no sea idónea.
- Inventar requisitos de producto o completar valores no proporcionados.
- Instalar o actualizar dependencias.
- Crear, borrar o reescribir historial, ramas o remotos Git.
- Ejecutar commit, push, merge, despliegue o publicación.
- Crear credenciales, secretos, cuentas, repositorios remotos o infraestructura.
- Corregir automáticamente los problemas detectados por `template:doctor`.
- Reconfigurar un proyecto ya inicializado con valores diferentes.
- Garantizar la ausencia absoluta de secretos o vulnerabilidades mediante comprobaciones heurísticas.

## Flujo principal

1. La persona responsable copia o deriva la plantilla y selecciona expresamente el directorio de destino.
2. Evalúa la idoneidad de la SPA y prepara la configuración de inicialización con valores explícitos o pendientes justificados.
3. Ejecuta la validación y previsualización; el proceso informa de errores, advertencias y archivos que cambiarían sin modificar el proyecto.
4. Revisa la previsualización y solicita de forma explícita la aplicación con la misma configuración validada.
5. La inicialización verifica de nuevo el contexto y aplica el conjunto aprobado de cambios sin realizar operaciones externas.
6. El proceso informa del resultado, los archivos modificados y las comprobaciones o decisiones aún pendientes.
7. La persona responsable ejecuta `template:doctor` para obtener un diagnóstico de solo lectura y resolver manualmente los hallazgos que procedan.

## Requisitos

### REQ-01 — Puerta de idoneidad

La configuración deberá registrar una decisión explícita sobre la idoneidad de la SPA cliente y el resultado de evaluar SEO e HTML previo a JavaScript, SSR o SSG, React Server Components, rutas de servidor, integración full stack, rendimiento inicial, alojamiento y plataformas soportadas.

La aplicación deberá bloquearse cuando la evaluación concluya que la baseline no es idónea o cuando falte una decisión necesaria. Un aspecto podrá quedar pendiente únicamente si incluye responsable o condición de resolución y no impide comenzar de forma segura.

### REQ-02 — Configuración declarativa y validable

La inicialización deberá consumir una representación declarativa que pueda revisarse antes de cualquier escritura y que contenga, como mínimo:

- nombre visible, nombre de paquete y título HTML;
- idioma predeterminado, fallback i18n y atributo `lang`;
- visión de producto o referencia al artefacto que la contendrá;
- decisión de idoneidad y evaluación asociada;
- navegadores y dispositivos soportados;
- alojamiento, ruta base y fallback de SPA;
- entornos y nombres de variables públicas permitidas;
- repositorio, visibilidad, licencia y estrategia de historial, o su no aplicabilidad justificada;
- comandos y puerta de calidad iniciales.

Los valores deberán validarse en conjunto antes de escribir. La configuración no admitirá secretos ni valores de credenciales.

### REQ-03 — Previsualización obligatoria

El proceso deberá ofrecer un modo de previsualización que no modifique archivos, metadatos del sistema de archivos, dependencias, Git ni servicios externos. La previsualización mostrará el directorio de destino, cada archivo que se crearía o modificaría, el tipo de cambio y los errores o pendientes que bloqueen la aplicación.

Una aplicación no podrá ejecutarse con una configuración distinta de la última configuración validada y previsualizada dentro de esa ejecución o flujo verificable.

### REQ-04 — Aplicación limitada al destino

La inicialización solo podrá escribir dentro del proyecto derivado seleccionado expresamente. Antes de aplicar comprobará que el destino tiene la estructura reconocible de la plantilla, que no es el repositorio fuente protegido y que no contiene una inicialización incompatible o contenido de producto que pudiera sobrescribirse.

Las rutas de la configuración no podrán escapar del destino mediante rutas absolutas, segmentos ascendentes ni enlaces simbólicos resolubles fuera de él.

### REQ-05 — Actualización coherente de identidad y decisiones

La aplicación actualizará de forma consistente los artefactos aprobados que representen identidad, metadatos, idiomas, visión, configuración de despliegue y documentación inicial. Como mínimo deberá mantener coherentes `package.json`, `package-lock.json`, `index.html`, la configuración y recursos i18n, el README y los artefactos SDD creados para el producto derivado.

El resultado no deberá conservar placeholders o identificadores de la plantilla dentro del conjunto de patrones y archivos que la herramienta declare comprobar.

### REQ-06 — Aplicación completa y fallo seguro

Todos los errores detectables deberán resolverse antes de iniciar escrituras. Si la aplicación no puede completar el conjunto previsto, deberá terminar con error, identificar el punto de fallo y evitar presentar el proyecto como inicializado correctamente.

El diseño técnico deberá definir y probar cómo se evita o recupera un estado parcialmente aplicado sin eliminar contenido previo del usuario.

### REQ-07 — Repetición segura y protección de contenido

Una repetición con la misma configuración sobre un proyecto inicializado correctamente deberá producir un resultado sin cambios y exitoso. Una repetición con valores diferentes o sobre contenido de producto incompatible deberá rechazarse, explicar el motivo y remitir a un cambio aprobado específico; no ofrecerá una sobrescritura implícita.

### REQ-08 — Límites operativos

La inicialización no instalará dependencias, no ejecutará scripts de paquetes ajenos a su propia validación, no modificará Git ni realizará operaciones de red, commit, publicación o despliegue.

El resumen final diferenciará claramente los cambios aplicados de los siguientes pasos opcionales que requieren autorización separada.

### REQ-09 — Diagnóstico de solo lectura

`template:doctor` no modificará el contenido ni los metadatos del proyecto, Git o servicios externos. Inspeccionará, como mínimo:

- placeholders e identificadores residuales conocidos;
- coherencia del nombre y versión entre el manifiesto del paquete y el lockfile;
- título HTML, atributo `lang`, idioma predeterminado y fallback i18n;
- versión Node declarada y versión efectiva cuando sea observable;
- existencia y estado de la visión y de los documentos SDD requeridos;
- separación entre documentación de plataforma y producto;
- alojamiento, ruta base, fallback de SPA y variables públicas declaradas cuando apliquen;
- nombres o archivos de secretos conocidos dentro del alcance declarado.

Cada comprobación devolverá un estado verificable de éxito, advertencia, error o no comprobado, junto con su motivo y la ruta afectada cuando corresponda.

### REQ-10 — Comunicación honesta del diagnóstico

`template:doctor` declarará el alcance y las limitaciones de sus comprobaciones. No afirmará la ausencia absoluta de secretos, vulnerabilidades o requisitos incumplidos cuando solo haya evaluado patrones conocidos o información observable.

### REQ-11 — Salida determinista

La previsualización, aplicación y diagnóstico producirán una salida legible con resumen y códigos de salida documentados. Los mismos archivos y configuración deberán producir la misma clasificación de hallazgos, salvo datos efectivos identificados explícitamente como dependientes del entorno.

Los errores o bloqueos devolverán un código distinto de cero. Las advertencias no se presentarán como validación completa.

## Escenarios y criterios de aceptación

### AC-01 — Proyecto apto y configuración válida

**Requisitos relacionados:** REQ-01, REQ-02

- **Dado** un proyecto derivado sin inicializar y una evaluación completa que confirma la idoneidad de la SPA
- **Cuando** se valida una configuración con todos los campos obligatorios y sin secretos
- **Entonces** la configuración queda preparada para previsualización sin modificar el proyecto

### AC-02 — Arquitectura no idónea

**Requisitos relacionados:** REQ-01

- **Dado** que la evaluación confirma una necesidad incompatible con la SPA cliente
- **Cuando** se intenta preparar o aplicar la inicialización
- **Entonces** el proceso se bloquea, explica la incompatibilidad y no escribe archivos

### AC-03 — Entrada inválida o secreta

**Requisitos relacionados:** REQ-02, REQ-06

- **Dado** que la configuración contiene un nombre de paquete inválido, una incoherencia o un campo reconocido como secreto
- **Cuando** se valida o previsualiza
- **Entonces** se muestran los errores, se devuelve un resultado fallido y no se modifica el proyecto

### AC-04 — Previsualización sin efectos laterales

**Requisitos relacionados:** REQ-03, REQ-11

- **Dado** un proyecto derivado y una configuración válida
- **Cuando** se ejecuta la previsualización
- **Entonces** se enumeran de forma determinista los archivos y tipos de cambio previstos sin alterar contenido, metadatos, Git ni servicios externos

### AC-05 — Aplicación coherente

**Requisitos relacionados:** REQ-03, REQ-05, REQ-06, REQ-08

- **Dado** que la configuración válida ha sido previsualizada y el proyecto continúa en el mismo estado compatible
- **Cuando** se solicita expresamente la aplicación
- **Entonces** se actualizan todos los artefactos aprobados, se registra el resultado y no se instalan dependencias ni se realizan operaciones Git, de red o publicación

### AC-06 — Destino inseguro

**Requisitos relacionados:** REQ-04

- **Dado** un destino que es la plantilla fuente protegida, no tiene una estructura reconocible o permitiría escribir fuera de su raíz
- **Cuando** se intenta previsualizar o aplicar
- **Entonces** la operación se rechaza con un motivo verificable y no modifica archivos

### AC-07 — Repetición con la misma configuración

**Requisitos relacionados:** REQ-07

- **Dado** un proyecto inicializado correctamente
- **Cuando** se repite el proceso con la misma configuración
- **Entonces** finaliza correctamente, informa que no hay cambios y conserva intactos los archivos

### AC-08 — Repetición incompatible

**Requisitos relacionados:** REQ-07

- **Dado** un proyecto ya inicializado o con contenido de producto que difiere de los valores previstos
- **Cuando** se intenta aplicar una configuración diferente
- **Entonces** la operación se rechaza sin sobrescribir contenido y solicita un cambio aprobado específico

### AC-09 — Fallo durante la aplicación

**Requisitos relacionados:** REQ-06

- **Dado** un fallo controlado al aplicar uno de los cambios previstos
- **Cuando** la inicialización no puede completar el conjunto
- **Entonces** devuelve error, identifica el fallo, no declara el proyecto inicializado y conserva o recupera el contenido previo según el mecanismo aprobado en el plan

### AC-10 — Diagnóstico reproducible y de solo lectura

**Requisitos relacionados:** REQ-09, REQ-10, REQ-11

- **Dado** un proyecto con hallazgos conocidos y una instantánea verificable de sus archivos y metadatos
- **Cuando** se ejecuta `template:doctor`
- **Entonces** clasifica cada comprobación, explica sus límites, devuelve el código correspondiente y deja sin cambios la instantánea observada

### AC-11 — Información no comprobable

**Requisitos relacionados:** REQ-09, REQ-10

- **Dado** que una decisión o propiedad no puede comprobarse con los datos locales disponibles
- **Cuando** se ejecuta `template:doctor`
- **Entonces** se informa como no comprobada o pendiente, sin convertirla en éxito ni afirmar su cumplimiento

## Requisitos transversales aplicables

- Accesibilidad: no aplica a una herramienta de línea de comandos sin interfaz gráfica; la salida no dependerá exclusivamente del color.
- Navegadores y dispositivos: no aplica; la ejecución deberá ser compatible con los sistemas y la versión Node declarados por la plantilla.
- Responsive: no aplica por no existir interfaz visual.
- Internacionalización: los mensajes de la herramienta podrán adoptar inicialmente el idioma de mantenimiento de la plantilla; la configuración deberá validar cualquier locale BCP 47 que el proyecto declare soportar.
- Carga, vacío y error: se deberán cubrir configuración ausente, vacía, inválida, proyecto incompatible, fallo de escritura y comprobación no disponible.
- Seguridad y privacidad: no se aceptarán secretos en la configuración; no habrá red ni escritura fuera del destino; las comprobaciones heurísticas declararán sus límites.
- Rendimiento: la herramienta deberá recorrer únicamente el proyecto seleccionado y excluir dependencias, artefactos de build y metadatos Git salvo comprobaciones explícitas; no se fija presupuesto temporal hasta disponer de medición de referencia.
- Observabilidad: cada ejecución devolverá resumen, hallazgos accionables y código de salida sin registrar secretos ni contenido sensible completo.
- Despliegue: la herramienta no desplegará; validará que la decisión sobre ruta base y fallback SPA esté declarada cuando aplique.

## Supuestos, riesgos y cuestiones abiertas

- **Supuesto:** la inicialización se ejecutará sobre una copia o repositorio derivado que conserve una estructura reconocible de esta plantilla.
- **Supuesto:** Node será el único runtime necesario para ejecutar las herramientas de plataforma.
- **Riesgo:** detectar automáticamente “contenido de producto” puede producir falsos positivos o negativos; el plan deberá definir marcadores y límites comprobables.
- **Riesgo:** garantizar recuperación ante fallos de escritura varía entre sistemas de archivos; el plan deberá escoger un mecanismo probado y declarar sus límites.
- **Abierta:** el plan técnico decidirá el formato y ubicación de la configuración, los comandos npm, el marcador de inicialización y la tabla exacta de archivos y campos gestionados.
- **Abierta:** el plan técnico decidirá si existe una salida estructurada adicional a la salida humana, sin reducir los diagnósticos exigidos.

## Puerta documental

La aprobación de esta versión autoriza preparar el plan técnico y, si aparece una decisión arquitectónica duradera no cubierta por ADR-0010, el ADR correspondiente. No autoriza implementar scripts, modificar dependencias, ejecutar commit ni publicar cambios. La ejecución y sus evidencias se registrarán por separado mediante `validation-report.md`.
