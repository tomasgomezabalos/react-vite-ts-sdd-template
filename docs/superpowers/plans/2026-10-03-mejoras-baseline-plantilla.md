# Plan de mejora de la baseline de la plantilla

> **Para agentes:** este documento es una hoja de ruta por fases, no un plan de implementación ejecutable. Cada fase debe convertirse en su propio plan detallado (`superpowers:writing-plans`) y clasificarse según `docs/sdd/change-policy.md` antes de tocar nada. Usa `superpowers:subagent-driven-development` o `superpowers:executing-plans` por fase.

**Objetivo:** que cada repositorio derivado nazca con prácticas actuales de seguridad, calidad, accesibilidad y mantenimiento, sin romper la filosofía de baseline mínima (ADR-0012: no añadir infraestructura especulativa).

**Fecha de revisión:** 2026-10-03. Estado revisado: `main` en `fbd8cb4`, árbol limpio.

## Restricciones globales

- Todo cambio se clasifica `FULL` / `QUICK` / `DIRECT` / `ADR` antes de empezar (AGENTS.md). Las decisiones transversales (Node, lint, formato, CSP) son `ADR`.
- `AGENTS.md`, `README.md`, `index.html`, `package.json` y `package-lock.json` son *managed files*: al modificarlos hay que regenerar los hashes de `tools/template/baseline-manifest.json` y ejecutar `npm run test:tools` además de `npm run check` (AGENTS.md, ADR-0014).
- No asumir licencia, remoto, visibilidad ni estrategia Git del derivado (AGENTS.md). Los ficheros de gobernanza de GitHub solo se incluyen si no fijan esas decisiones.
- Aprobaciones y `VALIDATED` los da el usuario; este plan no los concede.

## Qué está bien (no tocar)

Runtime fijado y coordinado (`.nvmrc`, `engines`, `devEngines`), acciones de GitHub fijadas por SHA, `permissions: contents: read`, `concurrency`, `timeout-minutes`, puerta única `npm run check`, TypeScript estricto, `erasableSyntaxOnly`, carga diferida obligatoria con `Suspense`, `architecture:check` y `docs:check` deterministas, `npm audit` sin vulnerabilidades hoy, MSW aislado del código de aplicación.

## Hallazgos y propuesta

Prioridad: **P1** = riesgo real o regresión silenciosa; **P2** = buena práctica con valor claro; **P3** = opcional / decisión de gusto.

### Fase 1 — Higiene y seguridad de repo (P1, mayormente `DIRECT`/`QUICK`)

| # | Hallazgo (verificado en el repo) | Acción | Clase |
|---|---|---|---|
| 1.1 | `.claude/settings.local.json` **no está en `.gitignore`** (`git check-ignore` no devuelve nada). Solo se excluye de la derivación, pero puede commitearse en la plantilla. | Añadirlo a `.gitignore`. | DIRECT |
| 1.2 | `@types/node` está en `^24` pero el runtime soportado es Node `22.x`: los tipos permiten APIs que no existen en 22. | Bajar a `^22` (alineado con `.nvmrc`). | DIRECT |
| 1.3 | No hay Dependabot/Renovate. `npm outdated` muestra ~20 paquetes atrasados (react 19.3.0, vite 8.3.2, react-router 8.4.0, eslint 10.12, etc.). Las acciones de GitHub fijadas por SHA no se actualizarán solas. | Añadir `.github/dependabot.yml` (npm + github-actions, agrupado, semanal). Aplicar primero las actualizaciones menores/patch en un cambio aparte. | QUICK |
| 1.4 | `actions/checkout` sin `persist-credentials: false`. | Añadirlo en `quality.yml`. | DIRECT |
| 1.5 | CI sin análisis de seguridad. | Workflow separado y programado (no dentro de `check`, para mantener determinismo): `npm audit --omit=dev` + `dependency-review-action` en PR; CodeQL opcional. | QUICK |
| 1.6 | Sin `.editorconfig`, `.gitattributes` (EOL) ni `.npmrc` (`engine-strict=true`). | Añadir los tres, mínimos. | DIRECT |

### Fase 2 — Calidad de código (P2, requiere `ADR`)

| # | Hallazgo | Acción | Clase |
|---|---|---|---|
| 2.1 | ESLint solo usa `recommended`: sin reglas con información de tipos ni accesibilidad. | `tseslint.configs.recommendedTypeChecked` (o `strict`) y `eslint-plugin-jsx-a11y`. Evaluar impacto en `tools/`. | ADR + QUICK |
| 2.2 | Sin formateador: el estilo (sin `;`, comillas simples) existe pero no se aplica. | Prettier (o Biome) + `format` / `format:check`; integrar `format:check` en `check` solo si el ADR lo decide. | ADR |
| 2.3 | TS sin `noUncheckedIndexedAccess`, `noImplicitOverride`, `noUncheckedSideEffectImports`. | Activarlos en `tsconfig.app.json` y `tsconfig.node.json`; corregir lo que aparezca. | QUICK |
| 2.4 | Claves i18n sin tipado: `t('routes.loadng')` compila. | Declarar `CustomTypeOptions` de i18next apoyado en `resources` (según documentación de i18next; confirmar sintaxis de la v26). | QUICK |
| 2.5 | Umbrales de cobertura bajos (branches 55 %). Con una app vacía no es problema, pero es la barrera de todos los derivados. | Decidir en ADR si se suben (p. ej. 80/70/80/80) o se mantienen; no inventar cifras sin medir. | ADR |
| 2.6 | Pre-commit hooks ausentes. | Opcional (lefthook/husky + lint-staged). La puerta oficial sigue siendo `check`. | P3 |

### Fase 3 — Robustez de la SPA (P2, `QUICK`/`FULL`: cambia comportamiento observable)

> **Actualización 2026-10-03:** 3.1 y 3.2 contradicen contrato aprobado (ADR-0004, PLAT-001 AC-02, PLAT-002/ADR-0006), así que se reclasificaron: no entran en la baseline. 3.1–3.5 quedan recogidos en la guía `docs/architecture/guides/robustez-spa-en-derivados.md` (`DRAFT`). Si se quisiera cambiar la baseline, haría falta un ADR nuevo que modifique ADR-0004 y ADR-0006.

| # | Hallazgo | Acción |
|---|---|---|
| 3.1 | Una URL desconocida renderiza **pantalla en blanco** (solo existe la ruta `/`). | Ruta `*` con página `NotFound` (lazy, traducida, accesible). |
| 3.2 | Sin `ErrorBoundary`. Un fallo de render, o un chunk `lazy` que falla tras un despliegue nuevo, deja la app en blanco. | Error boundary en `app/` con fallback traducido y acción de recarga; prueba de chunk fallido. |
| 3.3 | `index.html`: `lang="en"` fijo, sin `meta description`, `theme-color`, favicon ni `<noscript>`. | Completar (managed file → regenerar hashes). El `lang` dinámico depende de cuándo haya segundo idioma. |
| 3.4 | Navegación SPA sin gestión de foco ni de `document.title` por ruta (React Router no lo hace). | Documentar el patrón en una guía y aplicarlo cuando exista la primera página real; no implementarlo ahora (YAGNI). |
| 3.5 | Sin guía de despliegue segura: fallback a `index.html`, cabeceras (CSP, `X-Content-Type-Options`, `Referrer-Policy`), caché de `assets/` con hash. | Guía en `docs/architecture/guides/` sin elegir proveedor (ADR-0012). |

### Fase 4 — Pruebas y verificación (P2)

| # | Hallazgo | Acción |
|---|---|---|
| 4.1 | Sin pruebas automáticas de accesibilidad. | `vitest-axe` (o `jest-axe`) en las pruebas de página/layout. |
| 4.2 | Sin e2e. | Playwright mínimo con un smoke test, en workflow aparte y opcional; el ADR debe decidir si entra en `check`. |
| 4.3 | Sin control de tamaño de bundle. | Registrar el tamaño por chunk en CI como informe; fijar presupuesto solo con medición real (README ya exige antes/después). |
| 4.4 | CI en un solo runner. | Mantener; añadir subida del informe de cobertura como artefacto si se desea. |

### Fase 5 — Gobernanza del derivado (P3, respetando "no asumir licencia/remoto")

- `.github/pull_request_template.md` con la clasificación SDD (`FULL/QUICK/DIRECT/ADR`) y el enlace a la evidencia de validación.
- `CODEOWNERS`, `SECURITY.md`, `CONTRIBUTING.md`, plantillas de issues: incluir solo plantillas sin datos personales; `CODEOWNERS` y `SECURITY.md` requieren datos del propietario, así que mejor como paso opcional posterior al bootstrap (ADR-0012).
- `LICENSE`: **no incluir**; documentar en el README que es una decisión pendiente del derivado.
- `.env.example` y tipado de `import.meta.env`: diferir hasta la primera variable real, con una guía.

### Fase 6 — Runtime a futuro (decisión tuya, requiere `ADR`)

Node 22 es la versión fijada. Según el calendario público de Node (nodejs.org/en/about/previous-releases) 22 entra en fin de vida en 2027; **no he podido confirmarlo desde aquí, verifícalo antes de decidir**. Evaluar migrar a Node 24 LTS cambiando de forma coordinada `.nvmrc`, `engines`, `devEngines`, `packageManager`, lockfile, CI y `@types/node` (ADR-0011 §1).

Majors pendientes (evaluar uno a uno, no en bloque): TypeScript 7, Vitest/coverage 5, MSW 3, jsdom 30.

## Orden recomendado

1. Fase 1 (un PR pequeño, bajo riesgo).
2. Actualización de dependencias menores/patch.
3. Fase 3.1–3.3 (más visible para cualquier derivado).
4. Fase 2 (ADR de lint/formato, luego aplicar).
5. Fase 4, Fase 5, Fase 6 según prioridad.

Cada fase termina con `npm run check` (más `npm run test:tools` si toca `tools/` o managed files), informe de validación cuando corresponda y commit/push solo con tu autorización.

## Fuera de alcance de esta revisión

No he revisado el contenido de `tools/template/*` ni de `tools/quality/*` línea a línea, ni ejecutado `npm run check` o `test:tools` en esta sesión. La lectura de ADR/specs fue parcial (constitución y ADR-0011). Los hallazgos anteriores se basan en los ficheros de configuración, el código de `src/` y la salida de `npm outdated` / `npm audit` de hoy.
