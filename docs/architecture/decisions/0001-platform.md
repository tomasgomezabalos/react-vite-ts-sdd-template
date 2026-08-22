# ADR-0001 — Plataforma de la plantilla

**Estado:** APPROVED

**Aprobación:** 2026-08-22

## Contexto

La plantilla necesita una base frontend tipada, pruebas de interfaz, simulación HTTP e internacionalización sin incorporar comportamiento de producto.

## Decisión

- React funcional, Vite y TypeScript estricto.
- Vitest para ejecutar pruebas.
- React Testing Library, jest-dom y user-event para componentes y hooks React, con jsdom como entorno DOM.
- MSW para simular HTTP en pruebas y, mediante activación explícita, en desarrollo local.
- i18next y react-i18next, con recursos importados desde `src/locales/`.
- Análisis estático según la decisión vigente en ADR-0002.
- Versiones reproducibles mediante `package-lock.json` y Node indicado en `.nvmrc`.

## Organización

- `src/`: aplicación, `src/i18n/` y `src/locales/`.
- `tests/`: espejo de `src/`; `tests/setup/` es la excepción de configuración.
- `mocks/`: entrada de desarrollo con mocks, worker, servidor, handlers y fixtures compartidos de MSW.

El código bajo `src/` no depende de MSW. El modo `mock` sustituye la entrada de la aplicación por `mocks/main.ts`, inicia `mocks/public/mockServiceWorker.js` y después carga `src/main.tsx`. El desarrollo normal y la construcción de producción cargan directamente la aplicación, no inician MSW y no copian el worker a la salida.

## Consecuencias

- La plantilla funciona con un idioma y sin endpoints ficticios.
- Cada proyecto derivado debe añadir contratos, handlers, traducciones y decisiones solo cuando una feature aprobada lo requiera.
