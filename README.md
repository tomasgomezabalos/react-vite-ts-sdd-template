# React Vite TypeScript SDD Template

Plantilla mínima para iniciar SPA React renderizadas en cliente mediante Spec-Driven Development. La aplicación muestra deliberadamente una página en blanco: incluye infraestructura y reglas, pero ninguna feature de producto.

## Stack

- React funcional, Vite y TypeScript estricto.
- React Router 8 en modo declarativo para el enrutamiento base.
- Vitest, React Testing Library, jest-dom, user-event y jsdom, con axe-core para comprobaciones automáticas de accesibilidad.
- Mock Service Worker para desarrollo local explícito y pruebas HTTP.
- i18next y react-i18next con un idioma inicial.
- ESLint para análisis estático, con reglas de TypeScript con información de tipos (`recommendedTypeChecked`), React Hooks y React Refresh.
- Prettier para el formato de `ts`, `tsx`, `js`, `scss` y `json`.
- Sass/SCSS para estilos, mediante la integración nativa de Vite.

## Puesta en marcha

Requiere Node.js `22.23.2` y npm `10.9.8`. `.nvmrc`, `packageManager`, `engines` y `devEngines` mantienen el contrato coordinado y npm detiene los scripts cuando el entorno de desarrollo soportado no coincide.

```bash
nvm use
npm ci
npm run dev
```

El modo normal no inicia MSW. Para activarlo expresamente:

```bash
npm run dev:mocks
```

Comprobación completa, utilizada también por CI:

```bash
npm run check
```

La puerta de aplicación ejecuta una sola vez lint, comprobación de formato, integridad documental, límites arquitectónicos, pruebas con cobertura y build. Excluye las pruebas propias de `tools/`. Para aislar un diagnóstico pueden utilizarse:

```bash
npm run format:check
npm run docs:check
npm run architecture:check
npm run test:coverage
```

Cobertura del código ejecutable:

```bash
npm run test:coverage
```

La cobertura utiliza V8 e incluye únicamente `src/**/*.{ts,tsx}`. `npm test`, `npm run test:watch` y `npm run test:coverage` excluyen `tests/tools/**`; también quedan fuera declaraciones `*.d.ts`, módulos exclusivamente de tipos y, por extensión, estilos y assets. El informe generado se guarda en `coverage/`, que queda fuera de Git y ESLint. Los mínimos globales son 70 % de statements, 55 % de branches, 75 % de functions y 75 % de lines; no se aplican umbrales por archivo ni actualización automática.

Las utilidades de la plantilla conservan una suite separada, sin formar parte de la cobertura de aplicación:

```bash
npm run test:tools
```

`docs:check` valida enlaces Markdown locales, índices y metadatos SDD objetivos, incluidos los cambios `QUICK` aprobados, que deben contener las secciones de su plantilla, y su registro de entrega embebido (estado, archivos, resultados y aceptación completos cuando se declara `IMPLEMENTED` o `VALIDATED`), sin acceder a la red ni decidir si una aprobación es auténtica. `architecture:check` valida imports resolubles y las fronteras objetivas de ADR-0008, incluida la ausencia de carpetas técnicas globales (`src/components`, `src/hooks`, `src/services`, `src/slices`) y de imports de `msw`, de `mocks/` o de `src/locales/` fuera de `src/i18n/`; no infiere si dos features o entidades hermanas comparten semántica. `format:check` solo verifica el formato de `ts`, `tsx`, `js`, `scss` y `json`; `npm run format` lo aplica. Las claves de i18next están tipadas en `src/i18n/i18next.d.ts`, de modo que una clave inexistente falla al compilar. Las pruebas de páginas y componentes con interfaz incluyen `expectNoAccessibilityViolations` (axe-core, WCAG 2.1 A y AA); no comprueba contraste, teclado, foco ni lector de pantalla, que requieren revisión manual ([ADR-0016](docs/architecture/decisions/0016-pruebas-de-accesibilidad-con-axe-core.md)). No hay análisis estático de accesibilidad en JSX, porque `eslint-plugin-jsx-a11y` no declara soporte para ESLint 10 ([ADR-0015](docs/architecture/decisions/0015-endurecimiento-lint-formato-y-tipado.md)). Superar la puerta no demuestra por sí solo corrección funcional completa, accesibilidad visual, ausencia de vulnerabilidades ni validez jurídica.

`.github/workflows/quality.yml` ejecuta `npm ci` y la misma puerta de aplicación en pushes a `main` y pull requests. Las pruebas de las herramientas (`npm run test:tools`) se ejecutan en un workflow propio de la plantilla, `.github/workflows/template-tools.yml`, que no se deriva; los proyectos derivados no incorporan esa suite ni ese workflow a su puerta. Una inspección local del YAML no equivale a una ejecución real en GitHub.

`.github/workflows/security.yml` es independiente de la puerta: ejecuta `npm audit --omit=dev --audit-level=high` en pushes a `main`, pull requests y semanalmente. Depende de la red y de la base de avisos de npm, por lo que no forma parte de `npm run check`; solo informa de avisos conocidos de dependencias de producción y no demuestra ausencia de vulnerabilidades. `.github/dependabot.yml` propone semanalmente actualizaciones de npm y de las acciones de GitHub, agrupando menores y parches y excluyendo los mayores de `@types/node`, que debe seguir la versión de Node de `.nvmrc`, y las versiones `^7.0.0` de `typescript` y `^3.0.0` de `msw`, bloqueadas hoy por `typescript-eslint` y por la migración de tipos de MSW ([PLAT-013](docs/platform/specs/013-ignorar-majors-bloqueados-dependabot/quick-change.md)); cada regla indica en el YAML cuándo retirarla.

## Estructura

```text
src/                  código de aplicación, i18n y traducciones
tests/                pruebas espejo de src y configuración compartida
mocks/                worker, servidor, handlers y fixtures de MSW
tools/                herramientas de bootstrap, diagnóstico y calidad
specs/                visión, features y cambios del producto derivado
docs/platform/        contrato e histórico de la plataforma heredada
docs/sdd/             reglas, flujo y plantillas SDD
docs/architecture/    decisiones y guías técnicas sustituibles
.github/                workflows de calidad y seguridad, Dependabot y plantilla de pull request
```

Los índices de [plataforma](docs/platform/README.md), [SDD](docs/sdd/README.md) y [arquitectura](docs/architecture/README.md) identifican los documentos vigentes y sus relaciones. `specs/` queda reservado para el producto derivado.

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

## Alcance arquitectónico

Esta baseline está destinada a aplicaciones React renderizadas en el navegador, construidas como SPA con Vite, React Router declarativo y un backend externo cuando exista.

Elegir expresamente esta plantilla selecciona esa arquitectura SPA cliente sin exigir un cuestionario técnico previo. Si ya se conoce un requisito confirmado de SSR, SSG, RSC, backend o rutas de servidor, la derivación debe detenerse y elegir otra arquitectura; si la necesidad aparece después, se resolverá mediante el flujo SDD antes del alcance afectado. [ADR-0010](docs/architecture/decisions/0010-alcance-y-derivacion-de-la-plantilla.md) y [ADR-0012](docs/architecture/decisions/0012-bootstrap-minimo-y-descubrimiento-progresivo.md) definen el límite vigente.

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

## Iniciar un cambio

1. Leer `AGENTS.md`, la constitución, el workflow y la política de cambios enlazados desde el [índice SDD](docs/sdd/README.md).
2. Clasificar la petición como `FULL`, `QUICK`, `DIRECT` o `ADR` antes de modificar documentación o código.
3. Para `FULL`, copiar `docs/sdd/templates/feature-spec.md` a `specs/<id>-<nombre>/spec.md`, completar únicamente requisitos observables y obtener su aprobación expresa antes de preparar el plan técnico.
4. Preparar y aprobar `docs/sdd/templates/technical-plan.md` únicamente cuando el flujo aplicable lo exija.
5. Para `QUICK`, actualizar solo los requisitos, criterios, pruebas y documentación realmente afectados; para `DIRECT`, confirmar primero que no cambia comportamiento, contrato, requisito ni arquitectura.
6. Crear o actualizar un ADR antes de aplicar una decisión técnica duradera o transversal.
7. Implementar exclusivamente el alcance aprobado, validar y presentar evidencias sin inferir autorización de commit o publicación.

No se incluye una feature de ejemplo para evitar decisiones ficticias y mantener limpia la plantilla.

## Reutilización

Esta base se utiliza siempre para crear una copia nueva; el bootstrap no adopta ni reconfigura proyectos existentes. La derivación no elimina historial Git, crea remotos, instala dependencias ni publica nada sin autorización expresa. Solo establece la identidad técnica inicial. La visión, las features y las decisiones de producto se crean después, cuando exista información real y mediante la puerta SDD correspondiente.

### Inicialización segura

El bootstrap y el diagnóstico se ejecutan siempre desde esta plantilla contra el destino (`--target`). El proyecto derivado no recibe `tools/template/**`, `tests/tools/template/**`, `project.config.json` ni `.template-state.json` ([ADR-0014](docs/architecture/decisions/0014-derivados-sin-herramientas-de-plantilla.md)).

1. Crear una copia nueva de la plantilla en el destino absoluto elegido, sin `.git`, `node_modules`, `dist`, `coverage` ni las rutas de `derivation.exclude` de `tools/template/baseline-manifest.json`. `template:init` rechaza un destino que las contenga.
2. Elegir el nombre visible. Proponer el nombre npm de forma determinista en minúsculas y con separadores `-`, confirmarlo o corregirlo, y crear una configuración **fuera del destino** con únicamente `schemaVersion: 2` e `identity.displayName` / `identity.packageName`. El ejemplo y el esquema están en `tools/template/`.

La versión inicial es `0.1.0`, el título HTML coincide con el nombre visible y el idioma, la ruta base y `npm run check` se heredan de la baseline. No son preguntas ni campos configurables del bootstrap.

3. Previsualizar sin escritura, desde la plantilla:

```bash
npm run template:init -- --target <destino> --config <configuracion.json>
```

4. Revisar todos los archivos y conservar el token SHA-256 mostrado.
5. Aplicar exactamente ese estado:

```bash
npm run template:init -- --target <destino> --config <configuracion.json> --apply --preview-token <sha256>
```

El token deja de ser válido si cambia la configuración, el destino o cualquier archivo gestionado. La aplicación rechaza el remoto canónico de la plantilla, archivos desconocidos o divergentes y una inicialización con otra configuración. Es idempotente sin estado persistido: repetirla con la misma configuración no cambia nada. Utiliza un diario transaccional; si una interrupción deja un diario, la herramienta bloqueará otra aplicación e indicará el identificador que debe revisarse antes de ejecutar `--recover <id>`.

En el destino modifica `package.json` y `package-lock.json` (identidad y retirada de los scripts `template:*`), `index.html` (título), `README.md` (renderizado sin referencias al bootstrap) y `AGENTS.md` (sin el bloque `template-only`). La inicialización no genera visión, métricas, despliegue ni `.env.example`; tampoco instala dependencias, modifica Git, usa la red, publica o despliega.

### Diagnóstico

```bash
npm run template:doctor -- --target <destino> --config <configuracion.json>
```

`template:doctor` es de solo lectura: clasifica comprobaciones técnicas como `PASS`, `WARN`, `FAIL` o `UNKNOWN` y admite `--format json`. Debe ejecutarse justo después de aplicar; comprueba que las salidas gestionadas coinciden con la configuración y no evalúa preparación funcional ni decisiones de producto o despliegue. La búsqueda de secretos, placeholders y vulnerabilidades está limitada a patrones observables y no sustituye una auditoría.

[PLAT-003](docs/platform/specs/003-inicializacion-segura-proyecto/spec.md) conserva las garantías operativas y [PLAT-005](docs/platform/specs/005-bootstrap-minimo-progresivo/spec.md) define el contrato mínimo vigente.
