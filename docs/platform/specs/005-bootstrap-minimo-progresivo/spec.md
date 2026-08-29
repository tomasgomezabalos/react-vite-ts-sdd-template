# PLAT-005 — Bootstrap mínimo y progresivo

**Estado documental:** APPROVED

**Versión:** 1.0.0

**Fecha:** 2026-08-29

**Aprobado por:** Tomás, usuario solicitante

**Fecha de aprobación:** 2026-08-29

**Evidencia de aprobación:** Aprobación expresa registrada en la conversación de trabajo.

**Clasificación:** FULL

## Relaciones y vigencia

- Visión de producto: no aplica; esta capacidad pertenece a la plataforma reutilizable y no define el producto derivado.
- Decisiones relacionadas: ADR-0009, ADR-0010 y ADR-0012 (`APPROVED`).
- Artefactos modificados o sustituidos: propone modificar para futuras derivaciones los requisitos REQ-01, REQ-02, REQ-05 y REQ-09 de PLAT-003 sin reescribir su especificación ni su validación históricas.

## Problema y resultado esperado

La inicialización vigente exige decisiones de producto y operación que todavía no existen y que no son necesarias para copiar la plantilla de forma segura. La persona usuaria necesita crear un proyecto nuevo indicando únicamente el destino y el nombre, revisar la identidad calculada y conservar todas las garantías de preview, aplicación transaccional, idempotencia y diagnóstico de solo lectura.

El resultado será una SPA técnicamente coherente y gobernada por SDD, pero sin visión, métricas, requisitos transversales ni decisiones de despliegue ficticias. Esos datos aparecerán después mediante las puertas SDD que realmente los necesiten.

## Alcance

- Derivar únicamente una copia nueva y reconocible de la plantilla canónica.
- Solicitar solo el destino absoluto y el nombre visible del proyecto.
- Proponer un nombre npm determinista y permitir confirmarlo o corregirlo antes del preview.
- Mantener `project.config.json` como contrato declarativo mínimo de identidad.
- Aplicar valores técnicos heredados o deterministas sin convertirlos en preguntas.
- Eliminar del bootstrap los campos de producto, arquitectura detallada, soporte, despliegue, entornos, repositorio y calidad.
- No generar visión de producto ni decisiones pendientes durante la inicialización.
- Mantener preview, token, transacción, rollback, recuperación, idempotencia y límites operativos.
- Limitar `template:doctor` a la coherencia técnica observable del proyecto derivado.
- Mantener el descubrimiento y la evolución posterior bajo el flujo SDD vigente.

## Fuera de alcance

- Adoptar, migrar o reconfigurar un proyecto preexistente.
- Elegir automáticamente una arquitectura distinta de la SPA cliente heredada.
- Personalizar durante el bootstrap título, versión, idiomas, base path, soporte, entornos, alojamiento, variables, repositorio o licencia.
- Crear, completar o aprobar visión, features, ADR de producto o requisitos transversales.
- Reconfigurar mediante `template:init` un proyecto ya inicializado.
- Instalar dependencias o modificar Git, remotos, red, commit, publicación o despliegue.
- Corregir automáticamente hallazgos de `template:doctor`.
- Migrar proyectos derivados inicializados con la versión anterior del esquema.

## Flujo principal

1. La persona usuaria indica un destino absoluto para crear una copia nueva y el nombre visible del proyecto.
2. El flujo deriva la plantilla sin `.git`, `node_modules`, `dist` ni `coverage` y comprueba que el destino es seguro.
3. El flujo propone un nombre npm determinista, calcula el título HTML y muestra un resumen compacto de identidad y valores técnicos heredados.
4. La persona usuaria confirma o corrige únicamente el nombre npm.
5. Se genera un `project.config.json` mínimo, libre de secretos y revisable.
6. `template:init` valida destino, baseline y configuración y produce un preview determinista sin escribir.
7. La persona usuaria revisa operaciones y autoriza por separado la aplicación vinculada al token exacto.
8. La herramienta vuelve a comprobar el estado y aplica la inicialización transaccionalmente.
9. `template:doctor` inspecciona la coherencia técnica sin modificar archivos.
10. Visión, features y decisiones posteriores se crean únicamente cuando el flujo SDD aplicable las requiera.

## Requisitos

### REQ-01 — Derivación única desde la plantilla

El flujo solo admitirá como entrada una copia nueva de la baseline reconocida en un destino explícito. No preguntará el método de derivación ni aceptará un modo de adopción de proyectos existentes.

La comprobación técnica de estructura, hashes, origen y rutas sustituirá cualquier declaración humana persistente de evidencia de derivación.

### REQ-02 — Entrevista mínima

Antes del preview, el flujo solicitará únicamente el destino absoluto y el nombre visible. Propondrá de forma determinista el nombre npm y permitirá confirmarlo o corregirlo en el resumen previo.

No presentará preguntas sobre visión, métricas, arquitectura detallada, idiomas, soporte, despliegue, entornos, repositorio, licencia, historial o calidad.

### REQ-03 — Configuración mínima sin campos residuales

La versión nueva de `project.config.json` contendrá únicamente versión de esquema e identidad visible/npm, además de `$schema` como ayuda editorial opcional.

Los campos retirados no permanecerán en el esquema, ejemplo, validador, tipos de entrada, configuración normalizada expuesta, cuestionario, estado, warnings ni diagnóstico como opcionales, pendientes o placeholders.

La configuración no admitirá secretos, credenciales ni propiedades desconocidas.

### REQ-04 — Valores técnicos deterministas

La configuración efectiva utilizará versión inicial `0.1.0`, título HTML igual al nombre visible y los valores vigentes de idioma, recursos, ruta base, secretos y calidad heredados de la baseline.

La ausencia inicial de variables públicas no generará una decisión de producto ni exigirá crear un archivo vacío sin consumidor. Los valores efectivos participarán en el digest y el token cuando afecten a las salidas gestionadas.

### REQ-05 — Ausencia de producto ficticio

La inicialización no creará `specs/product-vision.md`, no insertará problema o contexto en README y no registrará métricas, responsables, condiciones de resolución ni decisiones pendientes.

El índice de `specs/` conservará una entrada genérica que dirija al flujo SDD sin afirmar que exista una visión o feature de producto.

### REQ-06 — Selección explícita de la baseline

Solicitar la derivación desde esta plantilla constituirá la selección explícita de su arquitectura SPA cliente. No será necesario registrar justificaciones individuales de SEO, SSR, SSG, RSC, backend, rendimiento o alojamiento.

Si la persona usuaria declara antes de aplicar una necesidad confirmada incompatible, el flujo detendrá la derivación y no escribirá. Las necesidades descubiertas después se resolverán mediante una decisión SDD antes del alcance afectado.

### REQ-07 — Seguridad e idempotencia preservadas

La simplificación de entradas no modificará las garantías aprobadas de PLAT-003 para preview sin escritura, token ligado al estado revisado, protección del origen y destino, rutas seguras, hashes, aplicación completa, rollback, recuperación expresa, no-op idempotente y rechazo de contenido o configuración divergentes.

La inicialización no instalará dependencias, no utilizará red y no modificará Git ni publicará.

### REQ-08 — Doctor técnico de solo lectura

`template:doctor` continuará siendo de solo lectura y diagnosticará únicamente propiedades técnicas que pertenezcan al contrato derivado u observe localmente.

La ausencia de visión, métricas, soporte, alojamiento, repositorio o decisiones eliminadas del bootstrap no producirá `FAIL`, `WARN` ni un pendiente histórico. El diagnóstico conservará estados deterministas, códigos de salida y límites explícitos para secretos y propiedades no observables.

### REQ-09 — Descubrimiento posterior gobernado por SDD

El proyecto derivado conservará las plantillas, constitución, workflow, política e histórico de plataforma. Una visión o decisión de producto se creará y aprobará únicamente cuando exista información real y el alcance SDD correspondiente la necesite.

Resolver o cambiar datos de producto no requerirá ni permitirá reejecutar el bootstrap con otra configuración.

### REQ-10 — Comunicación y autorizaciones separadas

El resumen previo mostrará destino, nombre visible, nombre npm propuesto, título y valores técnicos heredados relevantes. El preview mostrará token y operaciones sin contenido sensible.

Aplicación, recuperación, instalación, validación, Git, commit y publicación mantendrán sus autorizaciones independientes.

## Escenarios y criterios de aceptación

### AC-01 — Entrada mínima suficiente

**Requisitos relacionados:** REQ-01, REQ-02, REQ-03

- **Dado** un destino seguro y un nombre visible
- **Cuando** la persona confirma el nombre npm propuesto
- **Entonces** se obtiene una configuración válida sin solicitar ninguna decisión de producto u operación

### AC-02 — Contrato sin campos eliminados

**Requisitos relacionados:** REQ-03, REQ-05

- **Dado** el esquema, ejemplo, validador, tipos y cuestionario de la nueva versión
- **Cuando** se inspecciona su contrato aceptado
- **Entonces** no aparecen campos retirados como opcionales, pendientes, placeholders ni propiedades toleradas

### AC-03 — Identidad y defaults coherentes

**Requisitos relacionados:** REQ-04

- **Dado** un nombre visible y un nombre npm confirmados
- **Cuando** se construyen las salidas
- **Entonces** paquete, lockfile y título son coherentes y el resto de valores técnicos conserva la baseline declarada

### AC-04 — Sin artefactos de producto

**Requisitos relacionados:** REQ-05, REQ-09

- **Dado** un proyecto recién inicializado
- **Cuando** se inspeccionan README, `specs/`, configuración y estado
- **Entonces** no existe una visión generada, contenido de producto ficticio ni decisiones pendientes y el flujo SDD continúa disponible

### AC-05 — Incompatibilidad conocida

**Requisitos relacionados:** REQ-06

- **Dado** que antes del apply se declara un requisito confirmado incompatible con la SPA cliente
- **Cuando** se intenta continuar la derivación
- **Entonces** el flujo se detiene sin escribir y explica que debe elegirse otra arquitectura

### AC-06 — Preview y token preservados

**Requisitos relacionados:** REQ-07, REQ-10

- **Dado** un proyecto nuevo y una configuración mínima válida
- **Cuando** se ejecuta el preview
- **Entonces** se enumeran operaciones deterministas sin efectos laterales y el apply requiere el token del estado exacto revisado

### AC-07 — Aplicación segura e idempotente

**Requisitos relacionados:** REQ-07

- **Dado** un preview autorizado y un destino sin cambios posteriores
- **Cuando** se aplica y después se repite la misma inicialización
- **Entonces** la primera ejecución es transaccional y la repetición finaliza como no-op sin modificar contenido

### AC-08 — Conflicto y recuperación

**Requisitos relacionados:** REQ-07

- **Dado** contenido divergente, un token caducado o una transacción interrumpida
- **Cuando** se intenta aplicar o recuperar
- **Entonces** no se sobrescriben cambios desconocidos y cualquier recuperación exige el identificador y autorización correspondientes

### AC-09 — Doctor sin ruido de producto

**Requisitos relacionados:** REQ-08

- **Dado** un proyecto inicializado sin visión ni decisiones de producto
- **Cuando** se ejecuta `template:doctor`
- **Entonces** no existen fallos ni advertencias por esos datos ausentes y el proyecto permanece byte a byte y en Git sin cambios

### AC-10 — Puertas posteriores separadas

**Requisitos relacionados:** REQ-09, REQ-10

- **Dado** un bootstrap completado
- **Cuando** surge la primera necesidad de producto, instalación o publicación
- **Entonces** se aplica la puerta específica sin modificar la configuración histórica ni inferir autorización desde la inicialización

## Requisitos transversales aplicables

- Accesibilidad: no aplica a una herramienta CLI; la salida no dependerá exclusivamente del color.
- Navegadores y dispositivos: no aplica; la herramienta seguirá el runtime Node declarado por la baseline.
- Responsive: no aplica por no existir interfaz visual.
- Internacionalización: no se solicitará como decisión inicial; se conservará la configuración válida de la baseline.
- Carga, vacío y error: se cubrirán nombre o destino ausentes, nombre npm inválido, destino inseguro, conflicto, token incorrecto y transacción pendiente.
- Seguridad y privacidad: no se aceptarán propiedades desconocidas ni secretos; no habrá red, escrituras fuera del destino ni contenido sensible en la salida.
- Rendimiento: no se fija presupuesto; el recorrido permanecerá limitado a rutas gestionadas y diagnósticos declarados.
- Observabilidad: salida humana/JSON, códigos estables y errores accionables sin registrar secretos.
- Despliegue: no aplica al bootstrap; la baseline conserva su configuración técnica y el despliegue real se decidirá posteriormente.

## Supuestos, riesgos y cuestiones abiertas

- **Supuesto:** cada ejecución comienza desde la baseline canónica y crea un destino nuevo sin contenido de producto.
- **Supuesto:** el nombre npm puede proponerse mediante una normalización determinista y siempre será revisado antes del preview.
- **Riesgo:** conservar defaults técnicos puede requerir un cambio SDD posterior cuando aparezcan necesidades reales; esto es preferible a inventarlas durante la derivación.
- **Riesgo:** una nueva versión de esquema rompe compatibilidad de entrada; se limitará a futuras derivaciones y no migrará snapshots existentes.
- **Riesgo:** eliminar diagnósticos de producto podría interpretarse como validación del producto; la salida deberá declarar que `template:doctor` solo comprueba coherencia técnica.
- **Abierta:** ninguna decisión funcional bloquea la preparación del plan; el plan deberá concretar la normalización del nombre npm y el versionado interno del estado sin ampliar entradas humanas.

## Puerta documental

La aprobación de esta versión y de ADR-0012 autoriza preparar el plan técnico limitado a estos requisitos y criterios. No autoriza implementación, cambios en el skill, instalaciones, commit ni publicación. La ejecución y sus evidencias se registrarán por separado mediante `validation-report.md`.
