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

## Enrutamiento y despliegue

`src/main.tsx` monta `BrowserRouter` y `src/app/App/index.tsx` declara la tabla de rutas. La baseline contiene únicamente la ruta `/`, que renderiza la página vacía inicial.

Las URL limpias requieren que el alojamiento devuelva `index.html` cuando una ruta de aplicación no corresponda a un archivo físico. Sin ese fallback, el servidor puede responder con un error antes de que React Router resuelva la URL.

### Carga diferida de páginas

Las nuevas páginas reales de ruta se cargan por defecto mediante `React.lazy`, importación dinámica y una frontera `Suspense`. La frontera debe cubrir únicamente el área pendiente y mantener visibles el layout y la navegación persistentes. Su fallback será visible, ligero, accesible y traducido mediante la infraestructura i18n del proyecto.

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

`RouteLoading` representa un componente real del proyecto derivado, con texto traducido y comportamiento accesible; la plantilla no incorpora uno ficticio. La página vacía `Home` permanece estática porque es mínima y se necesita inmediatamente. Cualquier otra excepción deberá justificarse en el plan técnico.

La separación debe comprobarse en la salida del build y en la red del navegador. Solo debe afirmarse una mejora de rendimiento cuando exista una comparación antes/después del tamaño transferido o del tiempo de carga. `Suspense` en este patrón representa espera de código: no sustituye la estrategia de datos ni modifica `useSuspense` de react-i18next. Véase [ADR-0006](docs/architecture/decisions/0006-carga-diferida-rutas-suspense.md).

## Capacidades opcionales

RTK Query no forma parte de la baseline. Cuando una feature real de un proyecto derivado necesite datos remotos, su adopción debe justificarse mediante la especificación y el plan técnico correspondientes, aplicando [ADR-0005](docs/architecture/decisions/0005-rtk-query-capacidad-opcional.md) y la [guía de adopción](docs/architecture/guides/adoptar-rtk-query.md).

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
