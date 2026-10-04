# ADR-0012 — Bootstrap mínimo y descubrimiento progresivo

**Estado documental:** APPROVED

**Versión:** 1.0.0

**Fecha:** 2026-08-29

**Aprobado por:** Tomás, usuario solicitante

**Fecha de aprobación:** 2026-08-29

**Evidencia de aprobación:** Aprobación expresa registrada en la conversación de trabajo.

**Relación:** Modifica parcialmente ADR-0010 en la puerta de idoneidad, los datos mínimos de derivación y el alcance de `template:doctor`; su aplicación se especificará mediante PLAT-005.

**Modificada por:** ADR-0014 modifica parcialmente sus secciones 3, 7 y 8. El resto de esta decisión permanece vigente.

## Contexto

El uso previsto de la plantilla parte siempre de una copia nueva de `react-vite-ts-sdd-template` y no de la adopción o reconfiguración de un proyecto existente. La elección expresa de esta plantilla selecciona una SPA React renderizada en cliente, con Vite, React Router declarativo y el gobierno SDD heredado.

El bootstrap vigente exige resolver antes de crear el proyecto una visión de producto, métricas, perfil transversal, soporte, despliegue, entornos, repositorio y cinco justificaciones de idoneidad. Estos datos no participan en la protección del destino, el token de preview, los hashes, la transacción ni la idempotencia. Además, quedan congelados en `project.config.json` y `.template-state.json`, aunque todavía no exista información real para decidirlos.

La obligación produce decisiones pendientes artificiales y mezcla la derivación técnica con el descubrimiento de producto. El flujo SDD ya dispone de artefactos y puertas para formular y aprobar visión, features y decisiones transversales cuando exista contexto verificable.

## Decisión propuesta

### 1. Adoptar un único modo de derivación

El bootstrap creará exclusivamente un proyecto nuevo a partir de la baseline canónica en un destino explícito, seguro y sin contenido de producto previo. No preguntará el método de derivación ni solicitará una declaración humana de evidencia.

La herramienta verificará técnicamente la estructura y los hashes reconocidos, rechazará el origen canónico como destino y conservará las protecciones de rutas, symlinks y archivos divergentes. Adoptar o reconfigurar un proyecto existente permanecerá fuera de alcance.

### 2. Reducir las entradas humanas al mínimo

Antes del preview solo se solicitarán:

- el directorio absoluto de destino;
- el nombre visible del proyecto.

A partir del nombre visible se propondrá de forma determinista un nombre npm válido. La persona usuaria confirmará o corregirá esa propuesta dentro de un único resumen previo al preview.

No se solicitarán título HTML, versión, idiomas, arquitectura, visión, métricas, requisitos transversales, soporte, despliegue, entornos, repositorio, licencia, historial ni comandos de calidad.

### 3. Mantener una configuración declarativa mínima

`project.config.json` conservará únicamente el contrato necesario para identificar el proyecto:

```json
{
  "$schema": "./tools/template/project.schema.json",
  "schemaVersion": 2,
  "identity": {
    "displayName": "Ritmo Claro",
    "packageName": "ritmo-claro"
  }
}
```

`$schema` seguirá siendo una ayuda editorial y no una decisión de producto. El destino continuará siendo un argumento de la operación y no se duplicará en la configuración.

Los campos retirados desaparecerán del esquema, ejemplo, tipos de entrada, validación, cuestionario, digest, estado, renderizado y diagnósticos. No permanecerán como opcionales, placeholders ni objetos `pending`.

### 4. Aplicar valores técnicos deterministas

La inicialización aplicará sin preguntar:

- versión inicial `0.1.0`;
- título HTML igual al nombre visible;
- idioma, fallback, recursos y texto de carga ya presentes en la baseline;
- ruta base ya declarada por la baseline;
- ausencia inicial de variables públicas;
- política de secretos y puerta `npm run check` heredadas de la plantilla.

Estos valores representan el estado técnico inicial, no requisitos de producto. Cualquier cambio posterior seguirá la clasificación SDD que corresponda.

### 5. Posponer el producto al flujo SDD

El bootstrap no creará `specs/product-vision.md` ni rellenará documentos de producto. `specs/` conservará su índice genérico y las plantillas SDD seguirán disponibles para crear la visión, las features, los ADR y los informes cuando exista información real.

La visión, las métricas y los requisitos transversales se decidirán únicamente en el primer alcance que los necesite. La ausencia inicial de estos artefactos no será un fallo ni una advertencia de derivación.

### 6. Simplificar la selección arquitectónica

Solicitar expresamente un proyecto basado en esta plantilla implica seleccionar su arquitectura SPA cliente. El flujo no exigirá cinco respuestas ni justificaciones persistentes sobre SEO, SSR, backend, rendimiento o alojamiento.

Si antes de aplicar se declara una necesidad confirmada incompatible con la baseline, la derivación se detendrá. Una necesidad incompatible descubierta después requerirá revisar la arquitectura mediante SDD antes de implementar el alcance afectado.

### 7. Mantener `template:doctor` técnico y de solo lectura

`template:doctor` comprobará la coherencia derivada que pueda observar: identidad y lockfile, título, configuración heredada, runtime, calidad, separación SDD, base técnica, variables públicas existentes, archivos sensibles conocidos, estado de inicialización y origen remoto cuando sea observable.

No diagnosticará como fallo o advertencia la ausencia de visión, métricas, alojamiento, soporte, repositorio u otras decisiones que ya no pertenezcan al contrato de bootstrap. Continuará declarando los límites de sus comprobaciones y no corregirá archivos.

### 8. Conservar las garantías operativas

Se mantienen sin reducción:

- preview sin escritura y autorización vinculada al token;
- token calculado con configuración normalizada, destino, baseline y hashes actuales;
- rechazo de origen, destino o contenido incompatibles;
- aplicación transaccional, rollback y recuperación expresa;
- repetición idempotente y rechazo de una configuración distinta;
- ausencia de instalación, red, cambios Git, commit, publicación o despliegue.

La configuración efectiva normalizada, incluidos los valores deterministas, participará en el digest aunque no requiera decisiones adicionales de la persona usuaria.

## Aplicación prevista tras la aprobación

1. Aprobar PLAT-005 y preparar su plan técnico en una puerta separada.
2. Introducir el esquema mínimo como una nueva versión del contrato para futuras derivaciones.
3. Adaptar validación, archivos gestionados, diagnóstico, salida, pruebas y documentación operativa.
4. Actualizar el skill `react-vite-ts-sdd-template-init` y eliminar su cuestionario de producto.
5. Validar preview, token, aplicación, no-op, conflicto, rollback, recuperación y doctor sobre una copia temporal.

La aprobación del ADR permite utilizar esta decisión en el plan posterior; no autoriza implementación, cambios en el skill, commit ni publicación.

## Alternativas consideradas

### Mantener el contrato vigente

Conserva PLAT-003 sin cambios, pero obliga a inventar o formalizar prematuramente decisiones que no son necesarias para crear una copia técnica segura.

### Conservar todos los campos como opcionales

Reduce bloqueos, pero mantiene ruido, placeholders y decisiones pendientes en el esquema, el cuestionario, el estado y el doctor. Se descarta porque el objetivo es que los datos eliminados no formen parte del bootstrap.

### Eliminar `project.config.json`

Reduce todavía más la entrada, pero pierde una fuente revisable y determinista para la identidad que se aplicará y debilita la vinculación explícita del preview. Se conserva una configuración mínima.

### Permitir inicializar proyectos existentes

Amplía los casos de uso, pero requiere reglas de adopción, migración y protección ajenas a la necesidad confirmada. Se limita el flujo a copias nuevas de la plantilla.

## Consecuencias

- Crear un proyecto requerirá solo destino, nombre y confirmación de la identidad calculada.
- El bootstrap dejará de bloquearse por información de producto inexistente.
- `project.config.json` y `.template-state.json` conservarán únicamente una instantánea técnica estable.
- El flujo SDD seguirá gobernando las decisiones posteriores sin que el bootstrap las anticipe.
- Cambiar idioma, base path, versión, título o cualquier valor heredado después de inicializar será un cambio SDD normal, no una reejecución del bootstrap.
- La simplificación modifica un contrato público ya validado y exige una nueva versión de esquema y pruebas de regresión completas.

## Migración y reversión

- Migración: aplicará solo a futuras derivaciones. Los proyectos inicializados con el esquema anterior conservarán su configuración y estado históricos y no serán reprovisionados.
- Reversión: una versión posterior podrá restablecer campos únicamente mediante otro ADR y alcance de plataforma aprobados; no se reescribirán proyectos derivados existentes.

## Fuentes

- ADR-0009 — Ciclo de vida SDD y evidencias separadas.
- ADR-0010 — Alcance y derivación segura de la plantilla.
- PLAT-003 — Inicialización segura de proyectos derivados.
- `docs/sdd/constitution.md`, principio de calidad integrada sin valores ficticios.
