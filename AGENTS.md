# Instrucciones para agentes

## Comunicación y alcance

- Trabajar en español, de forma directa, breve y verificable.
- No inventar requisitos, contratos, comandos ni resultados.
- Revisar el estado real del repositorio antes de modificarlo.
- Detenerse y solicitar una decisión si el cambio excede el alcance aprobado.

## Spec-Driven Development

- No implementar una feature sin especificación funcional y plan técnico aprobados.
- Mantener trazabilidad entre requisito, escenario, decisión, implementación y prueba.
- No convertir un artefacto `DRAFT` en `APPROVED` sin aprobación expresa.
- Una aprobación autoriza solo el alcance indicado en la puerta correspondiente.
- Ante un cambio de alcance, actualizar y aprobar primero la documentación afectada.

## React y diseño

- Utilizar React funcional y TypeScript estricto.
- Antes de crear o modificar componentes React propios, cargar `@react-ts-feature-pattern` y declarar el modo utilizado.
- Crear componentes propios en `ComponentName/index.tsx` y sus pruebas espejo en `tests/.../ComponentName/index.test.tsx`.
- Si la skill contradice documentación aprobada, detenerse y solicitar una decisión.
- Aplicar SOLID de forma pragmática y favorecer composición frente a herencia.
- Separar presentación, estado y acceso a datos solo cuando la complejidad lo justifique.
- No añadir clases, capas, patrones o abstracciones sin una necesidad concreta documentada.

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
