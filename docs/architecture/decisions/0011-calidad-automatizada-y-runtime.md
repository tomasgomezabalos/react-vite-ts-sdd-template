# ADR-0011 — Runtime y puerta de calidad automatizada

**Estado documental:** APPROVED

**Versión:** 1.0.0

**Fecha:** 2026-08-28

**Aprobado por:** Tomás, usuario solicitante

**Fecha de aprobación:** 2026-08-28

**Evidencia de aprobación:** Aprobación expresa registrada en la conversación de trabajo.

**Relación:** Amplía ADR-0001 y ADR-0002, automatiza reglas de ADR-0008 y aplica el ciclo de ADR-0009. Complementa ADR-0010 y PLAT-003; su aplicación se especificará mediante PLAT-004.

## Contexto

La plantilla dispone de lint, pruebas, cobertura y build, pero `npm run check` no ejecuta todavía la cobertura ni comprueba enlaces documentales o límites arquitectónicos. Tampoco existe un workflow de integración continua que aplique la misma puerta en cada cambio.

El runtime está parcialmente declarado: `.nvmrc` fija Node `22.23.2`, mientras `package.json` acepta cualquier Node `>=22.22.0` y no declara una versión de npm. Esa diferencia permite ejecutar comandos con combinaciones que no soportan toda la baseline. El 2026-08-28, la suite ejecutada con Node `20.19.0` y npm `10.8.2` falló en tres pruebas porque Node no pudo cargar directamente los ejecutables `.ts`; con Node `22.23.2` y npm `10.9.8` pasaron las 25 pruebas.

La cobertura V8 incluye actualmente `src/**/*.{ts,tsx}` y `tools/**/*.ts`, pero no tiene umbrales. La medición válida del 2026-08-28 con el runtime declarado fue: 75,71 % de statements, 59,61 % de branches, 81,75 % de functions y 77,64 % de lines. Sin mínimos, el comando puede finalizar correctamente aunque una regresión reduzca esos valores.

ADR-0008 define dependencias descendentes y prohíbe imports entre páginas, pero esa regla depende hoy de revisión manual. Del mismo modo, el sistema SDD ha ganado índices, estados y referencias cruzadas cuyo deterioro no detectan TypeScript, ESLint ni Vitest.

Se necesita una política única, reproducible y aplicable tanto en local como en CI. La decisión debe evitar infraestructura duplicada, dependencias especulativas y comprobaciones externas no deterministas dentro de la puerta principal.

## Decisión propuesta

### 1. Fijar el runtime de desarrollo

La baseline utilizará estas declaraciones coordinadas:

- `.nvmrc`: Node `22.23.2` como versión exacta de trabajo y CI;
- `engines.node`: `>=22.23.2 <23` como rango compatible de la aplicación;
- `engines.npm`: `>=10.9.8 <11` como rango compatible del gestor;
- `packageManager`: `npm@10.9.8` como versión recomendada y reproducible;
- `devEngines.runtime`: Node `22.23.2` con `onFail: error`;
- `devEngines.packageManager`: npm `10.9.8` con `onFail: error`.

`packageManager` no será la única barrera porque su aplicación depende de Corepack. `devEngines` realizará la comprobación efectiva antes de los comandos npm soportados. El lockfile seguirá siendo obligatorio y las instalaciones limpias utilizarán `npm ci`.

Una actualización de Node o npm deberá modificar conjuntamente `.nvmrc`, `package.json`, `package-lock.json`, CI y la evidencia de validación. No se ampliarán rangos ni se cambiará una versión exacta de forma aislada.

### 2. Establecer una única puerta local y de CI

`npm run check` será la fuente de verdad de calidad y ejecutará, en este orden lógico:

1. lint;
2. comprobación documental;
3. comprobación de arquitectura;
4. pruebas con cobertura;
5. build de producción.

La aplicación prevista equivaldrá a:

```text
npm run lint && npm run docs:check && npm run architecture:check && npm run test:coverage && npm run build
```

No se ejecutará además `npm run test`, porque `test:coverage` ya ejecuta la misma suite. Los comandos específicos permanecerán disponibles para diagnóstico, pero un cambio solo superará la puerta completa cuando `npm run check` finalice correctamente.

CI no tendrá pasos de calidad ocultos ni una secuencia divergente. Instalará con `npm ci` y delegará todas las comprobaciones del repositorio en `npm run check`.

### 3. Incorporar CI mínima y segura en GitHub Actions

La plantilla incorporará un único workflow de calidad para pushes a la rama principal y pull requests. El workflow:

- utilizará un runner Linux hospedado por GitHub;
- limitará `GITHUB_TOKEN` a `contents: read`;
- cancelará ejecuciones anteriores de la misma rama o pull request cuando una nueva las sustituya;
- obtendrá la versión exacta de Node desde `.nvmrc`;
- activará la caché de npm basada en el lockfile;
- ejecutará únicamente `npm ci` y `npm run check`;
- no requerirá secretos, no publicará paquetes y no desplegará.

Las acciones reutilizadas se fijarán a un commit SHA completo e incluirán un comentario con la versión humana correspondiente. Los SHA concretos se resolverán y verificarán durante la aplicación aprobada; este ADR no inventa referencias que puedan quedar obsoletas antes de implementarse.

El workflow principal no incluirá `npm audit`, comprobaciones remotas de vulnerabilidades ni servicios externos: sus resultados cambian sin modificar el repositorio y pueden requerir una política de riesgo distinta. Esas comprobaciones podrán añadirse en una puerta de seguridad separada.

### 4. Convertir la cobertura en contrato mínimo

Vitest aplicará inicialmente umbrales globales, inferiores pero próximos a la línea base verificada:

| Métrica | Línea base 2026-08-28 | Umbral inicial |
| --- | ---: | ---: |
| Statements | 75,71 % | 70 % |
| Branches | 59,61 % | 55 % |
| Functions | 81,75 % | 75 % |
| Lines | 77,64 % | 75 % |

Los umbrales serán globales y `perFile` permanecerá desactivado inicialmente. Algunos ejecutables de borde tienen cobertura individual inferior y forzar un mínimo por archivo sin completar antes sus escenarios produciría excepciones artificiales o bloquearía la adopción.

La cobertura continuará incluyendo el código ejecutable de `src/` y `tools/`. Podrán excluirse declaraciones, módulos exclusivamente de tipos, pruebas, fixtures generados y artefactos no ejecutables. Cada exclusión nueva deberá responder a la naturaleza del archivo y no a la intención de mejorar el porcentaje.

Los umbrales podrán elevarse cuando la línea base lo permita. Reducirlos requerirá un cambio aprobado con causa y evidencia; no se utilizará `autoUpdate` para modificar configuración durante una validación.

### 5. Comprobar la integridad documental

Se añadirá un comando `docs:check`, implementado con Node y TypeScript ya presentes, que como mínimo comprobará:

- que los enlaces Markdown locales resuelven a archivos o anclas existentes;
- que existen los índices y documentos base exigidos por el sistema SDD;
- que los índices referencian los artefactos vigentes que les corresponden;
- que los estados documentales y de entrega utilizados por artefactos sujetos a ADR-0009 pertenecen a sus vocabularios controlados;
- que un artefacto nuevo marcado `APPROVED` no conserve placeholders obligatorios sin resolver.

Las plantillas, ejemplos declarados y artefactos históricos anteriores a ADR-0009 tendrán exclusiones explícitas y probadas. El checker no reinterpretará contenido semántico ni afirmará que una aprobación existe: solo validará invariantes estructurales objetivas. PLAT-004 concretará el inventario, las anclas admitidas, los códigos de error y las excepciones.

### 6. Automatizar los límites de ADR-0008

Se añadirá un comando `architecture:check`, implementado con la API del compilador TypeScript ya instalada. Analizará imports estáticos, exports desde módulos y llamadas `import()` con especificador literal dentro de `src/`.

La primera versión hará cumplir estas reglas:

- dirección `app → pages → features → entities → shared`;
- `shared` no importa capas superiores;
- `entities` no importa `features`, `pages` ni `app`;
- `features` no importa `pages` ni `app`;
- una página no importa otra página;
- los módulos privados permanecen dentro de su propietario;
- `src/main.tsx` se trata como raíz de composición;
- `src/i18n/` y `src/locales/` se tratan como infraestructura compartida existente hasta una migración arquitectónica expresa.

La comprobación resolverá rutas relativas y aliases definidos por la configuración aplicable. Los imports no literales o contratos que no puedan determinarse estáticamente producirán un diagnóstico explícito conforme defina PLAT-004, no una conclusión inventada.

Como la API del compilador puede cambiar entre versiones mayores, el checker tendrá pruebas propias y se revisará al actualizar TypeScript. No se añadirá una dependencia adicional mientras la API ya instalada cubra el alcance aprobado.

### 7. Mantener trazabilidad y salidas diagnósticas

`docs:check` y `architecture:check` deberán:

- ser deterministas y no modificar el repositorio;
- devolver código `0` cuando no existan incumplimientos y un código distinto de cero cuando los haya;
- identificar regla, archivo y ubicación cuando sea posible;
- disponer de pruebas positivas y negativas bajo `tests/`, reflejando la propiedad de `tools/`;
- documentar sus límites para no presentar cobertura parcial como garantía absoluta.

El informe de validación de PLAT-004 relacionará cada requisito con pruebas, comandos y archivos. La ejecución correcta en CI será evidencia técnica, pero no sustituirá la aceptación necesaria para cambiar el estado de entrega a `VALIDATED`.

## Aplicación prevista tras la aprobación

La aprobación de este ADR permitirá preparar, mediante una puerta separada:

1. una especificación `FULL` `PLAT-004` para la puerta de calidad automatizada;
2. su plan técnico, tareas, pruebas y criterios de aceptación;
3. cambios coordinados en `.nvmrc`, `package.json`, `package-lock.json` y `vite.config.ts`;
4. los comprobadores bajo `tools/` y sus pruebas espejo bajo `tests/`;
5. `.github/workflows/quality.yml` con acciones fijadas a SHA completo;
6. la actualización de README, AGENTS e índices afectados;
7. un informe de validación separado para registrar implementación y aceptación.

La aprobación del ADR permite utilizar la decisión en PLAT-004; no autoriza automáticamente su aplicación, instalación, commit ni publicación.

## Alternativas consideradas

### Mantener comprobaciones solo locales

Evita configuración específica de proveedor, pero permite integrar cambios sin ejecutar la puerta y no aporta una evidencia repetible por pull request.

### Duplicar los comandos en el workflow

Hace visible cada paso en GitHub Actions, pero permite que local y CI diverjan. Se prefiere un único contrato ejecutable en `npm run check`.

### Probar varias versiones de Node

Aumenta información de compatibilidad, pero contradice una baseline que necesita una versión exacta para ejecutar TypeScript directamente y multiplica coste y variabilidad. La matriz podrá reconsiderarse si la plantilla pasa a distribuir una librería con soporte multiversión.

### Fijar acciones solo a tags

Facilita leer y actualizar el workflow, pero los tags son mutables. El comentario conservará legibilidad y el SHA completo aportará inmutabilidad.

### Utilizar dependencias externas para enlaces y límites de imports

Puede ofrecer más reglas preconstruidas, pero amplía superficie de mantenimiento antes de demostrar una necesidad que Node y TypeScript no cubran. La decisión comienza con herramientas propias pequeñas y probadas.

### Cobertura informativa sin umbrales o 100 % obligatorio

Sin umbrales no existe protección contra regresiones. Exigir 100 % desde el inicio no refleja la baseline actual y empujaría a exclusiones o pruebas de poco valor. Los mínimos iniciales preservan margen reducido y podrán crecer con evidencia.

### Umbrales por archivo desde la primera versión

Localizan mejor regresiones, pero actualmente bloquearían varios ejecutables de frontera. Se posponen hasta que PLAT-004 o un cambio posterior cubra sus escenarios sin excepciones artificiales.

### Incluir seguridad dinámica en la puerta principal

Centraliza todo en un workflow, pero mezcla calidad determinista con fuentes externas y políticas de severidad cambiantes. La seguridad automatizada se decidirá y validará por separado.

## Consecuencias

- Los proyectos derivados recibirán una versión de runtime y una puerta de calidad coherentes desde el inicio.
- Un entorno local incorrecto fallará antes y con un diagnóstico más cercano a la causa.
- Local y CI compartirán el mismo comando verificable.
- Los enlaces, estados estructurales y límites de capas dejarán de depender exclusivamente de revisión manual.
- La cobertura no podrá caer por debajo de la baseline protegida sin una decisión explícita.
- La versión exacta de Node y npm exigirá actualizar el entorno de quien trabaje con otra combinación.
- GitHub Actions introduce acoplamiento de automatización con GitHub, aunque `npm run check` seguirá siendo neutral respecto al proveedor.
- Fijar acciones a SHA aumenta seguridad y también obliga a mantener esas referencias.
- Los comprobadores propios necesitan pruebas y mantenimiento, especialmente ante cambios mayores de TypeScript o Markdown.
- Los umbrales globales iniciales no impiden que un archivo concreto pierda cobertura mientras el agregado se conserve; ese riesgo queda aceptado y visible.

## Migración y reversión

- Migración: aprobar PLAT-004 y su plan; implementar los cambios en un lote coherente; validar primero los comprobadores de forma aislada, después `npm run check` con Node `22.23.2`/npm `10.9.8` y finalmente el workflow en GitHub Actions. Los proyectos derivados existentes decidirán su adopción mediante su propio control documental.
- Reversión: desactivar o retirar el workflow y los comandos añadidos, restaurar la composición anterior de `npm run check` y las declaraciones de runtime solo mediante una decisión que sustituya este ADR. Las reglas documentales o arquitectónicas de fondo seguirán vigentes aunque se retire su automatización.

## Fuentes

- npm, «package.json», secciones `engines` y `devEngines`: <https://docs.npmjs.com/cli/v10/configuring-npm/package-json/>.
- Node.js 22, «Modules: Packages», campo `packageManager`: <https://nodejs.org/download/release/v22.23.2/docs/api/packages.html#packagemanager>.
- GitHub Docs, «Building and testing Node.js»: <https://docs.github.com/en/actions/tutorials/build-and-test-code/nodejs>.
- GitHub Docs, «Secure use reference», fijación de acciones a SHA completo: <https://docs.github.com/en/actions/reference/security/secure-use?learn=getting_started&learnProduct=actions>.
- Vitest, «Coverage configuration», sección `coverage.thresholds`: <https://main.vitest.dev/config/coverage#coverage-thresholds>.
- Microsoft TypeScript, «Using the Compiler API»: <https://github.com/microsoft/TypeScript/wiki/Using-the-Compiler-API>.
- Evidencia interna del repositorio: `.nvmrc`, `package.json`, `vite.config.ts` y ejecución de `npm run test:coverage` del 2026-08-28.
