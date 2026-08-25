# ADR-0004 — React Router como base de las SPA

**Estado:** APPROVED

**Aprobación:** 2026-08-23

**Relación:** Amplía la plataforma definida en ADR-0001.

**Modificada por:** ADR-0006 sustituye únicamente la exclusión general de carga diferida por una convención predeterminada con excepciones justificadas. El resto de esta decisión permanece vigente.

## Contexto

La plantilla proporciona una aplicación React mínima y sin comportamiento de producto. Los proyectos derivados que presentan varias vistas necesitan relacionar URL, navegación e interfaz, pero incorporar esa infraestructura durante una feature obliga a repetir la misma decisión y reorganizar el punto de entrada.

Aunque una SPA inicial tenga una sola vista, esta plantilla está orientada a aplicaciones web de producto y establece el enrutamiento como una capacidad transversal obligatoria de su plataforma base.

## Decisión propuesta

- Incluir el paquete `react-router` como dependencia de producción obligatoria de la plantilla.
- Adoptar la línea estable 8.x de React Router.
- Utilizar el modo declarativo mediante `BrowserRouter`, `Routes` y `Route`.
- Mantener `src/main.tsx` como punto de composición de proveedores y delegar la tabla de rutas en `src/app/App/index.tsx`.
- Conservar únicamente una ruta inicial mínima que renderice la página vacía de la plantilla.
- Utilizar `MemoryRouter` en las pruebas que necesiten contexto o navegación controlada.
- Seleccionar en el plan técnico una versión estable 8.x compatible con React y el resto de la plataforma.
- Elevar al implementar el contrato de Node a una versión compatible con React Router 8, como mínimo `22.22.0`, y reflejar conjuntamente los cambios en `package.json`, `.nvmrc` y `package-lock.json`.
- Documentar que las URL limpias con `BrowserRouter` requieren que el alojamiento devuelva `index.html` para rutas de aplicación que no correspondan a archivos físicos.

La base no incorporará navegación visual, layout, página informativa, página de ruta desconocida, rutas de dominio, loaders, actions, obtención de datos ni carga diferida. Mientras no exista una ruta desconocida aprobada, una URL sin coincidencia no renderizará contenido de ruta. Cada proyecto derivado añadirá esos elementos únicamente cuando una especificación y un plan aprobados los requieran.

## Alternativas consideradas

- **No incluir router:** mantiene una base menor, pero no satisface el contrato de plataforma que esta decisión propone y traslada a cada proyecto la misma instalación y reorganización cuando aparece una segunda vista.
- **Mantener React Router 7:** permitiría conservar el Node actual, pero incorporaría a una plantilla nueva una línea mayor anterior existiendo una versión estable compatible con React y Vite actuales.
- **Utilizar Data Mode o Framework Mode:** aporta carga de datos, acciones y otras convenciones que exceden las necesidades neutrales de la plantilla y condicionan su futura capa de datos.
- **Utilizar `HashRouter`:** evita configurar el fallback del alojamiento, pero introduce fragmentos en las URL y no será la opción predeterminada para aplicaciones con rutas limpias.

## Consecuencias

- Los proyectos derivados dispondrán de enrutamiento desde su creación sin recibir páginas ni navegación de producto.
- La plantilla añadirá una dependencia de producción y deberá mantener su compatibilidad con Node y React.
- La adopción de React Router 8 requerirá elevar la versión de Node fijada actualmente por la plantilla.
- El alojamiento de cada proyecto deberá contemplar el fallback de SPA cuando use rutas limpias.
- Las aplicaciones de una sola vista conservarán el router como parte de la plataforma base.

## Fuentes

- React, «Build a React app from Scratch — Routing»: <https://react.dev/learn/build-a-react-app-from-scratch#routing>.
- React Router, «Picking a Mode»: <https://reactrouter.com/start/modes>.
- React Router, «Declarative — Installation»: <https://reactrouter.com/start/declarative/installation>.
- React Router, «Changelog — v8.0.0 Baseline Support»: <https://reactrouter.com/home/changelog#v800>.
