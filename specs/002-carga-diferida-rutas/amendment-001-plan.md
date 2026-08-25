# Plan técnico — Enmienda 001 de FEAT-002 Carga diferida obligatoria para páginas

**Estado:** VALIDATED

**Fecha:** 2026-08-25

**Aprobación:** 2026-08-25

**Implementación:** 2026-08-25

**Validación:** 2026-08-25

## Especificación y alcance autorizado

- Especificación: `specs/002-carga-diferida-rutas/amendment-001-obligatoriedad-paginas.md` (`VALIDATED`).
- Decisión: ADR-0007 (`APPROVED`).
- Criterios cubiertos: AC-A01 a AC-A04.
- Alcance ejecutable: convertir `Home` en una página de ruta diferida, incorporar un fallback de ruta traducido y accesible, adaptar las pruebas y verificar la separación generada.
- Alcance documental: alinear ADR-0004, ADR-0006, `AGENTS.md` y `README.md` con la obligatoriedad para páginas y la evaluación selectiva para componentes.
- Fuera de alcance: añadir rutas, navegación, layouts, datos, peticiones HTTP, dependencias, precarga, recuperación de errores de descarga, Data Mode, Framework Mode, cambios en `useSuspense` de react-i18next o propagación a repositorios derivados.

## Decisiones y diseño

- ADR aplicables: ADR-0001 y ADR-0004 mantienen la plataforma; ADR-0006 conserva sus reglas de fronteras y verificación; ADR-0007 elimina las excepciones estáticas para páginas.
- React: antes de modificar o crear componentes propios se cargará `@react-ts-feature-pattern` en modo `strict` para cubrir el nuevo componente y el comportamiento diferido modificado.
- Página diferida: `src/app/App/index.tsx` declarará `Home` mediante `lazy` en ámbito de módulo y adaptará su export nombrado al contrato `default` esperado por React.
- Frontera: cada elemento de ruta diferido quedará envuelto en `Suspense`. En la baseline, la frontera de `/` sustituirá únicamente el área de página; no existe todavía layout o navegación persistente.
- Fallback: se creará `src/app/RouteLoading/index.tsx` como componente presentacional pequeño. Comunicará la espera mediante un estado accesible y obtendrá el texto desde i18n.
- Carga inicial: `RouteLoading` permanecerá estático porque debe estar disponible antes del módulo pendiente y su responsabilidad es mínima; no es una página ni un candidato razonable a carga diferida.
- Contrato visual: `Home` seguirá renderizando el mismo `<main />` vacío una vez resuelto. El fallback será temporal y no añadirá contenido permanente a la baseline.
- Rutas no coincidentes: `/unknown` continuará sin renderizar contenido de ruta y no deberá solicitar el módulo exclusivo de `Home`.
- Componentes no-ruta: `AGENTS.md` exigirá evaluar peso, dependencias, aparición y secuencia de revelado en el plan de cada feature, sin imponer `lazy` de forma mecánica.
- Evidencia: la existencia de un chunk separado demostrará división técnica; no se afirmará una mejora de rendimiento para la página vacía sin comparación antes/después.
- Alternativas descartadas: mantener `Home` estática, envolver toda la aplicación en una única frontera, usar un literal no traducido, diferir el propio fallback, cambiar el export público de `Home` o incorporar una biblioteca de análisis.

## Cambios previstos

| Archivo o área | Cambio | Requisito relacionado |
| --- | --- | --- |
| `src/app/App/index.tsx` | Sustituir la importación estática de `Home` por `lazy`, importación dinámica y `Suspense` con fallback de ruta. | AC-A01, AC-A02 |
| `src/app/RouteLoading/index.tsx` | Crear el fallback presentacional, accesible y traducido. | AC-A01, AC-A02 |
| `src/locales/en/common.json` | Añadir el texto inglés del estado de carga de página. | AC-A01, AC-A02 |
| `tests/app/App/index.test.tsx` | Adaptar las aserciones al módulo diferido y cubrir raíz, espera y URL sin coincidencia. | AC-A01, AC-A02 |
| `tests/app/RouteLoading/index.test.tsx` | Verificar el estado accesible y el texto traducido del fallback. | AC-A01, AC-A02 |
| `AGENTS.md` | Exigir carga diferida sin excepciones para páginas y evaluación selectiva para componentes. | AC-A03, AC-A04 |
| `README.md` | Documentar el patrón obligatorio real de la baseline y los criterios para componentes. | AC-A03, AC-A04 |
| `docs/architecture/decisions/0004-react-router-base-spa.md` | Registrar que ADR-0007 refuerza la convención de carga diferida aplicable a todas las páginas. | AC-A04 |
| `docs/architecture/decisions/0006-carga-diferida-rutas-suspense.md` | Registrar su modificación por ADR-0007 sin reescribir la decisión histórica. | AC-A04 |
| Enmienda funcional y este plan | Registrar implementación, evidencias y estados SDD sin alterar el histórico de FEAT-002. | AC-A01 a AC-A04 |

## Dependencias e instalaciones

- Ninguna.
- No se modificarán `package.json`, `package-lock.json` ni `.nvmrc`.

## Estrategia de pruebas

- Componentes: Vitest y React Testing Library verificarán el contenido final de `Home` y el estado accesible de `RouteLoading` mediante consultas por rol.
- Integración del router: `MemoryRouter` cubrirá `/`, el estado pendiente de forma determinista, el contenido final y `/unknown` sin contenido ni fallback de ruta.
- Internacionalización: las pruebas utilizarán la configuración compartida y comprobarán la traducción inglesa sin importar el JSON desde componentes.
- Build: `npm run build` deberá producir un fragmento separado para `Home` y conservar una entrada correcta.
- Navegador: comprobar `/` con limitación de red para observar fallback y contenido final; comprobar `/unknown`; revisar solicitudes y consola.
- Regresión completa: ejecutar `npm run check` con la versión Node fijada en `.nvmrc`.
- Medición: registrar tamaños de entrada y chunk, pero no declarar mejora de rendimiento salvo que exista comparación válida antes/después.

## Tareas

1. Registrar ADR-0007 como modificador de ADR-0004 y ADR-0006 sin reescribir sus decisiones históricas.
2. Cargar `@react-ts-feature-pattern` y declarar modo `strict` antes de tocar componentes.
3. Crear `RouteLoading` y su prueba espejo con texto i18n y semántica accesible.
4. Convertir `Home` en importación dinámica de ámbito de módulo y envolver el elemento de `/` en `Suspense`.
5. Adaptar las pruebas de `App` para cubrir espera, resolución y ruta no coincidente de forma determinista.
6. Actualizar `AGENTS.md` y `README.md` con la obligatoriedad para páginas y la evaluación selectiva para componentes.
7. Ejecutar las pruebas focalizadas y revisar que no se hayan añadido dependencias ni cambios fuera de alcance.
8. Ejecutar `npm run check`, inspeccionar la salida de build y validar el comportamiento y la red en navegador.
9. Registrar evidencias y pasar la enmienda y el plan a `IMPLEMENTED`, sin declararlos `VALIDATED` hasta la aceptación expresa.

## Evidencias de implementación

- `react-ts-feature-pattern` se aplicó en modo `strict`; `RouteLoading` no necesita props, tipos propios, estilos ni un hook local.
- `src/app/App/index.tsx` mantiene `lazy` en ámbito de módulo, adapta el export nombrado de `Home` y limita `Suspense` al elemento de `/`.
- `RouteLoading` utiliza react-i18next y el texto inglés `routes.loading`; no altera `useSuspense` ni incorpora dependencias.
- Las pruebas focalizadas pasan: 3 archivos y 4 pruebas cubren fallback, resolución, `Home` y ruta desconocida.
- `npm run check` pasa con Node `v22.23.2` y npm `10.9.8`: lint correcto, 4/4 pruebas, TypeScript correcto y build Vite `8.2.2` correcto.
- El build genera `Home-wncrxAzV.js` con `0.10 kB` (`0.11 kB` gzip) separado de `index-BtmvuxHY.js`, con `275.48 kB` (`88.15 kB` gzip).
- En navegador, `/` observa el recurso `Home-wncrxAzV.js`; `/unknown` no lo observa y no renderiza contenido de ruta. No hay errores ni advertencias de consola.
- Una preview temporal retrasó exclusivamente el chunk `Home` `1.2 s`: se observó el estado accesible `Loading page...`, su desaparición y el `<main>` vacío final sin errores.
- `package.json`, `package-lock.json`, `.nvmrc`, rutas y dependencias permanecen sin cambios.
- No se declara mejora de rendimiento: la evidencia confirma code splitting y comportamiento, no una comparación de rendimiento antes/después.

## Riesgos, reversión y validación

- Riesgos: que la prueba del fallback dependa de la velocidad real del import; que una frontera demasiado amplia oculte contenido persistente en proyectos derivados; que los documentos históricos parezcan contradictorios si no se marca la modificación; que se confunda un chunk adicional con una mejora medida.
- Mitigaciones: controlar la resolución del módulo en la prueba, mantener la frontera en el elemento de ruta, enlazar ADR-0007 desde los ADR afectados y separar evidencia de división de evidencia de rendimiento.
- Reversión: restaurar la importación estática de `Home`, retirar `RouteLoading` y su traducción/pruebas, y devolver únicamente las referencias documentales de esta enmienda, conservando cualquier cambio ajeno presente entonces.
- Comandos de validación: pruebas Vitest focalizadas, `npm run check`, `git diff --check`, búsquedas con `rg` sobre `lazy`, `Suspense`, excepciones y ADR-0007, e inspección de archivos generados por `npm run build`.
- Evidencias necesarias para pasar a `IMPLEMENTED`: código y documentos dentro del alcance, pruebas focalizadas correctas, `npm run check` correcto, chunk diferido identificable, navegador sin errores ni solicitudes fallidas y registro honesto de tamaños.
- Evidencias necesarias para pasar a `VALIDATED`: contraste de AC-A01 a AC-A04 con las evidencias anteriores y aceptación expresa del resultado.
