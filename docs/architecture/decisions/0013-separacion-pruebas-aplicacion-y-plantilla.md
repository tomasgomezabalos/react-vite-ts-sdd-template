# ADR-0013 — Separación entre pruebas de aplicación y plantilla

**Estado documental:** APPROVED

**Versión:** 1.0.0

**Fecha:** 2026-08-31

**Aprobado por:** Tomás, usuario solicitante

**Fecha de aprobación:** 2026-08-31

**Evidencia de aprobación:** Autorización expresa «ok, adelante con todo» registrada en la conversación tras confirmar la separación propuesta.

**Relación:** Modifica parcialmente las secciones 2 y 4 de ADR-0011 y se aplica mediante PLAT-006.

**Modificada por:** ADR-0014 modifica parcialmente su sección 2; ADR-0019 modifica parcialmente su sección 3 (el paso de `npm run test:tools` pasa de `quality.yml`, condicionado por el nombre del repositorio, a un workflow propio de la plantilla). El resto de esta decisión permanece vigente.

## Contexto

ADR-0011 y PLAT-004 incorporaron `src/**/*.{ts,tsx}` y `tools/**/*.ts` al mismo contrato global de cobertura y ejecutaron todas sus pruebas dentro de `npm run check`. Esa unión mezcla dos responsabilidades distintas:

- `src/` contiene el código de la aplicación que constituye el proyecto derivado;
- `tools/` contiene utilidades para mantener, derivar y comprobar la plantilla.

Las herramientas necesitan pruebas para evitar regresiones en el repositorio canónico, pero sus archivos y pruebas no deben alterar los porcentajes, umbrales ni resultados de la puerta de aplicación heredada por un proyecto derivado.

## Decisión

### 1. Limitar las pruebas de aplicación

Los comandos ordinarios de proyecto tendrán este alcance:

- `npm test` y `npm run test:watch` excluirán `tests/tools/**`;
- `npm run test:coverage` excluirá `tests/tools/**` y medirá únicamente `src/**/*.{ts,tsx}`;
- `npm run check` conservará lint, integridad documental, arquitectura, cobertura de aplicación y build, sin ejecutar las pruebas propias de `tools/`.

Los umbrales globales de cobertura permanecen en 70 % de statements, 55 % de branches, 75 % de functions y 75 % de lines. `src/main.tsx` seguirá incluido y no habrá actualización automática ni umbrales por archivo.

### 2. Mantener una suite separada de plantilla

`npm run test:tools` ejecutará `tests/tools/**` sin incorporar `tools/**` al contrato de cobertura de la aplicación. La suite seguirá protegiendo bootstrap, diagnóstico, comprobadores de calidad y sus contratos operativos.

La existencia de estas pruebas no convierte `tools/` en código del producto ni obliga a ejecutarlas en la puerta de un proyecto derivado.

### 3. Diferenciar la automatización canónica

El workflow heredable ejecutará siempre `npm run check`. Añadirá `npm run test:tools` únicamente cuando `github.repository` identifique el repositorio canónico `tomasgomezabalos/react-vite-ts-sdd-template`.

De este modo, la plantilla fuente comprueba tanto la aplicación base como sus utilidades, mientras una copia derivada conserva una puerta centrada en su aplicación.

## Aplicación prevista tras la aprobación

1. Actualizar scripts npm y configuración Vitest.
2. Adaptar el workflow y sus pruebas de contrato.
3. Actualizar instrucciones, documentación operativa y manifiesto de baseline.
4. Ejecutar por separado `npm run test:tools` y `npm run check`.
5. Registrar la implementación en PLAT-006 sin declarar `VALIDATED` antes de la aceptación expresa.

La aprobación del ADR permite aplicar únicamente esta separación autorizada. No autoriza commit ni publicación.

## Alternativas consideradas

### Eliminar las pruebas de `tools/`

Evita por completo su ejecución, pero deja sin protección herramientas que siguen siendo operativas en la plantilla. Se descarta mientras esas utilidades continúen mantenidas.

### Mantener todas las pruebas y excluir solo `tools/` de cobertura

Conserva protección en una única suite, pero la puerta del proyecto seguiría ejecutando pruebas ajenas a la aplicación. No satisface la separación solicitada.

### Crear configuraciones Vitest independientes

Permite aislamiento adicional, pero añade archivos y configuración que no son necesarios mientras los filtros explícitos de Vitest expresen el alcance de forma verificable.

## Consecuencias

- La cobertura representa exclusivamente el código de aplicación bajo `src/`.
- Las regresiones de las herramientas siguen bloqueando el CI canónico, pero no la puerta de un proyecto derivado.
- `npm run check` y `npm run test:tools` deben ejecutarse ambos al mantener la plantilla fuente.
- Los umbrales se conservan inicialmente; su adecuación se contrasta con la nueva medición de `src/`.
- Los documentos históricos de PLAT-004 y ADR-0011 permanecen como evidencia de la decisión anterior y se leen junto con este modificador.

## Migración y reversión

- Migración: introducir los filtros de pruebas, limitar `coverage.include`, añadir `test:tools` y condicionar su ejecución canónica.
- Reversión: sustituir este ADR mediante una decisión aprobada y volver a unificar las suites solo si se redefine expresamente el alcance de calidad.

## Fuentes

- Evidencia interna: `package.json`, `vite.config.ts`, `.github/workflows/quality.yml`, `tests/tools/` y ADR-0011.
- Ayuda local de Vitest `4.1.11`: `vitest --help`, opción `--exclude <glob>`.
