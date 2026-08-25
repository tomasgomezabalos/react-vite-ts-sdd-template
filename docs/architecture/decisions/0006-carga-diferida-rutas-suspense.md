# ADR-0006 — Carga diferida de rutas con React lazy y Suspense

**Estado:** APPROVED

**Aprobación:** 2026-08-25

**Relación:** Modifica la exclusión de carga diferida definida en ADR-0004. El resto de ADR-0004 permanece vigente.

**Modificada por:** ADR-0007 elimina las excepciones de importación estática para páginas, incluida `Home`. Las reglas de este ADR para fronteras, fallbacks, componentes, datos, errores y verificación permanecen vigentes.

**Especificación:** `specs/002-carga-diferida-rutas/spec.md` (`VALIDATED`).

## Contexto

La plantilla establece React Router como infraestructura obligatoria, pero ADR-0004 excluye actualmente la carga diferida de su baseline. Como consecuencia, cada importación estática de una página puede incorporar su código y el de sus dependencias al grafo de carga inicial, aunque el usuario no visite esa ruta durante la sesión.

React permite declarar componentes mediante `lazy` para solicitar su módulo cuando se intenta renderizar por primera vez. Mientras ese código se resuelve, la frontera `Suspense` más cercana muestra un contenido alternativo. Esta separación puede reducir el JavaScript incluido en la entrada inicial y evitar cargar anticipadamente rutas o bloques opcionales.

La división también tiene costes: crea fragmentos y solicitudes adicionales, una ruta inicial diferida se solicita inmediatamente al arrancar y una frontera mal situada puede sustituir contenido ya visible por un indicador de carga. Por tanto, la carga diferida será una convención predeterminada con excepciones justificadas, no una optimización que se presupondrá efectiva sin verificación.

## Decisión

- Declarar mediante `React.lazy` las páginas reales asociadas a rutas de aplicación y cargarlas con importaciones dinámicas, salvo que exista una excepción justificada.
- Mantener las declaraciones `lazy` en ámbito de módulo, fuera de los componentes React, para conservar estable la identidad del componente.
- Envolver el contenido diferido de las rutas en una frontera `Suspense` situada de forma que el layout y la navegación persistentes no desaparezcan durante la carga.
- Utilizar un `fallback` visible, ligero, accesible, traducido mediante la infraestructura i18n del proyecto y coherente con el área sustituida. No bloquear toda la aplicación cuando pueda mantenerse visible una estructura útil.
- Tratar la carga diferida como comportamiento de carga de código. `Suspense` no sustituye la estrategia de obtención de datos ni se activa por peticiones iniciadas dentro de un efecto.
- Mantener los exports nombrados exigidos por `react-ts-feature-pattern`. Cuando `lazy` consuma uno de esos módulos, adaptar la importación dinámica al contrato `{ default: Component }` sin cambiar el contrato público del componente.
- Permitir una importación estática cuando el plan técnico justifique que la carga diferida no aporta una mejora razonable o perjudica la experiencia, por ejemplo en una página inicial mínima, un módulo ya incluido necesariamente en la entrada o un entorno que gestione esta división mediante su framework. La página vacía `Home` de la baseline constituye la primera excepción aprobada porque es mínima y se necesita inmediatamente.
- Considerar también la carga diferida para componentes costosos que no forman parte de la interfaz inicial y aparecen bajo demanda, como mapas, editores, visualizadores ricos, diálogos complejos, pestañas secundarias o gráficas respaldadas por bibliotecas pesadas.
- No dividir componentes pequeños, elementos inmediatamente visibles ni secciones cuyo aislamiento solo aumente solicitudes, estados de espera o complejidad sin un ahorro significativo.
- Decidir las fronteras según la secuencia de revelado que deba percibir el usuario. No crear una frontera por componente de forma mecánica.
- Tratar por separado los fallos de descarga del módulo: `Suspense` cubre la espera, pero no sustituye una frontera de error. Cada aplicación incorporará el tratamiento de error que exijan sus requisitos aprobados.
- Verificar en cada implementación la división generada por el build y la red observada en navegador. Cualquier afirmación de mejora deberá comparar además el tamaño transferido o el tiempo de carga antes y después.

## Alcance de la plantilla

La baseline deberá documentar el patrón de página de ruta diferida, su frontera `Suspense` y los criterios de excepción, sin añadir navegación visual, rutas de dominio, loaders, actions, obtención de datos ni comportamiento de producto.

La página vacía `Home` conservará su importación estática y no incorporará `Suspense` porque separarla añadiría una solicitud sin un ahorro significativo en la baseline actual. Los proyectos derivados deberán aplicar el patrón a sus nuevas páginas reales por defecto y documentar en su plan técnico cualquier excepción. La adopción en proyectos ya derivados será un cambio independiente sujeto a sus propias puertas SDD; no se propagará automáticamente desde la plantilla.

Este ADR no modifica la configuración `useSuspense` de react-i18next, que pertenece al ciclo de carga de recursos de internacionalización y no al code splitting de las páginas.

## Verificación esperada para una implementación futura

- Pruebas de rutas que cubran el contenido final y un fallback visible, accesible y traducido cuando exista una página realmente diferida.
- Construcción de producción correcta y evidencia de que las páginas diferidas generan fragmentos separados cuando el bundler pueda separarlas.
- Comprobación en navegador de la carga inicial, la navegación entre rutas, la permanencia del layout y la ausencia de errores de consola o solicitudes fallidas.
- Ejecución completa de `npm run check` antes de considerar implementado el cambio.

## Alternativas consideradas

- **Mantener todas las páginas con importaciones estáticas:** conserva una ejecución y unas pruebas simples, pero incorpora anticipadamente código de rutas que pueden no visitarse.
- **Aplicar `lazy` a todos los componentes:** maximiza la fragmentación teórica, pero añade solicitudes, fallbacks y complejidad incluso cuando no existe ahorro significativo.
- **Diferir solo rutas secundarias:** evita una solicitud separada inmediata para la ruta inicial, pero introduce una excepción implícita y puede mantener una página inicial costosa dentro de la entrada sin evaluar su impacto.
- **Adoptar Data Mode o Framework Mode de React Router:** puede integrar mejor navegación, datos y estados pendientes, pero amplía el modelo de enrutamiento más allá del modo declarativo aprobado en ADR-0004.
- **Delegar la decisión por completo a cada proyecto derivado:** permite máxima adaptación local, pero repite una decisión transversal y no establece una convención común para la plantilla.

## Consecuencias

- Las páginas de ruta tendrán una convención común de división de código y estado de espera.
- La entrada inicial podrá excluir código de rutas todavía no renderizadas, sujeto al grafo real de dependencias y a las decisiones del bundler.
- La página `Home` de la baseline permanecerá estática; cualquier otra excepción deberá justificarse con los criterios aprobados.
- Los planes técnicos deberán justificar excepciones y seleccionar fronteras y fallbacks adecuados.
- La estrategia conservará los exports nombrados de los componentes y no requerirá cambiar `react-ts-feature-pattern`.
- La separación se verificará mediante el build y la red del navegador; cualquier afirmación de mejora exigirá comparar tamaño transferido o tiempo de carga.
- La aprobación de este ADR permitirá utilizar la decisión en un plan técnico, pero no autorizará por sí sola cambios de código, dependencias, commits ni publicación.

## Fuentes

- React, «lazy»: <https://react.dev/reference/react/lazy>.
- React, «Suspense»: <https://react.dev/reference/react/Suspense>.
- React, «Build a React app from Scratch — Code-splitting»: <https://react.dev/learn/build-a-react-app-from-scratch#code-splitting>.
- React Router, «Automatic Code Splitting» (Framework Mode): <https://reactrouter.com/explanation/code-splitting>.
