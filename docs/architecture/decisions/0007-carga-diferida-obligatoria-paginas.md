# ADR-0007 — Carga diferida obligatoria para páginas

**Estado:** APPROVED

**Fecha:** 2026-08-25

**Aprobación:** 2026-08-25

**Relación:** Modifica ADR-0006 eliminando las excepciones de importación estática para páginas. El resto de ADR-0006 permanece vigente.

**Especificación:** `docs/platform/specs/002-carga-diferida-rutas/amendment-001-obligatoriedad-paginas.md` (`VALIDATED`, alias `PLAT-002`).

## Contexto

ADR-0006 establece actualmente `React.lazy`, las importaciones dinámicas y `Suspense` como convención predeterminada para páginas, pero permite excepciones justificadas. La página `Home` de la baseline es una excepción aprobada porque es mínima y se necesita inmediatamente.

Esa flexibilidad hace que los proyectos derivados puedan adoptar criterios distintos para sus páginas y que la propia baseline no ejemplifique el patrón recomendado. Se requiere una regla uniforme: toda página real asociada a una ruta debe utilizar carga diferida, aunque corresponda a la ruta inicial, sea pequeña o se renderice inmediatamente.

Los componentes que no representan páginas tienen un perfil diferente. Dividirlos siempre puede aumentar el número de solicitudes, introducir esperas visibles y fragmentar la experiencia sin reducir de forma significativa la entrada inicial. Para ellos se mantiene una decisión basada en evidencia.

## Decisión

- Declarar todas las páginas reales asociadas a rutas mediante `React.lazy` e importaciones dinámicas, incluida la página de la ruta inicial.
- No permitir excepciones con importación estática para páginas por tamaño, prioridad de renderizado o presencia inmediata.
- Adaptar la página `Home` de la baseline para que deje de ser la excepción definida en ADR-0006 y muestre el patrón que heredarán los proyectos derivados.
- Mantener las declaraciones `lazy` en ámbito de módulo y conservar los exports nombrados de los componentes mediante la adaptación de la importación dinámica al contrato `{ default: Component }`.
- Renderizar cada página diferida dentro de una frontera `Suspense` con un `fallback` visible, ligero, accesible y traducido mediante la infraestructura i18n.
- Situar la frontera de forma que el layout, la navegación y otros elementos persistentes permanezcan utilizables siempre que no dependan del código pendiente.
- Evaluar individualmente los componentes que no sean páginas. Aplicar carga diferida solo cuando su peso, sus dependencias, su aparición bajo demanda o su posición fuera de la interfaz inicial produzcan un beneficio razonable.
- No dividir mecánicamente componentes pequeños, inmediatamente visibles o estrechamente acoplados a la primera composición cuando el aislamiento solo añada solicitudes, esperas o complejidad.
- Documentar en el plan técnico de cada feature la evaluación de los componentes candidatos y la frontera elegida cuando se aplique carga diferida.
- Verificar la separación mediante el build y la red del navegador. Respaldar cualquier afirmación de mejora con una comparación antes/después del tamaño transferido o del tiempo de carga.
- Mantener separadas la espera de código, la obtención de datos y la configuración `useSuspense` de react-i18next.

## Alcance de la plantilla

La baseline incorporará el patrón de ruta diferida en su página `Home` sin añadir rutas de producto, navegación visual, loaders, actions ni comportamiento de dominio. `AGENTS.md` y `README.md` expresarán la misma obligatoriedad para páginas y el criterio selectivo para componentes.

Los repositorios ya derivados no recibirán automáticamente el cambio. Cada uno deberá adoptarlo mediante su propia especificación, decisión y plan aprobados.

## Consecuencias

- Todos los proyectos nuevos partirán de un ejemplo ejecutable coherente con la norma de sus futuras páginas.
- Los planes técnicos no podrán justificar importaciones estáticas de páginas como excepción.
- La ruta inicial generará una solicitud de módulo diferido incluso cuando su página sea mínima; se acepta ese coste para mantener un contrato arquitectónico uniforme.
- Los componentes conservarán una evaluación coste/beneficio y no se dividirán indiscriminadamente.
- La plantilla necesitará un estado de espera traducido, pruebas de la página pendiente y verificación del fragmento generado.
- ADR-0006 mantendrá vigentes sus reglas sobre fronteras, accesibilidad, exports, datos, errores y medición, excepto donde permita páginas estáticas o reconozca `Home` como excepción.
- La aprobación de este ADR permitirá utilizar la decisión en el plan técnico, pero no autorizará por sí sola cambios de código, pruebas, documentación operativa, commits ni publicación.

## Alternativas consideradas

- **Mantener excepciones justificadas para páginas:** puede evitar una solicitud en páginas mínimas, pero conserva criterios variables y una baseline que no ejemplifica la regla exigida a nuevas páginas.
- **Obligar la carga diferida solo en páginas secundarias:** protege la ruta inicial de una solicitud adicional, pero permite que una página inicial pesada permanezca en la entrada y crea una excepción implícita.
- **Aplicar carga diferida obligatoria también a todos los componentes:** uniforma el mecanismo, pero puede empeorar la secuencia de carga y aumentar solicitudes y fallbacks sin ahorro real.
- **Dejar la decisión a cada repositorio derivado:** maximiza la flexibilidad, pero no garantiza que los proyectos creados desde la plantilla adopten la convención común.

## Verificación esperada

- Trazabilidad coherente entre la enmienda funcional, ADR-0004, ADR-0006, este ADR, `AGENTS.md`, `README.md` y el plan técnico.
- Pruebas que cubran el fallback y el contenido final de `Home` sin cambiar su contrato funcional vacío.
- Build de producción correcto con un fragmento diferido para la página.
- Navegador sin errores de consola ni solicitudes fallidas y con el comportamiento previsto en `/` y en una URL sin coincidencia.
- `npm run check` correcto antes de considerar implementado el cambio.

## Fuentes

- React, «lazy»: <https://react.dev/reference/react/lazy>.
- React, «Suspense»: <https://react.dev/reference/react/Suspense>.
- React, «Build a React app from Scratch — Code-splitting»: <https://react.dev/learn/build-a-react-app-from-scratch#code-splitting>.
