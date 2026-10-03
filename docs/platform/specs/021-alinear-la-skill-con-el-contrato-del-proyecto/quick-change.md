# PLAT-021 — Alinear la skill `react-ts-feature-pattern` con el contrato del proyecto

**Estado documental:** APPROVED

**Versión:** 1.0.0

**Fecha:** 2026-10-04

**Aprobado por:** Tomás, usuario solicitante

**Fecha de aprobación:** 2026-10-04

**Evidencia de aprobación:** Aprobación expresa «Aprueba PLAT-021 e impleméntalo» registrada en la conversación de trabajo, tras proponerse el cambio como `QUICK` y con `styles.module.scss` como convención de estilos.

**Clasificación:** QUICK

## Contrato afectado

- Reglas vigentes que se alinean: `AGENTS.md` (secciones «React y diseño» y «Pruebas y calidad»: crear componentes con sus pruebas espejo, declarar el modo de la skill y la aserción `expectNoAccessibilityViolations` de PLAT-011), ADR-0008 (propiedad modular y carpetas técnicas globales), PLAT-017 (`architecture:check` rechaza `src/components/`, `src/hooks/`, `src/services/` y `src/slices/`), ADR-0003 y README (estilos locales `styles.module.scss`) y ADR-0001 (MSW).
- Archivos afectados: `.claude/skills/react-ts-feature-pattern/SKILL.md`, `.claude/skills/react-ts-feature-pattern/references/sonar-local-rules.md` y `AGENTS.md` (archivo gestionado).
- Motivo de clasificación: cambia el comportamiento observable de la skill que se copia a cada derivado y una regla de `AGENTS.md`, sin decisión arquitectónica nueva.

## Delta funcional

### Comportamiento vigente (auditoría del 2026-10-04)

1. Sin modo explícito, la skill usa `standard`, que prohíbe inspeccionar, crear o modificar pruebas. `AGENTS.md` exige crear cada componente con su prueba espejo y, en ella, la aserción de accesibilidad. `AGENTS.md` ordena detenerse y pedir una decisión si la skill contradice documentación aprobada.
2. El inventario funcional de `strict` no incluye la aserción de accesibilidad.
3. Dice que `public/mockServiceWorker.js` es el único archivo permitido fuera de `mocks/`; en el repositorio no existe `public/` y el worker está en `mocks/public/mockServiceWorker.js` (`msw.workerDirectory`).
4. No menciona la ubicación de los componentes por propietario ni que `architecture:check` prohíbe las carpetas técnicas globales.
5. Propone `styles.scss`, mientras ADR-0003 y el README hablan de `styles.module.scss` (ADR-0008 admite ambos «según la estrategia aprobada»).
6. Conserva ejemplos y frases de otro producto: `WeatherCard`, `src/features/weather`, `src/features/forecast` y «map interactions/behavior» (en `SKILL.md` y en la superposición de Sonar).
7. Exige leer `references/sonar-local-rules.md` (23,5 KB) en cada pasada de revisión, aunque el repositorio no usa Sonar; con `SKILL.md` (36 KB) son unos 15 000 tokens por uso.

### Comportamiento aprobado propuesto

- **Modo por defecto del proyecto (hallazgo 1).** `SKILL.md` añade una sección «Project overrides» que remite a `AGENTS.md`: al crear un componente o cambiar su comportamiento observable se usa `strict`; `standard` solo para refactores estructurales sin impacto observable y cuando el usuario lo pide. `AGENTS.md` lo recoge en la regla de declarar el modo.
- **Accesibilidad (2).** El inventario funcional y la checklist de `strict` incluyen una aserción con `expectNoAccessibilityViolations` (`tests/setup/axe.ts`) por componente o página con interfaz, en los estados relevantes, indicando que no sustituye la revisión manual de contraste, teclado, foco ni lector de pantalla.
- **MSW (3).** La frase pasa a referirse al directorio configurado en `msw.workerDirectory` de `package.json` (`mocks/public/` en este repositorio) como único lugar del worker generado.
- **Ubicación (4).** Nueva sección que indica dónde vive un componente nuevo: bajo el `components/` de su página, feature o entidad, en `shared/ui/` si es realmente compartido, o en `app/` si es composición global; nunca en `src/components/`, `src/hooks/`, `src/services/` ni `src/slices/` (`architecture:check`); y que sus pruebas reflejan esa ruta bajo `tests/`.
- **Estilos (5).** `styles.module.scss` como estilo local por defecto (ADR-0003 y README); `styles.scss` solo si el proyecto aprueba expresamente una estrategia no modular.
- **Residuos (6).** Los ejemplos de invocación usan marcadores neutros (`src/pages/<Page>/components/<Component>/index.tsx`, `src/features/<capability>`), y se eliminan las menciones a mapas de `SKILL.md` y de la superposición.
- **Sonar (7).** `SKILL.md` solo pide leer `references/sonar-local-rules.md` cuando el usuario aporta hallazgos de Sonar o SonarLint (como ya indica el propio archivo); la lista genérica de «Sonar-like» sigue aplicándose. El archivo se conserva.

### Fuera de alcance

- Reducir la redundancia interna de `SKILL.md` (las mismas reglas se repiten hasta cuatro veces; no se encontraron contradicciones internas).
- La skill homónima del plugin `anthropic-skills:react-ts-feature-pattern`, cuyo contenido no se ha leído.
- Habilitar `@typescript-eslint/no-deprecated` (hoy desactivada; la skill recurre a la inspección manual de declaraciones).
- Verificar las claves de reglas de Sonar contra su documentación.
- Eliminar la superposición de Sonar de la plantilla.

## Criterios afectados

### QC-AC-01 — Modo por defecto

- **Dado** `AGENTS.md` y `SKILL.md`
- **Cuando** se lee cómo se resuelve el modo al crear un componente
- **Entonces** ambos indican `strict` para componentes nuevos o con cambio de comportamiento, y `standard` solo para refactores estructurales, sin contradicción entre ellos

### QC-AC-02 — Accesibilidad en las pruebas

- **Dado** el modo `strict`
- **Cuando** la skill describe el inventario funcional y la checklist
- **Entonces** incluyen `expectNoAccessibilityViolations` y su límite

### QC-AC-03 — Hechos del repositorio

- **Dado** `SKILL.md`
- **Cuando** se contrasta con el repositorio
- **Entonces** el worker de MSW, la ubicación de componentes, las carpetas prohibidas y el nombre del archivo de estilos coinciden con `mocks/public/`, ADR-0008, PLAT-017 y ADR-0003

### QC-AC-04 — Sin residuos de otro producto

- **Dado** `SKILL.md` y la superposición de Sonar
- **Cuando** se buscan `WeatherCard`, `weather`, `forecast` y `map interactions|map behavior`
- **Entonces** no hay coincidencias

### QC-AC-05 — Sonar bajo demanda

- **Dado** `SKILL.md`
- **Cuando** se lee la pasada de revisión
- **Entonces** solo remite a la superposición cuando existen hallazgos de Sonar aportados por el usuario

### QC-AC-06 — La skill produce un componente que pasa la puerta

- **Dado** la skill actualizada
- **Cuando** se crea siguiendo sus reglas, en una copia temporal, un componente de ejemplo con su prueba y la aserción de accesibilidad
- **Entonces** `npm run check` finaliza con código `0` y `architecture:check` no devuelve diagnósticos

### QC-AC-07 — Puerta y derivación intactas

- **Dado** el cambio aplicado
- **Cuando** se ejecutan `npm run check`, `npm run test:tools` y una derivación real en copia temporal
- **Entonces** todo finaliza con código `0` y el derivado conserva la skill actualizada

## Alcance técnico mínimo

| Archivo o área | Cambio previsto | Criterio |
| --- | --- | --- |
| `.claude/skills/react-ts-feature-pattern/SKILL.md` | Secciones de modo por defecto y ubicación; accesibilidad en `strict`; worker de MSW; estilos modulares; ejemplos neutros; Sonar bajo demanda. | QC-AC-01 a QC-AC-05 |
| `.claude/skills/react-ts-feature-pattern/references/sonar-local-rules.md` | Eliminar las menciones a mapas. | QC-AC-04 |
| `AGENTS.md` | Regla de modo (archivo gestionado; regenerar hash y `baselineId`). | QC-AC-01 |
| `tests/tools/quality/skill.test.ts` | Prueba de contrato de la skill: términos requeridos (`strict`, `expectNoAccessibilityViolations`, `mocks/public`, `architecture:check`, `styles.module.scss`) y términos de residuo ausentes. | QC-AC-01 a QC-AC-05 |
| `tools/template/baseline-manifest.json`, `tests/tools/template/baseline.test.ts` | Hash de `AGENTS.md` y `baselineId`. | QC-AC-07 |
| `docs/platform/README.md` | Fila `PLAT-021`. | — |

## Pruebas y validación previstas

- Automatizadas: la prueba de contrato (debe fallar antes del cambio y pasar después); `npm run check` y `npm run test:tools`.
- Manual: guion de QC-AC-06 en copia temporal (crear el componente siguiendo literalmente la skill actualizada y ejecutar la puerta) y derivación real.
- Comando de regresión: `npm run check && npm run test:tools`.

## Riesgos y reclasificación

- Riesgo: la prueba de contrato sobre texto es frágil si se reescribe la skill; se limita a pocos términos clave.
- Riesgo: fijar `strict` por defecto aumenta el trabajo de pruebas al crear componentes; es lo que `AGENTS.md` ya exige.
- Riesgo: `styles.module.scss` fija una convención que ADR-0008 dejaba abierta; si prefieres `styles.scss` se invierte este punto sin otras consecuencias.
- Reclasificar como `ADR` si se decide una estrategia de estilos distinta de la de ADR-0003, o como `FULL` si se rediseña la skill.

## Puerta documental

La aprobación autoriza implementar únicamente este delta cuando exista autorización expresa de implementación. No autoriza commit ni publicación.

## Registro de entrega opcional

- Estado de entrega: `VALIDATED`
- Archivos modificados: `.claude/skills/react-ts-feature-pattern/SKILL.md` (sección «Project overrides», sección «Placement», aserción de accesibilidad en el inventario y la checklist de `strict`, ubicación del worker de MSW, `styles.module.scss` en 6 apariciones, ejemplos neutros, Sonar solo con hallazgos del usuario), `.claude/skills/react-ts-feature-pattern/references/sonar-local-rules.md` (tres menciones a mapas sustituidas), `AGENTS.md` (regla de modo `strict`), `tests/tools/quality/skill.test.ts` (5 casos), `tools/template/baseline-manifest.json` (hash de `AGENTS.md` y `baselineId` `react-vite-ts-sdd-template@2026-10-03-plat-021.1`), `tests/tools/template/baseline.test.ts`, `docs/platform/README.md`.
- Pruebas y resultados (2026-10-04): antes de los cambios fallaban los 5 casos de `skill.test.ts`; después pasan. `npm run check` y `npm run test:tools` finalizan con código `0` (10 pruebas de aplicación, 102 de herramientas). Guion de QC-AC-06 en una copia temporal (ya eliminada): se creó, siguiendo literalmente la skill actualizada, `src/pages/Home/components/Greeting/` con `index.tsx`, `types.ts` y `styles.module.scss`, una clave i18n tipada y su prueba espejo con la aserción `expectNoAccessibilityViolations`; `npm run check` de esa copia terminó correctamente (6 archivos y 12 pruebas de aplicación, cobertura 100 %), y con un `src/components/Bad/index.ts` añadido `architecture:check` devolvió `ARCH_GLOBAL_TECHNICAL_FOLDER`. Derivación real en copia temporal (ya eliminada): `template:init` aplicado, `template:doctor` sin `FAIL`, el derivado contiene la skill con «Project overrides» y la regla `strict` de `AGENTS.md`, y su `npm run check` finaliza con código `0`.
- Desviaciones: ninguna respecto al delta aprobado. La fecha de aprobación y de la entrega es 2026-10-04. No se ha ejecutado la skill con un modelo real para comprobar que sigue sus instrucciones; el guion de QC-AC-06 demuestra que el resultado de aplicarlas pasa la puerta, no que el agente las aplique.
- Aceptación: 2026-10-04, Tomás, usuario solicitante. Aceptación expresa «Acepto PLAT-021 como VALIDATED» registrada en la conversación de trabajo tras contrastar los criterios con la evidencia de este registro. En GitHub, tras el push de `7dbb027`, `Security` (run `37157686692`) finalizó con `success` y `Quality` (run `37157686682`) seguía `in_progress` cuando se registró la aceptación; su resultado final no se ha observado y la aceptación se basa en la evidencia local.
