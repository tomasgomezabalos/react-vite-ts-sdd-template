# Instrucciones para agentes

## Comunicación y alcance

- Trabajar en español, de forma directa, breve y verificable.
- No inventar requisitos, contratos, comandos ni resultados.
- Revisar el estado real del repositorio antes de modificarlo.
- Detenerse y solicitar una decisión si el cambio excede el alcance aprobado.

## Spec-Driven Development

- No implementar una capacidad nueva ni un cambio de comportamiento observable sin el respaldo documental aprobado que corresponda a su clasificación.
- Mantener trazabilidad entre requisito, escenario, decisión, implementación y prueba.
- No convertir un artefacto `DRAFT` en `APPROVED` sin aprobación expresa.
- Una aprobación autoriza solo el alcance indicado en la puerta correspondiente.
- Ante un cambio de alcance, actualizar y aprobar primero la documentación afectada.

## Clasificación obligatoria de cambios

Antes de modificar documentación o código, clasificar la petición como `FULL`, `QUICK`, `DIRECT` o `ADR` siguiendo `docs/sdd/change-policy.md`.

- `FULL`: capacidad nueva o cambio amplio o multiárea. Requiere el flujo SDD completo aplicable.
- `QUICK`: cambio observable pequeño y localizado. Actualizar únicamente los requisitos, criterios, pruebas y documentación realmente afectados.
- `DIRECT`: cambio interno sin modificación de comportamiento, contrato, requisito ni arquitectura. Puede modificarse código y pruebas directamente sin actualizar una spec.
- `ADR`: decisión arquitectónica duradera o transversal. Crear o actualizar el ADR antes de aplicar la decisión.

Cuando exista duda entre `DIRECT` y `QUICK`, utilizar `QUICK`.
Cuando un cambio inicialmente clasificado revele mayor impacto, detener la implementación y reclasificarlo.

Las reglas de aprobación de `docs/sdd/workflow.md` siguen siendo obligatorias para los artefactos que realmente deban cambiar. No regenerar documentación que continúe siendo correcta únicamente por formalidad.

### Antes de implementar

1. Leer `AGENTS.md`.
2. Leer la constitución vigente.
3. Leer `docs/sdd/change-policy.md`.
4. Clasificar la petición.
5. Leer solamente los artefactos funcionales y arquitectónicos relevantes para el cambio.
6. Comprobar que la clasificación no contradice requisitos ni ADR vigentes.
7. Ejecutar el flujo correspondiente.

Para `DIRECT`, no se exige una nueva spec, plan o tareas si se ha confirmado que no cambia el comportamiento observable ni ningún contrato.

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

- Mantener las pruebas en `tests/`, reflejando la estructura de `src/`; reservar `tests/setup/` para configuración compartida.
- Usar Vitest y React Testing Library para componentes y hooks React; no usar React Testing Library para código ajeno a React.
- Probar comportamiento observable y priorizar consultas accesibles.
- Usar `user-event` para interacciones normales y `fireEvent` solo para eventos de bajo nivel.
- Fijar el idioma y restaurar handlers, mocks y estado global entre pruebas.
- Ejecutar `npm run check` antes de considerar terminado un cambio.

## MSW e internacionalización

- Mantener configuración, handlers y fixtures de MSW en `mocks/`, nunca en `src/` ni como infraestructura compartida de `tests/`.
- No importar MSW desde componentes o hooks de aplicación.
- Activar MSW en navegador solo mediante `npm run dev:mocks`; no iniciarlo en producción.
- Mantener configuración i18n en `src/i18n/` y traducciones en `src/locales/<language-code>/`.
- Consumir textos mediante react-i18next; los componentes no deben importar JSON de traducciones.
