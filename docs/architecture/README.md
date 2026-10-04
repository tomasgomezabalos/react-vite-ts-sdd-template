# Índice de arquitectura

Este directorio registra decisiones técnicas vinculantes y guías para aplicarlas. Los ADR continúan vigentes mientras no estén marcados como `SUPERSEDED` o exista una relación explícita que modifique parte de su decisión.

## Decisiones vigentes

| ADR | Estado | Decisión efectiva | Relaciones principales |
| --- | --- | --- | --- |
| [ADR-0001](decisions/0001-platform.md) | `APPROVED` | Plataforma React, Vite, TypeScript, pruebas, MSW e i18n. | ADR-0002 sustituye su elección inicial de lint; ADR-0008 amplía su organización. |
| [ADR-0002](decisions/0002-eslint.md) | `APPROVED` | ESLint con configuración plana. | Sustituye la elección de Oxlint en ADR-0001. |
| [ADR-0003](decisions/0003-sass.md) | `APPROVED` | Sass/SCSS y estilos locales proporcionales. | Complementa la plataforma. |
| [ADR-0004](decisions/0004-react-router-base-spa.md) | `APPROVED` | React Router 8 declarativo como base obligatoria. | ADR-0006 y ADR-0007 modifican su exclusión histórica de carga diferida. |
| [ADR-0005](decisions/0005-rtk-query-capacidad-opcional.md) | `APPROVED` | RTK Query permanece fuera de la baseline y se adopta solo con necesidad aprobada. | ADR-0008 precisa la propiedad de su infraestructura futura. |
| [ADR-0006](decisions/0006-carga-diferida-rutas-suspense.md) | `APPROVED` | Fronteras, fallback, datos, errores y verificación de carga diferida. | ADR-0007 elimina sus excepciones para páginas. |
| [ADR-0007](decisions/0007-carga-diferida-obligatoria-paginas.md) | `APPROVED` | Todas las páginas de ruta utilizan carga diferida sin excepciones estáticas. | Modifica ADR-0004 y ADR-0006. |
| [ADR-0008](decisions/0008-organizacion-modular-por-propiedad.md) | `APPROVED` | Propiedad semántica, promoción progresiva y dependencias descendentes. | Amplía ADR-0001 y precisa ADR-0005. |
| [ADR-0009](decisions/0009-ciclo-vida-sdd-y-evidencias.md) | `APPROVED` | Separa vigencia documental, entrega y evidencias de validación. | Modifica el workflow y precisa constitución y política de cambios. |
| [ADR-0010](decisions/0010-alcance-y-derivacion-de-la-plantilla.md) | `APPROVED` | Limita la baseline a SPA cliente y define derivación, bootstrap y diagnóstico seguros. | Precisa ADR-0001 y ADR-0004; separa plataforma y producto. |
| [ADR-0011](decisions/0011-calidad-automatizada-y-runtime.md) | `APPROVED` | Fija runtime y una única puerta local/CI con cobertura, integridad documental y límites arquitectónicos. | Amplía ADR-0001, ADR-0002 y ADR-0008; su aplicación se definirá en PLAT-004. |

## Decisiones vigentes incorporadas posteriormente

| ADR | Estado | Decisión efectiva | Relaciones principales |
| --- | --- | --- | --- |
| [ADR-0012](decisions/0012-bootstrap-minimo-y-descubrimiento-progresivo.md) | `APPROVED` | Reduce el bootstrap a destino e identidad y pospone el producto al flujo SDD. | Modifica parcialmente ADR-0010; su aplicación se especifica mediante PLAT-005. |
| [ADR-0013](decisions/0013-separacion-pruebas-aplicacion-y-plantilla.md) | `APPROVED` | Separa las pruebas y cobertura de aplicación de la suite de mantenimiento de la plantilla. | Modifica parcialmente ADR-0011; su aplicación se especifica mediante PLAT-006. |
| [ADR-0014](decisions/0014-derivados-sin-herramientas-de-plantilla.md) | `APPROVED` | Los proyectos derivados no reciben el bootstrap, su diagnóstico ni su estado; separa los proyectos de Vitest. | Modifica parcialmente ADR-0010, ADR-0012 y ADR-0013; su aplicación se especifica mediante PLAT-007. |
| [ADR-0015](decisions/0015-endurecimiento-lint-formato-y-tipado.md) | `APPROVED` | TypeScript más estricto, ESLint con tipos (`recommendedTypeChecked`), Prettier con `format:check` en la puerta e i18n tipado. | Amplía ADR-0001 y ADR-0002; modifica parcialmente ADR-0011 §2 (secuencia de `check`); su aplicación requiere un cambio `QUICK`. |
| [ADR-0016](decisions/0016-pruebas-de-accesibilidad-con-axe-core.md) | `APPROVED` | Pruebas de accesibilidad con `axe-core` en Vitest; e2e y presupuesto de bundle fuera de la baseline. | Completa ADR-0015; precisa la estrategia de pruebas de ADR-0001 y ADR-0013; su aplicación requiere un cambio `QUICK`. |
| [ADR-0017](decisions/0017-runtime-node-lts-vigente.md) | `APPROVED` | Permanecer en Node 22.23.2 y migrar a Node 26 cuando entre en LTS (2026-10-28). | Modifica parcialmente ADR-0011 §1 y PLAT-004 REQ-01/AC-01 cuando se aplique; su aplicación requiere un cambio `QUICK`. |
| [ADR-0018](decisions/0018-registro-de-entrega-de-los-cambios-quick.md) | `APPROVED` | La entrega de los cambios QUICK se registra por defecto en su propio `quick-change.md`, sin el criterio de «trivial»; el informe independiente queda para FULL. | Modifica parcialmente ADR-0009 §4; su aplicación se especifica mediante PLAT-024. |
| [ADR-0019](decisions/0019-ci-de-herramientas-solo-en-la-plantilla.md) | `APPROVED` | La CI de `test:tools` pasa a un workflow propio de la plantilla, excluido de la derivación; `quality.yml` queda limpio. | Modifica parcialmente ADR-0013 §3; aplica el principio de ADR-0014; su aplicación se especifica mediante PLAT-025. |
| [ADR-0020](decisions/0020-mantenimiento-de-la-frescura-de-la-plantilla.md) | `APPROVED` | `template:freshness` (solo lectura) como paso previo a derivar y aviso mensual; las actualizaciones siguen el flujo SDD. | Complementa ADR-0011, ADR-0014 y ADR-0017; precisa el flujo de derivación de ADR-0010 y ADR-0012; su aplicación se especifica mediante PLAT-026. |

## Guías vigentes

- [Adoptar RTK Query](guides/adoptar-rtk-query.md): criterios y estructura para proyectos que aprueben esta capacidad opcional.
- [Robustez de la SPA en un derivado](guides/robustez-spa-en-derivados.md): 404, errores de render, chunks fallidos, título/foco, `index.html` y cabeceras que cada derivado debe decidir.

## Regla de lectura

El índice resume el contrato efectivo, pero no sustituye el contenido de cada ADR. Cuando una decisión haya sido modificada parcialmente, se leerán conjuntamente el ADR original y sus modificadores. Una decisión nueva o transversal debe aprobarse mediante el flujo `ADR` antes de implementarse. Los ADR anteriores a ADR-0009 pueden conservar su encabezado histórico y adoptarán el modelo nuevo únicamente cuando deban cambiar.
