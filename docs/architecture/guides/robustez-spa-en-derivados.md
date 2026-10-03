# Guía — Robustez de la SPA en un proyecto derivado

**Estado:** APPROVED

**Fecha:** 2026-10-03

**Aprobado por:** Tomás, usuario solicitante

**Fecha de aprobación:** 2026-10-03

**Evidencia de aprobación:** Aprobación expresa «Aprueba la guía y haz commit» registrada en la conversación de trabajo.

**Relación:** Complementa [ADR-0004](../decisions/0004-react-router-base-spa.md), [ADR-0006](../decisions/0006-carga-diferida-rutas-suspense.md) y [ADR-0007](../decisions/0007-carga-diferida-obligatoria-paginas.md). No modifica la baseline: la plantilla mantiene deliberadamente una URL sin ruta sin contenido y no define tratamiento de error de descarga (PLAT-001 AC-02, PLAT-002).

## Objetivo

Listar los elementos de robustez que un proyecto derivado debe decidir y especificar antes de salir a producción. Cada uno cambia comportamiento observable, por lo que debe incorporarse mediante la especificación y el plan aprobados del derivado, no por defecto.

## 1. URL sin ruta (404)

La baseline no renderiza nada para una URL sin coincidencia. Un derivado que quiera una página de «no encontrado» puede añadir una ruta comodín al final de su tabla de rutas, con la misma regla de carga diferida de ADR-0007:

```tsx
<Route
  path="*"
  element={
    <Suspense fallback={<RouteLoading />}>
      <NotFound />
    </Suspense>
  }
/>
```

Decidir en la spec: contenido y textos traducidos, enlace de vuelta, y el estado HTTP. Una SPA con fallback a `index.html` no devuelve 404 real desde el cliente; si importa para SEO o monitorización, depende del alojamiento y se decide allí.

## 2. Errores de renderizado

Los fallos de render de un componente dejan la aplicación sin contenido si ninguna frontera de error los captura. React documenta que, hoy, una frontera de error debe ser un componente de clase (`static getDerivedStateFromError` y, opcionalmente, `componentDidCatch`) y sugiere `react-error-boundary` para no escribirla a mano. No captura errores de manejadores de eventos, código asíncrono ni de la propia frontera.

Decidir en la spec: dónde se coloca (normalmente en `app/`, alrededor de las rutas, para conservar layout y navegación), qué muestra el fallback traducido y accesible, qué acción ofrece (reintentar o recargar) y adónde se registran los errores. Si se usa una dependencia, requiere el flujo habitual de ADR.

## 3. Chunk de una página que no se puede descargar

Tras un despliegue, un usuario con la aplicación abierta puede pedir un chunk que el alojamiento ya eliminó. `Suspense` solo cubre la espera, no el fallo (ADR-0006). Vite emite el evento `vite:preloadError` cuando falla una importación dinámica, y su documentación propone recargar la página:

```ts
window.addEventListener('vite:preloadError', () => {
  window.location.reload()
})
```

Cuidado: recargar sin condición puede crear un bucle si el chunk sigue sin existir. Decidir en la spec la política (un único reintento, mensaje al usuario, o frontera de error del punto 2). Vite recomienda además `Cache-Control: no-cache` en el HTML para que no se sirvan referencias a assets eliminados.

## 4. Título y foco en la navegación

Cada vista de una SPA necesita un título de documento descriptivo (WCAG 2.1, criterio 2.4.2, «Page Titled») y una gestión de foco o anuncio a lectores de pantalla cuando cambia la ruta. No he podido confirmar en la documentación de React Router en modo declarativo consultada si ofrece alguno de los dos; verificarlo antes de implementar. Decidir el patrón al crear la primera página real, junto con el layout.

## 5. `index.html`

La baseline mantiene `index.html` mínimo para no inventar decisiones de producto. Antes de publicar, el derivado debe decidir y especificar:

- `lang` coherente con el idioma por defecto de i18n (hoy `en`, fijo en el HTML);
- `<meta name="description">`;
- favicon e iconos;
- `theme-color` si aplica;
- contenido de `<noscript>` si se desea.

Si el derivado añade idiomas, su `lang` dinámico requiere una decisión propia.

## 6. Alojamiento y cabeceras

Además del fallback a `index.html` ya documentado (PLAT-001 AC-04), el derivado debe decidir con su proveedor:

- `Cache-Control` del HTML (Vite: `no-cache`) y de `assets/` con nombre con hash;
- `Content-Security-Policy`, `X-Content-Type-Options`, `Referrer-Policy` y, si procede, `Permissions-Policy`. Los valores concretos dependen de los orígenes que use la aplicación y deben validarse en el entorno real; esta guía no propone una CSP.

## Fuentes

- Vite, «Building for Production — Load Error Handling»: <https://vite.dev/guide/build#load-error-handling>.
- React, «Component — Catching rendering errors with an error boundary»: <https://react.dev/reference/react/Component>.
- React Router, «Routing (declarative)»: <https://reactrouter.com/start/declarative/routing>.
- W3C, «Understanding SC 2.4.2: Page Titled»: <https://www.w3.org/WAI/WCAG21/Understanding/page-titled.html>.
- MDN, «Content-Security-Policy»: <https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Content-Security-Policy>.

Las páginas de Vite, React y React Router se consultaron el 2026-10-03; las de W3C y MDN se citan sin haberse releído en esta sesión.
