# ADR-0010 — Alcance y derivación segura de la plantilla

**Estado documental:** APPROVED

**Versión:** 1.0.0

**Fecha:** 2026-08-28

**Aprobado por:** Tomás, usuario solicitante

**Fecha de aprobación:** 2026-08-28

**Evidencia de aprobación:** Aprobación expresa registrada en la conversación de trabajo.

**Relación:** Precisa ADR-0001 y ADR-0004, separa las especificaciones históricas de plataforma de las futuras especificaciones de producto y define el marco del bootstrap y `template:doctor`; su aplicación requiere una puerta separada.

## Contexto

La plantilla proporciona una aplicación React, Vite y TypeScript con renderizado cliente, React Router en modo declarativo, pruebas, MSW, i18n y un flujo SDD. Esa combinación es apropiada para muchas SPA, pero no cubre por sí sola renderizado en servidor, generación estática, React Server Components, backend, rutas de servidor ni otras capacidades integradas de un framework.

El README actual permite reutilizar el repositorio, pero no obliga a comprobar si la arquitectura encaja con el proyecto ni define un proceso completo para sustituir identidad, idioma, metadatos, visión, calidad, despliegue o variables de entorno. Una derivación manual puede conservar accidentalmente nombres y decisiones de la plantilla.

Además, `specs/` contiene las capacidades históricas de la propia baseline bajo los identificadores `FEAT-001` y `FEAT-002`, aunque el mismo directorio debe recibir las features del producto derivado. Esa mezcla dificulta distinguir contrato de plataforma y contrato de producto y ocupa el espacio de numeración esperado para la primera feature real.

Se necesita definir primero el alcance arquitectónico y la propiedad documental. La interfaz concreta del futuro bootstrap y de `template:doctor` se especificará después mediante un cambio `FULL`.

## Decisión

### 1. Limitar explícitamente el alcance predeterminado

Esta plantilla será una base para aplicaciones que cumplan inicialmente estas condiciones:

- aplicación web React renderizada en el navegador;
- SPA construida con Vite y desplegable como archivos estáticos;
- React Router en modo declarativo para relación entre URL y páginas;
- TypeScript estricto y arquitectura modular definida por ADR-0008;
- backend consumido mediante HTTP cuando exista, pero no implementado por esta plantilla;
- ausencia de una necesidad aprobada de SSR, SSG, RSC o rutas de servidor integradas.

El nombre y el README deberán describirla como plantilla de SPA cliente. No se presentará como solución universal para cualquier aplicación React.

### 2. Incorporar una puerta de idoneidad

Antes de derivar un proyecto se evaluarán, como mínimo:

- indexación, SEO y necesidad de HTML generado antes de ejecutar JavaScript;
- SSR, SSG, streaming o React Server Components;
- integración entre routing, carga de datos, acciones, formularios y code splitting;
- backend, rutas de servidor o ejecución edge dentro del mismo proyecto;
- requisitos de rendimiento inicial que puedan depender de otra estrategia de renderizado;
- restricciones de alojamiento, navegador o plataforma incompatibles con la baseline.

Si una necesidad confirmada no encaja con la SPA cliente, se detendrá la derivación y se elegirá otra arquitectura mediante una decisión aprobada. La evaluación no obliga por sí sola a usar un framework: documenta por qué esta base es o no adecuada.

### 3. Separar plataforma y producto sin reescribir el histórico

Las especificaciones históricas de la baseline se moverán a:

```text
docs/platform/specs/
├── 001-enrutamiento-base-spa/
└── 002-carga-diferida-rutas/
```

La migración conservará el contenido histórico, estados, evidencias e identificadores internos `FEAT-001` y `FEAT-002`. El cambio de ubicación no los renombrará silenciosamente ni presentará sus evidencias como nuevas.

`docs/platform/README.md` actuará como índice efectivo y asignará alias documentales `PLAT-001` y `PLAT-002` para distinguirlos de las features de producto sin alterar los artefactos históricos. Las referencias nuevas utilizarán siempre la ruta completa o el alias de plataforma.

Después de la migración:

- `docs/platform/` contendrá contrato, historial y evolución de la baseline reutilizable;
- `specs/` quedará reservado para visión, features, cambios y validaciones del producto derivado;
- las nuevas decisiones funcionales de plataforma utilizarán identificadores `PLAT-<número>`;
- las features del producto podrán comenzar en `FEAT-001` dentro de su propio repositorio derivado.

La migración se realizará con movimientos Git y actualización comprobada de referencias. No se eliminarán artefactos ni se perderá su trazabilidad.

### 4. Definir los datos mínimos de derivación

Antes de considerar inicializado un proyecto derivado deberán quedar resueltos o declarados pendientes de forma explícita:

- nombre visible y nombre válido de paquete;
- título HTML y metadatos iniciales aplicables;
- idioma predeterminado, fallback i18n y atributo `lang` del documento;
- visión de producto y perfil transversal inicial;
- idoneidad de la arquitectura SPA;
- repositorio, visibilidad, licencia y estrategia de historial, cuando apliquen;
- navegadores y dispositivos soportados;
- alojamiento, ruta base y fallback de SPA;
- entornos, variables públicas y política de secretos;
- comandos y puerta de calidad iniciales.

Un valor puede permanecer pendiente únicamente cuando no sea necesario para comenzar y quede identificado con su responsable o condición de resolución. El proceso no inventará respuestas para completar campos.

### 5. Separar bootstrap y diagnóstico

La capacidad futura tendrá dos responsabilidades distintas:

- **bootstrap:** aplica de forma controlada la identidad y decisiones suministradas a una copia o repositorio derivado;
- **`template:doctor`:** inspecciona el proyecto y devuelve diagnósticos verificables sin corregir ni sobrescribir archivos.

El bootstrap deberá:

- ejecutarse solo dentro del proyecto derivado expresamente seleccionado;
- mostrar los archivos que modificará antes de escribir;
- validar entradas antes de aplicar cambios;
- actualizar de forma coherente `package.json`, `package-lock.json`, `index.html`, i18n y documentación afectada;
- crear únicamente artefactos aprobados por la especificación futura;
- negarse a sobrescribir contenido de producto o una inicialización ya completada sin una autorización nueva;
- no instalar dependencias, borrar historial Git, crear remotos, hacer commit, push o desplegar por defecto;
- finalizar con un resumen de cambios y comprobaciones pendientes.

`template:doctor` deberá ser de solo lectura respecto al proyecto y comprobar, como mínimo:

- identificadores o placeholders residuales de la plantilla;
- coherencia entre nombre de paquete y lockfile;
- título, idioma HTML e idioma i18n;
- versión Node declarada y entorno efectivo cuando pueda observarse;
- existencia y estado de visión y documentos SDD requeridos;
- separación entre documentos de plataforma y producto;
- decisiones de despliegue, ruta base, fallback SPA y variables públicas cuando apliquen;
- ausencia de archivos de secretos conocidos dentro del alcance comprobable.

Un diagnóstico no afirmará que un secreto, requisito o vulnerabilidad está ausente cuando solo pueda comprobar patrones limitados.

### 6. Mantener operación reproducible y segura

La derivación podrá realizarse desde un repositorio plantilla o desde una copia local. No asumirá que existe un remoto, un proveedor concreto ni credenciales disponibles.

El proceso distinguirá:

- preparación de archivos;
- instalación reproducible;
- validación;
- creación o sustitución de historial Git;
- commit y publicación.

Cada operación potencialmente destructiva o externa requerirá autorización expresa. La instalación utilizará el lockfile y la versión Node aprobada cuando esa etapa sea autorizada.

### 7. Mantener una fuente declarativa de inicialización

La especificación `FULL` posterior decidirá la interfaz concreta, pero la información de derivación deberá tener una representación revisable antes de escribir. Podrá ser una configuración temporal validada, argumentos explícitos o un manifiesto versionado del proyecto.

No se duplicará la misma identidad manualmente entre un script y varios documentos sin una fuente clara. Tampoco se conservarán secretos en esa representación.

## Aplicación prevista tras la aprobación

La aprobación de este ADR permitirá preparar puertas separadas para:

1. mover las specs históricas a `docs/platform/specs/` y actualizar todas sus referencias;
2. crear `docs/platform/README.md` y restablecer `specs/README.md` como entrada de producto;
3. actualizar README e índices con el alcance SPA y la puerta de idoneidad;
4. crear una especificación `FULL` para bootstrap y `template:doctor`;
5. preparar y aprobar su plan técnico antes de crear scripts, comandos o pruebas.

La aprobación no autorizará automáticamente movimientos, implementación, instalaciones, commit ni publicación.

## Alternativas consideradas

### Presentar la plantilla como base React universal

Simplifica el mensaje, pero oculta decisiones de renderizado y puede iniciar proyectos con una arquitectura inadecuada para requisitos confirmados.

### Mantener specs de plataforma y producto en el mismo directorio

Evita movimientos, pero conserva mezcla de responsabilidades e identificadores y dificulta conocer qué documentos debe modificar un proyecto derivado.

### Renombrar el contenido histórico a PLAT

Produce uniformidad inmediata, pero reescribe artefactos ya validados y puede falsear su evidencia histórica. Se prefieren alias en un índice nuevo.

### Eliminar las specs históricas al derivar

Deja limpio el proyecto, pero elimina la trazabilidad de decisiones que siguen gobernando su plataforma. Se conservan bajo `docs/platform/`.

### Bootstrap interactivo sin representación previa

Puede resultar cómodo, pero dificulta revisar entradas y repetir el resultado. La interfaz futura deberá permitir inspeccionar la configuración antes de escribir.

### Doctor con correcciones automáticas

Reduce pasos, pero mezcla diagnóstico y mutación y aumenta el riesgo de sobrescribir decisiones del proyecto. El doctor será de solo lectura.

## Consecuencias

- La plantilla tendrá un límite arquitectónico explícito y verificable.
- Los proyectos con necesidades de renderizado diferentes se detectarán antes de heredar decisiones incompatibles.
- Plataforma y producto tendrán propietarios y espacios documentales separados.
- El histórico conservará su contenido original, aunque sus alias de plataforma vivan en un índice posterior.
- La derivación requerirá más datos iniciales, compensados por menor riesgo de conservar identidad o configuración accidental.
- Bootstrap y doctor podrán evolucionar y probarse de forma independiente.
- La automatización no sustituirá decisiones humanas sobre producto, arquitectura, seguridad o publicación.

## Fuentes

- React, «Creating a React App»: <https://react.dev/learn/creating-a-react-app>.
- React, «Build a React app from Scratch»: <https://react.dev/learn/build-a-react-app-from-scratch>.
- Vite, «Building for Production»: <https://vite.dev/guide/build>.
- Vite, «Env Variables and Modes»: <https://vite.dev/guide/env-and-mode>.
- ADR-0001 — Plataforma de la plantilla.
- ADR-0004 — React Router como base de las SPA.
- ADR-0009 — Ciclo de vida SDD y evidencias separadas.
