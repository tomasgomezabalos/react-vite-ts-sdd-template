# ADR-0002 — ESLint para análisis estático

**Estado:** APPROVED

**Aprobación:** 2026-08-22

**Sustituye:** La elección de Oxlint para análisis estático en ADR-0001. El resto de ADR-0001 permanece vigente.

## Contexto

La plantilla necesita priorizar compatibilidad con el ecosistema, plugins y configuraciones reutilizables frente a la ventaja de rendimiento y configuración mínima de Oxlint.

## Decisión

- Utilizar ESLint con configuración plana.
- Aplicar las reglas recomendadas de ESLint y TypeScript.
- Aplicar las configuraciones recomendadas de React Hooks y React Refresh para Vite.
- Mantener la comprobación estricta de tipos en TypeScript y la ejecución conjunta mediante `npm run check`.
- Añadir plugins adicionales únicamente cuando una necesidad aprobada lo justifique.

## Consecuencias

- Los proyectos derivados disponen del ecosistema completo de plugins, parsers, procesadores y configuraciones compartidas de ESLint.
- La baseline incorpora más dependencias de desarrollo que con Oxlint.
- No se incorpora `eslint-plugin-react` mientras no exista una regla necesaria que lo justifique.
