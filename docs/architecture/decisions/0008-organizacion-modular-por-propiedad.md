# ADR-0008 — Organización modular por propiedad y promoción progresiva

**Estado:** APPROVED

**Fecha:** 2026-08-27

**Aprobación:** 2026-08-27

**Relación:** Amplía la organización base de ADR-0001 y precisa dónde ubicar la capacidad opcional definida en ADR-0005. Es compatible con las convenciones de routing y carga diferida de ADR-0004, ADR-0006 y ADR-0007.

## Contexto

La plantilla define React funcional, TypeScript estricto, routing, pruebas, MSW e internacionalización, pero no establece todavía una regla completa para decidir dónde debe vivir cada página, componente, modelo, acceso a datos, estado o recurso.

Sin una convención transversal, los proyectos derivados pueden terminar separando una misma capacidad entre carpetas técnicas globales como `pages/`, `components/`, `services/`, `hooks/` y `slices/`. Esa distribución reduce la cohesión y obliga a conocer toda la aplicación para identificar el propietario de un cambio.

El árbol visual de React sí aporta una jerarquía útil, pero la relación de renderizado no basta para decidir la estructura física. Un componente debe ubicarse según su propietario semántico y el ámbito real de reutilización. Cuando ese ámbito crezca, el módulo debe promoverse únicamente hasta el menor propietario común.

La capacidad opcional de RTK Query añade otra ambigüedad: «slice» puede significar un módulo arquitectónico, un reducer creado con `createSlice` o un servicio creado con `createApi`. La plantilla necesita fijar responsabilidades y ubicaciones sin instalar Redux, inventar contratos remotos ni crear infraestructura inactiva.

## Decisión

### 1. Capas disponibles

Los proyectos derivados organizarán `src/` mediante las siguientes capas semánticas:

```text
src/
├── app/
├── pages/
├── features/     # solo cuando exista una capacidad reutilizable
├── entities/     # solo cuando exista un concepto de dominio compartido
└── shared/       # solo cuando exista infraestructura o UI compartida
```

No se crearán carpetas vacías, módulos de ejemplo ni abstracciones preventivas. La baseline mantendrá únicamente las capas que tengan contenido real; cada proyecto incorporará las demás cuando una necesidad aprobada lo justifique.

Responsabilidades:

- `app/`: entrada y composición global, tabla de rutas, providers, store, layouts de aplicación y configuración de ciclo de vida.
- `pages/`: páginas reales asociadas a rutas. Cada página es una frontera de composición y propietaria de sus elementos privados.
- `features/`: capacidades o acciones de usuario con identidad funcional propia y reutilización real, como autenticación, transferencia o descarga de un recibo. Una página o una sección visual no se convierte automáticamente en feature.
- `entities/`: conceptos de dominio estables compartidos por varios propietarios, junto con su modelo y representaciones reutilizables.
- `shared/`: infraestructura y UI reutilizables sin dependencia de páginas, features o entidades concretas.

### 2. Segmentos internos

Cada página, feature o entidad podrá crear únicamente los segmentos que necesite:

```text
<propietario>/
├── index.tsx       # solo cuando exista un componente raíz
├── components/
├── model/
├── api/
├── lib/
└── assets/
```

- `components/`: componentes React privados del propietario.
- `model/`: tipos de dominio, estado cliente, selectors y reglas propias.
- `api/`: endpoints, DTO, contratos de transporte y adaptadores remotos.
- `lib/`: utilidades puras específicas del propietario.
- `assets/`: recursos estáticos exclusivos del propietario.

No se crearán estos segmentos por uniformidad si están vacíos. `shared/` utilizará nombres explícitos como `shared/ui/`, `shared/api/`, `shared/lib/` y `shared/config/`.

### 3. Propiedad y promoción progresiva

La ubicación se decidirá mediante estas reglas, en este orden:

1. Un elemento usado por un único componente permanecerá junto a ese componente, normalmente en `ComponentName/components/`.
2. Un elemento usado por varios descendientes del mismo propietario se elevará al `components/`, `model/`, `api/`, `lib/` o `assets/` de ese propietario.
3. Un elemento usado por varias páginas se promoverá a una feature, entidad o módulo shared según su responsabilidad semántica.
4. La promoción solo se realizará cuando los usos compartan contrato, responsabilidad y motivo de cambio; la similitud accidental no justifica una abstracción.
5. Un elemento no se elevará más allá del menor ámbito común que resuelva la reutilización real.

La relación de renderizado orienta la jerarquía, pero no obliga a reproducir cada nodo JSX como una carpeta. El anidamiento físico expresa propiedad exclusiva y estable.

### 4. Componentes React

Los componentes propios seguirán la convención vigente de la plantilla:

```text
ComponentName/
├── index.tsx
├── types.ts
├── useComponentName.ts
├── styles.scss o styles.module.scss
├── constants.ts
└── utils.ts
```

Solo se crearán los archivos necesarios. En particular:

- `index.tsx` será presentacional, declarará un único componente y utilizará export nombrado.
- `types.ts` contendrá los tipos propiedad del componente cuando existan.
- `useComponentName.ts` o `.tsx` existirá únicamente cuando haya estado, efectos, handlers con comportamiento u orquestación que reduzcan la carga cognitiva del render.
- El estilo local utilizará `styles.scss` o `styles.module.scss` según la estrategia aprobada del proyecto y ADR-0003; una reorganización no cambiará por sí sola el contrato CSS existente.
- `constants.ts` y `utils.ts` no se crearán para valores o funciones de un único uso si su extracción no mejora la lectura.
- Los componentes privados se colocarán bajo el `components/` de su propietario; no se creará un `src/components/` global.

### 5. Dirección de dependencias

Las dependencias respetarán la dirección general:

```text
app → pages → features → entities → shared
```

No es obligatorio utilizar todas las capas intermedias. Además:

- `shared` no importará desde `entities`, `features`, `pages` ni `app`.
- `entities` no importará desde `features`, `pages` ni `app`.
- `features` no importará desde `pages` ni `app`.
- una página no importará otra página;
- una dependencia entre módulos hermanos que revele propiedad compartida se moverá al menor propietario común;
- `app` podrá componer cualquier capa porque es la raíz de la aplicación.

Los imports dinámicos de páginas y las fronteras `Suspense` seguirán ADR-0006 y ADR-0007. Una reorganización no autoriza a convertir una página diferida en importación estática.

### 6. Tipos, datos y recursos

- Los tipos de props y contratos internos pertenecerán al componente correspondiente.
- Los tipos de dominio compartidos pertenecerán a `entities/<entidad>/model/`.
- Los DTO de entrada o salida pertenecerán al módulo `api/` que conoce el contrato remoto.
- Los adaptadores entre DTO y dominio pertenecerán al mismo módulo `api/`.
- Los datos deterministas o fixtures de aplicación se colocarán con su propietario semántico; los fixtures HTTP de MSW permanecerán siempre en `mocks/fixtures/`.
- Los assets exclusivos se colocarán con su propietario y los realmente reutilizables bajo una categoría explícita de `shared/`.

No se unificarán tipos de dominio y transporte cuando tengan contratos o motivos de cambio diferentes. Tampoco se duplicarán si son realmente el mismo contrato.

### 7. Pruebas

`tests/` reflejará la estructura efectiva de `src/`:

```text
src/pages/Transactions/components/History/index.tsx
tests/pages/Transactions/components/History/index.test.tsx
```

La infraestructura compartida de MSW continuará en `mocks/`, conforme a ADR-0001. Las pruebas locales, spies y valores de un único escenario permanecerán junto a la prueba propietaria.

### 8. Estado local, estado cliente y estado remoto

Antes de incorporar Redux se distinguirán tres responsabilidades:

- estado local de interfaz: `useState` o `useReducer` junto al componente o hook propietario;
- estado cliente compartido: un reducer creado con `createSlice`, únicamente cuando varios consumidores necesiten una fuente coordinada;
- estado remoto: caché de RTK Query cuando su adopción esté aprobada; no se duplicará por defecto en un `createSlice`.

No se añadirá Redux para elevar estado que pueda permanecer correctamente en un propietario React cercano.

### 9. Estructura de Redux Toolkit y RTK Query cuando se adopten

ADR-0005 mantiene RTK Query fuera de la baseline. Cuando una feature y su plan técnico aprueben la adopción, se aplicará esta estructura:

```text
src/
├── app/
│   ├── store/
│   │   ├── createAppStore.ts
│   │   ├── hooks.ts
│   │   └── types.ts              # solo para tipos no inferibles
│   └── providers/
│       └── AppStoreProvider/
│           └── index.tsx
├── pages/<Page>/
│   ├── api/                      # endpoints exclusivos de la ruta
│   └── model/                    # estado cliente exclusivo de la ruta
├── features/<capacidad>/
│   ├── api/
│   └── model/
├── entities/<entidad>/
│   ├── api/
│   └── model/
└── shared/
    └── api/                      # transporte o API base compartidos

mocks/
├── handlers/
└── fixtures/
```

Responsabilidades concretas:

- `app/store/createAppStore.ts`: factoría basada en `configureStore`, registro de reducers y middleware e inferencia de `AppStore`, `RootState` y `AppDispatch`.
- `app/store/hooks.ts`: `useAppDispatch`, `useAppSelector` y `useAppStore` pretipados, separados del store para evitar dependencias circulares de runtime.
- `app/providers/AppStoreProvider/`: composición del `Provider` cuando un componente propio aporte valor; si el montaje directo es más claro, podrá realizarse en el punto de composición de providers sin crear un wrapper artificial.
- `<propietario>/model/<nombre>Slice.ts`: reducer creado con `createSlice` para estado cliente propiedad de una página, feature o entidad.
- `<propietario>/model/selectors.ts`: selectors del mismo estado, cuando existan.
- `<propietario>/api/types.ts`: argumentos, DTO y errores específicos del contrato remoto.
- `<propietario>/api/mappers.ts`: transformaciones entre transporte y dominio, solo cuando ambas representaciones difieran.
- `mocks/handlers/<dominio>.ts` y `mocks/fixtures/<dominio>.ts`: simulación del contrato HTTP aprobado.

No existirá un `src/slices/` global ni un `src/services/` global. El store compone módulos, pero no es propietario de la lógica de cada dominio.

### 10. API slices y endpoints

- Se utilizará normalmente una API slice creada con `createApi` por URL base. Varias URLs base o requisitos incompatibles podrán justificar más de una.
- Mientras una API tenga un único propietario y no necesite división, su `createApi` podrá vivir en `<propietario>/api/<nombre>Api.ts`.
- Cuando varios propietarios compartan la misma API slice, la definición base se promoverá a `shared/api/<servicio>Api.ts` y los endpoints se separarán por propietario mediante `injectEndpoints`.
- Los endpoints de lectura y mutación de una entidad vivirán en `entities/<entidad>/api/`.
- Los endpoints que implementen una acción de negocio vivirán en `features/<capacidad>/api/`.
- Los endpoints exclusivos de una ruta podrán permanecer en `pages/<Page>/api/` hasta que aparezca reutilización real.
- Los hooks generados se exportarán desde el módulo que define o inyecta los endpoints. Los consumidores no importarán detalles internos de reducer, middleware o caché.
- La carga diferida podrá cargar e inyectar endpoints junto con su propietario. El consumidor importará el hook desde el módulo que ejecuta `injectEndpoints`, garantizando que la definición se registre antes de utilizarla.
- Las relaciones `providesTags` e `invalidatesTags` se definirán según escenarios de caché aprobados y permanecerán dentro de la API slice que las coordina.

No se creará una API base vacía en la plantilla. Podrá crearse al adoptar RTK Query cuando la separación por propietarios sea una necesidad real del proyecto.

### 11. Terminología

Para evitar ambigüedad, la documentación utilizará:

- **módulo arquitectónico**: carpeta con propietario semántico, como `entities/account`;
- **Redux slice**: estado cliente creado con `createSlice`;
- **API slice**: servicio creado con `createApi`;
- **módulo de endpoints**: archivo que define o inyecta endpoints y exporta sus contratos de consumo.

## Aplicación a la plantilla

Para aplicar este ADR:

1. Actualizar `AGENTS.md` con las reglas operativas de propiedad, promoción, dependencias y ubicación de estado y acceso a datos.
2. Actualizar `README.md` con un resumen de la estructura extensible.
3. Actualizar la relación documental de ADR-0005 sin cambiar el carácter opcional de RTK Query.
4. Actualizar `docs/architecture/guides/adoptar-rtk-query.md` sustituyendo `src/services/<dominio>/` por la estructura definida aquí.
5. No añadir dependencias, store, APIs, endpoints, carpetas vacías ni código de demostración.
6. Verificar enlaces, coherencia documental y `npm run check` antes de considerar aplicada la decisión.

La actualización de la plantilla no migrará automáticamente repositorios derivados existentes. Cada uno deberá adoptar la decisión mediante su propio control documental y una migración proporcional.

## Alternativas consideradas

### Carpetas técnicas globales

Agrupar todos los componentes, hooks, services y slices por tipo simplifica las primeras incorporaciones, pero dispersa una misma capacidad entre múltiples árboles y oculta su propietario.

### Feature folder para cada página

Mantiene agrupación funcional, pero duplica `pages/<nombre>` y `features/<nombre>` cuando la feature no existe fuera de esa ruta.

### Feature-Sliced Design completo desde la baseline

Aporta capas y dirección de dependencias bien definidas, pero crear todas sus capas y segmentos desde el inicio introduciría estructura vacía y reglas que una aplicación pequeña puede no necesitar. La decisión adopta sus principios de slices por dominio y dependencias descendentes de forma proporcional.

### Atomic Design como arquitectura principal

Es útil para clasificar elementos de un sistema visual, pero las categorías átomo, molécula y organismo no determinan la propiedad de routing, estado, contratos remotos o lógica de negocio.

### Store, services y slices centralizados

Facilita encontrar infraestructura Redux por tipo técnico, pero separa reducers, endpoints, DTO, selectors y consumidores de su dominio. La decisión centraliza únicamente la composición global y mantiene cada comportamiento con su propietario.

### API base vacía incluida en la plantilla

Evita una futura promoción, pero incorporaría Redux y un contrato estructural sin ningún endpoint ni consumidor. Contradice ADR-0005 y el principio de no crear infraestructura especulativa.

## Consecuencias

- Los proyectos derivados tendrán una regla verificable para ubicar código nuevo y promoverlo cuando cambie su reutilización.
- Las páginas podrán actuar como unidades funcionales completas sin duplicarse automáticamente bajo `features/`.
- Las carpetas `features/`, `entities/` y `shared/` aparecerán solo cuando exista contenido real.
- Los imports expresarán la dirección de dependencias y reducirán acoplamientos ascendentes o entre páginas.
- Algunos componentes cambiarán de ubicación al adquirir nuevos consumidores; ese movimiento explícito es el coste aceptado de evitar abstracciones anticipadas.
- RTK Query seguirá siendo opcional, pero su futura adopción no tendrá que decidir de nuevo dónde colocar store, hooks, API slices, endpoints, DTO, reducers, selectors, handlers o fixtures.
- La separación entre estado local, estado cliente y estado remoto reducirá duplicación y fuentes de verdad paralelas.
- La estructura puede producir rutas más profundas, compensadas por mayor cohesión y propiedad explícita.
- Los proyectos derivados anteriores a esta decisión no cambiarán hasta aprobar su propia adopción.

## Fuentes

- React, «Thinking in React»: <https://react.dev/learn/thinking-in-react>.
- React, «Understanding Your UI as a Tree»: <https://react.dev/learn/understanding-your-ui-as-a-tree>.
- Feature-Sliced Design, «Overview»: <https://fsd.how/docs/get-started/overview/>.
- Feature-Sliced Design, «Layers»: <https://fsd.how/docs/reference/layers/>.
- Brad Frost, «Atomic Design Methodology»: <https://atomicdesign.bradfrost.com/chapter-2/>.
- Redux, «Redux Essentials, Part 2: Redux Toolkit App Structure»: <https://redux.js.org/tutorials/essentials/part-2-app-structure>.
- Redux, «Usage with TypeScript»: <https://redux.js.org/usage/usage-with-typescript>.
- Redux Toolkit, «Generated API Slices»: <https://redux-toolkit.js.org/rtk-query/api/created-api/overview>.
- Redux Toolkit, «Code Splitting»: <https://redux-toolkit.js.org/rtk-query/usage/code-splitting>.
