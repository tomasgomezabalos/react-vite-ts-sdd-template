# Informe de validación — PLAT-006 Separación de pruebas de aplicación y plantilla

**Estado de entrega:** VALIDATED

**Fecha de creación:** 2026-08-31

**Fecha de implementación:** 2026-08-31

**Fecha de validación:** 2026-08-31

**Aceptado por:** Tomás, usuario solicitante

**Evidencia de aceptación:** Aceptación expresa «oko, sube los cambios y push» registrada en la conversación tras presentar implementación, suites separadas y puerta completa correcta.

## Alcance aprobado

- Delta: `docs/platform/specs/006-separacion-pruebas-aplicacion-plantilla/quick-change.md`, versión `1.0.0`, `APPROVED`.
- Plan técnico: no aplica; el alcance técnico proporcional está incluido en el cambio QUICK.
- ADR aplicables: ADR-0009, ADR-0011 y ADR-0013.
- Criterios cubiertos: QC-AC-01 a QC-AC-04.

## Implementación realizada

| Archivo o área | Cambio realizado | Criterio relacionado |
| --- | --- | --- |
| `package.json` | `test`, `test:watch` y `test:coverage` excluyen el glob literal `tests/tools/**`; `test:tools` ejecuta la suite separada. | QC-AC-01, QC-AC-02 |
| `vite.config.ts` | V8 incluye únicamente `src/**/*.{ts,tsx}` y conserva umbrales globales, `main.tsx`, `perFile: false` y `autoUpdate: false`. | QC-AC-01 |
| `.github/workflows/quality.yml` | Mantiene `npm run check` para todos los repositorios y añade `npm run test:tools` condicionado al repositorio canónico. | QC-AC-03 |
| `tests/tools/quality/runtime-config.test.ts`, `workflow.test.ts` | Fijan scripts, alcance V8, condición canónica, comandos del workflow y hashes de baseline. | QC-AC-01 a QC-AC-04 |
| `tests/main.test.tsx` | Cubre el montaje de la entrada y su fallo explícito sin elemento raíz, cerrando las ramas de `main.tsx` reveladas por la cobertura exclusiva de `src/`. | QC-AC-01 |
| `README.md`, `AGENTS.md`, ADR-0013 e índices | Documentan la separación, los comandos y las puertas independientes. | QC-AC-03, QC-AC-04 |
| `tools/template/baseline-manifest.json` | Actualiza el identificador PLAT-006 y los hashes de `README.md`, `package.json` y `vite.config.ts`. | QC-AC-04 |

## Trazabilidad final

| Requisito o criterio | Código o documentación | Prueba o validación | Resultado |
| --- | --- | --- | --- |
| QC-AC-01 | scripts npm, `vite.config.ts`, `tests/main.test.tsx` | `npm test`, `npm run test:coverage`, `npm run check` | Correcto: 4 archivos y 6 pruebas de aplicación; cobertura exclusiva de `src/` al 100 % |
| QC-AC-02 | script `test:tools` | `npm run test:tools` | Correcto: 10 archivos y 43 pruebas de herramientas, sin cobertura |
| QC-AC-03 | workflow, README y AGENTS | `workflow.test.ts` y revisión del YAML | Correcto localmente: condición explícita por `github.repository`; ejecución remota pendiente de una puerta de publicación separada |
| QC-AC-04 | pruebas de contrato y manifiesto | `runtime-config.test.ts`, `docs:check`, hashes SHA-256 y puerta completa | Correcto |

## Comprobaciones automatizadas

| Comando | Entorno | Resultado |
| --- | --- | --- |
| Primer `npm run docs:check` | Node `20.19.0`, npm `10.8.2` seleccionados inicialmente por la shell | Fallo previo a la comprobación: Node no reconoce la extensión `.ts`; se activó el runtime obligatorio |
| `npm run docs:check` durante la preparación | Node `22.23.2`, npm `10.9.8` | Detectó correctamente que todavía faltaba crear este informe; tras crearlo, 48 documentos correctos |
| `npm test` | Node `22.23.2`, Vitest `4.1.11` | Correcto: 4 archivos y 6 pruebas; ningún archivo de `tests/tools/**` |
| `npm run test:coverage` | Node `22.23.2`, Vitest/V8 `4.1.11` | Correcto: 4 archivos, 6 pruebas y 100 % statements, branches, functions y lines sobre 18/2/5/17 elementos de `src/` |
| `npm run test:tools` | Node `22.23.2`, Vitest `4.1.11` | Correcto: 10 archivos y 43 pruebas, sin cobertura |
| `npm run check` | Node `22.23.2`, npm `10.9.8` | Correcto: lint, 48 documentos, arquitectura de 6 archivos, 4 archivos/6 pruebas de aplicación, cobertura de `src/` al 100 % y build |

## Validación manual o de navegador

- Cobertura: no aplica a interfaz; el cambio afecta comandos y configuración de calidad.
- Resultado: la salida de Vitest confirma suites disjuntas y el informe V8 no enumera `tools/`; el workflow contiene una condición explícita para el repositorio canónico.
- Consola y red: navegador no aplica. Ninguna comprobación necesitó red; el workflow no se ejecutó realmente en GitHub dentro de esta puerta local.

## Desviaciones y riesgos residuales

- Desviación: el primer script utilizó un glob sin comillas; la shell lo expandió antes de entregarlo a Vitest y seleccionó una suite incorrecta. Se corrigió a un glob literal entre comillas y las pruebas de contrato fijan la forma efectiva.
- Desviación: `tests/main.test.tsx` no figuraba en la tabla técnica inicial. La cobertura real de `src/` reveló que `main.tsx`, expresamente incluido, dejaba branches en 0 %. Se añadió la prueba espejo mínima sin modificar código React ni ampliar comportamiento.
- Riesgo residual: una persona que mantenga la plantilla localmente puede omitir `npm run test:tools`; el CI canónico es la barrera prevista, pero su ejecución real no puede confirmarse antes de una publicación autorizada.
- Riesgo residual: si cambia el nombre del repositorio canónico, deberá actualizarse la condición de `github.repository`.
- Bloqueo: ninguno.

## Puerta de entrega

- Estado actual: `VALIDATED`.
- Aceptación: expresa, registrada el 2026-08-31 tras presentar la separación efectiva, la cobertura exclusiva de `src/`, ambas suites y la puerta completa correcta.
- Commit, push, merge, despliegue y publicación requieren autorización independiente.
