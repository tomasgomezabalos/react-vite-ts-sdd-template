# FEAT-002 — Carga diferida de páginas enrutadas

**Estado:** VALIDATED

**Fecha:** 2026-08-25

**Aprobación:** 2026-08-25

**Implementación:** 2026-08-25

**Validación:** 2026-08-25

**Modificada por:** `amendment-001-obligatoriedad-paginas.md` elimina las excepciones estáticas para páginas, incluida `Home`. El resto de esta especificación histórica permanece vigente.

## Problema y resultado esperado

La plantilla dispone de enrutamiento, pero no establece una convención para evitar que las páginas y sus dependencias se incorporen anticipadamente a la carga inicial aunque su ruta no llegue a visitarse.

El resultado esperado es que las aplicaciones derivadas dispongan de una regla verificable para cargar las páginas de ruta cuando se necesiten, mostrar un estado de espera adecuado y conservar importaciones estáticas cuando la carga diferida no aporte un beneficio razonable.

## Alcance

- Establecer la carga diferida como comportamiento predeterminado para nuevas páginas asociadas a rutas.
- Mantener estable el contenido final y el comportamiento de las rutas mientras se separa la carga de su código.
- Proporcionar un estado de espera coherente con el área de ruta que todavía no está disponible.
- Mantener visibles el layout y la navegación persistentes cuando existan y no dependan de la página pendiente.
- Permitir excepciones justificadas en el plan técnico cuando la separación incremente el coste o no reduzca de forma significativa la carga anticipada.
- Documentar la convención para que los proyectos derivados puedan aplicarla sin modificar la estructura base de enrutamiento.
- Verificar el resultado construido y el comportamiento real en navegador antes de afirmar una mejora de rendimiento.

## Fuera de alcance

- Añadir rutas de producto, navegación visual, layouts o una página de ruta desconocida.
- Modificar la estrategia de obtención de datos o utilizar el estado de espera de código como sustituto de los estados de datos.
- Adoptar Data Mode o Framework Mode de React Router.
- Añadir una biblioteca de división de código, precarga o análisis de bundles.
- Aplicar carga diferida indiscriminadamente a todos los componentes.
- Incorporar una interfaz de error para fallos de descarga sin requisitos funcionales aprobados.
- Modificar la configuración `useSuspense` de react-i18next.
- Propagar automáticamente el cambio a repositorios ya derivados de la plantilla.

## Flujo principal

1. La persona abre una URL admitida por la aplicación.
2. El enrutador identifica la página asociada sin requerir el código de otras páginas no visitadas.
3. Si el código necesario todavía no está disponible, la aplicación presenta el estado de espera definido para el área de ruta.
4. Cuando el código está disponible, la página sustituye el estado de espera y conserva el comportamiento previsto para esa URL.
5. Las partes persistentes de la aplicación permanecen disponibles siempre que no dependan de la página pendiente.

## Escenarios y criterios de aceptación

### AC-01 — Página de ruta disponible bajo demanda

- **Dado** que una aplicación contiene una página asociada a una ruta y esa página cumple los criterios aprobados para carga diferida
- **Cuando** la ruta se intenta renderizar por primera vez
- **Entonces** la aplicación obtiene el código de la página bajo demanda y muestra su contenido final sin cambiar el contrato de la URL

### AC-02 — Rutas no visitadas fuera de la carga anticipada

- **Dado** que una aplicación contiene varias páginas de ruta cargadas de forma diferida
- **Cuando** la persona abre una de esas rutas
- **Entonces** el resultado construido no requiere anticipadamente el código exclusivo de las demás páginas para renderizar la ruta solicitada

### AC-03 — Estado de espera de la ruta

- **Dado** que el código de una página diferida todavía no está disponible
- **Cuando** la ruta correspondiente intenta renderizarse
- **Entonces** el área pendiente presenta un estado de espera visible, accesible y coherente hasta que la página pueda mostrarse

### AC-04 — Permanencia de la interfaz compartida

- **Dado** que el layout o la navegación persistentes ya están disponibles
- **Cuando** una página de ruta queda temporalmente pendiente
- **Entonces** esas partes compartidas no se sustituyen por el estado de espera de la página

### AC-05 — Excepción justificada

- **Dado** que una página es mínima, se necesita inmediatamente o su separación provoca un coste superior al ahorro esperado
- **Cuando** se prepara su plan técnico
- **Entonces** puede conservar una importación estática si la excepción y su evidencia quedan documentadas

### AC-06 — Convención para proyectos derivados

- **Dado** un proyecto creado desde la plantilla
- **Cuando** una feature aprobada incorpora una nueva página de ruta
- **Entonces** su plan técnico aplica la carga diferida por defecto o documenta la excepción correspondiente

### AC-07 — Conservación de la ruta base

- **Dado** que la plantilla mantiene únicamente su ruta raíz y su página vacía
- **Cuando** se documenta la convención de carga diferida
- **Entonces** `Home` conserva su importación estática como excepción justificada, `/` continúa mostrando un área principal vacía y una URL sin coincidencia continúa sin renderizar contenido de ruta

### AC-08 — Verificación del resultado

- **Dado** que se implementa una página de ruta diferida
- **Cuando** se ejecutan las comprobaciones acordadas
- **Entonces** la construcción evidencia la separación esperada y la red del navegador confirma la carga, el estado de espera, el contenido final y la ausencia de errores de consola o solicitudes fallidas
- **Y** cualquier afirmación de mejora se respalda comparando al menos el tamaño transferido o el tiempo de carga antes y después

## Requisitos transversales aplicables

- Accesibilidad: el estado de espera debe comunicar que el área está pendiente sin retirar controles persistentes utilizables ni introducir cambios de foco injustificados.
- Responsive: el estado de espera no debe producir overflow ni alterar las dimensiones del layout persistente; en la baseline vacía no se añadirá una composición visual responsive.
- Internacionalización: cualquier texto visible del estado de espera deberá obtenerse mediante la infraestructura i18n existente; no se añadirán literales de interfaz directamente en componentes.
- Carga, vacío y error: la espera de código y el contenido final son estados distintos; las páginas realmente diferidas utilizarán un estado visible y traducido. La página vacía de la baseline seguirá estática y vacía. El fallo de descarga queda fuera de alcance hasta que se apruebe su comportamiento.

## Decisiones confirmadas

- `Home` conservará su importación estática porque es una página mínima requerida inmediatamente y separarla no ofrece un ahorro significativo en la baseline actual.
- Toda página real que se cargue de forma diferida deberá mostrar un estado de espera visible, accesible y traducido mediante la infraestructura i18n del proyecto.
- La evidencia mínima de separación incluirá la salida del build y la red observada en navegador. Una afirmación de mejora de rendimiento requerirá además comparar el tamaño transferido o el tiempo de carga antes y después.

## Supuestos, riesgos y cuestiones abiertas

- **Supuesto:** ADR-0006 está `APPROVED` y será vinculante para el plan técnico de esta feature.
- **Supuesto:** la herramienta de construcción puede generar fragmentos separados a partir de importaciones dinámicas, sujeto al grafo real de dependencias.
- **Riesgo:** dividir una página inicial mínima puede añadir una solicitud y un estado de espera sin reducir de forma significativa el JavaScript inicial.
- **Riesgo:** una frontera demasiado amplia puede ocultar layout o navegación ya disponibles; fronteras excesivamente pequeñas pueden fragmentar la experiencia y aumentar las solicitudes.
- **Riesgo:** medir solo el número de fragmentos puede confundir separación técnica con una mejora real de rendimiento.
- **Abierta:** ninguna cuestión funcional pendiente.
