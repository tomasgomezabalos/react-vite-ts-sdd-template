# ADR-0009 — Ciclo de vida SDD y evidencias separadas

**Estado documental:** APPROVED

**Versión:** 1.0.0

**Fecha:** 2026-08-28

**Aprobado por:** Tomás, usuario solicitante

**Fecha de aprobación:** 2026-08-28

**Evidencia de aprobación:** Aprobación expresa registrada en la conversación de trabajo.

**Relación:** Modifica el modelo de estados de `docs/sdd/workflow.md` y precisa la trazabilidad definida en la constitución y en `docs/sdd/change-policy.md`; su aplicación documental requiere una puerta separada.

## Contexto

El workflow vigente utiliza una única propiedad `Estado` con valores como `DRAFT`, `APPROVED`, `IMPLEMENTED`, `VALIDATED`, `BLOCKED` y `SUPERSEDED`. Ese modelo mezcla dos responsabilidades diferentes:

- la vigencia y aprobación del contenido de una especificación, plan o ADR;
- el progreso de la entrega que utiliza esos documentos.

Como consecuencia, una especificación o un plan aprobados se editan posteriormente para registrar implementación, comandos, resultados y validación. El contenido aprobado y las evidencias operativas quedan unidos en el mismo archivo, la revisión aceptada no queda identificada de forma estable y una fecha de aprobación no permite conocer por sí sola quién aprobó qué versión ni dónde se registró esa decisión.

La plantilla también carece de formatos propios para ADR, cambios `QUICK`, visión de producto y validación. La especificación funcional y el plan técnico disponibles incluyen únicamente una fecha y un campo de aprobación pendiente, pero no versión, responsable ni evidencia de la puerta superada.

Se necesita separar el contrato aprobado de su ejecución sin convertir el proceso en una cadena documental artificial, manteniendo los flujos proporcionales `FULL`, `QUICK`, `DIRECT` y `ADR`.

## Decisión

### 1. Separar estado documental y estado de entrega

Los artefactos que definen intención, alcance o decisiones utilizarán `Estado documental`:

- `DRAFT`: contenido en preparación que todavía no vincula ni autoriza la etapa siguiente;
- `APPROVED`: contenido aprobado expresamente y vigente;
- `SUPERSEDED`: contenido sustituido por otro artefacto aprobado que se identifica de forma explícita.

El progreso de implementación y validación se registrará fuera de esos artefactos mediante `Estado de entrega`:

- `NOT_STARTED`: alcance aprobado todavía no implementado;
- `IMPLEMENTED`: alcance implementado con comprobaciones registradas, pendiente de aceptación;
- `VALIDATED`: criterios contrastados y resultado aceptado expresamente;
- `BLOCKED`: existe una cuestión concreta que impide avanzar;
- `NOT_APPLICABLE`: artefacto documental o decisión sin entrega ejecutable independiente.

`IN_PROGRESS` no será un estado persistente obligatorio. El trabajo en curso se observará en el plan operativo de la tarea, issue o conversación para evitar editar el repositorio en cada avance parcial.

### 2. Mantener estable el contenido aprobado

Una vez que una especificación, plan o ADR pase a `APPROVED`, no se modificará silenciosamente su significado para registrar progreso o incorporar alcance nuevo.

- La implementación y sus resultados se registrarán en un informe independiente.
- Un cambio observable pequeño utilizará un artefacto `QUICK` aprobado que identifique el requisito o criterio afectado y actúe como delta vigente.
- Un cambio significativo utilizará una nueva versión, enmienda o especificación `FULL` aprobada.
- Una decisión arquitectónica se modificará o sustituirá mediante otro ADR aprobado.
- Una corrección puramente editorial podrá aplicarse como `DIRECT` únicamente cuando no cambie significado, alcance, contrato ni decisión; se conservará su trazabilidad en el historial de cambios.

Cuando una sucesión de deltas dificulte conocer el contrato efectivo, se preparará una consolidación nueva en `DRAFT`, se aprobará expresamente y solo entonces se marcarán como `SUPERSEDED` los artefactos sustituidos.

### 3. Identificar la aprobación

Todo artefacto aprobado nuevo deberá registrar:

- `Estado documental`;
- `Versión`;
- `Fecha` de creación o revisión;
- `Aprobado por`;
- `Fecha de aprobación`;
- `Evidencia de aprobación`.

La evidencia podrá ser una referencia verificable a una conversación de trabajo, issue, pull request u otro registro utilizado por el proyecto. No se inventará un identificador ni se exigirá una URL cuando el sistema utilizado no la proporcione. Un commit podrá registrarse como referencia adicional después de existir, pero no sustituirá la aprobación expresa ni será obligatorio para aprobar contenido todavía no publicado.

Modificar el contenido sustantivo de un artefacto aprobado requerirá una nueva versión y una nueva aprobación conforme a su clasificación.

### 4. Separar implementación y validación

Los cambios `FULL` y los cambios `QUICK` que necesiten evidencia persistente utilizarán un `validation-report.md` asociado. El informe contendrá:

- alcance y versión aprobados;
- `Estado de entrega`;
- archivos finalmente modificados;
- relación entre criterios, pruebas y código;
- comandos y resultados;
- validaciones manuales o de navegador;
- desviaciones, riesgos residuales y cuestiones bloqueadas;
- fecha y evidencia de aceptación cuando pase a `VALIDATED`.

El paso a `IMPLEMENTED` registra que el trabajo y sus comprobaciones terminaron; no implica aceptación. El paso a `VALIDATED` exige contraste con los criterios y aceptación expresa. Commit y publicación continuarán siendo autorizaciones independientes y no se inferirán de ninguno de esos estados.

### 5. Mantener proporcionalidad por clasificación

#### FULL

Utilizará, como mínimo, especificación funcional y plan técnico aprobados. Los ADR se añadirán solo cuando exista una decisión duradera o transversal. La implementación y la validación se registrarán en `validation-report.md`.

#### QUICK

Utilizará un único `quick-change.md` que contenga el delta funcional, los criterios afectados, el alcance técnico mínimo y la estrategia de pruebas. No exigirá recrear visión, especificación completa, plan completo ni tareas que continúen siendo correctos. Cuando haya implementación, su evidencia persistente se registrará en `validation-report.md` o en el propio registro `QUICK` únicamente si el cambio es trivial y la separación no aporta claridad.

#### DIRECT

No exigirá un artefacto SDD nuevo. La confirmación de equivalencia, las pruebas aplicables y el historial de cambios proporcionarán la trazabilidad proporcional. Si aparece impacto observable, contractual o arquitectónico, se detendrá y reclasificará.

#### ADR

Utilizará una plantilla ADR con contexto, decisión, alternativas, consecuencias, relaciones, fuentes y plan de aplicación. Su aprobación autorizará utilizar la decisión en planes posteriores, pero no autorizará por sí sola implementación, commit ni publicación.

### 6. Incorporar visión y requisitos transversales del proyecto

Los proyectos derivados dispondrán de una plantilla de visión de producto. La visión definirá problema, usuarios, objetivos, límites y métricas sin inventar features.

El proyecto deberá decidir de forma explícita los requisitos transversales aplicables, como accesibilidad, navegadores, responsive, internacionalización, seguridad, privacidad, rendimiento, observabilidad y despliegue. La plantilla no impondrá valores de producto universales, pero evitará que esas decisiones queden implícitas.

### 7. Mantener un contrato efectivo navegable

Los índices SDD, arquitectura y especificaciones distinguirán:

- artefactos vigentes;
- artefactos modificados por deltas;
- artefactos sustituidos;
- informes de entrega y validación.

Los índices resumen relaciones y estado, pero no sustituyen el contenido aprobado. Las comprobaciones automatizadas futuras podrán validar metadatos, rutas y referencias sin intentar decidir semánticamente si una aprobación es válida.

### 8. Compatibilidad con el histórico

Los documentos existentes conservarán sus estados y evidencias históricas. No se realizará una migración masiva que reescriba decisiones ya aceptadas.

El modelo nuevo se aplicará a artefactos creados después de aprobar este ADR y a documentos existentes únicamente cuando deban cambiar por una petición posterior. Los índices indicarán que los artefactos anteriores utilizan el modelo histórico.

## Aplicación prevista tras la aprobación

La aprobación de este ADR permitirá preparar una tanda documental separada que:

1. actualice `AGENTS.md`, constitución, workflow, política de cambios e índices;
2. actualice las plantillas de especificación funcional y plan técnico;
3. cree plantillas para visión de producto, ADR, cambio `QUICK` e informe de validación;
4. documente el tratamiento del histórico sin modificar las specs validadas existentes;
5. compruebe enlaces, coherencia, formato y `npm run check`.

La aprobación no autorizará automáticamente esa aplicación, commits ni publicación.

## Alternativas consideradas

### Mantener un único estado

Reduce campos y archivos, pero conserva la ambigüedad entre aprobación del contenido y progreso de la entrega, y obliga a mutar specs o planes para registrar resultados.

### Registrar toda la ejecución dentro del plan

Centraliza la información, pero mezcla contrato técnico aprobado con diario operativo y dificulta identificar la versión exacta aceptada.

### Crear un documento para cada transición

Maximiza la trazabilidad formal, pero genera documentación sin valor proporcional para cambios pequeños. Se descarta en favor de un informe único de implementación y validación.

### Exigir siempre issue, pull request y commit de aprobación

Proporciona referencias estables, pero no todos los proyectos o aprobaciones utilizan esos mecanismos y un commit puede ocurrir después de la puerta documental. Se exige evidencia verificable disponible, sin inventar un soporte obligatorio.

### Migrar inmediatamente todo el histórico

Uniforma los encabezados, pero reescribe artefactos aceptados sin necesidad funcional y puede introducir errores históricos. Se adopta compatibilidad progresiva.

## Consecuencias

- El alcance aprobado permanecerá separado de las evidencias de ejecución.
- Será posible conocer quién aprobó qué versión y mediante qué registro disponible.
- `VALIDATED` describirá la entrega aceptada, no el contenido de una spec.
- Los cambios `QUICK` dispondrán de un formato proporcional propio.
- Los proyectos derivados recibirán una visión y un perfil transversal que deberán completar sin incorporar valores ficticios a la baseline.
- Aparecerán más tipos de plantilla, compensados por una responsabilidad explícita y un índice navegable.
- Los documentos históricos conservarán temporalmente el modelo anterior y deberán identificarse como tales.
- La automatización podrá comprobar estructura y referencias, pero la aprobación seguirá siendo una decisión humana explícita.

## Fuentes internas

- `docs/sdd/constitution.md`
- `docs/sdd/workflow.md`
- `docs/sdd/change-policy.md`
- `docs/sdd/templates/feature-spec.md`
- `docs/sdd/templates/technical-plan.md`
