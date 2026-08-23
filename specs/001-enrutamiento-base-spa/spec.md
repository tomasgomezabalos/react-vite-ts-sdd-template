# FEAT-001 — Enrutamiento base de la SPA

**Estado:** VALIDATED

**Fecha:** 2026-08-23

**Aprobación:** 2026-08-23

**Validación:** 2026-08-23

## Problema y resultado esperado

La plantilla debe proporcionar desde su creación una relación estable entre la URL y la vista renderizada, sin obligar a cada proyecto derivado a incorporar posteriormente la infraestructura básica de enrutamiento.

El resultado esperado es una SPA preparada para crecer a varias vistas que conserve inicialmente la página vacía y no añada comportamiento de producto.

## Alcance

- Proporcionar contexto de enrutamiento en la aplicación base.
- Asociar la URL raíz `/` con la página vacía existente.
- Mantener el mismo resultado observable en desarrollo normal, desarrollo con mocks y construcción de producción.
- Documentar el requisito de fallback del alojamiento para admitir acceso directo a URL limpias.

## Fuera de alcance

- Navegación visual, enlaces o menús.
- Layouts y páginas informativas.
- Página o contenido para rutas desconocidas.
- Rutas de dominio adicionales.
- Carga de datos, acciones, mutaciones, estado remoto o carga diferida.
- Cambios en el comportamiento de MSW o internacionalización.

## Flujo principal

1. La persona abre la aplicación en la URL raíz `/`.
2. La aplicación resuelve la URL mediante su infraestructura de enrutamiento.
3. La página vacía existente se renderiza sin añadir interfaz ni comportamiento de producto.

## Escenarios y criterios de aceptación

### AC-01 — Renderizado de la ruta raíz

- **Dado** que la aplicación se inicia en cualquiera de sus modos admitidos
- **Cuando** se carga la URL raíz `/`
- **Entonces** se renderiza el área principal vacía existente dentro del contexto de enrutamiento

### AC-02 — URL sin coincidencia

- **Dado** que el alojamiento ha devuelto la entrada de la SPA para una URL sin ruta definida
- **Cuando** la aplicación resuelve esa URL
- **Entonces** no se renderiza contenido de ruta ni se incorpora una página desconocida ficticia

### AC-03 — Preparación para rutas de producto

- **Dado** un proyecto derivado con una especificación y un plan técnico aprobados
- **Cuando** necesita añadir una nueva vista asociada a una URL
- **Entonces** puede incorporarla sobre la infraestructura de enrutamiento existente sin reorganizar el punto de entrada de la aplicación

### AC-04 — Requisito de alojamiento documentado

- **Dado** que la aplicación utiliza URL limpias
- **Cuando** se documenta su despliegue
- **Entonces** se indica que el alojamiento debe devolver `index.html` para rutas de aplicación que no correspondan a archivos físicos

## Requisitos transversales aplicables

- Accesibilidad: no se añade interfaz; se conserva el área principal semántica existente.
- Responsive: no aplica porque no se añade contenido visual ni layout.
- Internacionalización: no aplica porque no se añaden textos.
- Carga, vacío y error: se conserva deliberadamente el estado vacío; no hay operaciones asíncronas ni nuevos estados de error.

## Supuestos, riesgos y cuestiones abiertas

- **Supuesto:** la infraestructura seguirá el ADR-0004 aprobado.
- **Riesgo:** un alojamiento sin fallback de SPA responderá con error antes de que la aplicación pueda resolver una URL profunda.
- **Abierta:** ninguna cuestión funcional identificada.
