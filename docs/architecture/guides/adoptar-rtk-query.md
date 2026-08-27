# Guía — Adoptar RTK Query en un proyecto derivado

**Estado:** APPROVED

**Aprobación:** 2026-08-23

**Actualización:** 2026-08-27

**Relación:** Aplica [ADR-0005](../decisions/0005-rtk-query-capacidad-opcional.md) y [ADR-0008](../decisions/0008-organizacion-modular-por-propiedad.md).

## Objetivo

Explicar cómo solicitar y planificar la incorporación de RTK Query cuando una feature real de un proyecto derivado necesite consumir datos remotos. Esta guía no instala dependencias ni añade un store, una URL base o endpoints a la plantilla.

RTK Query y TanStack Query, antes denominado React Query, son bibliotecas diferentes. La capacidad opcional decidida en ADR-0005 es RTK Query, incluida en `@reduxjs/toolkit`.

## Cuándo considerarlo

RTK Query puede ser adecuado cuando la feature necesita varias de estas capacidades:

- caché y deduplicación de peticiones;
- invalidación o revalidación coordinada de datos;
- consultas y mutaciones con estado compartido;
- seguimiento uniforme de carga y error;
- diagnóstico del estado de las peticiones mediante Redux DevTools.

Una petición aislada y sencilla no justifica por sí sola incorporar Redux. El plan técnico debe comparar la solución con `fetch`, TanStack Query, SWR u otra alternativa que encaje con los requisitos reales.

## Cómo solicitarlo

La adopción sigue las mismas puertas SDD que cualquier otra decisión de una feature. No debe pedirse la instalación directa antes de aprobar su necesidad.

### 1. Crear únicamente la especificación

Prompt reutilizable:

> Para FEAT-&lt;ID&gt; necesitamos consumir el contrato remoto &lt;contrato o servicio&gt;. Crea únicamente la especificación funcional en estado DRAFT: describe el comportamiento observable, los datos necesarios, los estados de carga y error y cuándo deben actualizarse. No elijas herramientas, no prepares el plan, no instales dependencias y no implementes nada.

La especificación debe describir comportamiento observable y contratos de producto, no imponer RTK Query como requisito funcional.

### 2. Preparar el plan después de aprobar la especificación

Prompt reutilizable:

> La especificación FEAT-&lt;ID&gt; está aprobada y quiero considerar RTK Query. Prepara únicamente el plan técnico en estado DRAFT. Evalúa sus requisitos de caché, deduplicación, invalidación, mutaciones y estado compartido según ADR-0005; compáralo con las alternativas pertinentes y, si la elección queda justificada, detalla dependencias, contrato remoto, composición del store y Provider, API slice, estrategia de caché, MSW y pruebas. No implementes, no hagas commit y no hagas push.

### 3. Implementar después de aprobar el plan

Prompt reutilizable:

> Apruebo el plan técnico de FEAT-&lt;ID&gt;. Implementa únicamente su alcance aprobado, mantén la trazabilidad con requisitos y escenarios, y valida con `npm run check`. No hagas commit ni push sin mi autorización expresa.

## Contenido mínimo del plan técnico

Si se elige RTK Query, el plan debe concretar al menos:

- versiones compatibles de `@reduxjs/toolkit` y `react-redux`;
- contrato real: URL base, endpoints, parámetros, respuestas y errores;
- factoría `createAppStore` basada en `configureStore`, con una instancia aislada por prueba;
- montaje de `Provider` en el punto de composición de proveedores;
- reducer y middleware de cada API slice registrados en el store;
- una API slice por URL base como orientación, justificando cualquier excepción;
- propietario de cada API slice, módulo de endpoints, Redux slice, selector, DTO, modelo de dominio y adaptador;
- promoción de una API base a `shared/api` e inyección de endpoints cuando varios propietarios compartan la misma URL base;
- separación entre estado local, estado cliente compartido y estado remoto cacheado;
- handlers y fixtures HTTP correspondientes dentro de `mocks/`;
- reglas de caché, deduplicación e invalidación que responden a escenarios aprobados;
- uso de `setupListeners` solo si se requiere revalidación por foco o reconexión;
- pruebas observables y aislamiento de store, handlers y estado entre pruebas.

La instalación prevista, una vez aprobado el plan, será:

```bash
npm install @reduxjs/toolkit react-redux
```

Este comando no debe ejecutarse en la plantilla ni en un proyecto derivado antes de superar las puertas SDD correspondientes.

## Organización esperada

El plan decidirá nombres concretos únicamente a partir del dominio y los contratos aprobados. La estructura de referencia es:

```text
src/
├── app/
│   ├── store/
│   │   ├── createAppStore.ts
│   │   ├── hooks.ts
│   │   └── types.ts                  # solo para tipos no inferibles
│   └── providers/
│       └── AppStoreProvider/
│           └── index.tsx
├── pages/<Page>/
│   ├── api/                          # endpoints exclusivos de la ruta
│   └── model/                        # estado cliente exclusivo de la ruta
├── features/<capacidad>/
│   ├── api/
│   └── model/
├── entities/<entidad>/
│   ├── api/
│   └── model/
└── shared/
    └── api/                          # transporte o API base compartidos

mocks/
├── handlers/
└── fixtures/

tests/                                # espejo de src
```

Responsabilidades:

- `app/store/createAppStore.ts`: factoría con `configureStore`, registro de reducers y middleware e inferencia de `AppStore`, `RootState` y `AppDispatch`.
- `app/store/hooks.ts`: hooks Redux pretipados separados del store para evitar dependencias circulares de runtime.
- `<propietario>/model/<nombre>Slice.ts`: estado cliente creado con `createSlice` y propiedad de una página, feature o entidad.
- `<propietario>/model/selectors.ts`: selectors de ese estado, cuando sean necesarios.
- `<propietario>/api/<nombre>Api.ts`: `createApi` mientras exista un único propietario y no sea necesaria la división.
- `shared/api/<servicio>Api.ts`: API base promovida cuando varios propietarios compartan la misma URL base.
- `<propietario>/api/<nombre>Endpoints.ts`: endpoints añadidos mediante `injectEndpoints` y hooks generados exportados por el mismo módulo.
- `<propietario>/api/types.ts`: argumentos, DTO y errores específicos del contrato remoto.
- `<propietario>/api/mappers.ts`: transformación entre DTO y dominio únicamente cuando difieran.
- `entities/<entidad>/model/types.ts`: modelo de dominio estable compartido.
- `mocks/handlers/<dominio>.ts` y `mocks/fixtures/<dominio>.ts`: escenarios HTTP aprobados.

Los endpoints de una entidad pertenecen a `entities/<entidad>/api`; una acción de negocio pertenece a `features/<capacidad>/api`; y un endpoint exclusivo de una ruta puede permanecer en `pages/<Page>/api`. Cuando el ámbito real cambie, se promoverá al menor propietario común.

Se utilizará normalmente una API slice por URL base. Si varios propietarios comparten esa API, se mantendrá una definición base común y se dividirán los endpoints mediante `injectEndpoints`, conservando la invalidación de tags dentro de la misma API slice.

El estado remoto permanecerá en la caché de RTK Query. Solo se añadirá un Redux slice separado para estado cliente que no sea una copia del servidor y que necesite coordinación entre consumidores. El estado exclusivamente local permanecerá en React.

No se crearán `src/services/`, `src/slices/`, una API vacía, un store sin consumidores ni ningún segmento anticipatorio. El primer endpoint, su consumidor, su contrato MSW y sus pruebas pertenecerán a la misma capacidad aprobada.

## Terminología

- **Módulo arquitectónico:** carpeta con propietario semántico, como `entities/account`.
- **Redux slice:** estado cliente creado con `createSlice`.
- **API slice:** servicio creado con `createApi`.
- **Módulo de endpoints:** archivo que define o inyecta endpoints y exporta sus contratos de consumo.

## Criterio de finalización

La adopción estará terminada cuando:

- la especificación y el plan estén aprobados y trazados;
- no existan URLs, endpoints ni estados de producto inventados;
- los componentes consuman contratos React expuestos por el servicio, sin conocer detalles internos de caché;
- MSW reproduzca los escenarios HTTP aprobados;
- las pruebas cubran el comportamiento relevante de petición y caché;
- `npm run check` finalice correctamente.

## Fuentes oficiales

- Redux Toolkit, «RTK Query Overview»: <https://redux-toolkit.js.org/rtk-query/overview>.
- Redux Toolkit, «Getting Started»: <https://redux-toolkit.js.org/introduction/getting-started>.
- Redux Toolkit, «createApi»: <https://redux-toolkit.js.org/rtk-query/api/createApi>.
- Redux Toolkit, «Generated API Slices»: <https://redux-toolkit.js.org/rtk-query/api/created-api/overview>.
- Redux Toolkit, «Code Splitting»: <https://redux-toolkit.js.org/rtk-query/usage/code-splitting>.
- Redux Toolkit, «setupListeners»: <https://redux-toolkit.js.org/rtk-query/api/setupListeners>.
- Redux, «Usage with TypeScript»: <https://redux.js.org/usage/usage-with-typescript>.
