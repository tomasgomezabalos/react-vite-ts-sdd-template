# React Vite TypeScript SDD Template

Plantilla mínima para iniciar aplicaciones React mediante Spec-Driven Development. La aplicación muestra deliberadamente una página en blanco: incluye infraestructura y reglas, pero ninguna feature de producto.

## Stack

- React funcional, Vite y TypeScript estricto.
- React Router 8 en modo declarativo para el enrutamiento base.
- Vitest, React Testing Library, jest-dom, user-event y jsdom.
- Mock Service Worker para desarrollo local explícito y pruebas HTTP.
- i18next y react-i18next con un idioma inicial.
- ESLint para análisis estático, con reglas de TypeScript, React Hooks y React Refresh.
- Sass/SCSS para estilos, mediante la integración nativa de Vite.

## Puesta en marcha

Requiere Node.js 22.22 o posterior; `.nvmrc` fija la versión usada para validar la plantilla.

```bash
nvm use
npm install
npm run dev
```

El modo normal no inicia MSW. Para activarlo expresamente:

```bash
npm run dev:mocks
```

Comprobación completa:

```bash
npm run check
```

Cobertura del código ejecutable:

```bash
npm run test:coverage
```

La cobertura utiliza V8 e incluye únicamente `src/**/*.{ts,tsx}`. Excluye las declaraciones `*.d.ts`, los módulos exclusivamente de tipos `types.ts` y, por extensión, estilos y assets. El informe generado se guarda en `coverage/`, que queda fuera de Git y ESLint. La baseline informa los porcentajes, pero no impone umbrales mínimos.

## Estructura

```text
src/                  código de aplicación, i18n y traducciones
tests/                pruebas espejo de src y configuración compartida
mocks/                worker, servidor, handlers y fixtures de MSW
specs/                especificaciones de producto del proyecto derivado
docs/sdd/             reglas, flujo y plantillas SDD
docs/architecture/    decisiones y guías técnicas sustituibles
```

`mocks/public/mockServiceWorker.js` es un artefacto generado por MSW para el navegador. El modo `dev:mocks` utiliza una entrada propia bajo `mocks/`, inicia el worker y después carga la aplicación. El desarrollo normal y la construcción de producción usan directamente `src/main.tsx` y no incluyen el worker.

### Organización modular extensible

La estructura de aplicación se basa en propiedad semántica y promoción progresiva:

```text
src/
├── app/          composición global, rutas, providers, store y layouts
├── pages/        páginas de ruta y todos sus elementos privados
├── features/     capacidades de usuario reutilizables, cuando existan
├── entities/     conceptos de dominio compartidos, cuando existan
└── shared/       UI e infraestructura realmente compartidas, cuando existan
```

La baseline no crea `features`, `entities` ni `shared` mientras estén vacías. Dentro de una página, feature o entidad pueden aparecer `components`, `model`, `api`, `lib` y `assets`, pero solo cuando tengan contenido real.

Un componente o módulo permanece junto a su propietario más cercano. Si adquiere consumidores adicionales, se promueve únicamente hasta el menor ámbito común y solo cuando los usos compartan contrato, responsabilidad y motivo de cambio. No se crean árboles técnicos globales como `src/components`, `src/services` o `src/slices`.

Las dependencias siguen la dirección `app → pages → features → entities → shared`; pueden omitirse capas intermedias. Una página no importa otra página y las capas inferiores no dependen de las superiores. Las pruebas bajo `tests/` reflejan la ubicación efectiva de `src/`.

La convención completa, incluidas las ubicaciones futuras de Redux Toolkit y RTK Query, está definida en [ADR-0008](docs/architecture/decisions/0008-organizacion-modular-por-propiedad.md).

## Enrutamiento y despliegue

`src/main.tsx` monta `BrowserRouter` y `src/app/App/index.tsx` declara la tabla de rutas. La baseline contiene únicamente la ruta `/`, que renderiza la página vacía inicial.

Las URL limpias requieren que el alojamiento devuelva `index.html` cuando una ruta de aplicación no corresponda a un archivo físico. Sin ese fallback, el servidor puede responder con un error antes de que React Router resuelva la URL.

### Carga diferida de páginas

Todas las páginas reales de ruta se cargan obligatoriamente mediante `React.lazy`, importación dinámica y una frontera `Suspense`, incluida la página inicial. No se admiten excepciones con importaciones estáticas para páginas. La frontera debe cubrir únicamente el área pendiente y mantener visibles el layout y la navegación persistentes. Su fallback será visible, ligero, accesible y traducido mediante la infraestructura i18n del proyecto.

Los componentes conservan exports nombrados. El adaptador de la importación dinámica proporciona a `lazy` el contrato `default` sin cambiar el contrato público del módulo:

```tsx
import { lazy, Suspense } from 'react'
import { Route } from 'react-router'

const Reports = lazy(() =>
  import('../../pages/Reports').then(({ Reports }) => ({ default: Reports })),
)

<Route
  path="/reports"
  element={
    <Suspense fallback={<RouteLoading />}>
      <Reports />
    </Suspense>
  }
/>
```

`RouteLoading` es un componente real de la baseline, con texto traducido y comportamiento accesible. La página vacía `Home` utiliza este mismo patrón en `/`, de modo que los proyectos derivados reciben un ejemplo ejecutable de la regla desde su creación.

Los componentes que no sean páginas se evalúan individualmente en el plan técnico. Solo se cargan de forma diferida cuando su peso, sus dependencias, su aparición bajo demanda o su posición fuera de la interfaz inicial compensan las solicitudes, esperas y complejidad añadidas. No se aplica `lazy` mecánicamente a componentes pequeños o inmediatamente visibles.

La separación debe comprobarse en la salida del build y en la red del navegador. Solo debe afirmarse una mejora de rendimiento cuando exista una comparación antes/después del tamaño transferido o del tiempo de carga. `Suspense` en este patrón representa espera de código: no sustituye la estrategia de datos ni modifica `useSuspense` de react-i18next. Véanse [ADR-0006](docs/architecture/decisions/0006-carga-diferida-rutas-suspense.md) y [ADR-0007](docs/architecture/decisions/0007-carga-diferida-obligatoria-paginas.md).

## Capacidades opcionales

RTK Query no forma parte de la baseline. Cuando una feature real de un proyecto derivado necesite datos remotos, su adopción debe justificarse mediante la especificación y el plan técnico correspondientes, aplicando [ADR-0005](docs/architecture/decisions/0005-rtk-query-capacidad-opcional.md), la organización de [ADR-0008](docs/architecture/decisions/0008-organizacion-modular-por-propiedad.md) y la [guía de adopción](docs/architecture/guides/adoptar-rtk-query.md).

## Estilos

`src/index.scss` contiene únicamente los estilos globales mínimos. Las futuras features pueden utilizar `styles.module.scss` para estilos locales. Los módulos Sass compartidos deben usar `@use` y `@forward`; no se crean variables, mixins o abstracciones hasta que exista una necesidad aprobada.

## Crear la primera feature

1. Copiar `docs/sdd/templates/feature-spec.md` a `specs/<id>-<nombre>/spec.md` y completar únicamente requisitos observables.
2. Obtener aprobación expresa de la especificación.
3. Copiar `docs/sdd/templates/technical-plan.md` al mismo directorio y describir decisiones, archivos, dependencias, pruebas y tareas.
4. Obtener aprobación expresa del plan.
5. Implementar solo su alcance, validar y presentar evidencias.

No se incluye una feature de ejemplo para evitar decisiones ficticias y mantener limpia la plantilla.

## Reutilización

Cuando esta base esté aceptada, puede publicarse como repositorio plantilla de GitHub o copiarse localmente eliminando el historial Git. El proyecto derivado deberá sustituir este README, definir su visión y aprobar sus propias especificaciones y decisiones.
