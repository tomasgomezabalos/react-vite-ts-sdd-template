# Plan técnico — FEAT-001 Enrutamiento base de la SPA

**Estado:** VALIDATED

**Fecha:** 2026-08-23

**Aprobación:** 2026-08-23

**Validación:** 2026-08-23

## Especificación y alcance autorizado

- Especificación: `specs/001-enrutamiento-base-spa/spec.md` (`VALIDATED`).
- Criterios cubiertos: AC-01, AC-02, AC-03 y AC-04.
- Fuera de alcance: navegación visual, layouts, página de ruta desconocida, rutas de dominio adicionales, Data Mode, Framework Mode, loaders, actions, carga diferida, obtención de datos, Redux, RTK Query y cambios en MSW o internacionalización.

## Decisiones y diseño

- ADR aplicables: ADR-0001 y ADR-0004 (`APPROVED`). ADR-0005 se respeta manteniendo Redux Toolkit, React Redux y RTK Query fuera de la baseline.
- React Router: instalar `react-router` 8.x y utilizar exclusivamente el modo declarativo con `BrowserRouter`, `Routes`, `Route` y `MemoryRouter` para pruebas controladas.
- Composición: `src/main.tsx` conservará `StrictMode` y será responsable de montar `BrowserRouter`; `App` será responsable únicamente de declarar la tabla de rutas.
- Ruta inicial: `App` asociará `/` con la página `Home` existente. No se añadirá una ruta comodín; una URL sin coincidencia no renderizará contenido de ruta.
- Componentes propios: aplicar `react-ts-feature-pattern` en modo `strict` a `App`. Se creará solo `src/app/App/index.tsx`, con exportación nombrada y sin props, hook, tipos, estilos, constantes o utilidades innecesarias.
- Pruebas: la prueba espejo `tests/app/App/index.test.tsx` cubrirá el comportamiento observable perteneciente a `App`; no probará internals de React Router.
- Toolchain: conservar Node 22 y elevar la versión fijada desde `22.20.0` a `22.23.2`; elevar `engines.node` desde `>=22.12.0` a `>=22.22.0`, mínimo exigido por React Router 8.
- Alternativas descartadas: React Router 7, `react-router-dom`, Data Mode, Framework Mode, `HashRouter`, una ruta comodín ficticia y la extracción de hooks o abstracciones sin responsabilidad real.

## Cambios previstos

| Archivo o área | Cambio | Requisito relacionado |
| --- | --- | --- |
| `.nvmrc` | Fijar Node `22.23.2`. | ADR-0004 |
| `package.json` | Añadir `react-router` y elevar `engines.node` a `>=22.22.0`. | AC-01, AC-03 |
| `package-lock.json` | Registrar de forma reproducible la dependencia y el contrato Node actualizados. | AC-01, AC-03 |
| `src/app/App/index.tsx` | Declarar la ruta `/` que renderiza `Home`. | AC-01, AC-02, AC-03 |
| `src/main.tsx` | Montar `BrowserRouter` y delegar las rutas en `App`. | AC-01, AC-03 |
| `tests/app/App/index.test.tsx` | Verificar la ruta raíz y la ausencia de contenido de ruta para una URL sin coincidencia. | AC-01, AC-02 |
| `README.md` | Documentar React Router, Node mínimo y fallback de SPA para URL limpias. | AC-04 |
| `specs/001-enrutamiento-base-spa/spec.md` | Registrar el estado de implementación cuando se completen las comprobaciones. | AC-01 a AC-04 |
| `specs/001-enrutamiento-base-spa/plan.md` | Registrar tareas, evidencias y estado de implementación. | AC-01 a AC-04 |

## Dependencias e instalaciones

- Activar o instalar Node `22.23.2` mediante `nvm` si no está disponible localmente.
- Ejecutar `npm install react-router@8.3.0` bajo Node `22.23.2`; npm registrará la dependencia compatible en `package.json` y `package-lock.json`.
- No instalar Redux Toolkit, React Redux, RTK Query ni ninguna otra dependencia.

## Estrategia de pruebas

- Unitarias: no se introducen funciones puras ni lógica aislable que requiera pruebas unitarias.
- Componentes/hooks: Vitest y React Testing Library renderizarán `App` dentro de `MemoryRouter`; se comprobará el área principal vacía en `/` y la ausencia de contenido de ruta en una URL sin coincidencia. No se crea un hook local.
- HTTP/MSW: no aplica; no se añaden contratos ni peticiones HTTP y los handlers permanecen intactos.
- Integración: `npm run check` ejecutará ESLint, todas las pruebas y la construcción de producción con el Node fijado.
- Manuales: mediante el navegador interno, comprobar `/` en desarrollo normal, `dev:mocks` y `preview`; comprobar también una URL sin coincidencia servida con fallback por el entorno local aplicable.

## Tareas

1. Activar Node `22.23.2` y actualizar el contrato Node en `.nvmrc`, `package.json` y `package-lock.json`.
2. Instalar `react-router@8.3.0` y verificar que no se incorpora `react-router-dom`.
3. Crear `App` en modo `strict` con la única ruta inicial `/` hacia `Home`.
4. Integrar `BrowserRouter` y `App` en `src/main.tsx` sin alterar i18n, estilos globales ni `StrictMode`.
5. Crear la prueba espejo de `App` para AC-01 y AC-02.
6. Actualizar `README.md` con stack, requisito Node y fallback de SPA.
7. Ejecutar `npm run check` con Node `22.23.2` y corregir únicamente fallos causados por este alcance.
8. Validar manualmente los modos normal, mocks y preview mediante el navegador interno.
9. Registrar las evidencias y pasar especificación y plan a `IMPLEMENTED` sin declararlos `VALIDATED`.

## Evidencias de implementación

- Toolchain: Node `v22.23.2` y npm `10.9.8` activados mediante `.nvmrc`.
- Dependencia: `react-router@8.3.0` instalado como dependencia de producción; `react-router-dom`, Redux Toolkit, React Redux y RTK Query no están instalados.
- Pruebas focalizadas: 2 archivos y 3 pruebas correctas para `App` y `Home`.
- Validación completa: `npm run check` correcto; ESLint sin incidencias, 2 archivos y 3 pruebas correctas, TypeScript y build de Vite completados.
- Producción: `dist/` contiene únicamente `index.html` y assets CSS/JS; no contiene `mockServiceWorker.js` ni referencias a MSW.
- Desarrollo normal: `/` renderiza un único `main` vacío sin errores; `/unknown` no renderiza contenido de ruta.
- Desarrollo con mocks: `/` conserva el `main` vacío y la consola confirma `[MSW] Mocking enabled`; `/unknown` no renderiza contenido de ruta ni produce errores.
- Preview de producción: `/` renderiza el `main` vacío sin errores; el fallback local sirve `/unknown` y React Router no renderiza contenido de ruta.
- Observación: en desarrollo, React Router registra la advertencia esperada `No routes matched location` al abrir `/unknown`; `StrictMode` puede duplicarla. No se considera error y coincide con la ausencia deliberada de una ruta desconocida.

## Riesgos, reversión y validación

- Riesgos: incompatibilidad de alguna herramienta con Node `22.23.2`; cambios indirectos del lockfile; advertencia de React Router al resolver una URL sin coincidencia; configuración de alojamiento sin fallback que impida cargar rutas profundas.
- Reversión: retirar `BrowserRouter` y `App`, restaurar el render directo de `Home`, eliminar `react-router` y devolver los contratos Node y la documentación a sus valores previos. La reversión deberá conservar cualquier cambio ajeno que exista entonces.
- Comandos de validación: `node --version`, `npm --version`, `npm run check`, `npm run dev -- --host 127.0.0.1`, `npm run dev:mocks -- --host 127.0.0.1` y `npm run preview -- --host 127.0.0.1`.
- Evidencias necesarias para pasar a `VALIDATED`: `npm run check` correcto; ruta `/` verificada en los tres modos; URL sin coincidencia verificada sin contenido de ruta; producción sin MSW; documentación del fallback presente; confirmación expresa del resultado.
