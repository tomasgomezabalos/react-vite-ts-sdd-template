# ADR-0005 — RTK Query como capacidad opcional

**Estado:** APPROVED

**Aprobación:** 2026-08-23

**Relación:** Precisa la plataforma definida en ADR-0001 sin modificar su baseline.

## Contexto

La plantilla incluye MSW para simular contratos HTTP, pero no presupone que todos los proyectos consuman datos remotos ni que necesiten estado global. RTK Query resuelve obtención, caché, deduplicación, estados de petición e invalidación sobre Redux Toolkit, pero su adopción también introduce Redux Toolkit, React Redux, un store y convenciones que no aportan valor a una aplicación que no tenga esas necesidades.

La URL base, los endpoints, la forma de los datos, los errores y las reglas de caché pertenecen al dominio de cada proyecto. Crear una API o un store ficticios en la plantilla contradiría su objetivo de no inventar comportamiento de producto.

## Decisión propuesta

- Mantener RTK Query y los paquetes `@reduxjs/toolkit` y `react-redux` fuera de las dependencias predeterminadas de la plantilla.
- Considerar RTK Query una capacidad opcional que un proyecto derivado puede adoptar mediante una especificación y un plan técnico aprobados cuando aparezca la primera necesidad real de datos remotos.
- Justificar su elección frente a alternativas según las necesidades de caché, deduplicación, invalidación, mutaciones, estado compartido y herramientas de diagnóstico del proyecto.
- Si se adopta para React, instalar versiones compatibles de `@reduxjs/toolkit`, que incluye RTK Query, y `react-redux`, y registrarlas en `package.json` y `package-lock.json`.
- Crear el store de aplicación con `configureStore` mediante una factoría como `createAppStore` para permitir una instancia aislada por prueba, además de la instancia utilizada por la aplicación.
- Integrar cada API slice con su reducer y middleware, y montar el `Provider` de React Redux desde el punto de composición de proveedores.
- Configurar `setupListeners` únicamente cuando el proyecto necesite revalidación por foco o reconexión.
- Utilizar como orientación una API slice por URL base. Cualquier agrupación o separación diferente deberá justificarse por el contrato real del proyecto.
- Mantener API slices, tipos, transformación de respuestas y normalización de errores en módulos de servicio del dominio; los componentes consumirán los hooks o contratos React expuestos por esos módulos.
- Mantener handlers y fixtures HTTP en `mocks/`, respetando el aislamiento de MSW definido en ADR-0001.
- Añadir pruebas del comportamiento observable de petición, deduplicación, caché e invalidación cuando sean aplicables, además del aislamiento de store, handlers y estado entre pruebas. Probar la serialización de claves de caché únicamente cuando el proyecto la personalice o forme parte de un contrato relevante.

No se añadirá una API vacía, una URL base genérica, endpoints de demostración ni un store sin consumidores. La posible creación de un comando o asistente para instalar esta capacidad requerirá una especificación funcional independiente cuando exista repetición suficiente para definir un contrato estable.

## Alternativas consideradas

- **Incluir RTK Query por defecto:** reduce el trabajo inicial de aplicaciones orientadas a API, pero impone dependencias y arquitectura Redux a proyectos que pueden no necesitarlas.
- **Utilizar `ApiProvider` sin un store de aplicación explícito:** reduce la configuración inicial cuando solo existe una API slice, pero limita la composición con otro estado Redux y no satisface la convención de crear instancias de store aisladas por prueba.
- **Utilizar `fetch` directamente:** es suficiente para casos simples, pero obliga al proyecto a resolver manualmente caché, deduplicación y ciclos de vida cuando esos requisitos aparezcan.
- **Adoptar otra biblioteca especializada:** TanStack Query, SWR u otra solución pueden ajustarse mejor a un proyecto concreto; esta decisión no las prohíbe y exige justificar la selección en su plan.
- **Automatizar la incorporación desde el inicio:** puede ser útil en el futuro, pero antes debe estabilizarse el patrón mediante usos reales en varios proyectos.

## Consecuencias

- La baseline permanece pequeña y no contiene infraestructura Redux inactiva.
- Los proyectos que necesiten RTK Query dispondrán de criterios y convenciones comunes para adoptarlo de forma trazable.
- La incorporación no será automática inicialmente y formará parte del alcance técnico de la primera feature que la necesite.
- La plantilla conserva la libertad de elegir otra estrategia de datos cuando los requisitos lo justifiquen.

## Fuentes

- React, «Build a React app from Scratch — Data Fetching»: <https://react.dev/learn/build-a-react-app-from-scratch#data-fetching>.
- Redux, «When should I use Redux?»: <https://redux.js.org/faq/general#when-should-i-use-redux>.
- Redux Toolkit, «RTK Query Overview»: <https://redux-toolkit.js.org/rtk-query/overview>.
- Redux Toolkit, «ApiProvider»: <https://redux-toolkit.js.org/rtk-query/api/ApiProvider>.
- Redux, «Redux Essentials — RTK Query Basics»: <https://redux.js.org/tutorials/essentials/part-7-rtk-query-basics>.
