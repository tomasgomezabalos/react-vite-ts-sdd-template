# React Vite TypeScript SDD Template

Plantilla mínima para iniciar aplicaciones React mediante Spec-Driven Development. La aplicación muestra deliberadamente una página en blanco: incluye infraestructura y reglas, pero ninguna feature de producto.

## Stack

- React funcional, Vite y TypeScript estricto.
- Vitest, React Testing Library, jest-dom, user-event y jsdom.
- Mock Service Worker para desarrollo local explícito y pruebas HTTP.
- i18next y react-i18next con un idioma inicial.
- ESLint para análisis estático, con reglas de TypeScript, React Hooks y React Refresh.
- Sass/SCSS para estilos, mediante la integración nativa de Vite.

## Puesta en marcha

Requiere Node.js 22.12 o posterior; `.nvmrc` fija la versión usada para validar la plantilla.

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
docs/architecture/    decisiones técnicas sustituibles
```

`mocks/public/mockServiceWorker.js` es un artefacto generado por MSW para el navegador. El modo `dev:mocks` utiliza una entrada propia bajo `mocks/`, inicia el worker y después carga la aplicación. El desarrollo normal y la construcción de producción usan directamente `src/main.tsx` y no incluyen el worker.

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
