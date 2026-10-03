# Instrucciones para agentes

## Comunicación y alcance

- Trabajar en español, de forma directa, breve y verificable.
- No inventar requisitos, contratos, comandos ni resultados.
- Revisar el estado real del repositorio antes de modificarlo.
- Detenerse y solicitar una decisión si el cambio excede el alcance aprobado.

## Spec-Driven Development

- No implementar una capacidad nueva ni un cambio de comportamiento observable sin el respaldo documental aprobado que corresponda a su clasificación.
- Mantener trazabilidad entre requisito, escenario, decisión, implementación y prueba.
- Utilizar `Estado documental` (`DRAFT`, `APPROVED`, `SUPERSEDED`) para intención y decisiones, y `Estado de entrega` (`NOT_STARTED`, `IMPLEMENTED`, `VALIDATED`, `BLOCKED`, `NOT_APPLICABLE`) para ejecución, conforme a ADR-0009.
- No convertir un artefacto `DRAFT` en `APPROVED` ni una entrega `IMPLEMENTED` en `VALIDATED` sin aprobación o aceptación expresas.
- Registrar versión, persona, fecha y evidencia disponible al aprobar nuevos artefactos; no inventar identificadores ni utilizar un commit como sustituto de la aprobación.
- Mantener estable el contenido aprobado y registrar implementación y validación por separado cuando corresponda.
- Una aprobación autoriza solo el alcance indicado en la puerta correspondiente.
- Ante un cambio de alcance, actualizar y aprobar primero la documentación afectada.

## Clasificación obligatoria de cambios

Antes de modificar documentación o código, clasificar la petición como `FULL`, `QUICK`, `DIRECT` o `ADR` siguiendo `docs/sdd/change-policy.md`.

- `FULL`: capacidad nueva o cambio amplio o multiárea. Requiere el flujo SDD completo aplicable.
- `QUICK`: cambio observable pequeño y localizado. Preparar el delta proporcional mediante `docs/sdd/templates/quick-change.md` y actualizar únicamente los requisitos, criterios, pruebas y documentación realmente afectados.
- `DIRECT`: cambio interno sin modificación de comportamiento, contrato, requisito ni arquitectura. Puede modificarse código y pruebas directamente sin actualizar una spec.
- `ADR`: decisión arquitectónica duradera o transversal. Crear o actualizar el ADR antes de aplicar la decisión.

Cuando exista duda entre `DIRECT` y `QUICK`, utilizar `QUICK`.
Cuando un cambio inicialmente clasificado revele mayor impacto, detener la implementación y reclasificarlo.

Las reglas de aprobación de `docs/sdd/workflow.md` siguen siendo obligatorias para los artefactos que realmente deban cambiar. No regenerar documentación que continúe siendo correcta únicamente por formalidad.

### Antes de implementar

1. Leer `AGENTS.md`.
2. Leer el índice SDD y la constitución vigente.
3. Leer `docs/sdd/change-policy.md`.
4. Clasificar la petición.
5. Leer solamente los artefactos funcionales y arquitectónicos relevantes para el cambio.
6. Comprobar que la clasificación no contradice requisitos ni ADR vigentes.
7. Ejecutar el flujo correspondiente.

Para `DIRECT`, no se exige una nueva spec, plan o tareas si se ha confirmado que no cambia el comportamiento observable ni ningún contrato.

Al finalizar un alcance `FULL` o un `QUICK` que necesite evidencia persistente, utilizar `docs/sdd/templates/validation-report.md`. El informe pasa a `IMPLEMENTED` cuando el alcance termina y solo a `VALIDATED` tras contrastar criterios y obtener aceptación expresa. Commit, push, merge, despliegue y publicación requieren autorizaciones independientes.

## Alcance y derivación de la plantilla

- Aplicar ADR-0010 y ADR-0012: esta baseline está destinada a SPA React renderizadas en cliente, construidas con Vite y React Router declarativo; solicitarla expresamente selecciona esa arquitectura.
<!-- template-only:start -->
- Derivar únicamente una copia nueva y reconocible de la plantilla; no adoptar ni reconfigurar proyectos existentes mediante el bootstrap.
- Solicitar solo el destino absoluto y el nombre visible, proponer un nombre npm determinista y confirmar o corregir esa identidad antes del preview.
- No preguntar ni persistir durante el bootstrap visión, métricas, idoneidad detallada, idiomas, soporte, despliegue, entornos, repositorio, licencia, historial o calidad. Esas decisiones se incorporarán después mediante el flujo SDD cuando exista una necesidad real.
<!-- template-only:end -->
- Detener la derivación antes de escribir únicamente cuando se declare un requisito confirmado que no encaje con la SPA cliente; una incompatibilidad descubierta después requiere una decisión SDD antes del alcance afectado.
- Mantener el contrato e histórico de plataforma en `docs/platform/` y reservar `specs/` para visión, features, cambios y validaciones del producto derivado.
- No renombrar ni eliminar artefactos históricos de plataforma para reutilizar sus identificadores; utilizar los alias definidos en `docs/platform/README.md`.
<!-- template-only:start -->
- No asumir remoto, credenciales, licencia, visibilidad ni estrategia Git durante una derivación.
- Mantener bootstrap y diagnóstico separados conforme a PLAT-003 y PLAT-005: `template:doctor` será de solo lectura, comprobará solo la derivación técnica y no corregirá archivos.
- Antes de ejecutar el bootstrap, revisar la configuración (`project.config.json` ubicado fuera del destino), ejecutar el modo preview y presentar su lista de operaciones y token; `--apply` requiere autorización expresa para ese token y estado.
- No aplicar el bootstrap sobre el remoto canónico de la plantilla ni forzar archivos, symlinks o contenido divergente. Una recuperación transaccional requiere revisar el identificador y autorizar `--recover` expresamente.
- No añadir secretos a `project.config.json`; la inicialización no autoriza instalaciones, cambios Git, red, commit, despliegue ni publicación.
- Aplicar ADR-0014: ejecutar `template:init` y `template:doctor` desde la plantilla contra `--target`; copiar la plantilla respetando `derivation.exclude` de `tools/template/baseline-manifest.json`, de modo que el derivado no reciba `tools/template/**`, `tests/tools/template/**`, `project.config.json`, `.template-state.json` ni `.claude/settings.local.json`. Al modificar `tools/template/`, regenerar los hashes del manifiesto.
<!-- template-only:end -->

## Organización modular

- Aplicar ADR-0008 mediante las capas semánticas `app`, `pages`, `features`, `entities` y `shared`; crear únicamente las que tengan contenido real.
- Mantener cada componente, hook, modelo, acceso a datos, utilidad y asset junto a su propietario más cercano.
- Una página es la frontera de composición de una ruta y posee sus elementos privados; no crear una feature paralela con el mismo nombre por defecto.
- Crear `features/<capacidad>/` únicamente para una capacidad o acción de usuario con propietario propio y reutilización real.
- Crear `entities/<entidad>/` únicamente para un concepto de dominio estable compartido por varios propietarios.
- Utilizar `shared/ui`, `shared/api`, `shared/lib` o `shared/config` solo para elementos realmente compartidos que no dependan de capas superiores.
- Permitir `components`, `model`, `api`, `lib` y `assets` dentro de páginas, features o entidades solo cuando el segmento sea necesario.
- Promover un elemento únicamente hasta el menor propietario común cuando sus consumidores compartan contrato, responsabilidad y motivo de cambio; no abstraer similitudes accidentales.
- No crear carpetas técnicas globales `src/components`, `src/hooks`, `src/services` ni `src/slices`.
- Respetar la dirección `app → pages → features → entities → shared`; una página no importa otra página y ninguna capa importa desde otra situada por encima.
- Mantener tipos de props con su componente, tipos de dominio compartidos en `entities/<entidad>/model`, DTO y adaptadores junto al módulo `api`, y assets con su propietario.

## React y diseño

- Utilizar React funcional y TypeScript estricto.
- Antes de crear o modificar componentes React propios, cargar `@react-ts-feature-pattern` y declarar el modo utilizado.
- Crear componentes propios en `ComponentName/index.tsx` y sus pruebas espejo en `tests/.../ComponentName/index.test.tsx`.
- Si la skill contradice documentación aprobada, detenerse y solicitar una decisión.
- Cargar obligatoriamente todas las páginas reales de ruta mediante `React.lazy` e importaciones dinámicas, incluida la página inicial, dentro de una frontera `Suspense` que no retire el layout ni la navegación persistentes.
- Utilizar para cada página diferida un fallback visible, ligero, accesible y traducido mediante i18n; `Suspense` de código no sustituye los estados de obtención de datos ni `useSuspense` de react-i18next.
- No permitir importaciones estáticas excepcionales para páginas. Evaluar en el plan técnico los componentes que no sean páginas y aplicarles carga diferida solo cuando su peso, dependencias o aparición bajo demanda compensen las solicitudes, esperas y complejidad añadidas.
- Aplicar SOLID de forma pragmática y favorecer composición frente a herencia.
- Separar presentación, estado y acceso a datos solo cuando la complejidad lo justifique.
- No añadir clases, capas, patrones o abstracciones sin una necesidad concreta documentada.

## Estado y acceso a datos

- Mantener estado local de interfaz en el componente o hook propietario y elevarlo solo cuando varios consumidores necesiten coordinación.
- Si se adopta Redux Toolkit, colocar cada reducer creado con `createSlice` y sus selectors en el `model/` de la página, feature o entidad propietaria; `app/store` solo compone reducers, middleware, tipos inferidos y hooks Redux pretipados.
- Mantener el estado remoto en la caché de RTK Query cuando se adopte; no duplicarlo por defecto en un Redux slice.
- RTK Query continúa siendo opcional según ADR-0005 y no se instalará ni configurará antes de que una necesidad y un plan aprobados lo justifiquen.
- Utilizar normalmente una API slice creada con `createApi` por URL base. Si tiene un único propietario puede vivir en su `api/`; cuando varios propietarios la compartan, promover su base a `shared/api` y separar endpoints mediante `injectEndpoints` junto a cada propietario.
- Exportar los hooks generados desde el módulo que define o inyecta los endpoints; los componentes no importan reducer, middleware ni detalles internos de caché.
- Mantener argumentos y DTO en `api/types.ts`, adaptadores en `api/mappers.ts` cuando sean necesarios y contratos de dominio compartidos en `entities/<entidad>/model`.

## Pruebas y calidad

- Utilizar Node `22.23.2` y npm `10.9.8` conforme a `.nvmrc`, `packageManager` y `devEngines`; no relajar sus rangos ni actualizar una declaración de forma aislada.
- Utilizar `npm ci` para instalaciones limpias basadas en el lockfile.
- Mantener `npm run check` como puerta de aplicación local y de CI: lint, `format:check`, `docs:check`, `architecture:check`, pruebas con cobertura exclusiva de `src/` y build; no ejecutar `tests/tools/**` dentro de esa puerta.
- Mantener `npm run test:tools` como suite separada de mantenimiento de la plantilla, fuera de la cobertura y de la puerta de proyectos derivados; ejecutarla adicionalmente al modificar `tools/` o infraestructura propia de la plantilla.
- No omitir ni duplicar etapas de la puerta en CI; los comandos focalizados sirven para diagnóstico, no sustituyen el resultado completo.
- Mantener `docs:check` y `architecture:check` deterministas, sin red y de solo lectura respecto al repositorio.
- No presentar una inspección local del workflow como ejecución real de GitHub Actions ni una puerta correcta como garantía de aspectos fuera de su alcance declarado.
- Mantener las pruebas en `tests/`, reflejando la estructura de `src/` o `tools/` según su propietario; reservar `tests/setup/` para configuración compartida.
- Usar Vitest y React Testing Library para componentes y hooks React; no usar React Testing Library para código ajeno a React.
- Probar comportamiento observable y priorizar consultas accesibles.
- Incluir en la prueba de cada página o componente con interfaz una aserción con `expectNoAccessibilityViolations` (`tests/setup/axe.ts`, axe-core, WCAG 2.1 A y AA sin contraste), en los estados relevantes. Detecta solo un subconjunto de problemas y no sustituye la revisión manual de contraste, teclado, foco ni lector de pantalla (ADR-0016).
- Usar `user-event` para interacciones normales y `fireEvent` solo para eventos de bajo nivel.
- Fijar el idioma y restaurar handlers, mocks y estado global entre pruebas.
- Ejecutar `npm run check` antes de considerar terminado un cambio.

## MSW e internacionalización

- Mantener configuración, handlers y fixtures de MSW en `mocks/`, nunca en `src/` ni como infraestructura compartida de `tests/`.
- No importar MSW desde componentes o hooks de aplicación.
- Activar MSW en navegador solo mediante `npm run dev:mocks`; no iniciarlo en producción.
- Mantener configuración i18n en `src/i18n/` y traducciones en `src/locales/<language-code>/`.
- Consumir textos mediante react-i18next; los componentes no deben importar JSON de traducciones.
