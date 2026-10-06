# Plan técnico — <ID> <Nombre>

**Estado documental:** DRAFT

**Versión:** 0.1.0

**Fecha:** <AAAA-MM-DD>

**Aprobado por:** Pendiente

**Fecha de aprobación:** Pendiente

**Evidencia de aprobación:** Pendiente

**Clasificación:** FULL

## Especificación y alcance autorizado

- Especificación: `<ruta y versión aprobada>`
- Criterios cubiertos: <AC-...>
- Fuera de alcance: <límites técnicos y funcionales>

## Decisiones y diseño

- ADR aplicables: <identificadores aprobados>
- Componentes propios: cargar `@sdd-react-ts-feature-pattern` y declarar modo (`strict` para componentes nuevos o con cambios de comportamiento observable, según `AGENTS.md`).
- Responsabilidades y flujo de datos: <diseño mínimo necesario>
- Alternativas descartadas: <solo si afectan a la decisión>

## Cambios previstos

| Archivo o área | Cambio | Requisito relacionado |
| --- | --- | --- |
| `<ruta>` | <cambio> | <AC-...> |

## Trazabilidad prevista

| Requisito o criterio | Implementación prevista | Prueba o validación prevista |
| --- | --- | --- |
| `<REQ/AC>` | `<ruta o área>` | `<prueba o comprobación>` |

## Dependencias e instalaciones

- <Paquete e instalación exacta, o “Ninguna”.>

## Estrategia de pruebas

- Unitarias: <alcance y herramienta>.
- Componentes/hooks: <comportamiento observable>, incluida la aserción `expectNoAccessibilityViolations` por página o componente con interfaz.
- HTTP/MSW: <contratos y escenarios, si aplica>.
- Manuales: <comprobaciones, si aplica>.

## Tareas

1. <Tarea pequeña, verificable y trazable.>

## Riesgos, reversión y validación

- Riesgos: <riesgo técnico>.
- Reversión: <cómo deshacer el cambio de forma segura>.
- Comandos de validación: <comandos concretos>.
- Evidencias necesarias para pasar a `VALIDATED`: <lista>.

## Puerta documental

La aprobación de esta versión limita el alcance implementable a los cambios enumerados. La implementación requiere autorización expresa y se registra en un `validation-report.md` separado. No autoriza commit ni publicación.
